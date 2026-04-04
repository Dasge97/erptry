import { describe, expect, it, vi } from 'vitest';

import { createReservation, listReservations } from './reservations-service.js';

describe('listReservations', () => {
  it('normaliza reservas con empleado, creador y tarea interna enlazada', async () => {
    const prisma = {
      reservation: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'reservation_1',
            tenantId: 'tenant_1',
            reservationCode: 'RSV-0001',
            title: 'Visita en cliente',
            notes: 'Preparar material previo',
            location: 'Sala Azul',
            assigneeEmployeeId: 'employee_1',
            createdByUserId: 'user_1',
            internalTaskId: 'task_1',
            status: 'confirmed',
            startAt: new Date('2026-04-21T09:00:00.000Z'),
            endAt: new Date('2026-04-21T10:00:00.000Z'),
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
            internalTask: {
              id: 'task_1',
              taskCode: 'TASK-001',
              title: 'Preparar visita',
              status: 'in_progress',
              priority: 'high',
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
          }
        ])
      }
    };

    const reservations = await listReservations(prisma as never, 'tenant_1');

    expect(reservations[0]?.reservationCode).toBe('RSV-0001');
    expect(reservations[0]?.internalTask?.taskCode).toBe('TASK-001');
    expect(reservations[0]?.internalTask?.sale?.reference).toBe('SAL-20260403-AAAA1111');
  });
});

describe('createReservation', () => {
  it('crea una reserva valida sin solapamientos', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_1', status: 'active' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      internalTask: {
        findFirst: vi.fn().mockResolvedValue({ id: 'task_1', assigneeEmployeeId: 'employee_1' })
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
      reservation: {
        findFirst: vi.fn().mockResolvedValue(null),
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
          internalTask: {
            id: 'task_1',
            taskCode: 'TASK-001',
            title: 'Preparar visita',
            status: 'in_progress',
            priority: 'high',
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
        }))
      }
    };

    const result = await createReservation(prisma as never, 'tenant_1', 'user_1', {
      title: 'Visita en cliente',
      notes: 'Preparar material previo',
      location: 'Sala Azul',
      assigneeEmployeeId: 'employee_1',
      internalTaskId: 'task_1',
      status: 'confirmed',
      startAt: '2026-04-21T09:00:00.000Z',
      endAt: '2026-04-21T10:00:00.000Z'
    });

    expect(result.kind).toBe('created');
    if (result.kind === 'created') {
      expect(result.reservation.status).toBe('confirmed');
      expect(result.reservation.internalTask?.taskCode).toBe('TASK-001');
      expect(result.reservation.internalTask?.sale?.reference).toBe('SAL-20260403-AAAA1111');
    }
  });

  it('rechaza reservas con agenda solapada para el mismo empleado', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_1', status: 'active' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      reservation: {
        findFirst: vi.fn().mockResolvedValue({ id: 'reservation_existing' })
      }
    };

    const result = await createReservation(prisma as never, 'tenant_1', 'user_1', {
      title: 'Solapa bloqueante',
      assigneeEmployeeId: 'employee_1',
      status: 'booked',
      startAt: '2026-04-21T09:30:00.000Z',
      endAt: '2026-04-21T10:30:00.000Z'
    });

    expect(result.kind).toBe('schedule_conflict');
  });

  it('rechaza reservas sobre empleados no activos', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_1', status: 'on_leave' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      reservation: {
        findFirst: vi.fn()
      }
    };

    const result = await createReservation(prisma as never, 'tenant_1', 'user_1', {
      title: 'No deberia agendarse',
      assigneeEmployeeId: 'employee_1',
      status: 'booked',
      startAt: '2026-04-21T09:30:00.000Z',
      endAt: '2026-04-21T10:30:00.000Z'
    });

    expect(result).toEqual({ kind: 'assignee_unavailable' });
  });

  it('rechaza reservas que rompen la trazabilidad con la tarea enlazada', async () => {
    const prisma = {
      employee: {
        findFirst: vi.fn().mockResolvedValue({ id: 'employee_2', status: 'active' })
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'user_1' })
      },
      internalTask: {
        findFirst: vi.fn().mockResolvedValue({ id: 'task_1', assigneeEmployeeId: 'employee_1' })
      },
      reservation: {
        findFirst: vi.fn()
      }
    };

    const result = await createReservation(prisma as never, 'tenant_1', 'user_1', {
      title: 'Visita inconsistente',
      assigneeEmployeeId: 'employee_2',
      internalTaskId: 'task_1',
      status: 'booked',
      startAt: '2026-04-21T09:30:00.000Z',
      endAt: '2026-04-21T10:30:00.000Z'
    });

    expect(result).toEqual({ kind: 'assignee_mismatch' });
  });
});
