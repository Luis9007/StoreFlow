/**
 * @file settingsModel.ts
 * @description Capa de Modelo / Acceso directo a la base de datos para Configuración y Bitácora de Actividades.
 * 
 * REGLA DE ARQUITECTURA:
 * - Este modelo interactúa directamente con Supabase (`company_settings`, `activity_logs`).
 * - Es invocado ÚNICAMENTE por `settingsService.ts` y `syncService.ts`.
 */

import { supabase, isSupabaseConfigured } from './supabase';
import type { CompanySettings, ActivityLog } from './types';

export const settingsModel = {
  /**
   * Obtiene la configuración de la empresa y la bitácora de actividad.
   */
  async findSettingsAndLogs(): Promise<{ settings: any; logs: any[] }> {
    if (!isSupabaseConfigured) return { settings: null, logs: [] };

    const [{ data: settings }, { data: logs }] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    return { settings, logs: logs || [] };
  },

  /**
   * Actualiza o inserta la configuración de la empresa.
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
   * Actualiza únicamente el tema visual en la BD.
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('company_settings').update({ theme }).eq('id', 1);
  },

  /**
   * Inserta una entrada de bitácora en la BD.
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

  /**
   * Realiza una prueba de conectividad con la BD.
   */
  async pingHealth(signal: AbortSignal): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    const { error } = await supabase
      .from('company_settings')
      .select('id')
      .limit(1)
      .abortSignal(signal);
    return !error;
  },
};
