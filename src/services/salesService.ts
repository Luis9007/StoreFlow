import type { Sale, Product, Customer } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const salesService = {
  async fetchSalesData(): Promise<Sale[]> {
    if (!isSupabaseConfigured) return [];
    const [{ data: sales }, { data: saleItems }] = await Promise.all([
      supabase.from('sales').select('*'),
      supabase.from('sale_items').select('*'),
    ]);

    return (sales || []).map((s) => ({
      id: s.id,
      reference: s.reference,
      customerId: s.customer_id,
      customerName: s.customer_name || 'Público general',
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      paymentMethod: s.payment_method,
      cashReceived: Number(s.cash_received),
      change: Number(s.change),
      userId: s.user_id,
      userName: s.user_name,
      status: s.status,
      createdAt: s.created_at,
      items: (saleItems || [])
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
    if (!isSupabaseConfigured) return;

    // 1. Insert Sale record
    await supabase.from('sales').insert({
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

    // 2. Insert Sale Items
    const items = sale.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      subtotal: item.subtotal,
    }));
    await supabase.from('sale_items').insert(items);

    // 3. Deduct Stock in Supabase
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const newStock = Math.max(0, prod.stock - item.quantity);
        await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
      }
    }

    // 4. Update Customer Balance if credit sale
    if (sale.paymentMethod === 'credito' && sale.customerId && customer) {
      await supabase
        .from('customers')
        .update({ balance: customer.balance + sale.total })
        .eq('id', sale.customerId);
    }
  },

  async voidSale(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('sales').update({ status: 'anulada' }).eq('id', id);
  },
};
