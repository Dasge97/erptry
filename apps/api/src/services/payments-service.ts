import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { paymentSummarySchema } from '@erptry/contracts';

import { createNotification } from './notifications-service.js';

function createPaymentReference() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomUUID().slice(0, 8).toUpperCase();

  return `PAY-${stamp}-${suffix}`;
}

function getConfirmedPaidCents(payments: Array<{ status: 'pending' | 'confirmed' | 'failed'; amountCents: number }>) {
  return payments.reduce((total, payment) => total + (payment.status === 'confirmed' ? payment.amountCents : 0), 0);
}

function getInvoiceStatus(totalCents: number, payments: Array<{ status: 'pending' | 'confirmed' | 'failed'; amountCents: number }>) {
  return getConfirmedPaidCents(payments) >= totalCents ? 'paid' : 'issued';
}

function mapPaymentSummary(payment: {
  id: string;
  tenantId: string;
  invoiceId: string;
  reference: string;
  status: 'pending' | 'confirmed' | 'failed';
  method: 'cash' | 'card' | 'bank_transfer';
  amountCents: number;
  receivedAt: Date;
  notes: string | null;
  invoice: {
    id: string;
    reference: string;
    status: 'draft' | 'issued' | 'paid' | 'void';
    totalCents: number;
    payments: Array<{
      id: string;
      status: 'pending' | 'confirmed' | 'failed';
      amountCents: number;
    }>;
    sale: {
      id: string;
      reference: string;
      title: string;
    };
    client: {
      id: string;
      fullName: string;
      email: string | null;
    };
  };
}) {
  const paidCents = getConfirmedPaidCents(payment.invoice.payments);
  const balanceCents = Math.max(payment.invoice.totalCents - paidCents, 0);

  return paymentSummarySchema.parse({
    id: payment.id,
    tenantId: payment.tenantId,
    invoiceId: payment.invoiceId,
    reference: payment.reference,
    status: payment.status,
    method: payment.method,
    amountCents: payment.amountCents,
    receivedAt: payment.receivedAt.toISOString(),
    notes: payment.notes,
    invoice: {
      id: payment.invoice.id,
      reference: payment.invoice.reference,
      status: payment.invoice.status,
      totalCents: payment.invoice.totalCents,
      paidCents,
      balanceCents,
      sale: payment.invoice.sale,
      client: payment.invoice.client
    }
  });
}

async function fetchPayment(prisma: PrismaClient, tenantId: string, paymentId: string) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      tenantId
    },
    include: {
      invoice: {
        include: {
          sale: true,
          client: true,
          payments: {
            select: {
              id: true,
              status: true,
              amountCents: true
            }
          }
        }
      }
    }
  });
}

export async function listPayments(prisma: PrismaClient, tenantId: string) {
  const payments = await prisma.payment.findMany({
    where: { tenantId },
    orderBy: { receivedAt: 'desc' },
    include: {
      invoice: {
        include: {
          sale: true,
          client: true,
          payments: {
            select: {
              id: true,
              status: true,
              amountCents: true
            }
          }
        }
      }
    }
  });

  return payments.map(mapPaymentSummary);
}

export async function createPayment(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    invoiceId: string;
    status: 'pending' | 'confirmed' | 'failed';
    method: 'cash' | 'card' | 'bank_transfer';
    amountCents: number;
    receivedAt: string;
    notes?: string | undefined;
  }
) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: input.invoiceId,
      tenantId,
      status: 'issued'
    },
    include: {
      sale: true,
      client: true,
      payments: {
        select: {
          id: true,
          status: true,
          amountCents: true
        }
      }
    }
  });

  if (!invoice) {
    return null;
  }

  const receivedAt = new Date(input.receivedAt);

  if (Number.isNaN(receivedAt.getTime())) {
    return null;
  }

  const paidCentsBefore = getConfirmedPaidCents(invoice.payments);
  const remainingCents = Math.max(invoice.totalCents - paidCentsBefore, 0);

  if (remainingCents === 0 || input.amountCents > remainingCents) {
    return null;
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        id: randomUUID(),
        tenantId,
        invoiceId: invoice.id,
        reference: createPaymentReference(),
        status: input.status,
        method: input.method,
        amountCents: input.amountCents,
        receivedAt,
        notes: input.notes?.trim() || null
      },
      include: {
        invoice: {
          include: {
            sale: true,
            client: true,
            payments: {
              select: {
                id: true,
                status: true,
                amountCents: true
              }
            }
          }
        }
      }
    });

    const nextInvoiceStatus = getInvoiceStatus(createdPayment.invoice.totalCents, createdPayment.invoice.payments);

    if (createdPayment.invoice.status !== nextInvoiceStatus) {
      await tx.invoice.update({
        where: { id: createdPayment.invoice.id },
        data: { status: nextInvoiceStatus }
      });

      createdPayment.invoice.status = nextInvoiceStatus;
    }

    return createdPayment;
  });

  const summary = mapPaymentSummary(payment);

  await createNotification(prisma, tenantId, {
    type: 'finance',
    severity: summary.status === 'confirmed' ? 'success' : summary.status === 'pending' ? 'warning' : 'critical',
    title: `Cobro ${summary.reference} registrado`,
    message: `${summary.invoice.client.fullName} aporta ${(summary.amountCents / 100).toFixed(2)} EUR via ${summary.method}.`,
    resourceType: 'payment',
    resourceId: summary.id
  });

  return summary;
}

