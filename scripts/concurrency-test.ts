import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const runId = `CONC-${Date.now()}`;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  if (!process.env.DATABASE_URL) return;
  const products: any[] = await prisma.product.findMany({ where: { slug: { startsWith: "concurrency-test-" } }, include: { variants: true } });
  const variantIds = products.flatMap((product) => product.variants.map((variant: any) => variant.id));
  if (variantIds.length) {
    const inventoryIds = (await prisma.inventory.findMany({ where: { variantId: { in: variantIds } }, select: { id: true } })).map((inventory: any) => inventory.id);
    if (inventoryIds.length) {
      await prisma.inventoryReservation.deleteMany({ where: { inventoryId: { in: inventoryIds } } });
      await prisma.inventoryTransaction.deleteMany({ where: { inventoryId: { in: inventoryIds } } });
    }
    await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
    await prisma.productVariant.deleteMany({ where: { id: { in: variantIds } } });
  }
  await prisma.product.deleteMany({ where: { slug: { startsWith: "concurrency-test-" } } });
}

async function makeInventory(stock: number) {
  const product = await prisma.product.create({ data: { slug: `concurrency-test-${runId}-${stock}`, brand: "Test", name: `Concurrency ${stock}`, category: "personal_safety_alarm", description: "Concurrency stock test", status: "ACTIVE", restricted: false } });
  const variant = await prisma.productVariant.create({ data: { productId: product.id, sku: `${runId}-${stock}`, name: "Default", priceCents: 1000, status: "ACTIVE", inventory: { create: { onHand: stock, reserved: 0 } } }, include: { inventory: true } });
  if (!variant.inventory) throw new Error("Inventory not created");
  return variant.inventory.id;
}

async function reserveOne(inventoryId: string) {
  return (prisma as any).$transaction(async (tx: any) => {
    const rows = await tx.$queryRaw`UPDATE "Inventory" SET "reserved" = "reserved" + 1, "updatedAt" = NOW() WHERE id = ${inventoryId} AND ("onHand" - "reserved") >= 1 RETURNING id`;
    if (rows.length !== 1) return false;
    const inventory = await tx.inventory.findUniqueOrThrow({ where: { id: inventoryId } });
    if (inventory.reserved > inventory.onHand) throw new Error("Oversell detected inside transaction.");
    await tx.inventoryTransaction.create({ data: { inventoryId, type: "RESERVATION", quantity: 1, reason: `${runId} concurrency reservation` } });
    return true;
  });
}

async function scenario(stock: number, buyers: number, expected: number) {
  const inventoryId = await makeInventory(stock);
  const results = await Promise.all(Array.from({ length: buyers }, () => reserveOne(inventoryId)));
  const success = results.filter(Boolean).length;
  const inventory = await prisma.inventory.findUniqueOrThrow({ where: { id: inventoryId } });
  assert(success === expected, `Expected ${expected} successful reservations for ${stock} stock, got ${success}.`);
  assert(inventory.reserved === expected, `Expected reserved=${expected}, got ${inventory.reserved}.`);
  assert(inventory.reserved <= inventory.onHand, `Oversell detected: reserved ${inventory.reserved} > onHand ${inventory.onHand}.`);
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for concurrency tests.");
  await cleanup();
  await scenario(100, 100, 100);
  await scenario(10, 100, 10);
  console.log("Concurrency reservation tests passed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await cleanup().catch(console.error); await prisma.$disconnect(); });
