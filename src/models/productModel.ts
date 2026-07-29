/**
 * @file productModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Productos, Categorías, Marcas y Ajustes.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`categories`, `brands`, `products`, `inventory_adjustments`).
 * - Es invocado ÚNICAMENTE por `productService.ts` y `syncService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Product, Category, Brand, InventoryAdjustment } from './types';

export const productModel = {
  /**
   * Consulta las tablas relacionales de productos, categorías, marcas y ajustes.
   */
  async findAllData(): Promise<{
    categories: any[];
    brands: any[];
    products: any[];
    adjustments: any[];
  }> {
    if (!isSupabaseConfigured) {
      return { categories: [], brands: [], products: [], adjustments: [] };
    }

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

    return {
      categories: categories || [],
      brands: brands || [],
      products: products || [],
      adjustments: adjustments || [],
    };
  },

  /**
   * Registra o actualiza una categoría en la BD.
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
   * Registra o actualiza una marca en la BD.
   */
  async upsertBrand(b: Brand): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('brands').upsert({
      id: b.id,
      name: b.name,
    });
  },

  /**
   * Registra o actualiza un producto en la BD.
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
   * Upsert generico desde payload offline
   */
  async upsertRawProduct(payload: any): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').upsert({
      id: payload.id,
      sku: payload.sku,
      barcode: payload.barcode,
      name: payload.name,
      description: payload.description,
      category_id: payload.categoryId || null,
      brand_id: payload.brandId || null,
      cost: payload.cost,
      price: payload.price,
      stock: payload.stock,
      min_stock: payload.minStock,
      unit: payload.unit,
      active: payload.active,
      favorite: payload.favorite,
    });
  },

  /**
   * Elimina un producto de la BD por su ID.
   */
  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').delete().eq('id', id);
  },

  /**
   * Actualiza el stock de un producto mediante un campo PATCH.
   */
  async updateStock(productId: string, newStock: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
  },

  /**
   * Registra un movimiento de ajuste de inventario en la BD.
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

  /**
   * Upsert generico de ajuste de inventario
   */
  async upsertRawAdjustment(payload: any): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('inventory_adjustments').upsert({
      id: payload.id,
      product_id: payload.productId,
      previous_stock: payload.previousStock,
      new_stock: payload.newStock,
      reason: payload.reason,
      type: payload.type,
      user_id: payload.userId || null,
      user_name: payload.userName || 'Sistema',
      created_at: payload.createdAt,
    });
  },
};
