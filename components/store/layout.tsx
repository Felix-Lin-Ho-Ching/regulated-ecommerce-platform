import Link from "next/link";
import { brand } from "@/lib/config/brand";

export function StoreHeader() {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link className="text-2xl font-black tracking-tight text-slate-950" href="/">
          {brand.name}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-4 text-sm font-bold">
          <Link href="/products">Shop</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/account">Account</Link>
          <Link href="/restricted-products-policy">Restricted policy</Link>
        </nav>
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

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      <StoreFooter />
    </>
  );
}
