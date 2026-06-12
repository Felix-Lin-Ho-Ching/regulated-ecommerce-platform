type PrismaModelDelegate = Record<string, (...args: any[]) => any>;
type PrismaClientLike = Record<string, PrismaModelDelegate>;

type PrismaClientConstructor = new (options?: { log?: string[] }) => PrismaClientLike;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientLike };

function loadPrismaClient(): PrismaClientConstructor {
  const runtimeRequire = eval("require") as (moduleName: string) => {
    PrismaClient: PrismaClientConstructor;
  };
  return runtimeRequire("@prisma/client").PrismaClient;
}

function createPrismaClient() {
  const PrismaClient = loadPrismaClient();

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new Proxy({} as PrismaClientLike, {
    get(_target, property) {
      if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createPrismaClient();
      }

      return globalForPrisma.prisma[property as string];
    },
  });

export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
