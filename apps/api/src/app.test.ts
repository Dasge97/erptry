import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app';

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  app = await createApp();
});

afterAll(async () => {
  await app.close();
});

describe('api bootstrap', () => {
  it('responde healthcheck', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('ok');
  });

  it('expone snapshot de plataforma', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/platform/bootstrap' });

    expect(response.statusCode).toBe(200);
    expect(response.json().capabilities).toContain('auth');
  });

  it('crea una sesion demo para un usuario conocido', async () => {
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/demo-login',
      payload: {
        email: 'owner@erptry.local'
      }
    });

    expect(loginResponse.statusCode).toBe(200);

    const loginData = loginResponse.json();
    const sessionResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/session/resolve',
      payload: {
        token: loginData.token
      }
    });

    expect(sessionResponse.statusCode).toBe(200);
    expect(sessionResponse.json().actor.role).toBe('owner');
  });
});
