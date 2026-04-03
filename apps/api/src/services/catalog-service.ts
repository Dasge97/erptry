import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { catalogItemSummarySchema } from '@erptry/contracts';

export async function listCatalogItems(prisma: PrismaClient, tenantId: string) {
  const items = await prisma.catalogItem.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return items.map((item) =>
    catalogItemSummarySchema.parse({
      id: item.id,
      tenantId: item.tenantId,
      name: item.name,
      kind: item.kind,
      priceCents: item.priceCents,
      durationMin: item.durationMin,
      status: item.status,
      sku: item.sku,
      notes: item.notes
    })
  );
}

export async function createCatalogItem(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    name: string;
    kind: 'product' | 'service';
    priceCents: number;
    durationMin?: number | null | undefined;
    sku?: string | undefined;
    notes?: string | undefined;
  }
) {
  const item = await prisma.catalogItem.create({
    data: {
      id: randomUUID(),
      tenantId,
      name: input.name,
      kind: input.kind,
      priceCents: input.priceCents,
      durationMin: input.durationMin ?? null,
      sku: input.sku?.trim() || null,
      notes: input.notes?.trim() || null
    }
  });

  return catalogItemSummarySchema.parse({
    id: item.id,
    tenantId: item.tenantId,
    name: item.name,
    kind: item.kind,
    priceCents: item.priceCents,
    durationMin: item.durationMin,
    status: item.status,
    sku: item.sku,
    notes: item.notes
  });
}
