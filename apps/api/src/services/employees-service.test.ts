import { describe, expect, it, vi } from 'vitest';

import { createEmployee, listEmployees } from './employees-service.js';

describe('listEmployees', () => {
  it('normaliza empleados con usuario enlazado', async () => {
    const prisma = {
      employee: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'employee_1',
            tenantId: 'tenant_1',
            linkedUserId: 'user_1',
            employeeCode: 'EMP-001',
            fullName: 'Ana Operaciones',
            workEmail: 'ana@erptry.test',
            phone: '600000111',
            department: 'Operaciones',
            jobTitle: 'Operations Lead',
            employmentType: 'full_time',
            status: 'active',
            startDate: new Date('2026-04-01T00:00:00.000Z'),
            notes: 'Responsable interna',
            linkedUser: {
              id: 'user_1',
              fullName: 'Ana Operaciones',
              email: 'ana@erptry.test'
            }
          }
        ])
      }
    };

    const employees = await listEmployees(prisma as never, 'tenant_1');

    expect(employees[0]?.employeeCode).toBe('EMP-001');
    expect(employees[0]?.linkedUser?.email).toBe('ana@erptry.test');
  });
});

describe('createEmployee', () => {
  it('crea un empleado con usuario enlazado del tenant', async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      notification: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          ...data,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          readAt: null,
          createdAt: new Date('2026-04-03T12:00:00.000Z')
        }))
      },
      employee: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          ...data,
          linkedUser: {
            id: 'user_1',
            fullName: 'Ana Operaciones',
            email: 'ana@erptry.test'
          }
        }))
      }
    };

    const employee = await createEmployee(prisma as never, 'tenant_1', {
      linkedUserId: 'user_1',
      employeeCode: 'emp-010',
      fullName: 'Ana Operaciones',
      workEmail: 'ana@erptry.test',
      phone: '600000111',
      department: 'Operaciones',
      jobTitle: 'Operations Lead',
      employmentType: 'full_time',
      status: 'active',
      startDate: '2026-04-01',
      notes: 'Alta inicial'
    });

    expect(employee?.employeeCode).toBe('EMP-010');
    expect(employee?.startDate).toBe('2026-04-01');
    expect(employee?.linkedUserId).toBe('user_1');
  });

  it('rechaza enlazar un usuario fuera del tenant', async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    const employee = await createEmployee(prisma as never, 'tenant_1', {
      linkedUserId: 'missing-user',
      employeeCode: 'EMP-011',
      fullName: 'Sin Usuario',
      department: 'Operaciones',
      jobTitle: 'Coordinator',
      employmentType: 'contractor',
      status: 'active',
      startDate: '2026-04-01'
    });

    expect(employee).toBeNull();
  });
});
