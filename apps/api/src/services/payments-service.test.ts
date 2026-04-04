import { describe, expect, it, vi } from 'vitest';

import { createPayment, listPayments } from './payments-service.js';

describe('listPayments', () => {
  it('normaliza cobros con contexto de factura, venta y cliente', async () => {
    const prisma = {
      payment: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'payment_1',
            tenantId: 'tenant_1',
            invoiceId: 'invoice_1',
            reference: 'PAY-20260403-AAAA1111',
            status: 'confirmed',
            method: 'bank_transfer',
            amountCents: 10000,
            receivedAt: new Date('2026-04-04T12:00:00.000Z'),
            notes: 'Anticipo',
            invoice: {
              id: 'invoice_1',
              reference: 'INV-20260403-AAAA1111',
              status: 'issued',
              totalCents: 24000,
              payments: [
                { id: 'payment_1', status: 'confirmed', amountCents: 10000 },
                { id: 'payment_2', status: 'pending', amountCents: 5000 }
              ],
              sale: {
                id: 'sale_1',
                reference: 'SAL-20260403-AAAA1111',
                title: 'Propuesta Acme'
              },
              client: {
                id: 'client_1',
                fullName: 'Acme SL',
                email: 'hola@acme.test'
              }
            }
          }
        ])
      }
    };

    const payments = await listPayments(prisma as never, 'tenant_1');

    expect(payments[0]?.invoice.reference).toBe('INV-20260403-AAAA1111');
    expect(payments[0]?.invoice.paidCents).toBe(10000);
    expect(payments[0]?.invoice.balanceCents).toBe(14000);
  });
});

describe('createPayment', () => {
  it('registra un cobro y liquida la factura cuando cubre el saldo', async () => {
    const invoiceUpdate = vi.fn();
    const paymentCreate = vi.fn().mockImplementation(async ({ data }) => ({
      id: data.id,
      tenantId: data.tenantId,
      invoiceId: data.invoiceId,
      reference: data.reference,
      status: data.status,
      method: data.method,
      amountCents: data.amountCents,
      receivedAt: data.receivedAt,
      notes: data.notes,
      invoice: {
        id: 'invoice_1',
        reference: 'INV-20260403-AAAA1111',
        status: 'issued',
        totalCents: 24000,
        payments: [
          { id: 'payment_prev', status: 'confirmed', amountCents: 10000 },
          { id: data.id, status: data.status, amountCents: data.amountCents }
        ],
        sale: {
          id: 'sale_1',
          reference: 'SAL-20260403-AAAA1111',
          title: 'Propuesta Acme'
        },
        client: {
          id: 'client_1',
          fullName: 'Acme SL',
          email: 'hola@acme.test'
        }
      }
    }));
    const prisma = {
      invoice: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'invoice_1',
          tenantId: 'tenant_1',
          reference: 'INV-20260403-AAAA1111',
          status: 'issued',
          totalCents: 24000,
          sale: {
            id: 'sale_1',
            reference: 'SAL-20260403-AAAA1111',
            title: 'Propuesta Acme'
          },
          client: {
            id: 'client_1',
            fullName: 'Acme SL',
            email: 'hola@acme.test'
          },
          payments: [{ id: 'payment_prev', status: 'confirmed', amountCents: 10000 }]
        })
      },
      notification: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          ...data,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          readAt: null,
          createdAt: new Date('2026-04-04T12:05:00.000Z')
        }))
      },
      $transaction: vi.fn(async (callback) =>
        callback({
          payment: {
            create: paymentCreate
          },
          invoice: {
            update: invoiceUpdate
          }
        })
      )
    };

    const payment = await createPayment(prisma as never, 'tenant_1', {
      invoiceId: 'invoice_1',
      status: 'confirmed',
      method: 'bank_transfer',
      amountCents: 14000,
      receivedAt: '2026-04-04T12:00:00.000Z',
      notes: 'Liquidacion total'
    });

    expect(payment?.invoice.balanceCents).toBe(0);
    expect(payment?.invoice.status).toBe('paid');
    expect(invoiceUpdate).toHaveBeenCalledWith({
      where: { id: 'invoice_1' },
      data: { status: 'paid' }
    });
  });

  it('rechaza cobros sobre facturas que ya no estan emitidas', async () => {
    const prisma = {
      invoice: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    const payment = await createPayment(prisma as never, 'tenant_1', {
      invoiceId: 'invoice_paid',
      status: 'confirmed',
      method: 'bank_transfer',
      amountCents: 1000,
      receivedAt: '2026-04-04T12:00:00.000Z'
    });

    expect(payment).toBeNull();
    expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'invoice_paid',
        tenantId: 'tenant_1',
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
  });
});
