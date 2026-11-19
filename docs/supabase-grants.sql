-- Ejecutar una sola vez en Supabase SQL Editor.
-- Otorga permisos SQL al rol anon; las politicas RLS siguen aplicando.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_movements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sale_items TO anon;
