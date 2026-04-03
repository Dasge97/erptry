-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('booked', 'confirmed', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "location" TEXT,
    "assigneeEmployeeId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "internalTaskId" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'booked',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_tenantId_reservationCode_key" ON "Reservation"("tenantId", "reservationCode");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_startAt_status_idx" ON "Reservation"("tenantId", "startAt", "status");

-- CreateIndex
CREATE INDEX "Reservation_assigneeEmployeeId_startAt_endAt_idx" ON "Reservation"("assigneeEmployeeId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Reservation_internalTaskId_idx" ON "Reservation"("internalTaskId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_assigneeEmployeeId_fkey" FOREIGN KEY ("assigneeEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_internalTaskId_fkey" FOREIGN KEY ("internalTaskId") REFERENCES "InternalTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
