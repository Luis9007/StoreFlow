/**
 * @file types.ts
 * @description Definición del contrato de interfaz TypeScript para el contexto global `StoreContextValue`.
 * 
 * RELACIÓN CON SERVICIOS Y CONTROLADORES:
 * Agrupa todas las firmas de métodos expuestas por los 7 controladores de dominio
 * (`useAuthController`, `useCashController`, `useProductController`, `useCustomerController`,
 * `usePurchaseController`, `useSalesController`, `useSettingsController`) para ser consumidas
 * de forma unificada en la interfaz vía el hook `useStore()`.
 */

import type {
  AppDatabase,
  User,
  Category,
  Brand,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  CashSession,
  CashMovement,
  CompanySettings,
  PaymentMethod,
} from '../models/types';

/** Interfaz principal que consolida el estado global y las acciones de todos los controladores */
export interface StoreContextValue {
  // Estado general de la base de datos local e información de conexión
  db: AppDatabase;
  currentUser: User | null;
  isLoadingDb: boolean;
  isSupabaseActive: boolean;

  // Acciones de autenticación y bitácora
  login: (email: string, password: string) => boolean;
  logout: () => void;
  resetData: () => void;
  addLog: (action: string, detail: string) => void;

  // Gestión de Usuarios (AuthController ➔ authService)
  upsertUser: (u: User) => void;
  deleteUser: (id: string) => void;

  // Catálogo de Productos, Categorías y Marcas (ProductController ➔ productService)
  upsertCategory: (c: Category) => void;
  upsertBrand: (b: Brand) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, newStock: number, reason: string, type: 'entrada' | 'salida' | 'ajuste') => void;

  // Gestión de Clientes y Cartera (CustomerController ➔ customerService / cashService)
  upsertCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  addCustomerPayment: (customerId: string, amount: number, paymentMethod?: PaymentMethod, notes?: string) => void;

  // Proveedores y Compras (PurchaseController ➔ purchaseService)
  upsertSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;
  addPurchase: (p: Omit<Purchase, 'id' | 'reference' | 'createdAt'>) => void;
  receivePurchase: (id: string) => void;

  // Punto de Venta (SalesController ➔ salesService)
  addSale: (s: Omit<Sale, 'id' | 'reference' | 'createdAt' | 'status'>) => Sale;
  voidSale: (id: string) => void;

  // Caja Registradora y Arqueo (CashController ➔ cashService)
  openCash: (amount: number) => void;
  closeCash: (amount: number) => void;
  addCashMovement: (m: Omit<CashMovement, 'id' | 'createdAt' | 'userId' | 'userName' | 'reference'>) => void;
  activeCashSession: CashSession | null;

  // Configuración del Sistema (SettingsController ➔ settingsService)
  updateSettings: (s: Partial<CompanySettings>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

/** Propiedades base para controladores */
export interface BaseControllerProps {
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>;
  currentUser: User | null;
}
