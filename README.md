# ERPTRY

ERPTRY es la base de un ERP modular, multiempresa y orientado a salida real a mercado. Esta primera iteracion no intenta programar todo el producto: deja una estructura seria, un criterio de arquitectura claro, una definicion profunda de modulos y un sistema de trabajo que permita a un equipo continuar sin rehacer decisiones troncales.

## Objetivo del proyecto

- construir un ERP modular para pymes y operaciones de servicios, comercio y gestion interna;
- permitir crecimiento progresivo por dominios sin romper la coherencia global;
- soportar multi-tenant desde la base;
- dejar preparada una salida profesional a mercado con foco en mantenibilidad, trazabilidad y despliegue reproducible.

## Stack elegido

He elegido una base de monorepo en TypeScript con `pnpm` y `turbo` como organizacion inicial.

Direccion tecnica ya activada en el repositorio:

- `apps/web`: frontend de backoffice y portal publico con React y Next.js.
- `apps/api`: API modular con Fastify en TypeScript.
- `packages/domain`: reglas de dominio, tipos y contratos internos.
- `packages/contracts`: DTOs, esquemas y eventos compartidos.
- `packages/ui`: sistema de componentes para backoffice y portales.
- `packages/config`: configuraciones compartidas de linting, tsconfig y herramientas.
- `infra/`: contenedores, compose, seeds, scripts y definicion operativa.

## Por que esta eleccion

- TypeScript reduce ambiguedad en contratos y facilita crecimiento por equipos.
- El monorepo mejora consistencia entre frontend, API y paquetes compartidos.
- `pnpm` mantiene el workspace ligero y reproducible.
- `turbo` permite escalado posterior sin imponer complejidad excesiva ahora.
- La separacion por `apps/` y `packages/` favorece modularidad real y testing por capas.
- La base sirve tanto para una primera version contenida como para evolucion a producto multiempresa serio.

## Estructura actual

```text
.
├── README.md
├── README_DEPLOY.md
├── spec.md
├── plan.md
├── state.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── apps/
├── packages/
├── infra/
├── docs/
├── modules/
├── skills/
├── tasks/
└── logs/
```

## Estado de la primera iteracion

- definida la arquitectura objetivo y el criterio de stack;
- documentadas reglas de trabajo, fases y backlog inicial;
- agrupados los modulos del ERP por dominios funcionales;
- creadas skills operativas para arquitectura, documentacion, planificacion, producto, revision, git y despliegue;
- preparado el repositorio para continuar con implementacion real sin perder contexto.

## Estado de la segunda iteracion

- `apps/api` ya responde con `healthcheck`, `manifest` y `bootstrap snapshot`;
- `apps/api` ya expone login demo y resolucion de sesion firmada;
- `apps/web` ya renderiza un shell inicial de backoffice;
- `packages/contracts`, `packages/domain` y `packages/ui` ya estan conectados y probados;
- existe validacion minima con `typecheck`, `test`, `build` y `lint` en verde;
- `infra/docker/docker-compose.local.yml` deja preparado el entorno local de desarrollo.

## Comandos utiles

```bash
corepack pnpm install
corepack pnpm typecheck
corepack pnpm test
corepack pnpm lint
corepack pnpm build
corepack pnpm --filter @erptry/api dev
corepack pnpm --filter @erptry/web dev
corepack pnpm --filter @erptry/api db:push
corepack pnpm --filter @erptry/api db:seed
```

## Endpoints actuales de API

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/platform/bootstrap`
- `POST /api/auth/demo-login`
- `POST /api/auth/session/resolve`
- `POST /api/auth/login`
- `POST /api/auth/me`

## Persistencia actual

- `apps/api/prisma/schema.prisma` define `tenant`, `user`, `role`, `permission`, `session` y tablas intermedias;
- el seed inicial crea un tenant demo, permisos base, rol `owner` y usuario administrador;
- la web ya incluye un panel para probar el login persistido cuando la API tenga base de datos disponible.

## Principios de producto

- modularidad real, no modularidad cosmetica;
- dominio claro antes que acumulacion de features;
- trazabilidad de decisiones y de cambios;
- multi-tenant desde el diseno, aunque la primera release sea contenida;
- seguridad, permisos y auditoria como piezas troncales, no accesorios;
- documentacion util, mantenida y orientada a ejecucion.

## Siguiente paso recomendado

La siguiente iteracion debe profundizar la base tecnica ya ejecutable:

1. persistencia real con PostgreSQL y estrategia de migraciones;
2. sesiones o tokens de autenticacion;
3. tenants, usuarios, roles y permisos persistidos;
4. primer flujo vertical completo de acceso al sistema.

## Versionado

- la rama remota actual del repositorio clonado es `main`;
- por reglas operativas del entorno, no se hace `push` sin peticion explicita del usuario;
- antes de publicar habra que revisar que no viajen ficheros locales ni documentacion sensible de despliegue.
