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

export function useCustomerController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  currentUser: User | null,
  activeCashSession: CashSession | null,
  logSessionMovement: LogMovementFn,
  addLog: (action: string, detail: string) => void
) {
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

  const deleteCustomer = useCallback(
    (id: string) => {
      setDb((prev) => ({ ...prev, customers: prev.customers.filter((c) => c.id !== id) }));
      addLog('Clientes', `Cliente ID ${id} eliminado`);
      customerService.deleteCustomer(id).catch(console.error);
    },
    [setDb, addLog]
  );

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
