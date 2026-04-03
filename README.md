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
- `apps/api` ya expone autenticacion persistida, tenant actual, listado de usuarios y alta inicial de usuarios;
- `apps/api` ya expone catalogo de roles, reasignacion de roles y cierre de sesion persistida;
- `apps/api` ya expone el primer vertical de negocio con `clients`;
- `apps/api` ya expone tambien `products-services` como catalogo comercial inicial;
- `apps/api` ya expone `sales` para unir clientes y catalogo en propuestas persistidas;
- `apps/api` ya expone `billing-invoicing` para emitir facturas desde ventas persistidas;
- `apps/api` ya expone `payments` para registrar cobros, saldo vivo y cierre de factura;
- `apps/api` ya expone `analytics` con un dashboard comercial minimo por tenant;
- `apps/api` ya expone `reports` con exportables CSV minimos para ventas, facturas y cobros;
- `apps/api` ya expone `notifications` con bandeja interna, marcado de lectura y eventos relevantes por tenant;
- `apps/api` ya expone `logs-audit` con feed de trazas sensibles, permisos propios y superficie operativa reutilizando el vocabulario de `notifications`;
- `apps/web` ya renderiza un shell inicial de backoffice;
- existe un guion explicito de validacion en `docs/release-operable-v1-validation.md` para repetir la release sobre tenant demo;
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
corepack pnpm --filter @erptry/api validate:release-operable-v1
```

## Worker global

- este proyecto se coordina con el worker global del servidor en `/home/codehive/codehive/worker-manager`;
- su manifiesto vive en `/home/codehive/codehive/worker-manager/projects/erptry.json`;
- su runtime vive en `/home/codehive/codehive-app-state/workers/erptry/`;
- la guia operativa global esta en `/home/codehive/codehive/worker-manager/docs/WORKER_OPERATIONS.md`.

## Endpoints actuales de API

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/platform/bootstrap`
- `POST /api/auth/demo-login`
- `POST /api/auth/session/resolve`
- `POST /api/auth/login`
- `POST /api/auth/me`
- `POST /api/platform/tenant/current`
- `POST /api/platform/users`
- `POST /api/platform/users/create`
- `POST /api/platform/roles`
- `POST /api/platform/users/role`
- `POST /api/platform/settings`
- `POST /api/platform/settings/update`
- `POST /api/auth/logout`
- `POST /api/clients/list`
- `POST /api/clients/create`
- `POST /api/catalog/list`
- `POST /api/catalog/create`
- `POST /api/sales/list`
- `POST /api/sales/create`
- `POST /api/invoices/list`
- `POST /api/invoices/create`
- `POST /api/payments/list`
- `POST /api/payments/create`
- `POST /api/analytics/overview`
- `POST /api/reports/exports`
- `POST /api/notifications/inbox`
- `POST /api/notifications/read`

## Persistencia actual

- `apps/api/prisma/schema.prisma` define `tenant`, `user`, `role`, `permission`, `session` y tablas intermedias;
- el seed inicial crea un tenant demo, permisos base, rol `owner` y usuario administrador;
- existe una migracion SQL inicial en `apps/api/prisma/migrations/20260403_init/migration.sql`;
- existe una migracion adicional para ajustes persistidos en `apps/api/prisma/migrations/20260403_add_tenant_settings/migration.sql`;
- existe una migracion adicional para clientes en `apps/api/prisma/migrations/20260403_add_clients/migration.sql`;
- existe una migracion adicional para `notifications` en `apps/api/prisma/migrations/20260403_add_notifications/migration.sql`;
- existe una migracion adicional para `sales` y sus lineas en `apps/api/prisma/migrations/20260403_add_sales/migration.sql`;
- existe una migracion adicional para `billing-invoicing` en `apps/api/prisma/migrations/20260403_add_invoices/migration.sql`;
- existe una migracion adicional para `payments` en `apps/api/prisma/migrations/20260403_add_payments/migration.sql`;
- la web ya incluye un panel para probar el login persistido, listar usuarios y crear usuarios del tenant cuando la API tenga base de datos disponible.

## Vertical `clients`

- listado de clientes por tenant;
- alta de clientes desde backoffice;
- seed inicial con un cliente de referencia para validar el vertical.

## Vertical `products-services`

- listado de productos y servicios por tenant;
- alta inicial de items de catalogo desde backoffice;
- seed con un servicio y un producto de referencia para preparar el circuito comercial.

## Vertical `sales`

- listado de propuestas comerciales por tenant;
- alta de ventas enlazando un cliente y una o varias lineas de catalogo activas;
- calculo persistido de importes por linea y total;
- seed con una propuesta inicial para validar el circuito comercial end-to-end.

## Vertical `billing-invoicing`

- listado de facturas por tenant enlazadas a su venta origen y cliente;
- emision de facturas desde ventas activas sin factura previa;
- snapshot persistido de lineas, vencimiento, estado documental e importe total cobrable;
- lectura del saldo vivo, cobrado y detalle de cobros confirmados por factura.

