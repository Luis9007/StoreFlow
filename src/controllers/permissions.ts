import type { Role } from '../models/types';

export type ModuleKey =
  | 'dashboard' | 'pos' | 'products' | 'inventory' | 'purchases'
  | 'customers' | 'suppliers' | 'cash' | 'reports' | 'settings';

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

const moduleAccess: Record<Role, ModuleKey[]> = {
  supervisor: ['dashboard', 'pos', 'products', 'inventory', 'purchases', 'customers', 'suppliers', 'cash', 'reports', 'settings'],
  cajero: ['dashboard', 'pos', 'customers', 'cash', 'reports'],
};

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

export function canAccessModule(role: Role | undefined, module: ModuleKey): boolean {
  if (!role) return false;
  return moduleAccess[role].includes(module);
}

export function canPerformAction(role: Role | undefined, action: ActionKey): boolean {
  if (!role) return false;
  return actionAccess[role].includes(action);
}

export const roleLabels: Record<Role, string> = {
  supervisor: 'Supervisor',
  cajero: 'Cajero',
};

export const roleDescriptions: Record<Role, string> = {
  supervisor: 'Gestión operativa completa sin acceso a configuración del sistema',
  cajero: 'Punto de venta, clientes y caja — sin gestión de inventario',
};
