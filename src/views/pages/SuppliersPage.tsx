import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, Receipt } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { canPerformAction } from '@/controllers/permissions';
import { Button } from '@/views/components/ui/Button';
import { Input, Textarea } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { Dialog } from '@/views/components/ui/Dialog';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatCurrency, generateId, cn } from '@/lib/utils';
import type { Supplier } from '@/models/types';

const empty = (): Supplier => ({
  id: generateId('sup'), name: '', contact: '', phone: '', email: '', address: '', taxId: '', balance: 0, createdAt: new Date().toISOString(),
});

export function SuppliersPage() {
  const { db, upsertSupplier, deleteSupplier, currentUser } = useStore();
  const toast = useToast();
  const sym = db.settings.currencySymbol;
  const canCreate = canPerformAction(currentUser?.role, 'supplier.create');
  const canEdit = canPerformAction(currentUser?.role, 'supplier.edit');
  const canDelete = canPerformAction(currentUser?.role, 'supplier.delete');

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return db.suppliers;
    const q = search.toLowerCase();
    return db.suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.phone.includes(q));
  }, [db.suppliers, search]);

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name) { toast.error('Nombre requerido'); return; }
    upsertSupplier(editing);
    toast.success('Proveedor guardado', editing.name);
    setShowForm(false); setEditing(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSupplier(deleteId);
    toast.success('Proveedor eliminado');
    setDeleteId(null);
  };

  const supplierPurchases = (id: string) => db.purchases.filter((p) => p.supplierId === id);
  const totalPurchased = (id: string) => supplierPurchases(id).reduce((s, p) => s + p.total, 0);

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Proveedor',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center"><Truck className="h-4 w-4 text-accent" /></div>
          <div><p className="font-medium text-text">{s.name}</p><p className="text-xs text-muted">{s.contact || 'Sin contacto'}</p></div>
        </div>
      ),
    },
    { key: 'phone', header: 'Teléfono', render: (s) => <span className="text-muted">{s.phone || '—'}</span> },
    { key: 'taxId', header: 'RFC / Tax ID', render: (s) => <span className="text-muted">{s.taxId || '—'}</span> },
    { key: 'purchases', header: 'Compras', align: 'center', render: (s) => <Badge variant="info">{supplierPurchases(s.id).length}</Badge> },
    { key: 'total', header: 'Total comprado', align: 'right', render: (s) => <span className="font-medium text-text">{formatCurrency(totalPurchased(s.id), sym)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); setViewing(s); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-text"><Receipt className="h-4 w-4" /></button>
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); setEditing(s); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-muted hover:text-text"><Pencil className="h-4 w-4" /></button>
          )}
          {canDelete && (
            <button onClick={(e) => { e.stopPropagation(); setDeleteId(s.id); }} className="p-1.5 rounded-lg hover:bg-danger/10 text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Proveedores' }]} className="mb-3" />
      <PageHeader title="Proveedores" description={`${db.suppliers.length} proveedores`} icon={<Truck className="h-5 w-5" />}
        actions={canCreate ? <Button onClick={() => { setEditing(empty()); setShowForm(true); }}><Plus className="h-4 w-4" /> Nuevo proveedor</Button> : undefined} />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total proveedores', value: db.suppliers.length, icon: Truck, color: 'bg-accent' },
          { label: 'Compras registradas', value: db.purchases.length, icon: Receipt, color: 'bg-info' },
          { label: 'Total comprado', value: formatCurrency(db.purchases.reduce((s, p) => s + p.total, 0), sym), icon: Receipt, color: 'bg-success' },
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
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={<Truck className="h-10 w-10" />} title="Sin proveedores" action={canCreate ? <Button onClick={() => { setEditing(empty()); setShowForm(true); }}><Plus className="h-4 w-4" /> Agregar</Button> : undefined} />
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} onRowClick={(s) => setViewing(s)} />
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditing(null); }} title={editing && db.suppliers.some((s) => s.id === editing.id) ? 'Editar proveedor' : 'Nuevo proveedor'} size="md" footer={<><Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</Button><Button onClick={handleSave}>Guardar</Button></>}>
        {editing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre / Razón social" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input label="Contacto" value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} />
            <Input label="Teléfono" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            <Input label="Correo" type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            <Input label="RFC / Tax ID" value={editing.taxId} onChange={(e) => setEditing({ ...editing, taxId: e.target.value })} />
            <Input type="number" step="0.01" label="Saldo pendiente" value={editing.balance} onChange={(e) => setEditing({ ...editing, balance: parseFloat(e.target.value) || 0 })} />
            <Textarea label="Dirección" value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="sm:col-span-2" />
          </div>
        )}
      </Dialog>

      <Dialog open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name} size="md">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-muted">Contacto</p><p className="text-sm font-medium text-text">{viewing.contact || '—'}</p></div>
              <div className="p-3 rounded-xl bg-surface-2"><p className="text-xs text-muted">RFC</p><p className="text-sm font-medium text-text">{viewing.taxId || '—'}</p></div>
              <div className="p-3 rounded-xl bg-surface-2 flex items-center gap-2"><Phone className="h-4 w-4 text-muted" /><span className="text-sm text-text">{viewing.phone || '—'}</span></div>
              <div className="p-3 rounded-xl bg-surface-2 flex items-center gap-2"><Mail className="h-4 w-4 text-muted" /><span className="text-sm text-text truncate">{viewing.email || '—'}</span></div>
              <div className="p-3 rounded-xl bg-surface-2 flex items-center gap-2 col-span-2"><MapPin className="h-4 w-4 text-muted" /><span className="text-sm text-text">{viewing.address || '—'}</span></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-text mb-2">Historial de compras</p>
              {supplierPurchases(viewing.id).length === 0 ? (
                <EmptyState title="Sin compras" />
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto sf-no-scrollbar">
                  {supplierPurchases(viewing.id).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2">
                      <div><p className="text-sm font-medium text-text">{p.reference}</p><p className="text-xs text-muted">{p.invoiceNumber} · {p.items.length} items</p></div>
                      <div className="flex items-center gap-2">
                        <Badge variant={p.status === 'recibida' ? 'success' : p.status === 'pendiente' ? 'warning' : 'danger'}>{p.status}</Badge>
                        <span className="text-sm font-semibold text-text">{formatCurrency(p.total, sym)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar proveedor" size="sm" footer={<><Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Eliminar</Button></>}>
        <p className="text-sm text-muted">¿Eliminar este proveedor?</p>
      </Dialog>
    </div>
  );
}
