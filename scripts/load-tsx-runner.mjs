import { spawnSync } from "node:child_process";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/load-tsx-runner.mjs <script.ts>");
  process.exit(1);
}
const command = process.platform === "win32" ? "tsx.cmd" : "tsx";
const result = spawnSync(command, [target], {
  stdio: "inherit",
  env: { ...process.env, LOAD_TEST_ENABLED: "1" },
  shell: process.platform === "win32",
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
