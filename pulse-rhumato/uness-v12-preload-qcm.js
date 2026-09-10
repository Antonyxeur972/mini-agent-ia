(()=>{
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set('de du des la le les un une et en au aux a d l pour dans sur par avec cours cofer v revu final ok audio son phase socle approfondissement diagnostic traitement prise charge therapeutique savoir faire'.split(' '));
const toks=s=>norm(s).split(' ').filter(x=>x.length>2&&!stop.has(x)&&!/^[0-9]+$/.test(x));
function score(title,file){const a=toks(title),b=toks(file);if(!a.length||!b.length)return 0;let s=0;for(const x of a){if(b.includes(x))s+=x.length>=7?4:2;else if(b.some(y=>y.includes(x)||x.includes(y)))s+=1}const nt=norm(title),nf=norm(file);if(nf.includes(nt)||nt.includes(nf.replace(/ pdf$/,'')))s+=20;return s}
function docFrom(arr,title){let best=null,bs=0;for(const d of (arr||[])){const s=score(title,d.f||d.file);if(s>bs){bs=s;best=d}}return bs>=2?best:null}
function factsFor(title){return docFrom(window.PULSE_UNESS_FACTS_V12,title)}
function clean(x=''){return x.replace(/^\d+\s+/,'').replace(/[•]/g,'').replace(/\s+/g,' ').trim()}
function badFact(x){return !x||x.length<35||/^(figure|tableau|référence|service de rhumatologie|traiter en urgence les complications\s*:?$)/i.test(x)}
const genericWrong=['Le support recommande de prendre la décision sur un seul examen isolé, sans tenir compte du contexte clinique.','Le support indique que la surveillance, les contre-indications et la tolérance peuvent être ignorées.','Le support conclut qu’aucune hiérarchisation diagnostique ou thérapeutique n’est nécessaire.'];
const bank=window.PULSE_QUESTIONS||[];
for(const c of (window.PULSE_COURSES||[])){
 const d=factsFor(c.title); if(!d)continue;
 const facts=(d.facts||[]).map(clean).filter(x=>!badFact(x));
 const uniq=[];for(const f of facts){if(!uniq.some(x=>norm(x).slice(0,90)===norm(f).slice(0,90)))uniq.push(f);if(uniq.length>=6)break}
 if(!uniq.length)continue;
 uniq.slice(0,Math.min(2,uniq.length)).forEach((f,i)=>{const id=`v12-anchor-${c.id}-${i+1}`;if(bank.some(q=>q.id===id))return;bank.push({id,course:c.title,module:c.module,priority:'SOCLE',anchor:true,sourceLabel:'PDF UNESS • QCM d’ancrage indispensable',stem:`ANCRAGE ${i+1} — Quel message du support « ${c.title} » est indispensable à retenir ?`,options:[f,...genericWrong],answer:0,correction:`Point d’ancrage à mémoriser : ${f}`})});
 uniq.slice(2,6).forEach((f,i)=>{const id=`v12-${c.id}-${i+1}`;if(bank.some(q=>q.id===id))return;bank.push({id,course:c.title,module:c.module,priority:/Phase socle/.test(c.module)?'P1 Stage':'P2',sourceLabel:'PDF UNESS • texte du support',stem:`D’après le support « ${c.title} », quelle proposition correspond à un élément réellement enseigné ?`,options:[f,...genericWrong],answer:0,correction:`Le support enseigne : ${f}`})});
}
window.PULSE_QUESTIONS=bank;
window.PULSE_V12_FACTS_FOR=factsFor;
})();