# SPEC

## 1. Vision

ERPTRY debe convertirse en un ERP modular, multiempresa y preparado para distintos modelos operativos: servicios, gestion comercial, operaciones internas y extensiones futuras. La prioridad de esta primera iteracion es dejar una base profesional y coherente, no construir aun todo el producto.

## 2. Objetivos de la primera iteracion

- fijar la direccion de arquitectura;
- documentar reglas del agente y transformarlas en sistema operativo de proyecto;
- definir modulos, contratos y prioridades;
- dejar roadmap, estado, backlog y skills listos para trabajo continuo;
- preparar el repositorio para una implementacion progresiva sin caos estructural.

## 3. Reglas operativas traducidas a decisiones de proyecto

### 3.1 Autonomia y decision automatica

- las decisiones tecnicas se cierran con criterio profesional y se documentan;
- no se abren listas interminables de alternativas si una opcion ya satisface negocio, mantenibilidad y velocidad razonable;
- cada eleccion estructural queda reflejada en `README.md`, `plan.md`, `state.md` y `logs/decisions.md`.

### 3.2 Iteracion continua

- cada iteracion debe producir artefactos tangibles o mejoras reales;
- ninguna fase se considera cerrada sin una revision critica minima;
- la deuda tecnica visible se resuelve o se agenda con motivo documentado.

### 3.3 Persistencia de estado

- `plan.md` guarda roadmap, fases y direccion futura;
- `state.md` conserva la situacion operativa actual;
- `tasks/` separa backlog, foco actual y fases;
- `logs/` conserva decisiones y revisiones;
- `modules/` detalla el mapa funcional por dominios.

### 3.4 Progresion obligatoria

Cada ciclo debe dejar al menos uno de estos avances:

- nueva estructura reutilizable;
- decisiones cerradas con argumentos;
- contratos mejor definidos;
- implementacion real o base inmediata para implementarla.

### 3.5 Anti-loop y redefinicion de bloqueo

- si una tarea no avanza, se divide;
- si una estrategia repite friccion, se cambia;
- si falta contexto, se deduce el minimo necesario para continuar.

### 3.6 Definicion de terminado

Una pieza no queda terminada si:

- no esta documentada;
- no tiene encaje arquitectonico claro;
- no expone dependencias y limites;
- o no podria retomarla otro equipo con rapidez razonable.

### 3.7 Contratos entre modulos

Todos los modulos deben crecer con contratos explicitos:

- APIs tipadas;
- DTOs y esquemas compartidos;
- eventos de dominio e integracion;
- permisos y limites de acceso definidos;
- ownership funcional claro.

### 3.8 Validacion minima automatica

La base del proyecto debe poder validar de forma ligera:

- consistencia de nombres;
- integridad de imports;
- estructura esperada;
- documentacion minima obligatoria;
- preparacion para lint, test y typecheck.

## 4. Stack y arquitectura objetivo

## 4.1 Stack base decidido

- monorepo con `pnpm`;
- orquestacion de tareas con `turbo`;
- TypeScript como lenguaje transversal;
- frontend previsto con Next.js para backoffice y portales;
- backend elegido con Fastify modular en Node.js y TypeScript;
- PostgreSQL como base de datos transaccional prevista;
- Redis como apoyo futuro para colas, cache y eventos ligeros;
- contenedores Docker para despliegue reproducible.

## 4.2 Razonamiento de arquitectura

- un ERP modular necesita contratos compartidos y tipos consistentes;
- el backoffice, el portal cliente y las integraciones se benefician de una capa de contratos comun;
- multi-tenant exige decisiones tempranas sobre aislamiento, permisos, auditoria y configuracion por organizacion;
- el producto debe poder crecer por dominios sin mezclar presentacion, aplicacion, dominio e infraestructura.

## 4.3 Capas previstas

- presentacion: web, portal publico y panel cliente;
- aplicacion: casos de uso, orquestacion y validaciones de flujo;
- dominio: entidades, reglas, politicas y eventos;
- infraestructura: persistencia, mensajeria, integraciones y observabilidad.

