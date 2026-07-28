/**
 * @file customerService.ts (Server Backend)
 * @description Capa de Servicio / Lógica de Negocio para Clientes y Cartera de Crédito.
 */

import type { Customer } from '../../models/types';
import { customerModel } from '../models/customerModel';

export const customerService = {
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

  async upsertCustomer(c: Customer): Promise<void> {
    if (!c.name) throw new Error('El nombre del cliente es obligatorio');
    await customerModel.upsert(c);
  },

  async deleteCustomer(id: string): Promise<void> {
    await customerModel.deleteById(id);
  },

  async updateBalance(id: string, newBalance: number): Promise<void> {
    await customerModel.updateBalance(id, newBalance);
  },
};
