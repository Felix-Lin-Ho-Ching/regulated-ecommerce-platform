import Link from "next/link";
import { createMockOrderAction } from "@/lib/orders/actions";
import { AlertPanel } from "@/components/common/panels";

export function MockPaymentPanel() {
  return (
    <section className="card p-5">
      <AlertPanel title="Ready to submit" tone="success">
        Confirm your order request. No card information is collected.
      </AlertPanel>
      <form action={createMockOrderAction} className="mt-5 flex flex-wrap gap-3">
        <button className="btn btn-primary" type="submit">
          Submit order request
        </button>
        <Link className="btn btn-secondary" href="/cart">
          Return to cart
        </Link>
      </form>
    </section>
  );
}
