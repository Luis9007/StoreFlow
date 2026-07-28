/**
 * @file salesModel.ts (Server Backend)
 * @description Capa de Modelo / Acceso directo a la base de datos para Ventas e Ítems.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - ÚNICA capa responsable de las consultas a las tablas `sales` y `sale_items`.
 * - Invocada ÚNICAMENTE por `salesService.ts`.
 */

import { supabase, isSupabaseConfigured } from '../../models/supabase';
import type { Sale } from '../../models/types';

export const salesModel = {
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

  async insertSaleItems(items: any[]): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('sale_items').insert(items);
    if (error) throw error;
  },

  async updateSaleStatus(id: string, status: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('sales').update({ status }).eq('id', id);
  },
};
