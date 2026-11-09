// Pure icon logic: no React, no Portal. Reusable as-is in Electron, Tauri or React Native (SVG string -> your renderer).
export const GLYPHS={
 star:'M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z',
 heart:'M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z',
 bolt:'M13 2L4 14h7l-1 8 9-12h-7z',
 home:'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
 cloud:'M7 19a5 5 0 01-.5-10A6 6 0 0118 10a4.5 4.5 0 010 9z',
 play:'M7 4l13 8-13 8z',
 bell:'M12 22a2.5 2.5 0 002.5-2.5h-5A2.5 2.5 0 0012 22zM18 16v-5a6 6 0 00-4.5-5.8V4a1.5 1.5 0 00-3 0v1.2A6 6 0 006 11v5l-2 2v1h16v-1z',
 folder:'M3 5h7l2 2h9v12H3z',
 check:'M9 16.2L4.8 12 3.4 13.4 9 19 21 7l-1.4-1.4z',
 plus:'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z',
 moon:'M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z',
 bookmark:'M6 3h12v18l-6-4-6 4z'};
export const DEF={name:'icon',glyph:'star',custom:null,bgMode:'gradient',c1:'#3cc9b0',c2:'#2b6fd6',angle:45,radius:22,pad:20,fgMode:'solid',fg:'#ffffff',fg2:'#ffd166',fa:90,rot:0,ox:0,oy:0,shadow:0};
const lg=(id,a,c1,c2)=>{const r=a*Math.PI/180,x=Math.cos(r)/2,y=Math.sin(r)/2;return `<linearGradient id="${id}" x1="${.5-x}" y1="${.5-y}" x2="${.5+x}" y2="${.5+y}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`};
export const svg=(s,z=512)=>{const p=s.pad/100*z,w=z-2*p,vb=s.custom?s.custom.vb:'0 0 24 24',body=s.custom?s.custom.inner:`<path d="${GLYPHS[s.glyph]}"/>`,
 defs=(s.bgMode=='gradient'?lg('g',s.angle,s.c1,s.c2):s.bgMode=='radial'?`<radialGradient id="g"><stop offset="0" stop-color="${s.c1}"/><stop offset="1" stop-color="${s.c2}"/></radialGradient>`:'')+(s.fgMode=='gradient'?lg('f',s.fa,s.fg,s.fg2):'')+(s.shadow?`<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="${z*.012}" stdDeviation="${s.shadow*z/1000}" flood-opacity=".5"/></filter>`:''),
 bg=s.bgMode=='none'?'':`<rect width="${z}" height="${z}" rx="${s.radius/100*z}" fill="${s.bgMode=='solid'?s.c1:'url(#g)'}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${z}" height="${z}" viewBox="0 0 ${z} ${z}"><defs>${defs}</defs>${bg}<g${s.shadow?' filter="url(#s)"':''} transform="translate(${s.ox/100*z} ${s.oy/100*z}) rotate(${s.rot} ${z/2} ${z/2})"><svg x="${p}" y="${p}" width="${w}" height="${w}" viewBox="${vb}" fill="${s.fgMode=='gradient'?'url(#f)':s.fg}">${body}</svg></g></svg>`};
export const png=(s,z)=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=z;c.getContext('2d').drawImage(i,0,0,z,z);c.toBlob(ok,'image/png')};i.onerror=no;i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg(s,z))});
// pngs: [{size, buf:Uint8Array}] -> .ico bytes (PNG-compressed entries, Windows Vista+)
export const ico=pngs=>{const n=pngs.length;let off=6+16*n;const out=new Uint8Array(off+pngs.reduce((a,p)=>a+p.buf.length,0)),v=new DataView(out.buffer);
 v.setUint16(2,1,true);v.setUint16(4,n,true);
 pngs.forEach((p,i)=>{const e=6+16*i;out[e]=out[e+1]=p.size>=256?0:p.size;v.setUint16(e+4,1,true);v.setUint16(e+6,32,true);v.setUint32(e+8,p.buf.length,true);v.setUint32(e+12,off,true);out.set(p.buf,off);off+=p.buf.length});return out};
export const parseSvg=t=>{const d=new DOMParser().parseFromString(t,'image/svg+xml').documentElement;if(d.nodeName!='svg')return null;
 d.querySelectorAll('script,foreignObject').forEach(n=>n.remove());
 return{vb:d.getAttribute('viewBox')||`0 0 ${parseFloat(d.getAttribute('width'))||24} ${parseFloat(d.getAttribute('height'))||24}`,inner:d.innerHTML}};
