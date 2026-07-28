/**
 * @file cashController.ts (Server Backend Express)
 * @description Controlador Express para turnos y movimientos de caja.
 */

import type { Request, Response } from 'express';
import { cashService } from '../services/cashService';

export const cashController = {
  async getCashData(req: Request, res: Response) {
    try {
      const data = await cashService.fetchCashData();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async openSession(req: Request, res: Response) {
    try {
      const session = req.body;
      await cashService.openSession(session);
      return res.status(201).json({ success: true, message: 'Turno de caja abierto' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async closeSession(req: Request, res: Response) {
    try {
      const sessionId = String(req.params.sessionId);
      const { closingAmount, closedAt } = req.body;
      await cashService.closeSession(sessionId, Number(closingAmount), closedAt);
      return res.status(200).json({ success: true, message: 'Turno de caja cerrado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async insertMovement(req: Request, res: Response) {
    try {
      const { movement, activeSessionId } = req.body;
      await cashService.insertMovement(movement, activeSessionId);
      return res.status(201).json({ success: true, message: 'Movimiento de caja registrado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
