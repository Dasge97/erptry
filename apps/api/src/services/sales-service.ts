import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { saleSummarySchema } from '@erptry/contracts';

function createSaleReference() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomUUID().slice(0, 8).toUpperCase();

  return `SAL-${stamp}-${suffix}`;
}

function mapSaleSummary(sale: {
  id: string;
  tenantId: string;
  reference: string;
  title: string;
  stage: 'draft' | 'sent' | 'won' | 'lost';
  totalCents: number;
  notes: string | null;
  client: {
    id: string;
    fullName: string;
    email: string | null;
  };
  lines: Array<{
    id: string;
    catalogItemId: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    catalogItem: {
      name: string;
      kind: 'product' | 'service';
    };
  }>;
}) {
  return saleSummarySchema.parse({
    id: sale.id,
    tenantId: sale.tenantId,
    reference: sale.reference,
    title: sale.title,
    stage: sale.stage,
    client: sale.client,
    totalCents: sale.totalCents,
    notes: sale.notes,
    lines: sale.lines.map((line) => ({
      id: line.id,
      catalogItemId: line.catalogItemId,
      catalogItemName: line.catalogItem.name,
      kind: line.catalogItem.kind,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      lineTotalCents: line.lineTotalCents
    }))
  });
}

export async function listSales(prisma: PrismaClient, tenantId: string) {
  const sales = await prisma.sale.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      client: true,
      lines: {
        include: {
          catalogItem: true
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  return sales.map(mapSaleSummary);
}

export async function createSale(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    title: string;
    clientId: string;
    stage: 'draft' | 'sent' | 'won' | 'lost';
    notes?: string | undefined;
    lines: Array<{
      catalogItemId: string;
      quantity: number;
    }>;
  }
) {
  if (input.lines.length === 0) {
    return null;
  }

  const [client, items] = await Promise.all([
    prisma.client.findFirst({
      where: {
        id: input.clientId,
        tenantId
      }
    }),
    prisma.catalogItem.findMany({
      where: {
        tenantId,
        id: {
          in: input.lines.map((line) => line.catalogItemId)
        },
        status: 'active'
      }
    })
  ]);

  if (!client || items.length !== input.lines.length) {
    return null;
  }

  const itemById = new Map(items.map((item) => [item.id, item]));
  const saleLines = input.lines.map((line) => {
    const item = itemById.get(line.catalogItemId);

    if (!item) {
      throw new Error('catalog_item_not_found');
    }

    const lineTotalCents = item.priceCents * line.quantity;

    return {
      id: randomUUID(),
      catalogItemId: item.id,
      quantity: line.quantity,
      unitPriceCents: item.priceCents,
      lineTotalCents
    };
  });

  const createdSale = await prisma.sale.create({
    data: {
      id: randomUUID(),
      tenantId,
      clientId: client.id,
      reference: createSaleReference(),
      title: input.title,
      stage: input.stage,
      totalCents: saleLines.reduce((total, line) => total + line.lineTotalCents, 0),
      notes: input.notes?.trim() || null,
      lines: {
        create: saleLines
      }
    },
    include: {
      client: true,
      lines: {
        include: {
          catalogItem: true
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  return mapSaleSummary(createdSale);
}
