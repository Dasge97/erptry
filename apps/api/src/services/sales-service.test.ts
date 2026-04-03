import { describe, expect, it, vi } from 'vitest';

import { createSale, listSales } from './sales-service';

describe('listSales', () => {
  it('normaliza ventas con cliente y lineas', async () => {
    const prisma = {
      sale: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'sale_1',
            tenantId: 'tenant_1',
            reference: 'SAL-20260403-AAAA1111',
            title: 'Propuesta Acme',
            stage: 'draft',
            totalCents: 24000,
            notes: 'Seguimiento semanal',
            client: {
              id: 'client_1',
              fullName: 'Acme SL',
              email: 'hola@acme.test'
            },
            lines: [
              {
                id: 'line_1',
                catalogItemId: 'item_1',
                quantity: 2,
                unitPriceCents: 12000,
                lineTotalCents: 24000,
                catalogItem: {
                  name: 'Consultoria inicial',
                  kind: 'service'
                }
              }
            ]
          }
        ])
      }
    };

    const sales = await listSales(prisma as never, 'tenant_1');

    expect(sales[0]?.client.fullName).toBe('Acme SL');
    expect(sales[0]?.lines[0]?.lineTotalCents).toBe(24000);
  });
});

describe('createSale', () => {
  it('calcula totales a partir del catalogo activo', async () => {
    const prisma = {
      client: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'client_1',
          tenantId: 'tenant_1',
          fullName: 'Acme SL',
          email: 'hola@acme.test'
        })
      },
      catalogItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'item_1',
            tenantId: 'tenant_1',
            name: 'Consultoria inicial',
            kind: 'service',
            priceCents: 12000,
            status: 'active'
          }
        ])
      },
      sale: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          id: data.id,
          tenantId: data.tenantId,
          reference: data.reference,
          title: data.title,
          stage: data.stage,
          totalCents: data.totalCents,
          notes: data.notes,
          client: {
            id: 'client_1',
            fullName: 'Acme SL',
            email: 'hola@acme.test'
          },
          lines: data.lines.create.map((line: { id: string; catalogItemId: string; quantity: number; unitPriceCents: number; lineTotalCents: number }) => ({
            ...line,
            catalogItem: {
              name: 'Consultoria inicial',
              kind: 'service'
            }
          }))
        }))
      }
    };

    const sale = await createSale(prisma as never, 'tenant_1', {
      title: 'Propuesta Acme',
      clientId: 'client_1',
      stage: 'draft',
      notes: 'Seguimiento semanal',
      lines: [{ catalogItemId: 'item_1', quantity: 2 }]
    });

    expect(sale?.totalCents).toBe(24000);
    expect(sale?.lines[0]?.quantity).toBe(2);
  });
});
