ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;
UPDATE public.products SET slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')) WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products(slug);
UPDATE public.products SET variants = ARRAY['Pink','Silver','Blue'] WHERE category = 'braces' AND cardinality(variants) = 0;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'confirmed'
  CHECK (delivery_status IN ('confirmed','ready','on_the_way','delivered'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_history jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.orders SET delivery_history = jsonb_build_array(jsonb_build_object('status','confirmed','at',created_at)) WHERE delivery_history = '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.track_order(_ref text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'reference', o.reference, 'delivery_status', o.delivery_status, 'delivery_history', o.delivery_history,
    'created_at', o.created_at,
    'items', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', i.product_name, 'variant', i.variant, 'quantity', i.quantity)) FROM public.order_items i WHERE i.order_id = o.id), '[]'::jsonb))
  FROM public.orders o WHERE o.reference = upper(trim(_ref)) LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.track_order(text) FROM public;
GRANT EXECUTE ON FUNCTION public.track_order(text) TO anon, authenticated;