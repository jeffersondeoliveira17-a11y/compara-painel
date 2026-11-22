// Só carrega o código do painel depois que o administrador entrou.
window.painelCarregarScript = () => {
  const s = document.createElement('script');
  s.src = 'painel.js?v=' + (window.PAINEL_VERSAO || '3');
  s.onload = () => { window.painelDesenhaTudo(); const k = document.createElement('script'); k.src = 'kpis.js?v=' + (window.PAINEL_VERSAO || '3'); document.body.append(k); };
  document.body.append(s);
};
