import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fsExtra from "fs-extra";
import { flipFuses, FuseVersion, FuseV1Options } from "@electron/fuses";
import {
  codexClientVersionFromExe,
  writeRuntimeModelCatalog
} from "./windows-asar-overrides.mjs";

const require = createRequire(import.meta.url);
const asar = require("asar");

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "config", "rj-codex.json"), "utf8"));
const appVersion = process.env.RUIZHI_BUILD_VERSION ?? config.version;
const updatesConfig = config.updates ?? {};
const macosUpdateConfig = updatesConfig.macos ?? {};
const macosBuildArch = normalizeMacosBuildArch(process.env.RUIZHI_MACOS_ARCH ?? process.arch);
const runtimeConfig = config.runtime ?? {};
const ruizhiHomeEnvName = runtimeConfig.homeEnv ?? "RUIZHI_HOME";
const ruizhiDefaultHomeDirName = runtimeConfig.defaultHomeDirName ?? ".ruizhi";
const electronUserDataDirName = runtimeConfig.electronUserDataDirName ?? "Codex";
const imageGenerationConfig = config.imageGeneration ?? {};
const modelBridgeConfig = config.modelBridge ?? {};
const openAIBundledPluginDefinitions = [
  { name: "browser", path: "./plugins/browser", category: "Engineering" },
  { name: "chrome", path: "./plugins/chrome", category: "Productivity" },
  { name: "latex", path: "./plugins/latex", category: "Research" }
];
const browserRuntimePluginNames = ["browser", "chrome"];

const distDir = resolveProjectPath("dist");
const macDistDir = resolveProjectPath(path.join("dist", "macos"));
const appOutRoot = path.join(macDistDir, `${config.productName}.app`);
const workRoot = path.join(projectRoot, ".work", "macos");
const dmgStagingDir = path.join(workRoot, "dmg");
const sourceWorkDir = path.join(workRoot, "source");
const extractedDir = path.join(workRoot, "app");
const updateManifestPath = path.join(distDir, "ruizhi-latest-macos.json");
const archUpdateManifestPath = path.join(distDir, `ruizhi-latest-macos-${macosBuildArch}.json`);
const latestMacYmlPath = path.join(distDir, "latest-mac.yml");
const legacyLatestMacYmlPath = path.join(distDir, "latest.yml");
const archLatestMacYmlPath = path.join(distDir, `latest-mac-${macosBuildArch}.yml`);

function log(message) {
  console.log(`[ruizhi:macos] ${message}`);
}

function ruizhiBuildDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ruizhiBuildDateLabel() {
  return `锐智构建日期：${ruizhiBuildDate()}`;
}

function assertInsideProject(targetPath) {
  const resolvedRoot = path.resolve(projectRoot).toLowerCase();
  const resolvedTarget = path.resolve(targetPath).toLowerCase();
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`拒绝访问项目外路径：${targetPath}`);
  }
}

function resolveProjectPath(targetPath) {
  const resolvedTarget = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(projectRoot, targetPath);
  assertInsideProject(resolvedTarget);
  return resolvedTarget;
}

function cleanDir(targetPath) {
  assertInsideProject(targetPath);
  fs.mkdirSync(targetPath, { recursive: true });
  for (const entry of fs.readdirSync(targetPath)) {
    fs.rmSync(path.join(targetPath, entry), { recursive: true, force: true });
  }
}

function execLogged(command, args, options = {}) {
  log([command, ...args].join(" "));
  execFileSync(command, args, { stdio: "inherit", ...options });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function execSensitive(command, args, label, options = {}) {
  log(label);
  execFileSync(command, args, { stdio: "inherit", ...options });
}

function execOutput(command, args, options = {}) {
  return execFileSync(command, args, { encoding: "utf8", ...options });
}

function jsonLiteral(value) {
  return JSON.stringify(value);
}

function splitConfigPath(value) {
  return String(value).split(/[\\/]+/).filter(Boolean);
}

function pluginMarketplaces() {
  return Array.isArray(config.pluginMarketplaces) ? config.pluginMarketplaces : [];
}

function macosUpdatesEnabled() {
  return macosUpdateConfig.enabled ?? updatesConfig.enabled !== false;
}

function macosUpdateDownloadBaseUrl() {
  return process.env.RUIZHI_MACOS_UPDATE_DOWNLOAD_BASE_URL
    ?? process.env.RUIZHI_UPDATE_DOWNLOAD_BASE_URL
    ?? macosUpdateConfig.downloadBaseUrl
    ?? "";
}

function joinUrl(baseUrl, fileName) {
  if (!baseUrl) {
    return fileName;
  }
  return new URL(fileName, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

function renderArtifactName(template, filePath) {
  const ext = path.extname(filePath).replace(/^\./, "") || "zip";
  return String(template)
    .replace(/\$\{version\}/g, appVersion)
    .replace(/\$\{arch\}/g, macosBuildArch)
    .replace(/\$\{ext\}/g, ext);
}

function macosUpdateArtifactName(filePath) {
  const template = macosUpdateConfig.artifactName ?? "Ruizhi-macos-${version}-${arch}.${ext}";
  return renderArtifactName(template, filePath);
}

function macosDmgArtifactName() {
  return macosUpdateArtifactName("app.dmg");
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function normalizeMacosBuildArch(value) {
  const arch = String(value ?? "").trim().toLowerCase();
  if (["arm64", "aarch64"].includes(arch)) {
    return "arm64";
  }
  if (["x64", "x86", "x86_64", "amd64", "intel"].includes(arch)) {
    return "x64";
  }
  throw new Error(`不支持的 macOS 架构：${value}`);
}

function macosMachArch(value = macosBuildArch) {
  return value === "x64" ? "x86_64" : value;
}

function macosGoArch(value = macosBuildArch) {
  return value === "x64" ? "amd64" : value;
}

function assertVersionFilePart(version) {
  if (!/^[0-9A-Za-z._+-]+$/.test(version)) {
    throw new Error(`版本号不能用于产物文件名：${version}`);
  }
}

function versionedLatestMacYmlPath(version = appVersion, arch = macosBuildArch) {
  assertVersionFilePart(version);
  assertVersionFilePart(arch);
  return path.join(distDir, `latest-mac-${version}-${arch}.yml`);
}

function versionedMacUpdateManifestPath(version = appVersion, arch = macosBuildArch) {
  assertVersionFilePart(version);
  assertVersionFilePart(arch);
  return path.join(distDir, `ruizhi-latest-macos-${version}-${arch}.json`);
}

function readElectronUpdaterManifestVersion(manifestPath) {
  const content = fs.readFileSync(manifestPath, "utf8");
  const match = content.match(/^version:\s*['"]?([^'"\s]+)['"]?\s*$/m);
  if (!match) {
    throw new Error(`无法从 electron-updater 清单读取版本号：${manifestPath}`);
  }
  return match[1];
}

function readJsonManifestVersion(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    throw new Error(`无法从 JSON 更新清单读取版本号：${manifestPath}`);
  }
  return manifest.version;
}

function preserveExistingMacUpdateManifests() {
  if (fs.existsSync(latestMacYmlPath)) {
    const version = readElectronUpdaterManifestVersion(latestMacYmlPath);
    const versionedPath = versionedLatestMacYmlPath(version);
    fs.copyFileSync(latestMacYmlPath, versionedPath);
    log(`已保留历史 macOS electron-updater 清单：${versionedPath}`);
  } else if (fs.existsSync(legacyLatestMacYmlPath)) {
    const version = readElectronUpdaterManifestVersion(legacyLatestMacYmlPath);
    const versionedPath = versionedLatestMacYmlPath(version);
    fs.copyFileSync(legacyLatestMacYmlPath, versionedPath);
    log(`已保留历史 macOS legacy electron-updater 清单：${versionedPath}`);
  }

  if (fs.existsSync(updateManifestPath)) {
    const version = readJsonManifestVersion(updateManifestPath);
    const versionedPath = versionedMacUpdateManifestPath(version);
    fs.copyFileSync(updateManifestPath, versionedPath);
    log(`已保留历史 macOS 更新清单：${versionedPath}`);
  }
}

function marketplaceSourceToken(name) {
  return `__RUIZHI_MARKETPLACE_SOURCE_${name.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}__`;
}

function modelCatalogPath() {
  const configured = config.models?.catalogPath;
  if (!configured) {
    throw new Error("缺少 models.catalogPath 配置。");
  }
  const resolved = resolveProjectPath(configured);
  if (!fs.existsSync(resolved)) {
    throw new Error(`锐智模型目录不存在：${resolved}`);
  }
  return resolved;
}

function modelCatalogRemoteUrl() {
  return config.models?.remoteCatalogUrl ?? "";
}

function modelCatalogEnabled() {
  return config.models?.enabled !== false;
}

function modelBridgeEnabled() {
  return modelCatalogEnabled() && modelBridgeConfig.enabled === true;
}

function modelBridgeHost() {
  return modelBridgeConfig.host ?? "127.0.0.1";
}

function modelBridgePort() {
  const port = modelBridgeConfig.port ?? 17888;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`modelBridge.port 无效：${port}`);
  }
  return port;
}

function modelProviderBaseUrl() {
  if (!modelBridgeEnabled()) {
    return config.openai.baseUrl;
  }
  return `http://${modelBridgeHost()}:${modelBridgePort()}/v1`;
}

function modelBridgeRuntimeSourcePath() {
  const configured = modelBridgeConfig.runtimeScriptPath ?? "resources/bridge/ruizhi-responses-bridge.cjs";
  const resolved = resolveProjectPath(configured);
  if (!fs.existsSync(resolved)) {
    throw new Error(`模型协议 bridge 脚本不存在：${resolved}`);
  }
  return resolved;
}

function modelBridgeRuntimeResourcePath() {
  return path.join("bridge", path.basename(modelBridgeRuntimeSourcePath()));
}

function modelBridgeRoutes() {
  return modelBridgeConfig.routes && typeof modelBridgeConfig.routes === "object"
    ? modelBridgeConfig.routes
    : {};
}

function pageEnhanceEnabled() {
  return config.pageEnhance?.enabled !== false;
}

function pageEnhanceFeatures() {
  return {
    menu: true,
    pluginEntryUnlock: true,
    forcePluginInstall: true,
    sessionDelete: false,
    markdownExport: true,
    projectMove: false,
    timeline: true,
    threadScrollRestore: true,
    threadSort: true,
    modelWhitelistUnlock: false,
    zedRemoteOpen: false,
    upstreamWorktreeCreate: false,
    serviceTierControls: false,
    ...(config.pageEnhance?.features && typeof config.pageEnhance.features === "object" ? config.pageEnhance.features : {})
  };
}

function pageEnhanceBootstrapConfig() {
  return {
    enabled: pageEnhanceEnabled(),
    features: pageEnhanceFeatures(),
    appVersion,
    rendererResourcePath: ["renderer", "ruizhi-page-enhance.js"],
    serviceResourcePath: ["bridge", "ruizhi-enhance-service.cjs"]
  };
}

function pageEnhanceRendererSourcePath() {
  return resolveProjectPath(path.join("resources", "renderer", "ruizhi-page-enhance.js"));
}

function pageEnhanceRendererInstallerSource() {
  return fs.readFileSync(pageEnhanceRendererSourcePath(), "utf8");
}

function pageEnhanceServiceSourcePath() {
  return resolveProjectPath(path.join("resources", "bridge", "ruizhi-enhance-service.cjs"));
}

function imageGenHelperName() {
  return (imageGenerationConfig.helperDarwinName ?? imageGenerationConfig.helperExeName ?? "ruizhi-imagegen")
    .replace(/\.exe$/i, "");
}

function builtInAllowPrefixRules() {
  const configuredRules = Array.isArray(config.execPolicy?.allowPrefixRules)
    ? config.execPolicy.allowPrefixRules
    : [];
  const imageGenHelperPath = path.join("bin", imageGenHelperName());
  return [
    ...configuredRules,
    {
      commandResourcePath: imageGenHelperPath,
      prefix: ["generate"]
    },
    {
      commandResourcePath: imageGenHelperPath,
      prefix: ["generate-batch"]
    }
  ];
}

function imageGenSkillSourcePath() {
  return resolveProjectPath(path.join("resources", "skills", "imagegen", "SKILL.md"));
}

function findOneFile(dir, pattern, label) {
  const matches = fs.readdirSync(dir)
    .filter((name) => pattern.test(name))
    .map((name) => path.join(dir, name));

  if (matches.length !== 1) {
    throw new Error(`${label} 匹配数量异常：${matches.length}`);
  }

  return matches[0];
}

function findOneFileByContent(dir, filePattern, contentPattern, label) {
  const matches = fs.readdirSync(dir)
    .filter((name) => filePattern.test(name))
    .map((name) => path.join(dir, name))
    .filter((filePath) => contentPattern.test(fs.readFileSync(filePath, "utf8")));

  if (matches.length !== 1) {
    throw new Error(`${label} 匹配数量异常：${matches.length}`);
  }

  return matches[0];
}

function findOptionalFile(dir, pattern, label) {
  const matches = fs.readdirSync(dir)
    .filter((name) => pattern.test(name))
    .map((name) => path.join(dir, name));

  if (matches.length === 0) {
    log(`跳过缺失文件：${label}`);
    return null;
  }
  if (matches.length > 1) {
    throw new Error(`${label} 匹配数量异常：${matches.length}`);
  }

  return matches[0];
}

function replaceExact(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`补丁点不存在：${label}`);
  }
  return source.replace(from, to);
}

function replaceExactIfPresent(source, from, to, label) {
  if (!source.includes(from)) {
    log(`跳过补丁点：${label}`);
    return source;
  }
  return source.replace(from, to);
}

function replaceRegex(source, pattern, to, label) {
  if (!pattern.test(source)) {
    throw new Error(`补丁点不存在：${label}`);
  }
  return source.replace(pattern, to);
}

function replaceAllIfPresent(source, from, to) {
  return source.split(from).join(to);
}

function walkFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const result = [];
  const visit = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  };

  visit(root);
  return result;
}

function configuredWebsiteUrl(key, label) {
  const configured = String(config.website?.[key] ?? "").trim();
  if (!configured) {
    throw new Error(`缺少 website.${key} 配置，无法补丁${label}链接`);
  }
  return configured;
}

function homeUrl() {
  return configuredWebsiteUrl("homeUrl", "帮助首页");
}

function docsUrl(hash = "") {
  const configured = configuredWebsiteUrl("docsUrl", "帮助文档");
  return hash ? `${configured.split("#")[0]}#${hash}` : configured;
}

