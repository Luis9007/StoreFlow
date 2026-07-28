/**
 * @file permissions.ts
 * @description Sistema de Control de Acceso Basado en Roles (RBAC - Role-Based Access Control).
 * 
 * RELACIÓN CON CONTROLADORES Y VISTAS:
 * - Define los permisos para los roles del sistema (`supervisor` y `cajero`).
 * - Utilizado por `Sidebar.tsx`, `AppLayout.tsx` y los controladores de las páginas para restringir
 *   el acceso a módulos completos (`canAccessModule`) o acciones específicas (`canPerformAction`).
 */

import type { Role } from '../models/types';

/** Claves identificadoras de los módulos principales de la aplicación */
export type ModuleKey =
  | 'dashboard' | 'pos' | 'products' | 'inventory' | 'purchases'
  | 'customers' | 'suppliers' | 'cash' | 'reports' | 'settings';

/** Claves identificadoras de las acciones específicas restringidas */
export type ActionKey =
  | 'product.create' | 'product.edit' | 'product.delete'
  | 'inventory.adjust'
  | 'purchase.create' | 'purchase.receive'
  | 'customer.create' | 'customer.edit' | 'customer.delete'
  | 'supplier.create' | 'supplier.edit' | 'supplier.delete'
  | 'user.create' | 'user.edit' | 'user.delete'
  | 'cash.open' | 'cash.close' | 'cash.movement'
  | 'report.export'
  | 'settings.edit'
  | 'data.reset'
  | 'pos.void';

/** Matriz de asignación de acceso a módulos por rol */
const moduleAccess: Record<Role, ModuleKey[]> = {
  supervisor: ['dashboard', 'pos', 'products', 'inventory', 'purchases', 'customers', 'suppliers', 'cash', 'reports', 'settings'],
  cajero: ['dashboard', 'pos', 'customers', 'cash', 'reports'],
};

/** Matriz de asignación de acciones permitidas por rol */
const actionAccess: Record<Role, ActionKey[]> = {
  supervisor: [
    'product.create', 'product.edit', 'product.delete',
    'inventory.adjust',
    'purchase.create', 'purchase.receive',
    'customer.create', 'customer.edit', 'customer.delete',
    'supplier.create', 'supplier.edit', 'supplier.delete',
    'user.create', 'user.edit', 'user.delete',
    'cash.open', 'cash.close', 'cash.movement',
    'report.export', 'settings.edit', 'pos.void',
  ],
  cajero: [
    'customer.create', 'customer.edit',
    'cash.open', 'cash.close', 'cash.movement',
  ],
};

/**
 * Verifica si un rol tiene permiso para visualizar un módulo de la barra lateral.
 */
export function canAccessModule(role: Role | undefined, module: ModuleKey): boolean {
  if (!role) return false;
  return moduleAccess[role].includes(module);
}

/**
 * Verifica si un rol está autorizado para ejecutar una acción específica.
 */
export function canPerformAction(role: Role | undefined, action: ActionKey): boolean {
  if (!role) return false;
  return actionAccess[role].includes(action);
}

/** Etiquetas amigables de los roles para mostrar en la interfaz */
export const roleLabels: Record<Role, string> = {
  supervisor: 'Supervisor',
  cajero: 'Cajero',
};

/** Descripciones explicativas del alcance de cada rol */
export const roleDescriptions: Record<Role, string> = {
  supervisor: 'Gestión operativa completa sin acceso a configuración del sistema',
  cajero: 'Punto de venta, clientes y caja — sin gestión de inventario',
};
