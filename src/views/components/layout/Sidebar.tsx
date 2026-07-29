import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Wallet,
  BarChart3, Settings, Receipt, Boxes, LogOut, X,
} from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { canAccessModule, roleLabels, type ModuleKey } from '@/controllers/permissions';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const allNavItems = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true, module: 'dashboard' as ModuleKey },
  { to: '/app/pos', label: 'Punto de Venta', icon: ShoppingCart, module: 'pos' as ModuleKey },
  { to: '/app/products', label: 'Productos', icon: Package, module: 'products' as ModuleKey },
  { to: '/app/inventory', label: 'Inventario', icon: Boxes, module: 'inventory' as ModuleKey },
  { to: '/app/purchases', label: 'Compras', icon: Receipt, module: 'purchases' as ModuleKey },
  { to: '/app/customers', label: 'Clientes', icon: Users, module: 'customers' as ModuleKey },
  { to: '/app/suppliers', label: 'Proveedores', icon: Truck, module: 'suppliers' as ModuleKey },
  { to: '/app/cash', label: 'Caja', icon: Wallet, module: 'cash' as ModuleKey },
  { to: '/app/reports', label: 'Reportes', icon: BarChart3, module: 'reports' as ModuleKey },
  { to: '/app/settings', label: 'Configuración', icon: Settings, module: 'settings' as ModuleKey },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { db, currentUser, logout } = useStore();
  const navigate = useNavigate();

  const navItems = allNavItems.filter((item) => canAccessModule(currentUser?.role, item.module));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const storeName = db.settings.name || 'StoreFlow';

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-64 bg-sidebar text-sidebar-fg z-40 flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shrink-0">
              <span className="font-display font-bold text-white text-lg">
                {storeName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-white text-sm leading-tight truncate" title={storeName}>
                {storeName}
              </p>
              <p className="text-[10px] text-sidebar-fg/60 mt-0.5 truncate">
                {db.settings.legalName || 'POS & Gestión'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-sidebar-fg/60 hover:text-white shrink-0 ml-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 sf-no-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary text-primary-fg shadow-md'
                    : 'text-sidebar-fg hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-[18px] w-[18px] shrink-0', !isActive && 'group-hover:scale-110 transition-transform')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-sidebar-fg/60">{currentUser ? roleLabels[currentUser.role] : ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-sidebar-fg/60 hover:bg-danger/20 hover:text-danger transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
