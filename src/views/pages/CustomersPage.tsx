import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, Wallet, ChevronDown, ChevronUp, ShoppingBag, Calendar, CreditCard, UserCheck, Package, DollarSign, Banknote } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Textarea, Select } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, formatDate, formatDateTime, generateId, generateSequentialId, cn } from '@/lib/utils';
import type { Customer, PaymentMethod } from '@/models/types';

const empty = (existingCustomers: Customer[] = []): Customer => ({
  id: generateSequentialId('cus', existingCustomers.map((c) => c.id)), name: '', document: '', phone: '', email: '', address: '', balance: 0, notes: '', createdAt: new Date().toISOString(),
});

export function CustomersPage() {
  const { db, upsertCustomer, deleteCustomer, addCustomerPayment, currentUser } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canCreate = canPerformAction(currentUser?.role, 'customer.create');
  const canEdit = canPerformAction(currentUser?.role, 'customer.edit');
  const canDelete = canPerformAction(currentUser?.role, 'customer.delete');

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [expandedSaleIds, setExpandedSaleIds] = useState<Record<string, boolean>>({});

  // Abono state
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  const filtered = useMemo(() => {
    if (!search.trim()) return db.customers;
    const q = search.toLowerCase();
    return db.customers.filter((c) => c.name.toLowerCase().includes(q) || c.document.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q));
  }, [db.customers, search]);

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error('Nombre requerido', 'Ingresa el nombre del cliente'); return; }

    const docToTest = (editing.document || '').trim();
    if (docToTest) {
      const clean = docToTest.replace(/[\s.-]/g, '').toLowerCase();
      const duplicate = db.customers.find(
        (c) => c.id !== editing.id && c.document && c.document.replace(/[\s.-]/g, '').toLowerCase() === clean
      );
      if (duplicate) {
        toast.error(
          'Documento duplicado',
          `La cédula/NIT "${docToTest}" ya está registrada para el cliente "${duplicate.name}"`
        );
        return;
      }
    }

    upsertCustomer({ ...editing, name: editing.name.trim(), document: docToTest });
    toast.success('Cliente guardado', editing.name);
    setShowForm(false); setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteCustomer(deleteId);
    toast.success('Cliente eliminado');
    setDeleteId(null);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Monto inválido', 'Ingresa un monto positivo para abonar');
      return;
    }
    if (amt > paymentCustomer.balance) {
      toast.warning('Exceso de abono', `El saldo pendiente es de ${formatCurrency(paymentCustomer.balance, sym)}`);
    }

    addCustomerPayment(paymentCustomer.id, amt, paymentMethod, paymentNotes);
    toast.success('Abono registrado', `Se abonó ${formatCurrency(amt, sym)} a la cuenta de ${paymentCustomer.name}`);
    setPaymentCustomer(null);
    setPaymentAmount('');
    setPaymentNotes('');
    setPaymentMethod('efectivo');

    // Update viewing customer if open
    if (viewing && viewing.id === paymentCustomer.id) {
      const updated = db.customers.find((c) => c.id === paymentCustomer.id);
      if (updated) setViewing(updated);
    }
  };

  const customerSales = (id: string) => db.sales.filter((s) => s.customerId === id);
  const totalSpent = (id: string) => customerSales(id).reduce((s, sale) => s + sale.total, 0);

  const toggleSaleExpand = (saleId: string) => {
    setExpandedSaleIds((prev) => ({
      ...prev,
      [saleId]: !prev[saleId],
    }));
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-primary font-semibold text-sm">{c.name.charAt(0)}</div>
          <div><p className="font-medium text-text">{c.name}</p><p className="text-xs text-muted">{c.document || 'Sin documento'}</p></div>
        </div>
      ),
    },
    { key: 'phone', header: 'Teléfono', render: (c) => <span className="text-muted">{c.phone || '—'}</span> },
    { key: 'email', header: 'Correo', render: (c) => <span className="text-muted">{c.email || '—'}</span> },
    { key: 'sales', header: 'Compras', align: 'center', render: (c) => <Badge variant="info">{customerSales(c.id).length}</Badge> },
    { key: 'spent', header: 'Total comprado', align: 'right', render: (c) => <span className="font-medium text-text">{formatCurrency(totalSpent(c.id), sym)}</span> },
    {
      key: 'balance',
      header: 'Saldo pendiente',
      align: 'right',
      render: (c) =>
        c.balance > 0 ? (
          <div className="flex items-center justify-end gap-2">
            <Badge variant="danger">{formatCurrency(c.balance, sym)}</Badge>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPaymentCustomer(c);
                setPaymentAmount(c.balance.toString());
              }}
              className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <DollarSign className="h-3 w-3" /> Abonar
            </button>
          </div>
        ) : (
          <Badge variant="success">Pagado</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); setViewing(c); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-text" title="Ver detalles e historial"><Users className="h-4 w-4" /></button>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); setEditing(c); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-text" title="Editar cliente"><Pencil className="h-4 w-4" /></button>
          )}
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }} className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger" title="Eliminar cliente"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Clientes' }]} className="mb-3" />
      <PageHeader title="Clientes" description={`${db.customers.length} clientes registrados`} icon={<Users className="h-5 w-5" />}
        actions={canCreate ? <Button onClick={() => { setEditing(empty(db.customers)); setShowForm(true); }}><Plus className="h-4 w-4" /> Nuevo cliente</Button> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total clientes', value: db.customers.length, icon: Users, color: 'bg-info' },
          { label: 'Con saldo pendiente (Crédito)', value: db.customers.filter((c) => c.balance > 0).length, icon: Wallet, color: 'bg-danger' },
          { label: 'Cartera por cobrar', value: formatCurrency(db.customers.reduce((s, c) => s + c.balance, 0), sym), icon: Wallet, color: 'bg-warning' },
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente por nombre, documento, teléfono..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={<Users className="h-10 w-10" />} title="Sin clientes" action={canCreate ? <Button onClick={() => { setEditing(empty()); setShowForm(true); }}><Plus className="h-4 w-4" /> Agregar</Button> : undefined} />
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(c) => c.id} onRowClick={(c) => setViewing(c)} />
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing && db.customers.some((c) => c.id === editing.id) ? 'Editar cliente' : 'Nuevo cliente'} size="md" footer={<><Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre completo *" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
            <Input label="Documento / C.C. / NIT" value={editing.document} onChange={(e) => setEditing({ ...editing, document: e.target.value })} />
            <Input label="Teléfono / Celular" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <Input label="Correo electrónico" type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            <Input label="Dirección" value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="sm:col-span-2" />
            <Input type="number" step="0.01" label="Saldo pendiente" value={editing.balance} onChange={(e) => setEditing({ ...editing, balance: parseFloat(e.target.value) || 0 })} />
            <Textarea label="Notas u observaciones" value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} className="sm:col-span-2" />
          </div>
        )}
      </Dialog>

      {/* Abono / Registrar Pago Dialog */}
      <Dialog
        open={!!paymentCustomer}
        onClose={() => setPaymentCustomer(null)}
        title={`Registrar Abono a Cartera: ${paymentCustomer?.name}`}
        description={`Saldo pendiente actual: ${formatCurrency(paymentCustomer?.balance || 0, sym)}`}
        size="sm"
      >
        {paymentCustomer && (
          <form onSubmit={handlePayment} className="space-y-4">
            <Input
              type="number"
              step="0.01"
              label="Monto del abono *"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              autoFocus
            />

            <div>
              <p className="text-xs font-medium text-text mb-1">Método de recepción de dinero</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo' as const, label: 'Efectivo', icon: Banknote },
                  { id: 'tarjeta' as const, label: 'Tarjeta', icon: CreditCard },
                  { id: 'transferencia' as const, label: 'Transferencia', icon: Wallet },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-medium transition-all',
                      paymentMethod === pm.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted hover:bg-surface-2'
                    )}
                  >
                    <pm.icon className="h-4 w-4" />
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Notas u observaciones (opcional)"
              placeholder="Ej. Recibo de caja No. 123..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" type="button" onClick={() => setPaymentCustomer(null)}>
                Cancelar
              </Button>
              <Button type="submit">
                <DollarSign className="h-4 w-4" /> Guardar Abono
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Detail Dialog with Full Expandable Purchase History */}
      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={`Detalle del Cliente: ${viewing?.name}`} size="lg">
        {viewing && (
          <div className="space-y-5">
            {/* Contact info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <p className="text-xs text-muted">Documento / NIT</p>
                <p className="text-sm font-semibold text-text mt-0.5">{viewing.document || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <p className="text-xs text-muted">Total Compras</p>
                <p className="text-sm font-semibold text-text mt-0.5">{customerSales(viewing.id).length} ventas</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border">
                <p className="text-xs text-muted">Total Gastado</p>
                <p className="text-sm font-semibold text-primary mt-0.5">{formatCurrency(totalSpent(viewing.id), sym)}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Saldo Pendiente</p>
                  <p className={cn("text-sm font-bold mt-0.5", viewing.balance > 0 ? "text-danger" : "text-success")}>
                    {formatCurrency(viewing.balance, sym)}
                  </p>
                </div>
                {viewing.balance > 0 && (
                  <button
                    onClick={() => {
                      setPaymentCustomer(viewing);
                      setPaymentAmount(viewing.balance.toString());
                    }}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    title="Abonar a cuenta"
                  >
                    <DollarSign className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0"><p className="text-[10px] text-muted">Teléfono</p><p className="text-xs font-medium text-text truncate">{viewing.phone || '—'}</p></div>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0"><p className="text-[10px] text-muted">Correo</p><p className="text-xs font-medium text-text truncate">{viewing.email || '—'}</p></div>
              </div>
              <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0"><p className="text-[10px] text-muted">Dirección</p><p className="text-xs font-medium text-text truncate">{viewing.address || '—'}</p></div>
              </div>
            </div>

            {/* Purchase History Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Historial Detallado de Compras
                </h3>
                <span className="text-xs text-muted">
                  Toca cualquier venta para desplegar sus productos
                </span>
              </div>

              {customerSales(viewing.id).length === 0 ? (
                <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Sin historial de compras" description="Este cliente aún no tiene ventas registradas a su nombre." />
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto sf-no-scrollbar pr-1">
                  {customerSales(viewing.id).map((sale) => {
                    const isExpanded = Boolean(expandedSaleIds[sale.id]);
                    const itemCount = sale.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <div
                        key={sale.id}
                        className="rounded-xl border border-border bg-surface overflow-hidden transition-all shadow-sm"
                      >
                        {/* Sale Card Header Accordion Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleSaleExpand(sale.id)}
                          className="w-full p-3.5 flex items-center justify-between bg-surface-2/60 hover:bg-surface-2 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <ShoppingBag className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-sm text-text">{sale.reference}</span>
                                <Badge variant={sale.paymentMethod === 'credito' ? 'warning' : 'success'} size="sm">
                                  {sale.paymentMethod === 'credito' ? 'Crédito' : sale.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDateTime(sale.createdAt)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><CreditCard className="h-3 w-3 capitalize" /> {sale.paymentMethod}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-display font-bold text-sm text-primary">{formatCurrency(sale.total, sym)}</p>
                              <p className="text-[11px] text-muted">{itemCount} producto{itemCount !== 1 ? 's' : ''}</p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted shrink-0" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-border p-3.5 bg-surface"
                            >
                              <div className="flex items-center justify-between text-xs text-muted mb-2">
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3.5 w-3.5 text-primary" /> Atendido por: <strong className="text-text">{sale.userName}</strong>
                                </span>
                                <span>ID Venta: {sale.id}</span>
                              </div>

                              {/* Products Table */}
                              <div className="overflow-x-auto rounded-lg border border-border mb-3">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-surface-2 text-muted font-semibold">
                                    <tr>
                                      <th className="p-2">Producto</th>
                                      <th className="p-2 text-center">Cant.</th>
                                      <th className="p-2 text-right">Precio Unit.</th>
                                      <th className="p-2 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {sale.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-surface-2/40">
                                        <td className="p-2 font-medium text-text">
                                          <div className="flex items-center gap-1.5">
                                            <Package className="h-3.5 w-3.5 text-muted shrink-0" />
                                            <span>{item.productName}</span>
                                          </div>
                                        </td>
                                        <td className="p-2 text-center text-text font-medium">{item.quantity}</td>
                                        <td className="p-2 text-right text-muted">{formatCurrency(item.price, sym)}</td>
                                        <td className="p-2 text-right font-semibold text-text">{formatCurrency(item.subtotal, sym)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Totals Breakdown */}
                              <div className="flex justify-between items-center text-xs bg-surface-2/50 p-2.5 rounded-lg border border-border">
                                <div className="space-x-3 text-muted">
                                  <span>Subtotal: <strong className="text-text">{formatCurrency(sale.subtotal, sym)}</strong></span>
                                  <span>IVA ({db.settings.taxRate}%): <strong className="text-text">{formatCurrency(sale.tax, sym)}</strong></span>
                                </div>
                                <div>
                                  <span className="text-text font-semibold">Total: </span>
                                  <span className="font-display font-bold text-primary text-sm">{formatCurrency(sale.total, sym)}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar cliente" size="sm" footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Eliminar</Button></>}>
        <p className="text-sm text-muted">¿Eliminar este cliente? Esta acción no se puede deshacer.</p>
      </Dialog>
    </div>
  );
}
