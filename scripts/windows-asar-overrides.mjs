import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fsExtra from "fs-extra";

const require = createRequire(import.meta.url);
const asar = require("asar");

const __filename = fileURLToPath(import.meta.url);
export const projectRoot = path.resolve(path.dirname(__filename), "..");
export const windowsAsarOverridesRoot = path.join(projectRoot, "overrides", "windows-app", "asar");
export const windowsResourceOverridesRoot = path.join(projectRoot, "overrides", "windows-app", "resources");
export const windowsPrerequisitesRoot = path.join(projectRoot, "resources", "windows", "prerequisites");
const pageEnhanceRendererSourcePath = path.join(projectRoot, "resources", "renderer", "ruizhi-page-enhance.js");
const pageEnhanceServiceSourcePath = path.join(projectRoot, "resources", "bridge", "ruizhi-enhance-service.cjs");
const enableWindowsPluginTextPatches = process.env.RUIZHI_ENABLE_PLUGIN_TEXT_PATCHES !== "0";
const windowsVcRedistFileName = "vc_redist.x64.exe";
const openAIBundledPluginDefinitions = [
  { name: "browser-use", path: "./plugins/browser-use", category: "浏览器" },
  { name: "chrome", path: "./plugins/chrome", category: "实验性" },
  { name: "latex-tectonic", path: "./plugins/latex-tectonic", category: "研究" }
];
const openAIRecommendedPluginIds = [
  "computer-use",
  "browser-use",
  "chrome",
  "chrome-internal",
  "latex-tectonic",
  "github",
  "gmail",
  "slack",
  "google-calendar",
  "google-drive",
  "linear",
  "figma",
  "notion",
  "canva",
  "openai-developers",
  "outlook-calendar",
  "outlook-email",
  "sharepoint",
  "teams",
  "build-macos-apps",
  "spreadsheets",
  "presentations"
];

export function assertInsideProject(targetPath) {
  const resolvedRoot = path.resolve(projectRoot).toLowerCase();
  const resolvedTarget = path.resolve(targetPath).toLowerCase();
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`拒绝访问项目外路径：${targetPath}`);
  }
}

export function resolveProjectPath(targetPath) {
  const resolvedTarget = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(projectRoot, targetPath);
  assertInsideProject(resolvedTarget);
  return resolvedTarget;
}

function windowsTaskManagerName(config) {
  return config.windows?.taskManagerName ?? config.productName ?? "锐智";
}

function jsonLiteral(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case "<":
        return "\\u003c";
      case ">":
        return "\\u003e";
      case "&":
        return "\\u0026";
      case "\u2028":
        return "\\u2028";
      case "\u2029":
        return "\\u2029";
      default:
        return char;
    }
  });
}

function tomlValue(value) {
  if (typeof value === "string") {
    return jsonLiteral(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  throw new Error(`不支持的 TOML 默认值：${value}`);
}

function splitConfigPath(value) {
  return String(value).split(/[\\/]+/).filter(Boolean);
}

function pluginMarketplaces(config) {
  return Array.isArray(config.pluginMarketplaces) ? config.pluginMarketplaces : [];
}

function marketplaceSourceToken(name) {
  return `__RUIZHI_MARKETPLACE_SOURCE_${name.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}__`;
}

function modelBridgeEnabled(config) {
  return modelCatalogEnabled(config) && config.modelBridge?.enabled === true;
}

function modelCatalogEnabled(config) {
  return config.models?.enabled !== false;
}

function modelBridgeHost(config) {
  return config.modelBridge?.host ?? "127.0.0.1";
}

function modelBridgePort(config) {
  const port = config.modelBridge?.port ?? 17888;
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`modelBridge.port 无效：${port}`);
  }
  return port;
}

function modelProviderBaseUrl(config) {
  if (!modelBridgeEnabled(config)) {
    return config.openai?.baseUrl;
  }
  return `http://${modelBridgeHost(config)}:${modelBridgePort(config)}/v1`;
}

function modelBridgeRuntimeResourcePath(config) {
  const configured = config.modelBridge?.runtimeScriptPath ?? "resources/bridge/ruizhi-responses-bridge.cjs";
  const parts = splitConfigPath(configured);
  const fileName = parts.at(-1);
  if (!fileName) {
    throw new Error(`modelBridge.runtimeScriptPath 无效：${configured}`);
  }
  return ["bridge", fileName];
}

function modelBridgeBootstrapConfig(config) {
  return {
    enabled: modelBridgeEnabled(config),
    host: modelBridgeHost(config),
    port: modelBridgePort(config),
    scriptResourcePath: modelBridgeRuntimeResourcePath(config),
    routes: config.modelBridge?.routes && typeof config.modelBridge.routes === "object"
      ? config.modelBridge.routes
      : {}
  };
}

function pageEnhanceEnabled(config) {
  return config.pageEnhance?.enabled !== false;
}

function pageEnhanceFeatures(config) {
  return {
    menu: true,
    pluginEntryUnlock: true,
    forcePluginInstall: true,
    sessionDelete: true,
    markdownExport: true,
    projectMove: true,
    timeline: true,
    threadScrollRestore: true,
    modelWhitelistUnlock: false,
    zedRemoteOpen: false,
    upstreamWorktreeCreate: false,
    serviceTierControls: false,
    ...(config.pageEnhance?.features && typeof config.pageEnhance.features === "object" ? config.pageEnhance.features : {})
  };
}

function pageEnhanceBootstrapConfig(config) {
  return {
    enabled: pageEnhanceEnabled(config),
    features: pageEnhanceFeatures(config),
    rendererResourcePath: ["renderer", "ruizhi-page-enhance.js"],
    serviceResourcePath: ["bridge", "ruizhi-enhance-service.cjs"]
  };
}

function ruizhiForcePluginInstallEnabled() {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(projectRoot, "config", "rj-codex.json"), "utf8"));
    return pageEnhanceEnabled(config) && pageEnhanceFeatures(config).forcePluginInstall !== false;
  } catch {
    return true;
  }
}

function managedConfigTomlLinesForBootstrap(config) {
  const openai = config.openai ?? {};
  const baseUrl = modelProviderBaseUrl(config);
  const defaultConfig = config.defaultConfig ?? {};
  const features = defaultConfig.features ?? {};
  const lines = [
    "# BEGIN Ruizhi Managed Defaults",
    `model = ${jsonLiteral(openai.defaultModel ?? "gpt-5.5")}`,
    `model_reasoning_effort = ${jsonLiteral(openai.defaultReasoningEffort ?? "medium")}`,
    `model_provider = "ruizhi"`,
    `openai_base_url = ${jsonLiteral(baseUrl)}`,
    "",
    "[model_providers.ruizhi]",
    `name = "锐擎API"`,
    `base_url = ${jsonLiteral(baseUrl)}`,
    `wire_api = "responses"`,
    `requires_openai_auth = true`,
    `supports_websockets = false`
  ];

  if (Number.isInteger(openai.streamMaxRetries)) {
    lines.push(`stream_max_retries = ${openai.streamMaxRetries}`);
  }
  if (Number.isInteger(openai.requestMaxRetries)) {
    lines.push(`request_max_retries = ${openai.requestMaxRetries}`);
  }
  lines.push("");

  const featureEntries = Object.entries(features);
  if (featureEntries.length > 0) {
    lines.push("[features]");
    for (const [key, value] of featureEntries) {
      lines.push(`${key} = ${tomlValue(value)}`);
    }
    lines.push("");
  }

  const managedMarketplaces = [
    ...pluginMarketplaces(config),
    { name: "openai-bundled" }
  ];
  for (const marketplace of managedMarketplaces) {
    lines.push(`[marketplaces.${marketplace.name}]`);
    lines.push(`source_type = "local"`);
    lines.push(`source = ${marketplaceSourceToken(marketplace.name)}`);
    lines.push("");
  }

  lines.push("# END Ruizhi Managed Defaults", "");
  return lines;
}

export function cleanDir(targetPath) {
  assertInsideProject(targetPath);
  fs.mkdirSync(targetPath, { recursive: true });
  for (const entry of fs.readdirSync(targetPath)) {
    fs.rmSync(path.join(targetPath, entry), { recursive: true, force: true });
  }
}

