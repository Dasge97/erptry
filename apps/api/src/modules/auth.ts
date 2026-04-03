import type { FastifyInstance } from 'fastify';

import { demoLoginRequestSchema, demoLoginResponseSchema, loginRequestSchema, sessionActorSchema } from '@erptry/contracts';
import { findBootstrapUserByEmail, toSessionActor } from '@erptry/domain';

import { appConfig } from '../config';
import { prisma } from '../lib/prisma';
import { createPersistedSession, resolvePersistedSession } from '../services/auth-service';

export async function registerAuthModule(app: FastifyInstance) {
  app.post('/api/auth/demo-login', async (request, reply) => {
    const body = demoLoginRequestSchema.parse(request.body);
    const user = findBootstrapUserByEmail(body.email);

    if (!user) {
      return reply.code(404).send({
        error: 'user_not_found',
        message: 'No existe un usuario demo para ese email.'
      });
    }

    const actor = toSessionActor(user);
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + appConfig.sessionTtlMs).toISOString();
    const token = Buffer.from(JSON.stringify({ actor, issuedAt, expiresAt })).toString('base64url');

    return demoLoginResponseSchema.parse({
      token,
      actor,
      issuedAt,
      expiresAt
    });
  });

  app.post('/api/auth/session/resolve', async (request, reply) => {
    const body = request.body as { token?: string };
    let payload: {
      actor: ReturnType<typeof toSessionActor>;
      issuedAt: string;
      expiresAt: string;
    } | null = null;

    if (typeof body.token === 'string') {
      try {
        payload = JSON.parse(Buffer.from(body.token, 'base64url').toString('utf8')) as {
          actor: ReturnType<typeof toSessionActor>;
          issuedAt: string;
          expiresAt: string;
        };
      } catch {
        payload = null;
      }
    }

    if (!payload) {
      return reply.code(401).send({
        error: 'invalid_session',
        message: 'El token de sesion no es valido.'
      });
    }

    if (new Date(payload.expiresAt).getTime() <= Date.now()) {
      return reply.code(401).send({
        error: 'expired_session',
        message: 'La sesion ya ha expirado.'
      });
    }

    return {
      actor: sessionActorSchema.parse(payload.actor),
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt
    };
  });

  app.post('/api/auth/login', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL y ejecuta el seed para activar la autenticacion persistida.'
      });
    }

    const body = loginRequestSchema.parse(request.body);
    const session = await createPersistedSession(prisma, body.email, body.password);

    if (!session) {
      return reply.code(401).send({
        error: 'invalid_credentials',
        message: 'Las credenciales no son validas.'
      });
    }

    return session;
  });

  app.post('/api/auth/me', async (request, reply) => {
    if (!appConfig.databaseUrl) {
      return reply.code(503).send({
        error: 'database_not_configured',
        message: 'Configura DATABASE_URL y ejecuta el seed para activar la autenticacion persistida.'
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

    return me;
  });
}
