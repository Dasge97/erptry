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

import { getAnalyticsSnapshot } from './analytics-service.js';
import { listInvoices } from './invoices-service.js';
import { listPayments } from './payments-service.js';
import { listSales } from './sales-service.js';

describe('getAnalyticsSnapshot', () => {
  beforeEach(() => {
    vi.mocked(listSales).mockReset();
    vi.mocked(listInvoices).mockReset();
    vi.mocked(listPayments).mockReset();
  });

  it('agrega KPIs comerciales desde ventas, facturas y cobros persistidos', async () => {
    vi.mocked(listSales).mockResolvedValue([
      {
        id: 'sale_1',
        tenantId: 'tenant_1',
        reference: 'SAL-1',
        title: 'Propuesta Acme',
        stage: 'sent',
        totalCents: 30000,
        notes: null,
        client: { id: 'client_1', fullName: 'Acme SL', email: 'acme@test.dev' },
        lines: []
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
      },
      {
        id: 'sale_3',
        tenantId: 'tenant_1',
        reference: 'SAL-3',
        title: 'Oferta Gamma',
        stage: 'lost',
        totalCents: 12000,
        notes: null,
        client: { id: 'client_1', fullName: 'Acme SL', email: 'acme@test.dev' },
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
        dueDate: '2026-03-20',
        issuedAt: '2026-03-01T12:00:00.000Z',
        subtotalCents: 45000,
        totalCents: 45000,
        paidCents: 25000,
        balanceCents: 20000,
        notes: null,
        sale: { id: 'sale_2', reference: 'SAL-2', title: 'Renovacion Beta', stage: 'won' },
        client: { id: 'client_2', fullName: 'Beta SA', email: null },
        lines: [],
        payments: []
      },
      {
        id: 'inv_2',
        tenantId: 'tenant_1',
        saleId: 'sale_1',
        reference: 'INV-2',
        status: 'paid',
        dueDate: '2026-04-15',
        issuedAt: '2026-04-01T12:00:00.000Z',
        subtotalCents: 30000,
        totalCents: 30000,
        paidCents: 30000,
        balanceCents: 0,
        notes: null,
        sale: { id: 'sale_1', reference: 'SAL-1', title: 'Propuesta Acme', stage: 'sent' },
        client: { id: 'client_1', fullName: 'Acme SL', email: 'acme@test.dev' },
        lines: [],
        payments: []
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
        receivedAt: '2026-03-10T12:00:00.000Z',
        notes: null,
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
      },
      {
        id: 'pay_2',
        tenantId: 'tenant_1',
        invoiceId: 'inv_2',
        reference: 'PAY-2',
        status: 'pending',
        method: 'card',
        amountCents: 30000,
        receivedAt: '2026-04-02T12:00:00.000Z',
        notes: null,
        invoice: {
          id: 'inv_2',
          reference: 'INV-2',
          status: 'paid',
          totalCents: 30000,
          paidCents: 30000,
          balanceCents: 0,
          sale: { id: 'sale_1', reference: 'SAL-1', title: 'Propuesta Acme' },
          client: { id: 'client_1', fullName: 'Acme SL', email: 'acme@test.dev' }
        }
      }
    ]);

    const snapshot = await getAnalyticsSnapshot({} as never, 'tenant_1');

    expect(snapshot.sales.totalCount).toBe(3);
    expect(snapshot.sales.pipelineCents).toBe(30000);
    expect(snapshot.sales.wonRevenueCents).toBe(45000);
    expect(snapshot.billing.billedCents).toBe(75000);
    expect(snapshot.billing.collectedCents).toBe(55000);
    expect(snapshot.billing.outstandingCents).toBe(20000);
    expect(snapshot.billing.overdueCount).toBe(1);
    expect(snapshot.payments.confirmedCents).toBe(25000);
    expect(snapshot.payments.pendingCents).toBe(30000);
    expect(snapshot.salesByStage.find((item) => item.stage === 'won')?.count).toBe(1);
    expect(snapshot.topClients[0]).toMatchObject({
      clientId: 'client_1',
      clientName: 'Acme SL',
      salesCount: 2,
      salesCents: 42000,
      collectedCents: 30000
    });
  });
});