export function walkFiles(root) {
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

export function asarRelativePath(root, filePath) {
  const relativePath = path.relative(root, filePath).replaceAll(path.sep, "/");
  if (!relativePath || relativePath.startsWith("../") || path.isAbsolute(relativePath)) {
    throw new Error(`无效 asar 相对路径：${filePath}`);
  }

  const parts = relativePath.split("/");
  if (parts.includes("..") || parts.includes("")) {
    throw new Error(`无效 asar 相对路径：${relativePath}`);
  }

  return relativePath;
}

export function shouldSkipOverlayExport(relativePath) {
  return relativePath === "node_modules" || relativePath.startsWith("node_modules/");
}

export function sha256File(filePath) {
  const hash = createHash("sha256");
  const handle = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);

  try {
    while (true) {
      const bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
      if (bytesRead === 0) {
        break;
      }
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(handle);
  }

  return hash.digest("hex");
}

export function extractAsar(asarPath, targetDir) {
  if (!fs.existsSync(asarPath)) {
    throw new Error(`asar 文件不存在：${asarPath}`);
  }

  cleanDir(targetDir);
  asar.uncache?.(asarPath);
  asar.extractAll(asarPath, targetDir);
}

export async function createAsar(sourceDir, asarPath) {
  fs.rmSync(asarPath, { force: true });
  asar.uncache?.(asarPath);
  await asar.createPackage(sourceDir, asarPath);
  asar.uncache?.(asarPath);
}

export function codexClientVersionFromExe(exePath) {
  if (!fs.existsSync(exePath)) {
    throw new Error(`Codex runtime 不存在：${exePath}`);
  }

  const output = execFileSync(exePath, ["--version"], {
    encoding: "utf8",
    timeout: 15000,
    windowsHide: true
  }).trim();
  const match = output.match(/\b(\d+\.\d+\.\d+)(?:[-+\s]|$)/);
  if (!match) {
    throw new Error(`无法从 Codex runtime 版本输出解析 client_version：${output}`);
  }

  return match[1];
}

export function normalizeModelCatalogForClientVersion(catalog, clientVersion) {
  const normalized = JSON.parse(JSON.stringify(catalog));
  if (!Array.isArray(normalized.models) || normalized.models.length === 0) {
    throw new Error("锐智模型目录缺少 models 数组");
  }

  for (const model of normalized.models) {
    if (!model || typeof model.slug !== "string" || !model.slug) {
      throw new Error("锐智模型目录存在无效模型 slug");
    }
    if (model.visibility !== "list" && model.visibility !== "hide" && model.visibility !== "none") {
      throw new Error(`锐智模型 ${model.slug} 的 visibility 无效：${model.visibility}`);
    }
  }

  normalized.client_version = clientVersion;
  normalized.fetched_at = new Date().toISOString();
  return normalized;
}

export function writeRuntimeModelCatalog(sourcePath, targetPath, clientVersion, options = {}) {
  const log = options.log ?? (() => {});
  const sourceJson = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const runtimeCatalog = normalizeModelCatalogForClientVersion(sourceJson, clientVersion);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(runtimeCatalog, null, 2)}\n`, "utf8");
  log(`已同步运行态模型目录：client_version=${clientVersion}`);
}

function sourceModelCatalogPath(config) {
  const configured = config.models?.catalogPath;
  if (!configured) {
    throw new Error("缺少 models.catalogPath 配置");
  }
  const resolved = resolveProjectPath(configured);
  if (!fs.existsSync(resolved)) {
    throw new Error(`锐智模型源目录不存在：${resolved}`);
  }
  return resolved;
}

function modelSlugs(catalog) {
  if (!catalog || !Array.isArray(catalog.models)) {
    throw new Error("模型目录缺少 models 数组");
  }
  return catalog.models.map((model) => model?.slug).filter(Boolean);
}

function assertSameModelCatalog(sourceCatalog, targetCatalog, label) {
  const sourceSlugs = modelSlugs(sourceCatalog);
  const targetSlugs = modelSlugs(targetCatalog);
  const sourceSet = new Set(sourceSlugs);
  const targetSet = new Set(targetSlugs);
  const missing = sourceSlugs.filter((slug) => !targetSet.has(slug));
  const extra = targetSlugs.filter((slug) => !sourceSet.has(slug));

  if (sourceCatalog.etag !== targetCatalog.etag) {
    throw new Error(`${label} 模型 etag 不一致：期望 ${sourceCatalog.etag}，实际 ${targetCatalog.etag}`);
  }
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(`${label} 模型列表不一致：缺少 ${missing.join(", ") || "无"}；多出 ${extra.join(", ") || "无"}`);
  }

  const targetBySlug = new Map(targetCatalog.models.map((model) => [model.slug, model]));
  for (const slug of sourceSlugs.filter((item) => /^gpt-/i.test(item))) {
    const model = targetBySlug.get(slug);
    if (!Array.isArray(model?.input_modalities) || !model.input_modalities.includes("image")) {
      throw new Error(`${label} GPT 模型缺少图片输入标记：${slug}`);
    }
  }

  return { count: targetSlugs.length, etag: targetCatalog.etag };
}

function validateRuntimeAsarBridge(appRoot, config, label, options = {}) {
  if (!modelBridgeEnabled(config)) {
    return { bridge: false };
  }

  const resourcesDir = path.join(appRoot, "resources");
  const appAsarPath = path.join(resourcesDir, "app.asar");
  if (!fs.existsSync(appAsarPath)) {
    throw new Error(`${label} 缺少 app.asar：${appAsarPath}`);
  }

  const bridgePath = path.join(resourcesDir, ...modelBridgeRuntimeResourcePath(config));
  if (!fs.existsSync(bridgePath)) {
    throw new Error(`${label} 缺少模型协议 bridge：${bridgePath}`);
  }

  const bridgeBaseUrl = modelProviderBaseUrl(config);
  let lastError = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const extractDir = path.join(
      projectRoot,
      ".work",
      "runtime-bundle-validation",
      `${path.basename(appRoot)}-${process.pid}-${Date.now()}-${attempt}`
    );
    cleanDir(extractDir);
    try {
      asar.uncache?.(appAsarPath);
      asar.extractAll(appAsarPath, extractDir);
      const bootstrapPath = path.join(extractDir, ".vite", "build", "bootstrap.js");
      if (!fs.existsSync(bootstrapPath)) {
        throw new Error(`${label} app.asar 缺少 bootstrap.js`);
      }
      if (options.expectedVersion) {
        const packageJsonPath = path.join(extractDir, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
          throw new Error(`${label} app.asar 缺少 package.json`);
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
        if (packageJson.version !== options.expectedVersion) {
          throw new Error(`${label} app.asar package 版本不一致：期望 ${options.expectedVersion}，实际 ${packageJson.version}`);
        }
      }
      const bootstrap = fs.readFileSync(bootstrapPath, "utf8");
      if (options.expectedVersion) {
        const versionMatch = bootstrap.match(/"currentVersion":"([^"]+)"/);
        if (!versionMatch) {
          throw new Error(`${label} bootstrap 缺少 currentVersion`);
        }
        if (versionMatch[1] !== options.expectedVersion) {
          throw new Error(`${label} bootstrap currentVersion 不一致：期望 ${options.expectedVersion}，实际 ${versionMatch[1]}`);
        }
      }
      if ((config.models?.enabled ?? true) && bootstrap.includes("const modelCatalogEnabled=false;")) {
        throw new Error(`${label} bootstrap 仍会关闭运行态模型目录`);
      }
      if (!bootstrap.includes("startRuizhiResponsesBridge")) {
        throw new Error(`${label} bootstrap 未注入模型协议 bridge 启动逻辑`);
      }
      if (!bootstrap.includes("stableModelBridgePort") || !bootstrap.includes("rewriteRuntimeModelProviderBaseUrl")) {
        throw new Error(`${label} bootstrap 缺少模型 bridge 端口隔离逻辑`);
      }
      if (!bootstrap.includes("ensureLoopbackNoProxy")) {
        throw new Error(`${label} bootstrap 缺少本地 bridge 代理绕过逻辑`);
      }
      if (!bootstrap.includes(bridgeBaseUrl)) {
        throw new Error(`${label} bootstrap 未指向本地模型 provider：${bridgeBaseUrl}`);
      }
      if (Number.isInteger(config.openai?.streamMaxRetries) && !bootstrap.includes(`stream_max_retries = ${config.openai.streamMaxRetries}`)) {
        throw new Error(`${label} managed config 缺少 stream_max_retries = ${config.openai.streamMaxRetries}`);
      }
      if (Number.isInteger(config.openai?.requestMaxRetries) && !bootstrap.includes(`request_max_retries = ${config.openai.requestMaxRetries}`)) {
        throw new Error(`${label} managed config 缺少 request_max_retries = ${config.openai.requestMaxRetries}`);
      }
      fs.rmSync(extractDir, { recursive: true, force: true });
      return { bridge: true };
    } catch (error) {
      lastError = error;
      fs.rmSync(extractDir, { recursive: true, force: true });
      if (attempt < 6) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return { bridge: true };
}

function validateRuntimeEnvironmentMarker(appRoot, config, label, options = {}) {
  const markerPath = path.join(appRoot, "resources", "ruizhi-environment.json");
  const expectedVersion = options.expectedVersion ?? null;
  const expectedEnvironment = options.expectedEnvironment ?? null;

  if (!fs.existsSync(markerPath)) {
    if (expectedEnvironment) {
      throw new Error(`${label} 缺少运行环境标记：${markerPath}`);
    }
    return { environment: null, environmentVersion: null };
  }

  const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
  if (expectedVersion && marker.version !== expectedVersion) {
    throw new Error(`${label} 运行环境标记版本不一致：期望 ${expectedVersion}，实际 ${marker.version}`);
  }
  if (expectedEnvironment && marker.environment !== expectedEnvironment) {
    throw new Error(`${label} 运行环境标记不一致：期望 ${expectedEnvironment}，实际 ${marker.environment}`);
  }
  const expectedExeName = config.windows?.appExeName;
  if (expectedExeName && marker.executableName !== expectedExeName) {
    throw new Error(`${label} 运行环境主程序名不一致：期望 ${expectedExeName}，实际 ${marker.executableName}`);
  }
  return { environment: marker.environment ?? null, environmentVersion: marker.version ?? null };
}

function validateRuntimePluginMarketplaces(appRoot, config, label) {
  const marketplaces = pluginMarketplaces(config);
  if (marketplaces.length === 0) {
    return { marketplaces: 0 };
  }

  const resourcesDir = path.join(appRoot, "resources");
  for (const marketplace of marketplaces) {
    const sourceRoot = resolveProjectPath(marketplace.sourcePath);
    const targetRoot = path.join(resourcesDir, ...splitConfigPath(marketplace.resourcePath));
    const sourceManifestPath = path.join(sourceRoot, ...splitConfigPath(marketplace.versionManifestPath));
    const targetManifestPath = path.join(targetRoot, ...splitConfigPath(marketplace.versionManifestPath));
    if (!fs.existsSync(sourceManifestPath)) {
      throw new Error(`${label} 源插件 marketplace 缺少版本清单：${sourceManifestPath}`);
    }
    if (!fs.existsSync(targetManifestPath)) {
      throw new Error(`${label} 缺少运行态插件 marketplace：${targetManifestPath}`);
    }
    const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));
    const targetManifest = JSON.parse(fs.readFileSync(targetManifestPath, "utf8"));
    if (sourceManifest.name !== targetManifest.name || sourceManifest.version !== targetManifest.version) {
      throw new Error(`${label} 插件 marketplace 版本不一致：${marketplace.name}`);
    }

    const sourceMarketplacePath = path.join(sourceRoot, ".agents", "plugins", "marketplace.json");
    const targetMarketplacePath = path.join(targetRoot, ".agents", "plugins", "marketplace.json");
    if (!fs.existsSync(targetMarketplacePath)) {
      throw new Error(`${label} 缺少运行态 marketplace.json：${targetMarketplacePath}`);
    }
    const sourceMarketplace = JSON.parse(fs.readFileSync(sourceMarketplacePath, "utf8"));
    const targetMarketplace = JSON.parse(fs.readFileSync(targetMarketplacePath, "utf8"));
    const sourcePlugins = Array.isArray(sourceMarketplace.plugins) ? sourceMarketplace.plugins : [];
    const targetPluginNames = new Set((Array.isArray(targetMarketplace.plugins) ? targetMarketplace.plugins : []).map((plugin) => plugin.name));
    for (const plugin of sourcePlugins) {
      if (!targetPluginNames.has(plugin.name)) {
        throw new Error(`${label} 运行态插件 marketplace 缺少插件：${plugin.name}`);
      }
      const pluginPath = plugin.source?.path;
      if (typeof pluginPath === "string" && pluginPath.startsWith("./")) {
        const pluginRoot = path.join(targetRoot, ...splitConfigPath(pluginPath.slice(2)));
        if (!fs.existsSync(pluginRoot)) {
          throw new Error(`${label} 运行态插件目录缺失：${plugin.name} -> ${pluginRoot}`);
        }
      }
    }
  }
  return { marketplaces: marketplaces.length };
}

export function validateRuizhiRuntimeBundle(appRoot, config, options = {}) {
  const log = options.log ?? (() => {});
  const label = options.label ?? (path.relative(projectRoot, appRoot) || appRoot);
  const resourcesDir = path.join(appRoot, "resources");
  assertInsideProject(resourcesDir);

  const targetCatalogPath = path.join(resourcesDir, "models", "ruizhi-model-catalog.json");
  if (!modelCatalogEnabled(config)) {
    if (fs.existsSync(targetCatalogPath)) {
      throw new Error(`${label} 自定义模型目录已关闭，但运行态仍包含：${targetCatalogPath}`);
    }
    const bridgeResult = validateRuntimeAsarBridge(appRoot, config, label, options);
    const environmentResult = validateRuntimeEnvironmentMarker(appRoot, config, label, options);
    const marketplaceResult = validateRuntimePluginMarketplaces(appRoot, config, label);
    const environmentText = environmentResult.environment ? `，env=${environmentResult.environment}` : "";
    const marketplaceText = marketplaceResult.marketplaces ? `，marketplaces=${marketplaceResult.marketplaces}` : "";
    log(`已校验运行态产物：${label}，models=off，bridge=${bridgeResult.bridge ? "on" : "off"}${environmentText}${marketplaceText}`);
    return { count: 0, etag: null, ...bridgeResult, ...environmentResult, ...marketplaceResult };
  }

  if (!fs.existsSync(targetCatalogPath)) {
    throw new Error(`${label} 缺少运行态模型目录：${targetCatalogPath}`);
  }

  const sourceCatalog = JSON.parse(fs.readFileSync(sourceModelCatalogPath(config), "utf8"));
  const targetCatalog = JSON.parse(fs.readFileSync(targetCatalogPath, "utf8"));
  const catalogResult = assertSameModelCatalog(sourceCatalog, targetCatalog, label);
  const bridgeResult = validateRuntimeAsarBridge(appRoot, config, label, options);
  const environmentResult = validateRuntimeEnvironmentMarker(appRoot, config, label, options);
  const marketplaceResult = validateRuntimePluginMarketplaces(appRoot, config, label);
  const environmentText = environmentResult.environment ? `，env=${environmentResult.environment}` : "";
  const marketplaceText = marketplaceResult.marketplaces ? `，marketplaces=${marketplaceResult.marketplaces}` : "";
  log(`已校验运行态产物：${label}，models=${catalogResult.count}，etag=${catalogResult.etag}，bridge=${bridgeResult.bridge ? "on" : "off"}${environmentText}${marketplaceText}`);
  return { ...catalogResult, ...bridgeResult, ...environmentResult, ...marketplaceResult };
}

export function applyWindowsAsarOverrides(targetDir, options = {}) {
  const overridesRoot = options.overridesRoot ?? windowsAsarOverridesRoot;
  const log = options.log ?? (() => {});
  const files = walkFiles(overridesRoot);

  if (files.length === 0) {
    throw new Error(`Windows asar 覆盖层为空：${overridesRoot}。请先运行 npm run export:windows-overrides。`);
  }

  let totalBytes = 0;
  for (const sourcePath of files) {
    const relativePath = asarRelativePath(overridesRoot, sourcePath);
    const targetPath = path.join(targetDir, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    totalBytes += fs.statSync(sourcePath).size;
  }

  log(`已应用 Windows asar 覆盖层：${files.length} 个文件，${totalBytes} 字节`);
  return { files: files.length, bytes: totalBytes };
}

export function copyWindowsResourceOverrides(resourcesDir, options = {}) {
  const log = options.log ?? (() => {});
  assertInsideProject(resourcesDir);
  const files = fs.existsSync(windowsResourceOverridesRoot) ? walkFiles(windowsResourceOverridesRoot) : [];
  if (files.length > 0) {
    fsExtra.copySync(windowsResourceOverridesRoot, resourcesDir, { overwrite: true });
    log(`已应用 Windows 资源覆盖层：${files.length} 个文件`);
  }

  const enhanceFiles = copyPageEnhanceRuntimeResources(resourcesDir, { log });
  return { files: files.length + enhanceFiles.files };
}

export function copyPageEnhanceRuntimeResources(resourcesDir, options = {}) {
  const log = options.log ?? (() => {});
  if (!fs.existsSync(pageEnhanceRendererSourcePath)) {
    throw new Error(`页面增强 renderer 脚本不存在：${pageEnhanceRendererSourcePath}`);
  }
  if (!fs.existsSync(pageEnhanceServiceSourcePath)) {
    throw new Error(`页面增强服务脚本不存在：${pageEnhanceServiceSourcePath}`);
  }
  assertInsideProject(resourcesDir);
  const targets = [
    [pageEnhanceRendererSourcePath, path.join(resourcesDir, "renderer", "ruizhi-page-enhance.js")],
    [pageEnhanceServiceSourcePath, path.join(resourcesDir, "bridge", "ruizhi-enhance-service.cjs")]
  ];
  for (const [source, target] of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  log("已同步页面增强 renderer 与服务脚本");
  return { files: targets.length };
}

export function copyWindowsPrerequisites(resourcesDir, options = {}) {
  const log = options.log ?? (() => {});
  const sourcePath = path.join(windowsPrerequisitesRoot, windowsVcRedistFileName);
  const targetPath = path.join(resourcesDir, "prerequisites", windowsVcRedistFileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`缺少 VC++ 运行库安装包：${sourcePath}。请从 https://aka.ms/vc14/vc_redist.x64.exe 下载后放入该路径。`);
  }

  const stat = fs.statSync(sourcePath);
  if (!stat.isFile() || stat.size < 1024 * 1024) {
    throw new Error(`VC++ 运行库安装包无效：${sourcePath}`);
  }

  assertInsideProject(resourcesDir);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  log(`已内置 VC++ 运行库安装包：${path.relative(projectRoot, targetPath)}`);
  return { files: 1, bytes: stat.size };
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function patchJsonFile(filePath, transform) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`资源文案补丁目标不存在：${filePath}`);
  }

  const source = readJsonFile(filePath);
  const patched = transform(source);
  writeJsonFile(filePath, patched);
}

function patchSkillDescription(skillPath, description) {
  if (!fs.existsSync(skillPath)) {
    throw new Error(`skill 文案补丁目标不存在：${skillPath}`);
  }

  const source = fs.readFileSync(skillPath, "utf8");
  const pattern = /^(description:\s*)(?:"[^"\r\n]*"|[^\r\n]*)/m;
  if (!pattern.test(source)) {
    throw new Error(`skill 缺少 description frontmatter：${skillPath}`);
  }
  const patched = source.replace(pattern, `$1${JSON.stringify(description)}`);
  if (patched === source) {
    return;
  }

  fs.writeFileSync(skillPath, patched, "utf8");
}

function restoreOpenAIBundledPluginResources(resourcesDir, options = {}) {
  const log = options.log ?? (() => {});
  const sourceRoot = path.join(projectRoot, "vendor", "codex-desktop", "windows", "current", "app", "resources", "plugins", "openai-bundled");
  const targetRoot = path.join(resourcesDir, "plugins", "openai-bundled");
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`官方 OpenAI 插件资源不存在：${sourceRoot}`);
  }

  assertInsideProject(targetRoot);
  fs.rmSync(targetRoot, { recursive: true, force: true });
  fsExtra.copySync(sourceRoot, targetRoot);
  log("已恢复官方 OpenAI 插件资源");
}

function pluginCategoryLabel(category) {
  const normalized = String(category ?? "").trim().toLowerCase().replace(/[_-]+/g, " ");
  switch (normalized) {
    case "featured":
      return "推荐";
    case "experimental":
      return "实验性";
    case "coding":
      return "编码";
    case "automation":
      return "自动化";
    case "engineering":
    case "developer tools":
      return "工程";
    case "productivity":
      return "效率";
    case "research":
      return "研究";
    case "google":
      return "谷歌";
    case "microsoft":
      return "微软";
    case "communication":
    case "communications":
      return "沟通";
    case "project management":
      return "项目管理";
    case "data":
    case "data analytics":
    case "data & analytics":
      return "数据分析";
    case "search":
      return "搜索";
    case "browser":
    case "browsers":
      return "浏览器";
    case "design":
      return "设计";
    case "lifestyle":
      return "生活方式";
    case "finance":
      return "财务";
    case "sales":
      return "销售";
    case "marketing":
      return "市场营销";
    case "education":
      return "教育";
    case "writing":
      return "写作";
    case "other":
      return "其他";
    default:
      return category;
  }
}

function openAIBundledMarketplaceManifest() {
  return {
    name: "openai-bundled",
    interface: {
      displayName: "OpenAI"
    },
    plugins: openAIBundledPluginDefinitions.map((plugin) => ({
      name: plugin.name,
      source: {
        source: "local",
        path: plugin.path
      },
      policy: {
        installation: "AVAILABLE",
        authentication: "ON_INSTALL"
      },
      category: pluginCategoryLabel(plugin.category)
    }))
  };
}

export function patchOpenAIBundledPluginDescriptions(resourcesDir, options = {}) {
  const log = options.log ?? (() => {});
  restoreOpenAIBundledPluginResources(resourcesDir, { log });
  if (!enableWindowsPluginTextPatches) {
    log("已跳过 OpenAI 插件描述文案补丁");
    return;
  }

  const marketplacePath = path.join(resourcesDir, "plugins", "openai-bundled", ".agents", "plugins", "marketplace.json");
  const pluginsRoot = path.join(resourcesDir, "plugins", "openai-bundled", "plugins");

  patchJsonFile(marketplacePath, (marketplace) => {
    return {
      ...marketplace,
      ...openAIBundledMarketplaceManifest()
    };
  });

  patchJsonFile(path.join(pluginsRoot, "browser-use", ".codex-plugin", "plugin.json"), (plugin) => {
    plugin.description = [
      "Browser / browser-use 插件",
      "",
      "别名：@browser、@browser-use、browser-use、Browser、in-app browser。",
      "",
      "当用户要求打开、检查、导航、测试、点击、输入或截图 localhost、127.0.0.1、::1、file://、当前 Codex 内置浏览器标签页，或 Codex 中并排显示的网站时，使用 Browser 这个 Codex 内置浏览器。",
      "",
      "本地应用有重要前端改动后，如果相关本地地址明确，使用 Browser 打开目标进行验证；除非用户指定其他浏览器工具。",
      "",
      "例如 “open localhost:3000” 或 “open to localhost:4000”，导航到对应的 http://localhost:3000 或 http://localhost:4000。",
      "",
      "用户明确指定 @browser 或 @browser-use 时，不要用 macOS `open`、shell 命令或通用网页浏览替代；除非用户要求其他浏览器工具或批准 fallback。"
    ].join("\n");
    plugin.interface = plugin.interface ?? {};
    plugin.interface.shortDescription = "用 Codex 控制内置浏览器";
    plugin.interface.longDescription = "Browser 让 Codex 打开并控制内置浏览器，主要用于本地开发页面和文件。可用于导航、检查、点击、输入和截图，在 Codex 内完成页面测试。";
    plugin.interface.category = "浏览器";
    plugin.interface.defaultPrompt = ["测试 localhost 上的结账流程"];
    return plugin;
  });

  patchJsonFile(path.join(pluginsRoot, "chrome", ".codex-plugin", "plugin.json"), (plugin) => {
    plugin.description = "Chrome 自动化插件，用于远程 URL、需要登录态或浏览器配置的页面、已有 Chrome 标签页、cookies、扩展，以及 Codex Chrome Extension 设置。";
    plugin.interface = plugin.interface ?? {};
    plugin.interface.shortDescription = "用 Codex 控制 Chrome";
    plugin.interface.longDescription = "Chrome 让 Codex 使用你的 Chrome 浏览器处理需要现有浏览器状态的任务，包括已打开的标签页、页面内容和已经登录的网站。它可以导航、查看、点击、输入和截图。你仍然保持控制：Codex 在访问新网站前会询问，你可以随时停止操作，也可以在设置中管理或移除 Chrome 访问权限。已登录网站中的浏览器内容可能包含敏感信息；使用此插件产生的浏览器数据可能会按你的 OpenAI 账号数据控制设置用于训练。";
    plugin.interface.category = "实验性";
    plugin.interface.defaultPrompt = [
      "帮我填写报销单",
      "帮我检查社交媒体消息",
      "帮我在 Workday 提交 PTO 申请"
    ];
    return plugin;
  });

  patchJsonFile(path.join(pluginsRoot, "latex-tectonic", ".codex-plugin", "plugin.json"), (plugin) => {
    plugin.description = "使用内置 Tectonic 引擎编译 LaTeX 和 TeX 文档。";
    plugin.interface = plugin.interface ?? {};
    plugin.interface.shortDescription = "内置 LaTeX 编译器";
    plugin.interface.longDescription = "LaTeX Tectonic 提供内置 Tectonic 可执行文件，Codex 可用它编译 LaTeX 和 TeX 文档，无需依赖系统级 TeX 安装。";
    plugin.interface.category = "研究";
    plugin.interface.defaultPrompt = [
      "用 Tectonic 编译这个 LaTeX 文件",
      "把我的 TeX 文档构建成 PDF"
    ];
    return plugin;
  });

  writeTranslatedOpenAIPluginSkill(
    path.join(pluginsRoot, "browser-use", "skills", "browser", "SKILL.md"),
    "browser",
    "Browser 自动化能力，用于 Codex 内置浏览器。适用于打开、导航、检查、测试、点击、输入、截图或验证 localhost、127.0.0.1、::1、file://、当前内置浏览器标签页，以及 Codex 中并排显示的网站。",
    "/openai-bundled/plugins/browser-use/skills/browser/SKILL.md"
  );
  writeTranslatedOpenAIPluginSkill(
    path.join(pluginsRoot, "chrome", "skills", "chrome", "SKILL.md"),
    "Chrome",
    "用户 Chrome 浏览器自动化。适用于需要 cookies、登录态、已有标签页、扩展，或远程认证网站的浏览器任务。",
    "/openai-bundled/plugins/chrome/skills/chrome/SKILL.md"
  );
  writeTranslatedOpenAIPluginSkill(
    path.join(pluginsRoot, "latex-tectonic", "skills", "latex-tectonic", "SKILL.md"),
    "LaTeX Tectonic",
    "使用内置 Tectonic 可执行文件编译 LaTeX 和 TeX 文档。",
    "/openai-bundled/plugins/latex-tectonic/skills/latex-tectonic/SKILL.md"
  );

  log("已中文化 OpenAI 内置插件描述文案");
}

