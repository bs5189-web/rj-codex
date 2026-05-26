let e=require(`electron`);var t=`codex_desktop:mcp-app-sandbox-host-message`,n=`codex_desktop:show-context-menu`,r=`codex_desktop:show-application-menu`,i=`codex_desktop:get-sentry-init-options`,a=`codex_desktop:get-build-flavor`,o=`codex_desktop:get-system-theme-variant`,s=`codex_desktop:get-fast-mode-rollout-metrics`,c=`codex_desktop:system-theme-variant-updated`,l=`codex_desktop:trigger-sentry-test`;function u(e){return`codex_desktop:worker:${e}:from-view`}function d(e){return`codex_desktop:worker:${e}:for-view`}var f=`electron`,p=`codex_desktop:message-from-view`,m=`codex_desktop:message-for-view`,h=e.ipcRenderer.sendSync(i),g=e.ipcRenderer.sendSync(a),_=e.ipcRenderer.sendSync(`codex_desktop:get-shared-object-snapshot`)??{},v=e.ipcRenderer.sendSync(o),y=()=>v,b=new Set;e.ipcRenderer.on(c,(e,t)=>{v=t,b.forEach(e=>{e()})});function x(e,t){if(t===void 0){delete _[e];return}_[e]=t}var S=new Map,C=new Map,w={windowType:f,sendMessageFromView:async t=>{t.type===`shared-object-set`&&x(t.key,t.value),await e.ipcRenderer.invoke(p,t)},getPathForFile:t=>e.webUtils.getPathForFile(t)||null,sendWorkerMessageFromView:async(t,n)=>{await e.ipcRenderer.invoke(u(t),n)},subscribeToWorkerMessages:(t,n)=>{let r=S.get(t);r||(r=new Set,S.set(t,r));let i=C.get(t);return i||(i=(e,n)=>{let r=S.get(t);r&&r.forEach(e=>{e(n)})},C.set(t,i),e.ipcRenderer.on(d(t),i)),r.add(n),()=>{let r=S.get(t);if(!r||(r.delete(n),r.size>0))return;S.delete(t);let i=C.get(t);i&&e.ipcRenderer.removeListener(d(t),i),C.delete(t)}},showContextMenu:async t=>e.ipcRenderer.invoke(n,t),showApplicationMenu:async(t,n,i)=>{await e.ipcRenderer.invoke(r,{menuId:t,x:n,y:i})},getFastModeRolloutMetrics:async t=>e.ipcRenderer.invoke(s,t),getSharedObjectSnapshotValue:e=>_[e],getSystemThemeVariant:y,subscribeToSystemThemeVariant:e=>(b.add(e),()=>{b.delete(e)}),triggerSentryTestError:async()=>{await e.ipcRenderer.invoke(l)},getSentryInitOptions:()=>h,getAppSessionId:()=>h.codexAppSessionId,getBuildFlavor:()=>g};e.ipcRenderer.on(m,(e,t)=>{let n=t;n.type===`shared-object-updated`&&x(n.key,n.value),window.dispatchEvent(new MessageEvent(`message`,{data:t}))}),e.ipcRenderer.on(t,(e,t)=>{let n=window.location.origin;n!==`null`&&window.postMessage(t,n,e.ports)}),e.contextBridge.exposeInMainWorld(`codexWindowType`,f),e.contextBridge.exposeInMainWorld(`electronBridge`,w);
;(()=>{try{
  const electron=require("electron");
  const ipcRenderer=electron.ipcRenderer;
  const contextBridge=electron.contextBridge;
  const appVersion="0.1.14";
  let updateState={status:"idle",currentVersion:appVersion,version:null,progress:0,message:""};
  let row=null;
  let progressEl=null;
  let statusEl=null;
  let renderQueued=false;

  const api={
    update:{
      getState:()=>ipcRenderer.invoke("ruizhi:update:get-state"),
      installNow:()=>ipcRenderer.invoke("ruizhi:update:install-now")
    },
    auth:{
      get:()=>ipcRenderer.invoke("ruizhi:auth:get"),
      setAndTest:key=>ipcRenderer.invoke("ruizhi:auth:set-and-test",key),
      resetToLogin:()=>ipcRenderer.invoke("ruizhi:auth:reset-to-login")
    },
    runtime:{
      installVcRedist:()=>ipcRenderer.invoke("ruizhi:runtime:install-vc-redist")
    }
  };
  try{contextBridge.exposeInMainWorld("ruizhiDesktop",api)}catch{}

  function onReady(fn){
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn,{once:true});
    else fn();
  }
  function injectStyle(){
    if(document.getElementById("ruizhi-desktop-integration-style"))return;
    const style=document.createElement("style");
    style.id="ruizhi-desktop-integration-style";
    style.textContent=[
      ".ruizhi-settings-update-row{position:relative!important;overflow:hidden!important;}",
      ".ruizhi-settings-update-row>.ruizhi-update-progress-bg{position:absolute;inset:1px auto 1px 1px;width:var(--ruizhi-update-progress,0%);border-radius:inherit;background:rgba(127,127,127,.12);pointer-events:none;z-index:0;transition:width .24s ease,opacity .2s ease;opacity:0;}",
      ".ruizhi-settings-update-row[data-ruizhi-update-active='true']>.ruizhi-update-progress-bg{opacity:1;}",
      ".ruizhi-settings-update-row>:not(.ruizhi-update-progress-bg):not(.ruizhi-update-status){position:relative;z-index:1;}",
      ".ruizhi-update-status{position:relative;z-index:2;margin-left:auto;padding:0 2px;font:inherit;font-size:12px;line-height:inherit;font-weight:500;color:inherit;opacity:.62;background:transparent;white-space:nowrap;}",
      ".ruizhi-update-status[data-clickable='true']{cursor:pointer;opacity:.82;}",
      ".ruizhi-settings-update-row:hover .ruizhi-update-status[data-clickable='true']{opacity:1;text-decoration:underline;text-underline-offset:2px;}"
    ].join("\n");
    document.head.appendChild(style);
  }
  function visible(el){
    if(!(el instanceof HTMLElement))return false;
    const rect=el.getBoundingClientRect();
    const style=getComputedStyle(el);
    return rect.width>=48&&rect.height>=24&&style.visibility!=="hidden"&&style.display!=="none";
  }
  function labelOf(el){
    return [
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("data-testid"),
      el.textContent
    ].filter(Boolean).join(" ");
  }
  function findSettingsRow(){
    const nodes=Array.from(document.querySelectorAll("button,a,[role='button']"));
    const matches=nodes.filter(el=>visible(el)&&/(设置|Settings|Preferences|setting)/i.test(labelOf(el)));
    matches.sort((a,b)=>{
      const ar=a.getBoundingClientRect();
      const br=b.getBoundingClientRect();
      return br.bottom-ar.bottom||ar.left-br.left;
    });
    return matches[0]||null;
  }
  function ensureRow(){
    const target=findSettingsRow();
    if(!target)return false;
    if(row!==target){
      row?.classList.remove("ruizhi-settings-update-row");
      row=target;
      row.classList.add("ruizhi-settings-update-row");
      progressEl=null;
      statusEl=null;
    }
    if(!progressEl||!row.contains(progressEl)){
      progressEl=document.createElement("span");
      progressEl.className="ruizhi-update-progress-bg";
      row.prepend(progressEl);
    }
    if(!statusEl||!row.contains(statusEl)){
      statusEl=document.createElement("span");
      statusEl.className="ruizhi-update-status";
      statusEl.addEventListener("click",event=>{
        const status=updateState.status;
        if(status==="ready"){
          event.preventDefault();
          event.stopPropagation();
          ipcRenderer.invoke("ruizhi:update:install-now").catch(error=>console.error("ruizhi install-now failed",error));
        }
      });
      row.appendChild(statusEl);
    }
    return true;
  }
  function statusText(){
    const status=updateState.status;
    if(status==="checking")return "检查更新";
    if(status==="downloading")return Math.max(0,Math.min(100,Number(updateState.progress)||0))+"%";
    if(status==="ready")return "重启并更新";
    if(status==="installing")return "正在安装";
    if(status==="error")return "更新失败";
    return "v"+(updateState.currentVersion||appVersion);
  }
  function renderUpdateRow(){
    injectStyle();
    if(!ensureRow())return;
    const status=updateState.status;
    const active=status==="checking"||status==="downloading"||status==="ready"||status==="installing";
    const progress=status==="ready"||status==="installing"?100:status==="downloading"?Number(updateState.progress)||0:0;
    row.dataset.ruizhiUpdateActive=active?"true":"false";
    row.dataset.ruizhiUpdateStatus=status||"idle";
    row.style.setProperty("--ruizhi-update-progress",Math.max(0,Math.min(100,progress))+"%");
    statusEl.textContent=statusText();
    statusEl.title=status==="ready"?"点击后退出锐智并安装新版本":"当前版本";
    statusEl.dataset.clickable=status==="ready"?"true":"false";
  }
  function queueRender(){
    if(renderQueued)return;
    renderQueued=true;
    requestAnimationFrame(()=>{renderQueued=false;renderUpdateRow();});
  }

  ipcRenderer.on("ruizhi:update:state-changed",(_event,next)=>{
    updateState={...updateState,...next};
    queueRender();
  });
  onReady(()=>{
    injectStyle();
    ipcRenderer.invoke("ruizhi:update:get-state").then(next=>{updateState={...updateState,...next};queueRender();}).catch(()=>queueRender());
    const observer=new MutationObserver(queueRender);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    queueRender();
    setInterval(queueRender,2000);
  });
}catch(error){console.error("ruizhi preload integration failed",error)}})();

//# sourceMappingURL=preload.js.map
