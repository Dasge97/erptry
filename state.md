# STATE

## Fase actual

- fase activa: `Fase 6 - Inteligencia, integraciones y salida`
- estado global: `ready_for_manual_review`
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
- corregida una ambiguedad real del repaso de ACL en `Mapa de acceso actual`: ahora el backoffice separa `Usuarios` de `Roles y permisos`, de modo que el perfil `manager` ya no parece tener acceso a roles avanzados cuando en realidad solo gestiona usuarios, con pruebas web y guia de validacion alineadas.
- endurecida la cobertura del repaso ACL con una prueba web explicita del cambio `owner -> manager -> viewer` para blindar la separacion `Usuarios` vs `Roles y permisos`, y ajustada la guia de validacion para que ese orden quede como paso obligatorio del repaso manual.
- reejecutado el circuito tecnico contra PostgreSQL real tras ese endurecimiento (`db:push`, `db:seed`, `validate:release-operable-v1`) confirmando otra vez el flujo venta -> factura -> cobro -> tarea -> reserva y las validaciones negativas de seguridad operativa.
- revalidada la puerta tecnica completa (`typecheck`, `test`, `lint`, `build`) junto con pruebas dedicadas de `apps/api` y `apps/web`, manteniendo el workspace en verde antes del repaso visual manual final.
- endurecida la seguridad de plataforma para separar de verdad `Usuarios` vs `Roles y permisos`: ahora `/api/platform/roles` exige `roles.manage` y el alta de usuarios sin ese permiso queda limitada a perfiles operativos (`operator`/`viewer`) evitando escalado de privilegios por `users.manage`.
- alineado el backoffice con esa restriccion para que perfiles como `manager` dejen de ver selectores de reasignacion de roles, solo carguen altas operativas y mantengan una UX coherente con el mapa de acceso esperado por rol.
- actualizada `docs/release-operable-v1-validation.md` para incluir este control ACL en el repaso `owner -> manager -> viewer` antes del cierre vendible.
- revalidados tests focalizados de `apps/api` y `apps/web`, junto con `corepack pnpm typecheck` y `corepack pnpm lint`, tras el endurecimiento ACL/UX.
- alineado el copy del acceso y de `Perfiles demo y restricciones` con el orden obligatorio `owner -> manager -> viewer`, explicando de forma explicita el control clave de manager (sin catalogo de roles ni reasignacion de perfiles altos) antes del paso final viewer.
- endurecido `apps/api/src/scripts/release-operable-v1-validation.ts` para validar tambien el ACL base de plataforma sobre seed real (`owner` con `roles.manage`, `manager` sin catalogo de roles y limitado a altas `operator/viewer`, `viewer` sin gestion), de modo que el repaso visual final llegue ya con ese control automatizado.
- ejecutado sobre PostgreSQL real el tramo tecnico pendiente con `db:push`, `db:seed` y `validate:release-operable-v1`, dejando en verde la validacion automatizada del flujo end-to-end y del ACL `owner -> manager -> viewer`.
- revalidada la puerta tecnica completa del workspace (`typecheck`, `test`, `lint`, `build`) tras ese rerun para mantener base vendible estable antes del cierre visual manual.
- endurecida la UX de `Permisos visibles` para el repaso manual final: ahora el agrupado de permisos deduplica entradas repetidas y fija un orden estable por bloque operativo (`Plataforma -> Comercial -> Facturacion/Cobros -> Operacion -> Control -> adicionales`), con nueva prueba unitaria en web para evitar ruido o cambios de orden segun el token.
- anadido un bloque `Control ACL del perfil activo` en `apps/web/components/login-panel.tsx` con checks en caliente para `owner`, `manager` y `viewer` (ok/revisar) antes del repaso visual, de modo que cada login detecte al instante desalineaciones de alcance en roles/permisos.
- ampliada la cobertura de helpers web con `getAccessValidationChecks` y pruebas unitarias para blindar expectativas de ACL por perfil demo (`owner` completo, `manager` sin escalado de plataforma, `viewer` solo lectura).
- pulido el ultimo hueco de copy detectado en gestion de usuarios: el backoffice ahora etiqueta roles con nomenclatura legible (`Owner`, `Manager`, `Operator`, `Viewer`) en chips, selects y resumen de perfil, reforzando que cuentas `manager` solo crean perfiles operativos sin escalar permisos de plataforma.
- endurecido `apps/api/src/scripts/release-operable-v1-validation.ts` para validar tambien la matriz de alcance por modulo en ACL (`owner` con cobertura total vendible, `manager` con gestion operativa sin escalar plataforma, `viewer` en solo lectura sin permisos `.manage`), reforzando el control previo al repaso visual final.
- alineados `docs/release-operable-v1-validation.md` y `tasks/current.md` con este nuevo control ACL por modulo dentro de `validate:release-operable-v1`.
- revalidado `corepack pnpm --filter @erptry/api typecheck` tras el endurecimiento ACL del script.
- reejecutados sobre PostgreSQL real `corepack pnpm --filter @erptry/api db:push`, `db:seed` y `validate:release-operable-v1` con `DATABASE_URL` explicita, confirmando en runtime la matriz ACL por modulo (`owner/manager/viewer`) junto al flujo end-to-end vendible.
- rehecha la puerta tecnica completa del workspace (`corepack pnpm typecheck`, `test`, `lint`, `build`) tras ese rerun, manteniendo toda la base en verde antes del repaso visual final.
- anadido en `apps/web/components/login-panel.tsx` el bloque `Progreso del repaso ACL`, apoyado en `getAccessReviewTimeline` y pruebas de helpers, para registrar visualmente el avance `owner -> manager -> viewer` y evitar cierres manuales con perfiles sin revisar.
- alineada la guia `docs/release-operable-v1-validation.md` para usar ese bloque como bitacora de recorrido durante la validacion visual final.
- reejecutada la validacion automatizada de release sobre PostgreSQL real con `DATABASE_URL` explicita (`db:push`, `db:seed`, `validate:release-operable-v1`), confirmando en runtime el flujo end-to-end vendible y el ACL `owner -> manager -> viewer` sin regresiones.
- revalidada la puerta tecnica completa del workspace (`corepack pnpm typecheck`, `test`, `lint`, `build`) manteniendo todos los paquetes en verde antes del ultimo repaso visual manual.
- endurecido `Progreso del repaso ACL` para no perder bitacora al refrescar durante el repaso visual final: el bloque ahora persiste en navegador el avance `owner -> manager -> viewer` hasta usar `Reiniciar recorrido`, con nuevos helpers y pruebas unitarias web.
- reejecutados sobre PostgreSQL local `corepack pnpm --filter @erptry/api db:push`, `db:seed` y `validate:release-operable-v1` con `DATABASE_URL` explicita, confirmando otra vez en runtime el flujo vendible y el ACL (`owner` con roles, `manager` sin catalogo y alta solo operativa, `viewer` sin gestion).
- revalidada la puerta tecnica completa del workspace (`corepack pnpm typecheck`, `test`, `lint`, `build`) sin regresiones despues de este rerun, manteniendo todos los paquetes en verde antes del repaso visual manual final.
- endurecido `Progreso del repaso ACL` para evitar falsos cierres cuando se inicia por un perfil equivocado: ahora detecta saltos de orden en el historial local, marca `orden: revisar` y pide reiniciar antes de aceptar el recorrido `owner -> manager -> viewer` como valido.
- ampliada la cobertura de helpers web con un caso explicito de salto `manager -> viewer` para blindar ese comportamiento y evitar regresiones del control de orden.
- revalidados tests web (`corepack pnpm --filter @erptry/web test -- login-panel-helpers`) y `corepack pnpm --filter @erptry/web typecheck` tras el ajuste de UX/ACL.
- endurecido `apps/api/src/scripts/release-operable-v1-validation.ts` para fallar con mensaje operativo claro cuando falta `DATABASE_URL` y para ejecutar limpieza segura de datos temporales aunque la validacion falle a mitad de recorrido.
- reejecutados sobre PostgreSQL local `corepack pnpm --filter @erptry/api db:push`, `db:seed` y `validate:release-operable-v1` con `DATABASE_URL` explicita, confirmando en runtime que el flujo vendible y la matriz ACL (`owner -> manager -> viewer`) siguen en verde tras ese endurecimiento.
- endurecida la bitacora `Progreso del repaso ACL` para persistir el recorrido por tenant activo en localStorage (sin mezclar empresas demo), reduciendo falsos positivos de cierre manual cuando se alternan tenants en el mismo navegador.
- blindado el aislamiento de esa bitacora por tenant real en `apps/web/components/login-panel.tsx`: la clave de localStorage ahora incorpora tambien `tenantId` (ademas del nombre), evitando colisiones por branding repetido y manteniendo el progreso ACL estable aunque cambie el nombre visible del tenant.
- pulido un hueco real de UX/copy en `Progreso del repaso ACL`: cuando se entra con un perfil fuera del recorrido obligatorio (`operator`/otros), el bloque deja de mostrar orden "ok" en vacio y ahora avisa que ese perfil no suma al circuito `owner -> manager -> viewer`, con siguiente paso explicito para volver a `owner`.
- alineado tambien `Mapa de acceso actual` con ese criterio ACL: los perfiles fuera del recorrido obligatorio ya no sugieren saltar a `viewer` y ahora piden volver a `owner` para retomar el orden `owner -> manager -> viewer` sin falsos cierres.
- endurecida la logica de `Progreso del repaso ACL` para evitar falsos cierres por historial desordenado: si hubo salto de orden, el contador de perfiles validados vuelve a `0/3` y el siguiente paso recomendado se fija en `Owner` aunque ya hayan pasado los tres perfiles.
- endurecida la UX de `Progreso del repaso ACL` para eliminar un falso verde visual: cuando hay `orden: revisar`, las tarjetas de perfiles ya visitados pasan a `revisar` y explican que deben repetirse tras `Reiniciar recorrido`, evitando interpretar como valido un avance fuera de orden.
- endurecido otro hueco del recorrido ACL en `apps/web/components/login-panel-helpers.ts`: ahora tambien se marca `orden: revisar` si se salta `manager` y se entra directo a `viewer` (aunque `owner` ya estuviera visitado), evitando validar como correcto un orden incompleto `owner -> viewer`.
- anadida cobertura unitaria web para ese caso de omision (`owner` directo a `viewer`) en `apps/web/components/login-panel-helpers.test.ts`, blindando que el repaso vuelva a `0/3` y pida reinicio desde `Owner`.
- revalidados `corepack pnpm --filter @erptry/web test -- login-panel-helpers` y `corepack pnpm --filter @erptry/web typecheck` tras el ajuste de orden ACL.
- endurecido un nuevo falso verde en `Progreso del repaso ACL`: si el login actual cae en un perfil fuera del recorrido obligatorio (`operator`/otros) y ya habia avance previo, ahora tambien se fuerza `orden: revisar` y reset visual del progreso para evitar cierres parciales.
- ampliada la cobertura de `apps/web/components/login-panel-helpers.test.ts` con el caso `owner -> operator`, blindando que el contador vuelva a `0/3`, se exija `Owner` como siguiente paso y las tarjetas visitadas queden en `revisar`.
- revalidados `corepack pnpm --filter @erptry/web test -- login-panel-helpers` y `corepack pnpm --filter @erptry/web typecheck` despues de ese ajuste.
- pulido otro punto de claridad en `apps/web/components/login-panel.tsx`: `Progreso del repaso ACL` ahora muestra el chip `bitacora tenant: <nombre>` para dejar explicito a que empresa demo pertenece el avance persistido.
- alineada `docs/release-operable-v1-validation.md` para exigir revisar ese chip antes de continuar el recorrido ACL manual.
- revalidado `corepack pnpm --filter @erptry/web typecheck` tras el ajuste de UX/copy del bloque ACL.
- endurecida la persistencia de `Progreso del repaso ACL` para evitar perdidas de bitacora por cambios de branding del tenant: la clave local ahora prioriza `tenantId` (con fallback a nombre), y el chip visual muestra `nombre + id corto` para distinguir empresas demo homonimas durante el repaso.
- alineados `apps/web/components/login-panel-helpers.test.ts`, `tasks/current.md` y `docs/release-operable-v1-validation.md` con ese ajuste de trazabilidad ACL por tenant.
- revalidados `corepack pnpm --filter @erptry/web test -- login-panel-helpers` y `corepack pnpm --filter @erptry/web typecheck` tras el endurecimiento.
- pulido el diagnostico de `Progreso del repaso ACL` para evitar ambiguedad en pruebas negativas: cuando el login actual cae en un perfil fuera del recorrido obligatorio con bitacora ya iniciada, el aviso pasa a texto especifico de "perfil fuera del recorrido" en vez de mostrar solo "salto de orden".
- ampliada `apps/web/components/login-panel-helpers.test.ts` para blindar ese copy operativo en el caso `owner -> operator`.
- alineadas `docs/release-operable-v1-validation.md` y `tasks/current.md` con este mensaje explicito para que el repaso manual tenga un siguiente paso inequívoco.
- endurecido otro hueco de copy en `Progreso del repaso ACL` para hacer el diagnostico mas accionable: ahora diferencia explicitamente tres causas de `orden: revisar` (inicio fuera de `owner`, salto `owner -> viewer` sin `manager`, y perfil fuera de recorrido como `operator`) en lugar de mostrar un aviso generico.
- ampliada la cobertura de `apps/web/components/login-panel-helpers.test.ts` para blindar esos mensajes de diagnostico por causa y evitar regresiones en el repaso manual ACL.
- revalidados `corepack pnpm --filter @erptry/web test -- login-panel-helpers` y `corepack pnpm --filter @erptry/web typecheck` tras el ajuste de copy/UX del bloque ACL.
- pulido otro falso rojo visual en `Progreso del repaso ACL`: los perfiles aun no visitados ahora se muestran como `pendiente` neutro (borde/chip propios) y solo pasan a `revisar` cuando realmente hay `orden: revisar`, evitando confundir recorrido valido en curso con desviaciones.
- alineados `tasks/current.md` y `docs/release-operable-v1-validation.md` con este criterio para que el repaso manual distinga claramente "pendiente" de "alerta".
- revalidados `corepack pnpm --filter @erptry/web typecheck` y `corepack pnpm --filter @erptry/web test -- login-panel-helpers` tras el ajuste UX visual del bloque ACL.
- revalidada la puerta tecnica completa del workspace (`corepack pnpm typecheck`, `test`, `lint`, `build`) despues del ultimo pulido ACL para mantener `release-operable-v1` en verde mientras queda pendiente solo el repaso visual manual en navegador.
- endurecido el `Repaso visual guiado` para incluir de forma explicita el desvio negativo `owner -> operator`: ahora la tarjeta `Perfiles demo y restricciones` exige validar que `Progreso del repaso ACL` cae en `orden: revisar` y pide reinicio desde `owner`.
- revalidados `corepack pnpm --filter @erptry/web test -- login-panel-helpers` y `corepack pnpm --filter @erptry/web typecheck` tras este ajuste de copy/UX del repaso ACL.
- endurecido `Progreso del repaso ACL` con tres escenarios criticos visibles (`owner -> viewer`, `owner -> operator`, `owner -> manager -> viewer`) para convertir el repaso negativo/positivo en checks accionables `ok/revisar/pendiente` antes del cierre manual.
- alineados `apps/web/components/login-panel-helpers.test.ts`, `tasks/current.md` y `docs/release-operable-v1-validation.md` con estos escenarios ACL para mantener UX, pruebas y guion manual en el mismo lenguaje operativo.

## Pendiente inmediato

- ✅ Puerta tecnica validada: typecheck, test, lint, build en verde
- ✅ validate:release-operable-v1 ejecutado contra PostgreSQL real: flujo end-to-end (venta -> factura -> cobro -> tarea -> reserva) OK, ACL (owner -> manager -> viewer) OK
- ⏳ Repaso manual visual en navegador: requiere acceso a navegador para validar UI ( propietario debe ejecutar este paso)

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

El siguiente paso requiere un humano con navegador: ejecutar el repaso manual visual del backoffice sobre tenant demo segun `docs/release-operable-v1-validation.md`, probando el flujo `owner -> manager -> viewer` y confirmando que la UI muestra los mensajes esperados (orden ok/revisar, tarjetas en estado correcto, contador y pendientes neutros).

## Criterio actual de cierre

El proyecto no se considera terminado cuando un modulo aislado llega a `DONE` ni cuando el alcance documental queda cerrado. Solo puede cerrarse la ejecucion continua al completar `release-operable-v1` segun `spec.md` y demostrar que el producto ya es suficientemente solido, usable y vendible para pymes de servicios.