function patchHardcodedOpenAIRecommendedPluginList(source) {
  let next = source;
  const recommendedList = JSON.stringify(openAIRecommendedPluginIds);

  next = next.replace(
    "S=[...n.flatMap(e=>[`computer-use@${e}`,`browser-use@${e}`,`chrome@${e}`,`chrome-internal@${e}`]),`spreadsheets@openai-primary-runtime`,`presentations@openai-primary-runtime`];",
    `S=${recommendedList};`
  );
  next = next.replace(
    "let a=B(e,t);return a.length>0?a.slice(0,d.length):e.slice(0,d.length)",
    "let a=B(e,S);return a.length>0?a.slice(0,d.length):e.slice(0,d.length)"
  );
  next = next.replace(
    "function V(e,t){let n=[],r=new Set;for(let e of[...S,...t])r.has(e)||(r.add(e),n.push(e));return B(e,n)}",
    "function V(e,t=[]){let n=[],r=new Set;for(let e of S)r.has(e)||(r.add(e),n.push(e));return B(e,n)}"
  );
  next = next.replace(
    "function V(e,t=[]){return []}",
    "function V(e,t=[]){let n=[],r=new Set;for(let e of S)r.has(e)||(r.add(e),n.push(e));return B(e,n)}"
  );

  return next;
}

function patchPluginSelectorsBundle(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  let next = source;

  const selectorDescriptionTarget = "function h(e,t){let n=p(e);if(n!=null)return t.formatMessage(f[n]);let r=l(e.plugin.interface?.defaultPrompt);if(r!=null)return r;let i=e.description?.trim();return i==null||i.length===0?null:i}";
  if (next.includes(selectorDescriptionTarget) && !next.includes("function ruizhiOpenAIPluginDescription(")) {
    next = next.replace(
      selectorDescriptionTarget,
      "function ruizhiOpenAIPluginDescription(e){let t=[e?.plugin?.id,e?.plugin?.name,e?.displayName,e?.summary?.id,e?.summary?.name].map(e=>String(e??``).toLowerCase()).join(` `),n=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.plugin?.id,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);if(!/(openai|codex official)/.test(n)||/(ruijie|local plugins?)/.test(n))return null;if(t.includes(`google-calendar`))return`Google 日历：查看日程、安排会议和管理日历。`;if(t.includes(`google-drive`))return`Google 云端硬盘：访问 Drive、Docs、Sheets 和 Slides 文件。`;if(t.includes(`gmail`))return`Gmail：读取、搜索、撰写和管理邮件。`;if(t.includes(`slack`))return`Slack：搜索消息、查看频道并处理协作对话。`;if(t.includes(`linear`))return`Linear：查找和引用 issue、项目与工作流。`;if(t.includes(`github`))return`GitHub：查看仓库、PR、issue 和代码协作内容。`;if(t.includes(`figma`))return`Figma：读取设计文件、生成实现计划和处理设计系统。`;if(t.includes(`notion`))return`Notion：检索知识库、整理资料和写入页面。`;if(t.includes(`canva`))return`Canva：搜索、创建和编辑设计。`;if(t.includes(`openai-developers`))return`OpenAI Developers：构建 OpenAI API、Agents SDK 和 ChatGPT Apps。`;if(t.includes(`outlook-calendar`))return`Outlook 日历：查看日程、安排会议和管理日历。`;if(t.includes(`outlook-email`))return`Outlook 邮箱：读取、搜索、撰写和管理邮件。`;if(t.includes(`sharepoint`))return`SharePoint：访问团队文档和协作文件。`;if(t.includes(`teams`))return`Microsoft Teams：查看和处理团队协作内容。`;if(t.includes(`computer-use`))return`Computer Use：操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。`;if(t.includes(`browser-use`)||t.includes(`browser`))return`Browser：控制内置浏览器，用于页面导航、点击、输入和截图。`;if(t.includes(`chrome`))return`Chrome：控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。`;if(t.includes(`latex-tectonic`))return`LaTeX Tectonic：使用内置 Tectonic 编译 LaTeX 和 TeX 文档。`;if(t.includes(`build-macos-apps`))return`Build macOS Apps：构建、运行、测试、签名和排查 macOS 应用。`;if(t.includes(`spreadsheets`))return`Spreadsheets：读取、编辑和整理电子表格数据。`;if(t.includes(`presentations`))return`Presentations：读取、编辑和整理演示文稿。`;return null}function h(e,t){let n=p(e);if(n!=null)return t.formatMessage(f[n]);let r=ruizhiOpenAIPluginDescription(e);if(r!=null)return r;let i=l(e.plugin.interface?.defaultPrompt);if(i!=null)return i;let a=e.description?.trim();return a==null||a.length===0?null:a}"
    );
  }

  for (const marketplaceLabelFunction of [
    "function T(e){return E(e)?`Built by OpenAI`:e}",
    "function T(e){return E(e)?`OpenAI`:e}"
  ]) {
    if (!next.includes(marketplaceLabelFunction)) {
      continue;
    }
    next = next.replace(
      marketplaceLabelFunction,
      "function q(e){switch(w(e)){case`google`:return`谷歌`;case`local plugins`:return`本地插件`;default:return null}}function T(e){let t=q(e);return t??(E(e)?`OpenAI`:e)}"
    );
    break;
  }
  next = next.replaceAll("case`built by openai`:return 0;", "case`openai`:case`built by openai`:return 0;");

  const featuredLookupTarget = "function B(e,t){let n=new Map(e.map(e=>[e.plugin.id,e])),r=[];for(let e of t){let t=n.get(e);t!=null&&r.push(t)}return r}";
  if (next.includes(featuredLookupTarget) && !next.includes("String(e).split(`@`)[0]")) {
    next = next.replace(
      featuredLookupTarget,
      "function B(e,t){let n=new Map,r=[];for(let t of e)for(let e of[t.plugin.id,String(t.plugin.id??``).split(`@`)[0],...g(t)])e&&n.has(e)||e&&n.set(e,t);for(let i of t){let t=n.get(i)??n.get(String(i).split(`@`)[0]);t!=null&&!r.some(e=>e.plugin.id===t.plugin.id)&&r.push(t)}return r}"
    );
  }

  const categoryInsertionPoint = "function H(e,t=[]){";
  if (next.includes(categoryInsertionPoint) && !next.includes("function U(e){switch(w(e))")) {
    next = next.replace(
      categoryInsertionPoint,
      "function U(e){switch(w(e)){case`featured`:return`推荐`;case`experimental`:return`实验性`;case`coding`:return`编码`;case`automation`:return`自动化`;case`engineering`:case`developer tools`:return`工程`;case`productivity`:return`效率`;case`research`:return`研究`;case`google`:return`谷歌`;case`microsoft`:return`微软`;case`communication`:case`communications`:return`沟通`;case`project management`:return`项目管理`;case`data`:case`data analytics`:case`data & analytics`:return`数据分析`;case`search`:return`搜索`;case`browser`:case`browsers`:return`浏览器`;case`design`:return`设计`;case`lifestyle`:return`生活方式`;case`finance`:return`财务`;case`sales`:return`销售`;case`marketing`:return`市场营销`;case`education`:return`教育`;case`writing`:return`写作`;case`other`:return`其他`;default:return e}}function H(e,t=[]){"
    );
  }
  next = next.replace(
    "function U(e){switch(w(e)){case`featured`:return`实验性`;",
    "function U(e){switch(w(e)){case`featured`:return`推荐`;case`experimental`:return`实验性`;"
  );
  next = next.replace(
    "case`coding`:return`编码`;case`engineering`:",
    "case`coding`:return`编码`;case`automation`:return`自动化`;case`engineering`:"
  );
  next = next.replace(
    "map(([e,t])=>({section:{id:`plugins-${C(e).replaceAll(` `,`-`)}`,title:e},plugins:t}))",
    "map(([e,t])=>({section:{id:`plugins-${C(e).replaceAll(` `,`-`)}`,title:U(e)},plugins:t}))"
  );
  next = next.replace(
    "title:`Featured`",
    "title:U(`Featured`)"
  );

  if (next !== source) {
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  }
  return false;
}

function openAIPluginDescriptions(kind = "short") {
  const short = {
    "browser-use": "控制内置浏览器，用于页面导航、点击、输入和截图。",
    "chrome": "控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。",
    "latex-tectonic": "使用内置 Tectonic 编译 LaTeX 和 TeX 文档。",
    "hugging-face": "检索模型、数据集、Spaces 和推理资源。",
    "netlify": "部署项目、管理发布流程和站点配置。",
    "vercel": "构建和部署 Web 应用与智能体项目。",
    "game-studio": "设计、原型验证并发布浏览器游戏。",
    "superpowers": "支持计划、TDD、调试和交付流程。",
    "circleci": "构建、测试和部署应用。",
    "cloudflare": "处理 Cloudflare 平台、Workers、Pages 和基础设施配置。",
    "sentry": "查看错误、性能问题、事件和发布健康状态。",
    "build-ios-apps": "构建、优化和调试 iOS 应用。",
    "build-macos-apps": "构建、运行、测试、签名和排查 macOS 应用。",
    "google-calendar": "查看日程、安排会议和管理日历。",
    "google-drive": "访问 Drive、Docs、Sheets 和 Slides 文件。",
    "gmail": "读取、搜索、撰写和管理邮件。",
    "slack": "搜索消息、查看频道并处理协作对话。",
    "linear": "查找和引用 issue、项目与工作流。",
    "github": "查看仓库、PR、issue 和代码协作内容。",
    "figma": "读取设计文件、生成实现计划和处理设计系统。",
    "notion": "检索知识库、整理资料和写入页面。",
    "canva": "搜索、创建和编辑设计。",
    "openai-developers": "构建 OpenAI API、Agents SDK 和 ChatGPT Apps。",
    "outlook-calendar": "查看日程、安排会议和管理日历。",
    "outlook-email": "读取、搜索、撰写和管理邮件。",
    "sharepoint": "访问团队文档和协作文件。",
    "teams": "查看和处理团队协作内容。",
    "computer-use": "操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。",
    "spreadsheets": "读取、编辑和整理电子表格数据。",
    "presentations": "读取、编辑和整理演示文稿。",
    "build-web-apps": "构建偏前端的 Web 应用，支持生成资源、浏览器测试、支付和数据库集成。",
    "test-android-apps": "复现 Android 问题、检查界面，并从模拟器采集性能证据。",
    "expo": "构建、部署、升级和调试 Expo 与 React Native 应用。",
    "coderabbit": "对当前代码改动运行 AI 代码审查。",
    "neon-postgres": "管理 Neon Serverless Postgres 项目和数据库。",
    "plugin-eval": "从对话发起插件评测，并在本地运行评估或 benchmark。",
    "cloudinary": "管理、搜索和转换 Cloudinary 媒体资源。",
    "hostinger": "通过自然语言描述创建网站和应用。",
    "marcopolo": "在安全容器中处理你的实际数据。",
    "quicknode": "管理 Quicknode 基础设施。",
    "sendgrid": "调用 SendGrid 邮件 API。",
    "statsig": "连接 Statsig 工作区并读取实验与产品数据。",
    "vantage": "汇总云基础设施成本，辅助可观测性和成本优化。",
    "yepcode": "用自有代码和 JSON Schema 输入构建自定义 AI 工具。",
    "render": "在 Render 上部署、调试、监控和迁移应用。",
    "temporal": "开发、运行和管理 Temporal 应用。",
    "supabase": "使用 Supabase skills 和 MCP 工具处理项目与数据库。",
    "codex-security": "对代码库执行安全扫描。",
    "twilio-developer-kit": "构建、调试和交付 Twilio 相关功能。",
    "remotion": "通过提示词创建动态图形。",
    "biorender": "帮助科研人员创建专业图表。",
    "hyperframes-by-heygen": "编写 HTML 并渲染视频。",
    "cogedim": "查询和处理 Cogedim 房地产相关信息。",
    "finn": "处理 FINN 汽车订阅相关信息。",
    "myregistry-com": "管理礼品清单和送礼相关信息。",
    "setu-bharat-connect-billpay": "通过对话处理公共事业账单支付。",
    "weatherpromise": "根据降雨承诺处理旅行天气保障信息。",
    "atlassian-rovo": "快速管理 Jira 和 Confluence。",
    "jam": "带上下文录制屏幕。",
    "stripe": "处理支付和业务工具相关任务。",
    "box": "搜索和引用 Box 文档。",
    "amplitude": "分析产品数据和漏斗。",
    "attio": "连接 Attio CRM，管理客户关系。",
    "brand24": "探索品牌提及、情绪和媒体监测数据。",
    "brex": "连接 Brex，查看公司财务信息。",
    "carta-crm": "帮助投资团队跟进交易流、公司和关系。",
    "channel99": "连接 Channel99，查看实时 GTM 与营销表现情报。",
    "circleback": "生成会议记录、行动项和对话摘要。",
    "clickup": "把 ClickUp 作为项目和任务指挥中心。",
    "common-room": "嵌入买方情报并辅助销售协作。",
    "conductor": "检索品牌可见度、情绪和 SEO 表现指标。",
    "coupler-io": "连接并分析营销、财务、销售、电商等业务数据。",
    "coveo": "搜索企业内容。",
    "demandbase": "为销售、市场和 GTM 团队提供 B2B 数据访问。",
    "docket": "检索销售知识并辅助销售问答。",
    "domotz-preview": "通过自然语言监控和管理网络基础设施。",
    "dovetail": "将客户反馈转化为决策输入。",
    "egnyte": "处理 Egnyte 中的文档和文件。",
    "fireflies": "连接会议记录和团队知识。",
    "fyxer": "在对话中撰写符合个人语气的邮件。",
    "granola": "连接会议历史，读取过往对话上下文。",
    "happenstance": "用自然语言搜索职业人脉。",
    "help-scout": "同步 Help Scout 邮箱和对话。",
    "highlevel": "使用统一 CRM、自动化和客户沟通平台。",
    "hubspot": "分析 HubSpot 数据，创建和更新记录，并管理 CRM。",
    "keybid-puls": "用 ROI 计算器评估短租投资盈利能力。",
    "mem": "连接 Mem 知识库，提供第二大脑上下文。",
    "monday-com": "让智能体操作 monday.com 工作流。",
    "motherduck": "连接 MotherDuck 数据仓库。",
    "network-solutions": "搜索可用域名并辅助域名选择。",
    "omni-analytics": "按团队语义模型和权限查询 Omni。",
    "otter-ai": "连接会议智能，搜索和读取会议内容。",
    "pipedrive": "同步 Pipedrive 交易和联系人。",
    "pylon": "搜索、管理并解决 Pylon 客服问题。",
    "ranked-ai": "使用 AI SEO 与 PPC 软件分析营销表现。",
    "razorpay": "连接 Razorpay 支付数据。",
    "read-ai": "把会议智能接入 AI 工作流。",
    "responsive": "处理组织数据和响应式业务内容。",
    "semrush": "提供域名、关键词、反链等 SEO 和流量数据。",
    "signnow": "更快完成文档签署。",
    "skywatch": "搜索和探索卫星影像。",
    "streak": "在 Gmail 内管理 CRM 交易、联系人和流程。",
    "teamwork-com": "同步 Teamwork 项目和任务。",
    "united-rentals": "按任务需求查找合适设备。",
    "waldo": "使用 AI 策略平台处理代理商和品牌分析。",
    "windsor-ai": "连接营销和业务数据源用于自然语言提问。",
    "life-science-research": "进行生命科学研究、证据综合，并可路由并行子代理。",
    "zotero": "从 Zotero 查找论文并添加引用。",
    "alpaca": "访问市场数据并处理投资研究。",
    "binance": "读取 Binance 公开只读市场数据。",
    "cb-insights": "用于私募市场研究。",
    "cube": "查询 Cube 中的实际值、预算、预测和差异数据。",
    "daloopa": "读取来自 SEC 文件、投资者演示等来源的基本面数据。",
    "dow-jones-factiva": "搜索 Factiva 全球新闻档案。",
    "govtribe": "搜索政府合同、授标和供应商。",
    "moody-s": "查询信用和风险情报。",
    "morningstar": "查询投资和基金研究资料。",
    "mt-newswires": "读取 MT Newswires 全球金融新闻。",
    "particl-market-research": "回答电商市场研究问题。",
    "pitchbook": "访问公司、投资者、基金和交易等私募资本市场数据。",
    "policynote": "访问全球政策和监管情报。",
    "quartr": "访问上市公司的投资者关系和一手结构化数据。",
    "readwise": "连接 Readwise 和 Reader。",
    "scite": "获取基于同行评议研究的可验证答案。",
    "taxdown": "解答西班牙个人和自雇人士税务问题。",
    "third-bridge": "引入行业专家洞察和关键背景信息。",
    "tinman-ai": "帮助信贷人员和承销人员处理住房融资场景。"
  };
  const long = {
    ...short,
    "browser-use": "Browser 让 Codex 打开并控制内置浏览器，主要用于本地开发页面和文件。它可以导航、检查页面、点击、输入和截图，并在 Codex 内完成页面验证。",
    "chrome": "Chrome 让 Codex 使用你的 Chrome 浏览器处理需要现有浏览器状态的任务，包括已打开的标签页、cookies、扩展和已经登录的网站。它可以导航、查看页面、点击、输入和截图。",
    "latex-tectonic": "LaTeX Tectonic 提供内置 Tectonic 可执行文件，Codex 可用它编译 LaTeX 和 TeX 文档，无需依赖系统级 TeX 安装。",
    "hugging-face": "Hugging Face 可用于检索和检查模型、数据集、Spaces、推理端点和相关资源，帮助完成模型选型、资料查找和机器学习项目调研。",
    "netlify": "Netlify 可用于部署项目、查看站点和发布状态、管理构建与发布流程，并协助处理 Web 项目上线相关任务。",
    "vercel": "Vercel 可用于构建和部署 Web 应用与智能体项目，查看项目状态、发布记录和部署配置，并协助处理上线流程。",
    "game-studio": "Game Studio 可用于设计、原型验证和发布浏览器游戏，辅助处理游戏玩法、交互、资源和发布流程。",
    "superpowers": "Superpowers 面向软件交付流程，辅助进行计划、TDD、调试、代码审查和交付管理。",
    "circleci": "CircleCI 可用于查看和管理 CI/CD 流水线，处理构建、测试和部署任务，并排查失败的工作流。",
    "cloudflare": "Cloudflare 可用于处理 Cloudflare 平台相关工作，包括 Workers、Pages、DNS、缓存、部署和基础设施配置。",
    "sentry": "Sentry 可用于查看错误、性能问题、事件、发布健康状态和相关上下文，帮助定位线上问题。",
    "build-ios-apps": "Build iOS Apps 可用于构建、优化、调试和测试 iOS 应用，协助处理本地构建和移动端工程问题。",
    "build-macos-apps": "Build macOS Apps 可用于构建、运行、测试、签名、打包和排查 macOS 应用，适合 Swift、SwiftUI、AppKit 和桌面发布流程。",
    "google-calendar": "Google 日历可用于查看日程、安排会议、查询忙闲状态、管理参会人和处理日历相关协作。",
    "google-drive": "Google 云端硬盘可用于访问 Drive、Docs、Sheets 和 Slides 文件，读取、搜索、整理和处理云端文档。",
    "gmail": "Gmail 可用于读取、搜索、撰写、回复和管理邮件，帮助处理收件箱、草稿和邮件沟通任务。",
    "slack": "Slack 可用于搜索消息、查看频道、读取对话上下文并处理团队协作沟通。",
    "linear": "Linear 可用于查找和引用 issue、项目、路线图和工作流，辅助项目管理和工程协作。",
    "github": "GitHub 可用于查看仓库、PR、issue、CI 和代码协作内容，辅助代码审查、问题定位和发布流程。",
    "figma": "Figma 可用于读取设计文件、理解界面结构、生成实现计划，并辅助设计系统和前端实现工作。",
    "notion": "Notion 可用于检索知识库、整理资料、读取页面和写入内容，辅助会议准备、研究整理和知识沉淀。",
    "canva": "Canva 可用于搜索、创建和编辑设计，辅助处理视觉素材和设计内容。",
    "openai-developers": "OpenAI Developers 可用于构建 OpenAI API、Agents SDK 和 ChatGPT Apps，辅助查阅开发资源、生成实现方案和处理 API 集成。",
    "outlook-calendar": "Outlook 日历可用于查看日程、安排会议、查询忙闲状态并管理 Microsoft 生态中的日历协作。",
    "outlook-email": "Outlook 邮箱可用于读取、搜索、撰写、回复和管理邮件，辅助处理 Microsoft 邮箱工作流。",
    "sharepoint": "SharePoint 可用于访问团队文档、站点和协作文件，辅助读取、整理和处理 Microsoft 365 文档内容。",
    "teams": "Microsoft Teams 可用于查看和处理团队协作内容，包括聊天、频道、会议上下文和协作信息。",
    "computer-use": "Computer Use 可用于操作浏览器或桌面界面，通过点击、输入和读取屏幕内容完成图形界面任务。",
    "spreadsheets": "Spreadsheets 可用于读取、编辑和整理电子表格数据，辅助分析表格、清洗数据和生成结构化结果。",
    "presentations": "Presentations 可用于读取、编辑和整理演示文稿，辅助生成、修改和优化幻灯片内容。"
  };
  return kind === "long" ? long : short;
}