## 5. Estructura objetivo del repositorio

```text
apps/
  web/
  api/
packages/
  domain/
  contracts/
  ui/
  config/
infra/
  docker/
docs/
modules/
skills/
tasks/
logs/
```

## 6. Definicion de modulos

### 6.1 Identidad y acceso

- `auth`: autenticacion, recuperacion de acceso, sesiones, tokens y endurecimiento;
- `users`: identidad operativa y relacion con empleados, clientes o usuarios externos;
- `roles-permissions`: autorizacion granular por recurso, accion y ambito;
- `settings`: configuracion global, por tenant y por usuario.

### 6.2 Core comercial

- `clients`: CRM base y relacion comercial;
- `providers`: proveedores y datos operativos;
- `products-services`: catalogo unificado de productos y servicios;
- `sales`: oportunidades, presupuestos, pedidos y seguimiento comercial.

### 6.3 Operaciones y agenda

- `reservations-scheduling`: agenda, disponibilidad y reglas anti-solapamiento;
- `tasks-internal-work`: trabajo interno, responsables y trazabilidad;
- `employees`: ficha laboral y estructura interna;
- `work-shifts`: fichajes, horas, incidencias y control operativo.

### 6.4 Finanzas

- `billing-invoicing`: facturacion, series y relacion con ventas;
- `payments`: cobros, conciliacion basica y estados;
- `expenses`: gasto, clasificacion, imputacion y lectura de coste.

### 6.5 Logistica y stock

- `inventory`: stock, movimientos, ajustes y trazabilidad;
- `warehouses`: almacenes, ubicaciones y reglas de disponibilidad.

### 6.6 Inteligencia y comunicacion

- `analytics`: KPIs y vision ejecutiva;
- `reports`: reporting exportable y operativo;
- `notifications`: avisos internos, email y eventos relevantes;
- `logs-audit`: auditoria y trazas criticas.

### 6.7 Plataforma y extensibilidad

- `integrations`: conectores, APIs externas, webhooks y sincronizaciones;
- `workflow-engine`: automatizaciones y reglas condicionales;
- `document-management`: ficheros y documentos vinculados a entidades;
- `tagging-categorization`: clasificacion flexible;
- `search-engine`: busqueda global sobre entidades y documentos;
- `multi-tenant`: soporte para multiples organizaciones;
- `plugin-system`: ampliacion futura por extensiones desacopladas.

### 6.8 Canales de experiencia

- `public-portal`: presencia publica y formularios;
- `client-panel`: area cliente para consulta y autoservicio.

## 7. Prioridad inicial por impacto

### Fase 1

- `auth`
- `users`
- `roles-permissions`
- `settings`
- `multi-tenant`

### Fase 2

- `clients`
- `products-services`
- `sales`
- `billing-invoicing`
- `payments`

### Fase 3

- `employees`
- `work-shifts`
- `tasks-internal-work`
- `reservations-scheduling`

### Fase 4

- `inventory`
- `warehouses`
- `providers`
- `expenses`

### Fase 5

- `analytics`
- `reports`
- `notifications`
- `logs-audit`
- `document-management`

### Fase 6

- `integrations`
- `workflow-engine`
- `search-engine`
- `tagging-categorization`
- `public-portal`
- `client-panel`
- `plugin-system`

### 7.1 Objetivo real para ejecucion continua

La meta operativa del worker no sera "terminar todo el ERP" de forma indefinida ni cerrar una milestone documental de forma prematura. La referencia pasa a ser dejar un producto vendible para pymes de servicios sobre una primera release cerrada y verificable llamada `release-operable-v1`.

Esto implica que el worker debe trabajar de forma progresiva y autocritica:

- cada iteracion debe cuestionar si lo ya construido es suficientemente util, claro, robusto y mantenible para un cliente real;
- si detecta fragilidad funcional, UX pobre, huecos de seguridad, deuda operativa o validacion insuficiente, debe priorizar endurecer antes de declarar cierre;
- `DONE` no puede usarse para indicar solo que el alcance esta decidido o que la documentacion esta alineada;
- el objetivo es un producto que una pyme de servicios pueda usar y por el que tenga sentido cobrar, no una demo interna que "parece completa".

