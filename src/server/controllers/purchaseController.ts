/**
 * @file purchaseController.ts (Server Backend Express)
 * @description Controlador Express para proveedores y órdenes de compra.
 */

import type { Request, Response } from 'express';
import { purchaseService } from '../services/purchaseService';

export const purchaseController = {
  async getPurchasesData(req: Request, res: Response) {
    try {
      const data = await purchaseService.fetchPurchasesData();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async upsertSupplier(req: Request, res: Response) {
    try {
      const supplier = req.body;
      await purchaseService.upsertSupplier(supplier);
      return res.status(200).json({ success: true, message: 'Proveedor guardado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteSupplier(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await purchaseService.deleteSupplier(id);
      return res.status(200).json({ success: true, message: 'Proveedor eliminado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async insertPurchase(req: Request, res: Response) {
    try {
      const purchase = req.body;
      await purchaseService.insertPurchase(purchase);
      return res.status(201).json({ success: true, message: 'Orden de compra registrada' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async receivePurchase(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await purchaseService.receivePurchase(id);
      return res.status(200).json({ success: true, message: 'Compra marcada como recibida' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
