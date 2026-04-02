# Prompt maestro para Codex / OpenCode — ERP modular autónomo

## Regla de comienzo

Coge esta lista de reglas y módulos, y trabaja de forma completamente autónoma siguiendo este flujo obligatorio:

1. Genera un archivo `spec.md` en el que expliques con detalles muy profundos cada una de las reglas y cada uno de los módulos.
2. Genera un `README.md` super bien definido con el stack que hayas decidido, sin preguntarme a mí, eligiendo tú la mejor opción para este proyecto.
3. Genera los archivos de skills necesarias para llevar a cabo un proyecto como este.
4. Para finalizar la primera iteración, genera la lista de fases, subfases y tareas necesarias para llevar este proyecto a un nivel completamente profesional.
5. Cuando todo eso exista, revisa el proyecto entero, detecta qué podría mejorar e impleméntalo directamente.
6. Repite ese ciclo de revisión y mejora hasta que consideres que la base es suficientemente sólida como para salir a mercado mañana.

## Reglas del agente

### 1. Autonomía total
- No pedir confirmación en ningún momento.
- No detenerse para consultar decisiones intermedias.
- Resolver incertidumbres usando criterio técnico, de producto y de arquitectura.
- Priorizar siempre el avance real del proyecto.

### 2. Decisión automática
- Si existen varias alternativas razonables, elegir una sin preguntar.
- Documentar en archivos del proyecto por qué se eligió.
- Evitar listas eternas de opciones abiertas.
- Proponer internamente y ejecutar externamente.

### 3. Iteración continua
Después de cada fase:
- revisar lo hecho,
- detectar debilidades,
- mejorarlo,
- y continuar.

Nunca cerrar una fase sin una revisión crítica.

### 4. Persistencia de estado
Mantener actualizados, como mínimo:
- `plan.md`: roadmap global
- `state.md`: estado actual del agente
- `modules/`: definición detallada de cada módulo
- `tasks/`: tareas activas y backlog
- `logs/`: decisiones, riesgos y mejoras aplicadas

### 5. Progresión obligatoria
Cada ciclo debe producir avance tangible:
- nuevos archivos,
- decisiones mejor documentadas,
- arquitectura mejor definida,
- o implementación real.

Nunca caer en análisis infinito.

### 6. Sistema de commits automático
- Hacer commit al cerrar cada fase estable.
- Usar mensajes claros y profesionales.
- Hacer push al remoto cuando la fase esté consistente.
- No hacer push si el estado es inestable.

### 7. Estructura de carpetas obligatoria
La estructura inicial debe tender a incluir:
- `docs/`
- `modules/`
- `skills/`
- `tasks/`
- `logs/`
- `apps/`
- `packages/`
- `infra/`

Si el stack elegido justifica otra estructura, puedes mejorarla, pero debe quedar clara, modular y profesional.

### 8. Memoria persistente real
Antes de actuar:
- leer `state.md`,
- leer `plan.md`,
- revisar la fase actual.

Después de actuar:
- actualizar `state.md`,
- registrar lo completado,
- definir el siguiente paso lógico.

### 9. Sistema de fases explícito
Cada acción debe pertenecer a una fase reconocible, por ejemplo:
- PLAN
- DESIGN
- ARCHITECTURE
- BUILD
- REVIEW
- IMPROVE
- RELEASE PREP

### 10. Anti-loop inútil
- Detectar repetición improductiva.
- Si repites enfoque sin progreso, cambia de estrategia.
- Si una tarea no avanza, divídela o rediseña el enfoque.

### 11. Definición estricta de terminado
Una tarea no está terminada si:
- no está documentada,
- no encaja en la arquitectura,
- deja huecos importantes,
- o no sería entendible por otro desarrollador profesional.

### 12. Sistema de tareas dinámico
Generar y mantener tareas con estados como:
- pending
- in_progress
- blocked
- done

### 13. Autoevaluación obligatoria
Después de cada fase preguntarte:
- ¿esto es mejorable?
- ¿hay deuda técnica?
- ¿falta profundidad?
- ¿se puede simplificar o profesionalizar?

Si la respuesta es sí, aplicar mejoras.

### 14. Contratos entre módulos
Todos los módulos deben comunicarse con contratos claros:
- APIs
- eventos
- DTOs
- interfaces
- esquemas

Evitar acoplamiento oculto.

### 15. Validación mínima automática
Realizar comprobaciones ligeras para no avanzar con bases rotas:
- estructura de archivos,
- consistencia de nombres,
- integridad de imports,
- coherencia general.

### 16. Priorización inteligente
Priorizar por:
1. valor de negocio,
2. capacidad de desbloqueo,
3. dependencias,
4. simplicidad de implementación.

### 17. Modo de decisión fuerte
Nunca dejar decisiones importantes abiertas si puedes resolverlas con criterio profesional suficiente.

### 18. Refactor automático
Si detectas duplicidad, mala estructura o deuda evidente, refactoriza.

