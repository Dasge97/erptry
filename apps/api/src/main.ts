import { createApp } from './app';
import { appConfig } from './config';

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
