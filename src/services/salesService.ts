import type { Sale, Product, Customer } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';
import { syncService } from './syncService';

export const salesService = {
  async fetchSalesData(): Promise<Sale[]> {
    if (!isSupabaseConfigured) return [];

    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesErr || !salesData) return [];

    const { data: itemsData } = await supabase.from('sale_items').select('*');

    return salesData.map((s) => ({
      id: s.id,
      reference: s.reference,
      customerId: s.customer_id,
      customerName: s.customer_name,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      paymentMethod: s.payment_method,
      cashReceived: Number(s.cash_received),
      change: Number(s.change),
      status: s.status,
      userId: s.user_id,
      userName: s.user_name,
      createdAt: s.created_at,
      items: (itemsData || [])
        .filter((si) => si.sale_id === s.id)
        .map((si) => ({
          productId: si.product_id,
          productName: si.product_name,
          quantity: Number(si.quantity),
          price: Number(si.price),
          discount: Number(si.discount),
          subtotal: Number(si.subtotal),
        })),
    }));
  },

  async insertSale(sale: Sale, products: Product[], customer?: Customer): Promise<void> {
    if (!isSupabaseConfigured) {
      syncService.addToPendingQueue({ id: sale.id, type: 'sale', payload: sale });
      return;
    }

    try {
      const { error: saleErr } = await supabase.from('sales').insert({
        id: sale.id,
        reference: sale.reference,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
        payment_method: sale.paymentMethod,
        cash_received: sale.cashReceived,
        change: sale.change,
        user_id: sale.userId || null,
        user_name: sale.userName,
        status: sale.status,
      });
      if (saleErr) throw saleErr;

      const items = sale.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        subtotal: item.subtotal,
      }));
      const { error: itemsErr } = await supabase.from('sale_items').insert(items);
      if (itemsErr) throw itemsErr;

      for (const item of sale.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, prod.stock - item.quantity) })
            .eq('id', prod.id);
        }
      }

      if (sale.paymentMethod === 'credito' && customer) {
        await supabase
          .from('customers')
          .update({ balance: (customer.balance || 0) + sale.total })
          .eq('id', customer.id);
      }
    } catch (err) {
      console.warn('Supabase sale insert failed, enqueuing for offline sync:', err);
      syncService.addToPendingQueue({ id: sale.id, type: 'sale', payload: sale });
    }
  },

  async voidSale(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('sales').update({ status: 'anulada' }).eq('id', id);
    } catch (err) {
      console.error('Error voiding sale in Supabase:', err);
    }
  },
};
