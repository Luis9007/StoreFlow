/**
 * @file PurchaseController.ts
 * @description Controlador Hook de React para administrar la relación con proveedores y órdenes de compra de mercancía.
 * 
 * RELACIÓN CON EL SERVICIO (`src/services/purchaseService.ts`):
 * - Modifica el estado global en memoria (`setDb`) actualizando la lista de proveedores, compras y stock de productos recibidos.
 * - Sincroniza las operaciones con Supabase vía `purchaseService`:
 *    • `PurchaseController.upsertSupplier()` ➔ llama a `purchaseService.upsertSupplier(s)`
 *    • `PurchaseController.deleteSupplier()` ➔ llama a `purchaseService.deleteSupplier(id)`
 *    • `PurchaseController.addPurchase()` ➔ llama a `purchaseService.insertPurchase(purchase)`
 *    • `PurchaseController.receivePurchase()` ➔ llama a `purchaseService.receivePurchase(id)`
 */

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

/**
 * Custom Hook que encapsula la lógica de proveedores y compras de inventario.
 */
export function usePurchaseController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  logSessionMovement: LogMovementFn,
  addLog: (action: string, detail: string) => void
) {
  /**
   * Crea o actualiza un proveedor.
   * 1. Modifica la lista de proveedores en el estado local (`setDb`).
   * 2. Registra la acción en la bitácora (`addLog`).
   * 3. Persiste en el backend llamando a `purchaseService.upsertSupplier(s)`.
   */
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

  /**
   * Elimina un proveedor por su ID.
   * 1. Elimina del estado en React.
   * 2. Agrega la entrada a la bitácora.
   * 3. Solicita el borrado vía HTTP a `purchaseService.deleteSupplier(id)`.
   */
  const deleteSupplier = useCallback(
    (id: string) => {
      setDb((prev) => ({ ...prev, suppliers: prev.suppliers.filter((s) => s.id !== id) }));
      addLog('Proveedores', `Proveedor ID ${id} eliminado`);
      purchaseService.deleteSupplier(id).catch(console.error);
    },
    [setDb, addLog]
  );

  /**
   * Registra una nueva orden de compra a un proveedor.
   * 1. Genera un ID único y la referencia (ej. "C-000001").
   * 2. Agrega la compra al estado de React (`setDb`).
   * 3. Registra el movimiento de sesión de caja (`logSessionMovement`).
   * 4. Guarda la orden y sus detalles en el backend vía `purchaseService.insertPurchase(purchase)`.
   */
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

  /**
   * Procesa la recepción física de mercancía de una orden de compra previamente creada.
   * 1. Cambia el estado de la compra a 'recibida'.
   * 2. Suma las cantidades compradas al stock actual de cada producto en el catálogo.
   * 3. Registra la recepción en la bitácora (`addLog`).
   * 4. Actualiza el estado en Supabase vía `purchaseService.receivePurchase(id)`.
   */
  const receivePurchase = useCallback(
    (id: string) => {
      let purchRef = '';
      setDb((prev) => {
        const purchase = prev.purchases.find((p) => p.id === id);
        if (!purchase || purchase.status === 'recibida') return prev;
        purchRef = purchase.reference;

        // Incrementa el stock de cada producto involucrado en la compra recibida
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
