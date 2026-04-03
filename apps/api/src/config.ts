export const appConfig = {
  name: 'ERPTRY API',
  phase: 'Fase 1 - Bootstrap tecnico',
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET ?? 'erptry-dev-session-secret',
  sessionTtlMs: Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 8)
};
