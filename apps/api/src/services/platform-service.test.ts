import { describe, expect, it, vi } from 'vitest';

import { listRoles, listTenantUsers, updateTenantUserRole } from './platform-service';

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

describe('listRoles', () => {
  it('normaliza roles con permisos', async () => {
    const prisma = {
      role: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'role_admin',
            code: 'admin',
            name: 'Admin',
            permissions: [{ permission: { code: 'users.manage' } }, { permission: { code: 'settings.manage' } }]
          }
        ])
      }
    };

    const roles = await listRoles(prisma as never);

    expect(roles[0]?.permissions).toEqual(['settings.manage', 'users.manage']);
  });
});

describe('updateTenantUserRole', () => {
  it('reemplace el rol de un usuario del tenant', async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1', tenantId: 'tenant_1' }),
        findUnique: vi.fn().mockResolvedValue({
          id: 'user_1',
          email: 'owner@erptry.local',
          fullName: 'Owner Demo',
          status: 'active',
          tenantId: 'tenant_1',
          roles: [{ role: { code: 'admin' } }]
        })
      },
      role: {
        findUnique: vi.fn().mockResolvedValue({ id: 'role_admin', code: 'admin' })
      },
      userRole: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn().mockResolvedValue({})
      }
    };

    const user = await updateTenantUserRole(prisma as never, 'tenant_1', 'user_1', 'admin');

    expect(user?.roles).toEqual(['admin']);
  });
});
