# Backlog inicial

## in_progress

- auditar y endurecer `release-operable-v1` con criterio de producto vendible para pymes de servicios, no solo de release cerrada.

## pending

- revisar modulo a modulo que el perimetro obligatorio de `release-operable-v1` mantiene persistencia, API, superficie operativa, permisos, seed y pruebas alineadas.
- revisar de forma autocritica la UX principal del backoffice, errores, vacios, permisos denegados y comprensibilidad operativa.
- rematar la validacion manual del backoffice sobre PostgreSQL real usando `docs/release-operable-v1-validation.md` y el script `validate:release-operable-v1` como base para detectar huecos de UX o copy antes del cierre vendible.
- endurecer seguridad, sesiones, despliegue y operacion minima antes de considerar el producto listo para venta.

## blocked

- ninguno por ahora.

## done

- lectura de reglas iniciales;
- eleccion de stack base;
- definicion de roadmap, skills, modulos y criterios de calidad;
- bootstrap ejecutable de API, web y paquetes compartidos;
- login demo y resolucion de sesion firmada;
- persistencia real del nucleo con Prisma y PostgreSQL;
- primer CRUD base de usuarios del tenant desde API y web;
- ajustes persistidos, reasignacion de roles y logout de sesion;
- vertical `clients` operativo en API, seed y backoffice;
- vertical `products-services` operativo en API, seed y backoffice;
- vertical `sales` operativo en API, seed y backoffice enlazando clientes y catalogo;
- vertical `billing-invoicing` operativo en API, seed y backoffice convirtiendo ventas en facturas cobrables;
- vertical `payments` operativo en API, seed y backoffice registrando cobros y saldo vivo sobre facturas emitidas;
- vertical `employees` operativo en API, seed y backoffice enlazando personas internas con usuarios del tenant;
- vertical `tasks-internal-work` operativo en API, seed y backoffice con ownership sobre `employees`;
- vertical `reservations-scheduling` operativo en API, seed y backoffice con agenda minima y reglas anti-solapamiento sobre `employees`;
- vertical `analytics` operativo en API y backoffice con dashboard comercial minimo sobre ventas, facturas y cobros persistidos;
- vertical `reports` operativo en API y backoffice con exportables CSV minimos para ventas, facturas y cobros;
- vertical `notifications` operativo en API y backoffice con avisos internos por tenant, marcado de lectura y eventos automaticos desde modulos operativos;
- vertical `logs-audit` operativo en API y backoffice con trazas persistidas por tenant sobre acciones sensibles y permisos `audit.view/manage`;
- endurecimiento base de permisos por modulo y carga condicional de superficies segun acceso en backoffice;
- definido el objetivo operativo como `release-operable-v1` con alcance cerrado y criterio de terminado por modulo;
- decidido que `work-shifts`, `inventory`, `warehouses`, `providers` y `expenses` quedan fuera de `release-operable-v1` y pasan a la siguiente ola del roadmap;
- calidad minima validada con typecheck, test, lint y build.
