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

Recommended local pre-commit/manual sequence:

```bash
npm install
npx prisma generate
npm run typecheck
npm run lint
npm run lint:static
npm run smoke
npm run compliance:test
npm run concurrency:test
npm run pipeline:test
npm run regression:test
npm run launch:audit
npm run build
```
