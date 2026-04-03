# Foco actual

## Objetivo

Convertir `release-operable-v1` en un producto vendible para pymes de servicios, endureciendo de forma progresiva y autocritica el perimetro ya implementado antes de cualquier cierre real.

## Criterio de exito

- `work-shifts`, `inventory`, `warehouses`, `providers` y `expenses` quedan documentados como siguiente ola y fuera del cierre de `release-operable-v1`;
- existe una lista cerrada de modulos obligatorios para `release-operable-v1` sin ambiguedad ni modulos opcionales pendientes de decision;
- se revisa modulo a modulo el circuito principal con criterio de uso real para una pyme de servicios;
- existe un guion de validacion end-to-end utilizable sobre tenant demo para repetir el circuito principal sin pasos oscuros;
- la puerta tecnica (`typecheck`, `test`, `lint`, `build`) se mantiene revalidada mientras se remata el repaso manual final;
- el script `validate:release-operable-v1` valida tambien el ACL minimo `owner -> manager -> viewer` (catalogo de roles, altas operativas y alcance por modulo) antes del repaso visual final;
- el backoffice mantiene un bloque `Progreso del repaso ACL` que deja trazable en UI el orden `owner -> manager -> viewer` para no cerrar la validacion manual con huecos de perfil;
- el bloque `Progreso del repaso ACL` conserva ademas el avance del recorrido en el navegador activo hasta pulsar `Reiniciar recorrido`, para no perder la bitacora al refrescar durante el repaso final;
- el bloque `Progreso del repaso ACL` aisla ademas la bitacora por tenant activo para evitar falsos positivos cuando se repasa mas de una empresa demo en el mismo navegador;
- el bloque `Progreso del repaso ACL` deja visible en UI el tenant al que pertenece la bitacora activa, para no interpretar por error progreso de otra empresa demo al alternar sesiones;
- la clave local de `Progreso del repaso ACL` prioriza `tenantId` (con fallback a nombre) para no perder la bitacora si cambia el branding visible de la empresa durante el repaso;
- el bloque `Progreso del repaso ACL` avisa tambien cuando hubo salto de orden (estado `orden: revisar`) para forzar reinicio del recorrido y evitar falsos positivos de cierre manual;
- cuando `Progreso del repaso ACL` queda en `orden: revisar`, las tarjetas de perfiles visitados se marcan tambien en `revisar` (no `ok/actual`) para no sugerir cierre parcial antes del reinicio;
- cuando `Progreso del repaso ACL` sigue en orden `ok`, los perfiles aun no visitados se muestran como `pendiente` en estado neutro (no en alerta) para evitar falsos rojos durante un recorrido valido en curso;
- `Progreso del repaso ACL` considera tambien salto de orden cuando se intenta ir de `owner` directamente a `viewer` sin pasar por `manager`, para evitar cierres parciales por omision de perfil;
- el bloque `Progreso del repaso ACL` avisa tambien cuando el login actual usa un perfil fuera del recorrido obligatorio (por ejemplo `operator`) y fuerza `orden: revisar` incluso si ya habia avance previo, para evitar interpretar ese acceso como orden ACL valido;
- cuando ese caso fuera de recorrido (`operator`/otros) ocurre con una bitacora ACL ya iniciada, `Progreso del repaso ACL` muestra aviso especifico de "perfil fuera del recorrido" (no solo "salto de orden") para que el siguiente paso manual sea inequívoco;
- `Progreso del repaso ACL` diferencia tambien el motivo de `orden: revisar` en los desvios mas sensibles del repaso manual (`owner -> viewer` sin `manager`, inicio fuera de `owner`, o perfil fuera de recorrido como `operator`), para que el reinicio no dependa de interpretar un mensaje generico;
- el bloque `Mapa de acceso actual` mantiene ese mismo criterio y, para perfiles fuera del recorrido ACL obligatorio, pide volver a `owner` en lugar de sugerir saltos directos a `viewer`;
- el backoffice ofrece una guia de repaso manual navegable, con atajos claros tanto al nucleo de plataforma (`acceso`, `ajustes`, `permisos`, `usuarios`) como a cada modulo critico del circuito vendible;
- el acceso inicial deja tambien perfiles demo cargables con expectativas visibles por rol para repetir el cambio `owner` -> `manager` -> `viewer` sin depender de memoria o contexto interno;
- el acceso autenticado resume ademas que superficies quedan visibles, gestionables u ocultas para el perfil activo, de modo que el repaso manual de restricciones no dependa de recordar permisos implicitos;
- el bloque de permisos evita mostrar solo keys tecnicas: agrupa por area operativa y deja claro que es lectura y que es gestion para revisar roles sin traducir mentalmente el ACL;
- el mapa de acceso no mezcla `Usuarios` con `Roles y permisos`, para que perfiles como `manager` no aparenten mas alcance del que realmente tienen durante el repaso final;
- si algo ya existe pero sigue siendo fragil, confuso o pobre en UX, se reabre y se mejora antes de considerar cierre;
- cada modulo cerrado deja persistencia, API, superficie operativa, permisos, pruebas y documentacion alineada;
- la release no se marca como terminada hasta completar todos los modulos obligatorios definidos en `spec.md`, validar `typecheck`, `test`, `build` y `lint` en verde, y demostrar un flujo end-to-end comprensible y robusto sobre un tenant demo.
