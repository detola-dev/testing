import { Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, Mail, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cart";
import { EMAIL, TIKTOK_HANDLE, TIKTOK_URL, WHATSAPP_URL, naira } from "@/lib/store";

export function Header() {
  const cart = useCart();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" aria-label="Fola Junk Syndicate home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          <a href="/#shop" className="hidden text-sm font-semibold hover:text-primary sm:block">Shop</a>
          <a href="/#contact" className="hidden text-sm font-semibold hover:text-primary sm:block">Contact</a>
          <button type="button" onClick={() => cart.setOpen(true)} aria-label={`Open bag, ${cart.count} items`} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
            <ShoppingBag className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{cart.count}</span>
            )}
          </button>
        </nav>
      </div>
      <CartSheet />
    </header>
  );
}

function CartSheet() {
  const cart = useCart();
  const navigate = useNavigate();
  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your bag</SheetTitle>
        </SheetHeader>
        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10 text-blush" />
            <p>Your bag is empty — go find something cute.</p>
            <Button variant="outline" className="rounded-full" onClick={() => cart.setOpen(false)}>Keep shopping</Button>
          </div>
        ) : (
          <>
            <ul className="-mx-2 flex-1 space-y-3 overflow-y-auto px-2">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex gap-3 rounded-xl border p-2">
                  {l.image ? <img src={l.image} alt="" className="h-20 w-16 rounded-lg object-cover" /> : <div className="h-20 w-16 rounded-lg bg-muted" />}
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold">{l.name}</p>
                      <button type="button" aria-label={`Remove ${l.name}`} onClick={() => cart.remove(l.key)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {(l.variant || l.device) && <p className="text-xs text-muted-foreground">{[l.variant, l.device].filter(Boolean).join(" · ")}</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border">
                        <button type="button" aria-label="Decrease" className="grid h-7 w-7 place-items-center" onClick={() => cart.setQty(l.key, l.quantity - 1)}><Minus className="h-3 w-3" /></button>
                        <span className="w-5 text-center text-sm font-semibold">{l.quantity}</span>
                        <button type="button" aria-label="Increase" className="grid h-7 w-7 place-items-center" onClick={() => cart.setQty(l.key, l.quantity + 1)}><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="font-semibold text-rose">{naira(l.price * l.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-rose">{naira(cart.total)}</span>
              </div>
              <Button className="h-12 w-full rounded-full" onClick={() => { cart.setOpen(false); navigate({ to: "/checkout" }); }}>
                Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="mt-20 border-t bg-pearl-gradient">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <Logo withTagline />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Junk cases, cluster lashes, pimple patches and braces — handpicked and handmade.</p>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="text-lg font-semibold">Contact</h3>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary"><MessageCircle className="h-4 w-4" /> WhatsApp: +234 812 798 6094</a>
          <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 break-all hover:text-primary"><Mail className="h-4 w-4 shrink-0" /> {EMAIL}</a>
          <a href={TIKTOK_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary"><span className="w-4 text-center font-bold">♪</span> TikTok {TIKTOK_HANDLE}</a>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="text-lg font-semibold">Shop</h3>
          <a href="/#shop" className="block hover:text-primary">All products</a>
          <Link to="/checkout" className="block hover:text-primary">Checkout</Link>
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} Fola Junk Syndicate</p>
    </footer>
  );
}
