import type {
  AppDatabase,
  User,
  Category,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  CashSession,
  CashMovement,
  CompanySettings,
  PaymentMethod,
  CashMovementType,
} from '../models/types';

export interface StoreContextValue {
  db: AppDatabase;
  currentUser: User | null;
  isLoadingDb: boolean;
  isSupabaseActive: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  resetData: () => void;
  addLog: (action: string, detail: string) => void;

  upsertUser: (u: User) => void;
  deleteUser: (id: string) => void;

  upsertCategory: (c: Category) => void;

  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, newStock: number, reason: string, type: 'entrada' | 'salida' | 'ajuste') => void;

  upsertCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;
  addCustomerPayment: (customerId: string, amount: number, paymentMethod?: PaymentMethod, notes?: string) => void;

  upsertSupplier: (s: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addPurchase: (p: Omit<Purchase, 'id' | 'reference' | 'createdAt'>) => void;
  receivePurchase: (id: string) => void;

  addSale: (s: Omit<Sale, 'id' | 'reference' | 'createdAt' | 'status'>) => Sale;
  voidSale: (id: string) => void;

  openCash: (amount: number) => void;
  closeCash: (amount: number) => void;
  addCashMovement: (m: Omit<CashMovement, 'id' | 'createdAt' | 'userId' | 'userName' | 'reference'>) => void;
  activeCashSession: CashSession | null;

  updateSettings: (s: Partial<CompanySettings>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export interface BaseControllerProps {
  setDb: React.Dispatch<React.SetStateAction<AppDatabase>>;
  currentUser: User | null;
}
