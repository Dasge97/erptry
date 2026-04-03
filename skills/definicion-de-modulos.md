# Skill: definicion de modulos

## Objetivo

Convertir necesidades de negocio en modulos con limites, dependencias y criterios de evolucion claros.

## Cuando usarla

- al bajar una necesidad funcional a arquitectura;
- al partir un modulo demasiado grande;
- al detectar dependencia implicita no declarada.

## Reglas

- un modulo debe tener responsabilidad primaria;
- dependencias ascendentes y laterales documentadas;
- no aceptar modulos caja-sastre.

## Checklist

- responsabilidad principal definida;
- entradas y salidas identificadas;
- eventos y DTOs previstos;
- riesgos del modulo descritos.

## Errores a evitar

- mezclar dominios distintos;
- crear modulos por moda tecnologica;
- olvidar permisos y tenant scope.
