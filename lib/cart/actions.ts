"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCartCookieItems, getCartSnapshot, setCartCookieItems } from "@/lib/cart/cart-service";

function getReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/products");
  return returnTo.startsWith("/") ? returnTo : "/products";
}

function withAddedToCart(returnTo: string) {
  const separator = returnTo.includes("?") ? "&" : "?";
  return `${returnTo}${separator}added=1`;
}

export async function addToCartAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const quantity = Number(formData.get("quantity") || 1);
  const returnTo = getReturnTo(formData);

  if (!slug) {
    redirect(returnTo);
  }

  const items = await getCartCookieItems();
  const existing = items.find((item) => item.slug === slug);

  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + Math.max(1, quantity));
  } else {
    items.push({ slug, quantity: Math.max(1, Math.min(10, quantity)) });
  }

  await setCartCookieItems(items);
  revalidatePath("/cart");
  revalidatePath(returnTo.split("?")[0] || "/");
  redirect(withAddedToCart(returnTo));
}

export async function updateCartItemAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const items = await getCartCookieItems();
  const nextItems = items
    .map((item) => (item.slug === slug ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  await setCartCookieItems(nextItems);
  revalidatePath("/cart");
  redirect("/cart");
}

export async function removeRestrictedItemsAction() {
  const [items, cart] = await Promise.all([getCartCookieItems(), getCartSnapshot()]);
  const restrictedSlugs = new Set(
    cart.lines.filter((line) => line.product.restricted).map((line) => line.product.slug),
  );
  const nextItems = items.filter((item) => !restrictedSlugs.has(item.slug));

  await setCartCookieItems(nextItems);
  revalidatePath("/cart");
  revalidatePath("/checkout/verification");
  redirect("/cart");
}
