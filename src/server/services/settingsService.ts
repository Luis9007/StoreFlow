/**
 * @file settingsService.ts (Server Backend)
 * @description Capa de Servicio / Lógica de Negocio para Configuración del Sistema y Auditoría.
 */

import type { CompanySettings, ActivityLog } from '../../models/types';
import { seedDatabase } from '../../models/seed';
import { settingsModel } from '../models/settingsModel';

export const settingsService = {
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

  async upsertSettings(s: Partial<CompanySettings>): Promise<void> {
    await settingsModel.upsertSettings(s);
  },

  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    await settingsModel.updateTheme(theme);
  },

  async insertLog(log: ActivityLog): Promise<void> {
    await settingsModel.insertLog(log);
  },
};
