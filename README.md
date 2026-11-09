# Nexus
Run from this folder: `python -m http.server 8080` then open http://localhost:8080 (needs http, not file://).
Add an app: create `apps/<name>/`, then add an entry to `installed_apps.json` (id, name, description, path, icon, entry, route).
Use the shared Files UI from any app: `<script src="../../sdk/portal-sdk.js"></script>` then `await Portal.save(blob,'a.png','My App')` / `await Portal.open(['.png'])` / `Portal.browse()`.
Files are stored in IndexedDB (cookies hold only small prefs: theme, view).
Icon Bench: `src/core.js` is framework-free; `src/host.js` and `src/react.js` are the only platform seams for Electron/Tauri.