function openAIPluginDescriptionFunctionSource(functionName, kind = "short") {
  const descriptions = openAIPluginDescriptions(kind);
  return `function ${functionName}(e){const t=${JSON.stringify(descriptions)};function n(e){return String(e??\`\`).trim().toLowerCase().replace(/[^a-z0-9]+/g,\`-\`).replace(/^-+|-+$/g,\`\`)}function r(e){return String(e).replace(/^[^：]{1,48}：\\s*/,\`\`)}let i=[e?.plugin?.id,e?.plugin?.name,e?.summary?.id,e?.summary?.name,e?.id,e?.name,e?.pluginId,e?.remotePluginId,e?.displayName,e?.summary?.interface?.displayName,e?.plugin?.interface?.displayName].map(n).filter(Boolean),a=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName].map(e=>String(e??\`\`).toLowerCase()).join(\` \`);if(/(ruijie|local plugins?)/.test(a))return null;for(const e of i){if(Object.prototype.hasOwnProperty.call(t,e))return r(t[e])}return null}`;
}

function openAIPluginSkillPreviewFunctionSource() {
  const browserSkill = `# Browser

用于让 Codex 控制内置浏览器。适用场景包括打开页面、导航、检查页面状态、测试本地应用、点击、输入、截图，以及读取当前可见页面内容。完成初始化后应选择 \`iab\` 浏览器后端。

如果本插件在会话中可用，浏览器相关任务应优先使用本技能。不要因为其他浏览器工具看起来更直接，就绕过本技能。

首次在当前会话使用前，需要完整读取本技能说明，不能只读取片段。

## 初始化

这些步骤属于内部初始化流程。需要用插件提供的浏览器后端建立连接，确认页面列表、当前标签页、截图和 DOM 快照可用；如果初始化失败，应先按本技能的排查步骤处理，再考虑其他方案。

## 故障排查

浏览器不可用时，先确认插件后端是否启动、当前页面是否可访问、目标 URL 是否受限制、页面是否仍在加载、选择器是否稳定。不要用空结果掩盖失败；如果页面无法操作，要明确说明失败点。

## 运行行为

浏览器操作应基于可见页面状态执行。读取页面、点击、输入、截图、导航都必须等待页面达到可交互状态。对会修改用户数据、提交表单、删除内容、付款或发送消息的操作，要遵守确认策略。

### node_repl

需要脚本化页面检查时，可以使用 Node REPL 中的浏览器 API。优先读取 DOM、role、文本、placeholder、URL 和可访问名称；不要依赖脆弱坐标。

## API 使用方式

### API 使用步骤

使用浏览器 API 时，先获取当前页面和快照，再根据页面结构选择最稳定的定位方式。操作后要重新读取状态确认结果。

### 通用建议

优先使用语义化定位。只在 DOM 信息不足时才考虑坐标。对弹窗、抽屉、虚拟列表和 iframe，要先确认当前焦点和可见区域。

## Playwright

### 快照规范

操作前读取快照，操作后再次读取快照。不要假设页面状态已经改变。

### 当前运行环境中的 Playwright 约束

不要随意启动新的独立浏览器 profile。不要绕过插件提供的浏览器上下文。不要在未确认页面状态时执行破坏性操作。

### 必要交互流程

先定位元素，再确认元素可见和可用，然后执行点击、输入或导航，最后读取结果。

### 定位策略

优先级：role、label、placeholder、text、URL、稳定属性、DOM 结构。避免使用易变 class、纯坐标和过深 CSS 路径。

### 使用 \`getByRole(..., { name })\`

按钮、链接、输入框、菜单项优先用 role 和名称定位。名称可来自可见文本、aria-label 或关联 label。

### 交互最佳实践

等待页面稳定；输入前清空目标字段；点击前确认不会误触；提交前核对表单内容。

### 错误恢复

如果定位失败，重新读取页面快照并改用更稳定定位方式。不要反复执行同一个失败操作。

### 回退策略

只有在插件浏览器确实不可用，且用户允许时，才使用其他浏览器方案。

## 浏览器安全

浏览器可能包含登录态和敏感数据。不要读取或输出与任务无关的隐私信息。执行有副作用的操作前按策略请求确认。

## 浏览器操作确认策略

### 适用范围

适用于提交表单、发送消息、购买、删除、授权、修改账号、下载或上传文件等会影响用户状态的操作。

### 定义

低风险操作包括查看页面、搜索、导航和读取公开内容。高风险操作包括不可逆修改、外部发送、资金相关、权限授权和数据覆盖。

### 确认模式

低风险操作可直接执行。高风险操作必须先清楚说明将要做什么并等待用户确认。

### 确认规范

确认请求要具体，不要含糊。确认后只执行用户批准的操作范围。

## API 参考

常用能力包括打开页面、获取当前页面、读取快照、点击、输入、选择、截图、等待导航、读取文本和执行页面脚本。`;

  const chromeSkill = `# Chrome

用于让 Codex 连接并控制用户的 Chrome 浏览器。适用于需要用户现有浏览器状态的任务，包括 cookies、登录态、已有标签页、扩展、远程认证网站，以及 Codex Chrome Extension 的设置、检测和修复。

当用户提到 \`@chrome\` 时使用本技能。普通或泛化的 \`@chrome\` 请求不需要因为含义宽泛而先追问，按 Chrome 自动化流程继续处理。

如果最终无法和 Codex Chrome Extension 通信，不要改用 AppleScript、shell 脚本或其他本地脚本伪造浏览器操作。原生 host 损坏时，不要自行安装或修复；应让用户从 Codex 插件 UI 重新安装 Chrome 插件。

首次在当前会话使用前，需要完整读取本技能说明，不能只读取片段。

## Chrome 扩展检查

### 1. 未安装 Chrome

如果系统没有安装 Chrome，告知用户需要安装 Chrome 后才能使用此插件。

### 2. Chrome 未运行

如果 Chrome 未运行，使用插件脚本打开 Chrome 窗口，并等待扩展连接。不要启动临时 profile。

### 3. native host manifest 未安装或无效

原生 host manifest 缺失或无效时，提示用户从插件 UI 重新安装 Chrome 插件。不要直接写注册表或替换 manifest。

### 4. Codex Chrome Extension 未安装

扩展未安装时，提示用户安装 Codex Chrome Extension，并保持 Chrome 窗口打开。

### 4. Codex Chrome Extension 未启用

扩展已安装但被禁用时，提示用户在 Chrome 扩展管理页启用。

### 5. 扩展和 manifest 都存在但通信仍失败

如果扩展和 manifest 都存在但通信失败，重新检查 Chrome 进程、扩展状态、native host 路径和日志。仍失败时明确报告通信失败，不要换用未授权的自动化方案。

## Chrome 错误处理

### 文件上传错误

文件上传失败时，确认文件路径存在、浏览器输入控件可用、页面未阻止上传，并重新读取页面状态后再处理。

## 命令

### installed-browsers.js

检查本机可用浏览器。

### chrome-is-running.js

检查 Chrome 是否正在运行。

### open-chrome-window.js

打开或聚焦 Chrome 窗口。

### check-extension-installed.js

检查 Codex Chrome Extension 是否安装并启用。

### check-native-host-manifest.js

检查 Chrome native messaging host manifest 是否存在且配置正确。

## Chrome 安全

Chrome 可能包含用户登录态和敏感页面。只读取完成任务所需的信息，不输出无关隐私内容。涉及提交、删除、付款、授权、发送消息或覆盖数据时，必须先请求用户确认。

## 用户标签页接管

接管用户已有标签页前，要确认目标标签页与任务相关。不要随意关闭、覆盖或导航用户无关标签页。

## 文件上传

上传前确认文件路径和页面目标，避免把错误文件上传到远端服务。

## 标签页清理

只清理本任务新建且不再需要的标签页。不要关闭用户已有标签页。

## 初始化

建立与 Chrome 扩展的连接，确认可读取标签页、页面 URL、DOM 快照和截图。初始化失败时按上面的扩展检查流程处理。

## 故障排查

优先检查 Chrome 是否运行、扩展是否启用、native host 是否有效、目标页面是否可访问、标签页是否处于可操作状态。

## 运行行为

所有操作基于当前 Chrome 页面状态执行。操作前读取页面，操作后重新确认结果。

### node_repl

需要脚本化页面检查时，通过插件连接的 Chrome 后端执行，不要启动独立浏览器 profile。

## API 使用方式

### API 使用步骤

先获取当前标签页和页面快照，再使用稳定定位方式执行操作。

### 通用建议

优先使用 role、文本、label、placeholder、URL 和稳定 DOM。避免使用坐标和易变 class。

## Playwright

### 快照规范

操作前后都要读取快照，确认页面状态。

### 当前运行环境中的 Playwright 约束

不得启动临时 profile 或绕过 Chrome 插件后端。

### 必要交互流程

定位、确认可见、执行操作、读取结果。

### 定位策略

优先语义化定位，必要时使用 DOM 结构。

### Using \`getByRole(..., { name })\`

按钮、链接、输入框、菜单项优先用 role 和名称定位。

### 交互最佳实践

等待页面稳定，输入前清空字段，提交前核对内容。

### 错误恢复

失败后重新读取页面状态并调整定位方式，不要重复盲点。

### 回退策略

Chrome 插件不可用时，不要自行换用脚本控制 Chrome；应报告扩展通信问题。

## 浏览器安全

不要泄露登录态、cookie、个人信息或无关页面内容。

## 浏览器操作确认策略

### 适用范围

适用于会修改外部系统或用户数据的浏览器操作。

### 定义

低风险为读取、搜索、导航；高风险为提交、删除、付款、授权、发送、覆盖。

### 确认模式

低风险可直接执行，高风险必须先确认。

### 确认规范

确认要具体，只执行已批准范围。

## API 参考

常用能力包括列出标签页、选择标签页、读取页面、点击、输入、上传文件、截图、等待导航和执行页面脚本。`;

  const latexSkill = `# LaTeX Tectonic

当用户要求用 Tectonic 编译、预览、构建或排查 LaTeX / TeX 文档时使用本技能。

插件在插件根目录内置 Tectonic：

- macOS/Linux：\`bin/tectonic\`
- Windows：\`bin/tectonic.exe\`

从当前 \`SKILL.md\` 文件向上两级可定位插件根目录：\`skills/latex-tectonic/\` 的上上级。

其他脚本需要获取可执行文件路径时，使用：

\`\`\`bash
node scripts/tectonic-path.mjs
\`\`\`

正常编译时，在文档目录下直接运行内置可执行文件：

\`\`\`bash
<plugin-root>/bin/tectonic --outdir <output-directory> <tex-file>
\`\`\`

优先把生成的 PDF 和辅助文件写入明确的输出目录。除非用户要求回退方案，否则不要安装系统级 TeX 发行版。`;

  return `function ruizhiSkillPreviewMarkdown(e,t){let n=String(t??\`\`).replace(/\\\\/g,\`/\`).toLowerCase();if(n.includes(\`/openai-bundled/plugins/browser-use/skills/browser/skill.md\`)||n.includes(\`/openai-bundled/browser-use/\`)&&n.includes(\`/skills/browser/skill.md\`))return ${JSON.stringify(browserSkill)};if(n.includes(\`/openai-bundled/plugins/chrome/skills/chrome/skill.md\`)||n.includes(\`/openai-bundled/chrome/\`)&&n.includes(\`/skills/chrome/skill.md\`))return ${JSON.stringify(chromeSkill)};if(n.includes(\`/openai-bundled/plugins/latex-tectonic/skills/latex-tectonic/skill.md\`)||n.includes(\`/openai-bundled/latex-tectonic/\`)&&n.includes(\`/skills/latex-tectonic/skill.md\`))return ${JSON.stringify(latexSkill)};return e}`;
}

