/**
 * @file supabase.ts
 * @description Configuración e inicialización del cliente oficial de Supabase SDK.
 * 
 * RELACIÓN CON OTROS MÓDULOS:
 * - Servicios (`src/services/*.ts`): Consumen la constante exportada `supabase` para realizar
 *   peticiones HTTP API REST (SELECT, INSERT, UPDATE, DELETE, UPSERT) a la base de datos PostgreSQL.
 * - Controladores (`src/controllers/*.ts`): No importan directamente `supabase`, sino que llaman a los
 *   métodos de los servicios. `StoreController.tsx` evalúa `isSupabaseConfigured` para decidir si
 *   activa la hidratación inicial y la cola de auto-sincronización offline (`syncService`).
 */

import { createClient } from '@supabase/supabase-js';

// Helper seguro para obtener variables de entorno en frontend (Vite) y backend (Node.js)
const getEnvVar = (name: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] || '';
  }
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[name]) {
      return metaEnv[name] || '';
    }
  } catch {
    // Ignorar si import.meta no es accesible
  }
  return '';
};

// Lectura de variables de entorno para la URL y la llave anónima de la API de Supabase
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

/**
 * Flag booleano que determina si la integración con el backend Supabase está completamente configurada.
 * Verifica que existan la URL y la Anon Key, y que no contengan los valores por defecto del archivo .env.example.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('tu-proyecto') && 
  !supabaseAnonKey.includes('tu-anon-key')
);

/**
 * Instancia global del cliente de Supabase SDK.
 * Si Supabase no está configurado, utiliza URLs placeholder para evitar que la aplicación falle al instanciar.
 */
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);
