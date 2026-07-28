/**
 * @file index.ts
 * @description Punto de entrada y re-exportación de la capa de controladores y el proveedor global de estado.
 * 
 * RELACIÓN CON OTROS MÓDULOS:
 * Permite que los componentes de la vista (`src/views/pages/*` y `src/views/components/*`) importen
 * `useStore`, `StoreProvider`, las utilidades de permisos y controladores de forma unificada.
 */

export * from './types';
export * from './permissions';
export * from './AuthController';
export * from './CashController';
export * from './ProductController';
export * from './CustomerController';
export * from './PurchaseController';
export * from './SalesController';
export * from './SettingsController';
export { StoreProvider, useStore } from './StoreController';
