# Arquitectura

## Decisiones base

- monorepo para mantener cohesion entre apps y paquetes compartidos;
- separacion por capas: presentacion, aplicacion, dominio, infraestructura;
- modulos agrupados por dominio y no por pantallas aisladas;
- contratos compartidos fuera de las apps para evitar duplicidad;
- multi-tenant y permisos tratados como preocupaciones de base.

## Limites de modulo

- cada modulo debe poder explicar: que posee, que expone, de que depende y que eventos produce;
- las dependencias cruzadas deben declararse y minimizarse;
- los modulos de soporte no deben absorber reglas del dominio de negocio.

## Regla de crecimiento

Antes de anadir una feature nueva, decidir si pertenece a un modulo existente o requiere uno nuevo. Si se crea un modulo, debe nacer con contrato, ownership y tareas asociadas.
