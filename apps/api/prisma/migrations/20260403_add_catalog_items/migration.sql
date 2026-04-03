-- CreateEnum
CREATE TYPE "CatalogItemKind" AS ENUM ('product', 'service');

-- CreateEnum
CREATE TYPE "CatalogItemStatus" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CatalogItemKind" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "durationMin" INTEGER,
    "status" "CatalogItemStatus" NOT NULL DEFAULT 'active',
    "sku" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogItem_tenantId_name_idx" ON "CatalogItem"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
