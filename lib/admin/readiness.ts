import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

export type ReadinessCheck = {
  label: string;
  detail: string;
  ready: boolean;
};

export type ReadinessResult =
  | { available: true; checks: ReadinessCheck[] }
  | { available: false; message: string };

export async function getReadinessChecks(): Promise<ReadinessResult> {
  if (!isDatabaseConfigured) return { available: false, message: "Database unavailable." };

  try {
    const [restrictedProducts, stateRules, localRules, activeProducts, inventoryRows, fulfillmentSettings, recipients] = await Promise.all([
      prisma.product.count({ where: { restricted: true, archivedAt: null } }),
      prisma.stateRestrictionRule.count({ where: { archivedAt: null } }),
      prisma.localRestrictionRule.count({ where: { archivedAt: null } }),
      prisma.product.count({ where: { status: "ACTIVE", archivedAt: null } }),
      prisma.inventory.count(),
      prisma.fulfillmentSettings.count(),
      prisma.notificationRecipient.count({ where: { enabled: true } }),
    ]);

    return {
      available: true,
      checks: [
        { label: "Restricted products configured", detail: `${restrictedProducts} restricted product(s)`, ready: restrictedProducts > 0 },
        { label: "State block rules configured", detail: `${stateRules} state rule(s)`, ready: stateRules > 0 },
        { label: "ZIP/local block rules configured", detail: `${localRules} local rule(s)`, ready: localRules > 0 },
        { label: "Products have inventory", detail: `${activeProducts} active product(s), ${inventoryRows} inventory row(s)`, ready: activeProducts > 0 && inventoryRows > 0 },
        { label: "Fulfillment settings configured", detail: `${fulfillmentSettings} settings record(s)`, ready: fulfillmentSettings > 0 },
        { label: "Notification recipient configured", detail: `${recipients} enabled recipient(s)`, ready: recipients > 0 },
      ],
    };
  } catch {
    return { available: false, message: "Database unavailable." };
  }
}
