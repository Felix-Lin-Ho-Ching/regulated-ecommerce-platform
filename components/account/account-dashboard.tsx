import Link from "next/link";
import type { CustomerSession } from "@/lib/auth/session";
import { StatusBadge } from "@/components/common/badge";
import { AlertPanel } from "@/components/common/panels";
import { LogoutButton } from "@/components/account/logout-button";

export function AccountDashboard({ session }: { session: CustomerSession }) {
  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusBadge tone={session.demo ? "warning" : "success"}>
              {session.demo ? "Demo local session" : "Customer account"}
            </StatusBadge>
            <h2 className="mt-3 text-2xl font-black">Welcome, {session.name}</h2>
            <p className="text-slate-600">{session.email}</p>
          </div>
          <LogoutButton />
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-3">
        <Link className="card p-5" href="/account/orders">
          <h2 className="font-black">Order history</h2>
          <p className="mt-2 text-sm text-slate-600">Review mock orders and compliance status.</p>
        </Link>
        <Link className="card p-5" href="/account/addresses">
          <h2 className="font-black">Saved addresses</h2>
          <p className="mt-2 text-sm text-slate-600">See the local shipping address used at checkout.</p>
        </Link>
        <section className="card p-5">
          <StatusBadge tone="warning">Verification placeholder</StatusBadge>
          <h2 className="mt-3 font-black">Compliance profile</h2>
          <p className="mt-2 text-sm text-slate-600">
            Age attestation, destination review, and document/admin-review status can be wired to
            durable records in a production environment.
          </p>
        </section>
      </div>
      <AlertPanel title="Restricted-product safeguards remain visible" tone="warning">
        Account pages preserve the compliance warnings needed for restricted-product orders while
        keeping the checkout payment step mock only.
      </AlertPanel>
    </div>
  );
}
