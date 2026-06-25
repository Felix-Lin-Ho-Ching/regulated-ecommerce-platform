import { AppShell, SectionHeader } from "@/components/ui";
import { OnePageCheckout } from "@/components/checkout/one-page-checkout";
import { EmptyState } from "@/components/common/panels";
import { getCartSnapshot } from "@/lib/cart/cart-service";
import Link from "next/link";

export default async function Checkout({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const [cart, sp] = await Promise.all([getCartSnapshot(), searchParams]);

  return (
    <AppShell>
      <SectionHeader eyebrow="Checkout" title="Checkout">
        Enter your contact, delivery, shipping, and payment details on one page.
      </SectionHeader>
      {cart.lines.length === 0 ? (
        <EmptyState title="Your cart is empty">
          Add products to your cart before checkout.
          <Link className="btn btn-primary mt-5" href="/products">Shop products</Link>
        </EmptyState>
      ) : (
        <OnePageCheckout cart={cart} error={sp.error} message={sp.message} />
      )}
    </AppShell>
  );
}
