import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Plus, Search, Pencil, Trash2, Star, AlertTriangle, Barcode, DollarSign, Wand2, Camera, Loader2, Sparkles,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Select, Textarea, CurrencyInput, NumberInput } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, generateSequentialId, generateSkuFromName, cn } from '@/lib/utils';
import type { Product, Category, Brand } from '@/models/types';

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

const PRODUCT_UNITS = [
  { value: 'pza', label: 'Pieza (pza)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'g', label: 'Gramo (g)' },
  { value: 'lt', label: 'Litro (lt)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'paq', label: 'Paquete (paq)' },
  { value: 'caja', label: 'Caja (caja)' },
  { value: 'bot', label: 'Botella (bot)' },
  { value: 'lata', label: 'Lata (lata)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'par', label: 'Par (par)' },
  { value: 'doc', label: 'Docena (doc)' },
];

const emptyProduct = (existingProducts: Product[] = []): Product => ({
  id: generateSequentialId('prod', existingProducts.map((p) => p.id)),
  sku: '',
  barcode: '',
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  cost: 0,
  price: 0,
  stock: 0,
  minStock: 5,
  unit: 'pza',
  active: true,
  favorite: false,
  createdAt: new Date().toISOString(),
});

export function ProductsPage() {
  const { db, upsertCategory, upsertBrand, upsertProduct, deleteProduct, currentUser } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canCreate = canPerformAction(currentUser?.role, 'product.create');
  const canEdit = canPerformAction(currentUser?.role, 'product.edit');
  const canDelete = canPerformAction(currentUser?.role, 'product.delete');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', color: '#0ea5e9' });
  const [newBrandForm, setNewBrandForm] = useState({ name: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showProductScanner, setShowProductScanner] = useState(false);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryForm.name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre de la categoría');
      return;
    }

    const catName = newCategoryForm.name.trim();
    const cleanId = `cat_${catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`;

    const duplicate = db.categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (duplicate) {
      toast.warning('Categoría existente', `La categoría "${catName}" ya existe y fue seleccionada.`);
      if (editing) setEditing({ ...editing, categoryId: duplicate.id });
      setShowCategoryModal(false);
      return;
    }

    const newCategory: Category = {
      id: cleanId,
      name: catName,
      color: newCategoryForm.color || '#0ea5e9',
      icon: 'Tag',
    };

    upsertCategory(newCategory);
    if (editing) {
      setEditing({ ...editing, categoryId: newCategory.id });
    }
    setShowCategoryModal(false);
    setNewCategoryForm({ name: '', color: '#0ea5e9' });
    toast.success('Categoría creada', `Categoría "${newCategory.name}" registrada y seleccionada`);
  };

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandForm.name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre de la marca');
      return;
    }

    const brandName = newBrandForm.name.trim();
    const cleanId = `brand_${brandName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`;

    const duplicate = db.brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
    if (duplicate) {
      toast.warning('Marca existente', `La marca "${brandName}" ya existe y fue seleccionada.`);
      if (editing) setEditing({ ...editing, brandId: duplicate.id });
      setShowBrandModal(false);
      return;
    }

    const newBrand: Brand = {
      id: cleanId,
      name: brandName,
    };

    upsertBrand(newBrand);
    if (editing) {
      setEditing({ ...editing, brandId: newBrand.id });
    }
    setShowBrandModal(false);
    setNewBrandForm({ name: '' });
    toast.success('Marca creada', `Marca "${newBrand.name}" registrada y seleccionada`);
  };

  const handleScanBarcodeForProduct = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode || !editing) return;

    playBeep();
    setShowProductScanner(false);
    setIsSearchingExternal(true);

    let updatedName = editing.name;
    let updatedDesc = editing.description;
    let updatedBrandId = editing.brandId;
    let foundExternal = false;

    try {
      // 1. Try Open Food Facts API v2
      const resV2 = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`);
      if (resV2.ok) {
        const data = await resV2.json();
        if (data.product) {
          const p = data.product;
          const name = (p.product_name_es || p.product_name || p.product_name_en || p.abbreviated_product_name || '').trim();
          const brandName = (p.brands || p.brand_owner || '').split(',')[0]?.trim() || '';
          const fullName = brandName && name && !name.toLowerCase().includes(brandName.toLowerCase()) ? `${brandName} ${name}` : name;
          if (fullName) {
            foundExternal = true;
            if (!editing.name) updatedName = fullName;
            if (!editing.description && (p.generic_name_es || p.generic_name)) {
              updatedDesc = (p.generic_name_es || p.generic_name).trim();
            }

            if (brandName && !editing.brandId) {
              const existingBrand = db.brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
              if (existingBrand) {
                updatedBrandId = existingBrand.id;
              } else {
                const autoBrandId = `brand_${brandName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`;
                const autoBrand: Brand = { id: autoBrandId, name: brandName };
                upsertBrand(autoBrand);
                updatedBrandId = autoBrandId;
              }
            }
          }
        }
      }

      // 2. Fallback to Open Food Facts API v0 if not found
      if (!foundExternal) {
        const resV0 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(cleanCode)}.json`);
        if (resV0.ok) {
          const data = await resV0.json();
          if (data.status === 1 && data.product) {
            const p = data.product;
            const name = (p.product_name_es || p.product_name || p.product_name_en || '').trim();
            const brandName = (p.brands || '').split(',')[0]?.trim() || '';
            const fullName = brandName && name && !name.toLowerCase().includes(brandName.toLowerCase()) ? `${brandName} ${name}` : name;
            if (fullName) {
              foundExternal = true;
              if (!editing.name) updatedName = fullName;
              if (!editing.description && (p.generic_name_es || p.generic_name)) {
                updatedDesc = (p.generic_name_es || p.generic_name).trim();
              }

              if (brandName && !editing.brandId) {
                const existingBrand = db.brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
                if (existingBrand) {
                  updatedBrandId = existingBrand.id;
                } else {
                  const autoBrandId = `brand_${brandName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_')}`;
                  const autoBrand: Brand = { id: autoBrandId, name: brandName };
                  upsertBrand(autoBrand);
                  updatedBrandId = autoBrandId;
                }
              }
            }
          }
        }
      }
    } catch {
      // Ignore network or CORS errors
    } finally {
      setIsSearchingExternal(false);
    }

    const generatedSku = updatedName ? generateSkuFromName(updatedName) : editing.sku;

    setEditing({
      ...editing,
      barcode: cleanCode,
      name: updatedName,
      description: updatedDesc,
      brandId: updatedBrandId,
      sku: generatedSku,
    });

    if (foundExternal && updatedName) {
      toast.success('¡Producto identificado!', `Nombre autocompletado: "${updatedName}" (Código: ${cleanCode})`);
    } else {
      toast.info('Código asignado', `Código ${cleanCode} capturado. Ingresa el nombre del producto.`);
    }
  };

  const filtered = useMemo(() => {
    let list = db.products;
    if (categoryFilter !== 'all') list = list.filter((p) => p.categoryId === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
    }
    return list;
  }, [db.products, search, categoryFilter]);

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name || !editing.sku) {
      toast.error('Campos requeridos', 'Nombre y SKU son obligatorios');
      return;
    }
    if (!editing.categoryId) {
      toast.error('Categoría requerida', 'Selecciona una categoría');
      return;
    }
    upsertProduct(editing);
    toast.success('Producto guardado', editing.name);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const prod = db.products.find((p) => p.id === deleteId);
    deleteProduct(deleteId);
    toast.success('Producto eliminado', prod?.name ?? '');
    setDeleteId(null);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Producto',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
            {p.favorite ? <Star className="h-4 w-4 text-accent fill-accent" /> : <Package className="h-4 w-4 text-muted" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text truncate">{p.name}</p>
            <p className="text-xs text-muted">{p.sku} · {p.barcode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (p) => {
        const cat = db.categories.find((c) => c.id === p.categoryId);
        return <Badge variant="info">{cat?.name ?? '—'}</Badge>;
      },
    },
    { key: 'cost', header: 'Costo', align: 'right', render: (p) => <span className="text-muted">{formatCurrency(p.cost, sym)}</span> },
    { key: 'price', header: 'Precio', align: 'right', render: (p) => <span className="font-semibold text-text">{formatCurrency(p.price, sym)}</span> },
    {
      key: 'margin',
      header: 'Margen',
      align: 'right',
      render: (p) => {
        const margin = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
        return <span className={cn(margin >= 30 ? 'text-success' : margin >= 15 ? 'text-warning' : 'text-danger')}>{margin.toFixed(0)}%</span>;
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'center',
      render: (p) => (
        <Badge variant={p.stock <= p.minStock ? 'danger' : 'success'}>
          {p.stock <= p.minStock && <AlertTriangle className="h-3 w-3" />}
          {p.stock} {p.unit}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="flex items-center gap-1 justify-end">
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); setEditing(p); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-text">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Productos' }]} className="mb-3" />
      <PageHeader
        title="Productos"
        description={`${db.products.length} productos en catálogo`}
        icon={<Package className="h-5 w-5" />}
        actions={
          canCreate ? (
            <Button onClick={() => { setEditing(emptyProduct(db.products)); setShowForm(true); }}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total productos', value: db.products.length, icon: Package, color: 'bg-info' },
          { label: 'Stock bajo', value: db.products.filter((p) => p.stock <= p.minStock).length, icon: AlertTriangle, color: 'bg-danger' },
          { label: 'Favoritos', value: db.products.filter((p) => p.favorite).length, icon: Star, color: 'bg-accent' },
          { label: 'Valor inventario', value: formatCurrency(db.products.reduce((s, p) => s + p.cost * p.stock, 0), sym), icon: DollarSign, color: 'bg-success' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', s.color)}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div><p className="text-xs text-muted">{s.label}</p><p className="font-display font-bold text-lg text-text">{s.value}</p></div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, SKU o código..." className="pl-10" />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-48">
            <option value="all">Todas las categorías</option>
            {db.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={<Package className="h-10 w-10" />} title="Sin productos" description="No se encontraron productos" action={canCreate ? <Button onClick={() => { setEditing(emptyProduct(db.products)); setShowForm(true); }}><Plus className="h-4 w-4" /> Agregar producto</Button> : undefined} />
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(p) => p.id} onRowClick={canEdit ? (p) => { setEditing(p); setShowForm(true); } : undefined} />
          )}
        </CardContent>
      </Card>

      {/* Form dialog */}
      <Dialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing && db.products.some((p) => p.id === editing.id) ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
        footer={<><Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}
      >
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={editing.name}
              onChange={(e) => {
                const newName = e.target.value;
                const isNew = !db.products.some((p) => p.id === editing.id);
                const prevAutoSku = generateSkuFromName(editing.name);
                const shouldAutoUpdate = isNew && (!editing.sku || editing.sku === prevAutoSku);
                setEditing({
                  ...editing,
                  name: newName,
                  sku: shouldAutoUpdate ? generateSkuFromName(newName) : editing.sku,
                });
              }}
              placeholder="Ej. Coca-Cola 600ml"
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">SKU (Código único)</span>
                {editing.name && (
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, sku: generateSkuFromName(editing.name) })}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Wand2 className="h-3 w-3" /> Auto-generar
                  </button>
                )}
              </div>
              <Input
                value={editing.sku}
                onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                placeholder="Ej. COCA-COLA-600ML"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">Código de barras</span>
                <button
                  type="button"
                  onClick={() => setShowProductScanner(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Camera className="h-3 w-3" /> Escanear con Cámara
                </button>
              </div>
              <div className="relative flex items-center">
                <Input
                  value={editing.barcode}
                  onChange={(e) => setEditing({ ...editing, barcode: e.target.value })}
                  placeholder="750... o escanea el código"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowProductScanner(true)}
                  title="Escanear código de barras con la cámara"
                  className="absolute right-2.5 p-1.5 rounded bg-surface-2 hover:bg-surface border border-border text-primary transition-colors flex items-center justify-center"
                >
                  {isSearchingExternal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">Categoría</span>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="h-3 w-3" /> + Nueva categoría
                </button>
              </div>
              <Select
                value={editing.categoryId}
                onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
              >
                <option value="">Seleccionar categoría...</option>
                {db.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text">Marca</span>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(true)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="h-3 w-3" /> + Nueva marca
                </button>
              </div>
              <Select value={editing.brandId} onChange={(e) => setEditing({ ...editing, brandId: e.target.value })}>
                <option value="">Sin marca</option>
                {db.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
            <Select
              label="Unidad de medida"
              value={editing.unit}
              onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
            >
              {PRODUCT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
              {!PRODUCT_UNITS.some((u) => u.value === editing.unit) && editing.unit && (
                <option value={editing.unit}>{editing.unit} (Personalizado)</option>
              )}
            </Select>
            <CurrencyInput
              label="Costo"
              value={editing.cost}
              onChange={(val) => setEditing({ ...editing, cost: val })}
              currencySymbol={sym}
            />
            <CurrencyInput
              label="Precio de venta"
              value={editing.price}
              onChange={(val) => setEditing({ ...editing, price: val })}
              currencySymbol={sym}
            />
            <NumberInput
              label="Stock actual"
              value={editing.stock}
              onChange={(val) => setEditing({ ...editing, stock: val })}
            />
            <NumberInput
              label="Stock mínimo"
              value={editing.minStock}
              onChange={(val) => setEditing({ ...editing, minStock: val })}
            />
            <Textarea label="Descripción" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="sm:col-span-2" />
            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input type="checkbox" checked={editing.favorite} onChange={(e) => setEditing({ ...editing, favorite: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                Favorito
              </label>
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                Activo
              </label>
            </div>
          </div>
        )}
      </Dialog>

      {/* Quick New Category Dialog */}
      <Dialog
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Crear Nueva Categoría"
        description="Agrega una nueva categoría al catálogo de productos"
        size="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Nombre de la categoría *"
            placeholder="Ej. Mascotas, Congelados, Tecnología..."
            value={newCategoryForm.name}
            onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
            required
            autoFocus
          />
          <div>
            <label className="text-xs font-medium text-text block mb-2">Color identificador</label>
            <div className="flex gap-2 items-center flex-wrap">
              {['#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#10b981'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategoryForm({ ...newCategoryForm, color: c })}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all border-2',
                    newCategoryForm.color === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setShowCategoryModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" /> Guardar Categoría
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Quick New Brand Dialog */}
      <Dialog
        open={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title="Crear Nueva Marca"
        description="Agrega una nueva marca de fabricante al catálogo"
        size="sm"
      >
        <form onSubmit={handleCreateBrand} className="space-y-4">
          <Input
            label="Nombre de la marca *"
            placeholder="Ej. Coca-Cola, Sabritas, Nestlé, Sony..."
            value={newBrandForm.name}
            onChange={(e) => setNewBrandForm({ name: e.target.value })}
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setShowBrandModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" /> Guardar Marca
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar producto" size="sm" footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Eliminar</Button></>}>
        <p className="text-sm text-muted">¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.</p>
      </Dialog>

      {/* Product Scanner Dialog */}
      <ProductScannerModal
        open={showProductScanner}
        onClose={() => setShowProductScanner(false)}
        onScan={handleScanBarcodeForProduct}
      />
    </div>
  );
}

function ProductScannerModal({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg('');
    setLastScanned('');
    let html5Qrcode: Html5Qrcode | null = null;
    const elementId = 'product-camera-scanner-view';

    const startScanner = async () => {
      try {
        html5Qrcode = new Html5Qrcode(elementId);
        scannerRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.floor(minEdge * 0.85),
                height: Math.floor(minEdge * 0.55),
              };
            },
          },
          (decodedText) => {
            setLastScanned(decodedText);
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err: any) {
        console.error('Error al iniciar el escáner de producto:', err);
        setErrorMsg('No se pudo acceder a la cámara. Revisa los permisos de tu navegador.');
      }
    };

    const timer = setTimeout(startScanner, 250);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current?.clear())
            .catch(() => {});
        } else {
          try {
            scannerRef.current.clear();
          } catch {}
        }
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Escanear Código para Nuevo Producto" size="md">
      <div className="space-y-4">
        <p className="text-xs text-muted">
          Apunta la cámara al código de barras. El código se asignará al formulario y buscará automáticamente el nombre en la base de datos global de productos.
        </p>

        <div className="relative overflow-hidden rounded-2xl bg-slate-950 aspect-video flex items-center justify-center border border-border shadow-inner">
          <div id="product-camera-scanner-view" className="w-full h-full" />

          {lastScanned && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-lg animate-bounce">
              ¡Código capturado: {lastScanned}!
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end border-t border-border pt-3">
          <Button variant="outline" onClick={onClose}>
            Cerrar Escáner
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
