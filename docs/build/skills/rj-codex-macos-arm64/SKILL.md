---
name: rj-codex-macos-arm64
description: Use when building, verifying, documenting, or troubleshooting the rj-codex macOS Apple Silicon/arm64 desktop package from /Applications/Codex.app with scripts/build-macos.mjs. Applies to requests such as 打包 mac arm, macOS arm64 release, generating DMG/ZIP/update manifests, checking arm64/codesign output, verifying 锐智 onboarding copy, or keeping dist artifacts out of commits.
---

# rj-codex macOS arm64 打包

用于在 `/Volumes/ext_data/work/ai/rj-codex` 为锐智桌面端生成 macOS Apple Silicon/arm64 包，并验证产物。默认只把流程、脚本或文档提交到 Git；不要提交 `dist/` 产物，除非用户明确要求。

## 先决检查

1. 进入仓库：`cd /Volumes/ext_data/work/ai/rj-codex`。
2. 检查工作区：`git status --short --branch`，先识别已有脏改，后续只处理本任务相关文件。
3. 确认来源应用存在：`test -d /Applications/Codex.app`。如用户指定来源，使用 `CODEX_APP_ROOT=/path/to/Codex.app`。
4. 确认是在 macOS arm64 构建机上执行：`uname -m` 与 `node -p 'process.arch'` 都应为 `arm64`。
5. 确认来源 app 主程序是 arm64：`file /Applications/Codex.app/Contents/MacOS/Codex`。
6. 记录运行环境：`node -v`、`npm -v`、`pnpm -v`。

## 临时目录准备

本仓库常见状态是：

- `node_modules -> /tmp/ruizhi-build-deps/node_modules`
- `.work/macos -> /tmp/ruizhi-macos-work`

如果 `/tmp` 下目录被系统清理，构建会失败于 `Cannot find package 'fs-extra'` 或 `.work/macos` 创建。构建前可执行：

```bash
mkdir -p /tmp/ruizhi-build-deps /tmp/ruizhi-macos-work
if [ ! -d /tmp/ruizhi-build-deps/node_modules/fs-extra ]; then
  rm -rf /tmp/ruizhi-build-deps
  mkdir -p /tmp/ruizhi-build-deps
  cp package-lock.json /tmp/ruizhi-build-deps/package-lock.json
  node - <<'NODE' >/tmp/ruizhi-build-deps/package.json
const lock=require('./package-lock.json');
const root=lock.packages[''];
console.log(JSON.stringify({
  name:root.name||'ruizhi-desktop-builder',
  version:root.version||'0.0.0',
  private:true,
  dependencies:root.dependencies||{},
  devDependencies:root.devDependencies||{}
}, null, 2));
NODE
  npm ci --prefix /tmp/ruizhi-build-deps
fi
mkdir -p /tmp/ruizhi-macos-work
```

## 打包命令

默认 Apple Silicon/arm64 打包命令：

```bash
RUIZHI_MACOS_ARCH=arm64 node ./scripts/build-macos.mjs
```

如需指定 Codex.app 来源：

```bash
CODEX_APP_ROOT=/Applications/Codex.app RUIZHI_MACOS_ARCH=arm64 node ./scripts/build-macos.mjs
```

脚本会把 `RUIZHI_MACOS_ARCH` 规范化为 `arm64`，并要求构建机 `process.arch` 与目标架构一致。不要在 x64 主机硬搓 arm64 包。

## 脚本主要动作

- 清理并重建 `dist/macos` 与 `.work/macos`。
- 从 `CODEX_APP_ROOT` 或 `/Applications/Codex.app` 复制原始 app 到 `dist/macos/锐智.app`。
- 更新 `Info.plist` 元数据：显示名、Bundle ID、版本号等。
- 校验 app 主程序 Mach-O 架构包含 `arm64`。
- 编译并内置 `ruizhi-imagegen`。
- 同步运行态覆盖：模型目录、Responses bridge、页面增强、imagegen skill、插件 marketplace。
- 解包、补丁并重新打包 `app.asar`，包括中文化、更新逻辑、Browser/nativePipe、认证链接、菜单与帮助链接等补丁。
- 补丁欢迎页文案：`使用 ChatGPT 继续` -> `使用锐擎继续`。
- 补丁套餐标签：`所有 ChatGPT 套餐均包含` -> `锐智构建日期：<本地构建日期>`。
- 关闭 `app.asar` 完整性校验 fuse。
- 使用 `/usr/bin/xattr -cr` 清理扩展属性，避免 PATH 中 Python 版 `xattr` 不支持 `-cr`。
- 未配置 Developer ID secrets 时使用 ad-hoc 签名。
- 生成 ZIP、DMG、更新清单与 electron-updater 清单。

## 预期产物

