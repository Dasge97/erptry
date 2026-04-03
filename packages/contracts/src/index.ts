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
