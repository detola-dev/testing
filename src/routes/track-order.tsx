import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Check, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DELIVERY_STATUSES, type DeliveryStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

type Tracked = {
  reference: string;
  delivery_status: DeliveryStatus;
  delivery_history: { status: string; at: string }[];
  created_at: string;
  items: { name: string; variant: string; quantity: number }[];
};

export const Route = createFileRoute("/track-order")({
  validateSearch: z.object({ ref: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Track Your Order — Fola Junk Syndicate" },
      { name: "description", content: "Enter your tracking ID to see the latest delivery status of your order." },
      { property: "og:title", content: "Track Your Order — Fola Junk Syndicate" },
      { property: "og:description", content: "See the latest delivery status of your order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackOrder,
});

const STEPS = Object.keys(DELIVERY_STATUSES) as DeliveryStatus[];

function TrackOrder() {
  const { ref } = Route.useSearch();
  const [code, setCode] = useState(ref ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Tracked | null | undefined>(undefined);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("track_order", { _ref: code.trim() });
    setBusy(false);
    setResult(error ? null : ((data as unknown as Tracked) ?? null));
  }

  const idx = result ? STEPS.indexOf(result.delivery_status) : -1;
  const at = (s: string) => result?.delivery_history.filter((h) => h.status === s).at(-1)?.at;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Track your order</h1>
      <p className="mt-2 text-sm text-muted-foreground">Enter the tracking ID you got after placing your order (e.g. FJS-2026-ABC123).</p>
      <form onSubmit={lookup} className="mt-6 flex gap-2">
        <Input aria-label="Tracking ID" placeholder="FJS-2026-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} className="h-11 font-mono uppercase" />
        <Button type="submit" disabled={busy} className="h-11 rounded-full"><Search className="h-4 w-4" /> {busy ? "Checking…" : "Track"}</Button>
      </form>

      {result === null && <p className="mt-6 rounded-2xl border border-dashed bg-card p-6 text-center text-muted-foreground" role="alert">We couldn't find an order with that tracking ID. Please check it and try again.</p>}

      {result && (
        <div className="mt-8 rounded-2xl border bg-card p-6">
          <p className="font-mono text-xl font-bold text-rose">{result.reference}</p>
          <p className="text-xs text-muted-foreground">Placed {new Date(result.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</p>
          <ol className="mt-6 space-y-0">
            {STEPS.map((s, i) => {
              const done = i <= idx;
              const when = at(s);
              return (
                <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && <span className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", i < idx ? "bg-primary" : "bg-border")} />}
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border-2", done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="pt-1">
                    <p className={cn("font-semibold", !done && "text-muted-foreground")}>{DELIVERY_STATUSES[s]}{i === idx && <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase text-secondary-foreground">Current</span>}</p>
                    {done && when && <p className="text-xs text-muted-foreground">{new Date(when).toLocaleString("en-NG")}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          <ul className="mt-6 space-y-1 border-t pt-4 text-sm">
            {result.items.map((it, i) => <li key={i}>{it.name}{it.variant && ` (${it.variant})`} × {it.quantity}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
