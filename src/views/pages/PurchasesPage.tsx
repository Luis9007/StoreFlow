import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Plus, Search, Trash2, CheckCircle2, Clock, XCircle, Package } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Select } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { Purchase, PurchaseItem } from '@/models/types';

interface CartItem { productId: string; productName: string; quantity: number; cost: number; }

export function PurchasesPage() {
  const { db, addPurchase, receivePurchase, currentUser } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canCreate = canPerformAction(currentUser?.role, 'purchase.create');
  const canReceive = canPerformAction(currentUser?.role, 'purchase.receive');

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<Purchase | null>(null);
  const [receiveId, setReceiveId] = useState<string | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [qty, setQty] = useState('1');
  const [cost, setCost] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return db.purchases;
    const q = search.toLowerCase();
    return db.purchases.filter((p) => p.reference.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q));
  }, [db.purchases, search]);

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase();
    return db.products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 5);
  }, [db.products, productSearch]);

  const addItem = (productId: string, productName: string) => {
    const c = parseFloat(cost) || 0;
    const q = parseInt(qty) || 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + q, cost: c || i.cost } : i);
      return [...prev, { productId, productName, quantity: q, cost: c }];
    });
    setProductSearch(''); setQty('1'); setCost('');
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));
  const updateItem = (productId: string, field: 'quantity' | 'cost', value: number) =>
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, [field]: value } : i));

  const total = items.reduce((s, i) => s + i.cost * i.quantity, 0);

  const resetForm = () => { setSupplierId(''); setInvoiceNumber(''); setItems([]); setProductSearch(''); setQty('1'); setCost(''); };

  const handleSave = () => {
    if (!supplierId) { toast.error('Selecciona un proveedor'); return; }
    if (items.length === 0) { toast.error('Agrega al menos un producto'); return; }
    const supplier = db.suppliers.find((s) => s.id === supplierId);
    const purchaseItems: PurchaseItem[] = items.map((i) => ({ ...i, subtotal: i.cost * i.quantity }));
    addPurchase({
      supplierId, supplierName: supplier?.name ?? '', invoiceNumber: invoiceNumber || 'N/A',
      items: purchaseItems, total, status: 'pendiente',
    });
    toast.success('Compra registrada', `Total: ${formatCurrency(total, sym)}`);
    setShowForm(false); resetForm();
  };

  const handleReceive = () => {
    if (!receiveId) return;
    receivePurchase(receiveId);
    toast.success('Compra recibida', 'Inventario actualizado');
    setReceiveId(null);
  };

  const statusConfig = {
    recibida: { variant: 'success' as const, icon: CheckCircle2, label: 'Recibida' },
    pendiente: { variant: 'warning' as const, icon: Clock, label: 'Pendiente' },
    cancelada: { variant: 'danger' as const, icon: XCircle, label: 'Cancelada' },
  };

  const columns: Column<Purchase>[] = [
    { key: 'reference', header: 'Folio', render: (p) => <span className="font-medium text-text">{p.reference}</span> },
    { key: 'supplierName', header: 'Proveedor' },
    { key: 'invoiceNumber', header: 'Factura', render: (p) => <span className="text-muted">{p.invoiceNumber}</span> },
    { key: 'items', header: 'Items', align: 'center', render: (p) => <Badge variant="info">{p.items.length}</Badge> },
    { key: 'total', header: 'Total', align: 'right', render: (p) => <span className="font-semibold text-text">{formatCurrency(p.total, sym)}</span> },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      render: (p) => {
        const cfg = statusConfig[p.status];
        return <Badge variant={cfg.variant}><cfg.icon className="h-3 w-3" /> {cfg.label}</Badge>;
      },
    },
    { key: 'createdAt', header: 'Fecha', render: (p) => <span className="text-muted">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center gap-1 justify-end">
          {p.status === 'pendiente' && canReceive && <Button size="sm" variant="success" onClick={(e) => { e.stopPropagation(); setReceiveId(p.id); }}><CheckCircle2 className="h-3.5 w-3.5" /> Recibir</Button>}
          <button onClick={(e) => { e.stopPropagation(); setViewing(p); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-text"><Receipt className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Compras' }]} className="mb-3" />
      <PageHeader title="Compras" description={`${db.purchases.length} compras registradas`} icon={<Receipt className="h-5 w-5" />}
        actions={canCreate ? <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nueva compra</Button> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total compras', value: db.purchases.length, icon: Receipt, color: 'bg-info' },
          { label: 'Pendientes', value: db.purchases.filter((p) => p.status === 'pendiente').length, icon: Clock, color: 'bg-warning' },
          { label: 'Recibidas', value: db.purchases.filter((p) => p.status === 'recibida').length, icon: CheckCircle2, color: 'bg-success' },
          { label: 'Total invertido', value: formatCurrency(db.purchases.reduce((s, p) => s + p.total, 0), sym), icon: Receipt, color: 'bg-primary' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', s.color)}><s.icon className="h-5 w-5 text-white" /></div>
              <div><p className="text-xs text-muted">{s.label}</p><p className="font-display font-bold text-lg text-text">{s.value}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por folio, proveedor o factura..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={<Receipt className="h-10 w-10" />} title="Sin compras" action={canCreate ? <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Registrar compra</Button> : undefined} />
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(p) => p.id} onRowClick={(p) => setViewing(p)} />
          )}
        </CardContent>
      </Card>

      {/* New purchase form */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="Nueva compra" size="xl" footer={<><Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button><Button onClick={handleSave}>Registrar compra</Button></>}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Proveedor" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input label="Número de factura" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="FAC-001" />
          </div>

          {/* Add product */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-surface-2/50">
            <p className="text-sm font-medium text-text">Agregar producto</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar producto..." className="pl-10" />
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-10 mt-1 w-full sf-card bg-surface rounded-xl shadow-float p-1 max-h-48 overflow-y-auto">
                    {searchResults.map((p) => (
                      <button key={p.id} onClick={() => { setCost(String(p.cost)); addItem(p.id, p.name); }} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-surface-2 text-left">
                        <span className="text-sm text-text">{p.name}</span>
                        <span className="text-xs text-muted">{p.sku}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" label="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} />
              <Input type="number" step="0.01" label="Costo unit." value={cost} onChange={(e) => setCost(e.target.value)} />
              <div className="flex items-end"><Button className="w-full" onClick={() => { const p = db.products.find((x) => x.name.toLowerCase().includes(productSearch.toLowerCase())); if (p) addItem(p.id, p.name); }}><Plus className="h-4 w-4" /> Agregar</Button></div>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 p-3 rounded-xl bg-surface-2">
                  <Package className="h-4 w-4 text-muted" />
                  <span className="flex-1 text-sm text-text">{item.productName}</span>
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 0)} className="w-16 h-8 text-center text-sm bg-surface border border-border rounded-lg" />
                  <input type="number" step="0.01" value={item.cost} onChange={(e) => updateItem(item.productId, 'cost', parseFloat(e.target.value) || 0)} className="w-20 h-8 text-center text-sm bg-surface border border-border rounded-lg" />
                  <span className="text-sm font-semibold text-text w-20 text-right">{formatCurrency(item.cost * item.quantity, sym)}</span>
                  <button onClick={() => removeItem(item.productId)} className="p-1 text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-display font-bold text-text">Total</span>
                <span className="font-display font-bold text-lg text-primary">{formatCurrency(total, sym)}</span>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* View detail */}
      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={`Compra ${viewing?.reference ?? ''}`} size="md">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-muted">Proveedor</p><p className="text-sm font-medium text-text">{viewing.supplierName}</p></div>
              <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-muted">Factura</p><p className="text-sm font-medium text-text">{viewing.invoiceNumber}</p></div>
              <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-muted">Fecha</p><p className="text-sm font-medium text-text">{formatDate(viewing.createdAt)}</p></div>
              <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-muted">Estado</p><Badge variant={statusConfig[viewing.status].variant}>{statusConfig[viewing.status].label}</Badge></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-text mb-2">Productos</p>
              <div className="space-y-2">
                {viewing.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2">
                    <div><p className="text-sm font-medium text-text">{item.productName}</p><p className="text-xs text-muted">{item.quantity} x {formatCurrency(item.cost, sym)}</p></div>
                    <span className="text-sm font-semibold text-text">{formatCurrency(item.subtotal, sym)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-display font-bold text-text">Total</span>
              <span className="font-display font-bold text-lg text-primary">{formatCurrency(viewing.total, sym)}</span>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!receiveId} onClose={() => setReceiveId(null)} title="Recibir compra" size="sm" footer={<><Button variant="outline" onClick={() => setReceiveId(null)}>Cancelar</Button><Button variant="success" onClick={handleReceive}><CheckCircle2 className="h-4 w-4" /> Confirmar recepción</Button></>}>
        <p className="text-sm text-muted">Al confirmar, el inventario se actualizará automáticamente con las cantidades de esta compra.</p>
      </Dialog>
    </div>
  );
}
