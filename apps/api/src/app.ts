import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';

import { registerAuthModule } from './modules/auth';
import { registerPlatformModule } from './modules/platform';

export async function createApp() {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });
  await app.register(sensible);
  await registerAuthModule(app);
  await registerPlatformModule(app);

  return app;
}