function translatedOpenAIPluginSkillMarkdown(previewPath) {
  return new Function(`${openAIPluginSkillPreviewFunctionSource()}; return ruizhiSkillPreviewMarkdown("", ${JSON.stringify(previewPath)});`)();
}

function writeTranslatedOpenAIPluginSkill(skillPath, name, description, previewPath) {
  if (!fs.existsSync(skillPath)) {
    throw new Error(`skill 文案补丁目标不存在：${skillPath}`);
  }

  const body = translatedOpenAIPluginSkillMarkdown(previewPath).trim();
  fs.writeFileSync(
    skillPath,
    `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}\n`,
    "utf8"
  );
}

function patchPluginDescriptionDisplayBundle(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  let next = source;
  const basename = path.basename(filePath);

    if (/plugins-page-selectors-.*\.js$/.test(basename)) {
    const target = "function h(e,t){let n=p(e);if(n!=null)return t.formatMessage(f[n]);let r=l(e.plugin.interface?.defaultPrompt);if(r!=null)return r;let i=e.description?.trim();return i==null||i.length===0?null:i}";
    if (next.includes(target) && !next.includes("function ruizhiPluginCardDescription(")) {
      next = next.replace(
        target,
        `${openAIPluginDescriptionFunctionSource("ruizhiPluginCardDescription")}function h(e,t){let n=ruizhiPluginCardDescription(e);if(n!=null)return n;let r=p(e);if(r!=null)return t.formatMessage(f[r]);let i=l(e.plugin.interface?.defaultPrompt);if(i!=null)return i;let a=e.description?.trim();return a==null||a.length===0?null:a}`
      );
    }

    const featuredLookupTarget = "function B(e,t){let n=new Map(e.map(e=>[e.plugin.id,e])),r=[];for(let e of t){let t=n.get(e);t!=null&&r.push(t)}return r}";
    if (next.includes(featuredLookupTarget) && !next.includes("String(e).split(`@`)[0]")) {
      next = next.replace(
        featuredLookupTarget,
        "function B(e,t){let n=new Map,r=[];for(let t of e)for(let e of[t.plugin.id,String(t.plugin.id??``).split(`@`)[0],...g(t)])e&&n.has(e)||e&&n.set(e,t);for(let i of t){let t=n.get(i)??n.get(String(i).split(`@`)[0]);t!=null&&!r.some(e=>e.plugin.id===t.plugin.id)&&r.push(t)}return r}"
      );
    }

    next = patchHardcodedOpenAIRecommendedPluginList(next);

    const marketplaceLabelTarget = "function T(e){return E(e)?`OpenAI`:e}";
    if (next.includes(marketplaceLabelTarget) && !next.includes("function ruizhiMarketplaceLabel(")) {
      next = next.replace(
        marketplaceLabelTarget,
        "function ruizhiMarketplaceLabel(e){switch(String(e??``).trim().toLowerCase()){case`local plugins`:case`local plugin`:return`本地插件`;default:return null}}function T(e){let t=ruizhiMarketplaceLabel(e);return t??(E(e)?`OpenAI`:e)}"
      );
    }
  }

  if (/plugins-availability-.*\.js$/.test(basename)) {
    const target = "function Nt(e){return e.plugin.interface?.longDescription?.trim()||e.plugin.interface?.shortDescription?.trim()||e.description?.trim()||null}";
    if (next.includes(target) && !next.includes("function ruizhiPluginInstallDescription(")) {
      next = next.replace(
        target,
        `${openAIPluginDescriptionFunctionSource("ruizhiPluginInstallDescription", "long")}function Nt(e){let t=ruizhiPluginInstallDescription(e);return t??(e.plugin.interface?.longDescription?.trim()||e.plugin.interface?.shortDescription?.trim()||e.description?.trim()||null)}`
      );
    }
  }

  if (/plugins-page-.*\.js$/.test(basename)) {
    const cardTarget = "let R=p.description??void 0,z;";
    if (next.includes(cardTarget) && !next.includes("function ruizhiPluginPageCardDescription(")) {
      next = next.replace(
        cardTarget,
        `${openAIPluginDescriptionFunctionSource("ruizhiPluginPageCardDescription")}let R=ruizhiPluginPageCardDescription(p)??p.description??void 0,z;`
      );
    }
  }

  if (/plugin-detail-page-.*\.js$/.test(basename)) {
    const cardTarget = "let ee;t[19]===n.description?ee=t[20]:(ee=n.description??(0,Z.jsx)(G,{...Mr.noDescription}),t[19]=n.description,t[20]=ee);";
    if (next.includes(cardTarget) && !next.includes("function ruizhiPluginCardListDescription(")) {
      next = next.replace(
        cardTarget,
        `${openAIPluginDescriptionFunctionSource("ruizhiPluginCardListDescription")}let ee;t[19]===n?ee=t[20]:(ee=ruizhiPluginCardListDescription(n)??n.description??(0,Z.jsx)(G,{...Mr.noDescription}),t[19]=n,t[20]=ee);`
      );
    }

    const detailTarget = "function _i(e){return e.summary.interface?.shortDescription??e.description??null}function vi(e){let t=e.summary.interface?.longDescription??e.description??e.summary.interface?.shortDescription??null;return t===_i(e)?null:t}";
    if (next.includes(detailTarget) && !next.includes("function ruizhiPluginDetailShortDescription(")) {
      next = next.replace(
        detailTarget,
        `${openAIPluginDescriptionFunctionSource("ruizhiPluginDetailShortDescription")}${openAIPluginDescriptionFunctionSource("ruizhiPluginDetailLongDescription", "long")}function _i(e){return ruizhiPluginDetailShortDescription(e)??e.summary.interface?.shortDescription??e.description??null}function vi(e){let t=ruizhiPluginDetailLongDescription(e);if(t!=null)return t;let n=e.summary.interface?.longDescription??e.description??e.summary.interface?.shortDescription??null;return n===_i(e)?null:n}`
      );
    }

    const skillTarget = "function hn(e,{path:t,expectedTitle:n}){";
    if (next.includes(skillTarget) && !next.includes("function ruizhiSkillPreviewMarkdown(")) {
      next = next.replace(
        skillTarget,
        `${openAIPluginSkillPreviewFunctionSource()}function hn(e,{path:t,expectedTitle:n}){let o=ruizhiSkillPreviewMarkdown(e,t);if(o!==e)return o;`
      );
    }
  }

  if (next !== source) {
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  }
  return false;
}

function patchPluginAvailabilityBundle(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  let next = source;
  if (!/^plugins-availability-.*\.js$/.test(path.basename(filePath))) {
    return false;
  }

  const target = "function X(e){return e.displayName??P(e.plugin.name)}";
  if (next.includes(target) && !next.includes("function ruizhiPluginDisplayName(")) {
    next = next.replace(
      target,
      "function ruizhiPluginDisplayName(e,t){let n=String(e??``).trim(),r=String(t??``).toLowerCase(),i=n.toLowerCase();if(i===`google`)return`谷歌`;if(i===`google calendar`||i===`google-calendar`||r.includes(`google-calendar`))return`Google 日历`;if(i===`google drive`||i===`google-drive`||r.includes(`google-drive`))return`Google 云端硬盘`;if(i===`google docs`||i===`google-docs`||r.includes(`google-docs`))return`Google 文档`;if(i===`google sheets`||i===`google-sheets`||r.includes(`google-sheets`))return`Google 表格`;if(i===`google slides`||i===`google-slides`||r.includes(`google-slides`))return`Google 幻灯片`;if(i===`google maps`||i===`google-maps`||r.includes(`google-maps`))return`Google 地图`;if(i===`google search`||i===`google-search`||r.includes(`google-search`))return`Google 搜索`;return e}function X(e){return ruizhiPluginDisplayName(e.displayName??P(e.plugin.name),e.plugin?.id??e.plugin?.name)}"
    );
  }

  const descriptionTarget = "function Nt(e){return e.plugin.interface?.longDescription?.trim()||e.plugin.interface?.shortDescription?.trim()||e.description?.trim()||null}";
  if (next.includes(descriptionTarget) && !next.includes("function ruizhiOpenAIPluginInstallDescription(")) {
    next = next.replace(
      descriptionTarget,
      "function ruizhiOpenAIPluginInstallDescription(e){let t=[e?.plugin?.id,e?.plugin?.name,e?.displayName,e?.summary?.id,e?.summary?.name].map(e=>String(e??``).toLowerCase()).join(` `),n=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.plugin?.id,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);if(!/(openai|codex official)/.test(n)||/(ruijie|local plugins?)/.test(n))return null;if(t.includes(`google-calendar`))return`Google 日历：查看日程、安排会议和管理日历。`;if(t.includes(`google-drive`))return`Google 云端硬盘：访问 Drive、Docs、Sheets 和 Slides 文件。`;if(t.includes(`gmail`))return`Gmail：读取、搜索、撰写和管理邮件。`;if(t.includes(`slack`))return`Slack：搜索消息、查看频道并处理协作对话。`;if(t.includes(`linear`))return`Linear：查找和引用 issue、项目与工作流。`;if(t.includes(`github`))return`GitHub：查看仓库、PR、issue 和代码协作内容。`;if(t.includes(`figma`))return`Figma：读取设计文件、生成实现计划和处理设计系统。`;if(t.includes(`notion`))return`Notion：检索知识库、整理资料和写入页面。`;if(t.includes(`canva`))return`Canva：搜索、创建和编辑设计。`;if(t.includes(`openai-developers`))return`OpenAI Developers：构建 OpenAI API、Agents SDK 和 ChatGPT Apps。`;if(t.includes(`outlook-calendar`))return`Outlook 日历：查看日程、安排会议和管理日历。`;if(t.includes(`outlook-email`))return`Outlook 邮箱：读取、搜索、撰写和管理邮件。`;if(t.includes(`sharepoint`))return`SharePoint：访问团队文档和协作文件。`;if(t.includes(`teams`))return`Microsoft Teams：查看和处理团队协作内容。`;if(t.includes(`computer-use`))return`Computer Use：操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。`;if(t.includes(`browser-use`)||t.includes(`browser`))return`Browser：控制内置浏览器，用于页面导航、点击、输入和截图。`;if(t.includes(`chrome`))return`Chrome：控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。`;if(t.includes(`latex-tectonic`))return`LaTeX Tectonic：使用内置 Tectonic 编译 LaTeX 和 TeX 文档。`;if(t.includes(`build-macos-apps`))return`Build macOS Apps：构建、运行、测试、签名和排查 macOS 应用。`;if(t.includes(`spreadsheets`))return`Spreadsheets：读取、编辑和整理电子表格数据。`;if(t.includes(`presentations`))return`Presentations：读取、编辑和整理演示文稿。`;return null}function Nt(e){let t=ruizhiOpenAIPluginInstallDescription(e);return t??(e.plugin.interface?.longDescription?.trim()||e.plugin.interface?.shortDescription?.trim()||e.description?.trim()||null)}"
    );
  }

  if (next.includes("function kt(e){") && !next.includes("function ruizhiPluginCategoryLabel(")) {
    next = next.replace(
      "function kt(e){",
      "function ruizhiPluginCategoryLabel(e){switch(String(e??``).trim().toLowerCase().replace(/[_-]+/g,` `)){case`featured`:return`推荐`;case`experimental`:return`实验性`;case`coding`:return`编码`;case`automation`:return`自动化`;case`engineering`:case`developer tools`:return`工程`;case`productivity`:return`效率`;case`research`:return`研究`;case`google`:return`谷歌`;case`microsoft`:return`微软`;case`communication`:case`communications`:return`沟通`;case`project management`:return`项目管理`;case`data`:case`data analytics`:case`data & analytics`:return`数据分析`;case`search`:return`搜索`;case`browser`:case`browsers`:return`浏览器`;case`design`:return`设计`;case`lifestyle`:return`生活方式`;case`finance`:return`财务`;case`sales`:return`销售`;case`marketing`:return`市场营销`;case`education`:return`教育`;case`writing`:return`写作`;case`other`:return`其他`;default:return e}}function ruizhiIsOpenAIPlugin(e){let t=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.plugin?.id,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);return/(openai|codex official)/.test(t)&&!/(ruijie|local plugins?)/.test(t)}function kt(e){"
    );
  }
  next = next.replace(
    "a=n.plugin.interface?.category?.trim()",
    "a=ruizhiIsOpenAIPlugin(n)?ruizhiPluginCategoryLabel(n.plugin.interface?.category?.trim()):n.plugin.interface?.category?.trim()"
  );
  if (!ruizhiForcePluginInstallEnabled()) {
    next = next.replace(
      "children:c?(0,Z.jsx)(F,{id:`plugins.installModal.installing`,defaultMessage:`正在安装 {pluginName}`,description:`Button label in the plugin install modal while installation is in progress`,values:{pluginName:X(P)}}):(0,Z.jsx)(F,{id:`plugins.installModal.install`,defaultMessage:`安装 {pluginName}`,description:`Install button label in the plugin install modal`,values:{pluginName:X(P)}})",
      "children:h?(0,Z.jsx)(F,{id:`plugins.installModal.pendingSupport`,defaultMessage:`即将支持，敬请期待`,description:`Button label when plugin install is unavailable in this build`}):c?(0,Z.jsx)(F,{id:`plugins.installModal.installing`,defaultMessage:`正在安装 {pluginName}`,description:`Button label in the plugin install modal while installation is in progress`,values:{pluginName:X(P)}}):(0,Z.jsx)(F,{id:`plugins.installModal.install`,defaultMessage:`安装 {pluginName}`,description:`Install button label in the plugin install modal`,values:{pluginName:X(P)}})"
    );
  }
  if (next !== source) {
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  }
  return false;
}

