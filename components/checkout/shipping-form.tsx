import { saveShippingAction } from "@/lib/orders/actions";
import type { ShippingDraft } from "@/lib/orders/order-service";
import { AlertPanel } from "@/components/common/panels";

export function ShippingForm({ shipping }: { shipping: ShippingDraft }) {
  return (
    <form action={saveShippingAction} className="card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold">
          Full name
          <input className="input mt-2 focus-ring" defaultValue={shipping.name} name="name" />
        </label>
        <label className="block text-sm font-bold">
          Street address
          <input className="input mt-2 focus-ring" defaultValue={shipping.line1} name="line1" />
        </label>
        <label className="block text-sm font-bold">
          Apt, suite, or unit
          <input className="input mt-2 focus-ring" defaultValue={shipping.line2} name="line2" />
        </label>
        <label className="block text-sm font-bold">
          City
          <input className="input mt-2 focus-ring" defaultValue={shipping.city} name="city" />
        </label>
        <label className="block text-sm font-bold">
          State
          <select className="input mt-2 focus-ring" defaultValue={shipping.state} name="state">
            <option value="TX">TX</option>
            <option value="CA">CA</option>
            <option value="IL">IL</option>
            <option value="NY">NY</option>
            <option value="OR">OR</option>
          </select>
        </label>
        <label className="block text-sm font-bold">
          ZIP
          <input className="input mt-2 focus-ring" defaultValue={shipping.postalCode} name="postalCode" />
        </label>
        <label className="block text-sm font-bold">
          Phone
          <input className="input mt-2 focus-ring" defaultValue={shipping.phone} name="phone" />
        </label>
      </div>
      <div className="mt-5">
        <AlertPanel title="Local validation only" tone="success">
          This MVP normalizes the visible address locally for checkout flow testing. No address
          validation provider or external API is called.
        </AlertPanel>
      </div>
      <button className="btn btn-primary mt-5" type="submit">
        Continue to eligibility
      </button>
    </form>
  );
}
