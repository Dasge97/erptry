import { createHmac, timingSafeEqual } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { demoLoginRequestSchema, demoLoginResponseSchema, sessionActorSchema } from '@erptry/contracts';
import { findBootstrapUserByEmail, toSessionActor } from '@erptry/domain';

import { appConfig } from '../config';

type SessionTokenPayload = {
  actor: ReturnType<typeof toSessionActor>;
  issuedAt: string;
  expiresAt: string;
};

function signPayload(payload: string): string {
  return createHmac('sha256', appConfig.sessionSecret).update(payload).digest('base64url');
}

function encodeToken(payload: SessionTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function decodeToken(token: string): SessionTokenPayload | null {
  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = signPayload(encodedPayload);

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionTokenPayload;

    return parsed;
  } catch {
    return null;
  }
}

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
    const token = encodeToken({ actor, issuedAt, expiresAt });

    return demoLoginResponseSchema.parse({
      token,
      actor,
      issuedAt,
      expiresAt
    });
  });

  app.post('/api/auth/session/resolve', async (request, reply) => {
    const body = request.body as { token?: string };
    const payload = typeof body.token === 'string' ? decodeToken(body.token) : null;

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
}
