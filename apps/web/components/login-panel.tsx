'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { AnalyticsSnapshot, AuditLogsFeed, NotificationsInbox, ReportsBundle } from '@erptry/contracts';
import type { AccessReviewRole } from './login-panel-helpers';

import {
  getAccessValidationChecks,
  getAccessReviewStorageKey,
  getAccessReviewTimeline,
  getAccessReviewSummary,
  getNextVisitedAccessRoles,
  getDemoAccessProfiles,
  getAuditActionLabel,
  getCatalogKindLabel,
  getCatalogStatusLabel,
  getEmployeeStatusLabel,
  getEmploymentTypeLabel,
  getPermissionGroupSummary,
  getReleaseOperableV1ActionPlan,
  getNotificationSeverityLabel,
  getNotificationTypeLabel,
  getInternalTaskAssigneeOptions,
  getInternalTaskPriorityLabel,
  getInternalTaskStatusLabel,
  getInvoiceStatusLabel,
  getPaymentFormState,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getRoleLabel,
  getReleaseOperableV1Checklist,
  getReleaseOperableV1ReviewCards,
  getResourceTypeLabel,
  getReservationAssigneeOptions,
  getReservationStatusLabel,
  getReservationScheduleState,
  getReservationSelectionForAssignee,
  getReservationSelectionForTask,
  getReservationTaskOptions,
  sanitizeAccessReviewRoles,
  getSaleStageLabel
} from './login-panel-helpers';

type LoginPanelProps = {
  apiBaseUrl: string;
};

type LoginState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      actor: string;
      actorEmail: string;
      actorRole: 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';
      permissions: string[];
      tenantId: string;
      tenantName: string;
      totalUsers: number;
      activeSessions: number;
      token: string;
      settings: {
        brandingName: string;
        defaultLocale: string;
        timezone: string;
      };
      rolesCatalog: Array<{
        id: string;
        code: string;
        name: string;
        permissions: string[];
      }>;
      users: Array<{
        id: string;
        fullName: string;
        email: string;
        status: string;
        roles: string[];
      }>;
      clients: Array<{
        id: string;
        fullName: string;
        email: string | null;
        phone: string | null;
        segment: string;
        notes: string | null;
      }>;
      catalogItems: Array<{
        id: string;
        name: string;
        kind: 'product' | 'service';
        priceCents: number;
        durationMin: number | null;
        status: 'active' | 'archived';
        sku: string | null;
        notes: string | null;
      }>;
      sales: Array<{
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
      }>;
      invoices: Array<{
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
      }>;
      payments: Array<{
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
      }>;
      employees: Array<{
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
      }>;
      internalTasks: Array<{
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
      }>;
      reservations: Array<{
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
      }>;
      analytics: AnalyticsSnapshot | null;
      reports: ReportsBundle | null;
      notifications: NotificationsInbox | null;
      auditLogs: AuditLogsFeed | null;
    };

type CreateUserState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; message: string };

type SaveSettingsState = CreateUserState;

