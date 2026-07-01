import { cookies } from "next/headers";
import { getCatalogProductBySlug, getCatalogProducts, type CatalogProduct } from "@/lib/db/catalog";

export type CartCookieItem = {
  slug: string;
  quantity: number;
};

export type CartLine = {
  product: CatalogProduct;
  quantity: number;
  lineTotal: number;
};

export type CartSnapshot = {
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  hasRestrictedItems: boolean;
};

const cartCookieName = "stun_fry_cart";

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.min(10, Math.floor(quantity)));
}

export async function getCartCookieItems(): Promise<CartCookieItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(cartCookieName)?.value;

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CartCookieItem[];
    return parsed
      .filter((item) => item.slug && item.quantity > 0)
      .map((item) => ({ slug: item.slug, quantity: normalizeQuantity(item.quantity) }));
  } catch {
    return [];
  }
}

export async function setCartCookieItems(items: CartCookieItem[]) {
  const cookieStore = await cookies();
  const value = Buffer.from(JSON.stringify(items), "utf8").toString("base64url");
  cookieStore.set(cartCookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart() {
  const cookieStore = await cookies();
  cookieStore.delete(cartCookieName);
}

export async function getAvailableStockBySlug(slug: string): Promise<{ product?: CatalogProduct; available: number }> {
  const product = await getCatalogProductBySlug(slug);
  return { product, available: Math.max(0, product?.stock ?? 0) };
}

export async function getCartSnapshot(): Promise<CartSnapshot> {
  const [items, products] = await Promise.all([getCartCookieItems(), getCatalogProducts()]);
  const lines = items
    .map((item) => {
      const product = products.find((candidate) => candidate.slug === item.slug);

      if (!product) {
        return null;
      }

      const available = Math.max(0, product.stock);

      if (available <= 0) {
        return null;
      }

      const quantity = Math.min(normalizeQuantity(item.quantity), available);
      return { product, quantity, lineTotal: product.price * quantity };
    })
    .filter((line): line is CartLine => Boolean(line));

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal > 0 ? 12 : 0;
  // Final tax is calculated server-side during checkout after destination checks.
  const tax = 0;
  const total = subtotal + shipping + tax;

  return {
    lines,
    subtotal,
    shipping,
    tax,
    total,
    hasRestrictedItems: lines.some((line) => line.product.restricted),
  };
}
