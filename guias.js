// Reguas e linhas guia (estilo Illustrator). Tecla G liga/desliga. Puxe a linha das reguas de cima/esquerda; arraste para mover; duplo clique ou jogue de volta na regua para apagar; o x no canto apaga todas.
(() => {
  if (window.cpGuias) return;
  const KEY = 'cp-guias-linhas';
  let on = false, gs = [], root, rh, rv;
  const ler = () => { try { gs = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { gs = []; } };
  const grava = () => { try { localStorage.setItem(KEY, JSON.stringify(gs)); } catch (e) {} };
  const css = '#cpg{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:10px/1 ui-monospace,Menlo,Consolas,monospace}#cpg *{box-sizing:border-box}' +
    '#cpg .r{position:absolute;background:#f2f2f2;color:#555;pointer-events:auto;overflow:hidden;border:0 solid #bbb}' +
    '#cpg .rh{left:18px;right:0;top:0;height:18px;border-bottom-width:1px;cursor:row-resize;background-image:repeating-linear-gradient(90deg,#999 0 1px,transparent 1px 10px),repeating-linear-gradient(90deg,#666 0 1px,transparent 1px 50px);background-size:100% 5px,100% 9px;background-repeat:no-repeat;background-position:0 100%,0 100%}' +
    '#cpg .rv{top:18px;bottom:0;left:0;width:18px;border-right-width:1px;cursor:col-resize;background-image:repeating-linear-gradient(180deg,#999 0 1px,transparent 1px 10px),repeating-linear-gradient(180deg,#666 0 1px,transparent 1px 50px);background-size:5px 100%,9px 100%;background-repeat:no-repeat;background-position:100% 0,100% 0}' +
    '#cpg .rh i,#cpg .rv i{position:absolute;font-style:normal;color:#444}#cpg .rh i{top:1px;transform:translateX(2px)}#cpg .rv i{left:1px;transform:translateY(2px) rotate(0);writing-mode:vertical-rl;transform:translateY(2px)}' +
    '#cpg .cn{position:absolute;left:0;top:0;width:18px;height:18px;background:#e0e0e0;border-right:1px solid #bbb;border-bottom:1px solid #bbb;pointer-events:auto;cursor:pointer;text-align:center;line-height:17px;color:#a00;font-weight:700}' +
    '#cpg .ln{position:absolute;background:#ff1e1e;pointer-events:auto;z-index:2}#cpg .ln.h{left:0;right:0;height:1px;cursor:row-resize}#cpg .ln.v{top:0;bottom:0;width:1px;cursor:col-resize}#cpg .ln::before{content:"";position:absolute;inset:-3px}' +
    '#cpg .ln b{position:absolute;background:#ff1e1e;color:#fff;padding:2px 4px;border-radius:2px;font-weight:700;white-space:nowrap;pointer-events:none}#cpg .ln.h b{left:22px;top:-7px}#cpg .ln.v b{top:22px;left:4px}';
  const regua = () => {
    rh.querySelectorAll('i').forEach((n) => n.remove()); rv.querySelectorAll('i').forEach((n) => n.remove());
    for (let x = 0; x < innerWidth; x += 100) { const n = document.createElement('i'); n.textContent = x; n.style.left = x + 'px'; rh.append(n); }
    for (let y = 0; y < innerHeight; y += 100) { const n = document.createElement('i'); n.textContent = y; n.style.top = y + 'px'; rv.append(n); }
  };
  const desenha = () => {
    if (!on) return; root.querySelectorAll('.ln').forEach((n) => n.remove());
    gs.forEach((g, i) => { const n = document.createElement('div'); n.className = 'ln ' + g.t; n.dataset.i = i; n.style[g.t === 'h' ? 'top' : 'left'] = g.p + 'px'; n.innerHTML = '<b>' + g.p + '</b>'; root.append(n); });
  };
  const arrasta = (g, e0) => {
    const mv = (e) => { g.p = Math.round(g.t === 'h' ? e.clientY : e.clientX); desenha(); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (g.p < 18) gs.splice(gs.indexOf(g), 1); grava(); desenha(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); mv(e0);
  };
  const cria = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.append(st);
    root = document.createElement('div'); root.id = 'cpg';
    root.innerHTML = '<div class="r rh"></div><div class="r rv"></div><div class="cn" title="Apagar todas as linhas">×</div>';
    rh = root.querySelector('.rh'); rv = root.querySelector('.rv');
    root.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (t === rh) { const g = { t: 'h', p: Math.round(e.clientY) }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t === rv) { const g = { t: 'v', p: Math.round(e.clientX) }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t.closest && t.closest('.ln')) { const g = gs[+t.closest('.ln').dataset.i]; if (g) { arrasta(g, e); e.preventDefault(); } }
    });
    root.addEventListener('dblclick', (e) => { const n = e.target.closest && e.target.closest('.ln'); if (n) { gs.splice(+n.dataset.i, 1); grava(); desenha(); } });
    root.querySelector('.cn').addEventListener('click', () => { gs = []; grava(); desenha(); });
    document.addEventListener('keydown', (e) => { if (on && e.key === 'Escape') alterna(); });
    addEventListener('resize', () => { if (on) regua(); });
  };
  const alterna = () => {
    if (!root) { ler(); cria(); }
    on = !on; if (on) { document.body.append(root); regua(); desenha(); } else root.remove();
  };
  window.cpGuias = alterna;
  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'g') { e.preventDefault(); alterna(); }
  });
})();
