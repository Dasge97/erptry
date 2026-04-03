import { describe, expect, it, vi } from 'vitest';

import { createInvoiceFromSale, listInvoices } from './invoices-service';

describe('listInvoices', () => {
  it('normaliza facturas con venta, cliente y lineas', async () => {
    const prisma = {
      invoice: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'invoice_1',
            tenantId: 'tenant_1',
            saleId: 'sale_1',
            reference: 'INV-20260403-AAAA1111',
            status: 'issued',
            dueDate: new Date('2026-04-30T00:00:00.000Z'),
            issuedAt: new Date('2026-04-03T12:00:00.000Z'),
            subtotalCents: 24000,
            totalCents: 24000,
            payments: [
              {
                id: 'payment_1',
                reference: 'PAY-20260403-AAAA1111',
                status: 'confirmed',
                method: 'bank_transfer',
                amountCents: 10000,
                receivedAt: new Date('2026-04-04T12:00:00.000Z'),
                notes: 'Anticipo'
              }
            ],
            notes: 'Factura emitida desde venta',
            sale: {
              id: 'sale_1',
              reference: 'SAL-20260403-AAAA1111',
              title: 'Propuesta Acme',
              stage: 'won'
            },
            client: {
              id: 'client_1',
              fullName: 'Acme SL',
              email: 'hola@acme.test'
            },
            lines: [
              {
                id: 'line_1',
                catalogItemId: 'item_1',
                description: 'Consultoria inicial',
                kind: 'service',
                quantity: 2,
                unitPriceCents: 12000,
                lineTotalCents: 24000
              }
            ]
          }
        ])
      }
    };

    const invoices = await listInvoices(prisma as never, 'tenant_1');

    expect(invoices[0]?.sale.reference).toBe('SAL-20260403-AAAA1111');
    expect(invoices[0]?.lines[0]?.description).toBe('Consultoria inicial');
    expect(invoices[0]?.paidCents).toBe(10000);
    expect(invoices[0]?.balanceCents).toBe(14000);
  });
});

describe('createInvoiceFromSale', () => {
  it('convierte una venta valida en factura cobrable', async () => {
    const prisma = {
      sale: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'sale_1',
          tenantId: 'tenant_1',
          clientId: 'client_1',
          reference: 'SAL-20260403-AAAA1111',
          title: 'Propuesta Acme',
          stage: 'won',
          totalCents: 24000,
          notes: 'Seguimiento semanal',
          client: {
            id: 'client_1',
            fullName: 'Acme SL',
            email: 'hola@acme.test'
          },
          lines: [
            {
              id: 'sale_line_1',
              catalogItemId: 'item_1',
              quantity: 2,
              unitPriceCents: 12000,
              lineTotalCents: 24000,
              catalogItem: {
                id: 'item_1',
                name: 'Consultoria inicial',
                kind: 'service'
              }
            }
          ]
        })
      },
      notification: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          ...data,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          readAt: null,
          createdAt: new Date('2026-04-03T12:05:00.000Z')
        }))
      },
      invoice: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: data.id,
          tenantId: data.tenantId,
          saleId: data.saleId,
          reference: data.reference,
          status: data.status,
          dueDate: data.dueDate,
          issuedAt: data.issuedAt,
          subtotalCents: data.subtotalCents,
          totalCents: data.totalCents,
          payments: [],
          notes: data.notes,
          sale: {
            id: 'sale_1',
            reference: 'SAL-20260403-AAAA1111',
            title: 'Propuesta Acme',
            stage: 'won'
          },
          client: {
            id: 'client_1',
            fullName: 'Acme SL',
            email: 'hola@acme.test'
          },
          lines: data.lines.create
        }))
      }
    };

    const invoice = await createInvoiceFromSale(prisma as never, 'tenant_1', {
      saleId: 'sale_1',
      status: 'issued',
      dueDate: '2026-04-30',
      notes: 'Factura emitida desde la venta'
    });

    expect(invoice?.saleId).toBe('sale_1');
    expect(invoice?.totalCents).toBe(24000);
    expect(invoice?.lines[0]?.description).toBe('Consultoria inicial');
    expect(invoice?.balanceCents).toBe(24000);
  });

  it('rechaza facturar una venta que aun no esta ganada', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const prisma = {
      sale: {
        findFirst
      }
    };

    const invoice = await createInvoiceFromSale(prisma as never, 'tenant_1', {
      saleId: 'sale_1',
      status: 'issued',
      dueDate: '2026-04-30'
    });

    expect(invoice).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'sale_1',
          tenantId: 'tenant_1',
          stage: 'won',
          invoice: null
        })
      })
    );
  });
});
