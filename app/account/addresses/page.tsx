import { AppShell, FormField, SectionHeader, AlertPanel } from "@/components/ui";
import { requireCustomerSession } from "@/lib/auth/session";
import { getShippingDraft } from "@/lib/orders/order-service";

export default async function Addresses() {
  await requireCustomerSession("/account/addresses");
  const shipping = await getShippingDraft();

  return (
    <AppShell>
      <SectionHeader eyebrow="Addresses" title="Saved addresses">
        Address storage is saved for checkout review and uses no external validation provider.
      </SectionHeader>
      <section className="card p-5">
        <FormField
          label="Validated address"
          value={`${shipping.line1}, ${shipping.city}, ${shipping.state} ${shipping.postalCode}`}
        />
        <div className="mt-4">
          <AlertPanel title="Validation status" tone="success">
            Destination review is available for checkout testing. Address validation
            remains out of scope.
          </AlertPanel>
        </div>
      </section>
    </AppShell>
  );
}
