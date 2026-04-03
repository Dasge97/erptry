import type { PrismaClient } from '@prisma/client';

import { roleSummarySchema, tenantOverviewSchema, userSummarySchema } from '@erptry/contracts';
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

export async function listRoles(prisma: PrismaClient) {
  const roles = await prisma.role.findMany({
    orderBy: { code: 'asc' },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  return roles.map((role) =>
    roleSummarySchema.parse({
      id: role.id,
      code: role.code,
      name: role.name,
      permissions: role.permissions.map((item) => item.permission.code).sort()
    })
  );
}

export async function updateTenantUserRole(prisma: PrismaClient, tenantId: string, userId: string, roleCode: string) {
  const [user, role] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: userId,
        tenantId
      }
    }),
    prisma.role.findUnique({
      where: {
        code: roleCode
      }
    })
  ]);

  if (!user || !role) {
    return null;
  }

  await prisma.userRole.deleteMany({
    where: {
      userId: user.id
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id
    }
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!updatedUser) {
    return null;
  }

  return userSummarySchema.parse({
    id: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    status: updatedUser.status,
    tenantId: updatedUser.tenantId,
    roles: updatedUser.roles.map((item) => item.role.code).sort()
  });
}
