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

  const ownerRole = await prisma.role.upsert({
    where: { code: 'owner' },
    update: { name: 'Owner' },
    create: {
      code: 'owner',
      name: 'Owner'
    }
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: ownerRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: ownerRole.id,
          permissionId: permission.id
        }
      })
    )
  );

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
