import { useCallback } from 'react';
import type { AppDatabase, Sale } from '../models/types';
import { generateId, generateReference } from '../lib/utils';
import { salesService } from '../services/salesService';

export function useSalesController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  addLog: (action: string, detail: string) => void
) {
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
        const products = prev.products.map((prod) => {
          const item = sale.items.find((i) => i.productId === prod.id);
          return item ? { ...prod, stock: Math.max(0, prod.stock - item.quantity) } : prod;
        });
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
        let customers = prev.customers;
        if (sale.paymentMethod === 'credito' && sale.customerId) {
          customers = prev.customers.map((c) =>
            c.id === sale.customerId ? { ...c, balance: (c.balance || 0) + sale.total } : c
          );
        }
        return { ...prev, sales: [sale, ...prev.sales], products, cashSessions, customers };
      });

      addLog('Venta Registrada', `Venta ${ref} por $${sale.total} (${sale.paymentMethod.toUpperCase()}) - Cliente: ${sale.customerName}`);

      const customer = sale.customerId ? db.customers.find((c) => c.id === sale.customerId) : undefined;
      salesService.insertSale(sale, db.products, customer).catch(console.error);

      return sale;
    },
    [db.sales.length, db.products, db.customers, setDb, addLog]
  );

  const voidSale = useCallback(
    (id: string) => {
      let voidedRef = '';
      setDb((prev) => {
        const sale = prev.sales.find((s) => s.id === id);
        if (!sale || sale.status === 'anulada') return prev;
        voidedRef = sale.reference;
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
      salesService.voidSale(id).catch(console.error);
    },
    [setDb, addLog]
  );

  return {
    addSale,
    voidSale,
  };
}
