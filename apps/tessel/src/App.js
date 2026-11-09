import {useState,useRef,useEffect,html} from './react.js';
import {mk,hex,line,fill,comp,clone,cvFrom} from './core.js';
import {host,store} from './host.js';
import {makeDock} from '../../../shared/dock.js';
const Dock=makeDock(html,window.React);
const PAL=['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'];
const DEF={zoom:12,grid:true,fps:8,onion:2,blur:1.5,opacity:.4,fillShapes:false,w:32,h:32,scale:8,color:'#ff004d',palette:PAL,
 layout:{top:['tools'],left:['frames'],right:['colors','snippets','project'],bottom:['preview','settings']}};
const TOOLS=[['pencil','Pencil'],['eraser','Eraser'],['fill','Fill'],['pick','Picker'],['line','Line'],['rect','Rect'],['select','Select'],['obj','Objects']];
let n=0;const uid=()=>'i'+Date.now().toString(36)+(n++);
const blank=(w,h)=>({id:uid(),base:mk(w,h),objs:[]});
const ctx=c=>c.getContext('2d'),img=c=>ctx(c).getImageData(0,0,c.width,c.height);
const fromImg=im=>{const c=mk(im.width,im.height);ctx(c).putImageData(im,0,0);return c};
const blob=c=>new Promise(r=>c.toBlob(r,'image/png'));
const big=(c,s)=>{const o=mk(c.width*s,c.height*s),x=ctx(o);x.imageSmoothingEnabled=false;x.drawImage(c,0,0,o.width,o.height);return o};
function Thumb({f,w,h}){const r=useRef();useEffect(()=>{const c=r.current,s=Math.max(1,Math.floor(72/Math.max(w,h)));c.width=w*s;c.height=h*s;const x=ctx(c);x.imageSmoothingEnabled=false;x.drawImage(comp(f,w,h),0,0,c.width,c.height)});return html`<canvas ref=${r} className="th"/>`}
function Prev({m,idx}){const r=useRef();useEffect(()=>{const c=r.current,f=m.frames[idx]||m.frames[0],s=Math.max(1,Math.floor(120/Math.max(m.w,m.h)));c.width=m.w*s;c.height=m.h*s;const x=ctx(c);x.imageSmoothingEnabled=false;x.drawImage(comp(f,m.w,m.h),0,0,c.width,c.height)});return html`<canvas ref=${r}/>`}
export default function App(){
 const[cfg,setCfg]=useState(()=>store.get('tessel',DEF));
 const upd=p=>setCfg(c=>{const n=Object.assign({},c,p);store.set('tessel',n);return n});
 const M=useRef(null);if(!M.current)M.current={w:cfg.w,h:cfg.h,i:0,frames:[blank(cfg.w,cfg.h)]};
 const S=useRef({sel:null,float:null}),G=useRef({}),U=useRef({s:[],r:[]}),cv=useRef();
 const[,tk]=useState(0),bump=()=>tk(t=>t+1);
 const[tool,setTool]=useState('pencil'),[oid,setOid]=useState(null),[edit,setEdit]=useState(false),[play,setPlay]=useState(false),[pv,setPv]=useState(0),[msg,setMsg]=useState('');
 const[snips,setSnips]=useState(()=>store.get('tessel.snippets',{list:[]}).list||[]);
 const m=M.current,cur=()=>m.frames[m.i];
 /* history: whole-project snapshots (fine for sprite-sized canvases) */
 const snap=()=>({i:m.i,fr:m.frames.map(f=>({id:f.id,b:img(f.base),o:f.objs.map(o=>({id:o.id,x:o.x,y:o.y,im:img(o.cv)}))}))});
 const rest=s=>{m.frames=s.fr.map(f=>({id:f.id,base:fromImg(f.b),objs:f.o.map(o=>({id:o.id,x:o.x,y:o.y,cv:fromImg(o.im)}))}));m.i=Math.min(s.i,m.frames.length-1)};
 const push=()=>{const u=U.current;u.s.push(snap());if(u.s.length>40)u.s.shift();u.r=[]};
 const commit=()=>{const F=S.current.float;if(F){ctx(cur().base).drawImage(F.cv,F.x,F.y);S.current.float=null}};
 const undo=()=>{const u=U.current;if(!u.s.length)return;commit();u.r.push(snap());rest(u.s.pop());S.current.sel=null;bump()};
 const redo=()=>{const u=U.current;if(!u.r.length)return;u.s.push(snap());rest(u.r.pop());bump()};
 /* drawing target: the frame, or the selected object when "edit object pixels" is on */
 const tgt=()=>{const o=edit&&cur().objs.find(o=>o.id==oid);return o?{c:o.cv,ox:o.x,oy:o.y}:{c:cur().base,ox:0,oy:0}};
 const dot=(t,x,y,er)=>{x-=t.ox;y-=t.oy;if(x<0||y<0||x>=t.c.width||y>=t.c.height)return;const k=ctx(t.c);if(er)k.clearRect(x,y,1,1);else{k.fillStyle=cfg.color;k.fillRect(x,y,1,1)}};
 const shape=(t,a,b)=>{const[x0,y0]=a,[x1,y1]=b,d=(x,y)=>dot(t,x,y);
  if(tool=='line')line(x0,y0,x1,y1,d);
  else if(cfg.fillShapes){for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)line(x0,y,x1,y,d)}
  else{line(x0,y0,x1,y0,d);line(x1,y0,x1,y1,d);line(x1,y1,x0,y1,d);line(x0,y1,x0,y0,d)}};
 const px=e=>{const r=cv.current.getBoundingClientRect();return[Math.floor((e.clientX-r.left)/cfg.zoom),Math.floor((e.clientY-r.top)/cfg.zoom)]};
 const inb=(r,x,y)=>r&&x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h;
 const down=e=>{if(e.button)return;cv.current.setPointerCapture(e.pointerId);const[x,y]=px(e),g=G.current,f=cur(),s=S.current;Object.assign(g,{on:1,s:[x,y],l:[x,y]});
  if(tool=='pencil'||tool=='eraser'){push();dot(tgt(),x,y,tool=='eraser')}
  else if(tool=='fill'){push();const t=tgt();fill(t.c,x-t.ox,y-t.oy,hex(cfg.color))}
  else if(tool=='pick'){const d=ctx(comp(f,m.w,m.h)).getImageData(x,y,1,1).data;if(d[3])upd({color:'#'+[...d].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')})}
  else if(tool=='line'||tool=='rect'){push();g.im=img(tgt().c)}
  else if(tool=='select'){
   if(inb(s.sel,x,y)){if(!s.float){push();const r=s.sel,c=mk(r.w,r.h);ctx(c).drawImage(f.base,r.x,r.y,r.w,r.h,0,0,r.w,r.h);if(!e.altKey)ctx(f.base).clearRect(r.x,r.y,r.w,r.h);s.float={cv:c,x:r.x,y:r.y}}g.fx=s.float.x;g.fy=s.float.y;g.mv=1}
   else{commit();s.sel=null;g.mv=0}}
  else if(tool=='obj'){const o=[...f.objs].reverse().find(o=>x>=o.x&&y>=o.y&&x<o.x+o.cv.width&&y<o.y+o.cv.height);
   if(o){push();setOid(o.id);g.o=o;g.ox=o.x;g.oy=o.y}else{g.o=null;setOid(null);setEdit(false)}}
  bump()};
 const move=e=>{const g=G.current;if(!g.on)return;const[x,y]=px(e),s=S.current;
  if(tool=='pencil'||tool=='eraser'){const t=tgt();line(g.l[0],g.l[1],x,y,(a,b)=>dot(t,a,b,tool=='eraser'))}
  else if(tool=='line'||tool=='rect'){const t=tgt();ctx(t.c).putImageData(g.im,0,0);shape(t,g.s,[x,y])}
  else if(tool=='select'){
   if(g.mv){s.float.x=g.fx+x-g.s[0];s.float.y=g.fy+y-g.s[1];s.sel={...s.sel,x:s.float.x,y:s.float.y}}
   else{const x0=Math.max(0,Math.min(g.s[0],x)),y0=Math.max(0,Math.min(g.s[1],y)),x1=Math.min(m.w-1,Math.max(g.s[0],x)),y1=Math.min(m.h-1,Math.max(g.s[1],y));s.sel={x:x0,y:y0,w:x1-x0+1,h:y1-y0+1}}}
  else if(tool=='obj'&&g.o){g.o.x=g.ox+x-g.s[0];g.o.y=g.oy+y-g.s[1]}
  g.l=[x,y];bump()};
 const up=()=>{G.current.on=0};
 /* slides */
 const open=k=>{commit();S.current.sel=null;m.i=k;setOid(null);setEdit(false);bump()};
 const addF=(src,at=m.i)=>{commit();push();const f=src?{id:uid(),base:clone(src.base),objs:src.objs.map(o=>({id:uid(),x:o.x,y:o.y,cv:clone(o.cv)}))}:blank(m.w,m.h);m.frames.splice(at+1,0,f);m.i=at+1;S.current.sel=null;setOid(null);setEdit(false);bump()};
 const delF=k=>{if(m.frames.length<2)return;commit();push();m.frames.splice(k,1);m.i=k<m.i?m.i-1:Math.min(m.i,m.frames.length-1);S.current.sel=null;setOid(null);bump()};
 /* objects: placed snippets that belong to one slide only */
 const o_=()=>cur().objs.find(o=>o.id==oid);
 const addObj=(c,x,y)=>{commit();push();const o={id:uid(),x,y,cv:clone(c)};cur().objs.push(o);setTool('obj');setOid(o.id);setEdit(false);bump()};
 const delObj=()=>{push();const f=cur();f.objs=f.objs.filter(o=>o.id!=oid);setOid(null);setEdit(false);bump()};
 const bake=()=>{const o=o_();if(!o)return;push();const f=cur();ctx(f.base).drawImage(o.cv,o.x,o.y);f.objs=f.objs.filter(q=>q!=o);setOid(null);setEdit(false);bump()};
 /* snippets */
 const saveSn=l=>{setSnips(l);try{store.set('tessel.snippets',{list:l})}catch(e){setMsg('Snippet storage is full. Delete some snippets.')}};
 const addSn=c=>saveSn([...snips,{id:uid(),name:'Snippet '+(snips.length+1),url:c.toDataURL()}]);
 const fromSel=()=>{commit();const r=S.current.sel;if(!r){setMsg('Select an area first.');return}const c=mk(r.w,r.h);ctx(c).drawImage(comp(cur(),m.w,m.h),r.x,r.y,r.w,r.h,0,0,r.w,r.h);addSn(c)};
 const fromObj=()=>{const o=o_();o?addSn(o.cv):setMsg('Select an object first.')};
 const imp=async()=>{const r=await host.open(['.png']);if(r)addSn(await cvFrom(URL.createObjectURL(r.blob)))};
 const drop=async e=>{e.preventDefault();const s=snips.find(q=>q.id==e.dataTransfer.getData('text/snip'));if(!s)return;const c=await cvFrom(s.url),[x,y]=px(e);addObj(c,x-(c.width>>1),y-(c.height>>1))};
 /* files */
 const done=r=>r&&setMsg('Saved '+r.name);
 const save=async()=>{commit();const p={v:1,w:m.w,h:m.h,fps:cfg.fps,frames:m.frames.map(f=>({b:f.base.toDataURL(),o:f.objs.map(o=>({x:o.x,y:o.y,u:o.cv.toDataURL()}))}))};done(await host.save(new Blob([JSON.stringify(p)],{type:'application/json'}),'animation.tessel.json'))};
 const load=async()=>{const r=await host.open(['.json']);if(!r)return;try{const p=JSON.parse(await r.blob.text());
  const fr=await Promise.all(p.frames.map(async f=>({id:uid(),base:await cvFrom(f.b),objs:await Promise.all(f.o.map(async o=>({id:uid(),x:o.x,y:o.y,cv:await cvFrom(o.u)})))})));
  Object.assign(m,{w:p.w,h:p.h,i:0,frames:fr});U.current={s:[],r:[]};S.current={sel:null,float:null};setOid(null);upd({fps:p.fps||cfg.fps});bump()}catch(e){setMsg('That file is not a Tessel project.')}};
 const expF=async()=>{commit();done(await host.save(await blob(big(comp(cur(),m.w,m.h),cfg.scale)),'frame.png'))};
 const expS=async()=>{commit();const sh=mk(m.w*m.frames.length,m.h),x=ctx(sh);m.frames.forEach((f,k)=>x.drawImage(comp(f,m.w,m.h),k*m.w,0));done(await host.save(await blob(big(sh,cfg.scale)),'spritesheet.png'))};
 const newP=()=>{if(!confirm('Start a new project? Unsaved work is lost.'))return;Object.assign(m,{w:cfg.w,h:cfg.h,i:0,frames:[blank(cfg.w,cfg.h)]});U.current={s:[],r:[]};S.current={sel:null,float:null};setOid(null);bump()};
 /* paint: onion skin (blurred, fading ghosts of earlier slides), current slide, grid, selection */
 useEffect(()=>{const c=cv.current;if(!c)return;const z=cfg.zoom,{w,h}=m,x=c.getContext('2d'),f=cur(),s=S.current;c.width=w*z;c.height=h*z;x.imageSmoothingEnabled=false;
  for(let k=Math.min(cfg.onion,m.i);k>=1;k--){x.save();x.globalAlpha=cfg.opacity*(1-(k-1)/(cfg.onion+1));x.filter='blur('+cfg.blur*z/4+'px)';x.drawImage(comp(m.frames[m.i-k],w,h),0,0,w*z,h*z);x.restore()}
  x.drawImage(comp(f,w,h),0,0,w*z,h*z);
  if(s.float)x.drawImage(s.float.cv,s.float.x*z,s.float.y*z,s.float.cv.width*z,s.float.cv.height*z);
  if(cfg.grid&&z>=6){x.strokeStyle='rgba(128,128,128,.3)';x.beginPath();for(let i=1;i<w;i++){x.moveTo(i*z+.5,0);x.lineTo(i*z+.5,h*z)}for(let i=1;i<h;i++){x.moveTo(0,i*z+.5);x.lineTo(w*z,i*z+.5)}x.stroke()}
  if(s.sel){const r=s.sel;x.setLineDash([5,4]);x.strokeStyle='#fff';x.strokeRect(r.x*z+.5,r.y*z+.5,r.w*z-1,r.h*z-1);x.lineDashOffset=5;x.strokeStyle='#000';x.strokeRect(r.x*z+.5,r.y*z+.5,r.w*z-1,r.h*z-1);x.setLineDash([])}
  const o=f.objs.find(o=>o.id==oid);if(o){x.lineWidth=2;x.strokeStyle=edit?'#ff004d':'#3cc9b0';x.strokeRect(o.x*z,o.y*z,o.cv.width*z,o.cv.height*z)}});
 useEffect(()=>{if(!play)return;const t=setInterval(()=>setPv(p=>(p+1)%m.frames.length),1000/cfg.fps);return()=>clearInterval(t)},[play,cfg.fps]);
 useEffect(()=>{const k=e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const c=e.ctrlKey||e.metaKey,s=S.current;
  if(c&&e.key=='z'){e.preventDefault();undo()}else if(c&&e.key=='y'){e.preventDefault();redo()}
  else if(e.key=='Delete'||e.key=='Backspace'){if(tool=='obj'&&oid)delObj();else if(tool=='select'&&s.sel){push();if(s.float)s.float=null;else ctx(cur().base).clearRect(s.sel.x,s.sel.y,s.sel.w,s.sel.h);s.sel=null;bump()}}
  else if(e.key=='Escape'){commit();s.sel=null;setOid(null);setEdit(false);bump()}
  else if(e.key=='Enter'){commit();bump()}
  else if(e.key.toLowerCase()=='e'&&oid)setEdit(v=>!v)
  else if(e.key.indexOf('Arrow')==0&&tool=='obj'&&oid){e.preventDefault();const o=o_(),d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(o){push();o.x+=d[0];o.y+=d[1];bump()}}};
  addEventListener('keydown',k);return()=>removeEventListener('keydown',k)});
 const num=(k,l,a,b,st=1)=>html`<label className="row" key=${k}><span>${l}</span><input type="number" min=${a} max=${b} step=${st} value=${cfg[k]} onInput=${e=>{const v=+e.target.value;if(e.target.value!==''&&v>=a&&v<=b)upd({[k]:v})}}/></label>`;
 const B=(t,l)=>html`<button key=${t} className=${tool==t?'on':''} onClick=${()=>{commit();S.current.sel=null;setTool(t);bump()}}>${l}</button>`;
 const panels={
  tools:{title:'Tools',render:()=>html`<div className="tb">${TOOLS.map(([t,l])=>B(t,l))}<span className="sep"/>
   <button onClick=${undo}>Undo</button><button onClick=${redo}>Redo</button><span className="sep"/>
   <button onClick=${()=>upd({zoom:Math.max(2,cfg.zoom-2)})}>Zoom out</button><button onClick=${()=>upd({zoom:Math.min(40,cfg.zoom+2)})}>Zoom in</button><button className=${cfg.grid?'on':''} onClick=${()=>upd({grid:!cfg.grid})}>Grid</button>
   ${oid&&html`<span className="sep"/><button className=${edit?'on':''} onClick=${()=>setEdit(!edit)}>Edit object pixels</button><button onClick=${bake}>Merge into slide</button><button onClick=${delObj}>Delete object</button>`}</div>`},
  frames:{title:'Slides',render:()=>html`<div><button className="pri" onClick=${()=>addF(null)}>New blank slide</button><div className="fl">${m.frames.map((f,k)=>html`<div key=${f.id} className=${'fr'+(k==m.i?' on':'')} onClick=${()=>open(k)}><${Thumb} f=${f} w=${m.w} h=${m.h}/><b>${k+1}</b>
    <span className="fa"><button onClick=${e=>{e.stopPropagation();open(k)}}>Open</button><button onClick=${e=>{e.stopPropagation();addF(m.frames[k],k)}}>Copy</button><button onClick=${e=>{e.stopPropagation();delF(k)}}>Delete</button></span></div>`)}</div></div>`},
  colors:{title:'Colors',render:()=>html`<div><label className="row"><span>Color</span><input type="color" value=${cfg.color} onInput=${e=>upd({color:e.target.value})}/></label>
   <div className="pal">${cfg.palette.map((c,i)=>html`<button key=${i} title=${c} className=${c==cfg.color?'on':''} style=${{background:c}} onClick=${()=>upd({color:c})}/>`)}</div>
   <button onClick=${()=>cfg.palette.includes(cfg.color)||upd({palette:[...cfg.palette,cfg.color]})}>Add color to palette</button></div>`},
  snippets:{title:'Snippets',render:()=>html`<div><div className="acts"><button onClick=${fromSel}>From selection</button><button onClick=${fromObj}>From object</button><button onClick=${imp}>Import PNG</button></div>
   <p><small>Drag a snippet onto the canvas (or double-click it). Each copy is its own object on that slide, so editing it never changes the saved snippet.</small></p>
   <div className="sn">${snips.map(s=>html`<div key=${s.id} className="s" draggable="true" onDragStart=${e=>e.dataTransfer.setData('text/snip',s.id)} onDoubleClick=${async()=>addObj(await cvFrom(s.url),0,0)}><img src=${s.url} alt=${s.name}/><button title="Delete snippet" onClick=${()=>saveSn(snips.filter(q=>q!=s))}>×</button></div>`)}</div>
   ${!snips.length&&html`<small>No snippets yet.</small>`}</div>`},
  project:{title:'Project',render:()=>html`<div><div className="acts"><button className="pri" onClick=${save}>Save project</button><button onClick=${load}>Open project</button><button onClick=${expF}>Export slide PNG</button><button onClick=${expS}>Export spritesheet</button></div><p><small>${msg}</small></p></div>`},
  preview:{title:'Preview',render:()=>html`<div className="pvw"><${Prev} m=${m} idx=${play?pv%m.frames.length:m.i}/><div><div className="acts"><button className="pri" onClick=${()=>setPlay(!play)}>${play?'Stop':'Play'}</button></div><label className="row"><span>FPS ${cfg.fps}</span><input type="range" min="1" max="24" value=${cfg.fps} onInput=${e=>upd({fps:+e.target.value})}/></label></div></div>`},
  settings:{title:'Settings',render:()=>html`<div>${num('zoom','Zoom',2,40)}${num('onion','Onion depth (slides)',0,8)}${num('blur','Onion blur',0,10,.5)}${num('opacity','Onion opacity',0,1,.05)}${num('scale','Export scale',1,32)}${num('w','New width',1,256)}${num('h','New height',1,256)}
   <label className="row"><span>Fill shapes</span><input type="checkbox" checked=${cfg.fillShapes} onChange=${e=>upd({fillShapes:e.target.checked})}/></label>
   <div className="acts"><button onClick=${newP}>New project</button><button onClick=${()=>upd({layout:DEF.layout})}>Reset layout</button><button onClick=${()=>upd({...DEF,color:cfg.color})}>Reset settings</button></div></div>`}};
 return html`<${Dock} panels=${panels} layout=${cfg.layout} onLayout=${l=>upd({layout:l})}>
  <div className="cw"><canvas ref=${cv} className="pv" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onDragOver=${e=>e.preventDefault()} onDrop=${drop} onContextMenu=${e=>e.preventDefault()}/></div><//>`}