function patchHelpDocumentationLinks() {
  const helpHomeUrl = homeUrl();
  const helpHomePattern = /\{label:`Codex Documentation`,click:\(\)=>\{([A-Za-z_$][\w$]*)\.shell\.openExternal\(`https:\/\/developers\.openai\.com\/codex\/app`\)\}\}/g;
  const replacements = [
    ["https://developers.openai.com/codex/app/worktrees#option-1-working-on-the-worktree", docsUrl("workspace")],
    ["https://developers.openai.com/codex/app/local-environments", docsUrl("terminal")],
    ["https://developers.openai.com/codex/app/troubleshooting", docsUrl("faq")],
    ["https://developers.openai.com/codex/app/automations", docsUrl("automation")],
    ["https://developers.openai.com/codex/app/worktrees", docsUrl("workspace")],
    ["https://developers.openai.com/codex/changelog", docsUrl("install")],
    ["https://developers.openai.com/codex/skills", docsUrl("skills")],
    ["https://developers.openai.com/codex/mcp", docsUrl("skills")],
    ["https://developers.openai.com/codex/agent-approvals-security#automatic-approval-reviews", docsUrl("best-practices")],
    ["https://developers.openai.com/codex/memories/chronicle", docsUrl("rules")],
    ["https://developers.openai.com/codex/memories", docsUrl("rules")],
    ["https://developers.openai.com/codex/pricing", docsUrl("intro")],
    ["https://developers.openai.com/codex/app", docsUrl()]
  ];

  let changedFiles = 0;
  let replacementCount = 0;
  const files = walkFiles(extractedDir).filter((filePath) => /\.(js|html|json)$/i.test(filePath));
  for (const filePath of files) {
    let source = fs.readFileSync(filePath, "utf8");
    let next = source;
    const helpHomeMatches = next.match(helpHomePattern);
    if (helpHomeMatches) {
      next = next.replace(
        helpHomePattern,
        `{label:\`Codex Documentation\`,click:()=>{$1.shell.openExternal(\`${helpHomeUrl}\`)}}`
      );
      replacementCount += helpHomeMatches.length;
    }
    for (const [from, to] of replacements) {
      const before = next;
      next = next.split(from).join(to);
      if (next !== before) {
        replacementCount += before.split(from).length - 1;
      }
    }
    if (next !== source) {
      fs.writeFileSync(filePath, next, "utf8");
      changedFiles += 1;
    }
  }

  if (replacementCount === 0) {
    throw new Error("未找到 Codex 帮助文档链接补丁点");
  }

  log(`已补丁帮助文档链接：${changedFiles} 个文件，${replacementCount} 处`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function writePatchedFile(filePath, transform) {
  const original = fs.readFileSync(filePath, "utf8");
  const patched = transform(original);
  if (patched === original) {
    throw new Error(`文件没有发生变化：${filePath}`);
  }
  fs.writeFileSync(filePath, patched);
}

function writePatchedFileIfChanged(filePath, transform) {
  const original = fs.readFileSync(filePath, "utf8");
  const patched = transform(original);
  if (patched === original) {
    log(`跳过未变化文件：${path.basename(filePath)}`);
    return false;
  }
  fs.writeFileSync(filePath, patched);
  return true;
}

function appResourcesDir() {
  return path.join(appOutRoot, "Contents", "Resources");
}

function validateMacAppRoot(appRoot) {
  const asarPath = path.join(appRoot, "Contents", "Resources", "app.asar");
  if (!fs.existsSync(asarPath)) {
    throw new Error(`不是有效的 Codex.app：${appRoot}`);
  }
}

function findMacApps(root) {
  const results = [];
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current.depth > 5 || !fs.existsSync(current.dir)) {
      continue;
    }
    for (const entry of fs.readdirSync(current.dir, { withFileTypes: true })) {
      const fullPath = path.join(current.dir, entry.name);
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name.endsWith(".app") && fs.existsSync(path.join(fullPath, "Contents", "Resources", "app.asar"))) {
        results.push(fullPath);
      } else {
        stack.push({ dir: fullPath, depth: current.depth + 1 });
      }
    }
  }
  return results;
}

function sourceAppFromLocalInstall() {
  const candidates = [
    "/Applications/Codex.app",
    path.join(process.env.HOME ?? "", "Applications", "Codex.app")
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "Contents", "Resources", "app.asar"))) {
      return candidate;
    }
  }
  return null;
}

function downloadFile(url, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  execLogged("curl", ["-L", "--fail", "--retry", "3", "--output", targetPath, url]);
}

function defaultCodexMacosAppUrl() {
  return "https://persistent.oaistatic.com/codex-app-prod/Codex.dmg";
}

function extractZip(zipPath, targetDir) {
  cleanDir(targetDir);
  execLogged("ditto", ["-x", "-k", zipPath, targetDir]);
}

function copyAppFromDmg(dmgPath, targetDir) {
  cleanDir(targetDir);
  const output = execOutput("hdiutil", ["attach", "-nobrowse", "-readonly", dmgPath]);
  const mountPoint = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.match(/\/Volumes\/.+$/)?.[0])
    .find(Boolean);

  if (!mountPoint) {
    throw new Error(`无法挂载 DMG：${dmgPath}`);
  }

  try {
    const apps = findMacApps(mountPoint);
    if (apps.length === 0) {
      throw new Error(`DMG 中找不到带 app.asar 的 .app：${dmgPath}`);
    }
    fsExtra.copySync(apps[0], path.join(targetDir, path.basename(apps[0])));
  } finally {
    execLogged("hdiutil", ["detach", mountPoint]);
  }
}

function sourceAppFromUrl() {
  const url = process.env.CODEX_MACOS_APP_URL?.trim() || defaultCodexMacosAppUrl();
  if (!url) {
    return null;
  }

  cleanDir(sourceWorkDir);
  const parsed = new URL(url);
  const fileName = path.basename(parsed.pathname) || "codex-app-download";
  const downloadPath = path.join(sourceWorkDir, fileName);
  downloadFile(url, downloadPath);

  const extractDir = path.join(sourceWorkDir, "extracted");
  if (/\.zip$/i.test(fileName)) {
    extractZip(downloadPath, extractDir);
  } else if (/\.dmg$/i.test(fileName)) {
    copyAppFromDmg(downloadPath, extractDir);
  } else {
    throw new Error("CODEX_MACOS_APP_URL 只支持 .zip 或 .dmg。");
  }

  const apps = findMacApps(extractDir);
  if (apps.length === 0) {
    throw new Error(`下载产物中找不到带 app.asar 的 .app：${url}`);
  }
  return apps[0];
}

function findSourceAppRoot() {
  if (process.env.CODEX_APP_ROOT) {
    const explicit = path.resolve(process.env.CODEX_APP_ROOT);
    validateMacAppRoot(explicit);
    return explicit;
  }

  const local = sourceAppFromLocalInstall();
  if (local) {
    validateMacAppRoot(local);
    return local;
  }

  const fromUrl = sourceAppFromUrl();
  if (fromUrl) {
    validateMacAppRoot(fromUrl);
    return fromUrl;
  }

  throw new Error("没有找到 Codex.app。请先安装到 /Applications/Codex.app，或设置 CODEX_APP_ROOT。");
}

function patchPluginAccountGate() {
  const assetsDir = path.join(extractedDir, "webview", "assets");
  const pluginAccountGatePattern = /function ([A-Za-z_$][\w$]*)\(e\)\{return e!==`chatgpt`\}/;
  const gateFile = findOneFileByContent(
    assetsDir,
    /\.js$/,
    pluginAccountGatePattern,
    "插件账号模式 gate bundle"
  );
  writePatchedFile(gateFile, (source) =>
    replaceRegex(source, pluginAccountGatePattern, "function $1(e){return !1}", "APIKey 模式插件置灰判断")
  );
  log(`已补丁插件账号模式 gate：${path.basename(gateFile)}`);
}

function patchNativeWebviewFeatureGates() {
  const assetsDir = path.join(extractedDir, "webview", "assets");
  const statsigGateSourcePattern = /function Ue\(e\)\{return nt\(\),([A-Za-z_$][\w$]*)\(Z,e\)\}/;
  const statsigFile = walkFiles(assetsDir)
    .filter((filePath) => /^statsig-.*\.js$/.test(path.basename(filePath)))
    .find((filePath) => statsigGateSourcePattern.test(fs.readFileSync(filePath, "utf8")));
  if (!statsigFile) {
    throw new Error("Statsig webview gate 补丁目标不存在");
  }
  const nativeGateCode = "const ruizhiNativeFeatureGates=new Set([`3075919032`,`4166894088`,`410262010`]);function ruizhiNativeFeatureGateValue(e){return ruizhiNativeFeatureGates.has(String(e))}";
  const source = fs.readFileSync(statsigFile, "utf8");
  if (source.includes("ruizhiNativeFeatureGateValue")) {
    log("已存在 Codex 原生 webview gate 补丁");
    return;
  }
  const targetGateMatch = source.match(statsigGateSourcePattern);
  if (!targetGateMatch) {
    throw new Error("Codex 原生 webview gate 补丁点不存在");
  }
  const gateHook = targetGateMatch[1];
  const patched = source.replace(
    statsigGateSourcePattern,
    `${nativeGateCode}function Ue(e){return nt(),ruizhiNativeFeatureGateValue(e)||${gateHook}(Z,e)}`
  );
  fs.writeFileSync(statsigFile, patched, "utf8");
  log(`已打开 Codex 原生 webview gate：${path.basename(statsigFile)}`);
}

