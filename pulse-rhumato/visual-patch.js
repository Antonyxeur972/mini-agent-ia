(()=>{
  if(typeof visualFor!=='function') return;
  const fallback=visualFor;
  visualFor=function(c){
    const vs=window.visualForCourse?window.visualForCourse(c):[];
    if(!vs.length) return fallback(c);
    return `<div class="medicalVisualGrid">${vs.map(v=>`<figure class="medicalVisual"><a href="${v.href}" target="_blank" rel="noopener"><img src="${v.src}" alt="${esc(v.caption)}" loading="lazy"></a><figcaption><b>${esc(v.caption)}</b><small>${esc(v.credit)}</small></figcaption></figure>`).join('')}</div>`;
  };
  if(typeof render==='function') render();
})();