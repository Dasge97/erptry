# STATE

## Fase actual

- fase activa: `Fase 6 - Inteligencia, integraciones y salida`
- estado global: `in_progress`
- release objetivo: `release-operable-v1`

## Completado en esta iteracion

- leidas las reglas iniciales del proyecto;
- elegido stack base y criterio de arquitectura;
- creada estructura documental y operativa del repositorio;
- creados subespacios explicitos para `apps/api`, `apps/web` y `packages/*`;
- definidos roadmap, backlog, skills y dominios modulares;
- anadido criterio de deployment compatible con el servidor CodeHive;
- implementadas `apps/api` y `apps/web` con base ejecutable;
- conectados contratos, dominio y UI compartida;
- implementado un circuito demo de login y sesion firmada para validar acceso;
- anadida persistencia real con Prisma y PostgreSQL para tenants, usuarios, roles, permisos y sesiones;
- anadido el primer CRUD base de plataforma para crear y listar usuarios del tenant;
- anadidos ajustes persistidos del tenant, reasignacion de roles y logout sobre sesiones persistidas;
- anadido `clients` como primer vertical de negocio persistido y visible en backoffice;
- anadido `products-services` como segundo vertical comercial con catalogo persistido y visible en backoffice;
- anadido `sales` como flujo comercial persistido que enlaza clientes y catalogo con lineas y totales;
- anadido `billing-invoicing` para convertir ventas en facturas persistidas con vencimiento, estados y lineas congeladas para cobro;
- anadido `payments` para registrar cobros persistidos sobre facturas emitidas con saldo, metodo y estado de conciliacion basico;
- anadido recalculo de saldo cobrado y cierre automatico de facturas cuando un cobro confirmado liquida el total;
- anadido `employees` con persistencia real, permisos propios, seed enlazable a usuarios y superficie operativa en backoffice;
- anadido `tasks-internal-work` con persistencia real, asignacion a empleados, permisos propios, seed y superficie operativa en backoffice;
- anadido `reservations-scheduling` con agenda persistida, enlace opcional a trabajo interno, permisos propios, seed y reglas anti-solapamiento por empleado;
- anadido `analytics` con dashboard comercial minimo, API propia, permiso dedicado y KPIs de ventas, facturacion y cobro por tenant;
- anadido `reports` con exportables CSV minimos de ventas, facturas y cobros, permiso dedicado y descarga desde backoffice;
- anadido `notifications` con bandeja interna por tenant, persistencia propia, permisos `notifications.view/manage`, marcado de lectura y generacion automatica desde empleados, tareas, reservas, facturas y cobros;
- anadido `logs-audit` con trazas persistidas por tenant para acciones sensibles del backoffice, permisos `audit.view/manage`, endpoint protegido y feed operativo en la web;
- cerrada la definicion de alcance de `release-operable-v1`: `work-shifts`, `inventory`, `warehouses`, `providers` y `expenses` se difieren a la siguiente ola del roadmap y no bloquean el cierre actual;
- endurecida la emision de facturas para que solo parta de ventas `won`, siempre nazca como `issued` y el tenant demo mantenga estados comerciales coherentes en seed;
- anadido `docs/release-operable-v1-validation.md` como guion de validacion end-to-end para la release sobre tenant demo;
- conectada la operacion interna con el circuito comercial al permitir enlazar tareas internas a ventas `won`, reflejar cliente/referencia en agenda y alinear el seed demo con ese arranque operativo;
- endurecido `payments` para aceptar cobros solo sobre facturas realmente `issued`, cubriendo el caso `paid` con prueba automatizada y alineando el guion de validacion con esa regla;
- endurecida la trazabilidad operativa para bloquear tareas nuevas sobre empleados `inactive` y reservas incoherentes con la tarea enlazada o con empleados no `active`, con mensajes API y pruebas automatizadas;
- endurecida la UX del backoffice en el tramo tarea interna -> reserva filtrando responsables no validos, sincronizando la tarea enlazada con su empleado y cubriendo estas reglas con pruebas unitarias web;
- anadida una prueba integrada de servicios `apps/api/src/services/release-operable-v1-flow.test.ts` que recorre venta ganada -> factura -> cobro parcial/final -> tarea interna -> reserva, valida analytics/reportes/notificaciones/auditoria y deja automatizado el nucleo del guion operable aunque falte correrlo contra Postgres real;
- anadida en `apps/web/components/login-panel.tsx` una checklist operable de `release-operable-v1` que resume en UI si el tenant demo ya cubre venta ganada, factura, cobro, tarea interna, reserva y evidencias cruzadas en analytics/reportes/notificaciones/auditoria, con helpers y pruebas unitarias para detectar huecos antes de la validacion manual;
- levantado PostgreSQL local compatible con CodeHive fuera de `docker compose up` en la fuente, resincronizada la base demo con `db:push` + `db:seed` y anadido `apps/api/src/scripts/release-operable-v1-validation.ts` para ejecutar sobre PostgreSQL real el flujo venta -> factura -> cobro -> tarea -> reserva junto con las reglas negativas mas fragiles de facturacion, cobros y agenda;
- endurecido el backoffice en `apps/web/components/login-panel.tsx` para anticipar en UI errores frecuentes del repaso manual: ahora el formulario de cobros bloquea importes por encima del saldo pendiente y la agenda avisa/bloquea franjas con fin anterior al inicio antes de golpear la API, con helpers y pruebas unitarias dedicadas;
- rehecha la puerta tecnica contra PostgreSQL real con `db:push`, `db:seed` y `validate:release-operable-v1`, confirmando el tramo venta -> factura -> cobro -> tarea -> reserva y sus reglas negativas sobre el tenant demo;
- corregido el arranque limpio del workspace local para que `apps/web` genere tipos antes de `typecheck` y `apps/api` pueda arrancar desde build con `tsx dist/main.js`, evitando falsos rojos al validar o levantar el entorno desde cero;
- comprobado el arranque local de `apps/api` y `apps/web` sobre puertos alternativos y rehecho un repaso semiautomatico del backoffice autenticando `owner@erptry.local` y cargando `tenant`, usuarios, ajustes, clientes, catalogo, ventas, facturas, cobros, empleados, tareas, reservas, analytics, reportes, notificaciones y auditoria desde API real;
- endurecida la UX del bloque de validacion en `apps/web/components/login-panel.tsx` con un plan de accion visible que prioriza el siguiente paso del tenant demo para completar el circuito vendible, apoyado en helpers y pruebas unitarias para evitar repasar el backoffice a ciegas;
- pulido el copy operativo del backoffice en el flujo vendible (`catalogo`, `ventas`, `facturacion`, `cobros`, `empleados`, `tareas` y `reservas`) traduciendo enums tecnicos a etiquetas legibles y unificando importes con formato monetario consistente, apoyado en helpers y pruebas unitarias del web;
- validados `typecheck`, `test`, `build` y `lint`.
- rematado el pulido visual del backoffice humanizando tambien `settings`, `notifications`, `logs-audit`, `analytics` y `reports`, y cambiando los formularios de catalogo/cobros para capturar importes en EUR en lugar de centimos, con cobertura ampliada en helpers web;
- revalidados `typecheck`, `test`, `build` y `lint` tras el ajuste de UX/copy.
- alineado el shell inicial y el `manifest` con el objetivo real de `release-operable-v1`, dejando el foco vendible para pymes de servicios visible ya desde portada en vez de conservar copy antiguo de fase bootstrap/analytics;
- rematado otro pulido de lenguaje no tecnico en control y trazabilidad (`notifications`, `logs-audit`) para que el repaso visual final lea empresas, productos/servicios y acciones comprensibles en lugar de etiquetas internas.
- anadido un bloque `Repaso visual guiado` en `apps/web/components/login-panel.tsx`, apoyado en helpers y pruebas unitarias, para que la validacion manual final del backoffice vea de un vistazo el estado del circuito demostrable, formularios en EUR, agenda con trazabilidad y superficie de control sin depender de contexto interno.
- endurecido ese `Repaso visual guiado` con modulos de referencia y checkpoints concretos de revision manual para que el ultimo repaso del backoffice no dependa de interpretar que pantalla revisar ni que validar en cada tramo.
- anadidos atajos `Ir a ...` desde `Checklist operable v1` y `Repaso visual guiado` hacia ventas, facturacion, cobros, trabajo interno, agenda y control, para que el repaso manual final del backoffice sea navegable y repetible sin buscar cada modulo a mano.
- anadidas rutas rapidas por bloque dentro de `Repaso visual guiado` para saltar tambien a submodulos relacionados (`ventas`, `facturacion`, `cobros`, `empleados`, `trabajo interno`, `agenda`, `analytics`, `reportes`, `avisos`, `auditoria`) y evitar perder el hilo durante el repaso manual final.
- ampliado `Repaso visual guiado` para empezar tambien por el nucleo de plataforma con una tarjeta `Acceso, tenant y permisos` y anclas directas a cabecera, ajustes, permisos y usuarios, evitando que el repaso vendible deje fuera la base multi-tenant/roles antes del circuito comercial.
- endurecido el repaso final para permisos reales: el seed ahora deja perfiles demo `owner`, `manager`, `operator` y `viewer` con credenciales conocidas, la pantalla de acceso los expone al entrar y `Repaso visual guiado` anade una tarjeta `Perfiles demo y restricciones` para comprobar visibilidad por rol antes del cierre vendible.
- anadida en `apps/web/components/login-panel.tsx` una parrilla `Perfiles demo listos para repaso` con botones `Usar este perfil` y expectativas visibles por rol para acelerar la validacion manual `owner -> viewer -> manager/owner` sin depender de recordar cuentas o restricciones desde la documentacion.
- alineado `docs/release-operable-v1-validation.md` con ese arranque guiado para que el repaso manual use tambien la nueva parrilla de perfiles antes de entrar al circuito vendible.
- endurecida la agenda del backoffice para que solo ofrezca tareas internas reservables cuando su responsable sigue `active`, limpie selecciones incoherentes al cargar/editar el formulario y explique cuando una tarea no puede pasar a agenda por estado del empleado, con cobertura ampliada en `apps/web/components/login-panel-helpers.test.ts`.
- endurecido `apps/api/src/scripts/release-operable-v1-validation.ts` para comprobar tambien el caso `on_leave`: la validacion crea una tarea con responsable de baja y confirma que agenda no permite reservarla aunque la trazabilidad de la tarea exista, reforzando el criterio real de "solo responsables active".
- reejecutada la puerta tecnica completa del workspace con `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint` y `corepack pnpm build`, confirmando que la base actual sigue en verde antes del repaso manual final del backoffice.
- anadido un bloque `Mapa de acceso actual` en `apps/web/components/login-panel.tsx`, apoyado en nuevos helpers y pruebas web, para resumir por perfil que superficies quedan visibles, gestionables u ocultas y hacer mas repetible el repaso manual `owner` -> `viewer` -> `manager` sin depender de memoria.
- eliminada la advertencia de `next build` sobre la deteccion del plugin de Next en ESLint, dejando `apps/web/eslint.config.mjs` autocontenido para que la puerta tecnica quede limpia tambien en el build final.
- humanizado tambien el detalle tecnico de permisos en `apps/web/components/login-panel.tsx`: ahora el backoffice agrupa permisos por bloque operativo, distingue lectura vs gestion con copy legible y mantiene el codigo tecnico a mano para que el repaso visual de roles no dependa de interpretar una lista plana de keys.