function patchNativeBrowserDesktopFeatureAvailabilitySource(source) {
  if (source.includes("function ruizhiNativeBrowserDesktopFeatureAvailability(")) {
    return source;
  }

  const helper = "function ruizhiBrowserNativePipeLog(e,t){try{console.info(`[ruizhi][browser] ${e}`,t)}catch{}}function ruizhiNativeBrowserDesktopFeatureAvailability(e){let t={...e,browserPane:!0,inAppBrowserUse:!0,inAppBrowserUseAllowed:!0};return ruizhiBrowserNativePipeLog(`desktopFeatureAvailability`,{before:{browserPane:e.browserPane,inAppBrowserUse:e.inAppBrowserUse,inAppBrowserUseAllowed:e.inAppBrowserUseAllowed},after:{browserPane:t.browserPane,inAppBrowserUse:t.inAppBrowserUse,inAppBrowserUseAllowed:t.inAppBrowserUseAllowed}}),t}";
  const nativeBrowserDesktopFeatureAvailabilityPattern = /function ([A-Za-z_$][\w$]*)\(e,\{buildFlavor:([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\.resolve\(\),env:([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\.default\.env,platform:([A-Za-z_$][\w$]*)=\6\.default\.platform\}=\{\}\)\{let ([A-Za-z_$][\w$]*)=\7===`win32`&&\5\.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE===`1`\?\{\.\.\.e,computerUse:!0,computerUseNodeRepl:!0\}:e,([A-Za-z_$][\w$]*)=\2===\3\.\4\.Dev\?([A-Za-z_$][\w$]*)\(\5\):null;return /;
  const availabilityMatch = source.match(nativeBrowserDesktopFeatureAvailabilityPattern);
  if (availabilityMatch) {
    const [, functionName, buildFlavorName, buildFlavorObject, buildFlavorKey, envName, envObject, platformName, baseName, overrideName, overrideFunctionName] = availabilityMatch;
    const functionEnd = source.indexOf("}function ", availabilityMatch.index + availabilityMatch[0].length);
    if (functionEnd === -1) {
      throw new Error("补丁点不存在：Codex 原生 Browser 桌面能力函数边界");
    }
    const originalFunction = source.slice(availabilityMatch.index, functionEnd + 1);
    const returnExpression = source.slice(availabilityMatch.index + availabilityMatch[0].length, functionEnd);
    return source.replace(
      originalFunction,
      `${helper}function ${functionName}(e,{buildFlavor:${buildFlavorName}=${buildFlavorObject}.${buildFlavorKey}.resolve(),env:${envName}=${envObject}.default.env,platform:${platformName}=${envObject}.default.platform}={}){let ${baseName}=${platformName}===\`win32\`&&${envName}.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE===\`1\`?{...e,computerUse:!0,computerUseNodeRepl:!0}:e,${overrideName}=${buildFlavorName}===${buildFlavorObject}.${buildFlavorKey}.Dev?${overrideFunctionName}(${envName}):null;return ruizhiNativeBrowserDesktopFeatureAvailability(${returnExpression})}`
    );
  }
  const replacements = [
    [
      "function xe(e,{buildFlavor:n=t.O.resolve(),env:r=f.default.env,platform:i=f.default.platform}={}){let a=i===`win32`&&r.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE===`1`?{...e,computerUse:!0,computerUseNodeRepl:!0}:e,o=n===t.O.Dev?Se(r):null;return o==null?a:{...a,...o}}",
      `${helper}function xe(e,{buildFlavor:n=t.O.resolve(),env:r=f.default.env,platform:i=f.default.platform}={}){let a=i===\`win32\`&&r.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE===\`1\`?{...e,computerUse:!0,computerUseNodeRepl:!0}:e,o=n===t.O.Dev?Se(r):null;return ruizhiNativeBrowserDesktopFeatureAvailability(o==null?a:{...a,...o})}`
    ],
    [
      "function ve(e,{env:t=process.env,platform:n=process.platform}={}){return n!==`win32`||t.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE!==`1`?e:{...e,computerUse:!0,computerUseNodeRepl:!0}}",
      `${helper}function ve(e,{env:t=process.env,platform:n=process.platform}={}){let r=n!==\`win32\`||t.CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE!==\`1\`?e:{...e,computerUse:!0,computerUseNodeRepl:!0};return ruizhiNativeBrowserDesktopFeatureAvailability(r)}`
    ]
  ];

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      return source.replace(from, to);
    }
  }

  throw new Error("补丁点不存在：Codex 原生 Browser 桌面能力");
}

function patchNativeBrowserDesktopFeatureAvailability() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  const source = fs.readFileSync(mainFile, "utf8");
  const patched = patchNativeBrowserDesktopFeatureAvailabilitySource(source);
  if (patched === source) {
    log(`已存在 Codex 原生 Browser 桌面能力补丁：${path.basename(mainFile)}`);
    return;
  }
  fs.writeFileSync(mainFile, patched, "utf8");
  log(`已打开 Codex 原生 Browser 桌面能力：${path.basename(mainFile)}`);
}

function patchChatGptAuthExternalBrowserSource(source) {
  if (source.includes("function ruizhiIsChatGptAuthUrl(")) {
    return source;
  }

  const helper = "function ruizhiIsChatGptAuthUrl(e){try{if(typeof e!==`string`)return!1;let t=new URL(e);return(t.protocol===`https:`||t.protocol===`http:`)&&t.pathname===`/oauth/authorize`&&t.searchParams.get(`client_id`)===`app_EMoamEEZ73f0CkXaXp7hrann`}catch{return!1}}";
  const openInBrowserPattern = /case`open-in-browser`:\{let\{url:([A-Za-z_$][\w$]*)\}=([A-Za-z_$][\w$]*);if\(typeof \1==`string`&&this\.windowManager\.queueCodexDeepLinkUrl\(\1,\2\.originHostId\)\)break;if\(\2\.useExternalBrowser===!0\)\{/;
  if (!openInBrowserPattern.test(source)) {
    throw new Error("补丁点不存在：ChatGPT 认证链接外部浏览器打开");
  }

  return source.replace(openInBrowserPattern, (match, urlName, messageName) => {
    return `${helper}case\`open-in-browser\`:{let{url:${urlName}}=${messageName};if(ruizhiIsChatGptAuthUrl(${urlName}))${messageName}={...${messageName},useExternalBrowser:!0};if(typeof ${urlName}==\`string\`&&this.windowManager.queueCodexDeepLinkUrl(${urlName},${messageName}.originHostId))break;if(${messageName}.useExternalBrowser===!0){`;
  });
}

function patchChatGptAuthExternalBrowser() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  const source = fs.readFileSync(mainFile, "utf8");
  const patched = patchChatGptAuthExternalBrowserSource(source);
  if (patched === source) {
    log(`已存在 ChatGPT 认证链接外部浏览器补丁：${path.basename(mainFile)}`);
    return;
  }
  fs.writeFileSync(mainFile, patched, "utf8");
  log(`已强制 ChatGPT 认证链接使用系统浏览器：${path.basename(mainFile)}`);
}

function patchBrowserNativePipeDiagnosticsSource(source) {
  if (source.includes("ruizhiBrowserNativePipeEnabled")) {
    return source;
  }
  const pattern = /function ([A-Za-z_$][\w$]*)\(\{setBrowserUseNativePipeEnabled:([A-Za-z_$][\w$]*)\}\)\{return\{setDesktopFeatureAvailability:([A-Za-z_$][\w$]*)=>\{\3\.inAppBrowserUse!=null&&\2\(\3\.inAppBrowserUse\)\},dispose:\(\)=>\{\2\(!1\)\}\}\}/;
  if (!pattern.test(source)) {
    throw new Error("补丁点不存在：Browser nativePipe 诊断日志");
  }
  return source.replace(pattern, (match, functionName, setterName, availabilityName) => {
    return `function ${functionName}({setBrowserUseNativePipeEnabled:${setterName}}){let ruizhiSetNativePipe=${availabilityName}=>{try{console.info(\`[ruizhi][browser] ruizhiBrowserNativePipeEnabled\`,{enabled:${availabilityName}})}catch{}${setterName}(${availabilityName})};return{setDesktopFeatureAvailability:${availabilityName}=>{${availabilityName}.inAppBrowserUse!=null&&ruizhiSetNativePipe(${availabilityName}.inAppBrowserUse)},dispose:()=>{ruizhiSetNativePipe(!1)}}}`;
  });
}

function patchBrowserNativePipeDiagnostics() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  const source = fs.readFileSync(mainFile, "utf8");
  const patched = patchBrowserNativePipeDiagnosticsSource(source);
  if (patched === source) {
    log(`已存在 Browser nativePipe 诊断日志：${path.basename(mainFile)}`);
    return;
  }
  fs.writeFileSync(mainFile, patched, "utf8");
  log(`已注入 Browser nativePipe 诊断日志：${path.basename(mainFile)}`);
}

function browserNativePipePeerAuthorizerLoggerName(source) {
  const markerIndex = source.indexOf("browser-use-native-pipe-peer-authorizer");
  if (markerIndex < 0) {
    return null;
  }
  const nearbySource = source.slice(Math.max(0, markerIndex - 240), markerIndex + 120);
  const match = nearbySource.match(/var ([A-Za-z_$][\w$]*)=[^;]*`browser-use-native-pipe-peer-authorizer`/);
  return match?.[1] ?? null;
}

function patchBrowserNativePipePeerAuthorizationSource(source) {
  if (source.includes("ruizhiBrowserNativePipePeerAuthorizationDisabled")) {
    return source;
  }

  const pattern = /function ([A-Za-z_$][\w$]*)\(\)\{if\(process\.platform!==`darwin`\)return\(\)=>\(\{authorized:!0\}\);[\s\S]*?(?=function [A-Za-z_$][\w$]*\([A-Za-z_$][\w$]*\)\{let [A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*\._handle\?\.fd;)/;
  if (!pattern.test(source)) {
    throw new Error("补丁点不存在：Browser nativePipe peer authorization");
  }

  const loggerName = browserNativePipePeerAuthorizerLoggerName(source);
  return source.replace(pattern, (match, functionName) => {
    const logCall = loggerName
      ? `try{${loggerName}().info(\`browser-use native pipe peer authorization disabled by Ruizhi\`,{safe:{reason:\`ruizhiBrowserNativePipePeerAuthorizationDisabled\`},sensitive:{}})}catch{}`
      : "";
    return `function ${functionName}(){${logCall}return()=>({authorized:!0})}`;
  });
}

function patchBrowserNativePipePeerAuthorization() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  const source = fs.readFileSync(mainFile, "utf8");
  const patched = patchBrowserNativePipePeerAuthorizationSource(source);
  if (patched === source) {
    log(`已存在 Browser nativePipe peer authorization 补丁：${path.basename(mainFile)}`);
    return;
  }
  fs.writeFileSync(mainFile, patched, "utf8");
  log(`已禁用 Browser nativePipe peer authorization 签名门禁：${path.basename(mainFile)}`);
}

function patchTrustedBrowserClientHashesSource(source, hashes) {
  const normalizedHashes = [...new Set(hashes.map((hash) => String(hash).trim().toLowerCase()))].sort();
  if (normalizedHashes.length === 0) {
    throw new Error("缺少 Browser client nativePipe 信任哈希");
  }
  for (const hash of normalizedHashes) {
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error(`Browser client nativePipe 信任哈希无效：${hash}`);
    }
  }

  const literal = normalizedHashes.map((hash) => `\`${hash}\``).join(",");
  const defaultParamMatch = source.match(/trustedBrowserClientSha256s:([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)/);
  const hashVariableFromDefault = defaultParamMatch?.[2];
  const trustedHashArrayPatterns = [
    ...(hashVariableFromDefault
      ? [new RegExp(`var (${escapeRegExp(hashVariableFromDefault)})=\\[(?:\\\`[a-f0-9]{64}\\\`(?:,)?)*\\]`, "g")]
      : []),
    /var ([A-Za-z_$][\w$]*)=\[(?:`[a-f0-9]{64}`(?:,)?)*\],([A-Za-z_$][\w$]*)=class/g,
  ];

  let replaced = false;
  let patched = source;
  for (const pattern of trustedHashArrayPatterns) {
    patched = patched.replace(pattern, (match, hashVariable, classVariable) => {
      replaced = true;
      const suffix = typeof classVariable === "string" && /^[A-Za-z_$][\w$]*$/.test(classVariable)
        ? `,${classVariable}=class`
        : "";
      return `var ${hashVariable}=[${literal}]${suffix}`;
    });
    if (replaced) {
      break;
    }
  }

  if (!replaced) {
    throw new Error("补丁点不存在：Browser client nativePipe 信任哈希");
  }

  return patched;
}

function browserClientHashesFromResourcesDir(resourcesDir) {
  const hashes = [];
  for (const pluginName of browserRuntimePluginNames) {
    const clientPath = path.join(
      resourcesDir,
      "plugins",
      "openai-bundled",
      "plugins",
      pluginName,
      "scripts",
      "browser-client.mjs"
    );
    if (fs.existsSync(clientPath)) {
      hashes.push(sha256File(clientPath));
    }
  }
  if (hashes.length === 0) {
    throw new Error(`运行态缺少 Browser client 脚本：${path.join(resourcesDir, "plugins", "openai-bundled")}`);
  }
  return [...new Set(hashes)].sort();
}

function patchTrustedBrowserClientHashes() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  const hashes = browserClientHashesFromResourcesDir(appResourcesDir());
  const source = fs.readFileSync(mainFile, "utf8");
  const patched = patchTrustedBrowserClientHashesSource(source, hashes);
  const hashSummary = hashes.map((hash) => hash.slice(0, 12)).join(",");
  if (patched === source) {
    log(`已存在 Browser client nativePipe 信任哈希：${hashSummary}`);
    return;
  }
  fs.writeFileSync(mainFile, patched, "utf8");
  log(`已更新 Browser client nativePipe 信任哈希：${hashSummary}`);
}

function replaceLocaleMessage(source, key, value) {
  const pattern = new RegExp(`("${escapeRegExp(key)}":)\`[^\`]*\``);
  if (!pattern.test(source)) {
    throw new Error(`找不到中文翻译键：${key}`);
  }
  return source.replace(pattern, `$1\`${value}\``);
}

function patchWebviewLocales() {
  const assetsDir = path.join(extractedDir, "webview", "assets");
  const localeFiles = fs.readdirSync(assetsDir)
    .filter((name) => /^zh-(CN|HK|TW)-.*\.js$/.test(name))
    .map((name) => path.join(assetsDir, name));
  const globalReplacements = new Map([
    ["electron.onboarding.login.includedPlans.welcomeV2", ruizhiBuildDateLabel()]
  ]);
  const allLocaleFiles = fs.readdirSync(assetsDir)
    .filter((name) => /\.js$/.test(name))
    .map((name) => path.join(assetsDir, name))
    .filter((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");
      return [...globalReplacements.keys()].some((key) =>
        new RegExp(`"${escapeRegExp(key)}":\``).test(source)
      );
    });

  if (localeFiles.length === 0) {
    throw new Error("找不到中文 webview locale bundle");
  }
  if (allLocaleFiles.length === 0) {
    throw new Error("找不到 webview locale bundle");
  }

  const replacements = new Map([
    ["electron.onboarding.login.chatgpt.continue", "使用锐擎继续"],
    ["electron.onboarding.login.chatgpt.signIn.streamlined", "使用锐擎继续"]
  ]);

  for (const localeFile of allLocaleFiles) {
    writePatchedFile(localeFile, (source) => {
      let next = source;
      for (const [key, value] of globalReplacements) {
        next = replaceLocaleMessage(next, key, value);
      }
      return next;
    });
    log(`已补丁通用翻译：${path.basename(localeFile)}`);
  }

  for (const localeFile of localeFiles) {
    writePatchedFile(localeFile, (source) => {
      let next = source;
      for (const [key, value] of replacements) {
        next = replaceLocaleMessage(next, key, value);
      }
      return next;
    });
    log(`已补丁中文翻译：${path.basename(localeFile)}`);
  }
}

function patchPackageMetadata() {
  const packagePath = path.join(extractedDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  packageJson.name = "ruizhi-desktop";
  packageJson.productName = config.productName;
  packageJson.version = appVersion;
  packageJson.description = "锐智桌面端";
  fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  log("已补丁 package 元数据");
}

function patchWebviewHtml() {
  const htmlPath = path.join(extractedDir, "webview", "index.html");
  writePatchedFile(htmlPath, (source) =>
    replaceExact(source, "<title>Codex</title>", `<title>${config.productName}</title>`, "窗口标题")
  );
  log("已补丁 webview HTML 标题");
}

function patchDefaultLocale() {
  const assetsDir = path.join(extractedDir, "webview", "assets");
  const localeResolverFile = findOneFile(assetsDir, /^locale-resolver-.*\.js$/, "locale resolver bundle");
  writePatchedFile(localeResolverFile, (source) =>
    replaceExact(source, "var t=`en-US`", `var t=\`${config.locale}\``, "默认语言")
  );
  log(`已补丁默认语言：${path.basename(localeResolverFile)}`);
}

function templateLiteralValuePattern() {
  return /`((?:\\.|[^`\\])*)`/g;
}

function replaceBrandInVisibleText(value) {
  return value.replace(/Codex/g, (match, offset, source) => {
    const before = source.slice(Math.max(0, offset - 16), offset);
    if (/GPT-[0-9A-Za-z_. -]*$/i.test(before)) {
      return match;
    }
    return config.productName;
  });
}

function localeBundlePattern(locale) {
  return new RegExp(`^${escapeRegExp(locale)}-.*\\.js$`);
}

function loadLocaleMessages(locale) {
  const assetsDir = path.join(extractedDir, "webview", "assets");
  const localeFile = findOneFile(assetsDir, localeBundlePattern(locale), `${locale} locale bundle`);
  const source = fs.readFileSync(localeFile, "utf8");
  const messages = new Map();
  const pattern = /"((?:\\.|[^"\\])+)":`((?:\\.|[^`\\])*)`/g;

  for (const match of source.matchAll(pattern)) {
    messages.set(match[1], replaceBrandInVisibleText(match[2]));
  }

  if (messages.size === 0) {
    throw new Error(`${locale} locale bundle 为空：${localeFile}`);
  }

  return { localeFile, messages };
}

function patchTemplateLiteralValues(source, transform) {
  return source.replace(templateLiteralValuePattern(), (literal, value) => {
    const next = transform(value);
    return next === value ? literal : `\`${next}\``;
  });
}

function patchLocaleBundleBrandText(localeFile) {
  const original = fs.readFileSync(localeFile, "utf8");
  const patched = patchTemplateLiteralValues(original, replaceBrandInVisibleText);
  if (patched !== original) {
    fs.writeFileSync(localeFile, patched, "utf8");
  }
}

function listWebviewTextFiles() {
  const webviewRoot = path.join(extractedDir, "webview");
  const allowedExtensions = new Set([".js", ".html"]);
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  walk(webviewRoot);
  return files;
}

function patchFrontendDefaultMessages() {
  const { localeFile, messages } = loadLocaleMessages(config.locale);
  let changedFiles = 0;
  let changedMessages = 0;

  patchLocaleBundleBrandText(localeFile);

  for (const filePath of listWebviewTextFiles()) {
    if (filePath === localeFile) {
      continue;
    }
    const original = fs.readFileSync(filePath, "utf8");
    const patched = original.replace(
      /id:`([^`]+)`,defaultMessage:`((?:\\.|[^`\\])*)`/g,
      (match, id, defaultMessage) => {
        const localized = messages.get(id);
        const nextMessage = localized ?? replaceBrandInVisibleText(defaultMessage);
        if (nextMessage === defaultMessage) {
          return match;
        }
        changedMessages += 1;
        return `id:\`${id}\`,defaultMessage:\`${nextMessage}\``;
      }
    );

    if (patched !== original) {
      fs.writeFileSync(filePath, patched, "utf8");
      changedFiles += 1;
    }
  }

  log(`已补丁前端默认中文文案：${changedMessages} 条，${changedFiles} 个文件`);
}

function patchAppSunsetGate() {
  const assetsDir = path.join(extractedDir, "webview", "assets");
  const appSunsetFile = findOneFileByContent(
    assetsDir,
    /\.js$/,
    /appSunset\.title[\s\S]*`2929582856`/,
    "app sunset gate bundle"
  );

  writePatchedFile(appSunsetFile, (source) =>
    replaceRegex(
      source,
      /if\(([A-Za-z_$][\w$]*)\(`2929582856`\)\)\{/,
      "if(false&&$1(`2929582856`)){",
      "禁用远端 app sunset 强制更新拦截"
    )
  );
  log(`已禁用 app sunset 强制更新拦截：${path.basename(appSunsetFile)}`);
}

function patchModelAvailabilityAllowlist() {
  if (!modelCatalogEnabled()) {
    log("跳过模型白名单补丁：自定义模型目录已关闭");
    return;
  }

  const assetsDir = path.join(extractedDir, "webview", "assets");
  const modelAvailabilityAllowlistPattern = /&&[A-Za-z_$][\w$]*!==`amazonBedrock`/;
  const modelSettingsFile = findOneFileByContent(
    assetsDir,
    /^(use-model-settings|model-queries|models-and-reasoning-efforts)-.*\.js$/,
    modelAvailabilityAllowlistPattern,
    "model settings bundle"
  );

  writePatchedFile(modelSettingsFile, (source) =>
    replaceRegex(
      source,
      /[A-Za-z_$][\w$]*(?:\.useHiddenModels)?&&[A-Za-z_$][\w$]*!==`amazonBedrock`/,
      "!1",
      "禁用官方模型 available_models 白名单过滤"
    )
  );

  log(`已禁用模型白名单过滤：${path.basename(modelSettingsFile)}`);
}

function patchOfficialUpdateLogic() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  writePatchedFileIfChanged(mainFile, (source) =>
    replaceExactIfPresent(
      source,
      "d=t.C.shouldIncludeSparkle(a,process.platform,process.env),f=t.C.shouldIncludeUpdater(a,process.platform,process.env)",
      "d=!1,f=!1",
      "禁用 Codex 官方 Sparkle/updater 能力"
    )
  );
  log(`已禁用 Codex 官方更新逻辑：${path.basename(mainFile)}`);
}

function applicationMenuPatchSource() {
  return `function ruizhiTranslateApplicationMenu(e){const t=new Map(Object.entries({"File":"文件","Edit":"编辑","View":"视图","Window":"窗口","Help":"帮助","Settings":"设置","Settings…":"设置…","Preferences":"偏好设置","Log Out":"退出登录","Quit":"退出","About":"关于","Services":"服务","Hide":"隐藏","Hide Others":"隐藏其他","Show All":"全部显示","New Chat":"新聊天","Quick Chat":"快速对话","New Window":"新窗口","Open Folder…":"打开文件夹…","Close":"关闭","Reload Window":"重新加载窗口","Toggle Sidebar":"切换侧边栏","Toggle Terminal":"切换终端","Toggle File Tree":"切换文件树","Open Browser Tab":"打开浏览器标签页","Toggle Browser Panel":"切换浏览器面板","Toggle Side Panel":"切换侧边面板","Find":"查找","Previous Chat":"上一个对话","Next Chat":"下一个对话","Back":"后退","Forward":"前进","Zoom In":"放大","Zoom Out":"缩小","Actual Size":"实际大小","Toggle Full Screen":"切换全屏","Codex Documentation":"帮助首页","What's new":"更新内容","Automations":"自动化","Local Environments":"本地环境","Worktrees":"工作树","Skills":"技能","Model Context Protocol":"MCP","Troubleshooting":"故障排查","Send Feedback":"发送反馈","Keyboard Shortcuts":"键盘快捷键"}));function r(e){let r=String(e||"").replace(/&/g,"").replace(/\\.\\.\\.$/,"…").trim();if(t.has(r))return t.get(r);let n=r.replace(/…$/,"").trim();if(t.has(n))return t.get(n);if(r.startsWith("About "))return r.replace(/^About /,"关于 ");if(r.startsWith("Hide "))return r.replace(/^Hide /,"隐藏 ");if(r.startsWith("Quit "))return r.replace(/^Quit /,"退出 ");return e}function i(e){if(!e)return;if(typeof e.label==="string"&&e.label.length>0)e.label=r(e.label);let t=e.submenu?.items;if(Array.isArray(t))for(const e of t)i(e)}if(Array.isArray(e?.items))for(const t of e.items)i(t);return e}function ruizhiEnsureNativeMenuItems({menu:e,MenuItem:t,ensureWindow:n,navigate:r,settingsRoute:i}){let a=o=>String(o?.label||"").replace(/&/g,"").replace(/\\.\\.\\.$/,"…").trim(),o=[];function s(e){if(!e)return;let t=e.items??e.submenu?.items;if(!Array.isArray(t))return;for(const e of t)o.push(e),s(e.submenu)}s(e);let c=e=>{if(e){e.visible=!0;e.enabled=!0}},l=e=>{let t=o.find(t=>e.test(a(t)));return t&&c(t),t},u=l(/^(Settings|设置|Preferences|偏好设置)/),d=async()=>{let e=await n();e&&r(e,i)},f=e?.items?.[0]?.submenu;if(u)u.click=d;else if(f?.insert){let e=new t({label:\`设置…\`,accelerator:\`CmdOrCtrl+,\`,click:d});f.insert(Math.min(2,f.items.length),e)}let p=l(/^(Automations|自动化)$/),m=async()=>{let e=await n();e&&r(e,\`/automations\`)};if(p)p.click=m;else{let n=e?.items?.find(e=>/^(Help|帮助)$/.test(a(e)))?.submenu??f;if(n?.insert){let e=new t({label:\`自动化\`,click:m});n.insert(Math.min(2,n.items.length),e)}}}`;
}

function patchApplicationMenu() {
  const buildDir = path.join(extractedDir, ".vite", "build");
  const mainFile = findOneFile(buildDir, /^main-.*\.js$/, "Electron main bundle");
  writePatchedFileIfChanged(mainFile, (source) => {
    let next = source;
    if (!next.includes("function ruizhiTranslateApplicationMenu(")) {
      next = replaceRegex(
        next,
        /function ([A-Za-z_$][\w$]*)\(\{buildFlavor:/,
        `${applicationMenuPatchSource()}function $1({buildFlavor:`,
        "注入 macOS 顶部菜单修复函数"
      );
    }

    const settingsMenuMatch = next.match(/\{\.\.\.[A-Za-z_$][\w$]*\(`settings`\),click:async\(\)=>\{let e=await ([A-Za-z_$][\w$]*)\(\);e&&([A-Za-z_$][\w$]*)\(e,([A-Za-z_$][\w$]*)\)\}\}/);
    if (!settingsMenuMatch) {
      throw new Error("补丁点不存在：捕获 macOS 设置菜单导航变量");
    }
    const [, ensureWindowName, navigateName, settingsRouteName] = settingsMenuMatch;
    const setApplicationMenuMatch = next.match(/([A-Za-z_$][\w$]*)\.Menu\.setApplicationMenu\(([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\)/);
    if (!setApplicationMenuMatch) {
      throw new Error("补丁点不存在：挂载 macOS 顶部菜单修复");
    }
    const [, electronName, menuName, afterSetApplicationMenuName, afterSetApplicationMenuArg] = setApplicationMenuMatch;

    next = next.replace(
      new RegExp(`\\{label:\\\`Automations\\\`,click:\\(\\)=>\\{${escapeRegExp(electronName)}\\.shell\\.openExternal\\(\\\`[^\\\`]+\\\`\\)\\}\\}`),
      `{label:\`Automations\`,click:async()=>{let e=await ${ensureWindowName}();e&&${navigateName}(e,\`/automations\`)}}`
    );
    if (!next.includes(`ruizhiEnsureNativeMenuItems({menu:${menuName}`)) {
      next = next.replace(
        setApplicationMenuMatch[0],
        `try{ruizhiEnsureNativeMenuItems({menu:${menuName},MenuItem:${electronName}.MenuItem,ensureWindow:${ensureWindowName},navigate:${navigateName},settingsRoute:${settingsRouteName}});ruizhiTranslateApplicationMenu(${menuName})}catch(e){console.error(\`锐智菜单修复失败\`,e)}${electronName}.Menu.setApplicationMenu(${menuName}),${afterSetApplicationMenuName}(${afterSetApplicationMenuArg})`
      );
    }
    return next;
  });
  log(`已补丁 macOS 顶部菜单：${path.basename(mainFile)}`);
}

function bootstrapInitCode(electronName) {
  const posixLocale = config.locale.replace("-", "_");
  const imageGenHelper = imageGenHelperName();
  const marketplaceSpecs = pluginMarketplaces().map((marketplace) => ({
    name: marketplace.name,
    resourcePath: splitConfigPath(marketplace.resourcePath),
    installPath: splitConfigPath(marketplace.installPath),
    versionManifestPath: splitConfigPath(marketplace.versionManifestPath),
    sourceToken: marketplaceSourceToken(marketplace.name)
  }));
  marketplaceSpecs.push({
    name: "openai-bundled",
    resourcePath: ["plugins", "openai-bundled"],
    installPath: [".tmp", "bundled-marketplaces", "openai-bundled"],
    versionManifestPath: [".agents", "plugins", "marketplace.json"],
    sourceToken: marketplaceSourceToken("openai-bundled"),
    alwaysCopy: true,
    hardcodedPlugins: true
  });
  const execPolicyConfig = config.execPolicy ?? {};
  const managedRulesFileName = execPolicyConfig.managedRulesFileName ?? "ruizhi-managed.rules";
  const allowPrefixRules = builtInAllowPrefixRules();

  return `
function ruizhiInit(){
  try{
    const fs=require("node:fs");
    const os=require("node:os");
    const path=require("node:path");
    const productName=${jsonLiteral(config.productName)};
    const electronUserDataDirName=${jsonLiteral(electronUserDataDirName)};
    const locale=${jsonLiteral(config.locale)};
    const posixLocale=${jsonLiteral(posixLocale)};
    const ruizhiHomeEnvName=${jsonLiteral(ruizhiHomeEnvName)};
    const ruizhiDefaultHomeDirName=${jsonLiteral(ruizhiDefaultHomeDirName)};
    const openaiBaseUrl=${jsonLiteral(config.openai.baseUrl)};
    const modelProviderBaseUrl=${jsonLiteral(modelProviderBaseUrl())};
    const modelBridgeConfig=${jsonLiteral({
      enabled: modelBridgeEnabled(),
      host: modelBridgeHost(),
      port: modelBridgePort(),
      scriptResourcePath: splitConfigPath(modelBridgeRuntimeResourcePath()),
      routes: modelBridgeRoutes()
    })};
    const modelCatalogEnabled=${jsonLiteral(modelCatalogEnabled())};
    const modelCatalogRemoteUrl=${jsonLiteral(modelCatalogRemoteUrl())};
    const imageGenHelper=${jsonLiteral(imageGenHelper)};
    const modelCatalogFile="ruizhi-model-catalog.json";
    const userModelCatalogFile="models_cache.json";
    const imageGenSkillPath=["skills",".system","imagegen","SKILL.md"];
    const managedRulesFileName=${jsonLiteral(managedRulesFileName)};
    const allowPrefixRules=${jsonLiteral(allowPrefixRules)};
    const home=os.homedir();
    const resourcesRoot=process.resourcesPath||path.dirname(process.execPath);
    function defaultUserDataPath(){
      if(process.platform==="win32"){
        return path.join(process.env.APPDATA||path.join(home,"AppData","Roaming"),electronUserDataDirName);
      }
      if(process.platform==="darwin"){
        return path.join(home,"Library","Application Support",electronUserDataDirName);
      }
      return path.join(process.env.XDG_CONFIG_HOME||path.join(home,".config"),electronUserDataDirName);
    }
    const explicitRuizhiHome=(process.env[ruizhiHomeEnvName]||"").trim();
    const explicitCodexHome=(process.env.CODEX_HOME||"").trim();
    const codexHome=explicitRuizhiHome||explicitCodexHome||path.join(home,ruizhiDefaultHomeDirName);
    const userData=(process.env.CODEX_ELECTRON_USER_DATA_PATH||"").trim()||defaultUserDataPath();
    function stableModelBridgePort(basePort,seed){
      let hash=0;
      for(const char of String(seed||"")){
        hash=(hash*31+char.charCodeAt(0))>>>0;
      }
      return basePort+1+(hash%997);
    }
    modelBridgeConfig.port=stableModelBridgePort(modelBridgeConfig.port,resourcesRoot);
    function ensureLoopbackNoProxy(){
      const required=["127.0.0.1","localhost","::1"];
      const existing=[process.env.NO_PROXY,process.env.no_proxy].filter(value=>typeof value==="string"&&value.trim()).join(",");
      const parts=existing.split(",").map(value=>value.trim()).filter(Boolean);
      const lower=new Set(parts.map(value=>value.toLowerCase()));
      for(const host of required){
        if(!lower.has(host.toLowerCase()))parts.push(host);
      }
      const next=parts.join(",");
      process.env.NO_PROXY=next;
      process.env.no_proxy=next;
    }
    ensureLoopbackNoProxy();
    function startModelBridge(){
      if(!modelBridgeConfig.enabled)return null;
      const scriptPath=path.join(resourcesRoot,...modelBridgeConfig.scriptResourcePath);
      const bridge=require(scriptPath).startRuizhiResponsesBridge({
        host:modelBridgeConfig.host,
        port:modelBridgeConfig.port,
        upstreamBaseUrl:openaiBaseUrl,
        authHome:codexHome,
        catalogPath:path.join(codexHome,userModelCatalogFile),
        routes:modelBridgeConfig.routes
      });
      return bridge.baseUrl;
    }
    fs.mkdirSync(codexHome,{recursive:true});
    fs.mkdirSync(userData,{recursive:true});
    syncModelCache();
    const runtimeBridgeBaseUrl=startModelBridge();
    const runtimeModelProviderBaseUrl=runtimeBridgeBaseUrl||modelProviderBaseUrl;
    process.env[ruizhiHomeEnvName]=codexHome;
    process.env.CODEX_HOME=codexHome;
    process.env.CODEX_ELECTRON_USER_DATA_PATH=userData;
    process.env.RUIZHI_OPENAI_BASE_URL=openaiBaseUrl;
    process.env.RUIZHI_MODEL_PROVIDER_BASE_URL=runtimeModelProviderBaseUrl;
    process.env.RUIZHI_IMAGEGEN_EXE=path.join(resourcesRoot,"bin",imageGenHelper);
    process.env.LANG=${jsonLiteral(`${posixLocale}.UTF-8`)};
    process.env.LANGUAGE=posixLocale;
    process.env.LC_ALL=${jsonLiteral(`${posixLocale}.UTF-8`)};
    try{${electronName}.app.commandLine.appendSwitch("lang",locale)}catch{}

    function copyIfChanged(source,target){
      if(!fs.existsSync(source))return false;
      let changed=true;
      try{
        changed=!fs.existsSync(target)||fs.readFileSync(source).compare(fs.readFileSync(target))!==0;
      }catch{
        changed=true;
      }
      if(changed){
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.copyFileSync(source,target);
      }
      return changed;
    }
    function syncModelCache(){
      const target=path.join(codexHome,userModelCatalogFile);
      if(!modelCatalogEnabled){
        return;
      }
      syncBundledModelCatalogCache();
      if(!modelCatalogRemoteUrl)return;
      setTimeout(()=>{
        const temp=path.join(codexHome,\`.model-catalog.\${Date.now()}.\${Math.random().toString(16).slice(2)}.tmp\`);
        try{
          downloadRemoteModelCatalog(modelCatalogRemoteUrl,temp);
          validateModelCatalogFile(temp);
          normalizeModelCatalogFile(temp);
          const changed=!fs.existsSync(target)||fs.readFileSync(temp).compare(fs.readFileSync(target))!==0;
          if(!changed){
            fs.rmSync(temp,{force:true});
            return;
          }
          backupExistingModelCatalog(target);
          fs.renameSync(temp,target);
        }catch(error){
          fs.rmSync(temp,{force:true});
          console.warn("ruizhi remote model catalog sync failed",error);
          syncBundledModelCatalogCache();
        }
      },1000);
    }
    function bundledModelCatalogPath(){
      return path.join(resourcesRoot,"models",modelCatalogFile);
    }
    function syncBundledModelCatalogCache(){
      const target=path.join(codexHome,userModelCatalogFile);
      try{
        return writeModelCatalogCacheFromSource(bundledModelCatalogPath(),target);
      }catch(error){
        console.warn("ruizhi bundled model catalog sync failed",error);
        return false;
      }
    }
    function writeModelCatalogCacheFromSource(source,target){
      const temp=path.join(codexHome,\`.model-catalog.\${Date.now()}.\${Math.random().toString(16).slice(2)}.tmp\`);
      try{
        if(!fs.existsSync(source))throw new Error("内置模型目录不存在："+source);
        fs.mkdirSync(path.dirname(temp),{recursive:true});
        fs.copyFileSync(source,temp);
        validateModelCatalogFile(temp);
        normalizeModelCatalogFile(temp);
        const changed=!fs.existsSync(target)||fs.readFileSync(temp).compare(fs.readFileSync(target))!==0;
        if(!changed){
          fs.rmSync(temp,{force:true});
          return false;
        }
        backupExistingModelCatalog(target);
        fs.renameSync(temp,target);
        return true;
      }catch(error){
        fs.rmSync(temp,{force:true});
        throw error;
      }
    }
    function downloadRemoteModelCatalog(url,target){
      const childProcess=require("node:child_process");
      fs.mkdirSync(path.dirname(target),{recursive:true});
      let result;
      if(process.platform==="win32"){
        const command=[
          "$ErrorActionPreference='Stop';",
          "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;",
          "Invoke-WebRequest -Uri $env:RUIZHI_MODEL_CATALOG_URL -OutFile $env:RUIZHI_MODEL_CATALOG_TARGET -UseBasicParsing"
        ].join(" ");
        result=childProcess.spawnSync("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-Command",command],{
          encoding:"utf8",
          timeout:25000,
          env:{...process.env,RUIZHI_MODEL_CATALOG_URL:url,RUIZHI_MODEL_CATALOG_TARGET:target}
        });
      }else{
        result=childProcess.spawnSync("curl",["-fL","--connect-timeout","8","--max-time","25","-o",target,url],{encoding:"utf8",timeout:30000});
      }
      if(result.error)throw result.error;
      if(result.status!==0)throw new Error(String(result.stderr||result.stdout||\`download failed with status \${result.status}\`).trim());
    }
    function validateModelCatalogFile(filePath){
      const catalog=JSON.parse(fs.readFileSync(filePath,"utf8"));
      if(!catalog||typeof catalog!=="object"||!Array.isArray(catalog.models)||catalog.models.length===0){
        throw new Error("远程模型目录格式无效");
      }
      return catalog;
    }
    function applyRuizhiModelCatalogCompatibilityPatches(catalog){
      if(!catalog||typeof catalog!=="object"||!Array.isArray(catalog.models))return catalog;
      const guidance="\\n\\n## Codex Desktop Plugin Control\\n- When the user invokes \`[@浏览器]\` or \`plugin://browser@openai-bundled\`, use the Browser plugin's trusted runtime through the \`mcp__node_repl__js\` tool and select the \`iab\` browser. Do not use \`exec_command\`, \`node -e\`, standalone Playwright, or a system browser for this plugin.\\n- Browser plugin native-pipe authorization depends on Codex turn metadata in \`nodeRepl.requestMeta\`; a separate shell process cannot provide the required \`session_id\` / \`turn_id\` and will fail as not trusted.";
      const append=value=>{
        if(typeof value!=="string"||value.length===0)return value;
        if(value.includes("plugin://browser@openai-bundled")&&value.includes("mcp__node_repl__js"))return value;
        return value.trimEnd()+guidance;
      };
      for(const model of catalog.models){
        if(!model||typeof model!=="object")continue;
        if(!Array.isArray(model.input_modalities))model.input_modalities=["text","image"];
        if(typeof model.slug==="string"&&/^qwen/i.test(model.slug)){
          model.base_instructions=append(model.base_instructions);
          if(model.model_messages&&typeof model.model_messages==="object"){
            model.model_messages.instructions_template=append(model.model_messages.instructions_template);
          }
        }
      }
      return catalog;
    }
    function normalizeModelCatalogFile(filePath){
      const catalog=validateModelCatalogFile(filePath);
      applyRuizhiModelCatalogCompatibilityPatches(catalog);
      catalog.fetched_at=new Date().toISOString();
      fs.writeFileSync(filePath,JSON.stringify(catalog,null,2)+"\\n","utf8");
      return catalog;
    }
    function backupExistingModelCatalog(target){
      if(!fs.existsSync(target))return;
      const stamp=new Date().toISOString().replace(/[:.]/g,"-");
      fs.copyFileSync(target,\`\${target}.bak-\${stamp}\`);
    }
    function syncImageGenSkill(){
      copyIfChanged(path.join(resourcesRoot,...imageGenSkillPath),path.join(codexHome,...imageGenSkillPath));
    }
    function copyDirectoryEntriesIfMissing(sourceRoot,targetRoot){
      if(!fs.existsSync(sourceRoot))return 0;
      let copied=0;
      fs.mkdirSync(targetRoot,{recursive:true});
      for(const entry of fs.readdirSync(sourceRoot,{withFileTypes:true})){
        if(entry.name.startsWith(".")||entry.name==="openai-docs")continue;
        const source=path.join(sourceRoot,entry.name);
        const target=path.join(targetRoot,entry.name);
        if(fs.existsSync(target))continue;
        fs.cpSync(source,target,{recursive:true});
        copied+=1;
      }
      return copied;
    }
    function syncLegacyCodexGlobalSkills(){
      copyDirectoryEntriesIfMissing(path.join(home,".codex","skills"),path.join(home,".agents","skills"));
    }
    syncImageGenSkill();
    syncLegacyCodexGlobalSkills();

    const marketplaceSpecs=${jsonLiteral(marketplaceSpecs)};
    const hardcodedOpenAIBundledPlugins=${jsonLiteral(openAIBundledPluginDefinitions)};
    function assertInside(base,target){
      const relative=path.relative(path.resolve(base),path.resolve(target));
      if(!relative||relative.startsWith("..")||path.isAbsolute(relative)){
        throw new Error("拒绝覆盖锐智目录外的 marketplace："+target);
      }
    }
    function readMarketplaceVersion(root,spec){
      const manifestPath=path.join(root,...spec.versionManifestPath);
      if(!fs.existsSync(manifestPath))return null;
      const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
      return [manifest.name||"",manifest.version||""].join("@");
    }
    function hardcodedOpenAIBundledMarketplace(){
      return {
        name:"openai-bundled",
        interface:{displayName:"OpenAI"},
        plugins:hardcodedOpenAIBundledPlugins.map(plugin=>({
          name:plugin.name,
          source:{source:"local",path:plugin.path},
          policy:{installation:"AVAILABLE",authentication:"ON_INSTALL"},
          category:plugin.category
        }))
      };
    }
    function writeHardcodedOpenAIBundledMarketplace(root){
      const missing=[];
      for(const plugin of hardcodedOpenAIBundledPlugins){
        const pluginRoot=path.join(root,"plugins",plugin.name);
        const manifestPath=path.join(pluginRoot,".codex-plugin","plugin.json");
        if(!fs.existsSync(manifestPath))missing.push(plugin.name);
      }
      if(missing.length>0){
        throw new Error("内置 OpenAI 插件资源缺失："+missing.join(", "));
      }
      const marketplacePath=path.join(root,".agents","plugins","marketplace.json");
      fs.mkdirSync(path.dirname(marketplacePath),{recursive:true});
      fs.writeFileSync(marketplacePath,JSON.stringify(hardcodedOpenAIBundledMarketplace(),null,2)+"\\n","utf8");
    }
    function copyMarketplaceDirectory(sourceRoot,targetRoot,spec){
      const stagingRoot=targetRoot+".staging-"+process.pid+"-"+Date.now();
      assertInside(codexHome,targetRoot);
      assertInside(codexHome,stagingRoot);
      fs.rmSync(stagingRoot,{recursive:true,force:true});
      try{
        fs.mkdirSync(path.dirname(stagingRoot),{recursive:true});
        fs.cpSync(sourceRoot,stagingRoot,{recursive:true});
        if(spec.hardcodedPlugins)writeHardcodedOpenAIBundledMarketplace(stagingRoot);
        fs.rmSync(targetRoot,{recursive:true,force:true});
        fs.renameSync(stagingRoot,targetRoot);
      }catch(error){
        fs.rmSync(stagingRoot,{recursive:true,force:true});
        throw error;
      }
    }
    function syncMarketplaces(){
      const tokenValues={};
      for(const spec of marketplaceSpecs){
        const sourceRoot=path.join(resourcesRoot,...spec.resourcePath);
        const targetRoot=path.join(codexHome,...spec.installPath);
        tokenValues[spec.sourceToken]=targetRoot;
        try{
          const sourceVersion=readMarketplaceVersion(sourceRoot,spec);
          if(!sourceVersion)throw new Error("缺少 marketplace 版本清单："+sourceRoot);
          const targetVersion=readMarketplaceVersion(targetRoot,spec);
          if(spec.alwaysCopy||sourceVersion!==targetVersion){
            copyMarketplaceDirectory(sourceRoot,targetRoot,spec);
          }else if(spec.hardcodedPlugins){
            writeHardcodedOpenAIBundledMarketplace(targetRoot);
          }
        }catch(error){
          console.error("ruizhi marketplace sync failed",spec.name,error);
        }
      }
      return tokenValues;
    }
    function readPluginVersion(root){
      const manifestPath=path.join(root,".codex-plugin","plugin.json");
      if(!fs.existsSync(manifestPath))return null;
      const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
      return String(manifest.version||"").trim()||null;
    }
    function copyPluginCacheFiles(pluginName,sourceRoot,targetRoot){
      const runtimePluginNames=new Set(["browser","chrome"]);
      const entries=[
        {name:".codex-plugin",parts:[".codex-plugin"]},
        {name:"assets",parts:["assets"]},
        {name:"skills",parts:["skills"]},
        {name:"scripts",parts:["scripts"]}
      ];
      for(const entry of entries){
        if(entry.name==="scripts"&&runtimePluginNames.has(pluginName)===false)continue;
        const source=path.join(sourceRoot,...entry.parts);
        if(!fs.existsSync(source))continue;
        const target=path.join(targetRoot,...entry.parts);
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.cpSync(source,target,{recursive:true,force:true});
      }
    }
    function ensureOpenAIBundledPluginCache(sourceRoot,cacheRoot,pluginName,version){
      const pluginCacheRoot=path.join(cacheRoot,pluginName);
      const targetRoot=path.join(pluginCacheRoot,version);
      fs.mkdirSync(pluginCacheRoot,{recursive:true});
      copyPluginCacheFiles(pluginName,sourceRoot,targetRoot);
    }
    function syncInstalledOpenAIBundledPluginCache(){
      const sourcePluginsRoot=path.join(codexHome,".tmp","bundled-marketplaces","openai-bundled","plugins");
      const cacheRoot=path.join(codexHome,"plugins","cache","openai-bundled");
      if(!fs.existsSync(sourcePluginsRoot))return;
      for(const entry of fs.readdirSync(sourcePluginsRoot,{withFileTypes:true})){
        if(!entry.isDirectory())continue;
        try{
          const sourceRoot=path.join(sourcePluginsRoot,entry.name);
          const version=readPluginVersion(sourceRoot);
          if(!version)continue;
          ensureOpenAIBundledPluginCache(sourceRoot,cacheRoot,entry.name,version);
        }catch(error){
          console.error("ruizhi OpenAI plugin cache sync failed",entry.name,error);
        }
      }
    }
    function marketplaceRoot(name,marketplaceSources){
      const spec=marketplaceSpecs.find(item=>item.name===name);
      return spec?marketplaceSources[spec.sourceToken]:null;
    }
    function splitRulePath(value){
      return String(value??"").split(/[\\\\/]+/).filter(Boolean);
    }
    function resolveRulePath(rule,marketplaceSources){
      if(rule.marketplace&&rule.path){
        const root=marketplaceRoot(rule.marketplace,marketplaceSources);
        return root?path.join(root,...splitRulePath(rule.path)):null;
      }
      if(rule.homePath){
        return path.join(home,...splitRulePath(rule.homePath));
      }
      if(rule.codexHomePath){
        return path.join(codexHome,...splitRulePath(rule.codexHomePath));
      }
      if(rule.resourcePath){
        return path.join(resourcesRoot,...splitRulePath(rule.resourcePath));
      }
      return null;
    }
    function resolveRuleCommandPath(rule,marketplaceSources){
      if(rule.commandMarketplace&&rule.commandPath){
        const root=marketplaceRoot(rule.commandMarketplace,marketplaceSources);
        return root?path.join(root,...splitRulePath(rule.commandPath)):null;
      }
      if(rule.commandHomePath){
        return path.join(home,...splitRulePath(rule.commandHomePath));
      }
      if(rule.commandCodexHomePath){
        return path.join(codexHome,...splitRulePath(rule.commandCodexHomePath));
      }
      if(rule.commandResourcePath){
        return path.join(resourcesRoot,...splitRulePath(rule.commandResourcePath));
      }
      return null;
    }
    function syncExecPolicyRules(marketplaceSources){
      if(!Array.isArray(allowPrefixRules)||allowPrefixRules.length===0)return;
      const lines=[];
      for(const rule of allowPrefixRules){
        const prefix=Array.isArray(rule.prefix)?rule.prefix.filter(item=>typeof item==="string"&&item.length>0):[];
        const commandPath=resolveRuleCommandPath(rule,marketplaceSources);
        if(prefix.length===0&&!commandPath)continue;
        const resolvedPath=resolveRulePath(rule,marketplaceSources);
        const pattern=commandPath?[commandPath,...prefix]:(resolvedPath?[...prefix,resolvedPath]:prefix);
        lines.push("prefix_rule(pattern="+JSON.stringify(pattern)+", decision=\\"allow\\")");
      }
      if(lines.length===0)return;
      const rulesPath=path.join(codexHome,"rules",managedRulesFileName);
      const next=lines.join("\\n")+"\\n";
      const existing=fs.existsSync(rulesPath)?fs.readFileSync(rulesPath,"utf8"):"";
      if(existing!==next){
        fs.mkdirSync(path.dirname(rulesPath),{recursive:true});
        fs.writeFileSync(rulesPath,next,"utf8");
      }
    }

    const marketplaceSources=syncMarketplaces();
    syncInstalledOpenAIBundledPluginCache();
    syncExecPolicyRules(marketplaceSources);
    const configPath=path.join(home,".codex","config.toml");
    const existingCodexConfig=fs.existsSync(configPath);
    process.env.RUIZHI_EXISTING_CODEX_CONFIG=existingCodexConfig?"1":"0";
  }catch(e){
    console.error("ruizhi bootstrap init failed",e);
  }
}
ruizhiInit();
`;
}

function bootstrapForceUpdateCode(electronName) {
  const updateConfig = {
    enabled: macosUpdatesEnabled(),
    feedUrl: macosUpdateDownloadBaseUrl(),
    currentVersion: appVersion
  };
  const enhanceConfig = pageEnhanceBootstrapConfig();

  return `
async function ruizhiForceUpdateIfAvailable(){
  ruizhiStartBackgroundUpdateCheck();
}
function ruizhiStartBackgroundUpdateCheck(){
  const updateConfig=${jsonLiteral(updateConfig)};
  const pageEnhanceConfig=${jsonLiteral(enhanceConfig)};
  if(process.platform!=="darwin"||!${electronName}.app.isPackaged)return;
  const fs=require("node:fs");
  const os=require("node:os");
  const path=require("node:path");
  let autoUpdater=null;
  let updateReady=false;
  let updateState={
    status:"idle",
    currentVersion:updateConfig.currentVersion||${electronName}.app.getVersion(),
    version:null,
    progress:0,
    downloadedBytes:0,
    totalBytes:0,
    message:""
  };
  let lastProgressEmit=0;

  function publicUpdateState(){
    return {...updateState};
  }
  function broadcastUpdateState(force=false){
    const now=Date.now();
    if(!force&&now-lastProgressEmit<250)return;
    lastProgressEmit=now;
    const snapshot=publicUpdateState();
    for(const win of ${electronName}.BrowserWindow.getAllWindows()){
      if(!win.isDestroyed())win.webContents.send("ruizhi:update:state-changed",snapshot);
    }
  }
  function setUpdateState(patch,force=false){
    updateState={...updateState,...patch};
    broadcastUpdateState(force);
  }
  function notifyUpdateReady(version){
    try{
      if(${electronName}.Notification?.isSupported?.()){
        new ${electronName}.Notification({title:"锐智更新已就绪",body:"新版本 "+String(version||"")+" 已下载，退出锐智后将自动安装。"}).show();
      }
    }catch(error){
      console.error("ruizhi update notification failed",error);
    }
  }
  function ruizhiEnhanceCodexHome(){
    const home=os.homedir();
    const explicit=(process.env[${jsonLiteral(ruizhiHomeEnvName)}]||"").trim()||(process.env.CODEX_HOME||"").trim();
    return explicit||path.join(home,${jsonLiteral(ruizhiDefaultHomeDirName)});
  }
  function authHome(){
    return ruizhiEnhanceCodexHome();
  }
  function authPath(){
    return path.join(authHome(),"auth.json");
  }
  function codexConfigPath(){
    const home=os.homedir();
    return path.join(home,".codex","config.toml");
  }
  function hasExistingCodexConfig(){
    const marker=process.env.RUIZHI_EXISTING_CODEX_CONFIG;
    if(marker==="1")return true;
    if(marker==="0")return false;
    const filePath=codexConfigPath();
    try{
      return fs.existsSync(filePath)&&fs.statSync(filePath).isFile();
    }catch{
      return false;
    }
  }
  function maskApiKey(key){
    const value=String(key||"").trim();
    if(!value)return "";
    if(value.length<=18)return value.slice(0,4)+"*******"+value.slice(-4);
    return value.slice(0,10)+"*******"+value.slice(-7);
  }
  function readAuthJson(){
    const filePath=authPath();
    if(!fs.existsSync(filePath))return null;
    const auth=JSON.parse(fs.readFileSync(filePath,"utf8"));
    return auth&&typeof auth==="object"?auth:null;
  }
  function readApiKeyStatus(){
    const existingConfig=hasExistingCodexConfig();
    try{
      const auth=readAuthJson();
      const key=String(auth?.OPENAI_API_KEY||"").trim();
      const authMode=auth&&typeof auth.auth_mode==="string"?auth.auth_mode:null;
      const authConfigured=authMode!=null||key.length>0;
      const configuredBy=authMode?"auth-json:"+authMode:key.length>0?"api-key":existingConfig?"codex-config":"none";
      return {configured:authConfigured||existingConfig,masked:maskApiKey(key),configuredBy,authMode,version:${electronName}.app.getVersion()};
    }catch(error){
      return {configured:existingConfig,masked:"",configuredBy:existingConfig?"codex-config":"none",error:String(error?.message||error),version:${electronName}.app.getVersion()};
    }
  }
  function registerRuizhiAuthIpc(){
    ${electronName}.ipcMain.on("ruizhi:auth:get-sync",event=>{event.returnValue=readApiKeyStatus();});
    ${electronName}.ipcMain.handle("ruizhi:auth:get",()=>readApiKeyStatus());
  }
  function registerRuizhiEnhanceIpc(){
    if(global.__RUIZHI_ENHANCE_IPC_REGISTERED__)return;
    global.__RUIZHI_ENHANCE_IPC_REGISTERED__=true;
    try{
      const resourcesRoot=process.resourcesPath||path.dirname(process.execPath);
      const servicePath=path.join(resourcesRoot,...pageEnhanceConfig.serviceResourcePath);
      if(!pageEnhanceConfig.enabled||!fs.existsSync(servicePath))throw new Error("页面增强服务脚本不存在："+servicePath);
      const service=require(servicePath).createRuizhiEnhanceService({
        codexHome:ruizhiEnhanceCodexHome(),
        resourcesRoot,
        config:{pageEnhance:pageEnhanceConfig}
      });
      ${electronName}.ipcMain.handle("ruizhi:enhance:call",async(_event,route,payload)=>service.call(route,payload||{}));
    }catch(error){
      console.error("ruizhi enhance ipc register failed",error);
      ${electronName}.ipcMain.handle("ruizhi:enhance:call",async(_event,route,payload)=>({
        status:"failed",
        session_id:String(payload?.session_id||""),
        message:String(error?.message||error)
      }));
    }
  }
  function registerRuizhiIpc(){
    ${electronName}.ipcMain.handle("ruizhi:update:get-state",()=>publicUpdateState());
    ${electronName}.ipcMain.handle("ruizhi:update:install-now",()=>{
      if(!autoUpdater||!updateReady)return {ok:false,error:"没有已下载的更新包"};
      setUpdateState({status:"installing",message:"正在重启并安装更新"},true);
      setImmediate(()=>autoUpdater.quitAndInstall());
      return {ok:true};
    });
    registerRuizhiAuthIpc();
    registerRuizhiEnhanceIpc();
  }
  function configureUpdater(){
    if(!updateConfig.enabled)return false;
    if(!updateConfig.feedUrl){
      setUpdateState({status:"error",message:"缺少 macOS 更新下载地址"},true);
      return false;
    }
    try{
      autoUpdater=require("electron-updater").autoUpdater;
    }catch(error){
      console.error("ruizhi electron-updater load failed",error);
      setUpdateState({status:"error",message:"更新模块加载失败："+String(error?.message||error)},true);
      return false;
    }
    autoUpdater.logger=console;
    autoUpdater.autoDownload=true;
    autoUpdater.autoInstallOnAppQuit=true;
    autoUpdater.allowDowngrade=false;
    autoUpdater.allowPrerelease=false;
    autoUpdater.setFeedURL({provider:"generic",url:updateConfig.feedUrl});
    autoUpdater.on("checking-for-update",()=>{
      updateReady=false;
      setUpdateState({status:"checking",version:null,progress:0,downloadedBytes:0,totalBytes:0,message:"正在检查更新"},true);
    });
    autoUpdater.on("update-available",info=>{
      updateReady=false;
      setUpdateState({status:"downloading",version:String(info?.version||""),progress:0,downloadedBytes:0,totalBytes:0,message:"正在下载更新"},true);
    });
    autoUpdater.on("download-progress",progress=>{
      const percent=Math.max(0,Math.min(100,Math.floor(Number(progress?.percent)||0)));
      setUpdateState({
        status:"downloading",
        version:updateState.version,
        progress:percent,
        downloadedBytes:Number(progress?.transferred)||0,
        totalBytes:Number(progress?.total)||0,
        message:"正在下载更新"
      });
    });
    autoUpdater.on("update-downloaded",info=>{
      updateReady=true;
      const version=String(info?.version||updateState.version||"");
      setUpdateState({status:"ready",version,progress:100,message:"更新已下载"},true);
      notifyUpdateReady(version);
    });
    autoUpdater.on("update-not-available",()=>{
      updateReady=false;
      setUpdateState({status:"idle",version:null,progress:0,downloadedBytes:0,totalBytes:0,message:""},true);
    });
    autoUpdater.on("error",error=>{
      updateReady=false;
      console.error("ruizhi update failed",error);
      setUpdateState({status:"error",message:String(error?.message||error)},true);
    });
    return true;
  }
  try{
    registerRuizhiIpc();
    const updaterReady=configureUpdater();
    ${electronName}.app.whenReady().then(()=>{
      broadcastUpdateState(true);
      if(!updateConfig.enabled||!updaterReady)return;
      const timer=setTimeout(()=>{autoUpdater.checkForUpdates().catch(error=>{
        console.error("ruizhi update check failed",error);
        setUpdateState({status:"error",message:String(error?.message||error)},true);
      });},15000);
      timer.unref?.();
    }).catch(error=>console.error("ruizhi update scheduling failed",error));
  }catch(error){
    console.error("ruizhi update bootstrap failed",error);
  }
}
`;
}

function preloadIntegrationCode() {
  return `
${pageEnhanceRendererInstallerSource()}
;(()=>{try{
  const electron=require("electron");
  const ipcRenderer=electron.ipcRenderer;
  const contextBridge=electron.contextBridge;
  const appVersion=${jsonLiteral(appVersion)};
  const pageEnhanceConfig=${jsonLiteral(pageEnhanceBootstrapConfig())};
  const integrationKey="__RUIZHI_DESKTOP_INTEGRATION__";
  const previous=globalThis[integrationKey];
  if(previous&&typeof previous.dispose==="function")previous.dispose();
  const cleanup=[];
  let disposed=false;
  function addCleanup(fn){cleanup.push(fn);}
  function dispose(){
    if(disposed)return;
    disposed=true;
    while(cleanup.length){
      const fn=cleanup.pop();
      try{fn()}catch{}
    }
  }
  globalThis[integrationKey]={dispose};
  let updateState={status:"idle",currentVersion:appVersion,version:null,progress:0,message:""};
  const cachedAuthStatus=(()=>{try{return ipcRenderer.sendSync("ruizhi:auth:get-sync");}catch{return {configured:false,masked:"",configuredBy:"unavailable",version:appVersion};}})();

  const api={
    update:{
      getState:()=>ipcRenderer.invoke("ruizhi:update:get-state"),
      installNow:()=>ipcRenderer.invoke("ruizhi:update:install-now")
    },
    auth:{
      getCached:()=>cachedAuthStatus,
      get:()=>ipcRenderer.invoke("ruizhi:auth:get")
    },
    enhance:{
      call:(route,payload)=>ipcRenderer.invoke("ruizhi:enhance:call",route,payload||{}),
      getSettings:()=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/get",{}),
      setSettings:patch=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/set",patch||{})
    }
  };
  try{globalThis.ruizhiDesktop=api}catch{}
  try{contextBridge.exposeInMainWorld("ruizhiDesktop",api)}catch{}

  function onReady(fn){
    if(document.readyState==="loading"){
      const listener=()=>{if(!disposed)fn();};
      document.addEventListener("DOMContentLoaded",listener,{once:true});
      addCleanup(()=>document.removeEventListener("DOMContentLoaded",listener));
    }else if(!disposed)fn();
  }
  function injectRuizhiPageEnhance(){
    if(!pageEnhanceConfig.enabled||window.__RUIZHI_PAGE_ENHANCE_SCRIPT_INJECTED__)return;
    window.__RUIZHI_PAGE_ENHANCE_SCRIPT_INJECTED__=true;
    try{
      const installer=globalThis.__RUIZHI_INSTALL_PAGE_ENHANCE__;
      if(typeof installer!=="function")throw new Error("页面增强 installer 不可用");
      installer({window,document,ruizhiDesktop:api,config:pageEnhanceConfig});
    }catch(error){
      console.error("ruizhi page enhance inject failed",error);
    }
  }
  onReady(injectRuizhiPageEnhance);

  function onUpdateStateChanged(_event,next){
    if(disposed)return;
    updateState={...updateState,...next};
  }
  ipcRenderer.on("ruizhi:update:state-changed",onUpdateStateChanged);
  addCleanup(()=>ipcRenderer.removeListener("ruizhi:update:state-changed",onUpdateStateChanged));
  onReady(()=>{
    ipcRenderer.invoke("ruizhi:update:get-state").then(next=>{updateState={...updateState,...next};}).catch(()=>{});
  });
}catch(error){console.error("ruizhi preload integration failed",error)}})();
`;
}

function patchPreloadIntegration() {
  const preloadPath = path.join(extractedDir, ".vite", "build", "preload.js");
  writePatchedFile(preloadPath, (source) =>
    replaceExact(
      source,
      "\n//# sourceMappingURL=preload.js.map",
      `${preloadIntegrationCode()}\n//# sourceMappingURL=preload.js.map`,
      "注入锐智 macOS preload bridge"
    )
  );
  log("已补丁 preload 锐智 bridge");
}

function nodeModuleTargetDir(targetNodeModules, packageName) {
  return path.join(targetNodeModules, ...packageName.split("/"));
}

function copyRuntimeNodePackage(packageName, targetNodeModules, seen = new Set(), fromDir = projectRoot) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`, { paths: [fromDir] });
  const packageDir = path.dirname(packageJsonPath);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const packageKey = `${packageJson.name ?? packageName}@${packageJson.version ?? "0.0.0"}`;
  if (seen.has(packageKey)) {
    return;
  }
  seen.add(packageKey);

  const targetDir = nodeModuleTargetDir(targetNodeModules, packageName);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fsExtra.copySync(packageDir, targetDir, {
    filter(sourcePath) {
      const relative = path.relative(packageDir, sourcePath);
      if (!relative) {
        return true;
      }
      return !relative.split(path.sep).includes("node_modules");
    }
  });

  for (const dependencyName of Object.keys(packageJson.dependencies ?? {})) {
    copyRuntimeNodePackage(dependencyName, targetNodeModules, seen, packageDir);
  }
}

function copyUpdaterRuntimeDependencies() {
  const targetNodeModules = path.join(extractedDir, "node_modules");
  fs.mkdirSync(targetNodeModules, { recursive: true });
  copyRuntimeNodePackage("electron-updater", targetNodeModules);
  log("已内置 electron-updater 运行时依赖");
}

function patchBootstrap() {
  const bootstrapPath = path.join(extractedDir, ".vite", "build", "bootstrap.js");

  writePatchedFile(bootstrapPath, (source) => {
    let next = source;
    const bootstrapFailureHandlerPattern = /var ([A-Za-z_$][\w$]*)=\{"install-update":`Install Update`,"check-for-updates":`Check for Updates`,quit:`Quit`\};async function ([A-Za-z_$][\w$]*)\(e\)\{[\s\S]*?message:`\$\{([A-Za-z_$][\w$]*)\.app\.getName\(\)\} failed to start\.`[\s\S]*?\}\}var ([A-Za-z_$][\w$]*)=/;
    const bootstrapFailureHandlerMatch = next.match(bootstrapFailureHandlerPattern);
    if (!bootstrapFailureHandlerMatch) {
      throw new Error("补丁点不存在：移除 Codex 官方更新失败入口并注入锐智启动逻辑");
    }
    const [, labelsName, failureHandlerName, electronName, nextVarName] = bootstrapFailureHandlerMatch;
    next = next.replace(
      bootstrapFailureHandlerPattern,
      `${bootstrapInitCode(electronName)}${bootstrapForceUpdateCode(electronName)}var ${labelsName}={quit:\`Quit\`};async function ${failureHandlerName}(e){await ${electronName}.dialog.showMessageBox({type:\`error\`,buttons:[${labelsName}.quit],defaultId:0,cancelId:0,message:${electronName}.app.getName()+\` failed to start.\`,detail:e instanceof Error?e.message:\`The main desktop app failed during startup.\`,noLink:!0});${electronName}.app.quit();return}var ${nextVarName}=`
    );
    const updaterInitializePattern = /await [A-Za-z_$][\w$]*\.initialize\(\);try\{let\{runMainAppStartup:/;
    next = replaceRegex(
      next,
      updaterInitializePattern,
      "await ruizhiForceUpdateIfAvailable();try{let{runMainAppStartup:",
      "禁用 Codex 官方 updater 初始化，改为锐智启动逻辑"
    );
    next = replaceExactIfPresent(next, "n.app.setName(e.H(x))", `n.app.setName(${jsonLiteral(config.productName)})`, "应用名称");
    next = replaceAllIfPresent(next, "process.platform===`win32`&&n.app.setAppUserModelId(t.v(x))", "process.platform===`win32`&&n.app.setAppUserModelId(`cn.ruizhi.desktop`)");
    return next;
  });

  log("已补丁 Electron bootstrap 初始化");
}

async function repackAppAsar() {
  const resourcesDir = appResourcesDir();
  const appAsarPath = path.join(resourcesDir, "app.asar");
  const patchedAsarPath = path.join(workRoot, "app.patched.asar");

  fs.rmSync(extractedDir, { recursive: true, force: true });
  log("解包 app.asar");
  asar.extractAll(appAsarPath, extractedDir);

  patchPluginAccountGate();
  patchNativeWebviewFeatureGates();
  patchNativeBrowserDesktopFeatureAvailability();
  patchChatGptAuthExternalBrowser();
  patchBrowserNativePipeDiagnostics();
  patchBrowserNativePipePeerAuthorization();
  patchTrustedBrowserClientHashes();
  patchWebviewLocales();
  patchPackageMetadata();
  patchWebviewHtml();
  patchDefaultLocale();
  patchFrontendDefaultMessages();
  patchAppSunsetGate();
  patchModelAvailabilityAllowlist();
  patchOfficialUpdateLogic();
  patchApplicationMenu();
  patchHelpDocumentationLinks();
  copyUpdaterRuntimeDependencies();
  patchBootstrap();
  patchPreloadIntegration();

  fs.rmSync(patchedAsarPath, { force: true });
  log("重新打包 app.asar");
  await asar.createPackage(extractedDir, patchedAsarPath);
  fs.copyFileSync(patchedAsarPath, appAsarPath);
}

function findMainExecutable() {
  const macosDir = path.join(appOutRoot, "Contents", "MacOS");
  const executables = fs.readdirSync(macosDir)
    .map((name) => path.join(macosDir, name))
    .filter((candidate) => fs.statSync(candidate).isFile());
  if (executables.length === 0) {
    throw new Error(`找不到 macOS 主程序：${macosDir}`);
  }
  return executables[0];
}

function findElectronFrameworkExecutable() {
  const frameworksDir = path.join(appOutRoot, "Contents", "Frameworks");
  const candidates = fs.readdirSync(frameworksDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && / Framework\.framework$/.test(entry.name))
    .map((entry) => {
      const frameworkName = entry.name.replace(/\.framework$/, "");
      return path.join(frameworksDir, entry.name, frameworkName);
    })
    .filter((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());

  if (candidates.length !== 1) {
    throw new Error(`Electron framework binary 匹配数量异常：${candidates.length}`);
  }
  return candidates[0];
}

async function patchFuses() {
  const executable = findMainExecutable();
  const frameworkExecutable = findElectronFrameworkExecutable();
  const temporaryFuseExecutable = path.join(workRoot, "fuses", path.basename(frameworkExecutable));
  fs.chmodSync(executable, 0o755);
  fs.chmodSync(frameworkExecutable, 0o755);
  fs.mkdirSync(path.dirname(temporaryFuseExecutable), { recursive: true });
  fs.copyFileSync(frameworkExecutable, temporaryFuseExecutable);
  fs.chmodSync(temporaryFuseExecutable, 0o755);

  log("关闭 app.asar 完整性校验 fuse");
  await flipFuses(temporaryFuseExecutable, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    [FuseV1Options.WasmTrapHandlers]: true
  });
  fs.copyFileSync(temporaryFuseExecutable, frameworkExecutable);
}

function patchInfoPlist() {
  const plist = path.join(appOutRoot, "Contents", "Info.plist");
  // Electron derives the macOS helper app names from CFBundleName.
  // Keep this aligned with Codex Helper.app while branding via CFBundleDisplayName.
  execLogged("plutil", ["-replace", "CFBundleName", "-string", "Codex", plist]);
  execLogged("plutil", ["-replace", "CFBundleDisplayName", "-string", config.productName, plist]);
  execLogged("plutil", ["-replace", "CFBundleIdentifier", "-string", "cn.ruizhi.desktop", plist]);
  execLogged("plutil", ["-replace", "CFBundleShortVersionString", "-string", appVersion, plist]);
  execLogged("plutil", ["-replace", "CFBundleVersion", "-string", appVersion, plist]);
  log("已补丁 Info.plist 元数据");
}

function assertAppBinaryArchMatchesHost() {
  const plist = path.join(appOutRoot, "Contents", "Info.plist");
  const executableName = execOutput("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleExecutable", plist]).trim();
  const executablePath = path.join(appOutRoot, "Contents", "MacOS", executableName);
  const archs = execOutput("lipo", ["-archs", executablePath]).trim().split(/\s+/);
  assertMacosBuildArch(archs);
  log(`已确认 macOS app 主程序包含目标架构 ${macosBuildArch}：${archs.join(", ")}`);
  return archs;
}

function copyPluginMarketplaces() {
  const resourcesDir = appResourcesDir();

  for (const marketplace of pluginMarketplaces()) {
    const sourceRoot = path.join(projectRoot, ...splitConfigPath(marketplace.sourcePath));
    const targetRoot = path.join(resourcesDir, ...splitConfigPath(marketplace.resourcePath));
    const marketplaceJson = path.join(sourceRoot, ".agents", "plugins", "marketplace.json");
    const versionManifest = path.join(sourceRoot, ...splitConfigPath(marketplace.versionManifestPath));

    if (!fs.existsSync(marketplaceJson)) {
      throw new Error(`插件 marketplace 缺少 marketplace.json：${marketplaceJson}`);
    }
    if (!fs.existsSync(versionManifest)) {
      throw new Error(`插件 marketplace 缺少版本清单：${versionManifest}`);
    }

    fs.rmSync(targetRoot, { recursive: true, force: true });
    fsExtra.copySync(sourceRoot, targetRoot);
    log(`已内置插件 marketplace：${marketplace.displayName ?? marketplace.name}`);
  }
}

function copyRuntimeOverrides() {
  const resourcesDir = appResourcesDir();

  const modelTargetDir = path.join(resourcesDir, "models");
  if (modelCatalogEnabled()) {
    const codexClientVersion = codexClientVersionFromExe(path.join(resourcesDir, "codex"));
    writeRuntimeModelCatalog(
      modelCatalogPath(),
      path.join(modelTargetDir, "ruizhi-model-catalog.json"),
      codexClientVersion,
      { log }
    );
  } else {
    fs.rmSync(modelTargetDir, { recursive: true, force: true });
    log("已关闭运行态自定义模型目录");
  }

  if (modelBridgeEnabled()) {
    const bridgeTargetPath = path.join(resourcesDir, modelBridgeRuntimeResourcePath());
    fs.mkdirSync(path.dirname(bridgeTargetPath), { recursive: true });
    fs.copyFileSync(modelBridgeRuntimeSourcePath(), bridgeTargetPath);
    log(`已内置模型协议 bridge：${path.relative(projectRoot, bridgeTargetPath)}`);
  }

  const enhanceRendererTarget = path.join(resourcesDir, "renderer", "ruizhi-page-enhance.js");
  fs.mkdirSync(path.dirname(enhanceRendererTarget), { recursive: true });
  fs.copyFileSync(pageEnhanceRendererSourcePath(), enhanceRendererTarget);

  const enhanceServiceTarget = path.join(resourcesDir, "bridge", "ruizhi-enhance-service.cjs");
  fs.mkdirSync(path.dirname(enhanceServiceTarget), { recursive: true });
  fs.copyFileSync(pageEnhanceServiceSourcePath(), enhanceServiceTarget);
  log("已内置页面增强 renderer 与 bridge 服务");

  const skillTargetDir = path.join(resourcesDir, "skills", ".system", "imagegen");
  fs.mkdirSync(skillTargetDir, { recursive: true });
  fs.copyFileSync(imageGenSkillSourcePath(), path.join(skillTargetDir, "SKILL.md"));
  log("已内置运行态 imagegen skill 覆盖");
}

function writeAppUpdateConfig() {
  const appUpdatePath = path.join(appResourcesDir(), "app-update.yml");
  if (!macosUpdatesEnabled()) {
    fs.rmSync(appUpdatePath, { force: true });
    log("macOS 更新已禁用，已移除 app-update.yml");
    return;
  }

  const publishUrl = macosUpdateDownloadBaseUrl();
  if (!publishUrl) {
    throw new Error("macOS 自动更新已启用，但缺少 updates.macos.downloadBaseUrl。");
  }

  fs.writeFileSync(
    appUpdatePath,
    `provider: generic\nurl: ${yamlString(publishUrl)}\nupdaterCacheDirName: ruizhi-desktop-updater\n`,
    "utf8"
  );
  log(`已写入 macOS electron-updater 配置：${appUpdatePath}`);
}

function buildImageGenHelper() {
  const outputPath = path.join(appResourcesDir(), "bin", imageGenHelperName());
  fs.rmSync(outputPath, { force: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  log("编译锐智生图工具");
  execLogged("go", [
    "build",
    "-trimpath",
    "-ldflags",
    "-s -w",
    "-o",
    outputPath,
    path.join(projectRoot, "cmd", "ruizhi-imagegen")
  ], {
    env: {
      ...process.env,
      GOOS: "darwin",
      GOARCH: macosGoArch()
    }
  });
  fs.chmodSync(outputPath, 0o755);
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function sha512File(filePath) {
  const hash = createHash("sha512");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("base64");
}

function artifactManifestInfo(filePath, downloadBaseUrl) {
  const fileName = path.basename(filePath);
  return {
    fileName,
    url: joinUrl(downloadBaseUrl, fileName),
    sha256: sha256File(filePath),
    sha512: sha512File(filePath),
    size: fs.statSync(filePath).size
  };
}

function assertMacosBuildArch(appArchs) {
  const hostArch = normalizeMacosBuildArch(process.arch);
  if (hostArch !== macosBuildArch) {
    throw new Error(`当前 macOS 构建机是 ${hostArch}，但目标打包架构是 ${macosBuildArch}。请使用对应原生 runner。`);
  }
  const expectedMachArch = macosMachArch();
  if (!appArchs.includes(expectedMachArch)) {
    throw new Error(`目标架构是 ${expectedMachArch}，但 app 主程序架构是 ${appArchs.join(", ") || "unknown"}。`);
  }
}

function createZip() {
  const updateZipPath = path.join(distDir, macosUpdateArtifactName("app.zip"));
  fs.rmSync(updateZipPath, { force: true });
  log("压缩 macOS 产物");
  execLogged("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appOutRoot, updateZipPath]);
  log(`macOS zip 已输出：${updateZipPath}`);
  return updateZipPath;
}

function signDmg(dmgPath, signingState) {
  if (!signingState.signed || !process.env.MACOS_CODESIGN_IDENTITY?.trim()) {
    return;
  }
  const signArgs = ["--force", "--sign", process.env.MACOS_CODESIGN_IDENTITY, dmgPath];
  if (useTestSigningCertificate()) {
    signArgs.splice(1, 0, "--timestamp=none");
  } else {
    signArgs.splice(1, 0, "--timestamp");
  }
  execLogged("codesign", signArgs);
  execLogged("codesign", ["--verify", "--verbose=2", dmgPath]);
}

function createDmg(signingState) {
  const dmgPath = path.join(distDir, macosDmgArtifactName());
  const volumeName = `${config.productName} ${appVersion}`;

  fs.rmSync(dmgPath, { force: true });
  cleanDir(dmgStagingDir);
  fsExtra.copySync(appOutRoot, path.join(dmgStagingDir, `${config.productName}.app`));
  fs.symlinkSync("/Applications", path.join(dmgStagingDir, "Applications"));

  log("生成 macOS DMG 安装包");
  execLogged("hdiutil", [
    "create",
    "-volname",
    volumeName,
    "-srcfolder",
    dmgStagingDir,
    "-ov",
    "-format",
    "UDZO",
    dmgPath
  ]);
  signDmg(dmgPath, signingState);
  log(`macOS DMG 已输出：${dmgPath}`);
  return dmgPath;
}

function createTestKit(signingState) {
  const kitRoot = path.join(macDistDir, `${config.productName}-macos-test-kit`);
  const kitApp = path.join(kitRoot, `${config.productName}.app`);
  const commandPath = path.join(kitRoot, `打开${config.productName}.command`);
  const installScriptPath = path.join(kitRoot, "install.sh");
  const installCommandPath = path.join(kitRoot, `安装${config.productName}.command`);
  const readmePath = path.join(kitRoot, "README-先看这里.txt");
  const kitZipPath = path.join(distDir, `${config.productName}-macos-test-kit-${appVersion}.zip`);
  const shouldRepairAdHocSignature = !signingState.signed;

  fs.rmSync(kitRoot, { recursive: true, force: true });
  fs.mkdirSync(kitRoot, { recursive: true });
  fsExtra.copySync(appOutRoot, kitApp);

  const command = `#!/bin/zsh
set -euo pipefail
KIT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$KIT_DIR"
APP="./${config.productName}.app"
echo "准备打开 ${config.productName}..."
if [[ ! -d "$APP" ]]; then
  echo "找不到 $APP，请确认这个脚本和 ${config.productName}.app 在同一个目录。"
  read -k 1 "?按任意键退出..."
  exit 1
fi
xattr -cr "$KIT_DIR" 2>/dev/null || true
find "$APP/Contents" -path "*/Contents/MacOS/*" -type f -exec chmod +x {} \\; 2>/dev/null || true
if [[ "${shouldRepairAdHocSignature ? "1" : "0"}" == "1" ]]; then
  echo "刷新本机 ad-hoc 签名..."
  codesign --force --deep --sign - "$APP"
fi
codesign --verify --deep --strict --verbose=2 "$APP"
open "$APP"
echo "已发送启动命令。如果 macOS 仍提示拦截，请右键 ${config.productName}.app，选择打开。"
`;

  const installScript = `#!/bin/zsh
set -euo pipefail
KIT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$KIT_DIR"

APP_NAME="${config.productName}.app"
APP_SOURCE="./$APP_NAME"
SYSTEM_TARGET="/Applications/$APP_NAME"
USER_TARGET="$HOME/Applications/$APP_NAME"

echo "准备安装 ${config.productName}..."
if [[ ! -d "$APP_SOURCE" ]]; then
  echo "找不到 $APP_SOURCE，请确认安装脚本和 ${config.productName}.app 在同一个目录。"
  exit 1
fi

TARGET="$SYSTEM_TARGET"
if [[ ! -w "/Applications" ]]; then
  mkdir -p "$HOME/Applications"
  TARGET="$USER_TARGET"
fi

echo "安装目标：$TARGET"
xattr -cr "$KIT_DIR" 2>/dev/null || true
find "$APP_SOURCE/Contents" -path "*/Contents/MacOS/*" -type f -exec chmod +x {} \\; 2>/dev/null || true
if [[ "${shouldRepairAdHocSignature ? "1" : "0"}" == "1" ]]; then
  echo "刷新本机 ad-hoc 签名..."
  codesign --force --deep --sign - "$APP_SOURCE"
fi
codesign --verify --deep --strict --verbose=2 "$APP_SOURCE"
rm -rf "$TARGET"
ditto "$APP_SOURCE" "$TARGET"
xattr -cr "$TARGET" 2>/dev/null || true
if [[ "${shouldRepairAdHocSignature ? "1" : "0"}" == "1" ]]; then
  codesign --force --deep --sign - "$TARGET"
fi
codesign --verify --deep --strict --verbose=2 "$TARGET"
open "$TARGET"
echo "安装完成，已尝试启动 ${config.productName}。"
`;

  const installCommand = `#!/bin/zsh
set -e
cd "$(dirname "$0")"
"./install.sh"
`;

  const readme = `这是 ${config.productName} macOS 测试包。

没有 Apple Developer ID 和 notarization，所以不能做到普通用户双击完全无拦截。这个包只用于测试能不能在 Mac 上跑。

推荐方式：
1. 解压这个 zip。
2. 命令行安装：在 Terminal 里进入解压目录后执行：

   chmod +x install.sh
   ./install.sh

3. 或者双击“安装${config.productName}.command”。
4. 如果只想原地启动、不安装到 Applications，双击“打开${config.productName}.command”。

备用方式：

   xattr -dr com.apple.quarantine .
   chmod +x "安装${config.productName}.command"
   ./"安装${config.productName}.command"

如果系统提示“应用已损坏”，这通常是 Gatekeeper 对未公证测试包的拦截文案。当前测试包会自动清理扩展属性，并在 ad-hoc 签名包上刷新本机签名。

如果系统 Applications 不可写，安装脚本会自动改装到：

   ~/Applications/${config.productName}.app

这不是正式签名包。正式分发仍然需要 Apple Developer ID 和 notarization。
`;

  fs.writeFileSync(commandPath, command, { mode: 0o755 });
  fs.writeFileSync(installScriptPath, installScript, { mode: 0o755 });
  fs.writeFileSync(installCommandPath, installCommand, { mode: 0o755 });
  fs.writeFileSync(readmePath, readme, "utf8");
  fs.rmSync(kitZipPath, { force: true });
  log("压缩 macOS 测试包");
  execLogged("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", kitRoot, kitZipPath]);
  log(`测试包已输出：${kitZipPath}`);
  return kitZipPath;
}

function hasDeveloperSigningConfig() {
  return Boolean(
    process.env.MACOS_CERTIFICATE_P12_BASE64?.trim() &&
    process.env.MACOS_CERTIFICATE_PASSWORD?.trim() &&
    process.env.MACOS_CODESIGN_IDENTITY?.trim()
  );
}

function useTestSigningCertificate() {
  return process.env.RUIZHI_MACOS_SIGNING_STYLE === "test"
    || process.env.RUIZHI_MACOS_TEST_CERTIFICATE === "1";
}

function hasNotarizationConfig() {
  return Boolean(
    process.env.APP_STORE_CONNECT_KEY_ID?.trim() &&
    process.env.APP_STORE_CONNECT_ISSUER_ID?.trim() &&
    (process.env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64?.trim() || process.env.APP_STORE_CONNECT_PRIVATE_KEY?.trim())
  );
}

function importDeveloperCertificate() {
  const keychainPassword = `ruizhi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const keychainPath = path.join(workRoot, "ruizhi-signing.keychain-db");
  const certificatePath = path.join(workRoot, "developer-id.p12");
  const trustCertificatePath = path.join(workRoot, "codesign-trust.cer");

  fs.writeFileSync(
    certificatePath,
    Buffer.from(process.env.MACOS_CERTIFICATE_P12_BASE64.trim(), "base64")
  );
  if (useTestSigningCertificate() && process.env.MACOS_CERTIFICATE_CER_BASE64?.trim()) {
    fs.writeFileSync(
      trustCertificatePath,
      Buffer.from(process.env.MACOS_CERTIFICATE_CER_BASE64.trim(), "base64")
    );
  }

  execSensitive("security", ["create-keychain", "-p", keychainPassword, keychainPath], "security create-keychain");
  execLogged("security", ["set-keychain-settings", "-lut", "21600", keychainPath]);
  execSensitive("security", ["unlock-keychain", "-p", keychainPassword, keychainPath], "security unlock-keychain");
  execSensitive("security", [
    "import",
    certificatePath,
    "-k",
    keychainPath,
    "-P",
    process.env.MACOS_CERTIFICATE_PASSWORD,
    "-T",
    "/usr/bin/codesign",
    "-T",
    "/usr/bin/productsign"
  ], "security import Developer ID certificate");
  if (useTestSigningCertificate() && fs.existsSync(trustCertificatePath)) {
    execLogged("security", ["add-trusted-cert", "-r", "trustRoot", "-p", "codeSign", "-k", keychainPath, trustCertificatePath]);
  }
  execSensitive("security", [
    "set-key-partition-list",
    "-S",
    "apple-tool:,apple:,codesign:",
    "-s",
    "-k",
    keychainPassword,
    keychainPath
  ], "security set-key-partition-list");
  execLogged("security", ["list-keychains", "-d", "user", "-s", keychainPath, "login.keychain-db"]);
  log("已导入 Developer ID 证书到临时 keychain");
}

function verifyCodeSignature() {
  execLogged("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appOutRoot]);
}

function signApp() {
  execLogged("/usr/bin/xattr", ["-cr", appOutRoot]);

  if (!hasDeveloperSigningConfig()) {
    log("未配置 Developer ID 签名 secrets，使用 ad-hoc 签名");
    execLogged("codesign", ["--force", "--deep", "--sign", "-", "--timestamp=none", appOutRoot]);
    verifyCodeSignature();
    return { signed: false, notarized: false };
  }

  importDeveloperCertificate();
  const signArgs = [
    "--force",
    "--deep",
    "--sign",
    process.env.MACOS_CODESIGN_IDENTITY,
    appOutRoot
  ];
  if (useTestSigningCertificate()) {
    signArgs.splice(2, 0, "--timestamp=none");
  } else {
    signArgs.splice(2, 0, "--options", "runtime", "--timestamp");
  }
  execLogged("codesign", signArgs);
  verifyCodeSignature();
  log(useTestSigningCertificate() ? "已使用测试证书签名 macOS app" : "已使用 Developer ID 签名 macOS app");
  return { signed: true, notarized: false, testSigned: useTestSigningCertificate() };
}

function notaryPrivateKeyContent() {
  if (process.env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64?.trim()) {
    return Buffer.from(process.env.APP_STORE_CONNECT_PRIVATE_KEY_BASE64.trim(), "base64").toString("utf8");
  }
  return process.env.APP_STORE_CONNECT_PRIVATE_KEY.replace(/\\n/g, "\n");
}

function notarizeAndStaple(zipPath) {
  if (!hasNotarizationConfig()) {
    log("未配置 App Store Connect notary secrets，跳过 notarization");
    return false;
  }

  const keyPath = path.join(workRoot, "AuthKey.p8");
  fs.writeFileSync(keyPath, notaryPrivateKeyContent(), { mode: 0o600 });

  execLogged("xcrun", [
    "notarytool",
    "submit",
    zipPath,
    "--key",
    keyPath,
    "--key-id",
    process.env.APP_STORE_CONNECT_KEY_ID,
    "--issuer",
    process.env.APP_STORE_CONNECT_ISSUER_ID,
    "--wait"
  ]);
  execLogged("xcrun", ["stapler", "staple", appOutRoot]);
  execLogged("spctl", ["-a", "-vv", "--type", "execute", appOutRoot]);
  log("已完成 notarization 并 staple 到 app");
  return true;
}

function adHocSignApp() {
  signApp();
  log("已使用 ad-hoc 签名 macOS app");
}

function writeUpdateManifest(zipPath, signingState) {
  preserveExistingMacUpdateManifests();

  const downloadBaseUrl = macosUpdateDownloadBaseUrl();
  const updateArtifact = artifactManifestInfo(zipPath, downloadBaseUrl);
  const manifest = {
    version: appVersion,
    arch: macosBuildArch,
    mandatory: false,
    macos: {
      arch: macosBuildArch,
      ...updateArtifact,
      signed: Boolean(signingState.signed),
      notarized: Boolean(signingState.notarized)
    },
    manualDownload: {
      platform: "macos",
      arch: macosBuildArch,
      kind: "app",
      ...updateArtifact
    }
  };

  fs.writeFileSync(updateManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`macOS 更新清单已输出：${updateManifestPath}`);
  fs.writeFileSync(archUpdateManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  log(`macOS 架构更新清单已输出：${archUpdateManifestPath}`);
  fs.writeFileSync(versionedMacUpdateManifestPath(), `${JSON.stringify(manifest, null, 2)}\n`);
  log(`macOS 版本更新清单已输出：${versionedMacUpdateManifestPath()}`);

  const latestMacYml = [
    `version: ${yamlString(appVersion)}`,
    "files:",
    `  - url: ${yamlString(updateArtifact.fileName)}`,
    `    sha512: ${yamlString(updateArtifact.sha512)}`,
    `    size: ${updateArtifact.size}`,
    `path: ${yamlString(updateArtifact.fileName)}`,
    `sha512: ${yamlString(updateArtifact.sha512)}`,
    `releaseDate: ${yamlString(new Date().toISOString())}`,
    ""
  ].join("\n");
  fs.writeFileSync(latestMacYmlPath, latestMacYml, "utf8");
  log(`macOS electron-updater 清单已输出：${latestMacYmlPath}`);
  fs.writeFileSync(legacyLatestMacYmlPath, latestMacYml, "utf8");
  log(`macOS legacy electron-updater 清单已输出：${legacyLatestMacYmlPath}`);
  fs.writeFileSync(archLatestMacYmlPath, latestMacYml, "utf8");
  log(`macOS 架构 electron-updater 清单已输出：${archLatestMacYmlPath}`);
  fs.writeFileSync(versionedLatestMacYmlPath(), latestMacYml, "utf8");
  log(`macOS 版本 electron-updater 清单已输出：${versionedLatestMacYmlPath()}`);
}

async function main() {
  if (process.platform !== "darwin") {
    throw new Error("build:macos 必须在 macOS 上运行。本地 Windows 不要硬搓 .app，没那个命。");
  }

  fs.mkdirSync(distDir, { recursive: true });
  cleanDir(macDistDir);
  cleanDir(workRoot);

  const sourceAppRoot = findSourceAppRoot();
  log(`目标 macOS 架构：${macosBuildArch}`);
  log(`使用 Codex.app：${sourceAppRoot}`);

  log("复制 Codex.app");
  await fsExtra.copy(sourceAppRoot, appOutRoot);

  patchInfoPlist();
  assertAppBinaryArchMatchesHost();
  buildImageGenHelper();
  copyRuntimeOverrides();
  copyPluginMarketplaces();
  writeAppUpdateConfig();
  await repackAppAsar();
  await patchFuses();
  const signingState = signApp();
  let zipPath = createZip();
  if (signingState.signed) {
    signingState.notarized = notarizeAndStaple(zipPath);
    if (signingState.notarized) {
      zipPath = createZip();
    }
  }
  createDmg(signingState);
  writeUpdateManifest(zipPath, signingState);

  log("macOS 构建完成");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
