# ChatGPT.app app.asar 源码结构分析

分析对象：`/Applications/ChatGPT.app/Contents/Resources/app.asar`

分析日期：2026-07-11

## 结论摘要

- 该包可以解包并阅读，但不是完整原始源码仓库，而是 Electron + Vite/Rolldown 构建后的产物。
- 根入口是 `package.json` 的 `main: .vite/build/early-bootstrap.js`。
- 主进程核心逻辑集中在 `.vite/build/main-CH17cjbj.js`，格式化后约 84,710 行。
- 包内没有 `.map` sourcemap，文件末尾虽然保留 `sourceMappingURL` 注释，但实际未打包 `.map` 文件，因此不能精确还原原始 TypeScript 文件名和模块边界。
- Renderer 前端在 `webview/` 下，入口 HTML 和大量按路由/页面切分的 ESM chunk 都在包内，可以继续做字符串级和模块级分析。
- 对锐智覆盖层来说，可行策略是继续基于构建产物做定点 patch 或在构建脚本中做稳定字符串替换；不建议试图完整“反编译回源码工程”。

## 包基础信息

从解包后的 `package.json` 可见：

- `name`: `openai-codex-electron`
- `productName`: `Codex`
- `version`: `26.707.31428`
- `main`: `.vite/build/early-bootstrap.js`
- `codexBuildFlavor`: `prod`
- `codexBuildNumber`: `5059`
- `codexAppBrand`: `chatgpt`
- `codexSparkleFeedUrl`: `https://persistent.oaistatic.com/codex-app-prod/appcast.xml`

主要运行时依赖包括：

- Electron/Sentry：`@sentry/electron`、`@sentry/node`
- Codex/桌面协议：`app-server-types`、`commands`、`protocol`、`shared-node`
- 插件/浏览器能力：`browser-api`、`browser-common`、`browser-backend-common`
- 本地执行能力：`node-pty`、`better-sqlite3`、`ws`、`which`、`shlex`
- 插件设备能力：`@worklouder/device-kit-oai`、`@worklouder/wl-device-kit`

## 解包后的主要目录

```text
.vite/build/                     主进程、preload、worker、SQLite 等构建产物
webview/                         Renderer 前端入口和资产 chunk
native-menu-locales/             原生菜单多语言文案
node_modules/                    随包依赖，包含部分 .d.ts 和第三方源码
package.json                     应用包元信息
```

## `.vite/build` 文件体量

```text
main-CH17cjbj.js                 1,743,361 bytes   主进程核心
sqlite-BqLffnB9.js               4,365,922 bytes   SQLite/native 相关 bundle
worker.js                        1,464,579 bytes   worker bundle
src-BAGkFo-J.js                  1,225,734 bytes   共享运行时代码/协议/常量
child-process-snapshot-worker.js   581,700 bytes   子进程快照 worker
comment-preload.js                 340,080 bytes   评论/视图 preload
core-BamTdLgb.js                    54,419 bytes   文件类型等核心工具
bootstrap-B6OtqZMf.js               15,294 bytes   启动 bootstrap
codex-micro-service-Bm59YbrT.js     13,502 bytes   微服务相关入口
preload.js                           3,229 bytes   主窗口 preload
sandbox-preload.js                   2,283 bytes   MCP sandbox preload
early-bootstrap.js                     216 bytes   最早入口
```

## 启动链路

启动入口非常清晰：

```text
package.json
  -> .vite/build/early-bootstrap.js
  -> desktop-open-path-queue 初始化
  -> bootstrap-B6OtqZMf.js
  -> app.whenReady()
  -> 动态 require('./main-CH17cjbj.js')
  -> runMainAppStartup()
```

`early-bootstrap.js` 只做三件事：加载共享 runtime、初始化 macOS open-path queue、异步加载 bootstrap。

`bootstrap-B6OtqZMf.js` 负责：

- 解析构建 flavor 和应用名。
- 设置 Electron `userData` 路径。
- 处理单实例锁。
- macOS x64/Rosetta 场景弹出 Intel build 警告。
- macOS DMG 安装迁移逻辑：提示/移动到 Applications、卸载 source DMG。
- 初始化 Sparkle 更新管理器。
- 加载主进程 `main-CH17cjbj.js` 并执行 `runMainAppStartup`。

## 主进程关键点

`main-CH17cjbj.js` 是核心文件。因为变量名被压缩，建议按字符串和类行为定位，而不是依赖函数名。

已确认的关键字符串/通道：

```text
codex_desktop:message-from-view
codex_desktop:message-for-view
codex_desktop:browser-sidebar-runtime-message
codex_desktop:mcp-app-sandbox-guest-message
codex_desktop:mcp-app-sandbox-host-message
codex_desktop:show-context-menu
codex_desktop:show-application-menu
codex_desktop:get-sentry-init-options
codex_desktop:get-build-flavor
codex_desktop:get-uses-owl-app-shell
codex_desktop:get-system-theme-variant
codex_desktop:get-shared-object-snapshot
codex_desktop:get-fast-mode-rollout-metrics
codex_desktop:system-theme-variant-updated
codex_desktop:trigger-sentry-test
codex_desktop:connect-app-host
codex_desktop:start-file-drag
```

这些通道构成 renderer 与主进程之间的桥接层，也是锐智定制时最常用的 patch 入口。

## 窗口与 preload

主窗口和辅助窗口都通过 `BrowserWindow` 创建。已定位到几类窗口：

