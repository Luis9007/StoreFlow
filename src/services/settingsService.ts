import type { CompanySettings, ActivityLog } from '../models/types';
import { seedDatabase } from '../models/seed';
import { supabase, isSupabaseConfigured } from '../models/supabase';

export const settingsService = {
  async fetchSettingsAndLogs(): Promise<{ settings: CompanySettings; logs: ActivityLog[] }> {
    if (!isSupabaseConfigured) return { settings: seedDatabase.settings, logs: [] };

    const [{ data: settings }, { data: logs }] = await Promise.all([
      supabase.from('company_settings').select('*').single(),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

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
