# 交付证据报告

## 一句话结论

两处文案修改和锐捷 OAuth 路由已进入 Windows/macOS 源码构建链；macOS 已重新打包，成品 `account/login/start` 返回 `gptauth.ruijie.com.cn`。Windows 实包仍需 Windows runner 复验，仓库完整测试仍有 20 个既有失败。

## 变更证据

| 项目 | 证据 | 结果 |
|---|---|---|
| OAuth 页面归属 | 当前锁定标签 `rust-v0.144.2` 的 `codex-rs/login/src/assets/success.html` 和 `success_legacy.html` | 已确认由 Codex CLI 内嵌页面生成 |
| OAuth 授权路由 | 成品 app-server 执行 `account/login/start` | 返回 `https://gptauth.ruijie.com.cn/oauth/authorize`，不再返回 OpenAI |
| 启动失败根因 | 系统 `.ips` 报告：`SIGKILL (Code Signature Invalid)`、`CODESIGNING / Invalid Page` | 已确认是补丁后内嵌 Codex 签名失效 |
| 二进制补丁安全 | 补丁后使用临时签名路径重签、严格校验，再原子替换最终文件；最终 `codex --version` 为 `0.144.2` | 通过 |
| 旧版页面预览 | `/tmp/ruizhi-codex-auth-success.png` | 显示“锐捷Codex / 授权完成，关闭本页” |
| 专项自动化 | 认证 issuer、登录成功页与 macOS 签名链 | 9/9 通过 |
| 依赖安装 | 恢复构建工程 `package.json` 后执行 `npm ci --ignore-scripts --no-audit --no-fund` | 通过，安装 286 个包 |
| macOS 实际打包 | 使用上游 0.144.2 桌面应用为源执行 `npm run build:macos` | 通过 |
| macOS 产物 | `Ruizhi-macos-0.3.1442-arm64.zip` 576MB；DMG 665MB | 已重新生成 |
| macOS 登录页字节 | `锐捷Codex=2`、旧版说明=1、新版说明=1；三段英文均为 0 | 通过 |
| macOS 模式名称 | 打包后 `zh-CN` locale 为 `<chatGpt>锐捷</chatGpt> <work>工作</work>` 与 `锐捷 编码` | 通过 |
| macOS 签名完整性 | 内嵌 `Contents/Resources/codex` 独立严格校验；外层 app 执行 `codesign --verify --deep --strict` | 均通过，但仅 ad-hoc 签名 |
| macOS 真实启动 | 启动 `dist/macos/锐捷Codex.app`，主进程和 `codex ... app-server` 持续运行，界面进入“请继续在浏览器中登录” | 通过；未再出现 failed to start |
| DMG 成品复核 | 只读挂载 DMG，从镜像内执行内嵌 Codex 严格签名校验、`--version` 和外层 app 深度校验 | 全部通过，版本 `0.144.2` |
| 崩溃回归 | 启动前记录时间，启动后检查 `~/Library/Logs/DiagnosticReports/codex-*.ips` | 无新增崩溃报告 |
| 源码质量 | 6 个改动 `.mjs` 文件 `node --check`；`git diff --check` | 通过 |

## 完整测试结果

| 指标 | 数值 |
|---|---:|
| 测试总数 | 97 |
| 通过 | 77 |
| 失败 | 20 |
| 本次新增专项测试失败 | 0 |

失败主要分为四类：

1. Windows 提取产物未提交，`overrides/windows-app/asar/.vite/build/preload.js`、`bootstrap.js` 等不存在。
2. 断言过期：版本仍期望 `0.3.144`，实际已是 `0.3.1442`；用户目录仍期望“锐捷Codex”，配置实际为 `Ruizhi`。
3. 配置与测试冲突：`pageEnhance.enabled=false`，测试仍期望开启。
4. 上游结构漂移：认证外部浏览器、插件 gate、更新器等若干补丁点在 0.144.2 构建日志中被跳过。

## 未完成门禁

| 门禁 | 状态 | 原因 |
|---|---|---|
| Windows 实包 | 未完成 | 当前机器是 macOS，且仓库未包含 `vendor/codex-desktop/windows/current/app` |
| Windows UI 截图 | 未完成 | 需要 Windows 11 runner 产包并执行一次真实 OAuth 与模式切换 |
| macOS 真实 OAuth 全流程 | 部分完成 | 已真实点击登录并观测 `account/login/start`、锐捷 `authUrl` 和“请继续在浏览器中登录”状态；未代替用户输入企业账号完成授权 |
| 正式发布签名 | 未完成 | 未提供 Apple Developer ID 和 notarization secrets |

## 结论边界

- 可以确认：源码修改、macOS 实际打包、产物字符串、内外层 ad-hoc 签名、桌面启动和 app-server 存活均通过。
- 不能确认：Windows 安装包实际界面、正式签名/公证、自动更新链路、全部旧测试恢复绿色。
