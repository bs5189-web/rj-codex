import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import os from "node:os";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const require = createRequire(import.meta.url);

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("renderer wires thread sorting and robust DOM adapters", () => {
  const source = read("resources/renderer/ruizhi-page-enhance.js");

  assert.match(source, /function installThreadSorting\(/);
  assert.match(source, /bridgeCall\("\/thread-sort-keys"/);
  assert.match(source, /data-ruizhi-sort-key/);
  assert.match(source, /function closestSessionRow\(/);
  assert.match(source, /function stableSessionIdFromElement\(/);
  assert.match(source, /function messageAuthorOf\(/);
  assert.match(source, /data-app-action-sidebar-thread-row/);
  assert.match(source, /data-app-action-sidebar-thread-title/);
  assert.match(source, /data-testid\*='conversation-turn'/);
  assert.match(source, /data-turn-key/);
  assert.match(source, /data-content-search-turn-key/);
  assert.match(source, /function threadScrollElement\(/);
  assert.match(source, /data-app-action-timeline-scroll/);
  assert.match(source, /RUIZHI_SETTINGS_VERSION_FIX_V1/);
  assert.match(source, /function installSettingsVersionFix\(/);
});

test("page enhance menu follows Codex surface and text tokens", () => {
  for (const scriptPath of [
    "resources/renderer/ruizhi-page-enhance.js",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /#ruizhi-page-enhance-menu \[data-trigger\]/, `${scriptPath} should style the trigger explicitly`);
    assert.match(source, /background:var\(--token-main-surface-primary,#fff/, `${scriptPath} should use Codex surface tokens with a light fallback`);
    assert.match(source, /color:var\(--token-text-primary,var\(--token-foreground,#0d0d0d\)\)/, `${scriptPath} should use Codex readable text tokens`);
    assert.match(source, /input\[type="checkbox"\]\{accent-color:var\(--token-text-link-foreground,#1f6feb\)/, `${scriptPath} should use Codex link accent for checks`);
    assert.doesNotMatch(source, /#ruizhi-page-enhance-menu button\{[^}]*#202123/, `${scriptPath} should not force the enhance menu into a dark fallback`);
    assert.doesNotMatch(source, /#ruizhi-page-enhance-menu \[data-panel\]\{[^}]*#202123/, `${scriptPath} should not force the enhance panel into a dark fallback`);
  }
});

test("session action click guard does not block action handlers", () => {
  for (const scriptPath of [
    "resources/renderer/ruizhi-page-enhance.js",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    const start = source.indexOf("function actionButton(");
    assert.notEqual(start, -1, `${scriptPath} should define actionButton`);
    const end = source.indexOf("async function exportMarkdown", start);
    assert.notEqual(end, -1, `${scriptPath} should define exportMarkdown after actionButton`);
    const actionButtonSource = source.slice(start, end);

    assert.match(actionButtonSource, /event\.preventDefault\(\)/, `${scriptPath} should keep sidebar rows from navigating when action buttons are clicked`);
    assert.match(actionButtonSource, /event\.stopPropagation\(\)/, `${scriptPath} should keep action clicks local to the injected button`);
    assert.doesNotMatch(actionButtonSource, /stopImmediatePropagation/, `${scriptPath} should not suppress the action button's own click handler`);
    assert.match(actionButtonSource, /button\.addEventListener\("click", handler, true\)/, `${scriptPath} should still invoke the action handler on click`);
  }
});

test("session actions only expose compact Markdown export", () => {
  for (const scriptPath of [
    "resources/renderer/ruizhi-page-enhance.js",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /sessionDelete:\s*false/, `${scriptPath} should retire session delete by default`);
    assert.match(source, /projectMove:\s*false/, `${scriptPath} should retire session migration by default`);
    assert.match(source, /\.ruizhi-session-actions button\{width:20px;height:20px/, `${scriptPath} should use a smaller export button`);
    assert.match(source, /group\.appendChild\(actionButton\("导出", "⇩", \(\) => exportMarkdown\(ref\)\)\)/, `${scriptPath} should keep Markdown export`);
    assert.doesNotMatch(source, />删除会话<input type="checkbox" data-feature="sessionDelete"/, `${scriptPath} should not show the delete toggle`);
    assert.doesNotMatch(source, />项目移动<input type="checkbox" data-feature="projectMove"/, `${scriptPath} should not show the migration toggle`);
    assert.doesNotMatch(source, /openProjectMove\(ref\)/, `${scriptPath} should not append migration actions`);
    assert.doesNotMatch(source, /deleteSession\(ref\)/, `${scriptPath} should not append delete actions`);
    assert.doesNotMatch(source, /function openProjectMove\(/, `${scriptPath} should not include the retired migration overlay`);
  }
});

test("session export action leaves room for native pin and timestamp controls", () => {
  for (const scriptPath of [
    "resources/renderer/ruizhi-page-enhance.js",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /\.ruizhi-session-actions\{[^}]*right:72px/, `${scriptPath} should move export left of native pin and time controls`);
    assert.match(source, /\.ruizhi-session-actions\{[^}]*z-index:1/, `${scriptPath} should not overlay native row controls with a high z-index`);
    assert.match(source, /pointer-events:none/, `${scriptPath} should keep the injected action layer from intercepting native controls`);
    assert.match(source, /\.ruizhi-session-actions button\{[^}]*pointer-events:auto/, `${scriptPath} should keep the export button itself clickable`);
    assert.doesNotMatch(source, /right:28px/, `${scriptPath} should not place export in the native control area`);
  }
});

test("packaging preload hides update error text instead of rendering 更新失败", () => {
  for (const scriptPath of ["scripts/build-windows.mjs", "scripts/build-macos.mjs"]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /status==="error"\)return "更新失败"/, `${scriptPath} should not render update failure text`);
    assert.doesNotMatch(source, /textContent=.*更新失败/, `${scriptPath} should not render update failure text`);
  }
});

test("preload update integration leaves the native settings menu item untouched", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /findSettingsRow/, `${scriptPath} should not locate the native Settings row`);
    assert.doesNotMatch(source, /ruizhi-settings-update-row/, `${scriptPath} should not decorate the native Settings row`);
    assert.doesNotMatch(source, /ruizhi-update-status/, `${scriptPath} should not append update status into Settings`);
    assert.doesNotMatch(source, /设置\|Settings\|Preferences\|setting/, `${scriptPath} should not scan Settings labels`);
  }
});

test("first launch skips the APIKey prompt when Codex config already exists", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /function hasExistingCodexConfig\(/, `${scriptPath} should detect existing ~/.codex configuration`);
    assert.match(source, /config\.toml/, `${scriptPath} should treat config.toml as an existing Codex configuration marker`);
    assert.match(source, /RUIZHI_EXISTING_CODEX_CONFIG/, `${scriptPath} should preserve whether config.toml exists without mutating it`);
    assert.match(source, /configuredBy/, `${scriptPath} should report whether auth came from an API key or Codex config`);
    assert.match(source, /configured:key\.length>0\|\|existingConfig/, `${scriptPath} should skip the APIKey prompt when Codex config exists`);
  }

  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /ruizhi:auth:get-sync/, `${scriptPath} should expose cached auth status before the renderer mounts`);
    assert.match(source, /getCached:\(\)=>cachedAuthStatus/, `${scriptPath} should let the login bundle read cached auth status synchronously`);
  }

  const loginRoute = read("overrides/windows-app/asar/webview/assets/login-route-CUyUF9yR.js");
  assert.match(loginRoute, /window\.ruizhiDesktop\?\.auth\?\.getCached\?\.\(\)\?\.configured!==!0/);
  assert.doesNotMatch(loginRoute, /\[H,U\]=\(0,G\.useState\)\(!0\)/);
});

test("bootstrap treats config.toml as user-owned and never writes Ruizhi defaults", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /# BEGIN Ruizhi Managed Defaults/, `${scriptPath} should not embed a managed config.toml block`);
    assert.doesNotMatch(source, /mergeManagedConfig|stripManagedConfigConflicts|managedConfigSectionNames/, `${scriptPath} should not merge or rewrite config.toml`);
    assert.doesNotMatch(source, /configTemplateLines/, `${scriptPath} should not template config.toml defaults`);
    assert.doesNotMatch(source, /fs\.writeFileSync\(configPath/, `${scriptPath} should not write the user's config.toml`);
    assert.doesNotMatch(source, /fs\.writeFileSync\(target,\s*next,\s*"utf8"\)/, `${scriptPath} should not patch sandbox settings into config.toml`);
  }
});

test("page enhance preload loads the renderer module without CSP-blocked eval or inline script injection", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /globalThis\.ruizhiDesktop=api/, `${scriptPath} should provide the enhance bridge to preload world`);
    assert.match(source, /installRuizhiPageEnhance|pageEnhanceRendererInstallerSource/, `${scriptPath} should load the page enhance installer`);
    assert.match(source, /__RUIZHI_INSTALL_PAGE_ENHANCE__/, `${scriptPath} should use the inlined page enhance installer`);
    assert.doesNotMatch(source, /resourcesRoot=process\.resourcesPath[\s\S]{0,240}require\(scriptPath\)/, `${scriptPath} should not need Node fs/path from sandboxed preload`);
    const injectIndex = source.indexOf("function injectRuizhiPageEnhance()");
    assert.notEqual(injectIndex, -1, `${scriptPath} should define injectRuizhiPageEnhance`);
    const injectSnippet = source.slice(injectIndex, injectIndex + 700);
    assert.doesNotMatch(injectSnippet, /require\(scriptPath\)/, `${scriptPath} should not load external modules from sandboxed preload`);
    assert.doesNotMatch(source, /new Function\("window","document","ruizhiDesktop","__RUIZHI_PAGE_ENHANCE_CONFIG__","source",/, `${scriptPath} should not eval page enhance source`);
    assert.doesNotMatch(source, /runRuizhiPageEnhance/, `${scriptPath} should not evaluate page enhance source manually`);
    assert.doesNotMatch(source, /script\.textContent=.*RUIZHI_PAGE_ENHANCE_CONFIG/, `${scriptPath} should not inject an inline script`);
    assert.doesNotMatch(source, /appendChild\(script\)/, `${scriptPath} should not rely on DOM script injection`);
  }

  const rendererSource = read("resources/renderer/ruizhi-page-enhance.js");
  assert.match(rendererSource, /function installRuizhiPageEnhance\(/);
  assert.match(rendererSource, /module\.exports\s*=\s*\{\s*installRuizhiPageEnhance\s*\}/);
});

test("page enhance bootstrap carries the Ruizhi app version for settings display", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /appVersion[:,]/, `${scriptPath} should pass appVersion to page enhance`);
  }
});

test("enhance service returns appVersion and retires destructive session routes", async () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "ruizhi-enhance-"));
  try {
    const { createRuizhiEnhanceService } = require(path.join(projectRoot, "resources", "bridge", "ruizhi-enhance-service.cjs"));
    const service = createRuizhiEnhanceService({
      codexHome: tmpHome,
      config: {
        pageEnhance: {
          enabled: true,
          appVersion: "0.1.24",
          features: { timeline: false }
        }
      }
    });

    assert.equal(service.settings().appVersion, "0.1.24");
    assert.equal(service.settings().features.sessionDelete, false);
    assert.equal(service.settings().features.projectMove, false);
    const nextSettings = service.writeSettings({ features: { timeline: true, sessionDelete: true, projectMove: true } });
    assert.equal(nextSettings.appVersion, "0.1.24");
    assert.equal(nextSettings.features.sessionDelete, false);
    assert.equal(nextSettings.features.projectMove, false);
    assert.equal((await service.call("/delete", { session_id: "thread-1" })).status, "disabled");
    assert.equal((await service.call("/move-thread-workspace", { session_id: "thread-1", target_cwd: "/tmp" })).status, "disabled");
  } finally {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test("application menu translation preserves Codex Automations", () => {
  const source = read("scripts/windows-asar-overrides.mjs");

  assert.match(source, /"Automations":"自动化"/);
  assert.match(source, /ruizhiEnsureNativeMenuItems/);
  assert.match(source, /label:\\?`自动化\\?`/);
  assert.match(source, /[mr]\(e,\\?`\/automations\\?`\)/);
  assert.match(source, /label:\\?`设置…\\?`/);
  assert.match(source, /visible=!0/);
  assert.match(source, /enabled=!0/);
  assert.doesNotMatch(source, /Automations[^;\n]+(remove|delete|hidden|disabled)/i);
});

test("Windows packaging keeps native Settings and Automations actions visible without stale main overrides", () => {
  const source = read("scripts/windows-asar-overrides.mjs");
  const buildDir = path.join(projectRoot, "overrides", "windows-app", "asar", ".vite", "build");
  const mainBundle = fs.readdirSync(buildDir).find((name) => /^main-.*\.js$/.test(name));

  assert.match(source, /ruizhiEnsureNativeMenuItems/);
  assert.match(source, /label:\\?`自动化\\?`/);
  assert.match(source, /[mr]\(e,\\?`\/automations\\?`\)/);
  assert.match(source, /label:\\?`设置…\\?`/);
  assert.match(source, /visible=!0/);
  assert.match(source, /enabled=!0/);
  assert.doesNotMatch(source, /Plugins\s+-\s+Unlocked|插件\s+-\s+已解锁/);
  assert.equal(mainBundle, undefined, "Windows overrides should not keep a stale hashed main bundle");
});

test("macOS application menu keeps native Settings and Automations actions visible", () => {
  const source = read("scripts/build-macos.mjs");

  assert.match(source, /function patchApplicationMenu\(/);
  assert.match(source, /ruizhiTranslateApplicationMenu/);
  assert.match(source, /ruizhiEnsureNativeMenuItems/);
  assert.match(source, /label:\\?`自动化\\?`/);
  assert.match(source, /[mr]\(e,\\?`\/automations\\?`\)/);
  assert.match(source, /label:\\?`设置…\\?`/);
  assert.match(source, /settingsRoute:i/);
  assert.match(source, /[mr]\(e,i\)/);
  assert.match(source, /visible=!0/);
  assert.match(source, /enabled=!0/);
});

test("packaging opens Codex native settings gates including in-app Browser", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /ruizhiNativeFeatureGateValue/, `${scriptPath} should patch native feature gates`);
    assert.match(source, /3075919032/, `${scriptPath} should keep Codex native Automations nav visible`);
    assert.match(source, /4166894088/, `${scriptPath} should keep Codex native profile Settings visible`);
    assert.match(source, /410262010/, `${scriptPath} should make in-app Browser controls available`);
    assert.doesNotMatch(source, /1506311413/, `${scriptPath} should leave Computer Use controls to Codex defaults`);
    assert.doesNotMatch(source, /410065390/, `${scriptPath} should leave Google Chrome controls to Codex defaults`);
    assert.doesNotMatch(source, /querySelectorAll\([^)]*(自动化|Automations|settingsPage|general-settings)/, `${scriptPath} should not fake native sidebar/profile buttons with DOM insertion`);
  }
});

test("packaging enables Codex native Browser desktop availability without Browser runtime patches", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /patchNativeBrowserDesktopFeatureAvailability/, `${scriptPath} should patch desktop Browser availability`);
    assert.match(source, /ruizhiNativeBrowserDesktopFeatureAvailability/, `${scriptPath} should keep the Browser availability patch scoped`);
    assert.match(source, /browserPane:!0/, `${scriptPath} should allow the native Browser pane`);
    assert.match(source, /inAppBrowserUse:!0/, `${scriptPath} should enable the native in-app Browser backend`);
    assert.match(source, /inAppBrowserUseAllowed:!0/, `${scriptPath} should allow in-app Browser use`);
    assert.doesNotMatch(source, /ruizhiBrowserSettingsAvailability/, `${scriptPath} should not override Browser settings availability`);
    assert.doesNotMatch(source, /patchBrowserDesktopFeaturePayload/, `${scriptPath} should not patch Browser feature payloads`);
    assert.doesNotMatch(source, /patchBrowserSettingsAvailabilitySource/, `${scriptPath} should not patch Browser settings availability`);
  }

  const buildDir = path.join(projectRoot, "overrides", "windows-app", "asar", ".vite", "build");
  const mainBundle = fs.readdirSync(buildDir).find((name) => /^main-.*\.js$/.test(name));
  assert.equal(mainBundle, undefined, "Windows overrides should rely on build-time main bundle patching");

  for (const assetPath of [
    "overrides/windows-app/asar/webview/assets/browser-use-settings-CJBdA4SJ.js",
    "overrides/windows-app/asar/webview/assets/app-main-DeAkLLF9.js",
  ]) {
    const source = read(assetPath);
    assert.doesNotMatch(source, /ruizhiBrowser(Settings|Feature)Availability/, `${assetPath} should not carry Browser unlock patches`);
  }
});

test("packaging uses current OpenAI bundled plugin ids for Browser automation", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /\{\s*(?:"name"|name)\s*:\s*"browser"\s*,\s*(?:"path"|path)\s*:\s*"\.\/plugins\/browser"/, `${scriptPath} should bundle the current Browser plugin id`);
    assert.match(source, /\{\s*(?:"name"|name)\s*:\s*"latex"\s*,\s*(?:"path"|path)\s*:\s*"\.\/plugins\/latex"/, `${scriptPath} should bundle the current LaTeX plugin id`);
    assert.doesNotMatch(source, /\{\s*(?:"name"|name)\s*:\s*"browser-use"\s*,\s*(?:"path"|path)\s*:\s*"\.\/plugins\/browser-use"/, `${scriptPath} should not generate the retired browser-use plugin id`);
    assert.doesNotMatch(source, /\{\s*(?:"name"|name)\s*:\s*"latex-tectonic"\s*,\s*(?:"path"|path)\s*:\s*"\.\/plugins\/latex-tectonic"/, `${scriptPath} should not generate the retired latex-tectonic plugin id`);
  }
});

test("packaging bundles current OpenAI plugin metadata without writing config defaults", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /openAIBundledPluginDefinitions/, `${scriptPath} should keep the bundled OpenAI plugin catalog`);
    assert.doesNotMatch(source, /\[plugins\."\$\{plugin\.name\}@openai-bundled"\]/, `${scriptPath} should not write plugin enablement blocks to config.toml`);
  }

  const bootstrapSource = read("overrides/windows-app/asar/.vite/build/bootstrap.js");
  assert.ok(bootstrapSource.includes('"name":"browser"'), "bootstrap should carry the native Browser plugin id");
  assert.ok(bootstrapSource.includes('"name":"chrome"'), "bootstrap should carry the native Chrome plugin id");
  assert.ok(bootstrapSource.includes('"name":"latex"'), "bootstrap should carry the native LaTeX plugin id");
});

