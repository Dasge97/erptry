import { createApp } from './app.js';
import { appConfig } from './config.js';

const app = await createApp();

try {
  await app.listen({
    host: appConfig.host,
    port: appConfig.port
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
