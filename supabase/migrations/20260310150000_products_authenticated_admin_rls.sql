-- GitHub Pages admin: authenticated Supabase Auth users can manage products (publishable key + RLS).
GRANT INSERT, UPDATE ON public.products TO authenticated;

CREATE POLICY "Authenticated users can view all products"
  ON public.products FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
