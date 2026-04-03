# Release Operable V1 Validation

## Objetivo

Dejar una validacion repetible para `release-operable-v1` sobre un tenant demo, centrada en el flujo minimo vendible para una pyme de servicios sin depender de conocimiento interno del repo.

## Precondiciones

- configurar `DATABASE_URL` y arrancar API y web en local;
- en entornos CodeHive donde no convenga usar `docker compose up` desde la fuente, se puede levantar solo PostgreSQL con `docker run -d --name erptry-postgres -e POSTGRES_DB=erptry -e POSTGRES_USER=erptry -e POSTGRES_PASSWORD=erptry -p 5432:5432 postgres:16-alpine`;
- ejecutar `corepack pnpm --filter @erptry/api db:push` y `corepack pnpm --filter @erptry/api db:seed`;
- ejecutar `corepack pnpm --filter @erptry/api validate:release-operable-v1` para comprobar sobre PostgreSQL real el tramo venta ganada -> factura -> cobro -> tarea interna -> reserva, junto con el control ACL `owner -> manager -> viewer` (catalogo de roles, altas operativas y alcance esperado por modulo) antes del repaso visual en backoffice;
- usar el tenant demo `ERPTRY Demo` con las cuentas `owner@erptry.local`, `manager@erptry.local`, `operator@erptry.local` y `viewer@erptry.local`; salvo override en variables `SEED_*_PASSWORD`, la clave demo comun es `erptry1234`.
- antes de iniciar sesion, apoyarse en `Perfiles demo listos para repaso` para cargar cada cuenta con `Usar este perfil` y recordar que superficies debe poder revisar o no ver cada rol durante la validacion manual;
- dentro del backoffice, apoyarse en `Repaso visual guiado` para seguir por modulo que revisar, donde mirar y que validaciones de comprensibilidad deben pasar antes de considerar cierre;
- empezar el repaso por la nueva tarjeta `Acceso, tenant y permisos` para comprobar cabecera, ajustes, `Permisos visibles` y usuarios/roles antes de entrar en el circuito comercial;
- tras iniciar sesion, revisar tambien `Mapa de acceso actual` para confirmar de un vistazo que el perfil cargado expone justo las superficies visibles, gestionables y ocultas que toca validar en ese paso del repaso;
- revisar tambien `Control ACL del perfil activo` para validar en caliente (ok/revisar) que cada login respeta el alcance esperado del perfil demo antes de entrar al resto de modulos;
- usar `Progreso del repaso ACL` como bitacora visual para confirmar en una sola pasada el orden obligatorio `owner -> manager -> viewer` y detectar si falta algun perfil antes de cerrar;
- si se entra con un perfil fuera de ese recorrido obligatorio (por ejemplo `operator`), `Progreso del repaso ACL` debe quedar en `orden: revisar`, mostrar el aviso explicito de perfil fuera de recorrido y pedir volver a `owner`; ese acceso no cuenta como avance del control ACL minimo;
- en ese mismo caso, `Mapa de acceso actual` debe mostrar como siguiente paso volver a `owner` (no saltar directo a `viewer`) para mantener el recorrido manual consistente;
- si recargas el navegador o cambias de seccion durante ese recorrido, `Progreso del repaso ACL` conserva el avance local en este navegador y en el tenant activo hasta pulsar `Reiniciar recorrido`;
- antes de seguir el recorrido, comprobar que el chip `bitacora tenant` en `Progreso del repaso ACL` (nombre + id corto) coincide con la empresa demo que estas revisando en ese login;
- si `Progreso del repaso ACL` marca `orden: revisar`, reiniciar el recorrido y repetir el orden `owner -> manager -> viewer` antes de dar por valido el repaso manual;
- si se salta `manager` y se entra de `owner` directo a `viewer`, `Progreso del repaso ACL` debe quedar en `orden: revisar` y exigir reinicio (ese atajo no cuenta como avance valido);
- en ese caso `owner -> viewer`, el aviso de `Progreso del repaso ACL` debe nombrar explicitamente ese salto (no solo un "salto de orden" generico) para que el siguiente paso quede inequívoco;
- si el recorrido empieza en `manager` o aparece un perfil fuera del circuito (`operator`/otros), el aviso de `Progreso del repaso ACL` debe indicar ese motivo concreto antes de reiniciar;
- si aparece `orden: revisar`, el contador `perfiles validados` no debe interpretarse como cierre aunque ya muestre perfiles visitados; el recorrido solo cuenta cuando el orden vuelve a `ok`;
- con `orden: revisar`, las tarjetas de perfiles ya visitados en `Progreso del repaso ACL` deben quedar tambien en estado `revisar` para dejar explicito que ese avance no cuenta hasta reiniciar;
- mientras el orden siga `ok`, las tarjetas todavia no visitadas en `Progreso del repaso ACL` deben verse como `pendiente` neutro (sin estilo de alerta), para distinguir avance incompleto de un desvio real;
- usar el bloque `Permisos visibles` para contrastar que cada permiso aparece agrupado por area operativa, distingue bien lectura vs gestion y no mezcla `Usuarios` con `Roles y permisos` cuando el perfil solo cubre una de esas superficies;
- usar despues la tarjeta `Perfiles demo y restricciones` para repetir ese acceso con perfiles limitados (`manager` y `viewer`) y validar visibilidad real por rol sin tocar datos productivos de prueba;
- usar los nuevos atajos `Ir a ...` de `Checklist operable v1` y `Repaso visual guiado` para saltar directamente al modulo que toca revisar sin perderse en el backoffice largo;
- dentro de `Repaso visual guiado`, aprovechar tambien los chips de ruta por bloque (`Acceso`, `Ajustes`, `Permisos`, `Usuarios`, `Ventas`, `Facturacion`, `Cobros`, `Empleados`, `Trabajo interno`, `Agenda`, `Analytics`, `Reportes`, `Avisos`, `Auditoria`) para repasar todas las superficies relacionadas sin volver al menu general.

## Flujo obligatorio

1. iniciar sesion y comprobar que el tenant actual, `Mapa de acceso actual`, `Control ACL del perfil activo`, `Permisos visibles`, usuarios, ajustes, notificaciones y auditoria cargan sin errores y con expectativas coherentes para el perfil activo;
2. repetir el acceso en orden `owner -> manager -> viewer`, usando `Progreso del repaso ACL` para dejar el recorrido completo en verde, comprobar la separacion real `Usuarios` vs `Roles y permisos`, validar que `manager` no puede consultar el catalogo de roles ni reasignar perfiles altos, y confirmar que en `viewer` desaparecen ajustes, usuarios y acciones de gestion con copy comprensible y permisos visibles coherentes;
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
- sin `roles.manage`, la gestion de usuarios queda limitada a altas operativas (`operator`/`viewer`) y no se puede consultar el catalogo completo de roles;
- `manager` conserva gestion operativa (`sales/billing/payments/employees/tasks/reservations/notifications`) y lectura de control (`analytics/reports/audit`) sin escalar a `settings.manage`, `roles.manage` ni `audit.manage`;
- `viewer` mantiene lectura completa del circuito (`sales/billing/payments/employees/tasks/reservations/analytics/reports/notifications/audit`) sin ningun permiso `.manage`;
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