版本号来自构建脚本和仓库配置；以下以 `0.2.3` 为例：

- `dist/Ruizhi-macos-0.2.3-arm64.dmg`
- `dist/Ruizhi-macos-0.2.3-arm64.zip`
- `dist/ruizhi-latest-macos-arm64.json`
- `dist/ruizhi-latest-macos-0.2.3-arm64.json`
- `dist/latest-mac-arm64.yml`
- `dist/latest-mac-0.2.3-arm64.yml`
- `dist/ruizhi-latest-macos.json`
- `dist/latest-mac.yml`
- `dist/latest.yml`

## 验证流程

构建完成后至少运行：

```bash
APP="/Volumes/ext_data/work/ai/rj-codex/dist/macos/锐智.app"
EXE="$APP/Contents/MacOS/Codex"

file "$EXE"
/usr/libexec/PlistBuddy \
  -c 'Print :CFBundleDisplayName' \
  -c 'Print :CFBundleIdentifier' \
  -c 'Print :CFBundleShortVersionString' \
  -c 'Print :CFBundleVersion' \
  "$APP/Contents/Info.plist"
codesign --verify --deep --strict --verbose=2 "$APP"
ls -lh dist/Ruizhi-macos-*-arm64.dmg dist/Ruizhi-macos-*-arm64.zip dist/ruizhi-latest-macos-arm64.json dist/latest-mac-arm64.yml
node -e "const m=require('./dist/ruizhi-latest-macos-arm64.json'); console.log(m.version, m.arch, m.macos.fileName, m.macos.size, m.macos.signed, m.macos.notarized)"
```

判断标准：

- `file "$EXE"` 输出包含 `Mach-O 64-bit executable arm64`。
- `CFBundleDisplayName` 应为 `锐智`。
- `CFBundleIdentifier` 应为 `cn.ruizhi.desktop`。
- `codesign --verify --deep --strict` 退出码为 `0`。
- `ruizhi-latest-macos-arm64.json` 中 `arch` 应为 `arm64`，`macos.fileName` 应指向 `Ruizhi-macos-<version>-arm64.zip`。

## 文案验证

如本次涉及欢迎页文案，解包最终 app 的 `app.asar` 验证：

```bash
rm -rf /tmp/ruizhi-built-asar-check
node - <<'NODE'
const asar=require('asar');
const fs=require('fs');
const path=require('path');
const appAsar='dist/macos/锐智.app/Contents/Resources/app.asar';
const out='/tmp/ruizhi-built-asar-check';
fs.rmSync(out,{recursive:true,force:true});
asar.extractAll(appAsar,out);
const today=new Date();
const buildDate=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const required=['使用锐擎继续',`锐智构建日期：${buildDate}`];
const forbidden=['使用 ChatGPT 继续','使用ChatGPT继续','所有 ChatGPT 套餐均包含','ChatGPT套餐均包含'];
let all='';
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name); const st=fs.statSync(p);
    if(st.isDirectory()) walk(p); else if(/\.(js|html|json)$/.test(name)) all += fs.readFileSync(p,'utf8')+'\n';
  }
}
walk(path.join(out,'webview'));
for(const text of required) console.log(`${text}: ${all.includes(text) ? 'FOUND' : 'MISSING'}`);
for(const text of forbidden) console.log(`${text}: ${all.includes(text) ? 'STILL_PRESENT' : 'absent'}`);
NODE
```

判断标准：必需文案为 `FOUND`，旧文案为 `absent`。

## 常见故障

- 找不到来源 app：先安装 `/Applications/Codex.app`，或设置 `CODEX_APP_ROOT`。
- 架构不匹配：arm64 包需要在 Apple Silicon macOS 构建机上执行。
- 找不到 `fs-extra`：恢复 `/tmp/ruizhi-build-deps`，确认 `node_modules` 符号链接有效。
- `.work/macos` 创建失败：恢复 `/tmp/ruizhi-macos-work`。
- `xattr -cr` 失败：确认构建脚本使用 `/usr/bin/xattr`，不要让 Python 版 `xattr` 抢先。
- 签名不是正式发布签名：未配置 `MACOS_CODESIGN_IDENTITY`、Developer ID 和 notarization secrets 时，脚本会使用 ad-hoc 签名，只适合内部验证。
- 推送或提交前：保留 `dist/` 为未跟踪/忽略产物，不要暂存发布包；只暂存文档、脚本或源码变更。

## 汇报模板

完成后向用户说明：

- 打包命令和来源 app。
- DMG、ZIP、arm64 清单的绝对路径。
- 架构、版本、签名、清单验证结果。
- 欢迎页按钮和构建日期文案验证结果。
- 是否使用 ad-hoc 签名，是否适合正式发布。
- 如执行了提交/推送，给出 commit hash 和目标分支。
