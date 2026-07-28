/**
 * @file StoreController.tsx
 * @description Controlador Principal y Proveedor de Contexto Global de React (`StoreProvider` y `useStore`).
 * 
 * ARQUITECTURA DE INTEGRACIÓN SERVICIOS ↔ CONTROLADORES:
 * 1. Inicialización e Hidratación de Datos:
 *    En el `useEffect` inicial (líneas 122-172), `StoreController` llama en paralelo a todos los servicios de lectura:
 *    • `authService.fetchUsers()`
 *    • `productService.fetchProductsData()`
 *    • `customerService.fetchCustomers()`
 *    • `purchaseService.fetchPurchasesData()`
 *    • `salesService.fetchSalesData()`
 *    • `cashService.fetchCashData()`
 *    • `settingsService.fetchSettingsAndLogs()`
 *    Y asigna el resultado a la base de datos en memoria (`db`).
 * 
 * 2. Orquestación de Controladores de Dominio:
 *    Instancia y conecta todos los Hooks controladores especificos:
 *    • `useAuthController`
 *    • `useCashController`
 *    • `useProductController`
 *    • `useCustomerController`
 *    • `usePurchaseController`
 *    • `useSalesController`
 *    • `useSettingsController`
 * 
 * 3. Motor de Sincronización Automática (AutoSync):
 *    Un intervalo periódico (cada 15 segundos) invoca `syncService.processPendingQueue()` para enviar
 *    a Supabase cualquier transacción creada durante desconexión a internet.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppDatabase, ActivityLog, User } from '../models/types';
import { seedDatabase } from '../models/seed';
import { generateId } from '../lib/utils';
import { isSupabaseConfigured } from '../models/supabase';
import type { StoreContextValue } from './types';

// Importación de la Capa de Servicios (Data Access / API REST)
import { authService } from '../services/authService';
import { cashService } from '../services/cashService';
import { productService } from '../services/productService';
import { customerService } from '../services/customerService';
import { purchaseService } from '../services/purchaseService';
import { salesService } from '../services/salesService';
import { settingsService } from '../services/settingsService';
import { syncService } from '../services/syncService';

// Importación de la Capa de Controladores de Dominio (State & Business Logic)
import { useAuthController } from './AuthController';
import { useCashController } from './CashController';
import { useProductController } from './ProductController';
import { useCustomerController } from './CustomerController';
import { usePurchaseController } from './PurchaseController';
import { useSalesController } from './SalesController';
import { useSettingsController } from './SettingsController';

const STORAGE_KEY = 'storeflow_local_db_v2';

/**
 * Carga el estado de la base de datos desde `localStorage` en caso de no contar con conexión a Supabase.
 */
function loadDbFromStorage(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppDatabase) : structuredClone(seedDatabase);
  } catch {
    return structuredClone(seedDatabase);
  }
}

/**
 * Guarda la base de datos en `localStorage`.
 */
function saveDbToStorage(db: AppDatabase) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Creación del contexto global de React
const StoreContext = createContext<StoreContextValue | null>(null);

/**
 * Proveedor principal de la aplicación que envuelve a los componentes UI y provee el estado global.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase>(loadDbFromStorage);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(isSupabaseConfigured);
  const currentUserRef = useRef<User | null>(null);

  /**
   * Registrador global de eventos y bitácora de auditoría.
   * Agrega la entrada a `db.logs` en memoria y la persiste en el backend mediante `settingsService.insertLog(log)`.
   */
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

  // 1. Controlador de Dominio: Autenticación y Usuarios
  const {
    currentUser,
    login,
    logout,
    upsertUser,
    deleteUser,
  } = useAuthController(db, setDb, addLog);

  currentUserRef.current = currentUser;

  // 2. Controlador de Dominio: Caja y Arqueos
  const {
    activeCashSession,
    logSessionMovement,
    openCash,
    closeCash,
    addCashMovement,
  } = useCashController(db, setDb, currentUser, addLog);

  // 3. Controlador de Dominio: Productos e Inventario
  const {
    upsertCategory,
    upsertProduct,
    deleteProduct,
    adjustStock,
  } = useProductController(setDb, currentUser, logSessionMovement, addLog);

  // 4. Controlador de Dominio: Clientes y Cartera de Crédito
  const {
    upsertCustomer,
    deleteCustomer,
    addCustomerPayment,
  } = useCustomerController(db, setDb, currentUser, activeCashSession, logSessionMovement, addLog);

  // 5. Controlador de Dominio: Proveedores y Compras
  const {
    upsertSupplier,
    deleteSupplier,
    addPurchase,
    receivePurchase,
  } = usePurchaseController(db, setDb, logSessionMovement, addLog);

  // 6. Controlador de Dominio: Ventas y Facturación
  const {
    addSale,
    voidSale,
  } = useSalesController(db, setDb, addLog);

  // 7. Controlador de Dominio: Ajustes y Tema Visual
  const {
    updateSettings,
    setTheme,
    resetData,
  } = useSettingsController(db, setDb, addLog);

  /**
   * Hidratación Inicial de Datos desde la API de Supabase vía Servicios.
   * Ejecuta peticiones GET concurrentes al arrancar la aplicación.
   */
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

        // Carga los datos leídos de la API o mantiene la semilla si están vacíos
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

  /**
   * Guarda automáticamente los cambios en LocalStorage en modo Standalone (sin Supabase).
   */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      saveDbToStorage(db);
    }
  }, [db]);

  /**
   * Motor de Auto-Sincronización de Transacciones Offline.
   * Monitorea la red y procesa la cola de `syncService` cada 15 segundos.
   */
  useEffect(() => {
    let isProcessing = false;

    async function triggerAutoSync() {
      if (isProcessing || !isSupabaseConfigured) return;
      isProcessing = true;
      try {
        const queue = syncService.getPendingQueue();
        if (queue.length > 0) {
          const { success } = await syncService.processPendingQueue();
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

  // Consolidación de todos los estados y funciones de los controladores en el objeto de contexto
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

/**
 * Hook de consumidor para acceder fácilmente al contexto `StoreContext` desde cualquier componente React.
 */
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
