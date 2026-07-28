/**
 * @file customerService.ts
 * @description Capa de Servicio / Lógica de Negocio para Clientes y Saldos de Cartera.
 * 
 * REGLA DE ARQUITECTURA:
 * - `customerService` contiene las validaciones de clientes y carteras de crédito.
 * - Consume ÚNICAMENTE el modelo `customerModel` (sin llamadas directas a Supabase).
 * - Es invocado por `CustomerController.ts` y `StoreController.tsx`.
 */

import type { Customer } from '../models/types';
import { customerModel } from '../models/customerModel';
import { isSupabaseConfigured } from '../models/supabase';
import { syncService } from './syncService';

export const customerService = {
  /**
   * Obtiene la lista de clientes mapeados desde customerModel.
   */
  async fetchCustomers(): Promise<Customer[]> {
    const data = await customerModel.findAll();
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
   * Registra o actualiza un cliente vía customerModel o lo encola offline.
   */
  async upsertCustomer(c: Customer): Promise<void> {
    if (!isSupabaseConfigured) {
      syncService.addToPendingQueue({ id: c.id, type: 'customer', payload: c });
      return;
    }

    try {
      await customerModel.upsert(c);
    } catch (err) {
      console.warn('Customer upsert failed, enqueuing for offline sync:', err);
      syncService.addToPendingQueue({ id: c.id, type: 'customer', payload: c });
    }
  },

  /**
   * Elimina un cliente mediante customerModel.
   */
  async deleteCustomer(id: string): Promise<void> {
    await customerModel.deleteById(id);
  },

  /**
   * Actualiza el saldo de cartera del cliente mediante customerModel.
   */
  async updateBalance(id: string, newBalance: number): Promise<void> {
    await customerModel.updateBalance(id, newBalance);
  },
};
