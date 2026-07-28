import { useCallback, useEffect } from 'react';
import type { AppDatabase, CompanySettings } from '../models/types';
import { seedDatabase } from '../models/seed';
import { settingsService } from '../services/settingsService';

export function useSettingsController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  addLog: (action: string, detail: string) => void
) {
  useEffect(() => {
    const theme = db.settings.theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [db.settings.theme]);

  const updateSettings = useCallback(
    (s: Partial<CompanySettings>) => {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...s } }));
      addLog('Configuración', 'Parámetros de la empresa actualizados');
      settingsService.upsertSettings(s).catch(console.error);
    },
    [setDb, addLog]
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, theme } }));
      settingsService.updateTheme(theme).catch(console.error);
    },
    [setDb]
  );

  const resetData = useCallback(() => {
    const fresh = structuredClone(seedDatabase);
    setDb(fresh);
    addLog('Sistema', 'Se realizó un reinicio de datos del sistema');
  }, [setDb, addLog]);

  return {
    updateSettings,
    setTheme,
    resetData,
  };
}
