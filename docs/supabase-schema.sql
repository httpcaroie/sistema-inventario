-- Esquema de base de datos para el sistema de inventario.
-- Ejecutar una sola vez en el SQL Editor de Supabase si las tablas aun no existen.
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    purchase_price NUMERIC(12,2) DEFAULT 0,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id),
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo access products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Demo access movements" ON public.inventory_movements FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Demo access sales" ON public.sales FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Demo access sale items" ON public.sale_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- Permisos para la publishable key en la demostracion academica.
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_movements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sale_items TO anon;
