'use client';

import React, { useMemo, useState } from 'react';

import { webConfig } from '../../lib/api';
import { createTenantUser, hasAnyPermission, requestWithToken, updateTenantSettings, updateTenantUserRole } from '../../lib/erptry-client';
import { useDashboard } from './dashboard-context';

function formatMoney(valueCents: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(valueCents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium'
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function toDateTimeLocalInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocalInput(value: string) {
  return new Date(value).toISOString();
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body py-5 text-center">
        <h3 className="h5">{title}</h3>
        <p className="text-body-secondary mb-0">{copy}</p>
      </div>
    </div>
  );
}

function SectionHeading({ title, copy, badge }: { title: string; copy: string; badge?: string }) {
  return (
    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
      <div>
        <p className="text-uppercase text-body-secondary small mb-1">Modulo</p>
        <h1 className="h3 mb-1">{title}</h1>
        <p className="text-body-secondary mb-0">{copy}</p>
      </div>
      {badge ? <span className="badge rounded-pill text-bg-primary px-3 py-2">{badge}</span> : null}
    </div>
  );
}

function ActionNotice({ message, variant }: { message: string; variant: 'success' | 'danger' }) {
  return <div className={`alert alert-${variant} mt-3 mb-0`}>{message}</div>;
}

function parseError(error: unknown) {
  return error instanceof Error ? error.message : 'La accion no se pudo completar.';
}

function formatRoleLabel(roleCode: string) {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    manager: 'Manager',
    operator: 'Operator',
    viewer: 'Viewer'
  };

  return labels[roleCode] ?? roleCode;
}

function useManageFlag(permissionCodes: string[], expected: string[]) {
  return hasAnyPermission(permissionCodes, expected);
}

async function performModuleAction<T>(token: string, path: string, key: string, value: unknown) {
  return requestWithToken<T>(webConfig.browserApiBaseUrl, path, token, key, value);
}

type SaleLineForm = {
  catalogItemId: string;
  quantity: number;
};

function DashboardSummaryCards() {
  const { clients, payments, reservations, sales } = useDashboard();

  return (
    <div className="row g-3">
      <div className="col-12 col-md-6 col-xl-3"><div className="erp-stat-card h-100"><span className="text-body-secondary small">Clientes</span><div className="display-6 fw-semibold">{clients.length}</div></div></div>
      <div className="col-12 col-md-6 col-xl-3"><div className="erp-stat-card h-100"><span className="text-body-secondary small">Ventas activas</span><div className="display-6 fw-semibold">{sales.length}</div></div></div>
      <div className="col-12 col-md-6 col-xl-3"><div className="erp-stat-card h-100"><span className="text-body-secondary small">Cobros</span><div className="display-6 fw-semibold">{payments.length}</div></div></div>
      <div className="col-12 col-md-6 col-xl-3"><div className="erp-stat-card h-100"><span className="text-body-secondary small">Reservas</span><div className="display-6 fw-semibold">{reservations.length}</div></div></div>
    </div>
  );
}

