import {useState,useMemo,html} from './react.js';
import {GLYPHS,DEF,svg,png,ico,parseSvg} from './core.js';
import {host,store} from './host.js';
import {makeDock} from '../../../shared/dock.js';
const Dock=makeDock(html,window.React);
const CFG={size:512,layout:{top:[],bottom:[],left:['glyph','colors','shape'],right:['export','settings']},def:{bgMode:DEF.bgMode,c1:DEF.c1,c2:DEF.c2,radius:DEF.radius}};
const Row=({l,children})=>html`<label className="row"><span>${l}</span>${children}</label>`;
export default function App(){
 const[cfg,setCfg]=useState(()=>store.get('icon-bench',CFG)),[s,setS]=useState(()=>({...DEF,...cfg.def})),[msg,setMsg]=useState('');
 const upd=p=>setCfg(c=>{const n={...c,...p};store.set('icon-bench',n);return n});
 const set=(k,v)=>setS(o=>({...o,[k]:v}));
 const url=useMemo(()=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(s,256)),[s]);
 const nm=(s.name||'icon').trim()||'icon';
 const out=async(b,ext)=>{const r=await host.save(b,nm+ext);setMsg(r?'Saved '+r.name:'')};
 const rng=(k,a,b)=>html`<input type="range" min=${a} max=${b} value=${s[k]} onInput=${e=>set(k,+e.target.value)}/>`;
 const col=k=>html`<input type="color" value=${s[k]} onInput=${e=>set(k,e.target.value)}/>`;
 const sel=(k,opts)=>html`<select value=${s[k]} onChange=${e=>set(k,e.target.value)}>${opts.map(([v,l])=>html`<option key=${v} value=${v}>${l}</option>`)}</select>`;
 const load=async()=>{const r=await host.open(['.json','.svg']);if(!r)return;const t=await r.blob.text();
  if(/\.svg$/i.test(r.file.name)){const c=parseSvg(t);c?setS(o=>({...o,custom:c})):setMsg('That file is not a valid SVG.')}
  else try{setS({...DEF,...JSON.parse(t)})}catch(e){setMsg('That file is not an Icon Bench project.')}};
 const exIco=async()=>{const p=await Promise.all([16,32,48,64,128,256].map(async z=>({size:z,buf:new Uint8Array(await(await png(s,z)).arrayBuffer())})));out(new Blob([ico(p)],{type:'image/x-icon'}),'.ico')};
 const panels={
  glyph:{title:'Glyph',render:()=>html`<div>
   <${Row} l="Name"><input value=${s.name} onInput=${e=>set('name',e.target.value)}/><//>
   <div className="gl">${Object.entries(GLYPHS).map(([k,d])=>html`<button key=${k} title=${k} className=${!s.custom&&s.glyph==k?'on':''} onClick=${()=>setS(o=>({...o,glyph:k,custom:null}))}><svg viewBox="0 0 24 24"><path d=${d}/></svg></button>`)}</div>
   ${s.custom&&html`<small>Using an imported SVG. Pick a glyph to switch back.</small>`}
   <${Row} l="Glyph fill">${sel('fgMode',[['solid','Solid'],['gradient','Gradient']])}<//>
   <${Row} l=${s.fgMode=='gradient'?'Color 1':'Color'}>${col('fg')}<//>
   ${s.fgMode=='gradient'&&html`<${Row} l="Color 2">${col('fg2')}<//><${Row} l="Angle">${rng('fa',0,360)}<//>`}</div>`},
  colors:{title:'Background',render:()=>html`<div>
   <${Row} l="Fill">${sel('bgMode',[['gradient','Linear gradient'],['radial','Radial gradient'],['solid','Solid'],['none','Transparent']])}<//>
   ${s.bgMode!='none'&&html`<${Row} l="Color 1">${col('c1')}<//>`}
   ${(s.bgMode=='gradient'||s.bgMode=='radial')&&html`<${Row} l="Color 2">${col('c2')}<//>`}
   ${s.bgMode=='gradient'&&html`<${Row} l="Angle">${rng('angle',0,360)}<//>`}</div>`},
  shape:{title:'Shape',render:()=>html`<div>
   <${Row} l="Corners">${rng('radius',0,50)}<//><${Row} l="Padding">${rng('pad',0,40)}<//><${Row} l="Rotation">${rng('rot',-180,180)}<//>
   <${Row} l="Offset X">${rng('ox',-30,30)}<//><${Row} l="Offset Y">${rng('oy',-30,30)}<//><${Row} l="Shadow">${rng('shadow',0,40)}<//></div>`},
  export:{title:'Export',render:()=>html`<div>
   <${Row} l="PNG size"><select value=${cfg.size} onChange=${e=>upd({size:+e.target.value})}>${[64,128,256,512,1024].map(z=>html`<option key=${z} value=${z}>${z} px</option>`)}</select><//>
   <div className="acts">
    <button className="pri" onClick=${async()=>out(await png(s,cfg.size),'.png')}>Save PNG</button>
    <button onClick=${()=>out(new Blob([svg(s,512)],{type:'image/svg+xml'}),'.svg')}>Save SVG</button>
    <button onClick=${exIco}>Save ICO</button>
    <button onClick=${()=>out(new Blob([JSON.stringify(s)],{type:'application/json'}),'.iconbench.json')}>Save project</button>
    <button onClick=${load}>Open from Files</button></div>
   <p><small>${msg}</small></p></div>`},
  settings:{title:'Settings',render:()=>html`<div>
   <${Row} l="New icons start with"><span/><//>
   <${Row} l="Fill"><select value=${cfg.def.bgMode} onChange=${e=>upd({def:{...cfg.def,bgMode:e.target.value}})}><option value="gradient">Linear gradient</option><option value="radial">Radial gradient</option><option value="solid">Solid</option><option value="none">Transparent</option></select><//>
   <${Row} l="Color 1"><input type="color" value=${cfg.def.c1} onInput=${e=>upd({def:{...cfg.def,c1:e.target.value}})}/><//>
   <${Row} l="Color 2"><input type="color" value=${cfg.def.c2} onInput=${e=>upd({def:{...cfg.def,c2:e.target.value}})}/><//>
   <${Row} l="Corners"><input type="range" min="0" max="50" value=${cfg.def.radius} onInput=${e=>upd({def:{...cfg.def,radius:+e.target.value}})}/><//>
   <div className="acts"><button onClick=${()=>setS(o=>({...o,...cfg.def}))}>Apply to this icon</button><button onClick=${()=>upd({layout:CFG.layout})}>Reset layout</button><button onClick=${()=>{setCfg(CFG);store.set('icon-bench',CFG)}}>Reset settings</button></div></div>`}};
 return html`<${Dock} panels=${panels} layout=${cfg.layout} onLayout=${l=>upd({layout:l})}>
  <div className="stage"><div className="big"><img alt="Icon preview" src=${url}/></div>
   <div className="sm">${[16,32,48,64].map(z=>html`<img key=${z} alt="" width=${z} height=${z} src=${url}/>`)}</div>
   <small>Drag a panel tab to any edge to dock it there.</small></div><//>`}
