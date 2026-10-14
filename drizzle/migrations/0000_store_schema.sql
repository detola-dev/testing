create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null check (category in ('junk-cases','cluster-lashes','pimple-patches','braces')),
  price integer not null default 0,
  price_is_starting boolean not null default false,
  price_note text not null default '',
  media jsonb not null default '[]'::jsonb,
  variants text[] not null default '{}',
  devices text[] not null default '{}',
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','sold_out','pre_order','made_to_order')),
  stock_qty integer,
  allow_backorder boolean not null default false,
  notes text not null default '',
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read published" on public.products for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin insert" on public.products for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.products for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.products for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  phone text not null,
  email text not null default '',
  address text not null,
  city text not null,
  state text not null,
  notes text not null default '',
  total integer not null,
  status text not null default 'new' check (status in ('new','contacted','awaiting_payment','paid','processing','shipped','delivered','cancelled')),
  status_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "admin read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  variant text not null default '',
  device text not null default '',
  quantity integer not null,
  unit_price integer not null,
  line_total integer not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "admin read items" on public.order_items for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null default '',
  created_at timestamptz not null default now()
);
grant all on public.admin_login_attempts to service_role;
alter table public.admin_login_attempts enable row level security;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create policy "read product media" on storage.objects for select to anon, authenticated using (bucket_id = 'product-media');
create policy "admin upload media" on storage.objects for insert to authenticated with check (bucket_id = 'product-media' and public.has_role(auth.uid(),'admin'));
create policy "admin delete media" on storage.objects for delete to authenticated using (bucket_id = 'product-media' and public.has_role(auth.uid(),'admin'));

insert into public.products (name, description, category, price, price_is_starting, price_note, media, sort_order) values
('Junk Case', 'Handmade resin junk phone case decorated with charms, bows and sparkle. Every piece is one of a kind.', 'junk-cases', 8000, true, 'Price depends on the style and device. Please DM the seller for details.',
 '[{"type":"video","url":"/__l5e/assets-v1/ac0051d7-e61e-41df-88d3-a404e0255aba/case-v2.mp4","poster":"/__l5e/assets-v1/4d54f9be-418c-4f7c-b688-b069e9798ed4/case-v2-poster.jpg"},{"type":"image","url":"/__l5e/assets-v1/86ffa104-bbab-4feb-aab7-9798dda77217/case-1.jpg"},{"type":"video","url":"/__l5e/assets-v1/da178ac4-e4df-4d1c-99b4-7c70d8a387c3/case-v1.mp4","poster":"/__l5e/assets-v1/7f06074f-5100-4695-b228-b90a729bd7b0/case-v1-poster.jpg"}]', 1),
('Braces', 'Fashion braces in multiple colours.', 'braces', 9000, false, '',
 '[{"type":"image","url":"/__l5e/assets-v1/e9eb55eb-313e-443b-b200-188e2fda00ee/braces-1.jpg"},{"type":"image","url":"/__l5e/assets-v1/f3b6201c-a39a-4a22-b014-380a18cf5d3c/braces-2.jpg"},{"type":"image","url":"/__l5e/assets-v1/296c4ac0-e90c-453b-928e-6183621d2bba/braces-3.jpg"}]', 2),
('Cluster Lashes', 'DIY cluster lash sets in a range of styles and lengths.', 'cluster-lashes', 9500, false, '',
 '[{"type":"image","url":"/__l5e/assets-v1/0108a6e3-b30b-400c-8d46-29ac44843057/lashes-2.jpg"},{"type":"image","url":"/__l5e/assets-v1/9fab4f4f-d3c3-4a19-b5e1-f0d4223e08c9/lashes-1.jpg"}]', 3),
('Pimple Patches', 'Cute star-shaped holographic pimple patches.', 'pimple-patches', 1000, false, '',
 '[{"type":"video","url":"/__l5e/assets-v1/d1a0c4c6-938b-4d8e-a46e-04236ee37d34/patches-v1.mp4","poster":"/__l5e/assets-v1/4d23ddcd-087c-48af-bd4d-e8bb9d427abc/patches-v1-poster.jpg"}]', 4);