- 主应用窗口：`main-CH17cjbj.js` 中多处 `BrowserWindow` 与 `loadURL`。
- 宠物/头像 overlay 窗口：透明、无边框、父窗口绑定，加载 `avatar-overlay-composition-surface.html`。
- About/更新类窗口：用 `data:text/html` 加载内联 HTML，禁用 node integration、启用 sandbox。
- MCP sandbox 窗口/guest webContents：使用独立 `sandbox-preload.js`。

`preload.js` 暴露到 renderer 的主要对象是：

```text
window.codexWindowType
window.electronBridge
```

`electronBridge` 提供：

- 主进程消息发送/订阅。
- 原生菜单和上下文菜单。
- Sentry 初始化参数。
- build flavor、系统主题、fast mode rollout metrics。
- app session id。
- 文件拖拽。
- `connect-app-host` MessagePort 桥接。

`sandbox-preload.js` 只允许 `https://web-sandbox.oaiusercontent.com` 及其子域，并要求 skybridge 参数：

```text
app=skybridge
deviceType=desktop
unsafeSkipTargetOriginCheck=true
```

然后把经过校验的 MCP app sandbox ports 交给主进程通道 `codex_desktop:mcp-app-sandbox-guest-message`。

## Renderer 前端

`webview/index.html` 是主 renderer 入口，`webview/avatar-overlay-composition-surface.html` 是头像/宠物 overlay 入口。

前端 chunk 文件名暴露了很多页面和能力线索，例如：

- `app-main`
- `onboarding-page`
- `hotkey-window-thread-page`
- `quick-chat-window-page`
- `chatgpt-conversation-page`
- `mcp-capability-view-page`
- `settings-page`
- `projects-index-page`
- `pull-request-code-review`
- `appgen-library-page`
- `first-run`

这说明包里包含完整桌面 UI 的构建产物，但同样没有 sourcemap，适合按页面 chunk 做局部分析。

## 插件与 marketplace

主进程内保留大量 plugin/marketplace 逻辑，关键线索包括：

- 默认 marketplace 名：`openai-bundled`
- 插件描述文件路径：`.codex-plugin/plugin.json`
- runtime marketplace 临时目录：`.tmp/bundled-marketplaces/<marketplaceName>`
- Codex home 下的插件目录：`plugins/`、`skills/`、`cowork_plugins/`、`.local-plugins/`、`.remote-plugins/`
- 配置文件：`config.toml`

已定位到这些典型行为：

- 安装 bundled marketplace 插件。
- 清理 stale bundled marketplace。
- 读取 marketplace 插件描述。
- 校验 plugin path 不逃逸 marketplace root。
- 通过 app-server connection 查询/移除 marketplace。

对锐智项目有价值的是：官方包仍然把 `openai-bundled` 当成默认内置插件源，后续覆盖层可以围绕 marketplace 名称、缓存目录和插件描述同步逻辑做 patch。

## Codex 子进程与本地执行

主进程 bundle 中包含本地执行相关逻辑：

- `node-pty` 被动态加载，用于终端/伪终端能力。
- 存在 `codexHome`、`config.toml`、skills、plugins、marketplace 目录扫描逻辑。
- 包含 child-process snapshot worker。
- 包含 `codex-micro-service` bundle，可能承担本地服务或桥接任务。

这与锐智桌面版当前维护重点一致：桌面壳负责 UI、配置、插件同步和本地 app-server/CLI 连接，真实任务执行仍然经由 Codex runtime/子进程体系。

## 网络与服务端线索

主进程内可见：

```text
https://chatgpt.com/backend-api
http://localhost:8000/api
https://chatgpt.com/codex/install.sh
https://chatgpt.com/codex/install.ps1
/backend-api/subscriptions/update
/backend-api/wham
```

`package.json` 中还可见 Sparkle 更新源：

```text
https://persistent.oaistatic.com/codex-app-prod/appcast.xml
```

这印证了此前判断：桌面插件商店、账号态和订阅相关能力仍有 `chatgpt.com/backend-api` 服务端依赖；仅靠本地配置无法绕过账号态限制。

## 可继续深入的方向

建议按目标选择下一步：

1. **做锐智覆盖层 patch**：优先定位 `preload.js`、`main-CH17cjbj.js`、`webview/assets/*` 里的稳定字符串，写入构建脚本自动替换。
2. **分析插件商店**：围绕 `openai-bundled`、`.codex-plugin/plugin.json`、`marketplace/remove`、`listPlugins` 做局部格式化和调用链索引。
3. **分析账号/网络限制**：围绕 `https://chatgpt.com/backend-api`、`/backend-api/subscriptions/update`、`/backend-api/wham` 做请求构造和 UI fallback 分析。
4. **分析窗口/UI 加载**：围绕 `loadURL`、`BrowserWindow`、`webview/index.html` 做窗口类型、路由和权限矩阵。
5. **分析 MCP app sandbox**：围绕 `sandbox-preload.js`、`web-sandbox.oaiusercontent.com`、`mcp-app-sandbox-*` 通道做安全模型梳理。

## 临时分析产物

本次分析使用的临时目录：

```text
/tmp/chatgpt-asar-src
/tmp/chatgpt-asar-analysis
```

其中 `/tmp/chatgpt-asar-analysis/pretty/` 保存了格式化后的关键构建文件，便于继续人工阅读。它们没有写入 git 工作区，避免把大体量构建产物提交进仓库。
