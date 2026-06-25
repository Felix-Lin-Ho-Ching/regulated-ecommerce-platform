# Developer checks

Use these commands to validate local changes before opening a pull request:

- `npm run typecheck` = real TypeScript check (`tsc --noEmit`).
- `npm run lint` = real lint check (ESLint/Next rules).
- `npm run build` = production build check (`next build`).
- `npm run smoke` = lightweight repo structure check.

Recommended local pre-commit/manual sequence:

```bash
npm install
npx prisma generate
npm run typecheck
npm run lint
npm run smoke
npm run test --if-present
npm run build
```
