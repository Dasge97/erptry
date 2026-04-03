import { PrismaClient } from '@prisma/client';

declare global {
  var __erptryPrisma__: PrismaClient | undefined;
}

export function createPrismaClient() {
  return new PrismaClient();
}

export const prisma = globalThis.__erptryPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__erptryPrisma__ = prisma;
}
