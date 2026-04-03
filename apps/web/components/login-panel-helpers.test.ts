import { describe, expect, it } from 'vitest';

import {
  getAccessValidationChecks,
  getAccessReviewStorageKey,
  getNextVisitedAccessRoles,
  getAccessReviewTimeline,
  getAccessReviewSummary,
  getAuditActionLabel,
  getCatalogKindLabel,
  getCatalogStatusLabel,
  getDemoAccessProfiles,
  getEmployeeStatusLabel,
  getEmploymentTypeLabel,
  getPermissionGroupSummary,
  getReleaseOperableV1ActionPlan,
  getNotificationSeverityLabel,
  getNotificationTypeLabel,
  getInternalTaskPriorityLabel,
  getInternalTaskAssigneeOptions,
  getInternalTaskStatusLabel,
  getInvoiceStatusLabel,
  getPaymentFormState,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getRoleLabel,
  getReleaseOperableV1ReviewCards,
  getReleaseOperableV1Checklist,
  getResourceTypeLabel,
  getReservationAssigneeOptions,
  getReservationStatusLabel,
  getReservationScheduleState,
  getReservationSelectionForAssignee,
  getReservationSelectionForTask,
  getReservationTaskOptions,
  getSaleStageLabel,
  sanitizeAccessReviewRoles
} from './login-panel-helpers';

