// Números do topo da tela Setores (usam os mesmos dados de exemplo da Visão geral).
(() => {
  const fmt = (n) => Number(n).toLocaleString('pt-BR');
  const brl = (n) => 'R$ ' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const set = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
  try {
    const s = window.dash.data('semanas').data, q = window.dash.data('qualidade').data;
    const u = s[s.length - 1];
    set('k-usu', fmt(u.usuarios_ativos)); set('k-conf', fmt(u.conferencias)); set('k-cob', brl(u.cobrado_a_mais)); set('a-div', fmt(u.divergencias));
    const quar = q.find((r) => /quarentena/i.test(r.status)); if (quar) set('a-qua', fmt(quar.registros));
  } catch (e) { /* mantém os traços */ }
})();
