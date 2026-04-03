# Log de decisiones

## D-001 - Monorepo TypeScript con pnpm

- motivo: equilibrar velocidad de arranque, mantenibilidad y contratos compartidos;
- impacto: facilita separar apps y paquetes sin duplicidad;
- consecuencia futura: exigir disciplina en limites de modulo.

## D-002 - Priorizacion por nucleo de plataforma

- motivo: sin tenant, auth y permisos el resto del ERP nace fragil;
- impacto: se retrasa lo vistoso para asegurar base sólida;
- consecuencia futura: salida a mercado mas lenta al inicio pero mucho mas estable.

## D-003 - Modulos agrupados por dominios

- motivo: reducir caos documental y mostrar dependencias reales;
- impacto: mejor lectura para equipo y roadmap;
- consecuencia futura: cuando haya codigo, cada grupo debera partirse en paquetes o modulos concretos.

## D-004 - Deployment objetivo documentado desde el inicio

- motivo: este servidor exige alineacion entre fuente, deployment y Traefik;
- impacto: se evita improvisar despliegue mas adelante;
- consecuencia futura: al crear compose real habra que respetar exactamente este flujo.

## D-005 - Subespacios explicitados para apps y paquetes

- motivo: evitar que la siguiente iteracion empiece con carpetas ambiguas o sin ownership;
- impacto: `apps/api`, `apps/web` y `packages/*` ya tienen intencion funcional clara;
- consecuencia futura: el bootstrap tecnico puede centrarse en codigo y no en rediscutir estructura.

## D-006 - Fastify como base real de la API

- motivo: reduce friccion inicial, mantiene modularidad y acelera el primer despliegue ejecutable;
- impacto: la API ya arranca con endpoints base, healthcheck y snapshot de plataforma;
- consecuencia futura: la modularidad debera crecer por dominios sin caer en handlers gigantes.

## D-007 - Verificacion minima obligatoria en cada iteracion tecnica

- motivo: evitar que la base documental derive en una base rota al empezar a programar;
- impacto: `typecheck`, `test`, `lint` y `build` se usan como puerta minima de avance;
- consecuencia futura: al entrar en persistencia y auth debera mantenerse esta disciplina.

## D-008 - Login demo antes de persistencia definitiva

- motivo: validar pronto el circuito de acceso sin bloquear el avance por la base de datos;
- impacto: ya existe un flujo de login y resolucion de sesion reutilizable para futuras capas de auth;
- consecuencia futura: habra que reemplazar usuarios bootstrap y secreto de desarrollo por almacenamiento y gestion reales.

## D-009 - Prisma con PostgreSQL como primera persistencia real

- motivo: acelerar un modelo relacional fuerte para tenant, usuarios, roles, permisos y sesiones;
- impacto: la base ya puede pasar de bootstrap en memoria a autenticacion persistida con seed reproducible;
- consecuencia futura: la siguiente iteracion debe convertir `db push` en migraciones versionadas de release.

## D-010 - Primer CRUD administrativo sobre usuarios del tenant

- motivo: convertir la autenticacion en un flujo de backoffice util y no solo en acceso tecnico;
- impacto: el panel web ya puede listar y crear usuarios del tenant sobre la base persistida;
- consecuencia futura: hay que separar mejor validacion, permisos finos y estados de usuario antes de crecer a empleados y clientes.