## Pendiente inmediato

- rematar el repaso manual visual del backoffice en navegador sobre el entorno local ya levantable, arrancando ahora por `Perfiles demo listos para repaso`, `Mapa de acceso actual` y `Permisos visibles` para alternar `owner` -> `viewer` -> `manager`/`owner` con expectativas claras antes de seguir con los atajos `Ir a ...` y las rutas rapidas del `Repaso visual guiado`, poniendo foco adicional en que agenda solo deje enlazar tareas con responsables `active`, que la UX de restricciones siga siendo comprensible para un usuario final y que no aparezcan huecos visuales/copy de ultima milla antes del cierre vendible.

## Pendiente estructural de la release

- validar que el perimetro obligatorio de la release queda alineado en API, backoffice, permisos, seeds, pruebas y documentacion;
- revisar de forma autocritica lo ya construido para detectar mejoras necesarias antes de considerar el producto vendible;
- mantener backlog, plan y README alineados por modulo al avanzar.

## Riesgos abiertos

- riesgo de sobredisenar demasiado pronto;
- riesgo de dejar el bootstrap ejecutable sin persistencia real demasiado tiempo;
- riesgo de dispersar modulos antes de cerrar el nucleo de plataforma.

## Regla operativa de versionado

- commit pendiente para una fase estable si el usuario lo pide;
- push bloqueado hasta peticion explicita del usuario;
- revisar rama y politica `master/main` antes de cualquier publicacion posterior.

## Siguiente paso logico

Ejecutar el repaso manual visual del backoffice descrito en `docs/release-operable-v1-validation.md` sobre el entorno local ya comprobado, arrancando por `Perfiles demo listos para repaso`, `Mapa de acceso actual`, `Permisos visibles` y `Acceso, tenant y permisos`, cambiando despues a `viewer@erptry.local` para validar restricciones reales y retomando el flujo vendible con la guia visual del panel, sus atajos `Ir a ...` y las rutas por bloque, comprobando tambien que agenda no permita enlazar tareas con responsables no `active` y que ese bloqueo se entienda sin contexto tecnico.

## Criterio actual de cierre

El proyecto no se considera terminado cuando un modulo aislado llega a `DONE` ni cuando el alcance documental queda cerrado. Solo puede cerrarse la ejecucion continua al completar `release-operable-v1` segun `spec.md` y demostrar que el producto ya es suficientemente solido, usable y vendible para pymes de servicios.
