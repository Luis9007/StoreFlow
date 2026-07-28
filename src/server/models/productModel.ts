/**
 * @file productModel.ts (Server Backend)
 * @description Capa de Modelo / Acceso directo a la base de datos para Productos, Categorías, Marcas y Ajustes.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Esta es la ÚNICA capa responsable del acceso a la base de datos para el catálogo.
 * - Es invocada ÚNICAMENTE por `productService.ts`.
 */

import { supabase, isSupabaseConfigured } from '../../models/supabase';
import type { Product, Category, InventoryAdjustment } from '../../models/types';

export const productModel = {
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

  async upsertCategory(cat: Category): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
    });
  },

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

  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').delete().eq('id', id);
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
  },

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