### 7.2 Alcance incluido en `release-operable-v1`

La release `release-operable-v1` debe dejar operativo un ERP multi-tenant para pymes de servicios y gestion comercial con estos modulos obligatorios:

- `auth`
- `users`
- `roles-permissions`
- `settings`
- `multi-tenant`
- `clients`
- `products-services`
- `sales`
- `billing-invoicing`
- `payments`
- `employees`
- `tasks-internal-work`
- `reservations-scheduling`
- `analytics`
- `reports`
- `notifications`
- `logs-audit`

### 7.3 Modulos diferidos a la siguiente ola

Los siguientes modulos quedan explicitamente fuera del cierre de `release-operable-v1` y pasan a la siguiente ola del roadmap:

- `work-shifts`
- `inventory`
- `warehouses`
- `providers`
- `expenses`

Motivo de la decision:

- `release-operable-v1` ya cubre el circuito minimo operable para pymes de servicios y gestion comercial sin depender de fichajes, stock, compras ni gasto imputado;
- estos modulos abren reglas adicionales de disponibilidad, movimientos, conciliacion y trazabilidad que exigen una segunda ola coherente en lugar de un cierre apresurado;
- se prioriza cerrar con calidad el perimetro ya operativo antes de ampliar el alcance funcional.

### 7.4 Fuera de alcance de `release-operable-v1`

Quedan explicitamente fuera de esta release:

- `work-shifts`
- `inventory`
- `warehouses`
- `providers`
- `expenses`
- `integrations`
- `workflow-engine`
- `document-management`
- `tagging-categorization`
- `search-engine`
- `public-portal`
- `client-panel`
- `plugin-system`

### 7.5 Criterio global de cierre de `release-operable-v1`

La release solo puede darse por cerrada cuando se cumplan todas estas condiciones:

- todos los modulos obligatorios estan implementados al menos con flujo minimo operable;
- cada modulo obligatorio tiene persistencia, API, UI minima o superficie operativa equivalente, permisos y documentacion alineada;
- existen seeds o datos demo suficientes para recorrer el flujo principal de la release;
- `typecheck`, `test`, `build` y `lint` terminan en verde;
- el circuito principal puede demostrarse de extremo a extremo sobre un tenant demo;
- el estado del proyecto deja claro que queda fuera de la release y que sigue despues.
- la experiencia principal de backoffice permite operar sin depender de conocimiento interno del repositorio ni de flujos pensados solo para demo tecnica;
- la seguridad, sesiones, permisos, despliegue y operacion minima no presentan huecos obvios incompatibles con vender a una pyme real.

### 7.6 Definicion de terminado por modulo para la release

Un modulo obligatorio solo puede marcarse como terminado si cumple como minimo:

- modelo de datos y migraciones cerradas;
- contratos, DTOs y endpoints o servicios definidos;
- permisos y limites tenant explicitados;
- seed o bootstrap para validacion funcional;
- superficie minima en backoffice o canal operativo equivalente;
- pruebas de integracion o smoke del flujo principal;
- reflejo actualizado en `README.md`, `plan.md`, `state.md`, `tasks/current.md` y `tasks/backlog.md`.
- revision critica minima de UX, errores y mantenibilidad sobre la implementacion ya hecha.

### 7.7 Regla de no cierre prematuro

Aunque todos los modulos obligatorios existan, el worker no puede cerrar la release mientras siga siendo razonable mejorar solidez, comprensibilidad, operatividad o experiencia para el caso real de una pyme de servicios.

En particular, no debe marcar `DONE` si todavia falta cualquiera de estos bloques:

- auditoria modulo a modulo del perimetro obligatorio;
- endurecimiento del circuito principal de cliente -> servicio -> venta -> factura -> cobro -> operacion interna -> seguimiento;
- validacion end-to-end sobre tenant demo sin depender de pasos manuales oscuros;
- endurecimiento de seguridad y despliegue suficiente para una primera salida comercial controlada.

