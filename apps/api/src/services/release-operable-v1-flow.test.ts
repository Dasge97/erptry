import { describe, expect, it } from 'vitest';

import { getAnalyticsSnapshot } from './analytics-service';
import { createAuditLog, listAuditLogs } from './audit-logs-service';
import { createInternalTask } from './internal-tasks-service';
import { createInvoiceFromSale } from './invoices-service';
import { createNotification, listNotifications } from './notifications-service';
import { createPayment } from './payments-service';
import { getReportsBundle } from './reports-service';
import { createReservation } from './reservations-service';

const tenantId = 'tenant_demo';
const actorUserId = 'user_owner';
const actorEmail = 'owner@erptry.local';

function createFlowPrisma() {
  const client = {
    id: 'client_demo',
    tenantId,
    fullName: 'Acme Servicios SL',
    email: 'ops@acme.test'
  };
  const catalogItem = {
    id: 'item_service',
    tenantId,
    name: 'Mantenimiento premium',
    kind: 'service' as const,
    priceCents: 45000
  };
  const sale = {
    id: 'sale_demo',
    tenantId,
    clientId: client.id,
    reference: 'SAL-20260403-DEMO0001',
    title: 'Contrato anual Acme',
    stage: 'won' as const,
    totalCents: 45000,
    notes: 'Activacion operativa',
    createdAt: new Date('2026-04-03T08:00:00.000Z'),
    lines: [
      {
        id: 'sale_line_1',
        catalogItemId: catalogItem.id,
        quantity: 1,
        unitPriceCents: 45000,
        lineTotalCents: 45000,
        catalogItem
      }
    ]
  };
  const employee = {
    id: 'employee_demo',
    tenantId,
    employeeCode: 'EMP-001',
    fullName: 'Ana Operaciones',
    department: 'Operaciones',
    jobTitle: 'Service Lead',
    status: 'active' as const
  };
  const user = {
    id: actorUserId,
    tenantId,
    fullName: 'Owner Demo',
    email: actorEmail
  };
  const state = {
    invoices: [] as Array<any>,
    payments: [] as Array<any>,
    internalTasks: [] as Array<any>,
    reservations: [] as Array<any>,
    notifications: [] as Array<any>,
    auditLogs: [] as Array<any>
  };

  const prisma = {
    sale: {
      findFirst: async ({ where }: any) => {
        const matchesSale = where.id === sale.id && where.tenantId === tenantId && (!where.stage || where.stage === sale.stage);
        const hasInvoice = state.invoices.some((invoice) => invoice.saleId === sale.id);

        if (!matchesSale || (Object.hasOwn(where, 'invoice') && where.invoice === null && hasInvoice)) {
          return null;
        }

        return {
          ...sale,
          client,
          lines: sale.lines
        };
      },
      findMany: async ({ where }: any) => {
        if (where.tenantId !== tenantId) {
          return [];
        }

        return [
          {
            ...sale,
            client,
            lines: sale.lines
          }
        ];
      }
    },
    invoice: {
      create: async ({ data }: any) => {
        const record = {
          id: data.id,
          tenantId: data.tenantId,
          saleId: data.saleId,
          clientId: data.clientId,
          reference: data.reference,
          status: data.status,
          dueDate: data.dueDate,
          issuedAt: data.issuedAt,
          subtotalCents: data.subtotalCents,
          totalCents: data.totalCents,
          notes: data.notes,
          lines: data.lines.create.map((line: any) => ({ ...line })),
          payments: [] as Array<any>
        };

        state.invoices.push(record);

        return {
          ...record,
          sale: {
            id: sale.id,
            reference: sale.reference,
            title: sale.title,
            stage: sale.stage
          },
          client
        };
      },
      findFirst: async ({ where }: any) => {
        const invoice = state.invoices.find(
          (item) => item.id === where.id && item.tenantId === where.tenantId && item.status === where.status
        );

        if (!invoice) {
          return null;
        }

        return {
          ...invoice,
          sale: {
            id: sale.id,
            reference: sale.reference,
            title: sale.title
          },
          client,
          payments: invoice.payments.map((payment: any) => ({
            id: payment.id,
            status: payment.status,
            amountCents: payment.amountCents
          }))
        };
      },
      findMany: async ({ where }: any) => {
        if (where.tenantId !== tenantId) {
          return [];
        }

        return state.invoices.map((invoice) => ({
          ...invoice,
          sale: {
            id: sale.id,
            reference: sale.reference,
            title: sale.title,
            stage: sale.stage
          },
          client,
          lines: invoice.lines.map((line: any) => ({ ...line })),
          payments: invoice.payments.map((payment: any) => ({ ...payment }))
        }));
      },
      update: async ({ where, data }: any) => {
        const invoice = state.invoices.find((item) => item.id === where.id);

        if (!invoice) {
          throw new Error('invoice_not_found');
        }

        invoice.status = data.status;
        return invoice;
      }
    },
    payment: {
      findMany: async ({ where }: any) => {
        if (where.tenantId !== tenantId) {
          return [];
        }

        return state.payments.map((payment) => {
          const invoice = state.invoices.find((item) => item.id === payment.invoiceId);

          if (!invoice) {
            throw new Error('invoice_not_found');
          }

          return {
            ...payment,
            invoice: {
              id: invoice.id,
              reference: invoice.reference,
              status: invoice.status,
              totalCents: invoice.totalCents,
              payments: invoice.payments.map((entry: any) => ({
                id: entry.id,
                status: entry.status,
                amountCents: entry.amountCents
              })),
              sale: {
                id: sale.id,
                reference: sale.reference,
                title: sale.title
              },
              client
            }
          };
        });
      }
    },
    employee: {
      findFirst: async ({ where }: any) => {
        if (where.id !== employee.id || where.tenantId !== tenantId) {
          return null;
        }

        return { id: employee.id, status: employee.status };
      }
    },
    user: {
      findFirst: async ({ where }: any) => {
        if (where.id !== user.id || where.tenantId !== tenantId) {
          return null;
        }

        return { id: user.id };
      }
    },
    internalTask: {
      findFirst: async ({ where }: any) => {
        if (where.id) {
          const task = state.internalTasks.find((item) => item.id === where.id && item.tenantId === tenantId);

          return task ? { id: task.id, assigneeEmployeeId: task.assigneeEmployeeId } : null;
        }

        return null;
      },
      create: async ({ data }: any) => {
        const record = {
          id: data.id,
          tenantId: data.tenantId,
          taskCode: data.taskCode,
          title: data.title,
          description: data.description,
          saleId: data.saleId,
          assigneeEmployeeId: data.assigneeEmployeeId,
          createdByUserId: data.createdByUserId,
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate,
          completedAt: data.completedAt,
          createdAt: new Date('2026-04-03T09:00:00.000Z')
        };

        state.internalTasks.push(record);

        return {
          ...record,
          assigneeEmployee: employee,
          createdByUser: user,
          sale: {
            id: sale.id,
            reference: sale.reference,
            title: sale.title,
            stage: sale.stage,
            client
          }
        };
      }
    },
    reservation: {
      findFirst: async ({ where }: any) => {
        const overlapping = state.reservations.find(
          (item) =>
            item.tenantId === where.tenantId &&
            item.assigneeEmployeeId === where.assigneeEmployeeId &&
            item.status !== 'cancelled' &&
            item.startAt < where.startAt.lt &&
            item.endAt > where.endAt.gt
        );

        return overlapping ? { id: overlapping.id } : null;
      },
      create: async ({ data }: any) => {
        const internalTask = state.internalTasks.find((item) => item.id === data.internalTaskId) ?? null;
        const record = {
          id: data.id,
          tenantId: data.tenantId,
          reservationCode: data.reservationCode,
          title: data.title,
          notes: data.notes,
          location: data.location,
          assigneeEmployeeId: data.assigneeEmployeeId,
          createdByUserId: data.createdByUserId,
          internalTaskId: data.internalTaskId,
          status: data.status,
          startAt: data.startAt,
          endAt: data.endAt,
          createdAt: new Date('2026-04-03T10:00:00.000Z')
        };

        state.reservations.push(record);

        return {
          ...record,
          assigneeEmployee: employee,
          createdByUser: user,
          internalTask: internalTask
            ? {
                id: internalTask.id,
                taskCode: internalTask.taskCode,
                title: internalTask.title,
                status: internalTask.status,
                priority: internalTask.priority,
                sale: {
                  id: sale.id,
                  reference: sale.reference,
                  title: sale.title,
                  stage: sale.stage,
                  client
                }
              }
            : null
        };
      },
      findMany: async ({ where }: any) => {
        if (where.tenantId !== tenantId) {
          return [];
        }

        return state.reservations.map((reservation) => {
          const internalTask = state.internalTasks.find((item) => item.id === reservation.internalTaskId) ?? null;

          return {
            ...reservation,
            assigneeEmployee: employee,
            createdByUser: user,
            internalTask: internalTask
              ? {
                  id: internalTask.id,
                  taskCode: internalTask.taskCode,
                  title: internalTask.title,
                  status: internalTask.status,
                  priority: internalTask.priority,
                  sale: {
                    id: sale.id,
                    reference: sale.reference,
                    title: sale.title,
                    stage: sale.stage,
                    client
                  }
                }
              : null
          };
        });
      }
    },
    notification: {
      create: async ({ data }: any) => {
        const notification = {
          id: data.id,
          tenantId: data.tenantId,
          type: data.type,
          severity: data.severity,
          title: data.title,
          message: data.message,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          readAt: null,
          createdAt: new Date('2026-04-03T11:00:00.000Z')
        };

        state.notifications.unshift(notification);
        return notification;
      },
      findMany: async ({ where }: any) => {
        if (where.tenantId !== tenantId) {
          return [];
        }

        return [...state.notifications];
      },
      findFirst: async ({ where }: any) => {
        return state.notifications.find((item) => item.id === where.id && item.tenantId === where.tenantId) ?? null;
      },
      update: async ({ where, data }: any) => {
        const notification = state.notifications.find((item) => item.id === where.id);

        if (!notification) {
          throw new Error('notification_not_found');
        }

        notification.readAt = data.readAt;
        return notification;
      }
    },
    auditLog: {
      create: async ({ data }: any) => {
        const auditLog = {
          id: data.id,
          tenantId: data.tenantId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          actorEmail: data.actorEmail,
          type: data.type,
          severity: data.severity,
          action: data.action,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          summary: data.summary,
          createdAt: new Date('2026-04-03T12:00:00.000Z')
        };

        state.auditLogs.unshift(auditLog);
        return auditLog;
      },
      findMany: async ({ where }: any) => {
        if (where.tenantId !== tenantId) {
          return [];
        }

        return state.auditLogs.slice(0, 50);
      }
    },
    $transaction: async (callback: any) => {
      const tx = {
        payment: {
          create: async ({ data }: any) => {
            const invoice = state.invoices.find((item) => item.id === data.invoiceId);

            if (!invoice) {
              throw new Error('invoice_not_found');
            }

            const payment = {
              id: data.id,
              tenantId: data.tenantId,
              invoiceId: data.invoiceId,
              reference: data.reference,
              status: data.status,
              method: data.method,
              amountCents: data.amountCents,
              receivedAt: data.receivedAt,
              notes: data.notes
            };

            state.payments.unshift(payment);
            invoice.payments.unshift(payment);

            return {
              ...payment,
              invoice: {
                id: invoice.id,
                reference: invoice.reference,
                status: invoice.status,
                totalCents: invoice.totalCents,
                payments: invoice.payments.map((entry: any) => ({
                  id: entry.id,
                  status: entry.status,
                  amountCents: entry.amountCents
                })),
                sale: {
                  id: sale.id,
                  reference: sale.reference,
                  title: sale.title
                },
                client
              }
            };
          }
        },
        invoice: {
          update: async ({ where, data }: any) => prisma.invoice.update({ where, data })
        }
      };

      return callback(tx);
    }
  };

  return prisma;
}

