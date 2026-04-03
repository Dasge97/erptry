import { randomBytes } from 'node:crypto';

import type { MeResponse, SessionActor, SessionEnvelope } from '@erptry/contracts';
import { meResponseSchema, sessionEnvelopeSchema } from '@erptry/contracts';
import type { Permission, PrismaClient, Role, Session, Tenant, User } from '@prisma/client';
import bcrypt from 'bcryptjs';

type UserRecord = User & {
  tenant: Tenant;
  roles: Array<{
    role: Role & {
      permissions: Array<{
        permission: Permission;
      }>;
    };
  }>;
};

type SessionRecord = Session & {
  user: UserRecord;
  tenant: Tenant;
};

function mapRoleCodeToActorRole(roleCodes: string[]): SessionActor['role'] {
  if (roleCodes.includes('owner')) return 'owner';
  if (roleCodes.includes('admin')) return 'admin';
  if (roleCodes.includes('manager')) return 'manager';
  if (roleCodes.includes('operator')) return 'operator';
  return 'viewer';
}

function toActor(user: UserRecord): SessionActor {
  const roleCodes = user.roles.map((item) => item.role.code);

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: mapRoleCodeToActorRole(roleCodes),
    fullName: user.fullName,
    email: user.email
  };
}

function toPermissionCodes(user: UserRecord): string[] {
  return Array.from(
    new Set(user.roles.flatMap((item) => item.role.permissions.map((entry) => entry.permission.code)))
  ).sort();
}

async function findUserByEmail(prisma: PrismaClient, email: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: {
      tenant: true,
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function createPersistedSession(prisma: PrismaClient, email: string, password: string): Promise<SessionEnvelope | null> {
  const user = await findUserByEmail(prisma, email);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  const issuedAt = new Date();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);
  const token = randomBytes(32).toString('hex');

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      tenantId: user.tenantId,
      issuedAt,
      expiresAt
    }
  });

  return sessionEnvelopeSchema.parse({
    token,
    actor: toActor(user),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  });
}

async function findActiveSession(prisma: PrismaClient, token: string): Promise<SessionRecord | null> {
  return prisma.session.findFirst({
    where: {
      token,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      tenant: true,
      user: {
        include: {
          tenant: true,
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}

export async function resolvePersistedSession(prisma: PrismaClient, token: string): Promise<MeResponse | null> {
  const session = await findActiveSession(prisma, token);

  if (!session) {
    return null;
  }

  return meResponseSchema.parse({
    actor: toActor(session.user),
    tenant: {
      id: session.tenant.id,
      slug: session.tenant.slug,
      name: session.tenant.name,
      plan: session.tenant.plan
    },
    permissions: toPermissionCodes(session.user),
    issuedAt: session.issuedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString()
  });
}

export async function revokePersistedSession(prisma: PrismaClient, token: string): Promise<boolean> {
  const session = await prisma.session.findFirst({
    where: {
      token,
      revokedAt: null
    }
  });

  if (!session) {
    return false;
  }

  await prisma.session.update({
    where: {
      id: session.id
    },
    data: {
      revokedAt: new Date()
    }
  });

  return true;
}
