/**
 * @file ProductController.ts
 * @description Controlador Hook de React para la gestión de productos, categorías y ajustes de inventario.
 * 
 * RELACIÓN CON EL SERVICIO (`src/services/productService.ts`):
 * - Este controlador maneja la actualización del estado local de React (`setDb`), auditoría de bitácora (`addLog`)
 *   y registros de movimientos de sesión (`logSessionMovement`).
 * - Delega la persistencia asíncrona en la base de datos remota invocando los métodos del servicio `productService`:
 *    • `upsertCategory` ➔ `productService.upsertCategory(c)`
 *    • `upsertProduct` ➔ `productService.upsertProduct(p)`
 *    • `deleteProduct` ➔ `productService.deleteProduct(id)`
 *    • `adjustStock` ➔ `productService.updateStock(productId, newStock)` e `productService.insertAdjustment(...)`
 */

import { useCallback } from 'react';
import type { AppDatabase, User, Product, Category, Brand, InventoryAdjustment, CashMovementType } from '../models/types';
import { generateId } from '../lib/utils';
import { productService } from '../services/productService';

// Firma de función para registrar movimientos financieros o de inventario en la sesión de caja activa
type LogMovementFn = (
  type: CashMovementType,
  amount: number,
  concept: string,
  reference?: string,
  details?: Record<string, any>
) => void;

/**
 * Custom Hook que encapsula toda la lógica de negocio y modificaciones sobre productos e inventario.
 */
export function useProductController(
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  currentUser: User | null,
  logSessionMovement: LogMovementFn,
  addLog: (action: string, detail: string) => void
) {
  /**
   * Agrega o actualiza una categoría.
   */
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

  /**
   * Agrega o actualiza una marca.
   */
  const upsertBrand = useCallback(
    (b: Brand) => {
      let isNew = false;
      setDb((prev) => {
        const exists = prev.brands.some((x) => x.id === b.id);
        isNew = !exists;
        const brands = exists ? prev.brands.map((x) => (x.id === b.id ? b : x)) : [...prev.brands, b];
        return { ...prev, brands };
      });

      addLog('Marcas', `Marca "${b.name}" ${isNew ? 'registrada' : 'actualizada'}`);
      productService.upsertBrand(b).catch(console.error);
    },
    [setDb, addLog]
  );

  /**
   * Agrega o actualiza un producto en el catálogo.
   * 1. Actualiza el estado de productos en React (`setDb`).
   * 2. Si es un producto nuevo, genera un movimiento de sesión de caja (`logSessionMovement`).
   * 3. Agrega entrada a la bitácora (`addLog`).
   * 4. Llama a la API REST via `productService.upsertProduct(p)`.
   */
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

  /**
   * Elimina un producto por su ID.
   * 1. Filtra y remueve el producto del estado local `setDb`.
   * 2. Registra la eliminación en la bitácora (`addLog`).
   * 3. Envía la solicitud DELETE a la API REST via `productService.deleteProduct(id)`.
   */
  const deleteProduct = useCallback(
    (id: string) => {
      setDb((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
      addLog('Catálogo de Productos', `Producto ID ${id} eliminado`);
      productService.deleteProduct(id).catch(console.error);
    },
    [setDb, addLog]
  );

  /**
   * Ajusta manualmente el stock de un producto (entrada, salida o ajuste directo).
   * 1. Modifica la cantidad de stock en el producto y crea un nuevo objeto `InventoryAdjustment`.
   * 2. Registra el movimiento en la caja activa y en la bitácora general.
   * 3. Llama a dos métodos de `productService`:
   *    - `productService.updateStock(productId, newStock)` (petición PATCH HTTP)
   *    - `productService.insertAdjustment(...)` (petición POST HTTP)
   */
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

      // Persistencia en Supabase a través del servicio productService
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
    [currentUser, setDb, logSessionMovement, addLog]
  );

  return {
    upsertCategory,
    upsertBrand,
    upsertProduct,
    deleteProduct,
    adjustStock,
  };
}
