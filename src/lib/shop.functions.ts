import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const ADMIN_USERNAME = "junkbyfola";
const ADMIN_EMAIL = "junkbyfola@admin.folajunksyndicate.app";

const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/),
    email: z.union([z.literal(""), z.string().trim().email().max(255)]),
    address: z.string().trim().min(5).max(300),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    notes: z.string().trim().max(1000),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variant: z.string().max(100),
        device: z.string().max(100),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(50),
});

function makeReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `FJS-${new Date().getFullYear()}-${code}`;
}

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = [...new Set(data.items.map((i) => i.productId))];
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id,name,price,stock_status,allow_backorder,published,variants")
      .in("id", ids);
    if (error) throw new Error("Could not load products. Please try again.");
    const byId = new Map(products!.map((p) => [p.id, p]));

    const items = data.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p || !p.published) throw new Error("A product in your cart is no longer available.");
      if (p.stock_status === "sold_out" && !p.allow_backorder) throw new Error(`${p.name} is sold out.`);
      if (p.variants.length > 0 && !p.variants.includes(i.variant)) throw new Error(`Please choose a colour / design for ${p.name}.`);
      return {
        product_id: p.id,
        product_name: p.name,
        variant: i.variant,
        device: i.device,
        quantity: i.quantity,
        unit_price: p.price,
        line_total: p.price * i.quantity,
      };
    });
    const total = items.reduce((s, i) => s + i.line_total, 0);
    const c = data.customer;

    for (let attempt = 0; attempt < 3; attempt++) {
      const reference = makeReference();
      const { data: order, error: oErr } = await supabaseAdmin
        .from("orders")
        .insert({
          reference,
          customer_name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          state: c.state,
          notes: c.notes,
          total,
          status_history: [{ status: "new", at: new Date().toISOString() }],
          delivery_status: "confirmed",
          delivery_history: [{ status: "confirmed", at: new Date().toISOString() }],
        })
        .select("id")
        .single();
      if (oErr) {
        if (oErr.code === "23505") continue;
        throw new Error("Could not save your order. Please try again.");
      }
      const { error: iErr } = await supabaseAdmin
        .from("order_items")
        .insert(items.map((i) => ({ ...i, order_id: order.id })));
      if (iErr) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        throw new Error("Could not save your order. Please try again.");
      }
      return { reference, total, items };
    }
    throw new Error("Could not create an order reference. Please try again.");
  });

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ username: z.string().trim().max(50), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createClient } = await import("@supabase/supabase-js");
    const ip = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for") || "unknown";

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) return { ok: false as const, error: "Too many attempts. Try again in 15 minutes." };

    const fail = async () => {
      await supabaseAdmin.from("admin_login_attempts").insert({ ip });
      return { ok: false as const, error: "Incorrect username or password." };
    };
    if (data.username.toLowerCase() !== ADMIN_USERNAME) return fail();

    const anon = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let res = await anon.auth.signInWithPassword({ email: ADMIN_EMAIL, password: data.password });

    if (res.error) {
      // First-time setup: create the admin account from the initial secret if it doesn't exist yet.
      const initial = process.env['ADMIN_INITIAL_PASSWORD'];
      const { data: roles } = await supabaseAdmin.from("user_roles").select("id").eq("role", "admin").limit(1);
      if (initial && (!roles || roles.length === 0) && data.password === initial) {
        const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: initial,
          email_confirm: true,
          user_metadata: { username: ADMIN_USERNAME, must_change_password: true },
        });
        if (cErr || !created.user) return { ok: false as const, error: "Admin setup failed." };
        await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "admin" });
        res = await anon.auth.signInWithPassword({ email: ADMIN_EMAIL, password: data.password });
      }
      if (res.error) return fail();
    }
    const s = res.data.session!;
    return { ok: true as const, access_token: s.access_token, refresh_token: s.refresh_token };
  });
