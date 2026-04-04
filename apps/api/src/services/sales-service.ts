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

async function fetchSale(prisma: PrismaClient, tenantId: string, saleId: string) {
  return prisma.sale.findFirst({
    where: {
      id: saleId,
      tenantId
    },
    include: {
      client: true,
      invoice: {
        select: { id: true }
      },
      lines: {
        include: {
          catalogItem: true
        },
        orderBy: { id: 'asc' }
      }
    }
  });
}

async function buildSaleLines(
  prisma: PrismaClient,
  tenantId: string,
  inputLines: Array<{
    catalogItemId: string;
    quantity: number;
  }>
) {
  if (inputLines.length === 0) {
    return null;
  }

  const items = await prisma.catalogItem.findMany({
    where: {
      tenantId,
      id: {
        in: inputLines.map((line) => line.catalogItemId)
      },
      status: 'active'
    }
  });

  if (items.length !== inputLines.length) {
    return null;
  }

  const itemById = new Map(items.map((item) => [item.id, item]));

  return inputLines.map((line) => {
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
  const [client, saleLines] = await Promise.all([
    prisma.client.findFirst({
      where: {
        id: input.clientId,
        tenantId
      }
    }),
    buildSaleLines(prisma, tenantId, input.lines)
  ]);

  if (!client || !saleLines) {
    return null;
  }

  const createdSale = await prisma.sale.create({
    data: {
      id: randomUUID(),
      tenantId,
      clientId: client.id,
      reference: createSaleReference(),
      title: input.title.trim(),
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

export async function updateSale(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    id: string;
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
  const existingSale = await fetchSale(prisma, tenantId, input.id);

  if (!existingSale) {
    return { kind: 'not_found' as const };
  }

  const invoiceLocked = existingSale.invoice !== null;
  let nextClientId = existingSale.client.id;
  let nextTotalCents = existingSale.totalCents;
  let lineMutation:
    | { deleteMany: {}; create: Array<{ id: string; catalogItemId: string; quantity: number; unitPriceCents: number; lineTotalCents: number }> }
    | undefined;

  if (!invoiceLocked) {
    const [client, saleLines] = await Promise.all([
      prisma.client.findFirst({
        where: {
          id: input.clientId,
          tenantId
        }
      }),
      buildSaleLines(prisma, tenantId, input.lines)
    ]);

    if (!client || !saleLines) {
      return { kind: 'invalid_relations' as const };
    }

    nextClientId = client.id;
    nextTotalCents = saleLines.reduce((total, line) => total + line.lineTotalCents, 0);
    lineMutation = {
      deleteMany: {},
      create: saleLines
    };
  } else if (existingSale.clientId !== input.clientId || JSON.stringify(existingSale.lines.map((line) => ({ id: line.catalogItemId, quantity: line.quantity }))) !== JSON.stringify(input.lines.map((line) => ({ id: line.catalogItemId, quantity: line.quantity })))) {
    return { kind: 'invoice_locked' as const };
  }

  const updatedSale = await prisma.sale.update({
    where: { id: existingSale.id },
    data: {
      clientId: nextClientId,
      title: input.title.trim(),
      stage: input.stage,
      totalCents: nextTotalCents,
      notes: input.notes?.trim() || null,
      ...(lineMutation ? { lines: lineMutation } : {})
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

  return {
    kind: 'updated' as const,
    sale: mapSaleSummary(updatedSale)
  };
}

export async function deleteSale(prisma: PrismaClient, tenantId: string, saleId: string) {
  const sale = await prisma.sale.findFirst({
    where: {
      id: saleId,
      tenantId
    },
    include: {
      client: true,
      invoice: {
        select: { id: true }
      },
      lines: {
        include: {
          catalogItem: true
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!sale) {
    return { kind: 'not_found' as const };
  }

  if (sale.invoice) {
    return { kind: 'invoice_locked' as const };
  }

  await prisma.sale.delete({
    where: { id: sale.id }
  });

  return {
    kind: 'deleted' as const,
    sale: mapSaleSummary(sale)
  };
}
