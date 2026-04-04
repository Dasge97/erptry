import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';

import { createAuditLog, listAuditLogs } from '../services/audit-logs-service.js';
import { getAnalyticsSnapshot } from '../services/analytics-service.js';
import { createInternalTask, listInternalTasks } from '../services/internal-tasks-service.js';
import { createInvoiceFromSale, listInvoices } from '../services/invoices-service.js';
import { listNotifications } from '../services/notifications-service.js';
import { createPayment, listPayments } from '../services/payments-service.js';
import { canAssignTenantUserRole, canReadRoleCatalog } from '../services/platform-service.js';
import { getReportsBundle } from '../services/reports-service.js';
import { createReservation, listReservations } from '../services/reservations-service.js';
import { createSale, listSales } from '../services/sales-service.js';
import { listEmployees } from '../services/employees-service.js';

const prisma = new PrismaClient();

const VALIDATION_MARKER = '[release-operable-v1-validation]';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludesAll(permissionCodes: string[], expected: string[], errorPrefix: string) {
  const missingPermissions = expected.filter((permission) => !permissionCodes.includes(permission));

  assert(
    missingPermissions.length === 0,
    `${errorPrefix}. Faltan permisos: ${missingPermissions.join(', ')}.`
  );
}

function assertExcludesAll(permissionCodes: string[], forbidden: string[], errorPrefix: string) {
  const presentForbiddenPermissions = forbidden.filter((permission) => permissionCodes.includes(permission));

  assert(
    presentForbiddenPermissions.length === 0,
    `${errorPrefix}. Permisos no esperados: ${presentForbiddenPermissions.join(', ')}.`
  );
}

function ensureDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  assert(
    databaseUrl,
    'Falta DATABASE_URL. Configura PostgreSQL local (db:push + db:seed) y vuelve a ejecutar validate:release-operable-v1.'
  );
}

async function safeCleanup(step: string, action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.error(`[release-operable-v1-validation] cleanup warning (${step})`, error);
  }
}

async function cleanupValidationData(tenantId: string) {
  const validationSales = await prisma.sale.findMany({
    where: {
      tenantId,
      OR: [{ title: { contains: VALIDATION_MARKER } }, { notes: { contains: VALIDATION_MARKER } }]
    },
    select: { id: true }
  });

  const saleIds = validationSales.map((sale) => sale.id);
  const validationInvoices = saleIds.length
    ? await prisma.invoice.findMany({
        where: {
          tenantId,
          saleId: { in: saleIds }
        },
        select: { id: true }
      })
    : [];
  const invoiceIds = validationInvoices.map((invoice) => invoice.id);
  const validationPayments = invoiceIds.length
    ? await prisma.payment.findMany({
        where: {
          tenantId,
          invoiceId: { in: invoiceIds }
        },
        select: { id: true }
      })
    : [];
  const paymentIds = validationPayments.map((payment) => payment.id);
  const validationTasks = await prisma.internalTask.findMany({
    where: {
      tenantId,
      OR: [
        { description: { contains: VALIDATION_MARKER } },
        ...(saleIds.length ? [{ saleId: { in: saleIds } }] : [])
      ]
    },
    select: { id: true }
  });
  const taskIds = validationTasks.map((task) => task.id);
  const validationReservations = await prisma.reservation.findMany({
    where: {
      tenantId,
      OR: [
        { notes: { contains: VALIDATION_MARKER } },
        ...(taskIds.length ? [{ internalTaskId: { in: taskIds } }] : [])
      ]
    },
    select: { id: true }
  });
  const reservationIds = validationReservations.map((reservation) => reservation.id);
  const resourceIds = [...saleIds, ...invoiceIds, ...paymentIds, ...taskIds, ...reservationIds];

  await prisma.notification.deleteMany({
    where: {
      tenantId,
      OR: [
        { title: { contains: VALIDATION_MARKER } },
        { message: { contains: VALIDATION_MARKER } },
        ...(resourceIds.length ? [{ resourceId: { in: resourceIds } }] : [])
      ]
    }
  });

  await prisma.auditLog.deleteMany({
    where: {
      tenantId,
      OR: [
        { summary: { contains: VALIDATION_MARKER } },
        ...(resourceIds.length ? [{ resourceId: { in: resourceIds } }] : [])
      ]
    }
  });

  if (reservationIds.length) {
    await prisma.reservation.deleteMany({
      where: {
        tenantId,
        id: { in: reservationIds }
      }
    });
  }

  if (paymentIds.length) {
    await prisma.payment.deleteMany({
      where: {
        tenantId,
        id: { in: paymentIds }
      }
    });
  }

  if (invoiceIds.length) {
    await prisma.invoice.deleteMany({
      where: {
        tenantId,
        id: { in: invoiceIds }
      }
    });
  }

  if (taskIds.length) {
    await prisma.internalTask.deleteMany({
      where: {
        tenantId,
        id: { in: taskIds }
      }
    });
  }

  if (saleIds.length) {
    await prisma.sale.deleteMany({
      where: {
        tenantId,
        id: { in: saleIds }
      }
    });
  }
}

