---
name: nexus-app-maker
description: How to build or update a self-contained sub-app for the Nexus static hub (folder layout, installed_apps.json entry, no-build React + htm, shared Files SDK, per-app config, dockable panels, Electron/Tauri-ready structure). Use whenever the user asks to make, add, port or extend an app for Nexus.
---
# Building an app for Nexus

Nexus is a frontend-only hub: no backend, no bundler. The user runs Windows 8.1 (Electron max v22, Chromium 108), so avoid very new browser APIs and Node-only tooling.

## Layout
```
nexus/  index.html  explorer.html  installed_apps.json
        shared/{theme.css,dock.css,dock.js,prefs.js,config.js}   sdk/portal-sdk.js
        apps/<id>/  index.html  icon.svg  vendor/(react,react-dom,htm)  src/{react.js,host.js,core.js,App.js}
```
Copy `apps/icon-bench/vendor/` into the new app (React 18 UMD + htm, vendored, no CDN).

## Steps
1. Pick a distinctive one-word name (JetBrains style). Create `apps/<id>/` with a 64x64 `icon.svg`.
2. Add an entry to `installed_apps.json`: `{id,name,description,path:"apps/<id>/",icon:"icon.svg",entry:"index.html",route:"#/"}`.
3. `index.html`: link `../../shared/theme.css` and `dock.css`; load `prefs.js`, `config.js`, vendor scripts and `../../sdk/portal-sdk.js` as CLASSIC scripts (the SDK needs `document.currentScript`), then a `<script type="module">` importing `./src/App.js`. Include a "← Nexus" link to `../../`. Use theme variables (`--bg --fg --card --line --acc`).
4. Structure the code for desktop wrapping: `src/core.js` is pure logic (no React, no Portal); `src/react.js` is the only place React/htm come from; `src/host.js` is the only place that touches Portal or NexusConfig (`host.save/open`, `store`). Electron/Tauri swap just those two adapters.
5. Views use `htm`: `html\`<div className="x" onClick=${fn}>…</div>\`` (use `className`, components as `<${Comp}>…<//>`).

## Files (shared explorer in an iframe)
`await Portal.save(blob,'name.ext','AppLabel')` -> `{id,name}|null`; `await Portal.open(['.png','.json'])` -> `{file,blob}|null`; `Portal.browse()`. Never build your own file picker. Files live in IndexedDB; cookies are only for tiny prefs (`NexusPrefs`).

## Config
`NexusConfig.get('<id>',defaults)` / `.set('<id>',obj)` / `.del`. Extra data uses `'<id>.thing'` keys (store `{list:[…]}`, not bare arrays). Every app needs an in-app Settings panel (and persists its panel layout there); the Nexus Settings tab edits the same keys.

## Docking
`const Dock=makeDock(html,window.React)` from `shared/dock.js`; pass `panels={id:{title,render}}`, `layout={top,left,right,bottom}` (arrays of panel ids), `onLayout`; center content is the children. Users drag tabs to any edge. Save `layout` in config and offer "Reset layout".

## Checklist
Manifest entry present · icon exists · Portal used for save/open · settings saved via NexusConfig · layout persisted · no localStorage for user files · works from `python -m http.server` · no network calls · small `README` line if the app has special keys.
