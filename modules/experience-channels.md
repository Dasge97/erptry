# Experience Channels

## Modulos incluidos

- `public-portal`
- `client-panel`

## Responsabilidad

Exponer capacidades de captacion y autoservicio sin abrir el backoffice ni duplicar reglas del dominio.

## Dependencias clave

- auth;
- clients;
- reservations-scheduling;
- billing-invoicing;
- document-management;
- notifications.

## Riesgos

- duplicar logica del backoffice en el portal;
- no aislar correctamente los datos de cada cliente;
- exponer demasiada complejidad en la primera release.
