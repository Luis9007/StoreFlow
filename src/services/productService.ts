/**
 * @file productService.ts
 * @description Capa de Servicio / Lógica de Negocio para Productos, Categorías, Marcas y Ajustes de Inventario.
 * 
 * REGLA DE ARQUITECTURA:
 * - `productService` encapsula las reglas de transformación y gestión de inventario.
 * - Consume ÚNICAMENTE el modelo `productModel` (sin llamadas directas a Supabase/BD).
 * - Es invocado por `ProductController.ts` y `StoreController.tsx`.
 */

import type { Product, Category, Brand, InventoryAdjustment } from '../models/types';
import { productModel } from '../models/productModel';

export const productService = {
  /**
   * Consulta y transforma todas las categorías, marcas, productos y ajustes desde `productModel`.
   */
  async fetchProductsData(): Promise<{
    products: Product[];
    categories: Category[];
    brands: Brand[];
    adjustments: InventoryAdjustment[];
  }> {
    const rawData = await productModel.findAllData();

    const mappedCategories: Category[] = rawData.categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
    }));

    const mappedBrands: Brand[] = rawData.brands.map((b) => ({
      id: b.id,
      name: b.name,
    }));

    const mappedProducts: Product[] = rawData.products.map((p) => ({
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

    const mappedAdjustments: InventoryAdjustment[] = rawData.adjustments.map((a) => ({
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
   * Registra o actualiza una categoría vía productModel.
   */
  async upsertCategory(cat: Category): Promise<void> {
    await productModel.upsertCategory(cat);
  },

  /**
   * Registra o actualiza un producto vía productModel.
   */
  async upsertProduct(p: Product): Promise<void> {
    await productModel.upsertProduct(p);
  },

  /**
   * Elimina un producto vía productModel.
   */
  async deleteProduct(id: string): Promise<void> {
    await productModel.deleteProduct(id);
  },

  /**
   * Actualiza el stock de un producto vía productModel.
   */
  async updateStock(productId: string, newStock: number): Promise<void> {
    await productModel.updateStock(productId, newStock);
  },

  /**
   * Inserta un nuevo ajuste de inventario vía productModel.
   */
  async insertAdjustment(adj: InventoryAdjustment): Promise<void> {
    await productModel.insertAdjustment(adj);
  },
};
