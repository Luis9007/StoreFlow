/**
 * @file CustomerController.ts
 * @description Controlador Hook de React para la administración de clientes y recepción de abonos a cartera.
 * 
 * RELACIÓN CON SERVICIOS (`src/services/customerService.ts` y `src/services/cashService.ts`):
 * - Modifica el estado global de React (`setDb`) actualizando la lista de clientes, saldos de cartera e ingresos a caja.
 * - Delega la persistencia en el backend invocando:
 *    • `CustomerController.upsertCustomer()` ➔ llama a `customerService.upsertCustomer(c)`
 *    • `CustomerController.deleteCustomer()` ➔ llama a `customerService.deleteCustomer(id)`
 *    • `CustomerController.addCustomerPayment()` ➔ llama a `customerService.updateBalance(customerId, newBalance)`
 *      y si el pago es en efectivo, llama a `cashService.insertMovement(...)`.
 */

import { useCallback } from 'react';
import type { AppDatabase, User, Customer, PaymentMethod, CashSession, CashMovementType } from '../models/types';
import { generateId } from '../lib/utils';
import { customerService } from '../services/customerService';
import { cashService } from '../services/cashService';

type LogMovementFn = (
  type: CashMovementType,
  amount: number,
  concept: string,
  reference?: string,
  details?: Record<string, any>
) => void;

/**
 * Custom Hook que maneja las operaciones y lógica de crédito/cartera de clientes.
 */
export function useCustomerController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  currentUser: User | null,
  activeCashSession: CashSession | null,
  logSessionMovement: LogMovementFn,
  addLog: (action: string, detail: string) => void
) {
  /**
   * Crea o actualiza la información de un cliente.
   * 1. Actualiza el arreglo de clientes en el estado de React (`setDb`).
   * 2. Si es un nuevo cliente, registra el movimiento de sesión (`logSessionMovement`).
   * 3. Escribe en la bitácora (`addLog`).
   * 4. Llama a la API via `customerService.upsertCustomer(c)`.
   */
  const upsertCustomer = useCallback(
    (c: Customer) => {
      let isNew = false;
      setDb((prev) => {
        const exists = prev.customers.some((x) => x.id === c.id);
        isNew = !exists;
        const customers = exists ? prev.customers.map((x) => (x.id === c.id ? c : x)) : [...prev.customers, c];
        return { ...prev, customers };
      });

      if (isNew) {
        logSessionMovement('cliente', 0, `Nuevo cliente registrado: ${c.name}`, c.id, {
          name: c.name,
          document: c.document,
          phone: c.phone,
          email: c.email,
          address: c.address,
        });
      }

      addLog('Clientes', `Cliente "${c.name}" (Doc: ${c.document || 'Sin doc'}) ${isNew ? 'registrado' : 'actualizado'}`);
      customerService.upsertCustomer(c).catch(console.error);
    },
    [setDb, logSessionMovement, addLog]
  );

  /**
   * Elimina un cliente por su ID.
   * 1. Remueve el cliente del estado local (`setDb`).
   * 2. Registra la acción en la bitácora (`addLog`).
   * 3. Envía la petición DELETE al backend mediante `customerService.deleteCustomer(id)`.
   */
  const deleteCustomer = useCallback(
    (id: string) => {
      setDb((prev) => ({ ...prev, customers: prev.customers.filter((c) => c.id !== id) }));
      addLog('Clientes', `Cliente ID ${id} eliminado`);
      customerService.deleteCustomer(id).catch(console.error);
    },
    [setDb, addLog]
  );

  /**
   * Registra un abono o pago a la deuda de cartera de un cliente.
   * 1. Descuenta el monto abonado de la deuda del cliente (`customer.balance - amount`).
   * 2. Si el pago es en efectivo, genera un movimiento de tipo 'ingreso' en la caja abierta activa.
   * 3. Escribe la operación en la bitácora de auditoría (`addLog`).
   * 4. Actualiza el saldo en Supabase llamando a `customerService.updateBalance(customerId, newBalance)`.
   * 5. Si fue en efectivo, guarda el movimiento en Supabase llamando a `cashService.insertMovement(...)`.
   */
  const addCustomerPayment = useCallback(
    (customerId: string, amount: number, paymentMethod: PaymentMethod = 'efectivo', notes?: string) => {
      const customer = db.customers.find((c) => c.id === customerId);
      if (!customer) return;

      const newBalance = Math.max(0, customer.balance - amount);
      const movId = generateId('mov');
      const nowIso = new Date().toISOString();

      setDb((prev) => {
        const customers = prev.customers.map((c) =>
          c.id === customerId ? { ...c, balance: newBalance } : c
        );
        let cashSessions = prev.cashSessions;
        if (paymentMethod === 'efectivo') {
          cashSessions = prev.cashSessions.map((cs) =>
            cs.status === 'abierta'
              ? {
                  ...cs,
                  movements: [
                    ...(cs.movements || []),
                    {
                      id: movId,
                      type: 'ingreso',
                      amount: amount,
                      concept: `Abono de cartera: ${customer.name}${notes ? ` (${notes})` : ''}`,
                      reference: customer.id,
                      userId: currentUser?.id ?? '',
                      userName: currentUser?.name ?? 'Sistema',
                      createdAt: nowIso,
                    },
                  ],
                }
              : cs
          );
        }
        return { ...prev, customers, cashSessions };
      });

      addLog('Abono a Cartera', `Abono de $${amount} registrado para el cliente "${customer.name}" (${paymentMethod.toUpperCase()})`);
      
      // Persistencia en Supabase
      customerService.updateBalance(customerId, newBalance).catch(console.error);
      if (paymentMethod === 'efectivo' && activeCashSession) {
        cashService
          .insertMovement(
            {
              id: movId,
              type: 'ingreso',
              amount: amount,
              concept: `Abono de cartera: ${customer.name}${notes ? ` (${notes})` : ''}`,
              reference: customer.id,
              userId: currentUser?.id ?? '',
              userName: currentUser?.name ?? 'Sistema',
              createdAt: nowIso,
            },
            activeCashSession.id
          )
          .catch(console.error);
      }
    },
    [db.customers, currentUser, activeCashSession, setDb, addLog]
  );

  return {
    upsertCustomer,
    deleteCustomer,
    addCustomerPayment,
  };
}
