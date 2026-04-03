import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { auditLogsFeedSchema, auditLogSummarySchema } from '@erptry/contracts';

function mapAuditLogSummary(auditLog: {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  actorName: string;
  actorEmail: string;
  type: 'activity' | 'reminder' | 'finance' | 'alert';
  severity: 'info' | 'success' | 'warning' | 'critical';
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  summary: string;
  createdAt: Date;
}) {
  return auditLogSummarySchema.parse({
    id: auditLog.id,
    tenantId: auditLog.tenantId,
    actorUserId: auditLog.actorUserId,
    actorName: auditLog.actorName,
    actorEmail: auditLog.actorEmail,
    type: auditLog.type,
    severity: auditLog.severity,
    action: auditLog.action,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    summary: auditLog.summary,
    createdAt: auditLog.createdAt.toISOString()
  });
}

export async function listAuditLogs(prisma: PrismaClient, tenantId: string) {
  const items = await prisma.auditLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const summaries = items.map(mapAuditLogSummary);

  return auditLogsFeedSchema.parse({
    generatedAt: new Date().toISOString(),
    totalCount: summaries.length,
    items: summaries
  });
}

export async function createAuditLog(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    actorUserId?: string | undefined;
    actorName: string;
    actorEmail: string;
    type: 'activity' | 'reminder' | 'finance' | 'alert';
    severity: 'info' | 'success' | 'warning' | 'critical';
    action: string;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    summary: string;
  }
) {
  const auditLog = await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      tenantId,
      actorUserId: input.actorUserId?.trim() || null,
      actorName: input.actorName.trim(),
      actorEmail: input.actorEmail.trim().toLowerCase(),
      type: input.type,
      severity: input.severity,
      action: input.action.trim(),
      resourceType: input.resourceType?.trim() || null,
      resourceId: input.resourceId?.trim() || null,
      summary: input.summary.trim()
    }
  });

  return mapAuditLogSummary(auditLog);
}
