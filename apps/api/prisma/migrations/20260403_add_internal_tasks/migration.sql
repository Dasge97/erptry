-- CreateEnum
CREATE TYPE "InternalTaskStatus" AS ENUM ('todo', 'in_progress', 'blocked', 'done');

-- CreateEnum
CREATE TYPE "InternalTaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "InternalTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeEmployeeId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "InternalTaskStatus" NOT NULL DEFAULT 'todo',
    "priority" "InternalTaskPriority" NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalTask_tenantId_taskCode_key" ON "InternalTask"("tenantId", "taskCode");

-- CreateIndex
CREATE INDEX "InternalTask_tenantId_status_priority_idx" ON "InternalTask"("tenantId", "status", "priority");

-- CreateIndex
CREATE INDEX "InternalTask_assigneeEmployeeId_status_idx" ON "InternalTask"("assigneeEmployeeId", "status");

-- CreateIndex
CREATE INDEX "InternalTask_createdByUserId_createdAt_idx" ON "InternalTask"("createdByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_assigneeEmployeeId_fkey" FOREIGN KEY ("assigneeEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
