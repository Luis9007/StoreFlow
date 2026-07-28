/**
 * @file authModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Usuarios del Sistema (`app_users`).
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`app_users`).
 * - Es invocado ÚNICAMENTE por `authService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from './types';

export const authModel = {
  /**
   * Realiza la consulta directa SQL/Supabase a la tabla `app_users`.
   */
  async findAll(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('app_users').select('*');
    if (error || !data) return [];
    return data;
  },

  /**
   * Inserta o actualiza un registro en la tabla `app_users`.
   */
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

  /**
   * Elimina un usuario por su ID de la tabla `app_users`.
   */
  async deleteById(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('app_users').delete().eq('id', id);
  },
};
