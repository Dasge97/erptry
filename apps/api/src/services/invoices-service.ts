import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { invoiceSummarySchema } from '@erptry/contracts';

import { createNotification } from './notifications-service';

function createInvoiceReference() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomUUID().slice(0, 8).toUpperCase();

  return `INV-${stamp}-${suffix}`;
}

function mapInvoiceSummary(invoice: {
  id: string;
  tenantId: string;
  saleId: string;
  reference: string;
  status: 'draft' | 'issued' | 'paid' | 'void';
  dueDate: Date;
  issuedAt: Date;
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  payments: Array<{
    id: string;
    reference: string;
    status: 'pending' | 'confirmed' | 'failed';
    method: 'cash' | 'card' | 'bank_transfer';
    amountCents: number;
    receivedAt: Date;
    notes: string | null;
  }>;
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
}) {
  const paidCents = invoice.payments
    .filter((payment) => payment.status === 'confirmed')
    .reduce((total, payment) => total + payment.amountCents, 0);
  const balanceCents = Math.max(invoice.totalCents - paidCents, 0);

  return invoiceSummarySchema.parse({
    id: invoice.id,
    tenantId: invoice.tenantId,
    saleId: invoice.saleId,
    reference: invoice.reference,
    status: invoice.status,
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    issuedAt: invoice.issuedAt.toISOString(),
    subtotalCents: invoice.subtotalCents,
    totalCents: invoice.totalCents,
    paidCents,
    balanceCents,
    notes: invoice.notes,
    sale: invoice.sale,
    client: invoice.client,
    lines: invoice.lines,
    payments: invoice.payments.map((payment) => ({
      id: payment.id,
      reference: payment.reference,
      status: payment.status,
      method: payment.method,
      amountCents: payment.amountCents,
      receivedAt: payment.receivedAt.toISOString(),
      notes: payment.notes
    }))
  });
}

export async function listInvoices(prisma: PrismaClient, tenantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { issuedAt: 'desc' },
    include: {
      sale: true,
      client: true,
      lines: {
        orderBy: { id: 'asc' }
      },
      payments: {
        orderBy: { receivedAt: 'desc' }
      }
    }
  });

  return invoices.map(mapInvoiceSummary);
}

export async function createInvoiceFromSale(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    saleId: string;
    status: 'issued';
    dueDate: string;
    notes?: string | undefined;
  }
) {
  const sale = await prisma.sale.findFirst({
    where: {
      id: input.saleId,
      tenantId,
      stage: 'won',
      invoice: null
    },
    include: {
      client: true,
      lines: {
        include: {
          catalogItem: true
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!sale || sale.lines.length === 0) {
    return null;
  }

  const issueDate = new Date();
  const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);

  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const invoiceLines = sale.lines.map((line: (typeof sale.lines)[number]) => ({
    id: randomUUID(),
    catalogItemId: line.catalogItemId,
    description: line.catalogItem.name,
    kind: line.catalogItem.kind,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents
  }));

  const subtotalCents = invoiceLines.reduce((total: number, line: (typeof invoiceLines)[number]) => total + line.lineTotalCents, 0);

  const createdInvoice = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      tenantId,
      saleId: sale.id,
      clientId: sale.clientId,
      reference: createInvoiceReference(),
      status: input.status,
      dueDate,
      issuedAt: issueDate,
      subtotalCents,
      totalCents: subtotalCents,
      notes: input.notes?.trim() || sale.notes || null,
      lines: {
        create: invoiceLines
      }
    },
    include: {
      sale: true,
      client: true,
      lines: {
        orderBy: { id: 'asc' }
      },
      payments: {
        orderBy: { receivedAt: 'desc' }
      }
    }
  });

  const summary = mapInvoiceSummary(createdInvoice);

  await createNotification(prisma, tenantId, {
    type: 'finance',
    severity: 'warning',
    title: `Factura ${summary.reference} registrada`,
    message: `${summary.client.fullName} queda con ${summary.balanceCents === 0 ? 'saldo cerrado' : `saldo pendiente de ${(summary.balanceCents / 100).toFixed(2)} EUR`}.`,
    resourceType: 'invoice',
    resourceId: summary.id
  });

  return summary;
}
