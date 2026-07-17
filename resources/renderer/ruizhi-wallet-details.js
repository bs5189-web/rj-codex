(function ruizhiWalletDetailsModule(globalScope) {
  const rootId = "ruizhi-wallet-details";
  const styleId = "ruizhi-wallet-details-style";
  const marker = "RUIZHI_WALLET_DETAILS_V1";

  function installRuizhiWalletDetails(env = {}) {
    const window = env.window || globalScope.window;
    const document = env.document || window?.document || globalScope.document;
    if (!window || !document) return null;

    let disposed = false;
    let observer = null;
    let scanTimer = null;

    function findWalletCard() {
      const label = Array.from(document.querySelectorAll("div,span"))
        .find((node) => (node.textContent || "").trim() === "账户额度");
      if (!(label instanceof window.HTMLElement)) return null;
      let row = label;
      for (let depth = 0; row && depth < 7; depth += 1, row = row.parentElement) {
        if (row.querySelector?.("progress[aria-label='剩余用量']")) return row.parentElement;
      }
      return null;
    }

    function removeDetails() {
      document.getElementById(rootId)?.remove();
    }

    function injectStyle() {
      if (document.getElementById(styleId)) return;
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        #${rootId}{display:grid;gap:12px;margin-bottom:24px;color:var(--color-token-text-primary,var(--token-text-primary,#f3f4f6));font-family:system-ui,sans-serif}
        #${rootId} .ruizhi-wallet-heading{display:grid;gap:4px}
        #${rootId} .ruizhi-wallet-title{font-size:14px;font-weight:600}
        #${rootId} .ruizhi-wallet-subtitle{font-size:13px;color:var(--color-token-text-secondary,var(--token-text-secondary,#9ca3af))}
        #${rootId} .ruizhi-wallet-card{display:grid;gap:18px;padding:18px 20px;border:1px solid var(--color-token-border,var(--token-border,#3f3f46));border-radius:16px;background:var(--color-background-panel,var(--color-token-bg-fog,#242424))}
        #${rootId} .ruizhi-wallet-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        #${rootId} .ruizhi-wallet-metric{display:grid;gap:5px;min-width:0}
        #${rootId} .ruizhi-wallet-label{font-size:12px;color:var(--color-token-text-secondary,var(--token-text-secondary,#9ca3af))}
        #${rootId} .ruizhi-wallet-value{font-size:20px;font-weight:650;line-height:1.2;letter-spacing:-.01em;white-space:nowrap;font-variant-numeric:tabular-nums}
        #${rootId} .ruizhi-wallet-progress{display:grid;gap:8px}
        #${rootId} progress{width:100%;height:7px;overflow:hidden;border:0;border-radius:999px;background:rgba(127,127,127,.2)}
        #${rootId} progress::-webkit-progress-bar{background:rgba(127,127,127,.2);border-radius:999px}
        #${rootId} progress::-webkit-progress-value{background:var(--color-token-text-link-foreground,var(--token-text-link-foreground,#60a5fa));border-radius:999px}
        #${rootId} .ruizhi-wallet-progress-labels{display:flex;justify-content:space-between;gap:16px;font-size:12px;color:var(--color-token-text-secondary,var(--token-text-secondary,#9ca3af));font-variant-numeric:tabular-nums}
        #${rootId} .ruizhi-wallet-error{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:13px}
        #${rootId} button{border:1px solid var(--color-token-border,var(--token-border,#52525b));border-radius:8px;background:transparent;color:inherit;padding:6px 12px;cursor:pointer}
        @media(max-width:760px){#${rootId} .ruizhi-wallet-metrics{grid-template-columns:1fr}#${rootId} .ruizhi-wallet-value{font-size:18px}}
      `;
      document.head.appendChild(style);
    }

    function createRoot(walletCard) {
      const root = document.createElement("section");
      root.id = rootId;
      root.dataset.ruizhiMarker = marker;
      root.setAttribute("aria-label", "锐捷账户额度明细");
      walletCard.parentElement?.insertBefore(root, walletCard);
      return root;
    }

    function finiteAmount(value, name) {
      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0) throw new Error(`${name}无效`);
      return amount;
    }

    function formatAmount(value) {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "USD",
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(value);
    }

    function formatPercent(value) {
      return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 }).format(value);
    }

    function renderMetric(document, label, value) {
      const metric = document.createElement("div");
      metric.className = "ruizhi-wallet-metric";
      const labelNode = document.createElement("span");
      labelNode.className = "ruizhi-wallet-label";
      labelNode.textContent = label;
      const valueNode = document.createElement("strong");
      valueNode.className = "ruizhi-wallet-value";
      valueNode.textContent = formatAmount(value);
      metric.append(labelNode, valueNode);
      return metric;
    }

    function renderDetails(root, metadata) {
      const limit = finiteAmount(metadata.limit_usd, "总额度");
      const used = finiteAmount(metadata.used_usd, "已使用额度");
      const remaining = finiteAmount(metadata.remaining_usd, "剩余额度");
      const usedPercent = limit === 0 ? 0 : Math.max(0, Math.min(100, (used / limit) * 100));
      root.replaceChildren();

      const heading = document.createElement("div");
      heading.className = "ruizhi-wallet-heading";
      const title = document.createElement("div");
      title.className = "ruizhi-wallet-title";
      title.textContent = "账户额度明细";
      const subtitle = document.createElement("div");
      subtitle.className = "ruizhi-wallet-subtitle";
      subtitle.textContent = "数据来自锐鉴 API 模型平台，按当前账户累计。";
      heading.append(title, subtitle);

      const card = document.createElement("div");
      card.className = "ruizhi-wallet-card";
      const metrics = document.createElement("div");
      metrics.className = "ruizhi-wallet-metrics";
      metrics.append(
        renderMetric(document, "总额度", limit),
        renderMetric(document, "已使用", used),
        renderMetric(document, "剩余余额", remaining),
      );
      const progressWrap = document.createElement("div");
      progressWrap.className = "ruizhi-wallet-progress";
      const progress = document.createElement("progress");
      progress.max = 100;
      progress.value = usedPercent;
      progress.setAttribute("aria-label", "账户额度使用比例");
      const progressLabels = document.createElement("div");
      progressLabels.className = "ruizhi-wallet-progress-labels";
      const usedLabel = document.createElement("span");
      usedLabel.textContent = `使用比例 ${formatPercent(usedPercent)}%`;
      const remainingLabel = document.createElement("span");
      remainingLabel.textContent = `剩余 ${formatPercent(100 - usedPercent)}%`;
      progressLabels.append(usedLabel, remainingLabel);
      progressWrap.append(progress, progressLabels);
      card.append(metrics, progressWrap);
      root.append(heading, card);
      root.dataset.status = "ready";
    }

    function renderError(root, error) {
      root.replaceChildren();
      const line = document.createElement("div");
      line.className = "ruizhi-wallet-error";
      const message = document.createElement("span");
      message.textContent = `额度明细加载失败：${String(error?.message || error)}`;
      const retry = document.createElement("button");
      retry.type = "button";
      retry.textContent = "重试";
      retry.addEventListener("click", () => {
        root.dataset.status = "";
        scheduleScan();
      }, { once: true });
      line.append(message, retry);
      root.append(line);
      root.dataset.status = "error";
    }

    async function scan() {
      if (disposed) return;
      const walletCard = findWalletCard();
      if (!walletCard) {
        removeDetails();
        return;
      }
      injectStyle();
      const root = document.getElementById(rootId) || createRoot(walletCard);
      if (root.dataset.status === "loading" || root.dataset.status === "ready" || root.dataset.status === "error") return;
      root.dataset.status = "loading";
      root.textContent = "正在加载账户额度明细…";
      try {
        const bridge = window.ruizhiDesktop?.enhance;
        if (!bridge || typeof bridge.call !== "function") throw new Error("额度服务不可用");
        const result = await bridge.call("/usage/platform", {});
        if (result?.status !== "ok" || !result.metadata) throw new Error(result?.message || "额度数据无效");
        if (!disposed && root.isConnected) renderDetails(root, result.metadata);
      } catch (error) {
        if (!disposed && root.isConnected) renderError(root, error);
      }
    }

    function scheduleScan() {
      if (disposed || scanTimer) return;
      scanTimer = window.setTimeout(() => {
        scanTimer = null;
        void scan();
      }, 120);
    }

    function dispose() {
      disposed = true;
      if (scanTimer) window.clearTimeout(scanTimer);
      observer?.disconnect();
      removeDetails();
      document.getElementById(styleId)?.remove();
    }

    observer = new window.MutationObserver(scheduleScan);
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    scheduleScan();
    return { dispose, scan: scheduleScan };
  }

  globalScope.__RUIZHI_INSTALL_WALLET_DETAILS__ = installRuizhiWalletDetails;
})(typeof globalThis !== "undefined" ? globalThis : this);
