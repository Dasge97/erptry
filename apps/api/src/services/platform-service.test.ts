import { describe, expect, it, vi } from 'vitest';

import { listTenantUsers } from './platform-service';

describe('listTenantUsers', () => {
  it('normaliza los usuarios y sus roles', async () => {
    const prisma = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'user_1',
            email: 'owner@erptry.local',
            fullName: 'Owner Demo',
            status: 'active',
            tenantId: 'tenant_1',
            roles: [
              { role: { code: 'manager' } },
              { role: { code: 'owner' } }
            ]
          }
        ])
      }
    };

    const users = await listTenantUsers(prisma as never, 'tenant_1');

    expect(users).toEqual([
      {
        id: 'user_1',
        email: 'owner@erptry.local',
        fullName: 'Owner Demo',
        status: 'active',
        tenantId: 'tenant_1',
        roles: ['manager', 'owner']
      }
    ]);
  });
});
