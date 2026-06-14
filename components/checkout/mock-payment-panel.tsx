import Link from "next/link";
import { createMockOrderAction } from "@/lib/orders/actions";
import { AlertPanel } from "@/components/common/panels";

export function MockPaymentPanel() {
  return (
    <section className="card p-5">
      <AlertPanel title="Ready for payment review" tone="success">
        Eligibility is approved for payment review. Card entry is not enabled, and the button below records an approved order for review.
      </AlertPanel>
      <form action={createMockOrderAction} className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Place order
        </button>
        <Link className="btn btn-secondary" href="/checkout/failed">
          View payment review issue
        </Link>
      </form>
    </section>
  );
}