function patchPluginDetailPageBundle(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  let next = source;
  if (!/^plugin-detail-page-.*\.js$/.test(path.basename(filePath))) {
    return false;
  }

  const target = "function hn(e,{path:t,expectedTitle:n}){";
  if (next.includes(target) && !next.includes("function ruizhiSkillPreviewMarkdown(")) {
    next = next.replace(
      target,
      `${openAIPluginSkillPreviewFunctionSource()}function hn(e,{path:t,expectedTitle:n}){let o=ruizhiSkillPreviewMarkdown(e,t);if(o!==e)return o;`
    );
  }

  const detailDescriptionTarget = "function _i(e){return e.summary.interface?.shortDescription??e.description??null}function vi(e){let t=e.summary.interface?.longDescription??e.description??e.summary.interface?.shortDescription??null;return t===_i(e)?null:t}";
  if (next.includes(detailDescriptionTarget) && !next.includes("function ruizhiOpenAIPluginDetailDescription(")) {
    next = next.replace(
      detailDescriptionTarget,
      "function ruizhiOpenAIPluginDetailDescription(e){let t=[e?.summary?.id,e?.summary?.name,e?.summary?.interface?.displayName,e?.summary?.interface?.shortDescription].map(e=>String(e??``).toLowerCase()).join(` `),n=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.summary?.source?.type,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);if(!/(openai|codex official)/.test(n)||/(ruijie|local plugins?)/.test(n))return null;if(t.includes(`google-calendar`))return`Google 日历：查看日程、安排会议和管理日历。`;if(t.includes(`google-drive`))return`Google 云端硬盘：访问 Drive、Docs、Sheets 和 Slides 文件。`;if(t.includes(`gmail`))return`Gmail：读取、搜索、撰写和管理邮件。`;if(t.includes(`slack`))return`Slack：搜索消息、查看频道并处理协作对话。`;if(t.includes(`linear`))return`Linear：查找和引用 issue、项目与工作流。`;if(t.includes(`github`))return`GitHub：查看仓库、PR、issue 和代码协作内容。`;if(t.includes(`figma`))return`Figma：读取设计文件、生成实现计划和处理设计系统。`;if(t.includes(`notion`))return`Notion：检索知识库、整理资料和写入页面。`;if(t.includes(`canva`))return`Canva：搜索、创建和编辑设计。`;if(t.includes(`openai-developers`))return`OpenAI Developers：构建 OpenAI API、Agents SDK 和 ChatGPT Apps。`;if(t.includes(`outlook-calendar`))return`Outlook 日历：查看日程、安排会议和管理日历。`;if(t.includes(`outlook-email`))return`Outlook 邮箱：读取、搜索、撰写和管理邮件。`;if(t.includes(`sharepoint`))return`SharePoint：访问团队文档和协作文件。`;if(t.includes(`teams`))return`Microsoft Teams：查看和处理团队协作内容。`;if(t.includes(`computer-use`))return`Computer Use：操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。`;if(t.includes(`browser-use`)||t.includes(`browser`))return`Browser：控制内置浏览器，用于页面导航、点击、输入和截图。`;if(t.includes(`chrome`))return`Chrome：控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。`;if(t.includes(`latex-tectonic`))return`LaTeX Tectonic：使用内置 Tectonic 编译 LaTeX 和 TeX 文档。`;if(t.includes(`build-macos-apps`))return`Build macOS Apps：构建、运行、测试、签名和排查 macOS 应用。`;if(t.includes(`spreadsheets`))return`Spreadsheets：读取、编辑和整理电子表格数据。`;if(t.includes(`presentations`))return`Presentations：读取、编辑和整理演示文稿。`;return null}function _i(e){return ruizhiOpenAIPluginDetailDescription(e)??e.summary.interface?.shortDescription??e.description??null}function vi(e){let t=ruizhiOpenAIPluginDetailDescription(e);if(t!=null)return null;let n=e.summary.interface?.longDescription??e.description??e.summary.interface?.shortDescription??null;return n===_i(e)?null:n}"
    );
  }

  const detailCategoryTarget = "function pi(e){let t=[e.marketplaceName.trim().length>0?ut(e.marketplaceName):null,e.summary.interface?.category?.trim()||null].filter(e=>e!=null);return t.length===0?null:t.join(`, `)}";
  if (next.includes(detailCategoryTarget) && !next.includes("function ruizhiPluginDetailCategory(")) {
    next = next.replace(
      detailCategoryTarget,
      "function ruizhiPluginDetailCategory(e){switch(String(e??``).trim().toLowerCase().replace(/[_-]+/g,` `)){case`featured`:return`推荐`;case`experimental`:return`实验性`;case`coding`:return`编码`;case`automation`:return`自动化`;case`engineering`:case`developer tools`:return`工程`;case`productivity`:return`效率`;case`research`:return`研究`;case`google`:return`谷歌`;case`microsoft`:return`微软`;case`communication`:case`communications`:return`沟通`;case`project management`:return`项目管理`;case`data`:case`data analytics`:case`data & analytics`:return`数据分析`;case`search`:return`搜索`;case`browser`:case`browsers`:return`浏览器`;case`design`:return`设计`;case`lifestyle`:return`生活方式`;case`finance`:return`财务`;case`sales`:return`销售`;case`marketing`:return`市场营销`;case`education`:return`教育`;case`writing`:return`写作`;case`other`:return`其他`;default:return e}}function ruizhiIsOpenAIPluginDetail(e){let t=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.summary?.source?.type,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);return/(openai|codex official)/.test(t)&&!/(ruijie|local plugins?)/.test(t)}function pi(e){let t=e.summary.interface?.category?.trim()||null,n=ruizhiIsOpenAIPluginDetail(e)?ruizhiPluginDetailCategory(t):t,r=[e.marketplaceName.trim().length>0?ut(e.marketplaceName):null,n].filter(e=>e!=null);return r.length===0?null:r.join(`, `)}"
    );
  }
  if (!ruizhiForcePluginInstallEnabled()) {
    next = next.replace(
      "connectorUnavailable:{id:`plugins.install.connectorUnavailable`,defaultMessage:`应用不可用`,description:`Tooltip shown when plugin install is unavailable because the plugin's apps are not available in the current app directory`},uninstall:",
      "connectorUnavailable:{id:`plugins.install.connectorUnavailable`,defaultMessage:`应用不可用`,description:`Tooltip shown when plugin install is unavailable because the plugin's apps are not available in the current app directory`},pendingSupport:{id:`plugins.detail.pendingSupport`,defaultMessage:`即将支持，敬请期待`,description:`Primary install action label when plugin install is unavailable in this build`},uninstall:"
    );
    next = next.replace(
      "let f=a?Fi.addingToCodex:y?Fi.disabledByAdminButton:Fi.addToCodex,p;",
      "let f=a?Fi.addingToCodex:r?Fi.pendingSupport:y?Fi.disabledByAdminButton:Fi.addToCodex,p;"
    );
  }

  if (next !== source) {
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  }
  return false;
}

const hiddenSystemSkillNames = ["openai-docs"];

const systemSkillTranslations = {
  imagegen: {
    displayName: "图片生成",
    description: "生成或编辑图片素材、产品图、UI mockup、封面和其他位图资源。"
  },
  "锐捷-图片生成": {
    displayName: "图片生成",
    description: "生成或编辑图片素材、产品图、UI mockup、封面和其他位图资源。"
  },
  "锐智-图片生成": {
    displayName: "图片生成",
    description: "生成或编辑图片素材、产品图、UI mockup、封面和其他位图资源。"
  },
  "plugin-creator": {
    displayName: "插件创建器",
    description: "创建 Codex 插件目录、plugin.json，以及可选的 skills、hooks、scripts、MCP 和应用配置。"
  },
  "skill-creator": {
    displayName: "技能创建器",
    description: "创建或更新 Codex skill，包括结构、触发说明、工作流和配套资源。"
  },
  "skill-installer": {
    displayName: "技能安装器",
    description: "从 OpenAI skills 列表或 GitHub 仓库安装 Codex skills。"
  }
};

function systemSkillTranslationFunctionSource() {
  return `const ruizhiSystemSkillText=${JSON.stringify(systemSkillTranslations)};const ruizhiHiddenSystemSkillNames=new Set(${JSON.stringify(hiddenSystemSkillNames)});function ruizhiShouldHideSystemSkill(e){return e?.scope===\`system\`&&ruizhiHiddenSystemSkillNames.has(String(e?.name??\`\`).trim().toLowerCase())}function ruizhiLocalizeSystemSkill(e){let t=ruizhiSystemSkillText[String(e?.name??"").trim().toLowerCase()];if(t==null||e?.scope!=="system")return e;let n=e.interface??{};return{...e,description:t.description,shortDescription:t.description,interface:{...n,displayName:t.displayName,shortDescription:t.description}}}`;
}

function patchSystemSkillDisplayBundle(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  let next = source;
  const basename = path.basename(filePath);
  if (!/^use-skills-.*\.js$/.test(basename)) {
    return false;
  }

  const target = "function Be(e){return e.skills}";
  if (next.includes(target) && !next.includes("function ruizhiLocalizeSystemSkill(")) {
    next = next.replace(target, `${systemSkillTranslationFunctionSource()}function Be(e){return e.skills.filter(e=>!ruizhiShouldHideSystemSkill(e)).map(ruizhiLocalizeSystemSkill)}`);
  }
  if (next.includes("function ruizhiLocalizeSystemSkill(e){") && !next.includes("function ruizhiShouldHideSystemSkill(")) {
    next = next.replace(
      "function ruizhiLocalizeSystemSkill(e){",
      `const ruizhiHiddenSystemSkillNames=new Set(${JSON.stringify(hiddenSystemSkillNames)});function ruizhiShouldHideSystemSkill(e){return e?.scope===\`system\`&&ruizhiHiddenSystemSkillNames.has(String(e?.name??\`\`).trim().toLowerCase())}function ruizhiLocalizeSystemSkill(e){`
    );
  }
  next = next.replace(
    "function Be(e){return e.skills.map(ruizhiLocalizeSystemSkill)}",
    "function Be(e){return e.skills.filter(e=>!ruizhiShouldHideSystemSkill(e)).map(ruizhiLocalizeSystemSkill)}"
  );
  next = next.replace(
    "function Be(e){return e.skills}",
    `${systemSkillTranslationFunctionSource()}function Be(e){return e.skills.filter(e=>!ruizhiShouldHideSystemSkill(e)).map(ruizhiLocalizeSystemSkill)}`
  );

  if (next !== source) {
    fs.writeFileSync(filePath, next, "utf8");
    return true;
  }
  return false;
}

function patchWindowsPluginMarketplaceLabels(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const candidates = walkFiles(assetsDir).filter((filePath) => filePath.endsWith(".js"));
  let changedFiles = 0;
  let builtByLabels = 0;
  let localPluginLabels = 0;
  let categoryFiles = 0;
  let productNameFiles = 0;
  let detailFiles = 0;
  let descriptionFiles = 0;
  let systemSkillFiles = 0;

  for (const filePath of candidates) {
    if (patchSystemSkillDisplayBundle(filePath)) {
      systemSkillFiles += 1;
      changedFiles += 1;
    }

    if (patchPluginDescriptionDisplayBundle(filePath)) {
      descriptionFiles += 1;
      changedFiles += 1;
    }

    if (patchPluginAvailabilityBundle(filePath)) {
      descriptionFiles += 1;
      changedFiles += 1;
    }

    if (patchPluginDetailPageBundle(filePath)) {
      detailFiles += 1;
      changedFiles += 1;
    }

    const source = fs.readFileSync(filePath, "utf8");
    let next = source;

    if (next.includes("Built by OpenAI")) {
      builtByLabels += (next.match(/Built by OpenAI/g) ?? []).length;
      next = next.replaceAll("Built by OpenAI", "OpenAI");
    }
    if (next.includes("built by openai")) {
      next = next.replaceAll("case`built by openai`:return 0;", "case`openai`:case`built by openai`:return 0;");
    }
    if (next.includes("Local Plugins")) {
      localPluginLabels += (next.match(/Local Plugins/g) ?? []).length;
      next = next.replaceAll("Local Plugins", "本地插件");
    }
    if (next.includes("Local plugins")) {
      localPluginLabels += (next.match(/Local plugins/g) ?? []).length;
      next = next.replaceAll("Local plugins", "本地插件");
    }
    if (/plugins-page-selectors-.*\.js$/.test(path.basename(filePath))) {
      const before = next;
      next = patchHardcodedOpenAIRecommendedPluginList(next);
      next = next.replaceAll("title:`Featured`", "title:`推荐`");
      next = next.replaceAll("title:e},plugins:t}))", "title:pluginCategoryLabel(e)},plugins:t}))");
      if (next !== before && !next.includes("function pluginCategoryLabel(")) {
        next = next.replace(
          "function H(e,t=[]){",
          "function pluginCategoryLabel(e){switch(String(e??``).trim().toLowerCase().replace(/[_-]+/g,` `)){case`featured`:return`推荐`;case`experimental`:return`实验性`;case`coding`:return`编码`;case`automation`:return`自动化`;case`engineering`:case`developer tools`:return`工程`;case`productivity`:return`效率`;case`research`:return`研究`;case`google`:return`谷歌`;case`microsoft`:return`微软`;case`communication`:case`communications`:return`沟通`;case`project management`:return`项目管理`;case`data`:case`data analytics`:case`data & analytics`:return`数据分析`;case`search`:return`搜索`;case`browser`:case`browsers`:return`浏览器`;case`design`:return`设计`;case`lifestyle`:return`生活方式`;case`finance`:return`财务`;case`sales`:return`销售`;case`marketing`:return`市场营销`;case`education`:return`教育`;case`writing`:return`写作`;case`other`:return`其他`;default:return e}}function H(e,t=[]){"
        );
      }
      if (next !== before) {
        categoryFiles += 1;
      }
    }

    if (next !== source) {
      fs.writeFileSync(filePath, next, "utf8");
      changedFiles += 1;
    }
  }

  log(`已补丁插件市场标签：OpenAI=${builtByLabels}，本地插件=${localPluginLabels}，分类=${categoryFiles}，描述=${descriptionFiles}，详情=${detailFiles}，系统技能=${systemSkillFiles}，产品名=${productNameFiles}，文件=${changedFiles}`);
}

function replaceInFile(filePath, pattern, replacement, label) {
  const source = fs.readFileSync(filePath, "utf8");
  if (!pattern.test(source)) {
    throw new Error(`覆盖层构建元数据补丁点不存在：${label}`);
  }
  fs.writeFileSync(filePath, source.replace(pattern, replacement), "utf8");
}

function preloadPageEnhanceIntegrationSnippet(config) {
  const enhanceConfig = pageEnhanceBootstrapConfig(config);
  return `
  /* ruizhi-page-enhance-preload:start */
  const pageEnhanceConfig=${jsonLiteral(enhanceConfig)};
  api.enhance={
    call:(route,payload)=>ipcRenderer.invoke("ruizhi:enhance:call",route,payload||{}),
    getSettings:()=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/get",{}),
    setSettings:patch=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/set",patch||{})
  };
  function injectRuizhiPageEnhance(){
    if(!pageEnhanceConfig.enabled||window.__RUIZHI_PAGE_ENHANCE_SCRIPT_INJECTED__)return;
    window.__RUIZHI_PAGE_ENHANCE_SCRIPT_INJECTED__=true;
    try{
      const fs=require("node:fs");
      const path=require("node:path");
      const resourcesRoot=process.resourcesPath||path.dirname(process.execPath);
      const scriptPath=path.join(resourcesRoot,...pageEnhanceConfig.rendererResourcePath);
      const source=fs.readFileSync(scriptPath,"utf8");
      const script=document.createElement("script");
      script.textContent="window.__RUIZHI_PAGE_ENHANCE_CONFIG__="+${jsonLiteral(JSON.stringify(enhanceConfig))}+";\\n"+source;
      (document.documentElement||document.head||document.body).appendChild(script);
      script.remove();
    }catch(error){
      console.error("ruizhi page enhance inject failed",error);
    }
  }
  onReady(injectRuizhiPageEnhance);
  /* ruizhi-page-enhance-preload:end */
`;
}

function ensurePreloadPageEnhanceIntegration(preloadPath, config, options = {}) {
  const log = options.log ?? (() => {});
  let source = fs.readFileSync(preloadPath, "utf8");
  let next = source.replace(/\/\* ruizhi-page-enhance-preload:start \*\/[\s\S]*?\/\* ruizhi-page-enhance-preload:end \*\/\r?\n?/g, "");
  if (next.includes("enhance:{") || next.includes("enhance={")) {
    return;
  }
  const exposeAnchor = '  try{contextBridge.exposeInMainWorld("ruizhiDesktop",api)}catch{}';
  if (!next.includes(exposeAnchor)) {
    throw new Error("preload 增强 bridge 注入点不存在");
  }
  next = next.replace(exposeAnchor, `${preloadPageEnhanceIntegrationSnippet(config)}${exposeAnchor}`);
  if (next !== source) {
    fs.writeFileSync(preloadPath, next, "utf8");
    log("已注入页面增强 preload bridge");
  }
}

