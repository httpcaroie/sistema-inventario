# Sistema de gestion de inventario

Proyecto academico para la actividad de Mantenimiento de Software de la CORPORACION UNIVERSITARIA IBEROAMERICANA.

## Descripcion

Aplicacion web para registrar y administrar productos, consultar el catalogo, controlar entradas y salidas de existencias, registrar ventas y generar reportes CSV. Los datos se consultan y almacenan en una base de datos Supabase para que puedan compartirse entre distintos computadores.

## Tecnologias

- HTML5, CSS3 y JavaScript.
- Supabase JavaScript v2 cargado desde CDN.
- Supabase Database (PostgreSQL) como almacenamiento remoto.
- Git y GitHub para control de versiones.

## Como ejecutar

1. Descargue o clone el repositorio.
2. Abra `index.html` en un navegador actualizado con conexion a internet, o sirva la carpeta con un servidor web local.
3. La aplicacion lee la URL y la publishable key desde `js/config.js`.
4. No requiere `npm install` porque esta version carga Supabase JS desde CDN.

## Funcionalidades

- HU-01: crear, editar, listar y eliminar productos; valida codigos duplicados.
- HU-02: buscar productos por nombre, codigo o categoria.
- HU-03: registrar entradas y salidas y actualizar existencias.
- HU-04: registrar ventas, calcular totales y descontar existencias.
- HU-05: consultar indicadores y descargar el inventario en CSV.

## Base de datos

La aplicacion utiliza las tablas `products`, `inventory_movements`, `sales` y `sale_items` del proyecto Supabase. El esquema SQL usado en la actividad se encuentra en `docs/supabase-schema.sql`.

## Seguridad para la demostracion academica

La aplicacion usa una publishable key, que esta disenada para utilizarse desde el navegador. El proyecto de demostracion tiene politicas RLS que permiten operaciones al rol anonimo para facilitar la revision del docente. Por ello, cualquier persona que conozca la URL publica de la aplicacion podria leer, crear, modificar o borrar datos. Utilice solamente datos ficticios y no almacene informacion personal, financiera o sensible. Para un despliegue real se debe implementar autenticacion y politicas RLS por usuario.

## Sincronizacion

Al abrir la aplicacion, los productos, movimientos y ventas se consultan desde Supabase. Los cambios se guardan en la base de datos remota. Para ver cambios hechos desde otro computador, actualice la pagina.

Si la aplicacion muestra `permission denied`, ejecute una sola vez el contenido de `docs/supabase-grants.sql` en el SQL Editor de Supabase. Las politicas RLS deben permanecer habilitadas.


## Como identificar esta version

Esta es la version 2.0 conectada a Supabase. En la barra lateral debe aparecer "Version 2.0 · Base de datos en la nube" y en el pie de pagina debe aparecer el estado de conexion con Supabase. Si aparece "Los datos se guardan en este navegador", se esta abriendo una carpeta antigua. Abra el `index.html` de esta carpeta extraida.
