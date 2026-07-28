/**
 * @file SettingsController.ts
 * @description Controlador Hook de React para la configuración de empresa, tema oscuro/claro y reinicio de datos.
 * 
 * RELACIÓN CON EL SERVICIO (`src/services/settingsService.ts`):
 * - Aplica el tema dinámico ('dark' / 'light') en el elemento raíz del DOM (`document.documentElement`).
 * - Actualiza el objeto de configuración en el estado local de React (`setDb`).
 * - Persiste los parámetros en el backend mediante `settingsService`:
 *    • `updateSettings()` ➔ llama a `settingsService.upsertSettings(s)`
 *    • `setTheme()` ➔ llama a `settingsService.updateTheme(theme)`
 */

import { useCallback, useEffect } from 'react';
import type { AppDatabase, CompanySettings } from '../models/types';
import { seedDatabase } from '../models/seed';
import { settingsService } from '../services/settingsService';

/**
 * Custom Hook para gestionar preferencias del sistema y datos generales de la empresa.
 */
export function useSettingsController(
  db: AppDatabase,
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>,
  addLog: (action: string, detail: string) => void
) {
  /**
   * Efecto secundario que sincroniza la clase CSS 'dark' en el elemento HTML según la preferencia guardada.
   */
  useEffect(() => {
    const theme = db.settings.theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [db.settings.theme]);

  /**
   * Actualiza los datos corporativos (nombre, RFC/NIT, impuestos, moneda, etc.).
   * 1. Fusiona las nuevas propiedades en el estado `setDb`.
   * 2. Registra la modificación en la bitácora (`addLog`).
   * 3. Persiste en Supabase llamando a `settingsService.upsertSettings(s)`.
   */
  const updateSettings = useCallback(
    (s: Partial<CompanySettings>) => {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, ...s } }));
      addLog('Configuración', 'Parámetros de la empresa actualizados');
      settingsService.upsertSettings(s).catch(console.error);
    },
    [setDb, addLog]
  );

  /**
   * Cambia el tema de la aplicación entre 'light' y 'dark'.
   * 1. Actualiza el estado en React.
   * 2. Actualiza la preferencia en Supabase vía `settingsService.updateTheme(theme)`.
   */
  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      setDb((prev) => ({ ...prev, settings: { ...prev.settings, theme } }));
      settingsService.updateTheme(theme).catch(console.error);
    },
    [setDb]
  );

  /**
   * Restablece la base de datos local a los valores iniciales de prueba (Semilla).
   */
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
