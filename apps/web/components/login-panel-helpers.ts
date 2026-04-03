export type EmployeeOption = {
  id: string;
  fullName: string;
  employeeCode: string;
  status: 'active' | 'on_leave' | 'inactive';
};

export type InternalTaskOption = {
  id: string;
  taskCode: string;
  title: string;
  assigneeEmployeeId: string;
  assigneeEmployeeStatus?: 'active' | 'on_leave' | 'inactive';
  assigneeEmployee?: {
    status: 'active' | 'on_leave' | 'inactive';
  };
};

function getTaskAssigneeStatus(task: InternalTaskOption) {
  return task.assigneeEmployeeStatus ?? task.assigneeEmployee?.status;
}

type FlowSale = {
  id: string;
  reference: string;
  stage: 'draft' | 'sent' | 'won' | 'lost';
  client: {
    fullName: string;
  };
};

type FlowInvoice = {
  id: string;
  saleId: string;
  reference: string;
  status: 'draft' | 'issued' | 'paid' | 'void';
  balanceCents: number;
  client: {
    fullName: string;
  };
  payments: Array<{
    id: string;
    status: 'pending' | 'confirmed' | 'failed';
    amountCents: number;
  }>;
};

type FlowPayment = {
  id: string;
  invoiceId: string;
  status: 'pending' | 'confirmed' | 'failed';
  amountCents: number;
  invoice: {
    reference: string;
    status: 'draft' | 'issued' | 'paid' | 'void';
    balanceCents: number;
  };
};

type FlowEmployee = EmployeeOption;

type FlowInternalTask = {
  id: string;
  taskCode: string;
  title: string;
  assigneeEmployee: {
    id: string;
    fullName: string;
    employeeCode: string;
    status: 'active' | 'on_leave' | 'inactive';
  };
  sale: {
    id: string;
    reference: string;
    client: {
      fullName: string;
    };
  } | null;
};

type FlowReservation = {
  id: string;
  reservationCode: string;
  title: string;
  assigneeEmployee: {
    id: string;
    fullName: string;
    employeeCode: string;
    status: 'active' | 'on_leave' | 'inactive';
  };
  internalTask: {
    id: string;
    taskCode: string;
    sale: {
      reference: string;
      client: {
        fullName: string;
      };
    } | null;
  } | null;
};

type FlowAnalytics = {
  sales: {
    wonCount: number;
  };
  billing: {
    paidCount: number;
  };
  payments: {
    confirmedCount: number;
  };
} | null;

type FlowReports = {
  exports: Array<{
    type: string;
    totalRows: number;
  }>;
} | null;

type FlowNotifications = {
  totalCount: number;
  items: Array<{
    resourceType: string | null;
  }>;
} | null;

type FlowAuditLogs = {
  totalCount: number;
  items: Array<{
    action: string;
  }>;
} | null;

export type ReleaseOperableV1ChecklistState = {
  sales: FlowSale[];
  invoices: FlowInvoice[];
  payments: FlowPayment[];
  employees: FlowEmployee[];
  internalTasks: FlowInternalTask[];
  reservations: FlowReservation[];
  analytics: FlowAnalytics;
  reports: FlowReports;
  notifications: FlowNotifications;
  auditLogs: FlowAuditLogs;
};

export type ReleaseOperableV1ChecklistItem = {
  id: string;
  title: string;
  status: 'complete' | 'attention';
  detail: string;
};

export type ReleaseOperableV1Action = {
  id: string;
  title: string;
  detail: string;
  targetSectionId: string;
  targetLabel: string;
};

export type ReleaseOperableV1QuickLink = {
  targetSectionId: string;
  targetLabel: string;
};

export type ReleaseOperableV1ReviewCard = {
  id: string;
  title: string;
  status: 'ready' | 'attention';
  module: string;
  detail: string;
  checks: string[];
  targetSectionId: string;
  targetLabel: string;
  quickLinks?: ReleaseOperableV1QuickLink[];
};

export type DemoAccessProfile = {
  id: 'owner' | 'manager' | 'operator' | 'viewer';
  title: string;
  email: string;
  summary: string;
  canReview: string[];
  shouldNotSee: string[];
};

export type PaymentFormState = {
  status: 'ready' | 'attention';
  detail: string;
};

export type ReservationScheduleState = {
  status: 'ready' | 'attention';
  detail: string;
};

export type AccessReviewSummary = {
  profileTitle: string;
  profileSummary: string;
  roleLabel: string;
  visibleAreas: string[];
  manageAreas: string[];
  hiddenAreas: string[];
  nextStep: string;
};

export type PermissionGroupSummary = {
  id: string;
  title: string;
  items: Array<{
    code: string;
    label: string;
    capability: 'Gestion' | 'Lectura';
  }>;
};

const catalogKindLabels: Record<'product' | 'service', string> = {
  product: 'Producto',
  service: 'Servicio'
};

