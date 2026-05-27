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

test("model catalog source version is pinned to the current Codex runtime series", () => {
  const catalog = JSON.parse(readProjectFile("resources/ruizhi-model-catalog.json"));

  assert.equal(catalog.client_version, "0.133.0");
});

test("macOS build rewrites runtime model catalog with bundled Codex version", () => {
  const source = readProjectFile("scripts/build-macos.mjs");

  assert.match(source, /writeRuntimeModelCatalog/);
  assert.match(source, /codexClientVersionFromExe/);
  assert.match(source, /writeRuntimeModelCatalog\(\s*modelCatalogPath\(\),\s*path\.join\(modelTargetDir,\s*"ruizhi-model-catalog\.json"\),\s*codexClientVersion/s);
  assert.doesNotMatch(
    source,
    /fs\.copyFileSync\(modelCatalogPath\(\),\s*path\.join\(modelTargetDir,\s*"ruizhi-model-catalog\.json"\)\)/,
    "macOS build must not copy a stale source client_version into the runtime catalog"
  );
});

test("macOS build forces current model picker allowlist patch", () => {
  const source = readProjectFile("scripts/build-macos.mjs");

  assert.match(source, /function findOneFileByContent\(/);
  assert.match(source, /\/\^\(use-model-settings\|model-queries\)-\.\*\\\.js\$\/,/);
  assert.match(source, /\/useHiddenModels&&\[A-Za-z_\$\]\[\\w\$\]\*!==`amazonBedrock`\/,/);
  assert.match(source, /replaceRegex\(\s*source,\s*\/let \(\[A-Za-z_\$\]\[\\w\$\]\*\)=\[A-Za-z_\$\]\[\\w\$\]\*\\\.useHiddenModels&&\[A-Za-z_\$\]\[\\w\$\]\*!==`amazonBedrock`,\(\[A-Za-z_\$\]\[\\w\$\]\*\);\/,/s);
  assert.doesNotMatch(
    source,
    /replaceExactIfPresent\(source,\s*"let l=s\.useHiddenModels&&a!==`amazonBedrock`,u;"/,
    "macOS build must not rely on the stale minified exact string for the model picker allowlist patch"
  );
});
