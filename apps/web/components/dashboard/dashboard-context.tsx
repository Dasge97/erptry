'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { webConfig } from '../../lib/api';
import {
  getCatalogItems,
  clearSessionToken,
  getClients,
  getEmployees,
  getInternalTasks,
  getInvoices,
  getManifest,
  getPayments,
  getRoles,
  getReservations,
  getSales,
  getSessionInfo,
  getSessionToken,
  getTenantSettings,
  getTenantUsers,
  getTenantOverview,
  hasAnyPermission,
  logout,
  type AppManifest,
  type CatalogItemSummary,
  type ClientSummary,
  type EmployeeSummary,
  type InvoiceSummary,
  type InternalTaskSummary,
  type PaymentSummary,
  type ReservationSummary,
  type RoleSummary,
  type SaleSummary,
  type SessionInfo,
  type TenantSettings,
  type TenantOverview
  ,type UserSummary
} from '../../lib/erptry-client';

type DashboardContextValue = {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  errorMessage: string;
  token: string | null;
  session: SessionInfo | null;
  overview: TenantOverview | null;
  manifest: AppManifest | null;
  catalogItems: CatalogItemSummary[];
  clients: ClientSummary[];
  employees: EmployeeSummary[];
  invoices: InvoiceSummary[];
  internalTasks: InternalTaskSummary[];
  payments: PaymentSummary[];
  reservations: ReservationSummary[];
  roles: RoleSummary[];
  sales: SaleSummary[];
  settings: TenantSettings | null;
  users: UserSummary[];
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

async function loadDashboard(token: string) {
  const [session, overview, manifest] = await Promise.all([
    getSessionInfo(webConfig.browserApiBaseUrl, token),
    getTenantOverview(webConfig.browserApiBaseUrl, token),
    getManifest(webConfig.browserApiBaseUrl)
  ]);

  const canReadCommercial = hasAnyPermission(session.permissions, ['sales.view', 'sales.manage']);
  const canReadBilling = hasAnyPermission(session.permissions, ['billing.view', 'billing.manage']);
  const canReadPayments = hasAnyPermission(session.permissions, ['payments.view', 'payments.manage']);
  const canReadEmployees = hasAnyPermission(session.permissions, ['employees.view', 'employees.manage']);
  const canReadInternalTasks = hasAnyPermission(session.permissions, ['tasks.view', 'tasks.manage']);
  const canReadReservations = hasAnyPermission(session.permissions, ['reservations.view', 'reservations.manage']);
  const canReadUsers = hasAnyPermission(session.permissions, ['users.manage']);
  const canReadRoles = hasAnyPermission(session.permissions, ['roles.manage']);
  const canReadSettings = hasAnyPermission(session.permissions, ['settings.manage']);

  const [catalogItems, clients, employees, internalTasks, invoices, payments, reservations, roles, sales, settings, users] = await Promise.all([
    canReadCommercial ? getCatalogItems(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadCommercial ? getClients(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadEmployees ? getEmployees(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadInternalTasks ? getInternalTasks(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadBilling ? getInvoices(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadPayments ? getPayments(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadReservations ? getReservations(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadRoles ? getRoles(webConfig.browserApiBaseUrl, token) : Promise.resolve([]),
    canReadCommercial ? getSales(webConfig.browserApiBaseUrl, token) : Promise.resolve([])
    ,canReadSettings ? getTenantSettings(webConfig.browserApiBaseUrl, token) : Promise.resolve(null)
    ,canReadUsers ? getTenantUsers(webConfig.browserApiBaseUrl, token) : Promise.resolve([])
  ]);

  return { session, overview, manifest, catalogItems, clients, employees, internalTasks, invoices, payments, reservations, roles, sales, settings, users };
}

export function DashboardProvider({ children }: React.PropsWithChildren) {
  const [status, setStatus] = useState<DashboardContextValue['status']>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [overview, setOverview] = useState<TenantOverview | null>(null);
  const [manifest, setManifest] = useState<AppManifest | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItemSummary[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [internalTasks, setInternalTasks] = useState<InternalTaskSummary[]>([]);
  const [payments, setPayments] = useState<PaymentSummary[]>([]);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);

  async function refresh() {
    const storedToken = token ?? getSessionToken();

    if (!storedToken) {
      setStatus('unauthenticated');
      setToken(null);
      return;
    }

    setStatus('loading');

    try {
      const data = await loadDashboard(storedToken);
      setToken(storedToken);
      setSession(data.session);
      setOverview(data.overview);
      setManifest(data.manifest);
      setCatalogItems(data.catalogItems);
      setClients(data.clients);
      setEmployees(data.employees);
      setSales(data.sales);
      setInvoices(data.invoices);
      setInternalTasks(data.internalTasks);
      setPayments(data.payments);
      setReservations(data.reservations);
      setRoles(data.roles);
      setSettings(data.settings);
      setUsers(data.users);
      setErrorMessage('');
      setStatus('authenticated');
    } catch (error) {
      clearSessionToken();
      setToken(null);
      setSession(null);
      setOverview(null);
      setManifest(null);
      setCatalogItems([]);
      setClients([]);
      setEmployees([]);
      setSales([]);
      setInvoices([]);
      setInternalTasks([]);
      setPayments([]);
      setReservations([]);
      setRoles([]);
      setSettings(null);
      setUsers([]);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar el dashboard.');
      setStatus('error');
    }
  }

  async function signOut() {
    const storedToken = token ?? getSessionToken();

    if (storedToken) {
      try {
        await logout(webConfig.browserApiBaseUrl, storedToken);
      } catch {
        // Ignore logout errors on client reset.
      }
    }

    clearSessionToken();
    setStatus('unauthenticated');
    setToken(null);
    setSession(null);
    setOverview(null);
    setManifest(null);
    setCatalogItems([]);
    setClients([]);
    setEmployees([]);
    setSales([]);
    setInvoices([]);
    setInternalTasks([]);
    setPayments([]);
    setReservations([]);
    setRoles([]);
    setSettings(null);
    setUsers([]);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<DashboardContextValue>(() => ({
    status,
    errorMessage,
    token,
    session,
    overview,
    manifest,
    catalogItems,
    clients,
    employees,
    invoices,
    internalTasks,
    payments,
    reservations,
    roles,
    sales,
    settings,
    users,
    refresh,
    signOut
  }), [catalogItems, clients, employees, errorMessage, internalTasks, invoices, manifest, overview, payments, reservations, roles, sales, session, settings, status, token, users]);

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboard debe usarse dentro de DashboardProvider.');
  }

  return context;
}
