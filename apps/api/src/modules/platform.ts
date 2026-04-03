import type { FastifyInstance } from 'fastify';

import { appManifestSchema, healthResponseSchema } from '@erptry/contracts';
import { createPlatformSnapshot } from '@erptry/domain';

import { appConfig } from '../config';
import { prisma } from '../lib/prisma';
import { resolvePersistedSession } from '../services/auth-service';
import { getTenantOverview, listTenantUsers } from '../services/platform-service';

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
      modules: ['auth', 'users', 'roles-permissions', 'settings', 'multi-tenant'],
      priorities: ['bootstrap tecnico', 'nucleo de plataforma', 'circuito comercial']
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
}
