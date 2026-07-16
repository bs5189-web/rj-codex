# 验收矩阵

| 编号 | 场景 | 预期结果 | 验证方式 | 状态 |
|---|---|---|---|---|
| AC-01 | 旧版 OAuth 成功页 | `Signed in to Codex` 与 `You may now close this page` 被替换为锐捷中文文案 | 二进制夹具自动化测试 + 浏览器截图 | 通过 |
| AC-02 | 新版 OAuth 成功页 | 标题与关闭页提示被替换，且二进制长度不变 | 二进制夹具自动化测试 + 真实 Codex CLI 二进制检查 | 通过 |
| AC-03 | Windows 打包 | `resources/codex.exe` 在打包、签名前应用成功页补丁 | 源码契约测试 | 源码通过，待 Windows runner 实包验证 |
| AC-04 | macOS 打包 | `Contents/Resources/codex` 在签名前应用成功页补丁 | 实际 macOS 打包 + 产物字节检查 | 通过 |
| AC-05 | Windows 模式切换 | 编码模式显示“锐捷 编码” | 本地化源码契约测试 | 源码通过，待 Windows runner 实包验证 |
| AC-06 | macOS 模式切换 | 编码模式显示“锐捷 编码” | 打包后 `zh-CN` locale 检查 | 通过 |
| AC-07 | 工作模式 | 保持“锐捷 工作”，不产生回归 | 专项自动化测试 + 打包后 locale 检查 | 通过 |
| AC-08 | 认证边界 | 授权、token 交换和注销均使用锐捷 issuer，保持 Authorization Code + PKCE S256 | 源码补丁测试 + 成品 app-server 探测 | macOS 通过，Windows 待实包 |

## 人工验收门

真实安装包产出后，需要在 Windows 11 与 macOS 各完成一次：

1. 退出登录后重新发起 Codex 授权。
2. 核对浏览器成功页标题和提示文案。
3. 返回应用，核对“锐捷 工作 / 锐捷 编码”模式切换。
4. 截图归档后，才能把真实 UI 验收状态改为“通过”。
