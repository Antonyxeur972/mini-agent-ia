(()=>{
const h=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
function addFullscreen(root=document){root.querySelectorAll('.v17viewer').forEach(v=>{const tb=v.querySelector('.v17toolbar');if(!tb||tb.querySelector('.v18full'))return;const b=document.createElement('button');b.className='v18full';b.type='button';b.textContent='⛶ Plein écran';b.onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else v.requestFullscreen?.()};tb.appendChild(b)})}
function stopViewer(host){
 try{host._pulseRenderTask?.cancel?.()}catch{}
 try{host._pulseLoadingTask?.destroy?.()}catch{}
 host._pulseRenderTask=null;host._pulseLoadingTask=null;
}
async function miniViewer(host,title){
 if(!host||host.dataset.ready==='1'&&host.dataset.title===title)return;
 stopViewer(host);
 const generation=String((+host.dataset.generation||0)+1);host.dataset.generation=generation;host.dataset.ready='1';host.dataset.title=title;
 host.innerHTML=`<section class="v15pdf v17pdf"><div class="v15pdfHead"><div><span>COURS À CÔTÉ DU QCM</span><b>${h(title)}</b></div><span class="v15pdfState">Chargement…</span></div><div class="v15pdfBody"><div class="v15pdfEmpty"><div class="v15docIcon">PDF</div><b>Ouverture du support…</b></div></div></section>`;
 try{
  const api=window.PULSE_PDF_READER;if(!api?.pdfFor)throw new Error('lecteur indisponible');
  const found=await api.pdfFor(title,'qcmside');if(host.dataset.generation!==generation)return;if(!found)throw new Error('PDF non disponible');
  const body=host.querySelector('.v15pdfBody'),state=host.querySelector('.v15pdfState');if(!body||!state)return;
  state.textContent=found.cloud?'☁ PDF cloud':'PDF local';state.classList.add('ready');
  body.innerHTML=`<div class="v17viewer"><div class="v17toolbar"><button data-pdf-prev>←</button><span>Page <b data-pdf-page>1</b> / <b data-pdf-total>…</b></span><button data-pdf-next>→</button><span class="v17sep"></span><button data-pdf-minus>−</button><span data-pdf-zoom>100%</span><button data-pdf-plus>+</button><a href="${h(found.url)}" target="_blank" rel="noopener">Ouvrir ↗</a></div><div class="v17stage"><canvas></canvas><div class="v17loading">Chargement…</div></div><div class="v15pdfTools"><span>${h(found.file)}</span></div></div>`;
  const pdfjs=window.pdfjsLib;if(!pdfjs)throw new Error('PDF.js indisponible');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  const loadingTask=pdfjs.getDocument({url:found.url});host._pulseLoadingTask=loadingTask;const pdf=await loadingTask.promise;if(host.dataset.generation!==generation)return;
  let page=1,zoom=1,renderSeq=0;
  const canvas=body.querySelector('canvas'),ctx=canvas?.getContext('2d'),stage=body.querySelector('.v17stage'),loading=body.querySelector('.v17loading');if(!canvas||!ctx||!stage)return;
  body.querySelector('[data-pdf-total]').textContent=pdf.numPages;
  async function draw(){
   const seq=++renderSeq;
   try{host._pulseRenderTask?.cancel?.()}catch{}
   if(host.dataset.generation!==generation)return;
   loading.style.display='grid';
   try{
    const p=await pdf.getPage(page);if(seq!==renderSeq||host.dataset.generation!==generation)return;
    const base=p.getViewport({scale:1});const fit=Math.max(.35,Math.min(2,(stage.clientWidth-24)/base.width));const vp=p.getViewport({scale:fit*zoom});const ratio=window.devicePixelRatio||1;
    canvas.width=Math.floor(vp.width*ratio);canvas.height=Math.floor(vp.height*ratio);canvas.style.width=vp.width+'px';canvas.style.height=vp.height+'px';ctx.setTransform(ratio,0,0,ratio,0,0);
    const task=p.render({canvasContext:ctx,viewport:vp});host._pulseRenderTask=task;await task.promise;if(seq!==renderSeq||host.dataset.generation!==generation)return;
    const pg=body.querySelector('[data-pdf-page]'),zm=body.querySelector('[data-pdf-zoom]');if(pg)pg.textContent=page;if(zm)zm.textContent=Math.round(zoom*100)+'%';
   }catch(e){if(e?.name!=='RenderingCancelledException')throw e}finally{if(seq===renderSeq&&host.dataset.generation===generation)loading.style.display='none'}
  }
  body.querySelector('[data-pdf-prev]').onclick=()=>{if(page>1){page--;draw()}};body.querySelector('[data-pdf-next]').onclick=()=>{if(page<pdf.numPages){page++;draw()}};body.querySelector('[data-pdf-minus]').onclick=()=>{zoom=Math.max(.6,zoom-.1);draw()};body.querySelector('[data-pdf-plus]').onclick=()=>{zoom=Math.min(2.2,zoom+.1);draw()};
  await draw();if(host.dataset.generation===generation)addFullscreen(host)
 }catch(e){if(e?.name==='RenderingCancelledException'||host.dataset.generation!==generation)return;host.dataset.ready='';host.innerHTML=`<section class="v15pdf"><div class="v15pdfEmpty"><div class="v15docIcon">PDF</div><b>Cours non disponible dans ce navigateur.</b><p>${h(e.message)}</p></div></section>`}
}
function enhanceSeries(){const q=document.querySelector('.rpPlanQuestion');if(!q)return;const title=document.querySelector('.seriesBar b')?.textContent?.replace(/^Plan\s*•\s*/i,'').trim();if(!title)return;let grid=q.closest('.v18StudyGrid');if(!grid){grid=document.createElement('div');grid.className='v18StudyGrid fade';q.parentNode.insertBefore(grid,q);const side=document.createElement('div');side.className='v18StudyPdf';side.dataset.title=title;grid.appendChild(side);grid.appendChild(q);miniViewer(side,title)}else{const side=grid.querySelector('.v18StudyPdf');if(side&&side.dataset.title!==title){miniViewer(side,title)}}const corr=document.querySelector('.v15correction');if(corr&&corr.parentNode!==grid)grid.appendChild(corr)}
function enhanceCourse(){addFullscreen();const viewer=document.querySelector('.courseDetail .v17viewer');if(viewer){const stage=viewer.querySelector('.v17stage');if(stage&&!stage.dataset.v18resize){stage.dataset.v18resize='1';new ResizeObserver(()=>{const z=viewer.querySelector('[data-pdf-zoom]');if(z)z.title='Ajustement automatique à la largeur'}).observe(stage)}}}
let t;function tick(){clearTimeout(t);t=setTimeout(()=>{enhanceCourse();enhanceSeries()},60)}new MutationObserver(tick).observe(document.documentElement,{subtree:true,childList:true});window.addEventListener('resize',tick);setTimeout(tick,180);
})();