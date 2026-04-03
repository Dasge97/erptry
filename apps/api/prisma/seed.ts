import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { PrismaClient, TenantPlan } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PERMISSIONS = [
  ['tenant.manage', 'Gestionar tenant'],
  ['users.manage', 'Gestionar usuarios'],
  ['roles.manage', 'Gestionar roles'],
  ['settings.manage', 'Gestionar ajustes'],
  ['sales.view', 'Ver ventas'],
  ['sales.manage', 'Gestionar ventas'],
  ['billing.view', 'Ver facturas'],
  ['billing.manage', 'Gestionar facturas'],
  ['payments.view', 'Ver cobros'],
  ['payments.manage', 'Gestionar cobros'],
  ['employees.view', 'Ver empleados'],
  ['employees.manage', 'Gestionar empleados'],
  ['tasks.view', 'Ver trabajo interno'],
  ['tasks.manage', 'Gestionar trabajo interno'],
  ['reservations.view', 'Ver agenda y reservas'],
  ['reservations.manage', 'Gestionar agenda y reservas'],
  ['analytics.view', 'Ver analitica'],
  ['reports.view', 'Ver reportes exportables'],
  ['notifications.view', 'Ver avisos internos'],
  ['notifications.manage', 'Gestionar avisos internos'],
  ['audit.view', 'Ver auditoria operativa'],
  ['audit.manage', 'Gestionar auditoria operativa']
] as const;

const ROLE_DEFINITIONS = [
  ['owner', 'Owner'],
  ['admin', 'Admin'],
  ['manager', 'Manager'],
  ['operator', 'Operator'],
  ['viewer', 'Viewer']
] as const;

const DEMO_USERS = [
  {
    email: 'owner@erptry.local',
    fullName: 'Owner Demo',
    envPasswordKey: 'SEED_ADMIN_PASSWORD',
    fallbackPassword: 'erptry1234',
    roleCode: 'owner'
  },
  {
    email: 'manager@erptry.local',
    fullName: 'Manager Demo',
    envPasswordKey: 'SEED_MANAGER_PASSWORD',
    fallbackPassword: 'erptry1234',
    roleCode: 'manager'
  },
  {
    email: 'operator@erptry.local',
    fullName: 'Operator Demo',
    envPasswordKey: 'SEED_OPERATOR_PASSWORD',
    fallbackPassword: 'erptry1234',
    roleCode: 'operator'
  },
  {
    email: 'viewer@erptry.local',
    fullName: 'Viewer Demo',
    envPasswordKey: 'SEED_VIEWER_PASSWORD',
    fallbackPassword: 'erptry1234',
    roleCode: 'viewer'
  }
] as const;

