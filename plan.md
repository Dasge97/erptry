# PLAN

## Objetivo de roadmap

Construir una base de ERP modular, multiempresa y profesional, empezando por una primera iteracion de arquitectura y documentacion accionable y continuando despues con una base tecnica ejecutable y un primer vertical funcional.

## Objetivo operativo actual

El objetivo de ejecucion continua pasa a ser completar `release-operable-v1` como producto vendible para pymes de servicios, no "todo el ERP" sin limite ni una milestone interna cerrada demasiado pronto.

La `release-operable-v1` debe dejar operativos, como minimo:

- nucleo de plataforma: `auth`, `users`, `roles-permissions`, `settings`, `multi-tenant`;
- circuito comercial-financiero: `clients`, `products-services`, `sales`, `billing-invoicing`, `payments`;
- operacion interna base: `employees`, `tasks-internal-work`, `reservations-scheduling`;
- visibilidad y control: `analytics`, `reports`, `notifications`, `logs-audit`.

Quedan diferidos a la siguiente ola del roadmap, sin bloquear el cierre de esta release, `work-shifts`, `inventory`, `warehouses`, `providers` y `expenses`.

Quedan fuera de esta release `integrations`, `workflow-engine`, `document-management`, `tagging-categorization`, `search-engine`, `public-portal`, `client-panel` y `plugin-system`.

## Fases

### Fase 0 - Fundacion documental

- definir stack, estructura y reglas del proyecto;
- crear mapa modular;
- fijar backlog y calidad minima;
- dejar skills y estado persistente.

### Fase 1 - Bootstrap tecnico

- crear `apps/api` y `apps/web`;
- fijar configs compartidas;
- preparar base de datos y migraciones;
- dejar entorno local reproducible.

Estado actual:

- `apps/api` creada con endpoints base;
- `apps/web` creada con shell inicial;
- paquetes compartidos y validaciones minimas activos;
- persistencia real, auth operativa y migraciones iniciales activas.

### Fase 2 - Nucleo de plataforma

- implementar `multi-tenant`;
- implementar `auth`, `users`, `roles-permissions`, `settings`;
- dejar auditoria basica y contratos de acceso.

Estado actual:

- `multi-tenant`, `auth`, `users`, `roles-permissions` y `settings` ya operan sobre PostgreSQL con Prisma;
- el backoffice ya permite login persistido, gestion de usuarios, roles, ajustes y cierre de sesion.

### Fase 3 - Circuito comercial minimo

- `clients`, `products-services`, `sales`, `billing-invoicing`, `payments`;
- dashboard inicial;
- reporting financiero base.

Estado actual:

- `clients`, `products-services`, `sales`, `billing-invoicing` y `payments` ya estan operativos en API, seed y backoffice;
- `sales` ya une clientes y catalogo en propuestas persistidas con lineas y totales;
- `billing-invoicing` ya convierte ventas en facturas cobrables con snapshot de lineas, vencimiento, saldo y detalle de cobros;
- `payments` ya registra cobros parciales o totales y liquida facturas al completar el saldo;
- `employees` ya abre la base operativa interna con ficha laboral, enlace opcional a usuario y superficie en backoffice;
- `tasks-internal-work` ya enlaza employees con trabajo interno asignable, permisos propios, seed y superficie operativa en backoffice;
- `reservations-scheduling` ya enlaza employees y tareas internas con agenda persistida, permisos propios y reglas anti-solapamiento;
- `analytics` ya ofrece un dashboard comercial minimo con KPIs de ventas, facturacion y cobro por tenant;
- `reports` ya expone exportables CSV minimos sobre ventas, facturas y cobros con permiso propio y superficie en backoffice;
- `notifications` ya cubre avisos internos por tenant con persistencia, permisos propios, marcado de lectura y eventos operativos reutilizando modulos ya cerrados;
- `logs-audit` ya cubre trazas minimas por tenant con persistencia propia, permisos `audit.view/manage`, API protegida y superficie de backoffice reutilizando el vocabulario asentado en `notifications`.

### Fase 4 - Operacion interna

- `employees`, `work-shifts`, `tasks-internal-work`, `reservations-scheduling`.

Objetivo de cierre:

- dejar operativa la base interna minima para personas, agenda y trabajo interno dentro de `release-operable-v1`.

Decision de alcance:

- `employees`, `tasks-internal-work` y `reservations-scheduling` forman parte del minimo operable de la release;
- `work-shifts` se difiere a la siguiente ola para no abrir un subdominio de fichajes e incidencias sin cerrar aun la validacion final de la release.

### Fase 5 - Logistica y control

- `providers`, `inventory`, `warehouses`, `expenses`.

Objetivo de cierre:

- dejar estos modulos preparados como siguiente ola tras `release-operable-v1`;
- no incorporarlos al cierre actual porque el minimo operable ya queda cubierto por el circuito comercial-financiero, operativo y de control existente.

### Fase 6 - Inteligencia, integraciones y salida

- `analytics`, `reports`, `notifications`, `integrations`, `workflow-engine`;
- `public-portal` y `client-panel`;
- endurecimiento para release.

Objetivo de cierre:

- cerrar `analytics`, `reports`, `notifications` y `logs-audit` como parte del nivel operable;
- dejar `integrations`, `workflow-engine`, portales y extensibilidad fuera del cierre de `release-operable-v1` salvo decision explicita.

## Replanificacion prevista

- al cerrar cada fase se revisara alcance, deuda y dependencias;
- si la complejidad real exige dividir una fase, se hara antes de implementar a ciegas;
- el objetivo es mantener un roadmap vivo y realista, no una lista estatica.

## Siguiente hito operativo

- endurecer el producto sobre el alcance ya fijado con criterio de venta real para pymes de servicios;
- revisar modulo a modulo robustez, UX, permisos, seeds, validaciones y coherencia end-to-end antes de cualquier cierre;
- ejecutar mejoras autocriticas cuando algo exista pero siga siendo fragil, tosco o insuficiente para una operacion real.
