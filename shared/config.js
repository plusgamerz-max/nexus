/* Per-app config space. NexusConfig.get('my-app', defaults) merges stored values over defaults.
   Stored in localStorage as nexus.cfg.<key>; the Nexus "Settings" tab lists and edits every key. Use 'my-app.thing' for extra data. */
(function(){var P='nexus.cfg.';
function get(k,d){try{return Object.assign({},d,JSON.parse(localStorage.getItem(P+k)||'{}'))}catch(e){return Object.assign({},d)}}
function set(k,o){localStorage.setItem(P+k,JSON.stringify(o))}
function del(k){localStorage.removeItem(P+k)}
function keys(){var r=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf(P)==0)r.push(k.slice(P.length))}return r.sort()}
window.NexusConfig={get:get,set:set,del:del,keys:keys,raw:function(k){return localStorage.getItem(P+k)||''}}})();
