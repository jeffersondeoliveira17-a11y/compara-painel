// Só carrega o código do painel depois que o administrador entrou.
window.painelCarregarScript = () => {
  const s = document.createElement('script');
  s.src = 'painel.js?v=' + (window.PAINEL_VERSAO || '4');
  s.onload = () => { window.painelDesenhaTudo(); const k = document.createElement('script'); k.src = 'kpis.js?v=' + (window.PAINEL_VERSAO || '4'); document.body.append(k); };
  document.body.append(s);
};
