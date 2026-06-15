import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { getCustomerSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/account/logout-button";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import { getCartLineCount } from "@/lib/orders/order-service";
import { getStorefrontContent } from "@/lib/storefront-content/service";

function CartIcon({ count }: { count: number }) {
  return (
    <Link
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-lg text-slate-900 shadow-sm hover:border-teal-800"
      href="/cart"
      aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}
    >
      <span aria-hidden="true">🛒</span>
      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-teal-800 px-1.5 py-0.5 text-center text-[0.68rem] font-black leading-none text-white">
        {count}
      </span>
    </Link>
  );
}

export async function StoreHeader() {
  const [session, cart, content] = await Promise.all([
    getCustomerSession(),
    getCartSnapshot(),
    getStorefrontContent(),
  ]);
  const cartCount = getCartLineCount(cart);
  const announcement = content.announcementBarText || "Free shipping on qualifying orders";

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-bold uppercase tracking-[.18em] text-stone-100">
        {announcement}
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap">
        <Link className="shrink-0 text-2xl font-black tracking-tight text-teal-950" href="/">
          {brand.name}
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-black text-slate-700 lg:flex">
          <Link className="hover:text-teal-900" href="/products">Shop</Link>
          <Link className="hover:text-teal-900" href="/my-state">My State</Link>
          <Link className="hover:text-teal-900" href="/">About Us</Link>
          <Link className="hover:text-teal-900" href="/shipping-policy">Resources</Link>
        </nav>
        <div className="order-3 hidden w-full justify-end sm:flex lg:order-none lg:ml-auto lg:w-auto">
          <label className="relative w-full max-w-[14rem] lg:w-52">
            <span className="sr-only">Search products</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true">⌕</span>
            <input className="h-9 w-full rounded-full border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-sm shadow-inner transition focus:border-teal-800 focus:bg-white" placeholder="Search" type="search" />
          </label>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <Link className="hidden rounded-full px-2 py-2 text-sm font-bold text-slate-700 hover:bg-stone-100 sm:inline-flex" href={session ? "/account" : "/account/login"} aria-label="Account">
            <span aria-hidden="true">👤</span><span className="ml-1 hidden xl:inline">Account</span>
          </Link>
          <Link className="hidden rounded-full px-2 py-2 text-sm font-bold text-slate-700 hover:bg-stone-100 sm:inline-flex" href="/restricted-products-policy" aria-label="Help and policy information">
            <span aria-hidden="true">ⓘ</span><span className="ml-1 hidden xl:inline">Help</span>
          </Link>
          {session ? <LogoutButton /> : null}
          <CartIcon count={cartCount} />
          <details className="relative lg:hidden">
            <summary className="list-none rounded-full border border-stone-200 px-3 py-2 text-sm font-black">Menu</summary>
            <div className="absolute right-0 mt-2 grid w-52 gap-2 rounded-2xl border border-stone-200 bg-white p-3 text-sm font-bold shadow-xl">
              <Link href="/products">Shop</Link>
              <Link href="/my-state">My State</Link>
              <Link href="/">About Us</Link>
              <Link href="/shipping-policy">Resources</Link>
              <Link href={session ? "/account" : "/account/login"}>Account</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-slate-600 md:grid-cols-4">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/shipping-policy">Shipping policy</Link>
        <Link href="/returns-policy">Returns policy</Link>
      </div>
    </footer>
  );
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <StoreFooter />
    </>
  );
}
