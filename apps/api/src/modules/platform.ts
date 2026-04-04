import type { FastifyInstance } from 'fastify';

import {
  appManifestSchema,
  createCatalogItemRequestSchema,
  createClientRequestSchema,
  createEmployeeRequestSchema,
  createInternalTaskRequestSchema,
  createInvoiceRequestSchema,
  createPaymentRequestSchema,
  createReservationRequestSchema,
  createSaleRequestSchema,
  createUserRequestSchema,
  deleteCatalogItemRequestSchema,
  deleteClientRequestSchema,
  deleteEmployeeRequestSchema,
  deleteInternalTaskRequestSchema,
  deleteInvoiceRequestSchema,
  deletePaymentRequestSchema,
  deleteReservationRequestSchema,
  deleteSaleRequestSchema,
  healthResponseSchema,
  markNotificationReadRequestSchema,
  updateCatalogItemRequestSchema,
  updateClientRequestSchema,
  updateEmployeeRequestSchema,
  updateInternalTaskRequestSchema,
  updateInvoiceRequestSchema,
  updatePaymentRequestSchema,
  updateReservationRequestSchema,
  updateSaleRequestSchema,
  updateTenantSettingsRequestSchema,
  updateUserRoleRequestSchema
} from '@erptry/contracts';
import { createPlatformSnapshot } from '@erptry/domain';

import { appConfig } from '../config.js';
import { prisma } from '../lib/prisma.js';
import { createAuditLog, listAuditLogs } from '../services/audit-logs-service.js';
import { createCatalogItem, deleteCatalogItem, listCatalogItems, updateCatalogItem } from '../services/catalog-service.js';
import { getAnalyticsSnapshot } from '../services/analytics-service.js';
import { createClient, deleteClient, listClients, updateClient } from '../services/clients-service.js';
import { resolvePersistedSession } from '../services/auth-service.js';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from '../services/employees-service.js';
import { createInternalTask, deleteInternalTask, listInternalTasks, updateInternalTask } from '../services/internal-tasks-service.js';
import { createInvoiceFromSale, deleteInvoice, listInvoices, updateInvoice } from '../services/invoices-service.js';
import { createPayment, deletePayment, listPayments, updatePayment } from '../services/payments-service.js';
import { createReservation, deleteReservation, listReservations, updateReservation } from '../services/reservations-service.js';
import { getReportsBundle } from '../services/reports-service.js';
import { listNotifications, markNotificationRead } from '../services/notifications-service.js';
import {
  canAssignTenantUserRole,
  canReadRoleCatalog,
  createTenantUser,
  getTenantOverview,
  listRoles,
  listTenantUsers,
  updateTenantUserRole
} from '../services/platform-service.js';
import { getTenantSettings, upsertTenantSettings } from '../services/settings-service.js';
import { createSale, deleteSale, listSales, updateSale } from '../services/sales-service.js';

