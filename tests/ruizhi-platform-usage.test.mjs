import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { patchDesktopAuthAllowedUrlsSource } = await import("../scripts/windows-asar-overrides.mjs");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("platform usage maps billing cents to a wallet remaining percentage without a reset window", async () => {
  // Given: a real HTTP boundary that exposes the two OAuth-compatible billing endpoints.
  const requests = [];
  const server = http.createServer((request, response) => {
    requests.push({ authorization: request.headers.authorization, url: request.url });
    response.setHeader("content-type", "application/json");
    if (request.url === "/v1/dashboard/billing/usage") {
      response.end(JSON.stringify({ object: "list", total_usage: 94778.8916 }));
      return;
    }
    if (request.url === "/v1/dashboard/billing/subscription") {
      response.end(JSON.stringify({ object: "billing_subscription", hard_limit_usd: 2739.726028 }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "not found" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "ruizhi-platform-usage-"));
  fs.writeFileSync(
    path.join(tmpHome, "auth.json"),
    JSON.stringify({ auth_mode: "chatgpt", tokens: { access_token: "test-oauth-token" } }),
  );

  try {
    const { createRuizhiEnhanceService } = require(
      path.join(projectRoot, "resources", "bridge", "ruizhi-enhance-service.cjs"),
    );
    const service = createRuizhiEnhanceService({
      codexHome: tmpHome,
      platformBaseUrl: `http://127.0.0.1:${address.port}`,
    });

    // When: the desktop usage bridge requests the current user's platform usage.
    const result = await service.call("/usage/platform");

    // Then: units are normalized and the native Codex rate-limit contract is returned.
    assert.equal(result.status, "ok");
    assert.equal(result.data.rate_limit.primary_window.used_percent, 34.59429542638925);
    assert.equal(result.data.rate_limit.primary_window.limit_window_seconds, -60);
    assert.equal(result.data.rate_limit.primary_window.reset_at, null);
    assert.equal(result.data.credits.balance, 1791.937112);
    assert.equal(result.metadata.used_usd, 947.788916);
    assert.equal(result.metadata.limit_usd, 2739.726028);
    assert.deepEqual(requests, [
      { authorization: "Bearer test-oauth-token", url: "/v1/dashboard/billing/usage" },
      { authorization: "Bearer test-oauth-token", url: "/v1/dashboard/billing/subscription" },
    ]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test("platform usage accepts an isolated runtime backend override", async () => {
  const server = http.createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    if (request.url === "/v1/dashboard/billing/usage") {
      response.end(JSON.stringify({ total_usage: 2500 }));
      return;
    }
    if (request.url === "/v1/dashboard/billing/subscription") {
      response.end(JSON.stringify({ hard_limit_usd: 100 }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "not found" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "ruizhi-platform-usage-env-"));
  fs.writeFileSync(
    path.join(tmpHome, "auth.json"),
    JSON.stringify({ auth_mode: "chatgpt", tokens: { access_token: "local-oauth-token" } }),
  );
  const previousBaseUrl = process.env.RUIZHI_PLATFORM_BASE_URL;

  try {
    process.env.RUIZHI_PLATFORM_BASE_URL = `http://127.0.0.1:${address.port}`;
    const { createRuizhiEnhanceService } = require(
      path.join(projectRoot, "resources", "bridge", "ruizhi-enhance-service.cjs"),
    );
    const service = createRuizhiEnhanceService({ codexHome: tmpHome });
    const result = await service.call("/usage/platform");

    assert.equal(result.status, "ok");
    assert.equal(result.metadata.used_usd, 25);
    assert.equal(result.metadata.limit_usd, 100);
    assert.equal(result.metadata.remaining_usd, 75);
    assert.equal(result.metadata.window_kind, "wallet");
    assert.equal(result.data.rate_limit.primary_window.used_percent, 25);
  } finally {
    if (previousBaseUrl === undefined) delete process.env.RUIZHI_PLATFORM_BASE_URL;
    else process.env.RUIZHI_PLATFORM_BASE_URL = previousBaseUrl;
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test("desktop builders expose one build-time backend contract for isolated local packages", () => {
  for (const scriptPath of ["scripts/build-macos.mjs", "scripts/build-windows.mjs"]) {
    const source = read(scriptPath);
    assert.match(source, /RUIZHI_BUILD_API_BASE_URL/, `${scriptPath} should override the model API base URL`);
    assert.match(source, /RUIZHI_BUILD_PROVIDER_BASE_URL/, `${scriptPath} should override the provider base URL`);
    assert.match(source, /RUIZHI_BUILD_CHATGPT_LOGIN_BASE_URL/, `${scriptPath} should override the OAuth issuer`);
    assert.match(source, /process\.env\.RUIZHI_PLATFORM_BASE_URL=chatGptBackendApiBaseUrl/, `${scriptPath} should publish the usage backend at runtime`);
    assert.match(source, /platformBaseUrl:process\.env\.RUIZHI_PLATFORM_BASE_URL/, `${scriptPath} should avoid a cross-scope bootstrap reference`);
  }

  const windowsOverrides = read("scripts/windows-asar-overrides.mjs");
  assert.match(windowsOverrides, /RUIZHI_BUILD_API_BASE_URL/);
  assert.match(windowsOverrides, /RUIZHI_BUILD_PROVIDER_BASE_URL/);
  assert.match(windowsOverrides, /RUIZHI_BUILD_CHATGPT_LOGIN_BASE_URL/);
  assert.match(windowsOverrides, /process\.env\.RUIZHI_PLATFORM_BASE_URL=chatGptBackendApiBaseUrl/);
  assert.match(windowsOverrides, /platformBaseUrl:process\.env\.RUIZHI_PLATFORM_BASE_URL/);
  assert.match(windowsOverrides, /11369540-using-codex-with-your-chatgpt-plan/);
  assert.match(windowsOverrides, /chatGptLoginBaseUrl\(config\)\}\/console/);

  const macosBuilder = read("scripts/build-macos.mjs");
  assert.match(macosBuilder, /11369540-using-codex-with-your-chatgpt-plan/);
  assert.match(macosBuilder, /buildChatGptLoginBaseUrl\}\/console/);
});

test("desktop fetch trusts the configured OAuth/API host without weakening the default allowlist", () => {
  const source = "isDesktopAuthAllowedUrl(e){let n=new URL(e).host.toLowerCase();return!!(n===`localhost`||n===`localhost:8000`||n===`openai.com`||n.endsWith(`.openai.com`))}";
  const patched = patchDesktopAuthAllowedUrlsSource(source, "http://127.0.0.1:3300");

  assert.match(patched, /n==="127\.0\.0\.1:3300"/);
  assert.match(patched, /n===`localhost`/);
  assert.match(patched, /n===`openai\.com`/);
  assert.match(patched, /ruizhiTrustedDesktopAuthHost:127\.0\.0\.1:3300/);
  assert.equal(patchDesktopAuthAllowedUrlsSource(patched, "http://127.0.0.1:3300"), patched);
});

test("packaging falls back when successful wham responses have incompatible shapes", () => {
  // Given: every supported packaging implementation.
  for (const scriptPath of [
    "scripts/build-macos.mjs",
    "scripts/build-windows.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);

    // When: the native profile and usage queries are patched.
    // Then: semantic shape checks activate local adapters after HTTP 200 HTML or flat JSON.
    assert.match(source, /patchNativePlatformUsageFallback/, `${scriptPath} should patch the native usage query`);
    assert.match(source, /\/usage\/platform/, `${scriptPath} should call the platform usage bridge`);
    assert.match(source, /ruizhiPlatformUsageBridgeFirst/, `${scriptPath} should not wait for the OpenAI usage endpoint before using the platform bridge`);
    assert.match(source, /ruizhiWalletQuotaWindow/, `${scriptPath} should render wallet balances without inventing a monthly reset`);
    assert.match(source, /ruizhiWalletQuotaSettingsLabel/, `${scriptPath} should label the settings row as a wallet quota`);
    assert.match(source, /rate_limit\?\.primary_window/, `${scriptPath} should validate the platform usage shape`);
    assert.match(source, /e\?\.stats/, `${scriptPath} should validate the profile response shape`);
    assert.match(source, /ruizhiProfileDropdownUsageForAllAuth/, `${scriptPath} should show usage for custom OAuth and API key accounts`);
  }
});

test("usage bridge remains available when optional page enhancements are disabled", () => {
  // Given: every supported packaging implementation can disable renderer-only enhancements.
  for (const scriptPath of [
    "scripts/build-macos.mjs",
    "scripts/build-windows.mjs",
    "scripts/windows-asar-overrides.mjs",
  ]) {
    const source = read(scriptPath);

    // When: the main process registers the backend bridge.
    // Then: only the service file controls availability; renderer feature flags must not disable usage.
    assert.doesNotMatch(
      source,
      /!pageEnhanceConfig\.enabled\|\|!fs\.existsSync\(servicePath\)/,
      `${scriptPath} should not disable the usage bridge with renderer feature flags`,
    );
  }
});

test("macOS rebuilds reuse a fresh official app download outside the cleaned source directory", () => {
  // Given: the macOS builder is commonly rerun several times while validating a release.
  const source = read("scripts/build-macos.mjs");

  // When: the downloaded official app is still fresh.
  // Then: it lives in a persistent work cache and is reused instead of downloading 587 MB again.
  assert.match(source, /downloadCacheDir/, "macOS builder should define a persistent download cache");
  assert.match(
    source,
    /path\.join\(projectRoot, "\.work", "download-cache", "macos"\)/,
    "download cache must live outside the work directory that every build cleans",
  );
  assert.match(source, /复用已缓存的 Codex 基包/, "macOS builder should expose cache reuse in its log");
  assert.match(source, /RUIZHI_CODEX_DOWNLOAD_CACHE_MAX_AGE_MS/, "cache freshness should be configurable");
});

test("macOS rebuilds inspect the Mach-O binary behind an existing launcher wrapper", () => {
  // Given: an already-installed Ruizhi app uses ChatGPT -> ChatGPT.bin to isolate user data.
  const source = read("scripts/build-macos.mjs");

  // When: the app is reused as a same-version local build source.
  // Then: architecture and fuse operations target the real .bin executable, not the shell wrapper.
  assert.match(source, /wrappedExecutablePath = `\$\{plistExecutablePath\}\.bin`/);
  assert.match(source, /return fs\.existsSync\(wrappedExecutablePath\) \? wrappedExecutablePath : plistExecutablePath/);
  assert.match(source, /const executablePath = findMainExecutable\(\)/);
});
