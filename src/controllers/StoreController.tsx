import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppDatabase, ActivityLog, User } from '../models/types';
import { seedDatabase } from '../models/seed';
import { generateId } from '../lib/utils';
import { isSupabaseConfigured } from '../models/supabase';
import type { StoreContextValue } from './types';

import { authService } from '../services/authService';
import { cashService } from '../services/cashService';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { purchaseService } from '../services/purchaseService';
import { salesService } from '../services/salesService';
import { settingsService } from '../services/settingsService';
import { syncService } from '../services/syncService';

import { useAuthController } from './AuthController';
import { useCashController } from './CashController';
import { useProductController } from './ProductController';
import { useCustomerController } from './CustomerController';
import { usePurchaseController } from './PurchaseController';
import { useSalesController } from './SalesController';
import { useSettingsController } from './SettingsController';

const STORAGE_KEY = 'storeflow_local_db_v2';

function loadDbFromStorage(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppDatabase) : structuredClone(seedDatabase);
  } catch {
    return structuredClone(seedDatabase);
  }
}

function saveDbToStorage(db: AppDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase>(loadDbFromStorage);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(isSupabaseConfigured);
  const currentUserRef = useRef<User | null>(null);

  // Activity Logging
  const addLog = useCallback(
    (action: string, detail: string) => {
      const u = currentUserRef.current;
      const log: ActivityLog = {
        id: generateId('log'),
        action,
        detail,
        userId: u?.id ?? 'system',
        userName: u?.name ?? 'Sistema',
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({ ...prev, logs: [log, ...prev.logs].slice(0, 200) }));
      settingsService.insertLog(log).catch(console.error);
    },
    []
  );

  // 1. Domain Controller: Auth
  const {
    currentUser,
    login,
    logout,
    upsertUser,
    deleteUser,
  } = useAuthController(db, setDb, addLog);

  currentUserRef.current = currentUser;

  // 2. Domain Controller: Cash
  const {
    activeCashSession,
    logSessionMovement,
    openCash,
    closeCash,
    addCashMovement,
  } = useCashController(db, setDb, currentUser, addLog);

  // 3. Domain Controller: Products & Stock
  const {
    upsertCategory,
    upsertProduct,
    deleteProduct,
    adjustStock,
  } = useProductController(setDb, currentUser, logSessionMovement, addLog);

  // 4. Domain Controller: Customers
  const {
    upsertCustomer,
    deleteCustomer,
    addCustomerPayment,
  } = useCustomerController(db, setDb, currentUser, activeCashSession, logSessionMovement, addLog);

  // 5. Domain Controller: Suppliers & Purchases
  const {
    upsertSupplier,
    deleteSupplier,
    addPurchase,
    receivePurchase,
  } = usePurchaseController(db, setDb, logSessionMovement, addLog);

  // 6. Domain Controller: Sales
  const {
    addSale,
    voidSale,
  } = useSalesController(db, setDb, addLog);

  // 7. Domain Controller: Settings & Theme
  const {
    updateSettings,
    setTheme,
    resetData,
  } = useSettingsController(db, setDb, addLog);

  // Initial Supabase Data Hydration via Services
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    async function fetchAllData() {
      setIsLoadingDb(true);
      try {
        const [
          users,
          { categories, brands, products, adjustments },
          customers,
          { suppliers, purchases },
          sales,
          { cashSessions },
          { settings, logs },
        ] = await Promise.all([
          authService.fetchUsers(),
          productService.fetchProductsData(),
          customerService.fetchCustomers(),
          purchaseService.fetchPurchasesData(),
          salesService.fetchSalesData(),
          cashService.fetchCashData(),
          settingsService.fetchSettingsAndLogs(),
        ]);

        if (!isMounted) return;

        setDb({
          users: users.length > 0 ? users : seedDatabase.users,
          categories: categories.length > 0 ? categories : seedDatabase.categories,
          brands: brands.length > 0 ? brands : seedDatabase.brands,
          products: products.length > 0 ? products : seedDatabase.products,
          customers: customers.length > 0 ? customers : seedDatabase.customers,
          suppliers: suppliers.length > 0 ? suppliers : seedDatabase.suppliers,
          purchases,
          sales,
          cashSessions,
          adjustments,
          settings,
          logs,
        });
      } catch (err) {
        console.error('Error fetching data from services:', err);
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    }

    fetchAllData();
    return () => { isMounted = false; };
  }, []);

  // Save to LocalStorage when Supabase is not configured
  useEffect(() => {
    if (!isSupabaseConfigured) {
      saveDbToStorage(db);
    }
  }, [db]);

  // Offline Queue Heartbeat & Auto-Sync Engine
  useEffect(() => {
    let isProcessing = false;

    async function triggerAutoSync() {
      if (isProcessing || !isSupabaseConfigured) return;
      isProcessing = true;
      try {
        const queue = syncService.getPendingQueue();
        if (queue.length > 0) {
          const { success, failed } = await syncService.processPendingQueue();
          if (success > 0) {
            console.log(`[AutoSync] Sincronizados con éxito ${success} registros pendientes con Supabase.`);
          }
        }
      } catch (err) {
        console.error('[AutoSync] Error durante la auto-sincronización:', err);
      } finally {
        isProcessing = false;
      }
    }

    const interval = setInterval(triggerAutoSync, 15000);
    window.addEventListener('online', triggerAutoSync);

    triggerAutoSync();

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', triggerAutoSync);
    };
  }, []);

  const value: StoreContextValue = {
    db,
    currentUser,
    isLoadingDb,
    isSupabaseActive: isSupabaseConfigured,
    login,
    logout,
    upsertUser,
    deleteUser,
    resetData,
    addLog,
    upsertCategory,
    upsertProduct,
    deleteProduct,
    adjustStock,
    upsertCustomer,
    deleteCustomer,
    addCustomerPayment,
    upsertSupplier,
    deleteSupplier,
    addPurchase,
    receivePurchase,
    addSale,
    voidSale,
    openCash,
    closeCash,
    addCashMovement,
    activeCashSession,
    updateSettings,
    setTheme,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
