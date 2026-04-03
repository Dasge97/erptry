# Foco actual

## Objetivo

Convertir `release-operable-v1` en un producto vendible para pymes de servicios, endureciendo de forma progresiva y autocritica el perimetro ya implementado antes de cualquier cierre real.

## Criterio de exito

- `work-shifts`, `inventory`, `warehouses`, `providers` y `expenses` quedan documentados como siguiente ola y fuera del cierre de `release-operable-v1`;
- existe una lista cerrada de modulos obligatorios para `release-operable-v1` sin ambiguedad ni modulos opcionales pendientes de decision;
- se revisa modulo a modulo el circuito principal con criterio de uso real para una pyme de servicios;
- existe un guion de validacion end-to-end utilizable sobre tenant demo para repetir el circuito principal sin pasos oscuros;
- la puerta tecnica (`typecheck`, `test`, `lint`, `build`) se mantiene revalidada mientras se remata el repaso manual final;
- el backoffice ofrece una guia de repaso manual navegable, con atajos claros tanto al nucleo de plataforma (`acceso`, `ajustes`, `permisos`, `usuarios`) como a cada modulo critico del circuito vendible;
- el acceso inicial deja tambien perfiles demo cargables con expectativas visibles por rol para repetir el cambio `owner` -> `viewer` -> `manager`/`owner` sin depender de memoria o contexto interno;
- el acceso autenticado resume ademas que superficies quedan visibles, gestionables u ocultas para el perfil activo, de modo que el repaso manual de restricciones no dependa de recordar permisos implicitos;
- el bloque de permisos evita mostrar solo keys tecnicas: agrupa por area operativa y deja claro que es lectura y que es gestion para revisar roles sin traducir mentalmente el ACL;
- si algo ya existe pero sigue siendo fragil, confuso o pobre en UX, se reabre y se mejora antes de considerar cierre;
- cada modulo cerrado deja persistencia, API, superficie operativa, permisos, pruebas y documentacion alineada;
- la release no se marca como terminada hasta completar todos los modulos obligatorios definidos en `spec.md`, validar `typecheck`, `test`, `build` y `lint` en verde, y demostrar un flujo end-to-end comprensible y robusto sobre un tenant demo.
