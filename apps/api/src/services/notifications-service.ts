import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { notificationsInboxSchema, notificationSummarySchema } from '@erptry/contracts';

function mapNotificationSummary(notification: {
  id: string;
  tenantId: string;
  type: 'activity' | 'reminder' | 'finance' | 'alert';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  resourceType: string | null;
  resourceId: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return notificationSummarySchema.parse({
    id: notification.id,
    tenantId: notification.tenantId,
    type: notification.type,
    severity: notification.severity,
    title: notification.title,
    message: notification.message,
    resourceType: notification.resourceType,
    resourceId: notification.resourceId,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString()
  });
}

export async function listNotifications(prisma: PrismaClient, tenantId: string) {
  const items = await prisma.notification.findMany({
    where: { tenantId },
    orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }]
  });

  const summaries = items.map(mapNotificationSummary);

  return notificationsInboxSchema.parse({
    generatedAt: new Date().toISOString(),
    totalCount: summaries.length,
    unreadCount: summaries.filter((notification) => notification.readAt === null).length,
    items: summaries
  });
}

export async function createNotification(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    type: 'activity' | 'reminder' | 'finance' | 'alert';
    severity: 'info' | 'success' | 'warning' | 'critical';
    title: string;
    message: string;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
  }
) {
  const notification = await prisma.notification.create({
    data: {
      id: randomUUID(),
      tenantId,
      type: input.type,
      severity: input.severity,
      title: input.title.trim(),
      message: input.message.trim(),
      resourceType: input.resourceType?.trim() || null,
      resourceId: input.resourceId?.trim() || null
    }
  });

  return mapNotificationSummary(notification);
}

export async function markNotificationRead(prisma: PrismaClient, tenantId: string, notificationId: string) {
  const current = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      tenantId
    }
  });

  if (!current) {
    return null;
  }

  if (current.readAt) {
    return mapNotificationSummary(current);
  }

  const updated = await prisma.notification.update({
    where: { id: current.id },
    data: {
      readAt: new Date()
    }
  });

  return mapNotificationSummary(updated);
}
