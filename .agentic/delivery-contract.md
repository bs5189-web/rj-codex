# 交付合同：登录成功页与模式名称修订

## 目标

1. Windows 与 macOS 打包产物中的 Codex OAuth 成功页改为锐捷中文文案。
2. 产品模式切换器中的编码模式统一显示为“锐捷 编码”。
3. 不改变现有布局、颜色、交互和认证流程。

## 范围

- `scripts/build-windows.mjs`
- `scripts/build-macos.mjs`
- `scripts/windows-asar-overrides.mjs`
- 新增可测试的 Codex CLI 内嵌页面二进制文案补丁模块
- 相关配置、测试和交付证据

## 非目标

- 不修改 `gptauth.ruijie.com.cn` 服务端认证逻辑。
- 不调整模型列表、模型协议或页面增强功能。
- 不发布、不推送远端、不生成正式签名安装包。

> 2026-07-16 需求变更：用户明确要求登录转向锐捷认证服务。新增的 OAuth 客户端路由修复以 `.agentic/auth-routing-fix-2026-07-16.md` 为准；仍未修改锐捷服务端业务逻辑。

## 已知输入与假设

- 基线分支：`gpt-codex-0.3.1442`
- 基线提交：`7985b8f81ba9ea9ca4ef1343ddc6b18b0364c6a6`
- OAuth 成功页来自上游 `openai/codex` 的 `codex-rs/login/src/assets/success*.html`，并以内嵌文本形式进入 Codex CLI 二进制。
- 当前仓库未包含可直接打包的 Windows/macOS 上游应用源，因此本次以源码测试和二进制夹具验证为主；真实安装包界面必须在补齐源应用后复验。

## 完成定义

- 两个平台的构建链都调用同一个登录成功页品牌化补丁。
- 旧版与新版 OAuth 成功页字符串均有自动化测试覆盖。
- Windows、macOS 的编码模式均输出“锐捷 编码”。
- 专项测试通过，完整测试结果和已知失败被记录。
- `.agentic/evidence-report.md` 有可复核证据。
