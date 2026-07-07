# Developer checks

Use these commands to validate local changes before opening a pull request:

- `npm run typecheck` = real TypeScript check (`tsc --noEmit`).
- `npm run lint` = real lint check (ESLint/Next rules).
- `npm run lint:static` = static policy check for repo guardrails.
- `npm run build` = production build check (`next build`).
- `npm run smoke` = lightweight repo structure check.
- `npm run compliance:test` = compliance rule smoke test.
- `npm run concurrency:test` = order/payment concurrency smoke test.
- `npm run pipeline:test` = order pipeline smoke test.
- `npm run regression:test` = regression smoke test.
- `npm run launch:audit` = launch readiness audit, including the internal regression run.

Recommended full local gate on Windows PowerShell:

```powershell
npm install
npx prisma generate
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run lint:static
npm.cmd run smoke
npm.cmd run compliance:test
npm.cmd run concurrency:test
npm.cmd run pipeline:test
npm.cmd run regression:test
npm.cmd run launch:audit
npm.cmd run build
```

## Safe load testing

The load-test tooling is intentionally local/staging only. Checkout pressure tests require `LOAD_TEST_ENABLED=1` and refuse to run when `NODE_ENV=production`. They use only the local mock Authorize.net-shaped processor, debug email logs, deterministic load-test prefixes (`LOAD-` and `load-test-`), a TX shipping address, and an adult test buyer profile. No real payment credentials, real email sending, production checkout bypass, or external charges are used.

### Local read load test

1. Start the app and point it at a disposable local database:
   ```bash
   npm run dev
   ```
2. In another terminal, run:
   ```bash
   LOAD_TEST_BASE_URL=http://localhost:3000 LOAD_READ_VUS=5 LOAD_READ_DURATION_MS=15000 npm run load:read
   ```

`load:read` repeatedly requests the homepage, products page, product detail page, cart page, and checkout page. Override `LOAD_TEST_PRODUCT_PATH` if the seeded product detail slug differs in a staging database.

### Local checkout load test

Run the full local sequence against a non-production database:

```bash
NODE_ENV=development LOAD_TEST_ENABLED=1 LOAD_CHECKOUT_USERS=20 LOAD_TEST_STOCK=10000 npm run load:checkout
NODE_ENV=development LOAD_TEST_ENABLED=1 npm run load:verify
```

`load:checkout` deletes previous `LOAD-` / `load-test-` data, creates a dedicated high-stock restricted test product/category, submits approved mock-card orders with card `4111111111111111`, and submits decline cases for CVV `901`, ZIP `46282`, an expired card, and an invalid card. It verifies declined payments do not become shippable. `load:verify` then checks database integrity and removes load-test orders, products, users, reservations, payment attempts, and debug email logs by prefix.

### Staging load test

Use the same commands with staging-only secrets and a staging URL. Keep `NODE_ENV` set to a non-production value so the test-only checkout runner remains gated:

```bash
LOAD_TEST_BASE_URL=https://staging.example.com LOAD_READ_VUS=10 LOAD_READ_DURATION_MS=30000 npm run load:read
NODE_ENV=staging LOAD_TEST_ENABLED=1 LOAD_CHECKOUT_USERS=50 LOAD_TEST_STOCK=50000 npm run load:checkout
NODE_ENV=staging LOAD_TEST_ENABLED=1 npm run load:verify
```

For a complete disposable run where the app is already running:

```bash
NODE_ENV=staging LOAD_TEST_ENABLED=1 LOAD_TEST_BASE_URL=https://staging.example.com npm run load:full
```

### Metrics to watch

- HTTP status mix and error rate from `load:read`; any 5xx should be investigated.
- p95/p99 page latency at the application edge or reverse proxy.
- Database CPU, connection saturation, lock waits, and slow queries during checkout creation and reservation release.
- Inventory `reserved <= onHand` and active reservation counts after checkout pressure.
- Payment-attempt status distribution: approved local mock payments should release to `PAID` / `READY_TO_SHIP`; decline cases must stay `PAYMENT_FAILED` / `FULFILLMENT_HOLD`.
- Debug email-log completeness for customer order confirmations and shipment notices.
- Absence of raw PAN/CVV values in payment-attempt records and logs.

### Recommended starting thresholds

- Local laptop: `LOAD_READ_VUS=5`, `LOAD_READ_DURATION_MS=15000`, `LOAD_CHECKOUT_USERS=20`.
- Small staging instance: `LOAD_READ_VUS=10`, `LOAD_READ_DURATION_MS=30000`, `LOAD_CHECKOUT_USERS=50`.
- Increase by 2x only after `npm run load:verify` passes, no 5xx responses occur, and database CPU/connection utilization remain below roughly 70% sustained.
- Stop immediately if any order, payment, inventory, fulfillment, or email-log integrity assertion fails.