const catalogStatusLabels: Record<'active' | 'archived', string> = {
  active: 'Activo',
  archived: 'Archivado'
};

const saleStageLabels: Record<'draft' | 'sent' | 'won' | 'lost', string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  won: 'Ganada',
  lost: 'Perdida'
};

const invoiceStatusLabels: Record<'draft' | 'issued' | 'paid' | 'void', string> = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Pagada',
  void: 'Anulada'
};

const paymentStatusLabels: Record<'pending' | 'confirmed' | 'failed', string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  failed: 'Fallido'
};

const paymentMethodLabels: Record<'cash' | 'card' | 'bank_transfer', string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  bank_transfer: 'Transferencia'
};

const employeeStatusLabels: Record<'active' | 'on_leave' | 'inactive', string> = {
  active: 'Activo',
  on_leave: 'De baja',
  inactive: 'Inactivo'
};

const employmentTypeLabels: Record<'full_time' | 'part_time' | 'contractor', string> = {
  full_time: 'Jornada completa',
  part_time: 'Jornada parcial',
  contractor: 'Colaborador externo'
};

const internalTaskStatusLabels: Record<'todo' | 'in_progress' | 'blocked' | 'done', string> = {
  todo: 'Pendiente',
  in_progress: 'En curso',
  blocked: 'Bloqueada',
  done: 'Hecha'
};

const internalTaskPriorityLabels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

const reservationStatusLabels: Record<'booked' | 'confirmed' | 'completed' | 'cancelled', string> = {
  booked: 'Reservada',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada'
};

const notificationSeverityLabels: Record<string, string> = {
  info: 'Informativa',
  success: 'Resuelta',
  warning: 'Atencion',
  critical: 'Critica'
};

const notificationTypeLabels: Record<string, string> = {
  activity: 'Actividad',
  finance: 'Finanzas',
  reminder: 'Recordatorio',
  alert: 'Alerta'
};

const resourceTypeLabels: Record<string, string> = {
  tenant: 'Empresa',
  tenant_setting: 'Configuracion general',
  user: 'Usuario',
  client: 'Cliente',
  catalog_item: 'Producto o servicio',
  sale: 'Venta',
  invoice: 'Factura',
  payment: 'Cobro',
  employee: 'Empleado',
  internal_task: 'Tarea interna',
  reservation: 'Reserva',
  notification: 'Aviso interno'
};

const auditActionLabels: Record<string, string> = {
  'user.create': 'Usuario creado',
  'settings.update': 'Configuracion actualizada',
  'user.role.update': 'Permisos actualizados',
  'client.create': 'Cliente creado',
  'catalog_item.create': 'Producto o servicio creado',
  'sale.create': 'Venta creada',
  'invoice.create': 'Factura emitida',
  'payment.create': 'Cobro registrado',
  'notification.read': 'Aviso marcado como leido',
  'employee.create': 'Empleado creado',
  'internal_task.create': 'Tarea interna creada',
  'reservation.create': 'Reserva creada'
};

const permissionCatalog: Record<string, { groupId: string; groupTitle: string; label: string; capability: 'Gestion' | 'Lectura' }> = {
  'settings.manage': { groupId: 'platform', groupTitle: 'Plataforma', label: 'Ajustes del tenant', capability: 'Gestion' },
  'users.manage': { groupId: 'platform', groupTitle: 'Plataforma', label: 'Usuarios', capability: 'Gestion' },
  'roles.manage': { groupId: 'platform', groupTitle: 'Plataforma', label: 'Roles y permisos', capability: 'Gestion' },
  'sales.view': { groupId: 'commercial', groupTitle: 'Circuito comercial', label: 'Clientes, catalogo y ventas', capability: 'Lectura' },
  'sales.manage': { groupId: 'commercial', groupTitle: 'Circuito comercial', label: 'Clientes, catalogo y ventas', capability: 'Gestion' },
  'billing.view': { groupId: 'billing', groupTitle: 'Facturacion y cobros', label: 'Facturacion', capability: 'Lectura' },
  'billing.manage': { groupId: 'billing', groupTitle: 'Facturacion y cobros', label: 'Facturacion', capability: 'Gestion' },
  'payments.view': { groupId: 'billing', groupTitle: 'Facturacion y cobros', label: 'Cobros', capability: 'Lectura' },
  'payments.manage': { groupId: 'billing', groupTitle: 'Facturacion y cobros', label: 'Cobros', capability: 'Gestion' },
  'employees.view': { groupId: 'operations', groupTitle: 'Operacion interna', label: 'Empleados', capability: 'Lectura' },
  'employees.manage': { groupId: 'operations', groupTitle: 'Operacion interna', label: 'Empleados', capability: 'Gestion' },
  'tasks.view': { groupId: 'operations', groupTitle: 'Operacion interna', label: 'Trabajo interno', capability: 'Lectura' },
  'tasks.manage': { groupId: 'operations', groupTitle: 'Operacion interna', label: 'Trabajo interno', capability: 'Gestion' },
  'reservations.view': { groupId: 'operations', groupTitle: 'Operacion interna', label: 'Agenda', capability: 'Lectura' },
  'reservations.manage': { groupId: 'operations', groupTitle: 'Operacion interna', label: 'Agenda', capability: 'Gestion' },
  'analytics.view': { groupId: 'control', groupTitle: 'Control y seguimiento', label: 'Analytics', capability: 'Lectura' },
  'reports.view': { groupId: 'control', groupTitle: 'Control y seguimiento', label: 'Reportes', capability: 'Lectura' },
  'notifications.view': { groupId: 'control', groupTitle: 'Control y seguimiento', label: 'Avisos internos', capability: 'Lectura' },
  'notifications.manage': { groupId: 'control', groupTitle: 'Control y seguimiento', label: 'Avisos internos', capability: 'Gestion' },
  'audit.view': { groupId: 'control', groupTitle: 'Control y seguimiento', label: 'Auditoria', capability: 'Lectura' },
  'audit.manage': { groupId: 'control', groupTitle: 'Control y seguimiento', label: 'Auditoria', capability: 'Gestion' }
};

