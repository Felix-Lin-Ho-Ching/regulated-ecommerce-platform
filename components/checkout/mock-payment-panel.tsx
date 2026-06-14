import Link from "next/link";
import { createMockOrderAction } from "@/lib/orders/actions";
import { AlertPanel } from "@/components/common/panels";

export function MockPaymentPanel() {
  return (
    <section className="card p-5">
      <AlertPanel title="Ready for payment review" tone="success">
        Eligibility is approved for payment review. No card fields are shown, no processor is called,
        and the button below creates a sample approved order.
      </AlertPanel>
      <form action={createMockOrderAction} className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Create sample order
        </button>
        <Link className="btn btn-secondary" href="/checkout/failed">
          View payment review issue
        </Link>
      </form>
    </section>
  );
}
