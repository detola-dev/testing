import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { LogOut, Plus, Trash2, Upload, X, Search, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminLogin } from "@/lib/shop.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Logo } from "@/components/site/Logo";
import { CATEGORIES, DELIVERY_STATUSES, ORDER_STATUSES, slugify, type DeliveryStatus, STOCK_STATUSES, categoryLabel, naira, type MediaItem, type OrderStatus, type Product } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Fola Junk Syndicate" },
      { name: "description", content: "Store management for Fola Junk Syndicate." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin — Fola Junk Syndicate" },
      { property: "og:description", content: "Store management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setIsAdmin(null);
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle().then(({ data }) => setIsAdmin(!!data));
  }, [session]);

  if (session === undefined || (session && isAdmin === null)) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!session) return <Login />;
  if (!isAdmin)
    return (
      <div className="p-10 text-center">
        <p>This account is not an admin.</p>
        <Button className="mt-4" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
    );
  return <Dashboard session={session} />;
}

function Login() {
  const login = useServerFn(adminLogin);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="flex min-h-screen items-center justify-center bg-pearl-gradient px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-soft"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const r = await login({ data: { username, password } });
            if (!r.ok) setError(r.error);
            else await supabase.auth.setSession({ access_token: r.access_token, refresh_token: r.refresh_token });
          } catch {
            setError("Login failed. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Logo />
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <div>
          <Label htmlFor="u">Username</Label>
          <Input id="u" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="p">Password</Label>
          <Input id="p" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full rounded-full">{busy ? "Signing in…" : "Sign in"}</Button>
        <Link to="/" className="block text-center text-xs text-muted-foreground">Back to store</Link>
      </form>
    </div>
  );
}

function Dashboard({ session }: { session: Session }) {
  const mustChange = !!session.user.user_metadata?.['must_change_password'];
  const [pwOpen, setPwOpen] = useState(mustChange);
  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}><KeyRound /> <span className="hidden sm:inline">Password</span></Button>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}><LogOut /> <span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </div>
      </header>
      {mustChange && (
        <div className="bg-accent px-4 py-2 text-center text-sm text-accent-foreground">
          You're using the initial password. Please change it before launch.
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><Overview /></TabsContent>
          <TabsContent value="orders"><Orders /></TabsContent>
          <TabsContent value="products"><Products /></TabsContent>
        </Tabs>
      </div>
      <PasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  );
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Change password</DialogTitle>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pw.length < 10) { toast.error("Use at least 10 characters."); return; }
            if (pw !== pw2) { toast.error("Passwords don't match."); return; }
            const { error } = await supabase.auth.updateUser({ password: pw, data: { must_change_password: false } });
            if (error) { toast.error(error.message); return; }
            toast.success("Password updated");
            setPw("");
            setPw2("");
            onOpenChange(false);
          }}
        >
          <Input type="password" placeholder="New password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Input type="password" placeholder="Repeat new password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <Button type="submit" className="w-full">Save password</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Order = {
  id: string; reference: string; customer_name: string; phone: string; email: string; address: string; city: string; state: string; notes: string;
  total: number; status: OrderStatus; delivery_status: DeliveryStatus; delivery_history: { status: string; at: string }[]; status_history: { status: string; at: string }[]; created_at: string;
  order_items: { id: string; product_name: string; variant: string; device: string; quantity: number; unit_price: number; line_total: number }[];
};

const ordersQ = { queryKey: ["admin-orders"], queryFn: async () => {
  const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(500);
  if (error) throw error;
  return data as unknown as Order[];
} };
const adminProductsQ = { queryKey: ["admin-products"], queryFn: async () => {
  const { data, error } = await supabase.from("products").select("*").order("sort_order").order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Product[];
} };

function Overview() {
  const orders = useQuery(ordersQ);
  const products = useQuery(adminProductsQ);
  const newOrders = orders.data?.filter((o) => o.status === "new") ?? [];
  const low = products.data?.filter((p) => p.stock_status === "sold_out" || (p.stock_qty != null && p.stock_qty <= 3)) ?? [];
  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-semibold">New orders ({newOrders.length})</h2>
        {newOrders.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No new orders right now.</p> : (
          <ul className="mt-3 space-y-2 text-sm">{newOrders.slice(0, 8).map((o) => <li key={o.id} className="flex justify-between"><span className="font-mono">{o.reference} · {o.customer_name}</span><span>{naira(o.total)}</span></li>)}</ul>
        )}
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-xl font-semibold">Low / out of stock ({low.length})</h2>
        {low.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">All products are stocked.</p> : (
          <ul className="mt-3 space-y-2 text-sm">{low.map((p) => <li key={p.id} className="flex justify-between"><span>{p.name}</span><span>{p.stock_qty != null ? `${p.stock_qty} left · ` : ""}{STOCK_STATUSES[p.stock_status]}</span></li>)}</ul>
        )}
      </div>
    </div>
  );
}

