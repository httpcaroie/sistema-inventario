# Conexion con Supabase

La configuracion publica del proyecto se encuentra en `js/config.js`:

- `supabaseUrl`: URL del proyecto Supabase.
- `supabasePublishableKey`: publishable key del proyecto.

La publishable key esta disenada para estar en el cliente. Nunca se debe incluir una `secret key` ni una `service_role key` en el navegador o en GitHub.

La aplicacion carga `@supabase/supabase-js` v2 desde jsDelivr y utiliza las tablas `products`, `inventory_movements`, `sales` y `sale_items`.

Las politicas anonimas utilizadas en esta demostracion permiten acceso publico de lectura y escritura. Son apropiadas unicamente para datos ficticios y una demostracion academica controlada. Antes de utilizar informacion real se debe habilitar autenticacion y restringir las politicas RLS.
