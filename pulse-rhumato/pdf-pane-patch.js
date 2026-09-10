(()=>{
function escHtml(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function enhance(){
  document.querySelectorAll('.supportPane').forEach(p=>{
    if(p.dataset.pdfPatched==='1')return;
    const title=p.querySelector('h3')?.textContent?.trim();
    const m=window.PULSE_PDF_BY_COURSE?.[title];
    if(!m)return;
    p.dataset.pdfPatched='1';
    const frame=p.querySelector('.supportFrame');
    const topLink=p.querySelector('.supportTop a');
    if(m.mirrorUrl){
      if(frame)frame.innerHTML=`<iframe src="${m.mirrorUrl}" title="${escHtml(m.filename)}"></iframe>`;
      if(topLink)topLink.href=m.mirrorUrl;
    }else if(frame){
      frame.innerHTML=`<div class="exactPdfCard"><div class="pdfDocIcon">PDF</div><div><div class="eyebrow">Support UNESS exact</div><strong>${escHtml(m.filename)}</strong><small>Identifiant Notion : ${escHtml(m.attachment)}</small><p>Le fichier est bien référencé dans la bibliothèque UNESS. L’API Notion actuelle expose le bloc et le nom du fichier, mais pas les octets du PDF ni une URL signée réutilisable hors Notion.</p><a class="btn primary" href="${window.PULSE_NOTION_LIBRARY}" target="_blank" rel="noopener">Ouvrir ce support dans la bibliothèque Notion ↗</a></div></div>`;
      if(topLink)topLink.href=window.PULSE_NOTION_LIBRARY;
    }
    const mini=p.querySelector('.miniSummary');
    if(mini&&!mini.querySelector('.exactPdfName'))mini.insertAdjacentHTML('afterbegin',`<div class="exactPdfName"><b>PDF associé :</b> ${escHtml(m.filename)}</div>`);
  });
}
const mo=new MutationObserver(enhance);mo.observe(document.documentElement,{subtree:true,childList:true});enhance();
})();