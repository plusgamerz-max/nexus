// Pixel helpers: canvas only, no React, no Portal.
export const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
export const hex=h=>{const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255,255]};
export const line=(x0,y0,x1,y1,f)=>{const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(;;){f(x0,y0);if(x0==x1&&y0==y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}};
export const fill=(cv,x,y,c)=>{const w=cv.width,h=cv.height;if(x<0||y<0||x>=w||y>=h)return;const k=cv.getContext('2d'),im=k.getImageData(0,0,w,h),d=im.data,i0=(y*w+x)*4,t=[d[i0],d[i0+1],d[i0+2],d[i0+3]];
 if(t.every((v,j)=>v==c[j]))return;const st=[[x,y]];
 while(st.length){const[a,b]=st.pop();if(a<0||b<0||a>=w||b>=h)continue;const i=(b*w+a)*4;if(d[i]!=t[0]||d[i+1]!=t[1]||d[i+2]!=t[2]||d[i+3]!=t[3])continue;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=c[3];st.push([a+1,b],[a-1,b],[a,b+1],[a,b-1])}
 k.putImageData(im,0,0)};
export const comp=(f,w,h)=>{const c=mk(w,h),x=c.getContext('2d');x.drawImage(f.base,0,0);f.objs.forEach(o=>x.drawImage(o.cv,o.x,o.y));return c};
export const clone=c=>{const n=mk(c.width,c.height);n.getContext('2d').drawImage(c,0,0);return n};
export const cvFrom=url=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=mk(i.width,i.height);c.getContext('2d').drawImage(i,0,0);ok(c)};i.onerror=no;i.src=url});
