// Só carrega o código do painel depois que o administrador entrou.
window.painelCarregarScript = () => {
  const s = document.createElement('script');
  s.src = 'painel.js?v=' + (window.PAINEL_VERSAO || '2');
  s.onload = () => window.painelDesenhaTudo();
  document.body.append(s);
};
