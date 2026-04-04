import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { catalogItemSummarySchema } from '@erptry/contracts';

function mapCatalogItemSummary(item: {
  id: string;
  tenantId: string;
  name: string;
  kind: 'product' | 'service';
  priceCents: number;
  durationMin: number | null;
  status: 'active' | 'archived';
  sku: string | null;
  notes: string | null;
}) {
  return catalogItemSummarySchema.parse(item);
}

export async function listCatalogItems(prisma: PrismaClient, tenantId: string) {
  const items = await prisma.catalogItem.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return items.map(mapCatalogItemSummary);
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
      name: input.name.trim(),
      kind: input.kind,
      priceCents: input.priceCents,
      durationMin: input.durationMin ?? null,
      sku: input.sku?.trim() || null,
      notes: input.notes?.trim() || null
    }
  });

  return mapCatalogItemSummary(item);
}

export async function updateCatalogItem(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    id: string;
    name: string;
    kind: 'product' | 'service';
    priceCents: number;
    durationMin?: number | null | undefined;
    sku?: string | undefined;
    notes?: string | undefined;
    status: 'active' | 'archived';
  }
) {
  const existingItem = await prisma.catalogItem.findFirst({
    where: {
      id: input.id,
      tenantId
    }
  });

  if (!existingItem) {
    return null;
  }

  const item = await prisma.catalogItem.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      kind: input.kind,
      priceCents: input.priceCents,
      durationMin: input.durationMin ?? null,
      status: input.status,
      sku: input.sku?.trim() || null,
      notes: input.notes?.trim() || null
    }
  });

  return mapCatalogItemSummary(item);
}

export async function deleteCatalogItem(prisma: PrismaClient, tenantId: string, itemId: string) {
  const item = await prisma.catalogItem.findFirst({
    where: {
      id: itemId,
      tenantId
    },
    include: {
      saleLines: { select: { id: true } },
      invoiceLines: { select: { id: true } }
    }
  });

  if (!item) {
    return { kind: 'not_found' as const };
  }

  if (item.saleLines.length > 0 || item.invoiceLines.length > 0) {
    return { kind: 'has_relations' as const };
  }

  await prisma.catalogItem.delete({
    where: { id: item.id }
  });

  return {
    kind: 'deleted' as const,
    item: mapCatalogItemSummary(item)
  };
}
