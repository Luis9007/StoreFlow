/**
 * @file authService.ts
 * @description Capa de Servicio / Acceso a Datos para Usuarios y Credenciales del Sistema (`app_users`).
 * 
 * RELACIÓN CON EL CONTROLADOR (`src/controllers/AuthController.ts`):
 * - `authService` interactúa mediante peticiones HTTP REST con la tabla `app_users` en Supabase.
 * - `AuthController.ts` utiliza este servicio para la administración de la lista de usuarios:
 *    • `AuthController.upsertUser()` ➔ llama a `authService.upsertUser(u)`
 *    • `AuthController.deleteUser()` ➔ llama a `authService.deleteUser(id)`
 * - `StoreController.tsx` ejecuta `authService.fetchUsers()` al iniciar la app para cargar los usuarios válidos.
 */

import type { User } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const authService = {
  /**
   * Consulta todos los usuarios del sistema desde la tabla `app_users` vía HTTP GET.
   * Invocado por: `StoreController.tsx` durante la carga inicial.
   */
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

  /**
   * Registra o actualiza la información de un usuario vía HTTP POST/UPSERT.
   * Invocado por: `AuthController.upsertUser()`
   */
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

  /**
   * Elimina un usuario por su ID de la tabla `app_users` vía HTTP DELETE.
   * Invocado por: `AuthController.deleteUser()`
   */
  async deleteUser(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('app_users').delete().eq('id', id);
  },
};
