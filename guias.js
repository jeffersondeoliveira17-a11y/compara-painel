// Reguas e linhas guia (estilo Illustrator). Tecla G liga/desliga. Puxe a linha das reguas; escolha a cor e trave cores no menuzinho; arraste para mover; duplo clique ou jogue de volta na regua para apagar.
(() => {
  if (window.cpGuias) return;
  const KEY = 'cp-guias-linhas', KEYC = 'cp-guias-conf';
  const CORES = [['#ff1e1e', 'Vermelho'], ['#39ff14', 'Verde'], ['#ff8a00', 'Laranja'], ['#00e5ff', 'Ciano'], ['#ff00e5', 'Magenta']];
  let on = false, gs = [], root, rh, rv, mn, conf = { cor: 0, trava: [], x: null, y: null, min: false };
  const ler = () => { try { gs = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { gs = []; } try { conf = Object.assign(conf, JSON.parse(localStorage.getItem(KEYC) || '{}')); } catch (e) {} };
  const grava = () => { try { localStorage.setItem(KEY, JSON.stringify(gs)); localStorage.setItem(KEYC, JSON.stringify(conf)); } catch (e) {} };
  const trav = (c) => conf.trava.includes(c);
  const css = '#cpg{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:10px/1 ui-monospace,Menlo,Consolas,monospace}#cpg *{box-sizing:border-box}' +
    '#cpg .r{position:absolute;background:#f2f2f2;color:#555;pointer-events:auto;overflow:hidden;border:0 solid #bbb}' +
    '#cpg .rh{left:18px;right:0;top:0;height:18px;border-bottom-width:1px;cursor:row-resize;background-image:repeating-linear-gradient(90deg,#999 0 1px,transparent 1px 10px),repeating-linear-gradient(90deg,#666 0 1px,transparent 1px 50px);background-size:100% 5px,100% 9px;background-repeat:no-repeat;background-position:0 100%,0 100%}' +
    '#cpg .rv{top:18px;bottom:0;left:0;width:18px;border-right-width:1px;cursor:col-resize;background-image:repeating-linear-gradient(180deg,#999 0 1px,transparent 1px 10px),repeating-linear-gradient(180deg,#666 0 1px,transparent 1px 50px);background-size:5px 100%,9px 100%;background-repeat:no-repeat;background-position:100% 0,100% 0}' +
    '#cpg .rh i,#cpg .rv i{position:absolute;font-style:normal;color:#444}#cpg .rh i{top:1px;transform:translateX(2px)}#cpg .rv i{left:1px;writing-mode:vertical-rl;transform:translateY(2px)}' +
    '#cpg .cn{position:absolute;left:0;top:0;width:18px;height:18px;background:#e0e0e0;border-right:1px solid #bbb;border-bottom:1px solid #bbb;pointer-events:auto;cursor:pointer;text-align:center;line-height:17px;color:#a00;font-weight:700}' +
    '#cpg .ln{position:absolute;background:var(--c);pointer-events:auto;z-index:2}#cpg .ln.h{left:0;right:0;height:1px;cursor:row-resize}#cpg .ln.v{top:0;bottom:0;width:1px;cursor:col-resize}#cpg .ln::before{content:"";position:absolute;inset:-3px}#cpg .ln.lk{pointer-events:none}#cpg .ln.lk::before{display:none}' +
    '#cpg .ln b{position:absolute;background:var(--c);color:#000;padding:2px 4px;border-radius:2px;font-weight:700;white-space:nowrap;pointer-events:none}#cpg .ln.h b{left:22px;top:-7px}#cpg .ln.v b{top:22px;left:4px}' +
    '#cpg .mn{position:absolute;background:#161616;color:#eee;border-radius:9px;padding:6px 8px 8px;pointer-events:auto;box-shadow:0 6px 20px rgba(0,0,0,.45);z-index:5;font:11px/1.2 system-ui,sans-serif;user-select:none}#cpg .mn .hd{display:flex;align-items:center;gap:8px;cursor:move;font-weight:700;padding-bottom:6px}#cpg .mn .hd span{flex:1}#cpg .mn .hd button{border:0;background:#333;color:#fff;border-radius:4px;width:18px;height:18px;cursor:pointer;line-height:1}' +
    '#cpg .mn .cs{display:flex;gap:6px}#cpg .mn .c{display:flex;flex-direction:column;align-items:center;gap:4px}#cpg .mn .sw{width:22px;height:22px;border-radius:50%;border:2px solid transparent;background:var(--c);cursor:pointer;padding:0}#cpg .mn .sw.on{border-color:#fff;box-shadow:0 0 0 2px #000 inset}#cpg .mn .lk{border:0;background:#2a2a2a;color:#ccc;border-radius:4px;width:22px;height:18px;cursor:pointer;font-size:11px;padding:0}#cpg .mn .lk.on{background:#ffd84d;color:#222}#cpg .mn small{display:block;margin-top:6px;color:#9a9a9a;font-size:10px}#cpg .mn.mi .cs,#cpg .mn.mi small{display:none}#cpg .mn.mi .hd{padding-bottom:0}';
  const regua = () => {
    rh.querySelectorAll('i').forEach((n) => n.remove()); rv.querySelectorAll('i').forEach((n) => n.remove());
    for (let x = 0; x < innerWidth; x += 100) { const n = document.createElement('i'); n.textContent = x; n.style.left = x + 'px'; rh.append(n); }
    for (let y = 0; y < innerHeight; y += 100) { const n = document.createElement('i'); n.textContent = y; n.style.top = y + 'px'; rv.append(n); }
  };
  const desenha = () => {
    if (!on) return; root.querySelectorAll('.ln').forEach((n) => n.remove());
    gs.forEach((g, i) => { const c = g.c || 0, n = document.createElement('div'); n.className = 'ln ' + g.t + (trav(c) ? ' lk' : ''); n.dataset.i = i; n.style.setProperty('--c', CORES[c][0]); n.style[g.t === 'h' ? 'top' : 'left'] = g.p + 'px'; n.innerHTML = '<b>' + (trav(c) ? '🔒 ' : '') + g.p + '</b>'; root.append(n); });
  };
  const menu = () => {
    mn.classList.toggle('mi', !!conf.min);
    mn.querySelector('.cs').innerHTML = CORES.map(([hex, nome], i) => '<div class="c" style="--c:' + hex + '"><button class="sw' + (conf.cor === i ? ' on' : '') + '" data-c="' + i + '" title="' + nome + ' (usar esta cor)"></button><button class="lk' + (trav(i) ? ' on' : '') + '" data-l="' + i + '" title="Travar as linhas ' + nome.toLowerCase() + '">' + (trav(i) ? '🔒' : '🔓') + '</button></div>').join('');
    mn.querySelector('.mm').textContent = conf.min ? '+' : '–';
    if (conf.x == null) { mn.style.left = Math.max(20, innerWidth - 232) + 'px'; mn.style.top = '28px'; } else { mn.style.left = Math.min(conf.x, innerWidth - 60) + 'px'; mn.style.top = Math.min(conf.y, innerHeight - 40) + 'px'; }
  };
  const arrasta = (g, e0) => {
    const mv = (e) => { g.p = Math.round(g.t === 'h' ? e.clientY : e.clientX); desenha(); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (g.p < 18) gs.splice(gs.indexOf(g), 1); grava(); desenha(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); mv(e0);
  };
  const cria = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.append(st);
    root = document.createElement('div'); root.id = 'cpg';
    root.innerHTML = '<div class="r rh"></div><div class="r rv"></div><div class="cn" title="Apagar as linhas destravadas">×</div><div class="mn"><div class="hd"><span>Guias</span><button class="mm" title="Recolher"></button></div><div class="cs"></div><small>Cor = a das próximas linhas · cadeado trava as dessa cor</small></div>';
    rh = root.querySelector('.rh'); rv = root.querySelector('.rv'); mn = root.querySelector('.mn');
    root.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if (t === rh) { const g = { t: 'h', p: Math.round(e.clientY), c: conf.cor }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t === rv) { const g = { t: 'v', p: Math.round(e.clientX), c: conf.cor }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t.closest && t.closest('.ln')) { const g = gs[+t.closest('.ln').dataset.i]; if (g && !trav(g.c || 0)) { arrasta(g, e); e.preventDefault(); } }
    });
    root.addEventListener('dblclick', (e) => { const n = e.target.closest && e.target.closest('.ln'); if (n) { const g = gs[+n.dataset.i]; if (g && !trav(g.c || 0)) { gs.splice(+n.dataset.i, 1); grava(); desenha(); } } });
    root.querySelector('.cn').addEventListener('click', () => { gs = gs.filter((g) => trav(g.c || 0)); grava(); desenha(); });
    mn.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.c != null) conf.cor = +b.dataset.c;
      else if (b.dataset.l != null) { const i = +b.dataset.l; conf.trava = trav(i) ? conf.trava.filter((x) => x !== i) : conf.trava.concat(i); }
      else if (b.classList.contains('mm')) conf.min = !conf.min;
      grava(); menu(); desenha();
    });
    mn.querySelector('.hd').addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return; const r = mn.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const mv = (ev) => { conf.x = Math.max(0, Math.round(ev.clientX - dx)); conf.y = Math.max(20, Math.round(ev.clientY - dy)); menu(); };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); grava(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); e.preventDefault();
    });
    document.addEventListener('keydown', (e) => { if (on && e.key === 'Escape') alterna(); });
    addEventListener('resize', () => { if (on) { regua(); menu(); } });
  };
  const alterna = () => {
    if (!root) { ler(); cria(); }
    on = !on; if (on) { document.body.append(root); regua(); menu(); desenha(); } else root.remove();
  };
  window.cpGuias = alterna;
  document.addEventListener('keydown', (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'g') { e.preventDefault(); alterna(); }
  });
})();
