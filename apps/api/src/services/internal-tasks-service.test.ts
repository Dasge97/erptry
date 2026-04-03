import { describe, expect, it, vi } from 'vitest';

import { createInternalTask, listInternalTasks } from './internal-tasks-service';

describe('listInternalTasks', () => {
  it('normaliza tareas internas con empleado asignado y creador', async () => {
    const prisma = {
      internalTask: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'task_1',
            tenantId: 'tenant_1',
            taskCode: 'TASK-0001',
            title: 'Coordinar visita',
            description: 'Preparar materiales previos',
            saleId: 'sale_1',
            assigneeEmployeeId: 'employee_1',
            createdByUserId: 'user_1',
            status: 'in_progress',
            priority: 'high',
            dueDate: new Date('2026-04-20T00:00:00.000Z'),
            completedAt: null,
            assigneeEmployee: {
              id: 'employee_1',
              employeeCode: 'EMP-001',
              fullName: 'Ana Operaciones',
              department: 'Operaciones',
              jobTitle: 'Operations Lead',
              status: 'active'
            },
            createdByUser: {
              id: 'user_1',
              fullName: 'Owner Demo',
              email: 'owner@erptry.test'
            },
            sale: {
              id: 'sale_1',
              reference: 'SAL-20260403-AAAA1111',
              title: 'Implantacion Acme',
              stage: 'won',
              client: {
                id: 'client_1',
                fullName: 'Acme SL',
                email: 'hola@acme.test'
              }
            }
          }
        ])
      }
    };

    const tasks = await listInternalTasks(prisma as never, 'tenant_1');

    expect(tasks[0]?.taskCode).toBe('TASK-0001');
    expect(tasks[0]?.assigneeEmployee.fullName).toBe('Ana Operaciones');
    expect(tasks[0]?.sale?.reference).toBe('SAL-20260403-AAAA1111');
  });
});

describe('createInternalTask', () => {
  it('crea una tarea interna valida enlazada a empleado y creador', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_1', status: 'active' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      sale: {
        findFirst: vi.fn().mockResolvedValue({ id: 'sale_1' })
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
      internalTask: {
        create: vi.fn().mockImplementation(async ({ data }) => ({
          ...data,
          assigneeEmployee: {
            id: 'employee_1',
            employeeCode: 'EMP-001',
            fullName: 'Ana Operaciones',
            department: 'Operaciones',
            jobTitle: 'Operations Lead',
            status: 'active'
          },
          createdByUser: {
            id: 'user_1',
            fullName: 'Owner Demo',
            email: 'owner@erptry.test'
          },
          sale: {
            id: 'sale_1',
            reference: 'SAL-20260403-AAAA1111',
            title: 'Implantacion Acme',
            stage: 'won',
            client: {
              id: 'client_1',
              fullName: 'Acme SL',
              email: 'hola@acme.test'
            }
          }
        }))
      }
    };

    const task = await createInternalTask(prisma as never, 'tenant_1', 'user_1', {
      title: 'Coordinar visita',
      description: 'Preparar materiales previos',
      saleId: 'sale_1',
      assigneeEmployeeId: 'employee_1',
      status: 'done',
      priority: 'high',
      dueDate: '2026-04-20'
    });

    expect(task?.kind).toBe('created');
    if (task?.kind === 'created') {
      expect(task.task.title).toBe('Coordinar visita');
      expect(task.task.status).toBe('done');
      expect(task.task.dueDate).toBe('2026-04-20');
      expect(task.task.completedAt).not.toBeNull();
      expect(task.task.sale?.reference).toBe('SAL-20260403-AAAA1111');
    }
  });

  it('rechaza tareas con empleado fuera del tenant', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue(null)
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      }
    };

    const task = await createInternalTask(prisma as never, 'tenant_1', 'user_1', {
      title: 'Sin responsable valido',
      assigneeEmployeeId: 'missing',
      status: 'todo',
      priority: 'medium'
    });

    expect(task).toEqual({ kind: 'invalid_relations' });
  });

  it('rechaza ventas no ganadas como origen operativo', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_1', status: 'active' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      sale: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    const task = await createInternalTask(prisma as never, 'tenant_1', 'user_1', {
      title: 'No deberia enlazar venta abierta',
      saleId: 'sale_open',
      assigneeEmployeeId: 'employee_1',
      status: 'todo',
      priority: 'medium'
    });

    expect(task).toEqual({ kind: 'invalid_relations' });
  });

  it('rechaza asignar tareas a empleados inactivos', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_1', status: 'inactive' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      }
    };

    const task = await createInternalTask(prisma as never, 'tenant_1', 'user_1', {
      title: 'No asignable',
      assigneeEmployeeId: 'employee_1',
      status: 'todo',
      priority: 'medium'
    });

    expect(task).toEqual({ kind: 'assignee_unavailable' });
  });
});
