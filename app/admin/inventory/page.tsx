import { InventoryAdjustmentForm } from "@/components/admin/inventory/inventory-adjustment-form";
import { AdminDataTable, AdminShell, StatusBadge } from "@/components/ui";
import { getInventoryRows } from "@/lib/inventory/service";

export default async function InventoryPage() {
  const rows = await getInventoryRows();

  return (
    <AdminShell title="Inventory" currentPath="/admin/inventory">
      <AdminDataTable
        columns={["SKU", "Product", "On hand", "Reserved", "Available", "Restricted", "Audit requirement"]}
        rows={rows.map((row) => [
          row.sku,
          row.productName,
          row.onHand,
          row.reserved,
          row.available,
          <StatusBadge key={`${row.inventoryId}-restricted`} tone={row.restricted ? "warning" : "success"}>
            {row.restricted ? "restricted" : "unrestricted"}
          </StatusBadge>,
          "Reason required for every adjustment",
        ])}
      />
      <InventoryAdjustmentForm rows={rows} />
    </AdminShell>
  );
}
