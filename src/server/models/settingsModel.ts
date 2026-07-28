/**
 * @file settingsModel.ts (Server Backend)
 * @description Capa de Modelo / Acceso directo a la base de datos para Configuración y Bitácora.
 */

import { supabase, isSupabaseConfigured } from '../../models/supabase';
import type { CompanySettings, ActivityLog } from '../../models/types';

export const settingsModel = {
  async findSettingsAndLogs(): Promise<{ settings: any; logs: any[] }> {
    if (!isSupabaseConfigured) return { settings: null, logs: [] };

    const [{ data: settings }, { data: logs }] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    return { settings, logs: logs || [] };
  },

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

  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    if (!isSupabaseConfigured) return;
    await supabase.from('company_settings').update({ theme }).eq('id', 1);
  },

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
