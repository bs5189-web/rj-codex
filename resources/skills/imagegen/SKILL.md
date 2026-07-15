---
name: "锐捷-图片生成"
description: "通过锐擎 UniAPI 和 gpt-image-2 生成位图。适用于让 Codex 创建图片素材、视觉概念、产品图、UI mockup、封面、sprite 或其他生成图片。"
---

# 锐捷图片生成 Skill

项目需要生成图片或位图素材时使用本 skill。锐捷默认通过锐擎 UniAPI 调用，不要求用户额外安装 Python 包或手动设置 `OPENAI_API_KEY`。

## 执行

- 使用 `RUIZHI_IMAGEGEN_EXE` 指向的内置 helper。锐捷会打包为 `ruizhi-imagegen.exe`。
- 默认模型：`gpt-image-2`。
- 默认 API base URL 读取 `RUIZHI_OPENAI_BASE_URL`，未设置时使用 `https://gptauth.ruijie.com.cn/v1`。
- 认证信息按顺序读取 `RUIZHI_API_KEY`、`RUIZHI_HOME` / `CODEX_HOME` 下的 `auth.json`、`OPENAI_API_KEY`。
- 项目相关输出保存到当前 workspace，通常是 `output/imagegen/` 或用户指定路径。
- 生成前不要单独执行 `mkdir`，helper 会自动创建父目录。
- 不要只把素材留在临时目录或锐捷 home 目录中。
- 生成成功后，回复中要用 Markdown 图片语法内联渲染生成图，不要只给纯文本路径。
- Markdown 图片目标必须使用绝对文件路径。Windows 下把反斜杠转成正斜杠，例如 `![generated image](C:/Users/name/project/output/imagegen/output.png)`。
- 不要把 Markdown 图片语法包在代码块里。如有必要，可以简短说明保存路径。

## 生成

Windows 上使用 PowerShell：

```powershell
& $env:RUIZHI_IMAGEGEN_EXE generate --prompt "..." --out "output/imagegen/output.png" --quality medium --size auto --force
```

helper 会输出保存路径和一行 `Markdown`。最终回复直接使用这行 Markdown，让锐捷在对话中显示图片。

多个 prompt 时，创建 JSONL jobs 文件后运行：

```powershell
& $env:RUIZHI_IMAGEGEN_EXE generate-batch --jobs "jobs.jsonl" --out-dir "output/imagegen" --force
```

JSONL 每一行可以是 prompt 字符串，也可以是如下对象：

```json
{"prompt":"A clean product mockup on a white background","out":"output/imagegen/mockup.png","quality":"high"}
```

## 透明背景

`gpt-image-2` 不支持原生 `background=transparent`。简单透明素材可以先生成在纯色 chroma-key 背景上；如果 Codex 环境有 Python 和 Pillow，再运行本 skill 目录下内置的 `scripts/remove_chroma_key.py` helper。若本地 alpha 提取不可用或不适合，要明确说明，不要假装结果已经透明。

## 约束

- 正常生成时，不要要求用户安装 `openai`、`Pillow` 或其他图片依赖。
- 锐捷 APIKey 模式下不要使用官方内置 `image_gen` tool；此构建通过锐擎 UniAPI 路由图片生成。
- 不要打印 API key 或 `auth.json` 内容。
- 如果 API 返回错误，直接暴露 HTTP 状态码和错误信息。
