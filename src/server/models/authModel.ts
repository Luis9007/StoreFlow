/**
 * @file authModel.ts (Server Backend)
 * @description Capa de Modelo / Acceso directo a la base de datos para Usuarios (`app_users`).
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Esta es la ÚNICA capa responsable del acceso a la base de datos (Supabase/PostgreSQL).
 * - Es invocada ÚNICAMENTE por `authService.ts` en el servidor backend Node.js.
 */

import { supabase, isSupabaseConfigured } from '../../models/supabase';
import type { User } from '../../models/types';

export const authModel = {
  async findAll(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('app_users').select('*');
    if (error || !data) return [];
    return data;
  },

  async upsert(user: User): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('app_users').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      active: user.active,
      created_at: user.createdAt,
    });
  },

  async deleteById(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('app_users').delete().eq('id', id);
  },
};
