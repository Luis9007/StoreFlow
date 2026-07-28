/**
 * @file productController.ts (Server Backend Express)
 * @description Controlador Express para productos, categorías y ajustes de inventario.
 */

import type { Request, Response } from 'express';
import { productService } from '../services/productService';

export const productController = {
  async getProductsData(req: Request, res: Response) {
    try {
      const data = await productService.fetchProductsData();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async upsertCategory(req: Request, res: Response) {
    try {
      const category = req.body;
      await productService.upsertCategory(category);
      return res.status(200).json({ success: true, message: 'Categoría guardada' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async upsertProduct(req: Request, res: Response) {
    try {
      const product = req.body;
      await productService.upsertProduct(product);
      return res.status(200).json({ success: true, message: 'Producto guardado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteProduct(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await productService.deleteProduct(id);
      return res.status(200).json({ success: true, message: 'Producto eliminado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateStock(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId);
      const { newStock } = req.body;
      await productService.updateStock(productId, Number(newStock));
      return res.status(200).json({ success: true, message: 'Stock actualizado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async insertAdjustment(req: Request, res: Response) {
    try {
      const adjustment = req.body;
      await productService.insertAdjustment(adjustment);
      return res.status(201).json({ success: true, message: 'Ajuste de inventario registrado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
