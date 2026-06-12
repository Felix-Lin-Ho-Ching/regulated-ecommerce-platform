import { AppShell, SectionHeader } from "@/components/ui";
import { CartView } from "@/components/cart/cart-view";
import { getCartSnapshot } from "@/lib/cart/cart-service";

export default async function Cart() {
  const cart = await getCartSnapshot();

  return (
    <AppShell>
      <SectionHeader eyebrow="Cart" title="Cart review">
        Review quantities, prices, subtotal, and restricted-product notices before shipping.
      </SectionHeader>
      <CartView cart={cart} />
    </AppShell>
  );
}
