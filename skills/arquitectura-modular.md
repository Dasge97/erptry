# Skill: arquitectura modular

## Objetivo

Tomar decisiones de estructura y dependencias manteniendo separacion de responsabilidades y capacidad real de crecimiento.

## Cuando usarla

- al crear modulos nuevos;
- al mover responsabilidades entre capas;
- al detectar acoplamientos ocultos.

## Reglas

- modelar primero limites y contratos;
- evitar que infraestructura dicte el dominio;
- no mezclar permisos, UI y reglas de negocio en un mismo bloque.

## Checklist

- modulo definido;
- ownership claro;
- dependencias explicitadas;
- eventos o DTOs identificados;
- impacto multi-tenant revisado.

## Errores a evitar

- carpetas bonitas sin contratos;
- modulos que solo representan pantallas;
- dependencia circular entre dominios.