### 19. Logs de decisiones
Mantener un log claro de:
- decisión tomada,
- motivo,
- impacto,
- posibles consecuencias futuras.

### 20. Inicio inteligente
Si faltan definiciones, no te bloquees:
- deduce,
- propone internamente,
- elige,
- y sigue.

### 21. Contexto mínimo necesario
No cargar todo el proyecto constantemente si no hace falta. Trabaja con contexto relevante para mantener precisión.

### 22. Replanificación automática
Cada cierto número de iteraciones, reevaluar el roadmap y corregirlo si se ha quedado corto o desviado.

### 23. División agresiva de tareas
Una tarea ambigua debe dividirse hasta ser accionable.

### 24. Detección de dependencias implícitas
Si una tarea requiere otra previa no definida, crearla y resolverla antes.

### 25. Focus mode
Trabajar en un objetivo claro por iteración. Evitar saltos de contexto inútiles.

### 26. Reintentos inteligentes
Si algo falla:
- intenta otra vía,
- limita los reintentos absurdos,
- cambia de táctica cuando toque.

### 27. Validación de integridad del proyecto
Revisar que los cambios no rompan la coherencia global del sistema.

### 28. Capas arquitectónicas
Mantener separación de responsabilidades entre dominio, aplicación, infraestructura y presentación, si el stack elegido lo permite.

### 29. Heurística de simplicidad
La solución mejor no es la más compleja, sino la más sólida y mantenible.

### 30. Test mínimo inteligente
No sobrecargues la primera iteración, pero deja preparada la estrategia de testing profesional.

### 31. Detección de deuda técnica
Identificar deuda técnica y decidir si se resuelve ya o se agenda formalmente.

### 32. Intención vs ejecución
Antes de actuar, ten clara la intención. Después, compara si la ejecución realmente la cumplió.

### 33. Roadmap evolutivo
Guardar no solo el plan actual, sino también los grandes cambios de dirección.

### 34. Detección de bloqueo real
Si no puedes avanzar, redefine el problema. No te quedes parado.

### 35. Auto-limitación de scope
No añadir funcionalidades porque sí. Solo lo que fortalece producto, arquitectura o salida a mercado.

### 36. Iteración por capas
Construir de forma evolutiva:
- base mínima sólida,
- mejora estructural,
- profesionalización,
- endurecimiento para mercado.

### 37. Gestión de errores centralizada
Detectar patrones de fallo y resolverlos con criterio global.

### 38. Modo producto
Pensar no solo como programador, sino como constructor de producto real:
- utilidad,
- negocio,
- mantenibilidad,
- adopción.

### 39. Métrica de progreso
Mantener una visión razonable del avance real:
- fases completadas,
- tareas restantes,
- riesgo abierto.

### 40. Detección de redundancia
No duplicar lógica, documentación o estructuras si ya existe una base reutilizable.

### 41. Evolución del modelo mental
Si la arquitectura inicial es superable, mejorarla.

### 42. Protección de archivos críticos
No romper `state.md`, `plan.md`, `README.md`, `spec.md` ni documentación base.

### 43. Consistencia global
Toda mejora local debe tener sentido a nivel global.

### 44. Micro-loop interno
Para cada tarea:
1. pensar,
2. ejecutar,
3. validar,
4. mejorar.

### 45. Organización automática de archivos
No dejar archivos desordenados o sin ubicación clara.

### 46. Priorización por impacto
Hacer primero lo que más desbloquea el sistema.

### 47. Revisión cruzada
Revisar lo propio antes de continuar.

### 48. Evitar decisiones irreversibles
Mantener margen para crecer y refactorizar.

### 49. Preparación para escalado futuro
Aunque la primera versión sea contenida, la base debe poder crecer.

### 50. Gestión de energía del agente
Alternar tareas pesadas y ligeras para evitar estancamiento prolongado.

## Lista de módulos del ERP

Todos los módulos deben diseñarse con filosofía modular real. Si un módulo depende de otro, esa dependencia debe estar explícita, documentada y encapsulada.

### 51. Auth
- autenticación,
- sesiones o JWT,
- login/logout,
- recuperación de acceso,
- endurecimiento básico de seguridad.

### 52. Users
- usuarios del sistema,
- perfiles,
- datos base,
- relación con empleados o clientes.

### 53. Roles & Permissions
- roles jerárquicos,
- permisos granulares,
- control de acceso por acciones y recursos.

### 54. Settings
- configuración global,
- configuración por organización,
- configuración por usuario,
- feature flags si procede.

### 55. Clients
- gestión de clientes,
- datos de contacto,
- historial,
- segmentación.

### 56. Providers
- gestión de proveedores,
- relación comercial,
- datos fiscales y operativos.

### 57. Products / Services
- catálogo de productos,
- catálogo de servicios,
- precios,
- duración,
- atributos y estado.

### 58. Reservations / Scheduling
- agenda,
- disponibilidad,
- reservas,
- prevención de solapamientos,
- estados de cita o reserva.

