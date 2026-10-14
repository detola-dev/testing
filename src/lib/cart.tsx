import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  price: number;
  image?: string | undefined;
  variant: string;
  device: string;
  quantity: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (l: Omit<CartLine, "key" | "quantity">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "fjs-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      open,
      setOpen,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.quantity * l.price, 0),
      add: (l, qty = 1) =>
        setLines((prev) => {
          const key = `${l.productId}|${l.variant}|${l.device}`;
          const found = prev.find((p) => p.key === key);
          if (found) return prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(99, p.quantity + qty) } : p));
          return [...prev, { ...l, key, quantity: qty }];
        }),
      setQty: (key, qty) =>
        setLines((prev) => prev.map((p) => (p.key === key ? { ...p, quantity: Math.max(1, Math.min(99, qty)) } : p))),
      remove: (key) => setLines((prev) => prev.filter((p) => p.key !== key)),
      clear: () => setLines([]),
    }),
    [lines, open],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
