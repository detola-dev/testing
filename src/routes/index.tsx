import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { CATEGORIES, TIKTOK_HANDLE, TIKTOK_URL, productsQuery, type CategoryId } from "@/lib/store";
import { ProductCard } from "@/components/site/ProductCard";
import { cn } from "@/lib/utils";
import heroVideo from "@/assets/media/case-v2.mp4.asset.json";
import heroPoster from "@/assets/media/case-v2-poster.jpg.asset.json";
import caseImg from "@/assets/media/case-1.jpg.asset.json";
import lashImg from "@/assets/media/lashes-2.jpg.asset.json";
import patchImg from "@/assets/media/patches-v1-poster.jpg.asset.json";
import bracesImg from "@/assets/media/braces-1.jpg.asset.json";

const TILE_IMG: Record<CategoryId, string> = {
  "junk-cases": caseImg.url,
  "cluster-lashes": lashImg.url,
  "pimple-patches": patchImg.url,
  braces: bracesImg.url,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fola Junk Syndicate — Junk Cases, Lashes, Patches & Braces" },
      { name: "description", content: "Handmade resin junk phone cases, cluster lashes, pimple patches and braces. Made with love, charms and resin magic." },
      { property: "og:title", content: "Fola Junk Syndicate" },
      { property: "og:description", content: "Made with love, charms and resin magic. Shop junk cases, lashes, patches and braces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  component: Index,
});

function Index() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const shown = cat === "all" ? products : products.filter((p) => p.category === cat);

  return (
    <>
      <section className="bg-pearl-gradient">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-20 md:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-logo-reveal">
            <p className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5 animate-sparkle" /> Handmade in Nigeria
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.02] sm:text-7xl">
              Made with love, <em className="text-primary">charms</em> & resin magic.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground">
              One-of-a-kind junk phone cases, fluffy cluster lashes, cute pimple patches and fashion braces.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#shop" className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5">
                Shop now <ArrowRight className="h-4 w-4" />
              </a>
              <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border bg-card px-6 font-semibold hover:bg-secondary">
                See us on TikTok
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-3 rotate-3 rounded-[2rem] bg-blush" aria-hidden />
            <video src={heroVideo.url} poster={heroPoster.url} autoPlay muted loop playsInline aria-label="A handmade junk phone case" className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-soft" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-3xl font-semibold sm:text-4xl">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <a key={c.id} href="#shop" onClick={() => setCat(c.id)} className="group relative aspect-square overflow-hidden rounded-2xl">
              <img src={TILE_IMG[c.id]} alt={c.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-x-2 bottom-2 rounded-xl bg-card/90 px-3 py-2 text-sm font-bold backdrop-blur">{c.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-6xl scroll-mt-20 px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-3xl font-semibold sm:text-4xl">New arrivals</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist">
            {[{ id: "all" as const, label: "All" }, ...CATEGORIES].map((c) => (
              <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors", cat === c.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-secondary")}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No products here yet — check back soon.</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-rose p-8 text-primary-foreground sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Watch the magic happen</p>
            <p className="mt-2 font-display text-3xl font-semibold">Follow {TIKTOK_HANDLE} on TikTok</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 font-semibold text-rose">
            Open TikTok <ArrowRight className="h-4 w-4" />
          </span>
        </a>
      </section>
    </>
  );
}
