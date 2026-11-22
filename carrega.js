// Só carrega o código do painel depois que o administrador entrou.
window.painelCarregarScript = () => {
  const s = document.createElement('script');
  s.src = 'painel.js?v=' + (window.PAINEL_VERSAO || '13');
  s.onload = () => { window.painelDesenhaTudo(); const k = document.createElement('script'); k.src = 'kpis.js?v=' + (window.PAINEL_VERSAO || '13'); document.body.append(k); k.onload = () => { const a = document.createElement('script'); a.src = 'area.js?v=' + (window.PAINEL_VERSAO || '13'); document.body.append(a); }; };
  document.body.append(s);
};
