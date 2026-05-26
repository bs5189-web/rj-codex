import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), "utf8"));
}

test("page enhance enables first migration scope and leaves high risk features disabled", () => {
  const config = readJson("config/rj-codex.json");
  const features = config.pageEnhance?.features;

  assert.equal(config.pageEnhance?.enabled, true);
  assert.equal(features?.menu, true);
  assert.equal(features?.pluginEntryUnlock, true);
  assert.equal(features?.forcePluginInstall, true);
  assert.equal(features?.sessionDelete, true);
  assert.equal(features?.markdownExport, true);
  assert.equal(features?.projectMove, true);
  assert.equal(features?.timeline, true);
  assert.equal(features?.threadScrollRestore, true);
  assert.equal(features?.threadSort, true);

  assert.equal(features?.modelWhitelistUnlock, false);
  assert.equal(features?.zedRemoteOpen, false);
  assert.equal(features?.upstreamWorktreeCreate, false);
  assert.equal(features?.serviceTierControls, false);
});
