/* ruizhi-early-env:start */
(()=>{try{
  const os=require("node:os");
  const path=require("node:path");
  const fs=require("node:fs");
  const home=os.homedir();
  const productName="锐智";
  const ruizhiHomeEnvName="RUIZHI_HOME";
  const ruizhiDefaultHomeDirName=".codex";
  const electronUserDataDirName="锐智";
  const codexHome=(process.env[ruizhiHomeEnvName]||process.env.CODEX_HOME||path.join(home,ruizhiDefaultHomeDirName)).trim();
  const appData=process.env.APPDATA||path.join(home,"AppData","Roaming");
  const userData=(process.env.CODEX_ELECTRON_USER_DATA_PATH||path.join(appData,electronUserDataDirName)).trim();
  process.env[ruizhiHomeEnvName]=codexHome;
  process.env.CODEX_HOME=codexHome;
  process.env.CODEX_ELECTRON_USER_DATA_PATH=userData;
  fs.mkdirSync(codexHome,{recursive:true});
  fs.mkdirSync(userData,{recursive:true});
}catch(e){console.error("ruizhi early env init failed",e)}})();
/* ruizhi-early-env:end */
const e=require(`./app-session-O7kcZj7R.js`),t=require(`./workspace-root-drop-handler-Ds_5iOm2.js`);let n=require(`electron`),r=require(`node:path`);require(`node:crypto`);let i=require(`node:child_process`);var a=`desktop.intelLaunchWarning.message`,o=`{appName} is running the Intel build on an Apple Silicon Mac`,s=`desktop.intelLaunchWarning.detail`,c=`This build works through Rosetta, but the Apple Silicon build launches faster and performs better. Quit now to install the Apple Silicon build, or continue with the Intel build`,l=`desktop.intelLaunchWarning.quit`,u=`Quit`,d=`desktop.intelLaunchWarning.continue`,f=`Continue Anyway`;function p(e,t=h){return!e.isPackaged||e.platform!==`darwin`||e.arch!==`x64`?!1:t()}async function m({appName:e,environment:r,readProcessTranslated:i=h,loadNativeIntl:m=g,showMessageBox:_=e=>n.dialog.showMessageBox(e)}){if(!p(r,i))return!0;try{let t=await m();return(await _({type:`warning`,buttons:[t.formatMessage({messageId:l,defaultMessage:u}),t.formatMessage({messageId:d,defaultMessage:f})],defaultId:0,cancelId:0,noLink:!0,message:t.formatMessage({messageId:a,defaultMessage:o,values:{appName:e}}),detail:t.formatMessage({messageId:s,defaultMessage:c})})).response===1}catch(e){return t.Jr().warning(`Failed to show Intel-on-Apple-Silicon launch warning`,{safe:{errorName:e instanceof Error?e.name:null}}),!0}}function h(){try{return(0,i.execFileSync)(`sysctl`,[`-in`,`sysctl.proc_translated`],{encoding:`utf8`,env:t.qr(process.env),stdio:[`ignore`,`pipe`,`ignore`]}).trim()===`1`}catch{return!1}}async function g(){try{return t.P()}catch{try{return await t.M.load(``)}catch{return t.M.createDefault()}}}function _({appDataPath:t,buildFlavor:n,env:i}){let a=i.CODEX_ELECTRON_USER_DATA_PATH?.trim();if(a)return(0,r.resolve)(a);let o=(0,r.join)(t,e.G(n)),s=i.CODEX_ELECTRON_AGENT_RUN_ID?.trim()||null;return n===`agent`&&s!=null?(0,r.join)(o,`agent`,s):o}var v={"install-update":`Install Update`,"check-for-updates":`Check for Updates`,quit:`Quit`};async function y(e){let{sparkleManager:r}=t.C(),i=r.getIsUpdateReady()?[`install-update`,`quit`]:r.hasUpdater()?[`check-for-updates`,`quit`]:[`quit`];switch(i[(await n.dialog.showMessageBox({type:`error`,buttons:i.map(e=>v[e]),defaultId:0,cancelId:i.length-1,message:`${n.app.getName()} failed to start.`,detail:e instanceof Error?e.message:`The main desktop app failed during startup.`,noLink:!0})).response]??`quit`){case`install-update`:await r.installUpdatesIfAvailable();return;case`check-for-updates`:await r.checkForUpdates();return;case`quit`:n.app.quit();return}}function ruizhiInit(){
  try{
    const fs=require("node:fs");
    const os=require("node:os");
    const path=require("node:path");
    const productName="锐智";
    const electronUserDataDirName="锐智";
    const locale="zh-CN";
    const posixLocale="zh_CN";
    const ruizhiHomeEnvName="RUIZHI_HOME";
    const ruizhiDefaultHomeDirName=".codex";
    const openaiBaseUrl="https://uniapi.ruijie.com.cn/v1";
    const modelProviderBaseUrl="http://127.0.0.1:17888/v1";
    const modelBridgeConfig={"enabled":true,"host":"127.0.0.1","port":17888,"scriptResourcePath":["bridge","ruizhi-responses-bridge.cjs"],"routes":{"gpt-5.5":"responses","gpt-5.4":"responses","gpt-5.4-mini":"responses","gpt-5.3-codex":"responses","qwen3.6-plus":"responses","qwen3.6-flash":"responses","qwen3-coder-plus":"responses","qwen3-coder-480b-a35b-instruct":"responses","qwen3-coder-30b-a3b-instruct":"responses","claude-opus-4-7":{"protocol":"chat","reasoningEffort":true},"claude-sonnet-4-6":{"protocol":"chat","reasoningEffort":true},"glm-5.1":{"protocol":"chat","reasoningEffort":true},"kimi-k2.6":{"protocol":"chat","reasoningEffort":true},"MiniMax/MiniMax-M2.7":{"protocol":"chat","reasoningEffort":true},"deepseek-v4-pro":{"protocol":"chat","reasoningEffort":true},"deepseek-v4-flash-maxthink":{"protocol":"chat","reasoningEffort":true},"deepseek-v4-flash":{"protocol":"chat","reasoningEffort":true}}};
    const imageGenHelper="ruizhi-imagegen.exe";
    const modelCatalogEnabled=true;
    const modelCatalogFile="ruizhi-model-catalog.json";
    const systemSkillsRoot=["skills",".system"];
    const hiddenSystemSkillNames=["openai-docs"];
    const managedRulesFileName="ruizhi-managed.rules";
    const allowPrefixRules=[{"prefix":["C:\\Program Files\\PowerShell\\7\\pwsh.exe","-Command","mkdir -p"]},{"prefix":["pwsh.exe","-Command","mkdir -p"]},{"prefix":["powershell.exe","-Command","mkdir -p"]},{"prefix":["C:\\Program Files\\PowerShell\\7\\pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate"]},{"prefix":["C:\\Program Files\\PowerShell\\7\\pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate-batch"]},{"prefix":["pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate"]},{"prefix":["pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate-batch"]},{"prefix":["powershell.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate"]},{"prefix":["powershell.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate-batch"]},{"marketplace":"ruijie-skills","prefix":["node"],"path":"plugins/rj-skills-hbr-finder/skills/rj-skills-hbr-finder/scripts/search-hbr.mjs"},{"prefix":["node"],"homePath":".agents/skills/rj-skills-hbr-finder/scripts/search-hbr.mjs"},{"marketplace":"ruijie-skills","prefix":["node"],"path":"plugins/rj-skills-hundun-finder/skills/rj-skills-hundun-finder/scripts/search-hundun.mjs"},{"prefix":["node"],"homePath":".agents/skills/rj-skills-hundun-finder/scripts/search-hundun.mjs"},{"marketplace":"ruijie-skills","prefix":["node"],"path":"plugins/ruijie-volcengine-video-generation/skills/ruijie-volcengine-video-generation/scripts/generate-video.mjs"},{"prefix":["node"],"homePath":".agents/skills/ruijie-volcengine-video-generation/scripts/generate-video.mjs"},{"marketplace":"ruijie-skills","prefix":["node"],"path":"plugins/ruijie-notebooklm/skills/ruijie-notebooklm/scripts/book-reader.mjs"},{"prefix":["node"],"homePath":".agents/skills/ruijie-notebooklm/scripts/book-reader.mjs"},{"marketplace":"ruijie-skills","prefix":["node"],"path":"plugins/ruijie-notebooklm/skills/ruijie-notebooklm/scripts/notebooklm.mjs"},{"prefix":["node"],"homePath":".agents/skills/ruijie-notebooklm/scripts/notebooklm.mjs"},{"marketplace":"ruijie-skills","prefix":["bash"],"path":"plugins/ruijie-seedance-prompt/skills/ruijie-seedance-prompt/SKILL.sh"},{"prefix":["bash"],"homePath":".agents/skills/ruijie-seedance-prompt/SKILL.sh"},{"marketplace":"ruijie-skills","prefix":["bash"],"path":"plugins/ruijie-seedance-prompt/skills/ruijie-seedance-prompt/scripts/setup_seedance_prompt_workspace.sh"},{"prefix":["bash"],"homePath":".agents/skills/ruijie-seedance-prompt/scripts/setup_seedance_prompt_workspace.sh"},{"commandResourcePath":"bin/ruizhi-imagegen.exe","prefix":["generate"]},{"commandResourcePath":"bin/ruizhi-imagegen.exe","prefix":["generate-batch"]}];
    const home=os.homedir();
    const resourcesRoot=process.resourcesPath||path.dirname(process.execPath);
    function defaultUserDataPath(){
      if(process.platform==="win32"){
        return path.join(process.env.APPDATA||path.join(home,"AppData","Roaming"),electronUserDataDirName);
      }
      if(process.platform==="darwin"){
        return path.join(home,"Library","Application Support",electronUserDataDirName);
      }
      return path.join(process.env.XDG_CONFIG_HOME||path.join(home,".config"),electronUserDataDirName);
    }
    const explicitRuizhiHome=(process.env[ruizhiHomeEnvName]||"").trim();
    const explicitCodexHome=(process.env.CODEX_HOME||"").trim();
    const codexHome=explicitRuizhiHome||explicitCodexHome||path.join(home,ruizhiDefaultHomeDirName);
    const userData=(process.env.CODEX_ELECTRON_USER_DATA_PATH||"").trim()||defaultUserDataPath();
    process.env[ruizhiHomeEnvName]=codexHome;
    process.env.CODEX_HOME=codexHome;
    process.env.CODEX_ELECTRON_USER_DATA_PATH=userData;
    /* ruizhi-model-bridge:start */
    function stableModelBridgePort(basePort,seed){
      let hash=0;
      for(const char of String(seed||"")){
        hash=(hash*31+char.charCodeAt(0))>>>0;
      }
      return basePort+1+(hash%997);
    }
    modelBridgeConfig.port=stableModelBridgePort(modelBridgeConfig.port,resourcesRoot);
    function ensureLoopbackNoProxy(){
      const required=["127.0.0.1","localhost","::1"];
      const existing=[process.env.NO_PROXY,process.env.no_proxy].filter(value=>typeof value==="string"&&value.trim()).join(",");
      const parts=existing.split(",").map(value=>value.trim()).filter(Boolean);
      const lower=new Set(parts.map(value=>value.toLowerCase()));
      for(const host of required){
        if(!lower.has(host.toLowerCase()))parts.push(host);
      }
      const next=parts.join(",");
      process.env.NO_PROXY=next;
      process.env.no_proxy=next;
    }
    ensureLoopbackNoProxy();
    function startModelBridge(){
      if(!modelBridgeConfig.enabled)return null;
      const scriptPath=path.join(resourcesRoot,...modelBridgeConfig.scriptResourcePath);
      if(!fs.existsSync(scriptPath))throw new Error("模型协议 bridge 脚本不存在："+scriptPath);
      const bridge=require(scriptPath).startRuizhiResponsesBridge({
        host:modelBridgeConfig.host,
        port:modelBridgeConfig.port,
        upstreamBaseUrl:openaiBaseUrl,
        authHome:codexHome,
        catalogPath:path.join(resourcesRoot,"models",modelCatalogFile),
        routes:modelBridgeConfig.routes
      });
      return bridge?.baseUrl||modelProviderBaseUrl;
    }
    const runtimeModelProviderBaseUrl=startModelBridge()||modelProviderBaseUrl;
    function rewriteRuntimeModelProviderBaseUrl(text){
      if(runtimeModelProviderBaseUrl===modelProviderBaseUrl)return text;
      return String(text).split(JSON.stringify(modelProviderBaseUrl)).join(JSON.stringify(runtimeModelProviderBaseUrl));
    }
    process.env.RUIZHI_OPENAI_BASE_URL=openaiBaseUrl;
    process.env.RUIZHI_MODEL_PROVIDER_BASE_URL=runtimeModelProviderBaseUrl;
/* ruizhi-model-bridge:end */
/* ruizhi-page-enhance:start */
    const pageEnhanceConfig={"enabled":true,"features":{"menu":true,"pluginEntryUnlock":true,"forcePluginInstall":true,"sessionDelete":true,"markdownExport":true,"projectMove":true,"timeline":true,"threadScrollRestore":true,"threadSort":true,"modelWhitelistUnlock":false,"zedRemoteOpen":false,"upstreamWorktreeCreate":false,"serviceTierControls":false},"appVersion":"0.1.24","rendererResourcePath":["renderer","ruizhi-page-enhance.js"],"serviceResourcePath":["bridge","ruizhi-enhance-service.cjs"]};
    function registerRuizhiEnhanceIpc(){
      if(global.__RUIZHI_ENHANCE_IPC_REGISTERED__)return;
      global.__RUIZHI_ENHANCE_IPC_REGISTERED__=true;
      try{
        const servicePath=path.join(resourcesRoot,...pageEnhanceConfig.serviceResourcePath);
        if(!fs.existsSync(servicePath))throw new Error("页面增强服务脚本不存在："+servicePath);
        const service=require(servicePath).createRuizhiEnhanceService({
          codexHome,
          resourcesRoot,
          config:{pageEnhance:pageEnhanceConfig}
        });
        n.ipcMain.handle("ruizhi:enhance:call",async(_event,route,payload)=>service.call(route,payload||{}));
      }catch(error){
        console.error("ruizhi enhance ipc register failed",error);
        n.ipcMain.handle("ruizhi:enhance:call",async(_event,route,payload)=>({
          status:"failed",
          session_id:String(payload?.session_id||""),
          message:String(error?.message||error)
        }));
      }
    }
    registerRuizhiEnhanceIpc();
/* ruizhi-page-enhance:end */
    process.env.RUIZHI_IMAGEGEN_EXE=path.join(resourcesRoot,"bin",imageGenHelper);
    process.env.LANG="zh_CN.UTF-8";
    process.env.LANGUAGE=posixLocale;
    process.env.LC_ALL="zh_CN.UTF-8";
    try{n.app.commandLine.appendSwitch("lang",locale)}catch{}
    fs.mkdirSync(codexHome,{recursive:true});
    fs.mkdirSync(userData,{recursive:true});

    function copyIfChanged(source,target){
      if(!fs.existsSync(source))return false;
      let changed=true;
      try{
        changed=!fs.existsSync(target)||fs.readFileSync(source).compare(fs.readFileSync(target))!==0;
      }catch{
        changed=true;
      }
      if(changed){
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.copyFileSync(source,target);
      }
      return changed;
    }
    function syncModelCache(){
      const source=path.join(resourcesRoot,"models",modelCatalogFile);
      const target=path.join(codexHome,"models_cache.json");
      if(!modelCatalogEnabled||!fs.existsSync(source)){
        fs.rmSync(target,{force:true});
        return;
      }
      let sourceJson=null;
      let targetJson=null;
      let shouldCopy=true;
      try{
        sourceJson=JSON.parse(fs.readFileSync(source,"utf8"));
        targetJson=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,"utf8")):null;
        shouldCopy=!targetJson||sourceJson.client_version!==targetJson.client_version||sourceJson.etag!==targetJson.etag||!Array.isArray(targetJson.models)||targetJson.models.length!==sourceJson.models.length;
      }catch{
        shouldCopy=true;
      }
      if(shouldCopy||sourceJson){
        fs.mkdirSync(path.dirname(target),{recursive:true});
        if(!sourceJson)sourceJson=JSON.parse(fs.readFileSync(source,"utf8"));
        sourceJson.fetched_at=new Date().toISOString();
        fs.writeFileSync(target,JSON.stringify(sourceJson,null,2)+"\n","utf8");
      }
    }
    function copyDirectoryEntriesIfMissing(sourceRoot,targetRoot){
      if(!fs.existsSync(sourceRoot))return 0;
      let copied=0;
      fs.mkdirSync(targetRoot,{recursive:true});
      for(const entry of fs.readdirSync(sourceRoot,{withFileTypes:true})){
        if(entry.name.startsWith(".")||entry.name==="openai-docs")continue;
        const source=path.join(sourceRoot,entry.name);
        const target=path.join(targetRoot,entry.name);
        if(fs.existsSync(target))continue;
        fs.cpSync(source,target,{recursive:true});
        copied+=1;
      }
      return copied;
    }
    function syncLegacyCodexGlobalSkills(){
      copyDirectoryEntriesIfMissing(path.join(home,".codex","skills"),path.join(home,".agents","skills"));
    }
    function syncSystemSkills(){
      const sourceRoot=path.join(resourcesRoot,...systemSkillsRoot);
      const targetRoot=path.join(codexHome,...systemSkillsRoot);
      for(const skillName of hiddenSystemSkillNames){
        fs.rmSync(path.join(targetRoot,skillName),{recursive:true,force:true});
      }
      if(!fs.existsSync(sourceRoot))return;
      for(const skillName of fs.readdirSync(sourceRoot)){
        if(hiddenSystemSkillNames.includes(skillName))continue;
        const source=path.join(sourceRoot,skillName,"SKILL.md");
        if(!fs.existsSync(source))continue;
        copyIfChanged(source,path.join(targetRoot,skillName,"SKILL.md"));
      }
    }
    syncModelCache();
    syncSystemSkills();
    syncLegacyCodexGlobalSkills();

    const marketplaceSpecs=[{"name":"ruijie-skills","resourcePath":["plugins","ruijie-skills"],"installPath":[".tmp","marketplaces","ruijie-skills"],"versionManifestPath":[".codex-plugin","plugin.json"],"sourceToken":"__RUIZHI_MARKETPLACE_SOURCE_RUIJIE_SKILLS__"},{"name":"openai-bundled","resourcePath":["plugins","openai-bundled"],"installPath":[".tmp","bundled-marketplaces","openai-bundled"],"versionManifestPath":[".agents","plugins","marketplace.json"],"sourceToken":"__RUIZHI_MARKETPLACE_SOURCE_OPENAI_BUNDLED__","alwaysCopy":true,"hardcodedPlugins":true}];
    const hardcodedOpenAIBundledPlugins=[{"name":"browser","path":"./plugins/browser","category":"Engineering"},{"name":"chrome","path":"./plugins/chrome","category":"Productivity"},{"name":"latex","path":"./plugins/latex","category":"Research"}];
    function assertInside(base,target){
      const relative=path.relative(path.resolve(base),path.resolve(target));
      if(!relative||relative.startsWith("..")||path.isAbsolute(relative)){
        throw new Error("拒绝覆盖锐智目录外的 marketplace："+target);
      }
    }
    function readMarketplaceVersion(root,spec){
      const manifestPath=path.join(root,...spec.versionManifestPath);
      if(!fs.existsSync(manifestPath))return null;
      const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
      return [manifest.name||"",manifest.version||""].join("@");
    }
    function hardcodedOpenAIBundledMarketplace(){
      return {
        name:"openai-bundled",
        interface:{displayName:"OpenAI"},
        plugins:hardcodedOpenAIBundledPlugins.map(plugin=>({
          name:plugin.name,
          source:{source:"local",path:plugin.path},
          policy:{installation:"AVAILABLE",authentication:"ON_INSTALL"},
          category:plugin.category
        }))
      };
    }
    function writeHardcodedOpenAIBundledMarketplace(root){
      const missing=[];
      for(const plugin of hardcodedOpenAIBundledPlugins){
        const pluginRoot=path.join(root,"plugins",plugin.name);
        const manifestPath=path.join(pluginRoot,".codex-plugin","plugin.json");
        if(!fs.existsSync(manifestPath))missing.push(plugin.name);
      }
      if(missing.length>0){
        throw new Error("内置 OpenAI 插件资源缺失："+missing.join(", "));
      }
      const marketplacePath=path.join(root,".agents","plugins","marketplace.json");
      fs.mkdirSync(path.dirname(marketplacePath),{recursive:true});
      fs.writeFileSync(marketplacePath,JSON.stringify(hardcodedOpenAIBundledMarketplace(),null,2)+"\n","utf8");
    }
    function copyMarketplaceDirectory(sourceRoot,targetRoot,spec){
      const stagingRoot=targetRoot+".staging-"+process.pid+"-"+Date.now();
      assertInside(codexHome,targetRoot);
      assertInside(codexHome,stagingRoot);
      fs.rmSync(stagingRoot,{recursive:true,force:true});
      try{
        fs.mkdirSync(path.dirname(stagingRoot),{recursive:true});
        fs.cpSync(sourceRoot,stagingRoot,{recursive:true});
        if(spec.hardcodedPlugins)writeHardcodedOpenAIBundledMarketplace(stagingRoot);
        fs.rmSync(targetRoot,{recursive:true,force:true});
        fs.renameSync(stagingRoot,targetRoot);
      }catch(error){
        fs.rmSync(stagingRoot,{recursive:true,force:true});
        throw error;
      }
    }
    function syncMarketplaces(){
      const tokenValues={};
      for(const spec of marketplaceSpecs){
        const sourceRoot=path.join(resourcesRoot,...spec.resourcePath);
        const targetRoot=path.join(codexHome,...spec.installPath);
        tokenValues[spec.sourceToken]=targetRoot;
        try{
          const sourceVersion=readMarketplaceVersion(sourceRoot,spec);
          if(!sourceVersion)throw new Error("缺少 marketplace 版本清单："+sourceRoot);
          const targetVersion=readMarketplaceVersion(targetRoot,spec);
          if(spec.alwaysCopy||sourceVersion!==targetVersion){
            copyMarketplaceDirectory(sourceRoot,targetRoot,spec);
          }else if(spec.hardcodedPlugins){
            writeHardcodedOpenAIBundledMarketplace(targetRoot);
          }
        }catch(error){
          console.error("ruizhi marketplace sync failed",spec.name,error);
        }
      }
      return tokenValues;
    }
    function readPluginVersion(root){
      const manifestPath=path.join(root,".codex-plugin","plugin.json");
      if(!fs.existsSync(manifestPath))return null;
      const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
      return String(manifest.version||"").trim()||null;
    }
    function copyPluginDisplayFiles(sourceRoot,targetRoot){
      const entries=[[".codex-plugin"],["assets"],["skills"]];
      for(const entry of entries){
        const source=path.join(sourceRoot,...entry);
        if(!fs.existsSync(source))continue;
        const target=path.join(targetRoot,...entry);
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.cpSync(source,target,{recursive:true,force:true});
      }
    }
    function syncInstalledOpenAIBundledPluginCache(){
      const sourcePluginsRoot=path.join(codexHome,".tmp","bundled-marketplaces","openai-bundled","plugins");
      const cacheRoot=path.join(codexHome,"plugins","cache","openai-bundled");
      if(!fs.existsSync(sourcePluginsRoot)||!fs.existsSync(cacheRoot))return;
      for(const entry of fs.readdirSync(sourcePluginsRoot,{withFileTypes:true})){
        if(!entry.isDirectory())continue;
        const pluginCacheRoot=path.join(cacheRoot,entry.name);
        if(!fs.existsSync(pluginCacheRoot))continue;
        try{
          const sourceRoot=path.join(sourcePluginsRoot,entry.name);
          const version=readPluginVersion(sourceRoot);
          if(!version)continue;
          copyPluginDisplayFiles(sourceRoot,path.join(pluginCacheRoot,version));
        }catch(error){
          console.error("ruizhi OpenAI plugin cache sync failed",entry.name,error);
        }
      }
    }
    function marketplaceRoot(name,marketplaceSources){
      const spec=marketplaceSpecs.find(item=>item.name===name);
      return spec?marketplaceSources[spec.sourceToken]:null;
    }
    function splitRulePath(value){
      return String(value??"").split(/[\\/]+/).filter(Boolean);
    }
    function resolveRulePath(rule,marketplaceSources){
      if(rule.marketplace&&rule.path){
        const root=marketplaceRoot(rule.marketplace,marketplaceSources);
        return root?path.join(root,...splitRulePath(rule.path)):null;
      }
      if(rule.homePath){
        return path.join(home,...splitRulePath(rule.homePath));
      }
      if(rule.codexHomePath){
        return path.join(codexHome,...splitRulePath(rule.codexHomePath));
      }
      if(rule.resourcePath){
        return path.join(resourcesRoot,...splitRulePath(rule.resourcePath));
      }
      return null;
    }
    function resolveRuleCommandPath(rule,marketplaceSources){
      if(rule.commandMarketplace&&rule.commandPath){
        const root=marketplaceRoot(rule.commandMarketplace,marketplaceSources);
        return root?path.join(root,...splitRulePath(rule.commandPath)):null;
      }
      if(rule.commandHomePath){
        return path.join(home,...splitRulePath(rule.commandHomePath));
      }
      if(rule.commandCodexHomePath){
        return path.join(codexHome,...splitRulePath(rule.commandCodexHomePath));
      }
      if(rule.commandResourcePath){
        return path.join(resourcesRoot,...splitRulePath(rule.commandResourcePath));
      }
      return null;
    }
    function syncExecPolicyRules(marketplaceSources){
      if(!Array.isArray(allowPrefixRules)||allowPrefixRules.length===0)return;
      const lines=[];
      for(const rule of allowPrefixRules){
        const prefix=Array.isArray(rule.prefix)?rule.prefix.filter(item=>typeof item==="string"&&item.length>0):[];
        const commandPath=resolveRuleCommandPath(rule,marketplaceSources);
        if(prefix.length===0&&!commandPath)continue;
        const resolvedPath=resolveRulePath(rule,marketplaceSources);
        const pattern=commandPath?[commandPath,...prefix]:(resolvedPath?[...prefix,resolvedPath]:prefix);
        lines.push("prefix_rule(pattern="+JSON.stringify(pattern)+", decision=\"allow\")");
      }
      if(lines.length===0)return;
      const rulesPath=path.join(codexHome,"rules",managedRulesFileName);
      const next=lines.join("\n")+"\n";
      const existing=fs.existsSync(rulesPath)?fs.readFileSync(rulesPath,"utf8"):"";
      if(existing!==next){
        fs.mkdirSync(path.dirname(rulesPath),{recursive:true});
        fs.writeFileSync(rulesPath,next,"utf8");
      }
    }

    const managedBegin="# BEGIN Ruizhi Managed Defaults";
    const managedEnd="# END Ruizhi Managed Defaults";
    const configTemplateLines=["# BEGIN Ruizhi Managed Defaults","model = \"gpt-5.5\"","model_reasoning_effort = \"medium\"","model_provider = \"ruizhi\"","openai_base_url = \"http://127.0.0.1:17888/v1\"","","[model_providers.ruizhi]","name = \"锐擎API\"","base_url = \"http://127.0.0.1:17888/v1\"","wire_api = \"responses\"","requires_openai_auth = true","supports_websockets = false","stream_max_retries = 0","request_max_retries = 0","","[features]","default_mode_request_user_input = true","plugins = true","apps = true","browser_use = true","","[marketplaces.ruijie-skills]","source_type = \"local\"","source = __RUIZHI_MARKETPLACE_SOURCE_RUIJIE_SKILLS__","","[marketplaces.openai-bundled]","source_type = \"local\"","source = __RUIZHI_MARKETPLACE_SOURCE_OPENAI_BUNDLED__","","[plugins.\"browser@openai-bundled\"]","enabled = true","","[plugins.\"chrome@openai-bundled\"]","enabled = true","","[plugins.\"latex@openai-bundled\"]","enabled = true","","# END Ruizhi Managed Defaults",""];
    const marketplaceSources=syncMarketplaces();
    syncInstalledOpenAIBundledPluginCache();
    syncExecPolicyRules(marketplaceSources);
    let managedBlock=configTemplateLines.join("\n");
    for(const [token,source] of Object.entries(marketplaceSources)){
      managedBlock=managedBlock.split(token).join(JSON.stringify(source));
    }
    if(!managedBlock.endsWith("\n"))managedBlock+="\n";

    function withFinalNewline(text){
      return text.endsWith("\n")?text:text+"\n";
    }
    function stripLegacyManagedPrefix(text){
      const normalized=text.charCodeAt(0)===0xfeff?text.slice(1):text;
      if(!normalized.startsWith("# Managed by Ruizhi Desktop."))return text;
      const matches=Array.from(normalized.matchAll(/\n\[[^\]]+\]/g));
      for(const match of matches){
        if(match[0].trim()!=="[features]"){
          return normalized.slice(match.index+1).trimStart();
        }
      }
      return "";
    }
    function managedConfigSectionNames(){
      const names=["features","model_providers.ruizhi"];
      for(const spec of marketplaceSpecs){
        names.push("marketplaces."+spec.name);
      }
      for(const plugin of hardcodedOpenAIBundledPlugins){
        names.push("plugins.\""+plugin.name+"@openai-bundled\"");
      }
      return new Set(names);
    }
    function stripManagedConfigConflicts(text){
      const managedSectionNames=managedConfigSectionNames();
      const output=[];
      let sawSection=false;
      let inManagedSection=false;
      for(const rawLine of String(text??"").split(/\r?\n/)){
        const section=rawLine.trim().match(/^\[([^\]]+)\]\s*(?:#.*)?$/);
        if(section){
          sawSection=true;
          inManagedSection=managedSectionNames.has(section[1].trim());
          if(inManagedSection)continue;
          output.push(rawLine);
          continue;
        }
        if(inManagedSection)continue;
        if(!sawSection&&/^\s*(model|model_provider|model_reasoning_effort|openai_base_url)\s*=/.test(rawLine))continue;
        output.push(rawLine);
      }
      return output.join("\n").trim();
    }
    function mergeManagedConfig(existing){
      if(!existing.trim())return managedBlock;
      const beginIndex=existing.indexOf(managedBegin);
      const endIndex=existing.indexOf(managedEnd);
      if(beginIndex>=0&&endIndex>=beginIndex){
        const before=existing.slice(0,beginIndex).trimEnd();
        const after=existing.slice(endIndex+managedEnd.length).trimStart();
        return withFinalNewline([before,managedBlock.trimEnd(),after].filter(Boolean).join("\n\n"));
      }
      if(beginIndex>=0&&endIndex<beginIndex){
        const before=existing.slice(0,beginIndex).trimEnd();
        const body=existing.slice(beginIndex);
        const tailMatch=body.match(/\n\[(?:windows|plugins\.|projects\.|mcp_servers\.|profiles\.)[^\n]*\]/);
        const after=tailMatch?body.slice(tailMatch.index+1).trimStart():"";
        return withFinalNewline([before,managedBlock.trimEnd(),after].filter(Boolean).join("\n\n"));
      }
      const oldGenerated="model = \"gpt-5.5\"\nmodel_provider = \"openai\"\nmodel_reasoning_effort = \"medium\"\nopenai_base_url = \"https://uniapi.ruijie.com.cn/v1\"\n\n[features]\nplugins = true\napps = true\nbrowser_use = true\n";
      if(existing.trim()===oldGenerated.trim()||existing.replace(/^\uFEFF/,"").startsWith("# Managed by Ruizhi Desktop.")){
        const rest=stripLegacyManagedPrefix(existing);
        return withFinalNewline([managedBlock.trimEnd(),rest.trimStart()].filter(Boolean).join("\n\n"));
      }
      const rest=stripManagedConfigConflicts(existing);
      return withFinalNewline([managedBlock.trimEnd(), rest.trimStart()].filter(Boolean).join("\n\n"));
    }

/* ruizhi-windows-sandbox-config:start */
    function readWindowsSandboxModeFromConfig(text){
      let inWindowsSection=false;
      for(const rawLine of String(text??"").split(/\r?\n/)){
        const line=rawLine.trim();
        if(!line||line.startsWith("#"))continue;
        const section=line.match(/^\[([^\]]+)\]\s*(?:#.*)?$/);
        if(section){
          inWindowsSection=section[1].trim()==="windows";
          continue;
        }
        if(!inWindowsSection)continue;
        const match=line.match(/^sandbox\s*=\s*["']?([^"'\s#]+)["']?\s*(?:#.*)?$/);
        if(match&&(match[1]==="elevated"||match[1]==="unelevated"))return match[1];
      }
      return null;
    }
    function hasWindowsSandboxSetup(root){
      return process.platform==="win32"&&fs.existsSync(path.join(root,".sandbox","setup_marker.json"))&&fs.existsSync(path.join(root,".sandbox-secrets","sandbox_users.json"));
    }
    function ensureWindowsSandboxMode(text,mode){
      if(process.platform!=="win32"||!mode||readWindowsSandboxModeFromConfig(text)!=null)return text;
      const nextLines=withFinalNewline(text).split(/\r?\n/);
      let windowsSectionIndex=-1;
      for(let index=0;index<nextLines.length;index+=1){
        const section=nextLines[index].trim().match(/^\[([^\]]+)\]\s*(?:#.*)?$/);
        if(section&&section[1].trim()==="windows"){
          windowsSectionIndex=index;
          break;
        }
      }
      if(windowsSectionIndex>=0){
        nextLines.splice(windowsSectionIndex+1,0,"sandbox = "+JSON.stringify(mode));
        return withFinalNewline(nextLines.join("\n").trimEnd());
      }
      return withFinalNewline([text.trimEnd(),"","[windows]","sandbox = "+JSON.stringify(mode)].filter(Boolean).join("\n"));
    }
    function readConfigIfExists(root){
      const target=path.join(root,"config.toml");
      return fs.existsSync(target)?fs.readFileSync(target,"utf8"):"";
    }
    function inferWindowsSandboxMode(primaryText){
      const fallbackCodexHome=path.join(home,".codex");
      return readWindowsSandboxModeFromConfig(primaryText)||readWindowsSandboxModeFromConfig(readConfigIfExists(fallbackCodexHome))||"elevated";
    }
    function syncWindowsSandboxConfig(root,preferredMode){
      if(!hasWindowsSandboxSetup(root))return;
      const target=path.join(root,"config.toml");
      const existing=readConfigIfExists(root);
      const mode=readWindowsSandboxModeFromConfig(existing)||preferredMode||"elevated";
      const next=ensureWindowsSandboxMode(existing,mode);
      if(next!==existing){
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.writeFileSync(target,next,"utf8");
      }
    }
    function syncFallbackWindowsSandboxConfig(preferredMode){
      if(process.platform!=="win32")return;
      const roots=[codexHome,path.join(home,".codex")];
      const seen=new Set();
      for(const root of roots){
        const resolved=path.resolve(root);
        if(seen.has(resolved))continue;
        seen.add(resolved);
        syncWindowsSandboxConfig(root,preferredMode);
      }
    }
/* ruizhi-windows-sandbox-config:end */
    const configPath=path.join(codexHome,"config.toml");
    const existingCodexConfig=fs.existsSync(configPath);
    process.env.RUIZHI_EXISTING_CODEX_CONFIG=existingCodexConfig?"1":"0";
    const existing=existingCodexConfig?fs.readFileSync(configPath,"utf8"):"";
    let next=mergeManagedConfig(existing);
    next=rewriteRuntimeModelProviderBaseUrl(next);
    const sandboxMode=hasWindowsSandboxSetup(codexHome)?inferWindowsSandboxMode(next):readWindowsSandboxModeFromConfig(next);
    if(hasWindowsSandboxSetup(codexHome))next=ensureWindowsSandboxMode(next,sandboxMode);
    if(next!==existing)fs.writeFileSync(configPath,next,"utf8");
    syncFallbackWindowsSandboxConfig(readWindowsSandboxModeFromConfig(next));
  }catch(e){
    console.error("ruizhi bootstrap init failed",e);
  }
}
function ruizhiStartBackgroundUpdateCheck(){
  const updateConfig={"enabled":true,"feedUrl":"http://minio.rjagi.cn:9000/ai-ruizhi/updates/windows/","currentVersion":"0.1.24"};
  const authConfig={"productName":"锐智","ruizhiHomeEnvName":"RUIZHI_HOME","ruizhiDefaultHomeDirName":".codex","baseUrl":"https://uniapi.ruijie.com.cn/v1","testModel":"qwen3.6-flash","testTimeoutMs":15000};
  if(!n.app.isPackaged)return;
  const fs=require("node:fs");
  const os=require("node:os");
  const path=require("node:path");
  const childProcess=require("node:child_process");
  const http=require("node:http");
  const https=require("node:https");
  function readRuizhiEnvironment(){
    const markerPath=path.join(process.resourcesPath,"ruizhi-environment.json");
    if(!fs.existsSync(markerPath))return {name:"production"};
    try{
      const marker=JSON.parse(fs.readFileSync(markerPath,"utf8"));
      const name=String(marker.environment||"production").trim()||"production";
      return {name};
    }catch(error){
      console.warn("ruizhi environment marker invalid",error);
      return {name:"production"};
    }
  }
  const ruizhiEnvironment=readRuizhiEnvironment();
  function ruizhiVersionLabel(){
    const base=updateConfig.currentVersion||n.app.getVersion();
    return ruizhiEnvironment.name==="production"?base:base+"-"+ruizhiEnvironment.name;
  }
  let autoUpdater=null;
  let updateReady=false;
  let updateState={
    status:"idle",
    currentVersion:ruizhiVersionLabel(),
    environment:ruizhiEnvironment.name,
    version:null,
    progress:0,
    downloadedBytes:0,
    totalBytes:0,
    message:""
  };
  let lastProgressEmit=0;

  function publicUpdateState(){
    return {...updateState};
  }
  function broadcastUpdateState(force=false){
    const now=Date.now();
    if(!force&&now-lastProgressEmit<250)return;
    lastProgressEmit=now;
    const snapshot=publicUpdateState();
    for(const win of n.BrowserWindow.getAllWindows()){
      if(!win.isDestroyed())win.webContents.send("ruizhi:update:state-changed",snapshot);
    }
  }
  function setUpdateState(patch,force=false){
    updateState={...updateState,...patch};
    broadcastUpdateState(force);
  }
  function requestUrl(url,timeoutMs,responseHandler,options={}){
    const parsed=new URL(url);
    if(parsed.protocol!=="https:"&&parsed.protocol!=="http:")throw new Error("请求 URL 协议不受支持："+parsed.protocol);
    const transport=parsed.protocol==="https:"?https:http;
    const redirectCount=Number(options.redirectCount)||0;
    const headers={...options.headers};
    return new Promise((resolve,reject)=>{
      let settled=false;
      function settle(error,value){
        if(settled)return;
        settled=true;
        if(error)reject(error);
        else resolve(value);
      }
      const body=options.body;
      const request=transport.request(parsed,{method:options.method||"GET",headers:{"Cache-Control":"no-store","User-Agent":"Ruizhi/"+n.app.getVersion(),...headers}},response=>{
        const status=response.statusCode??0;
        if([301,302,303,307,308].includes(status)&&response.headers.location){
          response.resume();
          if(redirectCount>=3){
            settle(new Error("请求重定向过多"));
            return;
          }
          let nextUrl;
          try{
            nextUrl=new URL(response.headers.location,parsed).toString();
          }catch(error){
            settle(error);
            return;
          }
          requestUrl(nextUrl,timeoutMs,responseHandler,{...options,redirectCount:redirectCount+1}).then(value=>settle(null,value),settle);
          return;
        }
        Promise.resolve(responseHandler(response,status)).then(value=>settle(null,value),settle);
      });
      request.on("error",settle);
      request.setTimeout(timeoutMs,()=>request.destroy(new Error("请求超时："+url)));
      if(body!=null)request.write(body);
      request.end();
    });
  }
  async function readResponseText(response){
    const chunks=[];
    for await(const chunk of response){
      chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  function authHome(){
    const home=os.homedir();
    const explicit=(process.env[authConfig.ruizhiHomeEnvName]||"").trim()||(process.env.CODEX_HOME||"").trim();
    return explicit||path.join(home,authConfig.ruizhiDefaultHomeDirName);
  }
  function authPath(){
    return path.join(authHome(),"auth.json");
  }
  function hasExistingCodexConfig(){
    const marker=process.env.RUIZHI_EXISTING_CODEX_CONFIG;
    if(marker==="1")return true;
    if(marker==="0")return false;
    const filePath=path.join(authHome(),"config.toml");
    try{
      return fs.existsSync(filePath)&&fs.statSync(filePath).isFile();
    }catch{
      return false;
    }
  }
  function maskApiKey(key){
    const value=String(key||"").trim();
    if(!value)return "";
    if(value.length<=18)return value.slice(0,4)+"*******"+value.slice(-4);
    return value.slice(0,10)+"*******"+value.slice(-7);
  }
  function readApiKeyStatus(){
    const filePath=authPath();
    let key="";
    const existingConfig=hasExistingCodexConfig();
    try{
      if(fs.existsSync(filePath)){
        const auth=JSON.parse(fs.readFileSync(filePath,"utf8"));
        key=String(auth.OPENAI_API_KEY||"").trim();
      }
    }catch(error){
      return {configured:existingConfig,masked:"",configuredBy:existingConfig?"codex-config":"none",error:String(error?.message||error),version:n.app.getVersion()};
    }
    return {configured:key.length>0||existingConfig,masked:maskApiKey(key),configuredBy:key.length>0?"api-key":existingConfig?"codex-config":"none",version:n.app.getVersion()};
  }
  function writeApiKey(key){
    const filePath=authPath();
    fs.mkdirSync(path.dirname(filePath),{recursive:true});
    fs.writeFileSync(filePath,JSON.stringify({auth_mode:"apikey",OPENAI_API_KEY:key},null,2)+"\n","utf8");
    process.env.OPENAI_API_KEY=key;
    process.env.RUIZHI_API_KEY=key;
  }
  function normalizeApiKey(input){
    const value=String(input??"").trim().replace(/[\s\uFEFF]+/g,"");
    if(value&&/[^\x21-\x7E]/.test(value)){
      throw new Error("APIKey 包含无效字符，请重新复制完整 APIKey");
    }
    return value;
  }
  function resetAuthToLogin(){
    const filePath=authPath();
    let removed=false;
    let backupPath=null;
    if(fs.existsSync(filePath)){
      backupPath=filePath+".before-api-key-change."+Date.now()+".bak";
      try{
        fs.copyFileSync(filePath,backupPath);
      }catch(error){
        console.warn("ruizhi auth backup failed",error);
        backupPath=null;
      }
      fs.rmSync(filePath,{force:true});
      removed=true;
    }
    delete process.env.OPENAI_API_KEY;
    delete process.env.RUIZHI_API_KEY;
    return {removed,backupPath};
  }
  function relaunchCurrentApp(){
    const child=childProcess.spawn(process.execPath,process.argv.slice(1),{
      cwd:process.cwd(),
      detached:true,
      stdio:"ignore",
      env:process.env
    });
    child.unref();
    n.app.exit(0);
  }
  async function testApiKey(key){
    const baseUrl=String(authConfig.baseUrl||"").replace(/\/+$/,"");
    if(!baseUrl)throw new Error("缺少 API Base URL");
    const url=baseUrl+"/chat/completions";
    const payload=JSON.stringify({
      model:authConfig.testModel,
      messages:[{role:"user",content:"ping"}],
      max_tokens:1,
      stream:false
    });
    await requestUrl(url,authConfig.testTimeoutMs,async(response,status)=>{
      const text=await readResponseText(response);
      if(status<200||status>=300){
        let detail=text.slice(0,500);
        try{
          const json=JSON.parse(text);
          detail=json.error?.message||json.message||detail;
        }catch{}
        throw new Error("APIKey 校验失败："+status+" "+(response.statusMessage||"")+" "+detail);
      }
      return true;
    },{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key,"Content-Length":String(Buffer.byteLength(payload))},body:payload});
  }
  function vcRedistInstallerPath(){
    return path.join(process.resourcesPath||path.dirname(process.execPath),"prerequisites","vc_redist.x64.exe");
  }
  function vcRedistLaunchLogPath(){
    return path.join(os.tmpdir(),"ruizhi-vc-redist-launch.log");
  }
  function vcRedistInstallerScriptPath(){
    return path.join(os.tmpdir(),"ruizhi-install-vc-redist.ps1");
  }
  function vcRedistAppWorkingDirectory(){
    return path.dirname(process.execPath);
  }
  function windowsPowerShellPath(){
    const systemRoot=process.env.SystemRoot||process.env.windir||"C:\\Windows";
    return path.join(systemRoot,"System32","WindowsPowerShell","v1.0","powershell.exe");
  }
  function writeVcRedistInstallerScript(scriptPath){
    const script=[
      "param([string]$Installer,[string]$RedistLog,[string]$LaunchLog,[string]$AppExe,[string]$WorkingDirectory,[int]$ParentPid)",
      "$ErrorActionPreference = 'Stop'",
      "function Write-LaunchLog([string]$Message) {",
      "  $stamp = Get-Date -Format o",
      "  Add-Content -LiteralPath $LaunchLog -Value ($stamp + ' ' + $Message) -Encoding UTF8",
      "}",
      "try {",
      "  Write-LaunchLog ('installer=' + $Installer)",
      "  Write-LaunchLog ('redistLog=' + $RedistLog)",
      "  if (!(Test-Path -LiteralPath $Installer)) { throw ('installer not found: ' + $Installer) }",
      "  $arguments = @('/install','/passive','/norestart','/log',$RedistLog)",
      "  Write-LaunchLog 'starting vc_redist with UAC'",
      "  $process = Start-Process -FilePath $Installer -ArgumentList $arguments -Verb RunAs -Wait -PassThru",
      "  $exitCode = $process.ExitCode",
      "  if ($null -eq $exitCode) { $exitCode = 0 }",
      "  Write-LaunchLog ('vc_redist_exit=' + $exitCode)",
      "  if ($exitCode -eq 0 -or $exitCode -eq 3010 -or $exitCode -eq 1638) {",
      "    Write-LaunchLog 'vc_redist_success'",
      "    exit 0",
      "  }",
      "  exit $exitCode",
      "} catch {",
      "  Write-LaunchLog ('failed=' + $_.Exception.Message)",
      "  exit 1",
      "}"
    ].join("\r\n");
    fs.writeFileSync(scriptPath,script,"utf8");
  }
  function installVcRedist(){
    if(process.platform!=="win32")return {ok:false,error:"仅 Windows 需要安装该依赖"};
    const installerPath=vcRedistInstallerPath();
    const logPath=path.join(os.tmpdir(),"ruizhi-vc-redist.log");
    const launchLogPath=vcRedistLaunchLogPath();
    const scriptPath=vcRedistInstallerScriptPath();
    const workingDirectory=vcRedistAppWorkingDirectory();
    const powershellPath=windowsPowerShellPath();
    if(!fs.existsSync(installerPath))return {ok:false,error:"缺少内置运行依赖安装包",logPath,launchLogPath};
    if(!fs.existsSync(powershellPath))return {ok:false,error:"未找到 Windows PowerShell："+powershellPath,logPath,launchLogPath};
    try{
      writeVcRedistInstallerScript(scriptPath);
      fs.appendFileSync(launchLogPath,new Date().toISOString()+" launch requested installer="+installerPath+" cwd="+workingDirectory+"\n","utf8");
    }catch(error){
      return {ok:false,error:String(error?.message||error),logPath,launchLogPath};
    }
    return new Promise(resolve=>{
      let settled=false;
      const finish=result=>{if(settled)return;settled=true;resolve(result)};
      const child=childProcess.spawn(powershellPath,["-NoProfile","-ExecutionPolicy","Bypass","-File",scriptPath,"-Installer",installerPath,"-RedistLog",logPath,"-LaunchLog",launchLogPath,"-AppExe",process.execPath,"-WorkingDirectory",workingDirectory,"-ParentPid",String(process.pid)],{detached:true,windowsHide:true,stdio:"ignore"});
      child.on("error",error=>finish({ok:false,error:String(error?.message||error),logPath,launchLogPath}));
      child.on("close",code=>{
        const exitCode=typeof code==="number"?code:null;
        const ok=exitCode===0||exitCode===3010||exitCode===1638;
        finish({ok,exitCode,logPath,launchLogPath,...ok?{launched:true}:{error:"VC++ 运行库安装启动失败："+String(exitCode)}});
        if(ok)setTimeout(relaunchCurrentApp,300);
      });
    });
  }
  function registerRuizhiIpc(){
    n.ipcMain.handle("ruizhi:update:get-state",()=>publicUpdateState());
    n.ipcMain.handle("ruizhi:update:install-now",()=>{
      if(!autoUpdater||!updateReady)return {ok:false,error:"没有已下载的更新包"};
      setUpdateState({status:"installing",message:"正在重启并安装更新"},true);
      setImmediate(()=>autoUpdater.quitAndInstall(true,true));
      return {ok:true};
    });
    n.ipcMain.on("ruizhi:auth:get-sync",event=>{event.returnValue=readApiKeyStatus();});
    n.ipcMain.handle("ruizhi:auth:get",()=>readApiKeyStatus());
    n.ipcMain.handle("ruizhi:auth:set-and-test",async(_event,key)=>{
      try{
        const value=normalizeApiKey(key);
        if(value.length<20)return {ok:false,error:"APIKey 长度不正确",status:readApiKeyStatus()};
        await testApiKey(value);
        writeApiKey(value);
        return {ok:true,apiKey:value,status:readApiKeyStatus()};
      }catch(error){
        return {ok:false,error:String(error?.message||error),status:readApiKeyStatus()};
      }
    });
    n.ipcMain.handle("ruizhi:auth:reset-to-login",()=>{
      const result=resetAuthToLogin();
      setImmediate(relaunchCurrentApp);
      return {ok:true,...result};
    });
    n.ipcMain.handle("ruizhi:runtime:install-vc-redist",()=>installVcRedist());
  }
  function configureUpdater(){
    if(process.platform!=="win32")return false;
    try{
      autoUpdater=require("electron-updater").autoUpdater;
    }catch(error){
      console.error("ruizhi electron-updater load failed",error);
      setUpdateState({status:"error",message:"更新模块加载失败："+String(error?.message||error)},true);
      return false;
    }
    autoUpdater.logger=console;
    autoUpdater.autoDownload=true;
    autoUpdater.autoInstallOnAppQuit=true;
    autoUpdater.allowDowngrade=false;
    autoUpdater.allowPrerelease=false;
    autoUpdater.disableWebInstaller=true;
    autoUpdater.installDirectory=path.dirname(process.execPath);
    if(updateConfig.feedUrl){
      autoUpdater.setFeedURL({provider:"generic",url:updateConfig.feedUrl,useMultipleRangeRequest:false});
    }
    autoUpdater.on("checking-for-update",()=>{
      updateReady=false;
      setUpdateState({status:"checking",version:null,progress:0,downloadedBytes:0,totalBytes:0,message:"正在检查更新"},true);
    });
    autoUpdater.on("update-available",info=>{
      updateReady=false;
      setUpdateState({status:"downloading",version:String(info?.version||""),progress:0,downloadedBytes:0,totalBytes:0,message:"正在下载更新"},true);
    });
    autoUpdater.on("download-progress",progress=>{
      const percent=Math.max(0,Math.min(100,Math.floor(Number(progress?.percent)||0)));
      setUpdateState({
        status:"downloading",
        version:updateState.version,
        progress:percent,
        downloadedBytes:Number(progress?.transferred)||0,
        totalBytes:Number(progress?.total)||0,
        message:"正在下载更新"
      });
    });
    autoUpdater.on("update-downloaded",info=>{
      updateReady=true;
      setUpdateState({status:"ready",version:String(info?.version||updateState.version||""),progress:100,message:"更新已下载"},true);
    });
    autoUpdater.on("update-not-available",()=>{
      updateReady=false;
      setUpdateState({status:"idle",version:null,progress:0,downloadedBytes:0,totalBytes:0,message:""},true);
    });
    autoUpdater.on("error",error=>{
      updateReady=false;
      console.error("ruizhi update failed",error);
      setUpdateState({status:"error",message:String(error?.message||error)},true);
    });
    return true;
  }
  try{
    registerRuizhiIpc();
    const updaterReady=ruizhiEnvironment.name==="production"&&configureUpdater();
    n.app.whenReady().then(()=>{
      broadcastUpdateState(true);
      if(!updateConfig.enabled||!updaterReady)return;
      const timer=setTimeout(()=>{autoUpdater.checkForUpdates().catch(error=>{
        console.error("ruizhi update check failed",error);
        setUpdateState({status:"error",message:String(error?.message||error)},true);
      });},15000);
      timer.unref?.();
    }).catch(error=>console.error("ruizhi update scheduling failed",error));
  }catch(error){
    console.error("ruizhi update bootstrap failed",error);
  }
}
var b=process.platform===`darwin`,x=t.D.resolve();t._(),t.n(b),n.app.setName("锐智"),n.app.setPath(`userData`,_({appDataPath:n.app.getPath(`appData`),buildFlavor:x,env:process.env})),n.app.setAppUserModelId("cn.ruizhi.desktop");ruizhiInit();var S=t.x({isMacOS:b,isPackaged:n.app.isPackaged});if(!(!S||n.app.requestSingleInstanceLock()))t.Jr().info(`Exiting second desktop instance`,{safe:{packaged:n.app.isPackaged,platform:process.platform}}),n.app.exit(0);else{let e=t.C(x);S&&n.app.on(`second-instance`,(t,n)=>{e.queueSecondInstanceArgs(n)}),n.app.whenReady().then(async()=>{let{desktopSentry:r,sparkleManager:i}=e;if(!await m({appName:n.app.getName(),environment:{arch:process.arch,isPackaged:n.app.isPackaged,platform:process.platform}})){n.app.quit();return}await i.initialize();ruizhiStartBackgroundUpdateCheck();try{let{runMainAppStartup:e}=await Promise.resolve().then(()=>require(`./main-sqI8jfJr.js`));await e()}catch(e){for(let e of n.BrowserWindow.getAllWindows())e.isDestroyed()||e.destroy();t.Jr().error(`Desktop bootstrap failed to start the main app`,{safe:{phase:`bootstrap-import-main`}}),r.captureException(e,{tags:{phase:`bootstrap-import-main`}}),await y(e)}})}
//# sourceMappingURL=bootstrap.js.map
