import { useCallback } from 'react';
import type { AppDatabase, User, Product, Category, InventoryAdjustment, CashMovementType } from '../models/types';
import { generateId } from '../lib/utils';
import { productService } from '../services/productService';

type LogMovementFn = (
  type: CashMovementType,
  amount: number,
  concept: string,
  reference?: string,
  details?: Record<string, any>
) => void;

export function useProductController(
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  currentUser: User | null,
  logSessionMovement: LogMovementFn,
  addLog: (action: string, detail: string) => void
) {
  const upsertCategory = useCallback(
    (c: Category) => {
      let isNew = false;
      setDb((prev) => {
        const exists = prev.categories.some((x) => x.id === c.id);
        isNew = !exists;
        const categories = exists ? prev.categories.map((x) => (x.id === c.id ? c : x)) : [...prev.categories, c];
        return { ...prev, categories };
      });

      addLog('Categorías', `Categoría "${c.name}" ${isNew ? 'registrada' : 'actualizada'}`);
      productService.upsertCategory(c).catch(console.error);
    },
    [setDb, addLog]
  );
  const upsertProduct = useCallback(
    (p: Product) => {
      let isNew = false;
      setDb((prev) => {
        const exists = prev.products.some((x) => x.id === p.id);
        isNew = !exists;
        const products = exists ? prev.products.map((x) => (x.id === p.id ? p : x)) : [...prev.products, p];
        return { ...prev, products };
      });

      if (isNew) {
        logSessionMovement('producto', 0, `Nuevo producto registrado: ${p.name}`, p.id, {
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          price: p.price,
          stock: p.stock,
        });
      }

      addLog('Catálogo de Productos', `Producto "${p.name}" (SKU: ${p.sku || 'S/N'}) ${isNew ? 'registrado' : 'actualizado'}`);
      productService.upsertProduct(p).catch(console.error);
    },
    [setDb, logSessionMovement, addLog]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      setDb((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
      addLog('Catálogo de Productos', `Producto ID ${id} eliminado`);
      productService.deleteProduct(id).catch(console.error);
    },
    [setDb, addLog]
  );

  const adjustStock = useCallback(
    (productId: string, newStock: number, reason: string, type: 'entrada' | 'salida' | 'ajuste') => {
      const nowIso = new Date().toISOString();
      const adjId = generateId('adj');
      let prodName = '';
      let prevStock = 0;

      setDb((prev) => {
        const prod = prev.products.find((p) => p.id === productId);
        if (!prod) return prev;
        prodName = prod.name;
        prevStock = prod.stock;

        const products = prev.products.map((p) => (p.id === productId ? { ...p, stock: newStock } : p));
        const adjustment: InventoryAdjustment = {
          id: adjId,
          productId,
          productName: prod.name,
          previousStock: prod.stock,
          newStock,
          reason,
          type,
          userId: currentUser?.id ?? 'system',
          userName: currentUser?.name ?? 'Sistema',
          createdAt: nowIso,
        };

        return { ...prev, products, adjustments: [adjustment, ...prev.adjustments] };
      });

      logSessionMovement('inventario', 0, `Ajuste de inventario: ${prodName} (${type.toUpperCase()})`, productId, {
        productName: prodName,
        type,
        previousStock: prevStock,
        newStock,
        reason,
      });

      addLog('Ajuste de Inventario', `Ajuste (${type.toUpperCase()}) en "${prodName}": stock previo ${prevStock} -> nuevo stock ${newStock}. Motivo: ${reason}`);

      productService.updateStock(productId, newStock).catch(console.error);
      productService
        .insertAdjustment({
          id: adjId,
          productId,
          productName: prodName,
          previousStock: prevStock,
          newStock,
          reason,
          type,
          userId: currentUser?.id ?? 'system',
          userName: currentUser?.name ?? 'Sistema',
          createdAt: nowIso,
        })
        .catch(console.error);
    },
    [currentUser, setDb, logSessionMovement]
  );

  return {
    upsertCategory,
    upsertProduct,
    deleteProduct,
    adjustStock,
  };
}
