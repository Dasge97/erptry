import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { clientSummarySchema } from '@erptry/contracts';

export async function listClients(prisma: PrismaClient, tenantId: string) {
  const clients = await prisma.client.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return clients.map((client) =>
    clientSummarySchema.parse({
      id: client.id,
      tenantId: client.tenantId,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      segment: client.segment,
      notes: client.notes
    })
  );
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
      fullName: input.fullName,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      segment: input.segment,
      notes: input.notes?.trim() || null
    }
  });

  return clientSummarySchema.parse({
    id: client.id,
    tenantId: client.tenantId,
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    segment: client.segment,
    notes: client.notes
  });
}
