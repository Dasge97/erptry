export type SessionActorRole = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';

export type SessionInfo = {
  actor: {
    userId: string;
    tenantId: string;
    role: SessionActorRole;
    fullName: string;
    email: string;
  };
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: 'starter' | 'growth' | 'scale';
  };
  permissions: string[];
  issuedAt: string;
  expiresAt: string;
};

export type TenantOverview = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    plan: 'starter' | 'growth' | 'scale';
  };
  totalUsers: number;
  activeSessions: number;
};

export type TenantSettings = {
  brandingName: string;
  defaultLocale: string;
  timezone: string;
};

export type UserSummary = {
  id: string;
  email: string;
  fullName: string;
  status: 'active' | 'suspended';
  tenantId: string;
  roles: string[];
};

export type RoleSummary = {
  id: string;
  code: string;
  name: string;
  permissions: string[];
};

export type AppManifest = {
  name: string;
  headline: string;
  modules: string[];
  priorities: string[];
};

export type ClientSummary = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  segment: string;
  notes: string | null;
};

export type SaleSummary = {
  id: string;
  reference: string;
  title: string;
  stage: 'draft' | 'sent' | 'won' | 'lost';
  totalCents: number;
  notes: string | null;
  client: {
    id: string;
    fullName: string;
    email: string | null;
  };
  lines: Array<{
    id: string;
    catalogItemId: string;
    catalogItemName: string;
    kind: 'product' | 'service';
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

export type InvoiceSummary = {
  id: string;
  saleId: string;
  reference: string;
  status: 'draft' | 'issued' | 'paid' | 'void';
  dueDate: string;
  issuedAt: string;
  subtotalCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  notes: string | null;
  sale: {
    id: string;
    reference: string;
    title: string;
    stage: 'draft' | 'sent' | 'won' | 'lost';
  };
  client: {
    id: string;
    fullName: string;
    email: string | null;
  };
  lines: Array<{
    id: string;
    catalogItemId: string;
    description: string;
    kind: 'product' | 'service';
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
  payments: Array<{
    id: string;
    reference: string;
    status: 'pending' | 'confirmed' | 'failed';
    method: 'cash' | 'card' | 'bank_transfer';
    amountCents: number;
    receivedAt: string;
    notes: string | null;
  }>;
};

export type CatalogItemSummary = {
  id: string;
  name: string;
  kind: 'product' | 'service';
  priceCents: number;
  durationMin: number | null;
  status: 'active' | 'archived';
  sku: string | null;
  notes: string | null;
};

export type PaymentSummary = {
  id: string;
  invoiceId: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'failed';
  method: 'cash' | 'card' | 'bank_transfer';
  amountCents: number;
  receivedAt: string;
  notes: string | null;
  invoice: {
    id: string;
    reference: string;
    status: 'draft' | 'issued' | 'paid' | 'void';
    totalCents: number;
    paidCents: number;
    balanceCents: number;
    sale: {
      id: string;
      reference: string;
      title: string;
    };
    client: {
      id: string;
      fullName: string;
      email: string | null;
    };
  };
};

export type EmployeeSummary = {
  id: string;
  linkedUserId: string | null;
  employeeCode: string;
  fullName: string;
  workEmail: string | null;
  phone: string | null;
  department: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'contractor';
  status: 'active' | 'on_leave' | 'inactive';
  startDate: string;
  notes: string | null;
  linkedUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

export type InternalTaskSummary = {
  id: string;
  tenantId: string;
  taskCode: string;
  title: string;
  description: string | null;
  saleId: string | null;
  assigneeEmployeeId: string;
  createdByUserId: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  completedAt: string | null;
  assigneeEmployee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: string;
    jobTitle: string;
    status: 'active' | 'on_leave' | 'inactive';
  };
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
  };
  sale: {
    id: string;
    reference: string;
    title: string;
    stage: 'draft' | 'sent' | 'won' | 'lost';
    client: {
      id: string;
      fullName: string;
      email: string | null;
    };
  } | null;
};

export type ReservationSummary = {
  id: string;
  tenantId: string;
  reservationCode: string;
  title: string;
  notes: string | null;
  location: string | null;
  assigneeEmployeeId: string;
  createdByUserId: string;
  internalTaskId: string | null;
  status: 'booked' | 'confirmed' | 'completed' | 'cancelled';
  startAt: string;
  endAt: string;
  assigneeEmployee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: string;
    jobTitle: string;
    status: 'active' | 'on_leave' | 'inactive';
  };
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
  };
  internalTask: {
    id: string;
    taskCode: string;
    title: string;
    status: 'todo' | 'in_progress' | 'blocked' | 'done';
    priority: 'low' | 'medium' | 'high';
    sale: {
      id: string;
      reference: string;
      title: string;
      stage: 'draft' | 'sent' | 'won' | 'lost';
      client: {
        id: string;
        fullName: string;
        email: string | null;
      };
    } | null;
  } | null;
};

