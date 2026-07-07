const baseUrl = process.env.LOAD_TEST_BASE_URL || process.env.APP_BASE_URL || "http://localhost:3000";
const vus = Number(process.env.LOAD_READ_VUS || 5);
const durationMs = Number(process.env.LOAD_READ_DURATION_MS || 15000);
const paths = ["/", "/products", process.env.LOAD_TEST_PRODUCT_PATH || "/products/arcguard-stun-device", "/cart", "/checkout"];
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
