# Skill: despliegue y entorno local

## Objetivo

Preparar un entorno reproducible y compatible con las reglas operativas del servidor CodeHive.

## Cuando usarla

- al definir `infra/`;
- al preparar compose;
- antes de publicar por Traefik.

## Reglas

- editar en fuente y desplegar desde deployment;
- no levantar compose desde el repo fuente si el proyecto ya entra en flujo CodeHive;
- alinear `host_port`, `internal_port`, Traefik y override;
- dejar healthcheck simple y verificable.

## Checklist

- paths de fuente y deployment claros;
- servicio publico identificado;
- puerto interno definido;
- healthcheck definido;
- README_DEPLOY actualizado.

## Errores a evitar

- stacks fantasma;
- puertos inconsistentes;
- documentacion de despliegue desactualizada.
