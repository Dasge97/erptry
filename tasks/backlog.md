# Backlog inicial

## in_progress

- abrir `sales` para unir clientes y catalogo en un flujo comercial real.

## pending

- definir estrategia de persistencia y ORM;
- modelar tenant, user, role y permission;
- preparar migraciones iniciales;
- conectar web con manifest y auth reales;
- crear endpoints base de usuarios y tenant actual;
- crear configuracion persistida por tenant;
- exponer gestion de roles y permisos base.
- abrir el primer modulo de negocio vertical sobre este nucleo.
- modelar `products-services` y su relacion con clientes.
- modelar `sales` y su relacion con clientes y catalogo.

## blocked

- ninguno por ahora.

## done

- lectura de reglas iniciales;
- eleccion de stack base;
- definicion de roadmap, skills, modulos y criterios de calidad;
- bootstrap ejecutable de API, web y paquetes compartidos;
- login demo y resolucion de sesion firmada;
- persistencia real del nucleo con Prisma y PostgreSQL;
- primer CRUD base de usuarios del tenant desde API y web;
- ajustes persistidos, reasignacion de roles y logout de sesion;
- vertical `clients` operativo en API, seed y backoffice;
- vertical `products-services` operativo en API, seed y backoffice;
- calidad minima validada con typecheck, test, lint y build.
