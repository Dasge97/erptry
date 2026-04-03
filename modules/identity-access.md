# Identity Access

## Modulos incluidos

- `auth`
- `users`
- `roles-permissions`
- `settings`
- `multi-tenant`

## Responsabilidad

Definir quien entra, con que identidad opera, a que tenant pertenece y que puede hacer dentro del sistema.

## Dependencias clave

- base de datos central;
- contratos compartidos de identidad;
- auditoria;
- notificaciones para recuperacion de acceso.

## Riesgos

- permisos acoplados a pantallas en lugar de recursos;
- multi-tenant superficial;
- settings sin jerarquia clara entre sistema, tenant y usuario.
