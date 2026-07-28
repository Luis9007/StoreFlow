/**
 * @file authService.ts
 * @description Capa de Servicio para Usuarios y Credenciales del Sistema.
 * 
 * REGLA DE ARQUITECTURA:
 * - `authService` procesa la lógica de negocio y mapeo de datos de usuarios.
 * - Consume ÚNICAMENTE el modelo `authModel` (sin llamadas directas a Supabase/BD).
 * - Es invocado por `AuthController.ts` y `StoreController.tsx`.
 */

import type { User } from '../models/types';
import { authModel } from '../models/authModel';

export const authService = {
  /**
   * Obtiene todos los usuarios procesados y transformados desde el modelo.
   */
  async fetchUsers(): Promise<User[]> {
    const data = await authModel.findAll();
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
   * Registra o actualiza la información de un usuario delegando en el modelo.
   */
  async upsertUser(u: User): Promise<void> {
    await authModel.upsert(u);
  },

  /**
   * Elimina un usuario delegando en el modelo.
   */
  async deleteUser(id: string): Promise<void> {
    await authModel.deleteById(id);
  },
};
