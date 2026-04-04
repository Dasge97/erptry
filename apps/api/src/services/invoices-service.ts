import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { invoiceSummarySchema } from '@erptry/contracts';

import { createNotification } from './notifications-service.js';

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

async function fetchInvoice(prisma: PrismaClient, tenantId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId
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
}

function getConfirmedPaidCents(payments: Array<{ status: 'pending' | 'confirmed' | 'failed'; amountCents: number }>) {
  return payments.reduce((total, payment) => total + (payment.status === 'confirmed' ? payment.amountCents : 0), 0);
}

function getDerivedInvoiceStatus(totalCents: number, payments: Array<{ status: 'pending' | 'confirmed' | 'failed'; amountCents: number }>) {
  return getConfirmedPaidCents(payments) >= totalCents ? 'paid' : 'issued';
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

export async function updateInvoice(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    id: string;
    dueDate: string;
    notes?: string | undefined;
    status: 'draft' | 'issued' | 'paid' | 'void';
  }
) {
  const existingInvoice = await fetchInvoice(prisma, tenantId, input.id);

  if (!existingInvoice) {
    return { kind: 'not_found' as const };
  }

  const dueDate = new Date(`${input.dueDate}T00:00:00.000Z`);

  if (Number.isNaN(dueDate.getTime())) {
    return { kind: 'invalid_relations' as const };
  }

  const confirmedPaidCents = getConfirmedPaidCents(existingInvoice.payments);
  const requestedVoid = input.status === 'void';

  if (requestedVoid && confirmedPaidCents > 0) {
    return { kind: 'payments_locked' as const };
  }

  const nextStatus = requestedVoid ? 'void' : getDerivedInvoiceStatus(existingInvoice.totalCents, existingInvoice.payments);

  const invoice = await prisma.invoice.update({
    where: { id: existingInvoice.id },
    data: {
      dueDate,
      notes: input.notes?.trim() || null,
      status: nextStatus
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

  return {
    kind: 'updated' as const,
    invoice: mapInvoiceSummary(invoice)
  };
}

export async function deleteInvoice(prisma: PrismaClient, tenantId: string, invoiceId: string) {
  const invoice = await fetchInvoice(prisma, tenantId, invoiceId);

  if (!invoice) {
    return { kind: 'not_found' as const };
  }

  if (invoice.payments.length > 0) {
    return { kind: 'payments_locked' as const };
  }

  await prisma.invoice.delete({
    where: { id: invoice.id }
  });

  return {
    kind: 'deleted' as const,
    invoice: mapInvoiceSummary(invoice)
  };
}
