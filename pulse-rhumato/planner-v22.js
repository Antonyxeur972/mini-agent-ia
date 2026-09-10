(()=>{
if(!window.PULSE_REVISION_PLAN)return;
const rp=window.PULSE_REVISION_PLAN.state();
const PLAN_KEY='pulseRhumatoRevisionPlanV12';
let picked=null,pickedKey='',series=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pct=(n,d)=>d?Math.round(n/d*100):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const keyRx=/(polyarthrite|\bpr\b|spondylo|\bspa\b|lupus|vascularit|infection|arthrite récente|microcrist|colchicine|cortic|ost[eé]opor|ponction|infiltration|hypercalc|art[eé]rite.*cellules|ppr|biom[eé]dicament|th[eé]rapie cibl[eé]e|sj[oö]gren|scl[eé]roderm|myopath|[eé]cho|doppler|mode b|poignet|[eé]paule|genou|cheville)/i;
const isPriority=c=>keyRx.test((c?.title||'')+' '+(c?.module||''));
const qDone=q=>!!state.answers?.[q.id]?.validated;
const cDone=c=>!!rp.completed?.[c.id];
function savePlan(){localStorage.setItem(PLAN_KEY,JSON.stringify(rp))}
function asDate(s){return new Date((s||today())+'T12:00:00')}
function daysBetween(a,b){return Math.max(0,Math.floor((asDate(b)-asDate(a))/864e5))}
function plusDays(s,n){const d=asDate(s);d.setDate(d.getDate()+n);return d}
function frDate(d){return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(d)}
function sortedCourses(xs){return [...xs].sort((a,b)=>(+isPriority(b)-+isPriority(a))||String(a.module||'').localeCompare(String(b.module||''),'fr')||a.title.localeCompare(b.title,'fr'))}
function questionWeight(q){let w=0;if(q.anchor||/socle|ancrage/i.test((q.sourceLabel||'')+' '+(q.priority||'')))w+=10;if(/P1|priorit/i.test(q.priority||''))w+=4;return w}
function metrics(){
 rp.duration=clamp(+rp.duration||60,7,180);rp.startedAt=rp.startedAt||today();rp.completed=rp.completed||{};
 const day=clamp(daysBetween(rp.startedAt,today())+1,1,rp.duration),left=Math.max(1,rp.duration-day+1),completedDays=Math.max(0,day-1);
 const totalCourses=COURSES.length,doneCourses=COURSES.filter(cDone).length,remainingCourses=totalCourses-doneCourses;
 const totalQ=Q.length,doneQ=Q.filter(qDone).length,remainingQ=totalQ-doneQ;
 const nominalQ=totalQ?Math.ceil(totalQ/rp.duration):0;
 const dailyQ=remainingQ?Math.ceil(remainingQ/left):0;
 const minCourses=remainingCourses?Math.max(1,Math.ceil(remainingCourses/left)):0;
 const pool=sortedCourses(COURSES.filter(c=>!cDone(c)));
 let courses=pool.slice(0,minCourses),titles=new Set(courses.map(c=>c.title));
 let available=Q.filter(q=>!qDone(q)&&titles.has(q.course)).length;
 for(let i=courses.length;available<dailyQ&&i<pool.length;i++){
   const c=pool[i];courses.push(c);titles.add(c.title);available+=Q.filter(q=>!qDone(q)&&q.course===c.title).length;
 }
 let questions=Q.filter(q=>!qDone(q)&&titles.has(q.course)).sort((a,b)=>questionWeight(b)-questionWeight(a));
 if(questions.length<dailyQ){
   const used=new Set(questions.map(q=>q.id));
   questions.push(...Q.filter(q=>!qDone(q)&&!used.has(q.id)).sort((a,b)=>questionWeight(b)-questionWeight(a)));
 }
 questions=questions.slice(0,dailyQ);
 const expectedStartQ=Math.floor(totalQ*completedDays/rp.duration),deltaQ=doneQ-expectedStartQ;
 const threshold=Math.max(3,Math.ceil(nominalQ*.45));
 const pace=deltaQ>threshold?'ahead':deltaQ<-threshold?'behind':'ontrack';
 const expectedStartC=Math.floor(totalCourses*completedDays/rp.duration),deltaC=doneCourses-expectedStartC;
 const cPct=pct(doneCourses,totalCourses),qPct=pct(doneQ,totalQ),overall=Math.round((cPct+qPct)/2);
 return{day,left,completedDays,totalCourses,doneCourses,remainingCourses,totalQ,doneQ,remainingQ,nominalQ,dailyQ,minCourses,courses,questions,deltaQ,deltaC,pace,cPct,qPct,overall,deadline:plusDays(rp.startedAt,rp.duration-1)};
}
function paceCopy(m){
 if(!m.remainingCourses&&!m.remainingQ)return{title:'Objectif terminé',body:'Tous les cours et tous les QCM sont terminés.',tone:'good',icon:'✓'};
 if(m.pace==='ahead')return{title:'En avance',body:`Tu as ${m.deltaQ} QCM d’avance sur la trajectoire. Pulse réduit automatiquement la charge restante à ${m.dailyQ} QCM aujourd’hui.`,tone:'good',icon:'↘'};
 if(m.pace==='behind')return{title:'Rattrapage adaptatif',body:`Tu es à ${Math.abs(m.deltaQ)} QCM sous la trajectoire. Pulse augmente temporairement la charge à ${m.dailyQ} QCM pour garder la même échéance.`,tone:'warn',icon:'↗'};
 return{title:'Dans le rythme',body:`La charge du jour est recalculée sur ce qu’il reste réellement : ${m.courses.length} cours et ${m.dailyQ} QCM.`,tone:'ok',icon:'≈'};
}
function courseRow(c,i,m){const n=m.questions.filter(q=>q.course===c.title).length;return `<article class="p22Course ${isPriority(c)?'priority':''}"><span class="p22Index">${String(i+1).padStart(2,'0')}</span><div class="p22CourseText"><strong>${esc(c.title)}</strong><small>${esc(c.module)} • ${n} QCM aujourd’hui${isPriority(c)?' • priorité stage':''}</small></div><button class="p22Read" data-p22-read="${c.id}">Ouvrir</button><label class="p22Check"><input type="checkbox" data-p22-course="${c.id}" ${cDone(c)?'checked':''}><span></span>Étudié</label></article>`}
function planView22(){
 const m=metrics(),pace=paceCopy(m),qShift=m.dailyQ-m.nominalQ;
 return shell(`<section class="p22Hero fade"><div class="p22HeroCopy"><div class="p22Kicker">✦ PLAN ADAPTATIF • JOUR ${m.day}/${rp.duration}</div><h2>Ton programme se recalcule à chaque QCM.</h2><p>Choisis uniquement ton délai. Pulse répartit <b>${m.totalCourses} cours</b> et <b>${m.totalQ} QCM</b>, puis baisse ou augmente automatiquement la charge selon ce que tu réalises réellement.</p><div class="p22Deadline"><span>Échéance</span><b>${frDate(m.deadline)}</b><em>${m.left} jour${m.left>1?'s':''} restant${m.left>1?'s':''}</em></div></div><div class="p22Gauge" style="--p:${m.overall}%"><div><strong>${m.overall}%</strong><span>progression globale</span></div></div></section>
 <section class="p22Metrics fade"><article><span class="p22MetricIcon mint">▤</span><div><small>Cours aujourd’hui</small><strong>${m.courses.length}</strong><em>${m.remainingCourses} encore à voir</em></div></article><article><span class="p22MetricIcon blue">✦</span><div><small>QCM aujourd’hui</small><strong>${m.dailyQ}</strong><em>${qShift===0?'charge nominale':`${qShift>0?'+':''}${qShift} vs rythme initial`}</em></div></article><article><span class="p22MetricIcon gold">◷</span><div><small>Temps restant</small><strong>${m.left} j</strong><em>${m.remainingQ} QCM restants</em></div></article><article class="${pace.tone}"><span class="p22MetricIcon">${pace.icon}</span><div><small>Moteur adaptatif</small><strong>${pace.title}</strong><em>${m.deltaQ>=0?'+':''}${m.deltaQ} QCM vs trajectoire</em></div></article></section>
 <section class="p22Dashboard fade"><div class="p22Main"><article class="card p22Today"><header><div><div class="eyebrow">PROGRAMME DU JOUR</div><h3>${m.courses.length} cours • ${m.dailyQ} QCM</h3></div><button class="btn primary" id="p22Start" ${m.dailyQ||m.courses.length?'':'disabled'}>Commencer la session →</button></header><div class="p22Coach ${pace.tone}"><span>${pace.icon}</span><div><b>${pace.title}</b><p>${pace.body}</p></div></div><div class="p22CourseList">${m.courses.map((c,i)=>courseRow(c,i,m)).join('')||'<div class="p22Empty">Tous les cours sont validés. Pulse continue de répartir les QCM restants jusqu’à l’échéance.</div>'}</div></article>
 <article class="card p22Progress"><header><div><div class="eyebrow">TRAJECTOIRE</div><h3>Tout finir à la même date</h3></div><strong>${m.overall}%</strong></header><div class="p22Bars"><label><span>Cours <b>${m.doneCourses}/${m.totalCourses}</b></span><em>${m.cPct}%</em></label><i><u style="width:${m.cPct}%"></u></i><label><span>QCM <b>${m.doneQ}/${m.totalQ}</b></span><em>${m.qPct}%</em></label><i class="blue"><u style="width:${m.qPct}%"></u></i></div><div class="p22Formula"><span>Calcul en direct</span><div><b>${m.remainingCourses}</b><small>cours restants</small><strong>÷</strong><b>${m.left}</b><small>jours</small><strong>→</strong><b>${m.courses.length}</b><small>cours aujourd’hui</small></div><div><b>${m.remainingQ}</b><small>QCM restants</small><strong>÷</strong><b>${m.left}</b><small>jours</small><strong>→</strong><b>${m.dailyQ}</b><small>QCM aujourd’hui</small></div></div></article></div>
 <aside class="card p22Settings"><div class="eyebrow">OBJECTIF TEMPS</div><h3>En combien de jours veux-tu tout faire ?</h3><div class="p22Days"><strong>${rp.duration}</strong><span>jours</span></div><input id="p22Duration" type="range" min="7" max="180" step="1" value="${rp.duration}"><div class="p22Presets">${[14,21,30,45,60,90].map(d=>`<button data-p22-days="${d}" class="${d===+rp.duration?'active':''}">${d} j</button>`).join('')}</div><div class="p22Insight"><b>Répartition automatique</b><p>Plus tu fais de QCM, plus le quota suivant diminue. Si tu prends du retard, le quota augmente sans changer ta date cible.</p></div><button class="btn ghost" id="p22Restart">Repartir d’aujourd’hui</button></aside></section>`);
}
function prepareSelection(){const m=metrics(),k=[today(),rp.duration,m.dailyQ,m.doneQ,m.remainingCourses].join('|');if(picked===null||pickedKey!==k){picked=new Set(m.questions.map(q=>q.id));pickedKey=k}return m}
function planMenu22(){const m=prepareSelection(),groups=new Map();for(const q of m.questions){if(!groups.has(q.course))groups.set(q.course,[]);groups.get(q.course).push(q)}return shell(`<section class="p22Menu fade"><header><div><button class="backBtn" id="p22Back">← Plan adaptatif</button><div class="eyebrow">SESSION DU JOUR</div><h2>${picked.size} QCM sélectionné${picked.size>1?'s':''}</h2><p>Le quota conseillé est ${m.dailyQ}. Tu peux l’ajuster manuellement pour cette session.</p></div><div class="p22MenuActions"><button class="btn ghost" id="p22All">Tout sélectionner</button><button class="btn ghost" id="p22None">Tout décocher</button></div></header><div class="p22MenuGrid"><div class="p22Groups">${[...groups.entries()].map(([name,qs])=>{const c=COURSES.find(x=>x.title===name);return `<article class="card"><header><div><strong>${esc(name)}</strong><small>${esc(c?.module||'')} • ${qs.length} QCM</small></div>${c?`<button data-p22-read="${c.id}">Lire le cours</button>`:''}</header><div>${qs.map((q,i)=>`<label class="p22Q ${q.anchor?'anchor':''}"><input type="checkbox" data-p22-q="${q.id}" ${picked.has(q.id)?'checked':''}><span><b>${q.anchor?'◆ ANCRAGE':'QCM '+(i+1)}</b>${esc(q.stem)}</span><em>${qDone(q)?'✓':'○'}</em></label>`).join('')}</div></article>`}).join('')||'<div class="p22Empty">Aucun QCM restant dans le plan.</div>'}</div><aside class="card p22Launch"><span>Session</span><strong id="p22PickedCount">${picked.size}</strong><small>QCM sélectionnés</small><button class="btn primary" id="p22Launch" ${picked.size?'':'disabled'}>Lancer →</button></aside></div></section>`)}
function currentQ(){return series?.ids?.length?Q.find(q=>q.id===series.ids[series.pos]):null}
function planQuiz22(){if(!series||series.pos>=series.ids.length)return planEnd22();const q=currentQ(),a=state.answers[q.id]||{},n=series.pos,total=series.ids.length;return shell(`<div class="seriesBar fade"><div><b>Plan • ${esc(q.course)}</b><span>${n+1}/${total} • ${pct(n,total)}% terminé</span></div><div><i style="width:${pct(n,total)}%"></i></div></div><section class="card question ${q.anchor?'goldQuestion':''} rpPlanQuestion fade"><div class="qhead"><div class="tags"><span class="tag ${q.anchor?'goldTag':'p1'}">${q.anchor?'◆ ANCRAGE':'PLAN ADAPTATIF'}</span><span class="tag">${esc(q.module||'')}</span></div><span class="counter">${n+1}/${total}</span></div><div class="stem">${esc(q.stem)}</div><div class="options">${q.options.map((o,i)=>{let cl=a.selected===i?' selected':'';if(a.validated&&i===q.answer)cl+=' correct';else if(a.validated&&a.selected===i&&i!==q.answer)cl+=' wrong';return `<button class="option${cl}" data-p22-opt="${i}" ${a.validated?'disabled':''}><span class="letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`}).join('')}</div><div class="actions">${!a.validated?`<button class="btn primary" id="p22Validate" ${a.selected===undefined?'disabled':''}>Valider</button>`:`<button class="btn primary" id="p22Next">${n===total-1?'Terminer':'Question suivante →'}</button>`}</div>${a.validated?`<div class="feedback ${a.correct?'':'bad'}"><b>${a.correct?'✓ Bonne réponse':'Correction'}</b><br>${esc(q.correction||'')}</div>`:''}</section>`)}
function planEnd22(){const qs=(series?.ids||[]).map(id=>Q.find(q=>q.id===id)).filter(Boolean),good=qs.filter(q=>state.answers[q.id]?.correct).length,m=metrics();return shell(`<section class="card p22End fade"><div class="p22EndIcon">✓</div><div class="eyebrow">SESSION TERMINÉE</div><h2>${qs.length} QCM réalisés</h2><strong>${pct(good,qs.length)}%</strong><p>Le plan vient d’être recalculé : <b>${m.dailyQ} QCM</b> et <b>${m.courses.length} cours</b> constituent maintenant la charge recommandée.</p><button class="btn primary" id="p22End">Voir le plan recalculé →</button></section>`)}
function bind22(){
 document.querySelectorAll('[data-p22-days]').forEach(b=>b.onclick=()=>{rp.duration=+b.dataset.p22Days;savePlan();picked=null;render()});
 const slider=document.getElementById('p22Duration');if(slider){slider.oninput=e=>{const v=document.querySelector('.p22Days strong');if(v)v.textContent=e.target.value};slider.onchange=e=>{rp.duration=+e.target.value;savePlan();picked=null;render()}}
 document.querySelectorAll('[data-p22-course]').forEach(x=>x.onchange=()=>{rp.completed=rp.completed||{};x.checked?rp.completed[x.dataset.p22Course]=new Date().toISOString():delete rp.completed[x.dataset.p22Course];savePlan();picked=null;render()});
 document.querySelectorAll('[data-p22-read]').forEach(b=>b.onclick=()=>{selectedCourse=b.dataset.p22Read;view='courses';render()});
 const restart=document.getElementById('p22Restart');if(restart)restart.onclick=()=>{if(confirm('Repartir d’aujourd’hui ? La progression déjà réalisée sera conservée.')){rp.startedAt=today();savePlan();picked=null;render()}};
 const start=document.getElementById('p22Start');if(start)start.onclick=()=>{picked=null;prepareSelection();view='planmenu';render()};
 const back=document.getElementById('p22Back');if(back)back.onclick=()=>{view='plan';render()};
 document.querySelectorAll('[data-p22-q]').forEach(x=>x.onchange=()=>{x.checked?picked.add(x.dataset.p22Q):picked.delete(x.dataset.p22Q);const n=document.getElementById('p22PickedCount');if(n)n.textContent=picked.size;const l=document.getElementById('p22Launch');if(l)l.disabled=!picked.size});
 const all=document.getElementById('p22All');if(all)all.onclick=()=>{picked=new Set(metrics().questions.map(q=>q.id));render()};
 const none=document.getElementById('p22None');if(none)none.onclick=()=>{picked.clear();render()};
 const launch=document.getElementById('p22Launch');if(launch)launch.onclick=()=>{if(!picked.size)return;series={ids:[...picked],pos:0};view='planseries';render()};
 document.querySelectorAll('[data-p22-opt]').forEach(b=>b.onclick=()=>{const q=currentQ(),a=state.answers[q.id]||{};if(a.validated)return;state.answers[q.id]={...a,selected:+b.dataset.p22Opt};save();render()});
 const valid=document.getElementById('p22Validate');if(valid)valid.onclick=()=>{const q=currentQ(),a=state.answers[q.id]||{};if(a.selected===undefined)return;touchActivity();state.answers[q.id]={...a,validated:true,correct:a.selected===q.answer,date:today()};state.xp=(state.xp||0)+(a.selected===q.answer?20:10);save();render()};
 const next=document.getElementById('p22Next');if(next)next.onclick=()=>{series.pos++;view=series.pos>=series.ids.length?'planend':'planseries';render()};
 const end=document.getElementById('p22End');if(end)end.onclick=()=>{series=null;picked=null;view='plan';render()};
}
const previousRender=render;
render=function(){
 const host=document.getElementById('root');
 if(view==='plan'){host.innerHTML=planView22();bind();bind22();window.PULSE_PREMIUM_NAV?.();return}
 if(view==='planmenu'){host.innerHTML=planMenu22();bind();bind22();window.PULSE_PREMIUM_NAV?.();return}
 if(view==='planseries'){host.innerHTML=planQuiz22();bind();bind22();window.PULSE_PREMIUM_NAV?.();return}
 if(view==='planend'){host.innerHTML=planEnd22();bind();bind22();window.PULSE_PREMIUM_NAV?.();return}
 previousRender();window.PULSE_PREMIUM_NAV?.();
};
window.PULSE_AI_PLAN_V22={calc:metrics};
window.PULSE_AI_PLAN_V21={calc:metrics};
})();