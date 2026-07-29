import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Star, Trash2, Plus, Minus, ShoppingCart, X, CreditCard,
  Wallet, Banknote, Clock, Barcode, CheckCircle2, Printer, User, UserPlus, FileText, Lock, Unlock, Store,
} from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { Button } from '@/views/components/ui/Button';
import { Input, Select } from '@/views/components/ui/Input';
import { Card, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { formatCurrency, formatDateTime, generateId, generateSequentialId, cn } from '@/lib/utils';
import type { SaleItem, PaymentMethod, Sale, Customer } from '@/models/types';

interface CartLine {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  discount: number;
  stock: number;
}

export function POSPage() {
  const { db, currentUser, addSale, upsertCustomer, activeCashSession, openCash } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  // Single POS Modal step: 'closed' | 'checkout' | 'receipt'
  const [posStep, setPosStep] = useState<'closed' | 'checkout' | 'receipt'>('closed');
  
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showQuickOpenCashModal, setShowQuickOpenCashModal] = useState(false);
  const [quickOpenAmount, setQuickOpenAmount] = useState('50000');
  const [showFolioModal, setShowFolioModal] = useState(false);
  const [folioSearchInput, setFolioSearchInput] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Quick customer form state
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredProducts = useMemo(() => {
    let list = db.products.filter((p) => p.active);
    if (showFavorites) list = list.filter((p) => p.favorite);
    if (activeCategory !== 'all') list = list.filter((p) => p.categoryId === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q)
      );
    }
    return list;
  }, [db.products, activeCategory, search, showFavorites]);

  const searchedFolioSales = useMemo(() => {
    if (!folioSearchInput.trim()) return db.sales;
    const q = folioSearchInput.toLowerCase();
    return db.sales.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [db.sales, folioSearchInput]);

  const addToCart = (product: typeof db.products[number]) => {
    if (product.stock <= 0) {
      toast.error('Sin stock', `${product.name} no tiene existencias`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning('Stock máximo', `Solo hay ${product.stock} unidades`);
          return prev;
        }
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1, discount: 0, stock: product.stock }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const newQty = l.quantity + delta;
        if (newQty <= 0) return l;
        if (newQty > l.stock) {
          toast.warning('Stock máximo', `Solo hay ${l.stock} unidades`);
          return l;
        }
        return { ...l, quantity: newQty };
      }).filter((l) => l.quantity > 0)
    );
  };

  const setQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const clamped = Math.max(1, Math.min(qty, l.stock));
        return { ...l, quantity: clamped };
      })
    );
  };

  const setDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l;
        const clamped = Math.max(0, Math.min(100, isNaN(discount) ? 0 : discount));
        return { ...l, discount: clamped };
      })
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const subtotalGross = cart.reduce((s, l) => s + l.price * l.quantity, 0);
  const totalDiscount = cart.reduce((s, l) => s + (l.price * l.quantity * (l.discount / 100)), 0);
  const subtotalNet = subtotalGross - totalDiscount;
  const tax = subtotalNet * (db.settings.taxRate / 100);
  const total = subtotalNet + tax;
  const cashNum = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'efectivo' && cashNum > total ? cashNum - total : 0;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Carrito vacío', 'Agrega productos para vender');
      return;
    }
    if (!activeCashSession) {
      toast.error('Caja cerrada', 'Debes abrir la caja para poder registrar ventas');
      setShowQuickOpenCashModal(true);
      return;
    }
    setPosStep('checkout');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim()) {
      toast.error('Nombre requerido', 'Ingresa el nombre del cliente');
      return;
    }

    const docToTest = newCustForm.document.trim();
    if (docToTest) {
      const clean = docToTest.replace(/[\s.-]/g, '').toLowerCase();
      const duplicate = db.customers.find(
        (c) => c.document && c.document.replace(/[\s.-]/g, '').toLowerCase() === clean
      );
      if (duplicate) {
        toast.error(
          'Documento duplicado',
          `La cédula/NIT "${docToTest}" ya está registrada para el cliente "${duplicate.name}"`
        );
        return;
      }
    }

    const newCustomer: Customer = {
      id: generateSequentialId('cus', db.customers.map((c) => c.id)),
      name: newCustForm.name.trim(),
      document: docToTest,
      phone: newCustForm.phone.trim(),
      email: newCustForm.email.trim(),
      address: newCustForm.address.trim(),
      balance: 0,
      notes: newCustForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    upsertCustomer(newCustomer);
    setCustomerId(newCustomer.id);
    setShowNewCustomerModal(false);
    setNewCustForm({ name: '', document: '', phone: '', email: '', address: '', notes: '' });
    toast.success('Cliente creado', `Cliente "${newCustomer.name}" registrado y seleccionado`);
  };

  const confirmSale = () => {
    if (!activeCashSession) {
      toast.error('Caja cerrada', 'Debes abrir la caja para poder registrar ventas');
      setShowQuickOpenCashModal(true);
      return;
    }

    if (paymentMethod === 'credito' && !customerId) {
      toast.warning('Cliente requerido', 'Las ventas a crédito requieren seleccionar un cliente');
      return;
    }

    const cashValue = parseFloat(cashReceived) || 0;
    if (paymentMethod === 'efectivo' && cashValue < total) {
      toast.error('Efectivo insuficiente', 'El monto recibido es menor al total');
      return;
    }

    const items: SaleItem[] = cart.map((l) => ({
      productId: l.productId,
      productName: l.productName,
      quantity: l.quantity,
      price: l.price,
      discount: l.discount,
      subtotal: l.price * l.quantity * (1 - l.discount / 100),
    }));

    const customer = db.customers.find((c) => c.id === customerId);
    const calculatedChange = paymentMethod === 'efectivo' ? Math.max(0, cashValue - total) : 0;
    const calculatedReceived = paymentMethod === 'efectivo' ? cashValue : total;

    const sale = addSale({
      customerId: customer?.id ?? null,
      customerName: customer?.name ?? 'Público general',
      items,
      subtotal: subtotalNet,
      discount: totalDiscount,
      tax,
      total,
      paymentMethod,
      cashReceived: calculatedReceived,
      change: calculatedChange,
      userId: currentUser?.id ?? '',
      userName: currentUser?.name ?? '',
    });

    setLastSale(sale);
    setCart([]);
    setCustomerId('');
    setCashReceived('');
    setNotes('');
    setPaymentMethod('efectivo');
    setPosStep('receipt');
    toast.success('Venta completada', `Total: ${formatCurrency(total, sym)}`);
  };

  const paymentMethods = [
    { id: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
    { id: 'tarjeta' as const, label: 'Tarjeta', icon: CreditCard },
    { id: 'transferencia' as const, label: 'Transferencia', icon: Wallet },
    { id: 'credito' as const, label: 'Crédito', icon: Clock },
  ];

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Punto de Venta' }]} />
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
            <Store className="h-3.5 w-3.5" />
            <span className="truncate max-w-[200px]">{db.settings.name || 'StoreFlow'}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFolioModal(true)}>
          <FileText className="h-4 w-4" /> Buscar Folio
        </Button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 min-h-0">
        {/* Left — Products */}
        <div className="flex flex-col min-h-0">
          {/* Search + filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, SKU o código de barras... (presiona /)"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface border border-border text-text placeholder:text-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto sf-no-scrollbar pb-1">
              <button
                onClick={() => { setActiveCategory('all'); setShowFavorites(false); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  activeCategory === 'all' && !showFavorites ? 'bg-primary text-primary-fg' : 'bg-surface border border-border text-muted hover:text-text'
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setShowFavorites((s) => !s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5',
                  showFavorites ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-text'
                )}
              >
                <Star className="h-3.5 w-3.5" /> Favoritos
              </button>
              {db.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setShowFavorites(false); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                    activeCategory === cat.id && !showFavorites ? 'bg-primary text-primary-fg' : 'bg-surface border border-border text-muted hover:text-text'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto sf-no-scrollbar pr-1">
            {filteredProducts.length === 0 ? (
              <EmptyState icon={<Search className="h-10 w-10" />} title="Sin resultados" description="No se encontraron productos con esos criterios" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((p, i) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(p)}
                    className="sf-card text-left p-3 hover:shadow-float hover:border-primary/30 transition-all group relative"
                  >
                    {p.favorite && (
                      <Star className="absolute top-2 right-2 h-4 w-4 text-accent fill-accent" />
                    )}
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-surface-2 to-surface mb-2 flex items-center justify-center text-muted">
                      <Barcode className="h-8 w-8 opacity-40" />
                    </div>
                    <p className="text-sm font-medium text-text line-clamp-2 leading-tight">{p.name}</p>
                    <p className="text-xs text-muted mt-0.5">{p.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-display font-bold text-primary">{formatCurrency(p.price, sym)}</span>
                      <Badge variant={p.stock <= p.minStock ? 'danger' : 'default'} size="sm">
                        {p.stock}
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Cart */}
        <Card className="flex flex-col min-h-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-display font-semibold text-text">Carrito</h2>
              {cart.length > 0 && <Badge variant="primary">{cart.reduce((s, l) => s + l.quantity, 0)}</Badge>}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-danger hover:underline">
                Vaciar
              </button>
            )}
          </div>

          {/* Customer Selection & Quick Add */}
          <div className="p-3.5 border-b border-border bg-surface-2/40 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-text">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                Cliente (opcional)
              </span>
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <UserPlus className="h-3.5 w-3.5" /> + Nuevo Cliente
              </button>
            </div>
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="h-10 text-sm"
            >
              <option value="">Público general (Sin cliente)</option>
              {db.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.document ? `(${c.document})` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Cart lines */}
          <div className="flex-1 overflow-y-auto sf-no-scrollbar p-4 space-y-2">
            <AnimatePresence>
              {cart.length === 0 ? (
                <EmptyState icon={<ShoppingCart className="h-10 w-10" />} title="Carrito vacío" description="Toca productos para agregarlos" />
              ) : (
                cart.map((line) => {
                  const lineGross = line.price * line.quantity;
                  const lineNet = lineGross * (1 - line.discount / 100);
                  return (
                    <motion.div
                      key={line.productId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-2 p-2.5 rounded-xl bg-surface-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{line.productName}</p>
                          <p className="text-xs text-muted">{formatCurrency(line.price, sym)} c/u</p>
                        </div>
                        <div className="text-right shrink-0">
                          {line.discount > 0 ? (
                            <>
                              <p className="text-xs line-through text-muted">{formatCurrency(lineGross, sym)}</p>
                              <p className="text-sm font-semibold text-emerald-500">{formatCurrency(lineNet, sym)}</p>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-text">{formatCurrency(lineGross, sym)}</span>
                          )}
                        </div>
                        <button onClick={() => removeLine(line.productId)} className="p-1 text-muted hover:text-danger ml-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Controls: Quantity + % Discount */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-muted text-[11px]">Cant:</span>
                          <button onClick={() => updateQty(line.productId, -1)} className="h-6 w-6 rounded bg-surface border border-border flex items-center justify-center hover:bg-surface-2">
                            <Minus className="h-3 w-3" />
                          </button>
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => setQty(line.productId, parseInt(e.target.value) || 1)}
                            className="w-9 h-6 text-center text-xs bg-surface border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button onClick={() => updateQty(line.productId, 1)} className="h-6 w-6 rounded bg-surface border border-border flex items-center justify-center hover:bg-surface-2">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded-lg border border-border">
                          <span className="text-[11px] text-muted font-medium">% Desc:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discount || ''}
                            onChange={(e) => setDiscount(line.productId, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-10 h-5 text-center text-xs bg-transparent text-text font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded"
                          />
                          <span className="text-[10px] text-muted">%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Totals + checkout */}
          <div className="p-4 border-t border-border space-y-3">
            {!activeCashSession && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                  Caja cerrada.
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickOpenCashModal(true)}
                  className="font-bold underline hover:opacity-80 text-xs text-amber-500 whitespace-nowrap ml-2"
                >
                  Abrir caja
                </button>
              </div>
            )}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal bruto</span>
                <span>{formatCurrency(subtotalGross, sym)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>Descuento aplicado</span>
                  <span>-{formatCurrency(totalDiscount, sym)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>IVA ({db.settings.taxRate}%)</span>
                <span>{formatCurrency(tax, sym)}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-lg text-text pt-1 border-t border-border">
                <span>Total a Pagar</span>
                <span>{formatCurrency(total, sym)}</span>
              </div>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={!activeCashSession ? () => setShowQuickOpenCashModal(true) : handleCheckout}
              disabled={cart.length === 0}
            >
              {!activeCashSession ? (
                <>
                  <Unlock className="h-5 w-5" /> Abrir Caja para Cobrar
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Cobrar
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Unified POS Checkout & Receipt Dialog */}
      <Dialog
        open={posStep !== 'closed'}
        onClose={() => setPosStep('closed')}
        title={posStep === 'checkout' ? 'Procesar Pago' : 'Venta Completada'}
        description={posStep === 'checkout' ? `Total a pagar: ${formatCurrency(total, sym)}` : undefined}
        size="md"
        footer={
          posStep === 'checkout' ? (
            <>
              <Button variant="outline" onClick={() => setPosStep('closed')}>
                Cancelar
              </Button>
              <Button onClick={confirmSale} size="lg">
                <CheckCircle2 className="h-5 w-5" /> Confirmar Venta
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimir Ticket Real
              </Button>
              <Button onClick={() => setPosStep('closed')}>
                Nueva Venta
              </Button>
            </>
          )
        }
      >
        {posStep === 'checkout' && (
          <div className="space-y-5">
            <div className="p-3 rounded-xl bg-surface-2 flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" /> Cliente seleccionado:
              </span>
              <span className="font-semibold text-text">
                {db.customers.find((c) => c.id === customerId)?.name || 'Público general'}
              </span>
            </div>

            {/* Financial Summary Breakdown */}
            <div className="p-3.5 rounded-xl bg-surface-2 space-y-1.5 text-sm border border-border">
              <div className="flex justify-between text-muted">
                <span>Subtotal bruto:</span>
                <span>{formatCurrency(subtotalGross, sym)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-500 font-medium">
                  <span>Descuento aplicado:</span>
                  <span>-{formatCurrency(totalDiscount, sym)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>IVA ({db.settings.taxRate}%):</span>
                <span>{formatCurrency(tax, sym)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-text pt-1.5 border-t border-border">
                <span>Total a pagar:</span>
                <span className="text-primary font-display">{formatCurrency(total, sym)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text mb-2">Método de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-xl border transition-all',
                      paymentMethod === pm.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-2'
                    )}
                  >
                    <pm.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'efectivo' && (
              <div className="space-y-3">
                <Input
                  type="number"
                  label="Efectivo recibido"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
                <div className="flex gap-2">
                  {[total, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000].map((amt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCashReceived(amt.toString())}
                      className="flex-1 py-2 rounded-lg bg-surface-2 hover:bg-surface border border-border text-sm font-medium text-text"
                    >
                      {formatCurrency(amt, sym)}
                    </button>
                  ))}
                </div>
                {change > 0 && (
                  <div className="p-3 rounded-xl bg-success/10 border border-success/20 flex items-center justify-between">
                    <span className="text-sm text-success font-medium">Cambio a devolver</span>
                    <span className="font-display font-bold text-success text-lg">{formatCurrency(change, sym)}</span>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Notas (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Referencia, observaciones..."
            />
          </div>
        )}

        {posStep === 'receipt' && lastSale && (
          <div className="text-center space-y-4 py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="h-8 w-8 text-success" />
            </motion.div>
            <div>
              <p className="font-display font-bold text-2xl text-text">{formatCurrency(lastSale.total, sym)}</p>
              <p className="text-sm text-muted">Folio de venta: {lastSale.reference}</p>
            </div>
            <div className="text-left text-sm space-y-2 border-t border-border pt-4 bg-surface-2/40 p-4 rounded-xl">
              <div className="flex justify-between"><span className="text-muted">Cliente</span><span className="font-semibold text-text">{lastSale.customerName}</span></div>
              <div className="flex justify-between"><span className="text-muted">Vendedor</span><span className="text-text">{lastSale.userName}</span></div>
              <div className="flex justify-between"><span className="text-muted">Forma de pago</span><span className="text-text capitalize font-medium">{lastSale.paymentMethod}</span></div>
              
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="flex justify-between text-xs text-muted"><span>Subtotal:</span><span>{formatCurrency(lastSale.subtotal, sym)}</span></div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-500 font-medium"><span>Descuento:</span><span>-{formatCurrency(lastSale.discount, sym)}</span></div>
                )}
                <div className="flex justify-between text-xs text-muted"><span>IVA ({db.settings.taxRate}%):</span><span>{formatCurrency(lastSale.tax, sym)}</span></div>
              </div>

              {lastSale.cashReceived > 0 && (
                <div className="flex justify-between"><span className="text-muted">Efectivo recibido</span><span className="text-text">{formatCurrency(lastSale.cashReceived, sym)}</span></div>
              )}
              {lastSale.change > 0 && (
                <div className="flex justify-between"><span className="text-muted">Cambio devuelto</span><span className="font-bold text-success">{formatCurrency(lastSale.change, sym)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted">Artículos vendidos</span><span className="text-text">{lastSale.items.reduce((s, i) => s + i.quantity, 0)} pzas</span></div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Quick Lookup Folio Dialog */}
      <Dialog
        open={showFolioModal}
        onClose={() => setShowFolioModal(false)}
        title="Consultar Venta por Folio"
        description="Busca cualquier recibo anterior e imprime su ticket"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Número de Folio o Cliente"
            placeholder="Ej. V-2026-00001"
            value={folioSearchInput}
            onChange={(e) => setFolioSearchInput(e.target.value)}
            autoFocus
          />

          <div className="max-h-60 overflow-y-auto space-y-2 sf-no-scrollbar">
            {searchedFolioSales.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Sin ventas con ese folio</p>
            ) : (
              searchedFolioSales.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setLastSale(s);
                    setPosStep('receipt');
                    setShowFolioModal(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-2 hover:bg-surface border border-border cursor-pointer transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text">{s.reference}</span>
                      <Badge variant="default" size="sm">{s.paymentMethod}</Badge>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{s.customerName} • {formatDateTime(s.createdAt)}</p>
                  </div>
                  <span className="font-bold text-primary text-sm">{formatCurrency(s.total, sym)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </Dialog>

      {/* Quick New Customer Dialog */}
      <Dialog
        open={showNewCustomerModal}
        onClose={() => setShowNewCustomerModal(false)}
        title="Crear Nuevo Cliente Rápido"
        description="Registra un cliente ingresando únicamente su nombre y cédula o NIT"
        size="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Nombre completo del cliente *"
            placeholder="Ej. Juan Carlos Ramírez"
            value={newCustForm.name}
            onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="Cédula / C.C. / NIT *"
            placeholder="Ej. 1.020.304.506"
            value={newCustForm.document}
            onChange={(e) => setNewCustForm({ ...newCustForm, document: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Input
              label="Teléfono / Celular (opcional)"
              placeholder="Ej. 310 123 4567"
              value={newCustForm.phone}
              onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
            />
            <Input
              label="Correo electrónico (opcional)"
              type="email"
              placeholder="cliente@correo.com"
              value={newCustForm.email}
              onChange={(e) => setNewCustForm({ ...newCustForm, email: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setShowNewCustomerModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <UserPlus className="h-4 w-4" /> Guardar y Seleccionar
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Quick Open Cash Dialog */}
      <Dialog
        open={showQuickOpenCashModal}
        onClose={() => setShowQuickOpenCashModal(false)}
        title="Apertura de Caja Rápida"
        description="Ingresa el monto base en efectivo para habilitar el Punto de Venta"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const amt = parseFloat(quickOpenAmount) || 0;
            openCash(amt);
            toast.success('Caja abierta', `Monto inicial: ${formatCurrency(amt, sym)}`);
            setShowQuickOpenCashModal(false);
          }}
          className="space-y-4"
        >
          <Input
            label="Monto inicial en caja (Base) *"
            type="number"
            value={quickOpenAmount}
            onChange={(e) => setQuickOpenAmount(e.target.value)}
            placeholder="50000"
            autoFocus
            required
          />
          <div className="flex gap-2">
            {[20000, 50000, 100000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setQuickOpenAmount(amt.toString())}
                className="flex-1 py-2 rounded-lg bg-surface-2 hover:bg-surface border border-border text-xs font-medium text-text transition-colors"
              >
                {formatCurrency(amt, sym)}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" type="button" onClick={() => setShowQuickOpenCashModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <Unlock className="h-4 w-4" /> Confirmar Apertura de Caja
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Real POS Thermal Ticket Printable Area */}
      {lastSale && (
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
            <p style={{ margin: '2px 0', textAlign: 'center', fontWeight: 'bold' }}>*** TICKET DE VENTA ***</p>
            <p style={{ margin: '2px 0' }}>Folio: <strong>{lastSale.reference}</strong></p>
            <p style={{ margin: '2px 0' }}>Fecha: {formatDateTime(lastSale.createdAt)}</p>
            <p style={{ margin: '2px 0' }}>Cliente: <strong>{lastSale.customerName}</strong></p>
            <p style={{ margin: '2px 0' }}>Atendido por: {lastSale.userName}</p>
            <p style={{ margin: '2px 0' }}>Pago: <span style={{ textTransform: 'capitalize' }}>{lastSale.paymentMethod}</span></p>
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
              {lastSale.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ paddingTop: '3px', verticalAlign: 'top' }}>
                    {item.quantity}x {item.productName}
                    <br />
                    <span style={{ fontSize: '9px', color: '#444' }}>
                      @ {formatCurrency(item.price, sym)}
                      {item.discount > 0 && ` (-${item.discount}% desc)`}
                    </span>
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
            <p style={{ margin: '2px 0' }}>Subtotal bruto: {formatCurrency(lastSale.subtotal + (lastSale.discount || 0), sym)}</p>
            {lastSale.discount > 0 && (
              <p style={{ margin: '2px 0', color: '#059669' }}>Descuento total: -{formatCurrency(lastSale.discount, sym)}</p>
            )}
            <p style={{ margin: '2px 0' }}>IVA ({db.settings.taxRate}%): {formatCurrency(lastSale.tax, sym)}</p>
            <p style={{ margin: '4px 0', fontSize: '13px', fontWeight: 'bold' }}>TOTAL: {formatCurrency(lastSale.total, sym)}</p>
            {lastSale.paymentMethod === 'efectivo' && (
              <>
                <p style={{ margin: '2px 0' }}>Recibido: {formatCurrency(lastSale.cashReceived, sym)}</p>
                <p style={{ margin: '2px 0' }}>Cambio: {formatCurrency(lastSale.change, sym)}</p>
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
