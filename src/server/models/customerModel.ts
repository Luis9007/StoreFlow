/**
 * @file customerModel.ts (Server Backend)
 * @description Capa de Modelo / Acceso directo a la base de datos para Clientes.
 */

import { supabase, isSupabaseConfigured } from '../../models/supabase';
import type { Customer } from '../../models/types';

export const customerModel = {
  async findAll(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('customers').select('*');
    if (error || !data) return [];
    return data;
  },

  async upsert(c: Customer): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('customers').upsert({
      id: c.id,
      name: c.name,
      document: c.document,
      phone: c.phone,
      email: c.email,
      address: c.address,
      balance: c.balance,
      notes: c.notes,
    });
    if (error) throw error;
  },

  async deleteById(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').delete().eq('id', id);
  },

  async updateBalance(id: string, newBalance: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').update({ balance: newBalance }).eq('id', id);
  },
};
