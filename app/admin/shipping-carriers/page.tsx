import { AdminShell, SectionHeader } from "@/components/ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/db/prisma";
import { ShippingCarrierForm, DisableShippingCarrierForm } from "@/components/admin/shipping-carriers/shipping-carrier-form";

export default async function ShippingCarriersPage() {
  const actor = await requireAdminSession("/admin/shipping-carriers");
  if (!["OWNER", "ADMIN"].includes(actor.role)) return <AdminShell title="Shipping carriers" currentPath="/admin/shipping-carriers"><p>Only owner/admin can manage shipping carriers.</p></AdminShell>;
  const carriers = await (prisma as any).shippingCarrier.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return <AdminShell title="Shipping carriers" currentPath="/admin/shipping-carriers"><SectionHeader eyebrow="Fulfillment config" title="Shipping carriers">Configure enabled carriers and tracking URL templates. Templates must include {"{{trackingNumber}"} and use HTTPS.</SectionHeader><section className="card mt-4 grid gap-3 p-5"><h2 className="font-black">Create carrier</h2><ShippingCarrierForm /></section><section className="mt-4 grid gap-3">{carriers.map((carrier: any) => <div className="card grid gap-3 p-5" key={carrier.id}><div className="flex items-center justify-between"><h2 className="font-black">{carrier.name} <span className="text-sm text-slate-500">({carrier.code})</span></h2>{carrier.enabled ? <DisableShippingCarrierForm id={carrier.id} /> : <span className="badge">Disabled</span>}</div><ShippingCarrierForm carrier={carrier} /></div>)}</section></AdminShell>;
}
