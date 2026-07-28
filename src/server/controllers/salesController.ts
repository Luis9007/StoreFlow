/**
 * @file salesController.ts (Server Backend Express)
 * @description Controlador Express para ventas y anulaciones.
 */

import type { Request, Response } from 'express';
import { salesService } from '../services/salesService';

export const salesController = {
  async getSales(req: Request, res: Response) {
    try {
      const sales = await salesService.fetchSalesData();
      return res.status(200).json({ success: true, data: sales });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async processSale(req: Request, res: Response) {
    try {
      const { sale, products, customer } = req.body;
      await salesService.processSale(sale, products || [], customer);
      return res.status(201).json({ success: true, message: 'Venta procesada exitosamente' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async voidSale(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await salesService.voidSale(id);
      return res.status(200).json({ success: true, message: 'Venta anulada exitosamente' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
