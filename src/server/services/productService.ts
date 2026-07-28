/**
 * @file productService.ts (Server Backend)
 * @description Capa de Servicio / Lógica de Negocio para Productos, Categorías e Inventario.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Procesa cálculos de stock, validaciones de catálogo e inventario.
 * - Consume ÚNICAMENTE `productModel`.
 */

import type { Product, Category, Brand, InventoryAdjustment } from '../../models/types';
import { productModel } from '../models/productModel';

export const productService = {
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

  async upsertCategory(cat: Category): Promise<void> {
    if (!cat.name) throw new Error('El nombre de la categoría es obligatorio');
    await productModel.upsertCategory(cat);
  },

  async upsertProduct(p: Product): Promise<void> {
    if (!p.name || p.price < 0) throw new Error('Nombre de producto válido y precio >= 0 son obligatorios');
    await productModel.upsertProduct(p);
  },

  async deleteProduct(id: string): Promise<void> {
    await productModel.deleteProduct(id);
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    if (newStock < 0) throw new Error('El stock no puede ser negativo');
    await productModel.updateStock(productId, newStock);
  },

  async insertAdjustment(adj: InventoryAdjustment): Promise<void> {
    await productModel.insertAdjustment(adj);
  },
};
