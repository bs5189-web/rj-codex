# 锐捷 Codex 模式名称与插件加载修复报告

> 一句话结论：`锐捷 编码` 的空格已修正，插件页的 OpenAI 目录 401 已从内置 Codex 核心调用链切断，macOS 0.3.1442 安装包已重新构建并通过本地协议验收。

## 1. 修复结果

| 项目 | 修复前 | 修复后 | 验证证据 |
|---|---|---|---|
| 模式名称 | `锐捷编码` | `锐捷 编码` | 最终 `app.asar` 中精确值出现于 2 个文件，连续写法为 0 个文件 |
| 插件目录 | 请求 `chatgpt.com/backend-api/ps/plugins/*`，认证令牌不兼容时返回 401 | 企业版 `plugin/list` 固定读取本地 marketplace；OpenAI Curated 远程集合直接返回空结果 | 对最终内置 `codex app-server` 发起 `marketplaceKinds=["vertical"]` 请求，`error=null`、`marketplaceLoadErrors=[]` |
| 锐捷插件注册 | 启动迁移旧技能目录失败时，后续市场同步被中断 | 旧技能迁移失败只记录错误，不再中断 marketplace 同步 | 全新隔离目录首次启动后，配置自动注册锐捷市场，缓存插件数为 7 |
| 安装包 | 旧包仍包含上述问题 | 已重新生成 DMG 和 ZIP | 构建退出码 0，macOS 深度签名校验通过 |

## 2. 根因分析

### 2.1 插件为什么加载失败

插件失败由两个独立问题叠加：

1. 内置 Codex 收到前端的 `vertical` 目录请求后，会访问 OpenAI 的远程插件服务；锐捷认证令牌不能被该服务解析，因此返回 401。
2. 启动阶段迁移 `~/.codex/skills` 时，某个失效目录可触发 `ENOENT`。异常没有被隔离，导致后续锐捷 marketplace 注册和插件缓存同步没有执行。

只修第二项可以让本地插件落盘，但页面仍会因第一项 401 显示“插件加载失败”；因此两处都必须修。

### 2.2 为什么需要在 Codex 核心层修

仅在页面层隐藏错误不能解决请求仍在发生的问题。本次修改在构建内置 Codex CLI 时应用源码补丁：

```mermaid
flowchart LR
    A[插件页请求 plugin/list] --> B[内置 Codex app-server]
    B --> C[只读取本地 marketplace]
    C --> D[锐捷插件 7 个]
    B -. 已禁用 .-> E[OpenAI Curated 远程目录]
```

## 3. 验收记录

| 验收项 | 结果 |
|---|---|
| 针对性自动测试 | 6/6 通过 |
| 完整测试 | 101 项中 81 通过、20 失败 |
| 本次新增插件与认证测试 | 全部通过 |
| 完整测试失败性质 | 主要为仓库原有 Windows override 目录缺失和旧版本断言；与本次两项修复无直接关联 |
| macOS 构建 | 通过 |
| macOS 深度代码签名校验 | 通过，当前为 ad-hoc 签名 |
| 全新目录首次启动 | 自动注册锐捷 marketplace，缓存 7 个插件 |
| 最终内置 app-server 协议验收 | 市场：`openai-bundled`、本地 `openai-curated`、`ruijie-marketplace`；锐捷插件 7 个；加载错误 0 |
| 调试代码检查 | 最终 `app.asar` 不含临时调试日志标记 |

## 4. 交付物

| 文件 | 大小 | SHA-256 |
|---|---:|---|
| `dist/Ruizhi-macos-0.3.1442-arm64.dmg` | 712,072,811 字节 | `cf773fc439b102cf1e253531d4644be1b8b0f464f6031cf25aed25f96ad9ce2a` |
| `dist/Ruizhi-macos-0.3.1442-arm64.zip` | 588,229,312 字节 | `1e1f7bc9ba3e30b5e1f01cffc3d6c86300627c2a759e75ec80d88848166392a6` |

## 5. 安装与测试建议

1. 退出当前 `/Applications/锐捷Codex.app`。旧安装仍会显示 401，必须被新包替换。
2. 打开 DMG，把新的“锐捷Codex”拖入“应用程序”并选择替换。
3. 首次打开后进入“插件”，应能看到锐捷插件且不再出现 OpenAI 401。
4. 当前包使用 ad-hoc 签名，适合内部测试；正式大规模分发前仍需 Developer ID 签名和 Apple notarization。

## 6. 尚未完成的边界

- Windows 构建脚本已同步相同修复逻辑，但本轮没有在 Windows 主机生成并实测安装包，因此不能宣称 Windows 产物已验收。
- 完整测试中的 20 个历史失败应单独治理，尤其是缺失的 `overrides/windows-app/asar` 测试夹具与旧版本断言；它们不阻塞本次 macOS 两项修复，但会降低日常持续集成的可信度。
