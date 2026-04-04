import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { employeeSummarySchema } from '@erptry/contracts';

import { createNotification } from './notifications-service.js';

function mapEmployeeSummary(employee: {
  id: string;
  tenantId: string;
  linkedUserId: string | null;
  employeeCode: string;
  fullName: string;
  workEmail: string | null;
  phone: string | null;
  department: string;
  jobTitle: string;
  employmentType: 'full_time' | 'part_time' | 'contractor';
  status: 'active' | 'on_leave' | 'inactive';
  startDate: Date;
  notes: string | null;
  linkedUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}) {
  return employeeSummarySchema.parse({
    id: employee.id,
    tenantId: employee.tenantId,
    linkedUserId: employee.linkedUserId,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    workEmail: employee.workEmail,
    phone: employee.phone,
    department: employee.department,
    jobTitle: employee.jobTitle,
    employmentType: employee.employmentType,
    status: employee.status,
    startDate: employee.startDate.toISOString().slice(0, 10),
    notes: employee.notes,
    linkedUser: employee.linkedUser
  });
}

export async function listEmployees(prisma: PrismaClient, tenantId: string) {
  const employees = await prisma.employee.findMany({
    where: { tenantId },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    include: {
      linkedUser: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  return employees.map(mapEmployeeSummary);
}

export async function createEmployee(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    linkedUserId?: string | undefined;
    employeeCode: string;
    fullName: string;
    workEmail?: string | undefined;
    phone?: string | undefined;
    department: string;
    jobTitle: string;
    employmentType: 'full_time' | 'part_time' | 'contractor';
    status: 'active' | 'on_leave' | 'inactive';
    startDate: string;
    notes?: string | undefined;
  }
) {
  const linkedUserId = input.linkedUserId?.trim() || null;

  if (linkedUserId) {
    const linkedUser = await prisma.user.findFirst({
      where: {
        id: linkedUserId,
        tenantId
      },
      select: { id: true }
    });

    if (!linkedUser) {
      return null;
    }
  }

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const employee = await prisma.employee.create({
    data: {
      id: randomUUID(),
      tenantId,
      linkedUserId,
      employeeCode: input.employeeCode.trim().toUpperCase(),
      fullName: input.fullName.trim(),
      workEmail: input.workEmail?.trim().toLowerCase() || null,
      phone: input.phone?.trim() || null,
      department: input.department.trim(),
      jobTitle: input.jobTitle.trim(),
      employmentType: input.employmentType,
      status: input.status,
      startDate,
      notes: input.notes?.trim() || null
    },
    include: {
      linkedUser: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  const summary = mapEmployeeSummary(employee);

  await createNotification(prisma, tenantId, {
    type: 'activity',
    severity: summary.status === 'active' ? 'success' : 'info',
    title: `Empleado ${summary.employeeCode} incorporado`,
    message: `${summary.fullName} entra en ${summary.department} como ${summary.jobTitle}.`,
    resourceType: 'employee',
    resourceId: summary.id
  });

  return summary;
}
