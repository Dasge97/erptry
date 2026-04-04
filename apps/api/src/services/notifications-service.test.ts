import { describe, expect, it, vi } from 'vitest';

import { createNotification, listNotifications, markNotificationRead } from './notifications-service.js';

describe('notifications-service', () => {
  it('construye una bandeja con contadores de leidos y pendientes', async () => {
    const prisma = {
      notification: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'notif_1',
            tenantId: 'tenant_1',
            type: 'finance',
            severity: 'warning',
            title: 'Factura pendiente',
            message: 'INV-1 mantiene saldo abierto.',
            resourceType: 'invoice',
            resourceId: 'inv_1',
            readAt: null,
            createdAt: new Date('2026-04-03T12:00:00.000Z')
          },
          {
            id: 'notif_2',
            tenantId: 'tenant_1',
            type: 'activity',
            severity: 'info',
            title: 'Nueva tarea',
            message: 'TASK-1 asignada a operaciones.',
            resourceType: 'internal_task',
            resourceId: 'task_1',
            readAt: new Date('2026-04-03T12:05:00.000Z'),
            createdAt: new Date('2026-04-03T11:00:00.000Z')
          }
        ])
      }
    } as never;

    const inbox = await listNotifications(prisma, 'tenant_1');

    expect(inbox.totalCount).toBe(2);
    expect(inbox.unreadCount).toBe(1);
    expect(inbox.items[0]?.title).toBe('Factura pendiente');
  });

  it('marca un aviso como leido dentro del tenant actual', async () => {
    const prisma = {
      notification: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'notif_1',
          tenantId: 'tenant_1',
          type: 'alert',
          severity: 'critical',
          title: 'Conflicto operativo',
          message: 'Reserva solapada detectada.',
          resourceType: 'reservation',
          resourceId: 'res_1',
          readAt: null,
          createdAt: new Date('2026-04-03T10:00:00.000Z')
        }),
        update: vi.fn().mockResolvedValue({
          id: 'notif_1',
          tenantId: 'tenant_1',
          type: 'alert',
          severity: 'critical',
          title: 'Conflicto operativo',
          message: 'Reserva solapada detectada.',
          resourceType: 'reservation',
          resourceId: 'res_1',
          readAt: new Date('2026-04-03T10:05:00.000Z'),
          createdAt: new Date('2026-04-03T10:00:00.000Z')
        })
      }
    } as never;

    const notification = await markNotificationRead(prisma, 'tenant_1', 'notif_1');

    expect(notification?.readAt).toBe('2026-04-03T10:05:00.000Z');
  });

  it('crea avisos internos con metadatos de recurso opcionales', async () => {
    const prisma = {
      notification: {
        create: vi.fn().mockResolvedValue({
          id: 'notif_1',
          tenantId: 'tenant_1',
          type: 'activity',
          severity: 'success',
          title: 'Cobro confirmado',
          message: 'PAY-1 se ha conciliado correctamente.',
          resourceType: 'payment',
          resourceId: 'pay_1',
          readAt: null,
          createdAt: new Date('2026-04-03T13:00:00.000Z')
        })
      }
    } as never;

    const notification = await createNotification(prisma, 'tenant_1', {
      type: 'activity',
      severity: 'success',
      title: 'Cobro confirmado',
      message: 'PAY-1 se ha conciliado correctamente.',
      resourceType: 'payment',
      resourceId: 'pay_1'
    });

    expect(notification.resourceType).toBe('payment');
    expect(notification.severity).toBe('success');
  });
});
