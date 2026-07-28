/**
 * @file customerService.ts
 * @description Capa de Servicio / Acceso a Datos para Clientes y Saldos de Cartera (Crédito).
 * 
 * RELACIÓN CON EL CONTROLADOR (`src/controllers/CustomerController.ts`):
 * - `customerService` gestiona las llamadas HTTP REST a la tabla `customers` en Supabase.
 * - `CustomerController.ts` invoca estos métodos cuando el usuario gestiona clientes o cobra abonos de cartera:
 *    • `CustomerController.upsertCustomer()` ➔ llama a `customerService.upsertCustomer(c)`
 *    • `CustomerController.deleteCustomer()` ➔ llama a `customerService.deleteCustomer(id)`
 *    • `CustomerController.addCustomerPayment()` ➔ llama a `customerService.updateBalance(id, newBalance)`
 * - `StoreController.tsx` llama a `customerService.fetchCustomers()` al iniciar para cargar el catálogo de clientes.
 */

import type { Customer } from '../models/types';
import { supabase, isSupabaseConfigured } from '../models/supabase';
import { syncService } from './syncService';

export const customerService = {
  /**
   * Obtiene todos los clientes mediante una petición HTTP GET REST a la tabla `customers`.
   * Mapea las columnas de PostgreSQL (`created_at`) al modelo de TypeScript `Customer`.
   * Invocado por: `StoreController.tsx` durante la hidratación inicial.
   */
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

  /**
   * Inserta o actualiza un cliente mediante una petición HTTP POST/UPSERT.
   * Si no hay conexión o falla la petición, agrega el registro a la cola offline (`syncService`).
   * Invocado por: `CustomerController.upsertCustomer()`
   */
  async upsertCustomer(c: Customer): Promise<void> {
    if (!isSupabaseConfigured) {
      syncService.addToPendingQueue({ id: c.id, type: 'customer', payload: c });
      return;
    }

    try {
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
    } catch (err) {
      console.warn('Supabase customer upsert failed, enqueuing for offline sync:', err);
      syncService.addToPendingQueue({ id: c.id, type: 'customer', payload: c });
    }
  },

  /**
   * Elimina un cliente por su ID enviando una solicitud HTTP DELETE.
   * Invocado por: `CustomerController.deleteCustomer()`
   */
  async deleteCustomer(id: string): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').delete().eq('id', id);
  },

  /**
   * Actualiza únicamente la columna `balance` (saldo deudor) de un cliente mediante HTTP PATCH.
   * Invocado por: `CustomerController.addCustomerPayment()`
   */
  async updateBalance(id: string, newBalance: number): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('customers').update({ balance: newBalance }).eq('id', id);
  },
};
