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

test("runtime defaults share Codex home and Electron user data directories", () => {
  const config = JSON.parse(readProjectFile("config/rj-codex.json"));
  assert.equal(config.runtime.defaultHomeDirName, ".codex");

  const sources = [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js"
  ];

  for (const sourcePath of sources) {
    const source = readProjectFile(sourcePath);
    assert.match(source, /["`]\.codex["`]/, `${sourcePath} should default CODEX_HOME to .codex`);
    assert.doesNotMatch(source, /path\.join\(home,\s*["`]\.ruizhi["`]\)/, `${sourcePath} should not default CODEX_HOME to .ruizhi`);
    assert.doesNotMatch(source, /p\.push\(["`]\.ruizhi["`]\)/, `${sourcePath} should not patch CLI default home to .ruizhi`);
    assert.doesNotMatch(source, /path\.join\([^)]*(?:APPDATA|Application Support|XDG_CONFIG_HOME)[^)]*,\s*productName\)/s, `${sourcePath} should not default Electron userData to the Ruizhi product name`);
  }
});
