(()=>{
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9]+/g,' ').trim();
const h=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const cache=new Map(), loading=new Map();
const SKIP=/^(cofer|reso|bioscar|paris diderot|universite|université|hopital|hôpital|service|pr\.?|dr\.?|professeur|copyright|page\s*\d+|\d+\s*$)/i;
const LEGAL=/mentions légales|liens d.intérêts|droit d'auteur|propriété intellectuelle|interdit à la vente|mise à disposition du public|réservées au collège|advisory boards|recherches cliniques|aides pour des recherches|cours, formations|bibliographie|références|https?:|www\.|doi:/i;
function courseForTitle(title){return (window.PULSE_COURSES||[]).find(c=>c.title===title)||null}
function clean(s=''){return String(s).replace(/[•▪►➢]/g,' ').replace(/\s+/g,' ').replace(/^[-–—:;,]+\s*/,'').trim()}
function sentence(s=''){s=clean(s).replace(/^\d+[.)-]?\s*/,'');if(!s)return'';s=s.charAt(0).toUpperCase()+s.slice(1);if(!/[.!?]$/.test(s))s+='.';return s}
function useful(s){return !!s&&s.length>=3&&s.length<=180&&!LEGAL.test(s)&&!SKIP.test(s)}
function groupLines(items){
 const rows=[];
 for(const it of items){const str=clean(it.str);if(!str)continue;const x=Number(it.transform?.[4]||0),y=Number(it.transform?.[5]||0),fs=Math.max(1,Math.abs(Number(it.transform?.[3]||it.height||10)));let row=rows.find(r=>Math.abs(r.y-y)<=Math.max(2,fs*.32));if(!row){row={y,items:[],fs:0};rows.push(row)}row.items.push({str,x,fs});row.fs=Math.max(row.fs,fs)}
 return rows.map(r=>{r.items.sort((a,b)=>a.x-b.x);return{text:clean(r.items.map(i=>i.str).join(' ')),y:r.y,fs:r.fs}}).filter(r=>r.text).sort((a,b)=>b.y-a.y)
}
function pageTitle(lines,height,index){
 const top=lines.filter(l=>l.y>height*.48&&useful(l.text));
 const pool=top.length?top:lines.filter(l=>useful(l.text)).slice(0,12);
 if(!pool.length)return `Diapositive ${index}`;
 const maxFs=Math.max(...pool.map(l=>l.fs),1);
 let candidates=pool.filter(l=>l.fs>=maxFs*.68&&l.text.length<=120&&!/^[A-ZÀ-ÖØ-Þ]{1,3}$/.test(l.text));
 if(!candidates.length)candidates=pool;
 candidates.sort((a,b)=>((b.fs/maxFs)*6+(b.y/height)*3+Math.min(b.text.length,60)/60)-((a.fs/maxFs)*6+(a.y/height)*3+Math.min(a.text.length,60)/60));
 const lead=candidates[0];
 const neighbors=pool.filter(l=>l!==lead&&Math.abs(l.fs-lead.fs)<=Math.max(2,lead.fs*.22)&&Math.abs(l.y-lead.y)<=lead.fs*2.4&&l.text.length<90).sort((a,b)=>b.y-a.y);
 let parts=[lead,...neighbors].sort((a,b)=>b.y-a.y).map(x=>x.text);
 parts=[...new Set(parts)].filter(x=>useful(x));
 let title=clean(parts.slice(0,2).join(' '));
 if(title.length>125)title=lead.text;
 return title||`Diapositive ${index}`
}
function pageKey(lines,title,height){
 const nt=norm(title);
 const body=lines.filter(l=>l.y<height*.88&&l.y>height*.08).map(l=>clean(l.text)).filter(t=>useful(t)&&norm(t)!==nt&&norm(t).length>12&&!/^\d+[.)]?\s*$/.test(t));
 let k=body.find(t=>t.length>=28&&t.length<=165&&!/^(plan|sommaire|objectifs?|conclusion)$/i.test(t));
 if(!k)k=body.find(t=>t.length>=12&&t.length<=165);
 return k?sentence(k):'Cette diapositive développe ce point du cours.'
}
async function extractSlides(title){
 if(cache.has(title))return cache.get(title);if(loading.has(title))return loading.get(title);
 const p=(async()=>{try{
  const api=window.PULSE_PDF_READER,pdfjs=window.pdfjsLib;if(!api?.pdfFor||!pdfjs)throw new Error('Lecteur indisponible');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const found=await api.pdfFor(title,'outline-v20');if(!found)throw new Error('PDF non disponible');
  const pdf=await pdfjs.getDocument({url:found.url}).promise;const rows=[];
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i),vp=page.getViewport({scale:1}),tc=await page.getTextContent(),lines=groupLines(tc.items||[]);
   const t=pageTitle(lines,vp.height,i),k=pageKey(lines,t,vp.height);rows.push({page:i,t,k});
  }
  cache.set(title,rows);return rows
 }catch(e){console.warn('Pulse outline v20',e);return fallbackOutline(title)}})();loading.set(title,p);const r=await p;loading.delete(title);return r
}
function fallbackOutline(title){const c=courseForTitle(title);const facts=(window.PULSE_V12_FACTS_FOR?.(title)?.facts||[]).map(sentence).filter(x=>x.length>20);if(c?.sections?.length)return c.sections.map((t,i)=>({page:i+1,t,k:facts[i]||facts[0]||'Partie importante du support à connaître.'}));return facts.slice(0,10).map((k,i)=>({page:i+1,t:`Point clé ${i+1}`,k}))}
function rowsHTML(rows,compact=false){return `<div class="v20slides">${rows.map((r,i)=>`<details class="v20slide" ${i===0&&!compact?'open':''}><summary><span class="v20page">${r.page}</span><span class="v20slideText"><b>${h(r.t)}</b><small>${h(r.k)}</small></span><em>⌄</em></summary><p>${h(r.k)}</p></details>`).join('')}</div>`}
function shell(title,compact=false){return `<details class="v20outline ${compact?'compact':''}" data-v20-title="${h(title)}" open><summary><span><b>Plan du cours par diapositive</b><small>1 titre principal par diapo • phrase clé</small></span><em>⌄</em></summary><div class="v20outlineBody"><div class="v20loading">Analyse des titres du PDF…</div></div></details>`}
async function hydrate(box,title,compact=false){if(box.dataset.v20hydrated===title)return;box.dataset.v20hydrated=title;const body=box.querySelector('.v20outlineBody');const rows=await extractSlides(title);if(!body||box.dataset.v20hydrated!==title)return;body.innerHTML=rows.length?rowsHTML(rows,compact):'<div class="v20loading">Plan indisponible pour ce support.</div>';box.querySelector(':scope > summary small').textContent=`${rows.length} diapositive${rows.length>1?'s':''} • titre principal + phrase clé`}
function injectSummary(){document.querySelectorAll('.v15summary').forEach(s=>{const title=s.querySelector('.v15sumHead p')?.textContent?.trim();if(!title)return;s.querySelectorAll('.v19outline').forEach(x=>x.remove());const existing=[...s.querySelectorAll('.v20outline')].find(x=>x.dataset.v20Title===title);if(existing)return;s.querySelectorAll('.v20outline').forEach(x=>x.remove());const src=s.querySelector('.v15source');(src||s).insertAdjacentHTML(src?'beforebegin':'beforeend',shell(title,false));const box=[...s.querySelectorAll('.v20outline')].find(x=>x.dataset.v20Title===title);if(box)hydrate(box,title,false)})}
function qcmTitle(){return document.querySelector('.seriesBar b')?.textContent?.replace(/^Plan\s*•\s*/i,'').trim()||''}
function injectQcm(){const q=document.querySelector('.rpPlanQuestion');if(!q)return;const title=qcmTitle();if(!title)return;q.querySelectorAll('.v19qOutline').forEach(x=>x.remove());const existing=[...q.querySelectorAll('.v20qOutline .v20outline')].find(x=>x.dataset.v20Title===title);if(existing)return;q.querySelectorAll('.v20qOutline').forEach(x=>x.remove());const wrap=document.createElement('div');wrap.className='v20qOutline';wrap.innerHTML=shell(title,true);q.appendChild(wrap);const box=wrap.querySelector('.v20outline');if(box)hydrate(box,title,true)}
function wideCourse(){const detail=document.querySelector('.courseDetail');if(!detail)return;detail.classList.add('v20wide');const main=detail.querySelector('.detailMain');if(main)main.classList.add('v20wideMain')}
function addSummaryToggle(){const course=document.querySelector('.courseDetail .v15course');if(!course||course.querySelector('.v20sumToggle'))return;const summary=course.querySelector('.v15summary');if(!summary)return;const b=document.createElement('button');b.type='button';b.className='v19sumToggle v20sumToggle';b.textContent='Masquer la synthèse';b.onclick=()=>{const hidden=course.classList.toggle('v19summaryHidden');b.textContent=hidden?'Afficher la synthèse':'Masquer la synthèse';setTimeout(()=>window.dispatchEvent(new Event('resize')),80)};course.prepend(b)}
function fixSelectNone(){const b=document.getElementById('rpSelectNone');if(!b||b.dataset.v20fixed)return;b.dataset.v20fixed='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();document.querySelectorAll('[data-rp-menu-q],[data-rp-menu-course]').forEach(x=>{if(x.checked)x.click()});setTimeout(()=>{document.querySelectorAll('[data-rp-menu-q],[data-rp-menu-course]').forEach(x=>x.checked=false);const launch=document.getElementById('rpLaunch');if(launch)launch.disabled=true;const span=document.querySelector('.rpMenuActions span');if(span)span.textContent='0 QCM sélectionné(s)'},25)},true)}
function makeResizeAware(){document.querySelectorAll('.courseDetail .v17stage').forEach(stage=>{if(stage.dataset.v20resize)return;stage.dataset.v20resize='1';new ResizeObserver(()=>window.dispatchEvent(new Event('resize'))).observe(stage)})}
let timer;function tick(){clearTimeout(timer);timer=setTimeout(()=>{wideCourse();injectSummary();injectQcm();addSummaryToggle();fixSelectNone();makeResizeAware()},100)}
new MutationObserver(tick).observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('resize',()=>{});setTimeout(tick,250);
window.PULSE_OUTLINE_V20={extractSlides};
})();