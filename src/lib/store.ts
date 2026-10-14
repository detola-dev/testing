import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "2348127986094";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const TIKTOK_URL = "https://www.tiktok.com/@junkedbyomofolawe";
export const TIKTOK_HANDLE = "@junkedbyomofolawe";
export const EMAIL = "fareedatshoyomi87@gmail.com";

export const CATEGORIES = [
  { id: "junk-cases", label: "Junk Cases" },
  { id: "cluster-lashes", label: "Cluster Lashes" },
  { id: "pimple-patches", label: "Pimple Patches" },
  { id: "braces", label: "Braces" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const STOCK_STATUSES = {
  in_stock: "In Stock",
  sold_out: "Sold Out",
  pre_order: "Pre-order",
  made_to_order: "Made to Order",
} as const;
export type StockStatus = keyof typeof STOCK_STATUSES;

export const ORDER_STATUSES = {
  new: "New",
  contacted: "Contacted on WhatsApp",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;

export const DELIVERY_STATUSES = {
  confirmed: "Order Confirmed",
  ready: "Product Ready for Delivery",
  on_the_way: "On Its Way",
  delivered: "Delivered",
} as const;
export type DeliveryStatus = keyof typeof DELIVERY_STATUSES;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export type MediaItem = { type: "image" | "video"; url: string; poster?: string };

export type Product = {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  category: CategoryId;
  price: number;
  price_is_starting: boolean;
  price_note: string;
  media: MediaItem[];
  variants: string[];
  devices: string[];
  stock_status: StockStatus;
  stock_qty: number | null;
  allow_backorder: boolean;
  notes: string;
  published: boolean;
  sort_order: number;
  created_at: string;
};

export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function canOrder(p: Pick<Product, "stock_status" | "allow_backorder">) {
  return p.stock_status !== "sold_out" || p.allow_backorder;
}

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("published", true)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Product[];
  },
});
