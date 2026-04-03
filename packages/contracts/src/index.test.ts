import { describe, expect, it } from 'vitest';

import { analyticsSnapshotSchema, auditLogsFeedSchema, notificationsInboxSchema, platformSnapshotSchema, reportsBundleSchema } from './index';

describe('platformSnapshotSchema', () => {
  it('acepta una instantanea valida', () => {
    const parsed = platformSnapshotSchema.parse({
      tenant: {
        id: 'tenant_erptry',
        slug: 'erptry',
        name: 'ERPTRY Demo',
        plan: 'growth'
      },
      users: [
        {
          id: 'user_owner',
          email: 'owner@erptry.local',
          fullName: 'Owner Demo',
          role: 'owner',
          tenantId: 'tenant_erptry'
        }
      ],
      capabilities: ['auth', 'multi-tenant'],
      phase: 'bootstrap'
    });

    expect(parsed.tenant.slug).toBe('erptry');
  });
});

describe('analyticsSnapshotSchema', () => {
  it('acepta un dashboard comercial minimo valido', () => {
    const parsed = analyticsSnapshotSchema.parse({
      generatedAt: '2026-04-03T10:00:00.000Z',
      sales: {
        totalCount: 4,
        openCount: 2,
        wonCount: 1,
        lostCount: 1,
        pipelineCents: 45000,
        wonRevenueCents: 18000,
        averageTicketCents: 15750
      },
      billing: {
        totalCount: 2,
        issuedCount: 1,
        paidCount: 1,
        overdueCount: 0,
        billedCents: 36000,
        collectedCents: 21000,
        outstandingCents: 15000,
        collectionRate: 0.5833
      },
      payments: {
        totalCount: 2,
        confirmedCount: 1,
        pendingCount: 1,
        failedCount: 0,
        confirmedCents: 21000,
        pendingCents: 15000,
        failedCents: 0,
        lastReceivedAt: '2026-04-02T12:00:00.000Z'
      },
      salesByStage: [
        { stage: 'draft', count: 1, totalCents: 12000 },
        { stage: 'sent', count: 1, totalCents: 33000 },
        { stage: 'won', count: 1, totalCents: 18000 },
        { stage: 'lost', count: 1, totalCents: 0 }
      ],
      topClients: [
        {
          clientId: 'client_1',
          clientName: 'Acme SL',
          salesCount: 2,
          salesCents: 33000,
          invoicedCents: 18000,
          collectedCents: 12000,
          outstandingCents: 6000
        }
      ]
    });

    expect(parsed.topClients[0]?.clientName).toBe('Acme SL');
  });
});

describe('reportsBundleSchema', () => {
  it('acepta exportables minimos validos para ventas, facturas y cobros', () => {
    const parsed = reportsBundleSchema.parse({
      generatedAt: '2026-04-03T10:30:00.000Z',
      analyticsGeneratedAt: '2026-04-03T10:00:00.000Z',
      exports: [
        {
          type: 'sales',
          title: 'Ventas',
          description: 'Embudo comercial exportable',
          fileName: 'ventas.csv',
          generatedAt: '2026-04-03T10:30:00.000Z',
          totalRows: 2,
          totalAmountCents: 63000,
          summary: '1 ganada y 1 abierta',
          columns: ['referencia', 'cliente', 'estado', 'total_eur'],
          rows: [
            {
              referencia: 'SAL-1',
              cliente: 'Acme SL',
              estado: 'won',
              total_eur: '450.00'
            }
          ],
          csvContent: 'referencia,cliente,estado,total_eur\nSAL-1,Acme SL,won,450.00'
        }
      ]
    });

    expect(parsed.exports[0]?.type).toBe('sales');
  });
});

describe('notificationsInboxSchema', () => {
  it('acepta una bandeja de avisos internos por tenant', () => {
    const parsed = notificationsInboxSchema.parse({
      generatedAt: '2026-04-03T11:00:00.000Z',
      totalCount: 2,
      unreadCount: 1,
      items: [
        {
          id: 'notif_1',
          tenantId: 'tenant_erptry',
          type: 'finance',
          severity: 'warning',
          title: 'Factura vencida',
          message: 'INV-2026-001 sigue pendiente de cobro.',
          resourceType: 'invoice',
          resourceId: 'inv_1',
          readAt: null,
          createdAt: '2026-04-03T10:59:00.000Z'
        }
      ]
    });

    expect(parsed.unreadCount).toBe(1);
  });
});

describe('auditLogsFeedSchema', () => {
  it('acepta un feed minimo de auditoria por tenant', () => {
    const parsed = auditLogsFeedSchema.parse({
      generatedAt: '2026-04-03T11:05:00.000Z',
      totalCount: 1,
      items: [
        {
          id: 'audit_1',
          tenantId: 'tenant_erptry',
          actorUserId: 'user_owner',
          actorName: 'Owner Demo',
          actorEmail: 'owner@erptry.local',
          type: 'activity',
          severity: 'success',
          action: 'user.create',
          resourceType: 'user',
          resourceId: 'user_ops',
          summary: 'Owner Demo ha creado el usuario Operaciones Demo.',
          createdAt: '2026-04-03T11:04:00.000Z'
        }
      ]
    });

    expect(parsed.items[0]?.action).toBe('user.create');
  });
});
