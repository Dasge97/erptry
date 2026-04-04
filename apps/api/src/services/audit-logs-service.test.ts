import { describe, expect, it, vi } from 'vitest';

import { createAuditLog, listAuditLogs } from './audit-logs-service.js';

describe('audit-logs-service', () => {
  it('construye un feed reciente de auditoria por tenant', async () => {
    const prisma = {
      auditLog: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'audit_1',
            tenantId: 'tenant_1',
            actorUserId: 'user_1',
            actorName: 'Owner Demo',
            actorEmail: 'owner@erptry.local',
            type: 'activity',
            severity: 'success',
            action: 'user.create',
            resourceType: 'user',
            resourceId: 'user_2',
            summary: 'Owner Demo ha creado el usuario Operaciones Demo.',
            createdAt: new Date('2026-04-03T11:00:00.000Z')
          }
        ])
      }
    } as never;

    const feed = await listAuditLogs(prisma, 'tenant_1');

    expect(feed.totalCount).toBe(1);
    expect(feed.items[0]?.action).toBe('user.create');
  });

  it('crea trazas persistidas reutilizando tipo y severidad del vocabulario existente', async () => {
    const prisma = {
      auditLog: {
        create: vi.fn().mockResolvedValue({
          id: 'audit_2',
          tenantId: 'tenant_1',
          actorUserId: 'user_1',
          actorName: 'Owner Demo',
          actorEmail: 'owner@erptry.local',
          type: 'finance',
          severity: 'warning',
          action: 'invoice.create',
          resourceType: 'invoice',
          resourceId: 'inv_1',
          summary: 'Owner Demo ha emitido la factura INV-2026-001.',
          createdAt: new Date('2026-04-03T11:05:00.000Z')
        })
      }
    } as never;

    const auditLog = await createAuditLog(prisma, 'tenant_1', {
      actorUserId: 'user_1',
      actorName: 'Owner Demo',
      actorEmail: 'owner@erptry.local',
      type: 'finance',
      severity: 'warning',
      action: 'invoice.create',
      resourceType: 'invoice',
      resourceId: 'inv_1',
      summary: 'Owner Demo ha emitido la factura INV-2026-001.'
    });

    expect(auditLog.resourceType).toBe('invoice');
    expect(auditLog.severity).toBe('warning');
  });
});
