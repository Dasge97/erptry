import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@prisma/client';

import { internalTaskSummarySchema } from '@erptry/contracts';

import { createNotification } from './notifications-service.js';

function buildTaskCode() {
  return `TASK-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function mapInternalTaskSummary(task: {
  id: string;
  tenantId: string;
  taskCode: string;
  title: string;
  description: string | null;
  saleId: string | null;
  assigneeEmployeeId: string;
  createdByUserId: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  completedAt: Date | null;
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
}) {
  return internalTaskSummarySchema.parse({
    id: task.id,
    tenantId: task.tenantId,
    taskCode: task.taskCode,
    title: task.title,
    description: task.description,
    saleId: task.saleId,
    assigneeEmployeeId: task.assigneeEmployeeId,
    createdByUserId: task.createdByUserId,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    completedAt: task.completedAt?.toISOString() ?? null,
    assigneeEmployee: task.assigneeEmployee,
    createdByUser: task.createdByUser,
    sale: task.sale
  });
}

export async function listInternalTasks(prisma: PrismaClient, tenantId: string) {
  const tasks = await prisma.internalTask.findMany({
    where: { tenantId },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
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
  });

  return tasks.map(mapInternalTaskSummary);
}

export async function createInternalTask(
  prisma: PrismaClient,
  tenantId: string,
  createdByUserId: string,
  input: {
    title: string;
    description?: string | undefined;
    saleId?: string | undefined;
    assigneeEmployeeId: string;
    status: 'todo' | 'in_progress' | 'blocked' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string | undefined;
  }
) {
  const saleId = input.saleId?.trim() || null;

  const [assigneeEmployee, creator, sale] = await Promise.all([
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
    saleId
      ? prisma.sale.findFirst({
          where: {
            id: saleId,
            tenantId,
            stage: 'won'
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  if (!assigneeEmployee || !creator || (saleId && !sale)) {
    return { kind: 'invalid_relations' as const };
  }

  if (assigneeEmployee.status === 'inactive') {
    return { kind: 'assignee_unavailable' as const };
  }

  const dueDate = input.dueDate?.trim()
    ? new Date(`${input.dueDate}T00:00:00.000Z`)
    : null;

  if (input.dueDate?.trim() && (!dueDate || Number.isNaN(dueDate.getTime()))) {
    return { kind: 'invalid_relations' as const };
  }

  const completedAt = input.status === 'done' ? new Date() : null;

  const task = await prisma.internalTask.create({
    data: {
      id: randomUUID(),
      tenantId,
      taskCode: buildTaskCode(),
      title: input.title.trim(),
      description: input.description?.trim() || null,
      saleId,
      assigneeEmployeeId: input.assigneeEmployeeId,
      createdByUserId,
      status: input.status,
      priority: input.priority,
      dueDate,
      completedAt
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
  });

  const summary = mapInternalTaskSummary(task);

  await createNotification(prisma, tenantId, {
    type: 'activity',
    severity: summary.priority === 'high' || summary.status === 'blocked' ? 'warning' : 'info',
    title: `Tarea ${summary.taskCode} creada`,
    message: `${summary.assigneeEmployee.fullName} recibe ${summary.title}${summary.sale ? ` para ${summary.sale.client.fullName} (${summary.sale.reference})` : ''}${summary.dueDate ? ` con vencimiento ${summary.dueDate}` : ''}.`,
    resourceType: 'internal_task',
    resourceId: summary.id
  });

  return {
    kind: 'created' as const,
    task: summary
  };
}