async function cleanupSalesCascade(tenantId: string, saleIds: string[]) {
  if (saleIds.length === 0) {
    return;
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      saleId: { in: saleIds }
    },
    select: { id: true }
  });
  const invoiceIds = invoices.map((invoice) => invoice.id);
  const payments = invoiceIds.length
    ? await prisma.payment.findMany({
        where: {
          tenantId,
          invoiceId: { in: invoiceIds }
        },
        select: { id: true }
      })
    : [];
  const paymentIds = payments.map((payment) => payment.id);
  const resourceIds = [...saleIds, ...invoiceIds, ...paymentIds];

  if (resourceIds.length) {
    await prisma.notification.deleteMany({
      where: {
        tenantId,
        resourceId: { in: resourceIds }
      }
    });

    await prisma.auditLog.deleteMany({
      where: {
        tenantId,
        resourceId: { in: resourceIds }
      }
    });
  }

  if (paymentIds.length) {
    await prisma.payment.deleteMany({
      where: {
        tenantId,
        id: { in: paymentIds }
      }
    });
  }

  if (invoiceIds.length) {
    await prisma.invoice.deleteMany({
      where: {
        tenantId,
        id: { in: invoiceIds }
      }
    });
  }

  await prisma.sale.deleteMany({
    where: {
      tenantId,
      id: { in: saleIds }
    }
  });
}

async function createManualAudit(
  tenantId: string,
  actor: { id: string; fullName: string; email: string },
  action: string,
  resourceType: string,
  resourceId: string,
  summary: string
) {
  await createAuditLog(prisma, tenantId, {
    actorUserId: actor.id,
    actorName: actor.fullName,
    actorEmail: actor.email,
    type: resourceType === 'reservation' ? 'reminder' : resourceType === 'invoice' || resourceType === 'payment' ? 'finance' : 'activity',
    severity: action === 'payment.create' || action === 'reservation.create' ? 'success' : 'info',
    action,
    resourceType,
    resourceId,
    summary: `${VALIDATION_MARKER} ${summary}`
  });
}

async function createTempEmployee(tenantId: string, status: 'active' | 'on_leave' | 'inactive') {
  const statusCode = status === 'active' ? 'ACT' : status === 'on_leave' ? 'LEV' : 'INA';
  const statusLabel = status === 'active' ? 'Activo' : status === 'on_leave' ? 'Baja' : 'Inactivo';

  return prisma.employee.create({
    data: {
      id: randomUUID(),
      tenantId,
      employeeCode: `VAL-${statusCode}-${randomUUID().slice(0, 4).toUpperCase()}`,
      fullName: `${statusLabel} Validacion`,
      department: 'QA',
      jobTitle: 'Validation Agent',
      employmentType: 'contractor',
      status,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      notes: VALIDATION_MARKER
    },
    select: { id: true }
  });
}