test("bootstrap leaves existing unmanaged Codex config untouched", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /stripManagedConfigConflicts/, `${scriptPath} should not strip user config.toml sections`);
    assert.doesNotMatch(source, /managedSectionNames/, `${scriptPath} should not maintain managed TOML sections`);
    assert.doesNotMatch(source, /managedBlock/, `${scriptPath} should not prepend managed defaults to config.toml`);
    assert.doesNotMatch(source, /rewriteRuntimeModelProviderBaseUrl/, `${scriptPath} should not rewrite model provider base URLs in config.toml`);
  }
});

test("packaging updates Codex bundled Browser native-pipe trust only", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /patchBrowserNativePipeStartup/, `${scriptPath} should not force Browser native pipe startup`);
    assert.doesNotMatch(source, /patchOpenAIBundledBrowserRuntime/, `${scriptPath} should not patch bundled Browser runtime scripts`);
    assert.match(source, /patchTrustedBrowserClientHashes/, `${scriptPath} should refresh Browser client trusted hashes`);
    assert.doesNotMatch(source, /ruizhiIabSessionFallback/, `${scriptPath} should not inject Browser IAB session fallback logic`);
  }

  const overrideSource = read("scripts/windows-asar-overrides.mjs");
  assert.doesNotMatch(overrideSource, /patchJsonFile\(path\.join\(pluginsRoot,\s*"browser"/, "Browser plugin.json should remain the official Codex file");
  assert.doesNotMatch(overrideSource, /writeTranslatedOpenAIPluginSkill\(\s*path\.join\(pluginsRoot,\s*"browser"/, "Browser SKILL.md should remain the official Codex file");
  assert.doesNotMatch(overrideSource, /const browserSkill = `# Browser/, "Browser skill previews should remain official");
});

test("packaging logs Browser native-pipe availability boundaries", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /ruizhiBrowserNativePipeLog/, `${scriptPath} should log Browser desktop availability input and output`);
    const nativePipeLogger = scriptPath === "scripts/build-windows.mjs"
      ? /patchBrowserNativePipeDiagnostics/
      : /ruizhiBrowserNativePipeEnabled/;
    assert.match(source, nativePipeLogger, `${scriptPath} should log Browser native pipe enable state`);
  }
});

test("bootstrap refreshes cached bundled Browser runtime scripts on launch", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /copyPluginCacheFiles/, `${scriptPath} should refresh existing plugin cache files`);
    assert.match(source, /runtimePluginNames=new Set\(\["browser","chrome"\]\)/, `${scriptPath} should refresh Browser runtime plugin caches`);
    assert.match(source, /entry\.name==="scripts"&&runtimePluginNames\.has\(pluginName\)/, `${scriptPath} should copy scripts only for Browser runtimes`);
  }
});