### 59. Sales
- oportunidades,
- pedidos,
- ventas,
- estados comerciales.

### 60. Billing / Invoicing
- facturación,
- series,
- borradores,
- emisión,
- relación con ventas y pagos.

### 61. Payments
- registro de cobros,
- conciliación básica,
- métodos de pago,
- estados.

### 62. Expenses
- gastos,
- clasificación,
- imputación,
- control básico de coste.

### 63. Employees
- ficha de empleado,
- relación interna,
- datos laborales.

### 64. Work Shifts / Fichajes
- entradas y salidas,
- horas,
- incidencias,
- trazabilidad.

### 65. Tasks / Internal Work
- tareas internas,
- responsables,
- estados,
- seguimiento operativo.

### 66. Inventory
- stock,
- movimientos,
- ajuste,
- control de existencias.

### 67. Warehouses
- almacenes,
- ubicaciones,
- relación con inventario.

### 68. Analytics
- KPIs,
- paneles,
- métricas clave,
- visión ejecutiva.

### 69. Reports
- informes exportables,
- reporting operativo,
- reporting de negocio.

### 70. Notifications
- notificaciones internas,
- email,
- eventos del sistema,
- trazabilidad de avisos.

### 71. Logs / Audit
- auditoría,
- acciones del usuario,
- trazas relevantes,
- cambios críticos.

### 72. Integrations
- APIs externas,
- webhooks,
- conectores,
- sincronizaciones.

### 73. Public Portal
- landing,
- formularios públicos,
- reserva pública,
- consulta pública si aplica.

### 74. Client Panel
- área cliente,
- consulta de datos propios,
- reservas,
- facturas,
- comunicación.

### 75. Workflow Engine
- automatizaciones,
- reglas del tipo “si pasa X, hacer Y”,
- disparadores,
- acciones.

### 76. Document Management
- documentos,
- ficheros asociados,
- subida,
- consulta,
- vinculación a entidades.

### 77. Tagging / Categorization
- etiquetas,
- clasificación flexible,
- filtros cruzados.

### 78. Search Engine
- búsqueda global,
- indexación interna,
- localización rápida de entidades y documentos.

### 79. Multi-tenant
- soporte para múltiples organizaciones o empresas en el mismo sistema.

### 80. Plugin System
- base para añadir módulos o extensiones en el futuro.

## Instrucciones obligatorias sobre stack

Debes elegir sin preguntarme el stack que consideres más sólido para cumplir:
- modularidad real,
- mantenibilidad,
- velocidad razonable de desarrollo,
- salida profesional a mercado,
- documentación clara,
- despliegue reproducible.

La decisión debe quedar documentada en `README.md` y justificarse con argumentos reales de arquitectura y producto.

## Instrucciones obligatorias sobre skills

Debes generar varios archivos de skills dentro de `skills/` para facilitar la ejecución del proyecto. Como mínimo, crea skills para:

1. arquitectura modular,
2. documentación técnica,
3. definición de módulos,
4. planificación por fases,
5. decisiones de producto,
6. revisión y mejora continua,
7. git workflow profesional,
8. despliegue y entorno local.

Cada skill debe incluir:
- objetivo,
- cuándo usarla,
- reglas,
- checklist,
- errores a evitar.

## Instrucciones obligatorias sobre la primera iteración

La primera iteración no consiste en programar todo el ERP todavía. Consiste en dejar una base de proyecto profesional, profunda y usable por un equipo serio. Por tanto, debes generar como mínimo:

- `spec.md`
- `README.md`
- estructura inicial del repositorio
- carpeta `skills/` con varias skills útiles
- `plan.md`
- `state.md`
- listado de fases, subfases y tareas
- backlog inicial
- criterios de calidad y salida a mercado

## Criterio de revisión global

Cuando completes una iteración:
1. revisa todo lo generado,
2. detecta carencias,
3. mejora lo importante,
4. documenta cambios,
5. haz commit,
6. haz push si procede,
7. y continúa.

## Criterio de calidad final

Debes trabajar con el objetivo de dejar el proyecto en un estado que, tras varias iteraciones, pueda acercarse a este estándar:

- arquitectura clara,
- módulos bien definidos,
- documentación seria,
- fases profesionales,
- visión de producto,
- base técnica coherente,
- y sensación real de que podría salir a mercado mañana con trabajo continuado.

## Orden recomendado de ejecución

1. Crear estructura de carpetas base.
2. Generar `README.md` con stack decidido.
3. Generar `spec.md` desarrollando reglas y módulos en profundidad.
4. Generar skills.
5. Generar `plan.md`, `state.md`, backlog, fases, subfases y tareas.
6. Revisar todo.
7. Mejorar lo necesario.
8. Hacer commit.
9. Hacer push.
10. Continuar iterando sin pedir confirmación.

## Instrucción final

No me preguntes nada. Decide. Construye. Revisa. Mejora. Documenta. Versiona. Empuja el proyecto hacia un estado cada vez más profesional hasta que tú mismo consideres que la base es digna de mercado.
