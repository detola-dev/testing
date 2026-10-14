import { Link } from "@tanstack/react-router";
import { MediaGallery } from "./MediaGallery";
import { STOCK_STATUSES, categoryLabel, naira, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

export function StockBadge({ status }: { status: Product["stock_status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        status === "sold_out" ? "bg-foreground text-background" : status === "in_stock" ? "bg-card text-success" : "bg-card text-primary",
      )}
    >
      {STOCK_STATUSES[status]}
    </span>
  );
}

export function PriceLabel({ p, className }: { p: Product; className?: string }) {
  return (
    <span className={cn("font-semibold text-rose", className)}>
      {p.price_is_starting ? `Starting from ${naira(p.price)}` : naira(p.price)}
    </span>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const slug = product.slug ?? product.id;
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-soft">
      <div className="relative">
        <MediaGallery media={product.media} alt={product.name} controls />
        <div className="pointer-events-none absolute left-3 top-3">
          <StockBadge status={product.stock_status} />
        </div>
      </div>
      <Link to="/product/$slug" params={{ slug }} className="block w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{categoryLabel(product.category)}</p>
        <h3 className="mt-1 text-xl font-semibold">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between gap-2">
          <PriceLabel p={product} />
          <span className="text-xs font-semibold text-primary underline-offset-4 group-hover:underline">View details</span>
        </div>
      </Link>
    </article>
  );
}

const SWATCH: Record<string, string> = { pink: "hotpink", silver: "silver", blue: "deepskyblue" };

export function OptionGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)} className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors", value === o ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary")}>
            {SWATCH[o.toLowerCase()] && <span aria-hidden className="h-4 w-4 rounded-full border border-border" style={{ background: SWATCH[o.toLowerCase()] }} />}
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
