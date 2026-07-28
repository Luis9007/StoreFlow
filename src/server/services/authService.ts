/**
 * @file authService.ts (Server Backend)
 * @description Capa de Servicio / Lógica de Negocio para Usuarios del Sistema.
 * 
 * REGLA ESTRICTA DE ARQUITECTURA:
 * - Contiene lógica de negocio pura y transformaciones del dominio de autenticación.
 * - Consume ÚNICAMENTE `authModel` (cero consultas directas a la base de datos).
 */

import type { User } from '../../models/types';
import { authModel } from '../models/authModel';

export const authService = {
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

  async upsertUser(u: User): Promise<void> {
    if (!u.email || !u.name) {
      throw new Error('Nombre y correo son requeridos');
    }
    await authModel.upsert(u);
  },

  async deleteUser(id: string): Promise<void> {
    await authModel.deleteById(id);
  },
};
