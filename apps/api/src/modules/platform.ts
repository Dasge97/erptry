import type { FastifyInstance } from 'fastify';

import { appManifestSchema, healthResponseSchema } from '@erptry/contracts';
import { createPlatformSnapshot } from '@erptry/domain';

import { appConfig } from '../config';

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
}
