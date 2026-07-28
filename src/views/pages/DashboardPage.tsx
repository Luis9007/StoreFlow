import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown,
  AlertTriangle, ArrowUpRight, Plus, Wallet, Receipt, Boxes,
} from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { canAccessModule, type ModuleKey } from '@/controllers/permissions';
import { Card, CardContent, CardHeader, CardTitle, Badge, EmptyState } from '@/views/components/ui/Card';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { formatCurrency, formatNumber, isSameDay, isThisMonth, daysAgo } from '@/lib/utils';

export function DashboardPage() {
  const { db, currentUser } = useStore();
  const sym = db.settings.currencySymbol;

  const stats = useMemo(() => {
    const completed = db.sales.filter((s) => s.status === 'completada');
    const todaySales = completed.filter((s) => isSameDay(s.createdAt, new Date()));
    const monthSales = completed.filter((s) => isThisMonth(s.createdAt));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.total, 0);
    const monthCost = monthSales.reduce((sum, s) => {
      return sum + s.items.reduce((cs, item) => {
        const prod = db.products.find((p) => p.id === item.productId);
        return cs + (prod?.cost ?? 0) * item.quantity;
      }, 0);
    }, 0);
    const profit = monthRevenue - monthCost;
    const newCustomers = db.customers.filter((c) => isThisMonth(c.createdAt)).length;
    const lowStock = db.products.filter((p) => p.stock <= p.minStock);

    return {
      todayRevenue,
      todayCount: todaySales.length,
      monthRevenue,
      monthCount: monthSales.length,
      profit,
      newCustomers,
      lowStock,
    };
  }, [db.sales, db.products, db.customers]);

  const salesChart = useMemo(() => {
    const days: { date: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = daysAgo(i);
      const label = new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(day);
      const total = db.sales
        .filter((s) => s.status === 'completada' && isSameDay(s.createdAt, day))
        .reduce((sum, s) => sum + s.total, 0);
      days.push({ date: day.toISOString(), label, total });
    }
    return days;
  }, [db.sales]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; total: number }> = {};
    db.sales.filter((s) => s.status === 'completada').forEach((sale) => {
      sale.items.forEach((item) => {
        if (!counts[item.productId]) counts[item.productId] = { name: item.productName, qty: 0, total: 0 };
        counts[item.productId].qty += item.quantity;
        counts[item.productId].total += item.subtotal;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [db.sales]);

  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    db.products.forEach((p) => {
      const cat = db.categories.find((c) => c.id === p.categoryId);
      const name = cat?.name ?? 'Sin categoría';
      counts[name] = (counts[name] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [db.products, db.categories]);

  const recentActivity = useMemo(() => db.logs.slice(0, 6), [db.logs]);

  const metrics = [
    { label: 'Ventas de hoy', value: formatCurrency(stats.todayRevenue, sym), sub: `${stats.todayCount} ventas`, icon: DollarSign, color: 'from-primary to-teal-600', trend: '+12%' },
    { label: 'Ventas del mes', value: formatCurrency(stats.monthRevenue, sym), sub: `${stats.monthCount} ventas`, icon: ShoppingBag, color: 'from-info to-blue-600', trend: '+8%' },
    { label: 'Utilidad del mes', value: formatCurrency(stats.profit, sym), sub: 'Ingresos - Costos', icon: TrendingUp, color: 'from-success to-emerald-600', trend: '+15%' },
    { label: 'Clientes nuevos', value: formatNumber(stats.newCustomers), sub: 'Este mes', icon: Users, color: 'from-accent to-orange-500', trend: '+5%' },
  ];

  const quickActions = [
    { label: 'Nueva venta', to: '/app/pos', icon: ShoppingBag, color: 'bg-primary', module: 'pos' as ModuleKey },
    { label: 'Abrir caja', to: '/app/cash', icon: Wallet, color: 'bg-info', module: 'cash' as ModuleKey },
    { label: 'Registrar compra', to: '/app/purchases', icon: Receipt, color: 'bg-accent', module: 'purchases' as ModuleKey },
    { label: 'Ver inventario', to: '/app/inventory', icon: Boxes, color: 'bg-success', module: 'inventory' as ModuleKey },
  ].filter((a) => canAccessModule(currentUser?.role, a.module));

  const pieColors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio' }, { label: 'Dashboard' }]} className="mb-3" />
      <PageHeader
        title={`Hola, ${currentUser?.name.split(' ')[0]}`}
        description="Resumen general de tu tienda"
        actions={
          <Link to="/app/pos">
            <span className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-primary-fg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" /> Nueva venta
            </span>
          </Link>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card hover className="overflow-hidden relative">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-md`}>
                    <m.icon className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="success" size="sm">
                    <TrendingUp className="h-3 w-3" /> {m.trend}
                  </Badge>
                </div>
                <p className="text-sm text-muted mt-4">{m.label}</p>
                <p className="font-display font-bold text-2xl text-text mt-1">{m.value}</p>
                <p className="text-xs text-muted mt-1">{m.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quickActions.map((a, i) => (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link to={a.to}>
              <Card hover className="p-4 flex items-center gap-3 group cursor-pointer">
                <div className={`h-10 w-10 rounded-xl ${a.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <a.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-text">{a.label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted ml-auto group-hover:text-primary transition-colors" />
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Sales chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Ventas de la semana</CardTitle>
              <p className="text-sm text-muted mt-1">Tendencia de ingresos diarios</p>
            </div>
            <Badge variant="primary">{sym}{formatNumber(Math.round(salesChart.reduce((s, d) => s + d.total, 0)))}</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={salesChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--sf-border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} />
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--sf-surface))', border: '1px solid rgb(var(--sf-border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                  formatter={(v) => [formatCurrency(Number(v), sym), 'Ventas']}
                />
                <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2.5} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Productos por categoría</CardTitle>
            <p className="text-sm text-muted mt-1">Distribución del catálogo</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {categoryDist.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'rgb(var(--sf-surface))', border: '1px solid rgb(var(--sf-border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <EmptyState title="Sin ventas registradas" description="Aún no hay datos de productos vendidos" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--sf-border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip
                    contentStyle={{ background: 'rgb(var(--sf-surface))', border: '1px solid rgb(var(--sf-border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                    formatter={(v) => [`${v} unidades`, 'Vendidas']}
                  />
                  <Bar dataKey="qty" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Stock bajo</CardTitle>
              <p className="text-sm text-muted mt-1">Productos agotándose</p>
            </div>
            <Badge variant="danger">{stats.lowStock.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[280px] overflow-y-auto sf-no-scrollbar">
            {stats.lowStock.length === 0 ? (
              <EmptyState icon={<Package className="h-10 w-10" />} title="Todo en orden" description="No hay productos con stock bajo" />
            ) : (
              stats.lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-2">
                  <div className="h-9 w-9 rounded-lg bg-danger/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{p.name}</p>
                    <p className="text-xs text-muted">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-danger">{p.stock}</p>
                    <p className="text-xs text-muted">mín: {p.minStock}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState title="Sin actividad" />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <span className="text-text font-medium">{log.userName}</span>
                    <span className="text-muted"> — {log.detail}</span>
                  </div>
                  <span className="text-xs text-muted">
                    {new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }).format(new Date(log.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
