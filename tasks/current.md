# Foco actual

## Objetivo

Convertir `release-operable-v1` en un producto vendible para pymes de servicios, endureciendo de forma progresiva y autocritica el perimetro ya implementado antes de cualquier cierre real.

## Criterio de exito

- `work-shifts`, `inventory`, `warehouses`, `providers` y `expenses` quedan documentados como siguiente ola y fuera del cierre de `release-operable-v1`;
- existe una lista cerrada de modulos obligatorios para `release-operable-v1` sin ambiguedad ni modulos opcionales pendientes de decision;
- se revisa modulo a modulo el circuito principal con criterio de uso real para una pyme de servicios;
- existe un guion de validacion end-to-end utilizable sobre tenant demo para repetir el circuito principal sin pasos oscuros;
- la puerta tecnica (`typecheck`, `test`, `lint`, `build`) se mantiene revalidada mientras se remata el repaso manual final;
- el script `validate:release-operable-v1` valida el ACL minimo `owner -> manager -> viewer` contra PostgreSQL real;
- el backoffice mantiene un bloque `Progreso del repaso ACL` que deja trazable en UI el orden `owner -> manager -> viewer` para no cerrar la validacion manual con huecos de perfil;
- el backoffice muestra escenarios ACL criticos (`owner -> viewer`, `owner -> operator`, `owner -> manager -> viewer`) con estado `ok/revisar/pendiente` para guiar el repaso manual final sin interpretaciones ambiguas;

## Estado actual

### Puerta tecnica: ✅ COMPLETADO
- typecheck: verde
- test: 81 tests passed (39 web + 42 api)
- lint: verde
- build: verde

### Validacion automatizada: ✅ COMPLETADO
- validate:release-operable-v1 contra PostgreSQL real: OK
- Flujo end-to-end: venta -> factura -> cobro -> tarea -> reserva = OK
- ACL owner -> manager -> viewer: OK

### Repaso manual visual: ⏳ PENDIENTE
- Requiere navegador para validar UI
- Guion disponible en `docs/release-operable-v1-validation.md`
- Acceso: http://localhost:3002 (API en localhost:3001)
- Tenant demo: ERPTRY Demo
- Usuarios: owner@erptry.local, manager@erptry.local, viewer@erptry.local (password: erptry1234)

## Criterio de cierre

- cada modulo cerrado deja persistencia, API, superficie operativa, permisos, pruebas y documentacion alineada;
- la release no se marca como terminada hasta completar todos los modulos obligatorios definidos en `spec.md`, validar `typecheck`, `test`, `build` y `lint` en verde, y demostrar un flujo end-to-end comprensible y robusto sobre un tenant demo.
