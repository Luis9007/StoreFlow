import type { Customer } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const customerService = {
  async fetchCustomers(): Promise<Customer[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('customers').select('*');
    if (error || !data) return [];

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      document: c.document || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      balance: Number(c.balance) || 0,
      notes: c.notes || '',
      createdAt: c.created_at,
    }));
  },

  async upsertCustomer(c: Customer): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').upsert({
      id: c.id,
      name: c.name,
      document: c.document,
      phone: c.phone,
      email: c.email,
      address: c.address,
      balance: c.balance,
      notes: c.notes,
    });
  },

  async deleteCustomer(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').delete().eq('id', id);
  },

  async updateBalance(id: string, newBalance: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').update({ balance: newBalance }).eq('id', id);
  },
};