type LoginResponse = {
  token: string;
};

async function request<T>(apiBaseUrl: string, path: string, body?: unknown): Promise<T> {
  const init: globalThis.RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    cache: 'no-store'
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, init);

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'La solicitud no se pudo completar.');
  }

  return payload as T;
}

export async function requestWithToken<T>(
  apiBaseUrl: string,
  path: string,
  token: string,
  key: string,
  value: unknown
): Promise<T> {
  return request<T>(apiBaseUrl, path, {
    token,
    [key]: value
  });
}

export async function getManifest(apiBaseUrl: string): Promise<AppManifest> {
  const response = await fetch(`${apiBaseUrl}/api/manifest`, { cache: 'no-store' });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'No se pudo cargar el manifiesto.');
  }

  return payload as AppManifest;
}

export async function login(apiBaseUrl: string, email: string, password: string): Promise<string> {
  const payload = await request<LoginResponse>(apiBaseUrl, '/api/auth/login', { email, password });
  return payload.token;
}

export async function logout(apiBaseUrl: string, token: string) {
  await request(apiBaseUrl, '/api/auth/logout', { token });
}

export function getSessionToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('erptry.session.token');
}

export function setSessionToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('erptry.session.token', token);
}

export function clearSessionToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('erptry.session.token');
}

export async function getSessionInfo(apiBaseUrl: string, token: string) {
  return request<SessionInfo>(apiBaseUrl, '/api/auth/me', { token });
}

export async function getTenantOverview(apiBaseUrl: string, token: string) {
  return request<TenantOverview>(apiBaseUrl, '/api/platform/tenant/current', { token });
}

export async function getTenantUsers(apiBaseUrl: string, token: string) {
  return request<UserSummary[]>(apiBaseUrl, '/api/platform/users', { token });
}

export async function createTenantUser(apiBaseUrl: string, token: string, user: {
  fullName: string;
  email: string;
  password: string;
  roleCode: SessionActorRole;
}) {
  return request<UserSummary>(apiBaseUrl, '/api/platform/users/create', { token, user });
}

export async function updateTenantUserRole(apiBaseUrl: string, token: string, update: {
  userId: string;
  roleCode: SessionActorRole;
}) {
  return request<UserSummary>(apiBaseUrl, '/api/platform/users/role', { token, update });
}

export async function getTenantSettings(apiBaseUrl: string, token: string) {
  return request<TenantSettings>(apiBaseUrl, '/api/platform/settings', { token });
}

export async function updateTenantSettings(apiBaseUrl: string, token: string, settings: TenantSettings) {
  return request<TenantSettings>(apiBaseUrl, '/api/platform/settings/update', { token, settings });
}

export async function getRoles(apiBaseUrl: string, token: string) {
  return request<RoleSummary[]>(apiBaseUrl, '/api/platform/roles', { token });
}

export async function getClients(apiBaseUrl: string, token: string) {
  return request<ClientSummary[]>(apiBaseUrl, '/api/clients/list', { token });
}

export async function getSales(apiBaseUrl: string, token: string) {
  return request<SaleSummary[]>(apiBaseUrl, '/api/sales/list', { token });
}

export async function getInvoices(apiBaseUrl: string, token: string) {
  return request<InvoiceSummary[]>(apiBaseUrl, '/api/invoices/list', { token });
}

export async function getCatalogItems(apiBaseUrl: string, token: string) {
  return request<CatalogItemSummary[]>(apiBaseUrl, '/api/catalog/list', { token });
}

export async function getPayments(apiBaseUrl: string, token: string) {
  return request<PaymentSummary[]>(apiBaseUrl, '/api/payments/list', { token });
}

export async function getEmployees(apiBaseUrl: string, token: string) {
  return request<EmployeeSummary[]>(apiBaseUrl, '/api/employees/list', { token });
}

export async function getInternalTasks(apiBaseUrl: string, token: string) {
  return request<InternalTaskSummary[]>(apiBaseUrl, '/api/internal-tasks/list', { token });
}

export async function getReservations(apiBaseUrl: string, token: string) {
  return request<ReservationSummary[]>(apiBaseUrl, '/api/reservations/list', { token });
}

export function hasAnyPermission(permissionCodes: string[], expected: string[]) {
  return expected.some((permissionCode) => permissionCodes.includes(permissionCode));
}
