/* ruizhi-early-env:start */
(()=>{try{
  const os=require("node:os");
  const path=require("node:path");
  const fs=require("node:fs");
  const home=os.homedir();
  const productName="锐智";
  const ruizhiHomeEnvName="RUIZHI_HOME";
  const ruizhiDefaultHomeDirName=".ruizhi";
  const electronUserDataDirName="锐智";
  const codexHome=(process.env[ruizhiHomeEnvName]||path.join(home,ruizhiDefaultHomeDirName)).trim();
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
    const ruizhiDefaultHomeDirName=".ruizhi";
    const openaiBaseUrl="https://uniapi.ruijie.com.cn/v1";
    const ruijieProviderBaseUrl="https://gptauth.rjagi.cn/v1";
    const ruijieChatModelPrefixes=["glm-","deepseek-","kimi-"];
    const modelProviderBaseUrl="http://127.0.0.1:17888/v1";
    const modelBridgeConfig={"enabled":true,"host":"127.0.0.1","port":17888,"scriptResourcePath":["bridge","ruizhi-responses-bridge.cjs"],"routes":{"gpt-5.5":"responses","gpt-5.4":"responses","gpt-5.4-mini":"responses","gpt-5.3-codex":"responses","qwen3.6-plus":"responses","qwen3.6-flash":"responses","qwen3-coder-plus":"responses","qwen3-coder-480b-a35b-instruct":"responses","qwen3-coder-30b-a3b-instruct":"responses","claude-opus-4-7":{"protocol":"chat","reasoningEffort":true},"claude-sonnet-4-6":{"protocol":"chat","reasoningEffort":true},"glm-5.1":{"protocol":"chat","reasoningEffort":true},"kimi-k2.6":{"protocol":"chat","reasoningEffort":true},"MiniMax/MiniMax-M2.7":{"protocol":"chat","reasoningEffort":true},"deepseek-v4-pro":{"protocol":"chat","reasoningEffort":true},"deepseek-v4-flash-maxthink":{"protocol":"chat","reasoningEffort":true},"deepseek-v4-flash":{"protocol":"chat","reasoningEffort":true}}};
    const imageGenHelper="ruizhi-imagegen.exe";
    const modelCatalogEnabled=true;
    const modelCatalogFile="ruizhi-model-catalog.json";
    const systemSkillsRoot=["skills",".system"];
    const hiddenSystemSkillNames=["openai-docs"];
    const managedRulesFileName="ruizhi-managed.rules";
    const allowPrefixRules=[{"prefix":["C:\\Program Files\\PowerShell\\7\\pwsh.exe","-Command","mkdir -p"]},{"prefix":["pwsh.exe","-Command","mkdir -p"]},{"prefix":["powershell.exe","-Command","mkdir -p"]},{"prefix":["C:\\Program Files\\PowerShell\\7\\pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate"]},{"prefix":["C:\\Program Files\\PowerShell\\7\\pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate-batch"]},{"prefix":["pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate"]},{"prefix":["pwsh.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate-batch"]},{"prefix":["powershell.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate"]},{"prefix":["powershell.exe","-Command","& $env:RUIZHI_IMAGEGEN_EXE generate-batch"]},{"marketplace":"ruijie-marketplace","prefix":["node"],"path":"plugins/rj-skills-hbr-finder/skills/rj-skills-hbr-finder/scripts/search-hbr.mjs"},{"prefix":["node"],"homePath":".agents/skills/rj-skills-hbr-finder/scripts/search-hbr.mjs"},{"marketplace":"ruijie-marketplace","prefix":["node"],"path":"plugins/rj-skills-hundun-finder/skills/rj-skills-hundun-finder/scripts/search-hundun.mjs"},{"prefix":["node"],"homePath":".agents/skills/rj-skills-hundun-finder/scripts/search-hundun.mjs"},{"marketplace":"ruijie-marketplace","prefix":["node"],"path":"plugins/ruijie-volcengine-video-generation/skills/ruijie-volcengine-video-generation/scripts/generate-video.mjs"},{"prefix":["node"],"homePath":".agents/skills/ruijie-volcengine-video-generation/scripts/generate-video.mjs"},{"marketplace":"ruijie-marketplace","prefix":["node"],"path":"plugins/ruijie-notebooklm/skills/ruijie-notebooklm/scripts/book-reader.mjs"},{"prefix":["node"],"homePath":".agents/skills/ruijie-notebooklm/scripts/book-reader.mjs"},{"marketplace":"ruijie-marketplace","prefix":["node"],"path":"plugins/ruijie-notebooklm/skills/ruijie-notebooklm/scripts/notebooklm.mjs"},{"prefix":["node"],"homePath":".agents/skills/ruijie-notebooklm/scripts/notebooklm.mjs"},{"marketplace":"ruijie-marketplace","prefix":["bash"],"path":"plugins/ruijie-seedance-prompt/skills/ruijie-seedance-prompt/SKILL.sh"},{"prefix":["bash"],"homePath":".agents/skills/ruijie-seedance-prompt/SKILL.sh"},{"marketplace":"ruijie-marketplace","prefix":["bash"],"path":"plugins/ruijie-seedance-prompt/skills/ruijie-seedance-prompt/scripts/setup_seedance_prompt_workspace.sh"},{"prefix":["bash"],"homePath":".agents/skills/ruijie-seedance-prompt/scripts/setup_seedance_prompt_workspace.sh"},{"commandResourcePath":"bin/ruizhi-imagegen.exe","prefix":["generate"]},{"commandResourcePath":"bin/ruizhi-imagegen.exe","prefix":["generate-batch"]}];
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
    const codexHome=explicitRuizhiHome||path.join(home,ruizhiDefaultHomeDirName);
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

    const marketplaceSpecs=[{"name":"ruijie-marketplace","resourcePath":["plugins","ruijie-marketplace"],"installPath":[".tmp","marketplaces","ruijie-marketplace"],"versionManifestPath":[".codex-plugin","plugin.json"],"sourceToken":"__RUIZHI_MARKETPLACE_SOURCE_RUIJIE_MARKETPLACE__","online":{"name":"ruijie-marketplace","source":"http://gitlab.dokploy.ruijie.com.cn/marketplace/ruijie-marketplace.git","ref":"main","sparse":[],"autoUpgrade":false}},{"name":"openai-bundled","resourcePath":["plugins","openai-bundled"],"installPath":[".tmp","bundled-marketplaces","openai-bundled"],"versionManifestPath":[".agents","plugins","marketplace.json"],"sourceToken":"__RUIZHI_MARKETPLACE_SOURCE_OPENAI_BUNDLED__","alwaysCopy":true,"hardcodedPlugins":true}];
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
    function tomlString(value){
      return JSON.stringify(String(value??""));
    }
    function managedMarketplaceSpecs(){
      return marketplaceSpecs.filter(spec=>spec.hardcodedPlugins!==true&&spec.alwaysCopy!==true);
    }
    function marketplaceConfigBlock(spec,source){
      const online=spec.online;
      if(online&&online.source){
        const lines=[
          "[marketplaces."+spec.name+"]",
          "source_type = "+tomlString("git"),
          "source = "+tomlString(online.source)
        ];
        if(online.ref)lines.push("ref = "+tomlString(online.ref));
        if(Array.isArray(online.sparse)&&online.sparse.length>0)lines.push("sparse = "+JSON.stringify(online.sparse.map(item=>String(item))));
        lines.push("");
        return lines.join("\n");
      }
      return [
        "[marketplaces."+spec.name+"]",
        "source_type = "+tomlString("local"),
        "source = "+tomlString(source),
        ""
      ].join("\n");
    }
    function upsertTomlTable(source,tableName,block){
      const header="["+tableName+"]";
      const lines=String(source??"").split("\n");
      let start=-1;
      for(let index=0;index<lines.length;index+=1){
        if(lines[index].trim()===header){start=index;break;}
      }
      if(start>=0){
        let end=lines.length;
        for(let index=start+1;index<lines.length;index+=1){
          if(/^\s*\[[^\]]+\]\s*$/.test(lines[index])){end=index;break;}
        }
        const replacement=block.replace(/\n$/,"").split("\n");
        lines.splice(start,end-start,...replacement);
        return lines.join("\n").replace(/\n*$/,"\n");
      }
      const prefix=String(source??"").replace(/\n*$/,"");
      return prefix+(prefix.trim().length>0?"\n\n":"")+block.replace(/\n*$/,"\n");
    }
    function syncManagedMarketplaceConfig(marketplaceSources){
      const specs=managedMarketplaceSpecs();
      if(specs.length===0)return;
      const configPath=path.join(codexHome,"config.toml");
      let next=fs.existsSync(configPath)?fs.readFileSync(configPath,"utf8"):"";
      let changed=false;
      for(const spec of specs){
        const source=marketplaceSources[spec.sourceToken];
        if(!source||!fs.existsSync(path.join(source,".agents","plugins","marketplace.json")))continue;
        const tableName="marketplaces."+spec.name;
        const block=marketplaceConfigBlock(spec,source);
        const updated=upsertTomlTable(next,tableName,block);
        if(updated!==next){next=updated;changed=true;}
      }
      if(changed){
        fs.mkdirSync(path.dirname(configPath),{recursive:true});
        fs.writeFileSync(configPath,next,"utf8");
      }
    }
    function patchRuijieProviderConfig(source){
      const header="[model_providers.ruijie-uniapi]";
      const lines=String(source??"").split("\n");
      let start=-1;
      for(let index=0;index<lines.length;index+=1){
        if(lines[index].trim()===header){start=index;break;}
      }
      if(start<0){
        const block=[
          header,
          "name = \\\"ruijie-uniapi\\\"",
          "env_key = \\\"RUIJIE_UNIAPI_KEY\\\"",
          "base_url = "+JSON.stringify(String(ruijieProviderBaseUrl)),
          "wire_api = \\\"responses\\\"",
          "requires_openai_auth = true",
          "chat_model_prefixes = "+JSON.stringify(ruijieChatModelPrefixes.map(item=>String(item))),
          ""
        ].join("\n");
        const prefix=String(source??"").replace(/\n*$/,"\n");
        return prefix+(prefix.trim().length>0?"\n":"")+block;
      }
      let end=lines.length;
      for(let index=start+1;index<lines.length;index+=1){
        if(/^\\s*\\[[^\\]]+\\]\\s*$/.test(lines[index])){end=index;break;}
      }
      const requiredFields={
        name:"name = \\\"ruijie-uniapi\\\"",
        env_key:"env_key = \\\"RUIJIE_UNIAPI_KEY\\\"",
        wire_api:"wire_api = \\\"responses\\\"",
        requires_openai_auth:"requires_openai_auth = true"
      };
      for(const [key,line] of Object.entries(requiredFields)){
        let found=false;
        for(let index=start+1;index<end;index+=1){
          if(new RegExp("^\\s*"+key+"\\s*=").test(lines[index])){found=true;break;}
        }
        if(!found){lines.splice(end,0,line);end+=1;}
      }
      let baseUrlPatched=false;
      for(let index=start+1;index<end;index+=1){
        if(/^\\s*base_url\\s*=/.test(lines[index])){
          const replacement="base_url = "+JSON.stringify(String(ruijieProviderBaseUrl));
          if(lines[index]!==replacement)lines[index]=replacement;
          baseUrlPatched=true;
          break;
        }
      }
      if(!baseUrlPatched){
        let insertAt=end;
        for(let index=start+1;index<end;index+=1){
          if(/^\\s*(api_key|env_key)\\s*=/.test(lines[index])){insertAt=index+1;}
        }
        lines.splice(insertAt,0,"base_url = "+JSON.stringify(String(ruijieProviderBaseUrl)));
        end+=1;
      }
      if(!Array.isArray(ruijieChatModelPrefixes)||ruijieChatModelPrefixes.length===0)return lines.join("\n").replace(/\n*$/,"\n");
      for(let index=start+1;index<end;index+=1){
        if(/^\\s*chat_model_prefixes\\s*=/.test(lines[index]))return lines.join("\n").replace(/\n*$/,"\n");
      }
      let insertAt=end;
      for(let index=start+1;index<end;index+=1){
        if(/^\\s*wire_api\\s*=/.test(lines[index])){insertAt=index;break;}
      }
      lines.splice(insertAt,0,"chat_model_prefixes = "+JSON.stringify(ruijieChatModelPrefixes.map(item=>String(item))));
      return lines.join("\n").replace(/\n*$/,"\n");
    }
    function syncRuijieProviderConfig(){
      const configPath=path.join(codexHome,"config.toml");
      if(!fs.existsSync(configPath))return;
      const existing=fs.readFileSync(configPath,"utf8");
      const next=patchRuijieProviderConfig(existing);
      if(next!==existing)fs.writeFileSync(configPath,next,"utf8");
    }
    function readPluginVersion(root){
      const manifestPath=path.join(root,".codex-plugin","plugin.json");
      if(!fs.existsSync(manifestPath))return null;
      const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
      return String(manifest.version||"").trim()||null;
    }
    function copyPluginCacheFiles(pluginName,sourceRoot,targetRoot){
      const runtimePluginNames=new Set(["browser","chrome"]);
      const entries=[
        {name:".codex-plugin",parts:[".codex-plugin"]},
        {name:"assets",parts:["assets"]},
        {name:"skills",parts:["skills"]},
        {name:"scripts",parts:["scripts"]}
      ];
      for(const entry of entries){
        if(entry.name==="scripts"&&runtimePluginNames.has(pluginName)===false)continue;
        const source=path.join(sourceRoot,...entry.parts);
        if(!fs.existsSync(source))continue;
        const target=path.join(targetRoot,...entry.parts);
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.cpSync(source,target,{recursive:true,force:true});
      }
    }
    function ensureOpenAIBundledPluginCache(sourceRoot,cacheRoot,pluginName,version){
      const pluginCacheRoot=path.join(cacheRoot,pluginName);
      const targetRoot=path.join(pluginCacheRoot,version);
      fs.mkdirSync(pluginCacheRoot,{recursive:true});
      copyPluginCacheFiles(pluginName,sourceRoot,targetRoot);
    }
    function syncInstalledOpenAIBundledPluginCache(){
      const sourcePluginsRoot=path.join(codexHome,".tmp","bundled-marketplaces","openai-bundled","plugins");
      const cacheRoot=path.join(codexHome,"plugins","cache","openai-bundled");
      if(!fs.existsSync(sourcePluginsRoot))return;
      for(const entry of fs.readdirSync(sourcePluginsRoot,{withFileTypes:true})){
        if(!entry.isDirectory())continue;
        try{
          const sourceRoot=path.join(sourcePluginsRoot,entry.name);
          const version=readPluginVersion(sourceRoot);
          if(!version)continue;
          ensureOpenAIBundledPluginCache(sourceRoot,cacheRoot,entry.name,version);
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

    const configPath=path.join(codexHome,"config.toml");
    const existingRuizhiConfig=fs.existsSync(configPath);
    const marketplaceSources=syncMarketplaces();
    syncManagedMarketplaceConfig(marketplaceSources);
    syncRuijieProviderConfig();
    syncInstalledOpenAIBundledPluginCache();
    syncExecPolicyRules(marketplaceSources);
    process.env.RUIZHI_EXISTING_CONFIG=existingRuizhiConfig?"1":"0";
  }catch(e){
    console.error("ruizhi bootstrap init failed",e);
  }
}
var b=process.platform===`darwin`,x=t.D.resolve();t._(),t.n(b),n.app.setName("锐智"),n.app.setPath(`userData`,_({appDataPath:n.app.getPath(`appData`),buildFlavor:x,env:process.env})),n.app.setAppUserModelId("cn.ruizhi.desktop");ruizhiInit();var S=t.x({isMacOS:b,isPackaged:n.app.isPackaged});if(!(!S||n.app.requestSingleInstanceLock()))t.Jr().info(`Exiting second desktop instance`,{safe:{packaged:n.app.isPackaged,platform:process.platform}}),n.app.exit(0);else{let e=t.C(x);S&&n.app.on(`second-instance`,(t,n)=>{e.queueSecondInstanceArgs(n)}),n.app.whenReady().then(async()=>{let{desktopSentry:r,sparkleManager:i}=e;if(!await m({appName:n.app.getName(),environment:{arch:process.arch,isPackaged:n.app.isPackaged,platform:process.platform}})){n.app.quit();return}await i.initialize();try{let{runMainAppStartup:e}=await Promise.resolve().then(()=>require(`./main-sqI8jfJr.js`));await e()}catch(e){for(let e of n.BrowserWindow.getAllWindows())e.isDestroyed()||e.destroy();t.Jr().error(`Desktop bootstrap failed to start the main app`,{safe:{phase:`bootstrap-import-main`}}),r.captureException(e,{tags:{phase:`bootstrap-import-main`}}),await y(e)}})}
//# sourceMappingURL=bootstrap.js.map
