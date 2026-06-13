# 锐捷插件市场

锐智使用单一市场名 `ruijie-marketplace`，同时支持离线初始化和在线升级：

- 离线快照：`marketplaces/ruijie-marketplace`，随安装包内置，首次启动同步到运行态 home 的 `.tmp/marketplaces/ruijie-marketplace`。
- 在线来源：通过 `config/rj-codex.json` 的 `pluginMarketplaces[].online` 配置，当前地址为 `https://github.com/bs5189-web/ruijie-marketplace.git`。
- 运行态注册：`[marketplaces.ruijie-marketplace]` 写为 `source_type = "git"`，因此插件管理里的市场升级按钮可用。
- 离线兜底：Git 不可访问时，Codex 仍读取已经预置的本地快照，不会导致市场为空。

初始化在线仓库时，将 `marketplaces/ruijie-marketplace` 的内容作为仓库根目录提交即可：

```bash
rm -rf /tmp/ruijie-marketplace-init
mkdir -p /tmp/ruijie-marketplace-init
cp -R marketplaces/ruijie-marketplace/. /tmp/ruijie-marketplace-init/
cd /tmp/ruijie-marketplace-init
git init -b main
git add .
git commit -m "Initialize ruijie plugin marketplace"
git remote add origin https://github.com/bs5189-web/ruijie-marketplace.git
git push -u origin main
```

个人提交插件或技能时，按普通 Git PR 流程修改在线市场仓库：

1. 在 `plugins/<plugin-name>/` 下添加插件目录和 `.codex-plugin/plugin.json`。
2. 在 `.agents/plugins/marketplace.json` 的 `plugins` 数组中添加插件 entry。
3. 如有技能，放在插件目录的 `skills/<skill-name>/SKILL.md`。
4. 如有 MCP 或脚本，补充 `.mcp.json`、`scripts/` 和必要的权限说明。

在线市场更新失败时不影响离线快照；用户仍可看到内置的 `ruijie-marketplace`。
