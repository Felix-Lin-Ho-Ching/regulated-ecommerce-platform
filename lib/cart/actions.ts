"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCartCookieItems, setCartCookieItems } from "@/lib/cart/cart-service";

function getReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/cart");
  return returnTo.startsWith("/") ? returnTo : "/cart";
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
  redirect(returnTo);
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
