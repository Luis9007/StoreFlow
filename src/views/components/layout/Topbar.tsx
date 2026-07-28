import { useState } from 'react';
import { Menu, Moon, Sun, Bell, Search } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { db, setTheme, activeCashSession } = useStore();
  const [showNotif, setShowNotif] = useState(false);

  const lowStockCount = db.products.filter((p) => p.stock <= p.minStock).length;
  const notifs = [
    ...(lowStockCount > 0 ? [{ icon: '⚠️', text: `${lowStockCount} producto(s) con stock bajo` }] : []),
    ...(activeCashSession ? [{ icon: '🟢', text: 'Caja abierta' }] : [{ icon: '🔴', text: 'Caja cerrada' }]),
  ];

  return (
    <header className="sticky top-0 z-20 h-16 sf-glass border-b border-border flex items-center px-4 lg:px-6 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-surface-2 text-text">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-2 border border-transparent text-sm text-text placeholder:text-muted focus:outline-none focus:border-primary/30 focus:bg-surface transition-all"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotif((s) => !s)}
          className="relative p-2 rounded-xl hover:bg-surface-2 text-text transition-colors"
        >
          <Bell className="h-5 w-5" />
          {lowStockCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </button>
        {showNotif && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
            <div className="absolute right-0 top-full mt-2 w-72 sf-card bg-surface rounded-xl shadow-float p-2 z-20 animate-scale-in">
              <p className="px-3 py-2 text-xs font-semibold text-muted uppercase">Notificaciones</p>
              {notifs.map((n, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 cursor-pointer">
                  <span className="text-lg">{n.icon}</span>
                  <span className="text-sm text-text">{n.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(db.settings.theme === 'dark' ? 'light' : 'dark')}
        className="p-2 rounded-xl hover:bg-surface-2 text-text transition-colors"
        title="Cambiar tema"
      >
        {db.settings.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  );
}
