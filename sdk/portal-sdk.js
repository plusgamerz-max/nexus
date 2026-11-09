/* Nexus SDK. Load as a classic <script> from any sub-app.
   Portal.save(blob,name,appLabel) -> {id,name}|null   Portal.open(['.svg']) -> {file,blob}|null   Portal.browse() */
(function(){
var base=new URL('../',document.currentScript.src).href;
function modal(q,payload){return new Promise(function(res){
 var rid=Math.random().toString(36).slice(2),d=document.createElement('div'),f=document.createElement('iframe');
 d.style.cssText='position:fixed;inset:0;z-index:99999;background:#0009;display:flex;align-items:center;justify-content:center';
 f.src=base+'explorer.html?'+new URLSearchParams(Object.assign({rid:rid},q));
 f.style.cssText='width:min(860px,94vw);height:min(600px,88vh);border:0;border-radius:12px';
 d.appendChild(f);document.body.appendChild(d);
 function done(v){removeEventListener('message',h);d.remove();res(v)}
 function h(e){var m=e.data;if(e.source!==f.contentWindow||e.origin!==location.origin||!m||m.rid!==rid)return;
  if(m.type==='ready'&&payload)f.contentWindow.postMessage(Object.assign({rid:rid},payload),location.origin);
  else if(m.type==='cancel')done(null);else if(m.type==='saved'||m.type==='opened')done(m)}
 addEventListener('message',h);d.onclick=function(e){if(e.target===d)done(null)}})}
window.Portal={
 save:function(blob,name,app){return modal({mode:'save',app:app||'',name:name},{type:'payload',blob:blob,name:name}).then(function(m){return m&&m.file})},
 open:function(accept){return modal({mode:'open',accept:(accept||[]).join(',')}).then(function(m){return m&&{file:m.file,blob:m.blob}})},
 browse:function(){return modal({mode:'manage'})}}})();