const demoAccessProfiles: DemoAccessProfile[] = [
  {
    id: 'owner',
    title: 'Owner demo',
    email: 'owner@erptry.local',
    summary: 'Control total del tenant para validar ajustes, roles, usuarios y el circuito vendible completo.',
    canReview: ['Ajustes', 'Permisos', 'Usuarios', 'Gestion completa'],
    shouldNotSee: []
  },
  {
    id: 'manager',
    title: 'Manager demo',
    email: 'manager@erptry.local',
    summary: 'Gestiona la operacion diaria y el circuito comercial sin tocar la administracion global del tenant.',
    canReview: ['Usuarios', 'Ventas', 'Facturacion', 'Cobros', 'Operacion diaria'],
    shouldNotSee: ['Gestion de roles avanzada']
  },
  {
    id: 'operator',
    title: 'Operator demo',
    email: 'operator@erptry.local',
    summary: 'Revisa el flujo operativo en modo lectura para detectar copy, datos y trazabilidad sin crear cambios.',
    canReview: ['Ventas', 'Facturacion', 'Cobros', 'Empleados', 'Agenda', 'Control'],
    shouldNotSee: ['Ajustes', 'Usuarios', 'Botones de alta o edicion']
  },
  {
    id: 'viewer',
    title: 'Viewer demo',
    email: 'viewer@erptry.local',
    summary: 'Sirve como prueba final de restricciones: debe poder leer el circuito, pero nunca gestionar el tenant.',
    canReview: ['Circuito en lectura', 'Analytics', 'Reportes', 'Avisos', 'Auditoria'],
    shouldNotSee: ['Ajustes', 'Usuarios', 'Acciones de gestion']
  }
];

export function getDemoAccessProfiles() {
  return demoAccessProfiles;
}

export function getAccessReviewSummary(input: {
  actorRole: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';
  actorEmail: string;
  permissions: string[];
}): AccessReviewSummary {
  const normalizedEmail = input.actorEmail.trim().toLowerCase();
  const profile = demoAccessProfiles.find((candidate) => candidate.email === normalizedEmail);
  const can = (expected: string[]) => expected.some((permission) => input.permissions.includes(permission));
  const catalog = [
    {
      label: 'Ajustes',
      view: ['settings.manage'],
      manage: ['settings.manage']
    },
    {
      label: 'Usuarios y permisos',
      view: ['users.manage', 'roles.manage'],
      manage: ['users.manage', 'roles.manage']
    },
    {
      label: 'Clientes, catalogo y ventas',
      view: ['sales.view', 'sales.manage'],
      manage: ['sales.manage']
    },
    {
      label: 'Facturacion',
      view: ['billing.view', 'billing.manage'],
      manage: ['billing.manage']
    },
    {
      label: 'Cobros',
      view: ['payments.view', 'payments.manage'],
      manage: ['payments.manage']
    },
    {
      label: 'Empleados',
      view: ['employees.view', 'employees.manage'],
      manage: ['employees.manage']
    },
    {
      label: 'Trabajo interno',
      view: ['tasks.view', 'tasks.manage'],
      manage: ['tasks.manage']
    },
    {
      label: 'Agenda',
      view: ['reservations.view', 'reservations.manage'],
      manage: ['reservations.manage']
    },
    {
      label: 'Analytics',
      view: ['analytics.view'],
      manage: []
    },
    {
      label: 'Reportes',
      view: ['reports.view'],
      manage: []
    },
    {
      label: 'Avisos',
      view: ['notifications.view', 'notifications.manage'],
      manage: ['notifications.manage']
    },
    {
      label: 'Auditoria',
      view: ['audit.view', 'audit.manage'],
      manage: ['audit.manage']
    }
  ];
  const visibleAreas = catalog.filter((item) => can(item.view)).map((item) => item.label);
  const manageAreas = catalog.filter((item) => item.manage.length > 0 && can(item.manage)).map((item) => item.label);
  const hiddenAreas = catalog.filter((item) => !can(item.view)).map((item) => item.label);
  const roleLabel = input.actorRole === 'owner'
    ? 'Owner'
    : input.actorRole === 'admin'
      ? 'Admin'
      : input.actorRole === 'manager'
        ? 'Manager'
        : input.actorRole === 'operator'
          ? 'Operator'
          : 'Viewer';

  return {
    profileTitle: profile?.title ?? `${roleLabel} activo`,
    profileSummary: profile?.summary ?? 'Perfil autenticado fuera del seed demo; usa permisos visibles para revisar su alcance real.',
    roleLabel,
    visibleAreas,
    manageAreas,
    hiddenAreas,
    nextStep: input.actorRole === 'viewer'
      ? 'Vuelve despues con owner o manager para confirmar que reaparecen gestion, usuarios y acciones de alta.'
      : 'Tras este repaso, cambia a viewer para confirmar que ajustes, usuarios y acciones de gestion desaparecen con copy comprensible.'
  };
}

