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

async function resolveLinkedUser(prisma: PrismaClient, tenantId: string, linkedUserId?: string | undefined) {
  const normalizedLinkedUserId = linkedUserId?.trim() || null;

  if (!normalizedLinkedUserId) {
    return '';
  }

  const linkedUser = await prisma.user.findFirst({
    where: {
      id: normalizedLinkedUserId,
      tenantId
    },
    select: { id: true }
  });

  return linkedUser ? normalizedLinkedUserId : null;
}

async function fetchEmployee(prisma: PrismaClient, tenantId: string, employeeId: string) {
  return prisma.employee.findFirst({
    where: {
      id: employeeId,
      tenantId
    },
    include: {
      linkedUser: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      internalTasks: { select: { id: true } },
      reservations: { select: { id: true } }
    }
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
  const linkedUserId = await resolveLinkedUser(prisma, tenantId, input.linkedUserId);

  if (linkedUserId === null) {
    return null;
  }

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const employee = await prisma.employee.create({
    data: {
      id: randomUUID(),
      tenantId,
      linkedUserId: linkedUserId || null,
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

export async function updateEmployee(
  prisma: PrismaClient,
  tenantId: string,
  input: {
    id: string;
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
  const existingEmployee = await fetchEmployee(prisma, tenantId, input.id);

  if (!existingEmployee) {
    return { kind: 'not_found' as const };
  }

  const linkedUserId = await resolveLinkedUser(prisma, tenantId, input.linkedUserId);

  if (linkedUserId === null) {
    return { kind: 'invalid_relations' as const };
  }

  if (input.status === 'inactive' && (existingEmployee.internalTasks.length > 0 || existingEmployee.reservations.length > 0)) {
    return { kind: 'has_relations' as const };
  }

  const startDate = new Date(`${input.startDate}T00:00:00.000Z`);

  if (Number.isNaN(startDate.getTime())) {
    return { kind: 'invalid_relations' as const };
  }

  const employee = await prisma.employee.update({
    where: { id: existingEmployee.id },
    data: {
      linkedUserId: linkedUserId || null,
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

  return {
    kind: 'updated' as const,
    employee: mapEmployeeSummary(employee)
  };
}

export async function deleteEmployee(prisma: PrismaClient, tenantId: string, employeeId: string) {
  const employee = await fetchEmployee(prisma, tenantId, employeeId);

  if (!employee) {
    return { kind: 'not_found' as const };
  }

  if (employee.internalTasks.length > 0 || employee.reservations.length > 0) {
    return { kind: 'has_relations' as const };
  }

  await prisma.employee.delete({
    where: { id: employee.id }
  });

  return {
    kind: 'deleted' as const,
    employee: mapEmployeeSummary(employee)
  };
}