export function patchVcRuntimeErrorPage(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const candidates = walkFiles(assetsDir).filter((filePath) => filePath.endsWith(".js"));
  const targetPath = candidates.find((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("function _j(e){") && source.includes("loadingPage.openConfigToml");
  });

  if (!targetPath) {
    throw new Error("未找到启动错误页补丁目标");
  }

  const originalStart = "function _j(e){let n=(0,Z.c)(27),{fatalError:r,onReset:i}=e,a=No(),{data:o}=gc(),s=o?.platform===`win32`,{errorMessage:c,cliErrorMessage:l}=r,u;";
  const patchedStart = "function _j(e){let n=(0,Z.c)(30),{fatalError:r,onReset:i}=e,a=No(),{data:o}=gc(),s=o?.platform===`win32`,{errorMessage:c,cliErrorMessage:l}=r,ruizhiVcErrorText=[c,l].filter(Boolean).join(`\\n`),ruizhiIsVcRuntimeMissing=s&&/(3221225781|0xC0000135|STATUS_DLL_NOT_FOUND|VCRUNTIME140|VCRUNTIME140_1|MSVCP140)/i.test(ruizhiVcErrorText);if(ruizhiIsVcRuntimeMissing)return (0,$.jsx)(`div`,{className:`flex size-full items-center justify-center p-6`,children:(0,$.jsxs)(`div`,{className:`flex w-full max-w-md flex-col gap-4`,children:[(0,$.jsx)(`h2`,{className:`text-2xl font-medium`,children:`缺少运行依赖`}),(0,$.jsx)(`p`,{className:`text-token-description-foreground`,children:`锐智需要安装 Microsoft Visual C++ 运行库才能启动。`}),(0,$.jsx)(`p`,{id:`ruizhi-vc-runtime-status`,className:`min-h-5 text-sm text-token-description-foreground`,children:`点击“安装并重启锐智”打开安装程序。安装完成后锐智会自动重启。`}),(0,$.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,$.jsx)(uc,{id:`ruizhi-vc-runtime-install-button`,onClick:ruizhiInstallVcRuntime,children:`安装并重启锐智`}),(0,$.jsx)(uc,{onClick:ruizhiOpenVcRedistManualDownload,color:`outline`,children:`手动下载`})]})]})});let u;";
  const originalHelpers = "function yj(){G.dispatchMessage(`open-in-browser`,{url:Up})}";
  const patchedHelpers = `${originalHelpers}function ruizhiSetVcRuntimeStatus(e){let t=document.getElementById(\`ruizhi-vc-runtime-status\`);t&&(t.textContent=e)}function ruizhiVcRuntimeFailureMessage(e,t){let n=e?.message||String(e||\`未知错误\`),r=t?.launchLogPath?\` 日志：\`+t.launchLogPath:\`\`;return\`安装失败：\`+n+\`。请点击“手动下载”安装后重启锐智。\`+r}async function ruizhiInstallVcRuntime(e){if(window.__ruizhiVcRuntimeInstallStarted)return;let t=e?.currentTarget||document.getElementById(\`ruizhi-vc-runtime-install-button\`),n=null;try{window.__ruizhiVcRuntimeInstallStarted=!0,t&&(t.disabled=!0,t.textContent=\`正在打开安装程序...\`),ruizhiSetVcRuntimeStatus(\`正在打开安装程序。如系统弹出权限确认，请选择“是”；如果没有看到弹窗，请检查任务栏。\`);n=await window.ruizhiDesktop?.runtime?.installVcRedist?.();if(n?.ok){ruizhiSetVcRuntimeStatus(\`安装完成，正在重启锐智。\`),t&&(t.textContent=\`正在重启...\`);return}throw new Error(n?.error||\`install failed\`)}catch(e){window.__ruizhiVcRuntimeInstallStarted=!1,console.error(\`ruizhi vc runtime install failed\`,e,n),ruizhiSetVcRuntimeStatus(ruizhiVcRuntimeFailureMessage(e,n)),t&&(t.disabled=!1,t.textContent=\`安装并重启锐智\`)}}function ruizhiOpenVcRedistManualDownload(){G.dispatchMessage(\`open-in-browser\`,{url:\`https://aka.ms/vc14/vc_redist.x64.exe\`})}`;

  let source = fs.readFileSync(targetPath, "utf8");
  if (source.includes("ruizhiInstallVcRuntime")) {
    log("已存在 VC++ 运行库错误页补丁");
    return { file: targetPath, changed: false };
  }
  if (!source.includes(originalStart)) {
    throw new Error("启动错误页结构已变化，无法注入 VC++ 运行库提示");
  }
  if (!source.includes(originalHelpers)) {
    throw new Error("启动错误页浏览器打开函数补丁点不存在");
  }

  source = source.replace(originalStart, patchedStart).replace(originalHelpers, patchedHelpers);
  fs.writeFileSync(targetPath, source, "utf8");
  log(`已补丁 VC++ 运行库错误页：${path.basename(targetPath)}`);
  return { file: targetPath, changed: true };
}

function ensureWindowsBootstrapEarlyRuizhiEnv(bootstrapPath, config, options = {}) {
  const log = options.log ?? (() => {});
  const productName = config.productName ?? "锐智";
  const runtimeConfig = config.runtime ?? {};
  const ruizhiHomeEnvName = runtimeConfig.homeEnv ?? "RUIZHI_HOME";
  const ruizhiDefaultHomeDirName = runtimeConfig.defaultHomeDirName ?? ".codex";
  const electronUserDataDirName = runtimeConfig.electronUserDataDirName ?? "Codex";
  const preludeStart = "/* ruizhi-early-env:start */";
  const preludeEnd = "/* ruizhi-early-env:end */";
  const prelude = `${preludeStart}
(()=>{try{
  const os=require("node:os");
  const path=require("node:path");
  const fs=require("node:fs");
  const home=os.homedir();
  const productName=${JSON.stringify(productName)};
  const ruizhiHomeEnvName=${JSON.stringify(ruizhiHomeEnvName)};
  const ruizhiDefaultHomeDirName=${JSON.stringify(ruizhiDefaultHomeDirName)};
  const electronUserDataDirName=${JSON.stringify(electronUserDataDirName)};
  const codexHome=(process.env[ruizhiHomeEnvName]||process.env.CODEX_HOME||path.join(home,ruizhiDefaultHomeDirName)).trim();
  const appData=process.env.APPDATA||path.join(home,"AppData","Roaming");
  const userData=(process.env.CODEX_ELECTRON_USER_DATA_PATH||path.join(appData,electronUserDataDirName)).trim();
  process.env[ruizhiHomeEnvName]=codexHome;
  process.env.CODEX_HOME=codexHome;
  process.env.CODEX_ELECTRON_USER_DATA_PATH=userData;
  fs.mkdirSync(codexHome,{recursive:true});
  fs.mkdirSync(userData,{recursive:true});
}catch(e){console.error("ruizhi early env init failed",e)}})();
${preludeEnd}
`;
  const source = fs.readFileSync(bootstrapPath, "utf8");
  const markerPattern = /\/\* ruizhi-early-env:start \*\/[\s\S]*?\/\* ruizhi-early-env:end \*\/\r?\n?/g;
  const withoutExistingPrelude = source.replace(markerPattern, "");
  if (withoutExistingPrelude.startsWith(prelude)) {
    return;
  }

  fs.writeFileSync(bootstrapPath, `${prelude}${withoutExistingPrelude}`, "utf8");
  log("已注入 Windows bootstrap 早期锐智环境初始化");
}

function bridgeBootstrapBlock() {
  return `/* ruizhi-model-bridge:start */
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
      if(!fs.existsSync(scriptPath))throw new Error("模型协议 bridge 脚本不存在："+scriptPath);
      const bridge=require(scriptPath).startRuizhiResponsesBridge({
        host:modelBridgeConfig.host,
        port:modelBridgeConfig.port,
        upstreamBaseUrl:openaiBaseUrl,
        authHome:codexHome,
        catalogPath:path.join(resourcesRoot,"models",modelCatalogFile),
        routes:modelBridgeConfig.routes
      });
      return bridge?.baseUrl||modelProviderBaseUrl;
    }
    const runtimeModelProviderBaseUrl=startModelBridge()||modelProviderBaseUrl;
    function rewriteRuntimeModelProviderBaseUrl(text){
      if(runtimeModelProviderBaseUrl===modelProviderBaseUrl)return text;
      return String(text).split(JSON.stringify(modelProviderBaseUrl)).join(JSON.stringify(runtimeModelProviderBaseUrl));
    }
    process.env.RUIZHI_OPENAI_BASE_URL=openaiBaseUrl;
    process.env.RUIZHI_MODEL_PROVIDER_BASE_URL=runtimeModelProviderBaseUrl;
/* ruizhi-model-bridge:end */
`;
}

function pageEnhanceBootstrapBlock(config) {
  const enhanceConfig = pageEnhanceBootstrapConfig(config);
  return `/* ruizhi-page-enhance:start */
    const pageEnhanceConfig=${jsonLiteral(enhanceConfig)};
    function registerRuizhiEnhanceIpc(){
      if(global.__RUIZHI_ENHANCE_IPC_REGISTERED__)return;
      global.__RUIZHI_ENHANCE_IPC_REGISTERED__=true;
      try{
        const servicePath=path.join(resourcesRoot,...pageEnhanceConfig.serviceResourcePath);
        if(!fs.existsSync(servicePath))throw new Error("页面增强服务脚本不存在："+servicePath);
        const service=require(servicePath).createRuizhiEnhanceService({
          codexHome,
          resourcesRoot,
          config:{pageEnhance:pageEnhanceConfig}
        });
        n.ipcMain.handle("ruizhi:enhance:call",async(_event,route,payload)=>service.call(route,payload||{}));
      }catch(error){
        console.error("ruizhi enhance ipc register failed",error);
        n.ipcMain.handle("ruizhi:enhance:call",async(_event,route,payload)=>({
          status:"failed",
          session_id:String(payload?.session_id||""),
          message:String(error?.message||error)
        }));
      }
    }
    registerRuizhiEnhanceIpc();
/* ruizhi-page-enhance:end */
`;
}

function windowsSandboxConfigBootstrapBlock() {
  return [
    "/* ruizhi-windows-sandbox-config:start */",
    "    function readWindowsSandboxModeFromConfig(text){",
    "      let inWindowsSection=false;",
    "      for(const rawLine of String(text??\"\").split(/\\r?\\n/)){",
    "        const line=rawLine.trim();",
    "        if(!line||line.startsWith(\"#\"))continue;",
    "        const section=line.match(/^\\[([^\\]]+)\\]\\s*(?:#.*)?$/);",
    "        if(section){",
    "          inWindowsSection=section[1].trim()===\"windows\";",
    "          continue;",
    "        }",
    "        if(!inWindowsSection)continue;",
    "        const match=line.match(/^sandbox\\s*=\\s*[\"']?([^\"'\\s#]+)[\"']?\\s*(?:#.*)?$/);",
    "        if(match&&(match[1]===\"elevated\"||match[1]===\"unelevated\"))return match[1];",
    "      }",
    "      return null;",
    "    }",
    "    function hasWindowsSandboxSetup(root){",
    "      return process.platform===\"win32\"&&fs.existsSync(path.join(root,\".sandbox\",\"setup_marker.json\"))&&fs.existsSync(path.join(root,\".sandbox-secrets\",\"sandbox_users.json\"));",
    "    }",
    "    function ensureWindowsSandboxMode(text,mode){",
    "      if(process.platform!==\"win32\"||!mode||readWindowsSandboxModeFromConfig(text)!=null)return text;",
    "      const nextLines=withFinalNewline(text).split(/\\r?\\n/);",
    "      let windowsSectionIndex=-1;",
    "      for(let index=0;index<nextLines.length;index+=1){",
    "        const section=nextLines[index].trim().match(/^\\[([^\\]]+)\\]\\s*(?:#.*)?$/);",
    "        if(section&&section[1].trim()===\"windows\"){",
    "          windowsSectionIndex=index;",
    "          break;",
    "        }",
    "      }",
    "      if(windowsSectionIndex>=0){",
    "        nextLines.splice(windowsSectionIndex+1,0,\"sandbox = \"+JSON.stringify(mode));",
    "        return withFinalNewline(nextLines.join(\"\\n\").trimEnd());",
    "      }",
    "      return withFinalNewline([text.trimEnd(),\"\",\"[windows]\",\"sandbox = \"+JSON.stringify(mode)].filter(Boolean).join(\"\\n\"));",
    "    }",
    "    function readConfigIfExists(root){",
    "      const target=path.join(root,\"config.toml\");",
    "      return fs.existsSync(target)?fs.readFileSync(target,\"utf8\"):\"\";",
    "    }",
    "    function inferWindowsSandboxMode(primaryText){",
    "      const fallbackCodexHome=path.join(home,\".codex\");",
    "      return readWindowsSandboxModeFromConfig(primaryText)||readWindowsSandboxModeFromConfig(readConfigIfExists(fallbackCodexHome))||\"elevated\";",
    "    }",
    "    function syncWindowsSandboxConfig(root,preferredMode){",
    "      if(!hasWindowsSandboxSetup(root))return;",
    "      const target=path.join(root,\"config.toml\");",
    "      const existing=readConfigIfExists(root);",
    "      const mode=readWindowsSandboxModeFromConfig(existing)||preferredMode||\"elevated\";",
    "      const next=ensureWindowsSandboxMode(existing,mode);",
    "      if(next!==existing){",
    "        fs.mkdirSync(path.dirname(target),{recursive:true});",
    "        fs.writeFileSync(target,next,\"utf8\");",
    "      }",
    "    }",
    "    function syncFallbackWindowsSandboxConfig(preferredMode){",
    "      if(process.platform!==\"win32\")return;",
    "      const roots=[codexHome,path.join(home,\".codex\")];",
    "      const seen=new Set();",
    "      for(const root of roots){",
    "        const resolved=path.resolve(root);",
    "        if(seen.has(resolved))continue;",
    "        seen.add(resolved);",
    "        syncWindowsSandboxConfig(root,preferredMode);",
    "      }",
    "    }",
    "/* ruizhi-windows-sandbox-config:end */"
  ].join("\n") + "\n";
}

function ensureWindowsBootstrapRuntimeConfig(bootstrapPath, config, options = {}) {
  const log = options.log ?? (() => {});
  const openaiBaseUrl = config.openai?.baseUrl ?? "https://uniapi.ruijie.com.cn/v1";
  const providerBaseUrl = modelProviderBaseUrl(config);
  const bridgeConfig = modelBridgeBootstrapConfig(config);
  const configTemplateLines = managedConfigTomlLinesForBootstrap(config);
  const modelCatalogEnabledValue = modelCatalogEnabled(config);
  let source = fs.readFileSync(bootstrapPath, "utf8");
  let next = source;

  const constantsPattern = /const openaiBaseUrl="[^"]*";(?:\s*const modelProviderBaseUrl=[^;]+;)?(?:\s*const modelBridgeConfig=\{[\s\S]*?\};)?(?:\s*const pageEnhanceConfig=\{[\s\S]*?\};)?/;
  if (!constantsPattern.test(next)) {
    throw new Error("Windows bootstrap openaiBaseUrl 补丁点不存在");
  }
  next = next.replace(
    constantsPattern,
    [
      `const openaiBaseUrl=${jsonLiteral(openaiBaseUrl)};`,
      `const modelProviderBaseUrl=${jsonLiteral(providerBaseUrl)};`,
      `const modelBridgeConfig=${jsonLiteral(bridgeConfig)};`
    ].join("\n    ")
  );

  const modelCatalogEnabledPattern = /const modelCatalogEnabled=(?:true|false);/;
  if (modelCatalogEnabledPattern.test(next)) {
    next = next.replace(
      modelCatalogEnabledPattern,
      `const modelCatalogEnabled=${jsonLiteral(modelCatalogEnabledValue)};`
    );
  } else {
    const modelCatalogFileDeclaration = 'const modelCatalogFile="ruizhi-model-catalog.json";';
    if (next.includes(modelCatalogFileDeclaration)) {
      next = next.replace(
        modelCatalogFileDeclaration,
        `const modelCatalogEnabled=${jsonLiteral(modelCatalogEnabledValue)};\n    ${modelCatalogFileDeclaration}`
      );
    }
  }

  const bridgeMarkerPattern = /\/\* ruizhi-model-bridge:start \*\/[\s\S]*?\/\* ruizhi-model-bridge:end \*\/\r?\n?/g;
  next = next.replace(bridgeMarkerPattern, "");
  const pageEnhanceMarkerPattern = /\/\* ruizhi-page-enhance:start \*\/[\s\S]*?\/\* ruizhi-page-enhance:end \*\/\r?\n?/g;
  next = next.replace(pageEnhanceMarkerPattern, "");
  const oldEnvAnchor = "process.env.RUIZHI_OPENAI_BASE_URL=openaiBaseUrl;\n    process.env.RUIZHI_IMAGEGEN_EXE=";
  const imageEnvAnchor = "    process.env.RUIZHI_IMAGEGEN_EXE=";
  if (next.includes(oldEnvAnchor)) {
    next = next.replace(oldEnvAnchor, `${bridgeBootstrapBlock()}${pageEnhanceBootstrapBlock(config)}    process.env.RUIZHI_IMAGEGEN_EXE=`);
  } else if (next.includes(imageEnvAnchor)) {
    next = next.replace(imageEnvAnchor, `${bridgeBootstrapBlock()}${pageEnhanceBootstrapBlock(config)}${imageEnvAnchor}`);
  } else {
    throw new Error("Windows bootstrap RUIZHI_IMAGEGEN_EXE 补丁点不存在");
  }

  const configTemplatePattern = /const configTemplateLines=\[[\s\S]*?\];\n    const marketplaceSources=/;
  if (!configTemplatePattern.test(next)) {
    throw new Error("Windows bootstrap configTemplateLines 补丁点不存在");
  }
  next = next.replace(
    configTemplatePattern,
    `const configTemplateLines=${jsonLiteral(configTemplateLines)};\n    const marketplaceSources=`
  );

  const sandboxConfigMarkerPattern = /\/\* ruizhi-windows-sandbox-config:start \*\/[\s\S]*?\/\* ruizhi-windows-sandbox-config:end \*\/\r?\n?/g;
  next = next.replace(sandboxConfigMarkerPattern, "");
  const configPathAnchor = "    const configPath=path.join(codexHome,\"config.toml\");";
  if (!next.includes(configPathAnchor)) {
    throw new Error("Windows bootstrap configPath 补丁点不存在");
  }
  next = next.replace(configPathAnchor, `${windowsSandboxConfigBootstrapBlock()}${configPathAnchor}`);

  const oldConfigWrite = [
    "    const configPath=path.join(codexHome,\"config.toml\");",
    "    const existing=fs.existsSync(configPath)?fs.readFileSync(configPath,\"utf8\"):\"\";",
    "    const next=mergeManagedConfig(existing);",
    "    if(next!==existing)fs.writeFileSync(configPath,next,\"utf8\");"
  ].join("\n");
  const newConfigWrite = [
    "    const configPath=path.join(codexHome,\"config.toml\");",
    "    const existing=fs.existsSync(configPath)?fs.readFileSync(configPath,\"utf8\"):\"\";",
    "    let next=mergeManagedConfig(existing);",
    "    next=rewriteRuntimeModelProviderBaseUrl(next);",
    "    const sandboxMode=hasWindowsSandboxSetup(codexHome)?inferWindowsSandboxMode(next):readWindowsSandboxModeFromConfig(next);",
    "    if(hasWindowsSandboxSetup(codexHome))next=ensureWindowsSandboxMode(next,sandboxMode);",
    "    if(next!==existing)fs.writeFileSync(configPath,next,\"utf8\");",
    "    syncFallbackWindowsSandboxConfig(readWindowsSandboxModeFromConfig(next));"
  ].join("\n");
  if (next.includes(oldConfigWrite)) {
    next = next.replace(oldConfigWrite, newConfigWrite);
  } else if (!next.includes("syncFallbackWindowsSandboxConfig(readWindowsSandboxModeFromConfig(next));")) {
    throw new Error("Windows bootstrap config.toml 写入补丁点不存在");
  }

  if (next !== source) {
    fs.writeFileSync(bootstrapPath, next, "utf8");
    log("已刷新 Windows bootstrap 模型 provider、bridge 与沙盒配置自愈逻辑");
  }
}