export async function registerPlatformModule(app: FastifyInstance) {
  app.get('/api/health', async () => {
    return healthResponseSchema.parse({
      status: 'ok',
      service: appConfig.name,
      phase: appConfig.phase,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/manifest', async () => {
    return appManifestSchema.parse({
      name: 'ERPTRY',
      headline: 'Backoffice operable para pymes de servicios con circuito cliente -> servicio -> venta -> factura -> cobro -> operacion interna.',
      modules: ['auth', 'users', 'roles-permissions', 'settings', 'multi-tenant', 'clients', 'products-services', 'sales', 'billing-invoicing', 'payments', 'employees', 'tasks-internal-work', 'reservations-scheduling', 'analytics', 'reports', 'notifications', 'logs-audit'],
      priorities: ['tenant demo operable', 'circuito comercial-financiero', 'trabajo interno y agenda', 'control y trazabilidad', 'repaso visual de cierre vendible']
    });
  });

  app.get('/api/platform/bootstrap', async () => createPlatformSnapshot());

  async function registerAuditEntry(input: {
    tenantId: string;
    actorUserId: string;
    actorName: string;
    actorEmail: string;
    type: 'activity' | 'reminder' | 'finance' | 'alert';
    severity: 'info' | 'success' | 'warning' | 'critical';
    action: string;
    resourceType?: string | undefined;
    resourceId?: string | undefined;
    summary: string;
  }) {
    await createAuditLog(prisma, input.tenantId, {
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      actorEmail: input.actorEmail,
      type: input.type,
      severity: input.severity,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      summary: input.summary
    });
  }

  app.post('/api/platform/tenant/current', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar el tenant persistido.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    const overview = await getTenantOverview(prisma, me.tenant.id);

    if (!overview) {
      return reply.code(404).send({
        error: 'tenant_not_found',
        message: 'No se ha encontrado el tenant actual.'
      });
    }

    return overview;
  });

  app.post('/api/platform/users', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar usuarios persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    if (!me.permissions.includes('users.manage')) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual no puede consultar usuarios.'
      });
    }

    return listTenantUsers(prisma, me.tenant.id);
  });

  app.post('/api/platform/users/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear usuarios persistidos.'
      });
    }

    const body = request.body as { token?: string; user?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    if (!me.permissions.includes('users.manage')) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual no puede crear usuarios.'
      });
    }

    const input = createUserRequestSchema.parse(body.user);

    if (!canAssignTenantUserRole(me.permissions, input.roleCode)) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual solo puede asignar perfiles operator o viewer.'
      });
    }

    const createdUser = await createTenantUser(prisma, me.tenant.id, input);

    if (!createdUser) {
      return reply.code(400).send({
        error: 'role_not_found',
        message: 'No se ha encontrado el rol solicitado.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'success',
      action: 'user.create',
      resourceType: 'user',
      resourceId: createdUser.id,
      summary: `${me.actor.fullName} ha creado el usuario ${createdUser.fullName} con rol ${createdUser.roles.join(', ')}.`
    });

    return reply.code(201).send(createdUser);
  });

  app.post('/api/platform/settings', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar ajustes persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    if (!me.permissions.includes('settings.manage')) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual no puede consultar ajustes.'
      });
    }

    return getTenantSettings(prisma, me.tenant.id);
  });

  app.post('/api/platform/settings/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para actualizar ajustes persistidos.'
      });
    }

    const body = request.body as { token?: string; settings?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    if (!me.permissions.includes('settings.manage')) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual no puede actualizar ajustes.'
      });
    }

    const settings = updateTenantSettingsRequestSchema.parse(body.settings);
    const updatedSettings = await upsertTenantSettings(prisma, me.tenant.id, settings);

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'info',
      action: 'settings.update',
      resourceType: 'tenant_setting',
      resourceId: 'core',
      summary: `${me.actor.fullName} ha actualizado la configuracion base del tenant ${me.tenant.name}.`
    });

    return updatedSettings;
  });

  app.post('/api/platform/roles', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar roles persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    if (!canReadRoleCatalog(me.permissions)) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual no puede consultar roles.'
      });
    }

    return listRoles(prisma);
  });

  app.post('/api/platform/users/role', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para actualizar roles persistidos.'
      });
    }

    const body = request.body as { token?: string; update?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({
        error: 'missing_token',
        message: 'Falta el token de sesion.'
      });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'La sesion no es valida o ha expirado.'
      });
    }

    if (!me.permissions.includes('roles.manage')) {
      return reply.code(403).send({
        error: 'forbidden',
        message: 'La sesion actual no puede actualizar roles.'
      });
    }

    const input = updateUserRoleRequestSchema.parse(body.update);
    const updatedUser = await updateTenantUserRole(prisma, me.tenant.id, input.userId, input.roleCode);

    if (!updatedUser) {
      return reply.code(404).send({
        error: 'user_or_role_not_found',
        message: 'No se ha encontrado el usuario o el rol solicitado.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'alert',
      severity: 'warning',
      action: 'user.role.update',
      resourceType: 'user',
      resourceId: updatedUser.id,
      summary: `${me.actor.fullName} ha reasignado al usuario ${updatedUser.fullName} al rol ${input.roleCode}.`
    });

    return updatedUser;
  });

  app.post('/api/clients/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar clientes persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.view') && !me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar clientes.' });
    }

    return listClients(prisma, me.tenant.id);
  });

  app.post('/api/clients/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear clientes persistidos.'
      });
    }

    const body = request.body as { token?: string; client?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear clientes.' });
    }

    const input = createClientRequestSchema.parse(body.client);
    const createdClient = await createClient(prisma, me.tenant.id, input);

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'success',
      action: 'client.create',
      resourceType: 'client',
      resourceId: createdClient.id,
      summary: `${me.actor.fullName} ha dado de alta el cliente ${createdClient.fullName}.`
    });

    return reply.code(201).send(createdClient);
  });

  app.post('/api/clients/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar clientes persistidos.' });
    }

    const body = request.body as { token?: string; client?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar clientes.' });
    }

    const input = updateClientRequestSchema.parse(body.client);
    const updatedClient = await updateClient(prisma, me.tenant.id, input);

    if (!updatedClient) {
      return reply.code(404).send({ error: 'client_not_found', message: 'No se ha encontrado el cliente solicitado en el tenant actual.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'info',
      action: 'client.update',
      resourceType: 'client',
      resourceId: updatedClient.id,
      summary: `${me.actor.fullName} ha actualizado el cliente ${updatedClient.fullName}.`
    });

    return updatedClient;
  });

  app.post('/api/clients/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar clientes persistidos.' });
    }

    const body = request.body as { token?: string; client?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar clientes.' });
    }

    const input = deleteClientRequestSchema.parse(body.client);
    const deletedClient = await deleteClient(prisma, me.tenant.id, input.clientId);

    if (deletedClient.kind === 'not_found') {
      return reply.code(404).send({ error: 'client_not_found', message: 'No se ha encontrado el cliente solicitado en el tenant actual.' });
    }

    if (deletedClient.kind === 'has_relations') {
      return reply.code(409).send({ error: 'client_has_relations', message: 'No puedes eliminar un cliente con ventas o facturas enlazadas.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'warning',
      action: 'client.delete',
      resourceType: 'client',
      resourceId: deletedClient.client.id,
      summary: `${me.actor.fullName} ha eliminado el cliente ${deletedClient.client.fullName}.`
    });

    return deletedClient.client;
  });

  app.post('/api/catalog/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar catalogo persistido.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.view') && !me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar catalogo.' });
    }

    return listCatalogItems(prisma, me.tenant.id);
  });

  app.post('/api/catalog/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear items de catalogo.'
      });
    }

    const body = request.body as { token?: string; item?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear items de catalogo.' });
    }

    const input = createCatalogItemRequestSchema.parse(body.item);
    const createdItem = await createCatalogItem(prisma, me.tenant.id, input);

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'success',
      action: 'catalog_item.create',
      resourceType: 'catalog_item',
      resourceId: createdItem.id,
      summary: `${me.actor.fullName} ha creado el item ${createdItem.name} del catalogo.`
    });

    return reply.code(201).send(createdItem);
  });

  app.post('/api/catalog/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar items de catalogo.' });
    }

    const body = request.body as { token?: string; item?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar items de catalogo.' });
    }

    const input = updateCatalogItemRequestSchema.parse(body.item);
    const updatedItem = await updateCatalogItem(prisma, me.tenant.id, input);

    if (!updatedItem) {
      return reply.code(404).send({ error: 'catalog_item_not_found', message: 'No se ha encontrado el item solicitado en el tenant actual.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'info',
      action: 'catalog_item.update',
      resourceType: 'catalog_item',
      resourceId: updatedItem.id,
      summary: `${me.actor.fullName} ha actualizado el item ${updatedItem.name} del catalogo.`
    });

    return updatedItem;
  });

  app.post('/api/catalog/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar items de catalogo.' });
    }

    const body = request.body as { token?: string; item?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar items de catalogo.' });
    }

    const input = deleteCatalogItemRequestSchema.parse(body.item);
    const deletedItem = await deleteCatalogItem(prisma, me.tenant.id, input.itemId);

    if (deletedItem.kind === 'not_found') {
      return reply.code(404).send({ error: 'catalog_item_not_found', message: 'No se ha encontrado el item solicitado en el tenant actual.' });
    }

    if (deletedItem.kind === 'has_relations') {
      return reply.code(409).send({ error: 'catalog_item_has_relations', message: 'No puedes eliminar un item ya usado en ventas o facturas; archivarlo es la opcion segura.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'warning',
      action: 'catalog_item.delete',
      resourceType: 'catalog_item',
      resourceId: deletedItem.item.id,
      summary: `${me.actor.fullName} ha eliminado el item ${deletedItem.item.name} del catalogo.`
    });

    return deletedItem.item;
  });

  app.post('/api/sales/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar ventas persistidas.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.view') && !me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar ventas.' });
    }

    return listSales(prisma, me.tenant.id);
  });

  app.post('/api/sales/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear ventas persistidas.'
      });
    }

    const body = request.body as { token?: string; sale?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear ventas.' });
    }

    const input = createSaleRequestSchema.parse(body.sale);
    const createdSale = await createSale(prisma, me.tenant.id, input);

    if (!createdSale) {
      return reply.code(400).send({
        error: 'invalid_sale_relations',
        message: 'La venta requiere un cliente valido y lineas activas del catalogo del tenant.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: createdSale.stage === 'won' ? 'success' : 'info',
      action: 'sale.create',
      resourceType: 'sale',
      resourceId: createdSale.id,
      summary: `${me.actor.fullName} ha registrado la venta ${createdSale.reference} para ${createdSale.client.fullName}.`
    });

    return reply.code(201).send(createdSale);
  });

  app.post('/api/sales/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar ventas persistidas.' });
    }

    const body = request.body as { token?: string; sale?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar ventas.' });
    }

    const input = updateSaleRequestSchema.parse(body.sale);
    const updatedSale = await updateSale(prisma, me.tenant.id, input);

    if (updatedSale.kind === 'not_found') {
      return reply.code(404).send({ error: 'sale_not_found', message: 'No se ha encontrado la venta solicitada en el tenant actual.' });
    }

    if (updatedSale.kind === 'invalid_relations') {
      return reply.code(400).send({ error: 'invalid_sale_relations', message: 'La venta requiere un cliente valido y lineas activas del catalogo del tenant.' });
    }

    if (updatedSale.kind === 'invoice_locked') {
      return reply.code(409).send({ error: 'sale_invoice_locked', message: 'No puedes cambiar cliente o lineas de una venta que ya tiene factura emitida.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: updatedSale.sale.stage === 'won' ? 'success' : 'info',
      action: 'sale.update',
      resourceType: 'sale',
      resourceId: updatedSale.sale.id,
      summary: `${me.actor.fullName} ha actualizado la venta ${updatedSale.sale.reference}.`
    });

    return updatedSale.sale;
  });

  app.post('/api/sales/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar ventas persistidas.' });
    }

    const body = request.body as { token?: string; sale?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('sales.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar ventas.' });
    }

    const input = deleteSaleRequestSchema.parse(body.sale);
    const deletedSale = await deleteSale(prisma, me.tenant.id, input.saleId);

    if (deletedSale.kind === 'not_found') {
      return reply.code(404).send({ error: 'sale_not_found', message: 'No se ha encontrado la venta solicitada en el tenant actual.' });
    }

    if (deletedSale.kind === 'invoice_locked') {
      return reply.code(409).send({ error: 'sale_invoice_locked', message: 'No puedes eliminar una venta que ya tiene factura emitida.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'warning',
      action: 'sale.delete',
      resourceType: 'sale',
      resourceId: deletedSale.sale.id,
      summary: `${me.actor.fullName} ha eliminado la venta ${deletedSale.sale.reference}.`
    });

    return deletedSale.sale;
  });

  app.post('/api/invoices/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar facturas persistidas.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('billing.view') && !me.permissions.includes('billing.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar facturas.' });
    }

    return listInvoices(prisma, me.tenant.id);
  });

  app.post('/api/invoices/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para emitir facturas persistidas.'
      });
    }

    const body = request.body as { token?: string; invoice?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('billing.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede emitir facturas.' });
    }

    const input = createInvoiceRequestSchema.parse(body.invoice);
    const createdInvoice = await createInvoiceFromSale(prisma, me.tenant.id, input);

    if (!createdInvoice) {
      return reply.code(400).send({
        error: 'invalid_invoice_source',
        message: 'La factura requiere una venta valida, sin factura previa y con lineas activas.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'finance',
      severity: createdInvoice.status === 'paid' ? 'success' : 'warning',
      action: 'invoice.create',
      resourceType: 'invoice',
      resourceId: createdInvoice.id,
      summary: `${me.actor.fullName} ha emitido la factura ${createdInvoice.reference} para ${createdInvoice.client.fullName}.`
    });

    return reply.code(201).send(createdInvoice);
  });

  app.post('/api/invoices/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar facturas persistidas.' });
    }

    const body = request.body as { token?: string; invoice?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('billing.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar facturas.' });
    }

    const input = updateInvoiceRequestSchema.parse(body.invoice);
    const updatedInvoice = await updateInvoice(prisma, me.tenant.id, input);

    if (updatedInvoice.kind === 'not_found') {
      return reply.code(404).send({ error: 'invoice_not_found', message: 'No se ha encontrado la factura solicitada en el tenant actual.' });
    }

    if (updatedInvoice.kind === 'invalid_relations') {
      return reply.code(400).send({ error: 'invalid_invoice_update', message: 'La factura requiere un vencimiento valido.' });
    }

    if (updatedInvoice.kind === 'payments_locked') {
      return reply.code(409).send({ error: 'invoice_payments_locked', message: 'No puedes anular una factura con cobros confirmados.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'finance',
      severity: updatedInvoice.invoice.status === 'void' ? 'warning' : 'info',
      action: 'invoice.update',
      resourceType: 'invoice',
      resourceId: updatedInvoice.invoice.id,
      summary: `${me.actor.fullName} ha actualizado la factura ${updatedInvoice.invoice.reference}.`
    });

    return updatedInvoice.invoice;
  });

  app.post('/api/invoices/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar facturas persistidas.' });
    }

    const body = request.body as { token?: string; invoice?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('billing.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar facturas.' });
    }

    const input = deleteInvoiceRequestSchema.parse(body.invoice);
    const deletedInvoice = await deleteInvoice(prisma, me.tenant.id, input.invoiceId);

    if (deletedInvoice.kind === 'not_found') {
      return reply.code(404).send({ error: 'invoice_not_found', message: 'No se ha encontrado la factura solicitada en el tenant actual.' });
    }

    if (deletedInvoice.kind === 'payments_locked') {
      return reply.code(409).send({ error: 'invoice_payments_locked', message: 'No puedes eliminar una factura con cobros registrados.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'finance',
      severity: 'warning',
      action: 'invoice.delete',
      resourceType: 'invoice',
      resourceId: deletedInvoice.invoice.id,
      summary: `${me.actor.fullName} ha eliminado la factura ${deletedInvoice.invoice.reference}.`
    });

    return deletedInvoice.invoice;
  });

  app.post('/api/payments/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar cobros persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('payments.view') && !me.permissions.includes('payments.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar cobros.' });
    }

    return listPayments(prisma, me.tenant.id);
  });

  app.post('/api/payments/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para registrar cobros persistidos.'
      });
    }

    const body = request.body as { token?: string; payment?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('payments.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede registrar cobros.' });
    }

    const input = createPaymentRequestSchema.parse(body.payment);
    const createdPayment = await createPayment(prisma, me.tenant.id, input);

    if (!createdPayment) {
      return reply.code(400).send({
        error: 'invalid_payment_source',
        message: 'El cobro requiere una factura emitida con saldo pendiente y fecha valida.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'finance',
      severity: createdPayment.status === 'confirmed' ? 'success' : createdPayment.status === 'failed' ? 'critical' : 'warning',
      action: 'payment.create',
      resourceType: 'payment',
      resourceId: createdPayment.id,
      summary: `${me.actor.fullName} ha registrado el cobro ${createdPayment.reference} sobre la factura ${createdPayment.invoice.reference}.`
    });

    return reply.code(201).send(createdPayment);
  });

  app.post('/api/payments/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar cobros persistidos.' });
    }

    const body = request.body as { token?: string; payment?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('payments.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar cobros.' });
    }

    const input = updatePaymentRequestSchema.parse(body.payment);
    const updatedPayment = await updatePayment(prisma, me.tenant.id, input);

    if (updatedPayment.kind === 'not_found') {
      return reply.code(404).send({ error: 'payment_not_found', message: 'No se ha encontrado el cobro solicitado en el tenant actual.' });
    }

    if (updatedPayment.kind === 'invoice_locked') {
      return reply.code(409).send({ error: 'payment_invoice_locked', message: 'No puedes mover ni editar cobros sobre facturas anuladas.' });
    }

    if (updatedPayment.kind === 'invalid_relations') {
      return reply.code(400).send({ error: 'invalid_payment_update', message: 'El cobro requiere fecha valida y no puede exceder el saldo disponible.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'finance',
      severity: updatedPayment.payment.status === 'confirmed' ? 'success' : updatedPayment.payment.status === 'failed' ? 'critical' : 'warning',
      action: 'payment.update',
      resourceType: 'payment',
      resourceId: updatedPayment.payment.id,
      summary: `${me.actor.fullName} ha actualizado el cobro ${updatedPayment.payment.reference}.`
    });

    return updatedPayment.payment;
  });

  app.post('/api/payments/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar cobros persistidos.' });
    }

    const body = request.body as { token?: string; payment?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('payments.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar cobros.' });
    }

    const input = deletePaymentRequestSchema.parse(body.payment);
    const deletedPayment = await deletePayment(prisma, me.tenant.id, input.paymentId);

    if (deletedPayment.kind === 'not_found') {
      return reply.code(404).send({ error: 'payment_not_found', message: 'No se ha encontrado el cobro solicitado en el tenant actual.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'finance',
      severity: 'warning',
      action: 'payment.delete',
      resourceType: 'payment',
      resourceId: deletedPayment.payment.id,
      summary: `${me.actor.fullName} ha eliminado el cobro ${deletedPayment.payment.reference}.`
    });

    return deletedPayment.payment;
  });

  app.post('/api/analytics/overview', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar analitica persistida.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('analytics.view')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar analitica.' });
    }

    return getAnalyticsSnapshot(prisma, me.tenant.id);
  });

  app.post('/api/reports/exports', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar reportes persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('reports.view')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar reportes.' });
    }

    return getReportsBundle(prisma, me.tenant.id);
  });

  app.post('/api/notifications/inbox', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar avisos persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('notifications.view') && !me.permissions.includes('notifications.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar avisos internos.' });
    }

    return listNotifications(prisma, me.tenant.id);
  });

  app.post('/api/notifications/read', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para actualizar avisos persistidos.'
      });
    }

    const body = request.body as { token?: string; notification?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('notifications.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede gestionar avisos internos.' });
    }

    const input = markNotificationReadRequestSchema.parse(body.notification);
    const notification = await markNotificationRead(prisma, me.tenant.id, input.notificationId);

    if (!notification) {
      return reply.code(404).send({
        error: 'notification_not_found',
        message: 'No se ha encontrado el aviso solicitado en el tenant actual.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'info',
      action: 'notification.read',
      resourceType: notification.resourceType ?? 'notification',
      resourceId: notification.resourceId ?? notification.id,
      summary: `${me.actor.fullName} ha marcado como leido el aviso ${notification.title}.`
    });

    return notification;
  });

  app.post('/api/audit-logs/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar trazas de auditoria.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('audit.view') && !me.permissions.includes('audit.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar auditoria.' });
    }

    return listAuditLogs(prisma, me.tenant.id);
  });

  app.post('/api/employees/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar empleados persistidos.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('employees.view') && !me.permissions.includes('employees.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar empleados.' });
    }

    return listEmployees(prisma, me.tenant.id);
  });

  app.post('/api/employees/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear empleados persistidos.'
      });
    }

    const body = request.body as { token?: string; employee?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('employees.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear empleados.' });
    }

    const input = createEmployeeRequestSchema.parse(body.employee);
    const createdEmployee = await createEmployee(prisma, me.tenant.id, input);

    if (!createdEmployee) {
      return reply.code(400).send({
        error: 'invalid_employee_relations',
        message: 'El empleado requiere una fecha valida y, si enlaza usuario, que pertenezca al tenant actual.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'success',
      action: 'employee.create',
      resourceType: 'employee',
      resourceId: createdEmployee.id,
      summary: `${me.actor.fullName} ha creado el empleado ${createdEmployee.fullName}.`
    });

    return reply.code(201).send(createdEmployee);
  });

  app.post('/api/employees/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar empleados persistidos.' });
    }

    const body = request.body as { token?: string; employee?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('employees.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar empleados.' });
    }

    const input = updateEmployeeRequestSchema.parse(body.employee);
    const updatedEmployee = await updateEmployee(prisma, me.tenant.id, input);

    if (updatedEmployee.kind === 'not_found') {
      return reply.code(404).send({ error: 'employee_not_found', message: 'No se ha encontrado el empleado solicitado en el tenant actual.' });
    }

    if (updatedEmployee.kind === 'invalid_relations') {
      return reply.code(400).send({ error: 'invalid_employee_relations', message: 'El empleado requiere una fecha valida y, si enlaza usuario, que pertenezca al tenant actual.' });
    }

    if (updatedEmployee.kind === 'has_relations') {
      return reply.code(409).send({ error: 'employee_has_relations', message: 'No puedes desactivar a inactivo un empleado con tareas o reservas enlazadas.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: updatedEmployee.employee.status === 'active' ? 'success' : 'info',
      action: 'employee.update',
      resourceType: 'employee',
      resourceId: updatedEmployee.employee.id,
      summary: `${me.actor.fullName} ha actualizado el empleado ${updatedEmployee.employee.fullName}.`
    });

    return updatedEmployee.employee;
  });

  app.post('/api/employees/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar empleados persistidos.' });
    }

    const body = request.body as { token?: string; employee?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('employees.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar empleados.' });
    }

    const input = deleteEmployeeRequestSchema.parse(body.employee);
    const deletedEmployee = await deleteEmployee(prisma, me.tenant.id, input.employeeId);

    if (deletedEmployee.kind === 'not_found') {
      return reply.code(404).send({ error: 'employee_not_found', message: 'No se ha encontrado el empleado solicitado en el tenant actual.' });
    }

    if (deletedEmployee.kind === 'has_relations') {
      return reply.code(409).send({ error: 'employee_has_relations', message: 'No puedes eliminar un empleado con tareas o reservas enlazadas.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'warning',
      action: 'employee.delete',
      resourceType: 'employee',
      resourceId: deletedEmployee.employee.id,
      summary: `${me.actor.fullName} ha eliminado el empleado ${deletedEmployee.employee.fullName}.`
    });

    return deletedEmployee.employee;
  });

  app.post('/api/internal-tasks/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar tareas internas persistidas.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('tasks.view') && !me.permissions.includes('tasks.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar tareas internas.' });
    }

    return listInternalTasks(prisma, me.tenant.id);
  });

  app.post('/api/internal-tasks/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear tareas internas persistidas.'
      });
    }

    const body = request.body as { token?: string; task?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('tasks.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear tareas internas.' });
    }

    const input = createInternalTaskRequestSchema.parse(body.task);
    const createdTask = await createInternalTask(prisma, me.tenant.id, me.actor.userId, input);

    if (createdTask.kind === 'invalid_relations') {
      return reply.code(400).send({
        error: 'invalid_internal_task_relations',
        message: 'La tarea interna requiere empleado asignado, creador valido, venta ganada del tenant si se enlaza y fecha correcta si se informa.'
      });
    }

    if (createdTask.kind === 'assignee_unavailable') {
      return reply.code(400).send({
        error: 'inactive_task_assignee',
        message: 'La tarea interna solo puede asignarse a empleados disponibles, nunca a fichas inactivas.'
      });
    }

    if (createdTask.kind !== 'created') {
      return reply.code(400).send({
        error: 'invalid_internal_task_relations',
        message: 'La tarea interna requiere empleado asignado, creador valido, venta ganada del tenant si se enlaza y fecha correcta si se informa.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: createdTask.task.priority === 'high' ? 'warning' : 'info',
      action: 'internal_task.create',
      resourceType: 'internal_task',
      resourceId: createdTask.task.id,
      summary: `${me.actor.fullName} ha creado la tarea ${createdTask.task.taskCode} para ${createdTask.task.assigneeEmployee.fullName}.`
    });

    return reply.code(201).send(createdTask.task);
  });

  app.post('/api/internal-tasks/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar tareas internas persistidas.' });
    }

    const body = request.body as { token?: string; task?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('tasks.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar tareas internas.' });
    }

    const input = updateInternalTaskRequestSchema.parse(body.task);
    const updatedTask = await updateInternalTask(prisma, me.tenant.id, me.actor.userId, input);

    if (updatedTask.kind === 'not_found') {
      return reply.code(404).send({ error: 'internal_task_not_found', message: 'No se ha encontrado la tarea solicitada en el tenant actual.' });
    }

    if (updatedTask.kind === 'invalid_relations') {
      return reply.code(400).send({ error: 'invalid_internal_task_relations', message: 'La tarea requiere empleado asignado, venta ganada del tenant si se enlaza y fecha correcta si se informa.' });
    }

    if (updatedTask.kind === 'assignee_unavailable') {
      return reply.code(400).send({ error: 'inactive_task_assignee', message: 'La tarea interna solo puede asignarse a empleados disponibles.' });
    }

    if (updatedTask.kind === 'assignee_locked') {
      return reply.code(409).send({ error: 'task_assignee_locked', message: 'No puedes cambiar el responsable de una tarea con reservas enlazadas.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: updatedTask.task.priority === 'high' ? 'warning' : 'info',
      action: 'internal_task.update',
      resourceType: 'internal_task',
      resourceId: updatedTask.task.id,
      summary: `${me.actor.fullName} ha actualizado la tarea ${updatedTask.task.taskCode}.`
    });

    return updatedTask.task;
  });

  app.post('/api/internal-tasks/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar tareas internas persistidas.' });
    }

    const body = request.body as { token?: string; task?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('tasks.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar tareas internas.' });
    }

    const input = deleteInternalTaskRequestSchema.parse(body.task);
    const deletedTask = await deleteInternalTask(prisma, me.tenant.id, input.taskId);

    if (deletedTask.kind === 'not_found') {
      return reply.code(404).send({ error: 'internal_task_not_found', message: 'No se ha encontrado la tarea solicitada en el tenant actual.' });
    }

    if (deletedTask.kind === 'has_relations') {
      return reply.code(409).send({ error: 'internal_task_has_relations', message: 'No puedes eliminar una tarea que ya tiene reservas enlazadas.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'activity',
      severity: 'warning',
      action: 'internal_task.delete',
      resourceType: 'internal_task',
      resourceId: deletedTask.task.id,
      summary: `${me.actor.fullName} ha eliminado la tarea ${deletedTask.task.taskCode}.`
    });

    return deletedTask.task;
  });

  app.post('/api/reservations/list', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para consultar reservas persistidas.'
      });
    }

    const body = request.body as { token?: string };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('reservations.view') && !me.permissions.includes('reservations.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede consultar reservas.' });
    }

    return listReservations(prisma, me.tenant.id);
  });

  app.post('/api/reservations/create', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL para crear reservas persistidas.'
      });
    }

    const body = request.body as { token?: string; reservation?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('reservations.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear reservas.' });
    }

    const input = createReservationRequestSchema.parse(body.reservation);
    const result = await createReservation(prisma, me.tenant.id, me.actor.userId, input);

    if (result.kind === 'invalid_schedule') {
      return reply.code(400).send({
        error: 'invalid_reservation_schedule',
        message: 'La reserva requiere un inicio y fin validos con una duracion positiva.'
      });
    }

    if (result.kind === 'invalid_relations') {
      return reply.code(400).send({
        error: 'invalid_reservation_relations',
        message: 'La reserva requiere empleado asignado, creador valido y tarea interna del tenant si se informa.'
      });
    }

    if (result.kind === 'assignee_unavailable') {
      return reply.code(400).send({
        error: 'inactive_reservation_assignee',
        message: 'La reserva solo puede planificarse sobre empleados activos.'
      });
    }

    if (result.kind === 'assignee_mismatch') {
      return reply.code(400).send({
        error: 'reservation_task_assignee_mismatch',
        message: 'La reserva debe mantener el mismo empleado que la tarea interna enlazada para no romper la trazabilidad operativa.'
      });
    }

    if (result.kind === 'schedule_conflict') {
      return reply.code(409).send({
        error: 'reservation_overlap',
        message: 'El empleado ya tiene una reserva activa que se solapa en esa franja horaria.'
      });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'reminder',
      severity: result.reservation.status === 'confirmed' ? 'success' : 'info',
      action: 'reservation.create',
      resourceType: 'reservation',
      resourceId: result.reservation.id,
      summary: `${me.actor.fullName} ha creado la reserva ${result.reservation.reservationCode} para ${result.reservation.assigneeEmployee.fullName}.`
    });

    return reply.code(201).send(result.reservation);
  });

  app.post('/api/reservations/update', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para actualizar reservas persistidas.' });
    }

    const body = request.body as { token?: string; reservation?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('reservations.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede actualizar reservas.' });
    }

    const input = updateReservationRequestSchema.parse(body.reservation);
    const updatedReservation = await updateReservation(prisma, me.tenant.id, me.actor.userId, input);

    if (updatedReservation.kind === 'not_found') {
      return reply.code(404).send({ error: 'reservation_not_found', message: 'No se ha encontrado la reserva solicitada en el tenant actual.' });
    }

    if (updatedReservation.kind === 'invalid_schedule') {
      return reply.code(400).send({ error: 'invalid_reservation_schedule', message: 'La reserva requiere un inicio y fin validos con una duracion positiva.' });
    }

    if (updatedReservation.kind === 'invalid_relations') {
      return reply.code(400).send({ error: 'invalid_reservation_relations', message: 'La reserva requiere empleado asignado, creador valido y tarea interna del tenant si se informa.' });
    }

    if (updatedReservation.kind === 'assignee_unavailable') {
      return reply.code(400).send({ error: 'inactive_reservation_assignee', message: 'La reserva solo puede planificarse sobre empleados activos.' });
    }

    if (updatedReservation.kind === 'assignee_mismatch') {
      return reply.code(400).send({ error: 'reservation_task_assignee_mismatch', message: 'La reserva debe mantener el mismo empleado que la tarea interna enlazada.' });
    }

    if (updatedReservation.kind === 'schedule_conflict') {
      return reply.code(409).send({ error: 'reservation_overlap', message: 'El empleado ya tiene una reserva activa que se solapa en esa franja horaria.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'reminder',
      severity: updatedReservation.reservation.status === 'cancelled' ? 'warning' : 'info',
      action: 'reservation.update',
      resourceType: 'reservation',
      resourceId: updatedReservation.reservation.id,
      summary: `${me.actor.fullName} ha actualizado la reserva ${updatedReservation.reservation.reservationCode}.`
    });

    return updatedReservation.reservation;
  });

  app.post('/api/reservations/delete', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({ error: 'database_not_configured', message: 'Configura DATABASE_URL para eliminar reservas persistidas.' });
    }

    const body = request.body as { token?: string; reservation?: unknown };

    if (typeof body.token !== 'string' || body.token.length === 0) {
      return reply.code(400).send({ error: 'missing_token', message: 'Falta el token de sesion.' });
    }

    const me = await resolvePersistedSession(prisma, body.token);

    if (!me) {
      return reply.code(401).send({ error: 'invalid_session', message: 'La sesion no es valida o ha expirado.' });
    }

    if (!me.permissions.includes('reservations.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede eliminar reservas.' });
    }

    const input = deleteReservationRequestSchema.parse(body.reservation);
    const deletedReservation = await deleteReservation(prisma, me.tenant.id, input.reservationId);

    if (deletedReservation.kind === 'not_found') {
      return reply.code(404).send({ error: 'reservation_not_found', message: 'No se ha encontrado la reserva solicitada en el tenant actual.' });
    }

    await registerAuditEntry({
      tenantId: me.tenant.id,
      actorUserId: me.actor.userId,
      actorName: me.actor.fullName,
      actorEmail: me.actor.email,
      type: 'reminder',
      severity: 'warning',
      action: 'reservation.delete',
      resourceType: 'reservation',
      resourceId: deletedReservation.reservation.id,
      summary: `${me.actor.fullName} ha eliminado la reserva ${deletedReservation.reservation.reservationCode}.`
    });

    return deletedReservation.reservation;
  });
}
