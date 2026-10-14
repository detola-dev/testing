import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MediaGallery } from "@/components/site/MediaGallery";
import { OptionGroup, PriceLabel, StockBadge } from "@/components/site/ProductCard";
import { useCart } from "@/lib/cart";
import { canOrder, categoryLabel, type Product } from "@/lib/store";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("published", true).eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Product | null;
    },
  });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { name: p.name, description: p.description };
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} — Fola Junk Syndicate` : "Product — Fola Junk Syndicate";
    const desc = loaderData?.description?.slice(0, 155) || "Shop cute accessories from Fola Junk Syndicate.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold">Product not found</h1>
      <Button asChild className="mt-6 rounded-full"><Link to="/">Continue shopping</Link></Button>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const cart = useCart();
  const [variant, setVariant] = useState("");
  const [device, setDevice] = useState(product?.devices[0] ?? "");
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const orderable = canOrder(product);
  const needsVariant = product.variants.length > 0;
  const variantLabel = product.category === "braces" ? "Colour" : "Colour / design";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" hash="shop" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Continue shopping</Link>
      <div className="grid overflow-hidden rounded-2xl border bg-card md:grid-cols-2">
        <MediaGallery media={product.media} alt={product.name} controls />
        <div className="flex flex-col gap-4 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{categoryLabel(product.category)}</p>
            <h1 className="mt-1 font-display text-4xl font-semibold">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <PriceLabel p={product} className="text-lg" />
              <StockBadge status={product.stock_status} />
            </div>
            {product.price_note && <p className="mt-2 rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">{product.price_note}</p>}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          {product.notes && <p className="text-sm text-muted-foreground">{product.notes}</p>}
          {needsVariant && <OptionGroup label={`${variantLabel} *`} options={product.variants} value={variant} onChange={setVariant} />}
          {product.devices.length > 0 && <OptionGroup label="Device" options={product.devices} value={device} onChange={setDevice} />}
          <div className="mt-auto flex items-center gap-3">
            <div className="flex items-center rounded-full border">
              <button type="button" aria-label="Decrease quantity" className="grid h-10 w-10 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
              <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
              <button type="button" aria-label="Increase quantity" className="grid h-10 w-10 place-items-center" onClick={() => setQty((q) => Math.min(99, q + 1))}><Plus className="h-4 w-4" /></button>
            </div>
            <Button
              className="h-11 flex-1 rounded-full"
              disabled={!orderable}
              onClick={() => {
                if (needsVariant && !variant) { toast.error(`Please choose a ${variantLabel.toLowerCase()} first`); return; }
                cart.add({ productId: product.id, name: product.name, price: product.price, image: product.media.find((m) => m.type === "image")?.url ?? product.media[0]?.poster, variant, device }, qty);
                toast.success(`${product.name} added to your bag`);
                cart.setOpen(true);
              }}
            >
              <Sparkles className="h-4 w-4" /> {orderable ? "Add to cart" : "Sold out"}
            </Button>
          </div>
          {product.price_is_starting && orderable && <p className="text-xs text-muted-foreground">Your bag shows the starting price; the final price for your style and device is confirmed on WhatsApp.</p>}
        </div>
      </div>
    </div>
  );
}
