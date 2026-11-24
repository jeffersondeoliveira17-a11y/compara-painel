// Ferramenta de guias do painel (so aparece quando ligada): tecla G liga/desliga. Serve para medir e combinar posicoes sem falar em pixel.
// - arraste da regua de cima/da esquerda para criar linhas guia; arraste a linha para mover; duplo clique apaga; setas movem 1px (Shift = 5px)
// - passe o mouse sobre qualquer coisa para ver tamanho e posicao; clique para "fixar" (2 cliques = distancia entre os dois)
// - "Copiar" gera um texto com as medidas para colar na conversa
(() => {
  const KEY = 'cp-guias-linhas';
  let on = false, gs = [], sel = null, fix = [], root, painel, caixa, etiqueta;
  const ler = () => { try { gs = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { gs = []; } };
  const grava = () => { try { localStorage.setItem(KEY, JSON.stringify(gs)); } catch (e) {} };
  const css = '#cpg{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:11px/1.3 ui-monospace,Menlo,Consolas,monospace}#cpg *{box-sizing:border-box}' +
    '#cpg .rg{position:absolute;background:#111;color:#fff;pointer-events:auto;opacity:.82}#cpg .rh{left:0;right:0;top:0;height:18px;cursor:row-resize}#cpg .rv{top:0;bottom:0;left:0;width:18px;cursor:col-resize}' +
    '#cpg .ln{position:absolute;background:#ff2d95;pointer-events:auto}#cpg .ln.h{left:0;right:0;height:1px;cursor:row-resize}#cpg .ln.v{top:0;bottom:0;width:1px;cursor:col-resize}#cpg .ln::before{content:"";position:absolute;inset:-4px}' +
    '#cpg .ln.sel{background:#00d1ff}#cpg .ln b{position:absolute;background:#ff2d95;color:#fff;padding:1px 4px;border-radius:3px;font-weight:600;white-space:nowrap}#cpg .ln.sel b{background:#00d1ff;color:#003}#cpg .ln.h b{left:24px;top:2px}#cpg .ln.v b{top:24px;left:3px}' +
    '#cpg .cx{position:absolute;border:1px solid #00d1ff;background:rgba(0,209,255,.12);pointer-events:none}#cpg .cx.f{border-color:#ffb300;background:rgba(255,179,0,.16)}#cpg .et{position:absolute;background:#003;color:#9ef;padding:2px 5px;border-radius:3px;white-space:nowrap;pointer-events:none}' +
    '#cpg .pn{position:absolute;right:12px;bottom:12px;width:300px;max-height:60vh;overflow:auto;background:#111;color:#eee;border-radius:10px;padding:10px 12px;pointer-events:auto;box-shadow:0 8px 28px rgba(0,0,0,.4)}#cpg .pn h4{margin:0 0 6px;font:700 12px system-ui;color:#fff}#cpg .pn pre{margin:0;white-space:pre-wrap;color:#cde}#cpg .pn button{margin:8px 6px 0 0;border:0;border-radius:6px;padding:5px 9px;font:600 11px system-ui;cursor:pointer;background:#ffd84d;color:#222}';
  const nome = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; const c = [...e.classList].slice(0, 2); if (c.length) s += '.' + c.join('.'); return s; };
  const caixaDe = (r) => ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  const desenha = () => {
    if (!on) return;
    root.querySelectorAll('.ln').forEach((n) => n.remove());
    gs.forEach((g, i) => {
      const n = document.createElement('div'); n.className = 'ln ' + g.t + (i === sel ? ' sel' : ''); n.dataset.i = i;
      if (g.t === 'h') n.style.top = g.p + 'px'; else n.style.left = g.p + 'px';
      n.innerHTML = '<b>' + g.p + 'px</b>'; root.append(n);
    });
    texto();
  };
  const texto = () => {
    const h = gs.filter((g) => g.t === 'h').map((g) => g.p).sort((a, b) => a - b), v = gs.filter((g) => g.t === 'v').map((g) => g.p).sort((a, b) => a - b);
    const dif = (a) => a.length > 1 ? ' (distancias: ' + a.slice(1).map((x, i) => x - a[i]).join(', ') + ')' : '';
    let t = 'Janela: ' + innerWidth + 'x' + innerHeight + '\nLinhas horizontais (y): ' + (h.join(', ') || '-') + dif(h) + '\nLinhas verticais (x): ' + (v.join(', ') || '-') + dif(v);
    fix.forEach((f, i) => { t += '\n\nItem ' + (i + 1) + ': ' + f.nome + '\n x=' + f.b.x + ' y=' + f.b.y + ' largura=' + f.b.w + ' altura=' + f.b.h + '\n direita=' + (f.b.x + f.b.w) + ' base=' + (f.b.y + f.b.h); });
    if (fix.length === 2) { const a = fix[0].b, b = fix[1].b, gh = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), gv = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h)); t += '\n\nEntre 1 e 2: vao horizontal ' + gh + 'px | vao vertical ' + gv + 'px (negativo = se sobrepoem) | topo a topo: ' + Math.abs(b.y - a.y) + 'px | esquerda a esquerda: ' + Math.abs(b.x - a.x) + 'px'; }
    painel.querySelector('pre').textContent = t; return t;
  };
  const copia = () => { const t = texto(); try { navigator.clipboard.writeText(t).catch(() => fb(t)); } catch (e) { fb(t); } };
  const fb = (t) => { const a = document.createElement('textarea'); a.value = t; document.body.append(a); a.select(); try { document.execCommand('copy'); } catch (e) {} a.remove(); };
  const cria = () => {
    const st = document.createElement('style'); st.textContent = css; document.head.append(st);
    root = document.createElement('div'); root.id = 'cpg';
    root.innerHTML = '<div class="rg rh"></div><div class="rg rv"></div><div class="cx" hidden></div><div class="et" hidden></div><div class="pn"><h4>Guias — G sai · setas ajustam · duplo clique apaga</h4><pre></pre><button data-a="c">Copiar medidas</button><button data-a="l">Limpar linhas</button><button data-a="f">Limpar itens</button></div>';
    painel = root.querySelector('.pn'); caixa = root.querySelector('.cx'); etiqueta = root.querySelector('.et');
    painel.addEventListener('click', (e) => { const a = e.target.dataset && e.target.dataset.a; if (a === 'c') copia(); if (a === 'l') { gs = []; sel = null; grava(); desenha(); } if (a === 'f') { fix = []; root.querySelectorAll('.cx.f').forEach((n) => n.remove()); texto(); } });
    const arrasta = (g, e0) => {
      const mv = (e) => { g.p = Math.round(g.t === 'h' ? e.clientY : e.clientX); desenha(); }, up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (g.p < 18) gs.splice(gs.indexOf(g), 1); sel = null; grava(); desenha(); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); sel = gs.indexOf(g); mv(e0);
    };
    root.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('rh')) { const g = { t: 'h', p: Math.round(e.clientY) }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (e.target.classList.contains('rv')) { const g = { t: 'v', p: Math.round(e.clientX) }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (e.target.closest('.ln')) { const g = gs[+e.target.closest('.ln').dataset.i]; if (g) { arrasta(g, e); e.preventDefault(); } }
    });
    root.addEventListener('dblclick', (e) => { const n = e.target.closest('.ln'); if (n) { gs.splice(+n.dataset.i, 1); sel = null; grava(); desenha(); } });
    document.addEventListener('mousemove', (e) => {
      if (!on || root.contains(e.target)) { caixa.hidden = etiqueta.hidden = true; return; }
      const el = e.target; const r = el.getBoundingClientRect(), b = caixaDe(r);
      Object.assign(caixa.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); caixa.hidden = false;
      etiqueta.textContent = nome(el) + '  ' + b.w + '×' + b.h + '  @' + b.x + ',' + b.y; Object.assign(etiqueta.style, { left: Math.min(innerWidth - 260, Math.max(22, r.left)) + 'px', top: Math.max(22, r.top - 20) + 'px' }); etiqueta.hidden = false;
    }, true);
    document.addEventListener('click', (e) => {
      if (!on || root.contains(e.target)) return; e.preventDefault(); e.stopPropagation();
      const r = e.target.getBoundingClientRect(); if (fix.length >= 2) { fix = []; root.querySelectorAll('.cx.f').forEach((n) => n.remove()); }
      fix.push({ nome: nome(e.target), b: caixaDe(r) }); const f = document.createElement('div'); f.className = 'cx f'; Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); root.append(f); texto();
    }, true);
    document.addEventListener('keydown', (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!on) return;
      if (e.key === 'Escape') { alterna(); return; }
      if (sel != null && gs[sel] && /^Arrow/.test(e.key)) { const g = gs[sel], d = (e.shiftKey ? 5 : 1) * (/Left|Up/.test(e.key) ? -1 : 1); if ((g.t === 'h') === /Up|Down/.test(e.key)) { g.p += d; grava(); desenha(); e.preventDefault(); } }
    });
    root.addEventListener('mouseover', (e) => { const n = e.target.closest && e.target.closest('.ln'); if (n && +n.dataset.i !== sel) { sel = +n.dataset.i; desenha(); } });
  };
  const alterna = () => {
    if (!root) { ler(); cria(); }
    on = !on; if (on) { document.body.append(root); desenha(); } else root.remove();
  };
  window.cpGuias = alterna;
  document.addEventListener('keydown', (e) => { // a tecla G liga e desliga (vale desde o começo; o resto é montado na primeira vez)
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '') || e.target.isContentEditable || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'g') { e.preventDefault(); alterna(); }
  });
  if (/[?&]guias(=|&|$)/.test(location.search)) addEventListener('load', () => setTimeout(() => { if (!on) alterna(); }, 300));
})();
