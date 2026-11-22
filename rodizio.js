// Linha "Tarefas": mostra 2 avisos por vez e troca sozinha (rola para cima). Não aumenta a altura do quadro.
(() => {
  const cs = document.getElementById('cp-oi-chips'); if (!cs) return;
  const POR = 2, MS = 4500;
  let tm = null, idx = 0, pgs = [], dots = [], pausado = false;
  const reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mostra(n) {
    if (n === idx || !pgs.length) return;
    const velho = pgs[idx], novo = pgs[n];
    velho.classList.remove('on'); velho.classList.add('sai'); novo.classList.add('on');
    setTimeout(() => velho.classList.remove('sai'), 650);
    dots[idx].classList.remove('on'); dots[n].classList.add('on'); idx = n;
  }
  function monta() {
    const soltos = [...cs.children].filter((e) => e.tagName === 'BUTTON');
    if (!soltos.length) return;
    clearInterval(tm); idx = 0;
    const antigo = cs.querySelector('.rod'); if (antigo) antigo.remove();
    const box = document.createElement('div'); box.className = 'rod';
    pgs = []; dots = [];
    for (let i = 0; i < soltos.length; i += POR) {
      const pg = document.createElement('div'); pg.className = 'pg' + (i === 0 ? ' on' : '');
      soltos.slice(i, i + POR).forEach((b) => pg.append(b)); box.append(pg); pgs.push(pg);
    }
    if (pgs.length > 1) {
      const dt = document.createElement('div'); dt.className = 'rod-dots';
      pgs.forEach((_, i) => { const d = document.createElement('span'); if (i === 0) d.className = 'on'; dt.append(d); dots.push(d); });
      box.append(dt);
      box.addEventListener('mouseenter', () => { pausado = true; }); box.addEventListener('mouseleave', () => { pausado = false; });
      box.addEventListener('focusin', () => { pausado = true; }); box.addEventListener('focusout', () => { pausado = false; });
      tm = setInterval(() => { if (!pausado && !document.hidden) mostra((idx + 1) % pgs.length); }, MS);
    }
    cs.append(box);
    if (reduz) box.classList.add('reduz');
  }
  new MutationObserver(() => { clearTimeout(monta.t); monta.t = setTimeout(monta, 40); }).observe(cs, { childList: true });
  monta();
})();
