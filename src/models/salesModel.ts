/**
 * @file salesModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Ventas y Detalles de Venta.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`sales`, `sale_items`).
 * - Es invocado ÚNICAMENTE por `salesService.ts` y `syncService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Sale } from './types';

export const salesModel = {
  /**
   * Obtiene todas las ventas y sus detalles desde la BD.
   */
  async findAllSalesWithItems(): Promise<{ sales: any[]; items: any[] }> {
    if (!isSupabaseConfigured) return { sales: [], items: [] };

    const { data: salesData, error: salesErr } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesErr || !salesData) return { sales: [], items: [] };

    const { data: itemsData } = await supabase.from('sale_items').select('*');

    return { sales: salesData, items: itemsData || [] };
  },

  /**
   * Inserta la cabecera de la venta.
   */
  async insertSaleHeader(sale: Sale): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('sales').insert({
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
    if (error) throw error;
  },

  /**
   * Inserta los detalles de la venta en lote.
   */
  async insertSaleItems(items: any[]): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('sale_items').insert(items);
    if (error) throw error;
  },

  /**
   * Actualiza el estado de una venta a 'anulada'.
   */
  async updateSaleStatus(id: string, status: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('sales').update({ status }).eq('id', id);
  },

  /**
   * Upsert generico para sincronización offline de ventas.
   */
  async upsertRawSale(payload: any): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('sales').upsert({
      id: payload.id,
      reference: payload.reference,
      customer_id: payload.customerId || null,
      customer_name: payload.customerName,
      subtotal: payload.subtotal,
      discount: payload.discount || 0,
      tax: payload.tax || 0,
      total: payload.total,
      payment_method: payload.paymentMethod,
      cash_received: payload.cashReceived,
      change: payload.change,
      status: payload.status || 'completada',
      user_id: payload.userId || null,
      user_name: payload.userName || 'Sistema',
      created_at: payload.createdAt,
    });

    if (payload.items && payload.items.length > 0) {
      const saleItems = payload.items.map((it: any) => ({
        sale_id: payload.id,
        product_id: it.productId,
        product_name: it.productName,
        quantity: it.quantity,
        price: it.price,
        discount: it.discount || 0,
        subtotal: it.subtotal,
      }));
      await supabase.from('sale_items').upsert(saleItems);
    }
  },
};
