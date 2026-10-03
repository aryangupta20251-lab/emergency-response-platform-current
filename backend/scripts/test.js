import "dotenv/config";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function isDedicatedTestDatabase(connectionString) {
  try {
    const url = new URL(connectionString);
    const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    return /^postgres(?:ql)?:$/.test(url.protocol)
      && /(^|[-_])test($|[-_])/i.test(databaseName);
  } catch {
    return false;
  }
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
if (!testDatabaseUrl || !isDedicatedTestDatabase(testDatabaseUrl)) {
  console.error(
    'Set TEST_DATABASE_URL to a dedicated disposable PostgreSQL database whose name contains "test". Tests will not fall back to DATABASE_URL.',
  );
  process.exit(1);
}

const testEnvironment = {
  ...process.env,
  NODE_ENV: "test",
  PASSWORD_RESET_DELIVERY: "console",
  PASSWORD_RESET_URL: "http://localhost:5173/reset-password",
};
const testFiles = readdirSync(join(process.cwd(), "test"))
  .filter((fileName) => fileName.endsWith(".test.js"))
  .map((fileName) => join("test", fileName));
for (const args of [
  ["src/db/runMigrations.js"],
  ["--test", ...testFiles],
]) {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: testEnvironment,
    stdio: "inherit",
  });
  if (result.error) {
    console.error("Could not start the test command:", result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
