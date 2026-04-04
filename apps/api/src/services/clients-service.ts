import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { clientSummarySchema } from '@erptry/contracts';

function mapClientSummary(client: {
  id: string;
  tenantId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  segment: string;
  notes: string | null;
}) {
  return clientSummarySchema.parse(client);
}

export async function listClients(prisma: PrismaClient, tenantId: string) {
  const clients = await prisma.client.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return clients.map(mapClientSummary);
}

export async function createClient(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    fullName: string;
    email?: string | undefined;
    phone?: string | undefined;
    segment: string;
    notes?: string | undefined;
  }
) {
  const client = await prisma.client.create({
    data: {
      id: randomUUID(),
      tenantId,
      fullName: input.fullName.trim(),
      email: input.email?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      segment: input.segment.trim(),
      notes: input.notes?.trim() || null
    }
  });

  return mapClientSummary(client);
}

export async function updateClient(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    id: string;
    fullName: string;
    email?: string | undefined;
    phone?: string | undefined;
    segment: string;
    notes?: string | undefined;
  }
) {
  const existingClient = await prisma.client.findFirst({
    where: {
      id: input.id,
      tenantId
    }
  });

  if (!existingClient) {
    return null;
  }

  const client = await prisma.client.update({
    where: { id: input.id },
    data: {
      fullName: input.fullName.trim(),
      email: input.email?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      segment: input.segment.trim(),
      notes: input.notes?.trim() || null
    }
  });

  return mapClientSummary(client);
}

export async function deleteClient(prisma: PrismaClient, tenantId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId
    },
    include: {
      sales: { select: { id: true } },
      invoices: { select: { id: true } }
    }
  });

  if (!client) {
    return { kind: 'not_found' as const };
  }

  if (client.sales.length > 0 || client.invoices.length > 0) {
    return { kind: 'has_relations' as const };
  }

  await prisma.client.delete({
    where: { id: client.id }
  });

  return {
    kind: 'deleted' as const,
    client: mapClientSummary(client)
  };
}