export function LoginPanel({ apiBaseUrl }: LoginPanelProps) {
  const demoAccessProfiles = getDemoAccessProfiles();
  const [email, setEmail] = useState('owner@erptry.local');
  const [password, setPassword] = useState('erptry1234');
  const [state, setState] = useState<LoginState>({ status: 'idle' });
  const [newUserName, setNewUserName] = useState('Operaciones Demo');
  const [newUserEmail, setNewUserEmail] = useState('ops@erptry.local');
  const [newUserPassword, setNewUserPassword] = useState('erptry1234');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'operator' | 'viewer'>('manager');
  const [createUserState, setCreateUserState] = useState<CreateUserState>({ status: 'idle' });
  const [saveSettingsState, setSaveSettingsState] = useState<SaveSettingsState>({ status: 'idle' });
  const [brandingName, setBrandingName] = useState('ERPTRY Demo');
  const [defaultLocale, setDefaultLocale] = useState('es-ES');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [clientName, setClientName] = useState('Cliente Demo');
  const [clientEmail, setClientEmail] = useState('cliente@demo.test');
  const [clientPhone, setClientPhone] = useState('600222333');
  const [clientSegment, setClientSegment] = useState('general');
  const [clientNotes, setClientNotes] = useState('Alta desde el backoffice.');
  const [itemName, setItemName] = useState('Auditoria premium');
  const [itemKind, setItemKind] = useState<'product' | 'service'>('service');
  const [itemPriceCents, setItemPriceCents] = useState(18000);
  const [itemDurationMin, setItemDurationMin] = useState(90);
  const [itemSku, setItemSku] = useState('SERV-090');
  const [itemNotes, setItemNotes] = useState('Servicio de analisis inicial.');
  const [saleTitle, setSaleTitle] = useState('Propuesta de lanzamiento');
  const [saleStage, setSaleStage] = useState<'draft' | 'sent' | 'won' | 'lost'>('draft');
  const [saleClientId, setSaleClientId] = useState('');
  const [saleNotes, setSaleNotes] = useState('Oferta inicial conectada con cliente y catalogo.');
  const [saleLines, setSaleLines] = useState<Array<{ catalogItemId: string; quantity: number }>>([{ catalogItemId: '', quantity: 1 }]);
  const [invoiceSaleId, setInvoiceSaleId] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('2026-04-30');
  const [invoiceNotes, setInvoiceNotes] = useState('Factura emitida desde una venta validada en backoffice.');
  const [paymentInvoiceId, setPaymentInvoiceId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'failed'>('confirmed');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('bank_transfer');
  const [paymentAmountCents, setPaymentAmountCents] = useState(57000);
  const [paymentReceivedAt, setPaymentReceivedAt] = useState('2026-04-10');
  const [paymentNotes, setPaymentNotes] = useState('Cobro registrado desde backoffice sobre factura emitida.');
  const [employeeLinkedUserId, setEmployeeLinkedUserId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('EMP-002');
  const [employeeFullName, setEmployeeFullName] = useState('Coordinacion Interna');
  const [employeeWorkEmail, setEmployeeWorkEmail] = useState('equipo@erptry.test');
  const [employeePhone, setEmployeePhone] = useState('600444555');
  const [employeeDepartment, setEmployeeDepartment] = useState('Operaciones');
  const [employeeJobTitle, setEmployeeJobTitle] = useState('Operations Coordinator');
  const [employeeEmploymentType, setEmployeeEmploymentType] = useState<'full_time' | 'part_time' | 'contractor'>('full_time');
  const [employeeStatus, setEmployeeStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [employeeStartDate, setEmployeeStartDate] = useState('2026-04-15');
  const [employeeNotes, setEmployeeNotes] = useState('Alta inicial para preparar trabajo interno y agenda.');
  const [internalTaskTitle, setInternalTaskTitle] = useState('Preparar visita de seguimiento');
  const [internalTaskDescription, setInternalTaskDescription] = useState('Coordinar materiales y confirmacion interna antes de la reserva.');
  const [internalTaskSaleId, setInternalTaskSaleId] = useState('');
  const [internalTaskAssigneeEmployeeId, setInternalTaskAssigneeEmployeeId] = useState('');
  const [internalTaskStatus, setInternalTaskStatus] = useState<'todo' | 'in_progress' | 'blocked' | 'done'>('todo');
  const [internalTaskPriority, setInternalTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [internalTaskDueDate, setInternalTaskDueDate] = useState('2026-04-22');
  const [reservationTitle, setReservationTitle] = useState('Visita de coordinacion');
  const [reservationNotes, setReservationNotes] = useState('Agenda minima enlazada a employee y tarea interna.');
  const [reservationLocation, setReservationLocation] = useState('Sala Norte');
  const [reservationAssigneeEmployeeId, setReservationAssigneeEmployeeId] = useState('');
  const [reservationInternalTaskId, setReservationInternalTaskId] = useState('');
  const [reservationStatus, setReservationStatus] = useState<'booked' | 'confirmed' | 'completed' | 'cancelled'>('booked');
  const [reservationDate, setReservationDate] = useState('2026-04-23');
  const [reservationStartTime, setReservationStartTime] = useState('09:00');
  const [reservationEndTime, setReservationEndTime] = useState('10:00');
  const [visitedAccessRoles, setVisitedAccessRoles] = useState<AccessReviewRole[]>([]);

  const accessReviewTenantName = state.status === 'success' ? state.tenantName : '';
  const accessReviewTenantId = state.status === 'success' ? state.tenantId : '';

  useEffect(() => {
    if (typeof window === 'undefined' || !accessReviewTenantName) {
      return;
    }

    const storageKey = getAccessReviewStorageKey(accessReviewTenantName, accessReviewTenantId);

    if (visitedAccessRoles.length === 0) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(visitedAccessRoles));
  }, [accessReviewTenantId, accessReviewTenantName, visitedAccessRoles]);

  async function loadRoles(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/platform/roles`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los roles.');
    }

    return payload as Array<{
      id: string;
      code: string;
      name: string;
      permissions: string[];
    }>;
  }

  async function loadClients(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/clients/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los clientes.');
    }

    return payload as Array<{
      id: string;
      fullName: string;
      email: string | null;
      phone: string | null;
      segment: string;
      notes: string | null;
    }>;
  }

  async function loadCatalogItems(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/catalog/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudo cargar el catalogo.');
    }

    return payload as Array<{
      id: string;
      name: string;
      kind: 'product' | 'service';
      priceCents: number;
      durationMin: number | null;
      status: 'active' | 'archived';
      sku: string | null;
      notes: string | null;
    }>;
  }

  async function loadSales(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/sales/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar las ventas.');
    }

    return payload as Array<{
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
    }>;
  }

  async function loadInvoices(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/invoices/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar las facturas.');
    }

    return payload as Array<{
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
    }>;
  }

  async function loadPayments(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/payments/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los cobros.');
    }

    return payload as Array<{
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
    }>;
  }

  async function loadEmployees(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/employees/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los empleados.');
    }

    return payload as Array<{
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
    }>;
  }

  async function loadInternalTasks(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/internal-tasks/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar las tareas internas.');
    }

    return payload as Array<{
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
    }>;
  }

  async function loadReservations(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/reservations/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar las reservas.');
    }

    return payload as Array<{
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
    }>;
  }

  const helperText = useMemo(() => {
    const selectedDemoProfile = demoAccessProfiles.find((profile) => profile.email === email.trim().toLowerCase());

    if (state.status === 'error') return state.message;
    if (state.status === 'success') return `Sesion activa para ${state.actor}`;
    if (selectedDemoProfile) return `${selectedDemoProfile.title}: ${selectedDemoProfile.summary}`;

    return 'Cuando la API tenga PostgreSQL y seed ejecutado, este panel entrara con auth persistida.';
  }, [demoAccessProfiles, email, state]);

  const canManageUsers = state.status === 'success' && hasAnyPermission(state.permissions, ['users.manage']);
  const canManageRoles = state.status === 'success' && hasAnyPermission(state.permissions, ['roles.manage']);
  const canManageSettings = state.status === 'success' && hasAnyPermission(state.permissions, ['settings.manage']);
  const canReadCommercial = state.status === 'success' && hasAnyPermission(state.permissions, ['sales.view', 'sales.manage']);
  const canManageCommercial = state.status === 'success' && hasAnyPermission(state.permissions, ['sales.manage']);
  const canReadBilling = state.status === 'success' && hasAnyPermission(state.permissions, ['billing.view', 'billing.manage']);
  const canManageBilling = state.status === 'success' && hasAnyPermission(state.permissions, ['billing.manage']);
  const canReadPayments = state.status === 'success' && hasAnyPermission(state.permissions, ['payments.view', 'payments.manage']);
  const canManagePayments = state.status === 'success' && hasAnyPermission(state.permissions, ['payments.manage']);
  const canReadEmployees = state.status === 'success' && hasAnyPermission(state.permissions, ['employees.view', 'employees.manage']);
  const canManageEmployees = state.status === 'success' && hasAnyPermission(state.permissions, ['employees.manage']);
  const canReadInternalTasks = state.status === 'success' && hasAnyPermission(state.permissions, ['tasks.view', 'tasks.manage']);
  const canManageInternalTasks = state.status === 'success' && hasAnyPermission(state.permissions, ['tasks.manage']);
  const canReadReservations = state.status === 'success' && hasAnyPermission(state.permissions, ['reservations.view', 'reservations.manage']);
  const canManageReservations = state.status === 'success' && hasAnyPermission(state.permissions, ['reservations.manage']);
  const canReadAnalytics = state.status === 'success' && hasAnyPermission(state.permissions, ['analytics.view']);
  const canReadReports = state.status === 'success' && hasAnyPermission(state.permissions, ['reports.view']);
  const canReadNotifications = state.status === 'success' && hasAnyPermission(state.permissions, ['notifications.view', 'notifications.manage']);
  const canManageNotifications = state.status === 'success' && hasAnyPermission(state.permissions, ['notifications.manage']);
  const canReadAuditLogs = state.status === 'success' && hasAnyPermission(state.permissions, ['audit.view', 'audit.manage']);

  useEffect(() => {
    if (!canManageRoles && (newUserRole === 'admin' || newUserRole === 'manager')) {
      setNewUserRole('viewer');
    }
  }, [canManageRoles, newUserRole]);

  const invoiceableSales = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    const invoicedSaleIds = new Set(state.invoices.map((invoice) => invoice.saleId));

    return state.sales.filter((sale) => !invoicedSaleIds.has(sale.id) && sale.stage === 'won');
  }, [state]);

  const wonSales = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return state.sales.filter((sale) => sale.stage === 'won');
  }, [state]);

  const internalTaskAssigneeOptions = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getInternalTaskAssigneeOptions(state.employees);
  }, [state]);

  const reservationAssigneeOptions = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getReservationAssigneeOptions(state.employees);
  }, [state]);

  const reservationTaskOptions = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getReservationTaskOptions(state.internalTasks, reservationAssigneeEmployeeId, reservationInternalTaskId);
  }, [reservationAssigneeEmployeeId, reservationInternalTaskId, state]);

  const reservableInternalTasks = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getReservationTaskOptions(state.internalTasks, '', '');
  }, [state]);

  const payableInvoices = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return state.invoices.filter((invoice) => invoice.status === 'issued' && invoice.balanceCents > 0);
  }, [state]);

  const selectedPaymentInvoice = useMemo(() => payableInvoices.find((invoice) => invoice.id === paymentInvoiceId), [payableInvoices, paymentInvoiceId]);

  const paymentFormState = useMemo(() => getPaymentFormState(selectedPaymentInvoice, paymentAmountCents), [selectedPaymentInvoice, paymentAmountCents]);

  const selectedReservationAssignee = useMemo(() => {
    if (state.status !== 'success') {
      return undefined;
    }

    return state.employees.find((employee) => employee.id === reservationAssigneeEmployeeId);
  }, [reservationAssigneeEmployeeId, state]);

  const selectedReservationTask = useMemo(() => {
    if (state.status !== 'success') {
      return undefined;
    }

    return state.internalTasks.find((task) => task.id === reservationInternalTaskId);
  }, [reservationInternalTaskId, state]);

  const reservationScheduleState = useMemo(() => getReservationScheduleState({
    reservationDate,
    reservationStartTime,
    reservationEndTime,
    assigneeEmployeeName: selectedReservationAssignee?.fullName,
    linkedTaskCode: selectedReservationTask?.taskCode
  }), [reservationDate, reservationEndTime, reservationStartTime, selectedReservationAssignee?.fullName, selectedReservationTask?.taskCode]);

  const releaseChecklist = useMemo(() => {
    if (state.status !== 'success') {
      return null;
    }

    return getReleaseOperableV1Checklist(state);
  }, [state]);

  const releaseActionPlan = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getReleaseOperableV1ActionPlan(state);
  }, [state]);

  const releaseReviewCards = useMemo(() => {
    if (state.status !== 'success' || !releaseChecklist) {
      return [];
    }

    return getReleaseOperableV1ReviewCards({
      checklist: releaseChecklist,
      actionPlan: releaseActionPlan,
      paymentFormState,
      reservationScheduleState,
      reports: state.reports,
      notifications: state.notifications,
      auditLogs: state.auditLogs
    });
  }, [paymentFormState, releaseActionPlan, releaseChecklist, reservationScheduleState, state]);

  const accessReviewSummary = useMemo(() => {
    if (state.status !== 'success') {
      return null;
    }

    return getAccessReviewSummary({
      actorRole: state.actorRole,
      actorEmail: state.actorEmail,
      permissions: state.permissions
    });
  }, [state]);

  const accessValidationChecks = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getAccessValidationChecks({
      actorRole: state.actorRole,
      actorEmail: state.actorEmail,
      permissions: state.permissions
    });
  }, [state]);

  const accessReviewTimeline = useMemo(() => {
    if (state.status !== 'success') {
      return null;
    }

    return getAccessReviewTimeline({
      visitedRoles: visitedAccessRoles,
      actorRole: state.actorRole,
      actorEmail: state.actorEmail
    });
  }, [state, visitedAccessRoles]);

  const permissionGroups = useMemo(() => {
    if (state.status !== 'success') {
      return [];
    }

    return getPermissionGroupSummary(state.permissions);
  }, [state]);

  useEffect(() => {
    if (state.status !== 'success') {
      return;
    }

    const nextFallbackAssignee = reservationAssigneeOptions.some((employee) => employee.id === reservationAssigneeEmployeeId)
      ? reservationAssigneeEmployeeId
      : (reservationAssigneeOptions[0]?.id ?? '');
    const nextSelection = reservationInternalTaskId && reservationTaskOptions.some((task) => task.id === reservationInternalTaskId)
      ? getReservationSelectionForTask(state.internalTasks, reservationInternalTaskId, nextFallbackAssignee)
      : { assigneeEmployeeId: nextFallbackAssignee, taskId: '' };

    if (nextSelection.assigneeEmployeeId !== reservationAssigneeEmployeeId) {
      setReservationAssigneeEmployeeId(nextSelection.assigneeEmployeeId);
    }

    if (nextSelection.taskId !== reservationInternalTaskId) {
      setReservationInternalTaskId(nextSelection.taskId);
    }
  }, [reservationAssigneeEmployeeId, reservationAssigneeOptions, reservationInternalTaskId, reservationTaskOptions, state]);

  function syncPaymentSelection(invoices: Array<{ id: string; status: 'draft' | 'issued' | 'paid' | 'void'; balanceCents: number }>, preferredInvoiceId?: string) {
    const selectedInvoice = invoices.find((invoice) => invoice.id === preferredInvoiceId && invoice.status === 'issued' && invoice.balanceCents > 0)
      ?? invoices.find((invoice) => invoice.status === 'issued' && invoice.balanceCents > 0);

    setPaymentInvoiceId(selectedInvoice?.id ?? '');
    setPaymentAmountCents(selectedInvoice?.balanceCents ?? 0);
  }

  function handleReservationAssigneeChange(nextAssigneeEmployeeId: string) {
    if (state.status !== 'success') {
      setReservationAssigneeEmployeeId(nextAssigneeEmployeeId);
      return;
    }

    const nextSelection = getReservationSelectionForAssignee(
      state.internalTasks,
      nextAssigneeEmployeeId,
      reservationInternalTaskId
    );

    setReservationAssigneeEmployeeId(nextSelection.assigneeEmployeeId);
    setReservationInternalTaskId(nextSelection.taskId);
  }

  function handleReservationInternalTaskChange(nextTaskId: string) {
    if (state.status !== 'success') {
      setReservationInternalTaskId(nextTaskId);
      return;
    }

    const nextSelection = getReservationSelectionForTask(state.internalTasks, nextTaskId, reservationAssigneeEmployeeId);

    setReservationAssigneeEmployeeId(nextSelection.assigneeEmployeeId);
    setReservationInternalTaskId(nextSelection.taskId);
  }

  function hasAnyPermission(permissions: string[], expected: string[]) {
    return expected.some((permission) => permissions.includes(permission));
  }

  function handleUseDemoProfile(nextEmail: string) {
    setEmail(nextEmail);
    setPassword('erptry1234');
    setState({ status: 'idle' });
  }

  function formatCurrency(valueCents: number) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(valueCents / 100);
  }

  function formatCurrencyInput(valueCents: number) {
    return (valueCents / 100).toFixed(2);
  }

  function parseCurrencyInput(value: string) {
    const parsedValue = Number.parseFloat(value);

    if (Number.isNaN(parsedValue)) {
      return 0;
    }

    return Math.round(parsedValue * 100);
  }

  function formatPercent(value: number) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString('es-ES');
  }

  function formatDateTime(value: string) {
    return new Date(value).toLocaleString('es-ES');
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  async function loadUsers(token: string) {
    const usersResponse = await fetch(`${apiBaseUrl}/api/platform/users`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const usersPayload = await usersResponse.json();

    if (!usersResponse.ok) {
      throw new Error(usersPayload.message ?? 'No se pudieron cargar los usuarios.');
    }

    return usersPayload as Array<{
      id: string;
      fullName: string;
      email: string;
      status: string;
      roles: string[];
    }>;
  }

  async function loadSettings(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/platform/settings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los ajustes.');
    }

    return payload as {
      brandingName: string;
      defaultLocale: string;
      timezone: string;
    };
  }

  async function loadAnalytics(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/analytics/overview`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudo cargar la analitica.');
    }

    return payload as AnalyticsSnapshot;
  }

  async function loadReports(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/reports/exports`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los reportes.');
    }

    return payload as ReportsBundle;
  }

  async function loadNotifications(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/notifications/inbox`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar los avisos internos.');
    }

    return payload as NotificationsInbox;
  }

  async function loadAuditLogs(token: string) {
    const response = await fetch(`${apiBaseUrl}/api/audit-logs/list`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? 'No se pudieron cargar las trazas de auditoria.');
    }

    return payload as AuditLogsFeed;
  }

  function downloadReport(report: ReportsBundle['exports'][number]) {
    const blob = new Blob([report.csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = report.fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleMarkNotificationRead(notificationId: string) {
    if (state.status !== 'success' || !canManageNotifications) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/notifications/read`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          notification: {
            notificationId
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        return;
      }

      if (!state.notifications) {
        return;
      }

      const items = state.notifications.items.map((notification) => (
        notification.id === notificationId ? payload as NotificationsInbox['items'][number] : notification
      ));
      const auditLogs = canReadAuditLogs ? await loadAuditLogs(state.token) : state.auditLogs;

      setState({
        ...state,
        notifications: {
          ...state.notifications,
          unreadCount: items.filter((notification) => notification.readAt === null).length,
          items
        },
        auditLogs
      });
    } catch {
      return;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: 'loading' });

    try {
      const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const loginPayload = await loginResponse.json();

      if (!loginResponse.ok) {
        setState({ status: 'error', message: loginPayload.message ?? 'No se pudo iniciar sesion.' });
        return;
      }

      const meResponse = await fetch(`${apiBaseUrl}/api/auth/me`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ token: loginPayload.token })
      });

      const mePayload = await meResponse.json();

      if (!meResponse.ok) {
        setState({ status: 'error', message: mePayload.message ?? 'No se pudo resolver la sesion.' });
        return;
      }

      const tenantResponse = await fetch(`${apiBaseUrl}/api/platform/tenant/current`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ token: loginPayload.token })
      });

      const tenantPayload = await tenantResponse.json();

      if (!tenantResponse.ok) {
        setState({ status: 'error', message: tenantPayload.message ?? 'No se pudo consultar el tenant.' });
        return;
      }

      const permissions = mePayload.permissions as string[];
      const canManageUsers = hasAnyPermission(permissions, ['users.manage']);
      const canManageRoles = hasAnyPermission(permissions, ['roles.manage']);
      const canManageSettings = hasAnyPermission(permissions, ['settings.manage']);
      const canReadCommercial = hasAnyPermission(permissions, ['sales.view', 'sales.manage']);
      const canReadBilling = hasAnyPermission(permissions, ['billing.view', 'billing.manage']);
      const canReadPayments = hasAnyPermission(permissions, ['payments.view', 'payments.manage']);
      const canReadEmployees = hasAnyPermission(permissions, ['employees.view', 'employees.manage']);
      const canReadInternalTasks = hasAnyPermission(permissions, ['tasks.view', 'tasks.manage']);
      const canReadReservations = hasAnyPermission(permissions, ['reservations.view', 'reservations.manage']);
      const canReadAnalytics = hasAnyPermission(permissions, ['analytics.view']);
      const canReadReports = hasAnyPermission(permissions, ['reports.view']);
      const canReadNotifications = hasAnyPermission(permissions, ['notifications.view', 'notifications.manage']);
      const canReadAuditLogs = hasAnyPermission(permissions, ['audit.view', 'audit.manage']);

      const [users, settings, rolesCatalog, clients, catalogItems, sales, invoices, payments, employees, internalTasks, reservations, analytics, reports, notifications, auditLogs] = await Promise.all([
        canManageUsers ? loadUsers(loginPayload.token) : Promise.resolve([]),
        canManageSettings
          ? loadSettings(loginPayload.token)
          : Promise.resolve({
              brandingName: tenantPayload.tenant.name,
              defaultLocale,
              timezone
            }),
        canManageRoles ? loadRoles(loginPayload.token) : Promise.resolve([]),
        canReadCommercial ? loadClients(loginPayload.token) : Promise.resolve([]),
        canReadCommercial ? loadCatalogItems(loginPayload.token) : Promise.resolve([]),
        canReadCommercial ? loadSales(loginPayload.token) : Promise.resolve([]),
        canReadBilling ? loadInvoices(loginPayload.token) : Promise.resolve([]),
        canReadPayments ? loadPayments(loginPayload.token) : Promise.resolve([]),
        canReadEmployees ? loadEmployees(loginPayload.token) : Promise.resolve([]),
        canReadInternalTasks ? loadInternalTasks(loginPayload.token) : Promise.resolve([]),
        canReadReservations ? loadReservations(loginPayload.token) : Promise.resolve([]),
        canReadAnalytics ? loadAnalytics(loginPayload.token) : Promise.resolve(null),
        canReadReports ? loadReports(loginPayload.token) : Promise.resolve(null),
        canReadNotifications ? loadNotifications(loginPayload.token) : Promise.resolve(null),
        canReadAuditLogs ? loadAuditLogs(loginPayload.token) : Promise.resolve(null)
      ]);

      setBrandingName(settings.brandingName);
      setDefaultLocale(settings.defaultLocale);
      setTimezone(settings.timezone);
      setSaleClientId((current) => current || clients[0]?.id || '');
      setSaleLines((current) => {
        const firstItemId = catalogItems[0]?.id || '';

        if (current.length === 0) {
          return firstItemId ? [{ catalogItemId: firstItemId, quantity: 1 }] : [{ catalogItemId: '', quantity: 1 }];
        }

        return current.map((line, index) => ({
          ...line,
          catalogItemId: line.catalogItemId || (index === 0 ? firstItemId : line.catalogItemId)
        }));
      });
      setInvoiceSaleId((current) => {
        const invoicedSaleIds = new Set(invoices.map((invoice) => invoice.saleId));

        return current || sales.find((sale) => !invoicedSaleIds.has(sale.id) && sale.stage === 'won')?.id || '';
      });
      setEmployeeLinkedUserId((current) => current || users[0]?.id || '');
      setInternalTaskSaleId((current) => current || sales.find((sale) => sale.stage === 'won')?.id || '');
      setInternalTaskAssigneeEmployeeId((current) => current || getInternalTaskAssigneeOptions(employees)[0]?.id || '');
      setReservationAssigneeEmployeeId((current) => current || getReservationSelectionForTask(
        internalTasks,
        getReservationTaskOptions(internalTasks, '', '')[0]?.id ?? '',
        getReservationAssigneeOptions(employees)[0]?.id || ''
      ).assigneeEmployeeId);
      setReservationInternalTaskId((current) => current || getReservationSelectionForTask(
        internalTasks,
        getReservationTaskOptions(internalTasks, '', '')[0]?.id ?? '',
        getReservationAssigneeOptions(employees)[0]?.id || ''
      ).taskId);
      syncPaymentSelection(invoices, paymentInvoiceId);

      setState({
        status: 'success',
        actor: mePayload.actor.fullName,
        actorEmail: mePayload.actor.email,
        actorRole: mePayload.actor.role,
        permissions,
        tenantId: tenantPayload.tenant.id,
        tenantName: tenantPayload.tenant.name,
        totalUsers: tenantPayload.totalUsers,
        activeSessions: tenantPayload.activeSessions,
        token: loginPayload.token,
        settings,
        rolesCatalog,
        users,
        clients,
        catalogItems,
        sales,
        invoices,
        payments,
        employees,
        internalTasks,
        reservations,
        analytics,
        reports,
        notifications,
        auditLogs
      });

      const accessReviewStorageKey = getAccessReviewStorageKey(tenantPayload.tenant.name, tenantPayload.tenant.id);
      let persistedVisitedRoles: AccessReviewRole[] = [];

      if (typeof window !== 'undefined') {
        try {
          const persistedValue = window.localStorage.getItem(accessReviewStorageKey);

          if (persistedValue) {
            const parsedValue = JSON.parse(persistedValue);

            if (Array.isArray(parsedValue)) {
              persistedVisitedRoles = sanitizeAccessReviewRoles(parsedValue.filter((value): value is string => typeof value === 'string'));
            }
          }
        } catch {
          persistedVisitedRoles = [];
        }
      }

      const actorEmail = String(mePayload.actor.email ?? '').trim().toLowerCase();
      const reviewRole = mePayload.actor.role === 'owner' || mePayload.actor.role === 'manager' || mePayload.actor.role === 'viewer'
        ? mePayload.actor.role
        : actorEmail === 'owner@erptry.local'
          ? 'owner'
          : actorEmail === 'manager@erptry.local'
            ? 'manager'
            : actorEmail === 'viewer@erptry.local'
              ? 'viewer'
              : null;

      setVisitedAccessRoles(getNextVisitedAccessRoles(persistedVisitedRoles, reviewRole ?? undefined));
    } catch {
      setState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/platform/users/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          user: {
            fullName: newUserName,
            email: newUserEmail,
            password: newUserPassword,
            roleCode: newUserRole
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear el usuario.' });
        return;
      }

      const [users, auditLogs] = await Promise.all([
        loadUsers(state.token),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        totalUsers: users.length,
        users,
        auditLogs
      });
      setCreateUserState({ status: 'success', message: 'Usuario creado y listado actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/clients/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          client: {
            fullName: clientName,
            email: clientEmail,
            phone: clientPhone,
            segment: clientSegment,
            notes: clientNotes
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear el cliente.' });
        return;
      }

      const [clients, auditLogs] = await Promise.all([
        loadClients(state.token),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        clients,
        auditLogs
      });
      setSaleClientId((current) => current || clients[0]?.id || '');
      setCreateUserState({ status: 'success', message: 'Cliente creado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateCatalogItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/catalog/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          item: {
            name: itemName,
            kind: itemKind,
            priceCents: itemPriceCents,
            durationMin: itemKind === 'service' ? itemDurationMin : null,
            sku: itemSku,
            notes: itemNotes
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear el item.' });
        return;
      }

      const [catalogItems, auditLogs] = await Promise.all([
        loadCatalogItems(state.token),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        catalogItems,
        auditLogs
      });
      setSaleLines((current) => {
        const firstItemId = catalogItems[0]?.id || '';

        return current.map((line, index) => ({
          ...line,
          catalogItemId: line.catalogItemId || (index === 0 ? firstItemId : line.catalogItemId)
        }));
      });
      setCreateUserState({ status: 'success', message: 'Item de catalogo creado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleUpdateSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setSaveSettingsState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/platform/settings/update`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          settings: {
            brandingName,
            defaultLocale,
            timezone
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setSaveSettingsState({ status: 'error', message: payload.message ?? 'No se pudieron actualizar los ajustes.' });
        return;
      }

      const auditLogs = canReadAuditLogs ? await loadAuditLogs(state.token) : state.auditLogs;

      setState({
        ...state,
        settings: payload,
        tenantName: payload.brandingName,
        auditLogs
      });
      setSaveSettingsState({ status: 'success', message: 'Ajustes actualizados.' });
    } catch {
      setSaveSettingsState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleChangeUserRole(userId: string, roleCode: string) {
    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/platform/users/role`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          update: {
            userId,
            roleCode
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo actualizar el rol.' });
        return;
      }

      const [users, auditLogs] = await Promise.all([
        loadUsers(state.token),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        users,
        auditLogs
      });
      setCreateUserState({ status: 'success', message: 'Rol actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  function updateSaleLine(index: number, nextLine: { catalogItemId: string; quantity: number }) {
    setSaleLines((current) => current.map((line, lineIndex) => (lineIndex === index ? nextLine : line)));
  }

  function addSaleLine() {
    setSaleLines((current) => [...current, { catalogItemId: state.status === 'success' ? (state.catalogItems[0]?.id ?? '') : '', quantity: 1 }]);
  }

  function removeSaleLine(index: number) {
    setSaleLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  }

  async function handleCreateSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/sales/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          sale: {
            title: saleTitle,
            clientId: saleClientId,
            stage: saleStage,
            notes: saleNotes,
            lines: saleLines.filter((line) => line.catalogItemId)
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear la venta.' });
        return;
      }

      const [sales, invoices, auditLogs] = await Promise.all([
        loadSales(state.token),
        loadInvoices(state.token),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        sales,
        invoices,
        auditLogs
      });
      setInvoiceSaleId((current) => current || sales.find((sale) => !invoices.some((invoice) => invoice.saleId === sale.id) && sale.stage === 'won')?.id || '');
      setInternalTaskSaleId((current) => current || sales.find((sale) => sale.stage === 'won')?.id || '');
      setCreateUserState({ status: 'success', message: 'Venta creada y circuito comercial actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateInvoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/invoices/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          invoice: {
            saleId: invoiceSaleId,
            status: 'issued',
            dueDate: invoiceDueDate,
            notes: invoiceNotes
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo emitir la factura.' });
        return;
      }

      const [invoices, payments, notifications, auditLogs] = await Promise.all([
        loadInvoices(state.token),
        loadPayments(state.token),
        canReadNotifications ? loadNotifications(state.token) : Promise.resolve(state.notifications),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);
      const nextInvoiceSaleId = invoiceableSales.find((sale) => sale.id !== invoiceSaleId)?.id ?? '';

      setState({
        ...state,
        invoices,
        payments,
        notifications,
        auditLogs
      });
      setInvoiceSaleId(nextInvoiceSaleId);
      syncPaymentSelection(invoices, payload.id);
      setCreateUserState({ status: 'success', message: 'Factura emitida y circuito cobrable actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreatePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/payments/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          payment: {
            invoiceId: paymentInvoiceId,
            status: paymentStatus,
            method: paymentMethod,
            amountCents: paymentAmountCents,
            receivedAt: new Date(`${paymentReceivedAt}T12:00:00.000Z`).toISOString(),
            notes: paymentNotes
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo registrar el cobro.' });
        return;
      }

      const [invoices, payments, notifications, auditLogs] = await Promise.all([
        loadInvoices(state.token),
        loadPayments(state.token),
        canReadNotifications ? loadNotifications(state.token) : Promise.resolve(state.notifications),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        invoices,
        payments,
        notifications,
        auditLogs
      });
      syncPaymentSelection(invoices, paymentInvoiceId);
      setCreateUserState({ status: 'success', message: 'Cobro registrado y estado financiero actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/employees/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          employee: {
            linkedUserId: employeeLinkedUserId,
            employeeCode,
            fullName: employeeFullName,
            workEmail: employeeWorkEmail,
            phone: employeePhone,
            department: employeeDepartment,
            jobTitle: employeeJobTitle,
            employmentType: employeeEmploymentType,
            status: employeeStatus,
            startDate: employeeStartDate,
            notes: employeeNotes
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear el empleado.' });
        return;
      }

      const [employees, notifications, auditLogs] = await Promise.all([
        loadEmployees(state.token),
        canReadNotifications ? loadNotifications(state.token) : Promise.resolve(state.notifications),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        employees,
        notifications,
        auditLogs
      });
       setInternalTaskAssigneeEmployeeId((current) => current || getInternalTaskAssigneeOptions(employees)[0]?.id || '');
       setReservationAssigneeEmployeeId((current) => current || getReservationAssigneeOptions(employees)[0]?.id || '');
       setCreateUserState({ status: 'success', message: 'Empleado creado y base interna actualizada.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateInternalTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/internal-tasks/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          task: {
            title: internalTaskTitle,
            description: internalTaskDescription,
            saleId: internalTaskSaleId,
            assigneeEmployeeId: internalTaskAssigneeEmployeeId,
            status: internalTaskStatus,
            priority: internalTaskPriority,
            dueDate: internalTaskDueDate
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear la tarea interna.' });
        return;
      }

      const [internalTasks, notifications, auditLogs] = await Promise.all([
        loadInternalTasks(state.token),
        canReadNotifications ? loadNotifications(state.token) : Promise.resolve(state.notifications),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        internalTasks,
        notifications,
        auditLogs
      });
      setInternalTaskSaleId((current) => current || wonSales[0]?.id || '');
      setReservationAssigneeEmployeeId((current) => current || getReservationSelectionForTask(
        internalTasks,
        getReservationTaskOptions(internalTasks, '', '')[0]?.id ?? '',
        getReservationAssigneeOptions(state.employees)[0]?.id || ''
      ).assigneeEmployeeId);
      setReservationInternalTaskId((current) => current || getReservationSelectionForTask(
        internalTasks,
        getReservationTaskOptions(internalTasks, '', '')[0]?.id ?? '',
        getReservationAssigneeOptions(state.employees)[0]?.id || ''
      ).taskId);
      setCreateUserState({ status: 'success', message: 'Tarea interna creada y circuito operativo actualizado.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleCreateReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (state.status !== 'success') {
      return;
    }

    setCreateUserState({ status: 'loading' });

    try {
      const response = await fetch(`${apiBaseUrl}/api/reservations/create`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          token: state.token,
          reservation: {
            title: reservationTitle,
            notes: reservationNotes,
            location: reservationLocation,
            assigneeEmployeeId: reservationAssigneeEmployeeId,
            internalTaskId: reservationInternalTaskId,
            status: reservationStatus,
            startAt: new Date(`${reservationDate}T${reservationStartTime}:00.000Z`).toISOString(),
            endAt: new Date(`${reservationDate}T${reservationEndTime}:00.000Z`).toISOString()
          }
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setCreateUserState({ status: 'error', message: payload.message ?? 'No se pudo crear la reserva.' });
        return;
      }

      const [reservations, notifications, auditLogs] = await Promise.all([
        loadReservations(state.token),
        canReadNotifications ? loadNotifications(state.token) : Promise.resolve(state.notifications),
        canReadAuditLogs ? loadAuditLogs(state.token) : Promise.resolve(state.auditLogs)
      ]);

      setState({
        ...state,
        reservations,
        notifications,
        auditLogs
      });
      setCreateUserState({ status: 'success', message: 'Reserva creada y agenda actualizada.' });
    } catch {
      setCreateUserState({ status: 'error', message: 'La API no esta disponible ahora mismo.' });
    }
  }

  async function handleLogout() {
    if (state.status !== 'success') {
      return;
    }

    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ token: state.token })
    });

    setState({ status: 'idle' });
    setCreateUserState({ status: 'idle' });
    setSaveSettingsState({ status: 'idle' });
  }

  return (
    <section className="login-panel">
      <div>
        <p className="eyebrow">Acceso persistido</p>
        <h2>Primer circuito real de autenticacion</h2>
        <p className="login-copy">La API ya expone login persistido preparado para PostgreSQL, roles y permisos.</p>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
        </label>
        <label>
          <span>Contrasena</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
        </label>
        <button type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Conectando...' : 'Probar acceso'}
        </button>
      </form>
      <section className="users-section users-section--compact">
        <div className="users-section__header">
          <h3>Perfiles demo listos para repaso</h3>
          <p>Carga una cuenta de seed y repite el recorrido visual en orden owner, manager y viewer para validar permisos y restricciones sin ambiguedades.</p>
        </div>
        <div className="users-grid users-grid--quad">
          {demoAccessProfiles.map((profile) => {
            const isSelected = profile.email === email.trim().toLowerCase();

            return (
              <article key={profile.id} className={`user-card demo-profile-card${isSelected ? ' demo-profile-card--active' : ''}`}>
                <div className="permission-list review-card__meta">
                  <span className="module-pill module-pill--accent">{profile.title}</span>
                  <span className="module-pill">{profile.email}</span>
                </div>
                <strong>{profile.summary}</strong>
                <div className="review-card__checks">
                  <span className="review-card__check">Puede revisar: {profile.canReview.join(' · ')}</span>
                  <span className="review-card__check">
                    {profile.shouldNotSee.length > 0 ? `No deberia ver: ${profile.shouldNotSee.join(' · ')}` : 'Sin restricciones esperadas en el repaso de este perfil.'}
                  </span>
                </div>
                <button className="secondary-action secondary-action--light" onClick={() => handleUseDemoProfile(profile.email)} type="button">
                  {isSelected ? 'Perfil cargado' : 'Usar este perfil'}
                </button>
              </article>
            );
          })}
        </div>
      </section>
      <div className="permission-list">
        <span className="module-pill module-pill--accent">owner@erptry.local</span>
        <span className="module-pill">manager@erptry.local</span>
        <span className="module-pill">operator@erptry.local</span>
        <span className="module-pill">viewer@erptry.local</span>
        <span className="module-pill">clave demo: erptry1234</span>
      </div>
      <p className={`login-status login-status--${state.status}`}>{helperText}</p>
      {state.status === 'success' ? (
        <>
          <div className="login-metrics" id="access-section">
            <span className="module-pill module-pill--accent">perfil: {getRoleLabel(state.actorRole)}</span>
            <span className="module-pill">tenant: {state.tenantName}</span>
            <span className="module-pill">usuarios: {state.totalUsers}</span>
            <span className="module-pill">sesiones activas: {state.activeSessions}</span>
            <button className="secondary-action" onClick={handleLogout} type="button">
              Cerrar sesion
            </button>
          </div>
          {accessReviewSummary ? (
            <section className="users-section users-section--compact" id="access-review-section">
              <div className="users-section__header">
                <h3>Mapa de acceso actual</h3>
                <p>Resumen rapido del perfil activo para validar que lo visible, lo editable y lo oculto cuadran con el rol cargado.</p>
              </div>
              <div className="users-grid analytics-panels">
                <article className="user-card flow-check-item flow-check-item--complete">
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{accessReviewSummary.profileTitle}</span>
                    <span className="module-pill">{accessReviewSummary.roleLabel}</span>
                  </div>
                  <strong>{state.actor}</strong>
                  <span>{state.actorEmail}</span>
                  <span>{accessReviewSummary.profileSummary}</span>
                </article>
                <article className="user-card">
                  <strong>Superficies visibles</strong>
                  <div className="permission-list">
                    {accessReviewSummary.visibleAreas.map((area) => (
                      <span key={area} className="module-pill module-pill--accent">{area}</span>
                    ))}
                  </div>
                </article>
                <article className="user-card">
                  <strong>Puede gestionar ahora</strong>
                  <div className="permission-list">
                    {(accessReviewSummary.manageAreas.length > 0 ? accessReviewSummary.manageAreas : ['Solo lectura']).map((area) => (
                      <span key={area} className="module-pill">{area}</span>
                    ))}
                  </div>
                </article>
                <article className="user-card">
                  <strong>Deberia quedar fuera</strong>
                  <div className="permission-list">
                    {(accessReviewSummary.hiddenAreas.length > 0 ? accessReviewSummary.hiddenAreas : ['Sin huecos ocultos esperados']).map((area) => (
                      <span key={area} className="module-pill">{area}</span>
                    ))}
                  </div>
                  <span>{accessReviewSummary.nextStep}</span>
                </article>
              </div>
            </section>
          ) : null}
          {accessValidationChecks.length > 0 ? (
            <section className="users-section users-section--compact" id="access-acl-checks-section">
              <div className="users-section__header">
                <h3>Control ACL del perfil activo</h3>
                <p>Checks rapidos para confirmar en cada login que el rol cargado respeta el alcance esperado antes de seguir el repaso visual.</p>
              </div>
              <div className="users-grid analytics-panels">
                {accessValidationChecks.map((check) => (
                  <article key={check.id} className={`user-card flow-check-item flow-check-item--${check.status === 'ok' ? 'complete' : 'attention'}`}>
                    <div className="permission-list">
                      <span className={`module-pill module-pill--accent flow-check-pill flow-check-pill--${check.status === 'ok' ? 'complete' : 'attention'}`}>
                        {check.status === 'ok' ? 'ok' : 'revisar'}
                      </span>
                    </div>
                    <strong>{check.label}</strong>
                    <span>{check.detail}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {accessReviewTimeline ? (
            <section className="users-section users-section--compact" id="access-review-progress-section">
              <div className="users-section__header">
                <h3>Progreso del repaso ACL</h3>
                <p>Registro visual del recorrido owner - manager - viewer para evitar saltos durante la validacion manual final.</p>
              </div>
              <div className="permission-list">
                <span className="module-pill module-pill--accent">
                  perfiles validados: {accessReviewTimeline.completedCount}/{accessReviewTimeline.totalCount}
                </span>
                <span className={`module-pill ${accessReviewTimeline.orderStatus === 'ok' ? 'module-pill--accent' : ''}`}>
                  orden: {accessReviewTimeline.orderStatus === 'ok' ? 'ok' : 'revisar'}
                </span>
                <span className="module-pill">bitacora tenant: {state.tenantName} · {state.tenantId.slice(0, 8)}</span>
                <button className="secondary-action secondary-action--light" onClick={() => setVisitedAccessRoles([])} type="button">
                  Reiniciar recorrido
                </button>
              </div>
              <p className={`login-status login-status--${accessReviewTimeline.orderStatus === 'ok' ? 'success' : 'error'}`}>
                {accessReviewTimeline.orderHint}
              </p>
              <p className="login-status login-status--idle">El avance se guarda por tenant en este navegador hasta que reinicies el recorrido.</p>
              <p className="login-status login-status--idle">{accessReviewTimeline.nextStepHint}</p>
              <div className="users-grid analytics-panels">
                {accessReviewTimeline.steps.map((step) => {
                  const requiresReset = step.needsReset;
                  const visualStatus = requiresReset
                    ? 'attention'
                    : step.status === 'pending'
                      ? 'pending'
                      : 'complete';
                  const pillLabel = requiresReset
                    ? 'revisar'
                    : step.status === 'done'
                      ? 'ok'
                      : step.status === 'current'
                        ? 'actual'
                        : 'pendiente';

                  return (
                    <article key={step.id} className={`user-card flow-check-item flow-check-item--${visualStatus}`}>
                      <div className="permission-list">
                        <span className={`module-pill module-pill--accent flow-check-pill flow-check-pill--${visualStatus}`}>
                          {pillLabel}
                        </span>
                      </div>
                      <strong>{step.title}</strong>
                      <span>{requiresReset ? `${step.detail} Repite este perfil despues de reiniciar el recorrido.` : step.detail}</span>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
          {canManageSettings ? (
            <>
              <form className="create-user-form" id="settings-section" onSubmit={handleUpdateSettings}>
                <label>
                  <span>Marca</span>
                  <input value={brandingName} onChange={(event) => setBrandingName(event.target.value)} type="text" />
                </label>
                <label>
                  <span>Idioma base</span>
                  <input value={defaultLocale} onChange={(event) => setDefaultLocale(event.target.value)} type="text" />
                </label>
                <label>
                  <span>Zona horaria</span>
                  <input value={timezone} onChange={(event) => setTimezone(event.target.value)} type="text" />
                </label>
                <button type="submit" disabled={saveSettingsState.status === 'loading'}>
                  Guardar ajustes
                </button>
              </form>
              <p className={`login-status login-status--${saveSettingsState.status}`}>
                {saveSettingsState.status === 'idle'
                  ? 'Puedes actualizar la configuracion base del tenant.'
                  : saveSettingsState.status === 'loading'
                    ? 'Guardando ajustes...'
                    : saveSettingsState.message}
              </p>
            </>
          ) : null}
          <section className="users-section users-section--compact" id="permissions-section">
            <div className="users-section__header">
              <h3>Permisos visibles</h3>
              <p>Lectura operativa del alcance actual para validar rapido que el perfil puede leer o gestionar exactamente lo esperado.</p>
            </div>
            <div className="permission-list">
              <span className="module-pill module-pill--accent">permisos: {state.permissions.length}</span>
              <span className="module-pill">gestion: {state.permissions.filter((permission) => permission.endsWith('.manage')).length}</span>
              <span className="module-pill">lectura: {state.permissions.filter((permission) => permission.endsWith('.view')).length}</span>
            </div>
            <div className="users-grid analytics-panels">
              {permissionGroups.map((group) => (
                <article key={group.id} className="user-card">
                  <strong>{group.title}</strong>
                  <div className="review-card__checks">
                    {group.items.map((item) => (
                      <span key={item.code} className="review-card__check">
                        {item.label} · {item.capability.toLowerCase()} · {item.code}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
          {releaseChecklist ? (
            <section className="users-section" id="release-checklist-section">
              <div className="users-section__header">
                <h3>Checklist operable v1</h3>
                <p>Lectura rapida del circuito cliente - servicio - venta - factura - cobro - operacion para validar si el tenant demo ya es demostrable.</p>
              </div>
              <div className="analytics-grid">
                <article className={`analytics-card flow-card flow-card--${releaseChecklist.status}`}>
                  <span className="analytics-card__label">Cobertura del flujo</span>
                  <strong>{releaseChecklist.completedCount}/{releaseChecklist.totalCount}</strong>
                  <span>{releaseChecklist.progressPercent}% del circuito minimo cubierto con datos reales del tenant.</span>
                </article>
                <article className="analytics-card flow-card">
                  <span className="analytics-card__label">Ventas ganadas</span>
                  <strong>{wonSales.length}</strong>
                  <span>{invoiceableSales.length} pendiente(s) de facturar para seguir validando el demo.</span>
                </article>
                <article className="analytics-card flow-card">
                  <span className="analytics-card__label">Facturas cobrables</span>
                  <strong>{payableInvoices.length}</strong>
                  <span>{state.payments.filter((payment) => payment.status === 'confirmed').length} cobro(s) confirmado(s) visibles.</span>
                </article>
              </div>
              <div className="action-plan-grid">
                {releaseActionPlan.map((action) => (
                  <article key={action.id} className="user-card action-plan-card">
                    <span className="analytics-card__label">Siguiente paso</span>
                    <strong>{action.title}</strong>
                    <span>{action.detail}</span>
                    <a className="secondary-action secondary-action--light section-jump" href={`#${action.targetSectionId}`}>
                      {action.targetLabel}
                    </a>
                  </article>
                ))}
              </div>
              <div className="users-grid analytics-panels">
                {releaseChecklist.items.map((item) => (
                  <article key={item.id} className={`user-card flow-check-item flow-check-item--${item.status}`}>
                    <div className="permission-list">
                      <span className={`module-pill module-pill--accent flow-check-pill flow-check-pill--${item.status}`}>
                        {item.status === 'complete' ? 'ok' : 'pendiente'}
                      </span>
                    </div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {releaseReviewCards.length > 0 ? (
            <section className="users-section" id="release-review-section">
              <div className="users-section__header">
                <h3>Repaso visual guiado</h3>
                <p>Atajos para la revision manual final del backoffice sin depender de contexto interno del repo.</p>
              </div>
              <div className="action-plan-grid">
                {releaseReviewCards.map((card) => (
                  <article key={card.id} className={`analytics-card flow-card flow-card--${card.status}`}>
                    <span className="analytics-card__label">Revision manual</span>
                    <div className="permission-list review-card__meta">
                      <span className="module-pill module-pill--accent">{card.module}</span>
                    </div>
                    <strong>{card.title}</strong>
                    <span>{card.detail}</span>
                    <a className="secondary-action secondary-action--light section-jump" href={`#${card.targetSectionId}`}>
                      {card.targetLabel}
                    </a>
                    {card.quickLinks && card.quickLinks.length > 0 ? (
                      <div className="permission-list review-card__meta">
                        {card.quickLinks.map((link) => (
                          <a
                            key={`${card.id}-${link.targetSectionId}`}
                            className="module-pill module-pill--accent section-jump"
                            href={`#${link.targetSectionId}`}
                          >
                            {link.targetLabel}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <div className="review-card__checks">
                      {card.checks.map((check) => (
                        <span key={check} className="review-card__check">
                          {check}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {canReadNotifications && state.notifications ? (
            <section className="users-section" id="notifications-section">
              <div className="users-section__header">
                <h3>Notificaciones internas</h3>
                <p>Avisos operativos para seguir el circuito financiero y de agenda sin tener que interpretar eventos tecnicos.</p>
              </div>
              <div className="permission-list">
                <span className="module-pill module-pill--accent">pendientes: {state.notifications.unreadCount}</span>
                <span className="module-pill">total: {state.notifications.totalCount}</span>
                <span className="module-pill">generado {formatDate(state.notifications.generatedAt)}</span>
              </div>
              <div className="users-grid analytics-panels">
                {state.notifications.items.length > 0 ? (
                  state.notifications.items.map((notification) => (
                    <article key={notification.id} className="user-card notification-card">
                      <div className="permission-list">
                        <span className={`module-pill module-pill--accent notification-pill notification-pill--${notification.severity}`}>{getNotificationSeverityLabel(notification.severity)}</span>
                        <span className="module-pill">{getNotificationTypeLabel(notification.type)}</span>
                        <span className="module-pill">{notification.readAt ? 'leida' : 'pendiente'}</span>
                      </div>
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                      <span>{formatDateTime(notification.createdAt)}</span>
                      {notification.resourceType ? <span>Afecta a: {getResourceTypeLabel(notification.resourceType)}</span> : null}
                      {canManageNotifications && notification.readAt === null ? (
                        <button className="secondary-action secondary-action--light" onClick={() => void handleMarkNotificationRead(notification.id)} type="button">
                          Marcar como leida
                        </button>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <article className="user-card">
                    <strong>Sin avisos</strong>
                    <span>El tenant aun no ha generado eventos internos relevantes.</span>
                  </article>
                )}
              </div>
            </section>
          ) : null}
          {canReadAuditLogs && state.auditLogs ? (
            <section className="users-section" id="audit-logs-section">
              <div className="users-section__header">
                <h3>Logs de auditoria</h3>
                <p>Registro de acciones sensibles para revisar quien hizo que y sobre que parte del tenant.</p>
              </div>
              <div className="permission-list">
                <span className="module-pill module-pill--accent">eventos: {state.auditLogs.totalCount}</span>
                <span className="module-pill">generado {formatDate(state.auditLogs.generatedAt)}</span>
              </div>
              <div className="users-grid analytics-panels">
                {state.auditLogs.items.length > 0 ? (
                  state.auditLogs.items.map((auditLog) => (
                    <article key={auditLog.id} className="user-card notification-card">
                      <div className="permission-list">
                        <span className={`module-pill module-pill--accent notification-pill notification-pill--${auditLog.severity}`}>{getNotificationSeverityLabel(auditLog.severity)}</span>
                        <span className="module-pill">{getNotificationTypeLabel(auditLog.type)}</span>
                        <span className="module-pill">{getAuditActionLabel(auditLog.action)}</span>
                      </div>
                      <strong>{auditLog.summary}</strong>
                      <span>Hecho por: {auditLog.actorName} · {auditLog.actorEmail}</span>
                      <span>{formatDateTime(auditLog.createdAt)}</span>
                      {auditLog.resourceType ? <span>Afecta a: {getResourceTypeLabel(auditLog.resourceType)}</span> : null}
                    </article>
                  ))
                ) : (
                  <article className="user-card">
                    <strong>Sin trazas</strong>
                    <span>Las acciones sensibles del backoffice apareceran aqui cuando el tenant registre actividad.</span>
                  </article>
                )}
              </div>
            </section>
          ) : null}
          {canReadAnalytics && state.analytics ? (
            <section className="users-section" id="analytics-section">
              <div className="users-section__header">
                <h3>Analytics comercial</h3>
                <p>Lectura rapida de pipeline, facturacion y cobro para saber si la operacion comercial esta sana.</p>
              </div>
              <div className="analytics-grid">
                <article className="analytics-card">
                  <span className="analytics-card__label">Pipeline abierto</span>
                  <strong>{formatCurrency(state.analytics.sales.pipelineCents)}</strong>
                  <span>{state.analytics.sales.openCount} ventas en draft o sent</span>
                </article>
                <article className="analytics-card">
                  <span className="analytics-card__label">Ingresos ganados</span>
                  <strong>{formatCurrency(state.analytics.sales.wonRevenueCents)}</strong>
                  <span>{state.analytics.sales.wonCount} ventas cerradas</span>
                </article>
                <article className="analytics-card">
                  <span className="analytics-card__label">Facturado</span>
                  <strong>{formatCurrency(state.analytics.billing.billedCents)}</strong>
                  <span>{state.analytics.billing.totalCount} facturas emitidas</span>
                </article>
                <article className="analytics-card">
                  <span className="analytics-card__label">Cobrado</span>
                  <strong>{formatCurrency(state.analytics.billing.collectedCents)}</strong>
                  <span>{formatPercent(state.analytics.billing.collectionRate)} de recuperacion</span>
                </article>
                <article className="analytics-card">
                  <span className="analytics-card__label">Saldo pendiente</span>
                  <strong>{formatCurrency(state.analytics.billing.outstandingCents)}</strong>
                  <span>{state.analytics.billing.overdueCount} facturas vencidas</span>
                </article>
                <article className="analytics-card">
                  <span className="analytics-card__label">Ultimo cobro</span>
                  <strong>{state.analytics.payments.lastReceivedAt ? new Date(state.analytics.payments.lastReceivedAt).toLocaleDateString('es-ES') : 'sin cobros'}</strong>
                  <span>{state.analytics.payments.confirmedCount} cobros confirmados</span>
                </article>
              </div>
              <div className="users-grid analytics-panels">
                <article className="user-card">
                  <strong>Embudo por etapa</strong>
                  {state.analytics.salesByStage.map((stage) => (
                    <div key={stage.stage} className="analytics-row">
                        <span>{getSaleStageLabel(stage.stage)}</span>
                      <span>{stage.count} ventas</span>
                      <span>{formatCurrency(stage.totalCents)}</span>
                    </div>
                  ))}
                </article>
                <article className="user-card">
                  <strong>Top clientes</strong>
                  {state.analytics.topClients.length > 0 ? (
                    state.analytics.topClients.map((client) => (
                      <div key={client.clientId} className="analytics-row analytics-row--stacked">
                        <span>{client.clientName}</span>
                        <span>ventas {client.salesCount} · {formatCurrency(client.salesCents)}</span>
                        <span>facturado {formatCurrency(client.invoicedCents)} · cobrado {formatCurrency(client.collectedCents)}</span>
                        <span>pendiente {formatCurrency(client.outstandingCents)}</span>
                      </div>
                    ))
                  ) : (
                    <span>Aun no hay clientes con actividad comercial.</span>
                  )}
                </article>
              </div>
            </section>
          ) : null}
          {canReadReports && state.reports ? (
            <section className="users-section" id="reports-section">
              <div className="users-section__header">
                <h3>Reportes exportables</h3>
                <p>Exportables listos para compartir estado comercial y financiero sin rehacer datos fuera del ERP.</p>
              </div>
              <div className="analytics-grid">
                {state.reports.exports.map((report) => (
                  <article key={report.type} className="analytics-card">
                    <span className="analytics-card__label">{report.title}</span>
                    <strong>{formatCurrency(report.totalAmountCents)}</strong>
                    <span>{report.totalRows} filas exportables</span>
                    <span>{report.summary}</span>
                    <button className="secondary-action" onClick={() => downloadReport(report)} type="button">
                      Descargar CSV
                    </button>
                  </article>
                ))}
              </div>
              <div className="users-grid analytics-panels">
                {state.reports.exports.map((report) => (
                  <article key={`${report.type}-preview`} className="user-card">
                    <strong>{report.fileName}</strong>
                    <span>{report.description}</span>
                    <div className="permission-list">
                      <span className="module-pill module-pill--accent">{report.columns.length} columnas</span>
                      <span className="module-pill">generado {formatDate(report.generatedAt)}</span>
                    </div>
                    {report.rows.slice(0, 3).map((row, index) => (
                      <div key={`${report.type}-${index}`} className="analytics-row analytics-row--stacked">
                        {report.columns.slice(0, 4).map((column) => (
                          <span key={column}>{column}: {row[column] || '-'}</span>
                        ))}
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          {canManageUsers ? (
            <section className="users-section" id="users-section">
            <div className="users-section__header">
              <h3>Usuarios del tenant</h3>
              <p>Primer CRUD operativo del nucleo de plataforma.</p>
            </div>
            <div className="users-grid">
              {state.users.map((user) => (
                <article key={user.id} className="user-card">
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                  <span>{user.status}</span>
                  {canManageRoles ? (
                    <label>
                      <span>Rol actual</span>
                      <select
                        value={user.roles[0] ?? 'viewer'}
                        onChange={(event) => void handleChangeUserRole(user.id, event.target.value)}
                      >
                        {state.rolesCatalog.map((role) => (
                          <option key={role.id} value={role.code}>
                            {getRoleLabel(role.code)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span>Rol actual: {getRoleLabel(user.roles[0] ?? 'viewer')}</span>
                  )}
                  <div className="permission-list">
                    {user.roles.map((role) => (
                      <span key={role} className="module-pill module-pill--accent">
                        {getRoleLabel(role)}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <form className="create-user-form" onSubmit={handleCreateUser}>
              <label>
                <span>Nombre</span>
                <input value={newUserName} onChange={(event) => setNewUserName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Email</span>
                <input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} type="email" />
              </label>
              <label>
                <span>Contrasena</span>
                <input value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} type="password" />
              </label>
              <label>
                <span>Rol</span>
                <select value={newUserRole} onChange={(event) => setNewUserRole(event.target.value as typeof newUserRole)}>
                  {canManageRoles ? (
                    <>
                      <option value="admin">{getRoleLabel('admin')}</option>
                      <option value="manager">{getRoleLabel('manager')}</option>
                      <option value="operator">{getRoleLabel('operator')}</option>
                      <option value="viewer">{getRoleLabel('viewer')}</option>
                    </>
                  ) : (
                    <>
                      <option value="operator">{getRoleLabel('operator')}</option>
                      <option value="viewer">{getRoleLabel('viewer')}</option>
                    </>
                  )}
                </select>
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                {createUserState.status === 'loading' ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
            <p className={`login-status login-status--${createUserState.status}`}>
              {createUserState.status === 'idle'
                ? canManageRoles
                  ? 'Puedes crear usuarios y reasignar roles del tenant desde este panel.'
                  : 'Puedes crear usuarios operativos (Operator y Viewer) sin escalar a roles de plataforma.'
                : createUserState.status === 'loading'
                  ? 'Aplicando cambios...'
                  : createUserState.message}
            </p>
          </section>
          ) : null}
          {canReadCommercial ? (
            <section className="users-section" id="clients-section">
            <div className="users-section__header">
              <h3>Clientes</h3>
              <p>Primer vertical de negocio conectado al nucleo persistido.</p>
            </div>
            <div className="users-grid">
              {state.clients.map((client) => (
                <article key={client.id} className="user-card">
                  <strong>{client.fullName}</strong>
                  <span>{client.email ?? 'sin email'}</span>
                  <span>{client.phone ?? 'sin telefono'}</span>
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{client.segment}</span>
                  </div>
                  {client.notes ? <span>{client.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManageCommercial ? <form className="create-user-form" onSubmit={handleCreateClient}>
              <label>
                <span>Nombre</span>
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Email</span>
                <input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} type="email" />
              </label>
              <label>
                <span>Telefono</span>
                <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} type="text" />
              </label>
              <label>
                <span>Segmento</span>
                <input value={clientSegment} onChange={(event) => setClientSegment(event.target.value)} type="text" />
              </label>
              <label>
                <span>Notas</span>
                <input value={clientNotes} onChange={(event) => setClientNotes(event.target.value)} type="text" />
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                Crear cliente
              </button>
            </form> : null}
          </section>
          ) : null}
          {canReadCommercial ? (
            <section className="users-section" id="catalog-section">
            <div className="users-section__header">
              <h3>Productos y servicios</h3>
              <p>Segundo vertical comercial para preparar ventas y presupuestos.</p>
            </div>
            <div className="users-grid">
              {state.catalogItems.map((item) => (
                <article key={item.id} className="user-card">
                  <strong>{item.name}</strong>
                  <span>{getCatalogKindLabel(item.kind)}</span>
                  <span>{formatCurrency(item.priceCents)}</span>
                  {item.durationMin ? <span>{item.durationMin} min</span> : null}
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getCatalogStatusLabel(item.status)}</span>
                    {item.sku ? <span className="module-pill">{item.sku}</span> : null}
                  </div>
                  {item.notes ? <span>{item.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManageCommercial ? <form className="create-user-form" onSubmit={handleCreateCatalogItem}>
              <label>
                <span>Nombre</span>
                <input value={itemName} onChange={(event) => setItemName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Tipo</span>
                <select value={itemKind} onChange={(event) => setItemKind(event.target.value as 'product' | 'service')}>
                  <option value="service">Servicio</option>
                  <option value="product">Producto</option>
                </select>
              </label>
              <label>
                <span>Precio (EUR)</span>
                <input value={formatCurrencyInput(itemPriceCents)} min="0" step="0.01" onChange={(event) => setItemPriceCents(parseCurrencyInput(event.target.value))} type="number" />
              </label>
              <label>
                <span>Duracion</span>
                <input value={itemDurationMin} onChange={(event) => setItemDurationMin(Number(event.target.value))} type="number" />
              </label>
              <label>
                <span>SKU</span>
                <input value={itemSku} onChange={(event) => setItemSku(event.target.value)} type="text" />
              </label>
              <label>
                <span>Notas</span>
                <input value={itemNotes} onChange={(event) => setItemNotes(event.target.value)} type="text" />
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                Crear item
              </button>
            </form> : null}
          </section>
          ) : null}
          {canReadCommercial ? (
            <section className="users-section" id="sales-section">
            <div className="users-section__header">
              <h3>Ventas</h3>
              <p>Primer flujo comercial real que une clientes y catalogo en propuestas persistidas.</p>
            </div>
            <div className="users-grid">
              {state.sales.map((sale) => (
                <article key={sale.id} className="user-card">
                  <strong>{sale.title}</strong>
                  <span>{sale.reference}</span>
                  <span>{sale.client.fullName}</span>
                  <span>{formatCurrency(sale.totalCents)}</span>
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getSaleStageLabel(sale.stage)}</span>
                    <span className="module-pill">{sale.lines.length} lineas</span>
                  </div>
                  {sale.lines.map((line) => (
                    <span key={line.id}>
                      {line.catalogItemName} x{line.quantity} - {formatCurrency(line.lineTotalCents)}
                    </span>
                  ))}
                  {sale.notes ? <span>{sale.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManageCommercial ? <form className="create-user-form create-user-form--sales" onSubmit={handleCreateSale}>
              <label>
                <span>Titulo</span>
                <input value={saleTitle} onChange={(event) => setSaleTitle(event.target.value)} type="text" />
              </label>
              <label>
                <span>Cliente</span>
                <select value={saleClientId} onChange={(event) => setSaleClientId(event.target.value)}>
                  {state.clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estado</span>
                <select value={saleStage} onChange={(event) => setSaleStage(event.target.value as typeof saleStage)}>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="won">Ganada</option>
                  <option value="lost">Perdida</option>
                </select>
              </label>
              <label>
                <span>Notas</span>
                <input value={saleNotes} onChange={(event) => setSaleNotes(event.target.value)} type="text" />
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                Crear venta
              </button>
              <div className="sales-lines">
                {saleLines.map((line, index) => (
                  <div key={`${line.catalogItemId}-${index}`} className="sales-line-row">
                    <label>
                      <span>Item</span>
                      <select
                        value={line.catalogItemId}
                        onChange={(event) => updateSaleLine(index, { ...line, catalogItemId: event.target.value })}
                      >
                        <option value="">Selecciona un item</option>
                        {state.catalogItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Cantidad</span>
                      <input
                        value={line.quantity}
                        min={1}
                        onChange={(event) => updateSaleLine(index, { ...line, quantity: Number(event.target.value) || 1 })}
                        type="number"
                      />
                    </label>
                    <button className="secondary-action secondary-action--light" onClick={() => removeSaleLine(index)} type="button">
                      Quitar
                    </button>
                  </div>
                ))}
                <button className="secondary-action secondary-action--light" onClick={addSaleLine} type="button">
                  Anadir linea
                </button>
              </div>
            </form> : null}
          </section>
          ) : null}
          {canReadBilling ? (
            <section className="users-section" id="billing-section">
            <div className="users-section__header">
              <h3>Facturacion</h3>
              <p>Facturacion operativa enlazada a ventas para preparar cobros y conciliacion.</p>
            </div>
            <div className="users-grid">
              {state.invoices.map((invoice) => (
                <article key={invoice.id} className="user-card">
                  <strong>{invoice.reference}</strong>
                  <span>{invoice.client.fullName}</span>
                  <span>{invoice.sale.reference}</span>
                  <span>{formatCurrency(invoice.totalCents)}</span>
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getInvoiceStatusLabel(invoice.status)}</span>
                    <span className="module-pill">vence {invoice.dueDate}</span>
                    <span className="module-pill">cobrado {formatCurrency(invoice.paidCents)}</span>
                    <span className="module-pill">saldo {formatCurrency(invoice.balanceCents)}</span>
                  </div>
                  {invoice.lines.map((line) => (
                    <span key={line.id}>
                      {line.description} x{line.quantity} - {formatCurrency(line.lineTotalCents)}
                    </span>
                  ))}
                  {invoice.payments.map((payment) => (
                    <span key={payment.id}>
                      {payment.reference} - {getPaymentMethodLabel(payment.method)} - {formatCurrency(payment.amountCents)}
                    </span>
                  ))}
                  {invoice.notes ? <span>{invoice.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManageBilling ? <form className="create-user-form create-user-form--sales" onSubmit={handleCreateInvoice}>
              <label>
                <span>Venta origen</span>
                <select value={invoiceSaleId} onChange={(event) => setInvoiceSaleId(event.target.value)}>
                  <option value="">Selecciona una venta</option>
                  {invoiceableSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.reference} - {sale.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estado</span>
                <input value="Se emite automaticamente" disabled readOnly />
              </label>
              <label>
                <span>Vencimiento</span>
                <input value={invoiceDueDate} onChange={(event) => setInvoiceDueDate(event.target.value)} type="date" />
              </label>
              <label>
                <span>Notas</span>
                <input value={invoiceNotes} onChange={(event) => setInvoiceNotes(event.target.value)} type="text" />
              </label>
              <button type="submit" disabled={createUserState.status === 'loading' || invoiceableSales.length === 0 || !invoiceSaleId}>
                Emitir factura
              </button>
            </form> : null}
            {canManageBilling && invoiceableSales.length === 0 ? <p className="login-status login-status--idle">Solo las ventas ganadas y sin factura previa pueden emitirse.</p> : null}
          </section>
          ) : null}
          {canReadPayments ? (
            <section className="users-section" id="payments-section">
            <div className="users-section__header">
              <h3>Cobros</h3>
              <p>Cobros operativos sobre facturas emitidas para cerrar el circuito comercial-financiero minimo.</p>
            </div>
            <div className="users-grid">
              {state.payments.map((payment) => (
                <article key={payment.id} className="user-card">
                  <strong>{payment.reference}</strong>
                  <span>{payment.invoice.client.fullName}</span>
                  <span>{payment.invoice.reference}</span>
                  <span>{formatCurrency(payment.amountCents)}</span>
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getPaymentStatusLabel(payment.status)}</span>
                    <span className="module-pill">{getPaymentMethodLabel(payment.method)}</span>
                    <span className="module-pill">saldo {formatCurrency(payment.invoice.balanceCents)}</span>
                  </div>
                  <span>{payment.invoice.sale.reference}</span>
                  {payment.notes ? <span>{payment.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManagePayments ? <form className="create-user-form create-user-form--sales" onSubmit={handleCreatePayment}>
              <label>
                <span>Factura</span>
                <select
                  value={paymentInvoiceId}
                  onChange={(event) => {
                    const nextInvoiceId = event.target.value;

                    setPaymentInvoiceId(nextInvoiceId);
                    setPaymentAmountCents(payableInvoices.find((invoice) => invoice.id === nextInvoiceId)?.balanceCents ?? 0);
                  }}
                >
                  <option value="">Selecciona una factura</option>
                  {payableInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.reference} - saldo {formatCurrency(invoice.balanceCents)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estado</span>
                <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}>
                  <option value="confirmed">Confirmado</option>
                  <option value="pending">Pendiente</option>
                  <option value="failed">Fallido</option>
                </select>
              </label>
              <label>
                <span>Metodo</span>
                <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}>
                  <option value="bank_transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="cash">Efectivo</option>
                </select>
              </label>
              <label>
                <span>Importe (EUR)</span>
                <input value={formatCurrencyInput(paymentAmountCents)} min="0.01" step="0.01" onChange={(event) => setPaymentAmountCents(parseCurrencyInput(event.target.value))} type="number" />
              </label>
              <label>
                <span>Fecha cobro</span>
                <input value={paymentReceivedAt} onChange={(event) => setPaymentReceivedAt(event.target.value)} type="date" />
              </label>
              <label>
                <span>Notas</span>
                <input value={paymentNotes} onChange={(event) => setPaymentNotes(event.target.value)} type="text" />
              </label>
              <button
                type="submit"
                disabled={
                  createUserState.status === 'loading'
                  || payableInvoices.length === 0
                  || !paymentInvoiceId
                  || paymentAmountCents <= 0
                  || paymentFormState.status === 'attention'
                }
              >
                Registrar cobro
              </button>
            </form> : null}
            {canManagePayments && payableInvoices.length > 0 ? (
              <p className={`login-status login-status--${paymentFormState.status === 'ready' ? 'success' : 'idle'}`}>
                {paymentFormState.detail}
              </p>
            ) : null}
            {canManagePayments && payableInvoices.length === 0 ? <p className="login-status login-status--idle">No hay facturas emitidas con saldo pendiente.</p> : null}
          </section>
          ) : null}
          {canReadEmployees ? (
            <section className="users-section" id="employees-section">
            <div className="users-section__header">
              <h3>Empleados</h3>
              <p>Base interna de personas para enlazar usuarios, trabajo interno y agenda operativa.</p>
            </div>
            <div className="users-grid">
              {state.employees.map((employee) => (
                <article key={employee.id} className="user-card">
                  <strong>{employee.fullName}</strong>
                  <span>{employee.employeeCode}</span>
                  <span>{employee.department} - {employee.jobTitle}</span>
                  <span>alta {employee.startDate}</span>
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getEmployeeStatusLabel(employee.status)}</span>
                    <span className="module-pill">{getEmploymentTypeLabel(employee.employmentType)}</span>
                    {employee.linkedUser ? <span className="module-pill">usuario enlazado</span> : null}
                  </div>
                  {employee.workEmail ? <span>{employee.workEmail}</span> : null}
                  {employee.phone ? <span>{employee.phone}</span> : null}
                  {employee.linkedUser ? <span>{employee.linkedUser.fullName} - {employee.linkedUser.email}</span> : null}
                  {employee.notes ? <span>{employee.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManageEmployees ? <form className="create-user-form create-user-form--employees" onSubmit={handleCreateEmployee}>
              <label>
                <span>Codigo</span>
                <input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} type="text" />
              </label>
              <label>
                <span>Nombre</span>
                <input value={employeeFullName} onChange={(event) => setEmployeeFullName(event.target.value)} type="text" />
              </label>
              <label>
                <span>Usuario enlazado</span>
                <select value={employeeLinkedUserId} onChange={(event) => setEmployeeLinkedUserId(event.target.value)}>
                  <option value="">Sin enlazar</option>
                  {state.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Email laboral</span>
                <input value={employeeWorkEmail} onChange={(event) => setEmployeeWorkEmail(event.target.value)} type="email" />
              </label>
              <label>
                <span>Telefono</span>
                <input value={employeePhone} onChange={(event) => setEmployeePhone(event.target.value)} type="text" />
              </label>
              <label>
                <span>Departamento</span>
                <input value={employeeDepartment} onChange={(event) => setEmployeeDepartment(event.target.value)} type="text" />
              </label>
              <label>
                <span>Puesto</span>
                <input value={employeeJobTitle} onChange={(event) => setEmployeeJobTitle(event.target.value)} type="text" />
              </label>
              <label>
                <span>Tipo</span>
                <select value={employeeEmploymentType} onChange={(event) => setEmployeeEmploymentType(event.target.value as typeof employeeEmploymentType)}>
                  <option value="full_time">Jornada completa</option>
                  <option value="part_time">Jornada parcial</option>
                  <option value="contractor">Colaborador externo</option>
                </select>
              </label>
              <label>
                <span>Estado</span>
                <select value={employeeStatus} onChange={(event) => setEmployeeStatus(event.target.value as typeof employeeStatus)}>
                  <option value="active">Activo</option>
                  <option value="on_leave">De baja</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </label>
              <label>
                <span>Alta</span>
                <input value={employeeStartDate} onChange={(event) => setEmployeeStartDate(event.target.value)} type="date" />
              </label>
              <label>
                <span>Notas</span>
                <input value={employeeNotes} onChange={(event) => setEmployeeNotes(event.target.value)} type="text" />
              </label>
              <button type="submit" disabled={createUserState.status === 'loading'}>
                Crear empleado
              </button>
            </form> : null}
          </section>
          ) : null}
          {canReadInternalTasks ? (
            <section className="users-section" id="internal-tasks-section">
            <div className="users-section__header">
              <h3>Trabajo interno</h3>
              <p>Trabajo interno asignable a empleados para abrir trazabilidad operativa antes de pasar a agenda.</p>
            </div>
            <div className="users-grid">
              {state.internalTasks.map((task) => (
                <article key={task.id} className="user-card">
                  <strong>{task.title}</strong>
                  <span>{task.taskCode}</span>
                  {task.sale ? <span>{task.sale.reference} - {task.sale.client.fullName}</span> : <span>sin venta enlazada</span>}
                  <span>{task.assigneeEmployee.fullName} - {task.assigneeEmployee.employeeCode}</span>
                  {task.dueDate ? <span>vence {task.dueDate}</span> : <span>sin vencimiento</span>}
                  <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getInternalTaskStatusLabel(task.status)}</span>
                    <span className="module-pill">{getInternalTaskPriorityLabel(task.priority)}</span>
                    <span className="module-pill">{task.assigneeEmployee.department}</span>
                    {task.sale ? <span className="module-pill">{getSaleStageLabel(task.sale.stage)}</span> : null}
                  </div>
                  <span>creada por {task.createdByUser.fullName}</span>
                  {task.description ? <span>{task.description}</span> : null}
                </article>
              ))}
            </div>
            {canManageInternalTasks ? <form className="create-user-form create-user-form--employees" onSubmit={handleCreateInternalTask}>
              <label>
                <span>Titulo</span>
                <input value={internalTaskTitle} onChange={(event) => setInternalTaskTitle(event.target.value)} type="text" />
              </label>
              <label>
                <span>Venta ganada</span>
                <select value={internalTaskSaleId} onChange={(event) => setInternalTaskSaleId(event.target.value)}>
                  <option value="">Sin enlace comercial</option>
                  {wonSales.map((sale) => (
                    <option key={sale.id} value={sale.id}>
                      {sale.reference} - {sale.client.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Empleado responsable</span>
                <select value={internalTaskAssigneeEmployeeId} onChange={(event) => setInternalTaskAssigneeEmployeeId(event.target.value)}>
                  <option value="">Selecciona un empleado</option>
                  {internalTaskAssigneeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} - {employee.employeeCode}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estado</span>
                <select value={internalTaskStatus} onChange={(event) => setInternalTaskStatus(event.target.value as typeof internalTaskStatus)}>
                  <option value="todo">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="blocked">Bloqueada</option>
                  <option value="done">Hecha</option>
                </select>
              </label>
              <label>
                <span>Prioridad</span>
                <select value={internalTaskPriority} onChange={(event) => setInternalTaskPriority(event.target.value as typeof internalTaskPriority)}>
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </label>
              <label>
                <span>Vencimiento</span>
                <input value={internalTaskDueDate} onChange={(event) => setInternalTaskDueDate(event.target.value)} type="date" />
              </label>
              <label>
                <span>Descripcion</span>
                <input value={internalTaskDescription} onChange={(event) => setInternalTaskDescription(event.target.value)} type="text" />
              </label>
                <button type="submit" disabled={createUserState.status === 'loading' || internalTaskAssigneeOptions.length === 0 || !internalTaskAssigneeEmployeeId}>
                  Crear tarea interna
                </button>
              </form> : null}
            {canManageInternalTasks && state.employees.length === 0 ? <p className="login-status login-status--idle">Primero crea al menos un empleado para poder asignar trabajo interno.</p> : null}
            {canManageInternalTasks && state.employees.length > 0 && internalTaskAssigneeOptions.length === 0 ? <p className="login-status login-status--idle">No hay empleados disponibles: las tareas internas no aceptan fichas inactivas.</p> : null}
            {canManageInternalTasks && state.employees.length > 0 && wonSales.length === 0 ? <p className="login-status login-status--idle">Aun puedes crear tareas internas sueltas, pero enlazar una venta ganada mejora la trazabilidad operativa.</p> : null}
          </section>
          ) : null}
          {canReadReservations ? (
            <section className="users-section" id="reservations-section">
            <div className="users-section__header">
              <h3>Agenda y reservas</h3>
              <p>Agenda minima por empleado con enlace opcional a tarea interna y validacion anti-solapamiento.</p>
            </div>
            <div className="users-grid">
              {state.reservations.map((reservation) => (
                <article key={reservation.id} className="user-card">
                  <strong>{reservation.title}</strong>
                  <span>{reservation.reservationCode}</span>
                  <span>{reservation.assigneeEmployee.fullName} - {reservation.assigneeEmployee.employeeCode}</span>
                    <span>{formatDateTime(reservation.startAt)} {'->'} {formatTime(reservation.endAt)}</span>
                    <div className="permission-list">
                    <span className="module-pill module-pill--accent">{getReservationStatusLabel(reservation.status)}</span>
                    <span className="module-pill">{reservation.assigneeEmployee.department}</span>
                    {reservation.location ? <span className="module-pill">{reservation.location}</span> : null}
                  </div>
                  <span>creada por {reservation.createdByUser.fullName}</span>
                  {reservation.internalTask ? <span>{reservation.internalTask.taskCode} - {reservation.internalTask.title}</span> : <span>sin tarea interna enlazada</span>}
                  {reservation.internalTask?.sale ? <span>{reservation.internalTask.sale.reference} - {reservation.internalTask.sale.client.fullName}</span> : null}
                  {reservation.notes ? <span>{reservation.notes}</span> : null}
                </article>
              ))}
            </div>
            {canManageReservations ? <form className="create-user-form create-user-form--employees" onSubmit={handleCreateReservation}>
              <label>
                <span>Titulo</span>
                <input value={reservationTitle} onChange={(event) => setReservationTitle(event.target.value)} type="text" />
              </label>
              <label>
                <span>Empleado</span>
                <select value={reservationAssigneeEmployeeId} onChange={(event) => handleReservationAssigneeChange(event.target.value)}>
                  <option value="">Selecciona un empleado</option>
                  {reservationAssigneeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} - {employee.employeeCode}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tarea interna</span>
                <select value={reservationInternalTaskId} onChange={(event) => handleReservationInternalTaskChange(event.target.value)}>
                  <option value="">Sin enlazar</option>
                  {reservationTaskOptions.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.taskCode} - {task.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Estado</span>
                <select value={reservationStatus} onChange={(event) => setReservationStatus(event.target.value as typeof reservationStatus)}>
                  <option value="booked">Reservada</option>
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </label>
              <label>
                <span>Fecha</span>
                <input value={reservationDate} onChange={(event) => setReservationDate(event.target.value)} type="date" />
              </label>
              <label>
                <span>Inicio</span>
                <input value={reservationStartTime} onChange={(event) => setReservationStartTime(event.target.value)} type="time" />
              </label>
              <label>
                <span>Fin</span>
                <input value={reservationEndTime} onChange={(event) => setReservationEndTime(event.target.value)} type="time" />
              </label>
              <label>
                <span>Ubicacion</span>
                <input value={reservationLocation} onChange={(event) => setReservationLocation(event.target.value)} type="text" />
              </label>
              <label>
                <span>Notas</span>
                <input value={reservationNotes} onChange={(event) => setReservationNotes(event.target.value)} type="text" />
              </label>
              <button
                type="submit"
                disabled={
                  createUserState.status === 'loading'
                  || reservationAssigneeOptions.length === 0
                  || !reservationAssigneeEmployeeId
                  || !reservationDate
                  || !reservationStartTime
                  || !reservationEndTime
                  || reservationScheduleState.status === 'attention'
                }
              >
                Crear reserva
              </button>
            </form> : null}
            {canManageReservations && reservationAssigneeOptions.length > 0 ? (
              <p className={`login-status login-status--${reservationScheduleState.status === 'ready' ? 'success' : 'idle'}`}>
                {reservationScheduleState.detail}
              </p>
            ) : null}
            {canManageReservations && state.employees.length === 0 ? <p className="login-status login-status--idle">Primero crea al menos un empleado para abrir agenda operativa.</p> : null}
            {canManageReservations && state.employees.length > 0 && reservationAssigneeOptions.length === 0 ? <p className="login-status login-status--idle">La agenda solo permite empleados activos; reactiva uno o crea una ficha nueva.</p> : null}
            {canManageReservations && state.internalTasks.length > 0 && reservableInternalTasks.length === 0 ? <p className="login-status login-status--idle">Las tareas existentes no pueden saltar a agenda porque sus responsables no estan activos; reactiva la ficha o reasigna la tarea antes de reservar.</p> : null}
            {canManageReservations && reservationInternalTaskId ? <p className="login-status login-status--idle">La reserva queda bloqueada al responsable de la tarea enlazada para mantener la trazabilidad operativa.</p> : null}
          </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
