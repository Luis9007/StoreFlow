/**
 * @file index.ts (src/models)
 * @description Punto de entrada unificado para la Capa de Modelos (Acceso a Base de Datos y Definiciones de Datos).
 */

export * from './types';
export * from './supabase';
export * from './seed';

export { authModel } from './authModel';
export { productModel } from './productModel';
export { salesModel } from './salesModel';
export { cashModel } from './cashModel';
export { customerModel } from './customerModel';
export { purchaseModel } from './purchaseModel';
export { settingsModel } from './settingsModel';
