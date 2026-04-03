import { z } from 'zod';

export const tenantSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  plan: z.enum(['starter', 'growth', 'scale'])
});

export type Tenant = z.infer<typeof tenantSchema>;

export const userRoleSchema = z.enum(['owner', 'admin', 'manager', 'operator', 'viewer']);

export type UserRole = z.infer<typeof userRoleSchema>;

export const bootstrapUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: userRoleSchema,
  tenantId: z.string().min(1)
});

export type BootstrapUser = z.infer<typeof bootstrapUserSchema>;

export const platformSnapshotSchema = z.object({
  tenant: tenantSchema,
  users: z.array(bootstrapUserSchema),
  capabilities: z.array(z.string().min(1)),
  phase: z.string().min(1)
});

export type PlatformSnapshot = z.infer<typeof platformSnapshotSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  phase: z.string().min(1),
  timestamp: z.string().datetime()
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const appManifestSchema = z.object({
  name: z.literal('ERPTRY'),
  headline: z.string().min(1),
  modules: z.array(z.string().min(1)),
  priorities: z.array(z.string().min(1))
});

export type AppManifest = z.infer<typeof appManifestSchema>;

export const demoLoginRequestSchema = z.object({
  email: z.string().email()
});

export type DemoLoginRequest = z.infer<typeof demoLoginRequestSchema>;

export const sessionActorSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  role: userRoleSchema,
  fullName: z.string().min(1),
  email: z.string().email()
});

export type SessionActor = z.infer<typeof sessionActorSchema>;

export const demoLoginResponseSchema = z.object({
  token: z.string().min(1),
  actor: sessionActorSchema,
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type DemoLoginResponse = z.infer<typeof demoLoginResponseSchema>;

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const sessionEnvelopeSchema = z.object({
  token: z.string().min(1),
  actor: sessionActorSchema,
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type SessionEnvelope = z.infer<typeof sessionEnvelopeSchema>;

export const meResponseSchema = z.object({
  actor: sessionActorSchema,
  tenant: tenantSchema,
  permissions: z.array(z.string().min(1)),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime()
});

export type MeResponse = z.infer<typeof meResponseSchema>;

export const userSummarySchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  status: z.enum(['active', 'suspended']),
  tenantId: z.string().min(1),
  roles: z.array(z.string().min(1))
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export const tenantOverviewSchema = z.object({
  tenant: tenantSchema,
  totalUsers: z.number().int().nonnegative(),
  activeSessions: z.number().int().nonnegative()
});

export type TenantOverview = z.infer<typeof tenantOverviewSchema>;

export const createUserRequestSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleCode: z.enum(['owner', 'admin', 'manager', 'operator', 'viewer'])
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;

export const tenantSettingsSchema = z.object({
  brandingName: z.string().min(1),
  defaultLocale: z.string().min(2),
  timezone: z.string().min(2)
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

export const updateTenantSettingsRequestSchema = tenantSettingsSchema;

export type UpdateTenantSettingsRequest = z.infer<typeof updateTenantSettingsRequestSchema>;
