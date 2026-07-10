const baseUrl = process.env.LOAD_TEST_BASE_URL || process.env.APP_BASE_URL || "http://localhost:3000";
const vus = Number(process.env.LOAD_READ_VUS || 5);
const durationMs = Number(process.env.LOAD_READ_DURATION_MS || 15000);

function normalizePath(path) {
  return path.startsWith("/") ? path : `/${path}`;
}

async function findProductPath() {
  const overridePath = process.env.LOAD_TEST_PRODUCT_PATH;
  if (overridePath) return normalizePath(overridePath);

  if (!process.env.DATABASE_URL) {
    console.warn("LOAD_TEST_PRODUCT_PATH and DATABASE_URL are not set; skipping product-detail path.");
    return null;
  }

  let prisma;
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    const product = await prisma.product.findFirst({
      where: {
        archivedAt: null,
        status: { in: ["ACTIVE", "RESTRICTED_REVIEW"] },
      },
      orderBy: { createdAt: "asc" },
      select: { slug: true },
    });

    if (!product) {
      console.warn("No active or restricted-review product found; skipping product-detail path.");
      return null;
    }

    return `/products/${product.slug}`;
  } catch (error) {
    console.warn(`Unable to resolve product-detail path from Prisma; skipping product-detail path: ${error.message}`);
    return null;
  } finally {
    await prisma?.$disconnect();
  }
}

const productPath = await findProductPath();
const paths = ["/", "/products", ...(productPath ? [productPath] : []), "/cart", "/checkout"];
console.log(`load:read paths=${JSON.stringify(paths)}`);

const end = Date.now() + durationMs;
let ok = 0, fail = 0, loggedFailures = 0;
async function hit(path) {
  const started = Date.now();
  const res = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  const ms = Date.now() - started;
  if (res.status >= 200 && res.status < 400) ok++; else { fail++; if (loggedFailures++ < 20) console.error(`read ${path} -> ${res.status} in ${ms}ms`); }
}
async function worker(id) {
  let i = id;
  while (Date.now() < end) {
    try { await hit(paths[i++ % paths.length]); } catch (e) { fail++; if (loggedFailures++ < 20) console.error(`read error: ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: vus }, (_, i) => worker(i)));
console.log(`load:read completed base=${baseUrl} vus=${vus} durationMs=${durationMs} ok=${ok} fail=${fail}`);
if (fail) process.exitCode = 1;