async function getUserPermissionCodes(tenantId: string, email: string) {
  const user = await prisma.user.findFirst({
    where: {
      tenantId,
      email: email.toLowerCase()
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  assert(user, `No existe el usuario demo '${email}'. Ejecuta db:seed primero.`);

  const permissionCodes = new Set<string>();

  user.roles.forEach((userRole) => {
    userRole.role.permissions.forEach((rolePermission) => {
      permissionCodes.add(rolePermission.permission.code);
    });
  });

  return Array.from(permissionCodes).sort();
}

async function main() {
  ensureDatabaseUrl();

  const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'erptry';
  const ownerEmail = (process.env.SEED_ADMIN_EMAIL ?? 'owner@erptry.local').toLowerCase();
  const managerEmail = 'manager@erptry.local';
  const viewerEmail = 'viewer@erptry.local';
  const tempSaleIds: string[] = [];
  const tempEmployeeIds: string[] = [];
  let tenantIdForCleanup: string | null = null;

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, name: true }
    });
    assert(tenant, `No existe el tenant demo '${tenantSlug}'. Ejecuta db:seed primero.`);
    tenantIdForCleanup = tenant.id;

    await cleanupValidationData(tenant.id);

  const actor = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      email: ownerEmail
    },
    select: { id: true, fullName: true, email: true }
  });
  assert(actor, `No existe el usuario demo '${ownerEmail}'. Ejecuta db:seed primero.`);

  const [ownerPermissions, managerPermissions, viewerPermissions] = await Promise.all([
    getUserPermissionCodes(tenant.id, ownerEmail),
    getUserPermissionCodes(tenant.id, managerEmail),
    getUserPermissionCodes(tenant.id, viewerEmail)
  ]);

  assert(ownerPermissions.includes('users.manage'), 'El perfil owner demo debe mantener users.manage para validar plataforma.');
  assert(ownerPermissions.includes('roles.manage'), 'El perfil owner demo debe mantener roles.manage para validar ACL completa.');
  assert(canReadRoleCatalog(ownerPermissions), 'El owner demo debe poder consultar el catalogo de roles.');
  assertIncludesAll(
    ownerPermissions,
    [
      'settings.manage',
      'users.manage',
      'roles.manage',
      'sales.manage',
      'billing.manage',
      'payments.manage',
      'employees.manage',
      'tasks.manage',
      'reservations.manage',
      'notifications.manage',
      'analytics.view',
      'reports.view',
      'audit.view',
      'audit.manage'
    ],
    'El perfil owner demo debe cubrir todo el alcance vendible para repaso end-to-end'
  );

  assert(managerPermissions.includes('users.manage'), 'El perfil manager demo debe mantener users.manage para altas operativas.');
  assert(!managerPermissions.includes('roles.manage'), 'El perfil manager demo no debe incluir roles.manage.');
  assert(!canReadRoleCatalog(managerPermissions), 'El manager demo no debe poder leer el catalogo de roles.');
  assert(canAssignTenantUserRole(managerPermissions, 'operator'), 'El manager demo debe poder asignar operator.');
  assert(canAssignTenantUserRole(managerPermissions, 'viewer'), 'El manager demo debe poder asignar viewer.');
  assert(!canAssignTenantUserRole(managerPermissions, 'manager'), 'El manager demo no debe poder asignar manager.');
  assert(!canAssignTenantUserRole(managerPermissions, 'admin'), 'El manager demo no debe poder asignar admin.');
  assert(!canAssignTenantUserRole(managerPermissions, 'owner'), 'El manager demo no debe poder asignar owner.');
  assertIncludesAll(
    managerPermissions,
    [
      'users.manage',
      'sales.manage',
      'billing.manage',
      'payments.manage',
      'employees.manage',
      'tasks.manage',
      'reservations.manage',
      'notifications.manage',
      'analytics.view',
      'reports.view',
      'audit.view'
    ],
    'El perfil manager demo debe conservar su alcance operativo'
  );
  assertExcludesAll(
    managerPermissions,
    ['settings.manage', 'roles.manage', 'audit.manage'],
    'El perfil manager demo no debe escalar al nucleo de plataforma'
  );

  assert(!viewerPermissions.includes('users.manage'), 'El viewer demo no debe incluir users.manage.');
  assert(!viewerPermissions.includes('roles.manage'), 'El viewer demo no debe incluir roles.manage.');
  assert(!viewerPermissions.includes('settings.manage'), 'El viewer demo no debe incluir settings.manage.');
  assertIncludesAll(
    viewerPermissions,
    [
      'sales.view',
      'billing.view',
      'payments.view',
      'employees.view',
      'tasks.view',
      'reservations.view',
      'analytics.view',
      'reports.view',
      'notifications.view',
      'audit.view'
    ],
    'El perfil viewer demo debe mantener visibilidad de lectura sobre el circuito completo'
  );
  assertExcludesAll(
    viewerPermissions,
    viewerPermissions.filter((permission) => permission.endsWith('.manage')),
    'El perfil viewer demo no debe incluir ningun permiso de gestion'
  );

  const [client, activeEmployee, catalogItems] = await Promise.all([
    prisma.client.findFirst({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, fullName: true }
    }),
    prisma.employee.findFirst({
      where: { tenantId: tenant.id, status: 'active' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, fullName: true }
    }),
    prisma.catalogItem.findMany({
      where: { tenantId: tenant.id, status: 'active' },
      orderBy: { createdAt: 'asc' },
      take: 2,
      select: { id: true }
    })
  ]);

  assert(client, 'No hay clientes demo disponibles. Ejecuta db:seed primero.');
  assert(activeEmployee, 'No hay empleados activos en el tenant demo. Ejecuta db:seed primero.');
  assert(catalogItems.length > 0, 'No hay items activos de catalogo. Ejecuta db:seed primero.');
  const primaryCatalogItem = catalogItems[0]!;

  const positiveSale = await createSale(prisma, tenant.id, {
    title: `${VALIDATION_MARKER} Circuito vendible demo`,
    clientId: client.id,
    stage: 'won',
    notes: VALIDATION_MARKER,
    lines: catalogItems.map((item) => ({
      catalogItemId: item.id,
      quantity: 1
    }))
  });
  assert(positiveSale, 'No se pudo crear la venta ganada de validacion.');

  const invoice = await createInvoiceFromSale(prisma, tenant.id, {
    saleId: positiveSale.id,
    status: 'issued',
    dueDate: '2030-05-10',
    notes: VALIDATION_MARKER
  });
  assert(invoice, 'No se pudo emitir factura desde la venta ganada de validacion.');
  assert(invoice.status === 'issued', 'La factura de validacion no nace en estado issued.');
  await createManualAudit(tenant.id, actor, 'invoice.create', 'invoice', invoice.id, 'Factura emitida sobre la venta de validacion.');

  const partialPayment = await createPayment(prisma, tenant.id, {
    invoiceId: invoice.id,
    status: 'confirmed',
    method: 'bank_transfer',
    amountCents: Math.max(100, Math.floor(invoice.totalCents / 2)),
    receivedAt: '2026-04-04T09:30:00.000Z',
    notes: VALIDATION_MARKER
  });
  assert(partialPayment, 'No se pudo registrar el cobro parcial de validacion.');
  assert(partialPayment.invoice.status === 'issued', 'La factura debe seguir issued tras un cobro parcial.');
  await createManualAudit(tenant.id, actor, 'payment.create', 'payment', partialPayment.id, 'Cobro parcial registrado sobre la factura de validacion.');

  const finalPayment = await createPayment(prisma, tenant.id, {
    invoiceId: invoice.id,
    status: 'confirmed',
    method: 'card',
    amountCents: partialPayment.invoice.balanceCents,
    receivedAt: '2026-04-06T12:00:00.000Z',
    notes: VALIDATION_MARKER
  });
  assert(finalPayment, 'No se pudo registrar el cobro final de validacion.');
  assert(finalPayment.invoice.status === 'paid', 'La factura debe pasar a paid al liquidarse.');
  assert(finalPayment.invoice.balanceCents === 0, 'La factura liquidada debe quedar sin saldo pendiente.');
  await createManualAudit(tenant.id, actor, 'payment.create', 'payment', finalPayment.id, 'Cobro final registrado y factura liquidada.');

  const task = await createInternalTask(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Coordinar arranque de servicio`,
    description: VALIDATION_MARKER,
    saleId: positiveSale.id,
    assigneeEmployeeId: activeEmployee.id,
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-04-08'
  });
  assert(task.kind === 'created', 'No se pudo crear la tarea interna de validacion.');
  assert(task.task.sale?.reference === positiveSale.reference, 'La tarea interna no conserva la trazabilidad comercial esperada.');
  await createManualAudit(tenant.id, actor, 'internal_task.create', 'internal_task', task.task.id, 'Tarea interna creada enlazada a la venta de validacion.');

  const reservation = await createReservation(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Visita de activacion`,
    notes: VALIDATION_MARKER,
    location: 'Cliente demo',
    assigneeEmployeeId: activeEmployee.id,
    internalTaskId: task.task.id,
    status: 'confirmed',
    startAt: '2026-04-09T09:00:00.000Z',
    endAt: '2026-04-09T10:00:00.000Z'
  });
  assert(reservation.kind === 'created', 'No se pudo crear la reserva de validacion.');
  assert(
    reservation.reservation.internalTask?.sale?.reference === positiveSale.reference,
    'La reserva no arrastra la referencia comercial esperada.'
  );
  await createManualAudit(tenant.id, actor, 'reservation.create', 'reservation', reservation.reservation.id, 'Reserva creada enlazada a la tarea interna de validacion.');

  const overlappingReservation = await createReservation(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Solape bloqueado`,
    notes: VALIDATION_MARKER,
    assigneeEmployeeId: activeEmployee.id,
    status: 'booked',
    startAt: '2026-04-09T09:30:00.000Z',
    endAt: '2026-04-09T10:30:00.000Z'
  });
  assert(overlappingReservation.kind === 'schedule_conflict', 'La agenda deberia bloquear reservas solapadas.');

  const inactiveEmployee = await createTempEmployee(tenant.id, 'inactive');
  const onLeaveEmployee = await createTempEmployee(tenant.id, 'on_leave');
  const alternateActiveEmployee = await createTempEmployee(tenant.id, 'active');
  tempEmployeeIds.push(inactiveEmployee.id, onLeaveEmployee.id, alternateActiveEmployee.id);

  const inactiveTask = await createInternalTask(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Tarea bloqueada por empleado inactivo`,
    description: VALIDATION_MARKER,
    saleId: positiveSale.id,
    assigneeEmployeeId: inactiveEmployee.id,
    status: 'todo',
    priority: 'medium'
  });
  assert(inactiveTask.kind === 'assignee_unavailable', 'Las tareas no deben asignarse a empleados inactive.');

  const inactiveReservation = await createReservation(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Reserva bloqueada por empleado inactivo`,
    notes: VALIDATION_MARKER,
    assigneeEmployeeId: inactiveEmployee.id,
    status: 'booked',
    startAt: '2026-04-11T09:00:00.000Z',
    endAt: '2026-04-11T10:00:00.000Z'
  });
  assert(inactiveReservation.kind === 'assignee_unavailable', 'Las reservas no deben asignarse a empleados no activos.');

  const onLeaveTask = await createInternalTask(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Tarea con responsable de baja`,
    description: VALIDATION_MARKER,
    saleId: positiveSale.id,
    assigneeEmployeeId: onLeaveEmployee.id,
    status: 'todo',
    priority: 'medium'
  });
  assert(onLeaveTask.kind === 'created', 'La validacion necesita una tarea enlazable con responsable de baja para endurecer agenda.');

  const onLeaveReservation = await createReservation(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Reserva bloqueada por empleado de baja`,
    notes: VALIDATION_MARKER,
    assigneeEmployeeId: onLeaveEmployee.id,
    internalTaskId: onLeaveTask.task.id,
    status: 'booked',
    startAt: '2026-04-11T10:00:00.000Z',
    endAt: '2026-04-11T11:00:00.000Z'
  });
  assert(onLeaveReservation.kind === 'assignee_unavailable', 'La agenda no debe reservar tareas cuyo responsable ya no esta active.');

  const mismatchedReservation = await createReservation(prisma, tenant.id, actor.id, {
    title: `${VALIDATION_MARKER} Reserva con responsable incoherente`,
    notes: VALIDATION_MARKER,
    assigneeEmployeeId: alternateActiveEmployee.id,
    internalTaskId: task.task.id,
    status: 'booked',
    startAt: '2026-04-11T11:00:00.000Z',
    endAt: '2026-04-11T12:00:00.000Z'
  });
  assert(mismatchedReservation.kind === 'assignee_mismatch', 'La reserva debe respetar el responsable de la tarea enlazada.');

  const draftSale = await createSale(prisma, tenant.id, {
    title: `${VALIDATION_MARKER} Venta draft no facturable`,
    clientId: client.id,
    stage: 'draft',
    notes: VALIDATION_MARKER,
    lines: [{ catalogItemId: primaryCatalogItem.id, quantity: 1 }]
  });
  const sentSale = await createSale(prisma, tenant.id, {
    title: `${VALIDATION_MARKER} Venta sent no facturable`,
    clientId: client.id,
    stage: 'sent',
    notes: VALIDATION_MARKER,
    lines: [{ catalogItemId: primaryCatalogItem.id, quantity: 1 }]
  });
  const lostSale = await createSale(prisma, tenant.id, {
    title: `${VALIDATION_MARKER} Venta lost no facturable`,
    clientId: client.id,
    stage: 'lost',
    notes: VALIDATION_MARKER,
    lines: [{ catalogItemId: primaryCatalogItem.id, quantity: 1 }]
  });

  assert(draftSale && sentSale && lostSale, 'No se pudieron crear las ventas de control para reglas de facturacion.');
  tempSaleIds.push(draftSale.id, sentSale.id, lostSale.id);

  const invoiceFromDraft = await createInvoiceFromSale(prisma, tenant.id, {
    saleId: draftSale.id,
    status: 'issued',
    dueDate: '2030-05-10'
  });
  const invoiceFromSent = await createInvoiceFromSale(prisma, tenant.id, {
    saleId: sentSale.id,
    status: 'issued',
    dueDate: '2030-05-10'
  });
  const invoiceFromLost = await createInvoiceFromSale(prisma, tenant.id, {
    saleId: lostSale.id,
    status: 'issued',
    dueDate: '2030-05-10'
  });

  assert(invoiceFromDraft === null, 'No debe emitirse factura desde ventas draft.');
  assert(invoiceFromSent === null, 'No debe emitirse factura desde ventas sent.');
  assert(invoiceFromLost === null, 'No debe emitirse factura desde ventas lost.');

  const negativeSale = await createSale(prisma, tenant.id, {
    title: `${VALIDATION_MARKER} Venta won para cobro invalido`,
    clientId: client.id,
    stage: 'won',
    notes: VALIDATION_MARKER,
    lines: [{ catalogItemId: primaryCatalogItem.id, quantity: 1 }]
  });
  assert(negativeSale, 'No se pudo crear la venta de control para pagos invalidos.');
  tempSaleIds.push(negativeSale.id);

  const negativeInvoice = await createInvoiceFromSale(prisma, tenant.id, {
    saleId: negativeSale.id,
    status: 'issued',
    dueDate: '2030-05-10',
    notes: VALIDATION_MARKER
  });
  assert(negativeInvoice, 'No se pudo emitir la factura de control para pagos invalidos.');

  const overpayment = await createPayment(prisma, tenant.id, {
    invoiceId: negativeInvoice.id,
    status: 'confirmed',
    method: 'cash',
    amountCents: negativeInvoice.totalCents + 1,
    receivedAt: '2026-04-07T10:00:00.000Z',
    notes: VALIDATION_MARKER
  });
  assert(overpayment === null, 'No debe aceptarse un cobro por encima del saldo pendiente.');

  const negativeFinalPayment = await createPayment(prisma, tenant.id, {
    invoiceId: negativeInvoice.id,
    status: 'confirmed',
    method: 'cash',
    amountCents: negativeInvoice.totalCents,
    receivedAt: '2026-04-07T10:30:00.000Z',
    notes: VALIDATION_MARKER
  });
  assert(negativeFinalPayment, 'No se pudo liquidar la factura de control.');

  const paymentOnPaidInvoice = await createPayment(prisma, tenant.id, {
    invoiceId: negativeInvoice.id,
    status: 'confirmed',
    method: 'cash',
    amountCents: 100,
    receivedAt: '2026-04-07T11:00:00.000Z',
    notes: VALIDATION_MARKER
  });
  assert(paymentOnPaidInvoice === null, 'No debe aceptarse un cobro sobre una factura paid.');

  const [sales, invoices, payments, employees, tasks, reservations, analytics, reports, notifications, auditLogs] = await Promise.all([
    listSales(prisma, tenant.id),
    listInvoices(prisma, tenant.id),
    listPayments(prisma, tenant.id),
    listEmployees(prisma, tenant.id),
    listInternalTasks(prisma, tenant.id),
    listReservations(prisma, tenant.id),
    getAnalyticsSnapshot(prisma, tenant.id),
    getReportsBundle(prisma, tenant.id),
    listNotifications(prisma, tenant.id),
    listAuditLogs(prisma, tenant.id)
  ]);

  assert(sales.some((sale) => sale.id === positiveSale.id && sale.stage === 'won'), 'La venta de validacion no aparece como won en el listado.');
  assert(invoices.some((item) => item.id === invoice.id && item.status === 'paid' && item.balanceCents === 0), 'La factura de validacion no refleja cierre contable.');
  assert(payments.some((item) => item.id === finalPayment.id && item.invoice.status === 'paid'), 'El cobro final no aparece conciliado contra la factura.');
  assert(employees.some((employee) => employee.id === activeEmployee.id), 'El empleado activo esperado no aparece en el tenant demo.');
  assert(tasks.some((item) => item.id === task.task.id && item.sale?.reference === positiveSale.reference), 'La tarea de validacion no aparece con referencia comercial.');
  assert(
    reservations.some((item) => item.id === reservation.reservation.id && item.internalTask?.taskCode === task.task.taskCode),
    'La reserva de validacion no mantiene la trazabilidad hacia la tarea interna.'
  );
  assert(analytics.sales.wonCount >= 2, 'La analitica no refleja suficientes ventas ganadas tras la validacion.');
  assert(analytics.billing.paidCount >= 2, 'La analitica no refleja suficientes facturas cobradas tras la validacion.');
  assert(analytics.payments.confirmedCount >= 4, 'La analitica no refleja suficientes cobros confirmados tras la validacion.');
  assert(
    reports.exports.some((report) => report.type === 'invoices' && report.rows.some((row) => row.referencia === invoice.reference && row.estado === 'paid')),
    'El reporte de facturas no incluye la factura validada como paid.'
  );
  assert(
    reports.exports.some((report) => report.type === 'payments' && report.rows.some((row) => row.referencia === finalPayment.reference)),
    'El reporte de cobros no incluye el cobro final validado.'
  );
  assert(
    notifications.items.some((item) => item.resourceId === invoice.id) &&
      notifications.items.some((item) => item.resourceId === finalPayment.id) &&
      notifications.items.some((item) => item.resourceId === task.task.id) &&
      notifications.items.some((item) => item.resourceId === reservation.reservation.id),
    'La bandeja de avisos no refleja todo el tramo factura -> cobro -> tarea -> reserva.'
  );
  assert(
    auditLogs.items.some((item) => item.resourceId === invoice.id && item.action === 'invoice.create') &&
      auditLogs.items.some((item) => item.resourceId === finalPayment.id && item.action === 'payment.create') &&
      auditLogs.items.some((item) => item.resourceId === reservation.reservation.id && item.action === 'reservation.create'),
    'La auditoria no refleja los eventos manuales esperados de la validacion.'
  );

  console.log(
    JSON.stringify(
      {
        status: 'ok',
        tenant: tenant.name,
        saleReference: positiveSale.reference,
        invoiceReference: invoice.reference,
        finalPaymentReference: finalPayment.reference,
        taskCode: task.task.taskCode,
        reservationCode: reservation.reservation.reservationCode,
        analytics: {
          wonCount: analytics.sales.wonCount,
          paidCount: analytics.billing.paidCount,
          confirmedPayments: analytics.payments.confirmedCount
        },
        notifications: notifications.totalCount,
        auditLogs: auditLogs.totalCount,
        acl: {
          ownerCanReadRoles: canReadRoleCatalog(ownerPermissions),
          managerCanReadRoles: canReadRoleCatalog(managerPermissions),
          managerCanAssign: {
            operator: canAssignTenantUserRole(managerPermissions, 'operator'),
            viewer: canAssignTenantUserRole(managerPermissions, 'viewer'),
            manager: canAssignTenantUserRole(managerPermissions, 'manager')
          },
          viewerCanManageUsers: viewerPermissions.includes('users.manage')
        }
      },
      null,
      2
    )
  );
  } finally {
    if (tenantIdForCleanup && tempSaleIds.length) {
      const tenantId = tenantIdForCleanup;
      await safeCleanup('temp sales', () => cleanupSalesCascade(tenantId, tempSaleIds));
    }

    if (tenantIdForCleanup && tempEmployeeIds.length) {
      const tenantId = tenantIdForCleanup;
      await safeCleanup('temp employees', async () => {
        await prisma.employee.deleteMany({
          where: {
            tenantId,
            id: { in: tempEmployeeIds }
          }
        });
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
