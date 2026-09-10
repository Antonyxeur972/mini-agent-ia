(()=>{
const byStem=()=>{const card=document.querySelector('.rpPlanQuestion');if(!card)return null;const stem=card.querySelector('.stem')?.textContent?.trim();if(!stem)return null;const course=document.querySelector('.seriesBar b')?.textContent?.replace(/^Plan\s*•\s*/i,'').trim();return (window.PULSE_QUESTIONS||[]).find(q=>q.stem?.trim()===stem&&(!course||q.course===course))||(window.PULSE_QUESTIONS||[]).find(q=>q.stem?.trim()===stem)||null};
function paintChoice(card,q,idx){
 card.querySelectorAll('[data-p22-opt]').forEach(b=>{const i=+b.dataset.p22Opt;b.classList.toggle('selected',i===idx)});
 const validate=card.querySelector('#p22Validate');if(validate)validate.disabled=false;
}
function installSmoothChoice(){
 if(document.documentElement.dataset.p29Choice)return;document.documentElement.dataset.p29Choice='1';
 document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-p22-opt]');if(!b)return;
  const card=b.closest('.rpPlanQuestion');if(!card)return;
  const q=byStem();if(!q)return;
  const a=state.answers[q.id]||{};if(a.validated)return;
  e.preventDefault();e.stopImmediatePropagation();
  const idx=+b.dataset.p22Opt;state.answers[q.id]={...a,selected:idx};
  try{localStorage.setItem('pulseRhumatoV6',JSON.stringify(state))}catch{}
  paintChoice(card,q,idx);
 },true);
}
function plusDaysFromToday(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function currentReview(q){const r=state.reviews?.[q.id];if(!r)return null;if(r.excluded)return{label:'Ne pas revoir',date:null,excluded:true};const ds=Object.values(r.dates||{}).sort();return ds[0]?{label:new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(ds[0]+'T12:00:00')),date:ds[0],excluded:false}:null}
function saveReview(q,date,label){
 state.reviews=state.reviews||{};
 state.reviews[q.id]=date?{dates:{PULSE:date},excluded:false}:{dates:{},excluded:true};
 try{save()}catch{try{localStorage.setItem('pulseRhumatoV6',JSON.stringify(state))}catch{}}
 const box=document.querySelector('.p29ReviewBox');if(box){const s=box.querySelector('.p29ReviewStatus');if(s)s.innerHTML=date?`Prévu <b>${label}</b>`:'<b>Pas de révision programmée</b>';box.querySelectorAll('[data-p29-days]').forEach(x=>x.classList.toggle('active',String(x.dataset.p29Days)===String(label)));box.querySelector('[data-p29-none]')?.classList.toggle('active',!date)}
}
function injectReviewChoice(){
 const card=document.querySelector('.rpPlanQuestion');if(!card||!card.querySelector('.feedback')||card.querySelector('.p29ReviewBox'))return;
 const q=byStem();if(!q)return;const actions=card.querySelector('.actions');if(!actions)return;
 const r=currentReview(q);const box=document.createElement('div');box.className='p29ReviewBox';
 box.innerHTML=`<div class="p29ReviewHead"><div><b>Quand revoir cette question ?</b><small>Choisis une date ou ignore-la.</small></div><span class="p29ReviewStatus">${r?(r.excluded?'<b>Pas de révision programmée</b>':`Prévu <b>${r.label}</b>`):'Aucune date choisie'}</span></div><div class="p29ReviewChoices"><button type="button" data-p29-days="1">J+1</button><button type="button" data-p29-days="2">J+2</button><button type="button" data-p29-days="7">J+7</button><button type="button" data-p29-days="21">J+21</button><button type="button" data-p29-days="30">J+30</button><label class="p29Date"><span>Date</span><input type="date" min="${plusDaysFromToday(0)}"></label><button type="button" data-p29-none>Ne pas revoir</button></div>`;
 actions.insertAdjacentElement('afterend',box);
 box.querySelectorAll('[data-p29-days]').forEach(b=>b.onclick=()=>{const n=+b.dataset.p29Days;saveReview(q,plusDaysFromToday(n),`J+${n}`)});
 const date=box.querySelector('input[type=date]');if(date)date.onchange=()=>{if(date.value)saveReview(q,date.value,new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short'}).format(new Date(date.value+'T12:00:00')))};
 box.querySelector('[data-p29-none]').onclick=()=>saveReview(q,null,'');
}
function quietCloudRender(){
 try{
  if(typeof saveCloud!=='function'||saveCloud._p29)return;
  const quiet=async()=>{if(!user)return;const {error}=await sb.from('app_state').upsert({user_id:user.id,state},{onConflict:'user_id'});syncState=error?'error':'cloud';const box=document.querySelector('.syncbox');if(box){const label=error?'Erreur cloud':'Cloud synchronisé';box.firstChild && (box.innerHTML=`<span class="dot ${error?'':'on'}"${error?' style="background:var(--red)"':''}></span>${label}<br><span>${user?String(user.email||''):''}</span>`)}return !error};
  quiet._p29=true;saveCloud=quiet;
 }catch(e){console.warn('Pulse v29 quiet sync unavailable',e)}
}
let t;function run(){clearTimeout(t);t=setTimeout(()=>{quietCloudRender();injectReviewChoice()},35)}
installSmoothChoice();new MutationObserver(run).observe(document.getElementById('root')||document.documentElement,{subtree:true,childList:true});setTimeout(run,200);
window.PULSE_QUIZ_UX_V29={injectReviewChoice};
})();