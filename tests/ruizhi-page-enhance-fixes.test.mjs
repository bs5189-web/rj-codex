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

function parseVersion(version) {
  return String(version).split(".").map((part) => Number.parseInt(part, 10));
}

function compareVersions(left, right) {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftPart = leftParts[index] || 0;
    const rightPart = rightParts[index] || 0;
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }
  return 0;
}

test("Windows release version advances past the pre-plugin-menu installer", () => {
  const config = JSON.parse(read("config/rj-codex.json"));

  assert.ok(
    compareVersions(config.version, "0.2.2") > 0,
    "Windows installer version must advance so machines with the old 0.2.2 package receive the native Plugins menu patch",
  );
});

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

test("first launch auth status remains available without patching the native login route", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /function hasExistingCodexConfig\(/, `${scriptPath} should detect existing ~/.codex configuration`);
    assert.match(source, /function readAuthJson\(/, `${scriptPath} should parse auth.json instead of inferring auth mode from API key presence`);
    assert.match(source, /authMode=auth&&typeof auth\.auth_mode==="string"\?auth\.auth_mode:null/, `${scriptPath} should expose auth_mode from auth.json`);
    assert.match(source, /config\.toml/, `${scriptPath} should treat config.toml as an existing Codex configuration marker`);
    assert.match(source, /RUIZHI_EXISTING_CODEX_CONFIG/, `${scriptPath} should preserve whether config.toml exists without mutating it`);
    assert.match(source, /configuredBy/, `${scriptPath} should report whether auth came from auth.json or Codex config`);
    assert.match(source, /configured:authConfigured\|\|existingConfig/, `${scriptPath} should keep reporting existing auth state`);
    assert.doesNotMatch(source, /configured:key\.length>0\|\|existingConfig/, `${scriptPath} must not treat API key presence as the only auth.json signal`);
    assert.doesNotMatch(source, /function patchLoginRoute\(/, `${scriptPath} should not patch Codex's login route`);
    assert.doesNotMatch(source, /function patchOnboardingApiKeyTexts\(/, `${scriptPath} should not patch Codex's onboarding login content`);
    assert.doesNotMatch(source, /\["electron\.onboarding\.login\.chatgpt\.signIn",/, `${scriptPath} should leave the native ChatGPT sign-in label untouched`);
    assert.doesNotMatch(source, /\["electron\.onboarding\.login\.chatgptToken\./, `${scriptPath} should leave native token login messages untouched`);
    assert.doesNotMatch(source, /\["electron\.onboarding\.login\.(google|microsoft)\./, `${scriptPath} should leave native third-party login messages untouched`);
    assert.doesNotMatch(source, /login-with-chatgpt-url|readLoginWithChatgptUrl|ruizhiLoginWithChatgptUrl/, `${scriptPath} should not override native ChatGPT login URLs`);
  }

  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /ruizhi:auth:get-sync/, `${scriptPath} should keep exposing cached auth status to non-login UI`);
    assert.match(source, /getCached:\(\)=>cachedAuthStatus/, `${scriptPath} should keep auth status available through the desktop bridge`);
    assert.doesNotMatch(source, /ruizhi:auth:get-login-with-chatgpt-url|loginWithChatgptUrl|getLoginWithChatgptUrl/, `${scriptPath} should not expose login URL override hooks`);
  }
});

test("page enhance installer skips Codex login pages", () => {
  for (const scriptPath of [
    "resources/renderer/ruizhi-page-enhance.js",
    "overrides/windows-app/asar/.vite/build/preload.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /function isCodexLoginPage\(/, `${scriptPath} should detect native login documents`);
    assert.match(source, /if \(isCodexLoginPage\(\)\) return null;/, `${scriptPath} should not install page enhance on login pages`);
  }
});

test("packaging keeps archive locale labels native", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /codex\.archiveInfo/, `${scriptPath} should not override Codex archive info labels`);
    assert.doesNotMatch(source, /localTaskRow\.archive/, `${scriptPath} should not override Codex archive task labels`);
    assert.doesNotMatch(source, /settings\.dataControls\.archivedChats/, `${scriptPath} should not override archived chats settings labels`);
    assert.doesNotMatch(source, /sidebarElectron\.archive/, `${scriptPath} should not override sidebar archive labels`);
    assert.doesNotMatch(source, /threadHeader\.archive/, `${scriptPath} should not override thread header archive labels`);
  }
});

test("packaging patches onboarding continue button and build date badge", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /function ruizhiBuildDateLabel\(/, `${scriptPath} should compute the build-date label during packaging`);
    assert.match(source, /锐智构建日期：\$\{ruizhiBuildDate\(\)\}/, `${scriptPath} should include the packaging date in the welcome badge`);
    assert.match(source, /\["electron\.onboarding\.login\.chatgpt\.continue", "使用锐擎继续"\]/, `${scriptPath} should patch the ChatGPT continue button label`);
    assert.match(source, /\["electron\.onboarding\.login\.chatgpt\.signIn\.streamlined", "使用锐擎继续"\]/, `${scriptPath} should patch the streamlined ChatGPT continue button label`);
    assert.match(source, /\["electron\.onboarding\.login\.includedPlans\.welcomeV2", ruizhiBuildDateLabel\(\)\]/, `${scriptPath} should replace the ChatGPT plan badge with the build date`);
  }
});

