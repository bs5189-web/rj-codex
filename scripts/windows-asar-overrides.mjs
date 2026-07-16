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
  { name: "browser", path: "./plugins/browser", category: "Engineering" },
  { name: "chrome", path: "./plugins/chrome", category: "Productivity" },
  { name: "latex", path: "./plugins/latex", category: "Research" }
];
const browserRuntimePluginNames = ["browser", "chrome"];
const openAIRecommendedPluginIds = [
  "computer-use",
  "browser",
  "chrome",
  "chrome-internal",
  "latex",
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
const qwenDesktopPluginControlGuidance = `

## Codex Desktop Plugin Control
- When the user invokes \`[@浏览器]\` or \`plugin://browser@openai-bundled\`, use the Browser plugin's trusted runtime through the \`mcp__node_repl__js\` tool and select the \`iab\` browser. Do not use \`exec_command\`, \`node -e\`, standalone Playwright, or a system browser for this plugin.
- Browser plugin native-pipe authorization depends on Codex turn metadata in \`nodeRepl.requestMeta\`; a separate shell process cannot provide the required \`session_id\` / \`turn_id\` and will fail as not trusted.`;

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
  return config.windows?.taskManagerName ?? config.productName ?? "锐捷";
}

function brandingEnabled(config) {
  return config.branding?.enabled !== false;
}

function ruizhiBuildDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ruizhiShortBuildDate() {
  return ruizhiBuildDate().replaceAll("-", "").slice(2);
}

function ruizhiBuildVersionLabel(appVersion) {
  return `${appVersion}-${ruizhiShortBuildDate()}`;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function patchNativeUsageSettingsVisibilitySource(source) {
  if (source.includes("ruizhiUsageSettingsAlwaysVisible")) {
    return source;
  }
  const usageVisibilityPattern = /(function [A-Za-z_$][\w$]*\(\{authMethod:[A-Za-z_$][\w$]*,plan:[\s\S]{0,1400}?return\{canManageCreditSettings:[A-Za-z_$][\w$]*,isUsageSettingsVisible:)([^}]+)(\}\}function )/;
  const patched = source.replace(
    usageVisibilityPattern,
    "$1!0/*ruizhiUsageSettingsAlwaysVisible*/$3"
  );
  if (!patched.includes("ruizhiUsageSettingsAlwaysVisible")) {
    throw new Error("Codex 使用情况设置入口补丁点不存在");
  }
  return patched;
}

export function patchNativePluginAuthCompatibilitySource(source) {
  if (source.includes("ruizhiPluginAuthCompatibility")) {
    return source;
  }
  const supportedGatePattern = /function ([A-Za-z_$][\w$]*)\(e\)\{return e!==`chatgpt`&&e!==`apikey`&&e!==`amazonBedrock`\}/;
  if (supportedGatePattern.test(source)) {
    return source;
  }
  const legacyGatePattern = /function ([A-Za-z_$][\w$]*)\(e\)\{return e!==`chatgpt`\}/;
  const patched = source.replace(
    legacyGatePattern,
    "function $1(e){return e!==`chatgpt`&&e!==`apikey`&&e!==`amazonBedrock`/*ruizhiPluginAuthCompatibility*/}"
  );
  if (!patched.includes("ruizhiPluginAuthCompatibility")) {
    throw new Error("Codex 插件账号兼容补丁点不存在");
  }
  return patched;
}

function pageEnhanceRendererInstallerSource() {
  return fs.readFileSync(pageEnhanceRendererSourcePath, "utf8");
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
    menu: false,
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

function pageEnhanceBootstrapConfig(config, appVersion = config.version) {
  const appDisplayVersion = brandingEnabled(config) ? ruizhiBuildVersionLabel(appVersion) : appVersion;
  return {
    enabled: pageEnhanceEnabled(config),
    features: pageEnhanceFeatures(config),
    appVersion,
    appDisplayVersion,
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

function patchNativeWebviewFeatureGates(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const statsigGateSourcePattern = /function Ue\(e\)\{return ([A-Za-z_$][\w$]*)\(\),([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*),e\)\}/;
  const candidates = walkFiles(assetsDir).filter((filePath) => /^statsig-.*\.js$/.test(path.basename(filePath)) && statsigGateSourcePattern.test(fs.readFileSync(filePath, "utf8")));
  if (candidates.length === 0) {
    log("已跳过 Codex 原生 webview gate 补丁（statsig 模块结构已变化，注入点不存在）");
    return;
  }
  if (candidates.length !== 1) {
    throw new Error(`Statsig webview gate bundle 匹配数量异常：${candidates.length}`);
  }
  const statsigFile = candidates[0];
  const original = fs.readFileSync(statsigFile, "utf8");
  if (original.includes("ruizhiNativeFeatureGateValue")) {
    log("已存在 Codex 原生 webview gate 补丁");
    return;
  }
  const nativeGateCode = "const ruizhiNativeFeatureGates=new Set([`3075919032`,`4166894088`,`410262010`,`3903563814`,`410065390`,`824038554`]);function ruizhiNativeFeatureGateValue(e){return ruizhiNativeFeatureGates.has(String(e))}";
  const targetGateMatch = original.match(statsigGateSourcePattern);
  if (!targetGateMatch) {
    throw new Error("Codex 原生 webview gate 补丁点不存在");
  }
  const initHook = targetGateMatch[1];
  const gateHook = targetGateMatch[2];
  const gateStore = targetGateMatch[3];
  const next = original.replace(statsigGateSourcePattern, `${nativeGateCode}function Ue(e){return ${initHook}(),ruizhiNativeFeatureGateValue(e)||${gateHook}(${gateStore},e)}`);
  fs.writeFileSync(statsigFile, next, "utf8");
  log(`已打开 Codex 原生 webview gate：${path.basename(statsigFile)}`);
}
function patchListModelsForHostFromUserCache(extractedAppDir, config, options = {}) {
  const log = options.log ?? (() => {});
  if (!modelCatalogEnabled(config)) {
    log("跳过模型缓存列表补丁：自定义模型目录已关闭");
    return;
  }

  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const modelListQueryFnPattern = /queryFn:\(\)=>([A-Za-z_$][\w$]*)\(`list-models-for-host`,\{hostId:([A-Za-z_$][\w$]*),includeHidden:!0,cursor:null,limit:([A-Za-z_$][\w$]*)\}\)/;
  const candidates = walkFiles(assetsDir).filter((filePath) => filePath.endsWith(".js") && modelListQueryFnPattern.test(fs.readFileSync(filePath, "utf8")));
  if (candidates.length !== 1) {
    throw new Error(`model queries bundle 匹配数量异常：${candidates.length}`);
  }

  const modelQueriesFile = candidates[0];
  const source = fs.readFileSync(modelQueriesFile, "utf8");
  const normalizeModelListResult = `ruizhiNormalizeModel=ruizhiModel=>{let ruizhiLevels=Array.isArray(ruizhiModel?.supported_reasoning_levels)?ruizhiModel.supported_reasoning_levels:[],ruizhiEfforts=Array.isArray(ruizhiModel?.supportedReasoningEfforts)?ruizhiModel.supportedReasoningEfforts:[];if(ruizhiLevels.length===0)ruizhiLevels=ruizhiEfforts.map(ruizhiEntry=>({effort:ruizhiEntry.reasoningEffort,description:ruizhiEntry.description??ruizhiEntry.reasoningEffort}));if(ruizhiEfforts.length===0)ruizhiEfforts=ruizhiLevels.map(ruizhiEntry=>({reasoningEffort:ruizhiEntry.effort,description:ruizhiEntry.description??ruizhiEntry.effort}));let ruizhiModalities=[...new Set([...(Array.isArray(ruizhiModel?.input_modalities)?ruizhiModel.input_modalities:[]),...(Array.isArray(ruizhiModel?.inputModalities)?ruizhiModel.inputModalities:[])])];return {...ruizhiModel,supported_reasoning_levels:ruizhiLevels,supportedReasoningEfforts:ruizhiEfforts,input_modalities:ruizhiModalities,inputModalities:ruizhiModalities}},ruizhiNormalizeResult=ruizhiResult=>({...ruizhiResult,data:Array.isArray(ruizhiResult?.data)?ruizhiResult.data.map(ruizhiNormalizeModel):[]})`;
  const modelListQueryFnReplacement = (rpcCall, hostId, limit) =>
    `queryFn:()=>{let ruizhiArgs={hostId:${hostId},includeHidden:!0,cursor:null,limit:${limit}},ruizhiNormalizeModelsResult=ruizhiResult=>{let ruizhiModels=Array.isArray(ruizhiResult?.data)?ruizhiResult.data:[];for(let ruizhiModel of ruizhiModels){if(!ruizhiModel||typeof ruizhiModel!==\`object\`)continue;ruizhiModel.input_modalities=[\`text\`,\`image\`];ruizhiModel.inputModalities=ruizhiModel.input_modalities;let ruizhiEfforts=Array.isArray(ruizhiModel.supported_reasoning_efforts)?ruizhiModel.supported_reasoning_efforts.filter(Boolean):[],ruizhiDesktopEfforts=Array.isArray(ruizhiModel.supportedReasoningEfforts)?ruizhiModel.supportedReasoningEfforts.map(e=>typeof e===\`string\`?e:e?.reasoningEffort||e?.effort).filter(Boolean):[],ruizhiLevels=Array.isArray(ruizhiModel.supported_reasoning_levels)?ruizhiModel.supported_reasoning_levels.map(e=>typeof e===\`string\`?e:e?.effort||e?.reasoningEffort).filter(Boolean):[];let ruizhiFinalEfforts=ruizhiEfforts.length?ruizhiEfforts:ruizhiDesktopEfforts.length?ruizhiDesktopEfforts:ruizhiLevels.length?ruizhiLevels:[\`minimal\`,\`low\`,\`medium\`,\`high\`,\`xhigh\`];ruizhiModel.supported_reasoning_efforts=ruizhiFinalEfforts;ruizhiModel.supportedReasoningEfforts=ruizhiFinalEfforts.map(e=>({reasoningEffort:e,description:e}));if(typeof ruizhiModel.defaultReasoningEffort!==\`string\`||!ruizhiModel.defaultReasoningEffort)ruizhiModel.defaultReasoningEffort=ruizhiModel.default_reasoning_level||\`medium\`;if(typeof ruizhiModel.default_reasoning_level!==\`string\`||!ruizhiModel.default_reasoning_level)ruizhiModel.default_reasoning_level=ruizhiModel.defaultReasoningEffort}return {...ruizhiResult,data:ruizhiModels}},ruizhiCall=globalThis.ruizhiDesktop?.enhance?.call;if(typeof ruizhiCall!==\`function\`)return ${rpcCall}(\`list-models-for-host\`,ruizhiArgs).then(ruizhiNormalizeModelsResult);return ruizhiCall(\`/models/list\`,ruizhiArgs).then(ruizhiResult=>{if(ruizhiResult?.status===\`ok\`&&Array.isArray(ruizhiResult.data))return ruizhiNormalizeModelsResult({data:ruizhiResult.data,nextCursor:null});return ${rpcCall}(\`list-models-for-host\`,ruizhiArgs).then(ruizhiNormalizeModelsResult)})}`;
  const forceFreshModelListQuery = (next) =>
    next.replace(
      /staleTime:[^,}]+,(queryFn:\(\)=>\{let (?:ruizhiArgs|ruizhiNormalizeModel)=)/,
      "staleTime:0,$1"
    );
  if (source.includes("ruizhiNormalizeModel=")) {
    const next = forceFreshModelListQuery(source);
    if (next !== source) fs.writeFileSync(modelQueriesFile, next, "utf8");
    log(`已存在用户模型缓存列表补丁：${path.basename(modelQueriesFile)}`);
    return;
  }
  if (source.includes("ruizhiCall=globalThis.ruizhiDesktop?.enhance?.call")) {
    throw new Error("model queries 旧版前端字段适配补丁形态未知，无法安全迁移");
  }
  const legacyModelListQueryFnPattern = /function ruizhiListModelsForHostFromUserCache\(e\)\{let t=globalThis\.ruizhiDesktop\?\.enhance\?\.call;if\(typeof t!==`function`\)return ([A-Za-z_$][\w$]*)\(`list-models-for-host`,e\);return t\(`\/models\/list`,e\)\.then\(t=>\{if\(t\?\.status===`ok`&&Array\.isArray\(t\.data\)\)\{let models=t\.data;return \{data:models,nextCursor:null\}\}return [A-Za-z_$][\w$]*\(`list-models-for-host`,e\)\}\)\}queryFn:\(\)=>ruizhiListModelsForHostFromUserCache\(\{hostId:([A-Za-z_$][\w$]*),includeHidden:!0,cursor:null,limit:([A-Za-z_$][\w$]*)\}\)/;
  const legacyMatch = source.match(legacyModelListQueryFnPattern);
  if (legacyMatch) {
    const next = forceFreshModelListQuery(source.replace(
      legacyModelListQueryFnPattern,
      modelListQueryFnReplacement(legacyMatch[1], legacyMatch[2], legacyMatch[3])
    ));
    fs.writeFileSync(modelQueriesFile, next, "utf8");
    log(`已修复旧版用户模型缓存列表补丁：${path.basename(modelQueriesFile)}`);
    return;
  }
  if (source.includes("function ruizhiListModelsForHostFromUserCache(")) {
    throw new Error("model queries 用户模型缓存旧补丁形态未知，无法安全迁移");
  }

  const match = source.match(modelListQueryFnPattern);
  if (!match) {
    throw new Error("model queries 用户模型缓存补丁点不存在");
  }
  const rpcCall = match[1];
  const hostId = match[2];
  const limit = match[3];
  const next = forceFreshModelListQuery(source.replace(
    modelListQueryFnPattern,
    modelListQueryFnReplacement(rpcCall, hostId, limit)
  ));
  fs.writeFileSync(modelQueriesFile, next, "utf8");
  log(`已改用用户模型缓存列表：${path.basename(modelQueriesFile)}`);
}

function patchNativeStatsigNetwork(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const statsigNetworkPattern = /networkConfig:\{api:([A-Za-z_$][\w$]*),logEventUrl:([A-Za-z_$][\w$]*),sdkExceptionUrl:([A-Za-z_$][\w$]*),networkOverrideFunc:([A-Za-z_$][\w$]*)\}/;
  const candidates = walkFiles(assetsDir).filter((filePath) => /^.+\.js$/.test(path.basename(filePath)) && /https:\/\/ab\.chatgpt\.com\/v1/.test(fs.readFileSync(filePath, "utf8")));
  if (candidates.length === 0) {
    log("已跳过 Codex 原生 Statsig 初始化网络禁用（statsig 模块结构已变化，注入点不存在）");
    return;
  }
  if (candidates.length !== 1) {
    throw new Error(`Statsig network bundle 匹配数量异常：${candidates.length}`);
  }
  const statsigFile = candidates[0];
  const original = fs.readFileSync(statsigFile, "utf8");
  if (original.includes("preventAllNetworkTraffic:!0")) {
    log("已存在 Codex 原生 Statsig 初始化网络禁用补丁");
    return;
  }
  if (!statsigNetworkPattern.test(original)) {
    throw new Error("Codex 原生 Statsig 初始化网络禁用补丁点不存在");
  }
  const next = original.replace(statsigNetworkPattern, "networkConfig:{api:$1,logEventUrl:$2,sdkExceptionUrl:$3,preventAllNetworkTraffic:!0}");
  fs.writeFileSync(statsigFile, next, "utf8");
  log(`已禁用 Codex 原生 Statsig 初始化网络：${path.basename(statsigFile)}`);
}

function patchNativeStatsigBootstrap(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const statsigBootstrapPattern = /async function ([A-Za-z_$][\w$]*)\(\{appSessionId:([A-Za-z_$][\w$]*),appVersion:([A-Za-z_$][\w$]*),buildFlavor:([A-Za-z_$][\w$]*),locale:([A-Za-z_$][\w$]*),stableId:([A-Za-z_$][\w$]*),systemName:([A-Za-z_$][\w$]*),systemVersion:([A-Za-z_$][\w$]*),windowType:([A-Za-z_$][\w$]*)\}\)\{let ([A-Za-z_$][\w$]*)=null;try\{let\{statsigPayload:([A-Za-z_$][\w$]*)\}=await Promise\.race\(\[[\s\S]*?Timed out while fetching post-login Statsig bootstrap[\s\S]*?\]\),\{user:([A-Za-z_$][\w$]*)\}=([A-Za-z_$][\w$]*)\.parse\(JSON\.parse\(([A-Za-z_$][\w$]*)\)\);return\{statsigPayload:([A-Za-z_$][\w$]*),user:([A-Za-z_$][\w$]*)\}\}finally\{([A-Za-z_$][\w$]*)!=null&&globalThis\.clearTimeout\(([A-Za-z_$][\w$]*)\)\}\}/;
  const candidates = walkFiles(assetsDir).filter((filePath) => {
    if (!filePath.endsWith(".js")) return false;
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("Timed out while fetching post-login Statsig bootstrap") || source.includes("ruizhiCreateStatsigBootstrapPayload");
  });
  if (candidates.length === 0) {
    log("已跳过 Codex 原生 Statsig post-login bootstrap 补丁（结构已变更）");
    return;
  }
  if (candidates.length > 1) {
    throw new Error(`Statsig post-login bootstrap bundle 匹配数量异常：${candidates.length}`);
  }
  const statsigFile = candidates[0];
  const original = fs.readFileSync(statsigFile, "utf8");
  if (original.includes("ruizhiCreateStatsigBootstrapPayload")) {
    log("已存在 Codex 原生 Statsig post-login bootstrap 等待禁用补丁");
    return;
  }
  const match = original.match(statsigBootstrapPattern);
  if (!match) {
    log("已跳过 Codex 原生 Statsig post-login bootstrap 补丁（补丁点不存在）");
    return;
  }
  const functionName = match[1];
  const appSessionId = match[2];
  const appVersion = match[3];
  const locale = match[5];
  const stableId = match[6];
  const validator = match[13];
  const localBootstrapCode = "function ruizhiCreateStatsigBootstrapPayload(e){return JSON.stringify({has_updates:!0,response_format:`init-v2`,time:Date.now(),feature_gates:{},dynamic_configs:{},layer_configs:{},param_stores:{},values:{},exposures:{},sdk_flags:{},user:{userID:e.stableId||e.appSessionId||`ruizhi-local`,customIDs:{stableID:e.stableId},locale:e.locale,appVersion:e.appVersion}})}";
  const next = original.replace(
    statsigBootstrapPattern,
    `${localBootstrapCode}async function ${functionName}({appSessionId:${appSessionId},appVersion:${appVersion},buildFlavor:${match[4]},locale:${locale},stableId:${stableId},systemName:${match[7]},systemVersion:${match[8]},windowType:${match[9]}}){let ${match[11]}=ruizhiCreateStatsigBootstrapPayload({appSessionId:${appSessionId},appVersion:${appVersion},locale:${locale},stableId:${stableId}}),{user:${match[12]}}=${validator}.parse(JSON.parse(${match[11]}));return{statsigPayload:${match[11]},user:${match[12]}}}`
  );
  fs.writeFileSync(statsigFile, next, "utf8");
  log(`已禁用 Codex 原生 Statsig post-login bootstrap 等待：${path.basename(statsigFile)}`);
}

function patchWindowsDefaultLocale(extractedAppDir, config, options = {}) {
  const log = options.log ?? (() => {});
  const locale = config.locale ?? "zh-CN";
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  let changedFiles = 0;

  const legacyResolvers = fs.existsSync(assetsDir)
    ? walkFiles(assetsDir).filter((filePath) => /^locale-resolver-.*\.js$/.test(path.basename(filePath)))
    : [];
  for (const resolverFile of legacyResolvers) {
    const changed = writePatchedFile(resolverFile, (source) => {
      if (source.includes("var t=`en-US`")) {
        return source.replace("var t=`en-US`", `var t=\`${locale}\``);
      }
      return source;
    });
    changedFiles += changed ? 1 : 0;
  }

  const intlSignalFiles = findFilesByContent(
    assetsDir,
    /\.js$/,
    /locale:`en`,messages:\{\}/
  );
  for (const intlFile of intlSignalFiles) {
    const changed = writePatchedFile(intlFile, (source) =>
      source.replace(/locale:`en`,messages:\{\}/g, `locale:\`${locale}\`,messages:{}`)
    );
    changedFiles += changed ? 1 : 0;
  }

  if (legacyResolvers.length === 0 && intlSignalFiles.length === 0) {
    throw new Error("Windows webview default locale patch point not found");
  }

  log(`Patched Windows default locale: ${locale}, changed files: ${changedFiles}`);
}

function shouldPreserveCodexVisibleText(value, contextKey = "") {
  const text = String(value);
  const key = String(contextKey);
  return (
    text === "Codex" ||
    /\b(ChatGPT Work|Business Codex|Codex CLI|Codex Desktop|Codex Micro|Codex Workspace|Codex dependencies)\b/i.test(text) ||
    /^sidebarElectron\.productMode\./.test(key) ||
    /^settings\.(usage|codexMicro)\./.test(key) ||
    /^threadPage\.remoteConnectionStatusBadge\.(install|remote|update).*Codex/i.test(key)
  );
}

function replaceBrandInVisibleText(value, config, contextKey = "") {
  const productName = config.productName ?? "锐捷Codex";
  const productPrefix = productName.replace(/Codex.*$/u, "").trim();
  const sourceValue = productPrefix
    ? String(value).replace(new RegExp(`(?:${escapeRegExp(productPrefix)}){2,}(?=Codex)`, "gu"), productPrefix)
    : String(value);
  if (shouldPreserveCodexVisibleText(value, contextKey)) {
    return sourceValue.replace(/ChatGPT/g, productName);
  }
  return sourceValue
    .replace(/ChatGPT/g, productName)
    .replace(/Codex/g, (match, offset, source) => {
      const before = source.slice(Math.max(0, offset - 16), offset);
      return /GPT-[0-9A-Za-z_. -]*$/i.test(before) || (productPrefix && before.endsWith(productPrefix)) ? match : productName;
    });
}

function shortProductName(config) {
  return (config.shortProductName ?? config.productName.replace(/Codex.*$/u, "").trim()) || config.productName;
}

function localeBundlePattern(locale) {
  return new RegExp(`^${escapeRegExp(locale)}-.*\\.js$`);
}

function loadWindowsLocaleMessages(assetsDir, locale, config) {
  const localeFiles = walkFiles(assetsDir)
    .filter((filePath) => localeBundlePattern(locale).test(path.basename(filePath)));
  if (localeFiles.length !== 1) {
    throw new Error(`Windows ${locale} locale bundle match count is ${localeFiles.length}`);
  }

  const source = fs.readFileSync(localeFiles[0], "utf8");
  const messages = new Map();
  const pattern = /"((?:\\.|[^"\\])+)":`((?:\\.|[^`\\])*)`/g;
  for (const match of source.matchAll(pattern)) {
    messages.set(match[1], replaceBrandInVisibleText(match[2], config, match[1]));
  }
  if (messages.size === 0) {
    throw new Error(`Windows ${locale} locale bundle is empty: ${localeFiles[0]}`);
  }
  return { localeFile: localeFiles[0], messages };
}

function patchWindowsFrontendLocalization(extractedAppDir, config, options = {}) {
  const log = options.log ?? (() => {});
  const locale = config.locale ?? "zh-CN";
  const webviewRoot = path.join(extractedAppDir, "webview");
  const assetsDir = path.join(webviewRoot, "assets");
  const { localeFile, messages } = loadWindowsLocaleMessages(assetsDir, locale, config);
  let changedFiles = 0;
  let changedMessages = 0;

  const onboardingReplacements = new Map([
    ["electron.onboarding.login.chatgpt.continue", "使用锐捷继续"],
    ["electron.onboarding.login.chatgpt.signIn", "使用锐捷继续"],
    ["electron.onboarding.login.chatgpt.signIn.streamlined", "使用锐捷继续"],
    ["electron.onboarding.welcomeV2.continue", "使用锐捷继续"],
    ["electron.onboarding.login.includedPlans.welcomeV2", `${config.version ?? ""}`],
    ["electron.onboarding.welcomeV2.role.subtitle", `${config.version ?? ""}`],
    ["electron.onboarding.welcomeV2.role.subtitle.chatgpt", `${config.version ?? ""}`],
    ["sidebarElectron.productMode.chatGptWork", `<chatGpt>${shortProductName(config)}</chatGpt> <work>\u5de5\u4f5c</work>`],
    ["sidebarElectron.productMode.chatGptWork.plainText", `${shortProductName(config)} \u5de5\u4f5c`],
    ["sidebarElectron.productMode.codex", config.productModes?.coding ?? `${shortProductName(config)} \u7f16\u7801`]
  ]);

  const localeChanged = writePatchedFile(localeFile, (source) => {
    const localeEntryPattern = /"((?:\\.|[^"\\])+)":`((?:\\.|[^`\\])*)`/g;
    let next = source.replace(localeEntryPattern, (literal, key, value) => {
      if (onboardingReplacements.has(key)) {
        return `"${key}":\`${onboardingReplacements.get(key)}\``;
      }
      const branded = replaceBrandInVisibleText(value, config, key);
      return branded === value ? literal : `"${key}":\`${branded}\``;
    });
    next = next.replace(/`((?:\\.|[^`\\])*)`/g, (literal, value) => {
      const branded = replaceBrandInVisibleText(value, config);
      return branded === value ? literal : `\`${branded}\``;
    });
    for (const [key, value] of onboardingReplacements) {
      const pattern = new RegExp(`("${escapeRegExp(key)}":)\`(?:\\\\.|[^\`\\\\])*\``);
      next = next.replace(pattern, `$1\`${value}\``);
      messages.set(key, value);
    }
    next = next
      .replace(/("sidebarElectron\.productMode\.chatGptWork":)`(?:\\.|[^`\\])*`/, `$1\`<chatGpt>${shortProductName(config)}</chatGpt> <work>\u5de5\u4f5c</work>\``)
      .replace(/("sidebarElectron\.productMode\.chatGptWork\.plainText":)`(?:\\.|[^`\\])*`/, `$1\`${shortProductName(config)} \u5de5\u4f5c\``)
      .replace(/("sidebarElectron\.productMode\.codex":)`(?:\\.|[^`\\])*`/, `$1\`${config.productModes?.coding ?? `${shortProductName(config)} \u7f16\u7801`}\``);
    return next;
  });
  changedFiles += localeChanged ? 1 : 0;

  const textFiles = walkFiles(webviewRoot)
    .filter((filePath) => /\.(js|html)$/i.test(filePath));
  for (const filePath of textFiles) {
    if (filePath === localeFile) {
      continue;
    }
    const changed = writePatchedFile(filePath, (source) =>
      source.replace(
        /id:`([^`]+)`,defaultMessage:`((?:\\.|[^`\\])*)`/g,
        (match, id, defaultMessage) => {
          const localized = messages.get(id);
          const nextMessage = localized ?? replaceBrandInVisibleText(defaultMessage, config, id);
          if (nextMessage === defaultMessage) {
            return match;
          }
          changedMessages += 1;
          return `id:\`${id}\`,defaultMessage:\`${nextMessage}\``;
        }
      ).replace(/(defaultMessage|title|label):`((?:\\.|[^`\\])*)`/g, (match, key, value) => {
        const branded = replaceBrandInVisibleText(value, config);
        return branded === value ? match : `${key}:\`${branded}\``;
      })
    );
    changedFiles += changed ? 1 : 0;
  }

  log(`Patched Windows frontend localization: ${locale}, files=${changedFiles}, messages=${changedMessages}`);
}

