import { prisma } from "@/lib/db/prisma";

export type InventoryAvailability = {
  sku: string;
  onHand: number;
  reserved: number;
  available: number;
  canReserve: boolean;
};

type VariantWithInventory = {
  inventory: { onHand: number; reserved: number } | null;
};

export async function getInventoryAvailability(sku: string, quantity = 1): Promise<InventoryAvailability> {
  const variant = await prisma.productVariant.findUnique({
    where: { sku },
    include: { inventory: true },
  }) as VariantWithInventory | null;

  const onHand = variant?.inventory?.onHand ?? 0;
  const reserved = variant?.inventory?.reserved ?? 0;
  const available = Math.max(0, onHand - reserved);

  return { sku, onHand, reserved, available, canReserve: available >= quantity };
}