const employees = [
  { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' as const },
  { id: 'employee_leave', fullName: 'Luis', employeeCode: 'EMP-002', status: 'on_leave' as const },
  { id: 'employee_inactive', fullName: 'Marta', employeeCode: 'EMP-003', status: 'inactive' as const }
];

const tasks = [
  { id: 'task_1', taskCode: 'TASK-001', title: 'Preparar visita', assigneeEmployeeId: 'employee_active', assigneeEmployeeStatus: 'active' as const },
  { id: 'task_2', taskCode: 'TASK-002', title: 'Checklist', assigneeEmployeeId: 'employee_active', assigneeEmployeeStatus: 'active' as const },
  { id: 'task_3', taskCode: 'TASK-003', title: 'Seguimiento', assigneeEmployeeId: 'employee_leave', assigneeEmployeeStatus: 'on_leave' as const }
];

describe('login panel helpers', () => {
  it('deja fuera empleados inactivos al asignar tareas internas', () => {
    expect(getInternalTaskAssigneeOptions(employees).map((employee) => employee.id)).toEqual([
      'employee_active',
      'employee_leave'
    ]);
  });

  it('solo deja empleados activos para crear reservas', () => {
    expect(getReservationAssigneeOptions(employees).map((employee) => employee.id)).toEqual(['employee_active']);
  });

  it('filtra tareas de reserva por el empleado seleccionado cuando no hay tarea fijada', () => {
    expect(getReservationTaskOptions(tasks, 'employee_active', '').map((task) => task.id)).toEqual(['task_1', 'task_2']);
  });

  it('limpia la tarea seleccionada si cambia el empleado y rompe la trazabilidad', () => {
    expect(getReservationSelectionForAssignee(tasks, 'employee_leave', 'task_1')).toEqual({
      assigneeEmployeeId: 'employee_leave',
      taskId: ''
    });
  });

  it('arrastra el empleado correcto al elegir una tarea interna', () => {
    expect(getReservationSelectionForTask(tasks, 'task_2', 'employee_leave')).toEqual({
      assigneeEmployeeId: 'employee_active',
      taskId: 'task_2'
    });
  });

  it('bloquea enlazar tareas de reserva con responsables no activos', () => {
    expect(getReservationTaskOptions(tasks, '', '').map((task) => task.id)).toEqual(['task_1', 'task_2']);
    expect(getReservationSelectionForTask(tasks, 'task_3', 'employee_active')).toEqual({
      assigneeEmployeeId: 'employee_active',
      taskId: ''
    });
  });

  it('traduce enums operativos a copy legible en el backoffice', () => {
    expect(getCatalogKindLabel('service')).toBe('Servicio');
    expect(getCatalogStatusLabel('archived')).toBe('Archivado');
    expect(getSaleStageLabel('won')).toBe('Ganada');
    expect(getInvoiceStatusLabel('paid')).toBe('Pagada');
    expect(getPaymentStatusLabel('confirmed')).toBe('Confirmado');
    expect(getPaymentMethodLabel('bank_transfer')).toBe('Transferencia');
    expect(getEmployeeStatusLabel('on_leave')).toBe('De baja');
    expect(getEmploymentTypeLabel('full_time')).toBe('Jornada completa');
    expect(getInternalTaskStatusLabel('in_progress')).toBe('En curso');
    expect(getInternalTaskPriorityLabel('high')).toBe('Alta');
    expect(getReservationStatusLabel('booked')).toBe('Reservada');
  });

  it('humaniza los codigos de rol para evitar jerga tecnica en usuarios y permisos', () => {
    expect(getRoleLabel('owner')).toBe('Owner');
    expect(getRoleLabel('manager')).toBe('Manager');
    expect(getRoleLabel('viewer')).toBe('Viewer');
    expect(getRoleLabel('custom_role')).toBe('custom_role');
  });

  it('humaniza trazas y notificaciones para un usuario no tecnico', () => {
    expect(getNotificationSeverityLabel('warning')).toBe('Atencion');
    expect(getNotificationTypeLabel('finance')).toBe('Finanzas');
    expect(getResourceTypeLabel('internal_task')).toBe('Tarea interna');
    expect(getResourceTypeLabel('catalog_item')).toBe('Producto o servicio');
    expect(getAuditActionLabel('payment.create')).toBe('Cobro registrado');
    expect(getAuditActionLabel('notification.read')).toBe('Aviso marcado como leido');
  });

  it('expone perfiles demo con expectativas claras para el repaso manual', () => {
    expect(getDemoAccessProfiles()).toEqual([
      {
        id: 'owner',
        title: 'Owner demo',
        email: 'owner@erptry.local',
        summary: 'Control total del tenant para validar ajustes, roles, usuarios y el circuito vendible completo.',
        canReview: ['Ajustes', 'Permisos', 'Usuarios', 'Gestion completa'],
        shouldNotSee: []
      },
      {
        id: 'manager',
        title: 'Manager demo',
        email: 'manager@erptry.local',
        summary: 'Gestiona la operacion diaria y el circuito comercial sin tocar la administracion global del tenant.',
        canReview: ['Usuarios', 'Ventas', 'Facturacion', 'Cobros', 'Operacion diaria'],
        shouldNotSee: ['Gestion de roles avanzada']
      },
      {
        id: 'operator',
        title: 'Operator demo',
        email: 'operator@erptry.local',
        summary: 'Revisa el flujo operativo en modo lectura para detectar copy, datos y trazabilidad sin crear cambios.',
        canReview: ['Ventas', 'Facturacion', 'Cobros', 'Empleados', 'Agenda', 'Control'],
        shouldNotSee: ['Ajustes', 'Usuarios', 'Botones de alta o edicion']
      },
      {
        id: 'viewer',
        title: 'Viewer demo',
        email: 'viewer@erptry.local',
        summary: 'Sirve como prueba final de restricciones: debe poder leer el circuito, pero nunca gestionar el tenant.',
        canReview: ['Circuito en lectura', 'Analytics', 'Reportes', 'Avisos', 'Auditoria'],
        shouldNotSee: ['Ajustes', 'Usuarios', 'Acciones de gestion']
      }
    ]);
  });

  it('aisla la bitacora ACL por tenant en localStorage', () => {
    expect(getAccessReviewStorageKey(' ERPTRY Demo ')).toBe('erptry.accessReviewVisitedRoles.erptry-demo');
    expect(getAccessReviewStorageKey('Tenant QA / Norte')).toBe('erptry.accessReviewVisitedRoles.tenant-qa-norte');
    expect(getAccessReviewStorageKey('ERPTRY Demo', ' tenant_demo_01 ')).toBe('erptry.accessReviewVisitedRoles.tenant-demo-01');
  });

  it('resume el mapa de acceso actual para un perfil viewer', () => {
    expect(getAccessReviewSummary({
      actorRole: 'viewer',
      actorEmail: 'viewer@erptry.local',
      permissions: ['sales.view', 'billing.view', 'payments.view', 'employees.view', 'tasks.view', 'reservations.view', 'analytics.view', 'reports.view', 'notifications.view', 'audit.view']
    })).toEqual({
      profileTitle: 'Viewer demo',
      profileSummary: 'Sirve como prueba final de restricciones: debe poder leer el circuito, pero nunca gestionar el tenant.',
      roleLabel: 'Viewer',
      visibleAreas: [
        'Clientes, catalogo y ventas',
        'Facturacion',
        'Cobros',
        'Empleados',
        'Trabajo interno',
        'Agenda',
        'Analytics',
        'Reportes',
        'Avisos',
        'Auditoria'
      ],
      manageAreas: [],
      hiddenAreas: ['Ajustes', 'Usuarios', 'Roles y permisos'],
      nextStep: 'Vuelve despues con owner o manager para confirmar que reaparecen gestion, usuarios y acciones de alta.'
    });
  });

  it('resume el mapa de acceso actual para un perfil manager', () => {
    expect(getAccessReviewSummary({
      actorRole: 'manager',
      actorEmail: 'manager@erptry.local',
      permissions: ['users.manage', 'sales.view', 'sales.manage', 'billing.view', 'billing.manage', 'payments.view', 'payments.manage', 'employees.view', 'employees.manage', 'tasks.view', 'tasks.manage', 'reservations.view', 'reservations.manage', 'analytics.view', 'reports.view', 'notifications.view', 'notifications.manage', 'audit.view']
    })).toEqual({
      profileTitle: 'Manager demo',
      profileSummary: 'Gestiona la operacion diaria y el circuito comercial sin tocar la administracion global del tenant.',
      roleLabel: 'Manager',
      visibleAreas: [
        'Usuarios',
        'Clientes, catalogo y ventas',
        'Facturacion',
        'Cobros',
        'Empleados',
        'Trabajo interno',
        'Agenda',
        'Analytics',
        'Reportes',
        'Avisos',
        'Auditoria'
      ],
      manageAreas: [
        'Usuarios',
        'Clientes, catalogo y ventas',
        'Facturacion',
        'Cobros',
        'Empleados',
        'Trabajo interno',
        'Agenda',
        'Avisos'
      ],
      hiddenAreas: ['Ajustes', 'Roles y permisos'],
      nextStep: 'Tras este repaso, cambia a viewer para confirmar que ajustes, usuarios y acciones de gestion desaparecen con copy comprensible.'
    });
  });

  it('orienta el siguiente paso cuando el perfil activo no pertenece al recorrido ACL obligatorio', () => {
    expect(getAccessReviewSummary({
      actorRole: 'operator',
      actorEmail: 'operator@erptry.local',
      permissions: ['sales.view', 'billing.view', 'payments.view']
    }).nextStep).toBe(
      'Este perfil no forma parte del recorrido ACL obligatorio. Vuelve a owner y continua con manager y viewer para cerrar el repaso.'
    );
  });

  it('mantiene separadas las superficies de usuarios y roles en el repaso owner -> manager -> viewer', () => {
    const ownerSummary = getAccessReviewSummary({
      actorRole: 'owner',
      actorEmail: 'owner@erptry.local',
      permissions: [
        'settings.manage',
        'users.manage',
        'roles.manage',
        'sales.view',
        'sales.manage',
        'billing.view',
        'billing.manage',
        'payments.view',
        'payments.manage',
        'employees.view',
        'employees.manage',
        'tasks.view',
        'tasks.manage',
        'reservations.view',
        'reservations.manage',
        'analytics.view',
        'reports.view',
        'notifications.view',
        'notifications.manage',
        'audit.view',
        'audit.manage'
      ]
    });
    const managerSummary = getAccessReviewSummary({
      actorRole: 'manager',
      actorEmail: 'manager@erptry.local',
      permissions: [
        'users.manage',
        'sales.view',
        'sales.manage',
        'billing.view',
        'billing.manage',
        'payments.view',
        'payments.manage',
        'employees.view',
        'employees.manage',
        'tasks.view',
        'tasks.manage',
        'reservations.view',
        'reservations.manage',
        'analytics.view',
        'reports.view',
        'notifications.view',
        'notifications.manage',
        'audit.view'
      ]
    });
    const viewerSummary = getAccessReviewSummary({
      actorRole: 'viewer',
      actorEmail: 'viewer@erptry.local',
      permissions: [
        'sales.view',
        'billing.view',
        'payments.view',
        'employees.view',
        'tasks.view',
        'reservations.view',
        'analytics.view',
        'reports.view',
        'notifications.view',
        'audit.view'
      ]
    });

    expect(ownerSummary.manageAreas).toContain('Usuarios');
    expect(ownerSummary.manageAreas).toContain('Roles y permisos');
    expect(ownerSummary.hiddenAreas).not.toContain('Roles y permisos');
    expect(managerSummary.manageAreas).toContain('Usuarios');
    expect(managerSummary.manageAreas).not.toContain('Roles y permisos');
    expect(managerSummary.hiddenAreas).toContain('Roles y permisos');
    expect(viewerSummary.visibleAreas).not.toContain('Usuarios');
    expect(viewerSummary.hiddenAreas).toEqual(expect.arrayContaining(['Usuarios', 'Roles y permisos']));
  });

  it('expone checks de ACL en verde para owner con permisos completos', () => {
    expect(getAccessValidationChecks({
      actorRole: 'owner',
      actorEmail: 'owner@erptry.local',
      permissions: ['settings.manage', 'users.manage', 'roles.manage']
    })).toEqual([
      {
        id: 'owner-roles-manage',
        label: 'Owner debe gestionar roles y permisos',
        status: 'ok',
        detail: 'roles.manage presente para revisar catalogo y reasignaciones avanzadas.'
      },
      {
        id: 'owner-users-manage',
        label: 'Owner debe gestionar usuarios',
        status: 'ok',
        detail: 'users.manage presente para altas y gestion completa de usuarios.'
      },
      {
        id: 'owner-settings-manage',
        label: 'Owner debe gestionar ajustes',
        status: 'ok',
        detail: 'settings.manage presente para validar configuracion del tenant.'
      }
    ]);
  });

  it('marca alertas de ACL si manager tiene alcance de plataforma indebido', () => {
    expect(getAccessValidationChecks({
      actorRole: 'manager',
      actorEmail: 'manager@erptry.local',
      permissions: ['users.manage', 'roles.manage', 'settings.manage']
    })).toEqual([
      {
        id: 'manager-users-manage',
        label: 'Manager debe poder gestionar usuarios',
        status: 'ok',
        detail: 'users.manage presente para altas operativas (operator/viewer).'
      },
      {
        id: 'manager-no-roles-manage',
        label: 'Manager no debe gestionar roles',
        status: 'alert',
        detail: 'roles.manage presente: riesgo de escalado de privilegios para manager.'
      },
      {
        id: 'manager-no-settings-manage',
        label: 'Manager no debe tocar ajustes globales',
        status: 'alert',
        detail: 'settings.manage presente: manager accede a configuracion global no esperada.'
      }
    ]);
  });

  it('marca alertas en viewer cuando aparece cualquier permiso de gestion', () => {
    expect(getAccessValidationChecks({
      actorRole: 'viewer',
      actorEmail: 'viewer@erptry.local',
      permissions: ['sales.view', 'users.manage']
    })).toEqual([
      {
        id: 'viewer-no-manage',
        label: 'Viewer debe quedar en solo lectura',
        status: 'alert',
        detail: 'Aparecen permisos de gestion no esperados: users.manage.'
      },
      {
        id: 'viewer-no-platform-manage',
        label: 'Viewer no debe tocar nucleo de plataforma',
        status: 'alert',
        detail: 'Viewer mantiene permisos de plataforma que deberian estar ocultos.'
      }
    ]);
  });

  it('marca el progreso owner -> manager -> viewer durante el repaso ACL', () => {
    expect(getAccessReviewTimeline({
      visitedRoles: ['owner'],
      actorRole: 'manager',
      actorEmail: 'manager@erptry.local'
    })).toEqual({
      completedCount: 2,
      totalCount: 3,
      orderStatus: 'ok',
      orderHint: 'Orden owner -> manager -> viewer respetado en este navegador.',
      nextStepHint: 'Siguiente perfil recomendado: Viewer.',
      steps: [
        {
          id: 'owner',
          title: 'Owner',
          status: 'done',
          needsReset: false,
          detail: 'Confirma ajustes, usuarios y roles avanzados.'
        },
        {
          id: 'manager',
          title: 'Manager',
          status: 'current',
          needsReset: false,
          detail: 'Valida gestion operativa sin acceso a roles ni ajustes globales.'
        },
        {
          id: 'viewer',
          title: 'Viewer',
          status: 'pending',
          needsReset: false,
          detail: 'Comprueba modo lectura sin acciones de gestion.'
        }
      ]
    });
  });

  it('normaliza roles visitados del repaso ACL en orden estable', () => {
    expect(sanitizeAccessReviewRoles(['viewer', 'foo', 'owner', 'owner', 'manager'])).toEqual([
      'viewer',
      'owner',
      'manager'
    ]);
  });

  it('agrega el rol actual al progreso ACL sin duplicados', () => {
    expect(getNextVisitedAccessRoles(['viewer', 'owner'], 'manager')).toEqual([
      'viewer',
      'owner',
      'manager'
    ]);
    expect(getNextVisitedAccessRoles(['owner', 'manager'], 'manager')).toEqual([
      'owner',
      'manager'
    ]);
    expect(getNextVisitedAccessRoles(['owner', 'manager'], undefined)).toEqual([
      'owner',
      'manager'
    ]);
  });

  it('detecta saltos de orden en el repaso ACL y pide reinicio', () => {
    expect(getAccessReviewTimeline({
      visitedRoles: ['manager'],
      actorRole: 'viewer',
      actorEmail: 'viewer@erptry.local'
    })).toEqual({
      completedCount: 0,
      totalCount: 3,
      orderStatus: 'attention',
      orderHint: 'El recorrido ACL no empezo por owner (inicio en Manager). Pulsa "Reiniciar recorrido" y repite owner -> manager -> viewer para cerrar el repaso sin huecos.',
      nextStepHint: 'Siguiente perfil recomendado: Owner.',
      steps: [
        {
          id: 'owner',
          title: 'Owner',
          status: 'pending',
          needsReset: false,
          detail: 'Confirma ajustes, usuarios y roles avanzados.'
        },
        {
          id: 'manager',
          title: 'Manager',
          status: 'done',
          needsReset: true,
          detail: 'Valida gestion operativa sin acceso a roles ni ajustes globales.'
        },
        {
          id: 'viewer',
          title: 'Viewer',
          status: 'current',
          needsReset: true,
          detail: 'Comprueba modo lectura sin acciones de gestion.'
        }
      ]
    });
  });

  it('no marca el repaso ACL como completado si se visitaron todos los perfiles fuera de orden', () => {
    expect(getAccessReviewTimeline({
      visitedRoles: ['manager', 'owner'],
      actorRole: 'viewer',
      actorEmail: 'viewer@erptry.local'
    })).toEqual({
      completedCount: 0,
      totalCount: 3,
      orderStatus: 'attention',
      orderHint: 'El recorrido ACL no empezo por owner (inicio en Manager). Pulsa "Reiniciar recorrido" y repite owner -> manager -> viewer para cerrar el repaso sin huecos.',
      nextStepHint: 'Siguiente perfil recomendado: Owner.',
      steps: [
        {
          id: 'owner',
          title: 'Owner',
          status: 'done',
          needsReset: true,
          detail: 'Confirma ajustes, usuarios y roles avanzados.'
        },
        {
          id: 'manager',
          title: 'Manager',
          status: 'done',
          needsReset: true,
          detail: 'Valida gestion operativa sin acceso a roles ni ajustes globales.'
        },
        {
          id: 'viewer',
          title: 'Viewer',
          status: 'current',
          needsReset: true,
          detail: 'Comprueba modo lectura sin acciones de gestion.'
        }
      ]
    });
  });

  it('marca orden en revisar cuando se salta manager y se entra directo a viewer', () => {
    expect(getAccessReviewTimeline({
      visitedRoles: ['owner'],
      actorRole: 'viewer',
      actorEmail: 'viewer@erptry.local'
    })).toEqual({
      completedCount: 0,
      totalCount: 3,
      orderStatus: 'attention',
      orderHint: 'Detectado salto owner -> viewer sin pasar por manager. Pulsa "Reiniciar recorrido" y repite owner -> manager -> viewer para cerrar el repaso sin huecos.',
      nextStepHint: 'Siguiente perfil recomendado: Owner.',
      steps: [
        {
          id: 'owner',
          title: 'Owner',
          status: 'done',
          needsReset: true,
          detail: 'Confirma ajustes, usuarios y roles avanzados.'
        },
        {
          id: 'manager',
          title: 'Manager',
          status: 'pending',
          needsReset: false,
          detail: 'Valida gestion operativa sin acceso a roles ni ajustes globales.'
        },
        {
          id: 'viewer',
          title: 'Viewer',
          status: 'current',
          needsReset: true,
          detail: 'Comprueba modo lectura sin acciones de gestion.'
        }
      ]
    });
  });

  it('avisa cuando el perfil activo no pertenece al recorrido ACL obligatorio', () => {
    expect(getAccessReviewTimeline({
      visitedRoles: [],
      actorRole: 'operator',
      actorEmail: 'operator@erptry.local'
    })).toEqual({
      completedCount: 0,
      totalCount: 3,
      orderStatus: 'attention',
      orderHint: 'El perfil actual (Operator) no forma parte del recorrido ACL obligatorio. Empieza por owner y continua con manager y viewer.',
      nextStepHint: 'Siguiente perfil recomendado: Owner.',
      steps: [
        {
          id: 'owner',
          title: 'Owner',
          status: 'pending',
          needsReset: false,
          detail: 'Confirma ajustes, usuarios y roles avanzados.'
        },
        {
          id: 'manager',
          title: 'Manager',
          status: 'pending',
          needsReset: false,
          detail: 'Valida gestion operativa sin acceso a roles ni ajustes globales.'
        },
        {
          id: 'viewer',
          title: 'Viewer',
          status: 'pending',
          needsReset: false,
          detail: 'Comprueba modo lectura sin acciones de gestion.'
        }
      ]
    });
  });

  it('marca orden en revisar si aparece operator durante un recorrido ya iniciado', () => {
    expect(getAccessReviewTimeline({
      visitedRoles: ['owner'],
      actorRole: 'operator',
      actorEmail: 'operator@erptry.local'
    })).toEqual({
      completedCount: 0,
      totalCount: 3,
      orderStatus: 'attention',
      orderHint: 'Detectado perfil fuera del recorrido ACL obligatorio (Operator). Pulsa "Reiniciar recorrido" y vuelve a owner para repetir owner -> manager -> viewer sin huecos.',
      nextStepHint: 'El perfil actual no suma al recorrido ACL obligatorio. Siguiente perfil recomendado: Owner.',
      steps: [
        {
          id: 'owner',
          title: 'Owner',
          status: 'done',
          needsReset: true,
          detail: 'Confirma ajustes, usuarios y roles avanzados.'
        },
        {
          id: 'manager',
          title: 'Manager',
          status: 'pending',
          needsReset: false,
          detail: 'Valida gestion operativa sin acceso a roles ni ajustes globales.'
        },
        {
          id: 'viewer',
          title: 'Viewer',
          status: 'pending',
          needsReset: false,
          detail: 'Comprueba modo lectura sin acciones de gestion.'
        }
      ]
    });
  });

  it('agrupa permisos tecnicos en bloques legibles para el repaso manual', () => {
    expect(getPermissionGroupSummary([
      'users.manage',
      'sales.view',
      'sales.manage',
      'billing.view',
      'reports.view'
    ])).toEqual([
      {
        id: 'platform',
        title: 'Plataforma',
        items: [
          {
            code: 'users.manage',
            label: 'Usuarios',
            capability: 'Gestion'
          }
        ]
      },
      {
        id: 'commercial',
        title: 'Circuito comercial',
        items: [
          {
            code: 'sales.view',
            label: 'Clientes, catalogo y ventas',
            capability: 'Lectura'
          },
          {
            code: 'sales.manage',
            label: 'Clientes, catalogo y ventas',
            capability: 'Gestion'
          }
        ]
      },
      {
        id: 'billing',
        title: 'Facturacion y cobros',
        items: [
          {
            code: 'billing.view',
            label: 'Facturacion',
            capability: 'Lectura'
          }
        ]
      },
      {
        id: 'control',
        title: 'Control y seguimiento',
        items: [
          {
            code: 'reports.view',
            label: 'Reportes',
            capability: 'Lectura'
          }
        ]
      }
    ]);
  });

  it('deduplica permisos repetidos y mantiene orden estable por bloque', () => {
    expect(getPermissionGroupSummary([
      'payments.manage',
      'users.manage',
      'payments.manage',
      'custom.manage',
      'sales.view',
      'users.manage'
    ])).toEqual([
      {
        id: 'platform',
        title: 'Plataforma',
        items: [
          {
            code: 'users.manage',
            label: 'Usuarios',
            capability: 'Gestion'
          }
        ]
      },
      {
        id: 'commercial',
        title: 'Circuito comercial',
        items: [
          {
            code: 'sales.view',
            label: 'Clientes, catalogo y ventas',
            capability: 'Lectura'
          }
        ]
      },
      {
        id: 'billing',
        title: 'Facturacion y cobros',
        items: [
          {
            code: 'payments.manage',
            label: 'Cobros',
            capability: 'Gestion'
          }
        ]
      },
      {
        id: 'other',
        title: 'Permisos adicionales',
        items: [
          {
            code: 'custom.manage',
            label: 'custom.manage',
            capability: 'Gestion'
          }
        ]
      }
    ]);
  });

  it('avisa cuando el cobro supera el saldo pendiente de la factura', () => {
    expect(getPaymentFormState({ reference: 'INV-001', balanceCents: 12000 }, 15000)).toEqual({
      status: 'attention',
      detail: 'El importe supera el saldo pendiente de 120.00 EUR en INV-001.'
    });
  });

  it('anticipa cuando un cobro cerrara la factura', () => {
    expect(getPaymentFormState({ reference: 'INV-002', balanceCents: 8000 }, 8000)).toEqual({
      status: 'ready',
      detail: 'Este cobro liquidara INV-002 y la dejara en estado paid.'
    });
  });

  it('bloquea reservas con horario invertido antes de enviar el formulario', () => {
    expect(getReservationScheduleState({
      reservationDate: '2026-04-23',
      reservationStartTime: '10:00',
      reservationEndTime: '09:00',
      assigneeEmployeeName: 'Ana',
      linkedTaskCode: undefined
    })).toEqual({
      status: 'attention',
      detail: 'La hora de fin debe quedar despues de la hora de inicio para evitar una agenda invalida.'
    });
  });

  it('resume la trazabilidad de la reserva cuando ya hay tarea enlazada', () => {
    expect(getReservationScheduleState({
      reservationDate: '2026-04-23',
      reservationStartTime: '09:00',
      reservationEndTime: '10:00',
      assigneeEmployeeName: 'Ana',
      linkedTaskCode: 'TASK-001'
    })).toEqual({
      status: 'ready',
      detail: 'Ana quedara agendado de 09:00 a 10:00 y la reserva seguira la trazabilidad de TASK-001.'
    });
  });

  it('resume el circuito operable cuando el tenant ya cubre la cadena comercial y operativa', () => {
    const checklist = getReleaseOperableV1Checklist({
      sales: [
        {
          id: 'sale_1',
          reference: 'SAL-001',
          stage: 'won',
          client: { fullName: 'Acme Servicios SL' }
        }
      ],
      invoices: [
        {
          id: 'invoice_1',
          saleId: 'sale_1',
          reference: 'INV-001',
          status: 'paid',
          balanceCents: 0,
          client: { fullName: 'Acme Servicios SL' },
          payments: [{ id: 'payment_1', status: 'confirmed', amountCents: 12000 }]
        }
      ],
      payments: [
        {
          id: 'payment_1',
          invoiceId: 'invoice_1',
          status: 'confirmed',
          amountCents: 12000,
          invoice: {
            reference: 'INV-001',
            status: 'paid',
            balanceCents: 0
          }
        }
      ],
      employees: [
        { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' }
      ],
      internalTasks: [
        {
          id: 'task_1',
          taskCode: 'TASK-001',
          title: 'Preparar visita',
          assigneeEmployee: { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' },
          sale: {
            id: 'sale_1',
            reference: 'SAL-001',
            client: { fullName: 'Acme Servicios SL' }
          }
        }
      ],
      reservations: [
        {
          id: 'reservation_1',
          reservationCode: 'RES-001',
          title: 'Visita inicial',
          assigneeEmployee: { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' },
          internalTask: {
            id: 'task_1',
            taskCode: 'TASK-001',
            sale: {
              reference: 'SAL-001',
              client: { fullName: 'Acme Servicios SL' }
            }
          }
        }
      ],
      analytics: {
        sales: { wonCount: 1 },
        billing: { paidCount: 1 },
        payments: { confirmedCount: 1 }
      },
      reports: {
        exports: [
          { type: 'sales', totalRows: 1 },
          { type: 'invoices', totalRows: 1 },
          { type: 'payments', totalRows: 1 }
        ]
      },
      notifications: {
        totalCount: 4,
        items: [
          { resourceType: 'invoice' },
          { resourceType: 'payment' },
          { resourceType: 'internal_task' },
          { resourceType: 'reservation' }
        ]
      },
      auditLogs: {
        totalCount: 3,
        items: [
          { action: 'invoice.create' },
          { action: 'payment.create' },
          { action: 'reservation.create' }
        ]
      }
    });

    expect(checklist.completedCount).toBe(6);
    expect(checklist.status).toBe('ready');
  });

  it('marca los huecos criticos cuando el flujo aun no es demostrable', () => {
    const checklist = getReleaseOperableV1Checklist({
      sales: [],
      invoices: [],
      payments: [],
      employees: [],
      internalTasks: [],
      reservations: [],
      analytics: null,
      reports: null,
      notifications: null,
      auditLogs: null
    });

    expect(checklist.completedCount).toBe(0);
    expect(checklist.items.every((item) => item.status === 'attention')).toBe(true);
  });

  it('prioriza las siguientes acciones operativas para completar el flujo vendible', () => {
    expect(getReleaseOperableV1ActionPlan({
      sales: [
        {
          id: 'sale_1',
          reference: 'SAL-001',
          stage: 'won',
          client: { fullName: 'Acme Servicios SL' }
        }
      ],
      invoices: [
        {
          id: 'invoice_1',
          saleId: 'sale_1',
          reference: 'INV-001',
          status: 'issued',
          balanceCents: 12000,
          client: { fullName: 'Acme Servicios SL' },
          payments: []
        }
      ],
      payments: [],
      employees: [
        { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' }
      ],
      internalTasks: [],
      reservations: [],
      analytics: null,
      reports: null,
      notifications: null,
      auditLogs: null
    })).toEqual([
      {
        id: 'collect-payment',
        title: 'Registra un cobro realista',
        detail: 'La factura INV-001 sigue con 120.00 EUR pendientes; registra un cobro para completar el tramo financiero.',
        targetSectionId: 'payments-section',
        targetLabel: 'Ir a cobros'
      },
      {
        id: 'create-task',
        title: 'Asigna una tarea interna a la venta',
        detail: 'Enlaza SAL-001 con un responsable activo para que la operacion interna quede trazada desde la venta.',
        targetSectionId: 'internal-tasks-section',
        targetLabel: 'Ir a trabajo interno'
      },
      {
        id: 'review-telemetry',
        title: 'Contrasta analytics y trazabilidad',
        detail: 'Revisa analytics, reports, notifications y audit logs para confirmar que el circuito visible coincide con los eventos recien generados.',
        targetSectionId: 'analytics-section',
        targetLabel: 'Ir a analytics'
      }
    ]);
  });

  it('indica cuando el tenant ya esta listo para una demo end-to-end', () => {
    expect(getReleaseOperableV1ActionPlan({
      sales: [
        {
          id: 'sale_1',
          reference: 'SAL-001',
          stage: 'won',
          client: { fullName: 'Acme Servicios SL' }
        }
      ],
      invoices: [
        {
          id: 'invoice_1',
          saleId: 'sale_1',
          reference: 'INV-001',
          status: 'paid',
          balanceCents: 0,
          client: { fullName: 'Acme Servicios SL' },
          payments: [{ id: 'payment_1', status: 'confirmed', amountCents: 12000 }]
        }
      ],
      payments: [
        {
          id: 'payment_1',
          invoiceId: 'invoice_1',
          status: 'confirmed',
          amountCents: 12000,
          invoice: {
            reference: 'INV-001',
            status: 'paid',
            balanceCents: 0
          }
        }
      ],
      employees: [
        { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' }
      ],
      internalTasks: [
        {
          id: 'task_1',
          taskCode: 'TASK-001',
          title: 'Preparar visita',
          assigneeEmployee: { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' },
          sale: {
            id: 'sale_1',
            reference: 'SAL-001',
            client: { fullName: 'Acme Servicios SL' }
          }
        }
      ],
      reservations: [
        {
          id: 'reservation_1',
          reservationCode: 'RES-001',
          title: 'Visita inicial',
          assigneeEmployee: { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' },
          internalTask: {
            id: 'task_1',
            taskCode: 'TASK-001',
            sale: {
              reference: 'SAL-001',
              client: { fullName: 'Acme Servicios SL' }
            }
          }
        }
      ],
      analytics: {
        sales: { wonCount: 1 },
        billing: { paidCount: 1 },
        payments: { confirmedCount: 1 }
      },
      reports: {
        exports: [
          { type: 'sales', totalRows: 1 },
          { type: 'invoices', totalRows: 1 },
          { type: 'payments', totalRows: 1 }
        ]
      },
      notifications: {
        totalCount: 4,
        items: [
          { resourceType: 'invoice' },
          { resourceType: 'payment' },
          { resourceType: 'internal_task' },
          { resourceType: 'reservation' }
        ]
      },
      auditLogs: {
        totalCount: 3,
        items: [
          { action: 'invoice.create' },
          { action: 'payment.create' },
          { action: 'reservation.create' }
        ]
      }
    })).toEqual([
      {
        id: 'demo-ready',
        title: 'Tenant listo para demo operativa',
        detail: 'El circuito minimo ya puede demostrarse de punta a punta; repasa copy, estados y detalles visuales antes de cerrar la release.',
        targetSectionId: 'release-review-section',
        targetLabel: 'Volver al repaso guiado'
      }
    ]);
  });

  it('prepara un repaso visual guiado cuando aun faltan pasos del circuito', () => {
    const checklist = getReleaseOperableV1Checklist({
      sales: [
        {
          id: 'sale_1',
          reference: 'SAL-001',
          stage: 'won',
          client: { fullName: 'Acme Servicios SL' }
        }
      ],
      invoices: [
        {
          id: 'invoice_1',
          saleId: 'sale_1',
          reference: 'INV-001',
          status: 'issued',
          balanceCents: 12000,
          client: { fullName: 'Acme Servicios SL' },
          payments: []
        }
      ],
      payments: [],
      employees: [
        { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' }
      ],
      internalTasks: [],
      reservations: [],
      analytics: null,
      reports: { exports: [{ type: 'sales', totalRows: 1 }] },
      notifications: { totalCount: 0, items: [] },
      auditLogs: { totalCount: 0, items: [] }
    });

    expect(getReleaseOperableV1ReviewCards({
      checklist,
      actionPlan: [
        {
          id: 'collect-payment',
          title: 'Registra un cobro realista',
          detail: 'Detalle no relevante para este caso.',
          targetSectionId: 'payments-section',
          targetLabel: 'Ir a cobros'
        }
      ],
      paymentFormState: {
        status: 'ready',
        detail: 'Quedaran 20.00 EUR pendientes en INV-001 tras registrar el cobro.'
      },
      reservationScheduleState: {
        status: 'attention',
        detail: 'Selecciona un empleado activo para poder abrir la reserva.'
      },
      reports: { exports: [{ type: 'sales', totalRows: 1 }] },
      notifications: { totalCount: 0, items: [] },
      auditLogs: { totalCount: 0, items: [] }
    })).toEqual([
      {
        id: 'access-foundation',
        title: 'Acceso, tenant y permisos',
        status: 'ready',
        module: 'Acceso persistido y nucleo de plataforma',
        detail: 'Empieza el repaso por la cabecera del backoffice para confirmar tenant activo, ajustes base, permisos visibles y gestion de usuarios sin contexto interno.',
        checks: [
          'Confirma tenant, sesiones activas y formulario de ajustes nada mas entrar.',
          'Revisa permisos visibles y prueba que usuarios y roles se entienden con lenguaje operativo.'
        ],
        targetSectionId: 'access-section',
        targetLabel: 'Abrir acceso',
        quickLinks: [
          { targetSectionId: 'access-section', targetLabel: 'Acceso' },
          { targetSectionId: 'settings-section', targetLabel: 'Ajustes' },
          { targetSectionId: 'permissions-section', targetLabel: 'Permisos' },
          { targetSectionId: 'users-section', targetLabel: 'Usuarios' }
        ]
      },
      {
        id: 'permission-profiles',
        title: 'Perfiles demo y restricciones',
        status: 'ready',
        module: 'Roles operativos y acceso restringido',
        detail: 'Usa las cuentas demo owner, manager, operator y viewer para comprobar que el backoffice expone solo lo que cada perfil debe ver y entender.',
        checks: [
          'Cierra sesion y entra como manager para confirmar que mantiene usuarios pero no puede consultar roles ni reasignar perfiles altos.',
          'Despues entra como viewer para validar que desaparecen ajustes, usuarios y acciones de gestion con copy comprensible.',
          'Valida tambien el desvio owner -> operator: Progreso del repaso ACL debe quedar en orden revisar y pedir reinicio desde owner.'
        ],
        targetSectionId: 'access-section',
        targetLabel: 'Revisar perfiles demo',
        quickLinks: [
          { targetSectionId: 'access-section', targetLabel: 'Acceso' },
          { targetSectionId: 'permissions-section', targetLabel: 'Permisos' },
          { targetSectionId: 'users-section', targetLabel: 'Usuarios' }
        ]
      },
      {
        id: 'demo-flow',
        title: 'Circuito demostrable',
        status: 'attention',
        module: 'Portada, ventas y facturacion',
        detail: 'El tenant cubre 2/6 hitos; empieza el repaso manual por: Registra un cobro realista.',
        checks: [
          'Confirma tenant, permisos y ajustes visibles nada mas entrar al backoffice.',
          'Arranca por el siguiente hueco visible: Registra un cobro realista.'
        ],
        targetSectionId: 'payments-section',
        targetLabel: 'Ir a cobros',
        quickLinks: [
          { targetSectionId: 'sales-section', targetLabel: 'Ventas' },
          { targetSectionId: 'billing-section', targetLabel: 'Facturacion' },
          { targetSectionId: 'payments-section', targetLabel: 'Cobros' }
        ]
      },
      {
        id: 'finance-form',
        title: 'Cobros en EUR',
        status: 'ready',
        module: 'Cobros y facturas',
        detail: 'Quedaran 20.00 EUR pendientes en INV-001 tras registrar el cobro. El formulario ya trabaja en EUR y evita importes fuera del saldo pendiente.',
        checks: [
          'Valida que el importe pendiente se entienda en EUR y sin calculo manual.',
          'Comprueba que no puedes cobrar mas del saldo ni usar facturas fuera de estado issued.'
        ],
        targetSectionId: 'payments-section',
        targetLabel: 'Abrir cobros',
        quickLinks: [
          { targetSectionId: 'billing-section', targetLabel: 'Facturacion' },
          { targetSectionId: 'payments-section', targetLabel: 'Cobros' }
        ]
      },
      {
        id: 'operations-form',
        title: 'Agenda con trazabilidad',
        status: 'attention',
        module: 'Empleados, tareas y reservas',
        detail: 'Selecciona un empleado activo para poder abrir la reserva. La agenda mantiene el responsable alineado con la tarea enlazada.',
        checks: [
          'Revisa que la tarea conserve referencia comercial y cliente visible para operaciones.',
          'Comprueba que la reserva arrastra responsable activo y no deja combinaciones incoherentes.'
        ],
        targetSectionId: 'reservations-section',
        targetLabel: 'Abrir agenda',
        quickLinks: [
          { targetSectionId: 'employees-section', targetLabel: 'Empleados' },
          { targetSectionId: 'internal-tasks-section', targetLabel: 'Trabajo interno' },
          { targetSectionId: 'reservations-section', targetLabel: 'Agenda' }
        ]
      },
      {
        id: 'control-surface',
        title: 'Control y seguimiento',
        status: 'attention',
        module: 'Analytics, reportes y trazabilidad',
        detail: 'Todavia faltan evidencias visibles: reportes 1, avisos 0, trazas 0.',
        checks: [
          'Contrasta que analytics, exportables, avisos y auditoria cuentan la misma historia operativa.',
          'Genera la evidencia que falta y comprueba que aparece con lenguaje operativo comprensible.'
        ],
        targetSectionId: 'analytics-section',
        targetLabel: 'Abrir control',
        quickLinks: [
          { targetSectionId: 'analytics-section', targetLabel: 'Analytics' },
          { targetSectionId: 'reports-section', targetLabel: 'Reportes' },
          { targetSectionId: 'notifications-section', targetLabel: 'Avisos' },
          { targetSectionId: 'audit-logs-section', targetLabel: 'Auditoria' }
        ]
      }
    ]);
  });

  it('resume cuando el backoffice ya esta listo para un repaso visual final', () => {
    const checklist = getReleaseOperableV1Checklist({
      sales: [
        {
          id: 'sale_1',
          reference: 'SAL-001',
          stage: 'won',
          client: { fullName: 'Acme Servicios SL' }
        }
      ],
      invoices: [
        {
          id: 'invoice_1',
          saleId: 'sale_1',
          reference: 'INV-001',
          status: 'paid',
          balanceCents: 0,
          client: { fullName: 'Acme Servicios SL' },
          payments: [{ id: 'payment_1', status: 'confirmed', amountCents: 12000 }]
        }
      ],
      payments: [
        {
          id: 'payment_1',
          invoiceId: 'invoice_1',
          status: 'confirmed',
          amountCents: 12000,
          invoice: {
            reference: 'INV-001',
            status: 'paid',
            balanceCents: 0
          }
        }
      ],
      employees: [
        { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' }
      ],
      internalTasks: [
        {
          id: 'task_1',
          taskCode: 'TASK-001',
          title: 'Preparar visita',
          assigneeEmployee: { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' },
          sale: {
            id: 'sale_1',
            reference: 'SAL-001',
            client: { fullName: 'Acme Servicios SL' }
          }
        }
      ],
      reservations: [
        {
          id: 'reservation_1',
          reservationCode: 'RES-001',
          title: 'Visita inicial',
          assigneeEmployee: { id: 'employee_active', fullName: 'Ana', employeeCode: 'EMP-001', status: 'active' },
          internalTask: {
            id: 'task_1',
            taskCode: 'TASK-001',
            sale: {
              reference: 'SAL-001',
              client: { fullName: 'Acme Servicios SL' }
            }
          }
        }
      ],
      analytics: {
        sales: { wonCount: 1 },
        billing: { paidCount: 1 },
        payments: { confirmedCount: 1 }
      },
      reports: {
        exports: [
          { type: 'sales', totalRows: 1 },
          { type: 'invoices', totalRows: 1 },
          { type: 'payments', totalRows: 1 }
        ]
      },
      notifications: {
        totalCount: 4,
        items: [
          { resourceType: 'invoice' },
          { resourceType: 'payment' },
          { resourceType: 'internal_task' },
          { resourceType: 'reservation' }
        ]
      },
      auditLogs: {
        totalCount: 3,
        items: [
          { action: 'invoice.create' },
          { action: 'payment.create' },
          { action: 'reservation.create' }
        ]
      }
    });

    expect(getReleaseOperableV1ReviewCards({
      checklist,
      actionPlan: [{ id: 'demo-ready', title: 'Tenant listo para demo operativa', detail: 'ok', targetSectionId: 'release-review-section', targetLabel: 'Volver al repaso guiado' }],
      paymentFormState: {
        status: 'ready',
        detail: 'Este cobro liquidara INV-001 y la dejara en estado paid.'
      },
      reservationScheduleState: {
        status: 'ready',
        detail: 'Ana quedara agendado de 09:00 a 10:00 y la reserva seguira la trazabilidad de TASK-001.'
      },
      reports: {
        exports: [
          { type: 'sales', totalRows: 1 },
          { type: 'invoices', totalRows: 1 },
          { type: 'payments', totalRows: 1 }
        ]
      },
      notifications: {
        totalCount: 4,
        items: [{ resourceType: 'invoice' }]
      },
      auditLogs: {
        totalCount: 3,
        items: [{ action: 'invoice.create' }]
      }
    })[5]).toEqual({
      id: 'control-surface',
      title: 'Control y seguimiento',
      status: 'ready',
      module: 'Analytics, reportes y trazabilidad',
      detail: '3 reportes, 4 avisos y 3 trazas ya permiten contrastar la demo sin mirar logs tecnicos.',
      checks: [
        'Contrasta que analytics, exportables, avisos y auditoria cuentan la misma historia operativa.',
        'Verifica que los textos se entienden sin nombres internos ni necesidad de revisar logs tecnicos.'
      ],
      targetSectionId: 'analytics-section',
      targetLabel: 'Abrir control',
      quickLinks: [
        { targetSectionId: 'analytics-section', targetLabel: 'Analytics' },
        { targetSectionId: 'reports-section', targetLabel: 'Reportes' },
        { targetSectionId: 'notifications-section', targetLabel: 'Avisos' },
        { targetSectionId: 'audit-logs-section', targetLabel: 'Auditoria' }
      ]
    });
  });
});
