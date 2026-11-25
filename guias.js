// Reguas e linhas guia (estilo Illustrator). Tecla G liga/desliga. Puxe a linha das reguas; escolha a cor e trave cores no menuzinho; arraste para mover; duplo clique ou jogue de volta na regua para apagar.
(() => {
  if (window.cpGuias) return;
  const KEY = 'cp-guias-linhas', KEYC = 'cp-guias-conf';
  const CORES = [['#ff1e1e', 'Vermelho'], ['#39ff14', 'Verde'], ['#ff8a00', 'Laranja'], ['#00e5ff', 'Ciano'], ['#ff00e5', 'Magenta']];
  let pkAte = 0, ultimo = { i: -1, t: 0 }, on = false, gs = [], root, rh, rv, mn, conf = { cor: 0, trava: [], x: null, y: null, min: false, cores: [] };
  const ler = () => { try { gs = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { gs = []; } try { conf = Object.assign(conf, JSON.parse(localStorage.getItem(KEYC) || '{}')); } catch (e) {} };
  const grava = () => { try { localStorage.setItem(KEY, JSON.stringify(gs)); localStorage.setItem(KEYC, JSON.stringify(conf)); } catch (e) {} };
  const trav = (c) => conf.trava.includes(c);
  const ELO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill-rule="evenodd" d="M34.38 27.76 L33.25 27.87 L31.75 27.73 L30.19 26.88 L29.92 26.50 L29.74 25.62 L30.04 24.25 L30.38 23.96 L31.38 23.65 L33.62 23.78 L34.90 22.88 L40.69 17.00 L41.22 15.25 L41.08 13.62 L40.62 12.41 L39.68 11.25 L39.02 10.75 L36.62 8.19 L35.32 7.12 L33.62 6.68 L32.50 6.68 L30.96 7.12 L25.88 12.07 L24.21 14.00 L24.03 14.62 L24.20 16.50 L23.91 17.50 L23.50 17.91 L22.38 18.16 L21.12 17.80 L20.22 16.38 L20.03 15.25 L20.25 13.08 L21.12 11.25 L22.12 10.12 L28.25 4.10 L30.00 3.08 L32.50 2.64 L34.12 2.68 L36.00 3.01 L38.00 4.17 L43.81 10.00 L44.79 11.62 L45.24 14.12 L45.22 15.50 L44.87 17.62 L43.75 19.65 L36.75 26.66 L34.38 27.76ZM17.50 32.89 L16.12 32.84 L15.20 32.00 L14.93 31.12 L15.16 30.00 L31.04 14.12 L32.38 13.68 L33.75 14.09 L34.30 15.50 L33.75 17.02 L28.00 22.80 L26.33 24.25 L18.88 31.82 L17.50 32.89ZM15.00 45.25 L13.62 45.18 L11.51 44.75 L10.00 43.80 L8.83 42.75 L4.07 37.88 L3.08 36.25 L2.62 33.25 L3.04 30.12 L4.22 28.12 L11.24 21.12 L13.25 20.19 L14.50 20.01 L16.25 20.18 L17.75 21.06 L18.12 22.25 L17.84 23.62 L17.50 23.91 L16.50 24.22 L14.25 24.09 L13.11 24.88 L7.19 30.88 L6.68 32.50 L6.77 34.12 L7.25 35.50 L11.25 39.68 L12.55 40.75 L14.25 41.20 L15.38 41.20 L16.91 40.75 L21.94 35.88 L23.68 33.88 L23.85 33.25 L23.68 31.38 L23.98 30.38 L24.38 29.99 L25.50 29.74 L26.75 30.07 L27.65 31.50 L27.88 33.00 L27.68 34.62 L26.75 36.63 L20.75 42.76 L19.62 43.76 L17.97 44.75 L15.00 45.25Z"/></svg>', SELI = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill-rule="evenodd" d="M2.50 9.29 L1.38 9.12 L0.00 8.25 L0.00 2.79 L0.62 2.40 L1.22 1.25 L2.40 0.62 L2.78 0.00 L8.28 0.00 L8.45 0.50 L9.06 1.25 L9.29 2.00 L9.28 2.50 L8.83 3.50 L8.50 3.81 L8.00 3.94 L4.75 4.02 L4.25 4.17 L4.01 4.75 L3.85 8.38 L3.62 8.75 L2.50 9.29ZM20.50 4.00 L13.38 3.93 L12.88 3.65 L12.13 2.75 L12.01 2.12 L12.11 1.38 L12.98 0.62 L13.16 0.00 L21.56 0.00 L21.75 0.62 L22.53 1.50 L22.61 2.50 L21.75 3.77 L20.50 4.00ZM33.50 4.00 L26.38 3.90 L26.00 3.65 L25.30 2.62 L25.25 1.75 L26.13 0.62 L26.32 0.00 L34.72 0.00 L34.90 0.62 L35.76 1.38 L35.80 2.62 L34.75 3.84 L33.50 4.00ZM46.00 9.25 L45.38 9.29 L44.38 8.83 L44.07 8.50 L43.86 7.25 L43.86 4.75 L43.62 4.17 L43.00 4.01 L40.12 3.97 L39.12 3.62 L38.57 2.12 L38.82 1.25 L39.43 0.50 L39.60 0.00 L45.10 0.00 L45.47 0.62 L46.65 1.25 L47.25 2.40 L47.88 2.79 L47.88 8.23 L47.50 8.33 L46.62 9.05 L46.00 9.25ZM35.75 38.76 L12.50 38.79 L11.38 38.58 L10.05 37.75 L9.22 36.38 L9.09 35.38 L9.08 12.75 L9.25 11.38 L10.12 10.05 L11.40 9.25 L12.50 9.09 L35.25 9.09 L36.48 9.25 L37.83 10.12 L38.65 11.50 L38.79 12.50 L38.77 35.62 L38.62 36.38 L37.83 37.75 L36.50 38.58 L35.75 38.76ZM2.38 22.64 L1.50 22.53 L0.62 21.75 L0.00 21.57 L-0.04 21.00 L0.00 13.15 L0.62 12.98 L1.36 12.12 L2.00 12.01 L2.75 12.13 L3.65 12.88 L3.90 13.25 L3.99 14.00 L3.93 21.38 L3.62 21.90 L2.38 22.64ZM46.00 22.65 L45.35 22.62 L44.12 21.78 L43.87 20.25 L43.93 13.38 L44.12 12.98 L45.00 12.21 L45.75 12.01 L46.51 12.12 L47.25 12.98 L47.88 13.15 L47.92 13.75 L47.88 21.57 L47.25 21.75 L46.50 22.46 L46.00 22.65ZM2.62 35.80 L1.35 35.75 L0.62 34.90 L0.00 34.72 L-0.03 34.38 L0.00 26.31 L0.50 26.19 L1.38 25.42 L2.00 25.21 L2.62 25.31 L3.65 26.00 L3.97 26.88 L3.96 34.38 L3.75 34.89 L2.62 35.80ZM46.50 35.76 L45.75 35.87 L45.12 35.74 L44.12 34.89 L43.90 34.25 L43.95 26.50 L44.25 25.98 L45.62 25.21 L46.42 25.38 L47.12 26.04 L47.88 26.38 L47.88 34.72 L47.25 34.90 L46.50 35.76ZM8.12 47.89 L2.78 47.88 L2.40 47.25 L1.22 46.62 L0.62 45.47 L0.00 45.09 L0.00 39.62 L1.38 38.76 L2.12 38.57 L3.50 39.05 L3.80 39.38 L3.93 39.88 L4.01 43.12 L4.25 43.70 L4.88 43.87 L7.62 43.89 L8.75 44.25 L9.28 45.38 L9.29 45.88 L9.06 46.62 L8.12 47.89ZM45.00 47.88 L39.64 47.88 L39.54 47.50 L38.76 46.50 L38.56 45.50 L39.05 44.38 L39.38 44.07 L40.50 43.87 L43.12 43.86 L43.62 43.70 L43.86 43.12 L43.86 40.62 L44.07 39.38 L44.48 39.00 L45.75 38.57 L46.50 38.76 L47.38 39.47 L47.88 39.66 L47.88 45.00 L47.25 45.47 L46.66 46.62 L45.47 47.25 L45.00 47.88ZM21.50 47.88 L13.15 47.88 L12.97 47.25 L12.11 46.50 L12.07 45.25 L12.98 44.12 L13.50 43.91 L21.50 43.98 L21.89 44.25 L22.55 45.25 L22.66 45.75 L22.50 46.44 L21.75 47.25 L21.50 47.88ZM34.62 47.89 L26.31 47.88 L26.12 47.25 L25.34 46.38 L25.24 45.38 L26.00 44.23 L26.62 43.93 L34.50 43.93 L34.89 44.12 L35.62 44.95 L35.87 45.62 L35.75 46.52 L34.90 47.25 L34.62 47.89Z"/></svg>';
  const sel = new Set(); // linhas escolhidas com Shift+clique (para unir)
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
    '#cpg .ln b{position:absolute;background:var(--c);color:var(--t,#000);padding:2px 4px;border-radius:2px;font-weight:700;white-space:nowrap;pointer-events:auto;cursor:zoom-in;transition:transform .08s;z-index:5}#cpg .ln.h b{left:22px;top:-7px;transform-origin:0 50%}#cpg .ln.v b{top:22px;left:4px;transform-origin:0 0}#cpg .ln b svg{width:11px;height:11px;fill:currentColor;vertical-align:-1px;margin-right:4px}#cpg .mn .lk svg{width:15px;height:15px;fill:currentColor;display:block;margin:auto}#cpg .ln.sel{box-shadow:0 0 0 2px var(--c),0 0 8px 2px var(--c)}#cpg .ln.gr b svg{margin-right:3px}#cpg .mn .ug{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:7px;border:1px solid #555;border-radius:6px;background:#2d2d2d;color:#eee;font:700 11px system-ui,sans-serif;padding:6px 8px;cursor:pointer}#cpg .mn .ug:hover{background:#3a3a3a}#cpg .mn .ug.on{background:#5b8def;border-color:#5b8def;color:#fff}#cpg .mn .ug svg,#cpg .mn .pt svg{width:14px;height:14px;fill:currentColor;flex:none}#cpg .mn .pt{display:flex;align-items:center;justify-content:center;gap:6px}#cpg .mn{font:500 13px/1.35 system-ui,-apple-system,sans-serif;letter-spacing:.01em}#cpg .mn .hd{font-size:14px;font-weight:700}#cpg .mn>small{font-size:12px!important;line-height:1.4!important;color:#cfd5e3!important;margin-top:8px!important}#cpg .mn button.pt,#cpg .mn button.ug{display:flex;align-items:center;justify-content:center;gap:7px;font:600 12.5px/1.2 system-ui,-apple-system,sans-serif;padding:8px 10px}#cpg .ln:has(b:hover){z-index:99999}#cpg .ln b:hover{transform:scale(1.8);z-index:99999}' +
    '#cpg .mn{position:absolute;background:#161616;color:#eee;border-radius:9px;padding:6px 8px 8px;pointer-events:auto;box-shadow:0 6px 20px rgba(0,0,0,.45);z-index:5;font:11px/1.2 system-ui,sans-serif;user-select:none}#cpg .mn .hd{display:flex;align-items:center;gap:8px;cursor:move;font-weight:700;padding-bottom:6px}#cpg .mn .hd span{flex:1}#cpg .mn .hd button{border:0;background:#333;color:#fff;border-radius:4px;width:18px;height:18px;cursor:pointer;line-height:1}' +
    '#cpg .mn .cs{display:flex;gap:6px}#cpg .mn .c{display:flex;flex-direction:column;align-items:center;gap:4px}#cpg .mn .sw{width:22px;height:22px;border-radius:50%;border:2px solid transparent;background:var(--c);cursor:pointer;padding:0}#cpg .mn .sw.on{border-color:#fff;box-shadow:0 0 0 2px #000 inset}#cpg .mn .lk{border:0;background:#2a2a2a;color:#ccc;border-radius:4px;width:22px;height:18px;cursor:pointer;font-size:11px;padding:0}#cpg .mn .lk.on{background:#ffd84d;color:#222}#cpg .mn small{display:block;margin-top:6px;color:#9a9a9a;font-size:10px}#cpg .mn .pt{display:block;width:100%;margin-top:7px;border:0;border-radius:6px;background:#ffd84d;color:#222;font:700 11px system-ui,sans-serif;padding:6px 8px;cursor:pointer}#cpg .mn.mi .pt{display:none}#cpg .sl{position:absolute;inset:0;z-index:9;cursor:crosshair;pointer-events:auto;background:rgba(0,0,0,.12)}#cpg .sb{position:absolute;border:1px dashed #fff;outline:1px solid #000;background:rgba(255,255,255,.08)}#cpg .sb em{position:absolute;left:0;top:-18px;background:#000;color:#fff;font:10px ui-monospace,monospace;padding:2px 5px;border-radius:3px;font-style:normal;white-space:nowrap}#cpg .ts{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);background:#111;color:#fff;padding:9px 14px;border-radius:8px;font:600 12px system-ui,sans-serif;z-index:12;box-shadow:0 6px 20px rgba(0,0,0,.4)}#cpg .mn.mi .cs,#cpg .mn.mi small{display:none}#cpg .mn.mi .hd{padding-bottom:0}';
  const regua = () => {
    rh.querySelectorAll('i').forEach((n) => n.remove()); rv.querySelectorAll('i').forEach((n) => n.remove());
    for (let x = 0; x < innerWidth; x += 100) { const n = document.createElement('i'); n.textContent = x; n.style.left = x + 'px'; rh.append(n); }
    for (let y = 0; y < innerHeight; y += 100) { const n = document.createElement('i'); n.textContent = y; n.style.top = y + 'px'; rv.append(n); }
  };
  const desenha = () => {
    if (!on) return; root.querySelectorAll('.ln').forEach((n) => n.remove());
    gs.forEach((g, i) => { const c = g.c || 0, n = document.createElement('div'); n.className = 'ln ' + g.t + (trav(c) ? ' lk' : '') + (sel.has(g) ? ' sel' : '') + (g.gr ? ' gr' : ''); n.dataset.i = i; n.style.setProperty('--c', hexDe(c)); n.style.setProperty('--t', txtDe(hexDe(c))); n.style[g.t === 'h' ? 'top' : 'left'] = g.p + 'px'; n.innerHTML = '<b>' + (trav(c) ? CAD(true) : '') + (g.gr ? ELO : '') + g.p + '</b>'; root.append(n); });
  };
  const estadoUnir = () => { // o que o botão do elo faz agora: unir as linhas escolhidas, soltar um grupo, ou esperar a escolha
    const l = [...sel], n = l.length, gr = new Set(l.map((g) => g.gr).filter(Boolean));
    if (n >= 2 && l.every((g) => g.gr) && gr.size === 1 && gs.filter((g) => g.gr === l[0].gr).length === n) return { modo: 'soltar', txt: 'Soltar ' + n + ' linhas' };
    if (n >= 2) return { modo: 'unir', txt: 'Unir ' + n + ' linhas' };
    if (n === 1 && l[0].gr) return { modo: 'soltar', txt: 'Soltar o grupo' };
    return { modo: '', txt: 'Unir linhas (Shift + clique)' };
  };
  const unir = () => {
    const a = estadoUnir(), l = [...sel];
    if (a.modo === 'unir') { const id = gs.reduce((m, g) => Math.max(m, g.gr || 0), 0) + 1; l.forEach((g) => { g.gr = id; }); aviso(l.length + ' linhas unidas: andam juntas', 2200); }
    else if (a.modo === 'soltar') { const id = l[0].gr; gs.forEach((g) => { if (g.gr === id) delete g.gr; }); aviso('Grupo desfeito', 2000); }
    else { aviso('Segure Shift e clique em 2 ou mais linhas', 2600); return; }
    gs.forEach((g) => { if (g.gr && gs.filter((o) => o.gr === g.gr).length < 2) delete g.gr; }); // grupo com uma linha só não existe
    sel.clear(); grava(); menu(); desenha();
  };
  const menu = () => {
    mn.classList.toggle('mi', !!conf.min);
    mn.querySelector('.cs').innerHTML = CORES.map(([hex0, nome], i) => '<div class="c" style="--c:' + hexDe(i) + '"><button class="sw' + (conf.cor === i ? ' on' : '') + '" data-c="' + i + '" title="Clique: usar esta cor · Dois cliques: mudar a cor"></button><button class="lk' + (trav(i) ? ' on' : '') + '" data-l="' + i + '" title="Travar as linhas ' + nome.toLowerCase() + '">' + CAD(trav(i)) + '</button></div>').join('');
    mn.querySelector('.mm').textContent = conf.min ? '+' : '–';
    { const u = mn.querySelector('.ug'), a = estadoUnir(); if (u) { u.innerHTML = ELO + '<span>' + a.txt + '</span>'; u.classList.toggle('on', a.modo !== ''); u.style.opacity = a.modo ? 1 : 0.7; } }
    if (conf.x == null) { mn.style.left = Math.max(20, innerWidth - 232) + 'px'; mn.style.top = '28px'; } else { mn.style.left = Math.min(conf.x, innerWidth - 60) + 'px'; mn.style.top = Math.min(conf.y, innerHeight - 40) + 'px'; }
  };
  const arrasta = (g, e0) => {
    const horiz = g.t === 'h', grupo = g.gr ? gs.filter((o) => o.gr === g.gr && o.t === g.t && o !== g && !trav(o.c || 0)) : [], ini = grupo.map((o) => o.p), p0 = g.p; // linhas unidas (mesma direção) andam juntas
    const mv = (e) => { const p = Math.round(horiz ? e.clientY : e.clientX); g.p = p; grupo.forEach((o, k) => { o.p = Math.max(0, ini[k] + (p - p0)); }); desenha(); };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (g.p < 18) { gs.splice(gs.indexOf(g), 1); sel.delete(g); } grava(); desenha(); };
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
    root.innerHTML = '<div class="r rh"></div><div class="r rv"></div><div class="cn" title="Apagar as linhas destravadas">×</div><div class="mn"><div class="hd"><span>Guias</span><button class="mm" title="Recolher"></button></div><div class="cs"></div><small>Cor = a das próximas linhas · 2 cliques na bolinha muda a cor · cadeado trava · Shift + clique escolhe linhas para unir</small><input type="color" class="pk" style="position:absolute;opacity:0;width:0;height:0;pointer-events:none"><button class="ug" title="Segure Shift e clique nas linhas para escolher. Depois clique aqui: as linhas escolhidas passam a andar juntas (clique de novo para soltar)"></button><button class="pt" title="Seleciona uma área da tela e copia a imagem (só vai para o Ctrl+V, não salva arquivo)">' + SELI + '<span>Copiar área da tela</span></button></div>';
    rh = root.querySelector('.rh'); rv = root.querySelector('.rv'); mn = root.querySelector('.mn');
    root.addEventListener('pointerdown', (e) => {
      const t = e.target;
      if ((t === rh || t === rv) && Date.now() < pkAte) { pkAte = 0; e.preventDefault(); return; } // clique que so fecha o seletor de cor nao cria linha
      if (t === rh) { const g = { t: 'h', p: Math.round(e.clientY), c: conf.cor }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t === rv) { const g = { t: 'v', p: Math.round(e.clientX), c: conf.cor }; gs.push(g); arrasta(g, e); e.preventDefault(); }
      else if (t.closest && t.closest('.ln')) { const g = gs[+t.closest('.ln').dataset.i]; if (g && !trav(g.c || 0)) { if (e.shiftKey) { if (sel.has(g)) sel.delete(g); else sel.add(g); menu(); desenha(); e.preventDefault(); return; } arrasta(g, e); e.preventDefault(); } }
    });
    root.addEventListener('dblclick', (e) => { const n = e.target.closest && e.target.closest('.ln'); if (n) { const g = gs[+n.dataset.i]; if (g && !trav(g.c || 0)) { gs.splice(+n.dataset.i, 1); grava(); desenha(); } } });
    root.querySelector('.cn').addEventListener('click', () => { gs = gs.filter((g) => trav(g.c || 0)); grava(); desenha(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && on && sel.size) { sel.clear(); menu(); desenha(); } });
    mn.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.c != null) { const agora = Date.now(), i = +b.dataset.c; if (ultimo.i === i && agora - ultimo.t < 450) { ultimo = { i: -1, t: 0 }; abreCor(b); return; } ultimo = { i, t: agora }; conf.cor = i; }
      else if (b.dataset.l != null) { const i = +b.dataset.l; conf.trava = trav(i) ? conf.trava.filter((x) => x !== i) : conf.trava.concat(i); }
      else if (b.classList.contains('mm')) conf.min = !conf.min;
      else if (b.classList.contains('pt')) { copiaArea(); return; }
      else if (b.classList.contains('ug')) { unir(); return; }
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