export async function updatePayment(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    id: string;
    invoiceId: string;
    status: 'pending' | 'confirmed' | 'failed';
    method: 'cash' | 'card' | 'bank_transfer';
    amountCents: number;
    receivedAt: string;
    notes?: string | undefined;
  }
) {
  const existingPayment = await fetchPayment(prisma, tenantId, input.id);

  if (!existingPayment) {
    return { kind: 'not_found' as const };
  }

  if (existingPayment.invoiceId !== input.invoiceId) {
    return { kind: 'invoice_locked' as const };
  }

  if (existingPayment.invoice.status === 'void') {
    return { kind: 'invoice_locked' as const };
  }

  const receivedAt = new Date(input.receivedAt);

  if (Number.isNaN(receivedAt.getTime())) {
    return { kind: 'invalid_relations' as const };
  }

  const paymentsWithoutCurrent = existingPayment.invoice.payments.filter((payment) => payment.id !== existingPayment.id);
  const remainingCents = Math.max(existingPayment.invoice.totalCents - getConfirmedPaidCents(paymentsWithoutCurrent), 0);

  if (input.amountCents > remainingCents) {
    return { kind: 'invalid_relations' as const };
  }

  const payment = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: input.status,
        method: input.method,
        amountCents: input.amountCents,
        receivedAt,
        notes: input.notes?.trim() || null
      },
      include: {
        invoice: {
          include: {
            sale: true,
            client: true,
            payments: {
              select: {
                id: true,
                status: true,
                amountCents: true
              }
            }
          }
        }
      }
    });

    const nextInvoiceStatus = getInvoiceStatus(updatedPayment.invoice.totalCents, updatedPayment.invoice.payments);

    if (updatedPayment.invoice.status !== nextInvoiceStatus) {
      await tx.invoice.update({
        where: { id: updatedPayment.invoice.id },
        data: { status: nextInvoiceStatus }
      });

      updatedPayment.invoice.status = nextInvoiceStatus;
    }

    return updatedPayment;
  });

  return {
    kind: 'updated' as const,
    payment: mapPaymentSummary(payment)
  };
}

export async function deletePayment(prisma: PrismaClient, tenantId: string, paymentId: string) {
  const existingPayment = await fetchPayment(prisma, tenantId, paymentId);

  if (!existingPayment) {
    return { kind: 'not_found' as const };
  }

  const deletedPayment = await prisma.$transaction(async (tx) => {
    const removedPayment = await tx.payment.delete({
      where: { id: existingPayment.id },
      include: {
        invoice: {
          include: {
            sale: true,
            client: true,
            payments: {
              select: {
                id: true,
                status: true,
                amountCents: true
              }
            }
          }
        }
      }
    });

    const remainingPayments = removedPayment.invoice.payments.filter((payment) => payment.id !== removedPayment.id);
    const nextInvoiceStatus = getInvoiceStatus(removedPayment.invoice.totalCents, remainingPayments);

    await tx.invoice.update({
      where: { id: removedPayment.invoice.id },
      data: { status: nextInvoiceStatus }
    });

    removedPayment.invoice.status = nextInvoiceStatus;
    removedPayment.invoice.payments = remainingPayments;

    return removedPayment;
  });

  return {
    kind: 'deleted' as const,
    payment: mapPaymentSummary(deletedPayment)
  };
}
