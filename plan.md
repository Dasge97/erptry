# PLAN

## Objetivo de roadmap

Construir una base de ERP modular, multiempresa y profesional, empezando por una primera iteracion de arquitectura y documentacion accionable y continuando despues con una base tecnica ejecutable y un primer vertical funcional.

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
- pendiente persistencia real y auth operativa.

### Fase 2 - Nucleo de plataforma

- implementar `multi-tenant`;
- implementar `auth`, `users`, `roles-permissions`, `settings`;
- dejar auditoria basica y contratos de acceso.

### Fase 3 - Circuito comercial minimo

- `clients`, `products-services`, `sales`, `billing-invoicing`, `payments`;
- dashboard inicial;
- reporting financiero base.

### Fase 4 - Operacion interna

- `employees`, `work-shifts`, `tasks-internal-work`, `reservations-scheduling`.

### Fase 5 - Logistica y control

- `providers`, `inventory`, `warehouses`, `expenses`.

### Fase 6 - Inteligencia, integraciones y salida

- `analytics`, `reports`, `notifications`, `integrations`, `workflow-engine`;
- `public-portal` y `client-panel`;
- endurecimiento para release.

## Replanificacion prevista

- al cerrar cada fase se revisara alcance, deuda y dependencias;
- si la complejidad real exige dividir una fase, se hara antes de implementar a ciegas;
- el objetivo es mantener un roadmap vivo y realista, no una lista estatica.
