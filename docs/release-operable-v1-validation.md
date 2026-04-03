# Release Operable V1 Validation

## Objetivo

Dejar una validacion repetible para `release-operable-v1` sobre un tenant demo, centrada en el flujo minimo vendible para una pyme de servicios sin depender de conocimiento interno del repo.

## Precondiciones

- configurar `DATABASE_URL` y arrancar API y web en local;
- en entornos CodeHive donde no convenga usar `docker compose up` desde la fuente, se puede levantar solo PostgreSQL con `docker run -d --name erptry-postgres -e POSTGRES_DB=erptry -e POSTGRES_USER=erptry -e POSTGRES_PASSWORD=erptry -p 5432:5432 postgres:16-alpine`;
- ejecutar `corepack pnpm --filter @erptry/api db:push` y `corepack pnpm --filter @erptry/api db:seed`;
- ejecutar `corepack pnpm --filter @erptry/api validate:release-operable-v1` para comprobar sobre PostgreSQL real el tramo venta ganada -> factura -> cobro -> tarea interna -> reserva y las reglas de endurecimiento mas fragiles antes del repaso visual en backoffice;
- usar el tenant demo `ERPTRY Demo` con las cuentas `owner@erptry.local`, `manager@erptry.local`, `operator@erptry.local` y `viewer@erptry.local`; salvo override en variables `SEED_*_PASSWORD`, la clave demo comun es `erptry1234`.
- antes de iniciar sesion, apoyarse en `Perfiles demo listos para repaso` para cargar cada cuenta con `Usar este perfil` y recordar que superficies debe poder revisar o no ver cada rol durante la validacion manual;
- dentro del backoffice, apoyarse en `Repaso visual guiado` para seguir por modulo que revisar, donde mirar y que validaciones de comprensibilidad deben pasar antes de considerar cierre;
- empezar el repaso por la nueva tarjeta `Acceso, tenant y permisos` para comprobar cabecera, ajustes, `Permisos visibles` y usuarios/roles antes de entrar en el circuito comercial;
- tras iniciar sesion, revisar tambien `Mapa de acceso actual` para confirmar de un vistazo que el perfil cargado expone justo las superficies visibles, gestionables y ocultas que toca validar en ese paso del repaso;
- usar el bloque `Permisos visibles` para contrastar que cada permiso aparece agrupado por area operativa y distingue bien lectura vs gestion antes de pasar al cambio de perfil;
- usar despues la tarjeta `Perfiles demo y restricciones` para repetir ese acceso con un perfil limitado y validar visibilidad real por rol sin tocar datos productivos de prueba;
- usar los nuevos atajos `Ir a ...` de `Checklist operable v1` y `Repaso visual guiado` para saltar directamente al modulo que toca revisar sin perderse en el backoffice largo;
- dentro de `Repaso visual guiado`, aprovechar tambien los chips de ruta por bloque (`Acceso`, `Ajustes`, `Permisos`, `Usuarios`, `Ventas`, `Facturacion`, `Cobros`, `Empleados`, `Trabajo interno`, `Agenda`, `Analytics`, `Reportes`, `Avisos`, `Auditoria`) para repasar todas las superficies relacionadas sin volver al menu general.

## Flujo obligatorio

1. iniciar sesion y comprobar que el tenant actual, `Mapa de acceso actual`, `Permisos visibles`, usuarios, ajustes, notificaciones y auditoria cargan sin errores y con expectativas coherentes para el perfil activo;
2. cerrar sesion y repetir el acceso al menos con `viewer@erptry.local` para comprobar que desaparecen ajustes, usuarios y acciones de gestion, manteniendo copy comprensible y permisos visibles coherentes;
3. revisar que existe al menos un cliente demo, un servicio demo y una venta demo en estado `won` lista para facturar;
4. emitir factura desde una venta `won` sin factura previa y confirmar que nace en estado `issued`, con saldo pendiente y lineas congeladas;
5. registrar un cobro parcial o total sobre la factura emitida y comprobar recalculo de saldo, cierre a `paid` cuando aplique y notificacion financiera visible;
6. crear o revisar un empleado activo, asignarle una tarea interna enlazada a una venta `won` y confirmar que la tarea queda visible en trabajo interno con referencia comercial y cliente;
7. crear una reserva para ese empleado, enlazada opcionalmente a la tarea, y validar que arrastra esa trazabilidad operativa sin permitir solapamientos activos;
8. revisar `analytics`, `reports`, `notifications` y `logs-audit` para confirmar coherencia con los eventos generados en el flujo.

## Validaciones de endurecimiento

- no se puede emitir factura desde ventas `draft`, `sent` o `lost`;
- no se puede crear una factura ya `paid` o `void` desde el formulario de emision;
- no se pueden registrar cobros por encima del saldo pendiente ni sobre facturas fuera de `issued` (incluidas `paid` o `void`);
- no se pueden asignar tareas internas nuevas a empleados `inactive`, aunque sigan existiendo en el historico del tenant;
- no se pueden crear reservas sobre empleados no `active` (incluyendo fichas `on_leave` o `inactive`) ni cambiar el responsable cuando una reserva queda enlazada a una tarea interna ya asignada;
- los modulos protegidos responden con error comprensible cuando faltan permisos o sesion;
- el seed deja una base coherente con el circuito real, sin estados comerciales incompatibles entre venta, factura y cobro.

## Puerta tecnica

- `corepack pnpm --filter @erptry/api validate:release-operable-v1`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm build`

## Cierre de esta validacion

La release solo puede acercarse a cierre cuando este guion puede ejecutarse de punta a punta en un tenant demo sin parches manuales fragiles y con mensajes operativos comprensibles para un usuario nuevo.