export function getPermissionGroupSummary(permissions: string[]): PermissionGroupSummary[] {
  const groups = new Map<string, PermissionGroupSummary>();

  permissions.forEach((permissionCode) => {
    const permission = permissionCatalog[permissionCode] ?? {
      groupId: 'other',
      groupTitle: 'Permisos adicionales',
      label: permissionCode,
      capability: permissionCode.endsWith('.manage') ? 'Gestion' : 'Lectura'
    };
    const existingGroup = groups.get(permission.groupId);
    const item = {
      code: permissionCode,
      label: permission.label,
      capability: permission.capability
    };

    if (!existingGroup) {
      groups.set(permission.groupId, {
        id: permission.groupId,
        title: permission.groupTitle,
        items: [item]
      });
      return;
    }

    existingGroup.items.push(item);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    items: group.items.sort((left, right) => left.label.localeCompare(right.label, 'es'))
  }));
}

export function getReleaseOperableV1Checklist(state: ReleaseOperableV1ChecklistState) {
  const wonSale = state.sales.find((sale) => sale.stage === 'won');
  const invoice = wonSale
    ? state.invoices.find((candidate) => candidate.saleId === wonSale.id && (candidate.status === 'issued' || candidate.status === 'paid'))
    : undefined;
  const confirmedPayments = invoice
    ? state.payments.filter((payment) => payment.invoiceId === invoice.id && payment.status === 'confirmed')
    : [];
  const internalTask = wonSale
    ? state.internalTasks.find((task) => task.sale?.id === wonSale.id && task.assigneeEmployee.status !== 'inactive')
    : undefined;
  const reservation = internalTask
    ? state.reservations.find(
        (candidate) => candidate.internalTask?.id === internalTask.id && candidate.assigneeEmployee.status === 'active'
      )
    : undefined;

  const notificationResources = new Set(state.notifications?.items.map((item) => item.resourceType).filter(Boolean));
  const auditActions = new Set(state.auditLogs?.items.map((item) => item.action));
  const reportsReady = Boolean(state.reports && state.reports.exports.length >= 3 && state.reports.exports.every((item) => item.totalRows >= 0));
  const telemetryReady = Boolean(
    state.analytics
    && state.analytics.sales.wonCount > 0
    && state.analytics.billing.paidCount >= 0
    && state.analytics.payments.confirmedCount >= confirmedPayments.length
    && reportsReady
    && state.notifications
    && notificationResources.has('invoice')
    && notificationResources.has('payment')
    && notificationResources.has('internal_task')
    && notificationResources.has('reservation')
    && state.auditLogs
    && auditActions.has('invoice.create')
    && auditActions.has('payment.create')
    && auditActions.has('reservation.create')
  );

  const items: ReleaseOperableV1ChecklistItem[] = [
    {
      id: 'won-sale',
      title: 'Venta ganada lista para facturar',
      status: wonSale ? 'complete' : 'attention',
      detail: wonSale
        ? `${wonSale.reference} · ${wonSale.client.fullName}`
        : 'Falta una venta en estado won que pueda iniciar el circuito comercial.'
    },
    {
      id: 'invoice',
      title: 'Factura emitida desde una venta won',
      status: invoice ? 'complete' : 'attention',
      detail: invoice
        ? `${invoice.reference} · ${invoice.client.fullName} · saldo ${formatEuros(invoice.balanceCents)}`
        : 'Falta emitir una factura operativa desde una venta ganada sin factura previa.'
    },
    {
      id: 'payment',
      title: 'Cobro confirmado sobre factura emitida',
      status: confirmedPayments.length > 0 ? 'complete' : 'attention',
      detail: confirmedPayments.length > 0
        ? `${confirmedPayments.length} cobro(s) confirmado(s) sobre ${invoice?.reference ?? 'la factura activa'}`
        : 'Todavia no hay cobros confirmados que demuestren cierre financiero del flujo.'
    },
    {
      id: 'internal-task',
      title: 'Trabajo interno enlazado a la venta',
      status: internalTask ? 'complete' : 'attention',
      detail: internalTask
        ? `${internalTask.taskCode} · ${internalTask.assigneeEmployee.fullName}`
        : 'Falta una tarea interna ligada a la venta ganada y asignada a un empleado valido.'
    },
    {
      id: 'reservation',
      title: 'Reserva operativa con trazabilidad',
      status: reservation ? 'complete' : 'attention',
      detail: reservation
        ? `${reservation.reservationCode} · ${reservation.assigneeEmployee.fullName}`
        : 'Falta una reserva enlazada a la tarea interna con un empleado activo.'
    },
    {
      id: 'telemetry',
      title: 'Analytics, reportes y trazabilidad visibles',
      status: telemetryReady ? 'complete' : 'attention',
      detail: telemetryReady
        ? 'Analytics, reports, notifications y audit logs ya reflejan el circuito operativo.'
        : 'Todavia faltan evidencias cruzadas en analytics, reports, notifications o audit logs.'
    }
  ];

  const completedCount = items.filter((item) => item.status === 'complete').length;

  return {
    items,
    completedCount,
    totalCount: items.length,
    progressPercent: Math.round((completedCount / items.length) * 100),
    status: completedCount === items.length ? 'ready' : 'attention'
  } as const;
}

