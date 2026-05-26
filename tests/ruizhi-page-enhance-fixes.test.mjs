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
  assert.match(source, /data-app-action-sidebar-project-row/);
  assert.match(source, /data-app-action-sidebar-project-label/);
  assert.match(source, /data-testid\*='conversation-turn'/);
  assert.match(source, /data-testid\*='project'/);
  assert.match(source, /data-turn-key/);
  assert.match(source, /data-content-search-turn-key/);
  assert.match(source, /function threadScrollElement\(/);
  assert.match(source, /data-app-action-timeline-scroll/);
  assert.match(source, /RUIZHI_SETTINGS_VERSION_FIX_V1/);
  assert.match(source, /function installSettingsVersionFix\(/);
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

test("enhance service returns appVersion so renderer does not lose Ruizhi settings version", () => {
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
    assert.equal(service.writeSettings({ features: { timeline: true } }).appVersion, "0.1.24");
  } finally {
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test("application menu translation preserves Codex Automations", () => {
  const source = read("scripts/windows-asar-overrides.mjs");

  assert.match(source, /"Automations":"自动化"/);
  assert.doesNotMatch(source, /Automations[^;\n]+(remove|delete|hidden|disabled)/i);
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
});
