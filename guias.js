// Reguas e linhas guia (estilo Illustrator). Tecla G liga/desliga. Puxe a linha das reguas; escolha a cor e trave cores no menuzinho; arraste para mover; duplo clique ou jogue de volta na regua para apagar.
(() => {
  if (window.cpGuias) return;
  const KEY = 'cp-guias-linhas', KEYC = 'cp-guias-conf';
  const CORES = [['#ff1e1e', 'Vermelho'], ['#39ff14', 'Verde'], ['#ff8a00', 'Laranja'], ['#00e5ff', 'Ciano'], ['#ff00e5', 'Magenta']];
  let pkAte = 0, ultimo = { i: -1, t: 0 }, on = false, gs = [], root, rh, rv, mn, conf = { cor: 0, trava: [], x: null, y: null, min: false, cores: [] };
  const ler = () => { try { gs = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { gs = []; } try { conf = Object.assign(conf, JSON.parse(localStorage.getItem(KEYC) || '{}')); } catch (e) {} };
  const grava = () => { try { localStorage.setItem(KEY, JSON.stringify(gs)); localStorage.setItem(KEYC, JSON.stringify(conf)); } catch (e) {} };
  const trav = (c) => conf.trava.includes(c);
  const CAD = (fechado) => '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill-rule="evenodd" d="' + (fechado ? "M40.62 47.88 L7.50 47.91 L7.20 47.88 L6.88 47.16 L6.10 46.75 L5.14 45.38 L4.94 43.12 L4.94 23.12 L5.10 21.62 L6.08 20.12 L7.38 19.21 L9.77 18.88 L10.46 18.38 L10.44 13.00 L11.01 9.38 L12.12 6.80 L13.13 5.25 L15.12 3.13 L15.82 2.75 L16.38 2.17 L17.50 1.69 L18.25 1.13 L20.00 0.67 L20.52 0.00 L27.35 0.00 L27.79 0.62 L29.75 1.19 L30.38 1.69 L31.50 2.17 L32.75 3.15 L34.75 5.26 L35.72 6.75 L36.12 7.90 L36.78 9.00 L37.42 12.75 L37.48 18.50 L38.25 18.91 L39.62 18.98 L40.50 19.21 L41.80 20.12 L42.73 21.50 L42.94 23.12 L42.92 44.38 L42.62 45.58 L41.78 46.75 L40.90 47.25 L40.62 47.88ZM31.63 18.88 L32.08 18.50 L32.46 17.12 L32.44 13.50 L31.85 10.25 L30.74 8.25 L29.68 7.12 L28.50 6.21 L25.75 5.07 L24.12 4.95 L22.12 5.07 L19.38 6.21 L18.20 7.12 L17.12 8.26 L16.06 10.12 L15.43 13.50 L15.42 17.25 L15.72 18.38 L16.00 18.75 L16.62 18.94 L31.63 18.88ZM24.81 36.88 L25.50 36.67 L26.75 35.80 L27.67 34.50 L27.93 33.25 L27.81 31.75 L26.80 30.12 L25.50 29.21 L24.38 28.96 L22.75 29.06 L21.12 30.08 L20.21 31.38 L19.95 32.62 L20.06 34.12 L21.08 35.75 L22.38 36.67 L23.38 36.91 L24.81 36.88Z" : "M40.62 47.88 L7.50 47.91 L7.20 47.88 L6.88 47.16 L6.10 46.75 L5.14 45.38 L4.94 43.75 L4.95 22.62 L5.14 21.50 L6.08 20.12 L7.38 19.21 L8.38 18.96 L31.25 18.94 L31.87 18.75 L32.18 18.25 L32.46 17.12 L32.45 13.62 L31.76 10.00 L30.73 8.25 L29.66 7.12 L28.50 6.21 L26.25 5.20 L24.50 4.95 L22.25 5.06 L19.38 6.21 L18.19 7.12 L17.14 8.25 L16.12 9.95 L15.62 11.48 L14.25 12.66 L13.38 12.83 L12.50 12.66 L11.13 11.50 L10.94 10.38 L11.10 9.00 L11.70 8.00 L12.12 6.80 L13.12 5.23 L15.12 3.13 L16.26 2.25 L18.12 1.17 L20.02 0.62 L20.41 0.00 L27.41 0.00 L27.85 0.62 L29.75 1.14 L30.38 1.63 L31.62 2.20 L32.75 3.13 L34.78 5.25 L35.75 6.80 L36.79 9.00 L37.43 12.88 L37.48 18.50 L38.25 18.91 L39.62 18.98 L40.50 19.21 L41.80 20.12 L42.73 21.50 L42.94 23.12 L42.92 44.38 L42.62 45.58 L41.78 46.75 L40.90 47.25 L40.62 47.88ZM24.81 36.88 L25.50 36.67 L26.75 35.80 L27.67 34.50 L27.93 33.25 L27.81 31.75 L26.80 30.12 L25.50 29.21 L24.38 28.96 L22.75 29.06 L21.12 30.08 L20.21 31.38 L19.95 32.62 L20.06 34.12 L21.08 35.75 L22.38 36.67 L23.38 36.91 L24.81 36.88Z") + '"/></svg>';
  const hexDe = (i) => (conf.cores && conf.cores[i]) || CORES[i][0];
  const txtDe = (hex) => { const n = parseInt(hex.slice(1), 16), l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return l > 0.55 ? '#000' : '#fff'; }; // letra preta ou branca conforme a cor
  const css = '#cpg{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:10px/1 ui-monospace,Menlo,Consolas,monospace}#cpg *{box-sizing:border-box}' +
    '#cpg .r{position:absolute;background:#f2f2f2;color:#555;pointer-events:auto;overflow:hidden;border:0 solid #bbb}' +
    '#cpg .rh{left:18px;right:0;top:0;height:18px;border-bottom-width:1px;cursor:row-resize;background-image:repeating-linear-gradient(90deg,#999 0 1px,transparent 1px 10px),repeating-linear-gradient(90deg,#666 0 1px,transparent 1px 50px);background-size:100% 5px,100% 9px;background-repeat:no-repeat;background-position:0 100%,0 100%}' +
    '#cpg .rv{top:18px;bottom:0;left:0;width:18px;border-right-width:1px;cursor:col-resize;background-image:repeating-linear-gradient(180deg,#999 0 1px,transparent 1px 10px),repeating-linear-gradient(180deg,#666 0 1px,transparent 1px 50px);background-size:5px 100%,9px 100%;background-repeat:no-repeat;background-position:100% 0,100% 0}' +
    '#cpg .rh i,#cpg .rv i{position:absolute;font-style:normal;color:#444}#cpg .rh i{top:1px;transform:translateX(2px)}#cpg .rv i{left:1px;writing-mode:vertical-rl;transform:translateY(2px)}' +
    '#cpg .cn{position:absolute;left:0;top:0;width:18px;height:18px;background:#e0e0e0;border-right:1px solid #bbb;border-bottom:1px solid #bbb;pointer-events:auto;cursor:pointer;text-align:center;line-height:17px;color:#a00;font-weight:700}' +
    '#cpg .ln{position:absolute;background:var(--c);pointer-events:auto;z-index:2}#cpg .ln.h{left:0;right:0;height:1px;cursor:row-resize}#cpg .ln.v{top:0;bottom:0;width:1px;cursor:col-resize}#cpg .ln::before{content:"";position:absolute;inset:-3px}#cpg .ln.lk{pointer-events:none}#cpg .ln.lk::before{display:none}' +
    '#cpg .ln b{position:absolute;background:var(--c);color:var(--t,#000);padding:2px 4px;border-radius:2px;font-weight:700;white-space:nowrap;pointer-events:auto;cursor:zoom-in;transition:transform .08s;z-index:5}#cpg .ln.h b{left:22px;top:-7px;transform-origin:0 50%}#cpg .ln.v b{top:22px;left:4px;transform-origin:0 0}#cpg .ln b svg{width:11px;height:11px;fill:currentColor;vertical-align:-1px;margin-right:4px}#cpg .mn .lk svg{width:15px;height:15px;fill:currentColor;display:block;margin:auto}#cpg .ln:has(b:hover){z-index:99999}#cpg .ln b:hover{transform:scale(1.8);z-index:99999}' +
    '#cpg .mn{position:absolute;background:#161616;color:#eee;border-radius:9px;padding:6px 8px 8px;pointer-events:auto;box-shadow:0 6px 20px rgba(0,0,0,.45);z-index:5;font:11px/1.2 system-ui,sans-serif;user-select:none}#cpg .mn .hd{display:flex;align-items:center;gap:8px;cursor:move;font-weight:700;padding-bottom:6px}#cpg .mn .hd span{flex:1}#cpg .mn .hd button{border:0;background:#333;color:#fff;border-radius:4px;width:18px;height:18px;cursor:pointer;line-height:1}' +
    '#cpg .mn .cs{display:flex;gap:6px}#cpg .mn .c{display:flex;flex-direction:column;align-items:center;gap:4px}#cpg .mn .sw{width:22px;height:22px;border-radius:50%;border:2px solid transparent;background:var(--c);cursor:pointer;padding:0}#cpg .mn .sw.on{border-color:#fff;box-shadow:0 0 0 2px #000 inset}#cpg .mn .lk{border:0;background:#2a2a2a;color:#ccc;border-radius:4px;width:22px;height:18px;cursor:pointer;font-size:11px;padding:0}#cpg .mn .lk.on{background:#ffd84d;color:#222}#cpg .mn small{display:block;margin-top:6px;color:#9a9a9a;font-size:10px}#cpg .mn .pt{display:block;width:100%;margin-top:7px;border:0;border-radius:6px;background:#ffd84d;color:#222;font:700 11px system-ui,sans-serif;padding:6px 8px;cursor:pointer}#cpg .mn.mi .pt{display:none}#cpg .sl{position:absolute;inset:0;z-index:9;cursor:crosshair;pointer-events:auto;background:rgba(0,0,0,.12)}#cpg .sb{position:absolute;border:1px dashed #fff;outline:1px solid #000;background:rgba(255,255,255,.08)}#cpg .sb em{position:absolute;left:0;top:-18px;background:#000;color:#fff;font:10px ui-monospace,monospace;padding:2px 5px;border-radius:3px;font-style:normal;white-space:nowrap}#cpg .ts{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);background:#111;color:#fff;padding:9px 14px;border-radius:8px;font:600 12px system-ui,sans-serif;z-index:12;box-shadow:0 6px 20px rgba(0,0,0,.4)}#cpg .mn.mi .cs,#cpg .mn.mi small{display:none}#cpg .mn.mi .hd{padding-bottom:0}';
  const regua = () => {
    rh.querySelectorAll('i').forEach((n) => n.remove()); rv.querySelectorAll('i').forEach((n) => n.remove());
    for (let x = 0; x < innerWidth; x += 100) { const n = document.createElement('i'); n.textContent = x; n.style.left = x + 'px'; rh.append(n); }
    for (let y = 0; y < innerHeight; y += 100) { const n = document.createElement('i'); n.textContent = y; n.style.top = y + 'px'; rv.append(n); }
  };
  const desenha = () => {
    if (!on) return; root.querySelectorAll('.ln').forEach((n) => n.remove());
    gs.forEach((g, i) => { const c = g.c || 0, n = document.createElement('div'); n.className = 'ln ' + g.t + (trav(c) ? ' lk' : ''); n.dataset.i = i; n.style.setProperty('--c', hexDe(c)); n.style.setProperty('--t', txtDe(hexDe(c))); n.style[g.t === 'h' ? 'top' : 'left'] = g.p + 'px'; n.innerHTML = '<b>' + (trav(c) ? CAD(true) : '') + g.p + '</b>'; root.append(n); });
  };
  const menu = () => {
    mn.classList.toggle('mi', !!conf.min);
    mn.querySelector('.cs').innerHTML = CORES.map(([hex0, nome], i) => '<div class="c" style="--c:' + hexDe(i) + '"><button class="sw' + (conf.cor === i ? ' on' : '') + '" data-c="' + i + '" title="Clique: usar esta cor · Dois cliques: mudar a cor"></button><button class="lk' + (trav(i) ? ' on' : '') + '" data-l="' + i + '" title="Travar as linhas ' + nome.toLowerCase() + '">' + CAD(trav(i)) + '</button></div>').join('');
    mn.querySelector('.mm').textContent = conf.min ? '+' : '–';
    if (conf.x == null) { mn.style.left = Math.max(20, innerWidth - 232) + 'px'; mn.style.top = '28px'; } else { mn.style.left = Math.min(conf.x, innerWidth - 60) + 'px'; mn.style.top = Math.min(conf.y, innerHeight - 40) + 'px'; }
  };
  const arrasta = (g, e0) => {
    const mv = (e) => { g.p = Math.round(g.t === 'h' ? e.clientY : e.clientX); desenha(); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (g.p < 18) gs.splice(gs.indexOf(g), 1); grava(); desenha(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); mv(e0);
  };
  const aviso = (t, ms) => { root.querySelectorAll('.ts').forEach((n) => n.remove()); const n = document.createElement('div'); n.className = 'ts'; n.textContent = t; root.append(n); setTimeout(() => n.remove(), ms || 2800); };
  const pausa = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80))));
  const tela = async () => { // devolve uma imagem da aba atual
    if (window.chrome && chrome.runtime && chrome.runtime.id) { // extensao: captura direto, sem perguntar nada
      const url = await new Promise((ok, no) => chrome.runtime.sendMessage({ cmd: 'cap' }, (r) => (r && r.url) ? ok(r.url) : no(new Error((r && r.erro) || 'sem captura'))));
      const im = new Image(); im.src = url; await im.decode(); return { im, w: im.naturalWidth, h: im.naturalHeight };
    }
    const st = await navigator.mediaDevices.getDisplayMedia({ video: true, preferCurrentTab: true, selfBrowserSurface: 'include' }); // painel: o Chrome pergunta qual aba compartilhar
    try { const v = document.createElement('video'); v.srcObject = st; v.muted = true; await v.play(); await new Promise((r) => setTimeout(r, 250)); const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); return { im: c, w: c.width, h: c.height }; } finally { st.getTracks().forEach((t) => t.stop()); }
  };
  const copiaArea = () => {
    const sl = document.createElement('div'); sl.className = 'sl'; const bx = document.createElement('div'); bx.className = 'sb'; bx.hidden = true; bx.innerHTML = '<em></em>'; sl.append(bx); root.append(sl); aviso('Arraste para escolher a área · Esc cancela', 2500);
    let x0 = 0, y0 = 0, ar = false;
    const sai = () => { sl.remove(); document.removeEventListener('keydown', esc, true); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); sai(); } };
    document.addEventListener('keydown', esc, true);
    sl.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; ar = true; bx.hidden = false; sl.setPointerCapture(e.pointerId); e.preventDefault(); });
    sl.addEventListener('pointermove', (e) => { if (!ar) return; const x = Math.min(x0, e.clientX), y = Math.min(y0, e.clientY), w = Math.abs(e.clientX - x0), h = Math.abs(e.clientY - y0); Object.assign(bx.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); bx.firstChild.textContent = w + ' × ' + h; });
    sl.addEventListener('pointerup', async (e) => {
      if (!ar) return; ar = false;
      const x = Math.min(x0, e.clientX), y = Math.min(y0, e.clientY), w = Math.abs(e.clientX - x0), h = Math.abs(e.clientY - y0); sai();
      if (w < 5 || h < 5) return;
      mn.style.visibility = 'hidden'; root.querySelectorAll('.ts').forEach((n) => n.remove());
      try {
        await pausa();
        const blob = new Promise((ok, no) => { tela().then(({ im, w: iw }) => { const k = iw / innerWidth, c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(im, Math.round(x * k), Math.round(y * k), c.width, c.height, 0, 0, c.width, c.height); c.toBlob((b) => b ? ok(b) : no(new Error('sem imagem')), 'image/png'); }).catch(no); });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        mn.style.visibility = ''; aviso('Copiado! Cole com Ctrl+V (nenhum arquivo foi salvo)', 3200);
      } catch (err) { mn.style.visibility = ''; aviso('Não consegui copiar: ' + ((err && err.message) || 'permissão negada'), 4500); }
    });
  };
  const cria = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.append(st);
    root = document.createElement('div'); root.id = 'cpg';
    root.innerHTML = '<div class="r rh"></div><div class="r rv"></div><div class="cn" title="Apagar as linhas destravadas">×</div><div class="mn"><div class="hd"><span>Guias</span><button class="mm" title="Recolher"></button></div><div class="cs"></div><small>Cor = a das próximas linhas · 2 cliques na bolinha muda a cor · cadeado trava</small><input type="color" class="pk" style="position:absolute;opacity:0;width:0;height:0;pointer-events:none"><button class="pt" title="Seleciona uma área da tela e copia a imagem (só vai para o Ctrl+V, não salva arquivo)">📷 Copiar área da tela</button></div>';
    rh = root.querySelector('.rh'); rv = root.querySelector('.rv'); mn = root.querySelector('.mn');
    root.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if ((t === rh || t === rv) && Date.now() < pkAte) { pkAte = 0; e.preventDefault(); return; } // clique que so fecha o seletor de cor nao cria linha
      if (t === rh) { const g = { t: 'h', p: Math.round(e.clientY), c: conf.cor }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t === rv) { const g = { t: 'v', p: Math.round(e.clientX), c: conf.cor }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t.closest && t.closest('.ln')) { const g = gs[+t.closest('.ln').dataset.i]; if (g && !trav(g.c || 0)) { arrasta(g, e); e.preventDefault(); } }
    });
    root.addEventListener('dblclick', (e) => { const n = e.target.closest && e.target.closest('.ln'); if (n) { const g = gs[+n.dataset.i]; if (g && !trav(g.c || 0)) { gs.splice(+n.dataset.i, 1); grava(); desenha(); } } });
    root.querySelector('.cn').addEventListener('click', () => { gs = gs.filter((g) => trav(g.c || 0)); grava(); desenha(); });
    mn.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.c != null) { const agora = Date.now(), i = +b.dataset.c; if (ultimo.i === i && agora - ultimo.t < 450) { ultimo = { i: -1, t: 0 }; abreCor(b); return; } ultimo = { i, t: agora }; conf.cor = i; }
      else if (b.dataset.l != null) { const i = +b.dataset.l; conf.trava = trav(i) ? conf.trava.filter((x) => x !== i) : conf.trava.concat(i); }
      else if (b.classList.contains('mm')) conf.min = !conf.min;
      else if (b.classList.contains('pt')) { copiaArea(); return; }
      grava(); menu(); desenha();
    });
    function abreCor(b) { // dois cliques na bolinha: abre o seletor de cor
      const i = +b.dataset.c, pk = mn.querySelector('.pk'); conf.cor = i; pk.value = hexDe(i);
      pk.oninput = () => { conf.cores[i] = pk.value; pkAte = Date.now() + 1500; menu(); desenha(); }; pk.onchange = () => { pkAte = Date.now() + 700; grava(); }; // muda a cor de todas as linhas desse grupo (nenhuma linha nova)
      const mr = mn.getBoundingClientRect(), r = b.getBoundingClientRect(); Object.assign(pk.style, { left: Math.round(r.left - mr.left) + 'px', top: Math.round(mr.height) + 'px', width: '1px', height: '1px', pointerEvents: 'auto' }); // o seletor abre embaixo do menu (topo dele na base do menu)
      pkAte = Date.now() + 15000;
      if (pk.showPicker) { try { pk.showPicker(); } catch (er) { pk.click(); } } else pk.click(); pk.style.pointerEvents = 'none';
    }
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
