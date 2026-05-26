const siteConfig = window.RUIZHI_SITE_CONFIG ?? {};
const manifestUrls = siteConfig.manifestUrls ?? {};

const platforms = {
  windows: {
    manifestUrl: manifestUrls.windows ?? "/updates/windows/latest.yml"
  },
  macos: {
    manifestUrl: manifestUrls.macos ?? "/updates/macos/ruizhi-latest-macos.json"
  }
};

const views = new Map();

for (const platform of Object.keys(platforms)) {
  const button = document.querySelector(`[data-download="${platform}"]`);
  const version = document.querySelector(`[data-platform-version="${platform}"]`);

  if (!button || !version) {
    throw new Error(`下载按钮缺少必要节点：${platform}`);
  }

  views.set(platform, { button, version });
}

function resolveUrl(manifestUrl, assetUrl) {
  return new URL(assetUrl, new URL(manifestUrl, window.location.href)).href;
}

function fileNameFromUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return url.pathname.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
}

function resolveManifestDownloadUrl(manifestUrl, asset) {
  const assetUrl = String(asset?.url ?? "").trim();
  const fileName = String(asset?.fileName ?? "").trim() || fileNameFromUrl(assetUrl);
  if (!assetUrl && !fileName) {
    throw new Error("清单里没有下载地址");
  }

  if (manifestUrl.startsWith("/") && fileName) {
    return resolveUrl(manifestUrl, fileName);
  }

  return resolveUrl(manifestUrl || window.location.href, assetUrl || fileName);
}

function stripYamlScalar(rawValue) {
  const value = String(rawValue ?? "").trim();
  if (!value) {
    return "";
  }
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1);
  }
  return value;
}

function parseYamlManifest(text) {
  const lines = String(text ?? "").split(/\r?\n/);
  const manifest = {
    files: []
  };
  let currentFile = null;

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const fileUrlMatch = line.match(/^\s*-\s+url:\s*(.+)$/);
    if (fileUrlMatch) {
      currentFile = { url: stripYamlScalar(fileUrlMatch[1]) };
      manifest.files.push(currentFile);
      continue;
    }

    const nestedMatch = line.match(/^\s{4}([A-Za-z0-9_]+):\s*(.+)$/);
    if (nestedMatch && currentFile) {
      currentFile[nestedMatch[1]] = stripYamlScalar(nestedMatch[2]);
      continue;
    }

    const topLevelMatch = line.match(/^([A-Za-z0-9_]+):\s*(.+)$/);
    if (topLevelMatch) {
      manifest[topLevelMatch[1]] = stripYamlScalar(topLevelMatch[2]);
    }
  }

  return manifest;
}

function parseManifest(text, manifestUrl) {
  const trimmed = String(text ?? "").trimStart();
  if (manifestUrl.endsWith(".json") || trimmed.startsWith("{")) {
    return JSON.parse(text);
  }
  return parseYamlManifest(text);
}

async function fetchManifest(manifestUrl) {
  const response = await fetch(manifestUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`清单请求失败：${response.status}`);
  }
  const text = await response.text();
  return parseManifest(text, manifestUrl);
}

function normalizeWindowsManifest(manifest, manifestUrl) {
  const assetUrl = String(manifest?.path ?? manifest?.files?.[0]?.url ?? "").trim();
  if (!assetUrl) {
    throw new Error("Windows 清单里没有下载地址");
  }
  return {
    href: resolveUrl(manifestUrl, assetUrl),
    version: String(manifest.version ?? "").trim()
  };
}

function normalizeMacosManifest(manifest, manifestUrl) {
  const macos = manifest?.macos ?? {};
  const manualDownload = manifest?.manualDownload ?? null;
  const testKit = macos?.testKit ?? null;
  const shouldUseTestKit = !macos.notarized && testKit;
  const asset = manualDownload ?? (shouldUseTestKit ? testKit : macos);
  const kind = String(manualDownload?.kind ?? (shouldUseTestKit ? "test-kit" : "app"));

  return {
    href: resolveManifestDownloadUrl(manifestUrl, asset),
    version: [String(manifest.version ?? "").trim(), kind === "test-kit" ? "测试包" : ""]
      .filter(Boolean)
      .join(" ")
  };
}

function applyLink(platform, detail) {
  const view = views.get(platform);
  view.button.href = detail.href;
  view.button.setAttribute("aria-disabled", "false");
  view.button.classList.remove("is-loading");
  view.button.target = platform === "macos" ? "_blank" : "_self";
  view.button.rel = "noreferrer";
  view.version.textContent = detail.version ? `版本 ${detail.version}` : "";
}

function disableLink(platform) {
  const view = views.get(platform);
  view.button.removeAttribute("href");
  view.button.setAttribute("aria-disabled", "true");
  view.button.classList.remove("is-loading");
  view.version.textContent = "暂不可用";
}

function markLoading(platform) {
  const view = views.get(platform);
  view.button.setAttribute("aria-disabled", "true");
  view.button.classList.add("is-loading");
  view.version.textContent = "准备中";
}

async function loadWindows() {
  const { manifestUrl } = platforms.windows;
  if (window.location.protocol === "https:" && manifestUrl.startsWith("http://")) {
    throw new Error("当前页面是 HTTPS，Windows 清单却是 HTTP");
  }
  const manifest = await fetchManifest(manifestUrl);
  return normalizeWindowsManifest(manifest, manifestUrl);
}

async function loadMacos() {
  const { manifestUrl } = platforms.macos;
  const manifest = await fetchManifest(manifestUrl);
  return normalizeMacosManifest(manifest, manifestUrl);
}

async function init() {
  for (const platform of Object.keys(platforms)) {
    markLoading(platform);
  }

  const tasks = {
    windows: loadWindows(),
    macos: loadMacos()
  };

  const entries = Object.entries(tasks);
  const results = await Promise.allSettled(entries.map(([, task]) => task));

  results.forEach((result, index) => {
    const platform = entries[index][0];
    if (result.status === "fulfilled") {
      applyLink(platform, result.value);
      return;
    }
    disableLink(platform);
  });
}

init();
