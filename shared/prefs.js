/* Small cookie-backed prefs shared by every page on the origin (theme, view). Files live in IndexedDB: cookies are capped at ~4 KB. */
(function(){function get(){try{return JSON.parse(decodeURIComponent((document.cookie.match(/(?:^|; )nexus=([^;]*)/)||[])[1]||'{}'))}catch(e){return{}}}
function set(o){document.cookie='nexus='+encodeURIComponent(JSON.stringify(Object.assign(get(),o)))+';path=/;max-age=31536000;SameSite=Lax'}
function theme(){var t=get().theme||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.dataset.t=t;return t}
window.NexusPrefs={get:get,set:set,theme:theme};theme()})();
