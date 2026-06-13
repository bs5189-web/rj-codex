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

test("runtime defaults initialize Ruizhi home and isolate Electron user data", () => {
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
    assert.match(source, /["`]\.ruizhi["`]/, `${sourcePath} should default RUIZHI_HOME to .ruizhi`);
    assert.match(source, /process\.env\[ruizhiHomeEnvName\]=codexHome|process\.env\[authConfig\.ruizhiHomeEnvName\]/, `${sourcePath} should initialize RUIZHI_HOME`);
    assert.match(source, /process\.env\.CODEX_HOME\s*=\s*codexHome|process\.env\["CODEX_HOME"\]\s*=\s*codexHome/, `${sourcePath} should initialize CODEX_HOME to the Ruizhi runtime home`);
    assert.doesNotMatch(source, /const codexHome=[^;]*process\.env\.CODEX_HOME[^;]*path\.join\(home,ruizhiDefaultHomeDirName\)/, `${sourcePath} should not default Ruizhi home from CODEX_HOME`);
    assert.doesNotMatch(source, /p\.push\(["`]\.ruizhi["`]\)/, `${sourcePath} should not patch CLI default home to .ruizhi`);
    assert.match(source, /electronUserDataDirName/, `${sourcePath} should route Electron userData through the runtime setting`);
  }
});

test("bootstrap auto-registers bundled Ruizhi marketplaces for first launch", () => {
  const config = JSON.parse(readProjectFile("config/rj-codex.json"));

  assert.ok(config.pluginMarketplaces.length > 0, "test expects a bundled Ruizhi marketplace");
  assert.equal(config.pluginMarketplaces[0].name, "ruijie-marketplace");
  assert.equal(config.pluginMarketplaces[0].online.source, "https://github.com/bs5189-web/ruijie-marketplace.git");

  for (const sourcePath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js"
  ]) {
    const source = readProjectFile(sourcePath);

    assert.match(source, /function syncManagedMarketplaceConfig\(marketplaceSources\)/, `${sourcePath} should register local marketplaces in config.toml`);
    assert.match(source, /managedMarketplaceSpecs\(\)/, `${sourcePath} should only manage configured custom marketplaces`);
    assert.match(source, /marketplaceSpecs\.filter\(spec=>spec\.hardcodedPlugins!==true&&spec\.alwaysCopy!==true\)/, `${sourcePath} should not rewrite built-in OpenAI marketplaces`);
    assert.match(source, /const configPath=path\.join\((?:codexHome|home,"\.codex"),"config\.toml"\)/, `${sourcePath} should create the runtime config path on first launch`);
    assert.match(source, /fs\.existsSync\(configPath\)\?fs\.readFileSync\(configPath,"utf8"\):""/, `${sourcePath} should handle missing config.toml`);
    assert.match(source, /fs\.mkdirSync\(path\.dirname\(configPath\),\{recursive:true\}\)/, `${sourcePath} should create the config directory`);
    assert.match(source, /"\[marketplaces\."\+spec\.name\+"\]"/, `${sourcePath} should emit marketplace TOML tables`);
    assert.match(source, /tomlString\("local"\)/, `${sourcePath} should register local marketplace sources`);
    assert.match(source, /function marketplaceConfigBlock\(spec,source\)/, `${sourcePath} should register each marketplace once`);
    assert.match(source, /tomlString\("git"\)/, `${sourcePath} should emit Git marketplace sources`);
    assert.match(source, /"ref = "\+tomlString\(online\.ref\)/, `${sourcePath} should preserve the configured Git ref`);
    assert.match(source, /source=marketplaceSources\[spec\.sourceToken\]/, `${sourcePath} should require a synced offline snapshot before registration`);
    assert.match(source, /fs\.existsSync\(path\.join\(source,"\.agents","plugins","marketplace\.json"\)\)/, `${sourcePath} should only register valid synced marketplaces`);
    assert.match(source, /const existing(?:Ruizhi|Codex)Config=fs\.existsSync\(configPath\);\s*const marketplaceSources=syncMarketplaces\(\);/, `${sourcePath} should preserve first-launch detection before creating config.toml`);
    assert.match(source, /syncManagedMarketplaceConfig\(marketplaceSources\);\s*syncRuijieProviderChatModelPrefixes\(\);\s*syncInstalledOpenAIBundledPluginCache\(\);/, `${sourcePath} should patch provider prefixes before plugin UI reads config`);
  }
});
