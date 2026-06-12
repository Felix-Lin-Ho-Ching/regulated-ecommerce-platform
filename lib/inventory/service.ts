import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { getCatalogProducts } from "@/lib/db/catalog";

export type InventoryAdminRow = {
  inventoryId: string;
  variantId: string;
  sku: string;
  productName: string;
  restricted: boolean;
  onHand: number;
  reserved: number;
  available: number;
};

export async function getInventoryRows(): Promise<InventoryAdminRow[]> {
  if (!isDatabaseConfigured) {
    const products = await getCatalogProducts();
    return products.map((product) => ({
      inventoryId: product.variantId,
      variantId: product.variantId,
      sku: product.sku,
      productName: product.name,
      restricted: product.restricted,
      onHand: product.stock,
      reserved: product.reserved,
      available: Math.max(0, product.stock - product.reserved),
    }));
  }

  const rows = await prisma.inventory.findMany({
    include: { variant: { include: { product: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((inventory: any) => ({
    inventoryId: inventory.id,
    variantId: inventory.variantId,
    sku: inventory.variant.sku,
    productName: inventory.variant.product.name,
    restricted: inventory.variant.product.restricted,
    onHand: inventory.onHand,
    reserved: inventory.reserved,
    available: Math.max(0, inventory.onHand - inventory.reserved),
  }));
}

export async function adjustInventory(inventoryId: string, nextOnHand: number, reason: string) {
  if (!isDatabaseConfigured) return;

  const current = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!current) throw new Error("Inventory record not found.");

  const delta = nextOnHand - current.onHand;
  await (prisma as any).$transaction([
    prisma.inventory.update({ where: { id: inventoryId }, data: { onHand: nextOnHand } }),
    prisma.inventoryTransaction.create({
      data: {
        inventoryId,
        type: "ADJUSTMENT",
        quantity: delta,
        reason,
      },
    }),
  ]);
}
