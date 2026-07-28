/**
 * @file authController.ts (Server Backend Express)
 * @description Controlador Express para la gestión de usuarios y autenticación.
 */

import type { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  async getUsers(req: Request, res: Response) {
    try {
      const users = await authService.fetchUsers();
      return res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async upsertUser(req: Request, res: Response) {
    try {
      const user = req.body;
      await authService.upsertUser(user);
      return res.status(200).json({ success: true, message: 'Usuario guardado correctamente' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      await authService.deleteUser(id);
      return res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