export function getCatalogKindLabel(kind: 'product' | 'service') {
  return catalogKindLabels[kind];
}

export function getCatalogStatusLabel(status: 'active' | 'archived') {
  return catalogStatusLabels[status];
}

export function getSaleStageLabel(stage: 'draft' | 'sent' | 'won' | 'lost') {
  return saleStageLabels[stage];
}

export function getInvoiceStatusLabel(status: 'draft' | 'issued' | 'paid' | 'void') {
  return invoiceStatusLabels[status];
}

export function getPaymentStatusLabel(status: 'pending' | 'confirmed' | 'failed') {
  return paymentStatusLabels[status];
}

export function getPaymentMethodLabel(method: 'cash' | 'card' | 'bank_transfer') {
  return paymentMethodLabels[method];
}

export function getEmployeeStatusLabel(status: 'active' | 'on_leave' | 'inactive') {
  return employeeStatusLabels[status];
}

export function getEmploymentTypeLabel(type: 'full_time' | 'part_time' | 'contractor') {
  return employmentTypeLabels[type];
}

export function getInternalTaskStatusLabel(status: 'todo' | 'in_progress' | 'blocked' | 'done') {
  return internalTaskStatusLabels[status];
}

export function getInternalTaskPriorityLabel(priority: 'low' | 'medium' | 'high') {
  return internalTaskPriorityLabels[priority];
}

export function getReservationStatusLabel(status: 'booked' | 'confirmed' | 'completed' | 'cancelled') {
  return reservationStatusLabels[status];
}

export function getNotificationSeverityLabel(severity: string) {
  return notificationSeverityLabels[severity] ?? severity;
}

export function getNotificationTypeLabel(type: string) {
  return notificationTypeLabels[type] ?? type;
}

export function getResourceTypeLabel(resourceType: string) {
  return resourceTypeLabels[resourceType] ?? resourceType;
}

export function getAuditActionLabel(action: string) {
  return auditActionLabels[action] ?? action;
}