test("bootstrap treats config.toml as fully user-owned and read-only", () => {
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
    assert.doesNotMatch(source, /fs\.writeFileSync\(target,\s*next,\s*"utf8"\)/, `${scriptPath} should not patch sandbox settings into config.toml`);
    assert.doesNotMatch(source, /fs\.writeFileSync\(configPath/, `${scriptPath} should not write config.toml`);
    assert.doesNotMatch(source, /fs\.copyFileSync\(configPath/, `${scriptPath} should not back up config.toml for mutation`);
    assert.doesNotMatch(source, /syncRuntimeModelProviderConfig|setTomlProviderBaseUrl|bak-provider/, `${scriptPath} should not repair provider URLs in config.toml`);
  }

  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /path\.join\(home,["`]\.codex["`],["`]config\.toml["`]\)/, `${scriptPath} should read only ~/.codex/config.toml`);
    assert.doesNotMatch(source, /path\.join\(authHome\(\),["`]config\.toml["`]\)|path\.join\(codexHome,["`]config\.toml["`]\)/, `${scriptPath} should not resolve config.toml through RUIZHI_HOME`);
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

test("macOS bootstrap patch tolerates updater failure handler alias changes", () => {
  const source = read("scripts/build-macos.mjs");

  assert.match(source, /bootstrapFailureHandlerPattern/, "macOS bootstrap patch should match the updater failure handler by shape");
  assert.match(source, /failureHandlerName/, "macOS bootstrap patch should capture the minified failure handler name");
  assert.match(source, /electronName/, "macOS bootstrap patch should capture the Electron module alias");
  assert.match(source, /bootstrapInitCode\(electronName\)/, "macOS init bootstrap should receive the captured Electron alias");
  assert.match(source, /\$\{electronName\}\.app\.commandLine\.appendSwitch/, "macOS init bootstrap should use the captured Electron alias");
  assert.match(source, /bootstrapForceUpdateCode\(electronName\)/, "macOS updater bootstrap should receive the captured Electron alias");
  assert.match(source, /\$\{electronName\}\.app\.isPackaged/, "macOS updater bootstrap should use the captured Electron alias");
  assert.match(source, /updaterInitializePattern/, "macOS bootstrap patch should match updater initialization by shape");
  assert.match(source, /runMainAppStartup/, "macOS bootstrap patch should keep the main app startup import boundary");
});

test("macOS fuse patch resolves renamed Electron framework binaries", () => {
  const source = read("scripts/build-macos.mjs");

  assert.match(source, /function findElectronFrameworkExecutable\(/, "macOS fuse patch should resolve the framework binary itself");
  assert.match(source, /Framework\\\.framework/, "macOS fuse patch should inspect framework bundles");
  assert.match(source, /temporaryFuseExecutable/, "macOS fuse patch should avoid electron-fuses .app path rewriting");
  assert.match(source, /flipFuses\(temporaryFuseExecutable/, "macOS fuse patch should flip a temporary framework copy");
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
  assert.match(source, /\\`自动化\\`,g,\{index:2\}/);
  assert.match(source, /[mr]\(e,\\?`\/automations\\?`\)/);
  assert.match(source, /\\`设置…\\`,p,\{accelerator:\\`CmdOrCtrl\+,\\`,index:0\}/);
  assert.match(source, /visible=!0/);
  assert.match(source, /enabled=!0/);
  assert.doesNotMatch(source, /Automations[^;\n]+(remove|delete|hidden|disabled)/i);
});

test("Windows packaging keeps native Settings and Automations actions visible without stale main overrides", () => {
  const source = read("scripts/windows-asar-overrides.mjs");
  const buildDir = path.join(projectRoot, "overrides", "windows-app", "asar", ".vite", "build");
  const mainBundle = fs.readdirSync(buildDir).find((name) => /^main-.*\.js$/.test(name));

  assert.match(source, /ruizhiEnsureNativeMenuItems/);
  assert.match(source, /\\`自动化\\`,g,\{index:2\}/);
  assert.match(source, /[mr]\(e,\\?`\/automations\\?`\)/);
  assert.match(source, /\\`设置…\\`,p,\{accelerator:\\`CmdOrCtrl\+,\\`,index:0\}/);
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

test("macOS application menu patch tolerates main bundle minifier alias changes", () => {
  const source = read("scripts/build-macos.mjs");

  assert.match(source, /settingsMenuMatch/, "macOS menu patch should capture settings navigation aliases");
  assert.match(source, /setApplicationMenuMatch/, "macOS menu patch should capture setApplicationMenu aliases");
  assert.match(source, /MenuItem:\$\{electronName\}\.MenuItem/, "macOS menu patch should use the captured Electron alias");
  assert.match(source, /settingsRoute:\$\{settingsRouteName\}/, "macOS menu patch should use the captured settings route alias");
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

test("packaging plugin auth gate patch tolerates bundle and minifier alias changes", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /pluginAccountGatePattern/, `${scriptPath} should locate the plugin auth gate by code shape`);
    assert.match(source, /findOneFileByContent/, `${scriptPath} should not depend on a fixed plugin auth bundle name`);
    assert.match(source, /function \$1\(e\)\{return !1\}/, `${scriptPath} should preserve the captured minified function name`);
  }
});

test("packaging native feature gate patch tolerates Statsig hook alias changes", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /statsigGateSourcePattern/, `${scriptPath} should match the Statsig hook call with a regex`);
    assert.match(source, /targetGateMatch\[1\]/, `${scriptPath} should capture the minified hook alias before patching`);
    assert.match(source, /\$\{gateHook\}\(Z,e\)/, `${scriptPath} should call the captured hook alias after the Ruizhi override`);
  }
});

test("packaging app sunset gate patch tolerates feature gate alias changes", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.ok(source.includes("appSunset\\.title[\\s\\S]*`2929582856`"), `${scriptPath} should locate the app sunset bundle by content`);
    assert.ok(source.includes("/if\\(([A-Za-z_$][\\w$]*)\\(`2929582856`\\)\\)\\{/"), `${scriptPath} should match the minified feature gate alias`);
    assert.ok(source.includes("if(false&&$1(`2929582856`)){"), `${scriptPath} should disable the captured app sunset gate`);
  }
});

test("packaging model availability patch tolerates model bundle splits", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /modelAvailabilityAllowlistPattern/, `${scriptPath} should locate model filtering by code shape`);
    assert.match(source, /models-and-reasoning-efforts/, `${scriptPath} should allow the current split model helper bundle`);
    assert.match(source, /"!1"/, `${scriptPath} should disable the hidden-model allowlist flag`);
    assert.doesNotMatch(source, /\(\?:\[\^;\]\*\?,\)\*/, `${scriptPath} should avoid broad backtracking in model bundle scans`);
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

  assert.equal(
    (fs.existsSync(path.join(projectRoot, "overrides", "windows-app", "asar", "webview", "assets"))
      ? fs.readdirSync(path.join(projectRoot, "overrides", "windows-app", "asar", "webview", "assets"))
      : [])
      .filter((name) => /^browser-use-settings-.*\.js$/.test(name)).length,
    0,
    "Windows overrides should not carry stale Browser settings asset patches"
  );
});

test("packaging keeps ChatGPT authentication URLs in the system browser", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /patchChatGptAuthExternalBrowser/, `${scriptPath} should patch auth browser dispatch`);
    assert.match(source, /ruizhiIsChatGptAuthUrl/, `${scriptPath} should detect ChatGPT OAuth URLs explicitly`);
    assert.match(source, /useExternalBrowser:!0/, `${scriptPath} should force auth URLs to the OS browser`);
  }
});

test("packaging Browser desktop availability patch tolerates main bundle minifier alias changes", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /nativeBrowserDesktopFeatureAvailabilityPattern/, `${scriptPath} should match desktop feature availability with a regex`);
    assert.match(source, /const \[, functionName, buildFlavorName/, `${scriptPath} should capture the minified function aliases`);
    assert.match(source, /returnExpression/, `${scriptPath} should capture the full availability return expression`);
    assert.match(source, /return ruizhiNativeBrowserDesktopFeatureAvailability\(\$\{returnExpression\}\)/, `${scriptPath} should wrap the captured availability result`);
    assert.doesNotMatch(source, /\[\\s\\S\]\*\?\)\\}function/, `${scriptPath} should avoid broad cross-function regex backtracking`);
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
  assert.doesNotMatch(read("scripts/windows-asar-overrides.mjs"), /pluginDirRenames/, "Windows bundled plugin restore should not rename current plugin directories to retired ids");
  assert.doesNotMatch(read("scripts/windows-asar-overrides.mjs"), /path\.join\(pluginsRoot,\s*"latex-tectonic"/, "Windows bundled plugin patches should target the current latex plugin directory");
});