## 8. Contratos y limites esperados

- cada modulo expone casos de uso concretos, no acceso libre a toda la persistencia;
- los eventos de dominio solo se publican desde acciones significativas;
- permisos y alcance tenant forman parte del contrato, no de una capa posterior improvisada;
- los DTOs compartidos viven fuera de cada app para evitar duplicidad y deriva;
- las integraciones externas nunca invaden logica de dominio central.

## 9. Calidad y salida a mercado

Para considerar la base lista para evolucion profesional deben cumplirse estas condiciones:

- arquitectura entendible por un equipo nuevo;
- backlog priorizado por valor y dependencias;
- reglas de trabajo y decision documentadas;
- contratos iniciales definidos;
- despliegue objetivo descrito;
- riesgos abiertos visibles;
- estrategia de testing prevista.

### 9.1 Matriz minima de validacion para `release-operable-v1`

- validacion tecnica global: `lint`, `typecheck`, `test`, `build`;
- validacion por vertical: happy path y edge cases basicos;
- validacion multi-tenant: aislamiento entre organizaciones;
- validacion de permisos: lectura, escritura y acciones restringidas;
- validacion del circuito comercial-financiero: cliente -> catalogo -> venta -> factura -> cobro;
- validacion operativa minima: empleados/tareas/agenda sobre tenant demo;
- validacion de visibilidad y control: `notifications` y `logs-audit` coherentes sobre eventos sensibles del backoffice.
- validacion de usabilidad minima: un operador nuevo puede completar los flujos principales sin leer el codigo;
- validacion de endurecimiento: errores, estados vacios y permisos denegados dejan mensajes comprensibles y comportamiento seguro.

## 10. Riesgos principales detectados

- querer abarcar todos los modulos demasiado pronto;
- mezclar ERP de servicios con ERP comercial sin delimitar flujos comunes y especificos;
- retrasar multi-tenant y permisos hasta que la base ya este acoplada;
- convertir la documentacion en inventario sin bajarla a tareas ejecutables.

## 11. Estrategia de testing prevista

- pruebas unitarias de dominio en `packages/domain`;
- pruebas de contrato para DTOs, esquemas y eventos;
- pruebas de integracion de API por modulo;
- smoke tests de web y healthchecks basicos;
- validaciones de lint, typecheck y estructura como puerta minima.

## 12. Bloque Deployment

```yaml
deployment:
  mode: multi-container
  public_service: web
  internal_port: 3000
  healthcheck_path: /api/health
  compose_project_name: deployment_erptry
  services:
    - web
    - api
    - postgres
  source_path: /home/codehive/codehive-data/workspaces/projects/erptry
  deployment_path: /home/codehive/codehive-app-state/deployments/erptry/workspace
  traefik_dynamic_file: /home/codehive/infrastructure/traefik/dynamic/deployment-erptry.yml
```

## 13. Criterio de la siguiente iteracion

La siguiente iteracion debe materializar la base tecnica minima ejecutable sin romper la arquitectura decidida:

- persistencia real para tenants, usuarios y roles;
- autenticacion y endurecimiento basicos;
- modelo tenant y permisos desde el principio;
- primer vertical completo con autenticacion y acceso.

Estado actual del nucleo:

- existe login demo con sesion firmada para validar el circuito de acceso;
- existe tambien autenticacion persistida preparada para PostgreSQL mediante Prisma;
- el backoffice ya puede consumir manifest, tenant actual y usuarios del tenant;
- el backoffice ya puede actualizar ajustes del tenant, reasignar roles y cerrar sesiones;
- `clients` ya existe como primer vertical de negocio sobre la base multi-tenant;
- `products-services` ya existe como segundo vertical para preparar `sales` y facturacion;
- `employees` y `tasks-internal-work` ya existen como base operativa interna enlazando personas y trabajo interno por tenant;
- falta cerrar migraciones de produccion, estrategia definitiva de sesiones y endurecimiento de credenciales.
