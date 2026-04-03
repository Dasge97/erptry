import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { PrismaClient, TenantPlan } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  ['tenant.manage', 'Gestionar tenant'],
  ['users.manage', 'Gestionar usuarios'],
  ['roles.manage', 'Gestionar roles'],
  ['settings.manage', 'Gestionar ajustes'],
  ['analytics.view', 'Ver analitica']
] as const;

const ROLE_DEFINITIONS = [
  ['owner', 'Owner'],
  ['admin', 'Admin'],
  ['manager', 'Manager'],
  ['operator', 'Operator'],
  ['viewer', 'Viewer']
] as const;

async function main() {
  const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'erptry';
  const tenantName = process.env.SEED_TENANT_NAME ?? 'ERPTRY Demo';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'owner@erptry.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'erptry1234';

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName, plan: TenantPlan.growth },
    create: {
      slug: tenantSlug,
      name: tenantName,
      plan: TenantPlan.growth
    }
  });

  await prisma.tenantSetting.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: 'core'
      }
    },
    update: {
      value: {
        brandingName: tenantName,
        defaultLocale: 'es-ES',
        timezone: 'Europe/Madrid'
      }
    },
    create: {
      tenantId: tenant.id,
      key: 'core',
      value: {
        brandingName: tenantName,
        defaultLocale: 'es-ES',
        timezone: 'Europe/Madrid'
      }
    }
  });

  const permissions = await Promise.all(
    DEFAULT_PERMISSIONS.map(([code, name]) =>
      prisma.permission.upsert({
        where: { code },
        update: { name },
        create: { code, name }
      })
    )
  );

  const roles = await Promise.all(
    ROLE_DEFINITIONS.map(([code, name]) =>
      prisma.role.upsert({
        where: { code },
        update: { name },
        create: {
          code,
          name
        }
      })
    )
  );

  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));
  const rolePermissions = new Map<string, string[]>([
    ['owner', DEFAULT_PERMISSIONS.map(([code]) => code)],
    ['admin', ['tenant.manage', 'users.manage', 'roles.manage', 'settings.manage', 'analytics.view']],
    ['manager', ['users.manage', 'analytics.view']],
    ['operator', ['analytics.view']],
    ['viewer', ['analytics.view']]
  ]);

  await Promise.all(
    Array.from(rolePermissions.entries()).flatMap(([roleCode, permissionCodes]) => {
      const role = roleByCode.get(roleCode);

      if (!role) {
        throw new Error(`Role not found for code ${roleCode}`);
      }

      return permissionCodes.map((permissionCode) => {
        const permission = permissionByCode.get(permissionCode);

        if (!permission) {
          throw new Error(`Permission not found for code ${permissionCode}`);
        }

        return prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      });
    })
  );

  const ownerRole = roleByCode.get('owner');

  if (!ownerRole) {
    throw new Error('Owner role was not created');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'Owner Demo',
      tenantId: tenant.id,
      passwordHash
    },
    create: {
      email: adminEmail,
      fullName: 'Owner Demo',
      tenantId: tenant.id,
      passwordHash
    }
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: ownerRole.id
      }
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: ownerRole.id
    }
  });

  await prisma.session.deleteMany({
    where: {
      userId: admin.id,
      revokedAt: null,
      expiresAt: {
        lt: new Date()
      }
    }
  });

  await prisma.client.upsert({
    where: {
      id: 'seed-client-acme'
    },
    update: {
      tenantId: tenant.id,
      fullName: 'Acme Servicios',
      email: 'contacto@acme.test',
      phone: '600111222',
      segment: 'vip',
      notes: 'Cliente de referencia para el primer vertical.'
    },
    create: {
      id: 'seed-client-acme',
      tenantId: tenant.id,
      fullName: 'Acme Servicios',
      email: 'contacto@acme.test',
      phone: '600111222',
      segment: 'vip',
      notes: 'Cliente de referencia para el primer vertical.'
    }
  });

  console.log(JSON.stringify({ tenantId: tenant.id, adminId: admin.id, bootstrapTokenId: randomUUID() }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
