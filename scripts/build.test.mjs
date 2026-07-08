import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "dist", "tailscale-chinese.user.js");
const packageJson = JSON.parse(
  readFileSync(path.join(rootDir, "package.json"), "utf8"),
);

test("build emits a single installable userscript bundle", () => {
  const result = spawnSync(process.execPath, ["scripts/build.mjs"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    `expected build to succeed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.equal(existsSync(outputPath), true, "expected dist bundle to exist");

  const output = readFileSync(outputPath, "utf8");
  assert.match(output, /==UserScript==/);
  assert.match(
    output,
    new RegExp(`@name\\s+${escapeRegExp(packageJson.userscript.displayName)}`),
  );
  assert.match(
    output,
    new RegExp(`@version\\s+${escapeRegExp(packageJson.version)}`),
  );
  assert.match(output, /Tailscale Chinese userscript bootstrapped/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
