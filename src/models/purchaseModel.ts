/**
 * @file purchaseModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Proveedores y Compras.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`suppliers`, `purchases`, `purchase_items`).
 * - Es invocado ÚNICAMENTE por `purchaseService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Supplier, Purchase } from './types';

export const purchaseModel = {
  /**
   * Obtiene todos los proveedores, compras e ítems de compra.
   */
  async findAllPurchasesData(): Promise<{ suppliers: any[]; purchases: any[]; purchaseItems: any[] }> {
    if (!isSupabaseConfigured) return { suppliers: [], purchases: [], purchaseItems: [] };

    const [{ data: suppliers }, { data: purchases }, { data: purchaseItems }] = await Promise.all([
      supabase.from('suppliers').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('purchase_items').select('*'),
    ]);

    return {
      suppliers: suppliers || [],
      purchases: purchases || [],
      purchaseItems: purchaseItems || [],
    };
  },

  /**
   * Inserta o actualiza un proveedor.
   */
  async upsertSupplier(s: Supplier): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('suppliers').upsert({
      id: s.id,
      name: s.name,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      address: s.address,
      tax_id: s.taxId,
      balance: s.balance,
    });
  },

  /**
   * Elimina un proveedor por su ID.
   */
  async deleteSupplier(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('suppliers').delete().eq('id', id);
  },

  /**
   * Inserta una compra y sus ítems detallados.
   */
  async insertPurchaseWithItems(p: Purchase): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('purchases').insert({
      id: p.id,
      reference: p.reference,
      supplier_id: p.supplierId || null,
      supplier_name: p.supplierName,
      invoice_number: p.invoiceNumber,
      total: p.total,
      status: p.status,
    });

    const items = p.items.map((item) => ({
      purchase_id: p.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      cost: item.cost,
      subtotal: item.subtotal,
    }));
    await supabase.from('purchase_items').insert(items);
  },

  /**
   * Actualiza el estado de una compra a 'recibida'.
   */
  async updatePurchaseStatus(id: string, status: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('purchases').update({ status }).eq('id', id);
  },
};
