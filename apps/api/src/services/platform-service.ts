import type { PrismaClient } from '@prisma/client';

import { tenantOverviewSchema, userSummarySchema } from '@erptry/contracts';
import bcrypt from 'bcryptjs';

export async function getTenantOverview(prisma: PrismaClient, tenantId: string) {
  const [tenant, totalUsers, activeSessions] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.session.count({
      where: {
        tenantId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    })
  ]);

  if (!tenant) {
    return null;
  }

  return tenantOverviewSchema.parse({
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan
    },
    totalUsers,
    activeSessions
  });
}

export async function listTenantUsers(prisma: PrismaClient, tenantId: string) {
  const users = await prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  return users.map((user) =>
    userSummarySchema.parse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      tenantId: user.tenantId,
      roles: user.roles.map((item) => item.role.code).sort()
    })
  );
}

export async function createTenantUser(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    fullName: string;
    email: string;
    password: string;
    roleCode: string;
  }
) {
  const role = await prisma.role.findUnique({
    where: { code: input.roleCode }
  });

  if (!role) {
    return null;
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email.trim().toLowerCase(),
      passwordHash,
      tenantId,
      roles: {
        create: {
          roleId: role.id
        }
      }
    },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  return userSummarySchema.parse({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    tenantId: user.tenantId,
    roles: user.roles.map((item) => item.role.code).sort()
  });
}
