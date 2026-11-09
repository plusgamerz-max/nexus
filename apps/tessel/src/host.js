// Platform adapter. Web: Nexus Portal SDK (shared Files) + NexusConfig. Electron/Tauri: export the same names backed by dialog/fs/app-data.
const P=()=>window.Portal;
const download=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();return Promise.resolve({name:n})};
export const host={
 save:(blob,name)=>P()?P().save(blob,name,'Tessel'):download(blob,name),
 open:accept=>P()?P().open(accept):Promise.resolve(null)};
export const store=window.NexusConfig||{get:(k,d)=>Object.assign({},d),set(){},del(){}};
