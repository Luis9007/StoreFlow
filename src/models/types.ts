export type Role = 'supervisor' | 'cajero';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Brand {
  id: string;
  name: string;
}

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

export interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  notes: string;
  createdAt: string;
}

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

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  subtotal: number;
}

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

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'credito';

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

export type CashMovementType = 'apertura' | 'cierre' | 'venta' | 'abono' | 'cliente' | 'producto' | 'compra' | 'inventario' | 'ingreso' | 'egreso';

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

export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  userId: string;
  userName: string;
  createdAt: string;
}

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
