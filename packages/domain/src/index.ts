import type { BootstrapUser, PlatformSnapshot, SessionActor, Tenant, UserRole } from '@erptry/contracts';

export const corePlatformModules = [
  'auth',
  'users',
  'roles-permissions',
  'settings',
  'multi-tenant'
] as const;

export function createDefaultTenant(): Tenant {
  return {
    id: 'tenant_erptry',
    slug: 'erptry',
    name: 'ERPTRY Demo',
    plan: 'growth'
  };
}

export function createBootstrapUsers(tenantId: string): BootstrapUser[] {
  return [
    {
      id: 'user_owner',
      email: 'owner@erptry.local',
      fullName: 'Owner Demo',
      role: 'owner',
      tenantId
    },
    {
      id: 'user_ops',
      email: 'ops@erptry.local',
      fullName: 'Operations Lead',
      role: 'manager',
      tenantId
    }
  ];
}

export function roleCanManageSettings(role: UserRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function createPlatformSnapshot(): PlatformSnapshot {
  const tenant = createDefaultTenant();

  return {
    tenant,
    users: createBootstrapUsers(tenant.id),
    capabilities: [...corePlatformModules],
    phase: 'bootstrap'
  };
}

export function findBootstrapUserByEmail(email: string): BootstrapUser | null {
  const tenant = createDefaultTenant();
  const normalized = email.trim().toLowerCase();

  return createBootstrapUsers(tenant.id).find((user) => user.email.toLowerCase() === normalized) ?? null;
}

export function toSessionActor(user: BootstrapUser): SessionActor {
  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    fullName: user.fullName,
    email: user.email
  };
}
