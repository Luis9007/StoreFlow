import type { User } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const authService = {
  async fetchUsers(): Promise<User[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('app_users').select('*');
    if (error || !data) return [];
    return data.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      active: u.active,
      createdAt: u.created_at,
    }));
  },

  async upsertUser(u: User): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('app_users').upsert({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      active: u.active,
      created_at: u.createdAt,
    });
  },

  async deleteUser(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('app_users').delete().eq('id', id);
  },
};
