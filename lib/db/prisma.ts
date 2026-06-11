type QueryArgs = Record<string, unknown>;

type ModelDelegate = {
  findMany(args?: QueryArgs): Promise<unknown[]>;
  findFirst(args?: QueryArgs): Promise<unknown | null>;
  findUnique(args?: QueryArgs): Promise<unknown | null>;
  findUniqueOrThrow(args?: QueryArgs): Promise<unknown>;
  create(args?: QueryArgs): Promise<unknown>;
  upsert(args?: QueryArgs): Promise<unknown>;
};

type DatabaseClient = {
  product: ModelDelegate;
  productVariant: ModelDelegate;
  stateRestrictionRule: ModelDelegate;
  stateVerificationRule: ModelDelegate;
  auditLog: ModelDelegate;
  $disconnect(): Promise<void>;
};

type RuntimeRequire = (moduleName: string) => unknown;

const globalForPrisma = globalThis as unknown as { prisma?: DatabaseClient };

function unavailableDelegate(modelName: string): ModelDelegate {
  const unavailable = async () => {
    throw new Error(`${modelName} requires DATABASE_URL and a generated Prisma client.`);
  };

  return {
    findMany: unavailable,
    findFirst: unavailable,
    findUnique: unavailable,
    findUniqueOrThrow: unavailable,
    create: unavailable,
    upsert: unavailable,
  };
}

function createUnavailableClient(): DatabaseClient {
  return {
    product: unavailableDelegate("product"),
    productVariant: unavailableDelegate("productVariant"),
    stateRestrictionRule: unavailableDelegate("stateRestrictionRule"),
    stateVerificationRule: unavailableDelegate("stateVerificationRule"),
    auditLog: unavailableDelegate("auditLog"),
    $disconnect: async () => undefined,
  };
}

function createPrismaClient(): DatabaseClient {
  if (!process.env.DATABASE_URL) return createUnavailableClient();

  const runtimeRequire = eval("require") as RuntimeRequire;
  const prismaModule = runtimeRequire("@prisma/client") as {
    PrismaClient: new (options?: QueryArgs) => DatabaseClient;
  };

  return new prismaModule.PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
