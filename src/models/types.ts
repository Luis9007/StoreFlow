/**
 * @file types.ts
 * @description Modelos de datos del dominio principal del sistema StoreFlow.
 * 
 * RELACIÓN CON OTROS MÓDULOS:
 * - Servicios (src/services): Utilizan estas interfaces para tipar los resultados devueltos por la API REST de Supabase.
 * - Controladores (src/controllers): Operan sobre estas estructuras dentro del estado global AppDatabase.
 * - Vistas (src/views): Renderizan componentes basados en el tipado de estas entidades.
 */

/** Roles de usuario soportados */
export type Role = 'supervisor' | 'cajero';

/** Entidad de Usuario del sistema */
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

/** Categoría de productos del catálogo */
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/** Marca comercial de productos */
export interface Brand {
  id: string;
  name: string;
}

/** Producto del inventario */
export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  categoryId: string;
  brandId: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
  favorite: boolean;
  createdAt: string;
}

/** Cliente registrado para ventas y crédito de cartera */
export interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  balance: number; // Saldo pendiente por pagar (cartera de crédito)
  notes: string;
  createdAt: string;
}

/** Proveedor comercial */
export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  balance: number;
  createdAt: string;
}

/** Ítem individual dentro de una orden de compra */
export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  subtotal: number;
}

/** Orden de compra a proveedor */
export interface Purchase {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  items: PurchaseItem[];
  total: number;
  status: 'pendiente' | 'recibida' | 'cancelada';
  createdAt: string;
}

/** Ítem individual dentro de una venta del POS */
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

/** Métodos de pago permitidos en el punto de venta */
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';

/** Encabezado de Venta procesada */
export interface Sale {
  id: string;
  reference: string;
  customerId: string | null;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived: number;
  change: number;
  userId: string;
  userName: string;
  status: 'completada' | 'anulada';
  createdAt: string;
}

/** Tipos de movimiento financiero o logístico dentro de una sesión de caja */
export type CashMovementType = 'apertura' | 'cierre' | 'venta' | 'abono' | 'cliente' | 'producto' | 'compra' | 'inventario' | 'ingreso' | 'egreso';

/** Registro de movimiento de caja registradora */
export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  concept: string;
  reference: string;
  details?: Record<string, any>;
  userId: string;
  userName: string;
  createdAt: string;
}

/** Turno / Sesión de caja registradora */
export interface CashSession {
  id: string;
  openingAmount: number;
  closingAmount: number | null;
  status: 'abierta' | 'cerrada';
  openedAt: string;
  closedAt: string | null;
  userId: string;
  userName: string;
  movements: CashMovement[];
}

/** Registro histórico de ajuste manual de stock */
export interface InventoryAdjustment {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  reason: string;
  type: 'entrada' | 'salida' | 'ajuste';
  userId: string;
  userName: string;
  createdAt: string;
}

/** Configuración corporativa del negocio */
export interface CompanySettings {
  name: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  logoText: string;
  theme: 'light' | 'dark';
}

/** Registro de bitácora de auditoría de actividad */
export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  userId: string;
  userName: string;
  createdAt: string;
}

/** Objeto contenedor del estado completo de la base de datos de la aplicación */
export interface AppDatabase {
  users: User[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  cashSessions: CashSession[];
  adjustments: InventoryAdjustment[];
  settings: CompanySettings;
  logs: ActivityLog[];
}
