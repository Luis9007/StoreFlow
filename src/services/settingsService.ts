/**
 * @file settingsService.ts
 * @description Capa de Servicio / Lógica de Negocio para Configuración del Sistema y Bitácora de Actividades.
 * 
 * REGLA DE ARQUITECTURA:
 * - `settingsService` maneja preferencias de negocio y registros de auditoría.
 * - Consume ÚNICAMENTE el modelo `settingsModel` (sin llamadas directas a Supabase).
 * - Es invocado por `SettingsController.ts` y `StoreController.tsx`.
 */

import type { CompanySettings, ActivityLog } from '../models/types';
import { seedDatabase } from '../models/seed';
import { settingsModel } from '../models/settingsModel';

export const settingsService = {
  /**
   * Obtiene la configuración e historial de logs desde settingsModel.
   */
  async fetchSettingsAndLogs(): Promise<{ settings: CompanySettings; logs: ActivityLog[] }> {
    const { settings, logs } = await settingsModel.findSettingsAndLogs();

    const mappedSettings: CompanySettings = settings
      ? {
          name: settings.name,
          legalName: settings.legal_name || '',
          taxId: settings.tax_id || '',
          address: settings.address || '',
          phone: settings.phone || '',
          email: settings.email || '',
          currency: settings.currency || 'MXN',
          currencySymbol: settings.currency_symbol || '$',
          taxRate: Number(settings.tax_rate) || 16,
          logoText: settings.logo_text || 'StoreFlow',
          theme: settings.theme || 'dark',
        }
      : seedDatabase.settings;

    const mappedLogs: ActivityLog[] = logs.map((l) => ({
      id: l.id,
      action: l.action,
      detail: l.detail || '',
      userId: l.user_id,
      userName: l.user_name,
      createdAt: l.created_at,
    }));

    return { settings: mappedSettings, logs: mappedLogs };
  },

  /**
   * Actualiza la configuración general vía settingsModel.
   */
  async upsertSettings(s: Partial<CompanySettings>): Promise<void> {
    await settingsModel.upsertSettings(s);
  },

  /**
   * Actualiza el tema visual vía settingsModel.
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    await settingsModel.updateTheme(theme);
  },

  /**
   * Inserta un registro de bitácora vía settingsModel.
   */
  async insertLog(log: ActivityLog): Promise<void> {
    await settingsModel.insertLog(log);
  },
};
