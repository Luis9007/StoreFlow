import { useCallback } from 'react';
import type { AppDatabase, Supplier, Purchase, CashMovementType } from '../models/types';
import { generateId, generateReference } from '../lib/utils';
import { purchaseService } from '../services/purchaseService';

type LogMovementFn = (
  type: CashMovementType,
  amount: number,
  concept: string,
  reference?: string,
  details?: Record<string, any>
) => void;

export function usePurchaseController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  logSessionMovement: LogMovementFn,
  addLog: (action: string, detail: string) => void
) {
  const upsertSupplier = useCallback(
    (s: Supplier) => {
      let isNew = false;
      setDb((prev) => {
        const exists = prev.suppliers.some((x) => x.id === s.id);
        isNew = !exists;
        const suppliers = exists ? prev.suppliers.map((x) => (x.id === s.id ? s : x)) : [...prev.suppliers, s];
        return { ...prev, suppliers };
      });

      addLog('Proveedores', `Proveedor "${s.name}" ${isNew ? 'registrado' : 'actualizado'}`);
      purchaseService.upsertSupplier(s).catch(console.error);
    },
    [setDb, addLog]
  );

  const deleteSupplier = useCallback(
    (id: string) => {
      setDb((prev) => ({ ...prev, suppliers: prev.suppliers.filter((s) => s.id !== id) }));
      addLog('Proveedores', `Proveedor ID ${id} eliminado`);
      purchaseService.deleteSupplier(id).catch(console.error);
    },
    [setDb, addLog]
  );

  const addPurchase = useCallback(
    (p: Omit<Purchase, 'id' | 'reference' | 'createdAt'>) => {
      const purchaseId = generateId('pur');
      const seq = db.purchases.length + 1;
      const ref = generateReference('C', seq);

      const purchase: Purchase = {
        ...p,
        id: purchaseId,
        reference: ref,
        createdAt: new Date().toISOString(),
      };

      setDb((prev) => ({ ...prev, purchases: [purchase, ...prev.purchases] }));

      logSessionMovement('compra', 0, `Compra a proveedor ${purchase.supplierName} (${purchase.reference})`, purchase.reference, {
        reference: purchase.reference,
        supplierName: purchase.supplierName,
        invoiceNumber: purchase.invoiceNumber,
        total: purchase.total,
        items: purchase.items,
      });

      addLog('Orden de Compra', `Compra ${ref} por $${purchase.total} al proveedor "${purchase.supplierName}" (${purchase.items.length} ítems)`);
      purchaseService.insertPurchase(purchase).catch(console.error);
    },
    [db.purchases.length, setDb, logSessionMovement, addLog]
  );

  const receivePurchase = useCallback(
    (id: string) => {
      let purchRef = '';
      setDb((prev) => {
        const purchase = prev.purchases.find((p) => p.id === id);
        if (!purchase || purchase.status === 'recibida') return prev;
        purchRef = purchase.reference;
        const products = prev.products.map((prod) => {
          const item = purchase.items.find((i) => i.productId === prod.id);
          return item ? { ...prod, stock: prod.stock + item.quantity } : prod;
        });
        const purchases = prev.purchases.map((p) => (p.id === id ? { ...p, status: 'recibida' as const } : p));
        return { ...prev, purchases, products };
      });

      if (purchRef) {
        addLog('Recepción de Compra', `Mercancía recibida e ingresada al inventario para la orden ${purchRef}`);
      }
      purchaseService.receivePurchase(id).catch(console.error);
    },
    [setDb, addLog]
  );

  return {
    upsertSupplier,
    deleteSupplier,
    addPurchase,
    receivePurchase,
  };
}