export function getReleaseOperableV1ActionPlan(state: ReleaseOperableV1ChecklistState): ReleaseOperableV1Action[] {
  const actions: ReleaseOperableV1Action[] = [];
  const wonSale = state.sales.find((sale) => sale.stage === 'won');
  const invoiceableSale = state.sales.find((sale) => (
    sale.stage === 'won' && !state.invoices.some((invoice) => invoice.saleId === sale.id)
  ));
  const invoice = wonSale
    ? state.invoices.find((candidate) => candidate.saleId === wonSale.id && (candidate.status === 'issued' || candidate.status === 'paid'))
    : undefined;
  const payableInvoice = state.invoices.find((candidate) => candidate.status === 'issued' && candidate.balanceCents > 0);
  const task = wonSale
    ? state.internalTasks.find((candidate) => candidate.sale?.id === wonSale.id && candidate.assigneeEmployee.status !== 'inactive')
    : undefined;
  const reservation = task
    ? state.reservations.find((candidate) => candidate.internalTask?.id === task.id && candidate.assigneeEmployee.status === 'active')
    : undefined;
  const activeEmployee = state.employees.find((employee) => employee.status === 'active');
  const hasTelemetry = Boolean(
    state.analytics
    && state.reports?.exports.length
    && state.notifications?.items.length
    && state.auditLogs?.items.length
  );

  if (!wonSale) {
    actions.push({
      id: 'create-won-sale',
      title: 'Cierra una venta ganada',
      detail: 'Usa un cliente y un servicio del tenant para dejar al menos una venta en estado won y abrir el flujo demostrable.',
      targetSectionId: 'sales-section',
      targetLabel: 'Ir a ventas'
    });
  }

  if (invoiceableSale) {
    actions.push({
      id: 'issue-invoice',
      title: 'Emite la siguiente factura',
      detail: `Convierte ${invoiceableSale.reference} en factura issued para demostrar el paso comercial hacia billing sin salir del backoffice.`,
      targetSectionId: 'billing-section',
      targetLabel: 'Ir a facturacion'
    });
  }

  if (payableInvoice) {
    actions.push({
      id: 'collect-payment',
      title: 'Registra un cobro realista',
      detail: `La factura ${payableInvoice.reference} sigue con ${formatEuros(payableInvoice.balanceCents)} pendientes; registra un cobro para completar el tramo financiero.`,
      targetSectionId: 'payments-section',
      targetLabel: 'Ir a cobros'
    });
  }

  if (!activeEmployee) {
    actions.push({
      id: 'create-employee',
      title: 'Da de alta un empleado activo',
      detail: 'Necesitas al menos una ficha activa para asignar trabajo interno y abrir agenda operativa sin excepciones.',
      targetSectionId: 'employees-section',
      targetLabel: 'Ir a empleados'
    });
  }

  if (wonSale && activeEmployee && !task) {
    actions.push({
      id: 'create-task',
      title: 'Asigna una tarea interna a la venta',
      detail: `Enlaza ${wonSale.reference} con un responsable activo para que la operacion interna quede trazada desde la venta.`,
      targetSectionId: 'internal-tasks-section',
      targetLabel: 'Ir a trabajo interno'
    });
  }

  if (task && !reservation) {
    actions.push({
      id: 'create-reservation',
      title: 'Agenda la ejecucion operativa',
      detail: `Crea una reserva para ${task.taskCode} y valida que el responsable y la trazabilidad comercial se arrastran hasta agenda.`,
      targetSectionId: 'reservations-section',
      targetLabel: 'Ir a agenda'
    });
  }

  if (!hasTelemetry && (invoice || payableInvoice || task || reservation)) {
    actions.push({
      id: 'review-telemetry',
      title: 'Contrasta analytics y trazabilidad',
      detail: 'Revisa analytics, reports, notifications y audit logs para confirmar que el circuito visible coincide con los eventos recien generados.',
      targetSectionId: 'analytics-section',
      targetLabel: 'Ir a analytics'
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: 'demo-ready',
      title: 'Tenant listo para demo operativa',
      detail: 'El circuito minimo ya puede demostrarse de punta a punta; repasa copy, estados y detalles visuales antes de cerrar la release.',
      targetSectionId: 'release-review-section',
      targetLabel: 'Volver al repaso guiado'
    });
  }

  return actions.slice(0, 3);
}

