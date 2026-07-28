/**
 * @file index.ts
 * @description Punto de entrada y re-exportación de todos los servicios de la capa de acceso a datos / API REST.
 * 
 * RELACIÓN CON LOS CONTROLADORES:
 * Agrupa los 8 módulos de servicio (`authService`, `cashService`, `productService`, `customerService`,
 * `purchaseService`, `salesService`, `settingsService`, `syncService`) para permitir importaciones consolidadas
 * desde `StoreController.tsx` y controladores de dominio.
 */

export * from './authService';
export * from './cashService';
export * from './productService';
export * from './customerService';
export * from './purchaseService';
export * from './salesService';
export * from './settingsService';
export * from './syncService';
