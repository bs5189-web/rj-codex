import{s as e}from"./chunk-Bj-mKKzh.js";import{I as t,sn as n}from"./app-server-manager-signals-D5SENExw.js";import{n as r,t as i}from"./jsx-runtime-CtnhcczV.js";import{t as a}from"./compiler-runtime-DU4FoEWg.js";import{F as o,H as s,V as c,c as l,n as u,o as d,r as f,s as p}from"./vscode-api-CEWdDs3u.js";import{T as m}from"./skill-path-utils-Bidyu-y_.js";import{a as h,n as g,s as _}from"./lib-cD1yntXX.js";import{t as v}from"./button-Tcj7k4Zi.js";import{t as y}from"./x-XjA-ioJJ.js";import{t as b}from"./use-platform-BTTFRyHv.js";import{t as x}from"./route-scope-DRA1b3gR.js";import{n as S,r as C}from"./use-resolved-theme-variant-BXEqkg7l.js";import{t as ee}from"./use-stable-callback-CgL1GpuS.js";import{t as te}from"./context-menu-Ku2xTAlX.js";import{t as w}from"./search-w0sXyTQk.js";import{a as T,i as ne,n as E,t as D}from"./iconResolver-OFSkmzDk.js";import{t as re}from"./copy-to-clipboard-2Ydpd0sp.js";import{n as O,r as k}from"./open-target-selection-CP0nA1Zj.js";var A=`file-tree-container`,j=`data-file-tree-style`,M=`data-file-tree-unsafe-css`,ie=`data-file-tree-scrollbar-measure`,N=`data-file-tree-scrollbar-gutter-measured`,ae=`--trees-scrollbar-gutter-measured`,oe=`header`,se=`context-menu`,ce=`context-menu-trigger`,P=e(r(),1),F=i(),le=typeof window>`u`?P.useEffect:P.useLayoutEffect;function I(e,t,n){let r=e==null?null:(0,F.jsx)(`div`,{slot:oe,children:e}),i=t!=null&&n!=null?(0,F.jsx)(`div`,{slot:se,children:t(n.item,n.context)}):null;return r==null&&i==null?null:(0,F.jsxs)(F.Fragment,{children:[r,i]})}function ue(e,t){return typeof window>`u`&&t!=null?(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)(`template`,{shadowrootmode:`open`,dangerouslySetInnerHTML:{__html:t.shadowHtml}}),e]}):(0,F.jsx)(F.Fragment,{children:e})}function de(e){let t=e.shadowRoot;return t?.querySelector(`[data-file-tree-id]`)instanceof HTMLElement||t?.querySelector(`[data-file-tree-id]`)instanceof SVGElement?!0:e.querySelector(`template[shadowrootmode="open"]`)instanceof HTMLTemplateElement}function fe(e,t,n,r,i){let a={...e??{}};if(t!=null&&delete a.header,n){let t=e?.contextMenu,n=t?.onClose,o=t?.onOpen;a.contextMenu={...t??{},enabled:!0,onClose:()=>{n?.(),r()},onOpen:(e,t)=>{i(e,t),o?.(e,t)}},delete a.contextMenu.render}return a.header!=null||a.contextMenu!=null?a:void 0}function pe({header:e,id:t,model:n,preloadedData:r,renderContextMenu:i,...a}){let[o,s]=(0,P.useState)(null),[c,l]=(0,P.useState)(null),u=(0,P.useRef)(n.getComposition()),d=(0,P.useRef)(n);d.current!==n&&(d.current=n,u.current=n.getComposition());let f=i!=null,p=(0,P.useCallback)(()=>{s(null)},[]),m=(0,P.useCallback)((e,t)=>{s({context:t,item:e})},[]),h=u.current,g=(0,P.useMemo)(()=>fe(h,e,f,p,m),[h,p,m,f,e]),_=(0,P.useCallback)(e=>{l(e)},[]);(0,P.useEffect)(()=>{f||s(null)},[f]),le(()=>{n.setComposition(g)},[g,n]),le(()=>{if(c!=null)return r!=null&&de(c)?n.hydrate({fileTreeContainer:c}):n.render({fileTreeContainer:c}),()=>{n.unmount(),n.setComposition(h)}},[h,c,n,r]);let v=ue(I(e,i,o),r),y=t??r?.id,b={"--trees-item-height":`${String(n.getItemHeight())}px`,"--trees-density-override":n.getDensityFactor(),...a.style};return(0,F.jsx)(A,{...a,id:y,ref:_,style:b,suppressHydrationWarning:r!=null,children:v})}var me={compact:{itemHeight:24,factor:.8},default:{itemHeight:30,factor:1},relaxed:{itemHeight:36,factor:1.2}};function he(e,t){if(typeof e==`number`)return{itemHeight:t??me.default.itemHeight,factor:e};let n=me[e??`default`];return{itemHeight:t??n.itemHeight,factor:n.factor}}var ge=me.default.itemHeight,_e=`@layer base, theme, unsafe;

@layer base {
  :host {
    /*
      CSS variables use a fallback stack to ensure user and theme colors slot
      in with ease. User colors take precedence over theme colors, which take
      precedence over defaults.

      Fallback order:

      1. --trees-*-override (explicit)
      2. --trees-theme-* (e.g. Shiki/VS Code tokens)
      3. defaults

      Theme variable names mirror Shiki/VS Code theme file JSON tokens.

      // Available CSS Color Overrides
      --trees-fg-override
      --trees-fg-muted-override
      --trees-bg-override
      --trees-bg-muted-override
      --trees-accent-override
      --trees-border-color-override

      --trees-focus-ring-color-override
      --trees-focus-ring-width-override
      --trees-focus-ring-offset-override

      --trees-search-fg-override
      --trees-search-font-weight-override
      --trees-search-bg-override

      --trees-selected-fg-override
      --trees-selected-bg-override
      --trees-selected-focused-border-color-override

      // Git Status Color Overrides
      --trees-status-added-override
      --trees-status-ignored-override
      --trees-status-modified-override
      --trees-status-renamed-override
      --trees-status-untracked-override
      --trees-status-deleted-override
      --trees-git-added-color-override
      --trees-git-ignored-color-override
      --trees-git-modified-color-override
      --trees-git-renamed-color-override
      --trees-git-untracked-color-override
      --trees-git-deleted-color-override

      // Built-in File Icon Color Overrides
      --trees-file-icon-color
      --trees-file-icon-color-astro
      --trees-file-icon-color-babel
      --trees-file-icon-color-bash
      --trees-file-icon-color-biome
      --trees-file-icon-color-bootstrap
      --trees-file-icon-color-browserslist
      --trees-file-icon-color-bun
      --trees-file-icon-color-claude
      --trees-file-icon-color-css
      --trees-file-icon-color-database
      --trees-file-icon-color-default
      --trees-file-icon-color-docker
      --trees-file-icon-color-eslint
      --trees-file-icon-color-git
      --trees-file-icon-color-go
      --trees-file-icon-color-graphql
      --trees-file-icon-color-html
      --trees-file-icon-color-image
      --trees-file-icon-color-javascript
      --trees-file-icon-color-json
      --trees-file-icon-color-markdown
      --trees-file-icon-color-mcp
      --trees-file-icon-color-npm
      --trees-file-icon-color-oxc
      --trees-file-icon-color-postcss
      --trees-file-icon-color-prettier
      --trees-file-icon-color-python
      --trees-file-icon-color-react
      --trees-file-icon-color-ruby
      --trees-file-icon-color-rust
      --trees-file-icon-color-sass
      --trees-file-icon-color-svg
      --trees-file-icon-color-svelte
      --trees-file-icon-color-svgo
      --trees-file-icon-color-swift
      --trees-file-icon-color-table
      --trees-file-icon-color-text
      --trees-file-icon-color-tailwind
      --trees-file-icon-color-terraform
      --trees-file-icon-color-typescript
      --trees-file-icon-color-vite
      --trees-file-icon-color-vscode
      --trees-file-icon-color-vue
      --trees-file-icon-color-wasm
      --trees-file-icon-color-webpack
      --trees-file-icon-color-yml
      --trees-file-icon-color-zig
      --trees-file-icon-color-zip

      // Density
      //
      // A unitless scale factor for padding, gaps, and indentation. Usually
      // set via \`density\` on useFileTree. Individual overrides take precedence.
      //
      //   Compact: 0.8
      //   Default: 1
      //   Relaxed: 1.2
      //
      --trees-density-override

      // Available CSS Layout Overrides
      --trees-gap-override
      --trees-border-radius-override
      --trees-font-family-override
      --trees-font-size-override
      --trees-font-weight-regular-override
      --trees-font-weight-semibold-override
      --trees-level-gap-override
      --trees-item-padding-x-override
      --trees-item-margin-x-override
      --trees-item-row-gap-override
      --trees-icon-width-override
      --trees-icon-nudge-override
      --trees-scrollbar-gutter-override
      --trees-padding-inline-override
    */

    --trees-fg: var(
      --trees-fg-override,
      var(--trees-theme-sidebar-fg, light-dark(#6c6c71, #adadb1))
    );
    --trees-fg-muted: var(
      --trees-fg-muted-override,
      var(--trees-theme-sidebar-header-fg, light-dark(#84848a, #84848a))
    );
    --trees-bg: var(
      --trees-bg-override,
      var(--trees-theme-sidebar-bg, light-dark(#f8f8f8, #141415))
    );
    --trees-bg-muted: var(
      --trees-bg-muted-override,
      var(--trees-theme-list-hover-bg, light-dark(#dfebff59, #19283c59))
    );
    --trees-accent: var(--trees-accent-override, #009fff);
    --trees-input-bg: var(
      --trees-input-bg-override,
      light-dark(#f8f8f8, #070707)
    );

    --trees-added-light: #16a994;
    --trees-added-dark: #00cab1;
    --trees-ignored-light: #adadb1;
    --trees-ignored-dark: #4a4a4e;
    --trees-modified-light: #1ca1c7;
    --trees-modified-dark: #08c0ef;
    --trees-renamed-light: #d5a910;
    --trees-renamed-dark: #ffd452;
    --trees-untracked-light: #16a994;
    --trees-untracked-dark: #00cab1;
    --trees-deleted-light: #ff2e3f;
    --trees-deleted-dark: #ff6762;

    --trees-border-color: var(
      --trees-border-color-override,
      var(--trees-theme-sidebar-border, light-dark(#eeeeef, #070707))
    );
    --trees-indent-guide-bg: var(
      --trees-indent-guide-bg-override,
      color-mix(in lab, var(--trees-fg-muted) 25%, transparent)
    );
    --trees-density: var(--trees-density-override, 1);
    --trees-border-radius: var(
      --trees-border-radius-override,
      calc(6px * var(--trees-density))
    );

    --trees-font-family: var(--trees-font-family-override, system-ui);
    --trees-font-size: var(--trees-font-size-override, 13px);
    --trees-font-weight-regular: var(--trees-font-weight-regular-override, 400);
    --trees-font-weight-semibold: var(
      --trees-font-weight-semibold-override,
      600
    );

    --trees-focus-ring-color: var(
      --trees-focus-ring-color-override,
      var(--trees-theme-focus-ring, var(--trees-accent))
    );
    --trees-focus-ring-width: var(--trees-focus-ring-width-override, 1px);
    --trees-focus-ring-offset: var(--trees-focus-ring-offset-override, -1px);

    --trees-search-fg: var(
      --trees-search-fg-override,
      var(--trees-theme-input-fg, var(--trees-fg))
    );
    --trees-search-font-weight: var(--trees-search-font-weight-override, 600);
    --trees-search-bg: var(
      --trees-search-bg-override,
      var(--trees-theme-input-bg, var(--trees-input-bg))
    );

    --trees-scrollbar-thumb: var(
      --trees-scrollbar-thumb-override,
      var(
        --trees-theme-scrollbar-thumb,
        color-mix(in lab, var(--trees-fg) 25%, var(--trees-bg))
      )
    );

    --trees-selected-fg: var(
      --trees-selected-fg-override,
      var(--trees-theme-list-active-selection-fg, var(--trees-fg))
    );
    --trees-selected-bg: var(
      --trees-selected-bg-override,
      var(
        --trees-theme-list-active-selection-bg,
        light-dark(
          color-mix(in lab, var(--trees-accent) 12%, var(--trees-bg)),
          color-mix(in lab, var(--trees-accent) 15%, var(--trees-bg))
        )
      )
    );
    --trees-selected-focused-border-color: var(
      --trees-selected-focused-border-color-override,
      var(--trees-theme-focus-ring, var(--trees-accent))
    );

    /* Git status (e.g. from Shiki theme gitDecoration.*) */
    --trees-status-added: var(
      --trees-status-added-override,
      var(
        --trees-theme-git-added-fg,
        light-dark(var(--trees-added-light), var(--trees-added-dark))
      )
    );
    --trees-status-ignored: var(
      --trees-status-ignored-override,
      var(
        --trees-theme-git-ignored-fg,
        light-dark(var(--trees-ignored-light), var(--trees-ignored-dark))
      )
    );
    --trees-status-modified: var(
      --trees-status-modified-override,
      var(
        --trees-theme-git-modified-fg,
        light-dark(var(--trees-modified-light), var(--trees-modified-dark))
      )
    );
    --trees-status-renamed: var(
      --trees-status-renamed-override,
      var(
        --trees-theme-git-renamed-fg,
        light-dark(var(--trees-renamed-light), var(--trees-renamed-dark))
      )
    );
    --trees-status-untracked: var(
      --trees-status-untracked-override,
      var(
        --trees-theme-git-untracked-fg,
        light-dark(var(--trees-untracked-light), var(--trees-untracked-dark))
      )
    );
    --trees-status-deleted: var(
      --trees-status-deleted-override,
      var(
        --trees-theme-git-deleted-fg,
        light-dark(var(--trees-deleted-light), var(--trees-deleted-dark))
      )
    );
    --trees-git-modified-color: var(
      --trees-git-modified-color-override,
      var(--trees-status-modified)
    );
    --trees-git-added-color: var(
      --trees-git-added-color-override,
      var(--trees-status-added)
    );
    --trees-git-ignored-color: var(
      --trees-git-ignored-color-override,
      var(--trees-status-ignored)
    );
    --trees-git-deleted-color: var(
      --trees-git-deleted-color-override,
      var(--trees-status-deleted)
    );
    --trees-git-renamed-color: var(
      --trees-git-renamed-color-override,
      var(--trees-status-renamed)
    );
    --trees-git-untracked-color: var(
      --trees-git-untracked-color-override,
      var(--trees-status-untracked)
    );

    --trees-icon-gray: light-dark(#84848a, #adadb1);
    --trees-icon-red: light-dark(#d52c36, #ff6762);
    --trees-icon-vermilion: light-dark(#ff8c5b, #d5512f);
    --trees-icon-orange: light-dark(#d47628, #ffa359);
    --trees-icon-yellow: light-dark(#d5a910, #ffd452);
    --trees-icon-green: light-dark(#199f43, #5ecc71);
    --trees-icon-teal: light-dark(#17a5af, #64d1db);
    --trees-icon-cyan: light-dark(#1ca1c7, #68cdf2);
    --trees-icon-blue: light-dark(#1a85d4, #69b1ff);
    --trees-icon-indigo: light-dark(#693acf, #9d6afb);
    --trees-icon-purple: light-dark(#a631be, #d568ea);
    --trees-icon-pink: light-dark(#d32a61, #ff678d);
    --trees-icon-mauve: light-dark(#594c5b, #79697b);

    --trees-file-icon-color-default: var(
      --trees-file-icon-color,
      var(--trees-icon-gray)
    );
    --trees-file-icon-color-astro: var(
      --trees-file-icon-color,
      var(--trees-icon-purple)
    );
    --trees-file-icon-color-babel: var(
      --trees-file-icon-color,
      var(--trees-icon-yellow)
    );
    --trees-file-icon-color-bash: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-biome: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-bootstrap: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-browserslist: var(
      --trees-file-icon-color,
      var(--trees-icon-yellow)
    );
    --trees-file-icon-color-bun: var(
      --trees-file-icon-color,
      var(--trees-icon-mauve)
    );
    --trees-file-icon-color-claude: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-css: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-database: var(
      --trees-file-icon-color,
      var(--trees-icon-purple)
    );
    --trees-file-icon-color-docker: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-eslint: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-git: var(
      --trees-file-icon-vermilion,
      var(--trees-icon-vermilion)
    );
    --trees-file-icon-color-go: var(
      --trees-file-icon-color,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-graphql: var(
      --trees-file-icon-color,
      var(--trees-icon-pink)
    );
    --trees-file-icon-color-html: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-image: var(
      --trees-file-icon-color,
      var(--trees-icon-pink)
    );
    --trees-file-icon-color-javascript: var(
      --trees-file-icon-color,
      var(--trees-icon-yellow)
    );
    --trees-file-icon-color-json: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-markdown: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-mcp: var(
      --trees-file-icon-color,
      var(--trees-icon-teal)
    );
    --trees-file-icon-color-npm: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-oxc: var(
      --trees-file-icon-cyan,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-postcss: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-prettier: var(
      --trees-file-icon-color,
      var(--trees-icon-teal)
    );
    --trees-file-icon-color-python: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-react: var(
      --trees-file-icon-color,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-ruby: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-rust: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-sass: var(
      --trees-file-icon-color,
      var(--trees-icon-pink)
    );
    --trees-file-icon-color-svg: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-svelte: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-svgo: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-swift: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-table: var(
      --trees-file-icon-color,
      var(--trees-icon-teal)
    );
    --trees-file-icon-color-text: var(
      --trees-file-icon-color,
      var(--trees-icon-gray)
    );
    --trees-file-icon-color-tailwind: var(
      --trees-file-icon-color,
      var(--trees-icon-cyan)
    );
    --trees-file-icon-color-terraform: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-typescript: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-vite: var(
      --trees-file-icon-color,
      var(--trees-icon-purple)
    );
    --trees-file-icon-color-vscode: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-vue: var(
      --trees-file-icon-color,
      var(--trees-icon-green)
    );
    --trees-file-icon-color-wasm: var(
      --trees-file-icon-color,
      var(--trees-icon-indigo)
    );
    --trees-file-icon-color-webpack: var(
      --trees-file-icon-color,
      var(--trees-icon-blue)
    );
    --trees-file-icon-color-yml: var(
      --trees-file-icon-color,
      var(--trees-icon-red)
    );
    --trees-file-icon-color-zig: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );
    --trees-file-icon-color-zip: var(
      --trees-file-icon-color,
      var(--trees-icon-orange)
    );

    --trees-level-gap: var(
      --trees-level-gap-override,
      calc(8px * var(--trees-density))
    );
    --trees-item-padding-x: var(
      --trees-item-padding-x-override,
      calc(8px * var(--trees-density))
    );
    --trees-item-margin-x: var(
      --trees-item-margin-x-override,
      calc(2px * var(--trees-density))
    );
    --trees-item-row-gap: var(
      --trees-item-row-gap-override,
      calc(6px * var(--trees-density))
    );
    --trees-icon-width: var(--trees-icon-width-override, 16px);
    --trees-icon-nudge: var(
      --trees-icon-nudge-override,
      calc(1px * var(--trees-density))
    );
    --trees-row-height: var(--trees-item-height, 30px);
    --trees-git-lane-width: var(--trees-git-lane-width-override, 12px);
    --trees-action-lane-width: var(
      --trees-action-lane-width-override,
      calc(var(--trees-icon-width) + 2px)
    );
    /* Keep the floating trigger aligned with the row's action lane. Going in
       from the root's right edge: the scroll container reserves
       \`--trees-padding-inline\` of effective inset on each side (its asymmetric
       padding formula cancels the scrollbar gutter on the right), the row
       sits inside that inset, and its trailing \`--trees-item-padding-x\` is the
       action lane itself. The trigger's own focus-ring margin then trims one
       pixel back so the button's visible right edge lines up with the lane. */
    --trees-context-menu-trigger-inline-offset: calc(
      var(--trees-padding-inline) + var(--trees-item-padding-x) -
        var(--trees-focus-ring-width)
    );

    --trees-scrollbar-gutter: var(--trees-scrollbar-gutter-override, 6px);
    --trees-padding-inline: var(--trees-padding-inline-override, 16px);

    color-scheme: light dark;
    display: flex;
    flex-direction: column;
    font-size: var(--trees-font-size);
    color: var(--trees-fg);
    background-color: var(--trees-bg);
    --truncate-marker-background-color: var(--trees-bg);
    font-family: var(--trees-font-family);
    font-weight: var(--trees-font-weight-regular);
  }

  :host([data-file-tree-virtualized='true']) {
    height: 100%;
    overflow: hidden;
  }

  [data-file-tree-virtualized-wrapper='true'] {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  [data-file-tree-virtualized-root='true'] {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  [data-file-tree-virtualized-scroll='true'],
  [data-file-tree-scrollbar-measure='true'] {
    overflow-y: auto;
    scrollbar-gutter: stable;

    &::-webkit-scrollbar {
      width: var(--trees-scrollbar-gutter);
      height: var(--trees-scrollbar-gutter);
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
      border: 1px solid transparent;
      background-clip: content-box;
      border-radius: calc(var(--trees-scrollbar-gutter) / 2);
    }

    &::-webkit-scrollbar-corner {
      background-color: transparent;
    }

    &:hover::-webkit-scrollbar-thumb {
      background-color: var(--trees-scrollbar-thumb);
    }
  }

  /* These are styles for a temporarily generated element to measure the size
   * of the scrollbar.  It's intended to be somewhat similar in scrollbar style
   * scope to the scrollable tree so \`--trees-scrollbar-gutter-measured\` is an
   * accurate reflection of the size the scrollbar gutter takes up. */
  [data-file-tree-scrollbar-measure='true'] {
    position: absolute;
    top: 0;
    left: 0;
    visibility: hidden;
    pointer-events: none;
    width: 100px;
    height: 100px;
  }

  @supports (-moz-appearance: none) {
    [data-file-tree-virtualized-scroll='true'],
    [data-file-tree-scrollbar-measure='true'] {
      scrollbar-width: thin;
      scrollbar-color: var(--trees-scrollbar-thumb) transparent;
    }
  }

  [data-file-tree-virtualized-scroll='true'] {
    position: relative;
    overflow-y: auto;
    flex: 1 1 0;
    min-height: 0;
    padding-inline: max(
        calc(var(--trees-padding-inline) - var(--trees-item-margin-x)),
        0px
      )
      /* NOTE(amadeus): We can assume that all Webkit based browser gutters
       * will align to the value of '--trees-scrollbar-gutter', however if not, then
       * \`--trees-scrollbar-gutter-measured\` should correct it. Mostly we are
       * hoping to avoid SSR alignment jumps if possible. In non-SSR'd environments
       * \`--trees-scrollbar-gutter-measured\` should always be immediately available.
       */
      max(
        calc(
          var(--trees-padding-inline) - var(--trees-item-margin-x) -
            var(
              --trees-scrollbar-gutter-measured,
              var(--trees-scrollbar-gutter)
            )
        ),
        0px
      );
  }

  @supports (-moz-appearance: none) {
    [data-file-tree-virtualized-scroll='true'] {
      padding-inline: max(
          calc(var(--trees-padding-inline) - var(--trees-item-margin-x)),
          0px
        )
        /* NOTE(amadeus): However on Firefox it can vary a little bit, but most
         * likely the majority of cases will default to a 0px width scrollbar lets
         * inherit that first to avoid SSR jumps. In non-SSR'd environments
         * \`--trees-scrollbar-gutter-measured\` should always be immediately available.
         */
        max(
          calc(
            var(--trees-padding-inline) - var(--trees-item-margin-x) -
              var(--trees-scrollbar-gutter-measured, 0px)
          ),
          0px
        );
    }
  }

  [data-file-tree-sticky-overlay='true'] {
    position: sticky;
    top: 0;
    height: 0;
    z-index: 4;
    overflow: visible;
    pointer-events: none;
  }

  /* The overlay DOM is kept populated even at scrollTop=0 so the browser has
   * the rendered rows on hand the moment scrolling begins — otherwise the
   * compositor paints a scrolled frame before React can mount the overlay,
   * and the topmost sticky folder jumps up by a couple of pixels before it
   * "snaps" into its pinned position. We hide it via CSS whenever the scroll
   * is at the top and no scroll is in progress, so the preview doesn't leak
   * through at rest. \`data-overlay-reveal\` is stamped on the root only when
   * the user initiates a scroll while already at the top — exactly the case
   * where we need the pre-mounted overlay to be visible through the first
   * compositor frame. It is deliberately distinct from the general
   * \`data-is-scrolling\` flag so a scroll that ends at the top (e.g. ArrowUp
   * navigation) re-hides the overlay the instant the scroll lands, rather
   * than waiting for the hover-suppression timer to elapse. */
  [data-file-tree-virtualized-root='true'][data-scroll-at-top='true']:not(
      [data-overlay-reveal]
    )
    [data-file-tree-sticky-overlay='true'] {
    visibility: hidden;
  }

  [data-file-tree-sticky-overlay-content='true'] {
    background-color: var(--trees-bg);
    position: relative;
    pointer-events: none;
  }

  [data-file-tree-virtualized-list='true'] {
    background-color: var(--trees-bg);
    position: relative;
    min-height: 100%;
    width: 100%;
    overflow-anchor: none;

    &[data-is-scrolling] {
      pointer-events: none;
    }
  }

  [data-file-tree-virtualized-sticky-offset='true'] {
    contain: layout size;
  }

  [data-file-tree-virtualized-sticky='true'] {
    position: sticky;
    top: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    isolation: isolate;
    /* Promote to its own compositor layer so text inside the window is
     * rasterized once and GPU-translated during scroll. Without this, the
     * browser re-paints the window (and its text) at every scroll frame,
     * which produces visible 1px shake / character tearing. */
    will-change: transform;
  }

  [data-file-tree-search-container] {
    display: flex;
    padding: 0;
    padding-inline: var(--trees-padding-inline);
    margin-bottom: var(--trees-item-row-gap);
  }

  [data-file-tree-search-input] {
    --trees-focus-ring-width: 2px;
    font-family: var(--trees-font-family);
    font-size: var(--trees-font-size);
    flex: 1;
    height: var(--trees-row-height);
    /* 1px breathing room so the focus-visible outline isn't clipped when the
     * input sits flush against the top of the scroll container. */
    margin-block: 1px;
    padding-inline: var(--trees-item-padding-x);
    line-height: var(--trees-row-height);
    color: var(--trees-search-fg);
    background-color: var(--trees-search-bg);
    border: 1px solid var(--trees-border-color);
    border-radius: var(--trees-border-radius);
    outline: none;

    &::placeholder {
      color: color-mix(
        in lab,
        var(--trees-search-fg) 65%,
        var(--trees-search-bg)
      );
    }

    &:focus-visible,
    &[data-file-tree-search-input-fake-focus='true'] {
      outline: var(--trees-focus-ring-width) solid var(--trees-focus-ring-color);
      outline-offset: var(--trees-focus-ring-offset);
    }
  }

  /* The wrapper for the tree items */
  [role='tree'] {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--trees-gap-override, 0);
  }

  /* LIST ITEM */
  [data-type='item'] {
    color: inherit;
    font-family: var(--trees-font-family);
    font-size: var(--trees-font-size);
    text-align: start;
    outline: none;
    background-color: var(--trees-bg);
    border: none;
    position: relative;

    padding: 0 var(--trees-item-padding-x);
    margin: 0 var(--trees-item-margin-x);
    cursor: pointer;
    -webkit-user-select: none;
            user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
    display: flex;
    flex: 0 0 var(--trees-row-height);
    align-items: center;
    height: var(--trees-row-height);
    line-height: var(--trees-row-height);
    gap: var(--trees-item-row-gap);
    border-radius: var(--trees-border-radius);

    &:hover,
    &[data-item-context-hover='true'] {
      background-color: var(--trees-bg-muted);
      --truncate-marker-background-color: var(--trees-bg-muted);
    }

    &[data-item-focused='true'],
    &:focus-visible {
      z-index: 2;

      &::before {
        position: absolute;
        inset: 0;
        content: '';
        display: block;
        border-radius: var(--trees-border-radius);
        outline: var(--trees-focus-ring-width) solid
          var(--trees-focus-ring-color);
        outline-offset: var(--trees-focus-ring-offset);
        pointer-events: none;
      }

      &[data-item-selected='true']::before {
        outline-color: var(--trees-selected-focused-border-color);
      }
    }

    &[data-item-selected='true'] {
      color: var(--trees-selected-fg);
      background-color: var(--trees-selected-bg);
      --truncate-marker-background-color: var(--trees-selected-bg);
      z-index: 3;

      [data-item-section='icon'] {
        color: var(--trees-selected-fg);
      }
    }

    &[data-item-search-match='true'] {
      font-weight: var(--trees-search-font-weight);
    }
  }

  [data-type='item'][data-file-tree-sticky-row='true'] {
    pointer-events: auto;
  }

  [data-item-selected='true']:has(+ [data-item-selected='true']) {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  [data-item-selected='true'] + [data-item-selected='true'] {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  /* Flattened Directory Parts */
  [data-item-flattened-subitems] {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }
  [data-item-flattened-subitem]:hover,
  [data-item-flattened-subitem-drag-target='true'] {
    text-decoration: underline;
  }

  /* Icon for each item */
  [data-item-section='icon'] {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--trees-fg-muted);
    fill: currentColor;
    width: var(--trees-icon-width);
  }

  :where([data-item-section='icon'] > [data-icon-token]) {
    color: var(--trees-fg-muted);
  }

  [data-file-tree-colored-icons='true'] {
    [data-icon-token='astro'] {
      color: var(--trees-file-icon-color-astro);
    }
    [data-icon-token='babel'] {
      color: var(--trees-file-icon-color-babel);
    }
    [data-icon-token='bash'] {
      color: var(--trees-file-icon-color-bash);
    }
    [data-icon-token='biome'] {
      color: var(--trees-file-icon-color-biome);
    }
    [data-icon-token='bootstrap'] {
      color: var(--trees-file-icon-color-bootstrap);
    }
    [data-icon-token='browserslist'] {
      color: var(--trees-file-icon-color-browserslist);
    }
    [data-icon-token='bun'] {
      color: var(--trees-file-icon-color-bun);
    }
    [data-icon-token='claude'] {
      color: var(--trees-file-icon-color-claude);
    }
    [data-icon-token='css'] {
      color: var(--trees-file-icon-color-css);
    }
    [data-icon-token='database'] {
      color: var(--trees-file-icon-color-database);
    }
    [data-icon-token='default'] {
      color: var(--trees-file-icon-color-default);
    }
    [data-icon-token='docker'] {
      color: var(--trees-file-icon-color-docker);
    }
    [data-icon-token='eslint'] {
      color: var(--trees-file-icon-color-eslint);
    }
    [data-icon-token='git'] {
      color: var(--trees-file-icon-color-git);
    }
    [data-icon-token='go'] {
      color: var(--trees-file-icon-color-go);
    }
    [data-icon-token='graphql'] {
      color: var(--trees-file-icon-color-graphql);
    }
    [data-icon-token='html'] {
      color: var(--trees-file-icon-color-html);
    }
    [data-icon-token='image'] {
      color: var(--trees-file-icon-color-image);
    }
    [data-icon-token='javascript'] {
      color: var(--trees-file-icon-color-javascript);
    }
    [data-icon-token='json'] {
      color: var(--trees-file-icon-color-json);
    }
    [data-icon-token='markdown'] {
      color: var(--trees-file-icon-color-markdown);
    }
    [data-icon-token='mcp'] {
      color: var(--trees-file-icon-color-mcp);
    }
    [data-icon-token='npm'] {
      color: var(--trees-file-icon-color-npm);
    }
    [data-icon-token='oxc'] {
      color: var(--trees-file-icon-color-oxc);
    }
    [data-icon-token='postcss'] {
      color: var(--trees-file-icon-color-postcss);
    }
    [data-icon-token='prettier'] {
      color: var(--trees-file-icon-color-prettier);
    }
    [data-icon-token='python'] {
      color: var(--trees-file-icon-color-python);
    }
    [data-icon-token='react'] {
      color: var(--trees-file-icon-color-react);
    }
    [data-icon-token='ruby'] {
      color: var(--trees-file-icon-color-ruby);
    }
    [data-icon-token='rust'] {
      color: var(--trees-file-icon-color-rust);
    }
    [data-icon-token='sass'] {
      color: var(--trees-file-icon-color-sass);
    }
    [data-icon-token='svg'] {
      color: var(--trees-file-icon-color-svg);
    }
    [data-icon-token='svelte'] {
      color: var(--trees-file-icon-color-svelte);
    }
    [data-icon-token='svgo'] {
      color: var(--trees-file-icon-color-svgo);
    }
    [data-icon-token='swift'] {
      color: var(--trees-file-icon-color-swift);
    }
    [data-icon-token='table'] {
      color: var(--trees-file-icon-color-table);
    }
    [data-icon-token='text'] {
      color: var(--trees-file-icon-color-text);
    }
    [data-icon-token='tailwind'] {
      color: var(--trees-file-icon-color-tailwind);
    }
    [data-icon-token='terraform'] {
      color: var(--trees-file-icon-color-terraform);
    }
    [data-icon-token='typescript'] {
      color: var(--trees-file-icon-color-typescript);
    }
    [data-icon-token='vite'] {
      color: var(--trees-file-icon-color-vite);
    }
    [data-icon-token='vscode'] {
      color: var(--trees-file-icon-color-vscode);
    }
    [data-icon-token='vue'] {
      color: var(--trees-file-icon-color-vue);
    }
    [data-icon-token='wasm'] {
      color: var(--trees-file-icon-color-wasm);
    }
    [data-icon-token='webpack'] {
      color: var(--trees-file-icon-color-webpack);
    }
    [data-icon-token='yml'] {
      color: var(--trees-file-icon-color-yml);
    }
    [data-icon-token='zig'] {
      color: var(--trees-file-icon-color-zig);
    }
    [data-icon-token='zip'] {
      color: var(--trees-file-icon-color-zip);
    }
  }

  /* Chevron rotation and visual alignment */
  /* Chevron pointing down */
  [data-icon-name='file-tree-icon-chevron'] {
    &[data-align-capitals='false'] {
      transform: translate(0, var(--trees-icon-nudge));
    }
    &[data-align-capitals='true'] {
      transform: translate(0, 0);
    }
  }

  [data-item-section='content'] {
    flex: 0 1 auto;
    text-align: start;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Breaks middle truncate component to also set this */
    /* white-space: nowrap; */
  }

  [data-item-section='decoration'] {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    justify-content: flex-end;
    text-align: end;
    overflow: hidden;
    color: var(--trees-fg-muted);
  }

  [data-item-section='decoration'] > span {
    min-width: 0;
    max-width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-item-section='git'],
  [data-item-section='action'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  [data-item-section='git'] {
    width: var(--trees-git-lane-width);
  }

  [data-item-section='action'] {
    width: var(--trees-action-lane-width);
    color: var(--trees-fg-muted);
    fill: currentColor;
    pointer-events: none;
  }

  [data-item-section='git'] > span,
  [data-item-section='action'] > span {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  [data-item-action-affordance='decorative'] {
    opacity: 0.85;
  }

  [data-item-rename-input] {
    appearance: none;
    width: 100%;
    min-width: 0;
    height: calc(var(--trees-row-height) - 4px);
    font-family: inherit;
    font-size: inherit;
    /* line-height: calc(var(--trees-row-height) - 8px); */
    color: inherit;
    background-color: transparent;
    border: 0;
    padding-inline: 6px;
    outline: none;
    box-sizing: border-box;
  }

  [data-item-section='content']:has([data-item-rename-input])
    ~ [data-item-section='action'],
  [data-item-section='content']:has([data-item-rename-input])
    ~ [data-item-section='decoration'] {
    display: none;
  }

  /* Chevron pointing right */
  [aria-expanded='false'][data-item-type='folder']
    > [data-item-section='icon']
    > [data-icon-name='file-tree-icon-chevron'] {
    &[data-align-capitals='true'] {
      transform: rotate(-90deg)
        translate(
          calc(var(--trees-icon-nudge) / 2),
          calc(var(--trees-icon-nudge) / 2)
        );
    }
    &[data-align-capitals='false'] {
      transform: rotate(-90deg)
        translate(
          calc(var(--trees-icon-nudge) / 2 * -1),
          calc(var(--trees-icon-nudge) / 2)
        );
    }
  }

  /* LIST IDENTATION */
  /* Spacing container */
  [data-item-section='spacing'] {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: var(--trees-row-height);
    padding-left: calc(calc(var(--trees-icon-width) / 2) - 0.5px);

    &:empty {
      padding-left: 0;
    }
  }

  /* Spacing per level */
  [data-item-section='spacing-item'] {
    transform: translateX(-0.25px);
    display: inline-block;
    border-left: 1px solid var(--trees-indent-guide-bg);
    height: 100%;
    margin-right: calc(var(--trees-level-gap) - 1px);
    opacity: 0;
    transition: opacity 150ms ease;

    & + & {
      margin-left: calc(
        var(--trees-item-row-gap) + calc(var(--trees-icon-width) / 2) - 0.5px
      );
    }
  }

  :host(:hover) [data-item-section='spacing-item'] {
    opacity: 0.75;
  }

  /* Git status indicator */

  /* This is a folder that contains a git change */
  [data-item-contains-git-change='true'] > [data-item-section='git'] {
    color: var(--trees-git-modified-color);
    opacity: 0.5;
    fill: currentColor;
  }

  /* These are files that have a git change */
  [data-item-git-status] {
    &
      > :where([data-item-section='icon'])
      > :where(:not([data-icon-name='file-tree-icon-chevron'])) {
      color: var(--trees-item-git-status-color);
    }
    & > [data-item-section='content'] {
      color: var(--trees-item-git-status-color);
    }
    & > [data-item-section='git'] {
      color: var(--trees-item-git-status-color);
      font-weight: var(--trees-font-weight-semibold);
    }
  }

  [data-item-git-status='added'] {
    --trees-item-git-status-color: var(--trees-git-added-color);
  }

  [data-item-git-status='deleted'] {
    --trees-item-git-status-color: var(--trees-git-deleted-color);
  }

  [data-item-git-status='ignored'] {
    --trees-item-git-status-color: var(--trees-git-ignored-color);

    & > [data-item-section='icon'] {
      opacity: 0.5;
    }
  }

  [data-item-section='git'] [data-icon-name='file-tree-icon-dot'] {
    /* this is a nudge to align the dot with the likely lowercase text. it's slightly
    generalizable, but other fonts are gonna need other nudges i assume */
    transform: translateY(calc(0.65ex - 50%));
  }

  [data-item-git-status='modified'] {
    --trees-item-git-status-color: var(--trees-git-modified-color);
  }

  [data-item-git-status='renamed'] {
    --trees-item-git-status-color: var(--trees-git-renamed-color);
  }

  [data-item-git-status='untracked'] {
    --trees-item-git-status-color: var(--trees-git-untracked-color);
  }

  /* Drag and drop */
  [data-item-drag-target='true'] {
    background-color: var(--trees-selected-bg);
  }

  [data-item-dragging='true'] {
    opacity: 0.5;
  }

  /* Lock icon for locked paths (sibling of content) */
  [data-item-section='lock'] {
    flex: 0 0 auto;
    margin-left: auto;
    display: flex;
    align-items: center;
    color: var(--trees-fg-muted);
  }
  [data-item-section='lock'] svg {
    display: block;
  }

  [data-type='header-slot'] {
    display: block;
    flex: 0 0 auto;
  }

  [data-type='context-menu-wash'] {
    position: absolute;
    inset: 0;
    z-index: 3;
    background-color: transparent;
    touch-action: none;
  }

  [data-type='context-menu-anchor'] {
    position: absolute;
    top: 0;
    right: var(--trees-context-menu-trigger-inline-offset);
    z-index: 4;
    display: none;
    align-items: center;

    &[data-visible='true'] {
      display: flex;
    }
  }

  /* Hide the floating trigger while the scroll container is actively moving.
   * The anchor is positioned against the root, not the scroll content, so its
   * \`top\` follows the row via a React state update — one frame behind the
   * compositor. That delay is visible as the trigger hovering over the wrong
   * row during the first frame of a scroll. The \`data-is-scrolling\` flag on
   * the root is flipped synchronously on \`wheel\`/\`touchmove\`/\`keydown\` before
   * the compositor commits the next paint, so this selector hides the anchor
   * in the same frame the scroll begins. */
  [data-file-tree-virtualized-root='true'][data-is-scrolling]
    [data-type='context-menu-anchor'] {
    display: none;
  }

  [data-type='context-menu-anchor'] > slot[name='context-menu'] {
    display: block;
    width: 0;
    min-width: 0;
    flex: 0 0 0;
    overflow: visible;
  }

  /* Single floating context menu trigger */
  [data-type='context-menu-trigger'] {
    all: unset;
    align-items: center;
    justify-content: center;
    width: var(--trees-action-lane-width);
    color: var(--trees-fg-muted);
    fill: currentColor;
    cursor: pointer;
    font-family: var(--trees-font-family);
    font-size: var(--trees-font-size);
    border-top-right-radius: var(--trees-border-radius);
    border-bottom-right-radius: var(--trees-border-radius);
    margin: var(--trees-focus-ring-width);
    height: calc(var(--trees-row-height) - var(--trees-focus-ring-width) * 2);
    border-width: 0;
    transition: color 120ms ease;

    display: flex;
  }

  [data-type='context-menu-trigger']:hover,
  [data-type='context-menu-trigger'][aria-expanded='true'] {
    color: var(--trees-fg);
  }

  /** @pierre/truncate css here, manually copy pasted for now */
  [data-truncate-container] {
    /* CUSTOM TO TREES, TO SUPPORT THE OUTLINE */
    margin-top: -1px;
    margin-bottom: -1px;

    /* Width of the fade from default marker to text */
    --truncate-internal-marker-fade-width: var(
      --truncate-marker-fade-width,
      2px
    );
    /* Width of the solid color between the fade from the default marker to the text */
    --truncate-internal-marker-gap: var(--truncate-marker-gap, 0px);
    /* Opacity of the marker 'color' property, not of the element itself */
    --truncate-internal-marker-opacity: var(--truncate-marker-opacity, 50%);
    /* Opacity of the marker 'color' property specifically for the middle truncate, not opacity of the element itself */
    --truncate-internal-middle-marker-opacity: var(
      --truncate-middle-marker-opacity,
      80%
    );
    /* Background color of the default marker */
    --truncate-internal-marker-background-color: var(
      --truncate-marker-background-color,
      light-dark(white, black)
    );
    /* Duration of the fade out animation for the marker */
    --truncate-internal-marker-fade-out-duration: var(
      --truncate-marker-fade-out-duration,
      0ms
    );
    /* Duration of the fade in animation for the marker */
    --truncate-internal-marker-fade-in-duration: var(
      --truncate-marker-fade-in-duration,
      100ms
    );

    /* FADE Variant specifics */
    --truncate-internal-fade-marker-color: var(
      --truncate-fade-marker-color,
      #000
    );
    --truncate-internal-fade-marker-width: var(
      --truncate-fade-marker-width,
      0.2lh
    );

    /*
    In some special cases people might be adding spacing in other ways
    that would benefit from being able to override this, however the container
    query below can't use this and would need to be redeclared with the overridden
    value. It's a bad time, but better than nothing.
    */
    --truncate-internal-single-line-height: 1lh;

    height: var(--truncate-internal-single-line-height);
    min-width: 0;
    overflow: hidden;
  }

  [data-truncate-marker] {
    display: flex;
    position: absolute;
    height: var(--truncate-internal-single-line-height);
    z-index: 2;
    color: color-mix(
      in srgb,
      currentColor var(--truncate-internal-marker-opacity),
      transparent
    );

    /* Core trick for hiding the marker until overflow occurs */
    opacity: 0;
    transition: opacity var(--truncate-internal-marker-fade-out-duration)
      ease-in-out;
  }

  @container measure (height > 1lh) {
    [data-truncate-marker] {
      opacity: 1;
      transition: opacity var(--truncate-internal-marker-fade-in-duration)
        ease-in-out;
    }
  }

  [data-truncate-grid] {
    display: grid;
    position: relative;
  }

  [data-truncate-content='visible'] {
    white-space: nowrap;
  }

  [data-truncate-content='overflow'] {
    opacity: 0;
    pointer-events: none;
    -webkit-user-select: none;
            user-select: none;
    word-break: break-all;
    margin-top: calc(-1 * var(--truncate-internal-single-line-height));
  }

  [data-truncate-marker-cell] {
    container: measure / size;
    overflow: visible;
    -webkit-user-select: none;
            user-select: none;
    pointer-events: none;
  }

  [data-truncate-container='truncate'] {
    & [data-truncate-grid] {
      grid-template-columns: minmax(0, max-content) 0;
    }
    & [data-truncate-marker] {
      right: 0;
    }
    & [data-truncate-fade] {
      margin-right: calc(-2 * var(--truncate-internal-fade-marker-width));
    }
  }

  [data-truncate-container='fruncate'] {
    & [data-truncate-grid] {
      grid-template-columns: 0 minmax(0, max-content) auto;
    }
    & [data-truncate-content] {
      direction: rtl;
    }
    & [data-truncate-content] > span {
      unicode-bidi: plaintext;
    }
    & [data-truncate-fade] {
      margin-left: calc(-2 * var(--truncate-internal-fade-marker-width));
    }
  }

  [data-truncate-variant='default'] {
    & [data-truncate-marker] {
      background-color: var(--truncate-internal-marker-background-color);
    }
    & [data-truncate-marker]::after,
    & [data-truncate-marker]::before {
      content: '';
      position: absolute;
      width: calc(
        var(--truncate-internal-marker-fade-width) +
          var(--truncate-internal-marker-gap)
      );
      height: var(--truncate-internal-single-line-height);
      background: linear-gradient(
        var(--truncate-internal-fade-dir),
        var(--truncate-internal-marker-background-color) 0%,
        var(--truncate-internal-marker-background-color)
          var(--truncate-internal-marker-gap),
        transparent 100%
      );
    }
    & [data-truncate-marker]::after {
      --truncate-internal-fade-dir: to right;
      right: calc(
        -1 *
          (
            var(--truncate-internal-marker-fade-width) +
              var(--truncate-internal-marker-gap)
          )
      );
    }
    & [data-truncate-marker]::before {
      --truncate-internal-fade-dir: to left;
      left: calc(
        -1 *
          (
            var(--truncate-internal-marker-fade-width) +
              var(--truncate-internal-marker-gap)
          )
      );
    }
  }

  [data-truncate-variant='fade'] {
    & [data-truncate-marker] {
      background: transparent;
    }
  }

  [data-truncate-fade] {
    box-shadow:
      0 0 calc(var(--truncate-internal-fade-marker-width) / 2)
        var(--truncate-internal-fade-marker-color),
      0 0 var(--truncate-internal-fade-marker-width)
        var(--truncate-internal-fade-marker-color);
    width: calc(var(--truncate-internal-fade-marker-width) * 2);
    height: calc(
      var(--truncate-internal-single-line-height) -
        (var(--truncate-internal-fade-marker-width) * 2)
    );
    margin: var(--truncate-internal-fade-marker-width) 0;
  }

  [data-truncate-group-container='middle'] {
    & [data-truncate-container] {
      --truncate-marker-opacity: var(--truncate-internal-middle-marker-opacity);
    }

    display: flex;
    min-width: 0;

    & > div {
      min-width: 0;
    }

    & > div[data-truncate-segment-priority='1'] {
      flex: 0 1 max-content;
    }
    & > div[data-truncate-segment-priority='2'] {
      flex: 0 999999 max-content;
    }
  }
}
`,ve=`@layer base, unsafe;`;function ye(e){return`${ve}
@layer base {
  ${e}
}`}function L(e){return`${ve}
@layer unsafe {
  ${e}
}`}var be=new WeakMap;function xe(e){let t=be.get(e);if(t!=null)return t;let n=document.createElement(`div`);n.setAttribute(ie,`true`);let r=document.createElement(`div`);r.style.position=`relative`,r.style.height=`200%`,n.appendChild(r),e.appendChild(n);let i=Math.max(n.offsetWidth-n.clientWidth,0);return n.remove(),be.set(e,i),i}function R(e,t){if(!e.isConnected)return;let n=xe(t);if(n==null)return;let r=t.querySelector(`style[${N}]`),i=r instanceof HTMLStyleElement?r:document.createElement(`style`);r instanceof HTMLStyleElement||(i.setAttribute(N,``),t.appendChild(i)),i.textContent=`:host { ${ae}: ${n}px; }`}var Se;function Ce(e){if(typeof CSSStyleSheet<`u`&&typeof CSSStyleSheet.prototype.replaceSync==`function`&&`adoptedStyleSheets`in e){Se??(Se=new CSSStyleSheet,Se.replaceSync(ye(_e)));let t=!1;try{e.adoptedStyleSheets=[Se],t=!0}catch{}if(t){e.querySelector(`style[${j}]`)?.remove();return}}if(e.querySelector(`style[data-file-tree-style]`)==null){let t=document.createElement(`style`);t.setAttribute(j,``),t.textContent=ye(_e),e.prepend(t)}}function we(e,t){Te(e,t),Ce(t),R(e,t)}function Te(e,t){let n=e.querySelector(`template[shadowrootmode="open"], template[data-file-tree-shadowrootmode="open"]`);n instanceof HTMLTemplateElement&&(t.childNodes.length>0||(t.appendChild(n.content.cloneNode(!0)),n.hasAttribute(`shadowrootmode`)&&n.remove()))}if(typeof HTMLElement<`u`&&customElements.get(`file-tree-container`)==null){class e extends HTMLElement{constructor(){super()}connectedCallback(){let e=this.shadowRoot??this.attachShadow({mode:`open`});we(this,e)}}if(customElements.define(A,e),typeof document<`u`)for(let e of Array.from(document.querySelectorAll(A)))e instanceof HTMLElement&&we(e,e.shadowRoot??e.attachShadow({mode:`open`}))}var Ee=5,De=1<<Ee,Oe=De*4;function ke(){return{childIdByNameId:new Map,childIds:[],childPositionById:new Map,childVisibleChunkSums:null,totalChildSubtreeNodeCount:0,totalChildVisibleSubtreeCount:0}}function Ae(){return{childIdByNameId:null,childIds:[],childPositionById:null,childVisibleChunkSums:null,totalChildSubtreeNodeCount:0,totalChildVisibleSubtreeCount:0}}function je(e,t){if(t.childIdByNameId!=null)return t.childIdByNameId;let n=new Map;for(let r of t.childIds){let t=e[r];t!=null&&n.set(t.nameId,r)}return t.childIdByNameId=n,n}function Me(e){if(e.childPositionById!=null)return e.childPositionById;let t=new Map;for(let n=0;n<e.childIds.length;n++){let r=e.childIds[n];r!=null&&t.set(r,n)}return e.childPositionById=t,t}function Ne(e,t){e.childPositionById!=null&&e.childPositionById.set(t,e.childIds.length),e.childIds.push(t)}function Pe(e,t){if(e.childPositionById!=null)for(let n=t;n<e.childIds.length;n++){let t=e.childIds[n];t!=null&&e.childPositionById.set(t,n)}}function Fe(e,t){let n=0,r=0;for(let i of t.childIds){let t=e[i];t!=null&&(n+=t.subtreeNodeCount,r+=t.visibleSubtreeCount)}t.totalChildSubtreeNodeCount=n,t.totalChildVisibleSubtreeCount=r,Re(e,t)}function z(e,t,n,r){if(e.totalChildSubtreeNodeCount+=n,e.totalChildVisibleSubtreeCount+=r,e.childVisibleChunkSums==null||r===0)return;let i=Me(e).get(t);if(i===void 0)return;let a=i>>Ee;e.childVisibleChunkSums[a]+=r}function Ie(e,t,n){let r=t.childVisibleChunkSums;if(r!=null){let i=n,a=0;for(let o of r){if(i<o){let r=ze(e,t,a,i);return{...r,childVisibleIndex:n-r.localVisibleIndex}}i-=o,a+=De}throw Error(`Visible child index ${String(n)} is out of range`)}let i=n;for(let r=0;r<t.childIds.length;r++){let a=t.childIds[r];if(a==null)continue;let o=e[a];if(o!=null){if(i<o.visibleSubtreeCount)return{childIndex:r,childVisibleIndex:n-i,localVisibleIndex:i};i-=o.visibleSubtreeCount}}throw Error(`Visible child index ${String(n)} is out of range`)}function Le(e,t,n){let r=0,i=t.childVisibleChunkSums,a=0;if(i!=null){let e=n>>Ee;for(let t=0;t<e;t+=1)r+=i[t]??0;a=e<<Ee}for(let i=a;i<n;i+=1){let n=t.childIds[i];if(n==null)continue;let a=e[n];a!=null&&(r+=a.visibleSubtreeCount)}return r}function Re(e,t){if(t.childIds.length<Oe){t.childVisibleChunkSums=null;return}let n=Math.ceil(t.childIds.length/De),r=new Int32Array(n);for(let n=0;n<t.childIds.length;n++){let i=t.childIds[n];if(i==null)continue;let a=e[i];a!=null&&(r[n>>Ee]+=a.visibleSubtreeCount)}t.childVisibleChunkSums=r}function ze(e,t,n,r){let i=Math.min(t.childIds.length,n+De),a=r;for(let r=n;r<i;r++){let n=t.childIds[r];if(n==null)continue;let i=e[n];if(i!=null){if(a<i.visibleSubtreeCount)return{childIndex:r,localVisibleIndex:a};a-=i.visibleSubtreeCount}}throw Error(`Visible child index ${String(r)} is out of range`)}var Be=7,Ve=3,He=1<<Ve,Ue=4;function We(e,t,n=0){return e<<Ue|n<<Ve|t}function Ge(e){return e.depthAndFlags>>>Ue}function Ke(e){return(e.depthAndFlags&He)>>Ve}function B(e){return(e.depthAndFlags&He)!==0}function qe(e){return e.depthAndFlags&Be}function V(e,t){return(qe(e)&t)!==0}function Je(e,t){e.depthAndFlags|=t}function H(e,t){e.depthAndFlags=We(t,qe(e),Ke(e))}var U=Symbol(`benchmarkInstrumentation`);function Ye(e,t){return t==null||Object.defineProperty(e,U,{configurable:!0,enumerable:!1,value:t,writable:!1}),e}function Xe(e){return e==null?null:e[U]??null}function W(e,t,n){return e==null?n():e.measurePhase(t,n)}function Ze(e,t,n){!Number.isFinite(n)||e==null||e.setCounter(t,n)}function Qe(e){return e>=48&&e<=57}function $e(e){let t=[],n=0,r=0;for(;r<e.length;){for(;r<e.length&&!Qe(e.charCodeAt(r));)r+=1;if(r>=e.length)break;r>n&&t.push(e.slice(n,r));let i=0;for(;r<e.length&&Qe(e.charCodeAt(r));)i=i*10+(e.charCodeAt(r)-48),r+=1;t.push(i),n=r}return(n<e.length||t.length===0)&&t.push(e.slice(n)),t}function et(e){let t=e.toLowerCase();return{lowerValue:t,tokens:$e(t)}}function tt(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++){let n=e[r],i=t[r];if(n===i)continue;if(typeof n==`number`&&typeof i==`number`)return n<i?-1:1;let a=String(n),o=String(i);if(a!==o)return a<o?-1:1}return e.length===t.length?0:e.length<t.length?-1:1}function G(e,t){if(e.tokens.length===1&&t.tokens.length===1&&typeof e.tokens[0]==`string`&&typeof t.tokens[0]==`string`)return e.lowerValue===t.lowerValue?0:e.lowerValue<t.lowerValue?-1:1;let n=tt(e.tokens,t.tokens);return n===0?e.lowerValue===t.lowerValue?0:e.lowerValue<t.lowerValue?-1:1:n}function nt(e,t,n){let r=G(n(e),n(t));return r===0?e===t?0:e<t?-1:1:r}function rt(e,t){return nt(e,t,et)}function it(e,t){return t===e.segments.length-1?e.isDirectory?1:0:1}function at(e,t){let n=Math.min(e.segments.length,t.segments.length);for(let r=0;r<n;r++){let n=e.segments[r],i=t.segments[r];if(n===i)continue;let a=it(e,r);return a===it(t,r)?rt(n,i):a===1?-1:1}return e.segments.length===t.segments.length?e.isDirectory===t.isDirectory?0:e.isDirectory?-1:1:e.segments.length<t.segments.length?-1:1}function ot(e,t){return at(e,t)}function st(e,t,n){let r=e=>{let t=n.get(e);if(t!=null)return t;let r=et(e);return n.set(e,r),r},i=Math.min(e.segments.length,t.segments.length);for(let n=0;n<i;n++){let i=e.segments[n],a=t.segments[n];if(i===a)continue;let o=it(e,n);return o===it(t,n)?nt(i,a,r):o===1?-1:1}return e.segments.length===t.segments.length?e.isDirectory===t.isDirectory?0:e.isDirectory?-1:1:e.segments.length<t.segments.length?-1:1}function ct(e,t){let n=e.sortKeyById[t];if(n!==void 0)return n;let r=e.valueById[t],i=et(r);return e.sortKeyById[t]=i,i}function lt(e={}){return{flattenEmptyDirectories:e.flattenEmptyDirectories!==!1,sort:e.sort??`default`}}function ut(e){let t=e.length>0&&e.charCodeAt(e.length-1)===47,n=t?e.length-1:e.length,r=[],i=0;for(let t=0;t<n;t++)e.charCodeAt(t)===47&&(r.push(e.slice(i,t)),i=t+1);return r.push(e.slice(i,n)),{hasTrailingSlash:t,segments:r}}function dt(e){let{hasTrailingSlash:t,segments:n}=ut(e);return{basename:n[n.length-1]??``,isDirectory:t,path:e,segments:n}}function ft(e){if(e.length===0)return{requiresDirectory:!1,segments:[]};let{hasTrailingSlash:t,segments:n}=ut(e);return{requiresDirectory:t,segments:n}}var pt=``;function mt(){let e=new Map;return e.set(pt,0),{idByValue:e,valueById:[pt],sortKeyById:[et(pt)]}}function ht(e,t){let n=e.idByValue.get(t);if(n!==void 0)return n;let r=e.valueById.length;return e.idByValue.set(t,r),e.valueById.push(t),r}function gt(e,t){let n=e.valueById[t];if(n===void 0)throw Error(`Unknown segment ID: ${String(t)}`);return n}var _t=Symbol(`pathStorePreparedInputKind`);function vt(e,t){return e[_t]=t,e}function yt(e){return{basename:e.basename,depth:e.segments.length,isDirectory:e.isDirectory,path:e.path,segments:e.segments}}function bt(e,t,n){return n===`default`?ot(e,t):n(yt(e),yt(t))}function xt(){return{depthAndFlags:We(0,3,1),nameId:0,parentId:0,subtreeNodeCount:1,visibleSubtreeCount:1}}function St(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return r;return n}function Ct(e){return e.isDirectory?e.segments.length:e.segments.length-1}function wt(e){return Array.isArray(e)&&e.every(e=>typeof e==`object`&&!!e&&typeof e.path==`string`&&Array.isArray(e.segments)&&typeof e.basename==`string`&&typeof e.isDirectory==`boolean`)}function Tt(e){return Array.isArray(e)&&e.every(e=>typeof e==`string`)}function Et(e,t={}){return Mt(e,t).map(e=>e.path)}function Dt(e,t={}){let n=Mt(e,t);return vt({paths:n.map(e=>e.path),preparedPaths:n},`prepared`)}function Ot(e){let t=e.length,n=!1;for(let r=0;r<t;r+=1){let t=e[r];if(t.length>0&&t.charCodeAt(t.length-1)===47){n=!0;break}}return vt({paths:e,presortedPaths:e,presortedPathsContainDirectories:n},`presorted`)}function kt(e){let t=e,n=t.preparedPaths;if(t[_t]===`prepared`&&n!=null)return n;if(!wt(n))throw Error(`preparedInput must come from PathStore.prepareInput()`);return n}function At(e){let t=e;return t[_t]===`presorted`&&t.presortedPaths!=null||Tt(t.presortedPaths)?t.presortedPaths:null}function jt(e){let t=e;return typeof t.presortedPathsContainDirectories==`boolean`?t.presortedPathsContainDirectories:null}function Mt(e,t={}){let n=lt(t),r=Xe(t);Ze(r,`workload.inputFiles`,e.length);let i=W(r,`store.preparePathEntries.parse`,()=>e.map(e=>dt(e)));return W(r,`store.preparePathEntries.sort`,()=>i.sort((e,t)=>bt(e,t,n.sort))),i}var Nt=class{directories=new Map;directoryStack=[0];presortedDirectoryNodeIds=[];initialExpandedPathSet;createdDirectoriesAllExpanded=!1;createdDirectoryCount=0;lastPreparedPath=null;nodes=[xt()];options;instrumentation;segmentSortKeyCache=new Map;segmentTable=mt();hasDeferredDirectoryIndexes=!1;constructor(e={}){this.instrumentation=Xe(e),this.options=lt(e);let t=e.initialExpandedPaths??null;if(t==null||t.length===0)this.initialExpandedPathSet=null;else{let e=new Set,n=t.length;for(let r=0;r<n;r+=1){let n=t[r],i=n.length;e.add(i>0&&n.charCodeAt(i-1)===47?n.slice(0,i-1):n)}this.initialExpandedPathSet=e,this.createdDirectoriesAllExpanded=!0}this.directories.set(0,ke())}appendPaths(e){return W(this.instrumentation,`store.builder.appendPaths.parse`,()=>this.appendPreparedPaths(e.map(e=>dt(e))))}appendPreparedPaths(e,t=!0){return this.createdDirectoriesAllExpanded=!1,W(this.instrumentation,`store.builder.appendPreparedPaths`,()=>{for(let n of e)this.appendPreparedPath(n,t)}),this}appendPresortedPaths(e,t=null){return W(this.instrumentation,`store.builder.appendPresortedPaths`,()=>{if(t===!1){this.appendPresortedFilePaths(e);return}this.createdDirectoriesAllExpanded=!1;let n=null,r=0,i=this.nodes,a=this.segmentTable,o=a.idByValue,s=a.valueById,c=this.directoryStack,l=0,u=``,d=0;for(let t of e){if(n===t)throw Error(`Duplicate path: "${t}"`);let e=t.length>0&&t.charCodeAt(t.length-1)===47,a=e?t.length-1:t.length,f=0,p=0;if(n!=null)if(u.length>0&&t.length>u.length&&t.startsWith(u))f=d,p=u.length;else{let r=Math.min(a,n.length),i=!0;for(let e=0;e<r;e++){let r=t.charCodeAt(e);if(r!==n.charCodeAt(e)){i=!1;break}r===47&&(f++,p=e+1)}i&&e&&r===a&&n.length>a&&n.charCodeAt(a)===47&&(f++,p=a+1)}l=f,r=f;let m=p,h=t.indexOf(`/`,m);for(;h>=0&&h<a;){let e=c[l];if(e===void 0)throw Error(`Directory stack underflow while building the path store`);r++;let n=t.slice(m,h),a=o.get(n);a===void 0&&(a=s.length,o.set(n,a),s.push(n));let u=i.length;i.push({depthAndFlags:We(r,0,1),nameId:a,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),this.recordCreatedDirectoryPath(t.slice(0,h)),l++,c[l]=u,m=h+1,h=t.indexOf(`/`,m)}if(e){if(m<a){let e=c[l];if(e===void 0)throw Error(`Unable to resolve directory parent for "${t}"`);r++;let n=t.slice(m,a),u=o.get(n);u===void 0&&(u=s.length,o.set(n,u),s.push(n));let d=i.length;i.push({depthAndFlags:We(r,0,1),nameId:u,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),l++,c[l]=d}let e=c[l];if(e===void 0)throw Error(`Unable to resolve directory node for "${t}"`);this.promoteDirectoryToExplicit(e,t)}else{let e=c[l];if(e===void 0)throw Error(`Unable to resolve file parent for "${t}"`);let n=t.slice(m),a=o.get(n);a===void 0&&(a=s.length,o.set(n,a),s.push(n)),i.push({depthAndFlags:We(r+1,0),nameId:a,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1})}m!==u.length&&(u=t.substring(0,m),d=r),n=t}c.length=l+1,n!=null&&(this.lastPreparedPath=dt(n)),this.hasDeferredDirectoryIndexes=!0}),this}appendPresortedFilePaths(e){let t=null,n=0,r=this.nodes,i=this.segmentTable,a=i.idByValue,o=i.valueById,s=this.directoryStack,c=0,l=``,u=0;for(let i of e){if(t===i)throw Error(`Duplicate path: "${i}"`);let e=i.length,d=0,f=0;if(t!=null)if(l.length>0&&i.length>l.length&&i.startsWith(l))d=u,f=l.length;else{let n=Math.min(e,t.length);for(let e=0;e<n;e++){let n=i.charCodeAt(e);if(n!==t.charCodeAt(e))break;n===47&&(d++,f=e+1)}}c=d,n=d;let p=f,m=i.indexOf(`/`,p);for(;m>=0;){let e=s[c];if(e===void 0)throw Error(`Directory stack underflow while building the path store`);n++;let t=i.slice(p,m),l=a.get(t);l===void 0&&(l=o.length,a.set(t,l),o.push(t));let u=r.length;r.push({depthAndFlags:We(n,0,1),nameId:l,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),this.recordCreatedDirectoryPath(i.slice(0,m)),this.presortedDirectoryNodeIds.push(u),c++,s[c]=u,p=m+1,m=i.indexOf(`/`,p)}let h=s[c];if(h===void 0)throw Error(`Unable to resolve file parent for "${i}"`);let g=i.slice(p),_=a.get(g);_===void 0&&(_=o.length,a.set(g,_),o.push(g)),r.push({depthAndFlags:We(n+1,0),nameId:_,parentId:h,subtreeNodeCount:1,visibleSubtreeCount:1}),p!==l.length&&(l=i.substring(0,p),u=n),t=i}s.length=c+1,t!=null&&(this.lastPreparedPath=dt(t)),this.hasDeferredDirectoryIndexes=!0}finish(e={}){let t=e.skipSubtreeCountPass===!0;return this.hasDeferredDirectoryIndexes?(W(this.instrumentation,`store.builder.buildDirectoryIndexes`,()=>this.buildPresortedFinish(t)),this.hasDeferredDirectoryIndexes=!1):t||W(this.instrumentation,`store.builder.computeSubtreeCounts`,()=>this.computeSubtreeCounts(0)),{directories:this.directories,nodes:this.nodes,options:this.options,rootId:0,segmentTable:this.segmentTable,presortedDirectoryNodeIds:this.presortedDirectoryNodeIds.length>0?this.presortedDirectoryNodeIds:null}}didMatchAllInitialExpandedPaths(){return this.createdDirectoriesAllExpanded&&this.initialExpandedPathSet!=null&&this.createdDirectoryCount===this.initialExpandedPathSet.size}appendPreparedPath(e,t){if(this.hasDeferredDirectoryIndexes&&=(this.buildDirectoryIndexes(),!1),this.lastPreparedPath!=null){if(e.path===this.lastPreparedPath.path)throw Error(`Duplicate path: "${e.path}"`);if(t&&(this.options.sort===`default`?st(this.lastPreparedPath,e,this.segmentSortKeyCache):bt(this.lastPreparedPath,e,this.options.sort))>0)throw Error(`Builder input must be sorted before appendPaths(): "${e.path}"`)}let n=this.lastPreparedPath,r=Ct(e),i=n==null?0:Ct(n),a=n==null?0:St(n.segments,e.segments),o=Math.min(a,r,i);this.directoryStack.length=o+1;for(let n=o;n<r;n++){let r=this.directoryStack[this.directoryStack.length-1];if(r===void 0)throw Error(`Directory stack underflow while building the path store`);let i=t?this.getOrCreateDirectoryChild(r,e.segments[n]):this.createDirectoryChild(r,e.segments[n]);this.directoryStack.push(i)}if(e.isDirectory){let t=this.directoryStack[this.directoryStack.length-1];if(t===void 0)throw Error(`Unable to resolve directory node for "${e.path}"`);this.promoteDirectoryToExplicit(t,e.path),this.lastPreparedPath=e;return}let s=this.directoryStack[this.directoryStack.length-1];if(s===void 0)throw Error(`Unable to resolve file parent for "${e.path}"`);t?this.createFileChild(s,e.basename,e.path):this.createFileChildUnchecked(s,e.basename),this.lastPreparedPath=e}recordCreatedDirectoryPath(e){!this.createdDirectoriesAllExpanded||this.initialExpandedPathSet==null||(this.createdDirectoryCount+=1,this.initialExpandedPathSet.has(e)||(this.createdDirectoriesAllExpanded=!1))}createFileChild(e,t,n){let r=ht(this.segmentTable,t),i=this.getDirectoryIndex(e),a=i.childIdByNameId;if(a!=null&&a.get(r)!==void 0)throw Error(`Path collides with an existing entry: "${n}"`);let o=this.nodes[e];if(o===void 0)throw Error(`Unknown parent node ID: ${String(e)}`);let s=this.nodes.length;return this.nodes.push({depthAndFlags:We(Ge(o)+1,0),nameId:r,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),a?.set(r,s),Ne(i,s),s}createFileChildUnchecked(e,t){let n=ht(this.segmentTable,t),r=this.getDirectoryIndex(e),i=this.nodes[e];if(i===void 0)throw Error(`Unknown parent node ID: ${String(e)}`);let a=this.nodes.length;return this.nodes.push({depthAndFlags:We(Ge(i)+1,0),nameId:n,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),r.childIdByNameId!=null&&r.childIdByNameId.set(n,a),Ne(r,a),a}getOrCreateDirectoryChild(e,t){let n=ht(this.segmentTable,t),r=this.getDirectoryIndex(e);if(r.childIdByNameId!=null){let e=r.childIdByNameId.get(n);if(e!==void 0){let n=this.nodes[e];if(n!=null&&!B(n))throw Error(`Path collides with an existing file while creating directory "${t}"`);return e}}let i=this.nodes[e];if(i===void 0)throw Error(`Unknown parent node ID: ${String(e)}`);let a=this.nodes.length;return this.nodes.push({depthAndFlags:We(Ge(i)+1,0,1),nameId:n,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),r.childIdByNameId!=null&&r.childIdByNameId.set(n,a),Ne(r,a),this.directories.set(a,ke()),a}createDirectoryChild(e,t){let n=ht(this.segmentTable,t),r=this.getDirectoryIndex(e),i=this.nodes[e];if(i===void 0)throw Error(`Unknown parent node ID: ${String(e)}`);let a=this.nodes.length;return this.nodes.push({depthAndFlags:We(Ge(i)+1,0,1),nameId:n,parentId:e,subtreeNodeCount:1,visibleSubtreeCount:1}),r.childIdByNameId!=null&&r.childIdByNameId.set(n,a),Ne(r,a),this.directories.set(a,ke()),a}promoteDirectoryToExplicit(e,t){let n=this.nodes[e];if(n===void 0)throw Error(`Unknown directory node ID: ${String(e)}`);if(!B(n))throw Error(`Path is not a directory: "${t}"`);if(V(n,1))throw Error(`Duplicate path: "${t}"`);Je(n,1)}getDirectoryIndex(e){let t=this.directories.get(e);if(t!==void 0)return t;throw Error(`Unknown directory child index for node ${String(e)}`)}buildPresortedFinish(e){let t=this.nodes,n=this.directories;n.set(0,Ae());let r=-1,i=null;for(let e=1;e<t.length;e++){let a=t[e];if(a==null)continue;if(B(a)){let t=Ae();n.set(e,t),r=e,i=t}let o;a.parentId===r?o=i:(o=n.get(a.parentId),r=a.parentId,i=o??null),o?.childIds.push(e)}if(!e)for(let e=t.length-1;e>=1;e--){let n=t[e];if(n==null)continue;let r=t[n.parentId];r!=null&&(r.subtreeNodeCount+=n.subtreeNodeCount,r.visibleSubtreeCount+=n.visibleSubtreeCount)}}buildDirectoryIndexes(){let e=this.nodes;for(let t=1;t<e.length;t++){let n=e[t];if(n==null)continue;B(n)&&this.directories.set(t,ke());let r=this.directories.get(n.parentId);r!=null&&(r.childIdByNameId!=null&&r.childIdByNameId.set(n.nameId,t),Ne(r,t))}}computeSubtreeCounts(e){let t=this.nodes[e];if(t===void 0)throw Error(`Unknown node ID: ${String(e)}`);if(!B(t))return t.subtreeNodeCount=1,t.visibleSubtreeCount=1,1;let n=this.getDirectoryIndex(e),r=1;for(let e of n.childIds)r+=this.computeSubtreeCounts(e);return Fe(this.nodes,n),t.subtreeNodeCount=r,t.visibleSubtreeCount=r,r}};function Pt(e,t=`closed`,n=null){let r=It(t);return{activeNodeCount:e.nodes.length-1,collapsedDirectoryIds:new Set,collapseNewDirectoriesByDefault:!1,defaultExpansion:r,directoriesOpenByDefault:r===`open`,hasCollapsedDirectoryOverrides:!1,directoryLoadInfoById:new Map,expandedDirectoryIds:new Set,instrumentation:n,listeners:new Map,pathCacheByNodeId:new Map([[e.rootId,{path:``,version:0}]]),pathCacheVersion:0,snapshot:e,transactionStack:[]}}function Ft(){return{affectedAncestorIds:new Set,affectedNodeIds:new Set,events:[]}}function It(e){if(typeof e!=`number`)return e;if(!Number.isInteger(e)||e<0)throw Error(`initialExpansion must be "open", "closed", or a non-negative integer depth. Received: ${String(e)}`);return e}function Lt(e,t){return V(t,2)||e.defaultExpansion===`open`?!0:e.defaultExpansion===`closed`?!1:Ge(t)<=e.defaultExpansion}function Rt(e,t,n=e.snapshot.nodes[t]){return n==null||!B(n)?!1:e.directoriesOpenByDefault&&!e.hasCollapsedDirectoryOverrides?!0:e.collapsedDirectoryIds.has(t)?!1:e.expandedDirectoryIds.has(t)?!0:Lt(e,n)}function zt(e,t,n,r=e.snapshot.nodes[t]){if(r==null||!B(r))return;let i=Lt(e,r);if(n){if(i){e.collapsedDirectoryIds.delete(t),e.hasCollapsedDirectoryOverrides=e.collapsedDirectoryIds.size>0;return}e.expandedDirectoryIds.add(t);return}if(i){e.collapsedDirectoryIds.add(t),e.hasCollapsedDirectoryOverrides=!0;return}e.expandedDirectoryIds.delete(t)}function Bt(e,t){let n=e.directoryLoadInfoById.get(t);if(n!=null)return n;let r={activeAttemptId:null,errorMessage:null,nextAttemptId:1,state:`loaded`};return e.directoryLoadInfoById.set(t,r),r}function Vt(e,t){return e.directoryLoadInfoById.get(t)?.state??`loaded`}function Ht(e,t){let n=Bt(e,t);if(n.state===`loading`&&n.activeAttemptId!=null)return{attemptId:n.activeAttemptId,nodeId:t,reused:!0};let r=n.nextAttemptId;return n.activeAttemptId=r,n.errorMessage=null,n.nextAttemptId+=1,n.state=`loading`,{attemptId:r,nodeId:t,reused:!1}}function Ut(e,t){let n=Bt(e,t);n.activeAttemptId=null,n.errorMessage=null,n.state=`unloaded`}function Wt(e,t,n){let r=e.directoryLoadInfoById.get(t);return r==null||r.activeAttemptId!==n?!1:(r.activeAttemptId=null,r.errorMessage=null,r.state=`loaded`,!0)}function Gt(e,t,n){return e.directoryLoadInfoById.get(t)?.activeAttemptId===n}function Kt(e,t,n,r){let i=e.directoryLoadInfoById.get(t);return i==null||i.activeAttemptId!==n?!1:(i.activeAttemptId=null,i.errorMessage=r??null,i.state=`error`,!0)}function qt(e,t){e.directoryLoadInfoById.delete(t)}function Jt(e,t,n){let r=n,i=e.listeners.get(t);return i==null?e.listeners.set(t,new Set([r])):i.add(r),()=>{let n=e.listeners.get(t);n!=null&&(n.delete(r),n.size===0&&e.listeners.delete(t))}}function Yt(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],canonicalChanged:!0,operation:`add`,path:e.path,projectionChanged:e.projectionChanged,visibleCountDelta:null}}function Xt(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],canonicalChanged:!0,operation:`remove`,path:e.path,projectionChanged:e.projectionChanged,recursive:e.recursive,visibleCountDelta:null}}function Zt(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],canonicalChanged:!0,from:e.from,operation:`move`,projectionChanged:e.projectionChanged,to:e.to,visibleCountDelta:null}}function Qt(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],canonicalChanged:!1,operation:`expand`,path:e.path,projectionChanged:!0,visibleCountDelta:null}}function $t(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],canonicalChanged:!1,operation:`collapse`,path:e.path,projectionChanged:!0,visibleCountDelta:null}}function en(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],canonicalChanged:!1,operation:`mark-directory-unloaded`,path:e.path,projectionChanged:e.projectionChanged,visibleCountDelta:null}}function tn(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],attemptId:e.attemptId,canonicalChanged:!1,operation:`begin-child-load`,path:e.path,projectionChanged:e.projectionChanged,reused:e.reused,visibleCountDelta:null}}function nn(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],attemptId:e.attemptId,canonicalChanged:e.childEvents.some(e=>e.canonicalChanged),childEvents:e.childEvents,operation:`apply-child-patch`,path:e.path,projectionChanged:e.projectionChanged,visibleCountDelta:null}}function rn(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],attemptId:e.attemptId,canonicalChanged:!1,operation:`complete-child-load`,path:e.path,projectionChanged:e.projectionChanged,stale:e.stale,visibleCountDelta:null}}function an(e){return{affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],attemptId:e.attemptId,canonicalChanged:!1,errorMessage:e.errorMessage,operation:`fail-child-load`,path:e.path,projectionChanged:e.projectionChanged,stale:e.stale,visibleCountDelta:null}}function on(e){return{activeNodeCountAfter:e.activeNodeCountAfter,activeNodeCountBefore:e.activeNodeCountBefore,affectedAncestorIds:e.affectedAncestorIds??[],affectedNodeIds:e.affectedNodeIds??[],cachedPathEntryCountAfter:e.cachedPathEntryCountAfter,cachedPathEntryCountBefore:e.cachedPathEntryCountBefore,canonicalChanged:!1,idsPreserved:e.idsPreserved,loadInfoEntryCountAfter:e.loadInfoEntryCountAfter,loadInfoEntryCountBefore:e.loadInfoEntryCountBefore,mode:e.mode,operation:`cleanup`,projectionChanged:e.projectionChanged,reclaimedCachedPathEntryCount:e.reclaimedCachedPathEntryCount,reclaimedLoadInfoEntryCount:e.reclaimedLoadInfoEntryCount,reclaimedNodeSlotCount:e.reclaimedNodeSlotCount,reclaimedSegmentCount:e.reclaimedSegmentCount,segmentCountAfter:e.segmentCountAfter,segmentCountBefore:e.segmentCountBefore,totalNodeSlotCountAfter:e.totalNodeSlotCountAfter,totalNodeSlotCountBefore:e.totalNodeSlotCountBefore,visibleCountDelta:null}}function sn(e,t,n){return{...n,visibleCountDelta:vn(e)-t}}function cn(e,t){let n=vn(e),r=Ft();e.transactionStack.push(r);try{t()}catch(t){throw dn(e,r,!1),t}dn(e,r,!0,vn(e)-n)}function ln(e,t){let n=e.instrumentation;if(n==null){un(e,t);return}W(n,`store.events.record`,()=>un(e,t))}function un(e,t){let n=e.transactionStack[e.transactionStack.length-1]??null;if(n==null){gn(e,t);return}n.events.push(t),hn(n,t)}function dn(e,t,n,r=null){if(e.transactionStack.pop()!==t)throw Error(`Transaction stack underflow`);if(!n)return;let i=e.transactionStack[e.transactionStack.length-1]??null;if(i!=null){let n=e.instrumentation;n==null?mn(i,t):W(n,`store.events.batch.merge`,()=>mn(i,t));return}let a=fn(t,r),o=e.instrumentation;if(o==null){gn(e,a);return}W(o,`store.events.batch.commit`,()=>gn(e,a))}function fn(e,t){return{affectedAncestorIds:[...e.affectedAncestorIds],affectedNodeIds:[...e.affectedNodeIds],canonicalChanged:e.events.some(e=>e.canonicalChanged),events:[...e.events],operation:`batch`,projectionChanged:e.events.some(e=>e.projectionChanged),visibleCountDelta:t}}function pn(e,t){for(let n of t.affectedAncestorIds)e.affectedAncestorIds.add(n);for(let n of t.affectedNodeIds)e.affectedNodeIds.add(n)}function mn(e,t){for(let n of t.events)e.events.push(n);pn(e,t)}function hn(e,t){for(let n of t.affectedNodeIds)e.affectedNodeIds.add(n);for(let n of t.affectedAncestorIds)e.affectedAncestorIds.add(n)}function gn(e,t){let n=e.instrumentation;if(n==null){_n(e,t);return}W(n,`store.events.emit`,()=>_n(e,t))}function _n(e,t){e.listeners.get(t.operation)?.forEach(e=>e(t)),e.listeners.get(`*`)?.forEach(e=>e(t))}function vn(e){return e.snapshot.nodes[e.snapshot.rootId]?.visibleSubtreeCount??0}function yn(e,t){if(e.snapshot.options.flattenEmptyDirectories!==!0)return null;let n=e.snapshot.nodes[t];if(n==null||!B(n)||V(n,2))return null;let r=e.snapshot.directories.get(t);if(r==null||r.childIds.length!==1)return null;let i=r.childIds[0];if(i==null)return null;let a=e.snapshot.nodes[i];return a==null||!B(a)?null:i}function bn(e,t){let n=t;for(;;){let t=yn(e,n);if(t==null)return n;n=t}}function xn(e,t){let n=[t],r=t;for(;;){let t=yn(e,r);if(t==null)return n;n.push(t),r=t}}function Sn(e,t){let n=t==null?e.snapshot.rootId:jn(e,t);return n==null?[]:Nn(e,n)}function Cn(e,t){let n=dt(t),r=n.isDirectory?n.segments:n.segments.slice(0,-1),i=Jn(e,qn(e,r)),{createdNodeIds:a,directoryId:o}=Pn(e,r),s=new Set(a),c=o;if(n.isDirectory){let n=J(e,o);if(V(n,1))throw Error(`Path already exists: "${t}"`);Je(n,1),e.pathCacheByNodeId.set(o,{path:t,version:e.pathCacheVersion}),s.add(o)}else c=In(e,o,n.basename),s.add(c);On(e,o);let l=Jn(e,o);return Yt({affectedAncestorIds:An(e,c),affectedNodeIds:[...s],path:t,projectionChanged:Yn(i,l)})}function wn(e,t,n){let r=jn(e,t);if(r==null)throw Error(`Path does not exist: "${t}"`);let i=J(e,r);if(V(i,2))throw Error(`The root node cannot be removed`);if(B(i)&&q(e,r).childIds.length>0&&n.recursive!==!0)throw Error(`Cannot remove a non-empty directory without recursive: "${t}"`);let a=i.parentId,o=Jn(e,a),s=Gn(e,r);zn(e,a,r,i.nameId),Kn(e,a),On(e,a);let c=Jn(e,a);return Xt({affectedAncestorIds:An(e,a),affectedNodeIds:s,path:t,projectionChanged:Yn(o,c),recursive:n.recursive===!0})}function Tn(e,t,n,r){let i=jn(e,t);if(i==null)throw Error(`Source path does not exist: "${t}"`);let a=J(e,i);if(V(a,2))throw Error(`The root node cannot be moved`);let o=r.collision??`error`,s=Un(e,i,n),c=Jn(e,a.parentId),l=Jn(e,s.parentId),u=gt(e.snapshot.segmentTable,a.nameId),d=ht(e.snapshot.segmentTable,s.basename);if(s.parentId===a.parentId&&u===s.basename)return null;if(B(a)&&$n(e,i,s.parentId))throw Error(`Cannot move a directory into one of its descendants`);let f=je(e.snapshot.nodes,q(e,s.parentId)).get(d),p=s.existingNodeId??f??null;if(p!=null&&p!==i&&Wn(e,p,o,Ke(a))===`skip`)return null;let m=a.parentId;zn(e,m,i,a.nameId),a.parentId=s.parentId,a.nameId=d,e.pathCacheByNodeId.delete(i),Qn(e,i),Rn(e,s.parentId,i),Kn(e,m),e.pathCacheVersion++,On(e,m),s.parentId!==m&&On(e,s.parentId);let h=Jn(e,m),g=Jn(e,s.parentId);return Zt({affectedAncestorIds:[...new Set([...An(e,m),...An(e,s.parentId)])],affectedNodeIds:[i],from:t,projectionChanged:Xn([c,l],[h,g]),to:K(e,i)})}function En(e,t){let n=e.pathCacheByNodeId.get(t);return n!=null&&n.version===e.pathCacheVersion?n.path:null}function Dn(e,t,n){return e.pathCacheByNodeId.set(t,{path:n,version:e.pathCacheVersion}),n}function K(e,t){let n=J(e,t),r=En(e,t);if(r!=null)return r;if(V(n,2))return Dn(e,t,``);let i=K(e,n.parentId),a=gt(e.snapshot.segmentTable,n.nameId),o=i.length===0?a:`${i}${a}`;return Dn(e,t,B(n)?`${o}/`:o)}function On(e,t){let n=e.instrumentation;if(n==null){tr(e,t);return}W(n,`store.recomputeCountsUpwardFrom`,()=>tr(e,t))}function kn(e,t){let n=[[t,0]],{nodes:r,directories:i}=e.snapshot;for(;n.length>0;){let t=n[n.length-1],a=t[0],o=r[a];if(o==null||!B(o)){er(e,a,o,!0),n.pop();continue}let s=i.get(a);if(s==null||t[1]>=s.childIds.length){er(e,a,o,!0),n.pop();continue}let c=s.childIds[t[1]++];n.push([c,0])}}function An(e,t){let n=[],r=t;for(;r!=null;){let t=J(e,r);if(n.push(r),r===e.snapshot.rootId)break;r=t.parentId}return n}function jn(e,t){if(t.length===0)return e.snapshot.rootId;let n=ft(t);return Mn(e,n.segments,n.requiresDirectory)}function Mn(e,t,n){let r=e.snapshot.rootId;for(let n of t){let t=e.snapshot.segmentTable.idByValue.get(n);if(t===void 0)return null;let i=q(e,r),a=je(e.snapshot.nodes,i).get(t);if(a===void 0)return null;r=a}let i=J(e,r);return n&&!B(i)?null:r}function q(e,t){let n=e.snapshot.directories.get(t);if(n===void 0)throw Error(`Unknown directory child index for node ${String(t)}`);return n}function J(e,t){let n=e.snapshot.nodes[t];if(n===void 0||V(n,4))throw Error(`Unknown node ID: ${String(t)}`);return n}function Nn(e,t){let n=e.snapshot.nodes[t];if(n===void 0||V(n,4))return[];if(!B(n))return[K(e,t)];if(q(e,t).childIds.length===0)return V(n,1)&&!V(n,2)?[K(e,t)]:[];let r=[],i=[{childIndex:0,nodeId:t}];for(;i.length>0;){let t=i[i.length-1];if(t==null)break;let n=e.snapshot.nodes[t.nodeId];if(n===void 0||V(n,4)){i.pop();continue}if(!B(n)){r.push(K(e,t.nodeId)),i.pop();continue}let a=q(e,t.nodeId);if(a.childIds.length===0){V(n,1)&&!V(n,2)&&r.push(K(e,t.nodeId)),i.pop();continue}let o=a.childIds[t.childIndex];if(o==null){i.pop();continue}t.childIndex++,i.push({childIndex:0,nodeId:o})}return r}function Pn(e,t){let n=[],r=e.snapshot.rootId;for(let i of t){let t=ht(e.snapshot.segmentTable,i),a=q(e,r),o=je(e.snapshot.nodes,a).get(t);if(o!==void 0){if(!B(J(e,o)))throw Error(`Cannot create a directory that collides with an existing file: "${i}"`);r=o;continue}r=Fn(e,r,t),n.push(r)}return{createdNodeIds:n,directoryId:r}}function Fn(e,t,n){let r=J(e,t),i=e.snapshot.nodes.length;return e.snapshot.nodes.push({depthAndFlags:We(Ge(r)+1,0,1),nameId:n,parentId:t,subtreeNodeCount:1,visibleSubtreeCount:1}),e.snapshot.directories.set(i,ke()),Rn(e,t,i),e.collapseNewDirectoriesByDefault&&(e.collapsedDirectoryIds.add(i),e.hasCollapsedDirectoryOverrides=!0),e.activeNodeCount++,i}function In(e,t,n){let r=ht(e.snapshot.segmentTable,n),i=q(e,t);if(je(e.snapshot.nodes,i).has(r))throw Error(`Path already exists: "${rr(e,t,n)}"`);let a=J(e,t),o=e.snapshot.nodes.length;return e.snapshot.nodes.push({depthAndFlags:We(Ge(a)+1,0),nameId:r,parentId:t,subtreeNodeCount:1,visibleSubtreeCount:1}),Rn(e,t,o),e.activeNodeCount++,o}function Ln(e,t,n){let r=0,i=t.childIds.length;for(;r<i;){let a=r+i>>>1,o=t.childIds[a];if(o==null){i=a;continue}Bn(e,n,o)<0?i=a:r=a+1}return r}function Rn(e,t,n){let r=q(e,t),i=J(e,n);je(e.snapshot.nodes,r).set(i.nameId,n),z(r,n,i.subtreeNodeCount,i.visibleSubtreeCount);let a=Ln(e,r,n);r.childIds.splice(a,0,n),Pe(r,a),Re(e.snapshot.nodes,r)}function zn(e,t,n,r){let i=q(e,t),a=Me(i),o=a.get(n)??-1;je(e.snapshot.nodes,i).delete(r),a.delete(n);let s=e.snapshot.nodes[n];s!=null&&z(i,n,-s.subtreeNodeCount,-s.visibleSubtreeCount),o>=0&&(i.childIds.splice(o,1),Pe(i,o),Re(e.snapshot.nodes,i))}function Bn(e,t,n){let r=e.snapshot.options.sort;return r===`default`?Vn(e,t,n):r(Hn(e,t),Hn(e,n))}function Vn(e,t,n){let r=J(e,t),i=J(e,n),a=B(r);if(a!==B(i))return a?-1:1;let o=G(ct(e.snapshot.segmentTable,r.nameId),ct(e.snapshot.segmentTable,i.nameId));if(o!==0)return o;let s=gt(e.snapshot.segmentTable,r.nameId),c=gt(e.snapshot.segmentTable,i.nameId);return s===c?t<n?-1:1:s<c?-1:1}function Hn(e,t){let n=J(e,t),r=K(e,t),i=B(n),a=i?r.slice(0,-1):r;return{basename:gt(e.snapshot.segmentTable,n.nameId),depth:Ge(n),isDirectory:i,path:r,segments:a.length===0?[]:a.split(`/`)}}function Un(e,t,n){let r=J(e,t),i=jn(e,n);if(i!=null){let t=J(e,i);if(B(t))return{basename:gt(e.snapshot.segmentTable,r.nameId),existingNodeId:null,parentId:i};let a=ft(n).segments;return{basename:a[a.length-1]??``,existingNodeId:i,parentId:t.parentId}}let a=ft(n),o=a.segments[a.segments.length-1]??``,s=a.segments.slice(0,-1),c=s.length===0?e.snapshot.rootId:Mn(e,s,!0);if(c==null)throw Error(`Destination parent does not exist: "${n}"`);return{basename:o,existingNodeId:null,parentId:c}}function Wn(e,t,n,r){if(n===`skip`)return`skip`;if(n===`error`)throw Error(`Destination already exists: "${K(e,t)}"`);let i=J(e,t);if(Ke(i)!==r)throw Error(`replace collision requires the same source and destination kinds`);if(B(i)&&q(e,t).childIds.length>0)throw Error(`replace collision does not support non-empty directories`);let a=i.parentId,o=i.nameId;return Gn(e,t),zn(e,a,t,o),Kn(e,a),On(e,a),`handled`}function Gn(e,t){let n=[],r=[{nodeId:t,visitedChildren:!1}];for(;r.length>0;){let t=r.pop();if(t==null)break;let i=J(e,t.nodeId);if(t.visitedChildren||!B(i)){B(i)&&e.snapshot.directories.delete(t.nodeId),Je(i,4),e.pathCacheByNodeId.delete(t.nodeId),e.collapsedDirectoryIds.delete(t.nodeId)&&(e.hasCollapsedDirectoryOverrides=e.collapsedDirectoryIds.size>0),e.expandedDirectoryIds.delete(t.nodeId),qt(e,t.nodeId),e.activeNodeCount--,n.push(t.nodeId);continue}r.push({nodeId:t.nodeId,visitedChildren:!0});let a=q(e,t.nodeId);for(let e=a.childIds.length-1;e>=0;e--){let t=a.childIds[e];t!=null&&r.push({nodeId:t,visitedChildren:!1})}}return n}function Kn(e,t){let n=t;for(;n!=null;){let t=J(e,n);if(!B(t)||V(t,2)||q(e,n).childIds.length>0)return;Je(t,1),n=t.parentId===n?null:t.parentId}}function qn(e,t){let n=e.snapshot.rootId;for(let r of t){let t=e.snapshot.segmentTable.idByValue.get(r);if(t==null)break;let i=je(e.snapshot.nodes,q(e,n)).get(t);if(i==null||!B(J(e,i)))break;n=i}return n}function Jn(e,t){let n=Zn(e,t);if(n==null)return null;let r=bn(e,n),i=J(e,r),a=n===r?null:xn(e,n).map(t=>K(e,t));return JSON.stringify({flattenedSegmentPaths:a,hasChildren:q(e,r).childIds.length>0,path:K(e,r),terminalKind:Ke(i)})}function Yn(e,t){return Xn([e],[t])}function Xn(e,t){for(let n=0;n<e.length;n+=1){let r=e[n],i=t[n];if(r==null||i==null||r!==i)return!0}return!1}function Zn(e,t){let n=t;for(;n!=null;){let t=J(e,n);if(!B(t)||V(t,2))return null;if(!Rt(e,n,t))return n;n=t.parentId}return null}function Qn(e,t){let n=J(e,t);if(H(n,(t===e.snapshot.rootId?-1:Ge(J(e,n.parentId)))+1),!B(n))return;let r=q(e,t);for(let t of r.childIds)Qn(e,t)}function $n(e,t,n){let r=n;for(;r!=null;){if(r===t)return!0;let n=J(e,r);if(r===e.snapshot.rootId)return!1;r=n.parentId}return!1}function er(e,t,n=J(e,t),r=!1){let i=e.instrumentation;if(i==null){nr(e,t,n,r);return}W(i,`store.recomputeNodeCounts`,()=>nr(e,t,n,r))}function tr(e,t){let n=t;for(;n!=null;){let t=J(e,n),r=t.subtreeNodeCount,i=t.visibleSubtreeCount;if(er(e,n,t),n===e.snapshot.rootId)return;let a=t.subtreeNodeCount-r,o=t.visibleSubtreeCount-i,s=t.parentId;(a!==0||o!==0)&&z(q(e,s),n,a,o),n=s}}function nr(e,t,n,r){if(!B(n)){n.subtreeNodeCount=1,n.visibleSubtreeCount=1;return}let i=q(e,t);if(r){let t=e.instrumentation;t==null?Fe(e.snapshot.nodes,i):W(t,`store.recomputeNodeCounts.rebuildChildAggregates`,()=>Fe(e.snapshot.nodes,i))}let a=1+i.totalChildSubtreeNodeCount,o=i.totalChildVisibleSubtreeCount;if(n.subtreeNodeCount=a,V(n,2)){n.visibleSubtreeCount=o;return}n.visibleSubtreeCount=yn(e,t)==null?Rt(e,t,n)?1+o:1:o}function rr(e,t,n){let r=K(e,t);return r.length===0?n:`${r}${n}`}function ir(e){return e!=null&&!V(e,4)}function ar(e,t){let n=e.snapshot.nodes[t];return!ir(n)||!B(n)||V(n,2)?null:n}function or(e){let t=0;for(let[n,r]of e.pathCacheByNodeId)r.version===e.pathCacheVersion&&ir(e.snapshot.nodes[n])&&(t+=1);return t}function sr(e){return Math.max(0,e.valueById.length-1)}function cr(e){return{activeNodeCount:e.activeNodeCount,cachedPathEntryCount:or(e),loadInfoEntryCount:e.directoryLoadInfoById.size,segmentCount:sr(e.snapshot.segmentTable),totalNodeSlotCount:Math.max(0,e.snapshot.nodes.length-1)}}function lr(e,t,n,r){return{activeNodeCountAfter:r.activeNodeCount,activeNodeCountBefore:n.activeNodeCount,cachedPathEntryCountAfter:r.cachedPathEntryCount,cachedPathEntryCountBefore:n.cachedPathEntryCount,idsPreserved:t,loadInfoEntryCountAfter:r.loadInfoEntryCount,loadInfoEntryCountBefore:n.loadInfoEntryCount,mode:e,reclaimedCachedPathEntryCount:n.cachedPathEntryCount-r.cachedPathEntryCount,reclaimedLoadInfoEntryCount:n.loadInfoEntryCount-r.loadInfoEntryCount,reclaimedNodeSlotCount:n.totalNodeSlotCount-r.totalNodeSlotCount,reclaimedSegmentCount:n.segmentCount-r.segmentCount,segmentCountAfter:r.segmentCount,segmentCountBefore:n.segmentCount,totalNodeSlotCountAfter:r.totalNodeSlotCount,totalNodeSlotCountBefore:n.totalNodeSlotCount}}function ur(e){let t=[],n=[];for(let n of e.collapsedDirectoryIds)ar(e,n)!=null&&t.push(K(e,n));for(let t of e.expandedDirectoryIds)ar(e,t)!=null&&n.push(K(e,t));return{collapsedPaths:t,expandedPaths:n}}function dr(e){let t=[];for(let[n,r]of e.directoryLoadInfoById)ar(e,n)==null||Vt(e,n)===`loaded`||t.push({info:{activeAttemptId:null,errorMessage:r.errorMessage,nextAttemptId:r.nextAttemptId,state:r.state},path:K(e,n)});return t}function fr(e,t){e.collapsedDirectoryIds.clear(),e.hasCollapsedDirectoryOverrides=!1,e.expandedDirectoryIds.clear();for(let n of t.expandedPaths){let t=jn(e,n);t!=null&&zt(e,t,!0,J(e,t))}for(let n of t.collapsedPaths){let t=jn(e,n);t!=null&&zt(e,t,!1,J(e,t))}}function pr(e,t){e.directoryLoadInfoById.clear();for(let n of t){let t=jn(e,n.path);t!=null&&ar(e,t)!=null&&e.directoryLoadInfoById.set(t,{activeAttemptId:null,errorMessage:n.info.errorMessage,nextAttemptId:n.info.nextAttemptId,state:n.info.state})}}function mr(e){e.pathCacheVersion+=1,e.pathCacheByNodeId.clear(),e.pathCacheByNodeId.set(e.snapshot.rootId,{path:``,version:e.pathCacheVersion})}function hr(e){let t=e.snapshot.segmentTable,n=mt();for(let r of e.snapshot.nodes)if(ir(r)){if(V(r,2)){r.nameId=0;continue}r.nameId=ht(n,gt(t,r.nameId))}e.snapshot.segmentTable=n}function gr(e){for(let[t,n]of e.snapshot.directories){let r=e.snapshot.nodes[t];if(!ir(r)||!B(r)){e.snapshot.directories.delete(t);continue}let i=n.childIds.filter(n=>{let r=e.snapshot.nodes[n];return ir(r)&&r.parentId===t});n.childIds=i,n.childIdByNameId=new Map(i.map(t=>[J(e,t).nameId,t])),n.childPositionById=new Map(i.map((e,t)=>[e,t])),Fe(e.snapshot.nodes,n)}}function _r(e){let t=e.snapshot.nodes.length-1;for(;t>e.snapshot.rootId;){let n=e.snapshot.nodes[t];if(ir(n))break;--t}e.snapshot.nodes.length=t+1}function vr(e){let t=ur(e),n=dr(e);W(e.instrumentation,`store.cleanup.stable.clearPathCaches`,()=>mr(e)),W(e.instrumentation,`store.cleanup.stable.rebuildSegmentTable`,()=>hr(e)),W(e.instrumentation,`store.cleanup.stable.rebuildDirectoryIndexes`,()=>gr(e)),W(e.instrumentation,`store.cleanup.stable.trimTrailingRemovedNodeSlots`,()=>_r(e)),W(e.instrumentation,`store.cleanup.stable.restoreExpansionOverrides`,()=>fr(e,t)),W(e.instrumentation,`store.cleanup.stable.restoreDirectoryLoadInfos`,()=>pr(e,n)),W(e.instrumentation,`store.cleanup.stable.recomputeCounts`,()=>kn(e,e.snapshot.rootId))}function yr(e){let t=ur(e),n=dr(e),r=W(e.instrumentation,`store.cleanup.aggressive.listPaths`,()=>Sn(e)),i=Ye({...e.snapshot.options},e.instrumentation),a=W(e.instrumentation,`store.cleanup.aggressive.rebuildSnapshot`,()=>{let e=new Nt(i);return e.appendPaths(r),e.finish()});e.snapshot=a,e.activeNodeCount=a.nodes.length-1,e.pathCacheByNodeId=new Map([[a.rootId,{path:``,version:0}]]),e.pathCacheVersion=0,W(e.instrumentation,`store.cleanup.aggressive.restoreExpansionOverrides`,()=>fr(e,t)),W(e.instrumentation,`store.cleanup.aggressive.restoreDirectoryLoadInfos`,()=>pr(e,n)),W(e.instrumentation,`store.cleanup.aggressive.recomputeCounts`,()=>kn(e,e.snapshot.rootId))}function br(e){for(let t of e.directoryLoadInfoById.values())if(t.state===`loading`&&t.activeAttemptId!=null)return!0;return!1}function xr(e,t){let n=cr(e);t===`stable`?W(e.instrumentation,`store.cleanup.stable`,()=>vr(e)):W(e.instrumentation,`store.cleanup.aggressive`,()=>yr(e));let r=cr(e);return lr(t,t===`stable`,n,r)}var Sr=64;function Cr(e,t){let n=t+2;if(n<=e.length)return e;let r=e.length;for(;r<n;)r*=2;let i=new Int32Array(r);return i.fill(-1),i.set(e),i}function wr(e){return J(e,e.snapshot.rootId).visibleSubtreeCount}function Tr(e,t,n,r){let i=J(e,t.terminalNodeId),a=Math.max(1,i.visibleSubtreeCount);return Math.min(r-1,n+a-1)}function Er(e,t,n,r){return{ancestorPaths:r,index:t.index,posInSet:t.posInSet,row:Gr(e,t.cursor),setSize:t.setSize,subtreeEndIndex:Tr(e,t.cursor,t.index,n)}}function Dr(e,t,n,r,i,a){let o=q(e,t),{childIndex:s,childVisibleIndex:c,localVisibleIndex:l}=Ie(e.snapshot.nodes,o,n),u=o.childIds[s];if(u==null)throw Error(`Visible index ${String(n)} is out of range`);return Or(e,u,l,r+c,i+1,s,o.childIds.length,a)}function Or(e,t,n,r,i,a,o,s){if(!B(J(e,t))){if(n===0)return{ancestors:s,cursor:{headNodeId:t,terminalNodeId:t,visibleDepth:i},index:r,posInSet:a,setSize:o};throw Error(`Visible index ${String(n)} is out of range for file`)}let c=zr(e,t,i);if(n===0)return{ancestors:s,cursor:c,index:r,posInSet:a,setSize:o};let l=J(e,c.terminalNodeId);if(!B(l)||!Rt(e,c.terminalNodeId,l))throw Error(`Visible index ${String(n)} is out of range for collapsed directory`);return Dr(e,c.terminalNodeId,n-1,r+1,c.visibleDepth,[...s,{cursor:c,index:r,posInSet:a,setSize:o}])}function kr(e,t){let n=wr(e);if(t<0||t>=n)return null;let r=Dr(e,e.snapshot.rootId,t,0,-1,[]),i=r.ancestors.map(t=>K(e,t.cursor.terminalNodeId)),a=null;return{ancestorPaths:i,get ancestorRows(){if(a!=null)return a;let t=[],i=[];for(let a of r.ancestors){let r=Er(e,a,n,[...i]);t.push(r),i.push(r.row.path)}return a=t,a},index:r.index,posInSet:r.posInSet,row:Gr(e,r.cursor),setSize:r.setSize,subtreeEndIndex:Tr(e,r.cursor,r.index,n)}}function Ar(e,t,n){let r=e.instrumentation,i=wr(e);if(i<=0||n<t)return[];let a=Math.max(0,Math.min(t,i-1)),o=Math.max(a,Math.min(n,i-1));if(r==null){if(a===0)return Wr(e,o+1);let t=[],n=Ir(e,a);for(let r=a;r<=o&&n!=null;r++){let r=Gr(e,n);t.push(r),n=Vr(e,n)}return t}let s=[],c=0,l=0,u=W(r,`store.getVisibleSlice.selectFirstRow`,()=>Ir(e,a));for(let t=a;t<=o&&u!=null;t++){let t=W(r,`store.getVisibleSlice.materializeRow`,()=>Gr(e,u));s.push(t),t.isFlattened&&(c++,l+=t.flattenedSegments?.length??0),u=W(r,`store.getVisibleSlice.advanceCursor`,()=>Vr(e,u))}return Ze(r,`workload.visibleRowsRead`,s.length),Ze(r,`workload.flattenedRowsRead`,c),Ze(r,`workload.flattenedSegmentsRead`,l),s}function jr(e,t=wr(e)){let n=e.instrumentation;return n==null?Ur(e,t):W(n,`store.getVisibleTreeProjection`,()=>Ur(e,t))}function Mr(e){return Hr(jr(e))}function Nr(e,t){let n=jn(e,t);if(n==null||n===e.snapshot.rootId||B(J(e,n))&&bn(e,n)!==n)return null;let r=0,i=n,{nodes:a,rootId:o}=e.snapshot;for(;i!==o;){let t=J(e,i).parentId,n=q(e,t),s=Me(n).get(i);if(s==null)throw Error(`Child ${String(i)} was not found in its parent index`);if(r+=Le(a,n,s),t!==o){let n=J(e,t),a=yn(e,t);if(!Rt(e,t,n)&&a!==i)return null;bn(e,t)===t&&(r+=1)}i=t}return r}function Pr(e,t){let n=jn(e,t);if(n==null)throw Error(`Path does not exist: "${t}"`);let r=J(e,n);if(!B(r))throw Error(`Path is not a directory: "${t}"`);return Rt(e,n,r)?null:(zt(e,n,!0,r),On(e,n),Qt({affectedAncestorIds:An(e,n),affectedNodeIds:[n],path:t,projectionChanged:!0}))}function Fr(e,t){let n=jn(e,t);if(n==null)throw Error(`Path does not exist: "${t}"`);let r=J(e,n);if(!B(r))throw Error(`Path is not a directory: "${t}"`);return Rt(e,n,r)?(zt(e,n,!1,r),On(e,n),$t({affectedAncestorIds:An(e,n),affectedNodeIds:[n],path:t,projectionChanged:!0})):null}function Ir(e,t){return t<0||t>=wr(e)?null:Lr(e,e.snapshot.rootId,t,-1)}function Lr(e,t,n,r){let i=q(e,t),a=e.instrumentation,{childIndex:o,localVisibleIndex:s}=a==null?Ie(e.snapshot.nodes,i,n):W(a,`store.getVisibleSlice.selectChildIndex`,()=>Ie(e.snapshot.nodes,i,n)),c=i.childIds[o];if(c!=null)return Rr(e,c,s,r+1);throw Error(`Visible index ${String(n)} is out of range`)}function Rr(e,t,n,r){if(!B(J(e,t))){if(n===0)return{headNodeId:t,terminalNodeId:t,visibleDepth:r};throw Error(`Visible index ${String(n)} is out of range for file`)}let i=zr(e,t,r);if(n===0)return i;let a=J(e,i.terminalNodeId);if(!B(a)||!Rt(e,i.terminalNodeId,a))throw Error(`Visible index ${String(n)} is out of range for collapsed directory`);return Lr(e,i.terminalNodeId,n-1,i.visibleDepth)}function zr(e,t,n){return B(J(e,t))?e.instrumentation==null?{headNodeId:t,terminalNodeId:bn(e,t),visibleDepth:n}:{headNodeId:t,terminalNodeId:W(e.instrumentation,`store.getVisibleSlice.flatten.resolveTerminalDirectory`,()=>bn(e,t)),visibleDepth:n}:{headNodeId:t,terminalNodeId:t,visibleDepth:n}}function Br(e,t){let n=J(e,t);if(!B(n))return!0;let r=n.parentId;return r===e.snapshot.rootId?!0:yn(e,r)!==t}function Vr(e,t){let n=J(e,t.terminalNodeId);if(B(n)){let r=q(e,t.terminalNodeId);if(Rt(e,t.terminalNodeId,n)&&r.childIds.length>0){let n=r.childIds[0];return n==null?null:Rr(e,n,0,t.visibleDepth+1)}}let r=t.terminalNodeId,i=t.visibleDepth;for(;;){let t=J(e,r);if(r===e.snapshot.rootId)return null;let n=t.parentId,a=q(e,n),o=Me(a).get(r)??-1;if(o<0)throw Error(`Child ${String(r)} was not found in its parent index`);let s=a.childIds[o+1]??null;if(s!=null)return Rr(e,s,0,i);Br(e,r)&&i--,r=n}}function Hr(e){let t=e.paths.length,n=Array(t);for(let r=0;r<t;r+=1){let t=e.getParentIndex(r);n[r]={index:r,parentPath:t>=0?e.paths[t]??null:null,path:e.paths[r]??``,posInSet:e.posInSetByIndex[r]??0,setSize:e.setSizeByIndex[r]??0}}return{getParentIndex:e.getParentIndex,rows:n,get visibleIndexByPath(){return e.visibleIndexByPath}}}function Ur(e,t){let n=Array(t),r=new Int32Array(t),i=new Int32Array(t),a=new Int32Array(t),o=new Int32Array(Sr);o.fill(-1);let s=0,{nodes:c,directories:l,segmentTable:u}=e.snapshot,d=[[l.get(e.snapshot.rootId),0,-1,``]],f=e.snapshot.options.flattenEmptyDirectories,p=e.pathCacheByNodeId,m=e.pathCacheVersion,h=u.valueById;for(;d.length>0&&s<t;){let t=d[d.length-1],u=t[0];if(t[1]>=u.childIds.length){d.pop();continue}let g=t[1],_=u.childIds[t[1]++],v=c[_],y=t[2]+1,b=t[3];o=Cr(o,y);let x,S=_;if(B(v))S=f?bn(e,_):_,x=S===_?`${b}${h[v.nameId]}/`:K(e,S);else{let e=p.get(_);x=e!=null&&e.version===m?e.path:`${b}${h[v.nameId]}`}r[s]=o[y],n[s]=x,i[s]=g,a[s]=u.childIds.length,o[y+1]=s,s+=1;let C=c[S];C!=null&&B(C)&&Rt(e,S,C)&&d.push([l.get(S),0,y,x])}s<t&&(n.length=s);let g=r.subarray(0,s),_=i.subarray(0,s),v=a.subarray(0,s),y=null;return{getParentIndex(e){return e<0||e>=s?-1:g[e]??-1},paths:n,posInSetByIndex:_,setSizeByIndex:v,get visibleIndexByPath(){if(y==null){y=new Map;for(let e=0;e<s;e+=1)y.set(n[e]??``,e)}return y}}}function Wr(e,t){let n=Array(t),r=0,{nodes:i,directories:a,segmentTable:o}=e.snapshot,s=[[a.get(e.snapshot.rootId),0,-1]],c=o.valueById,l=e.snapshot.options.flattenEmptyDirectories,u=e.pathCacheByNodeId,d=e.pathCacheVersion;for(;s.length>0&&r<t;){let t=s[s.length-1],o=t[0];if(t[1]>=o.childIds.length){s.pop();continue}let f=o.childIds[t[1]++],p=i[f],m=t[2]+1;if(!B(p)){let t=u.get(f);n[r++]={depth:m,flattenedSegments:void 0,hasChildren:!1,id:f,isExpanded:!1,isFlattened:!1,isLoading:!1,kind:`file`,loadState:void 0,name:c[p.nameId],path:t!=null&&t.version===d?t.path:K(e,f)};continue}let h=l?bn(e,f):f,g={headNodeId:f,terminalNodeId:h,visibleDepth:m};n[r++]=Gr(e,g);let _=i[h];_!=null&&B(_)&&Rt(e,h,_)&&s.push([a.get(h),0,m])}return r<t&&(n.length=r),n}function Gr(e,t){let n=J(e,t.terminalNodeId),r=B(n)?Kr(e,t):null,i=K(e,t.terminalNodeId),a=gt(e.snapshot.segmentTable,n.nameId),o=B(n)&&q(e,t.terminalNodeId).childIds.length>0,s=t.headNodeId!==t.terminalNodeId,c=e.instrumentation,l=s?c==null?xn(e,t.headNodeId).map(n=>{let r=J(e,n);return{isTerminal:n===t.terminalNodeId,name:gt(e.snapshot.segmentTable,r.nameId),nodeId:n,path:K(e,n)}}):W(c,`store.getVisibleSlice.flatten.collectSegments`,()=>xn(e,t.headNodeId).map(n=>{let r=J(e,n);return{isTerminal:n===t.terminalNodeId,name:gt(e.snapshot.segmentTable,r.nameId),nodeId:n,path:K(e,n)}})):void 0;return{depth:t.visibleDepth,flattenedSegments:l,hasChildren:o,id:t.terminalNodeId,isExpanded:B(n)&&Rt(e,t.terminalNodeId,n),isFlattened:s,isLoading:r===`loading`,kind:B(n)?`directory`:`file`,loadState:r==null||r===`loaded`?void 0:r,name:a,path:i}}function Kr(e,t){if(t.headNodeId===t.terminalNodeId)return Vt(e,t.terminalNodeId);let n=xn(e,t.headNodeId),r=!1,i=!1;for(let t of n){let n=Vt(e,t);if(n===`loading`)return`loading`;if(n===`error`){i=!0;continue}n===`unloaded`&&(r=!0)}return i?`error`:r?`unloaded`:`loaded`}function qr(e){let{directories:t,nodes:n,options:r,rootId:i,presortedDirectoryNodeIds:a}=e.snapshot,o=r.flattenEmptyDirectories===!0,s=e=>{let r=n[e];if(r==null||!B(r))return;let i=t.get(e);if(i==null)throw Error(`Unknown directory child index for node ${String(e)}`);let a=i.childIds,s=a.length,c=0,l=0;for(let e=0;e<s;e++){let t=a[e];if(t==null)continue;let r=n[t];c+=r.subtreeNodeCount,l+=r.visibleSubtreeCount}i.totalChildSubtreeNodeCount=c,i.totalChildVisibleSubtreeCount=l,s>=128&&Re(n,i),r.subtreeNodeCount=1+c;let u;if(o&&s===1){let e=n[a[0]];u=e!=null&&B(e)?l:1+l}else u=1+l;r.visibleSubtreeCount=u};if(a!=null)for(let e=a.length-1;e>=0;e--)s(a[e]);else for(let e=n.length-1;e>=1;e--)s(e);let c=n[i],l=t.get(i);if(c==null||l==null)return;let u=l.childIds,d=0,f=0;for(let e=0;e<u.length;e++){let t=u[e];if(t==null)continue;let r=n[t];d+=r.subtreeNodeCount,f+=r.visibleSubtreeCount}l.totalChildSubtreeNodeCount=d,l.totalChildVisibleSubtreeCount=f,Re(n,l),c.subtreeNodeCount=1+d,c.visibleSubtreeCount=f}function Jr(e){return e.initialExpansion===`open`&&(e.initialExpandedPaths==null||e.initialExpandedPaths.length===0)}var Yr=class e{#e;constructor(e={}){let t=Xe(e),n=W(t,`store.builder.create`,()=>new Nt(e));if(e.preparedInput!=null){let t=At(e.preparedInput);t==null?n.appendPreparedPaths(kt(e.preparedInput),!1):n.appendPresortedPaths(t,jt(e.preparedInput))}else{let r=e.paths??[];e.presorted===!0?n.appendPaths(r):n.appendPreparedPaths(W(t,`store.preparePathEntries`,()=>Mt(r,e)))}let r=W(t,`store.builder.finish`,()=>n.finish({skipSubtreeCountPass:!0})),i=W(t,`store.state.detectAllDirectoriesExpanded`,()=>(e.initialExpansion??`closed`)===`closed`&&n.didMatchAllInitialExpandedPaths());this.#e=W(t,`store.state.create`,()=>Pt(r,i?`open`:e.initialExpansion??`closed`,t)),i&&(this.#e.collapseNewDirectoriesByDefault=!0);let a=i?this.#e.snapshot.directories.size-1:W(t,`store.state.initializeExpandedPaths`,()=>this.initializeExpandedPaths(e.initialExpandedPaths));i||Jr(e)||(e.initialExpansion??`closed`)===`closed`&&a===this.#e.snapshot.directories.size-1||(e.initialExpandedPaths?.length??0)>0&&W(t,`store.state.checkAllDirectoriesExpanded`,()=>this.hasAllDirectoriesExpanded())?W(t,`store.state.initializeOpenVisibleCounts`,()=>qr(this.#e)):W(t,`store.state.recomputeCounts`,()=>kn(this.#e,this.#e.snapshot.rootId))}static preparePaths(e,t={}){return Et(e,t)}static prepareInput(e,t={}){return Dt(e,t)}static preparePresortedInput(e){return Ot(e)}list(e){return W(this.#e.instrumentation,`store.list`,()=>Sn(this.#e,e))}add(e){W(this.#e.instrumentation,`store.add`,()=>{let t=wr(this.#e);ln(this.#e,sn(this.#e,t,Cn(this.#e,e)))})}remove(e,t={}){W(this.#e.instrumentation,`store.remove`,()=>{let n=wr(this.#e);ln(this.#e,sn(this.#e,n,wn(this.#e,e,t)))})}move(e,t,n={}){W(this.#e.instrumentation,`store.move`,()=>{let r=wr(this.#e),i=Tn(this.#e,e,t,n);i!=null&&ln(this.#e,sn(this.#e,r,i))})}batch(e){cn(this.#e,()=>{if(typeof e==`function`){e(this);return}for(let t of e)switch(t.type){case`add`:this.add(t.path);break;case`remove`:this.remove(t.path,{recursive:t.recursive});break;case`move`:this.move(t.from,t.to,{collision:t.collision});break}})}getVisibleCount(){return W(this.#e.instrumentation,`store.getVisibleCount`,()=>wr(this.#e))}getVisibleSlice(e,t){return W(this.#e.instrumentation,`store.getVisibleSlice`,()=>Ar(this.#e,e,t))}getVisibleRowContext(e){return W(this.#e.instrumentation,`store.getVisibleRowContext`,()=>kr(this.#e,e))}getVisibleTreeProjection(){return Mr(this.#e)}getVisibleTreeProjectionData(e){return jr(this.#e,e)}getVisibleIndex(e){return W(this.#e.instrumentation,`store.getVisibleIndex`,()=>Nr(this.#e,e))}getPathInfo(e){return W(this.#e.instrumentation,`store.getPathInfo`,()=>{let t=jn(this.#e,e);if(t==null)return null;let n=J(this.#e,t);return{depth:Ge(n),kind:B(n)?`directory`:`file`,path:K(this.#e,t)}})}isExpanded(e){return W(this.#e.instrumentation,`store.isExpanded`,()=>{let t=this.requireDirectoryNodeId(e),n=J(this.#e,t);return Rt(this.#e,t,n)})}expand(e){W(this.#e.instrumentation,`store.expand`,()=>{let t=wr(this.#e),n=Pr(this.#e,e);n!=null&&ln(this.#e,sn(this.#e,t,n))})}collapse(e){W(this.#e.instrumentation,`store.collapse`,()=>{let t=wr(this.#e),n=Fr(this.#e,e);n!=null&&ln(this.#e,sn(this.#e,t,n))})}on(e,t){return Jt(this.#e,e,t)}getDirectoryLoadState(e){let t=this.requireDirectoryNodeId(e);return Vt(this.#e,t)}markDirectoryUnloaded(e){W(this.#e.instrumentation,`store.markDirectoryUnloaded`,()=>{let t=this.requireDirectoryNodeId(e);if(q(this.#e,t).childIds.length>0)throw Error(`Cannot mark a directory with known children as unloaded: "${e}"`);let n=wr(this.#e);Ut(this.#e,t),ln(this.#e,sn(this.#e,n,en({affectedAncestorIds:An(this.#e,t),affectedNodeIds:[t],path:e,projectionChanged:this.isDirectoryProjectionVisible(t)})))})}beginChildLoad(e){return W(this.#e.instrumentation,`store.beginChildLoad`,()=>{let t=this.requireDirectoryNodeId(e),n=wr(this.#e),r=Ht(this.#e,t);return ln(this.#e,sn(this.#e,n,tn({affectedAncestorIds:An(this.#e,t),affectedNodeIds:[t],attemptId:r.attemptId,path:e,projectionChanged:this.isDirectoryProjectionVisible(t),reused:r.reused}))),r})}applyChildPatch(e,t){return W(this.#e.instrumentation,`store.applyChildPatch`,()=>{let n=this.resolveActiveDirectoryNodeId(e.nodeId);if(n==null||Vt(this.#e,n)!==`loading`||!Gt(this.#e,n,e.attemptId))return!1;let r=K(this.#e,n);this.validateChildPatch(r,t);let i=wr(this.#e),a=[];for(let e of t.operations){Xr(r,e);let t=wr(this.#e);switch(e.type){case`add`:a.push(sn(this.#e,t,Cn(this.#e,e.path)));break;case`remove`:a.push(sn(this.#e,t,wn(this.#e,e.path,{recursive:e.recursive})));break;case`move`:{let n=Tn(this.#e,e.from,e.to,{collision:e.collision});n!=null&&a.push(sn(this.#e,t,n));break}}}let o=a.some(e=>e.projectionChanged)||this.isDirectoryProjectionVisible(n);return ln(this.#e,sn(this.#e,i,nn({affectedAncestorIds:An(this.#e,n),affectedNodeIds:[n],attemptId:e.attemptId,childEvents:a,path:K(this.#e,n),projectionChanged:o}))),!0})}completeChildLoad(e){return W(this.#e.instrumentation,`store.completeChildLoad`,()=>{let t=this.resolveActiveDirectoryNodeId(e.nodeId);if(t==null)return!1;let n=wr(this.#e),r=Wt(this.#e,t,e.attemptId);return ln(this.#e,sn(this.#e,n,rn({affectedAncestorIds:An(this.#e,t),affectedNodeIds:[t],attemptId:e.attemptId,path:K(this.#e,t),projectionChanged:this.isDirectoryProjectionVisible(t),stale:!r}))),r})}failChildLoad(e,t){return W(this.#e.instrumentation,`store.failChildLoad`,()=>{let n=this.resolveActiveDirectoryNodeId(e.nodeId);if(n==null)return!1;let r=wr(this.#e),i=Kt(this.#e,n,e.attemptId,t);return ln(this.#e,sn(this.#e,r,an({affectedAncestorIds:An(this.#e,n),affectedNodeIds:[n],attemptId:e.attemptId,errorMessage:t,path:K(this.#e,n),projectionChanged:this.isDirectoryProjectionVisible(n),stale:!i}))),i})}cleanup(e={}){return W(this.#e.instrumentation,`store.cleanup`,()=>{if(this.#e.transactionStack.length>0)throw Error(`Cleanup cannot run during an open batch or transaction.`);if(br(this.#e))throw Error(`Cleanup cannot run while directory loads are active.`);let t=wr(this.#e),n=xr(this.#e,e.mode??`stable`);return ln(this.#e,sn(this.#e,t,on({...n,affectedAncestorIds:[],affectedNodeIds:[],projectionChanged:n.idsPreserved===!1}))),n})}getNodeCount(){return this.#e.activeNodeCount}initializeExpandedPaths(e){if(e==null||e.length===0)return 0;let t=0,n=[],r=[],i=0,a=null,o=this.#e.snapshot.segmentTable,s=o.valueById,c=this.#e.snapshot.nodes,l=new Map;for(let u of e){a!=null&&u<a&&(a=null,i=0,n.length=0,r.length=0);let e=u.length>0&&u.charCodeAt(u.length-1)===47?u.length-1:u.length;if(e===0){a=u,i=e,n.length=0,r.length=0;continue}let d=0,f=0;if(a!=null){let t=Math.min(e,i),n=!0;for(let e=0;e<t;e+=1){let t=u.charCodeAt(e);if(t!==a.charCodeAt(e)){n=!1;break}t===47&&(d+=1,f=e+1)}n&&(t===i&&e>t&&u.charCodeAt(t)===47?(d+=1,f=t+1):t===e&&i>t&&a.charCodeAt(t)===47&&(d+=1,f=e+1)),d=Math.min(d,r.length)}let p=d===0?this.#e.snapshot.rootId:r[d-1]??this.#e.snapshot.rootId,m=d,h=!0,g=f;for(;g<=e;){let t=u.indexOf(`/`,g),i=t===-1||t>e?e:t,a=u.slice(g,i),f=q(this.#e,p).childIds,_=m===d?n[m]??0:0,v=_,y,b=l.get(a)??et(a);l.set(a,b);let x=(e,t)=>{for(v=e;v<t;v+=1){let e=f[v],t=c[e],n=s[t.nameId];if(n===a)return y=e,!0;let r=G(ct(o,t.nameId),b);if(r>0||r===0&&n>a)return!1}return!1};if(!x(_,f.length)&&_>0&&x(0,_),y===void 0){h=!1;break}if(!B(J(this.#e,y))){h=!1;break}if(n[m]=v,r[m]=y,p=y,m+=1,i===e)break;g=i+1}if(a=u,i=e,n.length=m,r.length=m,!h){a=null,i=0,n.length=0,r.length=0;continue}for(let e=d;e<m;e+=1){let n=r[e];if(n==null)continue;let i=J(this.#e,n);Rt(this.#e,n,i)||(zt(this.#e,n,!0,i),t+=1)}}return t}hasAllDirectoriesExpanded(){for(let e of this.#e.snapshot.directories.keys()){if(e===this.#e.snapshot.rootId)continue;let t=J(this.#e,e);if(!Rt(this.#e,e,t))return!1}return!0}requireDirectoryNodeId(e){let t=jn(this.#e,e);if(t==null)throw Error(`Path does not exist: "${e}"`);if(!B(J(this.#e,t)))throw Error(`Path is not a directory: "${e}"`);return t}resolveActiveDirectoryNodeId(e){try{if(!B(J(this.#e,e)))throw Error(`Node is not a directory: ${String(e)}`);return e}catch{return null}}isDirectoryProjectionVisible(e){let t=e;for(;t!==this.#e.snapshot.rootId;){let e=J(this.#e,t).parentId;if(e!==this.#e.snapshot.rootId){let n=J(this.#e,e),r=yn(this.#e,e);if(!Rt(this.#e,e,n)&&r!==t)return!1}t=e}return!0}validateChildPatch(t,n){new e({paths:this.list(t),presorted:!0,sort:this.#e.snapshot.options.sort}).batch(n.operations)}};function Xr(e,t){switch(t.type){case`add`:case`remove`:if(!t.path.startsWith(e)||t.path===e)throw Error(`Child patch operation must stay within ${e}: "${t.path}"`);break;case`move`:if(!t.from.startsWith(e)||!t.to.startsWith(e)||t.from===e||t.to===e)throw Error(`Child patch move must stay within ${e}: "${t.from}" -> "${t.to}"`);break}}var Zr=e=>e.startsWith(`f::`)?e.slice(3):e;function Qr(e){let t=e.lastIndexOf(`/`);return t<0?{parentPath:``,baseName:e}:{parentPath:e.slice(0,t),baseName:e.slice(t+1)}}function $r(e,t){return e===``?t:`${e}/${t}`}function ei({files:e,path:t,isFolder:n,nextBasename:r}){let i=Zr(t),a=r.trim();if(a.length===0)return{error:`Name cannot be empty.`};if(a.includes(`/`))return{error:`Name cannot include "/".`};let{parentPath:o,baseName:s}=Qr(i);if(a===s)return{nextFiles:e,sourcePath:i,destinationPath:i,isFolder:n};let c=$r(o,a),l=Array(e.length),u=new Set;if(!n){let t=`${c}/`,r=!1;for(let n=0;n<e.length;n++){let a=e[n];if(a!==i&&a.startsWith(t))return{error:`"${c}" already exists.`};let o=a===i?c:a;if(u.has(o))return{error:`"${c}" already exists.`};u.add(o),l[n]=o,a===i&&(r=!0)}return r?{nextFiles:l,sourcePath:i,destinationPath:c,isFolder:n}:{error:`Could not find the selected file to rename.`}}let d=`${i}/`,f=`${c}/`,p=0;for(let t=0;t<e.length;t++){let n=e[t],r=n===i||n.startsWith(d);if(!r&&(n===c||n.startsWith(f)))return{error:`"${c}" already exists.`};let a=r?`${c}${n.slice(i.length)}`:n;if(u.has(a))return{error:`"${c}" already exists.`};u.add(a),l[t]=a,r&&p++}return p===0?{error:`Could not find the selected folder to rename.`}:{nextFiles:l,sourcePath:i,destinationPath:c,isFolder:n}}function ti(e){return e.endsWith(`/`)}function ni(e){let t=e.endsWith(`/`)?e.slice(0,-1):e,n=t.lastIndexOf(`/`),r=n<0?t:t.slice(n+1);return e.endsWith(`/`)?`${r}/`:r}function ri(e){let t=[],n=new Set;for(let r of e)n.has(r)||(n.add(r),t.push(r));let r=new Set;for(let e of t.toSorted((e,t)=>e.length===t.length?e.localeCompare(t):e.length-t.length)){let t=(e.endsWith(`/`)?e.slice(0,-1):e).split(`/`),n=!1;for(let e=0;e<t.length-1;e+=1){let i=`${t.slice(0,e+1).join(`/`)}/`;if(r.has(i)){n=!0;break}}n||r.add(e)}return t.filter(e=>r.has(e))}function ii(e,t){return t.includes(e)?ri(t):[e]}function ai(e,t){return e===t?!0:e==null||t==null?!1:e.kind===t.kind&&e.directoryPath===t.directoryPath&&e.flattenedSegmentPath===t.flattenedSegmentPath&&e.hoveredPath===t.hoveredPath}function oi(e,t){return{draggedPaths:e,target:t}}function si(e,t){if(t.kind!==`directory`||t.directoryPath==null)return!1;for(let n of e)if(ti(n)&&(t.directoryPath===n||t.directoryPath.startsWith(n)))return!0;return!1}function ci(e,t){return t.kind===`root`||t.directoryPath==null?ni(e):t.directoryPath}function li(e,t){let n=e.map(e=>{let n=ci(e,t);return n===e?null:{from:e,to:n,type:`move`}}).filter(e=>e!=null);return n.length===0?null:{operations:n,result:{draggedPaths:e,operation:n.length===1?`move`:`batch`,target:t}}}var ui=Symbol(`FILE_TREE_RENAME_VIEW`);function di(e){return e.operation===`add`||e.operation===`remove`||e.operation===`move`||e.operation===`batch`}var fi=512,pi=512;function mi(e,t){if(e.size!==t.length)return!1;for(let n of t)if(!e.has(n))return!1;return!0}function hi(e){let t=e.endsWith(`/`)?e.slice(0,-1):e;if(t.length===0)return[];let n=t.split(`/`);return n.slice(0,-1).map((e,t)=>`${n.slice(0,t+1).join(`/`)}/`)}function gi(e){return hi(e).at(-1)??null}function _i(e,t){return t==null?e:e.startsWith(t)?e.slice(t.length):e}var vi=e=>{let t=e.trim();return t.length===0?``:(t.includes(`\\`)?t.replaceAll(`\\`,`/`):t).toLowerCase()},yi=e=>e.toLowerCase();function bi(e){return e.endsWith(`/`)}function xi(e){let t=e.endsWith(`/`)?e.slice(0,-1):e,n=t.lastIndexOf(`/`);return n<0?t:t.slice(n+1)}function Si(e){return e.endsWith(`/`)?e.slice(0,-1):e}function Ci(e,t){return t&&!e.endsWith(`/`)?`${e}/`:e}function wi(e,t,n){if(e===t)return n;let r=t.endsWith(`/`)?t:`${t}/`;return e.startsWith(r)?`${n.endsWith(`/`)?n:`${n}/`}${e.slice(r.length)}`:e}function Ti(e,t){if(e===t)return!0;let n=t.endsWith(`/`)?t:`${t}/`;return e.startsWith(n)}function Ei(e,t,n=!1){if(e==null)return null;switch(t.operation){case`add`:case`expand`:case`collapse`:case`mark-directory-unloaded`:case`begin-child-load`:case`apply-child-patch`:case`complete-child-load`:case`fail-child-load`:case`cleanup`:return e;case`remove`:return Ti(e,t.path)?n?e:null:e;case`move`:return wi(e,t.from,t.to);case`batch`:{let r=e;for(let e of t.events)if(r=Ei(r,e,n),r==null)return null;return r}}}function Di(e){return{canonicalChanged:e.canonicalChanged,projectionChanged:e.projectionChanged,visibleCountDelta:e.visibleCountDelta}}function Oi(e,t){if(e===t)return!0;if(e.length!==t.length)return!1;for(let n=0;n<e.length;n+=1)if(e[n]!==t[n])return!1;return!0}function ki(e,t,n){let{paths:r,preparedInput:i}=e;if(i==null){if(r==null)throw Error(`FileTree requires paths or preparedInput`);return{paths:r,preparedInput:void 0}}let a=i.paths;if(r==null)return{paths:a,preparedInput:i};if(!Oi(Yr.preparePaths(r,n==null?{}:{sort:n}),a))throw Error(`FileTree ${t} received paths and preparedInput for different path lists`);return{paths:a,preparedInput:i}}function Ai(e){switch(e.operation){case`add`:return{...Di(e),operation:`add`,path:e.path};case`remove`:return{...Di(e),operation:`remove`,path:e.path,recursive:e.recursive};case`move`:return{...Di(e),from:e.from,operation:`move`,to:e.to}}}function ji(e){return{...Di(e),events:e.events.filter(e=>e.operation===`add`||e.operation===`remove`||e.operation===`move`).map(e=>Ai(e)),operation:`batch`}}function Mi(e){switch(e.operation){case`add`:case`remove`:case`move`:return Ai(e);case`batch`:return ji(e);default:return null}}function Ni(e,t,n){if(e===0)return-1;if(n!=null){let e=t(n);if(e!=null)return e;let r=hi(n);for(let e=r.length-1;e>=0;--e){let n=r[e];if(n==null)continue;let i=t(n);if(i!=null)return i}}return 0}function Pi(e,t,n){if(e.paths.length===0)return{focusedIndex:-1,getParentIndex:e.getParentIndex,paths:e.paths,posInSetByIndex:e.posInSetByIndex,setSizeByIndex:e.setSizeByIndex};if(t==null)return{focusedIndex:0,getParentIndex:e.getParentIndex,paths:e.paths,posInSetByIndex:e.posInSetByIndex,setSizeByIndex:e.setSizeByIndex};let r=n??(t=>e.visibleIndexByPath.get(t)??null);return{focusedIndex:Ni(e.paths.length,r,t),getParentIndex:e.getParentIndex,paths:e.paths,posInSetByIndex:e.posInSetByIndex,setSizeByIndex:e.setSizeByIndex}}var Fi=class{#e;#t=new Set;#n=new Map;#r=null;#i=null;#a=new Map;#o=new Map;#s=-1;#c=null;#l=!1;#u=e=>-1;#d=new Map;#f=null;#p=null;#m=null;#h=null;#g=null;#_;#v;#y;#b=[];#x=new Int32Array;#S=new Int32Array;#C=void 0;#w=!1;#T=null;#E=``;#D=!1;#O=new Set;#k=[];#A;#j=null;#M=null;#N=null;#P=null;#F=null;#I=null;#L=null;#R=new Set;#z=0;#B;#V=0;#H=!1;#U=0;#W;constructor(e){let{dragAndDrop:t,fileTreeSearchMode:n,initialSearchQuery:r,initialSelectedPaths:i,renaming:a,onSearchChange:o,paths:s,preparedInput:c,...l}=e,u=ki({paths:s,preparedInput:c},`constructor`,l.sort);this.#e=l,t!=null&&t!==!1&&(this.#r=t===!0?{}:t),this.#w=a!=null&&a!==!1,a!=null&&a!==!1&&a!==!0&&(this.#C=a.canRename,this.#v=a.onError,this.#_=a.onRename),this.#y=o,this.#A=n??`hide-non-matches`,this.#B=this.#se(u.paths,u.preparedInput);let d=i?.map(e=>this.#Ae(e)).filter(e=>e!=null)??[],f=d.at(-1)??null;d.length>0&&(this.#R=new Set(d),this.#L=f,this.#z=1),this.#Oe(f,!1),r!=null&&this.#Se(r,!1),this.#W=this.#Fe()}destroy(){this.#W?.(),this.#W=null,this.#n.clear(),this.#t.clear(),this.#d.clear(),this.#i=null,this.#pe()}focusFirstItem(){this.#ve().length>0&&this.#Me(0)}focusLastItem(){this.#U<=0||(this.#Ne(),this.#Me(this.#U-1))}focusNextItem(){this.#De(1)}focusParentItem(){if(this.#c==null)return;let e=gi(this.#c);if(e==null)return;let t=this.#Y(e);t>=0&&this.#Me(t)}focusPath(e){let t=this.#B.getPathInfo(e)?.path??null;if(t==null)return;this.#Ne();let n=this.#Y(t);n>=0&&this.#Me(n)}focusNearestPath(e){let t=this.resolveNearestVisiblePath(e);if(t==null)return null;let n=this.#Y(t);return n>=0?(this.#Me(n),this.#ve()[n]??t):null}focusPreviousItem(){this.#De(-1)}getFocusedIndex(){return this.#s}getFocusedItem(){return this.#c==null?null:this.#X(this.#c)}getFocusedPath(){return this.#c}resolveNearestVisiblePath(e){let t=this.#ve();if(this.#U===0)return null;if(e==null)return this.#c??t[0]??null;let n=this.#B.getPathInfo(e)?.path??e,r=this.#Y(n);return r>=0?t[r]??n:this.#J(n)??this.#c??t[0]??null}getSelectedPaths(){return[...this.#R]}getSelectionVersion(){return this.#z}getVisibleCount(){return this.#U}getVisibleRows(e,t){if(t<e||this.#U===0)return[];let n=Math.max(0,e),r=Math.min(this.#U-1,t);if(r<n)return[];let i=r-n+1;if(this.#F==null&&!this.#l&&r>=this.#b.length&&i<=pi){let e=[];for(let t=n;t<=r;t+=1){let n=this.#B.getVisibleRowContext(t);if(n==null)break;e.push(this.#Q(n))}return e}if(!this.#l&&r>=this.#b.length&&this.#Ne(),this.#F!=null){let e=Array.from({length:r-n+1},(e,t)=>this.#ye(n+t)),t=new Map,i=e[0]??-1,a=i;for(let n=1;n<=e.length;n+=1){let r=e[n];if(r!=null&&r===a+1){a=r;continue}if(i>=0&&this.#B.getVisibleSlice(i,a).forEach((e,n)=>{t.set(i+n,e)}),r==null){i=-1,a=-1;continue}i=r,a=r}return Array.from({length:r-n+1},(e,r)=>{let i=n+r,a=this.#ye(i),o=t.get(a),s=this.#b[a];if(o==null||s==null)throw Error(`Missing projection row for filtered visible index ${String(i)}`);return this.#Z(o,i,a,{ancestorPaths:this.#te(a),path:s})})}return this.#B.getVisibleSlice(n,r).map((e,t)=>{let r=n+t,i=this.#b[r];if(i==null)throw Error(`Missing projection path for visible index ${String(r)}`);return this.#Z(e,r,r,{ancestorPaths:this.#te(r),path:i})})}getStickyRowCandidates(e,t){if(this.#F!=null)return null;if(this.#U===0||e<=0||t<=0)return[];let n=[];for(let r=0;r<this.#U;r+=1){let i=e+r*t,a=Math.min(this.#U-1,Math.floor(i/t)),o=this.#$(a,r)??(a>0?this.#$(a-1,r):void 0);if(o==null)break;n.push({row:this.#Q(o),subtreeEndIndex:o.subtreeEndIndex})}return n}getItem(e){let t=this.#B.getPathInfo(e);return t==null?null:this.#X(t.path,t)}selectAllVisiblePaths(){this.#Ne();let e=[...this.#ve()];this.#re(e,this.#c??this.#L)}selectOnlyPath(e){let t=this.#Ae(e);t!=null&&this.#re([t],t)}selectPath(e){let t=this.#Ae(e);t==null||this.#R.has(t)||this.#re([...this.#R,t])}deselectPath(e){let t=this.#Ae(e);t==null||!this.#R.has(t)||this.#re([...this.#R].filter(e=>e!==t))}toggleFocusedSelection(){this.#c!=null&&this.togglePathSelectionFromInput(this.#c)}togglePathSelection(e){let t=this.#Ae(e);if(t!=null){if(this.#R.has(t)){this.deselectPath(t);return}this.selectPath(t)}}togglePathSelectionFromInput(e){let t=this.#Ae(e);if(t!=null){if(this.#R.has(t)){this.#re([...this.#R].filter(e=>e!==t),t);return}this.#re([...this.#R,t],t)}}selectPathRange(e,t){let n=this.#Ae(e);if(n==null)return;this.#Ne();let r=this.#L,i=r==null?-1:this.#be(r),a=this.#be(n);if(i===-1||a===-1){let e=t?[...this.#R,n]:[n];this.#re(e,n);return}let[o,s]=i<=a?[i,a]:[a,i],c=this.#ve().slice(o,s+1),l=t?[...this.#R,...c]:c;this.#re(l,r)}extendSelectionFromFocused(e){if(this.#c==null)return;let t=this.#s;if(t===-1)return;let n=Math.min(this.#U-1,Math.max(0,t+e));if(n===t)return;!this.#l&&n>=this.#b.length&&this.#Ne();let r=this.#ve(),i=r[t]??null,a=r[n]??null;if(i==null||a==null)return;let o=new Set(this.#R);o.has(i)&&o.has(a)?o.delete(i):o.add(a),this.#re([...o],this.#L??i,!1),this.#Me(n)}getDragAndDropConfig(){return this.#r}isDragAndDropEnabled(){return this.#r!=null}getDragSession(){return this.#i==null?null:{draggedPaths:[...this.#i.draggedPaths],primaryPath:this.#i.primaryPath,target:this.#i.target==null?null:{...this.#i.target}}}startDrag(e){if(this.#r==null)return!1;let t=this.#Ae(e);if(t==null||this.#M!=null&&this.#M.length>0)return!1;let n=this.getSelectedPaths(),r=ii(t,n);return this.#r.canDrag?.(r)===!1?!1:(n.includes(t)||this.#re([t],t,!1),this.#je(t),this.#i={draggedPaths:r,primaryPath:t,target:null},this.#we(),!0)}setDragTarget(e){let t=this.#i;if(t==null)return;let n=e;if(n!=null){let e=oi(t.draggedPaths,n);(si(t.draggedPaths,n)||this.#r?.canDrop?.(e)===!1)&&(n=null)}ai(t.target,n)||(this.#i={...t,target:n},this.#we())}cancelDrag(){this.#i!=null&&(this.#i=null,this.#we())}completeDrag(){let e=this.#i;if(e==null)return!1;this.#i=null;let t=e.target==null?null:{...e.target};if(t==null)return this.#we(),!1;let n=oi(e.draggedPaths,t);if(si(e.draggedPaths,t)||this.#r?.canDrop?.(n)===!1)return this.#we(),!1;let r=li(e.draggedPaths,t);if(r==null)return this.#we(),!1;try{if(r.operations.length===1){let e=r.operations[0];if(e==null||e.type!==`move`)throw Error(`Expected a single move operation for one-item drops`);this.#B.move(e.from,e.to,{collision:e.collision})}else this.#oe(r.operations),this.#B.batch(r.operations)}catch(e){return this.#we(),this.#r?.onDropError?.(e instanceof Error?e.message:String(e),n),!1}return this.#r?.onDropComplete?.(r.result),!0}subscribe(e){return this.#t.add(e),e(),()=>{this.#t.delete(e)}}add(e){this.#B.add(e)}remove(e,t={}){this.#B.remove(e,t)}move(e,t,n={}){this.#B.move(e,t,n)}batch(e){this.#B.batch(e)}onMutation(e,t){let n=e,r=t,i=this.#n.get(n);return i??(i=new Set,this.#n.set(n,i)),i.add(r),()=>{let e=this.#n.get(n);e?.delete(r),e?.size===0&&this.#n.delete(n)}}setSearch(e){this.#Se(e,!0)}openSearch(e=``){this.#Se(e,!0)}closeSearch(){this.#Se(null,!0)}isSearchOpen(){return this.#M!==null}getSearchValue(){return this.#M??``}getSearchMatchingPaths(){return this.#k}focusNextSearchMatch(){this.#xe(1)}focusPreviousSearchMatch(){this.#xe(-1)}startRenaming(e=this.#c??``,t={}){if(!this.#w)return!1;let n=this.#B.getPathInfo(e);if(n==null)return!1;let r=n.path,i=bi(r),a=Si(r);if(this.#C?.({isFolder:i,path:a})===!1)return!1;for(let e of hi(r))this.#B.isExpanded(e)||this.#B.expand(e);return this.#re([r],r,!1),this.#M!=null&&(this.#Se(null,!1),this.#y?.(this.#M)),this.#je(r),this.#T=r,this.#E=xi(r),this.#D=t.removeIfCanceled??!1,this.#we(),!0}[ui](){return{cancel:()=>{this.#G()},commit:()=>{this.#K()},getPath:()=>this.#T,getValue:()=>this.#E,isActive:()=>this.#T!=null,setValue:e=>{this.#q(e)}}}#G(){if(this.#T==null)return;let e=this.#T,t=this.#D;if(this.#T=null,this.#E=``,this.#D=!1,t){this.remove(e,bi(e)?{recursive:!0}:void 0);return}this.#je(e),this.#we()}#K(){let e=this.#T;if(e==null)return;if(this.#D&&this.#E.trim().length===0){this.#T=null,this.#E=``,this.#D=!1,this.remove(e,bi(e)?{recursive:!0}:void 0);return}let t=bi(e),n=ei({files:this.#B.list(),isFolder:t,nextBasename:this.#E,path:Si(e)});if(this.#T=null,this.#E=``,this.#D=!1,`error`in n){this.#je(e),this.#v?.(n.error),this.#we();return}if(n.sourcePath===n.destinationPath){this.#je(e),this.#we();return}this.#_?.({destinationPath:n.destinationPath,isFolder:n.isFolder,sourcePath:n.sourcePath}),this.move(Ci(n.sourcePath,t),Ci(n.destinationPath,t))}#q(e){this.#T==null||this.#E===e||(this.#E=e,this.#we())}resetPaths(e,t={}){let n=this.#B.list().length,r=this.#U,i=ki({paths:e,preparedInput:t.preparedInput},`resetPaths`,this.#e.sort),a=this.#se(i.paths,i.preparedInput,t.initialExpandedPaths),o=this.#c,s=this.#T,c=this.getSelectedPaths(),l=this.#L;this.#W?.(),this.#B=a,this.#d.clear(),this.#pe();let u=c.map(e=>a.getPathInfo(e)?.path??null).filter(e=>e!=null),d=!mi(this.#R,u);this.#R=new Set(u),d&&(this.#z+=1),this.#L=l==null?null:a.getPathInfo(l)?.path??null,this.#T=s==null?null:a.getPathInfo(s)?.path??null,this.#T??(this.#E=``,this.#D=!1),this.#Oe(o,o!=null||u.length>0||this.#L!=null),this.#W=this.#Fe(),this.#we(),this.#Te({canonicalChanged:!0,operation:`reset`,pathCountAfter:i.paths.length,pathCountBefore:n,projectionChanged:!0,usedPreparedInput:t.preparedInput!=null,visibleCountDelta:this.#U-r})}#J(e){this.#Ne();let t=gi(e),n=_i(e,t),r=null,i=null;for(let e of this.#ve()){if(gi(e)!==t)continue;let a=_i(e,t);if(a<n){r=e;continue}if(a>n){i=e;break}}return r??i}#Y(e){let t=this.#be(e);if(t!==-1)return t;let n=hi(e);for(let e=n.length-1;e>=0;--e){let t=n[e];if(t==null)continue;let r=this.#be(t);if(r!==-1)return r}return this.#ve().length>0?0:-1}#X(e,t){let n=this.#d.get(e);if(n!=null)return n;let r=t??this.#B.getPathInfo(e);if(r==null)return null;let i=r.kind===`directory`?this.#ie(r.path):this.#ae(r.path);return this.#d.set(r.path,i),i}#Z(e,t,n,r){return{ancestorPaths:r.ancestorPaths,depth:e.depth,flattenedSegments:e.flattenedSegments?.map(e=>({isTerminal:e.isTerminal,name:e.name,path:e.path})),hasChildren:e.hasChildren,index:t,isExpanded:e.isExpanded,isFlattened:e.isFlattened,isFocused:r.path===this.#c,isSelected:this.#R.has(r.path),kind:e.kind,level:e.depth,name:e.name,path:r.path,posInSet:r.posInSet??this.#x[n]??0,setSize:r.setSize??this.#S[n]??0}}#Q(e){return this.#Z(e.row,e.index,e.index,{ancestorPaths:e.ancestorPaths,path:e.row.path,posInSet:e.posInSet,setSize:e.setSize})}#$(e,t){let n=this.#B.getVisibleRowContext(e);return n==null?void 0:n.ancestorRows[t]??(t===n.ancestorRows.length&&n.row.kind===`directory`&&n.row.isExpanded?n:void 0)}#ee(e){let t=this.#a.get(e);if(t!=null)return t;let n=this.#u(e),r=n<0?[]:[...this.#ee(n),n];return this.#a.set(e,r),r}#te(e){let t=this.#o.get(e);if(t!=null)return t;let n=this.#ee(e).map(e=>this.#b[e]??``).filter(e=>e!==``);return this.#o.set(e,n),n}#ne(e){this.#B.collapse(e)}#re(e,t=this.#L,n=!0){let r=[...new Set(e)],i=!mi(this.#R,r),a=this.#L!==t;!i&&!a||(this.#R=new Set(r),this.#L=t,i&&(this.#z+=1),n&&this.#we())}#ie(e){return{collapse:()=>{this.#ne(e)},deselect:()=>{this.deselectPath(e)},expand:()=>{this.#Ee(e)},focus:()=>{this.focusPath(e)},getPath:()=>e,isDirectory:()=>!0,isExpanded:()=>this.#B.isExpanded(e),isFocused:()=>this.#c===e,isSelected:()=>this.#R.has(e),select:()=>{this.selectPath(e)},toggleSelect:()=>{this.togglePathSelection(e)},toggle:()=>{this.#Ie(e)}}}#ae(e){return{deselect:()=>{this.deselectPath(e)},focus:()=>{this.focusPath(e)},getPath:()=>e,isDirectory:()=>!1,isFocused:()=>this.#c===e,isSelected:()=>this.#R.has(e),select:()=>{this.selectPath(e)},toggleSelect:()=>{this.togglePathSelection(e)}}}#oe(e){let t=this.#B.list();this.#se(t).batch(e)}#se(e,t,n){return new Yr({...this.#e,paths:e,preparedInput:t??void 0,...n===void 0?{}:{initialExpandedPaths:n}})}#ce(){return this.#h??=this.#B.list(),this.#h}#le(){if(this.#m!=null)return this.#m;let e=new Set;for(let t of this.#ce()){e.add(t);for(let n of hi(t))e.add(n)}return this.#m=[...e].sort(),this.#m}#ue(){return this.#g??=this.#ce().map(yi),this.#g}#de(){return this.#f??=this.#le().filter(e=>e.endsWith(`/`)),this.#f}#fe(){return this.#p??=this.#de().map(yi),this.#p}#pe(){this.#f=null,this.#p=null,this.#m=null,this.#h=null,this.#g=null}#me(){return this.#de().filter(e=>this.#B.isExpanded(e))}#he(e){let t=new Set(this.#j??[]);if(e)for(let e of this.#R)for(let n of hi(e))t.add(n);this.#ge(t)}#ge(e){this.#H=!0;try{for(let t of this.#de()){let n=e.has(t),r=this.#B.isExpanded(t);n&&!r?this.#B.expand(t):!n&&r&&this.#B.collapse(t)}}finally{this.#H=!1}}#_e(){let e=this.#b;if(this.#k=e.filter(e=>this.#O.has(e)),this.#M==null||this.#M.length===0||this.#A!==`hide-non-matches`||this.#O.size===0){this.#F=null,this.#I=null,this.#P=null,this.#U=this.#V;return}let t=[],n=[],r=new Map;for(let[i,a]of e.entries())this.#N?.has(a)===!0&&(r.set(a,n.length),t.push(i),n.push(a));this.#F=t,this.#I=n,this.#P=r,this.#U=n.length}#ve(){return this.#I??this.#b}#ye(e){return this.#F?.[e]??e}#be(e){return this.#P?.get(e)??this.#B.getVisibleIndex(e)??-1}#xe(e){let t=this.#k;if(t.length===0)return;let n=this.#c,r=n==null?-1:t.indexOf(n),i=t[r<0?e>0?0:t.length-1:Math.min(t.length-1,Math.max(0,r+e))];i!=null&&this.focusPath(i)}#Se(e,t){let n=e==null?null:vi(e),r=this.#M;if(r!==n){if(r==null&&n!=null&&(this.#j=this.#me()),this.#M=n,n==null)this.#he(!0),this.#j=null,this.#O.clear(),this.#N=null,this.#Oe(this.#c,!0);else if(n.length===0)this.#he(!1),this.#O.clear(),this.#N=null,this.#Oe(this.#c,!0);else{let e=this.#Ce();this.#Oe(e,!0)}t&&(this.#y?.(this.#M),this.#we())}}#Ce(){if(this.#M==null||this.#M.length===0)return this.#O.clear(),this.#c;let e=this.#M,t=this.#ce(),n=this.#ue(),r=[],i=new Set,a=null;for(let o=0;o<t.length;o+=1){if(!n[o].includes(e))continue;let s=t[o];r.push(s),i.add(s),a??=s}let o=this.#de(),s=this.#fe();for(let t=0;t<o.length;t+=1){if(!s[t].includes(e))continue;let n=o[t];i.has(n)||(r.push(n),i.add(n),a??=n)}this.#O=i;let c=this.#A===`hide-non-matches`&&r.length>0?new Set:null;this.#N=c;let l=this.#A===`expand-matches`?new Set(this.#j??[]):new Set;for(let e of r){c?.add(e),e.endsWith(`/`)&&l.add(e);for(let t of hi(e))l.add(t),c?.add(t)}return this.#ge(l),a??this.#c}#we(){for(let e of this.#t)e()}#Te(e){this.#n.get(e.operation)?.forEach(t=>{t(e)}),this.#n.get(`*`)?.forEach(t=>{t(e)})}#Ee(e){for(let t of hi(e))this.#B.isExpanded(t)||this.#B.expand(t);this.#B.isExpanded(e)||this.#B.expand(e)}#De(e){let t=this.#U;if(t===0)return;let n=this.#s===-1?0:this.#s,r=Math.min(t-1,Math.max(0,n+e));(r!==n||this.#s===-1)&&(!this.#l&&this.#F==null&&r>=this.#b.length&&this.#Ne(),this.#Me(r))}#Oe(e,t=!0){let n=this.#B.getVisibleCount();this.#V=n;let r=Pi(this.#B.getVisibleTreeProjectionData(t?void 0:Math.min(n,fi)),e,t?e=>this.#B.getVisibleIndex(e):void 0);this.#a.clear(),this.#o.clear(),this.#l=r.paths.length>=n,this.#u=r.getParentIndex,this.#b=r.paths,this.#x=r.posInSetByIndex,this.#S=r.setSizeByIndex,this.#_e(),this.#s=e==null?this.#ve().length>0?0:-1:this.#Y(e),this.#c=this.#s<0?null:this.#ke(this.#s)}#ke(e){return this.#ve()[e]??(this.#F==null?this.#B.getVisibleRowContext(e)?.row.path??null:null)}#Ae(e){return this.#B.getPathInfo(e)?.path??null}#je(e){if(e==null)return;let t=this.#Y(e);t>=0&&this.#Me(t,!1)}#Me(e,t=!0){let n=this.#ke(e);n!=null&&(this.#s===e&&this.#c===n||(this.#s=e,this.#c=n,t&&this.#we()))}#Ne(){this.#l||this.#Oe(this.#c,!0)}#Pe(e){let t=Ei(this.#T,e);t==null&&this.#T!=null&&(this.#E=``),this.#T=t;let n=Ei(this.#c,e,!0),r=[...this.#R].map(t=>Ei(t,e)).filter(e=>e!=null).map(e=>this.#B.getPathInfo(e)?.path??null).filter(e=>e!=null),i=Ei(this.#L,e),a=i==null?null:this.#B.getPathInfo(i)?.path??null,o=[...new Set(r)];return mi(this.#R,o)||(this.#R=new Set(o),this.#z+=1),this.#L=a,n}#Fe(){return this.#B.on(`*`,e=>{if(this.#H)return;e.canonicalChanged&&(this.#d.clear(),this.#pe()),this.#i!=null&&di(e)&&(this.#i=null);let t=di(e)?this.#Pe(e):this.#c,n=this.#M!=null&&this.#M.length>0?this.#Ce():this.#M===``?this.#c:t,r=this.#M!=null||e.operation!==`expand`&&e.operation!==`collapse`;this.#Oe(n,r),this.#we();let i=Mi(e);i!=null&&this.#Te(i)})}#Ie(e){if(this.#B.isExpanded(e)){this.#ne(e);return}this.#Ee(e)}},Ii=e=>{if(e==null||e.length===0)return`0`;let t=`${e.length}`;for(let n of e)t+=`\0${n.path}\0${n.status}`;return t};function Li(e){let t=e.endsWith(`/`),n=``,r=-1;for(let t=0;t<=e.length;t+=1){if(!(e[t]===`/`||t===e.length)){r===-1&&(r=t);continue}r!==-1&&(n!==``&&(n+=`/`),n+=e.slice(r,t),r=-1)}return n===``?null:{isDirectory:t,path:n}}function Ri(e){let t=e.endsWith(`/`)?e.slice(0,-1):e;if(t.length===0)return[];let n=t.split(`/`);return n.slice(0,-1).map((e,t)=>`${n.slice(0,t+1).join(`/`)}/`)}function zi(e,t){return t?`${e}/`:e}function Bi(e,t=null){let n=Ii(e==null?void 0:[...e]);if(n===`0`)return null;if(t?.signature===n)return t;let r=new Map,i=new Set,a=new Set;for(let t of e??[]){let e=Li(t.path);if(e==null)continue;let n=zi(e.path,e.isDirectory);r.set(n,t.status),t.status===`ignored`&&e.isDirectory?a.add(n):e.isDirectory&&a.delete(n);for(let t of Ri(e.path))i.add(t)}return{directoriesWithChanges:i,ignoredDirectoryPaths:a,signature:n,statusByPath:r}}var Y,Vi,Hi,Ui,Wi,Gi,Ki,qi,Ji,Yi,Xi={},Zi=[],Qi=Array.isArray,$i=Zi.slice,ea=Object.assign;function ta(e){e&&e.parentNode&&e.remove()}function na(e,t,n){var r,i,a,o={};for(a in t)a==`key`?r=t[a]:a==`ref`&&typeof e!=`function`?i=t[a]:o[a]=t[a];return arguments.length>2&&(o.children=arguments.length>3?$i.call(arguments,2):n),ra(e,o,r,i,null)}function ra(e,t,n,r,i){var a={type:e,props:t,key:n,ref:r,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++Vi,__i:-1,__u:0};return i==null&&Y.vnode!=null&&Y.vnode(a),a}function ia(e){return e.children}function aa(e,t){this.props=e,this.context=t,this.__g=0}function oa(e,t){if(t==null)return e.__?oa(e.__,e.__i+1):null;for(var n;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null)return n.__e;return typeof e.type==`function`?oa(e):null}function sa(e){var t,n;if((e=e.__)!=null&&e.__c!=null){for(e.__e=null,t=0;t<e.__k.length;t++)if((n=e.__k[t])!=null&&n.__e!=null){e.__e=n.__e;break}return sa(e)}}function ca(e){(8&e.__g||!(e.__g|=8)||!Hi.push(e)||Wi++)&&Ui==Y.debounceRendering||((Ui=Y.debounceRendering)||queueMicrotask)(la)}function la(){for(var e,t,n,r,i,a,o,s,c=1;Hi.length;)Hi.length>c&&Hi.sort(Gi),e=Hi.shift(),c=Hi.length,8&e.__g&&(n=void 0,i=(r=(t=e).__v).__e,a=[],o=[],(s=t.__P)&&((n=ea({},r)).__v=r.__v+1,Y.vnode&&Y.vnode(n),_a(s,n,r,t.__n,s.namespaceURI,32&r.__u?[i]:null,a,i??oa(r),!!(32&r.__u),o,s.ownerDocument),n.__v=r.__v,n.__.__k[n.__i]=n,ya(a,n,o),n.__e!=i&&sa(n)));Wi=0}function ua(e,t,n,r,i,a,o,s,c,l,u,d){var f,p,m,h,g,_,v,y=r&&r.__k||Zi,b=t.length;for(c=da(n,t,y,c,b),f=0;f<b;f++)(m=n.__k[f])!=null&&(p=m.__i==-1?Xi:y[m.__i]||Xi,m.__i=f,_=_a(e,m,p,i,a,o,s,c,l,u,d),h=m.__e,m.ref&&p.ref!=m.ref&&(p.ref&&Sa(p.ref,null,m),u.push(m.ref,m.__c||h,m)),g==null&&h!=null&&(g=h),(v=!!(4&m.__u))||p.__k===m.__k?c=fa(m,c,e,v):typeof m.type==`function`&&_!==void 0?c=_:h&&(c=h.nextSibling),m.__u&=-7);return n.__e=g,c}function da(e,t,n,r,i){var a,o,s,c,l,u=n.length,d=u,f=0;for(e.__k=Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!=`boolean`&&typeof o!=`function`?(c=a+f,(o=e.__k[a]=typeof o==`string`||typeof o==`number`||typeof o==`bigint`||o.constructor==String?ra(null,o,null,null,null):Qi(o)?ra(ia,{children:o},null,null,null):o.constructor==null&&o.__b>0?ra(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):o).__=e,o.__b=e.__b+1,s=null,(l=o.__i=pa(o,n,c,d))!=-1&&(d--,(s=n[l])&&(s.__u|=2)),s==null||s.__v==null?(l==-1&&(i>u?f--:i<u&&f++),typeof o.type!=`function`&&(o.__u|=4)):l!=c&&(l==c-1?f--:l==c+1?f++:(l>c?f--:f++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<u;a++)(s=n[a])!=null&&!(2&s.__u)&&(s.__e==r&&(r=oa(s)),Ca(s,s));return r}function fa(e,t,n,r){var i,a;if(typeof e.type==`function`){for(i=e.__k,a=0;i&&a<i.length;a++)i[a]&&(i[a].__=e,t=fa(i[a],t,n,r));return t}e.__e!=t&&(r&&(t&&e.type&&!t.parentNode&&(t=oa(e)),n.insertBefore(e.__e,t||null)),t=e.__e);do t&&=t.nextSibling;while(t!=null&&t.nodeType==8);return t}function pa(e,t,n,r){var i,a,o,s=e.key,c=e.type,l=t[n],u=l!=null&&(2&l.__u)==0;if(l===null&&e.key==null||u&&s==l.key&&c==l.type)return n;if(r>(u?1:0)){for(i=n-1,a=n+1;i>=0||a<t.length;)if((l=t[o=i>=0?i--:a++])!=null&&!(2&l.__u)&&s==l.key&&c==l.type)return o}return-1}function ma(e,t,n){t[0]==`-`?e.setProperty(t,n??``):e[t]=n??``}function ha(e,t,n,r,i){var a;n:if(t==`style`)if(typeof n==`string`)e.style.cssText=n;else{if(typeof r==`string`&&(e.style.cssText=r=``),r)for(t in r)n&&t in n||ma(e.style,t,``);if(n)for(t in n)r&&n[t]==r[t]||ma(e.style,t,n[t])}else if(t[0]==`o`&&t[1]==`n`)a=t!=(t=t.replace(Ki,`$1`)),(t=t.slice(2))[0].toLowerCase()!=t[0]&&(t=t.toLowerCase()),e.__l||={},e.__l[t+a]=n,n?r?n.l=r.l:(n.l=qi,e.addEventListener(t,a?Yi:Ji,a)):e.removeEventListener(t,a?Yi:Ji,a);else{if(i==`http://www.w3.org/2000/svg`)t=t.replace(/xlink(H|:h)/,`h`).replace(/sName$/,`s`);else if(t!=`width`&&t!=`height`&&t!=`href`&&t!=`list`&&t!=`form`&&t!=`tabIndex`&&t!=`download`&&t!=`rowSpan`&&t!=`colSpan`&&t!=`role`&&t!=`popover`&&t in e)try{e[t]=n??``;break n}catch{}typeof n==`function`||(n==null||!1===n&&t[4]!=`-`?e.removeAttribute(t):e.setAttribute(t,t==`popover`&&n==1?``:n))}}function ga(e){return function(t){if(this.__l){var n=this.__l[t.type+e];if(t.u==null)t.u=qi++;else if(t.u<n.l)return;return n(Y.event?Y.event(t):t)}}}function _a(e,t,n,r,i,a,o,s,c,l,u){var d,f,p,m,h,g,_,v,y,b,x,S,C,ee,te,w,T,ne,E,D,re,O=t.type;if(t.constructor!=null)return null;128&n.__u&&(c=!!(32&n.__u),n.__c.__z&&(s=t.__e=n.__e=(a=n.__c.__z)[0],n.__c.__z=null)),(d=Y.__b)&&d(t);n:if(typeof O==`function`)try{if(v=t.props,y=`prototype`in O&&O.prototype.render,b=(d=O.contextType)&&r[d.__c],x=d?b?b.props.value:d.__:r,n.__c?2&(f=t.__c=n.__c).__g&&(f.__g|=1,_=!0):(y?t.__c=f=new O(v,x):(t.__c=f=new aa(v,x),f.constructor=O,f.render=wa),b&&b.sub(f),f.props=v,f.state||={},f.context=x,f.__n=r,p=!0,f.__g|=8,f.__h=[],f._sb=[]),y&&f.__s==null&&(f.__s=f.state),y&&O.getDerivedStateFromProps!=null&&(f.__s==f.state&&(f.__s=ea({},f.__s)),ea(f.__s,O.getDerivedStateFromProps(v,f.__s))),m=f.props,h=f.state,f.__v=t,p)y&&O.getDerivedStateFromProps==null&&f.componentWillMount!=null&&f.componentWillMount(),y&&f.componentDidMount!=null&&f.__h.push(f.componentDidMount);else{if(y&&O.getDerivedStateFromProps==null&&v!==m&&f.componentWillReceiveProps!=null&&f.componentWillReceiveProps(v,x),!(4&f.__g)&&f.shouldComponentUpdate!=null&&!1===f.shouldComponentUpdate(v,f.__s,x)||t.__v==n.__v){for(t.__v!=n.__v&&(f.props=v,f.state=f.__s,f.__g&=-9),t.__e=n.__e,t.__k=n.__k,t.__k.some(function(e){e&&(e.__=t)}),S=0;S<f._sb.length;S++)f.__h.push(f._sb[S]);f._sb=[],f.__h.length&&o.push(f);break n}f.componentWillUpdate!=null&&f.componentWillUpdate(v,f.__s,x),y&&f.componentDidUpdate!=null&&f.__h.push(function(){f.componentDidUpdate(m,h,g)})}if(f.context=x,f.props=v,f.__P=e,f.__g&=-5,C=Y.__r,ee=0,y){for(f.state=f.__s,f.__g&=-9,C&&C(t),d=f.render(f.props,f.state,f.context),te=0;te<f._sb.length;te++)f.__h.push(f._sb[te]);f._sb=[]}else do f.__g&=-9,C&&C(t),d=f.render(f.props,f.state,f.context),f.state=f.__s;while(8&f.__g&&++ee<25);f.state=f.__s,f.getChildContext!=null&&(r=ea({},r,f.getChildContext())),y&&!p&&f.getSnapshotBeforeUpdate!=null&&(g=f.getSnapshotBeforeUpdate(m,h)),w=d,d!=null&&d.type===ia&&d.key==null&&(w=ba(d.props.children)),s=ua(e,Qi(w)?w:[w],t,n,r,i,a,o,s,c,l,u),t.__u&=-161,f.__h.length&&o.push(f),_&&(f.__g&=-4)}catch(e){if(t.__v=null,c||a!=null)if(e.then){for(T=0,ne=!1,t.__u|=c?160:128,t.__c.__z=[],E=0;E<a.length;E++)(D=a[E])==null||ne||(D.nodeType==8&&D.data==`$s`?(T>0&&t.__c.__z.push(D),T++,a[E]=null):D.nodeType==8&&D.data==`/$s`?(--T>0&&t.__c.__z.push(D),ne=T===0,s=a[E],a[E]=null):T>0&&(t.__c.__z.push(D),a[E]=null));if(!ne){for(;s&&s.nodeType==8&&s.nextSibling;)s=s.nextSibling;a[a.indexOf(s)]=null,t.__c.__z=[s]}t.__e=s}else{for(re=a.length;re--;)ta(a[re]);va(t)}else t.__e=n.__e,t.__k=n.__k,e.then||va(t);Y.__e(e,t,n)}else s=t.__e=xa(n.__e,t,n,r,i,a,o,c,l,u);return(d=Y.diffed)&&d(t),128&t.__u?void 0:s}function va(e){e&&e.__c&&(e.__c.__g|=4),e&&e.__k&&e.__k.forEach(va)}function ya(e,t,n){for(var r=0;r<n.length;r++)Sa(n[r],n[++r],n[++r]);Y.__c&&Y.__c(t,e),e.some(function(t){try{e=t.__h,t.__h=[],e.some(function(e){e.call(t)})}catch(e){Y.__e(e,t.__v)}})}function ba(e){return typeof e!=`object`||!e||e.__b&&e.__b>0?e:Qi(e)?e.map(ba):ea({},e)}function xa(e,t,n,r,i,a,o,s,c,l){var u,d,f,p,m,h,g,_,v=n.props,y=t.props,b=t.type;if(b==`svg`?i=`http://www.w3.org/2000/svg`:b==`math`?i=`http://www.w3.org/1998/Math/MathML`:i||=`http://www.w3.org/1999/xhtml`,a!=null){for(u=0;u<a.length;u++)if((m=a[u])&&`setAttribute`in m==!!b&&(b?m.localName==b:m.nodeType==3)){e=m,a[u]=null;break}}if(e==null){if(b==null)return l.createTextNode(y);e=l.createElementNS(i,b,y.is&&y),s&&=(Y.__m&&Y.__m(t,a),!1),a=null}if(b==null)v===y||s&&e.data==y||(e.data=y);else{if(a&&=$i.call(e.childNodes),v=n.props||Xi,!s&&a!=null)for(v={},u=0;u<e.attributes.length;u++)v[(m=e.attributes[u]).name]=m.value;for(u in v)if(m=v[u],u!=`children`){if(u==`dangerouslySetInnerHTML`)f=m;else if(!(u in y)){if(u==`value`&&`defaultValue`in y||u==`checked`&&`defaultChecked`in y)continue;ha(e,u,null,m,i)}}for(u in _=1&n.__u,y)m=y[u],u==`children`?p=m:u==`dangerouslySetInnerHTML`?d=m:u==`value`?h=m:u==`checked`?g=m:s&&typeof m!=`function`||v[u]===m&&!_||ha(e,u,m,v[u],i);if(d)s||f&&(d.__html==f.__html||d.__html==e.innerHTML)||(e.innerHTML=d.__html),t.__k=[];else if(f&&(e.innerHTML=``),ua(b==`template`?e.content:e,Qi(p)?p:[p],t,n,r,b==`foreignObject`?`http://www.w3.org/1999/xhtml`:i,a,o,a?a[0]:n.__k&&oa(n,0),s,c,l),a!=null)for(u=a.length;u--;)ta(a[u]);s||(u=`value`,b==`progress`&&h==null?e.removeAttribute(`value`):h==null||h===e[u]&&(b!==`progress`||h)||ha(e,u,h,v[u],i),u=`checked`,g!=null&&g!=e[u]&&ha(e,u,g,v[u],i))}return e}function Sa(e,t,n){try{if(typeof e==`function`){var r=typeof e.__u==`function`;r&&e.__u(),r&&t==null||(e.__u=e(t))}else e.current=t}catch(e){Y.__e(e,n)}}function Ca(e,t,n){var r,i;if(Y.unmount&&Y.unmount(e),(r=e.ref)&&(r.current&&r.current!=e.__e||Sa(r,null,t)),(r=e.__c)!=null){if(r.componentWillUnmount)try{r.componentWillUnmount()}catch(e){Y.__e(e,t)}r.__P=null}if(r=e.__k)for(i=0;i<r.length;i++)r[i]&&Ca(r[i],t,n||typeof e.type!=`function`);n||ta(e.__e),e.__e&&e.__e.__l&&(e.__e.__l=null),e.__e=e.__c=e.__=null}function wa(e,t,n){return this.constructor(e,n)}function Ta(e,t){var n,r,i,a;t==document&&(t=document.documentElement),Y.__&&Y.__(e,t),r=(n=!!(e&&32&e.__u))?null:t.__k,e=t.__k=na(ia,null,[e]),i=[],a=[],_a(t,e,r||Xi,Xi,t.namespaceURI,r?null:t.firstChild?$i.call(t.childNodes):null,i,r?r.__e:t.firstChild,n,a,t.ownerDocument),ya(i,e,a)}function Ea(e,t){e.__u|=32,Ta(e,t)}Y={__e:function(e,t,n,r){for(var i,a,o;t=t.__;)if((i=t.__c)&&!(1&i.__g)){i.__g|=4;try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=8&i.__g),i.componentDidCatch!=null&&(i.componentDidCatch(e,r||{}),o=8&i.__g),o)return void(i.__g|=2)}catch(t){e=t}}throw Wi=0,e}},Vi=0,aa.prototype.setState=function(e,t){var n=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=ea({},this.state);typeof e==`function`&&(e=e(ea({},n),this.props)),e&&ea(n,e),e!=null&&this.__v&&(t&&this._sb.push(t),ca(this))},aa.prototype.forceUpdate=function(e){this.__v&&(this.__g|=4,e&&this.__h.push(e),ca(this))},aa.prototype.render=ia,Hi=[],Wi=0,Gi=function(e,t){return e.__v.__b-t.__v.__b},Ki=/(PointerCapture)$|Capture$/i,qi=0,Ji=ga(!1),Yi=ga(!0);var Da=0;Array.isArray;function X(e,t,n,r,i,a){t||={};var o,s,c=t;if(`ref`in c&&typeof e!=`function`)for(s in c={},t)s==`ref`?o=t[s]:c[s]=t[s];var l={type:e,props:c,key:n,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Da,__i:-1,__u:0,__source:i,__self:a};return Y.vnode&&Y.vnode(l),l}var Oa=16,ka=16,Aa={};function ja({name:e,remappedFrom:t,token:n,width:r,height:i,viewBox:a,label:o,alignCapitals:s=!1}){"use no memo";let c=`#${e.replace(/^#/,``)}`,{width:l,height:u,viewBox:d}=Aa[e]??{width:Oa,height:ka},f=r??l,p=i??u,m=a??d??`0 0 ${l} ${u}`,h=o==null?{"aria-hidden":!0}:{"aria-label":o,role:`img`};return X(`svg`,{"data-icon-name":t??e,"data-icon-token":n,"data-align-capitals":s,...h,viewBox:m,width:f,height:p,children:X(`use`,{href:c})})}var Ma=e=>{if(e.length<2)return[e,``];let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]},Na=e=>{if(e.length<4)return[e,``];let t=e.lastIndexOf(`.`)+1,n=e.length-t>10,r=t>=1&&!n?t:Math.ceil(e.length/2);return[e.slice(0,r),e.slice(r)]},Pa=e=>{if(e.length<4)return[e,``];let t=e.lastIndexOf(`/`)+1,n=e.length-t>25,r=t>=1&&!n?t:Math.ceil(e.length/2);return[e.slice(0,r),e.slice(r)]},Fa=(e,{splitIndex:t}={})=>{if(typeof t!=`number`){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}return[e.slice(0,t),e.slice(t)]},Ia=(e,{splitOffset:t}={})=>{if(typeof t!=`number`||t<=0||t>=e.length){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}let n=e.length-t;return[e.slice(0,n),e.slice(n)]},La=(e,{splitOffset:t}={})=>{if(typeof t!=`number`||t<=0||t>=e.length){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}let n=t;return[e.slice(0,n),e.slice(n)]};function Ra({children:e,marker:t,variant:n=`default`}){"use no memo";let r=n===`fade`;return X(`div`,{"aria-hidden":!0,"data-truncate-marker-cell":!0,children:X(`div`,{"data-truncate-marker":!0,children:typeof t==`function`?t({children:e}):r?X(`span`,{"data-truncate-fade":!0}):t})})}function za(e){"use no memo";let{mode:t,children:n}=e;return X(`div`,{children:[X(`div`,{"data-truncate-content":`visible`,children:t===`fruncate`?X(`span`,{children:n}):n}),X(`div`,{"data-truncate-content":`overflow`,"aria-hidden":!0,children:t===`fruncate`?X(`span`,{children:n}):n})]})}function Ba({children:e,mode:t=`truncate`,marker:n=`…`,variant:r=`default`,...i}){"use no memo";let a=X(za,{mode:t,children:e},`content`),o=X(Ra,{marker:n,mode:t,variant:r},`marker`),s=X(`div`,{"data-truncate-fill":!0},`fill`);return X(`div`,{"data-truncate-container":t,"data-truncate-variant":r,...i,children:X(`div`,{"data-truncate-grid":!0,children:t===`truncate`?[a,o]:[o,a,s]})})}function Va({children:e,...t}){"use no memo";return X(Ba,{mode:`truncate`,...t,children:e})}function Ha({children:e,...t}){"use no memo";return X(Ba,{mode:`fruncate`,...t,children:e})}function Ua({children:e,contents:t,priority:n=`end`,split:r=`center`,minimumLength:i=12,className:a,style:o,...s}){"use no memo";let c=null,l=null;if(Array.isArray(t)){if(t.length!==2)return console.error(`MiddleTruncate: contents must be an array of two items`),null;c=X(Va,{...s,children:t[0]}),l=X(Ha,{...s,children:t[1]})}else{if(typeof e!=`string`)return console.error(`MiddleTruncate: children must be a string`),null;if(e.length===0)return X(`div`,{className:a,style:o});if(e.length<i)return X(n===`end`?Ha:Va,{...s,className:a,style:o,children:e});let t=null,u=null,d=null;if(typeof r==`string`)r===`center`?t=Ma:r===`extension`?t=Na:r===`leaf-path`&&(t=Pa);else if(typeof r==`number`)t=Fa,u=r;else if(Array.isArray(r)){let[e,n]=r;d=n,e===`last`?t=Ia:e===`first`&&(t=La)}else typeof r==`function`&&(t=r);t??=Ma;let[f,p]=t(e,{priority:n,variant:s.variant,splitIndex:typeof u==`number`?u:void 0,splitOffset:typeof d==`number`?d:void 0}),m=f.length>=p.length,h=n===`equal`&&!m,g=n===`equal`&&m,_={},v={};h&&(_.marker=``),g&&(v.marker=``),c=X(Va,{...s,..._,children:f}),l=X(Ha,{...s,...v,children:p})}return X(`div`,{"data-truncate-group-container":`middle`,className:a,style:o,children:[X(`div`,{"data-truncate-segment-priority":n===`start`||n===`equal`?`1`:`2`,children:c}),X(`div`,{"data-truncate-segment-priority":n===`end`||n===`equal`?`1`:`2`,children:l})]})}var Wa={endIndex:-1,startIndex:-1};function Ga(e,t,n){return Math.min(Math.max(e,t),n)}function Ka(e,t){return e<0||t<e?Wa:{endIndex:t,startIndex:e}}function qa(e){return e.startIndex<0||e.endIndex<e.startIndex}function Ja(e,t){return qa(e)?0:(e.endIndex-e.startIndex+1)*t}function Ya(e,t,n){if(t<=0)return-1;let r=t*n;return e<=0?0:e>=r?t:Math.floor(e/n)}function Xa(e,t,n){return t<=0||e<=0?-1:e>=t*n?t-1:Math.ceil(e/n)-1}function Za(e){let t=new Map;return e.forEach((e,n)=>{if(e.kind!==`directory`||!e.isExpanded)return;let r=e.ancestorPaths.length,i=t.get(r);if(i==null){t.set(r,[n]);return}i.push(n)}),t}function Qa(e,t){let n=0,r=e.length-1,i=-1;for(;n<=r;){let a=Math.floor((n+r)/2),o=e[a];if(o==null)break;if(o<=t){i=a,n=a+1;continue}r=a-1}return i}function $a(e){let t=new Map,n=[];for(let r=0;r<e.length;r+=1){let i=e[r];if(i==null)continue;let a=i.kind===`directory`&&i.isExpanded?[...i.ancestorPaths,i.path]:i.ancestorPaths,o=0;for(;o<n.length&&o<a.length&&n[o]===a[o];)o+=1;for(let e=n.length-1;e>=o;--e){let i=n[e];i!=null&&t.set(i,r-1)}n.length=o;for(let e=o;e<a.length;e+=1){let t=a[e];t!=null&&n.push(t)}}let r=e.length-1;for(let e of n)t.set(e,r);return t}function eo(e,t,n){if(e.length===0||t<=0)return[];let r=$a(e),i=Za(e),a=[];for(let r=0;r<e.length;r+=1){let o=i.get(r);if(o==null||o.length===0)break;let s=t+r*n,c=Qa(o,Math.min(e.length-1,Math.floor(s/n))),l=null;for(;c>=0;){let t=o[c],n=t==null?null:e[t]??null;if(n!=null&&(r===0||n.ancestorPaths[r-1]===a[r-1]?.path)){l=n;break}--c}if(l==null)break;a.push(l)}return a.map((i,a)=>{let o=a*n,s=(r.get(i.path)??e.length-1)+1;if(s>=e.length)return{row:i,top:o};let c=s*n-t;return{row:i,top:Math.min(o,c-n)}}).filter(e=>e.top+n>0)}function to(e,t){let n=t.totalRowCount??e.length,r=n*t.itemHeight,i=Math.max(0,t.viewportHeight),a=Math.max(0,Math.floor(t.overscan)),o=Math.max(0,r-i),s=Ga(t.scrollTop,0,o),c=t.stickyRows??eo(e,s,t.itemHeight),l=c.reduce((e,n)=>Math.max(e,n.top+t.itemHeight),0),u=Math.min(r,s+l),d=Math.max(0,i-l),f=Math.max(0,r-u),p=Ya(s,n,t.itemHeight),m=Ya(u,n,t.itemHeight),h=l<=0||p<0||p>=n?-1:p,g=h===-1?-1:Math.min(n-1,m-1),_=h===-1||g<h?0:g-h+1,v=d<=0||m>=n?Wa:Ka(m,Xa(u+d,n,t.itemHeight)),y=g+1,b=qa(v)?Wa:Ka(Math.max(y,v.startIndex-a),Math.min(n-1,v.endIndex+a)),x=Ja(b,t.itemHeight);return{occlusion:{firstOccludedIndex:h,lastOccludedIndex:g,occludedCount:_},physical:{itemHeight:t.itemHeight,maxScrollTop:o,overscan:a,scrollTop:s,totalHeight:r,totalRowCount:n,viewportHeight:i},projected:{contentHeight:f,paneHeight:d,paneTop:u},sticky:{height:l,rows:c},visible:v,window:{endIndex:b.endIndex,height:x,offsetTop:qa(b)?0:b.startIndex*t.itemHeight,startIndex:b.startIndex}}}var no={added:`A`,deleted:`D`,ignored:null,modified:`M`,renamed:`R`,untracked:`U`},ro={added:`Git status: added`,deleted:`Git status: deleted`,ignored:`Git status: ignored`,modified:`Git status: modified`,renamed:`Git status: renamed`,untracked:`Git status: untracked`},io=`Contains git status items`;function ao(e){let{renamingPath:t,previousRenamingPath:n,hasRenderedInput:r}=e;return t==null?`reset`:r?n===t?`ignore`:`focus-input`:`reveal-canonical`}function oo(e){let{row:t,mode:n,targetPath:r,ariaLabel:i,domId:a,isParked:o,itemHeight:s,features:c,state:l,extraStyle:u}=e,d=n===`sticky`,f=t.ancestorPaths.at(-1)??``,p={};return l.isFocusRinged&&(p[`data-item-focused`]=!0),t.isSelected&&(p[`data-item-selected`]=!0),l.isContextHovered&&(p[`data-item-context-hover`]=`true`),l.isDragTarget&&(p[`data-item-drag-target`]=!0),l.isDragging&&(p[`data-item-dragging`]=!0),l.effectiveGitStatus!=null&&(p[`data-item-git-status`]=l.effectiveGitStatus),l.containsGitChange&&(p[`data-item-contains-git-change`]=`true`),{"aria-expanded":!d&&t.kind===`directory`?t.isExpanded:void 0,"aria-haspopup":c.contextMenuEnabled?`menu`:void 0,"aria-label":i,"aria-level":d?void 0:t.level+1,"aria-posinset":d?void 0:t.posInSet+1,"aria-selected":d?void 0:t.isSelected?`true`:`false`,"aria-setsize":d?void 0:t.setSize,"data-file-tree-sticky-path":d?r:void 0,"data-file-tree-sticky-row":d?`true`:void 0,"data-item-context-menu-button-visibility":c.actionLaneEnabled?c.contextMenuButtonVisibility:void 0,"data-item-context-menu-trigger-mode":c.contextMenuEnabled?c.contextMenuTriggerMode:void 0,"data-item-has-context-menu-action-lane":c.actionLaneEnabled?`true`:void 0,"data-item-has-git-lane":c.gitLaneActive?`true`:void 0,"data-item-parent-path":f.length>0?f:void 0,"data-item-parked":o?`true`:void 0,"data-item-path":r,"data-item-type":t.kind===`directory`?`folder`:`file`,"data-type":`item`,id:d?void 0:a,role:d?void 0:`treeitem`,style:{minHeight:`${s}px`,...u},tabIndex:!d&&t.isFocused?0:-1,...p}}function so(e){let{event:t,mode:n,isSearchOpen:r,isDirectory:i}=e,a=t.ctrlKey||t.metaKey,o=t.shiftKey||a,s=t.shiftKey?{additive:a,kind:`range`}:a?{kind:`toggle`}:{kind:`single`};return{closeSearch:r,revealCanonical:n===`sticky`,selection:s,toggleDirectory:!o&&i}}function co(e){let{currentScrollTop:t,focusedIndex:n,itemHeight:r,topInset:i=0,viewportHeight:a}=e;if(n<0)return null;let o=Math.max(0,i),s=n*r,c=s+r;if(s<t+o){let e=Math.max(0,s-o);return e===t?null:e}if(c>t+a){let e=c-a;return e===t?null:e}return null}function lo(e){let{currentScrollTop:t,focusedIndex:n,itemHeight:r,targetViewportOffset:i,totalHeight:a,viewportHeight:o}=e;if(n<0)return null;let s=Math.max(0,i),c=n*r,l=c+r,u=t+s,d=t+o;if(c>=u&&l<=d)return null;let f=Math.max(0,a-o),p=Math.max(0,Math.min(c-s,f));return p===t?null:p}var uo,Z,fo,po,mo=Object.is,ho=0,go=[],Q=Y,_o=Q.__b,vo=Q.__r,yo=Q.diffed,bo=Q.__c,xo=Q.unmount,So=Q.__;function Co(e,t){Q.__h&&Q.__h(Z,e,ho||t),ho=0;var n=Z.__H||={__:[],__h:[]};return e>=n.__.length&&n.__.push({}),n.__[e]}function wo(e){return ho=1,To(Io,e)}function To(e,t,n){var r=Co(uo++,2);if(r.t=e,!r.__c&&(r.__=[n?n(t):Io(void 0,t),function(e){var t=r.__N?r.__N[0]:r.__[0],n=r.t(t,e);mo(t,n)||(r.__N=[n,r.__[1]],r.__c.setState({}))}],r.__c=Z,!Z.__f)){var i=function(e,t,n){if(!r.__c.__H)return!0;var i=r.__c.__H.__.filter(function(e){return!!e.__c});if(i.every(function(e){return!e.__N}))return!a||a.call(this,e,t,n);var o=r.__c.props!==e;return i.forEach(function(e){if(e.__N){var t=e.__[0];e.__=e.__N,e.__N=void 0,mo(t,e.__[0])||(o=!0)}}),a&&a.call(this,e,t,n)||o};Z.__f=!0;var a=Z.shouldComponentUpdate,o=Z.componentWillUpdate;Z.componentWillUpdate=function(e,t,n){if(4&this.__g){var r=a;a=void 0,i(e,t,n),a=r}o&&o.call(this,e,t,n)},Z.shouldComponentUpdate=i}return r.__N||r.__}function Eo(e,t){var n=Co(uo++,3);!Q.__s&&Fo(n.__H,t)&&(n.__=e,n.u=t,Z.__H.__h.push(n))}function Do(e,t){var n=Co(uo++,4);!Q.__s&&Fo(n.__H,t)&&(n.__=e,n.u=t,Z.__h.push(n))}function $(e){return ho=5,Oo(function(){return{current:e}},[])}function Oo(e,t){var n=Co(uo++,7);return Fo(n.__H,t)&&(n.__=e(),n.__H=t,n.__h=e),n.__}function ko(e,t){return ho=8,Oo(function(){return e},t)}function Ao(){for(var e;e=go.shift();)if(e.__P&&e.__H)try{e.__H.__h.forEach(No),e.__H.__h.forEach(Po),e.__H.__h=[]}catch(t){e.__H.__h=[],Q.__e(t,e.__v)}}Q.__b=function(e){Z=null,_o&&_o(e)},Q.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),So&&So(e,t)},Q.__r=function(e){vo&&vo(e),uo=0;var t=(Z=e.__c).__H;t&&(fo===Z?(t.__h=[],Z.__h=[],t.__.forEach(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.forEach(No),t.__h.forEach(Po),t.__h=[],uo=0)),fo=Z},Q.diffed=function(e){yo&&yo(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(go.push(t)!==1&&po===Q.requestAnimationFrame||((po=Q.requestAnimationFrame)||Mo)(Ao)),t.__H.__.forEach(function(e){e.u&&(e.__H=e.u),e.u=void 0})),fo=Z=null},Q.__c=function(e,t){t.some(function(e){try{e.__h.forEach(No),e.__h=e.__h.filter(function(e){return!e.__||Po(e)})}catch(n){t.some(function(e){e.__h&&=[]}),t=[],Q.__e(n,e.__v)}}),bo&&bo(e,t)},Q.unmount=function(e){xo&&xo(e);var t,n=e.__c;n&&n.__H&&(n.__H.__.forEach(function(e){try{No(e)}catch(e){t=e}}),n.__H=void 0,t&&Q.__e(t,n.__v))};var jo=typeof requestAnimationFrame==`function`;function Mo(e){var t,n=function(){clearTimeout(r),jo&&cancelAnimationFrame(t),setTimeout(e)},r=setTimeout(n,35);jo&&(t=requestAnimationFrame(n))}function No(e){var t=Z,n=e.__c;typeof n==`function`&&(e.__c=void 0,n()),Z=t}function Po(e){var t=Z;e.__c=e.__(),Z=t}function Fo(e,t){return!e||e.length!==t.length||t.some(function(t,n){return!mo(t,e[n])})}function Io(e,t){return typeof t==`function`?t(e):t}function Lo(e){if(e==null||!e.isConnected||e===document.body||e===document.documentElement)return!1;e.focus({preventScroll:!0});let t=e.getRootNode();return t instanceof ShadowRoot?t.activeElement===e:document.activeElement===e}function Ro(e){let t=e.getRootNode();if(t instanceof ShadowRoot){let e=t.activeElement;return e instanceof HTMLElement?e:null}let n=document.activeElement;return n instanceof HTMLElement&&e.contains(n)?n:null}function zo({ariaLabel:e,isFlattened:t=!1,ref:n,value:r,onBlur:i,onInput:a}){return X(`input`,{ref:n,"data-item-rename-input":!0,...t?{"data-item-flattened-rename-input":!0}:{},"aria-label":e,value:r,onBlur:i,onInput:a,onClick:e=>e.stopPropagation(),onMouseDown:e=>e.stopPropagation(),onPointerDown:e=>e.stopPropagation()})}function Bo(e,t=null,n=null){"use no memo";let r=e.flattenedSegments;return r==null||r.length===0?t??e.name:X(`span`,{"data-item-flattened-subitems":!0,children:r.map((e,i)=>{let a=i===r.length-1;return X(ia,{children:[X(`span`,{"data-item-flattened-subitem":e.path,"data-item-flattened-subitem-drag-target":n===e.path?`true`:void 0,children:a&&t!=null?t:X(Va,{children:e.name})}),i<r.length-1?` / `:``]},e.path)})})}function Vo(e){return e.isFlattened?e.flattenedSegments?.findLast(e=>e.isTerminal)?.path??e.path:e.path}function Ho(e){let t=e.flattenedSegments;return t==null||t.length===0?e.name:t.map(e=>e.name).join(` / `)}function Uo(e,t,n,r){return e.map((e,i)=>{let a=i*n,o=e.subtreeEndIndex+1;if(o>=r)return{row:e.row,top:a};let s=o*n-t;return{row:e.row,top:Math.min(a,s-n)}}).filter(e=>e.top+n>0)}function Wo({controller:e,itemHeight:t,overscan:n,scrollTop:r,stickyFolders:i,viewportHeight:a}){let o=e.getVisibleCount(),s=i&&o>0?e.getStickyRowCandidates(r,t):[],c=s==null&&i&&o>0?e.getVisibleRows(0,o-1):[],l=to(c,{itemHeight:t,overscan:n,scrollTop:r,stickyRows:s==null?void 0:Uo(s,r,t,o),totalRowCount:o,viewportHeight:a}),u=i&&r<=0&&o>0?e.getStickyRowCandidates(1,t):[],d=u!=null&&r<=0?Uo(u,1,t,o):i&&r<=0&&c.length>0?eo(c,1,t):l.sticky.rows;return{overlayHeight:d.reduce((e,n)=>Math.max(e,n.top+t),0),overlayRows:d,snapshot:l,visibleRows:c}}var Go=400,Ko=10,qo=40,Jo=18;function Yo(e,t,n){let r=e,i=document.elementFromPoint?.bind(document)??null,a=r.elementFromPoint?.(t,n)??i?.(t,n)??null;return e instanceof ShadowRoot&&(a==null||!e.contains(a))?Xo(e,t,n):a instanceof HTMLElement?a:null}function Xo(e,t,n){let r=Array.from(e.querySelectorAll(`[data-type="item"], [data-item-flattened-subitem]`));for(let e=r.length-1;e>=0;e--){let i=r[e],a=i.getBoundingClientRect();if(t>=a.left&&t<=a.right&&n>=a.top&&n<=a.bottom)return i}return null}function Zo(e){let t=e?.closest?.(`[data-type="item"]`);if(!(t instanceof HTMLElement))return null;let n=t.dataset.itemPath??null;if(n==null)return null;let r=e?.closest?.(`[data-item-flattened-subitem]`),i=r instanceof HTMLElement?r.getAttribute(`data-item-flattened-subitem`)??null:null;if(i!=null&&i.endsWith(`/`))return{directoryPath:i,flattenedSegmentPath:i,hoveredPath:n,kind:`directory`};if(t.dataset.itemType===`folder`)return{directoryPath:n,flattenedSegmentPath:null,hoveredPath:n,kind:`directory`};let a=t.dataset.itemParentPath??null;return a==null||a.length===0?{directoryPath:null,flattenedSegmentPath:null,hoveredPath:n,kind:`root`}:{directoryPath:a,flattenedSegmentPath:null,hoveredPath:n,kind:`directory`}}function Qo(e){let t=e.cloneNode(!0);return t.removeAttribute(`id`),t.dataset.fileTreeDragPreview=`true`,t.setAttribute(`aria-hidden`,`true`),t.tabIndex=-1,Object.assign(t.style,{boxShadow:`0 4px 12px rgba(0, 0, 0, 0.15)`,left:`0px`,margin:`0`,pointerEvents:`none`,position:`fixed`,top:`0px`,willChange:`transform`,zIndex:`10000`}),t}function $o(){return navigator.vendor!==`Apple Computer, Inc.`}function es(e,t){let n=e-t.top;if(n<qo){let e=Math.max(0,n);return-Math.ceil((qo-e)/qo*Jo)}let r=t.bottom-e;if(r<qo){let e=Math.max(0,r);return Math.ceil((qo-e)/qo*Jo)}return 0}function ts(e,t){if(e!=null){let t=no[e];return t==null?null:{text:t,title:ro[e]}}return t?{icon:{name:`file-tree-icon-dot`,width:6,height:6},title:io}:null}function ns(e,t,n){if(t==null||t.size===0)return null;let r=[];for(let i=e.length-1;i>=0;--i){let a=e[i],o=n.get(a);if(o!=null){for(let e of r)n.set(e,o);return o?`ignored`:null}if(t.has(a)){n.set(a,!0);for(let e of r)n.set(e,!0);return`ignored`}r.push(a)}for(let e of r)n.set(e,!1);return null}function rs(e){return e!=null&&`toggle`in e}function is(e){return e.code===`Space`||e.key===` `||e.key===`Spacebar`}function as(e){return e.key.length===1&&/^[\p{L}\p{N}]$/u.test(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey}function os(e,t){return e?.clientHeight!=null&&e.clientHeight>0?e.clientHeight:t}function ss(e,t,n,r,i=0){let a=co({currentScrollTop:e.scrollTop,focusedIndex:t,itemHeight:n,topInset:i,viewportHeight:os(e,r)});return a==null?!1:(e.scrollTop=a,!0)}function cs(e,t,n,r,i,a){let o=lo({currentScrollTop:e.scrollTop,focusedIndex:t,itemHeight:n,targetViewportOffset:a,totalHeight:i,viewportHeight:os(e,r)});return o==null?!1:(e.scrollTop=o,!0)}function ls(e,t,n,r){return n.end<n.start?null:e<n.start?-t:e>n.end?r:null}function us(e){return e==null?``:`[data-item-section="spacing-item"][data-ancestor-path="${e.replaceAll(`\\`,`\\\\`).replaceAll(`"`,`\\"`)}"] { opacity: 1; }`}function ds(e){return e.shiftKey&&e.key===`F10`||e.key===`ContextMenu`}var fs=new Set([`ArrowDown`,`ArrowLeft`,`ArrowRight`,`ArrowUp`,`End`,`Home`,`PageDown`,`PageUp`]);function ps(e){for(let t of e.composedPath())if(t instanceof HTMLElement&&(t.dataset.fileTreeContextMenuRoot===`true`||t.dataset.type===`context-menu-anchor`||t.dataset.type===`context-menu-trigger`||t.getAttribute(`slot`)===`context-menu`))return!0;return!1}function ms(e){return{bottom:e.bottom,height:e.height,left:e.left,right:e.right,top:e.top,width:e.width,x:e.x,y:e.y}}function hs(e,t){return{bottom:t,height:0,left:e,right:e,top:t,width:0,x:e,y:t}}function gs(e,t){if(e==null)return t.offsetTop;let n=t.getBoundingClientRect(),r=e.getBoundingClientRect();return n.top-r.top}function _s(e,t,n){if(n==null){e.delete(t);return}e.set(t,n)}function vs(e,t,n){return e==null?null:t.get(e)??n.get(e)??null}function ys(e,t){return{kind:e.kind,name:Ho(e),path:t}}function bs(e){return e==null?void 0:`${e}__tree`}function xs(e,t,n){if(e!=null)return`${e}__focused-item-${encodeURIComponent(t)}${n?`__parked`:``}`}function Ss(e){return e===`file-tree-icon-chevron`||e===`file-tree-icon-dot`||e===`file-tree-icon-file`||e===`file-tree-icon-lock`}function Cs(e,t){if(e==null)return null;if(`text`in e)return X(`span`,{title:e.title,children:e.text});let n=typeof e.icon==`string`?Ss(e.icon)?t(e.icon):{name:e.icon}:Ss(e.icon.name)?(()=>{let n=t(e.icon.name),{name:r,...i}=e.icon;return{...n,...i}})():e.icon;return X(`span`,{title:e.title,children:X(ja,{...n})})}function ws(e){e!=null&&Lo(e.querySelector([`button:not([disabled])`,`[href]`,`input:not([disabled])`,`select:not([disabled])`,`textarea:not([disabled])`,`[tabindex]:not([tabindex="-1"])`].join(`, `))??e)}function Ts(e,t,{actionLaneEnabled:n=!1,customDecoration:r=null,decorationLaneEnabled:i=!1,dragTargetFlattenedSegmentPath:a=null,gitDecoration:o=null,gitLaneActive:s=!1,renameInput:c=null,showDecorativeActionAffordance:l=!1}={}){let u=Vo(e);return X(ia,{children:[e.depth>0?X(`div`,{"data-item-section":`spacing`,children:Array.from({length:e.depth}).map((t,n)=>X(`div`,{"data-item-section":`spacing-item`,"data-ancestor-path":e.ancestorPaths[n]},n))}):null,X(`div`,{"data-item-section":`icon`,children:e.kind===`directory`?X(ja,{...t(`file-tree-icon-chevron`)}):X(ja,{...t(`file-tree-icon-file`,u)})}),X(`div`,{"data-item-section":`content`,children:e.isFlattened?Bo(e,c,a):c??X(Ua,{minimumLength:5,split:`extension`,children:e.name})}),i?X(`div`,{"data-item-section":`decoration`,children:r==null?null:Cs(r,t)}):null,s?X(`div`,{"data-item-section":`git`,children:Cs(o,t)}):null,n?X(`div`,{"data-item-section":`action`,children:l?X(`span`,{"aria-hidden":`true`,"data-item-action-affordance":`decorative`,children:X(ja,{...t(`file-tree-icon-ellipsis`)})}):null}):null]})}function Es(e,t,n,r={}){let{controller:i,renameView:a,visualFocusPath:o,contextHoverPath:s,draggedPathSet:c,dragTarget:l,dragAndDropEnabled:u,shouldSuppressContextMenu:d,handleRowDragStart:f,handleRowDragEnd:p,handleRowTouchStart:m,instanceId:h,itemHeight:g,gitStatusByPath:_,ignoredGitDirectories:v,ignoredInheritanceCache:y,directoriesWithGitChanges:b,gitLaneActive:x,contextMenuEnabled:S,contextMenuTriggerMode:C,contextMenuButtonTriggerEnabled:ee,contextMenuButtonVisibility:te,contextMenuRightClickEnabled:w,registerRenameInput:T,registerButton:ne,resolveIcon:E,renderDecorationForRow:D,openContextMenuForRow:re,onRowClick:O,onKeyDown:k}=e,A=Vo(t),{isParked:j=!1,mode:M=`flow`,style:ie}=r,N=M===`sticky`,ae=_?.get(A)??null??ns(t.ancestorPaths,v,y),oe=t.kind===`directory`&&(b?.has(A)??!1),se=D(t,A),ce=ts(ae,oe),P=S&&ee,F=se!=null||x||P,le=P&&te===`always`,I=a.getPath()===A,ue=I?a.getValue():``,de=N||!I?null:X(zo,{ref:T,ariaLabel:`Rename ${Ho(t)}`,isFlattened:t.isFlattened,value:ue,onBlur:()=>{a.commit()},onInput:e=>{a.setValue(e.currentTarget.value)}}),fe=Ts(t,E,{actionLaneEnabled:P,customDecoration:se,decorationLaneEnabled:F,dragTargetFlattenedSegmentPath:l?.flattenedSegmentPath??null,gitDecoration:ce,gitLaneActive:x,renameInput:de,showDecorativeActionAffordance:le}),pe={...oo({ariaLabel:Ho(t),domId:t.isFocused?xs(h,A,j):void 0,extraStyle:ie,features:{actionLaneEnabled:P,contextMenuButtonVisibility:P?te:null,contextMenuEnabled:S,contextMenuTriggerMode:S?C:null,gitLaneActive:x},isParked:j,itemHeight:g,mode:M,row:t,state:{containsGitChange:oe,effectiveGitStatus:ae,isContextHovered:s===A,isDragTarget:l?.kind===`directory`&&l.directoryPath===A,isDragging:c?.has(A)===!0,isFocusRinged:t.isFocused&&o===A},targetPath:A}),key:n,onContextMenu:S||u?e=>{if(d()){e.preventDefault();return}S&&(e.preventDefault(),w&&(i.focusPath(A),re(t,A,{anchorRect:hs(e.clientX,e.clientY),source:`right-click`})))}:void 0,onFocus:N?void 0:()=>{i.focusPath(A)},onKeyDown:N?void 0:k,ref:e=>{ne(A,e)}};return!N&&I?X(`div`,{...pe,children:fe}):X(`button`,{...pe,type:`button`,draggable:u&&!j,onDragEnd:u&&!j?p:void 0,onDragStart:u&&!j?e=>{f(e,t,A)}:void 0,onMouseDown:e=>{if(N){e.preventDefault();return}i.isSearchOpen()&&e.preventDefault()},onTouchStart:u&&!j?e=>{m(e,t,A)}:void 0,onClick:e=>{O(e,t,A,M)},children:fe})}function Ds(e,t,n){return t.end<t.start?[]:e.controller.getVisibleRows(t.start,t.end).filter(e=>!n.has(Vo(e))).map((n,r)=>Es(e,n,t.start+r))}function Os({composition:e,controller:t,gitStatusByPath:n,ignoredGitDirectories:r,directoriesWithGitChanges:i,icons:a,instanceId:o,itemHeight:s=ge,overscan:c=10,renamingEnabled:l=!1,renderRowDecoration:u,searchBlurBehavior:d=`close`,searchEnabled:f=!1,searchFakeFocus:p=!1,slotHost:m,stickyFolders:h=!1,initialViewportHeight:g=420}){"use no memo";let _=$(null),v=$(null),y=$(!1),b=$(null),x=$(null),S=$(null),C=$(null),ee=$(null),te=$(new Map),w=$(new Map),T=$(()=>{}),ne=$(!1),E=$(null),re=$(null),O=$(!1),k=$(null),A=$(null),j=$(null),M=$(null),ie=$(null),N=$(null),ae=$(null),P=$(null),F=$(!1),le=$(null),I=$(null),ue=$(null),de=$(null),fe=Oo(()=>new Map,[]),[,pe]=wo(0),[me,he]=wo(null),[_e,ve]=wo(null),[ye,L]=wo(null),[be,xe]=wo(null),[R,Se]=wo(null),Ce=$(R);Ce.current=R;let we=$(null),Te=$(null),Ee=$(!1),De=$(d===`retain`&&t.isSearchOpen()),[Oe,ke]=wo(p);Eo(()=>{p||ke(!1)},[p]);let Ae=$(!1),je=ko(()=>{Ae.current=!0,ke(e=>e&&!1)},[]),[Me,Ne]=wo(()=>Wo({controller:t,itemHeight:s,overscan:c,scrollTop:0,stickyFolders:h,viewportHeight:g})),[Pe,Fe]=wo(!1);Eo(()=>{Fe(!0)},[]);let z=e?.contextMenu?.enabled===!0||e?.contextMenu?.render!=null||e?.contextMenu?.onOpen!=null||e?.contextMenu?.onClose!=null,Ie=e?.contextMenu?.triggerMode??(z?`right-click`:`both`),Le=Ie===`both`||Ie===`button`,Re=e?.contextMenu?.buttonVisibility??`when-needed`,ze=Ie===`both`||Ie===`right-click`;Do(()=>{let e=S.current;if(e==null)return;let t=e=>{if(!(e instanceof CustomEvent))return;let t=e.detail?.path??null;Te.current=t,ve(t),xe(t==null?null:`pointer`)},n=e=>{e instanceof CustomEvent&&(Ee.current=e.detail?.disabled===!0)};return e.addEventListener(`file-tree-debug-set-context-menu-trigger`,t),e.addEventListener(`file-tree-debug-set-scroll-suppression`,n),()=>{e.removeEventListener(`file-tree-debug-set-context-menu-trigger`,t),e.removeEventListener(`file-tree-debug-set-scroll-suppression`,n)}},[]);let Be=ko((e,t)=>{_s(te.current,e,t)},[]),Ve=ko((e,t)=>{_s(w.current,e,t)},[]),He=ko(e=>{x.current=e},[]),Ue=ko(e=>vs(e,w.current,te.current),[]),We=n!=null||r!=null||i!=null,{resolveIcon:Ge}=Oo(()=>D(a),[a]),Ke=t[ui](),B=Ke.getPath(),qe=B!=null,V=t.isSearchOpen(),Je=t.getSearchValue(),H=t.getFocusedPath(),U=t.getFocusedIndex(),Ye=t.isDragAndDropEnabled(),Xe=t.getDragSession(),W=Oo(()=>Xe==null?null:new Set(Xe.draggedPaths),[Xe]),Ze=Xe?.target??null,Qe=Xe?.primaryPath??null,$e=bs(o),{overlayHeight:et,overlayRows:tt,snapshot:G,visibleRows:nt}=Me,rt=G.physical.viewportHeight,it=Oo(()=>({end:G.window.endIndex,start:G.window.startIndex}),[G.window.endIndex,G.window.startIndex]),at=tt,ot=G.sticky.rows,st=G.physical.totalHeight,ct=G.sticky.height,lt=Oo(()=>new Set(ot.map(e=>Vo(e.row))),[ot]),ut=U>=0&&U>=it.start&&U<=it.end,dt=ko((e,t)=>u?.({item:ys(e,t),row:e})??null,[u]),ft=ko(e=>Lo(e==null?null:te.current.get(e)??null)?!0:Lo(S.current),[]),pt=ko(e=>{ft(t.focusNearestPath(e))},[t,ft]),mt=$(pt);mt.current=pt;let ht=$(!0),gt=$(()=>{}),_t=ko((t=!0)=>{let n=Ce.current;n!=null&&(ht.current=ht.current&&t,Se(null),e?.contextMenu?.onClose?.(),ht.current&&pt(n.path))},[e?.contextMenu,pt]);gt.current=_t;let vt=ko(e=>{let t=e==null?null:gs(S.current,e);L(e=>e===t?e:t)},[]),yt=ko((e,n,r)=>{let i=t.getItem(n);i!=null&&(i.focus(),vt(Ue(n)),ht.current=!0,Se({anchorRect:r?.anchorRect??null,item:ys(e,n),path:n,source:r?.source??`keyboard`}))},[t,Ue,vt]),bt=ko(e=>{if(l){if(t.isSearchOpen()){let e=C.current,t=os(e,rt);k.current=U<0||e==null?null:Math.max(0,Math.min(U*s-e.scrollTop,Math.max(0,t-s))),O.current=!0}t.startRenaming(e)!==!1&&(xe(`focus`),pe(e=>e+1))}},[t,U,s,l,rt]),xt=ko((e,{restoreTreeFocus:n=!0,targetOffset:r=`live-overlay`}={})=>{let i=C.current;if(i==null)return!1;t.focusPath(e);let a=t.getFocusedIndex();if(a<0)return!1;let o=t.getVisibleRows(a,a)[0]??null;if(o==null)return!1;let l=os(i,rt),u=t.getVisibleCount()*s,d=r===`sticky-parents`?o.ancestorPaths.length*s:Wo({controller:t,itemHeight:s,overscan:c,scrollTop:i.scrollTop,stickyFolders:h,viewportHeight:l}).snapshot.sticky.height;return ne.current=!0,cs(i,a,s,l,u,d),T.current(),we.current=n?e:null,!0},[t,s,c,rt,h]),St=()=>de.current!=null||F.current===!0,Ct=e=>typeof window.requestAnimationFrame==`function`?window.requestAnimationFrame(()=>{e()}):window.setTimeout(e,16),wt=e=>{if(e!=null){if(typeof window.cancelAnimationFrame==`function`){window.cancelAnimationFrame(e);return}window.clearTimeout(e)}},Tt=()=>{M.current!=null&&(clearTimeout(M.current),M.current=null),j.current=null},Et=()=>{N.current?.remove(),N.current=null},Dt=()=>{wt(A.current),A.current=null,ie.current=null},Ot=e=>{let t=S.current?.getRootNode();if(t instanceof ShadowRoot){t.append(e);return}document.body.append(e)},kt=()=>{P.current?.(),P.current=null,de.current!=null&&(clearTimeout(de.current),de.current=null),F.current=!1,le.current=null,ue.current=null,I.current!=null&&(I.current.setAttribute(`draggable`,`true`),I.current.style.removeProperty(`touch-action`),I.current=null),Et(),Tt(),Dt(),ae.current=null},At=(e,n)=>{let r=S.current?.getRootNode(),i=Zo(Yo(r instanceof ShadowRoot?r:document,e,n));return t.setDragTarget(i),t.getDragSession()?.target??null},jt=e=>{let n=t.getDragAndDropConfig()?.openOnDropDelay??800;if(e==null||e.kind!==`directory`||e.directoryPath==null||n<=0){Tt();return}let r=t.getItem(e.directoryPath),i=rs(r)?r:null;if(i==null||i.isExpanded()){Tt();return}let a=`${e.directoryPath}::${e.flattenedSegmentPath??``}`;j.current!==a&&(Tt(),j.current=a,M.current=setTimeout(()=>{let n=t.getDragSession()?.target;n?.kind!==`directory`||n.directoryPath!==e.directoryPath||n.flattenedSegmentPath!==e.flattenedSegmentPath||i.expand()},n))},Mt=()=>{A.current=null;let e=ie.current,n=C.current;if(e==null||n==null||t.getDragSession()==null)return;let r=n.getBoundingClientRect(),i=es(e.clientY,r);if(i===0)return;let a=Math.max(0,n.scrollHeight-n.clientHeight),o=Math.max(0,Math.min(a,n.scrollTop+i));o!==n.scrollTop&&(n.scrollTop=o,T.current()),jt(At(e.clientX,e.clientY)),A.current=Ct(Mt)},Nt=(e,t)=>{ie.current={clientX:e,clientY:t},A.current??=Ct(Mt)},Pt=(e,n,r)=>{let i=e.currentTarget;if(i!=null){if(kt(),Et(),Tt(),Dt(),t.startDrag(r)===!1){e.preventDefault();return}if(ae.current=n,e.dataTransfer!=null&&(e.dataTransfer.effectAllowed=`move`,e.dataTransfer.dropEffect=`move`,e.dataTransfer.setData(`text/plain`,r),$o())){let t=Qo(i),n=i.getBoundingClientRect();Object.assign(t.style,{height:`${n.height}px`,opacity:`0.85`,transform:`translate3d(-9999px, 0px, 0)`,width:`${n.width}px`}),Ot(t),N.current=t,e.dataTransfer.setDragImage(t,Math.max(0,e.clientX-n.left),Math.max(0,e.clientY-n.top))}}},Ft=()=>{Et(),Tt(),Dt(),ae.current=null,t.cancelDrag()},It=(e,n,r)=>{if(de.current!=null||F.current)return;let i=e.touches[0],a=e.currentTarget;if(i==null||a==null)return;ue.current={clientX:i.clientX,clientY:i.clientY},I.current=a,a.setAttribute(`draggable`,`false`);let o=(e={})=>{let t=e.restoreNativeDraggable??!F.current;de.current!=null&&(clearTimeout(de.current),de.current=null),document.removeEventListener(`touchmove`,s),document.removeEventListener(`touchend`,c),document.removeEventListener(`touchcancel`,c),P.current===o&&(P.current=null),t&&(a.setAttribute(`draggable`,`true`),I.current===a&&(I.current=null),ue.current=null)},s=e=>{let t=e.touches[0],n=ue.current;if(t==null||n==null)return;let r=t.clientX-n.clientX,i=t.clientY-n.clientY;r*r+i*i<=Ko*Ko||o()},c=()=>{o()};document.addEventListener(`touchmove`,s,{passive:!0}),document.addEventListener(`touchend`,c),document.addEventListener(`touchcancel`,c),P.current=o,de.current=setTimeout(()=>{if(o({restoreNativeDraggable:!1}),t.startDrag(r)===!1){a.setAttribute(`draggable`,`true`),I.current===a&&(I.current=null),ue.current=null;return}F.current=!0,I.current=a,a.setAttribute(`draggable`,`false`),a.style.setProperty(`touch-action`,`none`),ae.current=n;let e=a.getBoundingClientRect(),s=Qo(a);Object.assign(s.style,{height:`${e.height}px`,opacity:`0.85`,transform:`translate3d(${e.left}px, ${e.top}px, 0)`,width:`${e.width}px`}),Ot(s),N.current=s,le.current={x:i.clientX-e.left,y:i.clientY-e.top};let c=e=>{let t=e.touches[0];if(t==null)return;e.preventDefault();let n=le.current;n!=null&&N.current!=null&&(N.current.style.transform=`translate3d(${t.clientX-n.x}px, ${t.clientY-n.y}px, 0)`),jt(At(t.clientX,t.clientY)),Nt(t.clientX,t.clientY)},l=e=>{let n=e.changedTouches[0];n!=null&&At(n.clientX,n.clientY),t.completeDrag(),kt()},u=()=>{t.cancelDrag(),kt()};P.current=()=>{document.removeEventListener(`touchmove`,c),document.removeEventListener(`touchend`,l),document.removeEventListener(`touchcancel`,u)},document.addEventListener(`touchmove`,c,{passive:!1}),document.addEventListener(`touchend`,l),document.addEventListener(`touchcancel`,u)},Go)},Lt=e=>{if(R!=null){if(e.key===`Escape`){_t(),e.preventDefault(),e.stopPropagation();return}fs.has(e.key)&&(e.preventDefault(),e.stopPropagation());return}if(Ke.isActive()){if(e.key===`Escape`)Ke.cancel();else if(e.key===`Enter`)Ke.commit();else return;xe(`focus`),pe(e=>e+1),e.preventDefault(),e.stopPropagation();return}if(l&&e.key===`F2`){bt(H??void 0),e.preventDefault(),e.stopPropagation();return}if(V){if(e.key===`Escape`)O.current=!1,k.current=null,t.closeSearch();else if(e.key===`Enter`){let e=t.getFocusedPath();e!=null&&t.selectOnlyPath(e);let n=C.current,r=os(n,rt);k.current=U<0||n==null?null:Math.max(0,Math.min(U*s-n.scrollTop,Math.max(0,r-s))),O.current=!0,t.closeSearch()}else if(e.key===`ArrowDown`)t.focusNextSearchMatch();else if(e.key===`ArrowUp`)t.focusPreviousSearchMatch();else return;xe(`focus`),pe(e=>e+1),e.preventDefault(),e.stopPropagation();return}if(f&&as(e)){t.openSearch(e.key),pe(e=>e+1),e.preventDefault(),e.stopPropagation();return}let n=t.getFocusedItem();if(n==null)return;let r=rs(n)?n:null,i=!0;if(e.shiftKey&&e.key===`ArrowDown`)t.extendSelectionFromFocused(1);else if(e.shiftKey&&e.key===`ArrowUp`)t.extendSelectionFromFocused(-1);else if(z&&ds(e)&&H!=null&&U>=0){let e=t.getVisibleRows(U,U)[0]??null,n=te.current.get(H)??null;e==null||n==null?i=!1:yt(e,H)}else if((e.ctrlKey||e.metaKey)&&is(e))t.toggleFocusedSelection();else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()===`a`)t.selectAllVisiblePaths();else switch(e.key){case`ArrowDown`:t.focusNextItem();break;case`ArrowUp`:t.focusPreviousItem();break;case`ArrowRight`:r==null||r.isExpanded()?t.focusNextItem():r.expand();break;case`ArrowLeft`:r!=null&&r.isExpanded()?r.collapse():t.focusParentItem();break;case`Home`:t.focusFirstItem();break;case`End`:t.focusLastItem();break;default:i=!1}i&&(xe(`focus`),pe(e=>e+1),e.preventDefault(),e.stopPropagation())};Do(()=>{if(!(!f||!V)){if(De.current){De.current=!1;return}Lo(ee.current)}},[V,f]),Do(()=>{let e=x.current;switch(ao({hasRenderedInput:e!=null,previousRenamingPath:re.current,renamingPath:B})){case`reset`:re.current=null;return;case`reveal-canonical`:B!=null&&xt(B,{restoreTreeFocus:!1,targetOffset:`live-overlay`});return;case`ignore`:return;case`focus-input`:e!=null&&(we.current=null,re.current=B,Lo(e),e.select());return}},[it.end,it.start,B,xt,lt]),Do(()=>{let e=S.current;if(e==null)return;let t=()=>{let t=Ro(e)?.dataset.itemPath??null;he(e=>e===t?e:t)},n=()=>{ne.current=!0,t()},r=n=>{let r=n.relatedTarget;if(r!=null){if(!(r instanceof Node)||!e.contains(r)){ne.current=!1,he(null);return}t()}};return e.addEventListener(`focusin`,n),e.addEventListener(`focusout`,r),()=>{e.removeEventListener(`focusin`,n),e.removeEventListener(`focusout`,r)}},[]),Do(()=>{let e=S.current;e!=null&&(G.physical.scrollTop<=0?e.dataset.scrollAtTop=`true`:delete e.dataset.scrollAtTop)},[G.physical.scrollTop]),Do(()=>{let e=null,n=C.current,r=b.current,i=S.current;if(n==null)return;let a=()=>{let e=t.getVisibleCount(),r=os(n,g),i=Math.max(0,e*s-r);n.scrollTop>i&&(n.scrollTop=i),Ne(Wo({controller:t,itemHeight:s,overscan:c,scrollTop:Math.min(n.scrollTop,i),stickyFolders:h,viewportHeight:r}))};T.current=a;let o=!1,l=t.subscribe(()=>{o?pe(e=>e+1):o=!0,a()}),u=()=>{Ee.current!==!0&&(r!=null&&(r.dataset.isScrolling??=``),i!=null&&(i.dataset.isScrolling??=``),y.current=!0,e!=null&&clearTimeout(e),e=setTimeout(()=>{r!=null&&delete r.dataset.isScrolling,i!=null&&delete i.dataset.isScrolling,y.current=!1,e=null},50))},d=null,f=()=>{i!=null&&delete i.dataset.overlayReveal,d!=null&&(clearTimeout(d),d=null)},p=()=>{i==null||Ee.current===!0||n.scrollTop>0||(i.dataset.overlayReveal=`true`,d!=null&&clearTimeout(d),d=setTimeout(()=>{f()},200))},m=()=>{if(a(),n.scrollTop>0&&f(),Ce.current!=null&&y.current&&gt.current(),Ee.current===!0){y.current=!1;return}ve(e=>e==null?e:null),u()},_=()=>{u(),p()},v=new Set([`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`PageUp`,`PageDown`,`Home`,`End`,` `,`Spacebar`]),x=e=>{v.has(e.key)&&_()};n.addEventListener(`scroll`,m,{passive:!0}),n.addEventListener(`wheel`,_,{passive:!0}),n.addEventListener(`touchmove`,_,{passive:!0}),n.addEventListener(`keydown`,x);let ee=typeof ResizeObserver<`u`?new ResizeObserver(()=>{a()}):null;return ee?.observe(n),()=>{T.current=()=>{},l(),n.removeEventListener(`scroll`,m),n.removeEventListener(`wheel`,_),n.removeEventListener(`touchmove`,_),n.removeEventListener(`keydown`,x),e!=null&&clearTimeout(e),d!=null&&clearTimeout(d),r!=null&&delete r.dataset.isScrolling,i!=null&&(delete i.dataset.isScrolling,delete i.dataset.overlayReveal),y.current=!1,ee?.disconnect()}},[t,g,s,c,h]),Do(()=>{z||R==null||_t(!1)},[_t,z,R]);let Rt=Oo(()=>R==null?null:`${R.path}::${R.source}`,[R]);Do(()=>{if(Rt==null){m?.clearSlotContent(se);return}let t=Ce.current;if(t==null)return;let n=v.current??_.current;if(n==null)return;let r={anchorElement:n,anchorRect:t.anchorRect??ms(n.getBoundingClientRect()),close:e=>{gt.current(e?.restoreFocus??!0)},restoreFocus:()=>{ht.current&&mt.current(Ce.current?.path??null)}},i=e?.contextMenu?.render?.(t.item,r)??null;return m?.setSlotContent(se,i),e?.contextMenu?.onOpen?.(t.item,r),ws(i),queueMicrotask(()=>{i==null||!i.isConnected||document.activeElement===i&&ws(i)}),()=>{m?.clearSlotContent(se)}},[Rt,e?.contextMenu,m]),Do(()=>{R!=null&&t.getItem(R.path)==null&&_t()},[_t,R,t]),Do(()=>{if(R==null)return;let e=S.current?.getRootNode(),t=e instanceof ShadowRoot?e.host:S.current,n=e=>{let n=e.target;n instanceof Node&&(ps(e)||_.current?.contains(n)!==!0&&t?.contains(n)!==!0&&_t())},r=e=>{e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),_t())};return document.addEventListener(`mousedown`,n,!0),document.addEventListener(`keydown`,r,!0),()=>{document.removeEventListener(`mousedown`,n,!0),document.removeEventListener(`keydown`,r,!0)}},[_t,R]),Do(()=>{let e=C.current,t=S.current;if(e==null||t==null){E.current=H;return}let n=H==null?null:te.current.get(H)??null,r=Ro(t),i=r?.dataset.itemPath??null,a=qe&&x.current===r,o=f&&ee.current===r,c=O.current&&!V,l=k.current??0,u=we.current,d=r!=null,p=ne.current||d,m=E.current!==H,h=c&&cs(e,U,s,rt,st,l);if((u!=null&&u===H&&cs(e,U,s,rt,st,ct)||h||p&&m&&u!==H&&ss(e,U,s,rt,ct))&&T.current(),!p){E.current=H;return}if(a){E.current=H;return}if(o&&!c){E.current=H;return}if(n==null){c&&U>=0&&(cs(e,U,s,rt,st,l),T.current()),E.current=H;return}(m||c||u===H||i==null||i!==H)&&(Lo(n),u===H&&(we.current=null),O.current=!1,k.current=null),E.current=H},[t,U,H,ut,s,qe,V,it,rt,f,ct,st,nt]);let zt=Le&&ne.current===!0?H:null,Bt=be===`pointer`?_e:null,Vt=R?.path??Te.current??Bt??zt??_e,Ht=R?.source===`right-click`;Do(()=>{vt(Ue(Vt))},[Ue,it,rt,at,Vt,vt,nt]);let Ut=ko(e=>{if(y.current||ps(e))return;let t=e.target;if(!(t instanceof HTMLElement)||t.closest?.(`[data-type="context-menu-trigger"]`)!=null)return;let n=t.closest?.(`[data-file-tree-sticky-row="true"]`),r=t.closest?.(`[data-type="item"]`),i=n instanceof HTMLElement?n.dataset.fileTreeStickyPath??null:r instanceof HTMLElement?r.dataset.itemPath??null:null;i!=null&&xe(e=>e===`pointer`?e:`pointer`),ve(e=>e===i?e:i)},[]),Wt=ko(()=>{ve(null)},[]);Do(()=>{if(!Ye)return;let e=()=>{kt(),t.cancelDrag()};return window.addEventListener(`dragend`,e),()=>{window.removeEventListener(`dragend`,e),kt(),t.cancelDrag()}},[t,Ye]);let Gt=e=>{if(!Ye||t.getDragSession()==null||F.current)return;let n=Zo(e.target instanceof HTMLElement?e.target:null);t.setDragTarget(n),jt(t.getDragSession()?.target??null),Nt(e.clientX,e.clientY),e.dataTransfer!=null&&(e.dataTransfer.dropEffect=`move`),e.preventDefault()},Kt=e=>{if(!Ye||t.getDragSession()==null||F.current)return;let n=e.relatedTarget;n instanceof Node&&S.current?.contains(n)===!0||(Tt(),Dt(),t.setDragTarget(null))},qt=e=>{!Ye||t.getDragSession()==null||F.current||(e.preventDefault(),At(e.clientX,e.clientY),t.completeDrag(),Et(),Tt(),Dt(),ae.current=null)},Jt=G.window.height,Yt=G.window.offsetTop,Xt=Math.min(0,rt-Jt-ct),Zt=me===H||O.current,Qt=H!=null&&Zt&&!ut&&U>=0?nt[U]??t.getVisibleRows(U,U)[0]??null:null,$t=Qt==null?null:ls(U,s,it,Jt),en=ae.current,tn=Qe!=null&&en!=null&&en.path===Qe&&en.index>=it.start&&en.index<=it.end,nn=Qe!=null&&en!=null&&en.path===Qe&&!tn&&en.path!==Qt?.path?en:null,rn=nn==null?null:ls(nn.index,s,it,Jt),an=us((U>=0?nt[U]??t.getVisibleRows(U,U)[0]??null:null)?.ancestorPaths.at(-1)??null),on=V&&H!=null?xs(o,H,!ut):void 0,sn=R?.path??(V?H:me),cn=R?.path??_e,ln=Ue(Vt),un=z&&Le&&!Ht&&!qe&&ln!=null&&ye!=null&&Vt!=null,dn=z&&(un||R!=null),fn=R?.anchorRect,pn=fn==null&&ln!=null&&ye!=null&&(R!=null||un)?ye:null,mn=fn==null?pn==null?void 0:{top:`${pn}px`}:{left:`${fn.left}px`,position:`fixed`,right:`auto`,top:`${fn.top}px`},hn=Ht?{opacity:`0`}:void 0,gn=ko((e,n,r,i)=>{let a=t.getItem(r),o=so({event:{ctrlKey:e.ctrlKey,metaKey:e.metaKey,shiftKey:e.shiftKey},isDirectory:n.kind===`directory`,isSearchOpen:t.isSearchOpen(),mode:i});switch(o.selection.kind){case`range`:t.selectPathRange(r,o.selection.additive);break;case`toggle`:t.togglePathSelectionFromInput(r);break;case`single`:t.selectOnlyPath(r);break}let s=e.currentTarget instanceof HTMLElement?e.currentTarget:null,c=n.index>=G.visible.startIndex&&n.index<=G.visible.endIndex,l=i===`flow`&&c&&s!=null&&s.dataset.itemParked!==`true`;a?.focus(),l&&(ne.current=!0,he(e=>e===r?e:r),xe(`focus`)),o.toggleDirectory&&rs(a)&&a.toggle(),o.closeSearch&&t.closeSearch(),o.revealCanonical&&xt(r,{targetOffset:`sticky-parents`})},[t,G.visible.endIndex,G.visible.startIndex,xt]),_n=()=>{if(!Le||Vt==null||ln==null)return;let e=t.getItem(Vt);e!=null&&(vt(ln),ht.current=!0,Se({anchorRect:null,item:{kind:e.isDirectory()?`directory`:`file`,name:ln.getAttribute(`aria-label`)??Vt,path:e.getPath()},path:e.getPath(),source:`button`}))},vn={contextHoverPath:cn,contextMenuButtonTriggerEnabled:Le,contextMenuButtonVisibility:Re,contextMenuEnabled:z,contextMenuRightClickEnabled:ze,contextMenuTriggerMode:Ie,controller:t,directoriesWithGitChanges:i,dragAndDropEnabled:Ye,draggedPathSet:W,dragTarget:Ze,gitLaneActive:We,gitStatusByPath:n,handleRowDragEnd:Ft,handleRowDragStart:Pt,handleRowTouchStart:It,ignoredGitDirectories:r,ignoredInheritanceCache:fe,instanceId:o,itemHeight:s,onKeyDown:Lt,onRowClick:gn,openContextMenuForRow:yt,registerButton:Be,registerRenameInput:He,renameView:Ke,renderDecorationForRow:dt,resolveIcon:Ge,shouldSuppressContextMenu:St,visualFocusPath:sn},yn={...vn,registerButton:Ve};return X(`div`,{ref:S,id:$e,"data-file-tree-context-menu-button-visibility":z&&Le?Re:void 0,"data-file-tree-context-menu-trigger-mode":z?Ie:void 0,"data-file-tree-has-context-menu-action-lane":z&&Le?`true`:void 0,"data-file-tree-has-git-lane":We?`true`:void 0,"data-file-tree-virtualized-root":`true`,onDragLeave:Ye?Kt:void 0,onDragOver:Ye?Gt:void 0,onDrop:Ye?qt:void 0,onKeyDown:Lt,onPointerLeave:z?Wt:void 0,onPointerOver:z?Ut:void 0,role:`tree`,tabIndex:-1,style:{outline:`none`,position:`relative`},children:[X(`style`,{"data-file-tree-guide-style":`true`,dangerouslySetInnerHTML:{__html:an}}),X(`slot`,{name:oe,"data-type":`header-slot`}),f?X(`div`,{"data-file-tree-search-container":!0,"data-open":V?`true`:`false`,children:X(`input`,{ref:ee,"aria-activedescendant":on,"aria-controls":$e,placeholder:`Search…`,"data-file-tree-search-input":!0,"data-file-tree-search-input-fake-focus":Oe?`true`:void 0,value:Je,onBlur:()=>{d===`retain`&&!Ae.current||t.closeSearch()},onFocus:je,onPointerDown:je,onInput:e=>{je();let n=e.currentTarget;t.setSearch(n.value)}})}):null,X(`div`,{ref:C,"data-file-tree-virtualized-scroll":`true`,children:[h&&Pe&&at.length>0?X(`div`,{"aria-hidden":`true`,"data-file-tree-sticky-overlay":`true`,children:X(`div`,{"data-file-tree-sticky-overlay-content":`true`,style:{height:`${et}px`},children:at.map((e,t)=>Es(yn,e.row,`sticky:${Vo(e.row)}`,{mode:`sticky`,style:{left:`0`,position:`absolute`,right:`0`,top:`${e.top}px`,zIndex:`${at.length-t}`}}))})}):null,X(`div`,{ref:b,"data-file-tree-virtualized-list":`true`,style:{height:`${st}px`},children:[X(`div`,{"data-file-tree-virtualized-sticky-offset":`true`,"aria-hidden":`true`,style:{height:`${Yt}px`}}),X(`div`,{"data-file-tree-virtualized-sticky":`true`,style:{height:`${Jt}px`,top:`${Xt}px`,bottom:`${Xt}px`},children:[Ds(vn,it,lt),Qt!=null&&$t!=null?Es(vn,Qt,`parked:${Qt.path}`,{isParked:!0,style:{left:`0`,opacity:`0`,pointerEvents:Qe===Qt.path?`none`:void 0,position:`absolute`,right:`0`,top:`${$t}px`}}):null,nn!=null&&rn!=null?Es(vn,nn,`parked-drag:${nn.path}`,{isParked:!0,style:{left:`0`,opacity:`0`,pointerEvents:`none`,position:`absolute`,right:`0`,top:`${rn}px`}}):null]})]})]}),z?X(`div`,{ref:_,"data-type":`context-menu-anchor`,"data-visible":dn?`true`:`false`,style:mn,children:[X(`button`,{ref:v,type:`button`,"data-type":ce,"aria-label":`Options`,"aria-haspopup":`menu`,"aria-expanded":R==null?`false`:`true`,"data-visible":un?`true`:`false`,onMouseDown:e=>{e.preventDefault()},onClick:e=>{if(e.preventDefault(),e.stopPropagation(),R!=null){_t();return}_n()},tabIndex:-1,style:hn,children:X(ja,{...Ge(`file-tree-icon-ellipsis`)})}),R==null?null:X(`slot`,{name:se})]}):null,R==null?null:X(`div`,{"data-type":`context-menu-wash`,"aria-hidden":`true`,onMouseDownCapture:e=>{e.preventDefault(),_t()},onTouchStartCapture:e=>{e.preventDefault(),e.stopPropagation(),_t()},onTouchMoveCapture:e=>{e.preventDefault(),e.stopPropagation()},onWheelCapture:e=>{e.preventDefault(),e.stopPropagation()}})]})}var ks={hydrateRoot:(e,t)=>{Ea(na(Os,t),e)},renderRoot:(e,t)=>{Ta(na(Os,t),e)},unmountRoot:e=>{Ta(null,e)}};function As(e,t){ks.renderRoot(e,t)}function js(e,t){ks.hydrateRoot(e,t)}function Ms(e){ks.unmountRoot(e)}var Ns=class{#e=new Map;#t=null;clearAll(){for(let e of this.#e.values())e.remove();this.#e.clear()}clearSlotContent(e){let t=this.#n(e);t!=null&&(t.remove(),this.#e.delete(e))}setHost(e){if(this.#t=e,e!=null){this.#i(e);for(let[e,t]of this.#e)this.#r(e,t)}}setSlotContent(e,t){let n=this.#n(e);if(n===t){t!=null&&(this.#e.set(e,t),this.#r(e,t));return}if(n?.remove(),t==null){this.#e.delete(e);return}this.#e.set(e,t),this.#r(e,t)}setSlotHtml(e,t){let n=t?.trim()??``;if(n.length===0){this.setSlotContent(e,null);return}let r=this.#n(e);if(r!=null&&r.innerHTML===n){this.#e.set(e,r),this.#r(e,r);return}let i=document.createElement(`div`);i.innerHTML=n,this.setSlotContent(e,i)}#n(e){let t=this.#e.get(e)??null;if(t!=null)return t;let n=this.#t;if(n==null)return null;for(let t of Array.from(n.children))if(t instanceof HTMLElement&&t.dataset.fileTreeManagedSlot===e)return t;return null}#r(e,t){t.slot=e,t.dataset.fileTreeManagedSlot=e,this.#t!=null&&t.parentNode!==this.#t&&this.#t.appendChild(t)}#i(e){for(let t of Array.from(e.children)){if(!(t instanceof HTMLElement))continue;let e=t.dataset.fileTreeManagedSlot;e==null||this.#e.has(e)||this.#e.set(e,t)}}},Ps=`__c`,Fs=`__k`,Is=`__d`,Ls=`__s`,Rs=/[\s\n\\/='"\0<>]/,zs=/^(xlink|xmlns|xml)([A-Z])/,Bs=/^(?:accessK|auto[A-Z]|cell|ch|col|cont|cross|dateT|encT|form[A-Z]|frame|hrefL|inputM|maxL|minL|noV|playsI|popoverT|readO|rowS|src[A-Z]|tabI|useM|item[A-Z])/,Vs=/^ac|^ali|arabic|basel|cap|clipPath$|clipRule$|color|dominant|enable|fill|flood|font|glyph[^R]|horiz|image|letter|lighting|marker[^WUH]|overline|panose|pointe|paint|rendering|shape|stop|strikethrough|stroke|text[^L]|transform|underline|unicode|units|^v[^i]|^w|^xH/,Hs=new Set([`draggable`,`spellcheck`]);function Us(e){e.__g===void 0?e[Is]=!0:e.__g|=8}function Ws(e){e.__g===void 0?e[Is]=!1:e.__g&=-9}function Gs(e){return e.__g===void 0?!0===e[Is]:!!(8&e.__g)}var Ks=/["&<]/;function qs(e){if(e.length===0||!1===Ks.test(e))return e;for(var t=0,n=0,r=``,i=``;n<e.length;n++){switch(e.charCodeAt(n)){case 34:i=`&quot;`;break;case 38:i=`&amp;`;break;case 60:i=`&lt;`;break;default:continue}n!==t&&(r+=e.slice(t,n)),r+=i,t=n+1}return n!==t&&(r+=e.slice(t,n)),r}var Js={},Ys=new Set(`animation-iteration-count.border-image-outset.border-image-slice.border-image-width.box-flex.box-flex-group.box-ordinal-group.column-count.fill-opacity.flex.flex-grow.flex-negative.flex-order.flex-positive.flex-shrink.flood-opacity.font-weight.grid-column.grid-row.line-clamp.line-height.opacity.order.orphans.stop-opacity.stroke-dasharray.stroke-dashoffset.stroke-miterlimit.stroke-opacity.stroke-width.tab-size.widows.z-index.zoom`.split(`.`)),Xs=/[A-Z]/g;function Zs(e){var t=``;for(var n in e){var r=e[n];if(r!=null&&r!==``){var i=n[0]==`-`?n:Js[n]||(Js[n]=n.replace(Xs,`-$&`).toLowerCase()),a=`;`;typeof r!=`number`||i.startsWith(`--`)||Ys.has(i)||(a=`px;`),t=t+i+`:`+r+a}}return t||void 0}function Qs(){this.__d=!0}function $s(e,t){return{__v:e,context:t,props:e.props,setState:Qs,forceUpdate:Qs,__d:!0,__h:[]}}function ec(e,t,n){if(!e.s){if(n instanceof tc){if(!n.s)return void(n.o=ec.bind(null,e,t));1&t&&(t=n.s),n=n.v}if(n&&n.then)return void n.then(ec.bind(null,e,t),ec.bind(null,e,2));e.s=t,e.v=n;let r=e.o;r&&r(e)}}var tc=function(){function e(){}return e.prototype.then=function(t,n){var r=new e,i=this.s;if(i){var a=1&i?t:n;if(a){try{ec(r,1,a(this.v))}catch(e){ec(r,2,e)}return r}return this}return this.o=function(e){try{var i=e.v;1&e.s?ec(r,1,t?t(i):i):n?ec(r,1,n(i)):ec(r,2,i)}catch(e){ec(r,2,e)}},r},e}(),nc,rc,ic,ac,oc={},sc=Array.isArray,cc=Object.assign,lc=``,uc=`<!--$s-->`,dc=`<!--/$s-->`;function fc(e,t){var n,r=e.type,i=!0;return e[Ps]?(i=!1,(n=e[Ps]).state=n[Ls]):n=new r(e.props,t),e[Ps]=n,n.__v=e,n.props=e.props,n.context=t,Us(n),n.state??=oc,n[Ls]??(n[Ls]=n.state),r.getDerivedStateFromProps?n.state=cc({},n.state,r.getDerivedStateFromProps(n.props,n.state)):i&&n.componentWillMount?(n.componentWillMount(),n.state=n[Ls]===n.state?n.state:n[Ls]):!i&&n.componentWillUpdate&&n.componentWillUpdate(),ic&&ic(e),n.render(n.props,n.state,t)}function pc(e,t,n,r,i,a,o){if(e==null||!0===e||!1===e||e===lc)return lc;var s=typeof e;if(s!=`object`)return s==`function`?lc:s==`string`?qs(e):e+lc;if(sc(e)){var c,l=lc;i[Fs]=e;for(var u=e.length,d=0;d<u;d++){var f=e[d];if(f!=null&&typeof f!=`boolean`){var p,m=pc(f,t,n,r,i,a,o);typeof m==`string`?l+=m:(c||=Array(u),l&&c.push(l),l=lc,sc(m)?(p=c).push.apply(p,m):c.push(m))}}return c?(l&&c.push(l),c):l}if(e.constructor!==void 0)return lc;e.__=i,nc&&nc(e);var h=e.type,g=e.props;if(typeof h==`function`){var _,v,y,b=t;if(h===ia){if(`tpl`in g){for(var x=lc,S=0;S<g.tpl.length;S++)if(x+=g.tpl[S],g.exprs&&S<g.exprs.length){var C=g.exprs[S];if(C==null)continue;typeof C!=`object`||C.constructor!==void 0&&!sc(C)?x+=C:x+=pc(C,t,n,r,e,a,o)}return x}if(`UNSTABLE_comment`in g)return`<!--`+qs(g.UNSTABLE_comment)+`-->`;v=g.children}else{if((_=h.contextType)!=null){var ee=t[_.__c];b=ee?ee.props.value:_.__}var te=h.prototype&&typeof h.prototype.render==`function`;if(te)v=fc(e,b),y=e[Ps];else{e[Ps]=y=$s(e,b);for(var w=0;Gs(y)&&w++<25;){Ws(y),ic&&ic(e);try{v=h.call(y,g,b)}catch(t){throw a&&t&&typeof t.then==`function`&&(e._suspended=!0),t}}Us(y)}if(y.getChildContext!=null&&(t=cc({},t,y.getChildContext())),te&&Y.errorBoundaries&&(h.getDerivedStateFromError||y.componentDidCatch)){v=v!=null&&v.type===ia&&v.key==null&&v.props.tpl==null?v.props.children:v;try{return pc(v,t,n,r,e,a,!1)}catch(i){return h.getDerivedStateFromError&&(y[Ls]=h.getDerivedStateFromError(i)),y.componentDidCatch&&y.componentDidCatch(i,oc),Gs(y)?(v=fc(e,t),(y=e[Ps]).getChildContext!=null&&(t=cc({},t,y.getChildContext())),pc(v=v!=null&&v.type===ia&&v.key==null&&v.props.tpl==null?v.props.children:v,t,n,r,e,a,o)):lc}finally{rc&&rc(e),ac&&ac(e)}}}v=v!=null&&v.type===ia&&v.key==null&&v.props.tpl==null?v.props.children:v;try{var T=pc(v,t,n,r,e,a,o);return rc&&rc(e),Y.unmount&&Y.unmount(e),e._suspended?typeof T==`string`?uc+T+dc:sc(T)?(T.unshift(uc),T.push(dc),T):T.then(function(e){return uc+e+dc}):T}catch(i){if(!a&&o&&o.onError){var ne=function i(s){return o.onError(s,e,function(e,s){try{return pc(e,t,n,r,s,a,o)}catch(e){return i(e)}})}(i);if(ne!==void 0)return ne;var E=Y.__e;return E&&E(i,e),lc}if(!a||!i||typeof i.then!=`function`)throw i;return i.then(function i(){try{var s=pc(v,t,n,r,e,a,o);return e._suspended?uc+s+dc:s}catch(e){if(!e||typeof e.then!=`function`)throw e;return e.then(i)}})}}var D,re=`<`+h,O=lc;for(var k in g){var A=g[k];if(typeof(A=hc(A)?A.value:A)!=`function`||k===`class`||k===`className`){switch(k){case`children`:D=A;continue;case`key`:case`ref`:case`__self`:case`__source`:continue;case`htmlFor`:if(`for`in g)continue;k=`for`;break;case`className`:if(`class`in g)continue;k=`class`;break;case`defaultChecked`:k=`checked`;break;case`defaultSelected`:k=`selected`;break;case`defaultValue`:case`value`:switch(k=`value`,h){case`textarea`:D=A;continue;case`select`:r=A;continue;case`option`:r!=A||`selected`in g||(re+=` selected`)}break;case`dangerouslySetInnerHTML`:O=A&&A.__html;continue;case`style`:typeof A==`object`&&(A=Zs(A));break;case`acceptCharset`:k=`accept-charset`;break;case`httpEquiv`:k=`http-equiv`;break;default:if(zs.test(k))k=k.replace(zs,`$1:$2`).toLowerCase();else{if(Rs.test(k))continue;k[4]!==`-`&&!Hs.has(k)||A==null?n?Vs.test(k)&&(k=k===`panose1`?`panose-1`:k.replace(/([A-Z])/g,`-$1`).toLowerCase()):Bs.test(k)&&(k=k.toLowerCase()):A+=lc}}A!=null&&!1!==A&&(re=!0===A||A===lc?re+` `+k:re+` `+k+`="`+(typeof A==`string`?qs(A):A+lc)+`"`)}}if(Rs.test(h))throw Error(h+` is not a valid HTML tag name in `+re+`>`);if(O||(typeof D==`string`?O=qs(D):D!=null&&!1!==D&&!0!==D&&(O=pc(D,t,h===`svg`||h!==`foreignObject`&&n,r,e,a,o))),rc&&rc(e),ac&&ac(e),!O&&mc.has(h))return re+`/>`;var j=`</`+h+`>`,M=re+`>`;return sc(O)?[M].concat(O,[j]):typeof O==`string`?M+O+j:[M,O,j]}var mc=new Set([`area`,`base`,`br`,`col`,`command`,`embed`,`hr`,`img`,`input`,`keygen`,`link`,`meta`,`param`,`source`,`track`,`wbr`]);function hc(e){return typeof e==`object`&&!!e&&typeof e.peek==`function`&&`value`in e}var gc=0;function _c(e){return e!=null&&e.length>0?e:(gc+=1,`pst_ft_${gc}`)}function vc({initialVisibleRowCount:e,itemHeight:t}){return e==null?420:Math.max(0,e)*(t??ge)}function yc(e){if(typeof document>`u`)return;let t=document.createElement(`div`);t.innerHTML=e;let n=t.querySelector(`svg`);return n instanceof SVGElement?n:void 0}function bc(e){return e.querySelector(`#file-tree-icon-chevron`)instanceof SVGElement&&e.querySelector(`#file-tree-icon-file`)instanceof SVGElement&&e.querySelector(`#file-tree-icon-dot`)instanceof SVGElement&&e.querySelector(`#file-tree-icon-lock`)instanceof SVGElement}function xc(e){return Array.from(e.children).filter(e=>e instanceof SVGElement)}var Sc=class{static LoadedCustomComponent=!0;#e;#t;#n;#r;#i;#a;#o;#s;#c;#l=new Ns;#u;#d;#f;#p;#m;#h;#g;#_;#v;#y=null;#b;#x=!1;#S=!1;constructor(e){let{composition:t,density:n,fileTreeSearchMode:r,gitStatus:i,id:a,initialSearchQuery:o,icons:s,itemHeight:c,onSearchChange:l,onSelectionChange:u,overscan:d,renderRowDecoration:f,renaming:p,search:m,searchBlurBehavior:h,searchFakeFocus:g,stickyFolders:_,unsafeCSS:v,initialVisibleRowCount:y,...b}=e;this.#e=t,this.#n=_c(a),this.#p=Bi(i),this.#m=s,this.#h=v,this.#r=u,this.#i=f,this.#a=p!=null&&p!==!1,this.#o=h,this.#s=m===!0,this.#c=g===!0,this.#u=he(n,c),this.#d={itemHeight:this.#u.itemHeight,overscan:d,stickyFolders:_,initialVisibleRowCount:y},this.#t=new Fi({...b,fileTreeSearchMode:r,initialSearchQuery:o,onSearchChange:l,renaming:p}),this.#v=this.#t.getSelectionVersion(),this.#y=this.#r==null?null:this.subscribe(()=>{this.#O()})}unmount(){this.#b!=null&&(Ms(this.#b),delete this.#b.dataset.fileTreeVirtualizedWrapper,this.#b=void 0),this.#l.clearAll(),this.#l.setHost(null),this.#f!=null&&(delete this.#f.dataset.fileTreeVirtualized,this.#L(this.#f),this.#f=void 0)}cleanUp(){this.unmount(),this.#y?.(),this.#y=null,this.#t.destroy()}getFileTreeContainer(){return this.#f}getItem(e){return this.#t.getItem(e)}getFocusedItem(){return this.#t.getFocusedItem()}getFocusedPath(){return this.#t.getFocusedPath()}getSelectedPaths(){return this.#t.getSelectedPaths()}getVisibleCount(){return this.#t.getVisibleCount()}getScrollTop(){return this.#E()?.scrollTop??0}setScrollTop(e){let t=this.#E();t!=null&&(t.scrollTop=Math.max(0,e))}getScrollMetrics(){let e=this.#E();return e==null?null:{clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,scrollTop:e.scrollTop}}subscribeToScroll(e){let t=this.#E();if(t==null)return()=>{};let n=()=>{e(t.scrollTop)};return t.addEventListener(`scroll`,n,{passive:!0}),()=>{t.removeEventListener(`scroll`,n)}}getComposition(){return this.#e}getItemHeight(){return this.#u.itemHeight}getDensityFactor(){return this.#u.factor}subscribe(e){let t=!1;return this.#t.subscribe(()=>{if(!t){t=!0;return}e()})}focusPath(e){this.#t.focusPath(e)}focusNearestPath(e){return this.#t.focusNearestPath(e)}add(e){this.#t.add(e)}batch(e){this.#t.batch(e)}move(e,t,n){this.#t.move(e,t,n)}onMutation(e,t){return this.#t.onMutation(e,t)}setSearch(e){this.#t.setSearch(e)}openSearch(e){this.#t.openSearch(e)}closeSearch(){this.#t.closeSearch()}isSearchOpen(){return this.#t.isSearchOpen()}getSearchValue(){return this.#t.getSearchValue()}getSearchMatchingPaths(){return this.#t.getSearchMatchingPaths()}focusNextSearchMatch(){this.#t.focusNextSearchMatch()}focusPreviousSearchMatch(){this.#t.focusPreviousSearchMatch()}startRenaming(e,t){return this.#t.startRenaming(e,t)}remove(e,t){this.#t.remove(e,t)}resetPaths(e,t){this.#t.resetPaths(e,t)}setComposition(e){this.#e=e;let t=this.#T();t!=null&&(this.#k(),As(t.wrapper,this.#w()))}setGitStatus(e){this.#p=Bi(e,this.#p);let t=this.#T();t!=null&&As(t.wrapper,this.#w())}setIcons(e){this.#m=e;let t=this.#T();t!=null&&(this.#D(t.host,t.wrapper),As(t.wrapper,this.#w()))}hydrate({fileTreeContainer:e}){let t=this.#F(e),n=this.#P(t);this.#k(),js(n,this.#w())}render({containerWrapper:e,fileTreeContainer:t}){let n=this.#F(t??this.#f,e),r=this.#P(n);this.#k(),As(r,this.#w())}#C(){return{initialViewportHeight:vc({initialVisibleRowCount:this.#d.initialVisibleRowCount,itemHeight:this.#d.itemHeight}),itemHeight:this.#d.itemHeight,overscan:this.#d.overscan,stickyFolders:this.#d.stickyFolders}}#w(){return{composition:this.#e,controller:this.#t,gitStatusByPath:this.#p?.statusByPath,ignoredGitDirectories:this.#p?.ignoredDirectoryPaths,directoriesWithGitChanges:this.#p?.directoriesWithChanges,icons:this.#m,instanceId:this.#n,renamingEnabled:this.#a,renderRowDecoration:this.#i,searchBlurBehavior:this.#o,searchEnabled:this.#s,searchFakeFocus:this.#c,slotHost:this.#l,...this.#C()}}#T(){let e=this.#f,t=this.#b;return e==null||t==null?null:{host:e,wrapper:t}}#E(){return this.#b?.querySelector(`[data-file-tree-virtualized-scroll='true']`)??null}#D(e,t){let n=e.shadowRoot;n!=null&&(this.#A(n),this.#j(n)),this.#M(t)}#O(){let e=this.#r;if(e==null)return;let t=this.#t.getSelectionVersion();t!==this.#v&&(this.#v=t,e(this.#t.getSelectedPaths()))}#k(){let e=this.#e?.header?.render;if(e!=null){this.#l.setSlotContent(oe,e());return}this.#l.setSlotHtml(oe,this.#e?.header?.html??null)}#A(e){let t=xc(e).find(e=>bc(e)),n=yc(ne(E(this.#m).set));n!=null&&(t!=null&&t.outerHTML===n.outerHTML||(t==null?e.prepend(n):t.replaceWith(n)))}#j(e){let t=xc(e),n=t.find(e=>bc(e)),r=t.filter(e=>e!==n),i=E(this.#m).spriteSheet?.trim()??``;if(i.length===0){for(let e of r)e.remove();return}let a=yc(i);if(a==null){for(let e of r)e.remove();return}if(!(r.length===1&&r[0].outerHTML===a.outerHTML)){for(let e of r)e.remove();e.appendChild(a)}}#M(e){let t=E(this.#m);t.colored&&T(t.set)?e.dataset.fileTreeColoredIcons=`true`:delete e.dataset.fileTreeColoredIcons}#N(e){let t=e.querySelector(`style[${M}]`);if(this.#g==null&&t instanceof HTMLStyleElement&&(this.#g=t),this.#h==null||this.#h===``){this.#g?.remove(),this.#g=void 0,this.#_=void 0;return}this.#g?.parentNode===e&&this.#_===this.#h||(this.#g??=document.createElement(`style`),this.#g.setAttribute(M,``),this.#g.parentNode!==e&&e.appendChild(this.#g),this.#g.textContent=L(this.#h),this.#_=this.#h)}#P(e){if(this.#b!=null)return this.#b;let t=e.shadowRoot;if(t==null)throw Error(`FileTree requires a shadow root`);let n=Array.from(t.children).filter(e=>e instanceof HTMLDivElement&&typeof e.dataset.fileTreeId==`string`&&e.dataset.fileTreeId.length>0),r=n.find(e=>e.dataset.fileTreeId===this.#n)??n[0];return r!=null&&(this.#n=r.dataset.fileTreeId??this.#n),this.#b=r??document.createElement(`div`),this.#b.dataset.fileTreeId=this.#n,this.#b.dataset.fileTreeVirtualizedWrapper=`true`,this.#D(e,this.#b),this.#b.parentNode!==t&&t.appendChild(this.#b),this.#b}#F(e,t){let n=e??this.#f??document.createElement(`file-tree-container`);t!=null&&n.parentNode!==t&&t.appendChild(n);let r=n.shadowRoot??n.attachShadow({mode:`open`});return we(n,r),this.#N(r),n.dataset.fileTreeVirtualized=`true`,n.style.display=`flex`,this.#I(n),this.#l.setHost(n),this.#f=n,n}#I(e){e.style.getPropertyValue(`--trees-item-height`)===``&&(e.style.setProperty(`--trees-item-height`,`${String(this.#u.itemHeight)}px`),this.#x=!0),e.style.getPropertyValue(`--trees-density-override`)===``&&(e.style.setProperty(`--trees-density-override`,String(this.#u.factor)),this.#S=!0)}#L(e){this.#x&&=(e.style.removeProperty(`--trees-item-height`),!1),this.#S&&=(e.style.removeProperty(`--trees-density-override`),!1)}};function Cc(e){let t=(0,P.useRef)(null);return t.current??=new Sc(e),(0,P.useEffect)(()=>{let e=t.current;return()=>{e?.cleanUp(),t.current=null}},[]),{model:t.current}}function wc(e){let t=3735928559^e.length,n=1103547991^e.length;for(let r=0;r<e.length;r+=1){let i=e.charCodeAt(r);t=Math.imul(t^i,2654435761),n=Math.imul(n^i,1597334677)}return t=Math.imul(t^t>>>16,2246822507)^Math.imul(n^n>>>13,3266489909),n=Math.imul(n^n>>>16,2246822507)^Math.imul(t^t>>>13,3266489909),`n${(4294967296*(2097151&n)+(t>>>0)).toString(36)}`}function Tc(e){for(let t of e.composedPath()){if(!(t instanceof Element)||t.getAttribute(`data-item-type`)!==`file`)continue;let e=t.getAttribute(`data-item-path`);if(e)return e}return null}function Ec({idPrefix:e,messages:t,onOpenInTarget:n,primaryTarget:r,visibleTargets:i}){return r==null?[]:[{id:`${e}-primary`,message:t.openInTarget,messageValues:{target:r.label},icon:r.icon,onSelect:()=>n(r.target,r.appPath)},{id:`${e}-targets`,message:t.openIn,submenu:i.map(r=>({id:`${e}-target-${r.id}`,message:t.openInTargetSubmenu,messageValues:{target:r.label},icon:r.icon,onSelect:()=>n(r.target,r.appPath)}))}]}function Dc({isLoadingOpenTargets:e=!1,onAddToChat:t,onCopyPath:n,onOpenInTarget:r,primaryTarget:i,targetPath:a,visibleTargets:o}){if(a==null)return[];let s=n==null?`workspace`:`review`,c=[];return n!=null&&c.push({id:`copy-path`,message:g({id:`codex.review.fileTree.contextMenu.copyPath`,defaultMessage:`复制路径`,description:`Context menu action to copy the path of a file tree item`}),onSelect:()=>{n(a)}}),t!=null&&c.push({id:`add-to-chat`,message:g({id:`threadSidePanel.workspaceBrowser.addToChat`,defaultMessage:`添加到聊天`,description:`Context menu action for adding a file from the file tree to the current chat`}),onSelect:()=>{t(a)}}),e?[{id:`open-in-loading`,message:Ac(s),tooltipMessage:g({id:`threadSidePanel.workspaceBrowser.openIn.loading`,defaultMessage:`正在加载可用应用…`,description:`Tooltip shown when the file tree is still loading app options for opening a file`}),enabled:!1},{id:`open-in-separator`,type:`separator`},...c]:i==null?c:[...Ec({idPrefix:Oc(s),messages:kc(s),onOpenInTarget:(e,t)=>{r(e,t,a)},primaryTarget:i,visibleTargets:o}),{id:`open-in-separator`,type:`separator`},...c]}function Oc(e){switch(e){case`review`:return`review-file-tree-open`;case`workspace`:return`workspace-directory-tree-open`}}function kc(e){switch(e){case`review`:return{openInTarget:g({id:`codex.review.fileTree.contextMenu.openInTarget`,defaultMessage:`在 {target} 中打开`,description:`Context menu action to open a review file in the preferred app`}),openIn:Ac(e),openInTargetSubmenu:g({id:`codex.review.fileTree.contextMenu.openWithTarget`,defaultMessage:`{target}`,description:`Context menu action to open a review file in a specific app`})};case`workspace`:return{openInTarget:g({id:`threadSidePanel.workspaceBrowser.openInTarget`,defaultMessage:`在 {target} 中打开`,description:`Context menu action to open a workspace browser file in the preferred app`}),openIn:Ac(e),openInTargetSubmenu:g({id:`threadSidePanel.workspaceBrowser.openInTargetSubmenu`,defaultMessage:`{target}`,description:`Context menu action to open a workspace browser file in a specific app`})}}}function Ac(e){switch(e){case`review`:return g({id:`codex.review.fileTree.contextMenu.openWith`,defaultMessage:`打开方式`,description:`Context menu submenu label for choosing an app to open a review file`});case`workspace`:return g({id:`threadSidePanel.workspaceBrowser.openIn`,defaultMessage:`打开方式…`,description:`Context menu submenu label for choosing an app to open a workspace browser file`})}}var jc=s(x,({get:e,scope:n})=>{if(!(`conversationId`in n.value))return null;let r=e(e(t,n.value.conversationId));return r?.turnId==null?null:{threadId:n.value.conversationId,turnId:r.turnId}}),Mc=a();function Nc(e){let t=(0,Mc.c)(21),{turnId:n,cwd:r,hostId:i,openPath:a}=e,o;t[0]!==r||t[1]!==i||t[2]!==a?(o={cwd:r,hostId:i,isQueryEnabled:!1,openPath:a},t[0]=r,t[1]=i,t[2]=a,t[3]=o):o=t[3];let{data:s}=Ic(o),c=s?.targets,l;t[4]!==r||t[5]!==i||t[6]!==a||t[7]!==c||t[8]!==n?(l={turnId:n,cwd:r,hostId:i,openPath:a,targets:c},t[4]=r,t[5]=i,t[6]=a,t[7]=c,t[8]=n,t[9]=l):l=t[9];let u=Fc(l),d=s?.preferredTarget??null,f;t[10]===s?.targets?f=t[11]:(f=s?.targets??[],t[10]=s?.targets,t[11]=f);let p;t[12]===s?.availableTargets?p=t[13]:(p=s?.availableTargets??[],t[12]=s?.availableTargets,t[13]=p);let m=s?.mode,h=s!=null,g;return t[14]!==u||t[15]!==d||t[16]!==f||t[17]!==p||t[18]!==m||t[19]!==h?(g={preferredTarget:d,targets:f,availableTargets:p,mode:m,hasLoadedTargets:h,open:u},t[14]=u,t[15]=d,t[16]=f,t[17]=p,t[18]=m,t[19]=h,t[20]=g):g=t[20],g}function Pc(e){let t=(0,Mc.c)(20),{cwd:n,delayMs:r,hostId:i,openPath:a}=e,o=r===void 0?0:r,s=o<=0,c=!!(n??a),l;t[0]!==n||t[1]!==i||t[2]!==a||t[3]!==s?(l={cwd:n,hostId:i,isQueryEnabled:s,openPath:a},t[0]=n,t[1]=i,t[2]=a,t[3]=s,t[4]=l):l=t[4];let{data:u,refetch:d}=Ic(l),f;t[5]===d?f=t[6]:(f=()=>{d()},t[5]=d,t[6]=f);let p=(0,P.useEffectEvent)(f),m;t[7]!==c||t[8]!==u||t[9]!==o||t[10]!==p||t[11]!==s?(m=()=>{if(s||!c||u!=null)return;let e=window.setTimeout(p,o);return()=>{window.clearTimeout(e)}},t[7]=c,t[8]=u,t[9]=o,t[10]=p,t[11]=s,t[12]=m):m=t[12];let h;return t[13]!==c||t[14]!==n||t[15]!==u||t[16]!==o||t[17]!==a||t[18]!==s?(h=[c,n,u,o,a,s],t[13]=c,t[14]=n,t[15]=u,t[16]=o,t[17]=a,t[18]=s,t[19]=h):h=t[19],(0,P.useEffect)(m,h),null}function Fc(e){let t=(0,Mc.c)(10),{turnId:r,cwd:i,hostId:a,openPath:s,targets:l}=e,u=o(),d=p(`open-file`),m=c(n),h=c(jc),g;return t[0]!==i||t[1]!==a||t[2]!==d||t[3]!==s||t[4]!==m||t[5]!==u||t[6]!==h||t[7]!==l||t[8]!==r?(g=(e,t)=>{let{appPath:n,openMode:o,persistPreferred:c,line:p,column:g,path:_}=t,v=_??s??i;v&&(l?.find(t=>t.target===e&&(t.appPath??null)===(n??null))?.kind===`editor`&&h!=null&&r!=null&&m.submitCodexAnalyticsEvent?.({action:`open_in_ide`,eventKind:`action`,metadata:{target:e},threadId:h.threadId,turnId:r}),c&&i&&u.setQueryData(f(`open-in-targets`,{cwd:i,hostId:a,path:s}),t=>t&&{...t,preferredTarget:e,targets:t.targets.map(t=>({...t,default:t.target===e?!0:void 0}))}),d.mutate({path:v,cwd:i??null,target:e,...n==null?{}:{appPath:n},...p==null?{}:{line:p},...g==null?{}:{column:g},...o==null?{}:{openMode:o},...c&&i?{persistPreferredTargetPath:i}:{},...a==null?{}:{hostId:a}}))},t[0]=i,t[1]=a,t[2]=d,t[3]=s,t[4]=m,t[5]=u,t[6]=h,t[7]=l,t[8]=r,t[9]=g):g=t[9],g}function Ic(e){let t=(0,Mc.c)(9),{cwd:n,hostId:r,isQueryEnabled:i,openPath:a}=e,o;t[0]!==n||t[1]!==r||t[2]!==a?(o={cwd:n,hostId:r,path:a},t[0]=n,t[1]=r,t[2]=a,t[3]=o):o=t[3];let s=i&&!!(n??a),c;t[4]===s?c=t[5]:(c={enabled:s,staleTime:l.ONE_MINUTE},t[4]=s,t[5]=c);let u;return t[6]!==o||t[7]!==c?(u={params:o,queryConfig:c},t[6]=o,t[7]=c,t[8]=u):u=t[8],d(`open-in-targets`,u)}var Lc=28,Rc=60;function zc(e){let t=(0,Mc.c)(91),{autoHeight:n,cwd:r,flattenEmptyDirectories:i,hostId:a,initialExpandedPaths:s,initialScrollTop:c,onClick:l,onExpandedPathsChange:u,onSelectionChange:d,onStateChange:f,paths:h,revealSelectedPath:g,resetKey:_,selectedPath:v}=e,y=n===void 0?!1:n,x=i===void 0?!1:i,w=c===void 0?0:c,T=g===void 0?!1:g,ne=C(S()),{platform:E}=b(),D=p(`add-context-file`),O=o(),k;t[0]!==r||t[1]!==a?(k={cwd:r,hostId:a},t[0]=r,t[1]=a,t[2]=k):k=t[2];let A=Nc(k),j;t[3]===h?j=t[4]:(j=h.map(Bc),t[3]=h,t[4]=j);let M=j,ie;if(t[5]!==r||t[6]!==h||t[7]!==E){ie=new Map;for(let e of h)typeof e!=`string`&&ie.set(e.displayPath,m(r??``,e.path,E===`windows`));t[5]=r,t[6]=h,t[7]=E,t[8]=ie}else ie=t[8];let N=ie,ae=(0,P.useRef)(null),oe;t[9]===s?oe=t[10]:(oe=Array.from(s??[]),t[9]=s,t[10]=oe);let se=(0,P.useRef)(oe),ce=(0,P.useRef)(null),le=(0,P.useRef)(null),I=(0,P.useRef)(w),ue=(0,P.useRef)(v??null),de;t[11]===f?de=t[12]:(de=()=>{f?.({expandedPaths:se.current,scrollTop:I.current,selectedPath:ue.current})},t[11]=f,t[12]=de);let fe=ee(de),me;t[13]!==u||t[14]!==fe?(me=e=>{se.current=e,u?.(e),fe()},t[13]=u,t[14]=fe,t[15]=me):me=t[15];let he=ee(me),ge;t[16]!==d||t[17]!==fe?(ge=e=>{ue.current=e[0]??null,d?.(e),fe()},t[16]=d,t[17]=fe,t[18]=ge):ge=t[18];let _e=ee(ge),ve;t[19]===v?ve=t[20]:(ve=v==null?void 0:[v],t[19]=v,t[20]=ve);let ye;t[21]!==x||t[22]!==_e||t[23]!==s||t[24]!==ve||t[25]!==M?(ye={fileTreeSearchMode:`hide-non-matches`,flattenEmptyDirectories:x,initialExpandedPaths:s,initialSelectedPaths:ve,itemHeight:Lc,onSelectionChange:_e,paths:M,search:!1,stickyFolders:!0,unsafeCSS:`
      :host {
        --trees-bg-override: var(--color-token-main-surface-primary);
        --trees-bg-muted-override: var(--color-token-list-hover-background);
        --trees-border-color-override: var(--color-token-border);
        --trees-fg-override: var(--color-token-foreground);
        --trees-font-size-override: 13px;
        --trees-focus-ring-color-override: var(--color-token-list-focus-outline);
        --trees-item-padding-x-override: 6px;
        --trees-item-margin-x-override: 0px;
        --trees-level-gap-override: 0px;
        --trees-padding-inline-override: 0px;
        --trees-scrollbar-gutter-override: 0px;
        --trees-scrollbar-gutter-measured: 0px;
        --trees-selected-bg-override: var(--color-token-list-active-selection-background);
        --trees-selected-fg-override: var(--color-token-list-active-selection-foreground);
        --trees-item-row-gap-override: 10px;
      }

      [data-file-tree-sticky-overlay-content='true'],
      [data-file-tree-sticky-row='true'] {
        background-color: var(--color-token-main-surface-primary);
      }

      [data-file-tree-virtualized-scroll='true'] {
        scrollbar-gutter: auto;
      }

      [role="treeitem"] {
        cursor: var(--cursor-interaction) !important;
      }

      [role="treeitem"] * {
        cursor: var(--cursor-interaction) !important;
      }

      [data-item-type='file']:has([data-item-section='content']:empty) {
        display: none;
      }
    `},t[21]=x,t[22]=_e,t[23]=s,t[24]=ve,t[25]=M,t[26]=ye):ye=t[26];let{model:L}=Cc(ye),be;t[27]===L?be=t[28]:(be=()=>L.getVisibleCount(),t[27]=L,t[28]=be);let[xe,R]=(0,P.useState)(be),Se;t[29]!==s||t[30]!==w||t[31]!==L||t[32]!==M?(Se=()=>{let e=null,t=0;se.current=Array.from(s??[]),L.resetPaths(M,{initialExpandedPaths:s}),R(L.getVisibleCount()),ce.current=w>0?w:null;let n=ce.current;if(n==null)return;let r=()=>{if(e=null,ce.current!==n)return;if(L.getScrollMetrics()==null){if(t>=Rc){ce.current=null;return}t+=1,e=window.requestAnimationFrame(r);return}L.setScrollTop(n);let i=L.getScrollMetrics()?.scrollTop??L.getScrollTop();if(I.current=i,qc(i,n)){ce.current=null;return}if(t>=Rc){ce.current=null;return}t+=1,e=window.requestAnimationFrame(r)};return e=window.requestAnimationFrame(r),()=>{e!=null&&window.cancelAnimationFrame(e),ce.current===n&&(ce.current=null)}},t[29]=s,t[30]=w,t[31]=L,t[32]=M,t[33]=Se):Se=t[33];let Ce;t[34]!==s||t[35]!==w||t[36]!==L||t[37]!==_||t[38]!==M?(Ce=[s,w,L,_,M],t[34]=s,t[35]=w,t[36]=L,t[37]=_,t[38]=M,t[39]=Ce):Ce=t[39],(0,P.useEffect)(Se,Ce);let we;t[40]!==L||t[41]!==T||t[42]!==v?(we=()=>{if(ue.current=v??null,Gc(L,v),!T||v==null){le.current=null;return}le.current!==v&&(ce.current=null,Kc(L,v)&&(le.current=v))},t[40]=L,t[41]=T,t[42]=v,t[43]=we):we=t[43];let Te;t[44]!==L||t[45]!==T||t[46]!==v||t[47]!==M?(Te=[L,T,v,M],t[44]=L,t[45]=T,t[46]=v,t[47]=M,t[48]=Te):Te=t[48],(0,P.useEffect)(we,Te);let Ee,De;t[49]!==he||t[50]!==L||t[51]!==M?(Ee=()=>L.subscribe(()=>{R(e=>{let t=L.getVisibleCount();return e===t?e:t}),I.current=L.getScrollTop(),he(Wc(L,M))}),De=[he,L,M],t[49]=he,t[50]=L,t[51]=M,t[52]=Ee,t[53]=De):(Ee=t[52],De=t[53]),(0,P.useEffect)(Ee,De);let Oe,ke;t[54]!==L||t[55]!==fe?(Oe=()=>{let e=null,t=0,n=null,r=e=>{I.current=e;let t=ce.current;if(t!=null)if(qc(e,t))ce.current=null;else if(e===0)return;else ce.current=null;fe()},i=()=>{if(e=null,L.getScrollMetrics()!=null){n=L.subscribeToScroll(r);return}t>=Rc||(t+=1,e=window.requestAnimationFrame(i))};return i(),()=>{e!=null&&window.cancelAnimationFrame(e),n?.()}},ke=[L,fe],t[54]=L,t[55]=fe,t[56]=Oe,t[57]=ke):(Oe=t[56],ke=t[57]),(0,P.useEffect)(Oe,ke);let Ae;t[58]!==r||t[59]!==a?(Ae=(0,F.jsx)(Pc,{cwd:r,hostId:a}),t[58]=r,t[59]=a,t[60]=Ae):Ae=t[60];let je;t[61]!==D||t[62]!==r||t[63]!==A||t[64]!==a||t[65]!==O||t[66]!==N?(je=()=>{let e=Uc(N,ae.current);return Dc({...Vc({cwd:r,fallbackOpenTargets:A,hostId:a,queryClient:O,targetPath:e}),onAddToChat:a==null?void 0:e=>{D.mutateAsync({hostId:a,path:e})},onCopyPath:re,onOpenInTarget:(e,t,n)=>{A.open(e,{appPath:t,persistPreferred:!1,path:n})},targetPath:e})},t[61]=D,t[62]=r,t[63]=A,t[64]=a,t[65]=O,t[66]=N,t[67]=je):je=t[67];let Me;t[68]!==r||t[69]!==a||t[70]!==O||t[71]!==N?(Me=()=>Hc({cwd:r,hostId:a,queryClient:O,targetPath:Uc(N,ae.current)}),t[68]=r,t[69]=a,t[70]=O,t[71]=N,t[72]=Me):Me=t[72];let Ne;t[73]===Symbol.for(`react.memo_cache_sentinel`)?(Ne=e=>{ae.current=Tc(e.nativeEvent)},t[73]=Ne):Ne=t[73];let Pe;t[74]!==y||t[75]!==xe?(Pe=y?{height:`${xe*Lc}px`}:{},t[74]=y,t[75]=xe,t[76]=Pe):Pe=t[76];let Fe;t[77]!==ne||t[78]!==Pe?(Fe={backgroundColor:`var(--color-token-main-surface-primary)`,color:`var(--color-token-foreground)`,colorScheme:ne,...Pe,width:`100%`},t[77]=ne,t[78]=Pe,t[79]=Fe):Fe=t[79];let z;t[80]!==L||t[81]!==l||t[82]!==Fe?(z=(0,F.jsx)(pe,{onClick:l,onContextMenu:Ne,model:L,style:Fe}),t[80]=L,t[81]=l,t[82]=Fe,t[83]=z):z=t[83];let Ie;t[84]!==je||t[85]!==Me||t[86]!==z?(Ie=(0,F.jsx)(te,{awaitBeforeOpen:!1,getItems:je,onBeforeOpen:Me,children:z}),t[84]=je,t[85]=Me,t[86]=z,t[87]=Ie):Ie=t[87];let Le;return t[88]!==Ae||t[89]!==Ie?(Le=(0,F.jsxs)(F.Fragment,{children:[Ae,Ie]}),t[88]=Ae,t[89]=Ie,t[90]=Le):Le=t[90],Le}function Bc(e){return typeof e==`string`?e:e.displayPath}function Vc({cwd:e,fallbackOpenTargets:t,hostId:n,queryClient:r,targetPath:i}){if(i==null)return{isLoadingOpenTargets:!1,primaryTarget:null,visibleTargets:[]};let a=f(`open-in-targets`,{cwd:e,hostId:n,path:i}),o=r.getQueryData(a),s=o?.targets??t.targets,c=o?.availableTargets??t.availableTargets,l=o?.preferredTarget??t.preferredTarget,u=o?.mode??t.mode;return{isLoadingOpenTargets:o==null&&!t.hasLoadedTargets&&r.getQueryState(a)?.status!==`error`,primaryTarget:k({preferredTarget:l,targets:s,availableTargets:c,mode:u}),visibleTargets:O({targets:s,availableTargets:c,includeHiddenTargets:!0,mode:u})}}function Hc({cwd:e,hostId:t,queryClient:n,targetPath:r}){if(r!=null)return n.prefetchQuery({gcTime:l.INFINITE,queryKey:f(`open-in-targets`,{cwd:e,hostId:t,path:r}),queryFn:()=>u(`open-in-targets`,{params:{cwd:e,hostId:t,path:r}}),staleTime:l.ONE_MINUTE})}function Uc(e,t){return t==null?null:e.get(t)??t}function Wc(e,t){let n=[];for(let r of t){if(!r.endsWith(`/`))continue;let t=r.slice(0,-1),i=e.getItem(t);i==null||!Jc(i)||!i.isExpanded()||n.push(t)}return n}function Gc(e,t){let n=e.getSelectedPaths();if(t==null){for(let t of n)e.getItem(t)?.deselect();return}if(!(n.length===1&&n[0]===t)){for(let t of n)e.getItem(t)?.deselect();e.getItem(t)?.select()}}function Kc(e,t){return e.getItem(t)==null?!1:(e.focusPath(t),!0)}function qc(e,t){return Math.abs(e-t)<=1}function Jc(e){return e.isDirectory()}function Yc(e){let t=(0,Mc.c)(22),{inputId:n,inputRef:r,onQueryChange:i,searchQuery:a}=e,o=n===void 0?`file-tree-search`:n,s=_(),c;t[0]===Symbol.for(`react.memo_cache_sentinel`)?(c=(0,F.jsx)(h,{id:`codex.fileTreeSearch.label`,defaultMessage:`筛选文件`,description:`Label for a file tree filter input`}),t[0]=c):c=t[0];let l;t[1]===o?l=t[2]:(l=(0,F.jsx)(`label`,{className:`sr-only`,htmlFor:o,children:c}),t[1]=o,t[2]=l);let u;t[3]===Symbol.for(`react.memo_cache_sentinel`)?(u=(0,F.jsx)(w,{className:`icon-xs ms-2 shrink-0 text-token-input-placeholder-foreground`}),t[3]=u):u=t[3];let d;t[4]===i?d=t[5]:(d=e=>i(e.target.value),t[4]=i,t[5]=d);let f;t[6]===s?f=t[7]:(f=s.formatMessage({id:`codex.fileTreeSearch.placeholder`,defaultMessage:`筛选文件…`,description:`Placeholder text for a file tree filter input`}),t[6]=s,t[7]=f);let p;t[8]!==o||t[9]!==r||t[10]!==a||t[11]!==d||t[12]!==f?(p=(0,F.jsx)(`input`,{id:o,ref:r,className:`w-full appearance-none border-none bg-transparent py-0 ps-0 pe-1.5 text-token-foreground ring-0 outline-none placeholder:text-token-input-placeholder-foreground focus:border-none focus:ring-0 focus:outline-none`,type:`text`,value:a,onChange:d,placeholder:f}),t[8]=o,t[9]=r,t[10]=a,t[11]=d,t[12]=f,t[13]=p):p=t[13];let m;t[14]!==s||t[15]!==i||t[16]!==a.length?(m=a.length>0?(0,F.jsx)(v,{"aria-label":s.formatMessage({id:`codex.fileTreeSearch.clear`,defaultMessage:`清除文件筛选`,description:`Button label to clear a file tree filter input`}),className:`text-token-input-placeholder-foreground hover:text-token-foreground`,color:`ghost`,size:`icon`,onClick:()=>i(``),children:(0,F.jsx)(y,{className:`icon-2xs`})}):null,t[14]=s,t[15]=i,t[16]=a.length,t[17]=m):m=t[17];let g;return t[18]!==l||t[19]!==p||t[20]!==m?(g=(0,F.jsxs)(`div`,{className:`relative flex h-token-button-composer w-full items-center gap-1.5 rounded-lg border border-token-border bg-token-bg-fog text-base leading-[18px]`,children:[l,u,p,m]}),t[18]=l,t[19]=p,t[20]=m,t[21]=g):g=t[21],g}export{jc as a,wc as c,A as d,Nc as i,Cc as l,zc as n,Ec as o,Pc as r,Tc as s,Yc as t,pe as u};
//# sourceMappingURL=file-tree-search-input-Bwn9C7AI.js.map