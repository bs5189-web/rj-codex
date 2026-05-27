import assert from "node:assert/strict";
import test from "node:test";

const windowsOverrides = await import("../scripts/windows-asar-overrides.mjs");

test("patchTrustedBrowserClientHashesSource replaces stale Browser client trusted hash", () => {
  assert.equal(typeof windowsOverrides.patchTrustedBrowserClientHashesSource, "function");

  const staleHash = "166098b9d347eab529245458a72c84f666c56a9d357a0e8c86cb72ae70f0e9c8";
  const currentHash = "167fdf579477181fba1773c1efb067b00c5a64fe85dafb50a2001bde198dc739";
  const source = [
    "var et=[`",
    staleHash,
    "`],tt=class{};",
    "function Kt({trustedBrowserClientSha256s:f=et}){return f}",
  ].join("");

  const patched = windowsOverrides.patchTrustedBrowserClientHashesSource(source, [currentHash]);

  assert.notEqual(patched, source);
  assert.match(patched, new RegExp(`var et=\\[\\\`${currentHash}\\\`\\]`));
  assert.doesNotMatch(patched, new RegExp(staleHash));
});

test("patchTrustedBrowserClientHashesSource is idempotent after hash update", () => {
  const currentHash = "167fdf579477181fba1773c1efb067b00c5a64fe85dafb50a2001bde198dc739";
  const source = [
    "var et=[`",
    currentHash,
    "`],tt=class{};",
    "function Kt({trustedBrowserClientSha256s:f=et}){return f}",
  ].join("");

  assert.equal(windowsOverrides.patchTrustedBrowserClientHashesSource(source, [currentHash]), source);
});

test("patchTrustedBrowserClientHashesSource handles current Codex main bundle hash shape", () => {
  const staleHash = "166098b9d347eab529245458a72c84f666c56a9d357a0e8c86cb72ae70f0e9c8";
  const currentHash = "167fdf579477181fba1773c1efb067b00c5a64fe85dafb50a2001bde198dc739";
  const source = [
    "async function St({trustedBrowserClientSha256s:f=Oe}){return f}",
    "var Oe=[`",
    staleHash,
    "`],ke=`chrome`,Ae=`chrome-dev`;",
  ].join("");

  const patched = windowsOverrides.patchTrustedBrowserClientHashesSource(source, [currentHash]);

  assert.notEqual(patched, source);
  assert.match(patched, new RegExp(`var Oe=\\[\\\`${currentHash}\\\`\\]`));
  assert.doesNotMatch(patched, new RegExp(staleHash));
  assert.doesNotMatch(patched, /,\d+=class/);
  assert.match(patched, /trustedBrowserClientSha256s:f=Oe/);
});

test("patchBrowserNativePipeDiagnosticsSource handles minified function name changes", () => {
  assert.equal(typeof windowsOverrides.patchBrowserNativePipeDiagnosticsSource, "function");

  const source = "function De({setBrowserUseNativePipeEnabled:e}){return{setDesktopFeatureAvailability:t=>{t.inAppBrowserUse!=null&&e(t.inAppBrowserUse)},dispose:()=>{e(!1)}}}";
  const patched = windowsOverrides.patchBrowserNativePipeDiagnosticsSource(source);

  assert.match(patched, /function De\(\{setBrowserUseNativePipeEnabled:e\}\)/);
  assert.match(patched, /ruizhiBrowserNativePipeEnabled/);
  assert.match(patched, /console\.info/);
});

test("patchBrowserNativePipePeerAuthorizationSource disables packaged macOS peer signing gate", () => {
  assert.equal(typeof windowsOverrides.patchBrowserNativePipePeerAuthorizationSource, "function");

  const source = [
    "var jI=`CODEX_BROWSER_USE_PEER_AUTHORIZATION`,MI=`browser-use-peer-authorization.node`;",
    "function NI(e){return e[jI]===`1`}",
    "var PI=t.ti(`browser-use-native-pipe-peer-authorizer`),FI=(0,b.createRequire)(__filename);",
    "function II(){if(process.platform!==`darwin`)return()=>({authorized:!0});let e=t.O.readFromPackageMetadata(),r=e!=null&&t.O.shouldIncludeBrowserUsePeerAuthorization(e,process.platform),a=!r&&NI(process.env);if(n.app?.isPackaged===!0&&e==null)return PI().warning(`browser-use native pipe peer authorization disabled`,{safe:{reason:`missing-package-build-flavor`},sensitive:{}}),()=>({authorized:!1,reason:`missing-package-build-flavor`});if(!r&&!a)return()=>({authorized:!0});let o=a?ct({env:process.env,resourcesPath:process.resourcesPath}):process.resourcesPath;if(o==null)throw Error(`Browser-use peer authorization requires resourcesPath`);let s;try{s=FI((0,i.join)(o,`native`,MI))}catch(e){throw Error(`Failed to load browser-use peer authorization addon`,{cause:e})}return PI().info(`browser-use native pipe peer authorization enabled`,{safe:{mode:a?`dev`:`packaged`},sensitive:{}}),e=>{let t=LI(e);return t==null?{authorized:!1,reason:`missing-socket-file-descriptor`}:s.authorizeSocketPeer(t,a)}}",
    "function LI(e){let t=e._handle?.fd;return typeof t==`number`&&Number.isInteger(t)&&t>=0?t:null}"
  ].join("");

  const patched = windowsOverrides.patchBrowserNativePipePeerAuthorizationSource(source);

  assert.notEqual(patched, source);
  assert.match(patched, /ruizhiBrowserNativePipePeerAuthorizationDisabled/);
  assert.match(patched, /function II\(\)\{/);
  assert.doesNotMatch(patched, /s\.authorizeSocketPeer/);
  assert.match(patched, /function LI\(e\)/);
});