export function getReleaseOperableV1ReviewCards(input: {
  checklist: ReturnType<typeof getReleaseOperableV1Checklist>;
  actionPlan: ReleaseOperableV1Action[];
  paymentFormState: PaymentFormState;
  reservationScheduleState: ReservationScheduleState;
  reports: FlowReports;
  notifications: FlowNotifications;
  auditLogs: FlowAuditLogs;
}): ReleaseOperableV1ReviewCard[] {
  const firstAction = input.actionPlan[0];
  const reportsCount = input.reports?.exports.length ?? 0;
  const notificationsCount = input.notifications?.totalCount ?? 0;
  const auditLogsCount = input.auditLogs?.totalCount ?? 0;
  const controlReady = reportsCount >= 3 && notificationsCount > 0 && auditLogsCount > 0;

  return [
    {
      id: 'access-foundation',
      title: 'Acceso, tenant y permisos',
      status: 'ready',
      module: 'Acceso persistido y nucleo de plataforma',
      detail: 'Empieza el repaso por la cabecera del backoffice para confirmar tenant activo, ajustes base, permisos visibles y gestion de usuarios sin contexto interno.',
      checks: [
        'Confirma tenant, sesiones activas y formulario de ajustes nada mas entrar.',
        'Revisa permisos visibles y prueba que usuarios y roles se entienden con lenguaje operativo.'
      ],
      targetSectionId: 'access-section',
      targetLabel: 'Abrir acceso',
      quickLinks: [
        { targetSectionId: 'access-section', targetLabel: 'Acceso' },
        { targetSectionId: 'settings-section', targetLabel: 'Ajustes' },
        { targetSectionId: 'permissions-section', targetLabel: 'Permisos' },
        { targetSectionId: 'users-section', targetLabel: 'Usuarios' }
      ]
    },
    {
      id: 'permission-profiles',
      title: 'Perfiles demo y restricciones',
      status: 'ready',
      module: 'Roles operativos y acceso restringido',
      detail: 'Usa las cuentas demo owner, manager, operator y viewer para comprobar que el backoffice expone solo lo que cada perfil debe ver y entender.',
      checks: [
        'Cierra sesion y entra como viewer para confirmar que desaparecen ajustes, usuarios y acciones de gestion.',
        'Vuelve con owner o manager y verifica que permisos, roles y textos de acceso denegado siguen siendo comprensibles.'
      ],
      targetSectionId: 'access-section',
      targetLabel: 'Revisar perfiles demo',
      quickLinks: [
        { targetSectionId: 'access-section', targetLabel: 'Acceso' },
        { targetSectionId: 'permissions-section', targetLabel: 'Permisos' },
        { targetSectionId: 'users-section', targetLabel: 'Usuarios' }
      ]
    },
    {
      id: 'demo-flow',
      title: 'Circuito demostrable',
      status: input.checklist.status === 'ready' ? 'ready' : 'attention',
      module: 'Portada, ventas y facturacion',
      detail: input.checklist.status === 'ready'
        ? `El tenant ya cubre ${input.checklist.completedCount}/${input.checklist.totalCount} hitos y puede repasarse de punta a punta desde login.`
        : firstAction
          ? `El tenant cubre ${input.checklist.completedCount}/${input.checklist.totalCount} hitos; empieza el repaso manual por: ${firstAction.title}.`
          : `El tenant cubre ${input.checklist.completedCount}/${input.checklist.totalCount} hitos y aun necesita cerrar el flujo base antes de la demo final.`,
      checks: [
        'Confirma tenant, permisos y ajustes visibles nada mas entrar al backoffice.',
        input.checklist.status === 'ready'
          ? 'Recorre venta ganada, factura y cobro sin copy tecnico ni estados confusos.'
          : firstAction
            ? `Arranca por el siguiente hueco visible: ${firstAction.title}.`
            : 'Completa el circuito minimo antes de plantear la demo final.'
      ],
      targetSectionId: firstAction?.targetSectionId ?? 'sales-section',
      targetLabel: firstAction?.targetLabel ?? 'Ir a ventas',
      quickLinks: [
        { targetSectionId: 'sales-section', targetLabel: 'Ventas' },
        { targetSectionId: 'billing-section', targetLabel: 'Facturacion' },
        { targetSectionId: 'payments-section', targetLabel: 'Cobros' }
      ]
    },
    {
      id: 'finance-form',
      title: 'Cobros en EUR',
      status: input.paymentFormState.status,
      module: 'Cobros y facturas',
      detail: `${input.paymentFormState.detail} El formulario ya trabaja en EUR y evita importes fuera del saldo pendiente.`,
      checks: [
        'Valida que el importe pendiente se entienda en EUR y sin calculo manual.',
        'Comprueba que no puedes cobrar mas del saldo ni usar facturas fuera de estado issued.'
      ],
      targetSectionId: 'payments-section',
      targetLabel: 'Abrir cobros',
      quickLinks: [
        { targetSectionId: 'billing-section', targetLabel: 'Facturacion' },
        { targetSectionId: 'payments-section', targetLabel: 'Cobros' }
      ]
    },
    {
      id: 'operations-form',
      title: 'Agenda con trazabilidad',
      status: input.reservationScheduleState.status,
      module: 'Empleados, tareas y reservas',
      detail: `${input.reservationScheduleState.detail} La agenda mantiene el responsable alineado con la tarea enlazada.`,
      checks: [
        'Revisa que la tarea conserve referencia comercial y cliente visible para operaciones.',
        'Comprueba que la reserva arrastra responsable activo y no deja combinaciones incoherentes.'
      ],
      targetSectionId: 'reservations-section',
      targetLabel: 'Abrir agenda',
      quickLinks: [
        { targetSectionId: 'employees-section', targetLabel: 'Empleados' },
        { targetSectionId: 'internal-tasks-section', targetLabel: 'Trabajo interno' },
        { targetSectionId: 'reservations-section', targetLabel: 'Agenda' }
      ]
    },
    {
      id: 'control-surface',
      title: 'Control y seguimiento',
      status: controlReady ? 'ready' : 'attention',
      module: 'Analytics, reportes y trazabilidad',
      detail: controlReady
        ? `${reportsCount} reportes, ${notificationsCount} avisos y ${auditLogsCount} trazas ya permiten contrastar la demo sin mirar logs tecnicos.`
        : `Todavia faltan evidencias visibles: reportes ${reportsCount}, avisos ${notificationsCount}, trazas ${auditLogsCount}.`,
      checks: [
        'Contrasta que analytics, exportables, avisos y auditoria cuentan la misma historia operativa.',
        controlReady
          ? 'Verifica que los textos se entienden sin nombres internos ni necesidad de revisar logs tecnicos.'
          : 'Genera la evidencia que falta y comprueba que aparece con lenguaje operativo comprensible.'
      ],
      targetSectionId: 'analytics-section',
      targetLabel: 'Abrir control',
      quickLinks: [
        { targetSectionId: 'analytics-section', targetLabel: 'Analytics' },
        { targetSectionId: 'reports-section', targetLabel: 'Reportes' },
        { targetSectionId: 'notifications-section', targetLabel: 'Avisos' },
        { targetSectionId: 'audit-logs-section', targetLabel: 'Auditoria' }
      ]
    }
  ];
}

