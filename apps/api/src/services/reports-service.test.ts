import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./sales-service', () => ({
  listSales: vi.fn()
}));

vi.mock('./invoices-service', () => ({
  listInvoices: vi.fn()
}));

vi.mock('./payments-service', () => ({
  listPayments: vi.fn()
}));

vi.mock('./analytics-service', () => ({
  getAnalyticsSnapshot: vi.fn()
}));

import { getAnalyticsSnapshot } from './analytics-service.js';
import { listInvoices } from './invoices-service.js';
import { listPayments } from './payments-service.js';
import { getReportsBundle } from './reports-service.js';
import { listSales } from './sales-service.js';

describe('getReportsBundle', () => {
  beforeEach(() => {
    vi.mocked(getAnalyticsSnapshot).mockReset();
    vi.mocked(listSales).mockReset();
    vi.mocked(listInvoices).mockReset();
    vi.mocked(listPayments).mockReset();
  });

  it('genera exportables CSV minimos desde ventas, facturas y cobros persistidos', async () => {
    vi.mocked(getAnalyticsSnapshot).mockResolvedValue({
      generatedAt: '2026-04-03T10:00:00.000Z',
      sales: {
        totalCount: 2,
        openCount: 1,
        wonCount: 1,
        lostCount: 0,
        pipelineCents: 30000,
        wonRevenueCents: 45000,
        averageTicketCents: 37500
      },
      billing: {
        totalCount: 1,
        issuedCount: 1,
        paidCount: 0,
        overdueCount: 0,
        billedCents: 45000,
        collectedCents: 25000,
        outstandingCents: 20000,
        collectionRate: 0.5556
      },
      payments: {
        totalCount: 1,
        confirmedCount: 1,
        pendingCount: 0,
        failedCount: 0,
        confirmedCents: 25000,
        pendingCents: 0,
        failedCents: 0,
        lastReceivedAt: '2026-04-02T12:00:00.000Z'
      },
      salesByStage: [],
      topClients: []
    });

    vi.mocked(listSales).mockResolvedValue([
      {
        id: 'sale_1',
        tenantId: 'tenant_1',
        reference: 'SAL-1',
        title: 'Proyecto Acme',
        stage: 'sent',
        totalCents: 30000,
        notes: 'Seguimiento semanal',
        client: { id: 'client_1', fullName: 'Acme SL', email: 'acme@test.dev' },
        lines: [
          {
            id: 'line_1',
            catalogItemId: 'catalog_1',
            catalogItemName: 'Consultoria',
            kind: 'service',
            quantity: 1,
            unitPriceCents: 30000,
            lineTotalCents: 30000
          }
        ]
      },
      {
        id: 'sale_2',
        tenantId: 'tenant_1',
        reference: 'SAL-2',
        title: 'Renovacion Beta',
        stage: 'won',
        totalCents: 45000,
        notes: null,
        client: { id: 'client_2', fullName: 'Beta SA', email: null },
        lines: []
      }
    ]);

    vi.mocked(listInvoices).mockResolvedValue([
      {
        id: 'inv_1',
        tenantId: 'tenant_1',
        saleId: 'sale_2',
        reference: 'INV-1',
        status: 'issued',
        dueDate: '2026-04-10',
        issuedAt: '2026-04-01T12:00:00.000Z',
        subtotalCents: 45000,
        totalCents: 45000,
        paidCents: 25000,
        balanceCents: 20000,
        notes: null,
        sale: { id: 'sale_2', reference: 'SAL-2', title: 'Renovacion Beta', stage: 'won' },
        client: { id: 'client_2', fullName: 'Beta SA', email: null },
        lines: [],
        payments: [
          {
            id: 'pay_1',
            reference: 'PAY-1',
            status: 'confirmed',
            method: 'bank_transfer',
            amountCents: 25000,
            receivedAt: '2026-04-02T12:00:00.000Z',
            notes: null
          }
        ]
      }
    ]);

    vi.mocked(listPayments).mockResolvedValue([
      {
        id: 'pay_1',
        tenantId: 'tenant_1',
        invoiceId: 'inv_1',
        reference: 'PAY-1',
        status: 'confirmed',
        method: 'bank_transfer',
        amountCents: 25000,
        receivedAt: '2026-04-02T12:00:00.000Z',
        notes: 'Transferencia recibida',
        invoice: {
          id: 'inv_1',
          reference: 'INV-1',
          status: 'issued',
          totalCents: 45000,
          paidCents: 25000,
          balanceCents: 20000,
          sale: { id: 'sale_2', reference: 'SAL-2', title: 'Renovacion Beta' },
          client: { id: 'client_2', fullName: 'Beta SA', email: null }
        }
      }
    ]);

    const bundle = await getReportsBundle({} as never, 'tenant_1');

    expect(bundle.analyticsGeneratedAt).toBe('2026-04-03T10:00:00.000Z');
    expect(bundle.exports).toHaveLength(3);
    expect(bundle.exports[0]).toMatchObject({
      type: 'sales',
      totalRows: 2,
      totalAmountCents: 75000
    });
    expect(bundle.exports[1]?.csvContent).toContain('INV-1,SAL-2,Beta SA,issued');
    expect(bundle.exports[2]?.csvContent).toContain('PAY-1,INV-1,SAL-2,Beta SA,confirmed,bank_transfer,250.00,2026-04-02,200.00,Transferencia recibida');
  });
});
