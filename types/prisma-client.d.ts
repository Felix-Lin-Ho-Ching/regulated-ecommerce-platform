declare module "@prisma/client" {
  type PrismaRecord = { id: string; [key: string]: unknown };
  type QueryArgs = Record<string, unknown>;
  type ModelDelegate = {
    findMany(args?: QueryArgs): Promise<PrismaRecord[]>;
    findFirst(args?: QueryArgs): Promise<PrismaRecord | null>;
    findUnique(args?: QueryArgs): Promise<PrismaRecord | null>;
    findUniqueOrThrow(args?: QueryArgs): Promise<PrismaRecord>;
    create(args?: QueryArgs): Promise<PrismaRecord>;
    upsert(args?: QueryArgs): Promise<PrismaRecord>;
  };

  export class PrismaClient {
    adminRole: ModelDelegate;
    adminUser: ModelDelegate;
    auditLog: ModelDelegate;
    coupon: ModelDelegate;
    inventory: ModelDelegate;
    inventoryTransaction: ModelDelegate;
    launchGate: ModelDelegate;
    membershipTier: ModelDelegate;
    paymentAttempt: ModelDelegate;
    product: ModelDelegate;
    productFeature: ModelDelegate;
    productFeatureRestrictionRule: ModelDelegate;
    productVariant: ModelDelegate;
    stateRestrictionRule: ModelDelegate;
    stateVerificationRule: ModelDelegate;
    verificationRequirement: ModelDelegate;
    verificationTemplate: ModelDelegate;

    constructor(options?: QueryArgs);
    $disconnect(): Promise<void>;
  }
}
