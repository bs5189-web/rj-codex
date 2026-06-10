import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("runtime defaults use Ruizhi home but isolate Electron user data", () => {
  const config = JSON.parse(readProjectFile("config/rj-codex.json"));
  assert.equal(config.runtime.defaultHomeDirName, ".ruizhi");
  assert.equal(config.runtime.electronUserDataDirName, config.productName);
  assert.match(
    readProjectFile("scripts/build-macos.mjs"),
    /CFBundleName", "-string", "Codex"/,
    "macOS CFBundleName must stay Codex so Electron can find Codex Helper.app"
  );
  assert.match(
    readProjectFile("scripts/build-macos.mjs"),
    /CFBundleDisplayName", "-string", config\.productName/,
    "macOS display name should still show the Ruizhi product name"
  );

  const sources = [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js"
  ];

  for (const sourcePath of sources) {
    const source = readProjectFile(sourcePath);
    assert.match(source, /["`]\.ruizhi["`]/, `${sourcePath} should default CODEX_HOME to .ruizhi`);
    assert.match(source, /electronUserDataDirName/, `${sourcePath} should route Electron userData through the runtime setting`);
  }
});
