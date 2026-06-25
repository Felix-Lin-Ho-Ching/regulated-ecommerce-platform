"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAvailableStockBySlug, getCartCookieItems, getCartSnapshot, setCartCookieItems } from "@/lib/cart/cart-service";

function getReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") || "/products");
  return returnTo.startsWith("/") ? returnTo : "/products";
}

function withCartMessage(returnTo: string, message: Record<string, string | number>) {
  const [pathname, search = ""] = returnTo.split("?");
  const params = new URLSearchParams(search);
  params.delete("added");
  params.delete("cartError");
  params.delete("cartNotice");
  params.delete("available");

  for (const [key, value] of Object.entries(message)) {
    params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function revalidateCartPaths(returnTo: string) {
  revalidatePath("/cart");
  revalidatePath(returnTo.split("?")[0] || "/");
}

export async function addToCartAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const quantity = Number(formData.get("quantity") || 1);
  const requestedQuantity = Math.max(1, Math.min(10, Math.floor(Number.isFinite(quantity) ? quantity : 1)));
  const returnTo = getReturnTo(formData);

  if (!slug) {
    redirect(withCartMessage(returnTo, { cartError: "not-found" }));
  }

  const { product, available } = await getAvailableStockBySlug(slug);

  if (!product) {
    redirect(withCartMessage(returnTo, { cartError: "not-found" }));
  }

  if (available <= 0) {
    redirect(withCartMessage(returnTo, { cartError: "out-of-stock" }));
  }

  const items = await getCartCookieItems();
  const existing = items.find((item) => item.slug === slug);
  const existingQuantity = existing?.quantity ?? 0;
  const nextQuantity = Math.min(available, existingQuantity + requestedQuantity);
  const adjusted = nextQuantity < existingQuantity + requestedQuantity;

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    items.push({ slug, quantity: nextQuantity });
  }

  await setCartCookieItems(items);
  revalidateCartPaths(returnTo);
  redirect(withCartMessage(returnTo, adjusted ? { cartNotice: "adjusted", available } : { added: 1 }));
}

export async function updateCartItemAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const rawQuantity = Number(formData.get("quantity") || 0);
  const quantity = Math.floor(Number.isFinite(rawQuantity) ? rawQuantity : 0);
  const items = await getCartCookieItems();

  if (!slug) {
    redirect("/cart?cartError=not-found");
  }

  if (quantity <= 0) {
    await setCartCookieItems(items.filter((item) => item.slug !== slug));
    revalidatePath("/cart");
    redirect("/cart");
  }

  const { product, available } = await getAvailableStockBySlug(slug);

  if (!product) {
    await setCartCookieItems(items.filter((item) => item.slug !== slug));
    revalidatePath("/cart");
    redirect("/cart?cartError=not-found");
  }

  if (available <= 0) {
    await setCartCookieItems(items.filter((item) => item.slug !== slug));
    revalidatePath("/cart");
    redirect("/cart?cartError=out-of-stock");
  }

  const adjustedQuantity = Math.min(quantity, available, 10);
  const nextItems = items.map((item) => (item.slug === slug ? { ...item, quantity: adjustedQuantity } : item));

  await setCartCookieItems(nextItems);
  revalidatePath("/cart");
  redirect(adjustedQuantity < quantity ? `/cart?cartNotice=adjusted&available=${available}` : "/cart");
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
