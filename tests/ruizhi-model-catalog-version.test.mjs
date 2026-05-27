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

test("DeepSeek V4 chat models only advertise UniAPI-compatible options", () => {
  const catalog = JSON.parse(readProjectFile("resources/ruizhi-model-catalog.json"));
  const config = JSON.parse(readProjectFile("config/rj-codex.json"));
  const slugs = ["deepseek-v4-pro", "deepseek-v4-flash-maxthink", "DeepSeek-V4-Flash"];

  for (const slug of slugs) {
    const model = catalog.models.find((entry) => entry.slug === slug);
    assert.ok(model, `${slug} should exist in the model catalog`);
    assert.equal(model.default_verbosity, "medium", `${slug} should use the only supported verbosity`);
    assert.equal(model.apply_patch_tool_type, undefined, `${slug} must not advertise custom apply_patch tools`);
    assert.equal(model.web_search_tool_type, undefined, `${slug} must not advertise custom web_search tools`);
    assert.equal(config.modelBridge.routes[slug]?.protocol, "chat", `${slug} should route through chat bridge`);
  }
});

test("desktop bootstrap refreshes the Codex models cache from GitLab into Codex home", () => {
  const config = JSON.parse(readProjectFile("config/rj-codex.json"));

  assert.equal(
    config.models.remoteCatalogUrl,
    "http://gitlab.dokploy.ruijie.com.cn/marketplace/ruijie-codex/-/raw/main/model-catalog.json?inline=false"
  );

  for (const scriptPath of ["scripts/build-windows.mjs", "scripts/build-macos.mjs"]) {
    const source = readProjectFile(scriptPath);

    assert.match(source, /const modelCatalogRemoteUrl=\$\{jsonLiteral\(modelCatalogRemoteUrl\(\)\)\};/);
    assert.match(source, /const userModelCatalogFile="models_cache\.json";/);
    assert.match(source, /setTimeout\(\(\)=>\{/);
    assert.match(source, /downloadRemoteModelCatalog\(modelCatalogRemoteUrl,temp\);/);
    assert.match(source, /normalizeModelCatalogFile\(temp\);/);
    assert.match(source, /function normalizeModelCatalogFile\(filePath\)/);
    assert.match(source, /catalog\.fetched_at=new Date\(\)\.toISOString\(\);/);
    assert.match(source, /catalogPath:path\.join\(codexHome,userModelCatalogFile\)/);
    assert.doesNotMatch(source, /const userModelCatalogFile="model-catalog\.json";/);
    assert.doesNotMatch(source, /catalogPath:path\.join\(resourcesRoot,"models",modelCatalogFile\)/);
  }

  const asarPatchSource = readProjectFile("scripts/windows-asar-overrides.mjs");
  assert.match(asarPatchSource, /const userModelCatalogFile="models_cache\.json";/);
  assert.match(asarPatchSource, /setTimeout\(\(\)=>\{/);
  assert.match(asarPatchSource, /normalizeModelCatalogFile\(temp\);/);
  assert.match(asarPatchSource, /function normalizeModelCatalogFile\(filePath\)/);
  assert.match(asarPatchSource, /catalog\.fetched_at=new Date\(\)\.toISOString\(\);/);
  assert.match(asarPatchSource, /catalogPath:path\.join\(codexHome,userModelCatalogFile\)/);
  assert.doesNotMatch(asarPatchSource, /const userModelCatalogFile="model-catalog\.json";/);
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
