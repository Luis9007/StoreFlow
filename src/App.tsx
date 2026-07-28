import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from '@/controllers/StoreController';
import { ToastProvider } from '@/views/components/ui/Toast';
import { ErrorBoundary } from '@/views/components/ui/ErrorBoundary';
import { canAccessModule, type ModuleKey } from '@/controllers/permissions';
import { AppLayout } from '@/views/components/layout/AppLayout';
import { LoginPage } from '@/views/pages/LoginPage';
import { DashboardPage } from '@/views/pages/DashboardPage';
import { POSPage } from '@/views/pages/POSPage';
import { ProductsPage } from '@/views/pages/ProductsPage';
import { InventoryPage } from '@/views/pages/InventoryPage';
import { PurchasesPage } from '@/views/pages/PurchasesPage';
import { CustomersPage } from '@/views/pages/CustomersPage';
import { SuppliersPage } from '@/views/pages/SuppliersPage';
import { CashPage } from '@/views/pages/CashPage';
import { ReportsPage } from '@/views/pages/ReportsPage';
import { SettingsPage } from '@/views/pages/SettingsPage';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ModuleGuard({ module, children }: { module: ModuleKey; children: ReactNode }) {
  const { currentUser } = useStore();
  if (!canAccessModule(currentUser?.role, module)) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="pos" element={<ModuleGuard module="pos"><POSPage /></ModuleGuard>} />
        <Route path="products" element={<ModuleGuard module="products"><ProductsPage /></ModuleGuard>} />
        <Route path="inventory" element={<ModuleGuard module="inventory"><InventoryPage /></ModuleGuard>} />
        <Route path="purchases" element={<ModuleGuard module="purchases"><PurchasesPage /></ModuleGuard>} />
        <Route path="customers" element={<ModuleGuard module="customers"><CustomersPage /></ModuleGuard>} />
        <Route path="suppliers" element={<ModuleGuard module="suppliers"><SuppliersPage /></ModuleGuard>} />
        <Route path="cash" element={<ModuleGuard module="cash"><CashPage /></ModuleGuard>} />
        <Route path="reports" element={<ModuleGuard module="reports"><ReportsPage /></ModuleGuard>} />
        <Route path="settings" element={<ModuleGuard module="settings"><SettingsPage /></ModuleGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
