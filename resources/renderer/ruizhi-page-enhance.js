(() => {
  const runtimeKey = "__RUIZHI_PAGE_ENHANCE_RUNTIME__";
  const previous = window[runtimeKey];
  if (previous && typeof previous.dispose === "function") previous.dispose();

  const markers = {
    pluginEntry: "RUIZHI_PLUGIN_ENTRY_UNLOCK_V1",
    forcePluginInstall: "RUIZHI_FORCE_PLUGIN_INSTALL_V1",
    sessionActions: "RUIZHI_SESSION_ACTIONS_V1",
    timeline: "RUIZHI_CONVERSATION_TIMELINE_V1",
    threadScroll: "RUIZHI_THREAD_SCROLL_RESTORE_V1"
  };
  window.__RUIZHI_PAGE_ENHANCE_MARKERS__ = markers;

  const defaultFeatures = {
    menu: true,
    pluginEntryUnlock: true,
    forcePluginInstall: true,
    sessionDelete: true,
    markdownExport: true,
    projectMove: true,
    timeline: true,
    threadScrollRestore: true,
    modelWhitelistUnlock: false,
    zedRemoteOpen: false,
    upstreamWorktreeCreate: false,
    serviceTierControls: false
  };

  const cleanup = [];
  const state = {
    disposed: false,
    settings: normalizeSettings(window.__RUIZHI_PAGE_ENHANCE_CONFIG__ || {}),
    scanTimer: null,
    observer: null,
    forcePluginTimer: null,
    scrollSaveTimer: null
  };

  window[runtimeKey] = { dispose, scan };

  function normalizeSettings(value) {
    const features = value && typeof value === "object" && value.features && typeof value.features === "object" ? value.features : {};
    return {
      enabled: value?.enabled !== false,
      features: { ...defaultFeatures, ...features }
    };
  }

  function feature(name) {
    return state.settings.enabled !== false && state.settings.features[name] !== false;
  }

  function bridgeCall(route, payload) {
    const enhance = window.ruizhiDesktop && window.ruizhiDesktop.enhance;
    if (!enhance || typeof enhance.call !== "function") {
      return Promise.resolve({ status: "failed", message: "增强 bridge 不可用" });
    }
    return enhance.call(route, payload || {});
  }

  function on(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    cleanup.push(() => target.removeEventListener(event, handler, options));
  }

  function dispose() {
    state.disposed = true;
    if (state.scanTimer) clearTimeout(state.scanTimer);
    if (state.forcePluginTimer) clearInterval(state.forcePluginTimer);
    if (state.scrollSaveTimer) clearTimeout(state.scrollSaveTimer);
    if (state.observer) state.observer.disconnect();
    while (cleanup.length) {
      try {
        cleanup.pop()();
      } catch {
      }
    }
    document.querySelectorAll("#ruizhi-page-enhance-style,#ruizhi-page-enhance-menu,.ruizhi-enhance-toast,.ruizhi-conversation-timeline").forEach((node) => node.remove());
    document.querySelectorAll(".ruizhi-session-actions,.ruizhi-project-move-overlay").forEach((node) => node.remove());
  }

  function injectStyle() {
    if (document.getElementById("ruizhi-page-enhance-style")) return;
    const style = document.createElement("style");
    style.id = "ruizhi-page-enhance-style";
    style.textContent = `
      #ruizhi-page-enhance-menu{position:fixed;right:14px;bottom:14px;z-index:99998;font:13px system-ui,sans-serif}
      #ruizhi-page-enhance-menu button{border:1px solid rgba(127,127,127,.35);border-radius:7px;background:var(--token-main-surface-primary,#202123);color:var(--token-text-primary,#fff);padding:7px 10px;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer}
      #ruizhi-page-enhance-menu [data-panel]{position:absolute;right:0;bottom:38px;min-width:220px;border:1px solid rgba(127,127,127,.35);border-radius:8px;background:var(--token-main-surface-primary,#202123);box-shadow:0 16px 40px rgba(0,0,0,.24);padding:8px;display:none}
      #ruizhi-page-enhance-menu[data-open="true"] [data-panel]{display:grid;gap:6px}
      #ruizhi-page-enhance-menu label{display:flex;align-items:center;justify-content:space-between;gap:12px;color:inherit}
      .ruizhi-enhance-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;max-width:min(560px,calc(100vw - 32px));border-radius:8px;background:#111827;color:#fff;padding:10px 12px;font:13px system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.25)}
      .ruizhi-enhance-toast button{margin-left:10px;color:#93c5fd;background:transparent;border:0;cursor:pointer}
      .ruizhi-session-actions{position:absolute;right:28px;top:50%;transform:translateY(-50%);display:flex;gap:4px;opacity:0;z-index:10}
      [data-ruizhi-session-row="true"]{position:relative}
      [data-ruizhi-session-row="true"]:hover .ruizhi-session-actions,.ruizhi-session-actions:focus-within{opacity:1}
      .ruizhi-session-actions button{width:24px;height:24px;display:grid;place-items:center;border:1px solid rgba(127,127,127,.35);border-radius:6px;background:var(--token-main-surface-primary,#fff);color:inherit;cursor:pointer;padding:0}
      .codex-force-install-unlocked{pointer-events:auto!important;cursor:pointer!important;opacity:1!important}
      .ruizhi-project-move-overlay{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.18)}
      .ruizhi-project-move-panel{position:absolute;right:18px;top:72px;width:min(360px,calc(100vw - 36px));max-height:min(520px,calc(100vh - 96px));overflow:auto;border:1px solid rgba(127,127,127,.35);border-radius:8px;background:var(--token-main-surface-primary,#202123);color:inherit;padding:8px;box-shadow:0 16px 40px rgba(0,0,0,.24)}
      .ruizhi-project-move-panel button{display:block;width:100%;text-align:left;border:0;border-radius:6px;background:transparent;color:inherit;padding:8px;cursor:pointer}
      .ruizhi-project-move-panel button:hover{background:rgba(127,127,127,.13)}
      .ruizhi-conversation-timeline{position:fixed;right:8px;top:96px;bottom:96px;width:18px;z-index:9999}
      .ruizhi-conversation-timeline-track{position:absolute;left:8px;top:0;bottom:0;width:2px;background:rgba(127,127,127,.3)}
      .ruizhi-conversation-timeline-marker{position:absolute;left:3px;width:12px;height:12px;border-radius:999px;border:2px solid #10a37f;background:var(--token-main-surface-primary,#fff);cursor:pointer}
      .ruizhi-conversation-timeline-marker span{display:none;position:absolute;right:18px;top:-8px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:6px;background:#111827;color:#fff;padding:6px 8px;font:12px system-ui,sans-serif}
      .ruizhi-conversation-timeline-marker:hover span{display:block}
      .ruizhi-timeline-target{outline:2px solid rgba(16,163,127,.7);outline-offset:4px;border-radius:6px}
    `;
    document.head.appendChild(style);
  }

  function toast(message, undoToken) {
    document.querySelectorAll(".ruizhi-enhance-toast").forEach((node) => node.remove());
    const node = document.createElement("div");
    node.className = "ruizhi-enhance-toast";
    node.textContent = message;
    if (undoToken) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = "撤销";
      button.addEventListener("click", async () => {
        const result = await bridgeCall("/undo", { undo_token: undoToken });
        toast(result.message || (result.status === "undone" ? "已撤销" : "撤销失败"));
        scheduleScan();
      });
      node.appendChild(button);
    }
    document.body.appendChild(node);
    setTimeout(() => node.remove(), undoToken ? 8000 : 3200);
  }

  function renderMenu() {
    if (!feature("menu")) return;
    if (document.getElementById("ruizhi-page-enhance-menu")) return;
    const root = document.createElement("div");
    root.id = "ruizhi-page-enhance-menu";
    root.innerHTML = `
      <button type="button" data-trigger>锐智增强</button>
      <div data-panel>
        <label>插件入口<input type="checkbox" data-feature="pluginEntryUnlock"></label>
        <label>强制安装<input type="checkbox" data-feature="forcePluginInstall"></label>
        <label>删除会话<input type="checkbox" data-feature="sessionDelete"></label>
        <label>Markdown<input type="checkbox" data-feature="markdownExport"></label>
        <label>项目移动<input type="checkbox" data-feature="projectMove"></label>
        <label>Timeline<input type="checkbox" data-feature="timeline"></label>
        <label>滚动恢复<input type="checkbox" data-feature="threadScrollRestore"></label>
      </div>
    `;
    root.querySelector("[data-trigger]").addEventListener("click", () => {
      root.dataset.open = root.dataset.open === "true" ? "false" : "true";
    });
    root.querySelectorAll("[data-feature]").forEach((input) => {
      const name = input.dataset.feature;
      input.checked = feature(name);
      input.addEventListener("change", async () => {
        state.settings.features[name] = input.checked;
        await bridgeCall("/settings/set", { features: { [name]: input.checked } });
        scheduleScan();
      });
    });
    document.body.appendChild(root);
  }

  function reactFiberFrom(element) {
    const key = Object.keys(element || {}).find((name) => name.startsWith("__reactFiber$") || name.startsWith("__reactInternalInstance$"));
    return key ? element[key] : null;
  }

  function authContextValueFrom(element) {
    for (let fiber = reactFiberFrom(element); fiber; fiber = fiber.return) {
      for (const value of [fiber.memoizedProps && fiber.memoizedProps.value, fiber.pendingProps && fiber.pendingProps.value]) {
        if (value && typeof value === "object" && typeof value.setAuthMethod === "function" && "authMethod" in value) return value;
      }
    }
    return null;
  }

  function spoofChatGPTAuthMethod(element) {
    const auth = authContextValueFrom(element);
    if (!auth || auth.authMethod === "chatgpt") return false;
    auth.setAuthMethod("chatgpt");
    return true;
  }

  function pluginEntryButton() {
    const buttons = Array.from(document.querySelectorAll("nav[role='navigation'] button, nav button, [role='navigation'] button"));
    return buttons.find((button) => /^(插件|Plugins)(\s+-\s+.*)?$/i.test((button.textContent || "").trim())) || null;
  }

  function enablePluginEntry() {
    if (!feature("pluginEntryUnlock")) return;
    const button = pluginEntryButton();
    if (!button) return;
    button.dataset.ruizhiPluginEntryUnlock = markers.pluginEntry;
    spoofChatGPTAuthMethod(button);
    clearDisabledState(button);
    const textNode = Array.from(button.querySelectorAll("span,div")).reverse()
      .flatMap((node) => Array.from(node.childNodes))
      .find((node) => node.nodeType === 3 && /^(插件|Plugins)(\s+-\s+.*)?$/i.test((node.nodeValue || "").trim()));
    if (textNode) textNode.nodeValue = /^Plugins/i.test(textNode.nodeValue || "") ? "Plugins - Unlocked" : "插件 - 已解锁";
    if (button.dataset.ruizhiPluginEntryBound !== "true") {
      button.dataset.ruizhiPluginEntryBound = "true";
      button.addEventListener("click", () => spoofChatGPTAuthMethod(button), true);
    }
  }

  function pluginInstallCandidates() {
    const selector = "button:disabled,button[aria-disabled='true'],[role='button'][aria-disabled='true'],button[data-disabled],[role='button'][data-disabled],button.cursor-not-allowed,[role='button'].cursor-not-allowed,button.pointer-events-none,[role='button'].pointer-events-none";
    return Array.from(new Set(Array.from(document.querySelectorAll(selector)).map((node) => node.closest("button,[role='button']") || node)));
  }

  function isInstallButton(element) {
    const text = (element.textContent || "").trim();
    return /^安装\s*/.test(text) || /^Install\s*/i.test(text) || text === "强制安装" || /即将支持|敬请期待/.test(text);
  }

  function patchReactDisabledProps(element) {
    Object.keys(element).filter((key) => key.startsWith("__reactProps")).forEach((key) => {
      const props = element[key];
      if (!props || typeof props !== "object") return;
      props.disabled = false;
      props["aria-disabled"] = false;
      props["data-disabled"] = undefined;
    });
  }

  function clearDisabledState(element) {
    if (!(element instanceof HTMLElement)) return;
    if ("disabled" in element) element.disabled = false;
    element.removeAttribute("disabled");
    element.removeAttribute("aria-disabled");
    element.removeAttribute("data-disabled");
    element.removeAttribute("inert");
    element.classList.remove("disabled", "opacity-50", "cursor-not-allowed", "pointer-events-none");
    element.classList.add("codex-force-install-unlocked");
    element.style.pointerEvents = "auto";
    element.style.opacity = "";
    element.style.cursor = "pointer";
    element.tabIndex = 0;
    patchReactDisabledProps(element);
  }

  function unlockNodes(button) {
    const nodes = [button];
    button.querySelectorAll("button,[role='button'],[disabled],[aria-disabled],[data-disabled],.cursor-not-allowed,.pointer-events-none").forEach((node) => nodes.push(node));
    for (let parent = button.parentElement, depth = 0; parent && depth < 3; parent = parent.parentElement, depth += 1) {
      if (parent.matches("button,[role='button'],[disabled],[aria-disabled],[data-disabled],.cursor-not-allowed,.pointer-events-none")) nodes.push(parent);
    }
    return Array.from(new Set(nodes));
  }

  function labelForcedInstallButton(button) {
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = (node.nodeValue || "").trim();
      if (/^安装\s*/.test(text) || /^Install\s*/i.test(text) || /即将支持|敬请期待/.test(text)) {
        node.nodeValue = "强制安装";
        return;
      }
    }
  }

  function unblockPluginInstallButtons() {
    if (!feature("forcePluginInstall")) return;
    pluginInstallCandidates().forEach((button) => {
      if (!isInstallButton(button)) return;
      button.dataset.ruizhiForcePluginInstall = markers.forcePluginInstall;
      unlockNodes(button).forEach(clearDisabledState);
      labelForcedInstallButton(button);
      if (button.dataset.ruizhiForceInstallBound !== "true") {
        button.dataset.ruizhiForceInstallBound = "true";
        ["pointerdown", "mousedown", "mouseup", "click", "focus"].forEach((eventName) => {
          button.addEventListener(eventName, () => unlockNodes(button).forEach(clearDisabledState), true);
        });
      }
    });
    if (!state.forcePluginTimer) {
      state.forcePluginTimer = setInterval(() => {
        if (!feature("forcePluginInstall")) {
          clearInterval(state.forcePluginTimer);
          state.forcePluginTimer = null;
          return;
        }
        unblockPluginInstallButtons();
      }, 1200);
    }
  }

  function sessionRows() {
    return Array.from(document.querySelectorAll("[data-app-action-sidebar-thread-id],a[href*='/c/'],a[href*='thread']"))
      .filter((row) => row instanceof HTMLElement && !row.closest(".ruizhi-session-actions"));
  }

  function sessionRefFromRow(row) {
    const id = row.getAttribute("data-app-action-sidebar-thread-id")
      || row.dataset.threadId
      || (row.getAttribute("href") || "").split("/").filter(Boolean).pop()
      || "";
    const title = (row.querySelector("[data-thread-title]")?.textContent || row.textContent || "Untitled session")
      .replace(/删除|导出|移动/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);
    return { session_id: id.replace(/^local:/, ""), title };
  }

  function buttonSvg(pathData) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${pathData}"></path></svg>`;
  }

  function installSessionActions() {
    if (!feature("sessionDelete") && !feature("markdownExport") && !feature("projectMove")) return;
    sessionRows().forEach((row) => {
      if (row.querySelector(".ruizhi-session-actions")) return;
      const ref = sessionRefFromRow(row);
      if (!ref.session_id) return;
      row.dataset.ruizhiSessionRow = "true";
      const group = document.createElement("div");
      group.className = "ruizhi-session-actions";
      group.dataset.ruizhiSessionActions = markers.sessionActions;
      if (feature("projectMove")) group.appendChild(actionButton("移动", "↗", () => openProjectMove(ref)));
      if (feature("markdownExport")) group.appendChild(actionButton("导出", "⇩", () => exportMarkdown(ref)));
      if (feature("sessionDelete")) group.appendChild(actionButton("删除", buttonSvg("M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6"), () => deleteSession(ref), true));
      row.appendChild(group);
    });
  }

  function actionButton(label, content, handler, html = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    if (html) button.innerHTML = content;
    else button.textContent = content;
    ["pointerdown", "mousedown", "mouseup", "click"].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
      }, true);
    });
    button.addEventListener("click", handler, true);
    return button;
  }

  async function deleteSession(ref) {
    if (!confirm(`删除“${ref.title || ref.session_id}”？`)) return;
    const result = await bridgeCall("/delete", ref);
    toast(result.message || (result.status === "local_deleted" ? "删除成功" : "删除失败"), result.undo_token);
    scheduleScan();
  }

  async function exportMarkdown(ref) {
    const result = await bridgeCall("/export-markdown", ref);
    if (result.status === "exported" && result.filename && typeof result.markdown === "string") {
      const url = URL.createObjectURL(new Blob([result.markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    toast(result.message || "导出失败");
  }

  function projectTargets() {
    const targets = [];
    document.querySelectorAll("[data-app-action-sidebar-project-id],[data-app-action-sidebar-project-list-id]").forEach((node) => {
      const label = (node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
      const pathText = node.getAttribute("data-workspace-root") || node.getAttribute("data-cwd") || node.title || label;
      if (label && pathText) targets.push({ label, path: pathText });
    });
    targets.push({ label: "普通对话", path: "" });
    return targets.filter((item, index, all) => item.label && all.findIndex((other) => other.label === item.label && other.path === item.path) === index);
  }

  function openProjectMove(ref) {
    document.querySelectorAll(".ruizhi-project-move-overlay").forEach((node) => node.remove());
    const overlay = document.createElement("div");
    overlay.className = "ruizhi-project-move-overlay";
    const panel = document.createElement("div");
    panel.className = "ruizhi-project-move-panel";
    projectTargets().forEach((target) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = target.label;
      button.addEventListener("click", async () => {
        overlay.remove();
        const result = await bridgeCall("/move-thread-workspace", { ...ref, target_cwd: target.path });
        toast(result.message || (result.status === "moved" ? "移动成功" : "移动失败"));
        scheduleScan();
      });
      panel.appendChild(button);
    });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) overlay.remove();
    });
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function timelineRoot() {
    return document.querySelector("main") || document.querySelector("[role='main']") || document.body;
  }

  function timelineQuestions() {
    const root = timelineRoot();
    const candidates = Array.from(root.querySelectorAll("[data-message-author-role='user'],[data-testid*='user'],article,div"));
    return candidates.filter((node) => {
      const text = (node.textContent || "").trim();
      const rect = node.getBoundingClientRect();
      return text.length > 0 && text.length < 1200 && rect.height > 0 && /user|用户|你/i.test(node.getAttribute("data-message-author-role") || node.getAttribute("aria-label") || "");
    }).slice(0, 40);
  }

  function installTimeline() {
    document.querySelectorAll(".ruizhi-conversation-timeline").forEach((node) => node.remove());
    if (!feature("timeline")) return;
    const questions = timelineQuestions();
    if (questions.length < 2) return;
    const scroller = document.scrollingElement || document.documentElement;
    const container = document.createElement("div");
    container.className = "ruizhi-conversation-timeline";
    container.dataset.ruizhiTimeline = markers.timeline;
    const track = document.createElement("div");
    track.className = "ruizhi-conversation-timeline-track";
    container.appendChild(track);
    const maxScroll = Math.max(1, scroller.scrollHeight - window.innerHeight);
    questions.forEach((node) => {
      const rect = node.getBoundingClientRect();
      const top = Math.max(2, Math.min(98, ((scroller.scrollTop + rect.top) / maxScroll) * 100));
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "ruizhi-conversation-timeline-marker";
      marker.style.top = `${top}%`;
      const label = (node.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
      marker.innerHTML = `<span>${escapeHtml(label)}</span>`;
      marker.addEventListener("click", () => {
        node.scrollIntoView({ block: "center", behavior: "smooth" });
        node.classList.add("ruizhi-timeline-target");
        setTimeout(() => node.classList.remove("ruizhi-timeline-target"), 1200);
      });
      container.appendChild(marker);
    });
    document.body.appendChild(container);
  }

  function scrollKey() {
    const id = location.pathname.split("/").filter(Boolean).pop() || location.href;
    return `ruizhi.threadScroll.${id}`;
  }

  function installThreadScrollRestore() {
    if (!feature("threadScrollRestore")) return;
    const key = scrollKey();
    const scroller = document.scrollingElement || document.documentElement;
    const saved = Number(localStorage.getItem(key));
    if (Number.isFinite(saved) && saved > 0 && scroller.scrollTop < 8) {
      setTimeout(() => scroller.scrollTo({ top: saved, behavior: "auto" }), 120);
    }
    if (!window.__RUIZHI_THREAD_SCROLL_RESTORE_BOUND__) {
      window.__RUIZHI_THREAD_SCROLL_RESTORE_BOUND__ = markers.threadScroll;
      on(window, "scroll", () => {
        if (!feature("threadScrollRestore")) return;
        if (state.scrollSaveTimer) clearTimeout(state.scrollSaveTimer);
        state.scrollSaveTimer = setTimeout(() => localStorage.setItem(scrollKey(), String((document.scrollingElement || document.documentElement).scrollTop)), 120);
      }, true);
      on(window, "beforeunload", () => localStorage.setItem(scrollKey(), String((document.scrollingElement || document.documentElement).scrollTop)), true);
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function scheduleScan() {
    if (state.scanTimer || state.disposed) return;
    state.scanTimer = setTimeout(() => {
      state.scanTimer = null;
      scan();
    }, 160);
  }

  function scan() {
    if (state.disposed || !state.settings.enabled) return;
    try {
      injectStyle();
      renderMenu();
      enablePluginEntry();
      unblockPluginInstallButtons();
      installSessionActions();
      installThreadScrollRestore();
      installTimeline();
    } catch (error) {
      bridgeCall("/diagnostics/log", { event: "scan_failed", message: String(error?.message || error) });
    }
  }

  async function boot() {
    try {
      const settings = await window.ruizhiDesktop?.enhance?.getSettings?.();
      if (settings) state.settings = normalizeSettings(settings);
    } catch {
    }
    scan();
    state.observer = new MutationObserver(scheduleScan);
    state.observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    on(window, "resize", scheduleScan);
    on(window, "popstate", scheduleScan);
    on(window, "hashchange", scheduleScan);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