function replaceLocaleBacktickValue(source, key, value) {
  const prefix = `"${key}":\``;
  const start = source.indexOf(prefix);
  if (start < 0) {
    throw new Error(`Windows locale key not found: ${key}`);
  }
  const valueStart = start + prefix.length;
  const valueEnd = source.indexOf("`", valueStart);
  if (valueEnd < 0) {
    throw new Error(`Windows locale value terminator not found: ${key}`);
  }
  return `${source.slice(0, valueStart)}${value}${source.slice(valueEnd)}`;
}

function patchWindowsProductModeLabels(extractedAppDir, config, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const localeFiles = walkFiles(assetsDir)
    .filter((filePath) => /^zh-CN-.*\.js$/.test(path.basename(filePath)));
  if (localeFiles.length !== 1) {
    throw new Error(`Windows product mode locale bundle match count is ${localeFiles.length}`);
  }
  const changed = writePatchedFile(localeFiles[0], (source) => {
    let next = source;
    next = replaceLocaleBacktickValue(next, "sidebarElectron.productMode.chatGptWork", `<chatGpt>${shortProductName(config)}</chatGpt> <work>\u5de5\u4f5c</work>`);
    next = replaceLocaleBacktickValue(next, "sidebarElectron.productMode.chatGptWork.plainText", `${shortProductName(config)} \u5de5\u4f5c`);
    next = replaceLocaleBacktickValue(next, "sidebarElectron.productMode.codex", config.productModes?.coding ?? `${shortProductName(config)} \u7f16\u7801`);
    return next;
  });
  log(`Patched Windows product mode labels: ${changed ? "changed" : "already current"}`);
}

function patchWindowsProductModeSwitcherVisibility(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const candidates = walkFiles(assetsDir).filter((filePath) => {
    if (!/^app-main-.*\.js$/.test(path.basename(filePath))) return false;
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("sidebarElectron.productMode.trigger");
  });
  if (candidates.length !== 1) {
    throw new Error(`Windows product mode switcher bundle match count is ${candidates.length}`);
  }

  const appMainFile = candidates[0];
  const changed = writePatchedFile(appMainFile, (source) => {
    let next = source;
    next = next.replace(
      /([A-Za-z_$][\w$]*)=ba\(`824038554`\)/,
      "$1=!0"
    );
    next = next.replace(
      /([A-Za-z_$][\w$]*)=ba\(`3075919032`\)/,
      "$1=!0"
    );
    return next;
  });

  log(`Patched Windows product mode switcher visibility: ${changed ? "changed" : "already current"}`);
}

