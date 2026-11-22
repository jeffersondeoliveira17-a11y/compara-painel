// Só carrega o código do painel depois que o administrador entrou.
window.painelCarregarScript = () => {
  const s = document.createElement('script');
  s.src = 'painel.js?v=' + (window.PAINEL_VERSAO || '6');
  s.onload = () => { window.painelDesenhaTudo(); const k = document.createElement('script'); k.src = 'kpis.js?v=' + (window.PAINEL_VERSAO || '6'); document.body.append(k); k.onload = () => { const a = document.createElement('script'); a.src = 'area.js?v=' + (window.PAINEL_VERSAO || '6'); a.onload = () => { const r = document.createElement('script'); r.src = 'rodizio.js?v=' + (window.PAINEL_VERSAO || '15'); r.onload = () => { const f = document.createElement('script'); f.src = 'foto.js?v=' + (window.PAINEL_VERSAO || '15'); document.body.append(f); }; document.body.append(r); }; document.body.append(a); }; };
  document.body.append(s);
};