test("windows packaging patches the native Plugins menu independently from tray labels", () => {
  const source = read("scripts/windows-asar-overrides.mjs");
  const refreshStart = source.indexOf("export function refreshWindowsAsarBuildMetadata(");
  assert.notEqual(refreshStart, -1, "Windows metadata refresh should exist");
  const refreshEnd = source.indexOf("\n}\n\nfunction nodeModuleTargetDir", refreshStart);
  assert.notEqual(refreshEnd, -1, "Windows metadata refresh body should be locatable");
  const refreshSource = source.slice(refreshStart, refreshEnd);

  assert.match(source, /function patchWindowsNativeMenuItems\(/, "Windows native menu patch should be split from tray label patching");
  assert.match(refreshSource, /patchWindowsNativeMenuItems\(extractedAppDir, config, \{ log \}\)/, "Windows refresh should always patch native menu entries");
  assert.match(source, /try\{ruizhiEnsureNativeMenuItems\(\{menu:/, "Windows native menu patch should mount before setApplicationMenu, not only inject helpers");
  assert.doesNotMatch(source, /source\.includes\("ruizhiEnsureNativeMenuItems\(\{menu:"\)/, "Windows native menu patch should not mistake the helper definition for a mounted hook");
  assert.match(source, /settingsRouteVar/, "Windows native menu patch should resolve the current settings route variable dynamically");
  assert.match(source, /\/settings\/general-settings/, "Windows native menu patch should target the real settings route");
  assert.doesNotMatch(source, /settingsRoute:yB/, "Windows native menu patch should not hard-code an unrelated minified variable");
  assert.match(source, /ensureSettingsMenu/, "Windows native menu patch should create a Settings top-level menu when missing");
  assert.match(source, /ensurePluginsMenu/, "Windows native menu patch should create a Plugins top-level menu when missing");
  assert.match(source, /helperStart/, "Windows native menu patch should detect stale injected helpers");
  assert.match(source, /source\.slice\(0, helperStart\).*windowsNativeMenuPatchSource\(\).*source\.slice\(insertionIndex\)/s, "Windows native menu patch should replace stale injected helpers in rebuilt asars");
  assert.match(source, /Plugins":"插件"/, "Windows native menu translator should localize Plugins");
  assert.match(source, /\\`插件\\`,m,\{index:1\}/, "Windows native menu patch should add a Plugins label under Settings");
  assert.match(source, /label:\\`插件\\`,submenu:\[\]/, "Windows native menu patch should add a top-level Plugins menu");
  assert.match(source, /r\(e,\\`\/plugins\\`\)/, "Windows native menu patch should open /plugins");
});

test("windows packaging keeps the native menu bar visible on BrowserWindow", () => {
  const source = read("scripts/windows-asar-overrides.mjs");

  assert.match(source, /autoHideMenuBar:\s*!1/, "Windows BrowserWindow menu bar must not be hidden after native menu entries are added");
  assert.match(source, /setMenuBarVisibility\(!0\)/, "Windows BrowserWindow should keep its menu bar visible");
  assert.doesNotMatch(source, /\.removeMenu\(\)/, "Windows BrowserWindow menu must not be removed after native menu entries are added");
});

test("windows packaging does not copy source Logs into build output", () => {
  const source = read("scripts/build-windows.mjs");

  assert.match(source, /function shouldCopyPinnedCodexAppEntry\(/, "Windows build should define a copy filter for the pinned app source");
  assert.match(source, /relativeParts\[0\]\.toLowerCase\(\) === "logs"/, "Windows build should skip top-level Logs from the pinned app source");
  assert.match(source, /relativeParts\.join\("\/"\)\.toLowerCase\(\) === "resources\/plugins\/openai-bundled"/, "Windows build should skip bundled plugin resources that are restored later");
  assert.match(source, /fsExtra\.copy\(installedAppRoot, appOutRoot, \{ filter: shouldCopyPinnedCodexAppEntry \}\)/, "Windows build should apply the copy filter when staging the app");
});

test("windows packaging can use an explicit external source app root", () => {
  const source = read("scripts/build-windows.mjs");

  assert.match(source, /RUIZHI_WINDOWS_SOURCE_APP_ROOT/, "Windows build should accept an explicit source app root override");
  assert.match(source, /path\.resolve\(process\.env\.RUIZHI_WINDOWS_SOURCE_APP_ROOT\)/, "Windows source override should support absolute paths outside the workspace");
  assert.match(source, /verifyWindowsSourceManifest\(appRoot\)/, "Default pinned source should keep manifest verification");
  assert.match(source, /log\(`使用外部 Codex Desktop 源/, "External source override should be visible in build logs");
  assert.match(source, /codexClientVersionFromExe\(path\.join\(pinnedCodexAppRoot, "resources", "codex\.exe"\)\)/, "Windows build should read the Codex client version from the pinned source executable");
  assert.match(source, /RUIZHI_CODEX_CLIENT_VERSION/, "Windows build should allow explicit Codex client version when child-process execution is blocked");
  assert.match(source, /patchOpenAIBundledPluginDescriptions\(resourcesDir, \{ log, sourceAppRoot: pinnedCodexAppRoot \}\)/, "Windows build should restore bundled plugin resources from the active source app root");
});

test("windows packaging can skip rcedit icon patching in restricted environments", () => {
  const source = read("scripts/build-windows.mjs");

  assert.match(source, /RUIZHI_SKIP_EXE_ICON_PATCH/, "Windows build should expose an escape hatch for rcedit spawn restrictions");
  assert.match(source, /跳过主程序图标替换/, "Windows build should log when exe icon patching is skipped");
});

test("windows packaging can use an isolated work directory", () => {
  const source = read("scripts/build-windows.mjs");

  assert.match(source, /RUIZHI_WINDOWS_WORK_SUBDIR/, "Windows build should allow an isolated work directory");
  assert.match(source, /resolveProjectPath\(process\.env\.RUIZHI_WINDOWS_WORK_SUBDIR/, "Windows work directory override should stay inside the project");
  assert.match(source, /RUIZHI_WINDOWS_INSTALLER_INPUT_SUBDIR/, "Windows build should allow an isolated installer input directory");
  assert.match(source, /RUIZHI_WINDOWS_INSTALLER_OUT_SUBDIR/, "Windows build should allow an isolated installer output directory");
});

test("runtime bundle validation cleanup is best effort", () => {
  const source = read("scripts/windows-asar-overrides.mjs");

  assert.match(source, /function removeValidationDirBestEffort\(/, "Runtime validation should isolate cleanup failures");
  assert.doesNotMatch(source, /fs\.rmSync\(extractDir, \{ recursive: true, force: true \}\);/, "Runtime validation should not let temp cleanup failure mask validation result");
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

test("bootstrap leaves unmanaged Codex config sections untouched", () => {
  for (const scriptPath of [
    "scripts/build-windows.mjs",
    "scripts/build-macos.mjs",
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.doesNotMatch(source, /stripManagedConfigConflicts/, `${scriptPath} should not strip user config.toml sections`);
    assert.doesNotMatch(source, /managedSectionNames/, `${scriptPath} should not maintain managed TOML sections`);
    assert.doesNotMatch(source, /managedBlock/, `${scriptPath} should not prepend managed defaults to config.toml`);
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
    "overrides/windows-app/asar/.vite/build/bootstrap.js",
  ]) {
    const source = read(scriptPath);
    assert.match(source, /ensureOpenAIBundledPluginCache/, `${scriptPath} should create missing plugin cache roots`);
    assert.match(source, /copyPluginCacheFiles/, `${scriptPath} should refresh plugin cache files`);
    assert.match(source, /runtimePluginNames=new Set\(\["browser","chrome"\]\)/, `${scriptPath} should refresh Browser runtime plugin caches`);
    assert.match(source, /entry\.name==="scripts"&&runtimePluginNames\.has\(pluginName\)/, `${scriptPath} should copy scripts only for Browser runtimes`);
    assert.doesNotMatch(source, /!fs\.existsSync\(sourcePluginsRoot\)\|\|!fs\.existsSync\(cacheRoot\)/, `${scriptPath} should not skip first-run cache creation`);
  }
});