## Vertical `payments`

- listado de cobros por tenant enlazados a factura, venta y cliente;
- registro de cobros parciales o totales sobre facturas emitidas con saldo pendiente;
- conciliacion basica actualizando saldo y estado de factura a `paid` cuando se liquida;
- seed con un cobro parcial inicial para validar el circuito factura-cobro end-to-end.

## Vertical `tasks-internal-work`

- listado de trabajo interno por tenant con ownership sobre `employees`;
- alta de tareas internas asignando responsable, prioridad, estado y vencimiento opcional;
- trazabilidad minima de creador y responsable para preparar agenda y operaciones internas;
- seed con una tarea inicial sobre el empleado demo para validar el circuito interno.

## Vertical `reservations-scheduling`

- agenda minima por tenant enlazada a `employees` y opcionalmente a `tasks-internal-work`;
- alta de reservas con franja horaria, ubicacion, estado y creador persistidos;
- regla anti-solapamiento por empleado para evitar colisiones en reservas activas;
- seed con una reserva inicial para validar agenda operativa desde backoffice.

## Vertical `analytics`

- dashboard comercial minimo por tenant construido sobre `sales`, `billing-invoicing` y `payments` ya persistidos;
- KPIs ejecutivos de pipeline, revenue ganado, facturacion, cobro, saldo pendiente y vencidos;
- desglose por etapa comercial y ranking basico de clientes para priorizacion operativa desde backoffice.

## Vertical `reports`

- exportables CSV minimos por tenant para `sales`, `billing-invoicing` y `payments`;
- resumen ejecutivo reutilizando el snapshot comercial ya disponible en `analytics` para contextualizar cada export;
- descarga directa desde backoffice con vista previa corta de columnas y filas.

## Vertical `notifications`

- bandeja interna por tenant con avisos persistidos, contadores de pendientes y marcado manual de lectura;
- eventos minimos disparados desde `employees`, `tasks-internal-work`, `reservations-scheduling`, `billing-invoicing` y `payments`;
- permisos `notifications.view` y `notifications.manage` para filtrar consulta y acknowledgement en backoffice.

## Vertical `logs-audit`

- feed de auditoria por tenant con persistencia propia, API protegida y superficie de backoffice para revisar acciones sensibles;
- reutiliza `type`, `severity` y `resourceType` ya consolidados en `notifications` para mantener un vocabulario operativo comun;
- registra altas y cambios sensibles de usuarios, ajustes, clientes, catalogo, ventas, facturas, cobros, empleados, tareas, reservas y acknowledgement de avisos;
- permisos `audit.view` y `audit.manage` para exponer el historico sin abrir el resto del backoffice.

## Principios de producto

- modularidad real, no modularidad cosmetica;
- dominio claro antes que acumulacion de features;
- trazabilidad de decisiones y de cambios;
- multi-tenant desde el diseno, aunque la primera release sea contenida;
- seguridad, permisos y auditoria como piezas troncales, no accesorios;
- documentacion util, mantenida y orientada a ejecucion.

## Release objetivo actual

La meta operativa del proyecto ya no se interpreta como "terminar todo el ERP" sin limite. La referencia actual es `release-operable-v1`, entendida como una primera version vendible para pymes de servicios y no como una milestone interna cerrada por documentacion.

Esta release debe dejar operativo, como minimo:

- nucleo de plataforma: `auth`, `users`, `roles-permissions`, `settings`, `multi-tenant`;
- circuito comercial-financiero: `clients`, `products-services`, `sales`, `billing-invoicing`, `payments`;
- operacion interna base: `employees`, `tasks-internal-work`, `reservations-scheduling`;
- visibilidad y control: `analytics`, `reports`, `notifications`, `logs-audit`.

Quedan fuera del cierre de esta release salvo decision posterior documentada:

- `work-shifts`;
- `inventory`;
- `warehouses`;
- `providers`;
- `expenses`;
- `integrations`;
- `workflow-engine`;
- `document-management`;
- `tagging-categorization`;
- `search-engine`;
- `public-portal`;
- `client-panel`;
- `plugin-system`.

## Siguiente paso recomendado

La siguiente iteracion debe seguir la secuencia cerrada de `release-operable-v1`:

1. auditar modulo a modulo si el producto ya sirve de verdad a una pyme de servicios en su flujo principal;
2. endurecer lo que exista pero siga siendo fragil, poco claro o insuficiente en UX, seguridad u operacion;
3. cerrar la release solo cuando el flujo end-to-end sea robusto, demostrable y comprensible sin depender del contexto interno del repo.

## Versionado

- la rama remota actual del repositorio clonado es `main`;
- por reglas operativas del entorno, no se hace `push` sin peticion explicita del usuario;
- antes de publicar habra que revisar que no viajen ficheros locales ni documentacion sensible de despliegue.
