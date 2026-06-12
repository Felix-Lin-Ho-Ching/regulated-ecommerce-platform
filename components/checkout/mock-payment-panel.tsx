import Link from "next/link";
import { createMockOrderAction } from "@/lib/orders/actions";
import { AlertPanel } from "@/components/common/panels";

export function MockPaymentPanel() {
  return (
    <section className="card p-5">
      <AlertPanel title="Ready for mock payment" tone="success">
        Eligibility is approved for the local MVP. No card fields are shown, no processor is called,
        and the button below only creates a mock approved order.
      </AlertPanel>
      <form action={createMockOrderAction} className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Create mock order
        </button>
        <Link className="btn btn-secondary" href="/checkout/failed">
          View mock failure state
        </Link>
      </form>
    </section>
  );
}
