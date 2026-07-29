import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Plus, Search, Trash2, CheckCircle2, Clock, XCircle, Package, Camera, Loader2, Barcode, Wand2, Building2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Select, CurrencyInput, NumberInput, Textarea } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDate, generateSequentialId, generateSkuFromName, cn } from '@/lib/utils';
import type { Purchase, PurchaseItem, Product, Supplier, Brand } from '@/models/types';

const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio errors
  }
};

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
}

export function PurchasesPage() {
  const { db, addPurchase, receivePurchase, upsertProduct, upsertSupplier, upsertBrand, currentUser } = useStore();
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
  const [qty, setQty] = useState<number>(1);
  const [cost, setCost] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);

  // Quick supplier modal inside Purchase
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplierForm, setNewSupplierForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
  });

  // Quick product creation modal inside Purchase
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [newBrandName, setNewBrandName] = useState('');
  const [showNewBrandField, setShowNewBrandField] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return db.purchases;
    const q = search.toLowerCase();
    return db.purchases.filter(
      (p) =>
        p.reference.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q)
    );
  }, [db.purchases, search]);

  const searchResults = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.toLowerCase().trim();
    return db.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [db.products, productSearch]);

  const addItem = (productId: string, productName: string, itemCost?: number) => {
    const finalCost = itemCost !== undefined && itemCost > 0 ? itemCost : cost;
    const finalQty = qty > 0 ? qty : 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + finalQty, cost: finalCost || i.cost }
            : i
        );
      }
      return [...prev, { productId, productName, quantity: finalQty, cost: finalCost }];
    });
    setProductSearch('');
    setQty(1);
    setCost(0);
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const updateItem = (productId: string, field: 'quantity' | 'cost', value: number) =>
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, [field]: value } : i))
    );

  const total = items.reduce((s, i) => s + i.cost * i.quantity, 0);

  const resetForm = () => {
    setSupplierId('');
    setInvoiceNumber('');
    setItems([]);
    setProductSearch('');
    setQty(1);
    setCost(0);
  };

  const handleSave = () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }
    const supplier = db.suppliers.find((s) => s.id === supplierId);
    const purchaseItems: PurchaseItem[] = items.map((i) => ({
      ...i,
      subtotal: i.cost * i.quantity,
    }));
    addPurchase({
      supplierId,
      supplierName: supplier?.name ?? '',
      invoiceNumber: invoiceNumber || 'N/A',
      items: purchaseItems,
      total,
      status: 'pendiente',
    });
    toast.success('Compra registrada', `Total: ${formatCurrency(total, sym)}`);
    setShowForm(false);
    resetForm();
  };

  const handleReceive = () => {
    if (!receiveId) return;
    receivePurchase(receiveId);
    toast.success('Compra recibida', 'Inventario y costos actualizados correctamente');
    setReceiveId(null);
  };

  const handleSelectProduct = (p: Product) => {
    setCost(p.cost);
    addItem(p.id, p.name, p.cost);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierForm.name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre del proveedor');
      return;
    }

    const newSupplier: Supplier = {
      id: generateSequentialId('sup', db.suppliers.map((s) => s.id)),
      name: newSupplierForm.name.trim(),
      contact: newSupplierForm.contact.trim(),
      phone: newSupplierForm.phone.trim(),
      email: newSupplierForm.email.trim(),
      address: newSupplierForm.address.trim(),
      taxId: newSupplierForm.taxId.trim(),
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    upsertSupplier(newSupplier);
    setSupplierId(newSupplier.id);
    setShowSupplierModal(false);
    setNewSupplierForm({ name: '', contact: '', phone: '', email: '', address: '', taxId: '' });
    toast.success('Proveedor creado', `Proveedor "${newSupplier.name}" registrado y seleccionado`);
  };

  const openQuickProductForm = (initialCode = '') => {
    const newP: Product = {
      id: generateSequentialId('prod', db.products.map((p) => p.id)),
      sku: initialCode ? generateSkuFromName(initialCode) : '',
      barcode: initialCode,
      name: '',
      description: '',
      categoryId: db.categories[0]?.id || '',
      brandId: db.brands[0]?.id || '',
      cost: cost > 0 ? cost : 0,
      price: cost > 0 ? Math.round(cost * 1.3) : 0,
      stock: 0,
      minStock: 5,
      unit: 'pza',
      active: true,
      favorite: false,
      createdAt: new Date().toISOString(),
    };
    setQuickProduct(newP);
    setShowQuickProductModal(true);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProduct || !quickProduct.name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre del producto');
      return;
    }

    upsertProduct(quickProduct);
    addItem(quickProduct.id, quickProduct.name, quickProduct.cost);
    toast.success('Producto creado y agregado', `"${quickProduct.name}" agregado a la compra`);
    setShowQuickProductModal(false);
    setQuickProduct(null);
  };

  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    playBeep();
    setShowScanner(false);

    const match = db.products.find(
      (p) => p.barcode === cleanCode || p.sku.toLowerCase() === cleanCode.toLowerCase()
    );

    if (match) {
      addItem(match.id, match.name, match.cost);
      toast.success('Producto encontrado', `"${match.name}" agregado a la compra`);
    } else {
      toast.info('Producto nuevo', `Código ${cleanCode} no registrado. Registra el nuevo producto.`);
      openQuickProductForm(cleanCode);
    }
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
        const conf = statusConfig[p.status];
        const IconComp = conf.icon;
        return (
          <Badge variant={conf.variant}>
            <IconComp className="h-3 w-3" /> {conf.label}
          </Badge>
        );
      },
    },
    { key: 'createdAt', header: 'Fecha', render: (p) => <span className="text-muted">{formatDate(p.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center gap-1 justify-end">
          {p.status === 'pendiente' && canReceive && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); setReceiveId(p.id); }}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Recibir
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Compras' }]} className="mb-3" />
      <PageHeader
        title="Compras a Proveedores"
        description={`${db.purchases.length} compras registradas`}
        icon={<Receipt className="h-5 w-5" />}
        actions={
          canCreate ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Registrar compra
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total compras', value: db.purchases.length, icon: Receipt, color: 'bg-info' },
          { label: 'Pendientes por recibir', value: db.purchases.filter((p) => p.status === 'pendiente').length, icon: Clock, color: 'bg-warning' },
          { label: 'Recibidas', value: db.purchases.filter((p) => p.status === 'recibida').length, icon: CheckCircle2, color: 'bg-success' },
          { label: 'Monto total compras', value: formatCurrency(db.purchases.reduce((s, p) => s + p.total, 0), sym), icon: Receipt, color: 'bg-primary' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', s.color)}><s.icon className="h-5 w-5 text-white" /></div>
              <div><p className="text-xs text-muted">{s.label}</p><p className="font-display font-bold text-base sm:text-lg text-text truncate">{s.value}</p></div>
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
      <Dialog open={showForm} onClose={() => { setShowForm(false); resetForm(); }} title="Nueva Compra a Proveedor" size="xl" footer={<><Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button><Button onClick={handleSave}>Registrar compra</Button></>}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">Proveedor *</span>
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="h-3 w-3" /> + Nuevo proveedor
                </button>
              </div>
              <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Seleccionar proveedor...</option>
                {db.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <Input label="Número de factura / remisión" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="FAC-001" />
          </div>

          {/* Add product section */}
          <div className="border border-border rounded-xl p-4 space-y-3 bg-surface-2/50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Buscar o Escanear Producto
              </p>
              <button
                type="button"
                onClick={() => openQuickProductForm(productSearch.trim())}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> + Registrar producto nuevo
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      handleSelectProduct(searchResults[0]);
                    } else if (productSearch.trim()) {
                      openQuickProductForm(productSearch.trim());
                    }
                  }
                }}
                placeholder="Buscar por nombre, SKU o código de barras (escanea con cámara/lector)..."
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                title="Escanear código de barras con cámara"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded bg-surface-2 hover:bg-surface border border-border text-primary transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              <AnimatePresence>
                {productSearch.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute z-20 mt-1 w-full sf-card bg-surface rounded-xl shadow-float p-1.5 max-h-64 overflow-y-auto"
                  >
                    {searchResults.length > 0 ? (
                      searchResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-2 text-left transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-text">{p.name}</p>
                            <p className="text-xs text-muted">{p.sku} · {p.barcode || 'Sin código'}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-primary block">{formatCurrency(p.cost, sym)}</span>
                            <span className="text-[11px] text-muted">Stock: {p.stock}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center space-y-2">
                        <p className="text-xs text-muted">
                          No se encontró ningún producto registrado con <span className="font-semibold text-text">"{productSearch}"</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => openQuickProductForm(productSearch.trim())}
                          className="w-full py-2 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Plus className="h-4 w-4" /> Registrar "{productSearch}" como producto nuevo
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <NumberInput label="Cantidad a comprar" value={qty} onChange={(val) => setQty(val)} />
              <CurrencyInput label="Costo unitario" value={cost} onChange={(val) => setCost(val)} currencySymbol={sym} />
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => {
                    const match = searchResults[0] || db.products.find((x) => x.name.toLowerCase().includes(productSearch.toLowerCase()));
                    if (match) {
                      handleSelectProduct(match);
                    } else if (productSearch.trim()) {
                      openQuickProductForm(productSearch.trim());
                    } else {
                      toast.warning('Selecciona un producto', 'Busca o escanea el producto a comprar');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" /> Agregar a la Compra
                </Button>
              </div>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted uppercase">Productos en esta compra ({items.length})</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-2 border border-border/60">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-text truncate">{item.productName}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24">
                        <NumberInput value={item.quantity} onChange={(val) => updateItem(item.productId, 'quantity', val)} />
                      </div>
                      <div className="w-32">
                        <CurrencyInput value={item.cost} onChange={(val) => updateItem(item.productId, 'cost', val)} currencySymbol={sym} />
                      </div>
                      <div className="w-28 text-right font-bold text-sm text-text">
                        {formatCurrency(item.cost * item.quantity, sym)}
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border mt-3">
                <span className="font-display font-bold text-text">Total de la Compra</span>
                <span className="font-display font-bold text-xl text-primary">{formatCurrency(total, sym)}</span>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Quick Supplier Creation Modal Inside Purchase */}
      <Dialog
        open={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="Crear Nuevo Proveedor"
        description="Registra una nueva empresa o proveedor comercial"
        size="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre del proveedor / razón social *"
              placeholder="Ej. Distribuidora del Valle S.A.S."
              value={newSupplierForm.name}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
              required
              autoFocus
            />
            <Input
              label="Persona de contacto"
              placeholder="Ej. Juan Pérez"
              value={newSupplierForm.contact}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, contact: e.target.value })}
            />
            <Input
              label="Teléfono / WhatsApp"
              placeholder="Ej. 300 123 4567"
              value={newSupplierForm.phone}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, phone: e.target.value })}
            />
            <Input
              label="Correo electrónico"
              placeholder="ventas@proveedor.com"
              value={newSupplierForm.email}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, email: e.target.value })}
            />
            <Input
              label="NIT / RFC / Identificación Tributaria"
              placeholder="Ej. 900.123.456-7"
              value={newSupplierForm.taxId}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, taxId: e.target.value })}
            />
            <Input
              label="Dirección fiscal / Bodega"
              placeholder="Calle 10 # 20-30"
              value={newSupplierForm.address}
              onChange={(e) => setNewSupplierForm({ ...newSupplierForm, address: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setShowSupplierModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" /> Guardar Proveedor
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Quick New Product Modal Inside Purchase */}
      <Dialog
        open={showQuickProductModal}
        onClose={() => { setShowQuickProductModal(false); setQuickProduct(null); }}
        title="Crear Producto e Incluir en Compra"
        description="Registra un nuevo producto en tu catálogo y agrégalo inmediatamente a esta orden"
        size="lg"
      >
        {quickProduct && (
          <form onSubmit={handleSaveQuickProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre del producto *"
                value={quickProduct.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setQuickProduct({
                    ...quickProduct,
                    name: newName,
                    sku: quickProduct.sku || generateSkuFromName(newName),
                  });
                }}
                placeholder="Ej. Detergente Ariel 1L"
                required
                autoFocus
              />
              <Input
                label="Código de barras"
                value={quickProduct.barcode}
                onChange={(e) => setQuickProduct({ ...quickProduct, barcode: e.target.value })}
                placeholder="750..."
              />
              <Select
                label="Categoría"
                value={quickProduct.categoryId}
                onChange={(e) => setQuickProduct({ ...quickProduct, categoryId: e.target.value })}
              >
                {db.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text">Marca</span>
                  <button
                    type="button"
                    onClick={() => setShowNewBrandField((v) => !v)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3 w-3" /> + Nueva marca
                  </button>
                </div>
                {showNewBrandField ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!newBrandName.trim()) return;
                          const newBrand: Brand = {
                            id: `brand-${Date.now()}`,
                            name: newBrandName.trim(),
                          };
                          upsertBrand(newBrand);
                          setQuickProduct({ ...quickProduct, brandId: newBrand.id });
                          setNewBrandName('');
                          setShowNewBrandField(false);
                          toast.success('Marca creada', `"${newBrand.name}" registrada y seleccionada`);
                        }
                        if (e.key === 'Escape') {
                          setShowNewBrandField(false);
                          setNewBrandName('');
                        }
                      }}
                      placeholder="Nombre de la marca…"
                      className="sf-input flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newBrandName.trim()) return;
                        const newBrand: Brand = {
                          id: `brand-${Date.now()}`,
                          name: newBrandName.trim(),
                        };
                        upsertBrand(newBrand);
                        setQuickProduct({ ...quickProduct, brandId: newBrand.id });
                        setNewBrandName('');
                        setShowNewBrandField(false);
                        toast.success('Marca creada', `"${newBrand.name}" registrada y seleccionada`);
                      }}
                      className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowNewBrandField(false); setNewBrandName(''); }}
                      className="px-2 py-2 rounded-lg text-muted hover:text-danger text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <Select
                    value={quickProduct.brandId}
                    onChange={(e) => setQuickProduct({ ...quickProduct, brandId: e.target.value })}
                  >
                    {db.brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <CurrencyInput
                label="Costo de compra *"
                value={quickProduct.cost}
                onChange={(val) => setQuickProduct({ ...quickProduct, cost: val })}
                currencySymbol={sym}
              />
              <CurrencyInput
                label="Precio de venta al público *"
                value={quickProduct.price}
                onChange={(val) => setQuickProduct({ ...quickProduct, price: val })}
                currencySymbol={sym}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" type="button" onClick={() => { setShowQuickProductModal(false); setQuickProduct(null); }}>
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4" /> Crear y Agregar a la Compra
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={`Compra ${viewing?.reference}`} size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm p-3 rounded-xl bg-surface-2">
              <div><span className="text-muted block text-xs">Proveedor</span><span className="font-semibold text-text">{viewing.supplierName}</span></div>
              <div><span className="text-muted block text-xs">Factura</span><span className="font-semibold text-text">{viewing.invoiceNumber}</span></div>
              <div><span className="text-muted block text-xs">Fecha</span><span className="font-semibold text-text">{formatDate(viewing.createdAt)}</span></div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted uppercase">Detalle de productos</p>
              {viewing.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-surface-2 text-sm">
                  <div>
                    <p className="font-medium text-text">{item.productName}</p>
                    <p className="text-xs text-muted">{item.quantity} x {formatCurrency(item.cost, sym)}</p>
                  </div>
                  <span className="font-bold text-text">{formatCurrency(item.subtotal, sym)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-bold text-text">Total</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(viewing.total, sym)}</span>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Receive confirm */}
      <Dialog open={!!receiveId} onClose={() => setReceiveId(null)} title="Recibir compra" size="sm" footer={<><Button variant="outline" onClick={() => setReceiveId(null)}>Cancelar</Button><Button onClick={handleReceive}>Confirmar recepción</Button></>}>
        <p className="text-sm text-muted">¿Confirmas que has recibido los productos físicamente? Se incrementará el stock del inventario y se actualizarán los costos de los productos.</p>
      </Dialog>

      {/* Camera Scanner Modal */}
      <PurchaseScannerModal open={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScanned} />
    </div>
  );
}

function PurchaseScannerModal({ open, onClose, onScan }: { open: boolean; onClose: () => void; onScan: (code: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const scannerId = 'purchase-camera-viewfinder';

    const startScanner = async () => {
      try {
        const instance = new Html5Qrcode(scannerId);
        scannerRef.current = instance;
        await instance.start(
          { facingMode: 'environment' },
          { fps: 15, qrbox: { width: 250, height: 180 } },
          (decodedText) => {
            if (isMounted) {
              onScan(decodedText);
            }
          },
          () => {}
        );
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg('No se pudo acceder a la cámara. Asegúrate de conceder permisos.');
        }
      }
    };

    const timer = setTimeout(startScanner, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => scannerRef.current?.clear());
      }
    };
  }, [open, onScan]);

  return (
    <Dialog open={open} onClose={onClose} title="Escáner de Código de Barras (Compras)" size="md">
      <div className="space-y-3 text-center">
        <p className="text-xs text-muted">Apunta con la cámara al código de barras del producto a comprar</p>
        <div id="purchase-camera-viewfinder" className="overflow-hidden rounded-xl bg-black min-h-[220px] flex items-center justify-center border border-border">
          {errorMsg && <p className="text-xs text-danger p-4">{errorMsg}</p>}
        </div>
      </div>
    </Dialog>
  );
}
