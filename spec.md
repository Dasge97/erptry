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
- falta cerrar migraciones de produccion, estrategia definitiva de sesiones y endurecimiento de credenciales.
