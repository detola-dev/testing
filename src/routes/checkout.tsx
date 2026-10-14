import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CheckCircle2, Copy, MessageCircle, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { createOrder } from "@/lib/shop.functions";
import { WHATSAPP_URL, naira } from "@/lib/store";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Fola Junk Syndicate" },
      { name: "description", content: "Review your bag and continue to WhatsApp to arrange payment." },
      { property: "og:title", content: "Checkout — Fola Junk Syndicate" },
      { property: "og:description", content: "Review your bag and continue to WhatsApp to arrange payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid phone number, e.g. 0812 345 6789"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(255)]),
  address: z.string().trim().min(5, "Enter your delivery address").max(300),
  city: z.string().trim().min(2, "Enter your city / area").max(100),
  state: z.string().trim().min(2, "Enter your state").max(100),
  notes: z.string().trim().max(1000),
});
type Form = z.infer<typeof schema>;
const empty: Form = { name: "", phone: "", email: "", address: "", city: "", state: "", notes: "" };

function buildMessage(ref: string, items: { product_name: string; variant: string; device: string; quantity: number; line_total: number }[], total: number, f: Form) {
  const lines = [
    "Hello FOLA JUNK SYNDICATE, I want to make payment for my order.",
    "",
    `Order: ${ref}`,
    "",
    "Products:",
    ...items.map((i) => `${i.product_name}${[i.variant, i.device].filter(Boolean).length ? ` (${[i.variant, i.device].filter(Boolean).join(", ")})` : ""} × ${i.quantity} — ${naira(i.line_total)}`),
    "",
    `Total: ${naira(total)}`,
    "",
    `Name: ${f.name}`,
    `Phone: ${f.phone}`,
    ...(f.email ? [`Email: ${f.email}`] : []),
    `Delivery address: ${f.address}, ${f.city}, ${f.state}`,
    ...(f.notes ? [`Order notes: ${f.notes}`] : []),
    "",
    "Please send me the payment details.",
  ];
  return lines.join("\n");
}

function Checkout() {
  const cart = useCart();
  const submit = useServerFn(createOrder);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ ref: string; url: string } | null>(null);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: typeof errors = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] = i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await submit({
        data: {
          customer: parsed.data,
          items: cart.lines.map((l) => ({ productId: l.productId, variant: l.variant, device: l.device, quantity: l.quantity })),
        },
      });
      const message = buildMessage(res.reference, res.items, res.total, parsed.data);
      const url = `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
      setDone({ ref: res.reference, url });
      window.scrollTo({ top: 0 });
      cart.clear();
      if (url.length < 4000) window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-4 text-4xl font-semibold">Order placed successfully!</h1>
        <p className="mt-2 text-muted-foreground">Your tracking ID is</p>
        <p className="mt-1 font-mono text-2xl font-bold text-rose">{done.ref}</p>
        <p className="mx-auto mt-4 max-w-sm text-sm text-muted-foreground">
          Your order is saved. WhatsApp should open with your order details — please <strong>send the message</strong> so we can share payment details. Your order is not paid yet.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="h-12 rounded-full"
            onClick={async () => {
              try { await navigator.clipboard.writeText(done.ref); toast.success("Tracking ID copied!"); }
              catch { toast.error("Couldn't copy — please write the ID down."); }
            }}
          >
            <Copy className="h-4 w-4" /> Copy Tracking ID
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full">
            <Link to="/track-order" search={{ ref: done.ref }}><PackageSearch className="h-4 w-4" /> Track My Order</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full">
            <a href={done.url} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Open WhatsApp</a>
          </Button>
          <Link to="/" className="text-sm font-semibold text-primary">Continue Shopping</Link>
        </div>
      </div>
    );

  if (cart.lines.length === 0)
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-4xl font-semibold">Your bag is empty</h1>
        <p className="mt-2 text-muted-foreground">Add something cute before checking out.</p>
        <Button asChild className="mt-6 rounded-full"><Link to="/">Go shopping</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <h1 className="text-4xl font-semibold">Delivery details</h1>
        <p className="text-sm text-muted-foreground">Fields marked * are required. No payment is taken here — you'll arrange payment with us on WhatsApp.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Full name *" error={errors.name}><Input id="name" autoComplete="name" value={form.name} onChange={set("name")} /></Field>
          <Field id="phone" label="Phone number *" error={errors.phone}><Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} /></Field>
          <Field id="email" label="Email (optional)" error={errors.email} className="sm:col-span-2"><Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} /></Field>
          <Field id="address" label="Delivery address *" error={errors.address} className="sm:col-span-2"><Input id="address" autoComplete="street-address" value={form.address} onChange={set("address")} /></Field>
          <Field id="city" label="City / area *" error={errors.city}><Input id="city" value={form.city} onChange={set("city")} /></Field>
          <Field id="state" label="State *" error={errors.state}><Input id="state" value={form.state} onChange={set("state")} /></Field>
          <Field id="notes" label="Order notes (design, colour, device…)" error={errors.notes} className="sm:col-span-2"><Textarea id="notes" rows={3} value={form.notes} onChange={set("notes")} /></Field>
        </div>
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
          <MessageCircle className="h-5 w-5" /> {busy ? "Saving your order…" : "Continue to Payment on WhatsApp"}
        </Button>
      </form>

      <aside className="h-fit rounded-2xl border bg-card p-5 lg:sticky lg:top-24">
        <h2 className="text-2xl font-semibold">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-3 text-sm">
              <span>
                {l.name} × {l.quantity}
                {(l.variant || l.device) && <span className="block text-xs text-muted-foreground">{[l.variant, l.device].filter(Boolean).join(" · ")}</span>}
              </span>
              <span className="font-semibold">{naira(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t pt-4 text-lg font-semibold">
          <span>Total</span>
          <span className="text-rose">{naira(cart.total)}</span>
        </div>
      </aside>
    </div>
  );
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string | undefined; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{error}</p>}
    </div>
  );
}