async function createManualAudit(prisma: any, action: string, resourceType: string, resourceId: string, summary: string) {
  await createAuditLog(prisma, tenantId, {
    actorUserId,
    actorName: 'Owner Demo',
    actorEmail,
    type: resourceType === 'reservation' ? 'reminder' : resourceType === 'invoice' || resourceType === 'payment' ? 'finance' : 'activity',
    severity: action === 'payment.create' || action === 'reservation.create' ? 'success' : 'info',
    action,
    resourceType,
    resourceId,
    summary
  });
}

describe('release-operable-v1 flow', () => {
  it('cubre factura, cobro, trabajo interno, reserva, analytics, reportes y trazabilidad operativa', async () => {
    const prisma = createFlowPrisma();

    const seedNotification = await createNotification(prisma as never, tenantId, {
      type: 'activity',
      severity: 'info',
      title: 'Tenant demo listo',
      message: 'El flujo demo queda listo para validacion operativa.',
      resourceType: 'tenant',
      resourceId: tenantId
    });

    const invoice = await createInvoiceFromSale(prisma as never, tenantId, {
      saleId: 'sale_demo',
      status: 'issued',
      dueDate: '2030-05-10',
      notes: 'Factura del contrato anual'
    });

    expect(invoice).not.toBeNull();
    expect(invoice?.status).toBe('issued');
    expect(invoice?.balanceCents).toBe(45000);
    expect(invoice?.sale.reference).toBe('SAL-20260403-DEMO0001');
    await createManualAudit(prisma, 'invoice.create', 'invoice', invoice!.id, 'Factura emitida desde la venta demo ganada.');

    const partialPayment = await createPayment(prisma as never, tenantId, {
      invoiceId: invoice!.id,
      status: 'confirmed',
      method: 'bank_transfer',
      amountCents: 20000,
      receivedAt: '2026-04-04T09:30:00.000Z',
      notes: 'Anticipo inicial'
    });

    expect(partialPayment).not.toBeNull();
    expect(partialPayment?.invoice.status).toBe('issued');
    expect(partialPayment?.invoice.balanceCents).toBe(25000);
    await createManualAudit(prisma, 'payment.create', 'payment', partialPayment!.id, 'Cobro parcial registrado sobre la factura demo.');

    const finalPayment = await createPayment(prisma as never, tenantId, {
      invoiceId: invoice!.id,
      status: 'confirmed',
      method: 'card',
      amountCents: 25000,
      receivedAt: '2026-04-06T12:00:00.000Z',
      notes: 'Liquidacion final'
    });

    expect(finalPayment).not.toBeNull();
    expect(finalPayment?.invoice.status).toBe('paid');
    expect(finalPayment?.invoice.balanceCents).toBe(0);
    await createManualAudit(prisma, 'payment.create', 'payment', finalPayment!.id, 'Cobro final registrado y factura cerrada.');

    const task = await createInternalTask(prisma as never, tenantId, actorUserId, {
      title: 'Coordinar arranque del servicio',
      description: 'Confirmar equipo y checklist con cliente',
      saleId: 'sale_demo',
      assigneeEmployeeId: 'employee_demo',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-04-08'
    });

    expect(task.kind).toBe('created');
    if (task.kind !== 'created') {
      throw new Error('task_not_created');
    }
    expect(task.task.sale?.client.fullName).toBe('Acme Servicios SL');
    await createManualAudit(prisma, 'internal_task.create', 'internal_task', task.task.id, 'Tarea interna creada enlazada a la venta demo.');

    const reservation = await createReservation(prisma as never, tenantId, actorUserId, {
      title: 'Visita de activacion',
      notes: 'Llevar checklist de onboarding',
      location: 'Cliente Acme',
      assigneeEmployeeId: 'employee_demo',
      internalTaskId: task.task.id,
      status: 'confirmed',
      startAt: '2026-04-09T09:00:00.000Z',
      endAt: '2026-04-09T10:00:00.000Z'
    });

    expect(reservation.kind).toBe('created');
    if (reservation.kind !== 'created') {
      throw new Error('reservation_not_created');
    }
    expect(reservation.reservation.internalTask?.taskCode).toBe(task.task.taskCode);
    expect(reservation.reservation.internalTask?.sale?.reference).toBe('SAL-20260403-DEMO0001');
    await createManualAudit(prisma, 'reservation.create', 'reservation', reservation.reservation.id, 'Reserva operativa creada desde la tarea interna.');

    const overlap = await createReservation(prisma as never, tenantId, actorUserId, {
      title: 'Intento solapado',
      assigneeEmployeeId: 'employee_demo',
      status: 'booked',
      startAt: '2026-04-09T09:30:00.000Z',
      endAt: '2026-04-09T10:30:00.000Z'
    });

    expect(overlap).toEqual({ kind: 'schedule_conflict' });

    const analytics = await getAnalyticsSnapshot(prisma as never, tenantId);
    expect(analytics.sales.wonCount).toBe(1);
    expect(analytics.billing.paidCount).toBe(1);
    expect(analytics.billing.outstandingCents).toBe(0);
    expect(analytics.payments.confirmedCount).toBe(2);
    expect(analytics.topClients[0]?.clientName).toBe('Acme Servicios SL');

    const reports = await getReportsBundle(prisma as never, tenantId);
    expect(reports.exports.find((item) => item.type === 'invoices')?.rows[0]?.estado).toBe('paid');
    expect(reports.exports.find((item) => item.type === 'payments')?.totalRows).toBe(2);

    const notifications = await listNotifications(prisma as never, tenantId);
    expect(notifications.totalCount).toBe(6);
    expect(notifications.unreadCount).toBe(6);
    expect(notifications.items.map((item) => item.resourceType)).toEqual(
      expect.arrayContaining(['tenant', 'invoice', 'payment', 'internal_task', 'reservation'])
    );
    expect(seedNotification.resourceType).toBe('tenant');

    const auditLogs = await listAuditLogs(prisma as never, tenantId);
    expect(auditLogs.totalCount).toBe(5);
    expect(auditLogs.items.map((item) => item.action)).toEqual([
      'reservation.create',
      'internal_task.create',
      'payment.create',
      'payment.create',
      'invoice.create'
    ]);
  });
});
