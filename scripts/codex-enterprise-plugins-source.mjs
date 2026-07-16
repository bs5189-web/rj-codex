import fs from "node:fs";
import path from "node:path";

const ENTERPRISE_LOCAL_MARKER = "let _requested_marketplace_kinds = marketplace_kinds;";
const ENTERPRISE_REMOTE_MARKER =
  "let _enterprise_remote_plugin_catalog_disabled = (config, auth);";

function patchPluginListSource(source) {
  if (source.includes(ENTERPRISE_LOCAL_MARKER)) {
    return source;
  }

  const pattern = /let explicit_marketplace_kinds = marketplace_kinds\.is_some\(\);\n\s*let marketplace_kinds =\n\s*marketplace_kinds\.unwrap_or_else\(\|\| vec!\[PluginListMarketplaceKind::Local\]\);\n\s*let include_local = marketplace_kinds\.contains\(&PluginListMarketplaceKind::Local\);\n\s*let include_vertical = marketplace_kinds\.contains\(&PluginListMarketplaceKind::Vertical\);/;
  if (!pattern.test(source)) {
    throw new Error("补丁点不存在：Codex 企业版本地插件目录");
  }

  return source.replace(
    pattern,
    [
      "let _requested_marketplace_kinds = marketplace_kinds;",
      "        let explicit_marketplace_kinds = true;",
      "        let marketplace_kinds = vec![PluginListMarketplaceKind::Local];",
      "        let include_local = true;",
      "        let include_vertical = false;",
    ].join("\n"),
  );
}

function patchRemotePluginSource(source) {
  if (source.includes(ENTERPRISE_REMOTE_MARKER)) {
    return source;
  }

  const pattern = /pub async fn fetch_openai_curated_remote_collection_marketplace\(\n[\s\S]*?\n\}\n\nfn build_remote_marketplace/;
  if (!pattern.test(source)) {
    throw new Error("补丁点不存在：Codex OpenAI 远程插件目录");
  }

  return source.replace(
    pattern,
    [
      "pub async fn fetch_openai_curated_remote_collection_marketplace(",
      "    config: &RemotePluginServiceConfig,",
      "    auth: Option<&CodexAuth>,",
      ") -> Result<Option<RemoteMarketplace>, RemotePluginCatalogError> {",
      "    let _enterprise_remote_plugin_catalog_disabled = (config, auth);",
      "    Ok(None)",
      "}",
      "",
      "fn build_remote_marketplace",
    ].join("\n"),
  );
}

export function patchCodexEnterprisePluginSource(codexSourceRoot) {
  const pluginSourcePath = path.join(
    codexSourceRoot,
    "codex-rs",
    "app-server",
    "src",
    "request_processors",
    "plugins.rs",
  );
  if (!fs.existsSync(pluginSourcePath)) {
    throw new Error(`Codex 插件源码文件不存在：${pluginSourcePath}`);
  }
  const remoteSourcePath = path.join(
    codexSourceRoot,
    "codex-rs",
    "core-plugins",
    "src",
    "remote.rs",
  );
  if (!fs.existsSync(remoteSourcePath)) {
    throw new Error(`Codex 远程插件源码文件不存在：${remoteSourcePath}`);
  }

  const source = fs.readFileSync(pluginSourcePath, "utf8");
  const patched = patchPluginListSource(source);
  if (patched !== source) {
    fs.writeFileSync(pluginSourcePath, patched, "utf8");
  }

  const remoteSource = fs.readFileSync(remoteSourcePath, "utf8");
  const patchedRemote = patchRemotePluginSource(remoteSource);
  if (patchedRemote !== remoteSource) {
    fs.writeFileSync(remoteSourcePath, patchedRemote, "utf8");
  }

  return {
    changed: patched !== source || patchedRemote !== remoteSource,
    files: [pluginSourcePath, remoteSourcePath],
  };
}
