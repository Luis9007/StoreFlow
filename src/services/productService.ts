import type { Product, Category, Brand, InventoryAdjustment } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const productService = {
  async fetchProductsData(): Promise<{
    products: Product[];
    categories: Category[];
    brands: Brand[];
    adjustments: InventoryAdjustment[];
  }> {
    if (!isSupabaseConfigured) return { products: [], categories: [], brands: [], adjustments: [] };

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

    const mappedCategories: Category[] = (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
    }));

    const mappedBrands: Brand[] = (brands || []).map((b) => ({
      id: b.id,
      name: b.name,
    }));

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
