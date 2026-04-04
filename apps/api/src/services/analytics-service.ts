import type { PrismaClient } from '@prisma/client';

import { analyticsSnapshotSchema, type InvoiceSummary, type PaymentSummary, type SaleSummary } from '@erptry/contracts';

import { listInvoices } from './invoices-service.js';
import { listPayments } from './payments-service.js';
import { listSales } from './sales-service.js';

const stageOrder: Array<SaleSummary['stage']> = ['draft', 'sent', 'won', 'lost'];

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getCollectionRate(billedCents: number, collectedCents: number) {
  if (billedCents === 0) {
    return 0;
  }

  return Number((collectedCents / billedCents).toFixed(4));
}

function isOverdueInvoice(invoice: InvoiceSummary, now: Date) {
  return invoice.status === 'issued' && invoice.balanceCents > 0 && new Date(`${invoice.dueDate}T23:59:59.999Z`) < now;
}

function getLastReceivedAt(payments: PaymentSummary[]) {
  const latest = payments.reduce<Date | null>((current, payment) => {
    const receivedAt = new Date(payment.receivedAt);

    if (Number.isNaN(receivedAt.getTime())) {
      return current;
    }

    if (!current || receivedAt > current) {
      return receivedAt;
    }

    return current;
  }, null);

  return latest?.toISOString() ?? null;
}

export async function getAnalyticsSnapshot(prisma: PrismaClient, tenantId: string) {
  const [sales, invoices, payments] = await Promise.all([
    listSales(prisma, tenantId),
    listInvoices(prisma, tenantId),
    listPayments(prisma, tenantId)
  ]);

  const now = new Date();
  const billedCents = sum(invoices.map((invoice) => invoice.totalCents));
  const collectedCents = sum(invoices.map((invoice) => invoice.paidCents));
  const outstandingCents = sum(invoices.map((invoice) => invoice.balanceCents));

  const clients = new Map<string, {
    clientId: string;
    clientName: string;
    salesCount: number;
    salesCents: number;
    invoicedCents: number;
    collectedCents: number;
    outstandingCents: number;
  }>();

  for (const sale of sales) {
    const entry = clients.get(sale.client.id) ?? {
      clientId: sale.client.id,
      clientName: sale.client.fullName,
      salesCount: 0,
      salesCents: 0,
      invoicedCents: 0,
      collectedCents: 0,
      outstandingCents: 0
    };

    entry.salesCount += 1;
    entry.salesCents += sale.totalCents;
    clients.set(sale.client.id, entry);
  }

  for (const invoice of invoices) {
    const entry = clients.get(invoice.client.id) ?? {
      clientId: invoice.client.id,
      clientName: invoice.client.fullName,
      salesCount: 0,
      salesCents: 0,
      invoicedCents: 0,
      collectedCents: 0,
      outstandingCents: 0
    };

    entry.invoicedCents += invoice.totalCents;
    entry.collectedCents += invoice.paidCents;
    entry.outstandingCents += invoice.balanceCents;
    clients.set(invoice.client.id, entry);
  }

  return analyticsSnapshotSchema.parse({
    generatedAt: now.toISOString(),
    sales: {
      totalCount: sales.length,
      openCount: sales.filter((sale) => sale.stage === 'draft' || sale.stage === 'sent').length,
      wonCount: sales.filter((sale) => sale.stage === 'won').length,
      lostCount: sales.filter((sale) => sale.stage === 'lost').length,
      pipelineCents: sum(sales.filter((sale) => sale.stage === 'draft' || sale.stage === 'sent').map((sale) => sale.totalCents)),
      wonRevenueCents: sum(sales.filter((sale) => sale.stage === 'won').map((sale) => sale.totalCents)),
      averageTicketCents: sales.length === 0 ? 0 : Math.round(sum(sales.map((sale) => sale.totalCents)) / sales.length)
    },
    billing: {
      totalCount: invoices.length,
      issuedCount: invoices.filter((invoice) => invoice.status === 'issued').length,
      paidCount: invoices.filter((invoice) => invoice.status === 'paid').length,
      overdueCount: invoices.filter((invoice) => isOverdueInvoice(invoice, now)).length,
      billedCents,
      collectedCents,
      outstandingCents,
      collectionRate: getCollectionRate(billedCents, collectedCents)
    },
    payments: {
      totalCount: payments.length,
      confirmedCount: payments.filter((payment) => payment.status === 'confirmed').length,
      pendingCount: payments.filter((payment) => payment.status === 'pending').length,
      failedCount: payments.filter((payment) => payment.status === 'failed').length,
      confirmedCents: sum(payments.filter((payment) => payment.status === 'confirmed').map((payment) => payment.amountCents)),
      pendingCents: sum(payments.filter((payment) => payment.status === 'pending').map((payment) => payment.amountCents)),
      failedCents: sum(payments.filter((payment) => payment.status === 'failed').map((payment) => payment.amountCents)),
      lastReceivedAt: getLastReceivedAt(payments)
    },
    salesByStage: stageOrder.map((stage) => ({
      stage,
      count: sales.filter((sale) => sale.stage === stage).length,
      totalCents: sum(sales.filter((sale) => sale.stage === stage).map((sale) => sale.totalCents))
    })),
    topClients: Array.from(clients.values())
      .sort((left, right) => {
        if (right.collectedCents !== left.collectedCents) {
          return right.collectedCents - left.collectedCents;
        }

        if (right.invoicedCents !== left.invoicedCents) {
          return right.invoicedCents - left.invoicedCents;
        }

        return right.salesCents - left.salesCents;
      })
      .slice(0, 5)
  });
}
