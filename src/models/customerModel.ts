/**
 * @file customerModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Clientes.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`customers`).
 * - Es invocado ÚNICAMENTE por `customerService.ts` y `syncService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { Customer } from './types';

export const customerModel = {
  /**
   * Obtiene todos los clientes desde la BD.
   */
  async findAll(): Promise<any[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase.from('customers').select('*');
    if (error || !data) return [];
    return data;
  },

  /**
   * Inserta o actualiza un cliente.
   */
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

  /**
   * Upsert generico desde payload offline
   */
  async upsertRawCustomer(payload: any): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').upsert({
      id: payload.id,
      name: payload.name,
      document: payload.document || null,
      phone: payload.phone || null,
      email: payload.email || null,
      address: payload.address || null,
      balance: payload.balance || 0,
      notes: payload.notes || null,
    });
  },

  /**
   * Elimina un cliente por su ID.
   */
  async deleteById(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').delete().eq('id', id);
  },

  /**
   * Actualiza el saldo de un cliente.
   */
  async updateBalance(id: string, newBalance: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').update({ balance: newBalance }).eq('id', id);
  },
};
