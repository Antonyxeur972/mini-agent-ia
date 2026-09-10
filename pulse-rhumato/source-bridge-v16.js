(()=>{
const MAP=window.PULSE_SOURCE_MAP_V16||{}, DB='pulseRhumatoPDFv14', STORE='pdfs';
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9]+/g,' ').trim();
const courses=window.PULSE_COURSES||[], docs=window.PULSE_UNESS_ALL||[];
function realDoc(file){return docs.find(d=>norm(d.f||'')===norm(file||''))||null}
for(const c of courses){const src=MAP[c.id];if(!src)continue;const d=realDoc(src);const alias=`${c.title} __PULSE_${c.id}.pdf`;if(!docs.some(x=>x.__v16===c.id))docs.push({f:alias,x:d?.x||'',realF:src,__v16:c.id});}
window.PULSE_UNESS_ALL=docs;
function openDB(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function keys(db){return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAllKeys();r.onsuccess=()=>res(r.result.map(String));r.onerror=()=>rej(r.error)})}
async function get(db,k){return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function put(db,k,v){return new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function syncAliases(){const db=await openDB(),ks=await keys(db);if(!ks.length)return 0;let n=0;for(const c of courses){const src=MAP[c.id];if(!src)continue;const real=ks.find(k=>norm(k)===norm(src)||norm(k.split('/').pop())===norm(src.split('/').pop()));if(!real)continue;const alias=`${c.title} __PULSE_${c.id}.pdf`;if(ks.some(k=>k===alias))continue;const blob=await get(db,real);if(blob){await put(db,alias,blob);n++}}if(n){const cur=document.querySelector('.v15course');if(cur)cur.remove();document.dispatchEvent(new Event('pulse-pdf-map-ready'))}return n}
let tries=0,timer=null;function startSync(){clearInterval(timer);tries=0;timer=setInterval(async()=>{tries++;try{const n=await syncAliases();if(n||tries>45){if(tries>45)clearInterval(timer)}}catch{}},1200)}
document.addEventListener('change',e=>{if(e.target?.matches?.('[data-v15-import]'))startSync()},true);setTimeout(syncAliases,500);
window.PULSE_SOURCE_V16={map:MAP,coverage:Object.values(MAP).filter(Boolean).length,total:courses.length,syncAliases};
})();