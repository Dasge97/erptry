import type { PrismaClient } from '@prisma/client';

import { tenantOverviewSchema, userSummarySchema } from '@erptry/contracts';

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
