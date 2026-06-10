import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { applyRuizhiModelCatalogCompatibilityPatches } from "../scripts/windows-asar-overrides.mjs";

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

test("Qwen Responses models keep Codex desktop plugin-control guidance", () => {
  const catalog = JSON.parse(readProjectFile("resources/ruizhi-model-catalog.json"));
  const slugs = ["qwen3.6-plus", "qwen3.6-flash", "qwen3-coder-plus"];

  for (const slug of slugs) {
    const model = catalog.models.find((entry) => entry.slug === slug);
    assert.ok(model, `${slug} should exist in the model catalog`);
    const instructionSources = [
      model.base_instructions,
      model.model_messages?.instructions_template,
    ].filter((value) => typeof value === "string");

    assert.ok(instructionSources.length > 0, `${slug} should carry runtime instructions`);
    for (const source of instructionSources) {
      assert.match(source, /\[@浏览器\]/, `${slug} should recognize the Browser plugin mention`);
      assert.match(source, /plugin:\/\/browser@openai-bundled/, `${slug} should recognize the Browser plugin URI`);
      assert.match(source, /mcp__node_repl__js/, `${slug} should steer Browser work to the trusted Node REPL tool`);
      assert.match(source, /exec_command/, `${slug} should explicitly avoid shelling out for Browser control`);
    }
  }
});

test("model catalog compatibility defaults missing modalities to text and image", () => {
  const catalog = {
    models: [
      { slug: "api-model-without-modalities", visibility: "list" },
      { slug: "api-model-text-only", visibility: "list", input_modalities: ["text"] },
    ],
  };

  applyRuizhiModelCatalogCompatibilityPatches(catalog);

  assert.deepEqual(catalog.models[0].input_modalities, ["text", "image"]);
  assert.deepEqual(catalog.models[0].inputModalities, ["text", "image"]);
  assert.deepEqual(catalog.models[1].input_modalities, ["text"]);
  assert.deepEqual(catalog.models[1].inputModalities, ["text"]);
});

test("model catalog compatibility preserves full reasoning level lists", () => {
  const supportedReasoningLevels = [
    { effort: "minimal", description: "最少推理" },
    { effort: "low", description: "轻量推理" },
    { effort: "medium", description: "标准推理" },
    { effort: "high", description: "深度推理" },
    { effort: "xhigh", description: "最高推理" },
  ];
  const catalog = {
    models: [
      {
        slug: "api-model-full-reasoning",
        visibility: "list",
        supported_reasoning_levels: supportedReasoningLevels.map((entry) => ({ ...entry })),
      },
    ],
  };

  applyRuizhiModelCatalogCompatibilityPatches(catalog);

  assert.deepEqual(catalog.models[0].supported_reasoning_levels, supportedReasoningLevels);
  assert.deepEqual(catalog.models[0].supportedReasoningEfforts, [
    { reasoningEffort: "minimal", description: "最少推理" },
    { reasoningEffort: "low", description: "轻量推理" },
    { reasoningEffort: "medium", description: "标准推理" },
    { reasoningEffort: "high", description: "深度推理" },
    { reasoningEffort: "xhigh", description: "最高推理" },
  ]);
});

test("model catalog compatibility fills empty reasoning levels for API catalogs", () => {
  const catalog = {
    models: [
      {
        slug: "api-model-empty-reasoning",
        visibility: "list",
        supported_reasoning_levels: [],
      },
    ],
  };

  applyRuizhiModelCatalogCompatibilityPatches(catalog);

  assert.deepEqual(
    catalog.models[0].supported_reasoning_levels.map((entry) => entry.effort),
    ["minimal", "low", "medium", "high", "xhigh"],
  );
  assert.deepEqual(
    catalog.models[0].supportedReasoningEfforts.map((entry) => entry.reasoningEffort),
    ["minimal", "low", "medium", "high", "xhigh"],
  );
  assert.equal(catalog.models[0].default_reasoning_level, "medium");
  assert.equal(catalog.models[0].defaultReasoningEffort, "medium");
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
    assert.match(source, /syncBundledModelCatalogCache\(\);/);
    assert.match(source, /function bundledModelCatalogPath\(\)/);
    assert.match(source, /path\.join\(resourcesRoot,"models",modelCatalogFile\)/);
    assert.match(source, /writeModelCatalogCacheFromSource\(bundledModelCatalogPath\(\),target\)/);
    assert.match(source, /downloadRemoteModelCatalog\(modelCatalogRemoteUrl,temp\);/);
    assert.match(source, /normalizeModelCatalogFile\(temp\);/);
    assert.match(source, /function normalizeModelCatalogFile\(filePath\)/);
    assert.match(source, /function applyRuizhiModelCatalogCompatibilityPatches\(catalog\)/);
    assert.match(source, /applyRuizhiModelCatalogCompatibilityPatches\(catalog\);/);
    assert.match(source, /model\.input_modalities=\["text","image"\]/);
    assert.match(source, /model\.inputModalities=model\.input_modalities/);
    assert.match(source, /model\.supportedReasoningEfforts=model\.supported_reasoning_levels\.map/);
    assert.match(source, /model\.defaultReasoningEffort=model\.default_reasoning_level/);
    assert.match(source, /catalog\.fetched_at=new Date\(\)\.toISOString\(\);/);
    assert.match(source, /catalogPath:path\.join\(codexHome,userModelCatalogFile\)/);
    assert.doesNotMatch(source, /const userModelCatalogFile="model-catalog\.json";/);
    assert.doesNotMatch(source, /catalogPath:path\.join\(resourcesRoot,"models",modelCatalogFile\)/);
  }

  const asarPatchSource = readProjectFile("scripts/windows-asar-overrides.mjs");
  assert.match(asarPatchSource, /const userModelCatalogFile="models_cache\.json";/);
  assert.match(asarPatchSource, /setTimeout\(\(\)=>\{/);
  assert.match(asarPatchSource, /syncBundledModelCatalogCache\(\);/);
  assert.match(asarPatchSource, /function bundledModelCatalogPath\(\)/);
  assert.match(asarPatchSource, /path\.join\(resourcesRoot,"models",modelCatalogFile\)/);
  assert.match(asarPatchSource, /writeModelCatalogCacheFromSource\(bundledModelCatalogPath\(\),target\)/);
  assert.match(asarPatchSource, /normalizeModelCatalogFile\(temp\);/);
  assert.match(asarPatchSource, /function normalizeModelCatalogFile\(filePath\)/);
  assert.match(asarPatchSource, /function applyRuizhiModelCatalogCompatibilityPatches\(catalog\)/);
  assert.match(asarPatchSource, /applyRuizhiModelCatalogCompatibilityPatches\(catalog\);/);
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
  assert.match(source, /\/\^\(use-model-settings\|model-queries\|models-and-reasoning-efforts\)-\.\*\\\.js\$\/,/);
  assert.match(source, /const modelAvailabilityAllowlistPattern = \/&&\[A-Za-z_\$\]\[\\w\$\]\*!==`amazonBedrock`\//);
  assert.ok(source.includes('"!1"'), "macOS build should disable the available_models allowlist condition");
  assert.match(source, /\(\?:\\\.useHiddenModels\)\?/);
  assert.doesNotMatch(
    source,
    /replaceExactIfPresent\(source,\s*"let l=s\.useHiddenModels&&a!==`amazonBedrock`,u;"/,
    "macOS build must not rely on the stale minified exact string for the model picker allowlist patch"
  );
});