function patchWindowsTrayMenuLabels(extractedAppDir, config, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const candidates = walkFiles(buildDir).filter((filePath) => {
    if (!filePath.endsWith(".js")) {
      return false;
    }
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("trayMenu.openApp") && source.includes("getNativeTrayMenuItems()");
  });

  if (candidates.length !== 1) {
    throw new Error(`托盘菜单 bundle 匹配数量异常：${candidates.length}`);
  }

  const mainBundlePath = candidates[0];
  let source = fs.readFileSync(mainBundlePath, "utf8");
  const replacements = [
    ["Ro=`Open {appName}`", "Ro=`打开 {appName}`"],
    ["Bo=`New Chat`", "Bo=`新聊天`"],
    ["Ho=`Pinned`", "Ho=`置顶`"],
    ["Wo=`Running`", "Wo=`运行中`"],
    ["Ko=`Recent`", "Ko=`最近`"],
    ["Jo=`Unread`", "Jo=`未读`"],
    ["Xo=`Completed`", "Xo=`已完成`"],
    ["Qo=`Usage`", "Qo=`用量`"],
    ["es=`More`", "es=`更多`"],
    ["ns=`Chats`", "ns=`聊天`"]
  ];

  for (const [from, to] of replacements) {
    if (!source.includes(from)) {
      throw new Error(`托盘菜单文案补丁点不存在：${from}`);
    }
    source = source.replace(from, to);
  }

  const quitPattern = /function ([A-Za-z_$][\w$]*)\(e\)\{let t=n\.Menu\.buildFromTemplate\(\[\{role:`quit`\}\]\);return\(Array\.isArray\(t\)\?t:t\.items\)\[0\]\?\.label\?\?`Quit \$\{e\}`\}/;
  if (!quitPattern.test(source)) {
    throw new Error("托盘菜单退出文案补丁点不存在");
  }
  source = source.replace(quitPattern, (_match, functionName) => `function ${functionName}(e){return\`退出 \${e}\`}`);

  source = source.replace(
    /return`Resume Chronicle`/g,
    "return`恢复 Chronicle`"
  ).replace(
    /return`Pause Chronicle`/g,
    "return`暂停 Chronicle`"
  ).replace(
    /return`Starting Chronicle\.\.\.`/g,
    "return`正在启动 Chronicle...`"
  ).replace(
    /return`Stopping Chronicle\.\.\.`/g,
    "return`正在停止 Chronicle...`"
  );

  if (!source.includes("function ruizhiTranslateApplicationMenu(")) {
    const insertionPoint = "let Xe=[],Ze=[";
    if (!source.includes(insertionPoint)) {
      throw new Error("顶部菜单中文补丁点不存在：菜单模板入口");
    }
    const translatorCode = `function ruizhiTranslateApplicationMenu(e){const t=new Map(Object.entries({"File":"文件","Edit":"编辑","View":"视图","Window":"窗口","Help":"帮助","New Thread":"新聊天","New Chat":"新聊天","Quick Chat":"快速对话","New Window":"新窗口","New Tab":"新标签页","New File":"新建文件","Open Folder":"打开文件夹","Open Project":"打开项目","Open Recent":"打开最近项目","Add Folder":"添加文件夹","Close Window":"关闭窗口","Close Tab":"关闭标签页","Close All Tabs":"关闭所有标签页","Settings":"设置","Preferences":"偏好设置","Log Out":"退出登录","Check for Updates":"检查更新","Check for Updates…":"检查更新…","Install Update":"安装更新","Reload Window":"重新加载窗口","Reload":"重新加载","Hard Reload":"强制重新加载","Force Reload":"强制重新加载","Toggle Sidebar":"切换侧边栏","Toggle Terminal":"切换终端","Terminal":"终端","Toggle File Tree":"切换文件树","Toggle Diff Panel":"切换差异面板","Toggle Browser Panel":"切换浏览器面板","Open Browser Tab":"打开浏览器标签页","Find":"查找","Find in Thread":"在对话中查找","Previous Chat":"上一个对话","Next Chat":"下一个对话","Previous Thread":"上一个对话","Next Thread":"下一个对话","Navigate Back":"后退","Navigate Forward":"前进","Back":"后退","Forward":"前进","Open in External Browser":"在外部浏览器中打开","Zoom In":"放大","Zoom Out":"缩小","Actual Size":"实际大小","Reset Zoom":"重置缩放","Toggle Full Screen":"切换全屏","Enter Full Screen":"进入全屏","Exit Full Screen":"退出全屏","Toggle Menu Bar":"切换菜单栏","Toggle Developer Tools":"切换开发者工具","Toggle DevTools":"切换开发者工具","Developer Tools":"开发者工具","Toggle Debug Menu":"切换调试菜单","Open Deeplink from Clipboard":"从剪贴板打开深链接","Toggle Query Devtools":"切换 Query Devtools","Toggle React Scan":"切换 React Scan","Start Performance Trace":"开始性能跟踪","Start Trace Recording":"开始跟踪记录","Stop Performance Trace":"停止性能跟踪","Stop Trace Recording":"停止跟踪记录","Undo":"撤销","Redo":"重做","Cut":"剪切","Copy":"复制","Paste":"粘贴","Paste and Match Style":"粘贴并匹配样式","Delete":"删除","Select All":"全选","Save":"保存","Save As":"另存为","Save As…":"另存为…","Save Image":"保存图片","Save Link As":"链接另存为","Save Link As…":"链接另存为…","Save Video":"保存视频","Save Video As":"视频另存为","Save Video As…":"视频另存为…","Print":"打印","Page Setup":"页面设置","Speech":"语音","Start Speaking":"开始朗读","Stop Speaking":"停止朗读","Writing Tools":"写作工具","Emoji & Symbols":"表情与符号","Services":"服务","Hide":"隐藏","Hide Others":"隐藏其他","Show All":"全部显示","Minimize":"最小化","Zoom":"缩放","Bring All to Front":"全部置于前台","Close":"关闭","Exit":"退出","Quit":"退出","Inspect":"检查","Comment":"评论","File Explorer":"文件资源管理器","Finder":"访达","Codex Documentation":"帮助首页","What's new":"更新内容","Automations":"自动化","Local Environments":"本地环境","Worktrees":"工作树","Skills":"技能","Model Context Protocol":"MCP","Troubleshooting":"故障排查","Send Feedback":"发送反馈","Keyboard Shortcuts":"键盘快捷键"}));function r(e){let r=String(e||"").replace(/&/g,"").replace(/\\.\\.\\.$/,"…").trim();if(t.has(r))return t.get(r);let n=r.replace(/…$/,"").trim();if(t.has(n))return t.get(n);if(r.startsWith("About "))return r.replace(/^About /,"关于 ");if(r.startsWith("Hide "))return r.replace(/^Hide /,"隐藏 ");if(r.startsWith("Quit "))return r.replace(/^Quit /,"退出 ");return e}function i(e){if(!e)return;if(typeof e.label==="string"&&e.label.length>0)e.label=r(e.label);let t=e.submenu?.items;if(Array.isArray(t))for(const e of t)i(e)}if(Array.isArray(e?.items))for(const t of e.items)i(t);return e}`;
    source = source.replace(insertionPoint, `${translatorCode}${insertionPoint}`);
  }
  source = source.replace(`"Codex Documentation":"官方文档"`, `"Codex Documentation":"帮助首页"`);
  source = source.replace(`"Codex Documentation":"使用文档"`, `"Codex Documentation":"帮助首页"`);

  const menuSetPattern = /\}\}n\.Menu\.setApplicationMenu\(([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\)\}/;
  if (!menuSetPattern.test(source)) {
    throw new Error("顶部菜单中文补丁点不存在：setApplicationMenu");
  }
  source = source.replace(menuSetPattern, "}}try{ruizhiTranslateApplicationMenu($1)}catch(e){console.error(`锐智菜单翻译失败`,e)}n.Menu.setApplicationMenu($1),$2($3)}");

  fs.writeFileSync(mainBundlePath, source, "utf8");
  log(`已补丁 Windows 托盘和顶部菜单中文文案：${path.basename(mainBundlePath)}`);
}

function configuredWebsiteUrl(config, key, label) {
  const configured = String(config.website?.[key] ?? "").trim();
  if (!configured) {
    throw new Error(`缺少 website.${key} 配置，无法补丁${label}链接`);
  }
  return configured;
}

function homeUrl(config) {
  return configuredWebsiteUrl(config, "homeUrl", "帮助首页");
}

function docsUrl(config, hash = "") {
  const configured = configuredWebsiteUrl(config, "docsUrl", "帮助文档");
  return hash ? `${configured.split("#")[0]}#${hash}` : configured;
}

export function patchWindowsHelpDocumentationLinks(extractedAppDir, config, options = {}) {
  const log = options.log ?? (() => {});
  const helpHomeUrl = homeUrl(config);
  const helpHomePattern = /\{label:`Codex Documentation`,click:\(\)=>\{([A-Za-z_$][\w$]*)\.shell\.openExternal\(`https:\/\/developers\.openai\.com\/codex\/app`\)\}\}/g;
  const replacements = [
    ["https://developers.openai.com/codex/app/worktrees#option-1-working-on-the-worktree", docsUrl(config, "workspace")],
    ["https://developers.openai.com/codex/app/local-environments", docsUrl(config, "terminal")],
    ["https://developers.openai.com/codex/app/troubleshooting", docsUrl(config, "faq")],
    ["https://developers.openai.com/codex/app/automations", docsUrl(config, "automation")],
    ["https://developers.openai.com/codex/app/worktrees", docsUrl(config, "workspace")],
    ["https://developers.openai.com/codex/changelog", docsUrl(config, "install")],
    ["https://developers.openai.com/codex/skills", docsUrl(config, "skills")],
    ["https://developers.openai.com/codex/mcp", docsUrl(config, "skills")],
    ["https://developers.openai.com/codex/agent-approvals-security#automatic-approval-reviews", docsUrl(config, "best-practices")],
    ["https://developers.openai.com/codex/memories/chronicle", docsUrl(config, "rules")],
    ["https://developers.openai.com/codex/memories", docsUrl(config, "rules")],
    ["https://developers.openai.com/codex/pricing", docsUrl(config, "intro")],
    ["https://developers.openai.com/codex/app", docsUrl(config)]
  ];

  let changedFiles = 0;
  let replacementCount = 0;
  let alreadyPatchedCount = 0;
  const files = walkFiles(extractedAppDir).filter((filePath) => /\.(js|html|json)$/i.test(filePath));
  for (const filePath of files) {
    let source = fs.readFileSync(filePath, "utf8");
    let next = source;
    for (const [, to] of replacements) {
      alreadyPatchedCount += source.includes(to) ? 1 : 0;
    }
    alreadyPatchedCount += source.includes(helpHomeUrl) ? 1 : 0;
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
    if (alreadyPatchedCount > 0) {
      log(`帮助文档链接已是锐智目标地址：${alreadyPatchedCount} 处`);
      return;
    }
    throw new Error("未找到 Codex 帮助文档链接补丁点");
  }

  log(`已补丁帮助文档链接：${changedFiles} 个文件，${replacementCount} 处`);
}

export function refreshWindowsAsarBuildMetadata(extractedAppDir, config, appVersion, options = {}) {
  const log = options.log ?? (() => {});
  const packageJsonPath = path.join(extractedAppDir, "package.json");
  const preloadPath = path.join(extractedAppDir, ".vite", "build", "preload.js");
  const bootstrapPath = path.join(extractedAppDir, ".vite", "build", "bootstrap.js");

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.productName = windowsTaskManagerName(config);
    packageJson.version = appVersion;
    packageJson.description = `${config.productName}桌面端`;
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  }

  if (fs.existsSync(preloadPath)) {
    replaceInFile(
      preloadPath,
      /const appVersion="[^"]*";/,
      `const appVersion=${JSON.stringify(appVersion)};`,
      "preload appVersion"
    );
    ensurePreloadPageEnhanceIntegration(preloadPath, config, { log });
  }

  if (fs.existsSync(bootstrapPath)) {
    ensureWindowsBootstrapEarlyRuizhiEnv(bootstrapPath, config, { log });
    ensureWindowsBootstrapRuntimeConfig(bootstrapPath, config, { log });
    replaceInFile(
      bootstrapPath,
      /"currentVersion":"[^"]*"/,
      `"currentVersion":${JSON.stringify(appVersion)}`,
      "bootstrap currentVersion"
    );
    replaceInFile(
      bootstrapPath,
      /n\.app\.setName\("[^"]*"\)/,
      `n.app.setName(${JSON.stringify(windowsTaskManagerName(config))})`,
      "bootstrap app name"
    );
  }

  patchWindowsTrayMenuLabels(extractedAppDir, config, { log });
  patchVcRuntimeErrorPage(extractedAppDir, { log });
  patchWindowsHelpDocumentationLinks(extractedAppDir, config, { log });
  if (enableWindowsPluginTextPatches) {
    patchWindowsPluginMarketplaceLabels(extractedAppDir, { log });
  } else {
    log("已跳过插件市场文案补丁");
  }
  log(`已刷新 Windows asar 构建元数据：${appVersion}`);
}

function nodeModuleTargetDir(targetNodeModules, packageName) {
  return path.join(targetNodeModules, ...packageName.split("/"));
}

export function copyRuntimeNodePackage(packageName, targetNodeModules, seen = new Set(), fromDir = projectRoot) {
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

export function copyUpdaterRuntimeDependenciesTo(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const targetNodeModules = path.join(extractedAppDir, "node_modules");
  fs.mkdirSync(targetNodeModules, { recursive: true });
  copyRuntimeNodePackage("electron-updater", targetNodeModules);
  log("已内置 electron-updater 运行时依赖");
}

export function exportOverridesFromDirs(baselineDir, patchedDir, overridesRoot = windowsAsarOverridesRoot) {
  cleanDir(overridesRoot);

  const baselineFiles = new Map(
    walkFiles(baselineDir).map((filePath) => [asarRelativePath(baselineDir, filePath), filePath])
  );
  const patchedFiles = walkFiles(patchedDir);

  let changedFiles = 0;
  let skippedFiles = 0;
  let totalBytes = 0;

  for (const patchedPath of patchedFiles) {
    const relativePath = asarRelativePath(patchedDir, patchedPath);
    if (shouldSkipOverlayExport(relativePath)) {
      skippedFiles += 1;
      continue;
    }

    const baselinePath = baselineFiles.get(relativePath);
    if (baselinePath && sha256File(baselinePath) === sha256File(patchedPath)) {
      continue;
    }

    const targetPath = path.join(overridesRoot, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(patchedPath, targetPath);
    changedFiles += 1;
    totalBytes += fs.statSync(patchedPath).size;
  }

  return { changedFiles, skippedFiles, totalBytes, overridesRoot };
}
