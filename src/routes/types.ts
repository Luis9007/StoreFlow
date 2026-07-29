/**
 * @file types.ts (src/routes)
 * @description Definición de tipos y constantes para las rutas de navegación de la aplicación.
 */

export interface AppRoute {
  path: string;
  name: string;
  module?: string;
}

export const APP_ROUTES = {
  LOGIN: '/login',
  APP_ROOT: '/app',
  DASHBOARD: '/app',
  POS: '/app/pos',
  PRODUCTS: '/app/products',
  INVENTORY: '/app/inventory',
  PURCHASES: '/app/purchases',
  CUSTOMERS: '/app/customers',
  SUPPLIERS: '/app/suppliers',
  CASH: '/app/cash',
  REPORTS: '/app/reports',
  LOGS: '/app/logs',
  SETTINGS: '/app/settings',
} as const;
