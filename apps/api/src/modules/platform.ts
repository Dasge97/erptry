import type { FastifyInstance } from 'fastify';

import {
  appManifestSchema,
  createCatalogItemRequestSchema,
  createClientRequestSchema,
  createUserRequestSchema,
  healthResponseSchema,
  updateTenantSettingsRequestSchema,
  updateUserRoleRequestSchema
} from '@erptry/contracts';
import { createPlatformSnapshot } from '@erptry/domain';

import { appConfig } from '../config';
import { prisma } from '../lib/prisma';
import { createCatalogItem, listCatalogItems } from '../services/catalog-service';
import { createClient, listClients } from '../services/clients-service';
import { resolvePersistedSession } from '../services/auth-service';
import { createTenantUser, getTenantOverview, listRoles, listTenantUsers, updateTenantUserRole } from '../services/platform-service';
import { getTenantSettings, upsertTenantSettings } from '../services/settings-service';

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
      headline: 'ERP modular para operaciones, ventas y gestion multiempresa.',
      modules: ['auth', 'users', 'roles-permissions', 'settings', 'multi-tenant', 'clients', 'products-services'],
      priorities: ['bootstrap tecnico', 'nucleo de plataforma', 'vertical clients', 'catalogo comercial']
    });
  });

  app.get('/api/platform/bootstrap', async () => createPlatformSnapshot());

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
    const createdUser = await createTenantUser(prisma, me.tenant.id, input);

    if (!createdUser) {
      return reply.code(400).send({
        error: 'role_not_found',
        message: 'No se ha encontrado el rol solicitado.'
      });
    }

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

    return upsertTenantSettings(prisma, me.tenant.id, settings);
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

    if (!me.permissions.includes('users.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear clientes.' });
    }

    const input = createClientRequestSchema.parse(body.client);
    const createdClient = await createClient(prisma, me.tenant.id, input);

    return reply.code(201).send(createdClient);
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

    if (!me.permissions.includes('users.manage')) {
      return reply.code(403).send({ error: 'forbidden', message: 'La sesion actual no puede crear items de catalogo.' });
    }

    const input = createCatalogItemRequestSchema.parse(body.item);
    const createdItem = await createCatalogItem(prisma, me.tenant.id, input);

    return reply.code(201).send(createdItem);
  });
}
