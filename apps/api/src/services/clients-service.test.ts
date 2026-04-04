import { describe, expect, it, vi } from 'vitest';

import { listClients } from './clients-service.js';

describe('listClients', () => {
  it('normaliza clientes del tenant', async () => {
    const prisma = {
      client: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'client_1',
            tenantId: 'tenant_1',
            fullName: 'Acme SL',
            email: 'hola@acme.test',
            phone: '600000000',
            segment: 'vip',
            notes: 'Prioritario'
          }
        ])
      }
    };

    const clients = await listClients(prisma as never, 'tenant_1');

    expect(clients[0]?.segment).toBe('vip');
  });
});