export function DashboardHomeView() {
  const { catalogItems, clients, employees, internalTasks, invoices, manifest, overview, payments, reservations, sales, session } = useDashboard();

  if (!session || !overview) {
    return null;
  }

  const wonSales = sales.filter((sale) => sale.stage === 'won');
  const pendingInvoices = invoices.filter((invoice) => invoice.balanceCents > 0);

  return (
    <div className="d-grid gap-4">
      <section className="card border-0 shadow-sm bg-white">
        <div className="card-body p-4 p-xl-5">
          <SectionHeading title="Centro de control" copy="Resumen rapido del tenant y acceso directo a los modulos ya separados." badge={session.actor.role} />
          <DashboardSummaryCards />
        </div>
      </section>

      <section className="row g-3">
        <div className="col-12 col-md-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><span className="text-body-secondary small">Clientes</span><div className="display-6 fw-semibold">{clients.length}</div></div></div></div>
        <div className="col-12 col-md-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><span className="text-body-secondary small">Ventas ganadas</span><div className="display-6 fw-semibold">{wonSales.length}</div></div></div></div>
        <div className="col-12 col-md-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><span className="text-body-secondary small">Facturas pendientes</span><div className="display-6 fw-semibold">{pendingInvoices.length}</div></div></div></div>
        <div className="col-12 col-md-6 col-xl-3"><div className="card border-0 shadow-sm h-100"><div className="card-body"><span className="text-body-secondary small">Cobros confirmados</span><div className="display-6 fw-semibold">{payments.filter((payment) => payment.status === 'confirmed').length}</div></div></div></div>
      </section>

      <section className="row g-4">
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <SectionHeading title="Ruta de trabajo" copy="Owner ya puede operar CRUD sobre los modulos principales desde vistas separadas." badge={session.actor.role} />
              <div className="row g-3">
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/clients"><div className="card-body"><h4 className="h6">Clientes</h4><p className="text-body-secondary mb-0">Base comercial y contactos.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/catalog"><div className="card-body"><h4 className="h6">Catalogo</h4><p className="text-body-secondary mb-0">Servicios y productos activos.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/sales"><div className="card-body"><h4 className="h6">Ventas</h4><p className="text-body-secondary mb-0">Oportunidades y pipeline.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/invoices"><div className="card-body"><h4 className="h6">Facturas</h4><p className="text-body-secondary mb-0">Emitidas, saldo y cobro.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/payments"><div className="card-body"><h4 className="h6">Cobros</h4><p className="text-body-secondary mb-0">Entradas financieras por factura.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/employees"><div className="card-body"><h4 className="h6">Empleados</h4><p className="text-body-secondary mb-0">Equipo operativo del tenant.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/tasks"><div className="card-body"><h4 className="h6">Tareas</h4><p className="text-body-secondary mb-0">Seguimiento interno y prioridades.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/reservations"><div className="card-body"><h4 className="h6">Reservas</h4><p className="text-body-secondary mb-0">Agenda y coordinacion de recursos.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/users"><div className="card-body"><h4 className="h6">Usuarios</h4><p className="text-body-secondary mb-0">Alta y asignacion de acceso del tenant.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/roles"><div className="card-body"><h4 className="h6">Roles</h4><p className="text-body-secondary mb-0">Catalogo ACL y permisos disponibles.</p></div></a></div>
                <div className="col-md-4"><a className="erp-module-link card text-decoration-none h-100 border-primary-subtle" href="/dashboard/settings"><div className="card-body"><h4 className="h6">Settings</h4><p className="text-body-secondary mb-0">Configuracion basica del tenant.</p></div></a></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">Estado del tenant</h3>
              <div className="row g-2 mb-3">
                <div className="col-6"><div className="border rounded p-2 small"><div className="text-body-secondary">Items catalogo</div><strong>{catalogItems.length}</strong></div></div>
                <div className="col-6"><div className="border rounded p-2 small"><div className="text-body-secondary">Cobros</div><strong>{payments.length}</strong></div></div>
                <div className="col-6"><div className="border rounded p-2 small"><div className="text-body-secondary">Empleados</div><strong>{employees.length}</strong></div></div>
                <div className="col-6"><div className="border rounded p-2 small"><div className="text-body-secondary">Reservas</div><strong>{reservations.length}</strong></div></div>
                <div className="col-12"><div className="border rounded p-2 small"><div className="text-body-secondary">Tareas internas</div><strong>{internalTasks.length}</strong></div></div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {(manifest?.modules ?? []).slice(0, 8).map((moduleName) => (
                  <span key={moduleName} className="badge text-bg-light border">{moduleName}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ClientsModuleView() {
  const { clients, refresh, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['sales.manage']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', segment: 'general', notes: '' });

  async function submitClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null);
    setError(null);

    try {
      if (editingId) {
        await performModuleAction(token, '/api/clients/update', 'client', { id: editingId, ...form });
        setMessage('Cliente actualizado.');
      } else {
        await performModuleAction(token, '/api/clients/create', 'client', form);
        setMessage('Cliente creado.');
      }
      setEditingId(null);
      setForm({ fullName: '', email: '', phone: '', segment: 'general', notes: '' });
      await refresh();
    } catch (cause) {
      setError(parseError(cause));
    }
  }

  async function handleDelete(clientId: string) {
    if (!token || !window.confirm('Se eliminara el cliente si no tiene relaciones.')) return;
    setMessage(null);
    setError(null);

    try {
      await performModuleAction(token, '/api/clients/delete', 'client', { clientId });
      setMessage('Cliente eliminado.');
      await refresh();
    } catch (cause) {
      setError(parseError(cause));
    }
  }

  return (
    <div className="d-grid gap-4">
      <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Clientes" copy="Vista modular simple con Bootstrap." badge={`${clients.length} registros`} />
        {canManage ? <form className="row g-3" onSubmit={submitClient}><div className="col-md-4"><input className="form-control" placeholder="Nombre" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div><div className="col-md-4"><input className="form-control" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" /></div><div className="col-md-4"><input className="form-control" placeholder="Telefono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="col-md-4"><input className="form-control" placeholder="Segmento" value={form.segment} onChange={(event) => setForm({ ...form, segment: event.target.value })} required /></div><div className="col-md-8"><input className="form-control" placeholder="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar cliente' : 'Crear cliente'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm({ fullName: '', email: '', phone: '', segment: 'general', notes: '' }); }}>Cancelar</button> : null}</div></form> : null}
        {message ? <ActionNotice message={message} variant="success" /> : null}
        {error ? <ActionNotice message={error} variant="danger" /> : null}
      </div></div>
      {clients.length === 0 ? <EmptyState title="Sin clientes visibles" copy="Este perfil no tiene acceso comercial o el tenant aun no tiene clientes cargados." /> : <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Cliente</th><th>Segmento</th><th>Email</th><th>Telefono</th>{canManage ? <th /> : null}</tr></thead><tbody>{clients.map((client) => <tr key={client.id}><td><div className="fw-semibold">{client.fullName}</div>{client.notes ? <div className="small text-body-secondary">{client.notes}</div> : null}</td><td><span className="badge text-bg-light border">{client.segment}</span></td><td>{client.email ?? 'Sin email'}</td><td>{client.phone ?? 'Sin telefono'}</td>{canManage ? <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(client.id); setForm({ fullName: client.fullName, email: client.email ?? '', phone: client.phone ?? '', segment: client.segment, notes: client.notes ?? '' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(client.id)}>Eliminar</button></div></td> : null}</tr>)}</tbody></table></div></div></div>}
    </div>
  );
}

export function CatalogModuleView() {
  const { catalogItems, refresh, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['sales.manage']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', kind: 'service', priceCents: 0, durationMin: '', sku: '', notes: '', status: 'active' });

  async function submitItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    const payload = { ...form, durationMin: form.durationMin ? Number(form.durationMin) : null };
    try {
      if (editingId) {
        await performModuleAction(token, '/api/catalog/update', 'item', { id: editingId, ...payload });
        setMessage('Item actualizado.');
      } else {
        await performModuleAction(token, '/api/catalog/create', 'item', payload);
        setMessage('Item creado.');
      }
      setEditingId(null);
      setForm({ name: '', kind: 'service', priceCents: 0, durationMin: '', sku: '', notes: '', status: 'active' });
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(itemId: string) {
    if (!token || !window.confirm('Se eliminara el item si no tiene uso en ventas o facturas.')) return;
    try { await performModuleAction(token, '/api/catalog/delete', 'item', { itemId }); setMessage('Item eliminado.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4"><div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Catalogo" copy="Productos y servicios publicados para ventas y facturacion." badge={`${catalogItems.length} items`} />{canManage ? <form className="row g-3" onSubmit={submitItem}><div className="col-md-4"><input className="form-control" placeholder="Nombre" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="col-md-2"><select className="form-select" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="service">Servicio</option><option value="product">Producto</option></select></div><div className="col-md-2"><input className="form-control" type="number" min="0" placeholder="Precio" value={form.priceCents} onChange={(event) => setForm({ ...form, priceCents: Number(event.target.value) || 0 })} required /></div><div className="col-md-2"><input className="form-control" type="number" min="0" placeholder="Duracion" value={form.durationMin} onChange={(event) => setForm({ ...form, durationMin: event.target.value })} /></div><div className="col-md-2"><select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Activo</option><option value="archived">Archivado</option></select></div><div className="col-md-3"><input className="form-control" placeholder="SKU" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></div><div className="col-md-9"><input className="form-control" placeholder="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar item' : 'Crear item'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm({ name: '', kind: 'service', priceCents: 0, durationMin: '', sku: '', notes: '', status: 'active' }); }}>Cancelar</button> : null}</div></form> : null}{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div>{catalogItems.length === 0 ? <EmptyState title="Sin catalogo visible" copy="Este perfil no puede consultar catalogo o aun no hay items cargados." /> : <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Item</th><th>Tipo</th><th>Precio</th><th>Duracion</th><th>Estado</th>{canManage ? <th /> : null}</tr></thead><tbody>{catalogItems.map((item) => <tr key={item.id}><td><div className="fw-semibold">{item.name}</div><div className="small text-body-secondary">{item.sku ?? 'Sin SKU'}</div></td><td><span className="badge text-bg-light border">{item.kind}</span></td><td>{formatMoney(item.priceCents)}</td><td>{item.durationMin ? `${item.durationMin} min` : '-'}</td><td><span className={`badge ${item.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>{item.status}</span></td>{canManage ? <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(item.id); setForm({ name: item.name, kind: item.kind, priceCents: item.priceCents, durationMin: item.durationMin ? String(item.durationMin) : '', sku: item.sku ?? '', notes: item.notes ?? '', status: item.status }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(item.id)}>Eliminar</button></div></td> : null}</tr>)}</tbody></table></div></div></div>}</div>;
}

export function SalesModuleView() {
  const { catalogItems, clients, refresh, sales, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['sales.manage']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [stage, setStage] = useState<'draft' | 'sent' | 'won' | 'lost'>('draft');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<SaleLineForm[]>([{ catalogItemId: '', quantity: 1 }]);

  async function submitSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    const payload = { title, clientId, stage, notes, lines: lines.filter((line) => line.catalogItemId) };
    try {
      if (editingId) {
        await performModuleAction(token, '/api/sales/update', 'sale', { id: editingId, ...payload });
        setMessage('Venta actualizada.');
      } else {
        await performModuleAction(token, '/api/sales/create', 'sale', payload);
        setMessage('Venta creada.');
      }
      setEditingId(null); setTitle(''); setClientId(''); setStage('draft'); setNotes(''); setLines([{ catalogItemId: '', quantity: 1 }]);
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(saleId: string) {
    if (!token || !window.confirm('Se eliminara la venta si no tiene factura emitida.')) return;
    try { await performModuleAction(token, '/api/sales/delete', 'sale', { saleId }); setMessage('Venta eliminada.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4">{canManage ? <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Ventas" copy="Pipeline comercial separado del resto de modulos." badge={`${sales.length} abiertas`} /><form className="row g-3" onSubmit={submitSale}><div className="col-md-4"><input className="form-control" placeholder="Titulo" value={title} onChange={(event) => setTitle(event.target.value)} required /></div><div className="col-md-4"><select className="form-select" value={clientId} onChange={(event) => setClientId(event.target.value)} required><option value="">Cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.fullName}</option>)}</select></div><div className="col-md-4"><select className="form-select" value={stage} onChange={(event) => setStage(event.target.value as typeof stage)}><option value="draft">Borrador</option><option value="sent">Enviada</option><option value="won">Ganada</option><option value="lost">Perdida</option></select></div><div className="col-12"><input className="form-control" placeholder="Notas" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>{lines.map((line, index) => <div key={index} className="col-12"><div className="row g-2"><div className="col-md-8"><select className="form-select" value={line.catalogItemId} onChange={(event) => setLines(lines.map((entry, lineIndex) => lineIndex === index ? { ...entry, catalogItemId: event.target.value } : entry))}><option value="">Item</option>{catalogItems.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="col-md-2"><input className="form-control" type="number" min="1" value={line.quantity} onChange={(event) => setLines(lines.map((entry, lineIndex) => lineIndex === index ? { ...entry, quantity: Number(event.target.value) || 1 } : entry))} /></div><div className="col-md-2"><button className="btn btn-outline-danger w-100" type="button" onClick={() => setLines(lines.length > 1 ? lines.filter((_, lineIndex) => lineIndex !== index) : [{ catalogItemId: '', quantity: 1 }])}>Quitar</button></div></div></div>)}<div className="col-12 d-flex gap-2"><button className="btn btn-outline-secondary" type="button" onClick={() => setLines([...lines, { catalogItemId: '', quantity: 1 }])}>Anadir linea</button><button className="btn btn-primary" type="submit">{editingId ? 'Guardar venta' : 'Crear venta'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setTitle(''); setClientId(''); setStage('draft'); setNotes(''); setLines([{ catalogItemId: '', quantity: 1 }]); }}>Cancelar</button> : null}</div></form>{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div> : <SectionHeading title="Ventas" copy="Pipeline comercial separado del resto de modulos." badge={`${sales.length} abiertas`} />}{sales.length === 0 ? <EmptyState title="Sin ventas visibles" copy="Este perfil no puede consultar ventas o aun no hay pipeline cargado." /> : <div className="row g-3">{sales.map((sale) => <div key={sale.id} className="col-12 col-xl-6"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="d-flex justify-content-between align-items-start gap-3 mb-3"><div><h1 className="h5 mb-1">{sale.title}</h1><p className="text-body-secondary mb-0">{sale.reference} · {sale.client.fullName}</p></div><span className="badge text-bg-light border text-uppercase">{sale.stage}</span></div><div className="mb-3 fw-semibold">{formatMoney(sale.totalCents)}</div><ul className="list-group list-group-flush small mb-3">{sale.lines.map((line) => <li key={line.id} className="list-group-item px-0 d-flex justify-content-between"><span>{line.catalogItemName} x {line.quantity}</span><span>{formatMoney(line.lineTotalCents)}</span></li>)}</ul>{canManage ? <div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(sale.id); setTitle(sale.title); setClientId(sale.client.id); setStage(sale.stage); setNotes(sale.notes ?? ''); setLines(sale.lines.map((line) => ({ catalogItemId: line.catalogItemId, quantity: line.quantity }))); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(sale.id)}>Eliminar</button></div> : null}</div></div></div>)}</div>}</div>;
}

export function InvoicesModuleView() {
  const { invoices, refresh, sales, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['billing.manage']);
  const invoiceableSales = useMemo(() => sales.filter((sale) => sale.stage === 'won' && !invoices.some((invoice) => invoice.saleId === sale.id)), [invoices, sales]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saleId, setSaleId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'issued' | 'void'>('issued');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    try {
      if (editingId) {
        await performModuleAction(token, '/api/invoices/update', 'invoice', { id: editingId, dueDate, notes, status });
        setMessage('Factura actualizada.');
      } else {
        await performModuleAction(token, '/api/invoices/create', 'invoice', { saleId, dueDate, notes, status: 'issued' });
        setMessage('Factura emitida.');
      }
      setEditingId(null); setSaleId(''); setDueDate(''); setNotes(''); setStatus('issued');
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(invoiceId: string) {
    if (!token || !window.confirm('Se eliminara la factura si no tiene cobros registrados.')) return;
    try { await performModuleAction(token, '/api/invoices/delete', 'invoice', { invoiceId }); setMessage('Factura eliminada.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4">{canManage ? <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Facturas" copy="Estado, saldo y cobros asociados por factura." badge={`${invoices.length} emitidas`} /><form className="row g-3" onSubmit={submitInvoice}><div className="col-md-4"><select className="form-select" value={saleId} onChange={(event) => setSaleId(event.target.value)} disabled={!!editingId} required={!editingId}><option value="">Venta origen</option>{invoiceableSales.map((sale) => <option key={sale.id} value={sale.id}>{sale.reference} - {sale.title}</option>)}</select></div><div className="col-md-4"><input className="form-control" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></div><div className="col-md-4">{editingId ? <select className="form-select" value={status} onChange={(event) => setStatus(event.target.value as 'issued' | 'void')}><option value="issued">Emitida</option><option value="void">Anulada</option></select> : <input className="form-control" value="Emitida" readOnly />}</div><div className="col-12"><input className="form-control" placeholder="Notas" value={notes} onChange={(event) => setNotes(event.target.value)} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar factura' : 'Emitir factura'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setSaleId(''); setDueDate(''); setNotes(''); setStatus('issued'); }}>Cancelar</button> : null}</div></form>{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div> : <SectionHeading title="Facturas" copy="Estado, saldo y cobros asociados por factura." badge={`${invoices.length} emitidas`} />}{invoices.length === 0 ? <EmptyState title="Sin facturas visibles" copy="Este perfil no puede consultar facturacion o aun no hay facturas cargadas." /> : <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Factura</th><th>Cliente</th><th>Emitida</th><th>Total</th><th>Saldo</th><th>Estado</th>{canManage ? <th /> : null}</tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><div className="fw-semibold">{invoice.reference}</div><div className="small text-body-secondary">{invoice.sale.title}</div></td><td>{invoice.client.fullName}</td><td>{formatDate(invoice.issuedAt)}</td><td>{formatMoney(invoice.totalCents)}</td><td>{formatMoney(invoice.balanceCents)}</td><td><span className={`badge ${invoice.balanceCents > 0 ? 'text-bg-warning' : 'text-bg-success'}`}>{invoice.status}</span></td>{canManage ? <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(invoice.id); setSaleId(invoice.saleId); setDueDate(invoice.dueDate); setNotes(invoice.notes ?? ''); setStatus(invoice.status === 'void' ? 'void' : 'issued'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(invoice.id)}>Eliminar</button></div></td> : null}</tr>)}</tbody></table></div></div></div>}</div>;
}

export function PaymentsModuleView() {
  const { invoices, payments, refresh, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['payments.manage']);
  const payableInvoices = useMemo(() => invoices.filter((invoice) => invoice.status !== 'void' && invoice.balanceCents > 0), [invoices]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'failed'>('confirmed');
  const [method, setMethod] = useState<'cash' | 'card' | 'bank_transfer'>('bank_transfer');
  const [amountCents, setAmountCents] = useState(0);
  const [receivedAt, setReceivedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    try {
      const payload = { invoiceId, status, method, amountCents, receivedAt: `${receivedAt}T12:00:00.000Z`, notes };
      if (editingId) {
        await performModuleAction(token, '/api/payments/update', 'payment', { id: editingId, ...payload });
        setMessage('Cobro actualizado.');
      } else {
        await performModuleAction(token, '/api/payments/create', 'payment', payload);
        setMessage('Cobro registrado.');
      }
      setEditingId(null); setInvoiceId(''); setStatus('confirmed'); setMethod('bank_transfer'); setAmountCents(0); setReceivedAt(''); setNotes('');
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(paymentId: string) {
    if (!token || !window.confirm('Se eliminara el cobro seleccionado.')) return;
    try { await performModuleAction(token, '/api/payments/delete', 'payment', { paymentId }); setMessage('Cobro eliminado.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4">{canManage ? <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Cobros" copy="Cobros asociados a facturas y clientes." badge={`${payments.length} movimientos`} /><form className="row g-3" onSubmit={submitPayment}><div className="col-md-4"><select className="form-select" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} disabled={!!editingId} required><option value="">Factura</option>{[...payableInvoices, ...invoices.filter((invoice) => invoice.id === invoiceId && !payableInvoices.some((entry) => entry.id === invoice.id))].map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.reference} - saldo {formatMoney(invoice.balanceCents)}</option>)}</select></div><div className="col-md-2"><select className="form-select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="confirmed">Confirmado</option><option value="pending">Pendiente</option><option value="failed">Fallido</option></select></div><div className="col-md-2"><select className="form-select" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}><option value="bank_transfer">Transferencia</option><option value="card">Tarjeta</option><option value="cash">Efectivo</option></select></div><div className="col-md-2"><input className="form-control" type="number" min="1" value={amountCents} onChange={(event) => setAmountCents(Number(event.target.value) || 0)} required /></div><div className="col-md-2"><input className="form-control" type="date" value={receivedAt} onChange={(event) => setReceivedAt(event.target.value)} required /></div><div className="col-12"><input className="form-control" placeholder="Notas" value={notes} onChange={(event) => setNotes(event.target.value)} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar cobro' : 'Registrar cobro'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setInvoiceId(''); setStatus('confirmed'); setMethod('bank_transfer'); setAmountCents(0); setReceivedAt(''); setNotes(''); }}>Cancelar</button> : null}</div></form>{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div> : <SectionHeading title="Cobros" copy="Cobros asociados a facturas y clientes." badge={`${payments.length} movimientos`} />}{payments.length === 0 ? <EmptyState title="Sin cobros visibles" copy="Este perfil no puede consultar cobros o aun no hay movimientos cargados." /> : <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Referencia</th><th>Cliente</th><th>Metodo</th><th>Importe</th><th>Fecha</th><th>Estado</th>{canManage ? <th /> : null}</tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td><div className="fw-semibold">{payment.reference}</div><div className="small text-body-secondary">{payment.invoice.reference}</div></td><td>{payment.invoice.client.fullName}</td><td>{payment.method}</td><td>{formatMoney(payment.amountCents)}</td><td>{formatDate(payment.receivedAt)}</td><td><span className={`badge ${payment.status === 'confirmed' ? 'text-bg-success' : payment.status === 'pending' ? 'text-bg-warning' : 'text-bg-danger'}`}>{payment.status}</span></td>{canManage ? <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(payment.id); setInvoiceId(payment.invoice.id); setStatus(payment.status); setMethod(payment.method); setAmountCents(payment.amountCents); setReceivedAt(toDateInput(payment.receivedAt)); setNotes(payment.notes ?? ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(payment.id)}>Eliminar</button></div></td> : null}</tr>)}</tbody></table></div></div></div>}</div>;
}

export function EmployeesModuleView() {
  const { employees, refresh, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['employees.manage']);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeCode: '', fullName: '', workEmail: '', phone: '', department: '', jobTitle: '', employmentType: 'full_time', status: 'active', startDate: '', notes: '' });

  async function submitEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    try {
      if (editingId) {
        await performModuleAction(token, '/api/employees/update', 'employee', { id: editingId, linkedUserId: '', ...form });
        setMessage('Empleado actualizado.');
      } else {
        await performModuleAction(token, '/api/employees/create', 'employee', { linkedUserId: '', ...form });
        setMessage('Empleado creado.');
      }
      setEditingId(null); setForm({ employeeCode: '', fullName: '', workEmail: '', phone: '', department: '', jobTitle: '', employmentType: 'full_time', status: 'active', startDate: '', notes: '' });
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(employeeId: string) {
    if (!token || !window.confirm('Se eliminara el empleado si no tiene tareas o reservas enlazadas.')) return;
    try { await performModuleAction(token, '/api/employees/delete', 'employee', { employeeId }); setMessage('Empleado eliminado.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4">{canManage ? <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Empleados" copy="Equipo operativo del tenant con vista en tarjetas para lectura rapida." badge={`${employees.length} personas`} /><form className="row g-3" onSubmit={submitEmployee}><div className="col-md-2"><input className="form-control" placeholder="Codigo" value={form.employeeCode} onChange={(event) => setForm({ ...form, employeeCode: event.target.value })} required /></div><div className="col-md-4"><input className="form-control" placeholder="Nombre" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" placeholder="Email laboral" value={form.workEmail} onChange={(event) => setForm({ ...form, workEmail: event.target.value })} type="email" /></div><div className="col-md-3"><input className="form-control" placeholder="Telefono" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div><div className="col-md-3"><input className="form-control" placeholder="Departamento" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" placeholder="Puesto" value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} required /></div><div className="col-md-2"><select className="form-select" value={form.employmentType} onChange={(event) => setForm({ ...form, employmentType: event.target.value })}><option value="full_time">Completa</option><option value="part_time">Parcial</option><option value="contractor">Externo</option></select></div><div className="col-md-2"><select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Activo</option><option value="on_leave">De baja</option><option value="inactive">Inactivo</option></select></div><div className="col-md-2"><input className="form-control" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} required /></div><div className="col-md-12"><input className="form-control" placeholder="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar empleado' : 'Crear empleado'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm({ employeeCode: '', fullName: '', workEmail: '', phone: '', department: '', jobTitle: '', employmentType: 'full_time', status: 'active', startDate: '', notes: '' }); }}>Cancelar</button> : null}</div></form>{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div> : <SectionHeading title="Empleados" copy="Equipo operativo del tenant con vista en tarjetas para lectura rapida." badge={`${employees.length} personas`} />}{employees.length === 0 ? <EmptyState title="Sin empleados visibles" copy="Este perfil no puede consultar empleados o aun no hay equipo cargado." /> : <div className="row g-3">{employees.map((employee) => <div key={employee.id} className="col-12 col-md-6 col-xl-4"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="d-flex justify-content-between mb-3"><span className="badge text-bg-light border">{employee.employeeCode}</span><span className={`badge ${employee.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>{employee.status}</span></div><h1 className="h5 mb-1">{employee.fullName}</h1><p className="text-body-secondary mb-3">{employee.department} · {employee.jobTitle}</p><ul className="list-group list-group-flush small mb-3"><li className="list-group-item px-0">Email: {employee.workEmail ?? 'Sin email'}</li><li className="list-group-item px-0">Telefono: {employee.phone ?? 'Sin telefono'}</li><li className="list-group-item px-0">Alta: {formatDate(employee.startDate)}</li><li className="list-group-item px-0">Usuario: {employee.linkedUser?.email ?? 'Sin vincular'}</li></ul>{canManage ? <div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(employee.id); setForm({ employeeCode: employee.employeeCode, fullName: employee.fullName, workEmail: employee.workEmail ?? '', phone: employee.phone ?? '', department: employee.department, jobTitle: employee.jobTitle, employmentType: employee.employmentType, status: employee.status, startDate: employee.startDate, notes: employee.notes ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(employee.id)}>Eliminar</button></div> : null}</div></div></div>)}</div>}</div>;
}

export function TasksModuleView() {
  const { employees, internalTasks, refresh, sales, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['tasks.manage']);
  const wonSales = useMemo(() => sales.filter((sale) => sale.stage === 'won'), [sales]);
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status !== 'inactive'), [employees]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', saleId: '', assigneeEmployeeId: '', status: 'todo', priority: 'medium', dueDate: '' });

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    try {
      if (editingId) {
        await performModuleAction(token, '/api/internal-tasks/update', 'task', { id: editingId, ...form });
        setMessage('Tarea actualizada.');
      } else {
        await performModuleAction(token, '/api/internal-tasks/create', 'task', form);
        setMessage('Tarea creada.');
      }
      setEditingId(null); setForm({ title: '', description: '', saleId: '', assigneeEmployeeId: '', status: 'todo', priority: 'medium', dueDate: '' });
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(taskId: string) {
    if (!token || !window.confirm('Se eliminara la tarea si no tiene reservas enlazadas.')) return;
    try { await performModuleAction(token, '/api/internal-tasks/delete', 'task', { taskId }); setMessage('Tarea eliminada.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4">{canManage ? <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Tareas" copy="Seguimiento interno con prioridad, estado y contexto comercial." badge={`${internalTasks.length} activas`} /><form className="row g-3" onSubmit={submitTask}><div className="col-md-4"><input className="form-control" placeholder="Titulo" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div><div className="col-md-4"><select className="form-select" value={form.assigneeEmployeeId} onChange={(event) => setForm({ ...form, assigneeEmployeeId: event.target.value })} required><option value="">Empleado</option>{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></div><div className="col-md-4"><select className="form-select" value={form.saleId} onChange={(event) => setForm({ ...form, saleId: event.target.value })}><option value="">Sin venta</option>{wonSales.map((sale) => <option key={sale.id} value={sale.id}>{sale.reference} - {sale.client.fullName}</option>)}</select></div><div className="col-md-3"><select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="todo">Pendiente</option><option value="in_progress">En curso</option><option value="blocked">Bloqueada</option><option value="done">Hecha</option></select></div><div className="col-md-3"><select className="form-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></div><div className="col-md-3"><input className="form-control" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></div><div className="col-md-12"><input className="form-control" placeholder="Descripcion" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar tarea' : 'Crear tarea'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', saleId: '', assigneeEmployeeId: '', status: 'todo', priority: 'medium', dueDate: '' }); }}>Cancelar</button> : null}</div></form>{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div> : <SectionHeading title="Tareas" copy="Seguimiento interno con prioridad, estado y contexto comercial." badge={`${internalTasks.length} activas`} />}{internalTasks.length === 0 ? <EmptyState title="Sin tareas visibles" copy="Este perfil no puede consultar tareas o aun no hay trabajo interno cargado." /> : <div className="row g-3">{internalTasks.map((task) => <div key={task.id} className="col-12 col-xl-6"><div className="card border-0 shadow-sm h-100"><div className="card-body"><div className="d-flex justify-content-between align-items-start gap-3 mb-3"><div><h1 className="h5 mb-1">{task.title}</h1><p className="text-body-secondary mb-0">{task.taskCode} · {task.assigneeEmployee.fullName}</p></div><div className="d-flex gap-2 flex-wrap"><span className={`badge ${task.priority === 'high' ? 'text-bg-danger' : task.priority === 'medium' ? 'text-bg-warning' : 'text-bg-secondary'}`}>{task.priority}</span><span className="badge text-bg-light border">{task.status}</span></div></div><p className="mb-3">{task.description ?? 'Sin descripcion adicional.'}</p><div className="small text-body-secondary d-grid gap-1 mb-3"><span>Creador: {task.createdByUser.fullName}</span><span>Vinculada a venta: {task.sale ? task.sale.reference : 'No'}</span><span>Vencimiento: {task.dueDate ? formatDate(task.dueDate) : 'Sin fecha'}</span></div>{canManage ? <div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(task.id); setForm({ title: task.title, description: task.description ?? '', saleId: task.saleId ?? '', assigneeEmployeeId: task.assigneeEmployeeId, status: task.status, priority: task.priority, dueDate: task.dueDate ?? '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(task.id)}>Eliminar</button></div> : null}</div></div></div>)}</div>}</div>;
}

export function ReservationsModuleView() {
  const { employees, internalTasks, refresh, reservations, session, token } = useDashboard();
  const canManage = !!session && !!token && useManageFlag(session.permissions, ['reservations.manage']);
  const activeEmployees = useMemo(() => employees.filter((employee) => employee.status === 'active'), [employees]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', notes: '', location: '', assigneeEmployeeId: '', internalTaskId: '', status: 'booked', startAt: '', endAt: '' });

  const taskOptions = useMemo(() => internalTasks.filter((task) => !form.assigneeEmployeeId || task.assigneeEmployeeId === form.assigneeEmployeeId), [form.assigneeEmployeeId, internalTasks]);

  async function submitReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null); setError(null);
    const payload = { ...form, startAt: fromDateTimeLocalInput(form.startAt), endAt: fromDateTimeLocalInput(form.endAt) };
    try {
      if (editingId) {
        await performModuleAction(token, '/api/reservations/update', 'reservation', { id: editingId, ...payload });
        setMessage('Reserva actualizada.');
      } else {
        await performModuleAction(token, '/api/reservations/create', 'reservation', payload);
        setMessage('Reserva creada.');
      }
      setEditingId(null); setForm({ title: '', notes: '', location: '', assigneeEmployeeId: '', internalTaskId: '', status: 'booked', startAt: '', endAt: '' });
      await refresh();
    } catch (cause) { setError(parseError(cause)); }
  }

  async function handleDelete(reservationId: string) {
    if (!token || !window.confirm('Se eliminara la reserva seleccionada.')) return;
    try { await performModuleAction(token, '/api/reservations/delete', 'reservation', { reservationId }); setMessage('Reserva eliminada.'); setError(null); await refresh(); } catch (cause) { setError(parseError(cause)); setMessage(null); }
  }

  return <div className="d-grid gap-4">{canManage ? <div className="card border-0 shadow-sm"><div className="card-body"><SectionHeading title="Reservas" copy="Agenda operativa enlazada a empleados y tareas." badge={`${reservations.length} eventos`} /><form className="row g-3" onSubmit={submitReservation}><div className="col-md-4"><input className="form-control" placeholder="Titulo" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div><div className="col-md-4"><select className="form-select" value={form.assigneeEmployeeId} onChange={(event) => setForm({ ...form, assigneeEmployeeId: event.target.value, internalTaskId: '' })} required><option value="">Empleado</option>{activeEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select></div><div className="col-md-4"><select className="form-select" value={form.internalTaskId} onChange={(event) => setForm({ ...form, internalTaskId: event.target.value })}><option value="">Sin tarea</option>{taskOptions.map((task) => <option key={task.id} value={task.id}>{task.taskCode} - {task.title}</option>)}</select></div><div className="col-md-3"><select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="booked">Reservada</option><option value="confirmed">Confirmada</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select></div><div className="col-md-3"><input className="form-control" type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" placeholder="Ubicacion" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div><div className="col-md-12"><input className="form-control" placeholder="Notas" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div><div className="col-12 d-flex gap-2"><button className="btn btn-primary" type="submit">{editingId ? 'Guardar reserva' : 'Crear reserva'}</button>{editingId ? <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm({ title: '', notes: '', location: '', assigneeEmployeeId: '', internalTaskId: '', status: 'booked', startAt: '', endAt: '' }); }}>Cancelar</button> : null}</div></form>{message ? <ActionNotice message={message} variant="success" /> : null}{error ? <ActionNotice message={error} variant="danger" /> : null}</div></div> : <SectionHeading title="Reservas" copy="Agenda operativa enlazada a empleados y tareas." badge={`${reservations.length} eventos`} />}{reservations.length === 0 ? <EmptyState title="Sin reservas visibles" copy="Este perfil no puede consultar reservas o aun no hay agenda cargada." /> : <div className="card border-0 shadow-sm"><div className="card-body"><div className="table-responsive"><table className="table align-middle"><thead><tr><th>Reserva</th><th>Empleado</th><th>Ubicacion</th><th>Inicio</th><th>Fin</th><th>Estado</th>{canManage ? <th /> : null}</tr></thead><tbody>{reservations.map((reservation) => <tr key={reservation.id}><td><div className="fw-semibold">{reservation.title}</div><div className="small text-body-secondary">{reservation.reservationCode}</div></td><td>{reservation.assigneeEmployee.fullName}</td><td>{reservation.location ?? 'Sin ubicacion'}</td><td>{formatDateTime(reservation.startAt)}</td><td>{formatDateTime(reservation.endAt)}</td><td><span className="badge text-bg-light border">{reservation.status}</span></td>{canManage ? <td className="text-end"><div className="btn-group btn-group-sm"><button className="btn btn-outline-primary" type="button" onClick={() => { setEditingId(reservation.id); setForm({ title: reservation.title, notes: reservation.notes ?? '', location: reservation.location ?? '', assigneeEmployeeId: reservation.assigneeEmployeeId, internalTaskId: reservation.internalTaskId ?? '', status: reservation.status, startAt: toDateTimeLocalInput(reservation.startAt), endAt: toDateTimeLocalInput(reservation.endAt) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => void handleDelete(reservation.id)}>Eliminar</button></div></td> : null}</tr>)}</tbody></table></div></div></div>}</div>;
}

export function UsersModuleView() {
  const { refresh, roles, session, token, users } = useDashboard();
  const canManageUsers = !!session && !!token && useManageFlag(session.permissions, ['users.manage']);
  const canManageRoles = !!session && !!token && useManageFlag(session.permissions, ['roles.manage']);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', roleCode: (canManageRoles ? 'admin' : 'operator') as 'owner' | 'admin' | 'manager' | 'operator' | 'viewer' });

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null);
    setError(null);

    try {
      await createTenantUser(webConfig.browserApiBaseUrl, token, form);
      setMessage('Usuario creado.');
      setForm({ fullName: '', email: '', password: '', roleCode: (canManageRoles ? 'admin' : 'operator') as 'owner' | 'admin' | 'manager' | 'operator' | 'viewer' });
      await refresh();
    } catch (cause) {
      setError(parseError(cause));
    }
  }

  async function handleRoleChange(userId: string, roleCode: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer') {
    if (!token) return;
    setMessage(null);
    setError(null);

    try {
      await updateTenantUserRole(webConfig.browserApiBaseUrl, token, { userId, roleCode });
      setMessage('Rol actualizado.');
      await refresh();
    } catch (cause) {
      setError(parseError(cause));
    }
  }

  const assignableRoles = canManageRoles ? ['admin', 'manager', 'operator', 'viewer'] : ['operator', 'viewer'];

  return (
    <div className="d-grid gap-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <SectionHeading title="Usuarios" copy="Alta de usuarios del tenant y reasignacion de roles desde el dashboard modular." badge={`${users.length} usuarios`} />
          {canManageUsers ? <form className="row g-3" onSubmit={handleCreateUser}><div className="col-md-3"><input className="form-control" placeholder="Nombre" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="col-md-3"><input className="form-control" placeholder="Contrasena" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></div><div className="col-md-3"><select className="form-select" value={form.roleCode} onChange={(event) => setForm({ ...form, roleCode: event.target.value as typeof form.roleCode })}>{assignableRoles.map((roleCode) => <option key={roleCode} value={roleCode}>{formatRoleLabel(roleCode)}</option>)}</select></div><div className="col-12"><button className="btn btn-primary" type="submit">Crear usuario</button></div></form> : null}
          {message ? <ActionNotice message={message} variant="success" /> : null}
          {error ? <ActionNotice message={error} variant="danger" /> : null}
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const currentRole = user.roles[0] ?? 'viewer';
                  return (
                    <tr key={user.id}>
                      <td className="fw-semibold">{user.fullName}</td>
                      <td>{user.email}</td>
                      <td><span className={`badge ${user.status === 'active' ? 'text-bg-success' : 'text-bg-secondary'}`}>{user.status}</span></td>
                      <td>
                        {canManageRoles ? (
                          <select className="form-select form-select-sm" value={currentRole} onChange={(event) => void handleRoleChange(user.id, event.target.value as 'owner' | 'admin' | 'manager' | 'operator' | 'viewer')}>
                            {roles.map((role) => <option key={role.id} value={role.code}>{formatRoleLabel(role.code)}</option>)}
                          </select>
                        ) : (
                          <span className="badge text-bg-light border">{formatRoleLabel(currentRole)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RolesModuleView() {
  const { roles, session } = useDashboard();
  const canReadRoles = !!session && useManageFlag(session.permissions, ['roles.manage']);

  if (!canReadRoles || roles.length === 0) {
    return <EmptyState title="Sin roles visibles" copy="Este perfil no puede consultar el catalogo ACL del tenant." />;
  }

  return (
    <div className="d-grid gap-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <SectionHeading title="Roles" copy="Catalogo ACL disponible para owner, con visibilidad del alcance de cada perfil." badge={`${roles.length} perfiles`} />
          <div className="row g-3">
            {roles.map((role) => (
              <div key={role.id} className="col-12 col-xl-6">
                <div className="card h-100 border-light-subtle">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h3 className="h5 mb-1">{role.name}</h3>
                        <p className="small text-body-secondary mb-0">Codigo: {role.code}</p>
                      </div>
                      <span className="badge text-bg-primary">{role.permissions.length} permisos</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {role.permissions.map((permission) => <span key={permission} className="badge text-bg-light border">{permission}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsModuleView() {
  const { refresh, session, settings, token } = useDashboard();
  const canManageSettings = !!session && !!token && useManageFlag(session.permissions, ['settings.manage']);
  const [form, setForm] = useState(settings ?? { brandingName: '', defaultLocale: '', timezone: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage(null);
    setError(null);

    try {
      await updateTenantSettings(webConfig.browserApiBaseUrl, token, form);
      setMessage('Configuracion guardada.');
      await refresh();
    } catch (cause) {
      setError(parseError(cause));
    }
  }

  return (
    <div className="d-grid gap-4">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <SectionHeading title="Settings" copy="Configuracion base del tenant: branding, locale y zona horaria." badge={form.brandingName || 'Tenant'} />
          {canManageSettings ? <form className="row g-3" onSubmit={handleSubmit}><div className="col-md-4"><label className="form-label">Branding</label><input className="form-control" value={form.brandingName} onChange={(event) => setForm({ ...form, brandingName: event.target.value })} required /></div><div className="col-md-4"><label className="form-label">Locale</label><input className="form-control" value={form.defaultLocale} onChange={(event) => setForm({ ...form, defaultLocale: event.target.value })} required /></div><div className="col-md-4"><label className="form-label">Timezone</label><input className="form-control" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} required /></div><div className="col-12"><button className="btn btn-primary" type="submit">Guardar configuracion</button></div></form> : null}
          {message ? <ActionNotice message={message} variant="success" /> : null}
          {error ? <ActionNotice message={error} variant="danger" /> : null}
        </div>
      </div>
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h3 className="h5 mb-3">Vista actual</h3>
          <div className="row g-3">
            <div className="col-md-4"><div className="border rounded p-3 h-100"><div className="small text-body-secondary">Branding</div><strong>{settings?.brandingName ?? '-'}</strong></div></div>
            <div className="col-md-4"><div className="border rounded p-3 h-100"><div className="small text-body-secondary">Locale</div><strong>{settings?.defaultLocale ?? '-'}</strong></div></div>
            <div className="col-md-4"><div className="border rounded p-3 h-100"><div className="small text-body-secondary">Timezone</div><strong>{settings?.timezone ?? '-'}</strong></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
