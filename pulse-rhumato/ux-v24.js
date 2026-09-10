(()=>{
let showDone=false;
const rp=()=>window.PULSE_REVISION_PLAN?.state?.();
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function savePlan(){const r=rp();if(r)localStorage.setItem('pulseRhumatoRevisionPlanV12',JSON.stringify(r))}
function doneCourses(){const r=rp();return r?(window.PULSE_COURSES||[]).filter(c=>!!r.completed?.[c.id]):[]}
function installDoneDrawer(){
 const host=document.querySelector('.p22Dashboard');if(!host||document.querySelector('.p24DoneWrap'))return;
 const done=doneCourses();const wrap=document.createElement('section');wrap.className='card p24DoneWrap';
 wrap.innerHTML=`<button type="button" class="p24DoneToggle"><span><b>✓ Cours déjà faits</b><small>${done.length} cours validé${done.length>1?'s':''}</small></span><em>${showDone?'Masquer':'Afficher'} ↓</em></button><div class="p24DoneList" ${showDone?'':'hidden'}>${done.length?done.map(c=>`<article><div><strong>${esc(c.title)}</strong><small>${esc(c.module||'')}</small></div><button type="button" data-p24-reopen="${c.id}">Revoir le cours</button></article>`).join(''):'<p>Aucun cours validé pour le moment.</p>'}</div>`;
 host.insertAdjacentElement('afterend',wrap);
 wrap.querySelector('.p24DoneToggle').onclick=()=>{showDone=!showDone;wrap.remove();installDoneDrawer()};
 wrap.querySelectorAll('[data-p24-reopen]').forEach(b=>b.onclick=()=>{selectedCourse=b.dataset.p24Reopen;view='courses';render()});
}
function markDone(id,row){const r=rp();if(!r||!id)return;r.completed=r.completed||{};if(r.completed[id])return;r.completed[id]=new Date().toISOString();savePlan();row?.classList.add('p24Committed');setTimeout(()=>render(),220)}
function installSwipe(){
 document.querySelectorAll('.p22Course').forEach(row=>{
  if(row.dataset.p24Swipe)return;row.dataset.p24Swipe='1';const cb=row.querySelector('[data-p22-course]');const id=cb?.dataset.p22Course;if(!id)return;
  const check=row.querySelector('.p22Check');if(check){check.innerHTML='<span class="p24SwipeHint">→ Glisser pour terminer</span>';check.removeAttribute('for')}
  let sx=0,sy=0,dx=0,active=false;
  row.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,input'))return;active=true;sx=e.clientX;sy=e.clientY;dx=0;row.setPointerCapture?.(e.pointerId);row.classList.add('p24Dragging')});
  row.addEventListener('pointermove',e=>{if(!active)return;const x=e.clientX-sx,y=e.clientY-sy;if(Math.abs(y)>Math.abs(x)*1.1&&Math.abs(y)>18){row.style.removeProperty('--swipe');return}dx=Math.max(0,Math.min(150,x));row.style.setProperty('--swipe',dx+'px');if(dx>85)row.classList.add('p24Ready');else row.classList.remove('p24Ready')});
  const finish=e=>{if(!active)return;active=false;row.classList.remove('p24Dragging');if(dx>90)markDone(id,row);else{row.style.setProperty('--swipe','0px');row.classList.remove('p24Ready')}try{row.releasePointerCapture?.(e.pointerId)}catch{}};
  row.addEventListener('pointerup',finish);row.addEventListener('pointercancel',finish);
 })
}
function removeDuplicateCorrection(){
 document.querySelectorAll('.v18StudyGrid').forEach(grid=>{
   const duplicate=grid.querySelector('.v15correction,.v17correction');if(duplicate)duplicate.remove();
 });
 document.querySelectorAll('.rpPlanQuestion').forEach(q=>{const grid=q.closest('.v18StudyGrid');if(!grid)return;let n=grid.nextElementSibling;if(n?.matches?.('.v15correction,.v17correction'))n.remove()});
}
let timer;function run(){clearTimeout(timer);timer=setTimeout(()=>{installSwipe();installDoneDrawer();removeDuplicateCorrection()},70)}
new MutationObserver(run).observe(document.documentElement,{subtree:true,childList:true});setTimeout(run,220);
window.PULSE_UX_V24={markDone,doneCourses};
})();