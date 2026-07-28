import type { Supplier, Purchase } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const purchaseService = {
  async fetchPurchasesData(): Promise<{ suppliers: Supplier[]; purchases: Purchase[] }> {
    if (!isSupabaseConfigured) return { suppliers: [], purchases: [] };

    const [{ data: suppliers }, { data: purchases }, { data: purchaseItems }] = await Promise.all([
      supabase.from('suppliers').select('*'),
      supabase.from('purchases').select('*'),
      supabase.from('purchase_items').select('*'),
    ]);

    const mappedSuppliers: Supplier[] = (suppliers || []).map((s) => ({
      id: s.id,
      name: s.name,
      contact: s.contact || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      taxId: s.tax_id || '',
      balance: Number(s.balance) || 0,
      createdAt: s.created_at,
    }));

    const mappedPurchases: Purchase[] = (purchases || []).map((p) => ({
      id: p.id,
      reference: p.reference,
      supplierId: p.supplier_id || '',
      supplierName: p.supplier_name || '',
      invoiceNumber: p.invoice_number || '',
      total: Number(p.total) || 0,
      status: p.status,
      createdAt: p.created_at,
      items: (purchaseItems || [])
        .filter((pi) => pi.purchase_id === p.id)
        .map((pi) => ({
          productId: pi.product_id,
          productName: pi.product_name,
          quantity: Number(pi.quantity),
          cost: Number(pi.cost),
          subtotal: Number(pi.subtotal),
        })),
    }));

    return { suppliers: mappedSuppliers, purchases: mappedPurchases };
  },

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

  async deleteSupplier(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('suppliers').delete().eq('id', id);
  },

  async insertPurchase(p: Purchase): Promise<void> {
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

  async receivePurchase(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('purchases').update({ status: 'recibida' }).eq('id', id);
  },
};
