/**
 * @file customerController.ts (Server Backend Express)
 * @description Controlador Express para clientes y saldos.
 */

import type { Request, Response } from 'express';
import { customerService } from '../services/customerService';

export const customerController = {
  async getCustomers(req: Request, res: Response) {
    try {
      const customers = await customerService.fetchCustomers();
      return res.status(200).json({ success: true, data: customers });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async upsertCustomer(req: Request, res: Response) {
    try {
      const customer = req.body;
      await customerService.upsertCustomer(customer);
      return res.status(200).json({ success: true, message: 'Cliente guardado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteCustomer(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await customerService.deleteCustomer(id);
      return res.status(200).json({ success: true, message: 'Cliente eliminado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateBalance(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const { newBalance } = req.body;
      await customerService.updateBalance(id, Number(newBalance));
      return res.status(200).json({ success: true, message: 'Saldo actualizado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
