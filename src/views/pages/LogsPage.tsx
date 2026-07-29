import { useState, useMemo } from 'react';
import { Shield, Search, Download, User } from 'lucide-react';
import { useStore } from '@/controllers/StoreController';
import { useToast } from '@/views/components/ui/Toast';
import { Button } from '@/views/components/ui/Button';
import { Input } from '@/views/components/ui/Input';
import { Card, CardContent, Badge, EmptyState } from '@/views/components/ui/Card';
import { DataTable, type Column } from '@/views/components/ui/DataTable';
import { Breadcrumb } from '@/views/components/ui/Breadcrumb';
import { PageHeader } from '@/views/components/ui/PageHeader';
import { formatDateTime, exportToExcel } from '@/lib/utils';
import type { ActivityLog } from '@/models/types';

export function LogsPage() {
  const { db } = useStore();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const logs = useMemo(() => {
    return [...(db.logs || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [db.logs]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.detail.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      toast.warning('Sin registros', 'No hay datos en la bitácora para exportar');
      return;
    }
    const headers = ['ID Registro', 'Fecha y Hora', 'Acción Realizada', 'Detalle de la Actividad', 'Usuario'];
    const rows = filteredLogs.map((l) => [
      l.id,
      formatDateTime(l.createdAt),
      l.action,
      l.detail,
      l.userName,
    ]);

    const filename = `bitacora_actividad_${new Date().toISOString().slice(0, 10)}.xlsx`;
    exportToExcel(filename, headers, rows, 'Bitacora_Actividad');
    toast.success('Bitácora exportada', 'El archivo de Excel (.xlsx) se descargó correctamente');
  };

  const columns: Column<ActivityLog>[] = [
    {
      key: 'createdAt',
      header: 'Fecha y Hora',
      render: (l: ActivityLog) => (
        <span className="text-xs text-muted font-medium font-mono whitespace-nowrap">
          {formatDateTime(l.createdAt)}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Acción',
      render: (l: ActivityLog) => (
        <Badge variant="info" className="font-semibold whitespace-nowrap">
          {l.action}
        </Badge>
      ),
    },
    {
      key: 'detail',
      header: 'Detalle / Descripción',
      render: (l: ActivityLog) => (
        <p className="text-sm text-text max-w-md line-clamp-2" title={l.detail}>
          {l.detail}
        </p>
      ),
    },
    {
      key: 'userName',
      header: 'Usuario',
      render: (l: ActivityLog) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-text">
          <User className="h-3.5 w-3.5 text-primary" />
          <span>{l.userName}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Inicio', href: '/app' }, { label: 'Bitácora' }]} />

      <PageHeader
        title="Bitácora de Actividad"
        description="Histórico de auditoría, seguridad y registro de operaciones del sistema"
        icon={<Shield className="h-5 w-5 text-primary" />}
        actions={
          <Button onClick={handleExportExcel} className="shadow-sm">
            <Download className="h-4 w-4" /> Exportar a Excel
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por acción, detalle o usuario..."
              className="pl-10"
            />
          </div>

          <DataTable<ActivityLog>
            data={filteredLogs}
            columns={columns}
            rowKey={(l) => l.id}
            empty={
              <EmptyState
                icon={<Shield className="h-10 w-10 text-muted" />}
                title="Sin registros de actividad"
                description="Las acciones de los usuarios aparecerán registradas aquí automáticamente"
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
