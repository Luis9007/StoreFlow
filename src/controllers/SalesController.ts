/**
 * @file SalesController.ts
 * @description Controlador Hook de React para procesar ventas, calcular stock resultante y gestionar anulaciones.
 * 
 * RELACIÓN CON EL SERVICIO (`src/services/salesService.ts`):
 * - Este controlador actualiza el estado de React en memoria (`setDb`) registrando la venta, actualizando el stock,
 *   sumando movimientos de caja y registrando crédito al cliente si aplica.
 * - Delega la persistencia asíncrona a la API REST llamando a `salesService`:
 *    • `SalesController.addSale()` ➔ ejecuta `salesService.insertSale(sale, db.products, customer)`
 *    • `SalesController.voidSale()` ➔ ejecuta `salesService.voidSale(id)`
 */

import { useCallback } from 'react';
import type { AppDatabase, Sale } from '../models/types';
import { generateId, generateReference } from '../lib/utils';
import { salesService } from '../services/salesService';

/**
 * Custom Hook que encapsula la lógica de negocio para procesar ventas y anulaciones.
 */
export function useSalesController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  addLog: (action: string, detail: string) => void
) {
  /**
   * Procesa y registra una nueva venta generada desde el Punto de Venta (POSPage).
   * 1. Genera un ID único y la referencia secuencial (ej. "V-000001").
   * 2. Descuenta el stock de los productos comprados en la base de datos en memoria.
   * 3. Registra el ingreso en efectivo en la caja abierta actual (si el pago fue en efectivo).
   * 4. Aumenta el saldo a crédito en el cliente (si el pago fue a crédito).
   * 5. Agrega una entrada a la bitácora (`addLog`).
   * 6. Llama a `salesService.insertSale(...)` para guardar la venta en Supabase o en la cola offline.
   */
  const addSale = useCallback(
    (s: Omit<Sale, 'id' | 'reference' | 'createdAt' | 'status'>) => {
      const seq = db.sales.length + 1;
      const saleId = generateId('sale');
      const ref = generateReference('V', seq);
      const sale: Sale = {
        ...s,
        id: saleId,
        reference: ref,
        status: 'completada',
        createdAt: new Date().toISOString(),
      };

      setDb((prev) => {
        // Descuenta el stock correspondiente a cada ítem de la venta
        const products = prev.products.map((prod) => {
          const item = sale.items.find((i) => i.productId === prod.id);
          return item ? { ...prod, stock: Math.max(0, prod.stock - item.quantity) } : prod;
        });

        // Registra el movimiento en la sesión de caja abierta activa
        let cashSessions = prev.cashSessions;
        cashSessions = prev.cashSessions.map((cs) =>
          cs.status === 'abierta'
            ? {
                ...cs,
                movements: [
                  ...(cs.movements || []),
                  {
                    id: generateId('mov'),
                    type: 'venta',
                    amount: sale.paymentMethod === 'efectivo' ? sale.total : 0,
                    concept: `Venta ${sale.reference} (${sale.paymentMethod}) - Cliente: ${sale.customerName}`,
                    reference: sale.reference,
                    details: {
                      reference: sale.reference,
                      items: sale.items,
                      paymentMethod: sale.paymentMethod,
                      customerName: sale.customerName,
                      subtotal: sale.subtotal,
                      tax: sale.tax,
                      total: sale.total,
                      change: sale.change,
                    },
                    userId: sale.userId,
                    userName: sale.userName,
                    createdAt: sale.createdAt,
                  },
                ],
              }
            : cs
        );

        // Si la venta es a crédito, suma el total de la venta al saldo deudor del cliente
        let customers = prev.customers;
        if (sale.paymentMethod === 'credito' && sale.customerId) {
          customers = prev.customers.map((c) =>
            c.id === sale.customerId ? { ...c, balance: (c.balance || 0) + sale.total } : c
          );
        }

        return { ...prev, sales: [sale, ...prev.sales], products, cashSessions, customers };
      });

      addLog('Venta Registrada', `Venta ${ref} por $${sale.total} (${sale.paymentMethod.toUpperCase()}) - Cliente: ${sale.customerName}`);

      // Persistencia en la API via salesService
      const customer = sale.customerId ? db.customers.find((c) => c.id === sale.customerId) : undefined;
      salesService.insertSale(sale, db.products, customer).catch(console.error);

      return sale;
    },
    [db.sales.length, db.products, db.customers, setDb, addLog]
  );

  /**
   * Anula una venta previamente registrada por su ID.
   * 1. Cambia el estado de la venta a 'anulada'.
   * 2. Reestablece (devuelve) las cantidades al stock de los productos.
   * 3. Registra el evento en la bitácora (`addLog`).
   * 4. Envía la actualización PATCH al servidor vía `salesService.voidSale(id)`.
   */
  const voidSale = useCallback(
    (id: string) => {
      let voidedRef = '';
      setDb((prev) => {
        const sale = prev.sales.find((s) => s.id === id);
        if (!sale || sale.status === 'anulada') return prev;
        voidedRef = sale.reference;

        // Reintegra el stock de los ítems de la venta anulada
        const products = prev.products.map((prod) => {
          const item = sale.items.find((i) => i.productId === prod.id);
          return item ? { ...prod, stock: prod.stock + item.quantity } : prod;
        });

        const sales = prev.sales.map((s) => (s.id === id ? { ...s, status: 'anulada' as const } : s));
        return { ...prev, sales, products };
      });

      if (voidedRef) {
        addLog('Anulación de Venta', `Venta ${voidedRef} fue anulada`);
      }
      // Petición API REST via salesService
      salesService.voidSale(id).catch(console.error);
    },
    [setDb, addLog]
  );

  return {
    addSale,
    voidSale,
  };
}
