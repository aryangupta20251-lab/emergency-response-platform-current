import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCorsOrigins } from "../src/config/env.js";

test("CORS origin configuration is restricted to explicit HTTP(S) origins", async (context) => {
  await context.test("defaults to local web development origins", () => {
    assert.deepEqual(parseCorsOrigins(undefined), [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]);
  });

  await context.test("accepts, normalizes, and deduplicates configured origins", () => {
    assert.deepEqual(
      parseCorsOrigins(" http://localhost:5173/,http://192.168.1.25:5173,http://localhost:5173 "),
      ["http://localhost:5173", "http://192.168.1.25:5173"],
    );
  });

  await context.test("rejects wildcard, non-HTTP, path, and credential values", () => {
    for (const setting of [
      "*",
      "ftp://localhost:5173",
      "http://localhost:5173/app",
      "http://user:password@localhost:5173",
    ]) {
      assert.throws(() => parseCorsOrigins(setting), /CORS_ORIGIN/);
    }
  });
});
