# README_DEPLOY

Este archivo documenta la intencion de despliegue del proyecto fuente `erptry` dentro del servidor CodeHive.

## Rutas canónicas

- fuente: `/home/codehive/codehive-data/workspaces/projects/erptry`
- deployment esperado: `/home/codehive/codehive-app-state/deployments/erptry/workspace`
- traefik dinamico: `/home/codehive/infrastructure/traefik/dynamic/deployment-erptry.yml`

## Criterio de despliegue

- editar siempre en la fuente;
- levantar siempre desde la copia de deployment;
- no lanzar `docker compose up` desde esta carpeta fuente si el proyecto pasa a estar gestionado por CodeHive;
- alinear `host_port`, `internal_port`, Traefik y override generado antes de cualquier publicacion.

## Objetivo inicial de deployment

- `mode`: multi-container
- `public_service`: web
- `internal_port`: 3000
- `healthcheck_path`: `/api/health`
- `compose_project_name`: `deployment_erptry`
- `services`: `web`, `api`, `postgres`

## Estado actual

- ya existe `infra/docker/docker-compose.local.yml` para desarrollo local con PostgreSQL, API y web;
- el compose productivo canónico es `docker-compose.production.yml` en la raiz del proyecto;
- las imagenes productivas viven en `infra/docker/Dockerfile.web` y `infra/docker/Dockerfile.api`;
- el redeploy real debe ejecutarse siempre desde `/home/codehive/codehive-app-state/deployments/erptry/workspace`.
