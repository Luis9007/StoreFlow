/**
 * @file productService.ts
 * @description Capa de Servicio / Acceso a Datos para Productos, Categorías, Marcas y Ajustes de Inventario.
 * 
 * RELACIÓN CON EL CONTROLADOR (`src/controllers/ProductController.ts`):
 * - `productService` ejecuta la comunicación directa HTTP REST con la API de Supabase (tablas `products`, `categories`, `brands`, `inventory_adjustments`).
 * - `ProductController.ts` invoca a este servicio en segundo plano cuando el usuario realiza acciones en la UI:
 *    • `ProductController.upsertCategory()` ➔ llama a `productService.upsertCategory()`
 *    • `ProductController.upsertProduct()` ➔ llama a `productService.upsertProduct()`
 *    • `ProductController.deleteProduct()` ➔ llama a `productService.deleteProduct()`
 *    • `ProductController.adjustStock()` ➔ llama a `productService.updateStock()` y `productService.insertAdjustment()`
 * - En la carga inicial de la app, `StoreController.tsx` llama a `productService.fetchProductsData()` para hidratar el estado global `db`.
 */

import type { Product, Category, Brand, InventoryAdjustment } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const productService = {
  /**
   * Consulta todas las categorías, marcas, productos y ajustes de inventario desde el backend via API REST (GET).
   * Mapea las columnas de PostgreSQL (snake_case) a las propiedades en TypeScript (camelCase).
   * 
   * Usado por: `StoreController.tsx` durante la carga/hidratación inicial.
   */
  async fetchProductsData(): Promise<{
    products: Product[];
    categories: Category[];
    brands: Brand[];
    adjustments: InventoryAdjustment[];
  }> {
    // Si Supabase no está configurado, retorna arreglos vacíos de forma segura
    if (!isSupabaseConfigured) return { products: [], categories: [], brands: [], adjustments: [] };

    // Ejecuta 4 peticiones GET en paralelo a la API REST de Supabase
    const [
      { data: categories },
      { data: brands },
      { data: products },
      { data: adjustments },
    ] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('brands').select('*'),
      supabase.from('products').select('*'),
      supabase.from('inventory_adjustments').select('*'),
    ]);

    // Mapeo de Categorías: traduce columnas SQL a la interfaz Category
    const mappedCategories: Category[] = (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
    }));

    // Mapeo de Marcas: traduce columnas SQL a la interfaz Brand
    const mappedBrands: Brand[] = (brands || []).map((b) => ({
      id: b.id,
      name: b.name,
    }));

    // Mapeo de Productos: convierte snake_case a camelCase, tipos numéricos y valores por defecto
    const mappedProducts: Product[] = (products || []).map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      description: p.description || '',
      categoryId: p.category_id || '',
      brandId: p.brand_id || '',
      cost: Number(p.cost) || 0,
      price: Number(p.price) || 0,
      stock: Number(p.stock) || 0,
      minStock: Number(p.min_stock) || 5,
      unit: p.unit || 'pza',
      active: p.active ?? true,
      favorite: p.favorite ?? false,
      createdAt: p.created_at,
    }));

    // Mapeo de Ajustes de Inventario: traduce el historial de ajustes de stock
    const mappedAdjustments: InventoryAdjustment[] = (adjustments || []).map((a) => ({
      id: a.id,
      productId: a.product_id,
      productName: a.product_name,
      previousStock: Number(a.previous_stock),
      newStock: Number(a.new_stock),
      reason: a.reason || '',
      type: a.type,
      userId: a.user_id,
      userName: a.user_name,
      createdAt: a.created_at,
    }));

    return {
      categories: mappedCategories,
      brands: mappedBrands,
      products: mappedProducts,
      adjustments: mappedAdjustments,
    };
  },

  /**
   * Registra o actualiza una categoría mediante petición HTTP POST/UPSERT a Supabase.
   * Invocado por: `ProductController.upsertCategory()`
   */
  async upsertCategory(cat: Category): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
    });
  },

  /**
   * Registra o actualiza un producto mediante petición HTTP POST/UPSERT a Supabase.
   * Traduce las propiedades camelCase del objeto Product a columnas snake_case de SQL.
   * Invocado por: `ProductController.upsertProduct()`
   */
  async upsertProduct(p: Product): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').upsert({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      description: p.description,
      category_id: p.categoryId || null,
      brand_id: p.brandId || null,
      cost: p.cost,
      price: p.price,
      stock: p.stock,
      min_stock: p.minStock,
      unit: p.unit,
      active: p.active,
      favorite: p.favorite,
    });
  },

  /**
   * Elimina un producto por su ID mediante petición HTTP DELETE a Supabase.
   * Invocado por: `ProductController.deleteProduct()`
   */
  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').delete().eq('id', id);
  },

  /**
   * Actualiza únicamente la columna `stock` de un producto mediante petición HTTP PATCH.
   * Invocado por: `ProductController.adjustStock()`
   */
  async updateStock(productId: string, newStock: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
  },

  /**
   * Inserta un nuevo registro de ajuste de inventario mediante petición HTTP POST a Supabase.
   * Invocado por: `ProductController.adjustStock()`
   */
  async insertAdjustment(adj: InventoryAdjustment): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('inventory_adjustments').insert({
      id: adj.id,
      product_id: adj.productId,
      product_name: adj.productName,
      previous_stock: adj.previousStock,
      new_stock: adj.newStock,
      reason: adj.reason,
      type: adj.type,
      user_id: adj.userId,
      user_name: adj.userName,
    });
  },
};
