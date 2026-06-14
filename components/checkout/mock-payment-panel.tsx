import Link from "next/link";
import { createMockOrderAction } from "@/lib/orders/actions";
import { AlertPanel } from "@/components/common/panels";

export function MockPaymentPanel() {
  return (
    <section className="card p-5">
      <AlertPanel title="Ready for payment review" tone="success">
        Payment will be completed after eligibility approval. Confirm your order request for
        review; no card information is collected.
      </AlertPanel>
      <form action={createMockOrderAction} className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Submit order request
        </button>
        <Link className="btn btn-secondary" href="/checkout/failed">
          Review eligibility issue
        </Link>
      </form>
    </section>
  );
}
