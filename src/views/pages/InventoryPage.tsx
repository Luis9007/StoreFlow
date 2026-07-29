import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, AlertTriangle, TrendingUp, TrendingDown, Settings2, Search, ArrowDownToLine, ArrowUpFromLine, Sliders } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Select, Textarea } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import type { Product, InventoryAdjustment } from '@/models/types';

export function InventoryPage() {
  const { db, adjustStock, currentUser } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canAdjust = canPerformAction(currentUser?.role, 'inventory.adjust');

  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'stock' | 'kardex'>('stock');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>(filterParam === 'low-stock' ? 'low' : 'all');
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState('');
  const [reason, setReason] = useState('');
  const [adjustType, setAdjustType] = useState<'entrada' | 'salida' | 'ajuste'>('ajuste');

  useEffect(() => {
    if (filterParam === 'low-stock') {
      setStockFilter('low');
      setTab('stock');
    }
  }, [filterParam]);

  const filtered = useMemo(() => {
    let list = db.products;
    if (stockFilter === 'low') {
      list = list.filter((p) => p.stock <= p.minStock);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return list;
  }, [db.products, search, stockFilter]);

  const lowStock = db.products.filter((p) => p.stock <= p.minStock);
  const totalValue = db.products.reduce((s, p) => s + p.cost * p.stock, 0);
  const totalUnits = db.products.reduce((s, p) => s + p.stock, 0);

  const handleAdjust = () => {
    if (!adjustProduct) return;
    const ns = parseInt(newStock) || 0;
    if (adjustType === 'ajuste' && !reason) {
      toast.error('Razón requerida', 'Indica el motivo del ajuste');
      return;
    }
    adjustStock(adjustProduct.id, ns, reason || (adjustType === 'entrada' ? 'Entrada de mercancía' : 'Salida de mercancía'), adjustType);
    toast.success('Inventario actualizado', `${adjustProduct.name}: ${ns} unidades`);
    setAdjustProduct(null);
    setNewStock('');
    setReason('');
  };

  const stockColumns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Producto',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-surface-2 flex items-center justify-center"><Boxes className="h-4 w-4 text-muted" /></div>
          <div><p className="font-medium text-text">{p.name}</p><p className="text-xs text-muted">{p.sku}</p></div>
        </div>
      ),
    },
    { key: 'stock', header: 'Existencias', align: 'center', render: (p) => <span className="font-semibold text-text">{p.stock} {p.unit}</span> },
    { key: 'minStock', header: 'Mínimo', align: 'center', render: (p) => <span className="text-muted">{p.minStock}</span> },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (p) => (
        p.stock === 0 ? <Badge variant="danger">Agotado</Badge>
        : p.stock <= p.minStock ? <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Bajo</Badge>
        : <Badge variant="success">Disponible</Badge>
      ),
    },
    { key: 'value', header: 'Valor', align: 'right', render: (p) => <span className="text-muted">{formatCurrency(p.cost * p.stock, sym)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        canAdjust ? (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAdjustProduct(p); setNewStock(String(p.stock)); setAdjustType('ajuste'); }}>
            <Sliders className="h-3.5 w-3.5" /> Ajustar
          </Button>
        ) : <span className="text-muted text-xs">—</span>
      ),
    },
  ];

  const kardexColumns: Column<InventoryAdjustment>[] = [
    { key: 'createdAt', header: 'Fecha', render: (a) => <span className="text-muted">{formatDateTime(a.createdAt)}</span> },
    { key: 'productName', header: 'Producto' },
    {
      key: 'type',
      header: 'Tipo',
      render: (a) => (
        <Badge variant={a.type === 'entrada' ? 'success' : a.type === 'salida' ? 'danger' : 'info'}>
          {a.type === 'entrada' ? <ArrowDownToLine className="h-3 w-3" /> : a.type === 'salida' ? <ArrowUpFromLine className="h-3 w-3" /> : <Sliders className="h-3 w-3" />}
          {a.type}
        </Badge>
      ),
    },
    { key: 'previousStock', header: 'Anterior', align: 'center', render: (a) => <span className="text-muted">{a.previousStock}</span> },
    { key: 'newStock', header: 'Nuevo', align: 'center', render: (a) => <span className="font-semibold text-text">{a.newStock}</span> },
    { key: 'reason', header: 'Razón', render: (a) => <span className="text-muted">{a.reason}</span> },
    { key: 'userName', header: 'Usuario', render: (a) => <span className="text-muted">{a.userName}</span> },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Inventario' }]} className="mb-3" />
      <PageHeader title="Inventario" description="Control de existencias y movimientos" icon={<Boxes className="h-5 w-5" />} />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Productos', value: db.products.length, icon: Boxes, color: 'bg-info' },
          { label: 'Unidades totales', value: totalUnits, icon: TrendingUp, color: 'bg-primary' },
          { label: 'Valor inventario', value: formatCurrency(totalValue, sym), icon: TrendingDown, color: 'bg-success' },
          { label: 'Stock bajo', value: lowStock.length, icon: AlertTriangle, color: 'bg-danger' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', s.color)}><s.icon className="h-5 w-5 text-white" /></div>
              <div><p className="text-xs text-muted">{s.label}</p><p className="font-display font-bold text-lg text-text">{s.value}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <Card className="mb-4 border-danger/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <p className="text-sm font-semibold text-text">Alertas de stock bajo</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="danger">{p.name}: {p.stock}/{p.minStock}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-surface-2 p-1 rounded-xl w-fit">
        {[
          { id: 'stock' as const, label: 'Existencias' },
          { id: 'kardex' as const, label: 'Kardex / Movimientos' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === t.id ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-text')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' ? (
        <>
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU..." className="pl-10" />
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setStockFilter('all')}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-1 sm:flex-initial text-center',
                      stockFilter === 'all' ? 'bg-primary text-primary-fg' : 'bg-surface-2 text-muted hover:text-text'
                    )}
                  >
                    Todos ({db.products.length})
                  </button>
                  <button
                    onClick={() => setStockFilter('low')}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all flex-1 sm:flex-initial',
                      stockFilter === 'low' ? 'bg-danger text-white shadow-sm' : 'bg-danger/10 text-danger hover:bg-danger/20'
                    )}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Stock Bajo ({lowStock.length})
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <EmptyState icon={<Boxes className="h-10 w-10" />} title="Sin productos" />
              ) : (
                <DataTable columns={stockColumns} data={filtered} rowKey={(p) => p.id} />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-0">
            {db.adjustments.length === 0 ? (
              <EmptyState icon={<Settings2 className="h-10 w-10" />} title="Sin movimientos" description="Los ajustes de inventario aparecerán aquí" />
            ) : (
              <DataTable columns={kardexColumns} data={db.adjustments} rowKey={(a) => a.id} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Adjust dialog */}
      <Dialog
        open={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        title="Ajustar inventario"
        description={adjustProduct?.name}
        size="sm"
        footer={<><Button variant="outline" onClick={() => setAdjustProduct(null)}>Cancelar</Button><Button onClick={handleAdjust}>Aplicar</Button></>}
      >
        {adjustProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(['entrada', 'salida', 'ajuste'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAdjustType(t)}
                  className={cn('p-3 rounded-xl border text-sm font-medium capitalize transition-all', adjustType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-2')}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Stock actual:</span>
              <Badge variant="info">{adjustProduct.stock} {adjustProduct.unit}</Badge>
            </div>
            <Input
              type="number"
              label="Nuevo stock"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              autoFocus
            />
            <Textarea label="Razón" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo del ajuste..." />
          </div>
        )}
      </Dialog>
    </div>
  );
}