export function getInternalTaskAssigneeOptions(employees: EmployeeOption[]) {
  return employees.filter((employee) => employee.status !== 'inactive');
}

export function getReservationAssigneeOptions(employees: EmployeeOption[]) {
  return employees.filter((employee) => employee.status === 'active');
}

export function getReservationTaskOptions(
  tasks: InternalTaskOption[],
  assigneeEmployeeId: string,
  selectedTaskId: string
) {
  const activeTasks = tasks.filter((task) => getTaskAssigneeStatus(task) !== 'inactive' && getTaskAssigneeStatus(task) !== 'on_leave');
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  if (selectedTask && getTaskAssigneeStatus(selectedTask) === 'active') {
    return activeTasks.filter((task) => task.assigneeEmployeeId === selectedTask.assigneeEmployeeId);
  }

  if (!assigneeEmployeeId) {
    return activeTasks;
  }

  return activeTasks.filter((task) => task.assigneeEmployeeId === assigneeEmployeeId);
}

export function getReservationSelectionForAssignee(
  tasks: InternalTaskOption[],
  assigneeEmployeeId: string,
  currentTaskId: string
) {
  const currentTask = tasks.find((task) => task.id === currentTaskId);

  if (!currentTask || currentTask.assigneeEmployeeId === assigneeEmployeeId) {
    return {
      assigneeEmployeeId,
      taskId: currentTaskId
    };
  }

  return {
    assigneeEmployeeId,
    taskId: ''
  };
}

export function getReservationSelectionForTask(tasks: InternalTaskOption[], nextTaskId: string, fallbackAssigneeEmployeeId: string) {
  const nextTask = tasks.find((task) => task.id === nextTaskId);

  if (!nextTask || getTaskAssigneeStatus(nextTask) === 'inactive' || getTaskAssigneeStatus(nextTask) === 'on_leave') {
    return {
      assigneeEmployeeId: fallbackAssigneeEmployeeId,
      taskId: ''
    };
  }

  return {
    assigneeEmployeeId: nextTask.assigneeEmployeeId,
    taskId: nextTask.id
  };
}

export function getPaymentFormState(
  invoice: { reference: string; balanceCents: number } | undefined,
  amountCents: number
): PaymentFormState {
  if (!invoice) {
    return {
      status: 'attention',
      detail: 'Selecciona una factura emitida con saldo pendiente para registrar el cobro.'
    };
  }

  if (amountCents <= 0) {
    return {
      status: 'attention',
      detail: 'Indica un importe mayor que cero para registrar el cobro.'
    };
  }

  if (amountCents > invoice.balanceCents) {
    return {
      status: 'attention',
      detail: `El importe supera el saldo pendiente de ${formatEuros(invoice.balanceCents)} en ${invoice.reference}.`
    };
  }

  const closesInvoice = amountCents === invoice.balanceCents;

  return {
    status: 'ready',
    detail: closesInvoice
      ? `Este cobro liquidara ${invoice.reference} y la dejara en estado paid.`
      : `Quedaran ${formatEuros(invoice.balanceCents - amountCents)} pendientes en ${invoice.reference} tras registrar el cobro.`
  };
}

export function getReservationScheduleState(input: {
  reservationDate: string;
  reservationStartTime: string;
  reservationEndTime: string;
  assigneeEmployeeName: string | undefined;
  linkedTaskCode: string | undefined;
}): ReservationScheduleState {
  if (!input.assigneeEmployeeName) {
    return {
      status: 'attention',
      detail: 'Selecciona un empleado activo para poder abrir la reserva.'
    };
  }

  if (!input.reservationDate || !input.reservationStartTime || !input.reservationEndTime) {
    return {
      status: 'attention',
      detail: 'Completa fecha, inicio y fin para validar la franja horaria antes de crear la reserva.'
    };
  }

  const startAt = new Date(`${input.reservationDate}T${input.reservationStartTime}:00.000Z`);
  const endAt = new Date(`${input.reservationDate}T${input.reservationEndTime}:00.000Z`);

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return {
      status: 'attention',
      detail: 'La hora de fin debe quedar despues de la hora de inicio para evitar una agenda invalida.'
    };
  }

  return {
    status: 'ready',
    detail: input.linkedTaskCode
      ? `${input.assigneeEmployeeName} quedara agendado de ${input.reservationStartTime} a ${input.reservationEndTime} y la reserva seguira la trazabilidad de ${input.linkedTaskCode}.`
      : `${input.assigneeEmployeeName} quedara agendado de ${input.reservationStartTime} a ${input.reservationEndTime} el ${input.reservationDate}.`
  };
}

function formatEuros(valueCents: number) {
  return `${(valueCents / 100).toFixed(2)} EUR`;
}
