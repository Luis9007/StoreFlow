import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingBag, Download, Search, Printer,
  Ban, Eye, FileText, Calendar, CreditCard, UserCheck, Package, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, Badge, EmptyState } from '@/views/components/ui/Card';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { Select, Input } from '@/views/components/ui/Input';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { formatCurrency, formatNumber, formatDateTime, isSameDay, daysAgo, cn, exportToExcel } from '@/lib/utils';
import type { Sale } from '@/models/types';

export function ReportsPage() {
  const { db, currentUser, voidSale } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canExport = canPerformAction(currentUser?.role, 'report.export');
  const canVoid = canPerformAction(currentUser?.role, 'pos.void');

  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');
  const [searchFolio, setSearchFolio] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const completedSales = useMemo(() => db.sales.filter((s) => s.status === 'completada'), [db.sales]);

  const filteredSales = useMemo(() => {
    if (period === 'all') return completedSales;
    const days = period === '7d' ? 7 : 30;
    return completedSales.filter((s) => new Date(s.createdAt) >= daysAgo(days));
  }, [completedSales, period]);

  // Sales matching search query across all sales (both completed and voided)
  const searchedSales = useMemo(() => {
    if (!searchFolio.trim()) return db.sales;
    const q = searchFolio.toLowerCase();
    return db.sales.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q) ||
        s.userName.toLowerCase().includes(q)
    );
  }, [db.sales, searchFolio]);

  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.total, 0);
  const totalCost = filteredSales.reduce((s, sale) => {
    return s + sale.items.reduce((cs, item) => {
      const prod = db.products.find((p) => p.id === item.productId);
      return cs + (prod?.cost ?? 0) * item.quantity;
    }, 0);
  }, 0);
  const profit = totalRevenue - totalCost;
  const avgTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

  // Sales over time
  const salesOverTime = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 60;
    const arr: { label: string; ventas: number; utilidad: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = daysAgo(i);
      const label = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(day);
      const daySales = completedSales.filter((s) => isSameDay(s.createdAt, day));
      const ventas = daySales.reduce((s, sale) => s + sale.total, 0);
      const cost = daySales.reduce((s, sale) => s + sale.items.reduce((cs, item) => {
        const prod = db.products.find((p) => p.id === item.productId);
        return cs + (prod?.cost ?? 0) * item.quantity;
      }, 0), 0);
      arr.push({ label, ventas, utilidad: ventas - cost });
    }
    return arr;
  }, [completedSales, period, db.products]);

  // Payment methods
  const paymentStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSales.forEach((s) => { counts[s.paymentMethod] = (counts[s.paymentMethod] ?? 0) + s.total; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredSales]);

  // Top products
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!counts[item.productId]) counts[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        counts[item.productId].qty += item.quantity;
        counts[item.productId].revenue += item.subtotal;
      });
    });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filteredSales]);

  // Sales by hour
  const salesByHour = useMemo(() => {
    const hours: { hour: string; ventas: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const count = filteredSales.filter((s) => new Date(s.createdAt).getHours() === h).length;
      hours.push({ hour: `${h}:00`, ventas: count });
    }
    return hours.filter((h) => h.ventas > 0);
  }, [filteredSales]);

  const exportExcel = () => {
    if (filteredSales.length === 0) {
      toast.warning('Sin ventas', 'No hay datos de ventas en este período para exportar');
      return;
    }
    const headers = ['Folio', 'Fecha y Hora', 'Cliente', 'Vendedor', 'Subtotal', 'Descuento', 'IVA', 'Total', 'Método Pago', 'Estado'];
    const rows = filteredSales.map((s) => [
      s.reference,
      formatDateTime(s.createdAt),
      s.customerName,
      s.userName,
      s.subtotal,
      s.discount || 0,
      s.tax,
      s.total,
      s.paymentMethod,
      s.status,
    ]);
    exportToExcel(`reporte_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows, 'Ventas');
    toast.success('Reporte exportado', 'El archivo de Excel (.xlsx) se descargó correctamente');
  };

  const handleVoidSale = (saleId: string) => {
    voidSale(saleId);
    toast.success('Venta anulada', 'Se ha revertido el estado y devuelto el inventario');
    setSelectedSale(null);
  };

  const metrics = [
    { label: 'Ingresos', value: formatCurrency(totalRevenue, sym), icon: DollarSign, color: 'from-primary to-teal-600' },
    { label: 'Utilidad', value: formatCurrency(profit, sym), icon: TrendingUp, color: 'from-success to-emerald-600' },
    { label: 'Ventas', value: formatNumber(filteredSales.length), icon: ShoppingBag, color: 'from-info to-blue-600' },
    { label: 'Ticket promedio', value: formatCurrency(avgTicket, sym), icon: BarChart3, color: 'from-accent to-orange-500' },
  ];

  const saleColumns: Column<Sale>[] = [
    {
      key: 'reference',
      header: 'Folio',
      render: (s) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text font-mono">{s.reference}</span>
          {s.status === 'anulada' && <Badge variant="danger">Anulada</Badge>}
        </div>
      ),
    },
    { key: 'createdAt', header: 'Fecha', render: (s) => <span className="text-muted text-xs">{formatDateTime(s.createdAt)}</span> },
    { key: 'customerName', header: 'Cliente', render: (s) => <span className="font-medium text-text">{s.customerName}</span> },
    { key: 'userName', header: 'Vendedor', render: (s) => <span className="text-muted text-xs">{s.userName}</span> },
    { key: 'paymentMethod', header: 'Pago', render: (s) => <Badge variant="info" className="capitalize">{s.paymentMethod}</Badge> },
    { key: 'total', header: 'Total', align: 'right', render: (s) => <span className={cn('font-bold', s.status === 'anulada' ? 'line-through text-muted' : 'text-text')}>{formatCurrency(s.total, sym)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <Button size="sm" variant="ghost" onClick={() => setSelectedSale(s)}>
          <Eye className="h-4 w-4" /> Detalle
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Reportes' }]} />
      <PageHeader
        title="Reportes & Historial de Ventas"
        description="Métricas financieras y búsqueda completa de ventas por número de folio"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | 'all')} className="w-32">
              <option value="7d">7 días</option>
              <option value="30d">30 días</option>
              <option value="all">Todo</option>
            </Select>
            {canExport && <Button variant="outline" onClick={exportExcel}><Download className="h-4 w-4" /> Exportar a Excel</Button>}
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card hover><CardContent className="p-5">
              <div className={cn('h-11 w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md', m.color)}>
                <m.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-muted mt-4">{m.label}</p>
              <p className="font-display font-bold text-2xl text-text mt-1">{m.value}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* SEARCH BY FOLIO NUMBER CARD */}
      <Card className="mb-6 border-primary/30 shadow-md bg-surface">
        <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" /> Búsqueda de Ventas por Número de Folio
            </CardTitle>
            <p className="text-xs text-muted mt-0.5">Ingresa el folio (ej. V-2026-00001), nombre de cliente o cajero para consultar cualquier recibo</p>
          </div>
          <Badge variant="primary">{searchedSales.length} venta{searchedSales.length !== 1 ? 's' : ''}</Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              value={searchFolio}
              onChange={(e) => setSearchFolio(e.target.value)}
              placeholder="Buscar por folio (ej. V-2026-00001), cliente, método de pago..."
              className="pl-10 h-11 text-sm bg-surface-2/50"
            />
          </div>

          {searchedSales.length === 0 ? (
            <EmptyState icon={<FileText className="h-8 w-8" />} title="No se encontraron ventas" description="Intenta con otro número de folio o nombre de cliente." />
          ) : (
            <DataTable columns={saleColumns} data={searchedSales} rowKey={(s) => s.id} onRowClick={(s) => setSelectedSale(s)} />
          )}
        </CardContent>
      </Card>

      {/* Sales chart */}
      <Card className="mb-6">
        <CardHeader><CardTitle>Ventas y utilidad</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesOverTime} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cVentas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} /></linearGradient>
                <linearGradient id="cUtil" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} /><stop offset="95%" stopColor="#16a34a" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--sf-border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} />
              <Tooltip contentStyle={{ background: 'rgb(var(--sf-surface))', border: '1px solid rgb(var(--sf-border))', borderRadius: '0.75rem', fontSize: '0.875rem' }} formatter={(v) => formatCurrency(Number(v), sym)} />
              <Area type="monotone" dataKey="ventas" stroke="#0d9488" strokeWidth={2.5} fill="url(#cVentas)" name="Ventas" />
              <Area type="monotone" dataKey="utilidad" stroke="#16a34a" strokeWidth={2.5} fill="url(#cUtil)" name="Utilidad" />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Payment methods */}
        <Card>
          <CardHeader><CardTitle>Métodos de pago</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <RBarChart data={paymentStats} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--sf-border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} />
                <Tooltip contentStyle={{ background: 'rgb(var(--sf-surface))', border: '1px solid rgb(var(--sf-border))', borderRadius: '0.75rem', fontSize: '0.875rem' }} formatter={(v) => formatCurrency(Number(v), sym)} />
                <Bar dataKey="value" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={40} />
              </RBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by hour */}
        <Card>
          <CardHeader><CardTitle>Ventas por hora</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesByHour} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--sf-border))" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'rgb(var(--sf-muted))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgb(var(--sf-surface))', border: '1px solid rgb(var(--sf-border))', borderRadius: '0.75rem', fontSize: '0.875rem' }} />
                <Line type="monotone" dataKey="ventas" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top products */}
      <Card>
        <CardHeader><CardTitle>Productos más vendidos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {topProducts.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">Sin datos para este período</div>
          ) : (
            <div className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{p.name}</p>
                    <p className="text-xs text-muted">{p.qty} unidades vendidas</p>
                  </div>
                  <span className="font-semibold text-text">{formatCurrency(p.revenue, sym)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Sale Dialog Modal */}
      <Dialog
        open={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Detalle de Venta: ${selectedSale?.reference}`}
        size="md"
        footer={
          selectedSale && (
            <div className="flex items-center justify-between w-full">
              <div>
                {canVoid && selectedSale.status === 'completada' && (
                  <Button variant="danger" onClick={() => handleVoidSale(selectedSale.id)}>
                    <Ban className="h-4 w-4" /> Anular Venta
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> Reimprimir Ticket
                </Button>
                <Button onClick={() => setSelectedSale(null)}>Cerrar</Button>
              </div>
            </div>
          )
        }
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-2 border border-border text-xs">
              <div><span className="text-muted">Folio:</span> <strong className="text-text block">{selectedSale.reference}</strong></div>
              <div><span className="text-muted">Fecha:</span> <span className="text-text block">{formatDateTime(selectedSale.createdAt)}</span></div>
              <div><span className="text-muted">Cliente:</span> <strong className="text-text block">{selectedSale.customerName}</strong></div>
              <div><span className="text-muted">Atendido por:</span> <span className="text-text block">{selectedSale.userName}</span></div>
              <div><span className="text-muted">Forma de pago:</span> <span className="text-text capitalize block">{selectedSale.paymentMethod}</span></div>
              <div><span className="text-muted">Estado:</span> <Badge variant={selectedSale.status === 'completada' ? 'success' : 'danger'}>{selectedSale.status}</Badge></div>
            </div>

            {/* Items Table */}
            <div>
              <p className="text-xs font-bold text-text mb-2 flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-primary" /> Productos en la venta
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-2 text-muted font-semibold">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2 text-center">Cant.</th>
                      <th className="p-2 text-right">Precio</th>
                      <th className="p-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-2/30">
                        <td className="p-2 font-medium text-text">{item.productName}</td>
                        <td className="p-2 text-center text-text font-medium">{item.quantity}</td>
                        <td className="p-2 text-right text-muted">{formatCurrency(item.price, sym)}</td>
                        <td className="p-2 text-right font-semibold text-text">{formatCurrency(item.subtotal, sym)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="p-3 rounded-xl bg-surface-2 border border-border text-xs space-y-1">
              <div className="flex justify-between"><span className="text-muted">Subtotal:</span><span>{formatCurrency(selectedSale.subtotal, sym)}</span></div>
              <div className="flex justify-between"><span className="text-muted">IVA ({db.settings.taxRate}%):</span><span>{formatCurrency(selectedSale.tax, sym)}</span></div>
              <div className="flex justify-between font-bold text-sm text-text pt-1 border-t border-border">
                <span>Total:</span>
                <span className="text-primary font-display text-base">{formatCurrency(selectedSale.total, sym)}</span>
              </div>
              {selectedSale.paymentMethod === 'efectivo' && (
                <>
                  <div className="flex justify-between text-muted pt-1 border-t border-border"><span className="text-muted">Efectivo recibido:</span><span>{formatCurrency(selectedSale.cashReceived, sym)}</span></div>
                  <div className="flex justify-between text-muted"><span className="text-muted">Cambio devuelto:</span><span className="font-semibold text-success">{formatCurrency(selectedSale.change, sym)}</span></div>
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Hidden printable receipt for selectedSale */}
      {selectedSale && (
        <div id="printable-receipt" className="hidden print:block">
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px 0' }}>{db.settings.name}</h2>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>{db.settings.legalName}</p>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>NIT / Tax ID: {db.settings.taxId}</p>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>{db.settings.address}</p>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>Tel: {db.settings.phone}</p>
            <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>{db.settings.email}</p>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ fontSize: '10px' }}>
            <p style={{ margin: '2px 0', textAlign: 'center', fontWeight: 'bold' }}>*** REIMPRESIÓN TICKET DE VENTA ***</p>
            <p style={{ margin: '2px 0' }}>Folio: <strong>{selectedSale.reference}</strong></p>
            <p style={{ margin: '2px 0' }}>Fecha: {formatDateTime(selectedSale.createdAt)}</p>
            <p style={{ margin: '2px 0' }}>Cliente: <strong>{selectedSale.customerName}</strong></p>
            <p style={{ margin: '2px 0' }}>Atendido por: {selectedSale.userName}</p>
            <p style={{ margin: '2px 0' }}>Pago: <span style={{ textTransform: 'capitalize' }}>{selectedSale.paymentMethod}</span></p>
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                <th style={{ paddingBottom: '3px' }}>CANT PRODUCTO</th>
                <th style={{ paddingBottom: '3px', textAlign: 'right' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {selectedSale.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ paddingTop: '3px', verticalAlign: 'top' }}>
                    {item.quantity}x {item.productName}
                    <br />
                    <span style={{ fontSize: '9px', color: '#444' }}>@ {formatCurrency(item.price, sym)}</span>
                  </td>
                  <td style={{ paddingTop: '3px', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                    {formatCurrency(item.subtotal, sym)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

          <div style={{ fontSize: '10px', textAlign: 'right' }}>
            <p style={{ margin: '2px 0' }}>Subtotal: {formatCurrency(selectedSale.subtotal, sym)}</p>
            <p style={{ margin: '2px 0' }}>IVA ({db.settings.taxRate}%): {formatCurrency(selectedSale.tax, sym)}</p>
            <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: 'bold' }}>TOTAL: {formatCurrency(selectedSale.total, sym)}</p>
            {selectedSale.paymentMethod === 'efectivo' && (
              <>
                <p style={{ margin: '2px 0' }}>Recibido: {formatCurrency(selectedSale.cashReceived, sym)}</p>
                <p style={{ margin: '2px 0' }}>Cambio: {formatCurrency(selectedSale.change, sym)}</p>
              </>
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0 4px 0' }} />

          <div style={{ textAlign: 'center', fontSize: '10px' }}>
            <p style={{ margin: '2px 0', fontWeight: 'bold' }}>¡GRACIAS POR SU COMPRA!</p>
            <p style={{ margin: '2px 0', fontSize: '9px' }}>Conserve este comprobante</p>
            <p style={{ margin: '2px 0', fontSize: '9px', color: '#555' }}>StoreFlow POS System</p>
          </div>
        </div>
      )}
    </div>
  );
}
