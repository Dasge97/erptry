import { describe, expect, it, vi } from 'vitest';

import { listCatalogItems } from './catalog-service.js';

describe('listCatalogItems', () => {
  it('normaliza catalogo de productos y servicios', async () => {
    const prisma = {
      catalogItem: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'item_1',
            tenantId: 'tenant_1',
            name: 'Consultoria inicial',
            kind: 'service',
            priceCents: 12000,
            durationMin: 60,
            status: 'active',
            sku: 'SERV-001',
            notes: 'Primera visita'
          }
        ])
      }
    };

    const items = await listCatalogItems(prisma as never, 'tenant_1');

    expect(items[0]?.kind).toBe('service');
  });
});
