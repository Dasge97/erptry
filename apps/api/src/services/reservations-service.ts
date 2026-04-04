import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { reservationSummarySchema } from '@erptry/contracts';

import { createNotification } from './notifications-service.js';

function buildReservationCode() {
  return `RSV-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function mapReservationSummary(reservation: {
  id: string;
  tenantId: string;
  reservationCode: string;
  title: string;
  notes: string | null;
  location: string | null;
  assigneeEmployeeId: string;
  createdByUserId: string;
  internalTaskId: string | null;
  status: 'booked' | 'confirmed' | 'completed' | 'cancelled';
  startAt: Date;
  endAt: Date;
  assigneeEmployee: {
    id: string;
    employeeCode: string;
    fullName: string;
    department: string;
    jobTitle: string;
    status: 'active' | 'on_leave' | 'inactive';
  };
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
  };
  internalTask: {
    id: string;
    taskCode: string;
    title: string;
    status: 'todo' | 'in_progress' | 'blocked' | 'done';
    priority: 'low' | 'medium' | 'high';
    sale: {
      id: string;
      reference: string;
      title: string;
      stage: 'draft' | 'sent' | 'won' | 'lost';
      client: {
        id: string;
        fullName: string;
        email: string | null;
      };
    } | null;
  } | null;
}) {
  return reservationSummarySchema.parse({
    ...reservation,
    startAt: reservation.startAt.toISOString(),
    endAt: reservation.endAt.toISOString()
  });
}

function parseIsoDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export async function listReservations(prisma: PrismaClient, tenantId: string) {
  const reservations = await prisma.reservation.findMany({
    where: { tenantId },
    orderBy: [{ startAt: 'asc' }, { createdAt: 'asc' }],
    include: {
      assigneeEmployee: {
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          department: true,
          jobTitle: true,
          status: true
        }
      },
      createdByUser: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      internalTask: {
        select: {
          id: true,
          taskCode: true,
          title: true,
          status: true,
          priority: true,
          sale: {
            select: {
              id: true,
              reference: true,
              title: true,
              stage: true,
              client: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return reservations.map(mapReservationSummary);
}

export async function createReservation(
  prisma: PrismaClient,
  tenantId: string,
  createdByUserId: string,
  input: {
    title: string;
    notes?: string | undefined;
    location?: string | undefined;
    assigneeEmployeeId: string;
    internalTaskId?: string | undefined;
    status: 'booked' | 'confirmed' | 'completed' | 'cancelled';
    startAt: string;
    endAt: string;
  }
) {
  const startAt = parseIsoDateTime(input.startAt);
  const endAt = parseIsoDateTime(input.endAt);

  if (!startAt || !endAt || endAt <= startAt) {
    return { kind: 'invalid_schedule' as const };
  }

  const internalTaskId = input.internalTaskId?.trim() || null;

  const [assigneeEmployee, creator, internalTask] = await Promise.all([
    prisma.employee.findFirst({
      where: {
        id: input.assigneeEmployeeId,
        tenantId
      },
      select: {
        id: true,
        status: true
      }
    }),
    prisma.user.findFirst({
      where: {
        id: createdByUserId,
        tenantId
      },
      select: { id: true }
    }),
    internalTaskId
      ? prisma.internalTask.findFirst({
          where: {
            id: internalTaskId,
            tenantId
          },
          select: {
            id: true,
            assigneeEmployeeId: true
          }
        })
      : Promise.resolve(null)
  ]);

  if (!assigneeEmployee || !creator || (internalTaskId && !internalTask)) {
    return { kind: 'invalid_relations' as const };
  }

  if (assigneeEmployee.status !== 'active') {
    return { kind: 'assignee_unavailable' as const };
  }

  if (internalTask && internalTask.assigneeEmployeeId !== input.assigneeEmployeeId) {
    return { kind: 'assignee_mismatch' as const };
  }

  const overlappingReservation = await prisma.reservation.findFirst({
    where: {
      tenantId,
      assigneeEmployeeId: input.assigneeEmployeeId,
      status: {
        not: 'cancelled'
      },
      startAt: {
        lt: endAt
      },
      endAt: {
        gt: startAt
      }
    },
    select: {
      id: true
    }
  });

  if (overlappingReservation) {
    return { kind: 'schedule_conflict' as const };
  }

  const reservation = await prisma.reservation.create({
    data: {
      id: randomUUID(),
      tenantId,
      reservationCode: buildReservationCode(),
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      location: input.location?.trim() || null,
      assigneeEmployeeId: input.assigneeEmployeeId,
      createdByUserId,
      internalTaskId,
      status: input.status,
      startAt,
      endAt
    },
    include: {
      assigneeEmployee: {
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          department: true,
          jobTitle: true,
          status: true
        }
      },
      createdByUser: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      internalTask: {
        select: {
          id: true,
          taskCode: true,
          title: true,
          status: true,
          priority: true,
          sale: {
            select: {
              id: true,
              reference: true,
              title: true,
              stage: true,
              client: {
                select: {
                  id: true,
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  const summary = mapReservationSummary(reservation);

  await createNotification(prisma, tenantId, {
    type: 'reminder',
    severity: summary.status === 'cancelled' ? 'warning' : 'info',
    title: `Reserva ${summary.reservationCode} planificada`,
    message: `${summary.assigneeEmployee.fullName} queda agendado para ${summary.title} el ${summary.startAt.slice(0, 10)}.`,
    resourceType: 'reservation',
    resourceId: summary.id
  });

  return {
    kind: 'created' as const,
    reservation: summary
  };
}