function patchWindowsSandboxOnboardingBypass(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const candidates = walkFiles(assetsDir).filter((filePath) => {
    if (!/^app-main-.*\.js$/.test(path.basename(filePath))) return false;
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("start-windows-sandbox-setup-for-host") && source.includes("allowUnelevatedFallback");
  });
  if (candidates.length !== 1) {
    throw new Error(`Windows sandbox onboarding bundle match count is ${candidates.length}`);
  }

  const appMainFile = candidates[0];
  const changed = writePatchedFile(appMainFile, (source) => {
    if (source.includes("function ruizhiWindowsSandboxOnboardingState()")) {
      return source;
    }
    return source.replace(
      /function ([A-Za-z_$][\w$]*)\(e\)\{let t=\(0,([A-Za-z_$][\w$]*)\.c\)\(6\),\{children:n\}=e,[\s\S]*?let a;return t\[4\]===n\?a=t\[5\]:\(a=\(0,([A-Za-z_$][\w$]*)\.jsx\)\(([A-Za-z_$][\w$]*),\{children:n\}\),t\[4\]=n,t\[5\]=a\),a\}function ([A-Za-z_$][\w$]*)\(e\)\{let t=\(0,\2\.c\)\(22\),\{children:n\}=e,/,
      "function ruizhiWindowsSandboxOnboardingState(){return {isEnabled:!0,isLoading:!1,shouldShow:!1}}function $1(e){let{children:n}=e;return (0,$3.jsx)($4,{value:ruizhiWindowsSandboxOnboardingState(),children:n})}function $5(e){let t=(0,$2.c)(22),{children:n}=e,"
    );
  });

  if (!fs.readFileSync(appMainFile, "utf8").includes("function ruizhiWindowsSandboxOnboardingState()")) {
    throw new Error("Windows sandbox onboarding bypass patch point not found");
  }

  log(`Patched Windows sandbox onboarding bypass: ${changed ? "changed" : "already current"}`);
}

function patchNativeCesAnalyticsNetwork(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const cesEndpointPattern = /([A-Za-z_$][\w$]*)=`https:\/\/chatgpt\.com\/ces\/v1\/rgstr`,([A-Za-z_$][\w$]*)=`https:\/\/chatgpt\.com\/ces\/v1`/;
  const cesEnabledPattern = /([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)&&([A-Za-z_$][\w$]*)===`success`&&([A-Za-z_$][\w$]*)===!0/;
  const candidates = walkFiles(assetsDir).filter((filePath) => /^.+\.js$/.test(path.basename(filePath)) && /https:\/\/chatgpt\.com\/ces\/v1/.test(fs.readFileSync(filePath, "utf8")));
  if (candidates.length === 0) {
    log("已跳过 Codex 原生 CES 分析上报禁用（statsig 模块结构已变化，注入点不存在）");
    return;
  }
  if (candidates.length !== 1) {
    throw new Error(`CES analytics bundle 匹配数量异常：${candidates.length}`);
  }
  const cesFile = candidates[0];
  const original = fs.readFileSync(cesFile, "utf8");
  if (original.includes("ruizhi-disabled://ces/v1")) {
    log("已存在 Codex 原生 CES 分析上报禁用补丁");
    return;
  }
  if (!cesEndpointPattern.test(original)) {
    throw new Error("Codex 原生 CES 分析上报禁用补丁点不存在");
  }
  if (!cesEnabledPattern.test(original)) {
    throw new Error("Codex 原生 CES 分析上报初始化禁用补丁点不存在");
  }
  const next = original
    .replace(cesEndpointPattern, "$1=`ruizhi-disabled://ces/v1/rgstr`,$2=`ruizhi-disabled://ces/v1`")
    .replace(cesEnabledPattern, "$1=!1&&$2&&$3===`success`&&$4===!0");
  fs.writeFileSync(cesFile, next, "utf8");
  log(`已禁用 Codex 原生 CES 分析上报：${path.basename(cesFile)}`);
}

function patchNativeProfileVisibility(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  let profileVisibilityFile;
  try {
    profileVisibilityFile = findOneFileByContent(
      assetsDir,
      /^.+\.js$/,
      /2478676115[\s\S]*3503973010[\s\S]*show_dropdown_entry_point/,
      "profile visibility bundle"
    );
  } catch (error) {
    log(`已跳过 Codex 个人资料入口补丁：${error.message}`);
    return;
  }
  let source = fs.readFileSync(profileVisibilityFile, "utf8");
  if (source.includes("ruizhiProfileVisibility()")) {
    log("已存在 Codex 个人资料入口补丁");
    return;
  }
  source = source.replace(
    /function ([A-Za-z_$][\w$]*)\(\)\{let ([A-Za-z_$][\w$]*)=\(0,([A-Za-z_$][\w$]*)\.c\)\(3\),\{authMethod:([A-Za-z_$][\w$]*),isLoading:([A-Za-z_$][\w$]*)\}=([A-Za-z_$][\w$]*)\(\),([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(\),([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)=\5\|\|\4===`chatgpt`&&\7,([A-Za-z_$][\w$]*)=\4===`chatgpt`&&\9,([A-Za-z_$][\w$]*);return \2\[0\]!==\12\|\|\2\[1\]!==\13\?\(\14=\{isProfileVisibilityLoading:\12,isProfileVisible:\13\},\2\[0\]=\12,\2\[1\]=\13,\2\[2\]=\14\):\14=\2\[2\],\14\}/,
    "function ruizhiProfileVisibility(){return {isProfileVisibilityLoading:false,isProfileVisible:true}}function $1(){return ruizhiProfileVisibility()}"
  );
  source = source.replace(
    /function ([A-Za-z_$][\w$]*)\(\)\{let ([A-Za-z_$][\w$]*)=\(0,([A-Za-z_$][\w$]*)\.c\)\(3\),\{authMethod:([A-Za-z_$][\w$]*)\}=([A-Za-z_$][\w$]*)\(\),([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\);if\(\4!==`chatgpt`\)return!1;let ([A-Za-z_$][\w$]*);return \2\[0\]!==\6\|\|\2\[1\]!==\9\?\(\12=\6&&\9\.get\(([A-Za-z_$][\w$]*),!1\),\2\[0\]=\6,\2\[1\]=\9,\2\[2\]=\12\):\12=\2\[2\],\12\}/,
    "function ruizhiProfileDropdownEntryPoint(){return true}function $1(){return ruizhiProfileDropdownEntryPoint()}"
  );
  if (!source.includes("ruizhiProfileVisibility()") || !source.includes("ruizhiProfileDropdownEntryPoint()")) {
    throw new Error("Codex 个人资料入口补丁点不存在");
  }
  fs.writeFileSync(profileVisibilityFile, source, "utf8");
  log(`已打开 Codex 个人资料入口：${path.basename(profileVisibilityFile)}`);
}

function patchPluginAccountGate(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const pluginAccountGatePattern = /function ([A-Za-z_$][\w$]*)\(e\)\{return e!==`chatgpt`(?:&&e!==`apikey`&&e!==`amazonBedrock`(?:\/\*ruizhiPluginAuthCompatibility\*\/)?){0,1}\}/;
  let gateFile;
  try {
    gateFile = findOneFileByContent(
      assetsDir,
      /^.+\.js$/,
      pluginAccountGatePattern,
      "plugin account compatibility bundle"
    );
  } catch (error) {
    log(`已跳过 Codex 插件账号兼容补丁：${error.message}`);
    return;
  }
  const source = fs.readFileSync(gateFile, "utf8");
  const patched = patchNativePluginAuthCompatibilitySource(source);
  if (patched === source) {
    log(`Codex 插件已原生支持 ChatGPT/API key 账号：${path.basename(gateFile)}`);
    return;
  }
  fs.writeFileSync(gateFile, patched, "utf8");
  log(`已补丁 Codex 插件账号兼容范围：${path.basename(gateFile)}`);
}

function patchNativeUsageSettingsVisibility(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  let usageAccessFile;
  try {
    usageAccessFile = findOneFileByContent(
      assetsDir,
      /^.+\.js$/,
      /enable_free_go_usage_settings[\s\S]*isUsageSettingsVisible/,
      "usage settings access bundle"
    );
  } catch (error) {
    log(`Skipped usage settings visibility patch: ${error.message}`);
    return;
  }
  let source = fs.readFileSync(usageAccessFile, "utf8");
  if (source.includes("ruizhiUsageSettingsAlwaysVisible")) {
    log("已存在 Codex 使用情况设置入口补丁");
    return;
  }
  source = patchNativeUsageSettingsVisibilitySource(source);
  fs.writeFileSync(usageAccessFile, source, "utf8");
  log(`已打开 Codex 使用情况设置入口：${path.basename(usageAccessFile)}`);
}

function patchNativeProfileDropdownUsageVisibility(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  const profileDropdownFile = findOneFileByContent(
    assetsDir,
    /^.+\.js$/,
    /\{isUsageSettingsVisible:[A-Za-z_$][\w$]*,isUsageSettingsAccessLoading:[A-Za-z_$][\w$]*\}=[A-Za-z_$][\w$]*\(\)[\s\S]*codex\.profileDropdown\.apiKeyAuth[\s\S]*codex\.profileDropdown\.usage/,
    "profile dropdown usage bundle"
  );
  let source = fs.readFileSync(profileDropdownFile, "utf8");
  if (source.includes("ruizhiProfileDropdownUsageForApiKey")) {
    log("已存在 Codex 头像菜单使用情况入口补丁");
    return;
  }

  const usageAccessMatch = source.match(/\{isUsageSettingsVisible:([A-Za-z_$][\w$]*),isUsageSettingsAccessLoading:([A-Za-z_$][\w$]*)\}=([A-Za-z_$][\w$]*)\(\)/);
  const apiKeyAuthMatch = source.match(/else if\(([A-Za-z_$][\w$]*)\)\{[\s\S]{0,900}?codex\.profileDropdown\.apiKeyAuth/);
  if (!usageAccessMatch || !apiKeyAuthMatch) {
    throw new Error("Codex 头像菜单使用情况入口补丁点不存在：账号态变量");
  }
  const [, usageVisibleVar, usageLoadingVar] = usageAccessMatch;
  const apiKeyAuthVar = apiKeyAuthMatch[1];
  const usageConditionPattern = new RegExp(
    `,([A-Za-z_$][\\w$]*)=([^,;]*&&${escapeRegExp(usageVisibleVar)}&&[^,;]*),([A-Za-z_$][\\w$]*=[A-Za-z_$][\\w$]*\\(\\),)`
  );
  source = source.replace(
    usageConditionPattern,
    `,$1=($2)||${apiKeyAuthVar}&&${usageVisibleVar}&&!${usageLoadingVar}/*ruizhiProfileDropdownUsageForApiKey*/,$3`
  );
  if (!source.includes("ruizhiProfileDropdownUsageForApiKey")) {
    throw new Error("Codex 头像菜单使用情况入口补丁点不存在：显示条件");
  }
  fs.writeFileSync(profileDropdownFile, source, "utf8");
  log(`已打开 Codex 头像菜单使用情况入口：${path.basename(profileDropdownFile)}`);
}

function patchNativeProfileUsageFallback(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  let profileQueriesFile;
  try {
    profileQueriesFile = findOneFileByContent(
      assetsDir,
      /^.+\.js$/,
      /\/wham\/profiles\/me/,
      "profile queries bundle"
    );
  } catch (error) {
    log(`已跳过 Codex 个人资料 Token 活动本地兜底补丁：${error.message}`);
    return;
  }
  let source = fs.readFileSync(profileQueriesFile, "utf8");
  if (source.includes("/profile/usage")) {
    log("已存在 Codex 个人资料 Token 活动本地兜底补丁");
    return;
  }
  source = source.replace(
    /let e=await ([A-Za-z_$][\w$]*)\.safeGet\(`\/wham\/profiles\/me`\);return\{/,
    "let e,ruizhiProfilePayloadValid=e=>!!(e&&typeof e===`object`&&e.profile&&e.stats&&e.metadata);try{console.info(`[ruizhi][profile] GET /wham/profiles/me start`);e=await $1.safeGet(`/wham/profiles/me`);if(!ruizhiProfilePayloadValid(e))throw new Error(`invalid profile payload`);console.info(`[ruizhi][profile] GET /wham/profiles/me success`,{hasProfile:!!e?.profile,hasStats:!!e?.stats,hasDailyBuckets:Array.isArray(e?.stats?.daily_usage_buckets)})}catch(t){console.warn(`[ruizhi][profile] GET /wham/profiles/me failed, trying local fallback`,{message:String(t?.message||t)});let n=globalThis.ruizhiDesktop?.enhance?.call;if(typeof n===`function`)try{let r=await n(`/profile/usage`,{});if(r?.status===`ok`&&ruizhiProfilePayloadValid(r)){console.info(`[ruizhi][profile] local /profile/usage success`,{hasProfile:!!r?.profile,hasStats:!!r?.stats,hasDailyBuckets:Array.isArray(r?.stats?.daily_usage_buckets)});e=r}}catch(r){console.warn(`[ruizhi][profile] local /profile/usage failed`,{message:String(r?.message||r)})}if(!ruizhiProfilePayloadValid(e)){console.warn(`[ruizhi][profile] using empty local profile fallback`);e={profile:{display_name:`锐智用户`,profile_picture_url:null,username:null},stats:{lifetime_tokens:0,peak_daily_tokens:0,longest_running_turn_sec:null,current_streak_days:0,longest_streak_days:0,daily_usage_buckets:[],fast_mode_usage_percentage:null,top_invocations:[],most_used_reasoning_effort:null,most_used_reasoning_effort_percentage:null,unique_skills_used:null,total_skills_used:null,total_threads:0},metadata:{stats_error:String(t?.message||t||``)}}}}return{"
  );
  if (!source.includes("/profile/usage") || !source.includes("[ruizhi][profile] GET /wham/profiles/me start")) {
    throw new Error("Codex 个人资料 Token 活动本地兜底/日志补丁点不存在");
  }
  fs.writeFileSync(profileQueriesFile, source, "utf8");
  log(`已补丁 Codex 个人资料 Token 活动本地兜底与调用日志：${path.basename(profileQueriesFile)}`);
}

function patchNativePlatformUsageFallback(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const assetsDir = path.join(extractedAppDir, "webview", "assets");
  let usageQueriesFile;
  try {
    usageQueriesFile = findOneFileByContent(
      assetsDir,
      /^.+\.js$/,
      /safeGet\(`\/wham\/usage`/,
      "usage queries bundle"
    );
  } catch (error) {
    log(`已跳过锐鉴 API 用量兜底补丁：${error.message}`);
    return;
  }
  let source = fs.readFileSync(usageQueriesFile, "utf8");
  if (source.includes("/usage/platform")) {
    log("已存在锐鉴 API 用量兜底补丁");
    return;
  }
  source = source.replace(
    /queryFn:async\(\)=>\{try\{return await ([A-Za-z_$][\w$]*)\.safeGet\(`\/wham\/usage`,\{parameters:\{query:\{supports_rewardless_invites:!0\}\}\}\)\}catch\(e\)\{if\(e instanceof ([A-Za-z_$][\w$]*)&&\(e\.status===401\|\|e\.status===403\|\|e\.status===404\)\)return null;throw e\}\}/,
    "queryFn:async()=>{try{let e=await $1.safeGet(`/wham/usage`,{parameters:{query:{supports_rewardless_invites:!0}}});if(!e?.rate_limit?.primary_window)throw new Error(`incompatible usage response`);return e}catch(e){let t=globalThis.ruizhiDesktop?.enhance?.call;if(typeof t===`function`){let n=await t(`/usage/platform`,{});if(n?.status===`ok`&&n?.data?.rate_limit?.primary_window)return n.data}if(e instanceof $2&&(e.status===401||e.status===403||e.status===404))return null;throw e}}"
  );
  if (!source.includes("/usage/platform") || !source.includes("incompatible usage response")) {
    throw new Error("锐鉴 API 用量兜底补丁点不存在");
  }
  fs.writeFileSync(usageQueriesFile, source, "utf8");
  log(`已补丁锐鉴 API 真实剩余用量：${path.basename(usageQueriesFile)}`);
}

function patchNativeProfileApiCallLogging(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const mainBuildDir = path.join(extractedAppDir, ".vite", "build");
  let mainFile;
  try {
    mainFile = findOneFileByContent(
      mainBuildDir,
      /^main-.*\.js$/,
      /CODEX_API_BASE_URL[\s\S]*?prodApiBaseUrl/,
      "main API base bundle"
    );
  } catch (error) {
    log(`已跳过 Codex /wham/profiles/me 主进程调用日志补丁：${error.message}`);
    return;
  }
  let source = fs.readFileSync(mainFile, "utf8");
  if (source.includes("[ruizhi][profile-api]")) {
    log("已存在 Codex /wham/profiles/me 主进程调用日志补丁");
    return;
  }
  source = source.replace(
    /function ([A-Za-z_$][\w$]*)\(e,t\)\{return`\$\{([A-Za-z_$][\w$]*)\(e\)\}\/\$\{t\.replace\(\/\^\\\/\+\/,``\)\}`\}/,
    "function $1(e,t){let n=`${$2(e)}/${t.replace(/^\\/+/,``)}`;try{String(t).replace(/^\\/+/,``)===`wham/profiles/me`&&console.info(`[ruizhi][profile-api] GET /wham/profiles/me`,{url:n,apiBase:$2(e)})}catch{}return n}"
  );
  if (!source.includes("[ruizhi][profile-api]")) {
    throw new Error("Codex /wham/profiles/me 主进程调用日志补丁点不存在");
  }
  fs.writeFileSync(mainFile, source, "utf8");
  log(`已补丁 Codex /wham/profiles/me 主进程调用日志：${path.basename(mainFile)}`);
}

function patchNativeBrowserDesktopFeatureAvailabilitySource(source) {
  if (source.includes("function ruizhiNativeBrowserDesktopFeatureAvailability(")) {
    return source;
  }

  const helper = "function ruizhiBrowserNativePipeLog(e,t){try{console.info(`[ruizhi][browser] ${e}`,t)}catch{}}function ruizhiNativeBrowserDesktopFeatureAvailability(e){let t={...e,browserPane:!0,inAppBrowserUse:!0,inAppBrowserUseAllowed:!0};return ruizhiBrowserNativePipeLog(`desktopFeatureAvailability`,{before:{browserPane:e.browserPane,inAppBrowserUse:e.inAppBrowserUse,inAppBrowserUseAllowed:e.inAppBrowserUseAllowed},after:{browserPane:t.browserPane,inAppBrowserUse:t.inAppBrowserUse,inAppBrowserUseAllowed:t.inAppBrowserUseAllowed}}),t}";
  const nativeBrowserDesktopFeatureAvailabilityPattern = /function ([A-Za-z_$][\w$]*)\(e,\{buildFlavor:[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\.resolve\(\),env:[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*\.default\.env,platform:[A-Za-z_$][\w$]*=[A-Za-z_$][\w$]*\.default\.platform\}=\{\}\)\{let [\s\S]*?CODEX_ELECTRON_ENABLE_WINDOWS_COMPUTER_USE[\s\S]*?return /;
  const availabilityMatch = source.match(nativeBrowserDesktopFeatureAvailabilityPattern);
  if (availabilityMatch) {
    const functionEnd = source.indexOf("}function ", availabilityMatch.index + availabilityMatch[0].length);
    if (functionEnd === -1) {
      throw new Error("补丁点不存在：Codex 原生 Browser 桌面能力函数边界");
    }
    const originalFunction = source.slice(availabilityMatch.index, functionEnd + 1);
    const returnExpression = source.slice(availabilityMatch.index + availabilityMatch[0].length, functionEnd);
    return source.replace(originalFunction, `${helper}${availabilityMatch[0]}ruizhiNativeBrowserDesktopFeatureAvailability(${returnExpression})}`);
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

  // Codex 42.0.1 restructured desktop feature availability into state-driven
  // memoized dispatch instead of xe/ve functions. Skip — browser features are
  // enabled by default in the current version.
  return source;
}

export function patchTrustedBrowserClientHashesSource(source, hashes) {
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
      const replacement = `var ${hashVariable}=[${literal}]${suffix}`;
      return replacement === match ? match : replacement;
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

export function browserClientHashesFromResourcesDir(resourcesDir) {
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

export function patchTrustedBrowserClientHashes(extractedAppDir, resourcesDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }

  const hashes = browserClientHashesFromResourcesDir(resourcesDir);
  const source = fs.readFileSync(mainFile[0], "utf8");
  const patched = patchTrustedBrowserClientHashesSource(source, hashes);
  const hashSummary = hashes.map((hash) => hash.slice(0, 12)).join(",");
  if (patched === source) {
    log(`已存在 Browser client nativePipe 信任哈希：${hashSummary}`);
    return { changed: false, hashes };
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已更新 Browser client nativePipe 信任哈希：${hashSummary}`);
  return { changed: true, hashes };
}

function patchNativeBrowserDesktopFeatureAvailability(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }

  const source = fs.readFileSync(mainFile[0], "utf8");
  const patched = patchNativeBrowserDesktopFeatureAvailabilitySource(source);
  if (patched === source) {
    log(`已存在 Codex 原生 Browser 桌面能力补丁：${path.basename(mainFile[0])}`);
    return;
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已打开 Codex 原生 Browser 桌面能力：${path.basename(mainFile[0])}`);
}

export function patchChatGptAuthExternalBrowserSource(source) {
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

function patchChatGptAuthExternalBrowser(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }

  const source = fs.readFileSync(mainFile[0], "utf8");
  let patched;
  try {
    patched = patchChatGptAuthExternalBrowserSource(source);
  } catch (error) {
    log(`已跳过 ChatGPT 认证链接外部浏览器补丁：${error.message}`);
    return;
  }
  if (patched === source) {
    log(`已存在 ChatGPT 认证链接外部浏览器补丁：${path.basename(mainFile[0])}`);
    return;
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已强制 ChatGPT 认证链接使用系统浏览器：${path.basename(mainFile[0])}`);
}

function ruizhiLocalPluginListFallbackHelperSource() {
  return "function ruizhiReadLocalPluginConfigEnabledMap(codexHome){let fs=require(`node:fs`),path=require(`node:path`),configPath=path.join(codexHome,`config.toml`),enabled=new Map;if(!fs.existsSync(configPath))return enabled;let current=null;for(let line of fs.readFileSync(configPath,`utf8`).split(/\\r?\\n/)){let header=line.trim().match(/^\\[plugins\\.(?:\"([^\"]+)\"|([^\\]]+))\\]$/);if(header){current=(header[1]||header[2]||``).trim();continue}if(current){let match=line.trim().match(/^enabled\\s*=\\s*(true|false)\\s*$/i);if(match)enabled.set(current,match[1].toLowerCase()===`true`)}}return enabled}function ruizhiReadJsonFileIfPresent(filePath){try{let fs=require(`node:fs`);return fs.existsSync(filePath)?JSON.parse(fs.readFileSync(filePath,`utf8`)):null}catch{return null}}function ruizhiComparePluginVersions(left,right){return String(left).localeCompare(String(right),void 0,{numeric:true,sensitivity:`base`})}function ruizhiLocalPluginMarketplaces(codexHome){let fs=require(`node:fs`),path=require(`node:path`),cacheRoot=path.join(codexHome,`plugins`,`cache`),enabledMap=ruizhiReadLocalPluginConfigEnabledMap(codexHome),marketplaces=[];if(!fs.existsSync(cacheRoot))return marketplaces;for(let marketplaceEntry of fs.readdirSync(cacheRoot,{withFileTypes:true})){if(!marketplaceEntry.isDirectory())continue;let marketplaceName=marketplaceEntry.name,marketplaceRoot=path.join(cacheRoot,marketplaceName),plugins=[];for(let pluginEntry of fs.readdirSync(marketplaceRoot,{withFileTypes:true})){if(!pluginEntry.isDirectory())continue;let pluginName=pluginEntry.name,pluginRoot=path.join(marketplaceRoot,pluginName),versions=fs.readdirSync(pluginRoot,{withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort(ruizhiComparePluginVersions),version=versions.at(-1);if(!version)continue;let installedRoot=path.join(pluginRoot,version),manifest=ruizhiReadJsonFileIfPresent(path.join(installedRoot,`.codex-plugin`,`plugin.json`));if(!manifest||typeof manifest.name!==`string`)continue;let manifestName=manifest.name||pluginName,pluginId=manifestName+`@`+marketplaceName,enabled=enabledMap.get(pluginId);plugins.push({id:pluginId,name:manifestName,version:String(manifest.version||version),localVersion:String(manifest.version||version),description:manifest.description||manifest.interface?.shortDescription||``,interface:manifest.interface||{},category:manifest.interface?.category||manifest.category||`Installed`,installed:true,enabled:enabled!==false,source:{type:`local`,path:installedRoot},policy:{installation:`AVAILABLE`,authentication:`NONE`}})}if(plugins.length>0)marketplaces.push({name:marketplaceName,path:marketplaceRoot,interface:{displayName:marketplaceName},plugins})}return marketplaces}function ruizhiMergeLocalPluginMarketplaces({codexHome,remoteMarketplaces}){let localMarketplaces=ruizhiLocalPluginMarketplaces(codexHome),byName=new Map;for(let marketplace of Array.isArray(remoteMarketplaces)?remoteMarketplaces:[])byName.set(marketplace.name,{...marketplace,plugins:Array.isArray(marketplace.plugins)?[...marketplace.plugins]:[]});for(let localMarketplace of localMarketplaces){let marketplace=byName.get(localMarketplace.name);if(!marketplace){byName.set(localMarketplace.name,localMarketplace);continue}let pluginsByName=new Map(marketplace.plugins.map(plugin=>[plugin.name,plugin]));for(let localPlugin of localMarketplace.plugins){let existing=pluginsByName.get(localPlugin.name);pluginsByName.set(localPlugin.name,existing==null?localPlugin:{...existing,installed:true,enabled:localPlugin.enabled,localVersion:localPlugin.localVersion,source:localPlugin.source})}marketplace.plugins=[...pluginsByName.values()];marketplace.path=marketplace.path||localMarketplace.path;marketplace.interface=marketplace.interface||localMarketplace.interface}return [...byName.values()]}";
}

function replacePluginSkillListFallbackRegex(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`补丁点不存在：${label}`);
  }
  return source.replace(pattern, replacement);
}

export function patchPluginSkillLocalListFallbackSource(source) {
  if (
    source.includes("function ruizhiLocalPluginMarketplaces(")
    && source.includes("ruizhiMergeLocalPluginMarketplaces({codexHome:")
    && source.includes("Failed to load recommended skills, using local skills only")
  ) {
    return source;
  }
  let next = source;
  if (!next.includes("function ruizhiLocalPluginMarketplaces(")) {
    next = replacePluginSkillListFallbackRegex(
      next,
      /var ([A-Za-z_$][\w$]*)=class extends ([A-Za-z_$][\w$]*)\.P\{/,
      `${ruizhiLocalPluginListFallbackHelperSource()}var $1=class extends $2.P{`,
      "注入本地插件列表兜底工具"
    );
  }
  next = replacePluginSkillListFallbackRegex(
    next,
    /codexHome:([A-Za-z_$][\w$]*),filesystem:this\.appServer,marketplaces:([A-Za-z_$][\w$]*)\.filter\(/,
    "codexHome:$1,filesystem:this.appServer,marketplaces:ruizhiMergeLocalPluginMarketplaces({codexHome:$1,remoteMarketplaces:$2}).filter(",
    "插件列表合并本地已安装插件"
  );
  next = replacePluginSkillListFallbackRegex(
    next,
    /\}catch\{return\{groups:\[\]\}\}\}/,
    "}catch(error){try{let[o,s]=await Promise.all([this.appServer.codexHome(),this.appServer.platformPath()]),c=n.Ms(e),l=ruizhiLocalPluginMarketplaces(o);return await n.ln({codexHome:o,filesystem:this.appServer,marketplaces:l.filter(e=>!r.includes(e.name)&&(!n.Ns(e.name)||e.name===c)),path:s})}catch{return{groups:[]}}}}",
    "插件列表远端失败时保留本地已安装插件"
  );
  next = replacePluginSkillListFallbackRegex(
    next,
    /"recommended-skills":async\(\{hostId:([A-Za-z_$][\w$]*),refresh:([A-Za-z_$][\w$]*)\}\)=>\{let ([A-Za-z_$][\w$]*)=this\.getRequestAppServerClient\(\1\);return ([A-Za-z_$][\w$]*)\.c\(\{refresh:\2,preferWsl:([A-Za-z_$][\w$]*),bundledRepoRoot:this\.bundledSkillsRoot,appServerClient:\3\}\)\}/,
    '"recommended-skills":async({hostId:$1,refresh:$2})=>{let $3=this.getRequestAppServerClient($1);try{return await $4.c({refresh:$2,preferWsl:$5,bundledRepoRoot:this.bundledSkillsRoot,appServerClient:$3})}catch(e){try{console.warn(`Failed to load recommended skills, using local skills only`,e)}catch{}return{skills:[],repositories:[],sections:[]}}}',
    "技能推荐列表失败时不阻断本地技能列表"
  );
  return next;
}

export function patchPluginSkillLocalListFallback(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }
  const source = fs.readFileSync(mainFile[0], "utf8");
  const patched = patchPluginSkillLocalListFallbackSource(source);
  if (patched === source) {
    log(`已存在插件/技能本地列表兜底补丁：${path.basename(mainFile[0])}`);
    return;
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已补丁插件/技能本地列表兜底：${path.basename(mainFile[0])}`);
}

export function patchBrowserNativePipeDiagnosticsSource(source) {
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

export function patchBrowserNativePipeDiagnostics(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }

  const source = fs.readFileSync(mainFile[0], "utf8");
  const patched = patchBrowserNativePipeDiagnosticsSource(source);
  if (patched === source) {
    log(`已存在 Browser nativePipe 诊断日志：${path.basename(mainFile[0])}`);
    return;
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已注入 Browser nativePipe 诊断日志：${path.basename(mainFile[0])}`);
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

export function patchBrowserNativePipePeerAuthorizationSource(source) {
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

export function patchBrowserNativePipePeerAuthorization(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }

  const source = fs.readFileSync(mainFile[0], "utf8");
  const patched = patchBrowserNativePipePeerAuthorizationSource(source);
  if (patched === source) {
    log(`已存在 Browser nativePipe peer authorization 补丁：${path.basename(mainFile[0])}`);
    return;
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已禁用 Browser nativePipe peer authorization 签名门禁：${path.basename(mainFile[0])}`);
}

export function patchBrowserUseIabExistingTabPromotionSource(source) {
  if (source.includes("ruizhiBrowserUseIabPromoteExistingTab")) {
    return source;
  }

  const pattern =
    /function ([A-Za-z_$][\w$]*)\(\{browserSessionRegistry:([A-Za-z_$][\w$]*),browserTabId:([A-Za-z_$][\w$]*),conversationId:([A-Za-z_$][\w$]*),options:\{isBrowserUseTab:([A-Za-z_$][\w$]*)=!1\}=\{\},tabBudget:([A-Za-z_$][\w$]*),windowManager:([A-Za-z_$][\w$]*),windows:([A-Za-z_$][\w$]*),windowState:([A-Za-z_$][\w$]*)\}\)\{let ([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(\9,\4,\3\),([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*)\(\{browserTabId:\10,conversationId:\4\}\),([A-Za-z_$][\w$]*)=\9\.threads\.get\(\12\);if\(\14!=null\)return \14;/;
  if (!pattern.test(source)) {
    throw new Error("补丁点不存在：Browser Use IAB 复用标签页类型提升");
  }

  const helper = "function ruizhiBrowserUseIabPromoteExistingTab(e,t){if(t===!0&&e?.isBrowserUsePage!==!0){e.isBrowserUsePage=!0;try{console.info(`[ruizhi][browser] ruizhiBrowserUseIabPromoteExistingTab`,{browserTabId:e.browserTabId,conversationId:e.conversationId})}catch{}}return e}";
  return source.replace(pattern, (match, ...groups) => {
    const isBrowserUseTabName = groups[4];
    const existingStateName = groups[13];
    return `${helper}${match.slice(0, -`${existingStateName};`.length)}ruizhiBrowserUseIabPromoteExistingTab(${existingStateName},${isBrowserUseTabName});`;
  });
}

export function patchBrowserSidebarCommentModeStatusJsonGuardSource(source) {
  if (source.includes("ruizhiParseBrowserSidebarCommentModeStatus")) {
    return source;
  }

  const functionPattern = /function ([A-Za-z_$][\w$]*)\(\{appServerClient:([A-Za-z_$][\w$]*),desktopApiOptions:([A-Za-z_$][\w$]*)=([A-Za-z_$][\w$]*),now:([A-Za-z_$][\w$]*)=Date\.now\}\)/;
  const parsePattern = /([A-Za-z_$][\w$]*)\.ok\?([A-Za-z_$][\w$]*)\.parse\(JSON\.parse\(await \1\.text\(\)\)\):\(([A-Za-z_$][\w$]*)\(\)\.warning\(`browser sidebar comment mode site status request failed`/;
  if (!functionPattern.test(source) || !parsePattern.test(source)) {
    throw new Error("补丁点不存在：Browser sidebar comment mode site status JSON 保护");
  }

  const helper = "function ruizhiParseBrowserSidebarCommentModeStatus(e,t,n){try{let r=String(n??``).trim();if(r.length===0||r[0]===`<`)return t().warning(`browser sidebar comment mode site status returned non-json`,{safe:{},sensitive:{}}),null;return e.parse(JSON.parse(r))}catch(e){return t().warning(`browser sidebar comment mode site status json parse failed`,{safe:{},sensitive:{error:e}}),null}}";
  return source
    .replace(functionPattern, `${helper}$&`)
    .replace(parsePattern, (match, responseName, schemaName, loggerName) => {
      return `${responseName}.ok?ruizhiParseBrowserSidebarCommentModeStatus(${schemaName},${loggerName},await ${responseName}.text()):(${loggerName}().warning(\`browser sidebar comment mode site status request failed\``;
    });
}

export function patchBrowserUseIabOpenStabilitySource(source) {
  let patched = patchBrowserUseIabExistingTabPromotionSource(source);
  patched = patchBrowserSidebarCommentModeStatusJsonGuardSource(patched);
  return patched;
}

export function patchBrowserUseIabOpenStability(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const mainFile = fs.readdirSync(buildDir)
    .filter((name) => /^main-.*\.js$/.test(name))
    .map((name) => path.join(buildDir, name));
  if (mainFile.length !== 1) {
    throw new Error(`Electron main bundle 匹配数量异常：${mainFile.length}`);
  }

  const source = fs.readFileSync(mainFile[0], "utf8");
  const patched = patchBrowserUseIabOpenStabilitySource(source);
  if (patched === source) {
    log(`已存在 Browser Use IAB 首次打开稳定性补丁：${path.basename(mainFile[0])}`);
    return;
  }
  fs.writeFileSync(mainFile[0], patched, "utf8");
  log(`已补丁 Browser Use IAB 首次打开稳定性：${path.basename(mainFile[0])}`);
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

function findOneFileByContent(dir, namePattern, contentPattern, description) {
  const candidates = walkFiles(dir).filter((filePath) => {
    if (!namePattern.test(path.basename(filePath))) return false;
    try {
      return contentPattern.test(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) return false;
      throw error;
    }
  });
  if (candidates.length !== 1) {
    throw new Error(`${description} 匹配数量异常：${candidates.length}`);
  }
  return candidates[0];
}

function findFilesByContent(dir, namePattern, contentPattern) {
  return walkFiles(dir).filter((filePath) => {
    if (!namePattern.test(path.basename(filePath))) return false;
    if (!fs.existsSync(filePath)) return false;
    try {
      return contentPattern.test(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) return false;
      throw error;
    }
  });
}

function replaceExact(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`Patch point not found: ${label}`);
  }
  return source.replace(from, to);
}

function replaceRegex(source, pattern, to, label) {
  if (!pattern.test(source)) {
    throw new Error(`Patch point not found: ${label}`);
  }
  return source.replace(pattern, to);
}

function writePatchedFile(filePath, transform) {
  const original = fs.readFileSync(filePath, "utf8");
  const patched = transform(original);
  if (patched !== original) {
    fs.writeFileSync(filePath, patched, "utf8");
  }
  return patched !== original;
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

  let output;
  try {
    output = execFileSync(exePath, ["--version"], {
      encoding: "utf8",
      timeout: 15000,
      windowsHide: true
    }).trim();
  } catch (error) {
    if (error?.code === "ETIMEDOUT") {
      console.warn(`Codex runtime 版本读取超时，使用 client_version=0.0.0：${exePath}`);
      return "0.0.0";
    }
    throw error;
  }
  const match = output.match(/\b(\d+\.\d+\.\d+)(?:[-+\s]|$)/);
  if (!match) {
    throw new Error(`无法从 Codex runtime 版本输出解析 client_version：${output}`);
  }

  return match[1];
}

export function normalizeModelCatalogForClientVersion(catalog, clientVersion) {
  const normalized = JSON.parse(JSON.stringify(catalog));
  if (!Array.isArray(normalized.models) || normalized.models.length === 0) {
    throw new Error("锐捷模型目录缺少 models 数组");
  }

  for (const model of normalized.models) {
    if (!model || typeof model.slug !== "string" || !model.slug) {
      throw new Error("锐捷模型目录存在无效模型 slug");
    }
    if (model.visibility !== "list" && model.visibility !== "hide" && model.visibility !== "none") {
      throw new Error(`锐捷模型 ${model.slug} 的 visibility 无效：${model.visibility}`);
    }
  }

  applyRuizhiModelCatalogCompatibilityPatches(normalized);
  normalized.client_version = clientVersion;
  normalized.fetched_at = new Date().toISOString();
  return normalized;
}

export function applyRuizhiModelCatalogCompatibilityPatches(catalog) {
  if (!catalog || typeof catalog !== "object" || !Array.isArray(catalog.models)) return catalog;
  catalog.models = catalog.models.filter((model) => !isNonChatModelCatalogEntry(model));
  for (const model of catalog.models) {
    if (!model || typeof model !== "object") continue;
    model.input_modalities = ["text", "image"];
    model.inputModalities = model.input_modalities;
    if (!Array.isArray(model.supported_reasoning_levels) || model.supported_reasoning_levels.length === 0) {
      model.supported_reasoning_levels = defaultReasoningLevels();
    }
    if (typeof model.default_reasoning_level !== "string" || model.default_reasoning_level.length === 0) {
      model.default_reasoning_level = "medium";
    }
    if (!Array.isArray(model.supported_reasoning_efforts) || model.supported_reasoning_efforts.length === 0) {
      model.supported_reasoning_efforts = defaultReasoningEfforts();
    }
    model.supportedReasoningEfforts = model.supported_reasoning_levels.map((entry) => ({
      reasoningEffort: entry.effort,
      description: entry.description ?? entry.effort,
    }));
    model.defaultReasoningEffort = model.default_reasoning_level;
    if (typeof model.slug === "string" && /^qwen/i.test(model.slug)) {
      model.base_instructions = appendDesktopPluginControlGuidance(model.base_instructions);
      if (model.model_messages && typeof model.model_messages === "object") {
        model.model_messages.instructions_template = appendDesktopPluginControlGuidance(model.model_messages.instructions_template);
      }
    }
  }
  return catalog;
}

function defaultReasoningEfforts() {
  return ["minimal", "low", "medium", "high", "xhigh"];
}

function ensureTextAndImageInputModalities(value) {
  const modalities = Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 0) : [];
  for (const modality of ["text", "image"]) {
    if (!modalities.includes(modality)) {
      modalities.push(modality);
    }
  }
  return modalities;
}

function isNonChatModelCatalogEntry(model) {
  const id = [
    model?.slug,
    model?.id,
    model?.name,
    model?.display_name,
    model?.displayName,
  ].map((value) => String(value ?? "").trim().toLowerCase()).filter(Boolean).join(" ");
  if (!id) return false;
  return /(^|[\s/_-])(?:gpt-)?image\d*(?=$|[\s/_-])/.test(id) ||
    /(^|[\s/_-])dall-e(?=$|[\s/_-])/.test(id) ||
    /(^|[\s/_-])(?:text-)?embedding(?=$|[\s/_-])/.test(id) ||
    /(^|[\s/_-])(?:realtime|rerank|reranker)(?=$|[\s/_-])/.test(id);
}

function defaultReasoningLevels() {
  return [
    { effort: "minimal", description: "最少推理" },
    { effort: "low", description: "轻量推理" },
    { effort: "medium", description: "标准推理" },
    { effort: "high", description: "深度推理" },
    { effort: "xhigh", description: "最高推理" },
  ];
}

function appendDesktopPluginControlGuidance(value) {
  if (typeof value !== "string" || value.length === 0) return value;
  if (value.includes("plugin://browser@openai-bundled") && value.includes("mcp__node_repl__js")) return value;
  return `${value.trimEnd()}${qwenDesktopPluginControlGuidance}`;
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
    throw new Error(`锐捷模型源目录不存在：${resolved}`);
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

function removeValidationDirBestEffort(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Validation has already produced the useful signal; stale temp dirs should not fail packaging.
  }
}

function validateRuntimeAsarBridge(appRoot, config, label, options = {}) {
  const bridgeEnabled = modelBridgeEnabled(config);

  const resourcesDir = path.join(appRoot, "resources");
  const appAsarPath = path.join(resourcesDir, "app.asar");
  if (!fs.existsSync(appAsarPath)) {
    throw new Error(`${label} 缺少 app.asar：${appAsarPath}`);
  }

  const bridgePath = bridgeEnabled ? path.join(resourcesDir, ...modelBridgeRuntimeResourcePath(config)) : null;
  if (bridgeEnabled && !fs.existsSync(bridgePath)) {
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
      const buildDir = path.join(extractDir, ".vite", "build");
      const bootstrapPath = fs.existsSync(path.join(buildDir, "bootstrap.js"))
        ? path.join(buildDir, "bootstrap.js")
        : fs.existsSync(buildDir)
          ? path.join(buildDir, fs.readdirSync(buildDir).find((name) => /^bootstrap(?:-[A-Za-z0-9_]+)?\.js$/.test(name)) ?? "")
          : path.join(buildDir, "bootstrap.js");
      if (!bootstrapPath || !fs.existsSync(bootstrapPath)) {
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
        if (typeof packageJson.main !== "string" || !packageJson.main || !fs.existsSync(path.join(extractDir, packageJson.main))) {
          throw new Error(`${label} app.asar package main 入口不存在：${packageJson.main ?? "<missing>"}`);
        }
      }
      const bootstrap = fs.readFileSync(bootstrapPath, "utf8");
      const runtimeConfig = config.runtime ?? {};
      const expectedHomeEnv = runtimeConfig.homeEnv ?? "RUIZHI_HOME";
      const expectedHomeDirName = runtimeConfig.defaultHomeDirName ?? ".ruizhi";
      const expectedLocale = config.locale ?? "zh-CN";
      const expectedUserDataName = runtimeConfig.electronUserDataDirName ?? "Codex";
      if (!bootstrap.includes(`process.env.${expectedHomeEnv}=codexHome`) && !(bootstrap.includes(`ruizhiHomeEnvName=${JSON.stringify(expectedHomeEnv)}`) && bootstrap.includes("process.env[ruizhiHomeEnvName]=codexHome"))) {
        throw new Error(`${label} bootstrap missing ${expectedHomeEnv} codexHome assignment`);
      }
      if (!bootstrap.includes("process.env.CODEX_HOME=codexHome")) {
        throw new Error(`${label} bootstrap missing CODEX_HOME codexHome assignment`);
      }
      if (!bootstrap.includes(expectedHomeDirName)) {
        throw new Error(`${label} bootstrap missing default home dir ${expectedHomeDirName}`);
      }
      if (!bootstrap.includes(`appendSwitch(\`lang\`,\`${expectedLocale}\`)`) && !bootstrap.includes(`appendSwitch(\`lang\`,${JSON.stringify(expectedLocale)})`) && !bootstrap.includes(`appendSwitch("lang",${JSON.stringify(expectedLocale)})`)) {
        throw new Error(`${label} bootstrap missing forced locale ${expectedLocale}`);
      }
      const preloadPath = path.join(buildDir, "preload.js");
      if (!fs.existsSync(preloadPath)) {
        throw new Error(`${label} app.asar missing preload.js`);
      }
      const preload = fs.readFileSync(preloadPath, "utf8");
      if (!preload.includes("forceRuizhiLocale") || !preload.includes(expectedLocale)) {
        throw new Error(`${label} preload missing forced renderer locale ${expectedLocale}`);
      }
      if (!bootstrap.includes("cn.ruizhi.desktop")) {
        throw new Error(`${label} bootstrap missing independent Windows AppUserModelID`);
      }
      if (!bootstrap.includes(`getPath(\`appData\`),\`${expectedUserDataName}\``) && !bootstrap.includes(`getPath("appData"),"${expectedUserDataName}"`) && !(bootstrap.includes(`electronUserDataDirName=${JSON.stringify(expectedUserDataName)}`) && bootstrap.includes("process.env.CODEX_ELECTRON_USER_DATA_PATH=userData"))) {
        throw new Error(`${label} bootstrap missing independent userData directory ${expectedUserDataName}`);
      }
      if (/if\(!\(![A-Za-z_$][\w$]*\|\|[A-Za-z_$][\w$]*\.app\.requestSingleInstanceLock\(\)\)\)/.test(bootstrap)) {
        throw new Error(`${label} bootstrap still contains official single-instance lock`);
      }
      if (!bridgeEnabled) {
        removeValidationDirBestEffort(extractDir);
        return { bridge: false };
      }
      if ((config.models?.enabled ?? true) && bootstrap.includes("const modelCatalogEnabled=false;")) {
        throw new Error(`${label} bootstrap 仍会关闭运行态模型目录`);
      }
      if (!bootstrap.includes("startRuizhiResponsesBridge")) {
        throw new Error(`${label} bootstrap 未注入模型协议 bridge 启动逻辑`);
      }
      if (!bootstrap.includes("stableModelBridgePort") || !bootstrap.includes("RUIZHI_MODEL_PROVIDER_BASE_URL")) {
        throw new Error(`${label} bootstrap 缺少模型 bridge 端口隔离逻辑`);
      }
      if (!bootstrap.includes("ensureLoopbackNoProxy")) {
        throw new Error(`${label} bootstrap 缺少本地 bridge 代理绕过逻辑`);
      }
        if (!bootstrap.includes(bridgeBaseUrl)) {
          throw new Error(`${label} bootstrap 未指向本地模型 provider：${bridgeBaseUrl}`);
        }
        if (!bootstrap.includes("cn.ruizhi.desktop")) {
          throw new Error(`${label} bootstrap 未设置独立 Windows AppUserModelID`);
        }
        if (!bootstrap.includes(`getPath(\`appData\`),\`${expectedUserDataName}\``) && !bootstrap.includes(`getPath("appData"),"${expectedUserDataName}"`)) {
          throw new Error(`${label} bootstrap 未设置独立 userData 目录：${expectedUserDataName}`);
        }
        if (/if\(!\(![A-Za-z_$][\w$]*\|\|[A-Za-z_$][\w$]*\.app\.requestSingleInstanceLock\(\)\)\)/.test(bootstrap)) {
          throw new Error(`${label} bootstrap 仍包含官方单实例锁`);
        }
        removeValidationDirBestEffort(extractDir);
        return { bridge: true };
    } catch (error) {
      lastError = error;
      removeValidationDirBestEffort(extractDir);
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

function expectedOwlUserDataDirectoryName(config) {
  return config.runtime?.electronUserDataDirName ?? "Codex";
}

export function writeOwlUserDataDirectoryName(appRoot, config, options = {}) {
  const log = options.log ?? (() => {});
  const iniPath = path.join(appRoot, "resources", "owl-app.ini");
  const expectedName = expectedOwlUserDataDirectoryName(config);
  if (!fs.existsSync(iniPath)) {
    throw new Error(`缺少 Owl runtime 配置：${iniPath}`);
  }

  const source = fs.readFileSync(iniPath, "utf8");
  const next = /^UserDataDirectoryName=/m.test(source)
    ? source.replace(/^UserDataDirectoryName=.*$/m, `UserDataDirectoryName=${expectedName}`)
    : `${source.replace(/\s*$/, "")}\nUserDataDirectoryName=${expectedName}\n`;
  if (next !== source) {
    fs.writeFileSync(iniPath, next, "utf8");
    log(`已设置 Owl 用户数据目录：${expectedName}`);
  }
}

function validateOwlUserDataDirectoryName(appRoot, config, label) {
  const iniPath = path.join(appRoot, "resources", "owl-app.ini");
  const expectedName = expectedOwlUserDataDirectoryName(config);
  if (!fs.existsSync(iniPath)) {
    throw new Error(`${label} 缺少 Owl runtime 配置：${iniPath}`);
  }
  const source = fs.readFileSync(iniPath, "utf8");
  const match = source.match(/^UserDataDirectoryName=(.*)$/m);
  const actualName = match?.[1]?.trim();
  if (actualName !== expectedName) {
    throw new Error(`${label} Owl 用户数据目录不一致：期望 ${expectedName}，实际 ${actualName ?? "<missing>"}`);
  }
  return { owlUserDataDirectoryName: actualName };
}

export function validateRuizhiRuntimeBundle(appRoot, config, options = {}) {
  const log = options.log ?? (() => {});
  const label = options.label ?? (path.relative(projectRoot, appRoot) || appRoot);
  const resourcesDir = path.join(appRoot, "resources");
  assertInsideProject(resourcesDir);
  const owlResult = validateOwlUserDataDirectoryName(appRoot, config, label);

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
    return { count: 0, etag: null, ...owlResult, ...bridgeResult, ...environmentResult, ...marketplaceResult };
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
  return { ...catalogResult, ...owlResult, ...bridgeResult, ...environmentResult, ...marketplaceResult };
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

  const enhanceFiles = options.pageEnhanceEnabled === false
    ? (log("已跳过页面增强 renderer 与服务脚本"), { files: 0 })
    : copyPageEnhanceRuntimeResources(resourcesDir, { log });
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
  const sourceAppRoot = options.sourceAppRoot ?? path.join(projectRoot, "vendor", "codex-desktop", "windows", "current", "app");
  const sourceRoot = path.join(sourceAppRoot, "resources", "plugins", "openai-bundled");
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

  patchJsonFile(path.join(pluginsRoot, "latex", ".codex-plugin", "plugin.json"), (plugin) => {
    plugin.description = "使用内置 Tectonic、TeX Live 或 MacTeX 编译 LaTeX 和 TeX 文档。";
    plugin.interface = plugin.interface ?? {};
    plugin.interface.shortDescription = "LaTeX 编译与环境检查";
    plugin.interface.longDescription = "LaTeX 插件优先使用内置 Tectonic 编译简单项目，也可回退到系统 TeX Live 或 MacTeX，并在需要时安装 Codex 托管的完整 TeX Live runtime。";
    plugin.interface.category = "研究";
    plugin.interface.defaultPrompt = [
      "检查这台机器是否可以编译 LaTeX",
      "编译这个项目里的主 TeX 文件",
      "在没有可用 TeX Live 时安装托管 runtime"
    ];
    return plugin;
  });

  if (!writeTranslatedOpenAIPluginSkill(
    path.join(pluginsRoot, "chrome", "skills", "chrome", "SKILL.md"),
    "Chrome",
    "用户 Chrome 浏览器自动化。适用于需要 cookies、登录态、已有标签页、扩展，或远程认证网站的浏览器任务。",
    "/openai-bundled/plugins/chrome/skills/chrome/SKILL.md"
  )) {
    log("已跳过 Chrome skill markdown 文案补丁，目标文件不存在");
  }
  patchSkillDescription(
    path.join(pluginsRoot, "latex", "skills", "latex-compile", "SKILL.md"),
    "使用内置 Tectonic、系统 TeX Live 或 MacTeX 编译 LaTeX 和 TeX 文档。"
  );
  patchSkillDescription(
    path.join(pluginsRoot, "latex", "skills", "latex-doctor", "SKILL.md"),
    "检查本机 LaTeX 编译环境，判断 Tectonic、TeX Live、MacTeX 或托管 runtime 是否可用。"
  );
  patchSkillDescription(
    path.join(pluginsRoot, "latex", "skills", "texlive-runtime-installer", "SKILL.md"),
    "在没有可用系统 LaTeX 环境时安装 Codex 托管的 TeX Live runtime。"
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
    "S=[...n.flatMap(e=>[`computer-use@${e}`,`browser@${e}`,`chrome@${e}`,`chrome-internal@${e}`]),`spreadsheets@openai-primary-runtime`,`presentations@openai-primary-runtime`];",
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
      "function ruizhiOpenAIPluginDescription(e){let t=[e?.plugin?.id,e?.plugin?.name,e?.displayName,e?.summary?.id,e?.summary?.name].map(e=>String(e??``).toLowerCase()).join(` `),n=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.plugin?.id,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);if(!/(openai|codex official)/.test(n)||/(ruijie|local plugins?)/.test(n))return null;if(t.includes(`google-calendar`))return`Google 日历：查看日程、安排会议和管理日历。`;if(t.includes(`google-drive`))return`Google 云端硬盘：访问 Drive、Docs、Sheets 和 Slides 文件。`;if(t.includes(`gmail`))return`Gmail：读取、搜索、撰写和管理邮件。`;if(t.includes(`slack`))return`Slack：搜索消息、查看频道并处理协作对话。`;if(t.includes(`linear`))return`Linear：查找和引用 issue、项目与工作流。`;if(t.includes(`github`))return`GitHub：查看仓库、PR、issue 和代码协作内容。`;if(t.includes(`figma`))return`Figma：读取设计文件、生成实现计划和处理设计系统。`;if(t.includes(`notion`))return`Notion：检索知识库、整理资料和写入页面。`;if(t.includes(`canva`))return`Canva：搜索、创建和编辑设计。`;if(t.includes(`openai-developers`))return`OpenAI Developers：构建 OpenAI API、Agents SDK 和 ChatGPT Apps。`;if(t.includes(`outlook-calendar`))return`Outlook 日历：查看日程、安排会议和管理日历。`;if(t.includes(`outlook-email`))return`Outlook 邮箱：读取、搜索、撰写和管理邮件。`;if(t.includes(`sharepoint`))return`SharePoint：访问团队文档和协作文件。`;if(t.includes(`teams`))return`Microsoft Teams：查看和处理团队协作内容。`;if(t.includes(`computer-use`))return`Computer Use：操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。`;if(t.includes(`chrome`))return`Chrome：控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。`;if(t.includes(`latex-tectonic`))return`LaTeX Tectonic：使用内置 Tectonic 编译 LaTeX 和 TeX 文档。`;if(t.includes(`build-macos-apps`))return`Build macOS Apps：构建、运行、测试、签名和排查 macOS 应用。`;if(t.includes(`spreadsheets`))return`Spreadsheets：读取、编辑和整理电子表格数据。`;if(t.includes(`presentations`))return`Presentations：读取、编辑和整理演示文稿。`;return null}function h(e,t){let n=p(e);if(n!=null)return t.formatMessage(f[n]);let r=ruizhiOpenAIPluginDescription(e);if(r!=null)return r;let i=l(e.plugin.interface?.defaultPrompt);if(i!=null)return i;let a=e.description?.trim();return a==null||a.length===0?null:a}"
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
    "chrome": "控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。",
    "latex": "使用内置 Tectonic、TeX Live 或 MacTeX 编译 LaTeX 和 TeX 文档。",
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
    "chrome": "Chrome 让 Codex 使用你的 Chrome 浏览器处理需要现有浏览器状态的任务，包括已打开的标签页、cookies、扩展和已经登录的网站。它可以导航、查看页面、点击、输入和截图。",
    "latex": "LaTeX 插件优先使用内置 Tectonic 编译简单项目，也可回退到系统 TeX Live 或 MacTeX，并在需要时安装 Codex 托管的完整 TeX Live runtime。",
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

  return `function ruizhiSkillPreviewMarkdown(e,t){let n=String(t??\`\`).replace(/\\\\/g,\`/\`).toLowerCase();if(n.includes(\`/openai-bundled/plugins/chrome/skills/chrome/skill.md\`)||n.includes(\`/openai-bundled/chrome/\`)&&n.includes(\`/skills/chrome/skill.md\`))return ${JSON.stringify(chromeSkill)};if(n.includes(\`/openai-bundled/plugins/latex/skills/\`)||n.includes(\`/openai-bundled/plugins/latex-tectonic/skills/latex-tectonic/skill.md\`)||n.includes(\`/openai-bundled/latex/\`)&&n.includes(\`/skills/\`)||n.includes(\`/openai-bundled/latex-tectonic/\`)&&n.includes(\`/skills/latex-tectonic/skill.md\`))return ${JSON.stringify(latexSkill)};return e}`;
}

function translatedOpenAIPluginSkillMarkdown(previewPath) {
  return new Function(`${openAIPluginSkillPreviewFunctionSource()}; return ruizhiSkillPreviewMarkdown("", ${JSON.stringify(previewPath)});`)();
}

function writeTranslatedOpenAIPluginSkill(skillPath, name, description, previewPath) {
  if (!fs.existsSync(skillPath)) {
    return false;
  }

  const body = translatedOpenAIPluginSkillMarkdown(previewPath).trim();
  fs.writeFileSync(
    skillPath,
    `---\nname: ${name}\ndescription: ${JSON.stringify(description)}\n---\n\n${body}\n`,
    "utf8"
  );
  return true;
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
      "function ruizhiOpenAIPluginInstallDescription(e){let t=[e?.plugin?.id,e?.plugin?.name,e?.displayName,e?.summary?.id,e?.summary?.name].map(e=>String(e??``).toLowerCase()).join(` `),n=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.plugin?.id,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);if(!/(openai|codex official)/.test(n)||/(ruijie|local plugins?)/.test(n))return null;if(t.includes(`google-calendar`))return`Google 日历：查看日程、安排会议和管理日历。`;if(t.includes(`google-drive`))return`Google 云端硬盘：访问 Drive、Docs、Sheets 和 Slides 文件。`;if(t.includes(`gmail`))return`Gmail：读取、搜索、撰写和管理邮件。`;if(t.includes(`slack`))return`Slack：搜索消息、查看频道并处理协作对话。`;if(t.includes(`linear`))return`Linear：查找和引用 issue、项目与工作流。`;if(t.includes(`github`))return`GitHub：查看仓库、PR、issue 和代码协作内容。`;if(t.includes(`figma`))return`Figma：读取设计文件、生成实现计划和处理设计系统。`;if(t.includes(`notion`))return`Notion：检索知识库、整理资料和写入页面。`;if(t.includes(`canva`))return`Canva：搜索、创建和编辑设计。`;if(t.includes(`openai-developers`))return`OpenAI Developers：构建 OpenAI API、Agents SDK 和 ChatGPT Apps。`;if(t.includes(`outlook-calendar`))return`Outlook 日历：查看日程、安排会议和管理日历。`;if(t.includes(`outlook-email`))return`Outlook 邮箱：读取、搜索、撰写和管理邮件。`;if(t.includes(`sharepoint`))return`SharePoint：访问团队文档和协作文件。`;if(t.includes(`teams`))return`Microsoft Teams：查看和处理团队协作内容。`;if(t.includes(`computer-use`))return`Computer Use：操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。`;if(t.includes(`chrome`))return`Chrome：控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。`;if(t.includes(`latex-tectonic`))return`LaTeX Tectonic：使用内置 Tectonic 编译 LaTeX 和 TeX 文档。`;if(t.includes(`build-macos-apps`))return`Build macOS Apps：构建、运行、测试、签名和排查 macOS 应用。`;if(t.includes(`spreadsheets`))return`Spreadsheets：读取、编辑和整理电子表格数据。`;if(t.includes(`presentations`))return`Presentations：读取、编辑和整理演示文稿。`;return null}function Nt(e){let t=ruizhiOpenAIPluginInstallDescription(e);return t??(e.plugin.interface?.longDescription?.trim()||e.plugin.interface?.shortDescription?.trim()||e.description?.trim()||null)}"
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
      "function ruizhiOpenAIPluginDetailDescription(e){let t=[e?.summary?.id,e?.summary?.name,e?.summary?.interface?.displayName,e?.summary?.interface?.shortDescription].map(e=>String(e??``).toLowerCase()).join(` `),n=[e?.marketplaceName,e?.marketplaceDisplayName,e?.remoteMarketplaceName,e?.summary?.source?.type,e?.summary?.id].map(e=>String(e??``).toLowerCase()).join(` `);if(!/(openai|codex official)/.test(n)||/(ruijie|local plugins?)/.test(n))return null;if(t.includes(`google-calendar`))return`Google 日历：查看日程、安排会议和管理日历。`;if(t.includes(`google-drive`))return`Google 云端硬盘：访问 Drive、Docs、Sheets 和 Slides 文件。`;if(t.includes(`gmail`))return`Gmail：读取、搜索、撰写和管理邮件。`;if(t.includes(`slack`))return`Slack：搜索消息、查看频道并处理协作对话。`;if(t.includes(`linear`))return`Linear：查找和引用 issue、项目与工作流。`;if(t.includes(`github`))return`GitHub：查看仓库、PR、issue 和代码协作内容。`;if(t.includes(`figma`))return`Figma：读取设计文件、生成实现计划和处理设计系统。`;if(t.includes(`notion`))return`Notion：检索知识库、整理资料和写入页面。`;if(t.includes(`canva`))return`Canva：搜索、创建和编辑设计。`;if(t.includes(`openai-developers`))return`OpenAI Developers：构建 OpenAI API、Agents SDK 和 ChatGPT Apps。`;if(t.includes(`outlook-calendar`))return`Outlook 日历：查看日程、安排会议和管理日历。`;if(t.includes(`outlook-email`))return`Outlook 邮箱：读取、搜索、撰写和管理邮件。`;if(t.includes(`sharepoint`))return`SharePoint：访问团队文档和协作文件。`;if(t.includes(`teams`))return`Microsoft Teams：查看和处理团队协作内容。`;if(t.includes(`computer-use`))return`Computer Use：操作浏览器或桌面界面，用于点击、输入和读取屏幕内容。`;if(t.includes(`chrome`))return`Chrome：控制用户 Chrome 浏览器，适用于需要登录态、cookies 或已有标签页的任务。`;if(t.includes(`latex-tectonic`))return`LaTeX Tectonic：使用内置 Tectonic 编译 LaTeX 和 TeX 文档。`;if(t.includes(`build-macos-apps`))return`Build macOS Apps：构建、运行、测试、签名和排查 macOS 应用。`;if(t.includes(`spreadsheets`))return`Spreadsheets：读取、编辑和整理电子表格数据。`;if(t.includes(`presentations`))return`Presentations：读取、编辑和整理演示文稿。`;return null}function _i(e){return ruizhiOpenAIPluginDetailDescription(e)??e.summary.interface?.shortDescription??e.description??null}function vi(e){let t=ruizhiOpenAIPluginDetailDescription(e);if(t!=null)return null;let n=e.summary.interface?.longDescription??e.description??e.summary.interface?.shortDescription??null;return n===_i(e)?null:n}"
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
  "锐捷-图片生成": {
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

function preloadPageEnhanceIntegrationSnippet(config, appVersion = config.version) {
  const enhanceConfig = pageEnhanceBootstrapConfig(config, appVersion);
  const locale = config.locale ?? "zh-CN";
  const localeLanguage = locale.split("-")[0] || locale;
  return `
  /* ruizhi-page-enhance-preload:start */
${pageEnhanceRendererInstallerSource()}
  const ruizhiForcedLocale=${jsonLiteral(locale)};
  const ruizhiForcedLanguage=${jsonLiteral(localeLanguage)};
  function forceRuizhiLocale(){
    try{
      Object.defineProperty(Navigator.prototype,"language",{configurable:true,get(){return ruizhiForcedLocale}});
      Object.defineProperty(Navigator.prototype,"languages",{configurable:true,get(){return [ruizhiForcedLocale,ruizhiForcedLanguage]}});
    }catch{}
    try{document.documentElement.lang=ruizhiForcedLocale}catch{}
    try{
      for(const storage of [globalThis.localStorage,globalThis.sessionStorage]){
        if(!storage)continue;
        for(const key of ["locale","language","i18nextLng","chatgpt.locale","chatgpt.language","oai/apps/locale","oai/apps/language"]){
          try{storage.setItem(key,ruizhiForcedLocale)}catch{}
        }
      }
    }catch{}
  }
  forceRuizhiLocale();
  const pageEnhanceConfig=${jsonLiteral(enhanceConfig)};
  api.enhance={
    call:(route,payload)=>ipcRenderer.invoke("ruizhi:enhance:call",route,payload||{}),
    getSettings:()=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/get",{}),
    setSettings:patch=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/set",patch||{})
  };
  try{globalThis.ruizhiDesktop=api}catch{}
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
  /* ruizhi-page-enhance-preload:end */
`;
}

function preloadPageEnhanceFallbackSnippet(config, appVersion = config.version) {
  const enhanceConfig = pageEnhanceBootstrapConfig(config, appVersion);
  const locale = config.locale ?? "zh-CN";
  const localeLanguage = locale.split("-")[0] || locale;
  return `
/* ruizhi-page-enhance-preload:start */
(()=>{try{
${pageEnhanceRendererInstallerSource()}
  const ruizhiForcedLocale=${jsonLiteral(locale)};
  const ruizhiForcedLanguage=${jsonLiteral(localeLanguage)};
  function forceRuizhiLocale(){
    try{
      Object.defineProperty(Navigator.prototype,"language",{configurable:true,get(){return ruizhiForcedLocale}});
      Object.defineProperty(Navigator.prototype,"languages",{configurable:true,get(){return [ruizhiForcedLocale,ruizhiForcedLanguage]}});
    }catch{}
    try{document.documentElement.lang=ruizhiForcedLocale}catch{}
    try{
      for(const storage of [globalThis.localStorage,globalThis.sessionStorage]){
        if(!storage)continue;
        for(const key of ["locale","language","i18nextLng","chatgpt.locale","chatgpt.language","oai/apps/locale","oai/apps/language"]){
          try{storage.setItem(key,ruizhiForcedLocale)}catch{}
        }
      }
    }catch{}
  }
  forceRuizhiLocale();
  const pageEnhanceConfig=${jsonLiteral(enhanceConfig)};
  const ipcRenderer=e.ipcRenderer;
  const contextBridge=e.contextBridge;
  const api={enhance:{
    call:(route,payload)=>ipcRenderer.invoke("ruizhi:enhance:call",route,payload||{}),
    getSettings:()=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/get",{}),
    setSettings:patch=>ipcRenderer.invoke("ruizhi:enhance:call","/settings/set",patch||{})
  }};
  try{contextBridge.exposeInMainWorld("ruizhiDesktop",api)}catch{}
  function injectRuizhiPageEnhance(){
    if(!pageEnhanceConfig.enabled||window.__RUIZHI_PAGE_ENHANCE_SCRIPT_INJECTED__)return;
    window.__RUIZHI_PAGE_ENHANCE_SCRIPT_INJECTED__=true;
    try{
      const installer=globalThis.__RUIZHI_INSTALL_PAGE_ENHANCE__;
      if(typeof installer!=="function")throw new Error("页面增强 installer 不可用");
      installer({window,document,ruizhiDesktop:api,config:pageEnhanceConfig});
    }catch(error){console.error("ruizhi page enhance inject failed",error);}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",injectRuizhiPageEnhance,{once:true});else injectRuizhiPageEnhance();
}catch(error){console.error("ruizhi preload fallback integration failed",error)}})();
/* ruizhi-page-enhance-preload:end */
`;
}

function preloadForcedLocaleSnippet(config) {
  const locale = config.locale ?? "zh-CN";
  const localeLanguage = locale.split("-")[0] || locale;
  return `
/* ruizhi-page-enhance-preload:start */
(()=>{try{
  const ruizhiForcedLocale=${jsonLiteral(locale)};
  const ruizhiForcedLanguage=${jsonLiteral(localeLanguage)};
  function forceRuizhiLocale(){
    try{
      Object.defineProperty(Navigator.prototype,"language",{configurable:true,get(){return ruizhiForcedLocale}});
      Object.defineProperty(Navigator.prototype,"languages",{configurable:true,get(){return [ruizhiForcedLocale,ruizhiForcedLanguage]}});
    }catch{}
    try{document.documentElement.lang=ruizhiForcedLocale}catch{}
    try{
      for(const storage of [globalThis.localStorage,globalThis.sessionStorage]){
        if(!storage)continue;
        for(const key of ["locale","language","i18nextLng","chatgpt.locale","chatgpt.language","oai/apps/locale","oai/apps/language"]){
          try{storage.setItem(key,ruizhiForcedLocale)}catch{}
        }
      }
    }catch{}
  }
  forceRuizhiLocale();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",forceRuizhiLocale,{once:true});
}catch(error){console.error("ruizhi locale preload failed",error)}})();
/* ruizhi-page-enhance-preload:end */
`;
}

function ensurePreloadPageEnhanceIntegration(preloadPath, config, options = {}) {
  const log = options.log ?? (() => {});
  const appVersion = options.appVersion ?? config.version;
  let source = fs.readFileSync(preloadPath, "utf8");
  let next = source.replace(/\/\* ruizhi-page-enhance-preload:start \*\/[\s\S]*?\/\* ruizhi-page-enhance-preload:end \*\/\r?\n?/g, "");
  if (!pageEnhanceEnabled(config)) {
    const sourceMapAnchor = "\n//# sourceMappingURL=preload.js.map";
    if (!next.includes("function forceRuizhiLocale")) {
      if (!next.includes(sourceMapAnchor)) {
        throw new Error("preload 中文 locale 注入点不存在");
      }
      next = next.replace(sourceMapAnchor, `${preloadForcedLocaleSnippet(config)}${sourceMapAnchor}`);
    }
    if (next !== source) {
      fs.writeFileSync(preloadPath, next, "utf8");
      log("已注入中文 locale preload，跳过页面增强 bridge");
    }
    return;
  }
  if (next.includes("enhance:{") || next.includes("enhance={")) {
    return;
  }
  const exposeAnchor = '  try{contextBridge.exposeInMainWorld("ruizhiDesktop",api)}catch{}';
  if (!next.includes(exposeAnchor)) {
    const sourceMapAnchor = "\n//# sourceMappingURL=preload.js.map";
    if (!next.includes(sourceMapAnchor)) {
      throw new Error("preload 增强 bridge 注入点不存在");
    }
    next = next.replace(sourceMapAnchor, `${preloadPageEnhanceFallbackSnippet(config, appVersion)}${sourceMapAnchor}`);
    if (next !== source) {
      fs.writeFileSync(preloadPath, next, "utf8");
      log("已注入页面增强 preload fallback bridge");
    }
    return;
  }
  next = next.replace(exposeAnchor, `${preloadPageEnhanceIntegrationSnippet(config, appVersion)}${exposeAnchor}`);
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
    if (!fs.existsSync(filePath)) {
      return false;
    }
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("function _j(e){") && source.includes("loadingPage.openConfigToml");
  });

  if (!targetPath) {
    log("已跳过 VC++ 运行库错误页补丁：未找到启动错误页目标");
    return { file: null, changed: false };
  }

  const originalStart = "function _j(e){let n=(0,Z.c)(27),{fatalError:r,onReset:i}=e,a=No(),{data:o}=gc(),s=o?.platform===`win32`,{errorMessage:c,cliErrorMessage:l}=r,u;";
  const patchedStart = "function _j(e){let n=(0,Z.c)(30),{fatalError:r,onReset:i}=e,a=No(),{data:o}=gc(),s=o?.platform===`win32`,{errorMessage:c,cliErrorMessage:l}=r,ruizhiVcErrorText=[c,l].filter(Boolean).join(`\\n`),ruizhiIsVcRuntimeMissing=s&&/(3221225781|0xC0000135|STATUS_DLL_NOT_FOUND|VCRUNTIME140|VCRUNTIME140_1|MSVCP140)/i.test(ruizhiVcErrorText);if(ruizhiIsVcRuntimeMissing)return (0,$.jsx)(`div`,{className:`flex size-full items-center justify-center p-6`,children:(0,$.jsxs)(`div`,{className:`flex w-full max-w-md flex-col gap-4`,children:[(0,$.jsx)(`h2`,{className:`text-2xl font-medium`,children:`缺少运行依赖`}),(0,$.jsx)(`p`,{className:`text-token-description-foreground`,children:`锐捷需要安装 Microsoft Visual C++ 运行库才能启动。`}),(0,$.jsx)(`p`,{id:`ruizhi-vc-runtime-status`,className:`min-h-5 text-sm text-token-description-foreground`,children:`点击“安装并重启锐捷”打开安装程序。安装完成后锐捷会自动重启。`}),(0,$.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,$.jsx)(uc,{id:`ruizhi-vc-runtime-install-button`,onClick:ruizhiInstallVcRuntime,children:`安装并重启锐捷`}),(0,$.jsx)(uc,{onClick:ruizhiOpenVcRedistManualDownload,color:`outline`,children:`手动下载`})]})]})});let u;";
  const originalHelpers = "function yj(){G.dispatchMessage(`open-in-browser`,{url:Up})}";
  const patchedHelpers = `${originalHelpers}function ruizhiSetVcRuntimeStatus(e){let t=document.getElementById(\`ruizhi-vc-runtime-status\`);t&&(t.textContent=e)}function ruizhiVcRuntimeFailureMessage(e,t){let n=e?.message||String(e||\`未知错误\`),r=t?.launchLogPath?\` 日志：\`+t.launchLogPath:\`\`;return\`安装失败：\`+n+\`。请点击“手动下载”安装后重启锐捷。\`+r}async function ruizhiInstallVcRuntime(e){if(window.__ruizhiVcRuntimeInstallStarted)return;let t=e?.currentTarget||document.getElementById(\`ruizhi-vc-runtime-install-button\`),n=null;try{window.__ruizhiVcRuntimeInstallStarted=!0,t&&(t.disabled=!0,t.textContent=\`正在打开安装程序...\`),ruizhiSetVcRuntimeStatus(\`正在打开安装程序。如系统弹出权限确认，请选择“是”；如果没有看到弹窗，请检查任务栏。\`);n=await window.ruizhiDesktop?.runtime?.installVcRedist?.();if(n?.ok){ruizhiSetVcRuntimeStatus(\`安装完成，正在重启锐捷。\`),t&&(t.textContent=\`正在重启...\`);return}throw new Error(n?.error||\`install failed\`)}catch(e){window.__ruizhiVcRuntimeInstallStarted=!1,console.error(\`ruizhi vc runtime install failed\`,e,n),ruizhiSetVcRuntimeStatus(ruizhiVcRuntimeFailureMessage(e,n)),t&&(t.disabled=!1,t.textContent=\`安装并重启锐捷\`)}}function ruizhiOpenVcRedistManualDownload(){G.dispatchMessage(\`open-in-browser\`,{url:\`https://aka.ms/vc14/vc_redist.x64.exe\`})}`;

  let source = fs.readFileSync(targetPath, "utf8");
  if (source.includes("ruizhiInstallVcRuntime")) {
    log("已存在 VC++ 运行库错误页补丁");
    return { file: targetPath, changed: false };
  }
  if (!source.includes(originalStart)) {
    log("已跳过 VC++ 运行库错误页补丁（启动错误页结构已变化）");
    return { file: targetPath, changed: false };
  }
  if (!source.includes(originalHelpers)) {
    log("已跳过 VC++ 运行库错误页补丁（浏览器打开函数不存在）");
    return { file: targetPath, changed: false };
  }

  source = source.replace(originalStart, patchedStart).replace(originalHelpers, patchedHelpers);
  fs.writeFileSync(targetPath, source, "utf8");
  log(`已补丁 VC++ 运行库错误页：${path.basename(targetPath)}`);
  return { file: targetPath, changed: true };
}

function ensureWindowsBootstrapEarlyRuizhiEnv(bootstrapPath, config, options = {}) {
  const log = options.log ?? (() => {});
  const productName = config.productName ?? "锐捷";
  const runtimeConfig = config.runtime ?? {};
  const ruizhiHomeEnvName = runtimeConfig.homeEnv ?? "RUIZHI_HOME";
  const ruizhiDefaultHomeDirName = runtimeConfig.defaultHomeDirName ?? ".ruizhi";
  const electronUserDataDirName = runtimeConfig.electronUserDataDirName ?? "Codex";
  const chatGptBackendApiBaseUrl = "https://gptauth.ruijie.com.cn";
  const modelCatalogEnabledValue = modelCatalogEnabled(config);
  const marketplaceSpecs = pluginMarketplaces(config).map((marketplace) => ({
    name: marketplace.name,
    resourcePath: splitConfigPath(marketplace.resourcePath),
    installPath: splitConfigPath(marketplace.installPath),
    versionManifestPath: splitConfigPath(marketplace.versionManifestPath),
    online: marketplace.online && marketplace.online.enabled !== false
      ? {
          source: marketplace.online.source,
          ref: marketplace.online.ref,
          sparse: Array.isArray(marketplace.online.sparse) ? marketplace.online.sparse : [],
          autoUpgrade: marketplace.online.autoUpgrade === true
        }
      : null
  }));
  const preludeStart = "/* ruizhi-early-env:start */";
  const preludeEnd = "/* ruizhi-early-env:end */";
  const prelude = `${preludeStart}
(()=>{try{
  const os=require("node:os");
  const path=require("node:path");
  const fs=require("node:fs");
  const home=os.homedir();
  const resourcesRoot=process.resourcesPath||path.dirname(process.execPath);
  const productName=${JSON.stringify(productName)};
  const ruizhiHomeEnvName=${JSON.stringify(ruizhiHomeEnvName)};
  const ruizhiDefaultHomeDirName=${JSON.stringify(ruizhiDefaultHomeDirName)};
  const electronUserDataDirName=${JSON.stringify(electronUserDataDirName)};
  const chatGptBackendApiBaseUrl=${JSON.stringify(chatGptBackendApiBaseUrl)};
  const modelCatalogEnabled=${JSON.stringify(modelCatalogEnabledValue)};
  const ruizhiMarketplaceSpecs=${JSON.stringify(marketplaceSpecs)};
  const modelCatalogFile="ruizhi-model-catalog.json";
  const userModelCatalogFile="models_cache.json";
  const codexHome=(process.env[ruizhiHomeEnvName]||path.join(home,ruizhiDefaultHomeDirName)).trim();
  const appData=process.env.APPDATA||path.join(home,"AppData","Roaming");
  const userData=(process.env.CODEX_ELECTRON_USER_DATA_PATH||path.join(appData,electronUserDataDirName)).trim();
  process.env[ruizhiHomeEnvName]=codexHome;
  process.env.CODEX_HOME=codexHome;
  process.env.CODEX_ELECTRON_USER_DATA_PATH=userData;
  process.env.CODEX_API_BASE_URL=chatGptBackendApiBaseUrl;
  fs.mkdirSync(codexHome,{recursive:true});
  fs.mkdirSync(userData,{recursive:true});
  function ruizhiIsNonChatModel(model){
    const id=[model&&model.slug,model&&model.id,model&&model.name,model&&model.display_name,model&&model.displayName].map(value=>String(value??"").trim().toLowerCase()).filter(Boolean).join(" ");
    if(!id)return false;
    return /(^|[\\s/_-])(?:gpt-)?image\\d*(?=$|[\\s/_-])/.test(id)||/(^|[\\s/_-])dall-e(?=$|[\\s/_-])/.test(id)||/(^|[\\s/_-])(?:text-)?embedding(?=$|[\\s/_-])/.test(id)||/(^|[\\s/_-])(?:realtime|rerank|reranker)(?=$|[\\s/_-])/.test(id);
  }
  function ruizhiNormalizeModelCatalog(catalog){
    if(!catalog||typeof catalog!=="object"||!Array.isArray(catalog.models))return catalog;
    catalog.models=catalog.models.filter(model=>!ruizhiIsNonChatModel(model));
    for(const model of catalog.models){
      if(!model||typeof model!=="object")continue;
      model.input_modalities=["text","image"];
      model.inputModalities=model.input_modalities;
      if(!Array.isArray(model.supported_reasoning_efforts)||model.supported_reasoning_efforts.length===0)model.supported_reasoning_efforts=["minimal","low","medium","high","xhigh"];
    }
    return catalog;
  }
  function ruizhiSyncBundledModelCatalogCache(){
    if(!modelCatalogEnabled)return;
    const source=path.join(resourcesRoot,"models",modelCatalogFile);
    const target=path.join(codexHome,userModelCatalogFile);
    try{
      if(fs.existsSync(target)){
        const catalog=JSON.parse(fs.readFileSync(target,"utf8"));
        if(catalog&&typeof catalog==="object"&&Array.isArray(catalog.models)&&catalog.models.length>0){
          ruizhiNormalizeModelCatalog(catalog);
          const next=JSON.stringify(catalog,null,2)+"\\n";
          if(fs.readFileSync(target,"utf8")!==next)fs.writeFileSync(target,next,"utf8");
          return;
        }
      }
      if(!fs.existsSync(source))return;
      const catalog=JSON.parse(fs.readFileSync(source,"utf8"));
      ruizhiNormalizeModelCatalog(catalog);
      catalog.fetched_at=new Date().toISOString();
      const next=JSON.stringify(catalog,null,2)+"\\n";
      const changed=!fs.existsSync(target)||fs.readFileSync(target,"utf8")!==next;
      if(!changed)return;
      if(fs.existsSync(target)){
        const stamp=new Date().toISOString().replace(/[:.]/g,"-");
        fs.copyFileSync(target,target+".bak-early-"+stamp);
      }
      fs.writeFileSync(target,next,"utf8");
    }catch(error){
      console.warn("ruizhi early bundled model catalog sync failed",error);
    }
  }
  function ruizhiTomlString(value){
    return JSON.stringify(String(value??""));
  }
  function ruizhiTomlLines(source){
    return String(source??"").split("\\n");
  }
  function ruizhiIsTomlHeader(line){
    const trimmed=String(line??"").trim();
    return trimmed.startsWith("[")&&trimmed.endsWith("]");
  }
  function ruizhiFindTomlTable(lines,header){
    let start=-1;
    for(let index=0;index<lines.length;index+=1){
      if(String(lines[index]).trim()===header){start=index;break;}
    }
    if(start<0)return null;
    let end=lines.length;
    for(let index=start+1;index<lines.length;index+=1){
      if(ruizhiIsTomlHeader(lines[index])){end=index;break;}
    }
    return {start,end};
  }
  function ruizhiUpsertTomlTable(source,tableName,block){
    const header="["+tableName+"]";
    const lines=ruizhiTomlLines(source);
    const table=ruizhiFindTomlTable(lines,header);
    if(table){
      const replacement=block.replace(/\\n$/,"").split("\\n");
      lines.splice(table.start,table.end-table.start,...replacement);
      return lines.join("\\n").replace(/\\n*$/,"\\n");
    }
    const prefix=String(source??"").replace(/\\n*$/,"");
    return prefix+(prefix.trim().length>0?"\\n\\n":"")+block.replace(/\\n*$/,"\\n");
  }
  function ruizhiReadMarketplaceVersion(root,spec){
    const manifestPath=path.join(root,...spec.versionManifestPath);
    if(!fs.existsSync(manifestPath))return null;
    const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
    return [manifest.name||"",manifest.version||""].join("@");
  }
  function ruizhiCopyDirectoryAtomic(sourceRoot,targetRoot){
    const stagingRoot=targetRoot+".staging-early-"+process.pid+"-"+Date.now();
    fs.rmSync(stagingRoot,{recursive:true,force:true});
    try{
      fs.mkdirSync(path.dirname(stagingRoot),{recursive:true});
      fs.cpSync(sourceRoot,stagingRoot,{recursive:true,force:true});
      fs.rmSync(targetRoot,{recursive:true,force:true});
      fs.renameSync(stagingRoot,targetRoot);
    }catch(error){
      fs.rmSync(stagingRoot,{recursive:true,force:true});
      throw error;
    }
  }
  function ruizhiMarketplaceConfigBlock(spec,source){
    const online=spec.online;
    if(online&&online.source&&online.autoUpgrade===true){
      const lines=[
        "[marketplaces."+spec.name+"]",
        "source_type = "+ruizhiTomlString("git"),
        "source = "+ruizhiTomlString(online.source)
      ];
      if(online.ref)lines.push("ref = "+ruizhiTomlString(online.ref));
      if(Array.isArray(online.sparse)&&online.sparse.length>0)lines.push("sparse = "+JSON.stringify(online.sparse.map(item=>String(item))));
      lines.push("");
      return lines.join("\\n");
    }
    return [
      "[marketplaces."+spec.name+"]",
      "source_type = "+ruizhiTomlString("local"),
      "source = "+ruizhiTomlString(source),
      ""
    ].join("\\n");
  }
  function ruizhiReadMarketplaceManifest(root){
    const manifestPath=path.join(root,".agents","plugins","marketplace.json");
    if(!fs.existsSync(manifestPath))return null;
    const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
    return Array.isArray(manifest.plugins)?manifest:null;
  }
  function ruizhiIsPathInside(root,candidate){
    const base=path.resolve(root);
    const target=path.resolve(candidate);
    const normalizedBase=process.platform==="win32"?base.toLowerCase():base;
    const normalizedTarget=process.platform==="win32"?target.toLowerCase():target;
    return normalizedTarget===normalizedBase||normalizedTarget.startsWith(normalizedBase+path.sep);
  }
  function ruizhiPluginSourceRoot(marketplaceRoot,plugin){
    const sourcePath=plugin&&plugin.source&&typeof plugin.source.path==="string"?plugin.source.path:null;
    if(!sourcePath)return null;
    const sourceRoot=path.resolve(marketplaceRoot,sourcePath);
    return ruizhiIsPathInside(marketplaceRoot,sourceRoot)?sourceRoot:null;
  }
  function ruizhiReadPluginVersion(root){
    const manifestPath=path.join(root,".codex-plugin","plugin.json");
    if(!fs.existsSync(manifestPath))return null;
    const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
    return String(manifest.version||"").trim()||null;
  }
  function ruizhiPluginConfigBlock(marketplaceName,pluginName){
    return [
      "[plugins."+ruizhiTomlString(pluginName+"@"+marketplaceName)+"]",
      "enabled = true",
      ""
    ].join("\\n");
  }
  function ruizhiSyncBundledPluginMarketplaces(){
    if(!Array.isArray(ruizhiMarketplaceSpecs)||ruizhiMarketplaceSpecs.length===0)return;
    const configPath=path.join(codexHome,"config.toml");
    let next=fs.existsSync(configPath)?fs.readFileSync(configPath,"utf8"):"";
    let changed=false;
    for(const spec of ruizhiMarketplaceSpecs){
      const sourceRoot=path.join(resourcesRoot,...spec.resourcePath);
      const targetRoot=path.join(codexHome,...spec.installPath);
      try{
        const sourceVersion=ruizhiReadMarketplaceVersion(sourceRoot,spec);
        if(!sourceVersion)throw new Error("missing marketplace version: "+sourceRoot);
        const targetVersion=ruizhiReadMarketplaceVersion(targetRoot,spec);
        if(sourceVersion!==targetVersion)ruizhiCopyDirectoryAtomic(sourceRoot,targetRoot);
        if(fs.existsSync(path.join(targetRoot,".agents","plugins","marketplace.json"))){
          const updated=ruizhiUpsertTomlTable(next,"marketplaces."+spec.name,ruizhiMarketplaceConfigBlock(spec,targetRoot));
          if(updated!==next){next=updated;changed=true;}
        }
        const manifest=ruizhiReadMarketplaceManifest(targetRoot);
        if(!manifest)continue;
        const cacheRoot=path.join(codexHome,"plugins","cache",spec.name);
        for(const plugin of manifest.plugins){
          if(!plugin||typeof plugin.name!=="string"||plugin.name.length===0)continue;
          const pluginSource=ruizhiPluginSourceRoot(targetRoot,plugin);
          if(!pluginSource)continue;
          const version=ruizhiReadPluginVersion(pluginSource);
          if(!version)continue;
          ruizhiCopyDirectoryAtomic(pluginSource,path.join(cacheRoot,plugin.name,version));
          const tableName="plugins."+ruizhiTomlString(plugin.name+"@"+spec.name);
          if(!ruizhiFindTomlTable(ruizhiTomlLines(next),"["+tableName+"]")){
            const updated=ruizhiUpsertTomlTable(next,tableName,ruizhiPluginConfigBlock(spec.name,plugin.name));
            if(updated!==next){next=updated;changed=true;}
          }
        }
      }catch(error){
        console.warn("ruizhi early marketplace sync failed",spec.name,error);
      }
    }
    if(changed){
      fs.mkdirSync(path.dirname(configPath),{recursive:true});
      fs.writeFileSync(configPath,next,"utf8");
    }
  }
  ruizhiSyncBundledModelCatalogCache();
  ruizhiSyncBundledPluginMarketplaces();
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
  log("已注入 Windows bootstrap 早期锐捷环境初始化");
}

function ruijieProviderBootstrapBlock() {
  return `/* ruizhi-provider-config:start */
    function tomlLines(source){return String(source??"").split("\\n");}
    function joinTomlLines(lines){return lines.join("\\n").replace(/\\n*$/,"\\n");}
    function tomlKeyLine(key,value){return key+" = "+JSON.stringify(String(value));}
    function isTomlHeader(line){const trimmed=String(line??"").trim();return trimmed.startsWith("[")&&trimmed.endsWith("]");}
    function tomlKey(line){const trimmed=String(line??"").trimStart();const match=trimmed.match(/^([A-Za-z0-9_.-]+)\\s*=/);return match?match[1]:null;}
    function findTomlTable(lines,header){let start=-1;for(let index=0;index<lines.length;index+=1){if(String(lines[index]).trim()===header){start=index;break;}}if(start<0)return null;let end=lines.length;for(let index=start+1;index<lines.length;index+=1){if(isTomlHeader(lines[index])){end=index;break;}}return {start,end};}
    function upsertTopLevelTomlKey(source,key,value){const lines=tomlLines(source);const next=tomlKeyLine(key,value);let firstTable=lines.length;for(let index=0;index<lines.length;index+=1){if(isTomlHeader(lines[index])){firstTable=index;break;}}for(let index=0;index<firstTable;index+=1){if(tomlKey(lines[index])===key){if(lines[index]!==next)lines[index]=next;return joinTomlLines(lines);}}let insertAt=firstTable;while(insertAt>0&&String(lines[insertAt-1]).trim()==="")insertAt-=1;lines.splice(insertAt,0,next);return joinTomlLines(lines);}
    function patchRuijieProviderConfig(source){
      const header="[model_providers.ruijie-uniapi]";
      const lines=tomlLines(source);
      let table=findTomlTable(lines,header);
      if(!table){
        const block=[header,tomlKeyLine("name","ruijie-uniapi"),tomlKeyLine("env_key","RUIJIE_UNIAPI_KEY"),tomlKeyLine("base_url",ruijieProviderBaseUrl),tomlKeyLine("wire_api","responses"),"requires_openai_auth = true","chat_model_prefixes = "+JSON.stringify(ruijieChatModelPrefixes.map(item=>String(item))),""].join("\\n");
        const prefix=String(source??"").replace(/\\n*$/,"\\n");
        return prefix+(prefix.trim().length>0?"\\n":"")+block;
      }
      let {start,end}=table;
      const requiredFields={name:tomlKeyLine("name","ruijie-uniapi"),env_key:tomlKeyLine("env_key","RUIJIE_UNIAPI_KEY"),wire_api:tomlKeyLine("wire_api","responses"),requires_openai_auth:"requires_openai_auth = true"};
      for(const [key,line] of Object.entries(requiredFields)){let found=false;for(let index=start+1;index<end;index+=1){if(tomlKey(lines[index])===key){found=true;break;}}if(!found){lines.splice(end,0,line);end+=1;}}
      let baseUrlPatched=false;
      for(let index=start+1;index<end;index+=1){if(tomlKey(lines[index])==="base_url"){const replacement=tomlKeyLine("base_url",ruijieProviderBaseUrl);if(lines[index]!==replacement)lines[index]=replacement;baseUrlPatched=true;break;}}
      if(!baseUrlPatched){let insertAt=end;for(let index=start+1;index<end;index+=1){const key=tomlKey(lines[index]);if(key==="api_key"||key==="env_key")insertAt=index+1;}lines.splice(insertAt,0,tomlKeyLine("base_url",ruijieProviderBaseUrl));end+=1;}
      if(!Array.isArray(ruijieChatModelPrefixes)||ruijieChatModelPrefixes.length===0)return joinTomlLines(lines);
      for(let index=start+1;index<end;index+=1){if(tomlKey(lines[index])==="chat_model_prefixes")return joinTomlLines(lines);}
      let insertAt=end;for(let index=start+1;index<end;index+=1){if(tomlKey(lines[index])==="wire_api"){insertAt=index;break;}}
      lines.splice(insertAt,0,"chat_model_prefixes = "+JSON.stringify(ruijieChatModelPrefixes.map(item=>String(item))));
      return joinTomlLines(lines);
    }
    function syncRuijieProviderConfig(){
      const configPath=path.join(codexHome,"config.toml");
      const existing=fs.existsSync(configPath)?fs.readFileSync(configPath,"utf8"):"";
      const withLoginBase=upsertTopLevelTomlKey(existing,"chatgpt_login_base_url",chatGptBackendApiBaseUrl);
      const next=patchRuijieProviderConfig(withLoginBase);
      if(next!==existing){fs.mkdirSync(path.dirname(configPath),{recursive:true});fs.writeFileSync(configPath,next,"utf8");}
    }
    syncRuijieProviderConfig();
/* ruizhi-provider-config:end */
`;
}

function bridgeBootstrapBlock(config) {
  return `/* ruizhi-model-bridge:start */
    const userModelCatalogFile="models_cache.json";
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
    function syncModelCache(){
      if(!modelCatalogEnabled)return;
      const target=path.join(codexHome,userModelCatalogFile);
      syncBundledModelCatalogCache();
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
    function normalizeExistingModelCatalogCache(target){
      try{
        if(!fs.existsSync(target))return false;
        normalizeModelCatalogFile(target);
        return true;
      }catch(error){
        console.warn("ruizhi existing model catalog cache invalid, falling back to bundled catalog",error);
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
    function validateModelCatalogFile(filePath){
      const catalog=JSON.parse(fs.readFileSync(filePath,"utf8"));
      if(!catalog||typeof catalog!=="object"||!Array.isArray(catalog.models)||catalog.models.length===0)throw new Error("模型目录格式无效");
      return catalog;
    }
    function applyRuizhiModelCatalogCompatibilityPatches(catalog){
      if(!catalog||typeof catalog!=="object"||!Array.isArray(catalog.models))return catalog;
      catalog.models=catalog.models.filter(model=>!isNonChatModelCatalogEntry(model));
      const guidance="\\n\\n## Codex Desktop Plugin Control\\n- When the user invokes \`[@浏览器]\` or \`plugin://browser@openai-bundled\`, use the Browser plugin's trusted runtime through the \`mcp__node_repl__js\` tool and select the \`iab\` browser. Do not use \`exec_command\`, \`node -e\`, standalone Playwright, or a system browser for this plugin.\\n- Browser plugin native-pipe authorization depends on Codex turn metadata in \`nodeRepl.requestMeta\`; a separate shell process cannot provide the required \`session_id\` / \`turn_id\` and will fail as not trusted.";
      const append=value=>{
        if(typeof value!=="string"||value.length===0)return value;
        if(value.includes("plugin://browser@openai-bundled")&&value.includes("mcp__node_repl__js"))return value;
        return value.trimEnd()+guidance;
      };
      const defaultReasoningLevels=()=>[
        {effort:"minimal",description:"最少推理"},
        {effort:"low",description:"轻量推理"},
        {effort:"medium",description:"标准推理"},
        {effort:"high",description:"深度推理"},
        {effort:"xhigh",description:"最高推理"}
      ];
      const ensureTextAndImageInputModalities=value=>{
        const modalities=Array.isArray(value)?value.filter(item=>typeof item==="string"&&item.length>0):[];
        for(const modality of ["text","image"]){
          if(!modalities.includes(modality))modalities.push(modality);
        }
        return modalities;
      };
      for(const model of catalog.models){
        if(!model||typeof model!=="object")continue;
        model.input_modalities=["text","image"];
        model.inputModalities=model.input_modalities;
        if(!Array.isArray(model.supported_reasoning_levels)||model.supported_reasoning_levels.length===0)model.supported_reasoning_levels=defaultReasoningLevels();
        if(typeof model.default_reasoning_level!=="string"||model.default_reasoning_level.length===0)model.default_reasoning_level="medium";
        if(!Array.isArray(model.supported_reasoning_efforts)||model.supported_reasoning_efforts.length===0)model.supported_reasoning_efforts=["minimal","low","medium","high","xhigh"];
        model.supportedReasoningEfforts=model.supported_reasoning_levels.map(entry=>({reasoningEffort:entry.effort,description:entry.description??entry.effort}));
        model.defaultReasoningEffort=model.default_reasoning_level;
        if(typeof model.slug==="string"&&/^qwen/i.test(model.slug)){
          model.base_instructions=append(model.base_instructions);
          if(model.model_messages&&typeof model.model_messages==="object"){
            model.model_messages.instructions_template=append(model.model_messages.instructions_template);
          }
        }
      }
      return catalog;
    }
    function isNonChatModelCatalogEntry(model){
      const id=[model?.slug,model?.id,model?.name,model?.display_name,model?.displayName].map(value=>String(value??"").trim().toLowerCase()).filter(Boolean).join(" ");
      if(!id)return false;
      return /(^|[\\s/_-])(?:gpt-)?image\\d*(?=$|[\\s/_-])/.test(id)||/(^|[\\s/_-])dall-e(?=$|[\\s/_-])/.test(id)||/(^|[\\s/_-])(?:text-)?embedding(?=$|[\\s/_-])/.test(id)||/(^|[\\s/_-])(?:realtime|rerank|reranker)(?=$|[\\s/_-])/.test(id);
    }
    function normalizeModelCatalogFile(filePath){
      const catalog=validateModelCatalogFile(filePath);
      applyRuizhiModelCatalogCompatibilityPatches(catalog);
      catalog.fetched_at=new Date().toISOString();
      fs.writeFileSync(filePath,JSON.stringify(catalog,null,2)+"\\n","utf8");
      return catalog;
    }
    function normalizeUserModelCatalogCache(){
      const target=path.join(codexHome,userModelCatalogFile);
      try{
        if(!fs.existsSync(target))return false;
        const original=fs.readFileSync(target,"utf8");
        const catalog=validateModelCatalogFile(target);
        applyRuizhiModelCatalogCompatibilityPatches(catalog);
        const next=JSON.stringify(catalog,null,2)+"\\n";
        if(next===original)return false;
        fs.writeFileSync(target,next,"utf8");
        return true;
      }catch(error){
        console.warn("ruizhi model catalog post-refresh normalize failed",error);
        return false;
      }
    }
    function watchModelCatalogCache(){
      if(!modelCatalogEnabled)return;
      const target=path.join(codexHome,userModelCatalogFile);
      let timer=null;
      const schedule=()=>{
        if(timer)clearTimeout(timer);
        timer=setTimeout(()=>{
          timer=null;
          normalizeUserModelCatalogCache();
        },750);
      };
      try{
        normalizeUserModelCatalogCache();
        fs.watchFile(target,{interval:1000},(current,previous)=>{
          if(current.mtimeMs!==previous.mtimeMs||current.size!==previous.size)schedule();
        });
      }catch(error){
        console.warn("ruizhi model catalog watcher failed",error);
      }
    }
    function backupExistingModelCatalog(target){
      if(!fs.existsSync(target))return;
      const stamp=new Date().toISOString().replace(/[:.]/g,"-");
      fs.copyFileSync(target,\`\${target}.bak-\${stamp}\`);
    }
    function startModelBridge(){
      if(!modelBridgeConfig.enabled)return null;
      const scriptPath=path.join(resourcesRoot,...modelBridgeConfig.scriptResourcePath);
      if(!fs.existsSync(scriptPath))throw new Error("模型协议 bridge 脚本不存在："+scriptPath);
      const bridge=require(scriptPath).startRuizhiResponsesBridge({
        host:modelBridgeConfig.host,
        port:modelBridgeConfig.port,
        upstreamBaseUrl:openaiBaseUrl,
        authHome:codexHome,
        catalogPath:path.join(codexHome,userModelCatalogFile),
        routes:modelBridgeConfig.routes
      });
      return bridge?.baseUrl||modelProviderBaseUrl;
    }
    syncModelCache();
    watchModelCatalogCache();
    const runtimeBridgeBaseUrl=startModelBridge();
    const runtimeModelProviderBaseUrl=runtimeBridgeBaseUrl||modelProviderBaseUrl;
    process.env.CODEX_API_BASE_URL=chatGptBackendApiBaseUrl;
    process.env.RUIZHI_OPENAI_BASE_URL=openaiBaseUrl;
    process.env.RUIZHI_MODEL_PROVIDER_BASE_URL=runtimeModelProviderBaseUrl;
/* ruizhi-model-bridge:end */
`;
}

function pageEnhanceBootstrapBlock(config, appVersion = config.version) {
  const enhanceConfig = pageEnhanceBootstrapConfig(config, appVersion);
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

function ensureWindowsBootstrapRuntimeConfig(bootstrapPath, config, options = {}) {
  const log = options.log ?? (() => {});
  const appVersion = options.appVersion ?? config.version;
  const openaiBaseUrl = config.openai?.baseUrl ?? "https://gptauth.ruijie.com.cn/v1";
  const ruijieProviderBaseUrl = config.openai?.providerBaseUrl ?? openaiBaseUrl;
  const chatModelPrefixes = config.openai?.chatModelPrefixes ?? [];
  const providerBaseUrl = modelProviderBaseUrl(config);
  const bridgeConfig = modelBridgeBootstrapConfig(config);
  const modelCatalogEnabledValue = modelCatalogEnabled(config);
  const runtimeConfig = config.runtime ?? {};
  const electronUserDataDirName = runtimeConfig.electronUserDataDirName ?? "Codex";
  const locale = config.locale ?? "zh-CN";
  let source = fs.readFileSync(bootstrapPath, "utf8");
  let next = source;

  const constantsPattern = /const openaiBaseUrl="[^"]*";(?:\s*const chatGptBackendApiBaseUrl=[^;]+;)?(?:\s*const modelProviderBaseUrl=[^;]+;)?(?:\s*const modelBridgeConfig=\{[\s\S]*?\};)?(?:\s*const pageEnhanceConfig=\{[\s\S]*?\};)?/;
  const hasLegacyRuizhiRuntimeBlock = constantsPattern.test(next);
  if (!hasLegacyRuizhiRuntimeBlock) {
    log("已跳过 Windows bootstrap provider 常量补丁：新版 bootstrap 未包含旧锐智常量块");
  } else {
    next = next.replace(
      constantsPattern,
      [
        `const openaiBaseUrl=${jsonLiteral(openaiBaseUrl)};`,
        `const chatGptBackendApiBaseUrl=${jsonLiteral("https://gptauth.ruijie.com.cn")};`,
        `const ruijieProviderBaseUrl=${jsonLiteral(ruijieProviderBaseUrl)};`,
        `const ruijieChatModelPrefixes=${jsonLiteral(chatModelPrefixes)};`,
        `const modelProviderBaseUrl=${jsonLiteral(providerBaseUrl)};`,
        `const modelBridgeConfig=${jsonLiteral(bridgeConfig)};`
      ].join("\n    ")
    );
  }

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
  const providerConfigMarkerPattern = /\/\* ruizhi-provider-config:start \*\/[\s\S]*?\/\* ruizhi-provider-config:end \*\/\r?\n?/g;
  next = next.replace(providerConfigMarkerPattern, "");
  const pageEnhanceMarkerPattern = /\/\* ruizhi-page-enhance:start \*\/[\s\S]*?\/\* ruizhi-page-enhance:end \*\/\r?\n?/g;
  next = next.replace(pageEnhanceMarkerPattern, "");
  const oldEnvAnchor = "process.env.RUIZHI_OPENAI_BASE_URL=openaiBaseUrl;\n    process.env.RUIZHI_IMAGEGEN_EXE=";
  const imageEnvAnchor = "    process.env.RUIZHI_IMAGEGEN_EXE=";
  const pageEnhanceBlock = pageEnhanceEnabled(config) ? pageEnhanceBootstrapBlock(config, appVersion) : "";
  if (next.includes(oldEnvAnchor)) {
    next = next.replace(oldEnvAnchor, `${ruijieProviderBootstrapBlock()}${bridgeBootstrapBlock(config)}${pageEnhanceBlock}    process.env.RUIZHI_IMAGEGEN_EXE=`);
  } else if (next.includes(imageEnvAnchor)) {
    next = next.replace(imageEnvAnchor, `${ruijieProviderBootstrapBlock()}${bridgeBootstrapBlock(config)}${pageEnhanceBlock}${imageEnvAnchor}`);
  } else {
    log("已跳过 Windows bootstrap provider/page enhance 主进程补丁：新版 bootstrap 未包含 RUIZHI_IMAGEGEN_EXE 锚点");
  }

  const sandboxConfigMarkerPattern = /\/\* ruizhi-windows-sandbox-config:start \*\/[\s\S]*?\/\* ruizhi-windows-sandbox-config:end \*\/\r?\n?/g;
  next = next.replace(sandboxConfigMarkerPattern, "");
  const managedConfigPattern = /    const managedBegin=[\s\S]*?    function \w+\(existing\)\{[\s\S]*?\n    \}\n\n/;
  next = next.replace(managedConfigPattern, "");

  const oldConfigWritePatterns = [
    /    const configPath=path\.join\(codexHome,"config\.toml"\);\n    const existingCodexConfig=fs\.existsSync\(configPath\);[\s\S]*?syncFallback\w+\([^\n]*\);\n/,
    /    const configPath=path\.join\(codexHome,"config\.toml"\);\n    const existing=fs\.existsSync\(configPath\)[\s\S]*?if\(next!==existing\)fs\.writeFileSync\(configPath,next,"utf8"\);\n/
  ];
  const readOnlyConfigCheck = [
    "    const configPath=path.join(codexHome,\"config.toml\");",
    "    const existingRuizhiConfig=fs.existsSync(configPath);",
    "    process.env.RUIZHI_EXISTING_CONFIG=existingRuizhiConfig?\"1\":\"0\";"
  ].join("\n");
  let replacedConfigWrite = false;
  for (const pattern of oldConfigWritePatterns) {
    if (pattern.test(next)) {
      next = next.replace(pattern, `${readOnlyConfigCheck}\n`);
      replacedConfigWrite = true;
      break;
    }
  }
  if (!replacedConfigWrite && !next.includes(readOnlyConfigCheck) && hasLegacyRuizhiRuntimeBlock) {
    throw new Error("Windows bootstrap 锐智 config.toml 只读检查补丁点不存在");
  } else if (!replacedConfigWrite && !next.includes(readOnlyConfigCheck)) {
    log("已跳过 Windows bootstrap config.toml 只读检查补丁：新版 bootstrap 未包含旧锐智配置写入块");
  }

  if (!next.includes(".app.commandLine.appendSwitch(`lang`") && !next.includes(".app.commandLine.appendSwitch(\"lang\"")) {
    next = replaceRegex(
      next,
      /for\(let ([A-Za-z_$][\w$]*) of C\(\{buildFlavor:([A-Za-z_$][\w$]*),env:process\.env\}\)\)([A-Za-z_$][\w$]*)\.app\.commandLine\.appendSwitch\(\1\.name,\1\.value\)/,
      (match, _switchVar, _buildFlavorVar, electronName) =>
        `${match};try{${electronName}.app.commandLine.appendSwitch(\`lang\`,${jsonLiteral(locale)})}catch{};process.env.LANG=${jsonLiteral(`${locale.replace("-", "_")}.UTF-8`)};process.env.LANGUAGE=${jsonLiteral(locale)}`,
      "Windows bootstrap default locale"
    );
  }

  next = replaceRegex(
    next,
    /[A-Za-z_$][\w$]*\.app\.setName\([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\([A-Za-z_$][\w$]*(?:,[A-Za-z_$][\w$]*)?\)\)/,
    (match) => {
      const electronName = match.slice(0, match.indexOf(".app.setName"));
      return `${electronName}.app.setName(${jsonLiteral(windowsTaskManagerName(config))})`;
    },
    "Windows bootstrap app name"
  );
  next = replaceRegex(
    next,
    /[A-Za-z_$][\w$]*\.app\.setPath\(`userData`,[A-Za-z_$][\w$]*\(\{appDataPath:[A-Za-z_$][\w$]*\.app\.getPath\(`appData`\),buildFlavor:[A-Za-z_$][\w$]*,env:process\.env\}\)\)/,
    (match) => {
      const electronName = match.slice(0, match.indexOf(".app.setPath"));
      return `${electronName}.app.setPath(\`userData\`,process.env.CODEX_ELECTRON_USER_DATA_PATH?.trim()||o.join(${electronName}.app.getPath(\`appData\`),${jsonLiteral(electronUserDataDirName)}))`;
    },
    "Windows bootstrap userData path"
  );
  next = replaceRegex(
    next,
    /process\.platform===`win32`&&[A-Za-z_$][\w$]*\.app\.setAppUserModelId\([A-Za-z_$][\w$]*\.[A-Za-z_$][\w$]*\([A-Za-z_$][\w$]*\)\)/,
    (match) => {
      const appMatch = match.match(/&&([A-Za-z_$][\w$]*)\.app\.setAppUserModelId/);
      const electronName = appMatch?.[1] ?? "a";
      return `process.platform===\`win32\`&&${electronName}.app.setAppUserModelId(\`cn.ruizhi.desktop\`)`;
    },
    "Windows bootstrap AppUserModelID"
  );
  next = replaceRegex(
    next,
    /if\(!\(![A-Za-z_$][\w$]*\|\|[A-Za-z_$][\w$]*\.app\.requestSingleInstanceLock\(\)\)\)/,
    "if(!1)",
    "Windows bootstrap single-instance lock"
  );

  if (next !== source) {
    fs.writeFileSync(bootstrapPath, next, "utf8");
    log("已刷新 Windows bootstrap 模型 provider、bridge 与锐捷 config.toml 只读逻辑");
  }
}

function findWindowsNativeMenuBundle(extractedAppDir) {
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const candidates = walkFiles(buildDir).filter((filePath) => {
    if (!filePath.endsWith(".js")) {
      return false;
    }
    const source = fs.readFileSync(filePath, "utf8");
    return (
      source.includes(".Menu.setApplicationMenu(") &&
      (
        source.includes("let Xe=[],Ze=[") ||
        source.includes("function ruizhiEnsureNativeMenuItems(") ||
        source.includes("`/settings/general-settings`")
      )
    );
  });

  if (candidates.length !== 1) {
    throw new Error(`Windows 顶部菜单 bundle 匹配数量异常：${candidates.length}`);
  }

  return candidates[0];
}

function windowsNativeMenuPatchSource() {
  return `function ruizhiTranslateApplicationMenu(e){const t=new Map(Object.entries({"File":"文件","Edit":"编辑","View":"视图","Window":"窗口","Help":"帮助","Settings":"设置","Settings…":"设置…","Preferences":"偏好设置","Account":"账户","Log Out":"退出登录","Check for Updates":"检查更新","Check for Updates…":"检查更新…","Install Update":"安装更新","Quit":"退出","Exit":"退出","New Thread":"新聊天","New Chat":"新聊天","Quick Chat":"快速对话","New Window":"新窗口","Open Folder":"打开文件夹","Close":"关闭","Reload Window":"重新加载窗口","Toggle Sidebar":"切换侧边栏","Toggle Terminal":"切换终端","Toggle File Tree":"切换文件树","Open Browser Tab":"打开浏览器标签页","Toggle Browser Panel":"切换浏览器面板","Find":"查找","Previous Chat":"上一个对话","Next Chat":"下一个对话","Back":"后退","Forward":"前进","Zoom In":"放大","Zoom Out":"缩小","Actual Size":"实际大小","Reset Zoom":"重置缩放","Toggle Full Screen":"切换全屏","Toggle Developer Tools":"切换开发者工具","Developer Tools":"开发者工具","Codex Documentation":"帮助首页","What's new":"更新内容","Automations":"自动化","Usage":"使用情况","Plugins":"插件","Library":"资料库","Pull Request":"拉取请求","Pull Requests":"拉取请求","Local Environments":"本地环境","Worktrees":"工作树","Skills":"技能","Model Context Protocol":"MCP","Troubleshooting":"故障排查","Send Feedback":"发送反馈","Keyboard Shortcuts":"键盘快捷键"}));function r(e){let r=String(e||"").replace(/&/g,"").replace(/\\.\\.\\.$/,"…").trim();if(t.has(r))return t.get(r);let n=r.replace(/…$/,"").trim();if(t.has(n))return t.get(n);if(r.startsWith("About "))return r.replace(/^About /,"关于 ");if(r.startsWith("Hide "))return r.replace(/^Hide /,"隐藏 ");if(r.startsWith("Quit "))return r.replace(/^Quit /,"退出 ");return e}function i(e){if(!e)return;if(typeof e.label==="string"&&e.label.length>0)e.label=r(e.label);let t=e.submenu?.items;if(Array.isArray(t))for(const e of t)i(e)}if(Array.isArray(e?.items))for(const t of e.items)i(t);return e}function ruizhiEnsureNativeMenuItems({menu:e,MenuItem:t,ensureWindow:n,navigate:r,settingsRoute:i,shell:j}){let a=o=>String(o?.label||"").replace(/&/g,"").replace(/\\.\\.\\.$/,"…").trim(),o=[];function s(e){if(!e)return;let t=e.items??e.submenu?.items;if(!Array.isArray(t))return;for(const e of t)o.push(e),s(e.submenu)}s(e);let c=e=>{if(e){e.visible=!0;e.enabled=!0}},v=e=>{if(e){e.visible=!1;e.enabled=!1}},l=e=>{let t=o.find(t=>e.test(a(t)));return t&&c(t),t},u=e?.items?.[0]?.submenu,d=e=>e?.items?.find(e=>/^(Help|帮助)$/.test(a(e)))??null,f=()=>d(e)?.submenu??u,p=async()=>{let e=await n();e&&r(e,i)},m=async()=>{let e=await n();e&&r(e,\`/plugins\`)},g=async()=>{let e=await n();e&&r(e,\`/automations\`)},U=async()=>{let e=await n();e&&r(e,\`/settings/usage\`)},A=async()=>{try{await j?.openExternal?.(\`https://gptauth.ruijie.com.cn/\`)}catch(e){console.error(\`锐捷账户菜单跳转失败\`,e)}};function q(){for(const e of o)if(/^(Library|Libraries|资料库|Pull Request|Pull Requests|拉取请求)$/.test(a(e)))v(e)}function ensureSettingsMenu(){let n=e?.items?.find(e=>/^(Settings|设置)$/.test(a(e))&&e.submenu);if(n)return c(n),n.submenu;if(!e?.insert)return f();let r=new t({label:\`设置\`,submenu:[]}),i=e.items?.findIndex(e=>/^(Help|帮助)$/.test(a(e)));e.insert(i>=0?i:e.items.length,r);return r.submenu}function ensurePluginsMenu(){let n=e?.items?.find(e=>/^(Plugins|插件)$/.test(a(e))&&e.submenu);if(n)return c(n),n.submenu;if(!e?.insert)return f();let r=new t({label:\`插件\`,submenu:[]}),i=e.items?.findIndex(e=>/^(Help|帮助)$/.test(a(e)));e.insert(i>=0?i:e.items.length,r);return r.submenu}function h(e,n,r,i,o){let s=e?.items?.find(e=>n.test(a(e)));if(s)return c(s),s.click=i,s;if(e?.insert){let n=new t({label:r,accelerator:o?.accelerator,click:i});e.insert(Math.min(o?.index??e.items.length,e.items.length),n);return n}return null}let y=ensureSettingsMenu(),b=ensurePluginsMenu();h(y,/^(Settings|设置|Preferences|偏好设置)/,\`设置…\`,p,{accelerator:\`CmdOrCtrl+,\`,index:0});h(y,/^(Usage|使用情况)$/,\`使用情况\`,U,{index:1});h(y,/^(Plugins|插件)$/,\`插件\`,m,{index:2});h(y,/^(Automations|自动化)$/,\`自动化\`,g,{index:3});h(b,/^(Plugins|插件)$/,\`插件\`,m,{index:0});let x=l(/^(Settings|设置|Preferences|偏好设置)/);x&&(x.click=p);let R=l(/^(Usage|使用情况)$/);R&&(R.click=U);let S=l(/^(Plugins|插件)$/);S&&(S.click=m);let C=l(/^(Automations|自动化)$/);C&&(C.click=g);let T=l(/^(Account|账户)$/);T&&(T.click=A);q()}`;
}

function patchWindowsBrowserWindowNativeMenuVisibility(source) {
  const hiddenMenuBar = "process.platform===`win32`?{autoHideMenuBar:!0}:{}";
  const visibleMenuBar = "process.platform===`win32`?{autoHideMenuBar:!1}:{}";
  const hiddenCrossPlatformMenuBar = "process.platform===`win32`||process.platform===`linux`?{autoHideMenuBar:!0}:{}";
  const visibleCrossPlatformMenuBar = "process.platform===`win32`||process.platform===`linux`?{autoHideMenuBar:!1}:{}";
  let next = source;

  if (next.includes(hiddenMenuBar)) {
    next = next.replaceAll(hiddenMenuBar, visibleMenuBar);
  } else if (next.includes(hiddenCrossPlatformMenuBar)) {
    next = next.replaceAll(hiddenCrossPlatformMenuBar, visibleCrossPlatformMenuBar);
  } else if (next.includes("autoHideMenuBar:!0")) {
    next = next.replaceAll("autoHideMenuBar:!0", "autoHideMenuBar:!1");
  } else if (!next.includes(visibleMenuBar) && !next.includes(visibleCrossPlatformMenuBar) && !next.includes("autoHideMenuBar:!1")) {
    throw new Error("顶部菜单窗口可见性补丁点不存在：autoHideMenuBar");
  }

  const removeMenuPattern = /process\.platform===`win32`&&([A-Za-z_$][\w$]*)\.removeMenu\(\),/g;
  let removeMenuReplacements = 0;
  next = next.replace(removeMenuPattern, (_match, windowVar) => {
    removeMenuReplacements += 1;
    return `process.platform===\`win32\`&&${windowVar}.setMenuBarVisibility(!0),`;
  });
  const removeCrossPlatformMenuPattern = /\(process\.platform===`win32`\|\|process\.platform===`linux`\)&&([A-Za-z_$][\w$]*)\.removeMenu\(\),/g;
  next = next.replace(removeCrossPlatformMenuPattern, (_match, windowVar) => {
    removeMenuReplacements += 1;
    return `(process.platform===\`win32\`||process.platform===\`linux\`)&&${windowVar}.setMenuBarVisibility(!0),`;
  });
  const removeNonDarwinMenuPattern = /process\.platform!==`darwin`&&([A-Za-z_$][\w$]*)\.removeMenu\(\),/g;
  next = next.replace(removeNonDarwinMenuPattern, (_match, windowVar) => {
    removeMenuReplacements += 1;
    return `process.platform!==\`darwin\`&&${windowVar}.setMenuBarVisibility(!0),`;
  });
  if (removeMenuReplacements === 0 && !next.includes(".setMenuBarVisibility(!0),")) {
    throw new Error("顶部菜单窗口可见性补丁点不存在：removeMenu");
  }

  return next;
}

function patchWindowsNativeMenuItems(extractedAppDir, _config, options = {}) {
  const log = options.log ?? (() => {});
  const mainBundlePath = findWindowsNativeMenuBundle(extractedAppDir);
  const original = fs.readFileSync(mainBundlePath, "utf8");
  let source = original;

  const insertionPoint = source.includes("let Xe=[],Ze=[") ? "let Xe=[],Ze=[" : "var _8=";
  const insertionIndex = source.indexOf(insertionPoint);
  if (insertionIndex < 0) {
    throw new Error("顶部菜单原生入口补丁点不存在：菜单模板入口");
  }

  const helperStart = source.indexOf("function ruizhiTranslateApplicationMenu(");
  if (helperStart >= 0 && helperStart < insertionIndex) {
    const helperSource = source.slice(helperStart, insertionIndex);
    if (!helperSource.includes("ensureSettingsMenu") || !helperSource.includes("gptauth.ruijie.com.cn")) {
      source = `${source.slice(0, helperStart)}${windowsNativeMenuPatchSource()}${source.slice(insertionIndex)}`;
    }
  } else if (!source.includes("function ruizhiEnsureNativeMenuItems(")) {
    source = source.replace(insertionPoint, `${windowsNativeMenuPatchSource()}${insertionPoint}`);
  }

  const settingsRouteVar = source.match(/([A-Za-z_$][\w$]*)=`\/settings\/general-settings`/)?.[1];
  if (!settingsRouteVar) {
    throw new Error("顶部菜单设置路由变量不存在：/settings/general-settings");
  }
  const ensureWindowVar = source.match(/ensurePrimaryWindowVisible:([A-Za-z_$][\w$]*)/)?.[1] ?? "d";
  const navigateVar = source.match(/navigateToRoute:([A-Za-z_$][\w$]*)/)?.[1] ?? "m";

  if (!source.includes("try{ruizhiEnsureNativeMenuItems({menu:")) {
    const menuSetPattern = /\}\}n\.Menu\.setApplicationMenu\(([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\)\}/;
    const menuSetPatternCurrent = /([A-Za-z_$][\w$]*)\.Menu\.setApplicationMenu\(([A-Za-z_$][\w$]*)\),([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\)\}/;
    if (menuSetPattern.test(source)) {
      source = source.replace(menuSetPattern, `}}try{ruizhiEnsureNativeMenuItems({menu:$1,MenuItem:n.MenuItem,ensureWindow:${ensureWindowVar},navigate:${navigateVar},settingsRoute:${settingsRouteVar},shell:n.shell});ruizhiTranslateApplicationMenu($1)}catch(e){console.error(\`锐智菜单修复失败\`,e)}n.Menu.setApplicationMenu($1),$2($3)}`);
    } else if (menuSetPatternCurrent.test(source)) {
      source = source.replace(menuSetPatternCurrent, `try{ruizhiEnsureNativeMenuItems({menu:$2,MenuItem:$1.MenuItem,ensureWindow:${ensureWindowVar},navigate:${navigateVar},settingsRoute:${settingsRouteVar},shell:$1.shell});ruizhiTranslateApplicationMenu($2)}catch(e){console.error(\`锐智菜单修复失败\`,e)}$1.Menu.setApplicationMenu($2),$3($4)}`);
    } else {
      throw new Error("顶部菜单中文补丁点不存在：setApplicationMenu");
    }
  }

  source = patchWindowsBrowserWindowNativeMenuVisibility(source);

  if (source !== original) {
    fs.writeFileSync(mainBundlePath, source, "utf8");
    log(`已补丁 Windows 顶部菜单原生入口：${path.basename(mainBundlePath)}`);
  } else {
    log(`Windows 顶部菜单原生入口已是最新：${path.basename(mainBundlePath)}`);
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
    ["Qo=`Usage`", "Qo=`使用情况`"],
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

  source = source.replace(`"Codex Documentation":"官方文档"`, `"Codex Documentation":"帮助首页"`);
  source = source.replace(`"Codex Documentation":"使用文档"`, `"Codex Documentation":"帮助首页"`);

  fs.writeFileSync(mainBundlePath, source, "utf8");
  log(`已补丁 Windows 托盘和顶部菜单中文文案：${path.basename(mainBundlePath)}`);
}

function patchWindowsTrayIcon(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const candidates = walkFiles(buildDir).filter((filePath) => {
    if (!filePath.endsWith(".js")) {
      return false;
    }
    const source = fs.readFileSync(filePath, "utf8");
    return source.includes("new c.Tray(t.defaultIcon)") && source.includes("process.resourcesPath") && source.includes("getFileIcon(process.execPath");
  });

  if (candidates.length !== 1) {
    throw new Error(`Windows tray icon bundle match count is ${candidates.length}`);
  }

  const mainBundlePath = candidates[0];
  const changed = writePatchedFile(mainBundlePath, (source) => {
    if (source.includes("ruizhiLoadWindowsTrayIcon(")) {
      return source;
    }
    const fallbackPattern = /let r=K9\(e,t,n\);return r==null\?\{defaultIcon:await c\.app\.getFileIcon\(process\.execPath,\{size:`small`\}\),chronicleRunningIcon:null\}:\{defaultIcon:r,chronicleRunningIcon:null\}/;
    if (!fallbackPattern.test(source)) {
      throw new Error("Windows tray icon fallback patch point not found");
    }
    return source.replace(
      fallbackPattern,
      "let r=K9(e,t,n);if(r!=null)return{defaultIcon:r,chronicleRunningIcon:null};let i=ruizhiLoadWindowsTrayIcon(c,u);return i!=null?{defaultIcon:i,chronicleRunningIcon:null}:{defaultIcon:await c.app.getFileIcon(process.execPath,{size:`small`}),chronicleRunningIcon:null}"
    ).replace(
      /function K9\(e,t,n\)\{/,
      "function ruizhiLoadWindowsTrayIcon(e,t){if(process.platform!==`win32`)return null;let n=e.nativeImage.createFromPath(t.join(process.resourcesPath,`icon.ico`));return n.isEmpty()?null:n}function K9(e,t,n){"
    );
  });

  log(`Patched Windows tray icon: ${changed ? "changed" : "already current"}`);
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
      log(`帮助文档链接已是锐捷目标地址：${alreadyPatchedCount} 处`);
      return;
    }
    throw new Error("未找到 Codex 帮助文档链接补丁点");
  }

  log(`已补丁帮助文档链接：${changedFiles} 个文件，${replacementCount} 处`);
}

export function patchWindowsAccountSettingsLinks(extractedAppDir, _config, options = {}) {
  const log = options.log ?? (() => {});
  const accountUrl = "https://gptauth.ruijie.com.cn/";
  const accountSettingsPattern = /https:\/\/chatgpt\.com\/#settings(?:\/[A-Za-z]+)?/g;
  const accountSecurityPattern = /https:\/\/chatgpt\.com\/open-security-settings/g;
  let changedFiles = 0;
  let replacementCount = 0;
  let alreadyPatchedCount = 0;
  const files = walkFiles(extractedAppDir).filter((filePath) => /\.(js|html|json)$/i.test(filePath));

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    let next = source;
    alreadyPatchedCount += source.includes(accountUrl) ? 1 : 0;
    for (const pattern of [accountSettingsPattern, accountSecurityPattern]) {
      const matches = next.match(pattern);
      if (matches) {
        replacementCount += matches.length;
        next = next.replace(pattern, accountUrl);
      }
    }
    if (next !== source) {
      fs.writeFileSync(filePath, next, "utf8");
      changedFiles += 1;
    }
  }

  if (replacementCount === 0) {
    if (alreadyPatchedCount > 0) {
      log(`账户设置链接已是锐捷目标地址：${alreadyPatchedCount} 处`);
      return;
    }
    throw new Error("未找到 ChatGPT 账户设置链接补丁点");
  }

  log(`已补丁账户设置链接：${changedFiles} 个文件，${replacementCount} 处`);
}

export function refreshWindowsAsarBuildMetadata(extractedAppDir, config, appVersion, options = {}) {
  const log = options.log ?? (() => {});
  const packageJsonPath = path.join(extractedAppDir, "package.json");
  const buildDir = path.join(extractedAppDir, ".vite", "build");
  const preloadPath = path.join(buildDir, "preload.js");
  const bootstrapPath = fs.existsSync(path.join(buildDir, "bootstrap.js"))
    ? path.join(buildDir, "bootstrap.js")
    : fs.existsSync(buildDir)
      ? path.join(buildDir, fs.readdirSync(buildDir).find((name) => /^bootstrap(?:-[A-Za-z0-9_]+)?\.js$/.test(name)) ?? "")
      : path.join(buildDir, "bootstrap.js");

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.version = appVersion;
    const earlyBootstrapMain = ".vite/build/early-bootstrap.js";
    if (fs.existsSync(path.join(extractedAppDir, earlyBootstrapMain))) {
      packageJson.main = earlyBootstrapMain;
    }
    if (brandingEnabled(config)) {
      packageJson.productName = windowsTaskManagerName(config);
      packageJson.description = `${config.productName}桌面端`;
    }
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
  }

  if (fs.existsSync(preloadPath)) {
    const preloadSource = fs.readFileSync(preloadPath, "utf8");
    if (/const appVersion="[^"]*";/.test(preloadSource)) {
      replaceInFile(
        preloadPath,
        /const appVersion="[^"]*";/,
        `const appVersion=${JSON.stringify(appVersion)};`,
        "preload appVersion"
      );
    } else {
      log("已跳过 preload appVersion 补丁：新版 preload 未内联 appVersion");
    }
    ensurePreloadPageEnhanceIntegration(preloadPath, config, { log, appVersion });
  }

  if (fs.existsSync(bootstrapPath)) {
    ensureWindowsBootstrapEarlyRuizhiEnv(bootstrapPath, config, { log });
    ensureWindowsBootstrapRuntimeConfig(bootstrapPath, config, { log, appVersion });
    if (brandingEnabled(config)) {
      const bootstrapSource = fs.readFileSync(bootstrapPath, "utf8");
      if (/n\.app\.setName\("[^"]*"\)/.test(bootstrapSource)) {
        replaceInFile(
          bootstrapPath,
          /n\.app\.setName\("[^"]*"\)/,
          `n.app.setName(${JSON.stringify(windowsTaskManagerName(config))})`,
          "bootstrap app name"
        );
      } else {
        log("已跳过旧 bootstrap app name 品牌化补丁：补丁点不存在或已由新版逻辑处理");
      }
    } else {
      log("已跳过 bootstrap app name 品牌化补丁");
    }
  }

  patchWindowsDefaultLocale(extractedAppDir, config, { log });

  if (brandingEnabled(config)) {
    patchWindowsFrontendLocalization(extractedAppDir, config, { log });
    patchWindowsNativeMenuItems(extractedAppDir, config, { log });
    patchWindowsTrayIcon(extractedAppDir, { log });
    // patchWindowsTrayMenuLabels(extractedAppDir, config, { log }); // 暂时跳过：Codex 42.x 的托盘 JS 匹配数量有变化
  } else {
    log("已跳过 Windows 原生菜单品牌化补丁");
  }
  patchWindowsProductModeLabels(extractedAppDir, config, { log });
  patchWindowsProductModeSwitcherVisibility(extractedAppDir, { log });
  patchWindowsSandboxOnboardingBypass(extractedAppDir, { log });
  patchVcRuntimeErrorPage(extractedAppDir, { log });
  if (brandingEnabled(config)) {
    patchWindowsAccountSettingsLinks(extractedAppDir, config, { log });
    patchWindowsHelpDocumentationLinks(extractedAppDir, config, { log });
  }
  if (brandingEnabled(config) && enableWindowsPluginTextPatches) {
    patchWindowsPluginMarketplaceLabels(extractedAppDir, { log });
  } else {
    log("已跳过插件市场文案补丁");
  }
  patchWindowsProductModeLabels(extractedAppDir, config, { log });
  patchWindowsProductModeSwitcherVisibility(extractedAppDir, { log });
  patchWindowsSandboxOnboardingBypass(extractedAppDir, { log });
  patchWindowsTrayIcon(extractedAppDir, { log });
  patchPluginAccountGate(extractedAppDir, { log });
  patchNativeWebviewFeatureGates(extractedAppDir, { log });
  patchNativeStatsigNetwork(extractedAppDir, { log });
  patchNativeStatsigBootstrap(extractedAppDir, { log });
  patchNativeCesAnalyticsNetwork(extractedAppDir, { log });
  patchNativeProfileVisibility(extractedAppDir, { log });
  patchNativeUsageSettingsVisibility(extractedAppDir, { log });
  patchNativeProfileDropdownUsageVisibility(extractedAppDir, { log });
  patchNativeProfileUsageFallback(extractedAppDir, { log });
  patchNativePlatformUsageFallback(extractedAppDir, { log });
  patchWindowsAppSunsetDialog(extractedAppDir, { log });
  if (modelCatalogEnabled(config)) {
    patchListModelsForHostFromUserCache(extractedAppDir, config, { log });
  } else {
    log("已跳过模型列表优化补丁");
  }
  patchNativeBrowserDesktopFeatureAvailability(extractedAppDir, { log });
  patchChatGptAuthExternalBrowser(extractedAppDir, { log });
  patchBrowserNativePipeDiagnostics(extractedAppDir, { log });
  patchBrowserNativePipePeerAuthorization(extractedAppDir, { log });
  patchBrowserUseIabOpenStability(extractedAppDir, { log });
  if (options.resourcesDir) {
    patchTrustedBrowserClientHashes(extractedAppDir, options.resourcesDir, { log });
  } else {
    log("已跳过 Browser client nativePipe 信任哈希刷新：缺少 resourcesDir");
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
  try {
    copyRuntimeNodePackage("electron-updater", targetNodeModules);
  } catch (error) {
    if (error?.code !== "MODULE_NOT_FOUND") {
      throw error;
    }
    log("Skipped electron-updater runtime dependency copy: package is not installed in this workspace");
    return;
  }
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

function patchWindowsAppSunsetDialog(extractedAppDir, options = {}) {
  const log = options.log ?? (() => {});
  const webviewAssetsDir = path.join(extractedAppDir, "webview", "assets");
  const candidates = walkFiles(webviewAssetsDir).filter(
    (filePath) => /^app-main-.*\.js$/.test(path.basename(filePath))
  );
  if (candidates.length === 0) {
    log("已跳过 app sunset 对话框补丁（未找到 app-main bundle）");
    return;
  }
  if (candidates.length !== 1) {
    throw new Error(`app-main bundle 匹配数量异常：${candidates.length}`);
  }

  const filePath = candidates[0];
  const source = fs.readFileSync(filePath, "utf8");
  const targetPattern = `ec(\`2929582856\`)`;
  if (!source.includes(targetPattern)) {
    log("已跳过 app sunset 对话框补丁（特征点不存在）");
    return;
  }
  const patched = source.replace(targetPattern, `false`);
  fs.writeFileSync(filePath, patched, "utf8");
  log(`已禁用 app sunset 版本强制更新对话框：${path.basename(filePath)}`);
}
