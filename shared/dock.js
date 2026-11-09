// VS Code-style dock: panels sit on the top, left, right or bottom. Drag a panel tab onto any edge to move it.
// Usage: const Dock = makeDock(html, React); html`<${Dock} panels=${{id:{title,render}}} layout=${{top:[],left:[],right:[],bottom:[]}} onLayout=${fn}>center<//>`
export const SIDES=['top','left','right','bottom'];
export const makeDock=(html,{useState})=>function Dock({panels,layout,onLayout,children}){
 const[act,setAct]=useState({}),[drag,setDrag]=useState(null);
 const move=(id,side)=>{const l={};SIDES.forEach(s=>l[s]=(layout[s]||[]).filter(x=>x!=id));l[side]=[...l[side],id];setAct(a=>({...a,[side]:id}));onLayout(l)};
 const zone=side=>{const ids=(layout[side]||[]).filter(id=>panels[id]);if(!ids.length&&!drag)return null;
  const cur=ids.includes(act[side])?act[side]:ids[0],P=panels[cur];
  return html`<div key=${side} className=${'dz dz-'+side+(ids.length?' full':'')+(drag?' drop':'')} style=${{gridArea:side}} onDragOver=${e=>e.preventDefault()} onDrop=${e=>{e.preventDefault();if(drag)move(drag,side);setDrag(null)}}>
   <div className="dtabs">${ids.map(id=>html`<button key=${id} draggable="true" className=${id==cur?'on':''} onClick=${()=>setAct(a=>({...a,[side]:id}))} onDragStart=${e=>{e.dataTransfer.setData('text/plain',id);setDrag(id)}} onDragEnd=${()=>setDrag(null)}>${panels[id].title}</button>`)}${!ids.length&&html`<small>Drop panel here</small>`}</div>
   ${P&&html`<div className="dbody" key=${cur}>${P.render()}</div>`}</div>`};
 return html`<div className="dock">${SIDES.map(zone)}<div className="dc" style=${{gridArea:'c'}}>${children}</div></div>`};