function Orders() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(ordersQ);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const list = useMemo(() => (data ?? []).filter((o) => {
    const s = q.toLowerCase();
    if (s && !(o.reference.toLowerCase().includes(s) || o.customer_name.toLowerCase().includes(s) || o.phone.includes(s))) return false;
    if (status && o.status !== status) return false;
    if (date && !o.created_at.startsWith(date)) return false;
    return true;
  }), [data, q, status, date]);

  async function updateStatus(o: Order, s: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status: s, status_history: [...o.status_history, { status: s, at: new Date().toISOString() }] }).eq("id", o.id);
    if (error) { toast.error("Could not update status"); return; }
    toast.success(`${o.reference} → ${ORDER_STATUSES[s]}`);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  async function updateDelivery(o: Order, s: DeliveryStatus) {
    const { error } = await supabase.from("orders").update({ delivery_status: s, delivery_history: [...(o.delivery_history ?? []), { status: s, at: new Date().toISOString() }] }).eq("id", o.id);
    if (error) { toast.error("Could not update delivery status"); return; }
    toast.success(`${o.reference} → ${DELIVERY_STATUSES[s]}`);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search reference, name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label="Filter by status" className="h-9 rounded-md border bg-card px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Input aria-label="Filter by date" type="date" className="sm:w-44" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading orders…</p> : error ? <p className="text-destructive">Could not load orders.</p> : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">No orders found.</p>
      ) : list.map((o) => (
        <article key={o.id} className="rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono font-bold text-rose">{o.reference}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="text-xs text-muted-foreground">Payment / order
                <select aria-label="Order status" className="mt-1 block h-9 rounded-md border bg-card px-2 text-sm text-foreground" value={o.status} onChange={(e) => updateStatus(o, e.target.value as OrderStatus)}>
                  {Object.entries(ORDER_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="text-xs text-muted-foreground">Delivery (shown to customer)
                <select aria-label="Delivery status" className="mt-1 block h-9 rounded-md border bg-card px-2 text-sm text-foreground" value={o.delivery_status} onChange={(e) => updateDelivery(o, e.target.value as DeliveryStatus)}>
                  {Object.entries(DELIVERY_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">{o.customer_name}</p>
              <p><a className="text-primary" href={`tel:${o.phone}`}>{o.phone}</a>{o.email && <> · {o.email}</>}</p>
              <p className="text-muted-foreground">{o.address}, {o.city}, {o.state}</p>
              {o.notes && <p className="mt-1 italic text-muted-foreground">“{o.notes}”</p>}
            </div>
            <div>
              <ul className="space-y-1">{o.order_items.map((i) => <li key={i.id} className="flex justify-between gap-2"><span>{i.product_name}{(i.variant || i.device) && ` (${[i.variant, i.device].filter(Boolean).join(", ")})`} × {i.quantity}</span><span>{naira(i.line_total)}</span></li>)}</ul>
              <p className="mt-2 flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{naira(o.total)}</span></p>
            </div>
          </div>
          {o.status_history.length > 1 && <p className="mt-2 text-xs text-muted-foreground">History: {o.status_history.map((h) => `${ORDER_STATUSES[h.status as OrderStatus] ?? h.status} (${new Date(h.at).toLocaleDateString("en-NG")})`).join(" → ")}</p>}
        </article>
      ))}
    </div>
  );
}

function Products() {
  const { data, isLoading } = useQuery(adminProductsQ);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  return (
    <div className="mt-4 space-y-3">
      <Button onClick={() => setEditing({ category: "junk-cases", media: [], variants: [], devices: [], stock_status: "in_stock", published: true, price: 0 })}><Plus /> New product</Button>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (data ?? []).length === 0 ? <p className="rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">No products yet.</p> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data!.map((p) => (
            <button key={p.id} type="button" onClick={() => setEditing(p)} className="flex gap-3 rounded-2xl border bg-card p-3 text-left hover:shadow-soft">
              {p.media[0] ? <img src={p.media[0].type === "image" ? p.media[0].url : p.media[0].poster} alt="" className="h-20 w-16 rounded-lg bg-muted object-cover" /> : <div className="h-20 w-16 rounded-lg bg-muted" />}
              <div className="flex-1">
                <p className="font-semibold">{p.name} {!p.published && <span className="text-xs text-muted-foreground">(hidden)</span>}</p>
                <p className="text-xs text-muted-foreground">{categoryLabel(p.category)}</p>
                <p className="text-sm">{p.price_is_starting ? "From " : ""}{naira(p.price)} · {STOCK_STATUSES[p.stock_status]}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {editing && <ProductEditor initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ProductEditor({ initial, onClose }: { initial: Partial<Product>; onClose: () => void }) {
  const qc = useQueryClient();
  const [p, setP] = useState<Partial<Product>>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  async function upload(files: FileList) {
    setUploading(true);
    const added: MediaItem[] = [];
    for (const f of Array.from(files)) {
      const isVideo = f.type.startsWith("video/");
      if (!isVideo && !f.type.startsWith("image/")) { toast.error(`${f.name}: unsupported file`); continue; }
      const path = `${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-media").upload(path, f, { contentType: f.type });
      if (error) { toast.error(`${f.name}: upload failed`); continue; }
      const { data: signed } = await supabase.storage.from("product-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signed) added.push({ type: isVideo ? "video" : "image", url: signed.signedUrl });
    }
    setP((x) => ({ ...x, media: [...(x.media ?? []), ...added] }));
    setUploading(false);
  }

  async function save() {
    if (!p.name?.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    const row = {
      ...(p.id ? {} : { slug: `${slugify(p.name)}-${crypto.randomUUID().slice(0, 4)}` }),
      name: p.name.trim(), description: p.description ?? "", category: p.category!, price: Math.max(0, Math.round(Number(p.price) || 0)),
      price_is_starting: !!p.price_is_starting, price_note: p.price_note ?? "", media: (p.media ?? []) as never, variants: p.variants ?? [], devices: p.devices ?? [],
      stock_status: p.stock_status!, stock_qty: p.stock_qty ?? null, allow_backorder: !!p.allow_backorder, notes: p.notes ?? "", published: p.published ?? true, sort_order: p.sort_order ?? 0,
    };
    const { error } = p.id ? await supabase.from("products").update(row).eq("id", p.id) : await supabase.from("products").insert(row);
    setBusy(false);
    if (error) { toast.error("Could not save product"); return; }
    toast.success("Product saved");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    onClose();
  }

  async function remove() {
    if (!p.id || !confirm(`Delete ${p.name}? This can't be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) { toast.error("Could not delete"); return; }
    toast.success("Product deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{p.id ? "Edit product" : "New product"}</DialogTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={p.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div><Label>Category</Label>
            <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={p.category} onChange={(e) => set("category", e.target.value as Product["category"])}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div><Label>Price (₦)</Label><Input type="number" min={0} value={p.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={!!p.price_is_starting} onCheckedChange={(v) => set("price_is_starting", v)} /> Show as "Starting from"</label>
          <div><Label>Sort order</Label><Input type="number" value={p.sort_order ?? 0} onChange={(e) => set("sort_order", Number(e.target.value))} /></div>
          <div className="sm:col-span-2"><Label>Price note</Label><Input value={p.price_note ?? ""} onChange={(e) => set("price_note", e.target.value)} /></div>
          <div><Label>Colours / designs (comma separated)</Label><Input defaultValue={(p.variants ?? []).join(", ")} onBlur={(e) => set("variants", list(e.target.value))} /></div>
          <div><Label>Devices (comma separated)</Label><Input defaultValue={(p.devices ?? []).join(", ")} onBlur={(e) => set("devices", list(e.target.value))} /></div>
          <div><Label>Stock status</Label>
            <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={p.stock_status} onChange={(e) => set("stock_status", e.target.value as Product["stock_status"])}>
              {Object.entries(STOCK_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><Label>Stock quantity (optional)</Label><Input type="number" min={0} value={p.stock_qty ?? ""} onChange={(e) => set("stock_qty", e.target.value === "" ? null : Number(e.target.value))} /></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={!!p.allow_backorder} onCheckedChange={(v) => set("allow_backorder", v)} /> Allow orders when sold out</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={p.published ?? true} onCheckedChange={(v) => set("published", v)} /> Published</label>
          <div className="sm:col-span-2"><Label>Notes</Label><Input value={p.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="sm:col-span-2">
            <Label>Photos & videos</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(p.media ?? []).map((m, i) => (
                <div key={m.url + i} className="relative h-24 w-20 overflow-hidden rounded-lg bg-muted">
                  {m.type === "image" ? <img src={m.url} alt="" className="h-full w-full object-cover" /> : m.poster ? <img src={m.poster} alt="" className="h-full w-full object-cover" /> : <video src={m.url} muted className="h-full w-full object-cover" />}
                  {m.type === "video" && <span className="absolute bottom-1 left-1 rounded bg-card px-1 text-[9px] font-bold">VIDEO</span>}
                  <button type="button" aria-label="Remove media" onClick={() => set("media", (p.media ?? []).filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-card"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="grid h-24 w-20 cursor-pointer place-items-center rounded-lg border border-dashed text-xs text-muted-foreground hover:bg-secondary">
                <span className="flex flex-col items-center gap-1"><Upload className="h-4 w-4" />{uploading ? "…" : "Add"}</span>
                <input type="file" accept="image/*,video/*" multiple className="sr-only" disabled={uploading} onChange={(e) => e.target.files && upload(e.target.files)} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between gap-2">
          {p.id ? <Button variant="destructive" onClick={remove}><Trash2 /> Delete</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={busy || uploading}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
