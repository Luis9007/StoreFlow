/**
 * @file settingsService.ts
 * @description Capa de Servicio / Acceso a Datos para Configuración de la Empresa, Temas Visuales y Bitácora de Actividades.
 * 
 * RELACIÓN CON EL CONTROLADOR (`src/controllers/SettingsController.ts`):
 * - `settingsService` realiza peticiones HTTP REST a las tablas `company_settings` y `activity_logs`.
 * - `SettingsController.ts` llama a estos métodos para guardar la configuración:
 *    • `SettingsController.updateSettings()` ➔ llama a `settingsService.upsertSettings(s)`
 *    • `SettingsController.setTheme()` ➔ llama a `settingsService.updateTheme(theme)`
 * - `StoreController.tsx` invoca `settingsService.insertLog(log)` al registrar eventos en la bitácora global
 *   y llama a `settingsService.fetchSettingsAndLogs()` al iniciar la aplicación.
 */

import type { CompanySettings, ActivityLog } from '../models/types';
import { seedDatabase } from '../models/seed';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const settingsService = {
  /**
   * Consulta la configuración general del negocio y los últimos 100 registros de la bitácora de auditoría vía HTTP GET.
   * Invocado por: `StoreController.tsx` durante la carga inicial.
   */
  async fetchSettingsAndLogs(): Promise<{ settings: CompanySettings; logs: ActivityLog[] }> {
    if (!isSupabaseConfigured) return { settings: seedDatabase.settings, logs: [] };

    const [{ data: settings }, { data: logs }] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    // Mapea la configuración recibida o usa los valores predeterminados de semilla
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

    // Mapea las entradas de bitácora
    const mappedLogs: ActivityLog[] = (logs || []).map((l) => ({
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
   * Actualiza los parámetros de la empresa en la base de datos mediante un HTTP POST/UPSERT.
   * Invocado por: `SettingsController.updateSettings()`
   */
  async upsertSettings(s: Partial<CompanySettings>): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('company_settings').upsert({
      id: 1,
      name: s.name,
      legal_name: s.legalName,
      tax_id: s.taxId,
      address: s.address,
      phone: s.phone,
      email: s.email,
      currency: s.currency,
      currency_symbol: s.currencySymbol,
      tax_rate: s.taxRate,
      logo_text: s.logoText,
      theme: s.theme,
    });
  },

  /**
   * Actualiza únicamente la preferencia de tema visual ('light' o 'dark') vía HTTP PATCH.
   * Invocado por: `SettingsController.setTheme()`
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('company_settings').update({ theme }).eq('id', 1);
  },

  /**
   * Inserta un nuevo registro de auditoría en la tabla `activity_logs` vía HTTP POST.
   * Invocado por: `StoreController.tsx` cada vez que se ejecuta `addLog()`.
   */
  async insertLog(log: ActivityLog): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('activity_logs').insert({
      id: log.id,
      action: log.action,
      detail: log.detail,
      user_id: log.userId,
      user_name: log.userName,
      created_at: log.createdAt,
    });
  },
};
