/**
 * @file settingsController.ts (Server Backend Express)
 * @description Controlador Express para configuración y auditoría.
 */

import type { Request, Response } from 'express';
import { settingsService } from '../services/settingsService';

export const settingsController = {
  async getSettingsAndLogs(req: Request, res: Response) {
    try {
      const data = await settingsService.fetchSettingsAndLogs();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async upsertSettings(req: Request, res: Response) {
    try {
      const settings = req.body;
      await settingsService.upsertSettings(settings);
      return res.status(200).json({ success: true, message: 'Configuración actualizada' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateTheme(req: Request, res: Response) {
    try {
      const { theme } = req.body;
      await settingsService.updateTheme(theme);
      return res.status(200).json({ success: true, message: 'Tema actualizado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async insertLog(req: Request, res: Response) {
    try {
      const log = req.body;
      await settingsService.insertLog(log);
      return res.status(201).json({ success: true, message: 'Registro de auditoría guardado' });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