async function main() {
  const tenantSlug = process.env.SEED_TENANT_SLUG ?? 'erptry';
  const tenantName = process.env.SEED_TENANT_NAME ?? 'ERPTRY Demo';
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'owner@erptry.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'erptry1234';

  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: tenantName, plan: TenantPlan.growth },
    create: {
      slug: tenantSlug,
      name: tenantName,
      plan: TenantPlan.growth
    }
  });

  await prisma.tenantSetting.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: 'core'
      }
    },
    update: {
      value: {
        brandingName: tenantName,
        defaultLocale: 'es-ES',
        timezone: 'Europe/Madrid'
      }
    },
    create: {
      tenantId: tenant.id,
      key: 'core',
      value: {
        brandingName: tenantName,
        defaultLocale: 'es-ES',
        timezone: 'Europe/Madrid'
      }
    }
  });

  const permissions = await Promise.all(
    DEFAULT_PERMISSIONS.map(([code, name]) =>
      prisma.permission.upsert({
        where: { code },
        update: { name },
        create: { code, name }
      })
    )
  );

  const roles = await Promise.all(
    ROLE_DEFINITIONS.map(([code, name]) =>
      prisma.role.upsert({
        where: { code },
        update: { name },
        create: {
          code,
          name
        }
      })
    )
  );

  const roleByCode = new Map(roles.map((role) => [role.code, role]));
  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission]));
  const rolePermissions = new Map<string, string[]>([
    ['owner', DEFAULT_PERMISSIONS.map(([code]) => code)],
    ['admin', ['tenant.manage', 'users.manage', 'roles.manage', 'settings.manage', 'sales.view', 'sales.manage', 'billing.view', 'billing.manage', 'payments.view', 'payments.manage', 'employees.view', 'employees.manage', 'tasks.view', 'tasks.manage', 'reservations.view', 'reservations.manage', 'analytics.view', 'reports.view', 'notifications.view', 'notifications.manage', 'audit.view', 'audit.manage']],
    ['manager', ['users.manage', 'sales.view', 'sales.manage', 'billing.view', 'billing.manage', 'payments.view', 'payments.manage', 'employees.view', 'employees.manage', 'tasks.view', 'tasks.manage', 'reservations.view', 'reservations.manage', 'analytics.view', 'reports.view', 'notifications.view', 'notifications.manage', 'audit.view']],
    ['operator', ['sales.view', 'billing.view', 'payments.view', 'employees.view', 'tasks.view', 'reservations.view', 'analytics.view', 'reports.view', 'notifications.view', 'audit.view']],
    ['viewer', ['sales.view', 'billing.view', 'payments.view', 'employees.view', 'tasks.view', 'reservations.view', 'analytics.view', 'reports.view', 'notifications.view', 'audit.view']]
  ]);

  await Promise.all(
    Array.from(rolePermissions.entries()).flatMap(([roleCode, permissionCodes]) => {
      const role = roleByCode.get(roleCode);

      if (!role) {
        throw new Error(`Role not found for code ${roleCode}`);
      }

      return permissionCodes.map((permissionCode) => {
        const permission = permissionByCode.get(permissionCode);

        if (!permission) {
          throw new Error(`Permission not found for code ${permissionCode}`);
        }

        return prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      });
    })
  );

  const demoUsers = await Promise.all(
    DEMO_USERS.map(async (demoUser) => {
      const role = roleByCode.get(demoUser.roleCode);

      if (!role) {
        throw new Error(`Role not found for demo user ${demoUser.email}`);
      }

      const resolvedEmail = demoUser.roleCode === 'owner'
        ? adminEmail
        : demoUser.email;
      const resolvedPassword = process.env[demoUser.envPasswordKey] ?? demoUser.fallbackPassword;
      const passwordHash = await bcrypt.hash(
        demoUser.roleCode === 'owner' ? adminPassword : resolvedPassword,
        10
      );

      const user = await prisma.user.upsert({
        where: { email: resolvedEmail },
        update: {
          fullName: demoUser.fullName,
          tenantId: tenant.id,
          passwordHash
        },
        create: {
          email: resolvedEmail,
          fullName: demoUser.fullName,
          tenantId: tenant.id,
          passwordHash
        }
      });

      await prisma.userRole.deleteMany({
        where: {
          userId: user.id,
          roleId: {
            not: role.id
          }
        }
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id
        }
      });

      return [demoUser.roleCode, user] as const;
    })
  );

  const demoUserByRole = new Map(demoUsers);
  const admin = demoUserByRole.get('owner');

  if (!admin) {
    throw new Error('Owner demo user was not created');
  }

  await prisma.session.deleteMany({
    where: {
      userId: admin.id,
      revokedAt: null,
      expiresAt: {
        lt: new Date()
      }
    }
  });

  await prisma.client.upsert({
    where: {
      id: 'seed-client-acme'
    },
    update: {
      tenantId: tenant.id,
      fullName: 'Acme Servicios',
      email: 'contacto@acme.test',
      phone: '600111222',
      segment: 'vip',
      notes: 'Cliente de referencia para el primer vertical.'
    },
    create: {
      id: 'seed-client-acme',
      tenantId: tenant.id,
      fullName: 'Acme Servicios',
      email: 'contacto@acme.test',
      phone: '600111222',
      segment: 'vip',
      notes: 'Cliente de referencia para el primer vertical.'
    }
  });

  await prisma.catalogItem.upsert({
    where: {
      id: 'seed-catalog-service-1'
    },
    update: {
      tenantId: tenant.id,
      name: 'Consultoria inicial',
      kind: 'service',
      priceCents: 12000,
      durationMin: 60,
      status: 'active',
      sku: 'SERV-001',
      notes: 'Servicio base para primeras propuestas comerciales.'
    },
    create: {
      id: 'seed-catalog-service-1',
      tenantId: tenant.id,
      name: 'Consultoria inicial',
      kind: 'service',
      priceCents: 12000,
      durationMin: 60,
      status: 'active',
      sku: 'SERV-001',
      notes: 'Servicio base para primeras propuestas comerciales.'
    }
  });

  await prisma.catalogItem.upsert({
    where: {
      id: 'seed-catalog-product-1'
    },
    update: {
      tenantId: tenant.id,
      name: 'Kit de implantacion',
      kind: 'product',
      priceCents: 45000,
      durationMin: null,
      status: 'active',
      sku: 'PROD-001',
      notes: 'Material inicial del servicio de implantacion.'
    },
    create: {
      id: 'seed-catalog-product-1',
      tenantId: tenant.id,
      name: 'Kit de implantacion',
      kind: 'product',
      priceCents: 45000,
      durationMin: null,
      status: 'active',
      sku: 'PROD-001',
      notes: 'Material inicial del servicio de implantacion.'
    }
  });

  await prisma.sale.upsert({
    where: {
      reference: 'SAL-BOOTSTRAP-001'
    },
    update: {
      tenantId: tenant.id,
      clientId: 'seed-client-acme',
      title: 'Propuesta de implantacion inicial',
      stage: 'won',
      totalCents: 57000,
      notes: 'Une cliente y catalogo dentro del primer flujo comercial real.',
      lines: {
        deleteMany: {},
        create: [
          {
            id: 'seed-sale-line-1',
            catalogItemId: 'seed-catalog-service-1',
            quantity: 1,
            unitPriceCents: 12000,
            lineTotalCents: 12000
          },
          {
            id: 'seed-sale-line-2',
            catalogItemId: 'seed-catalog-product-1',
            quantity: 1,
            unitPriceCents: 45000,
            lineTotalCents: 45000
          }
        ]
      }
    },
    create: {
      id: 'seed-sale-1',
      tenantId: tenant.id,
      clientId: 'seed-client-acme',
      reference: 'SAL-BOOTSTRAP-001',
      title: 'Propuesta de implantacion inicial',
      stage: 'won',
      totalCents: 57000,
      notes: 'Une cliente y catalogo dentro del primer flujo comercial real.',
      lines: {
        create: [
          {
            id: 'seed-sale-line-1',
            catalogItemId: 'seed-catalog-service-1',
            quantity: 1,
            unitPriceCents: 12000,
            lineTotalCents: 12000
          },
          {
            id: 'seed-sale-line-2',
            catalogItemId: 'seed-catalog-product-1',
            quantity: 1,
            unitPriceCents: 45000,
            lineTotalCents: 45000
          }
        ]
      }
    }
  });

  await prisma.invoice.upsert({
    where: {
      saleId: 'seed-sale-1'
    },
    update: {
      tenantId: tenant.id,
      clientId: 'seed-client-acme',
      reference: 'INV-BOOTSTRAP-001',
      status: 'issued',
      dueDate: new Date('2026-04-30T00:00:00.000Z'),
      issuedAt: new Date('2026-04-03T09:00:00.000Z'),
      subtotalCents: 57000,
      totalCents: 57000,
      notes: 'Factura inicial generada desde la propuesta bootstrap.',
      lines: {
        deleteMany: {},
        create: [
          {
            id: 'seed-invoice-line-1',
            catalogItemId: 'seed-catalog-service-1',
            description: 'Consultoria inicial',
            kind: 'service',
            quantity: 1,
            unitPriceCents: 12000,
            lineTotalCents: 12000
          },
          {
            id: 'seed-invoice-line-2',
            catalogItemId: 'seed-catalog-product-1',
            description: 'Kit de implantacion',
            kind: 'product',
            quantity: 1,
            unitPriceCents: 45000,
            lineTotalCents: 45000
          }
        ]
      }
    },
    create: {
      id: 'seed-invoice-1',
      tenantId: tenant.id,
      saleId: 'seed-sale-1',
      clientId: 'seed-client-acme',
      reference: 'INV-BOOTSTRAP-001',
      status: 'issued',
      dueDate: new Date('2026-04-30T00:00:00.000Z'),
      issuedAt: new Date('2026-04-03T09:00:00.000Z'),
      subtotalCents: 57000,
      totalCents: 57000,
      notes: 'Factura inicial generada desde la propuesta bootstrap.',
      lines: {
        create: [
          {
            id: 'seed-invoice-line-1',
            catalogItemId: 'seed-catalog-service-1',
            description: 'Consultoria inicial',
            kind: 'service',
            quantity: 1,
            unitPriceCents: 12000,
            lineTotalCents: 12000
          },
          {
            id: 'seed-invoice-line-2',
            catalogItemId: 'seed-catalog-product-1',
            description: 'Kit de implantacion',
            kind: 'product',
            quantity: 1,
            unitPriceCents: 45000,
            lineTotalCents: 45000
          }
        ]
      }
    }
  });

  await prisma.payment.upsert({
    where: {
      reference: 'PAY-BOOTSTRAP-001'
    },
    update: {
      tenantId: tenant.id,
      invoiceId: 'seed-invoice-1',
      status: 'confirmed',
      method: 'bank_transfer',
      amountCents: 20000,
      receivedAt: new Date('2026-04-10T10:00:00.000Z'),
      notes: 'Cobro parcial inicial para validar pagos sobre factura.'
    },
    create: {
      id: 'seed-payment-1',
      tenantId: tenant.id,
      invoiceId: 'seed-invoice-1',
      reference: 'PAY-BOOTSTRAP-001',
      status: 'confirmed',
      method: 'bank_transfer',
      amountCents: 20000,
      receivedAt: new Date('2026-04-10T10:00:00.000Z'),
      notes: 'Cobro parcial inicial para validar pagos sobre factura.'
    }
  });

  await prisma.employee.upsert({
    where: {
      tenantId_employeeCode: {
        tenantId: tenant.id,
        employeeCode: 'EMP-001'
      }
    },
    update: {
      linkedUserId: admin.id,
      fullName: 'Owner Demo',
      workEmail: admin.email,
      phone: '600000111',
      department: 'Direccion',
      jobTitle: 'Founder / General Manager',
      employmentType: 'full_time',
      status: 'active',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      notes: 'Empleado semilla para enlazar personas internas con usuarios del tenant.'
    },
    create: {
      id: 'seed-employee-1',
      tenantId: tenant.id,
      linkedUserId: admin.id,
      employeeCode: 'EMP-001',
      fullName: 'Owner Demo',
      workEmail: admin.email,
      phone: '600000111',
      department: 'Direccion',
      jobTitle: 'Founder / General Manager',
      employmentType: 'full_time',
      status: 'active',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      notes: 'Empleado semilla para enlazar personas internas con usuarios del tenant.'
    }
  });

  await prisma.internalTask.upsert({
    where: {
      tenantId_taskCode: {
        tenantId: tenant.id,
        taskCode: 'TASK-BOOT-001'
      }
    },
    update: {
      title: 'Preparar arranque de servicio para Acme',
      description: 'Tarea semilla enlazada a la venta ganada para abrir la operacion interna sobre el cliente demo.',
      saleId: 'seed-sale-1',
      assigneeEmployeeId: 'seed-employee-1',
      createdByUserId: admin.id,
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date('2026-04-20T00:00:00.000Z'),
      completedAt: null
    },
    create: {
      id: 'seed-internal-task-1',
      tenantId: tenant.id,
      taskCode: 'TASK-BOOT-001',
      title: 'Preparar arranque de servicio para Acme',
      description: 'Tarea semilla enlazada a la venta ganada para abrir la operacion interna sobre el cliente demo.',
      saleId: 'seed-sale-1',
      assigneeEmployeeId: 'seed-employee-1',
      createdByUserId: admin.id,
      status: 'in_progress',
      priority: 'high',
      dueDate: new Date('2026-04-20T00:00:00.000Z'),
      completedAt: null
    }
  });

  await prisma.reservation.upsert({
    where: {
      tenantId_reservationCode: {
        tenantId: tenant.id,
        reservationCode: 'RSV-BOOT-001'
      }
    },
    update: {
      title: 'Kickoff operativo con Acme',
      notes: 'Reserva semilla enlazada a la tarea de arranque para validar agenda real y reglas anti-solapamiento.',
      location: 'Oficinas Acme',
      assigneeEmployeeId: 'seed-employee-1',
      createdByUserId: admin.id,
      internalTaskId: 'seed-internal-task-1',
      status: 'confirmed',
      startAt: new Date('2026-04-21T09:00:00.000Z'),
      endAt: new Date('2026-04-21T10:30:00.000Z')
    },
    create: {
      id: 'seed-reservation-1',
      tenantId: tenant.id,
      reservationCode: 'RSV-BOOT-001',
      title: 'Kickoff operativo con Acme',
      notes: 'Reserva semilla enlazada a la tarea de arranque para validar agenda real y reglas anti-solapamiento.',
      location: 'Oficinas Acme',
      assigneeEmployeeId: 'seed-employee-1',
      createdByUserId: admin.id,
      internalTaskId: 'seed-internal-task-1',
      status: 'confirmed',
      startAt: new Date('2026-04-21T09:00:00.000Z'),
      endAt: new Date('2026-04-21T10:30:00.000Z')
    }
  });

  await prisma.notification.upsert({
    where: { id: 'seed-notification-1' },
    update: {
      tenantId: tenant.id,
      type: 'finance',
      severity: 'warning',
      title: 'Factura bootstrap con saldo pendiente',
      message: 'INV-BOOTSTRAP-001 mantiene 370.00 EUR pendientes tras el primer cobro.',
      resourceType: 'invoice',
      resourceId: 'seed-invoice-1',
      readAt: null,
      createdAt: new Date('2026-04-10T10:05:00.000Z')
    },
    create: {
      id: 'seed-notification-1',
      tenantId: tenant.id,
      type: 'finance',
      severity: 'warning',
      title: 'Factura bootstrap con saldo pendiente',
      message: 'INV-BOOTSTRAP-001 mantiene 370.00 EUR pendientes tras el primer cobro.',
      resourceType: 'invoice',
      resourceId: 'seed-invoice-1',
      readAt: null,
      createdAt: new Date('2026-04-10T10:05:00.000Z')
    }
  });

  await prisma.notification.upsert({
    where: { id: 'seed-notification-2' },
    update: {
      tenantId: tenant.id,
      type: 'reminder',
      severity: 'info',
      title: 'Reserva inicial confirmada',
      message: 'RSV-BOOT-001 queda lista para la visita operativa del 21/04.',
      resourceType: 'reservation',
      resourceId: 'seed-reservation-1',
      readAt: new Date('2026-04-15T08:30:00.000Z'),
      createdAt: new Date('2026-04-15T08:00:00.000Z')
    },
    create: {
      id: 'seed-notification-2',
      tenantId: tenant.id,
      type: 'reminder',
      severity: 'info',
      title: 'Reserva inicial confirmada',
      message: 'RSV-BOOT-001 queda lista para la visita operativa del 21/04.',
      resourceType: 'reservation',
      resourceId: 'seed-reservation-1',
      readAt: new Date('2026-04-15T08:30:00.000Z'),
      createdAt: new Date('2026-04-15T08:00:00.000Z')
    }
  });

  await prisma.auditLog.upsert({
    where: { id: 'seed-audit-1' },
    update: {
      tenantId: tenant.id,
      actorUserId: admin.id,
      actorName: admin.fullName,
      actorEmail: admin.email,
      type: 'activity',
      severity: 'success',
      action: 'user.create',
      resourceType: 'user',
      resourceId: admin.id,
      summary: 'Owner Demo ha consolidado el usuario owner inicial del tenant.',
      createdAt: new Date('2026-04-03T09:15:00.000Z')
    },
    create: {
      id: 'seed-audit-1',
      tenantId: tenant.id,
      actorUserId: admin.id,
      actorName: admin.fullName,
      actorEmail: admin.email,
      type: 'activity',
      severity: 'success',
      action: 'user.create',
      resourceType: 'user',
      resourceId: admin.id,
      summary: 'Owner Demo ha consolidado el usuario owner inicial del tenant.',
      createdAt: new Date('2026-04-03T09:15:00.000Z')
    }
  });

  await prisma.auditLog.upsert({
    where: { id: 'seed-audit-2' },
    update: {
      tenantId: tenant.id,
      actorUserId: admin.id,
      actorName: admin.fullName,
      actorEmail: admin.email,
      type: 'finance',
      severity: 'warning',
      action: 'invoice.create',
      resourceType: 'invoice',
      resourceId: 'seed-invoice-1',
      summary: 'Owner Demo ha emitido la factura bootstrap INV-BOOTSTRAP-001 con saldo pendiente.',
      createdAt: new Date('2026-04-10T10:00:00.000Z')
    },
    create: {
      id: 'seed-audit-2',
      tenantId: tenant.id,
      actorUserId: admin.id,
      actorName: admin.fullName,
      actorEmail: admin.email,
      type: 'finance',
      severity: 'warning',
      action: 'invoice.create',
      resourceType: 'invoice',
      resourceId: 'seed-invoice-1',
      summary: 'Owner Demo ha emitido la factura bootstrap INV-BOOTSTRAP-001 con saldo pendiente.',
      createdAt: new Date('2026-04-10T10:00:00.000Z')
    }
  });

  console.log(JSON.stringify({ tenantId: tenant.id, adminId: admin.id, bootstrapTokenId: randomUUID() }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
