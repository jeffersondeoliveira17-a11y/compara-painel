// Joguinho de teste na área de trabalho: o gatinho corre e pula as pedras.
// Entrar: 5 toques em "Hi, Jeff" (em até 3 s) ou o código Konami (↑ ↑ ↓ ↓ ← → ← → B A). Sair: Esc ou o X.
(() => {
const area = document.getElementById('cp-oi'), nome = document.getElementById('cp-oi-nome');
if (!area) return;
const V = window.PAINEL_VERSAO || '1';
const CH = 'cp-jogo-recorde', CT = 'cp-jogo-tempo';
const LIMITE = 8 * 60; // segundos de jogo por dia
const forca = /[?&]cafe(=|&|$)/.test(location.search); // o mesmo teste do pause pro café
// o jogo só existe no pause pro café: nas horas pares, nos primeiros 15 minutos
const LIBERADO = true; window.cpLiberado = LIBERADO; // fase de testes: o jogo abre a qualquer hora e é sempre o do cachorro; para voltar às regras (pause do café e jogo do dia), troque para false
const janela = () => { const d = new Date(); return LIBERADO || forca || (d.getHours() % 2 === 0 && d.getMinutes() < 15); };
const hoje = () => new Date().toDateString();
const leUso = () => { if (forca) return 0; try { const o = JSON.parse(localStorage.getItem(CT) || '{}'); return o.dia === hoje() ? (+o.s || 0) : 0; } catch (e) { return 0; } };
let usado = leUso(), cont = 0;
const gravaUso = () => { try { localStorage.setItem(CT, JSON.stringify({ dia: hoje(), s: Math.round(usado) })); } catch (e) { /* segue sem salvar */ } };
const mmss = (n) => { n = Math.max(0, Math.ceil(n)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
const img = (src) => { const i = new Image(); i.src = src + '?v=' + V; return i; };
const IM = { moita: img('icones/moita-chao.svg'), fantasma: img('icones/fantasma.svg'), boneco: img('icones/boneco-neve.svg'), treno: img('icones/treno.svg'), nuvem: img('icones/nuvem.svg'), lua: img('icones/lua.svg'), cao1: img('icones/cao1.svg'), cao2: img('icones/cao2.svg'), cao3: img('icones/cao3.svg'), cao4: img('icones/cao4.svg'), cao5: img('icones/cao5.svg'), cao6: img('icones/cao6.svg'), pedra: img('icones/pedra.svg'), cone: img('icones/cone.svg'), terra: img('icones/terra.svg'), mato: img('icones/mato.svg'), chao: img('icones/chao.svg'), fim: img('icones/game-over.svg'), portal: img('icones/portal.png'), balao: img('icones/balao.svg'), ave: img('icones/passarinho-completo.svg'), ave2: img('icones/passarinho-cafe.svg'), vida1: img('icones/coracao-cheio.svg'), vida0: img('icones/coracao-vazio.svg'), arv: ['rosa', 'azul', 'verde'].map((k) => img('icones/arvore-' + k + '.svg')), fumaca: img('icones/fumaca-inicio.png'), mor: [1, 2, 3, 4].map((q) => img('icones/morcego' + q + '.svg')) };
// ---------- tema noite: tons de cinza no estilo Game Boy, para descansar a vista ----------
// Alterna a cada fase (portal), com a tecla N, ou fica sempre ligado com ?noite na URL.
const flagNoite = /[?&]noite(=|&|$)/.test(location.search);
let noite = true; // o jogo começa à noite (cinza) e vai ganhando cor; a fase seguinte é de dia
const NOITE_FUNDO = '#26303f';
const toRgb = (l) => l.map((h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)));
// rampas de 8 tons (do escuro ao claro) entre duas cores: mais degraus de cinza e branco
const rampa = (de, ate, n) => { const r = toRgb([de, ate]); return Array.from({ length: n }, (_, i) => r[0].map((v, k) => Math.round(v + (r[1][k] - v) * i / (n - 1)))); };
const NIV = 8;
const TOM_OBJETO = rampa('#1a212c', '#ffffff', NIV); // cachorro, pedras, balão, portal: cinzas até o branco
const TOM_NUVEM = rampa('#26303f', '#e3e9f2', NIV); // nuvens chegam quase ao branco
const TOM_CENARIO = rampa('#26303f', '#8b9bb3', NIV); // chão, moitas e nuvens: cinzas azulados, sem cansar
const NOITE_TOM = ['#ffffff', '#c3ccd9'];
const monoC = new Map();
const mono = (im, cen) => {
  if (!im.complete || !im.naturalWidth) return im;
  let c = monoC.get(im); if (c) return c;
  const k = /\.svg/.test(im.src) ? Math.max(1, Math.round(160 / Math.max(im.naturalWidth, im.naturalHeight))) : 1; // SVG ganha resolução; o portal (PNG) mantém o tamanho dos quadros
  c = document.createElement('canvas'); c.width = im.naturalWidth * k; c.height = im.naturalHeight * k;
  const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, c.width, c.height);
  let d; try { d = g.getImageData(0, 0, c.width, c.height); } catch (e) { monoC.set(im, im); return im; } // sem permissão de leitura: usa o desenho normal
  const p = d.data;
  for (let n = 0; n < p.length; n += 4) {
    if (p[n + 3] < 8) continue;
    const lumi = 0.299 * p[n] + 0.587 * p[n + 1] + 0.114 * p[n + 2];
    const t = (cen === 3 && lumi > 140) ? [150, 162, 181] : (cen === 2 ? TOM_NUVEM : cen ? TOM_CENARIO : TOM_OBJETO)[Math.min(NIV - 1, Math.floor((0.299 * p[n] + 0.587 * p[n + 1] + 0.114 * p[n + 2]) / (256 / NIV)))];
    p[n] = t[0]; p[n + 1] = t[1]; p[n + 2] = t[2]; p[n + 3] = p[n + 3] < 128 ? 0 : 255;
  }
  g.putImageData(d, 0, 0); monoC.set(im, c); return c;
};
const TOM_TEMP = [[27, 33, 43], [38, 46, 59], [50, 60, 76], [65, 77, 96], [85, 97, 120]]; // nuvem de tempestade: 5 tons de cinza escuro
let nuvTemp = null;
const nuvemTemp = () => { const im = IM.nuvem; if (nuvTemp || !im.complete || !im.naturalWidth) return nuvTemp;
  const k = Math.max(1, Math.round(160 / Math.max(im.naturalWidth, im.naturalHeight))), c = document.createElement('canvas'); c.width = im.naturalWidth * k; c.height = im.naturalHeight * k;
  const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, c.width, c.height);
  let d; try { d = g.getImageData(0, 0, c.width, c.height); } catch (e) { return null; } const p = d.data;
  for (let n = 0; n < p.length; n += 4) { if (p[n + 3] < 8) continue; const lu = 0.299 * p[n] + 0.587 * p[n + 1] + 0.114 * p[n + 2], t = TOM_TEMP[Math.min(4, Math.floor(lu / (256 / 5)))]; p[n] = t[0]; p[n + 1] = t[1]; p[n + 2] = t[2]; p[n + 3] = p[n + 3] < 128 ? 0 : 255; }
  g.putImageData(d, 0, 0); return (nuvTemp = c); };
const S = (im) => (noite ? mono(im, im === IM.nuvem ? 2 : (im === IM.chao ? (neve ? 1 : 3) : (im === IM.mato || IM.arv.includes(im)) ? 1 : 0)) : im);
const TINTA = () => (noite && !ceuClaro() ? NOITE_TOM[0] : '#102532'), TINTA2 = () => (noite && !ceuClaro() ? NOITE_TOM[1] : '#2c4a5c');
// ---------- tema neve (Natal): chão branco, neve em cima das árvores, pedras, moitas e balão, flocos caindo e pegadas do cachorro ----------
// Fase de testes: o jogo já começa na neve. ?neve=0 desliga e a tecla V liga e desliga na hora.
const NEVE_TESTE = true;
const qNeve = /[?&]neve(=0)?(&|$)/.exec(location.search);
let neve = qNeve ? !qNeve[1] : NEVE_TESTE;
const IM0 = Object.assign({}, IM, { arv: IM.arv.slice() }), NV_C = new Map();
const hashN = (n) => { const q = Math.sin(n * 12.9898 + 4.1) * 43758.5453; return q - Math.floor(q); };
const NV_COBERTO = [[126, 163, 198], [169, 200, 227], [211, 230, 246], [255, 255, 255]]; // cone e montinho cobertos de neve: só o formato, em tons de branco e azul
const NV_BRANCO = [255, 255, 255], NV_SOMBRA = [185, 214, 236], NV_CHAO = [[159, 194, 224], [196, 220, 240], [227, 240, 250], [255, 255, 255]];
// devolve uma cópia do desenho com neve: 'chao' recolore tudo em tons de neve; 'topo' cobre as bordas de cima (2 a 4 quadradinhos) com neve
const nevaSprite = (im, modo, k) => {
  const w = im.naturalWidth * k, h = im.naturalHeight * k, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, w, h);
  let d; try { d = g.getImageData(0, 0, w, h); } catch (e) { return null; }
  const p = d.data, op = (x, y) => x >= 0 && x < w && y >= 0 && y < h && p[(y * w + x) * 4 + 3] > 100, pinta = (x, y, t) => { const n = (y * w + x) * 4; p[n] = t[0]; p[n + 1] = t[1]; p[n + 2] = t[2]; p[n + 3] = 255; };
  if (modo === 'chao' || modo === 'coberto') {
    const pal = modo === 'coberto' ? NV_COBERTO : NV_CHAO, ls = []; for (let n = 0; n < p.length; n += 4) if (p[n + 3] > 100) ls.push(0.299 * p[n] + 0.587 * p[n + 1] + 0.114 * p[n + 2]);
    ls.sort((a, b) => a - b); const q = [0.2, 0.5, 0.8].map((f) => ls[Math.floor(f * (ls.length - 1))]);
    for (let n = 0; n < p.length; n += 4) { if (p[n + 3] <= 100) continue; const l = 0.299 * p[n] + 0.587 * p[n + 1] + 0.114 * p[n + 2], t = pal[l <= q[0] ? 0 : l <= q[1] ? 1 : l <= q[2] ? 2 : 3]; p[n] = t[0]; p[n + 1] = t[1]; p[n + 2] = t[2]; p[n + 3] = 255; }
  } else {
    const a0 = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a0[y * w + x] = op(x, y) ? 1 : 0;
    for (let x = 0; x < w; x++) {
      const col = Math.floor(x / k), gro = 3 + (hashN(col) < 0.4 ? 1 : 0) + (hashN(col * 3.7) < 0.15 ? 1 : 0);
      for (let y = 0; y < h; y++) {
        if (!a0[y * w + x] || (y > 0 && a0[(y - 1) * w + x])) continue; // só onde começa um trecho com ar em cima
        for (let j = 0; j < gro * k; j++) { if (y + j >= h || !a0[(y + j) * w + x]) break; pinta(x, y + j, j >= (gro - 1) * k ? NV_SOMBRA : NV_BRANCO); }
      }
    }
  }
  g.putImageData(d, 0, 0); return c;
};
const neveTroca = (orig, modo, k, aplica) => {
  if (!neve) { aplica(orig); return; }
  let v = NV_C.get(orig); if (v) { if (v === orig || (v.complete && v.naturalWidth)) aplica(v); return; }
  if (!orig.complete || !orig.naturalWidth) return; // ainda carregando: tenta de novo
  const c = nevaSprite(orig, modo, k || Math.max(1, Math.round(160 / Math.max(orig.naturalWidth, orig.naturalHeight)))); if (!c) { NV_C.set(orig, orig); return; }
  v = new Image(); NV_C.set(orig, v); v.onload = () => { if (neve) aplica(v); }; v.src = c.toDataURL();
};
const NEVE_ITENS = [['chao', 'chao'], ['mato', 'topo'], ['pedra', 'topo'], ['terra', 'coberto'], ['cone', 'coberto'], ['moita', 'topo'], ['balao', 'topo']];
const neveAtualiza = () => { // troca os desenhos do cenário pelas versões com neve (ou volta aos originais)
  NEVE_ITENS.forEach(([k, m]) => neveTroca(IM0[k], m, 0, (im) => { IM[k] = im; }));
  [0, 1, 2].forEach((i) => neveTroca(IM0.arv[i], 'topo', 1, (im) => { IM.arv[i] = im; })); // árvores mantêm o tamanho original
};
neveAtualiza(); { let n = 0; const tm = setInterval(() => { neveAtualiza(); if (++n > 40) clearInterval(tm); }, 400); }
// flocos caindo (na frente de tudo, abaixo do placar) e pegadas do cachorro na neve do chão
let nev = [], pegs = [], pegEm = 0, pegAlt = 0, neveT = 0; // neveT: a neve começa fraquinha e vai aumentando
const novoFloco = (espalha) => { const r = Math.random(); return { x: Math.random() * (W + 40), y: espalha ? Math.random() * H : -6, s: r < 0.55 ? 2 : r < 0.85 ? 3 : 4, vy: 38 + Math.random() * 48, fq: 0.8 + Math.random() * 1.4, ph: Math.random() * 6.28, t: 0, fim: chaoY() + 4 + Math.random() * (CHAO_H * 0.7) }; };
const neveAnda = (dt) => {
  if (!neve) { nev.length = 0; pegs.length = 0; return; }
  neveT += dt; const alvo = Math.round(Math.min(120, 28 + W / 9) * Math.min(1, 0.15 + neveT / 25)); while (nev.length < alvo) nev.push(novoFloco(true));
  while (nev.length > alvo) nev.pop();
  nev.forEach((f, i) => { f.t += dt; f.y += f.vy * dt * (0.7 + f.s * 0.12); f.x += (Math.sin(f.t * f.fq + f.ph) * 16 - 14) * dt; if (f.y > f.fim || f.x < -8) nev[i] = novoFloco(false); });
};
const nevePegas = (dt, v) => { // uma pegada a cada passo (traseira, dianteira, traseira...), que anda para trás junto com o chão e vai sumindo
  if (!neve) return;
  if (player.noChao && estado === 'jogando') { pegEm -= dt; if (pegEm <= 0) { pegEm = 0.105; pegAlt ^= 1; pegs.push({ x: player.x + (pegAlt ? 30 : 80), y: chaoY() + 11 + (pegAlt ? 0 : 5) }); } }
  pegs.forEach((q) => { q.x -= v * dt; }); pegs = pegs.filter((q) => q.x > -10);
};
const nevePegasDesenha = () => {
  if (!neve || !pegs.length) return;
  const cor = escuro() ? '96,112,140' : '120,150,185'; cx.fillStyle = 'rgba(' + cor + ',1)';
  pegs.forEach((q) => { const a = Math.max(0, Math.min(1, (q.x + 10) / (player.x + 70))); if (a <= 0.02) return; cx.globalAlpha = a * 0.9; const x = Math.round(q.x), y = Math.round(q.y);
    cx.fillRect(x - 5, y, 3, 3); cx.fillRect(x - 1, y - 3, 3, 3); cx.fillRect(x + 3, y, 3, 3); cx.fillRect(x - 3, y + 3, 7, 3); }); // pata: três dedos e a almofada
  cx.globalAlpha = 1;
};
const neveDesenha = () => {
  if (!neve || !nev.length) return;
  nev.forEach((f) => { const x = Math.round(f.x), y = Math.round(f.y); cx.fillStyle = 'rgba(120,150,190,0.35)'; cx.fillRect(x + 1, y + 1, f.s, f.s); cx.fillStyle = 'rgba(255,255,255,0.95)'; cx.fillRect(x, y, f.s, f.s); });
};

// ---------- camada do jogo ----------
const box = document.createElement('div');
box.id = 'cp-jogo'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Jogo da nuvem'); box.hidden = true; box.tabIndex = -1;
box.innerHTML = '<canvas></canvas><button type="button" class="jg-x" aria-label="Fechar o jogo" title="Fechar (Esc)"><img src="icones/fechar.svg?v=' + V + '" alt="" width="26" height="26"></button><div class="jg-dica" aria-hidden="true" style="display:none"></div>';
area.append(box);
const aplicaTema = () => { box.classList.toggle('noite', noite); };
aplicaTema();
const aviso = document.createElement('div');
aviso.className = 'cp-jogo-aviso'; aviso.setAttribute('role', 'status'); aviso.hidden = true; area.append(aviso);
let avT = 0;
const avisa = (t) => { aviso.textContent = t; aviso.hidden = false; requestAnimationFrame(() => aviso.classList.add('on')); clearTimeout(avT); avT = setTimeout(() => { aviso.classList.remove('on'); setTimeout(() => { aviso.hidden = true; }, 300); }, 4500); };
const cv = box.querySelector('canvas'), cx = cv.getContext('2d'), dica = box.querySelector('.jg-dica'), fechar = box.querySelector('.jg-x');
// "PRESS START" vetorizado da referência (fonte pixel): 78 x 30 quadradinhos, desenhado como forma única
const PS_P = new Path2D('M0 0h12v1h-12zM16 0h12v1h-12zM32 0h14v1h-14zM50 0h10v1h-10zM66 0h10v1h-10zM0 1h12v1h-12zM16 1h12v1h-12zM32 1h14v1h-14zM50 1h10v1h-10zM66 1h10v1h-10zM0 2h4v1h-4zM10 2h4v1h-4zM16 2h4v1h-4zM26 2h4v1h-4zM32 2h4v1h-4zM48 2h4v1h-4zM58 2h4v1h-4zM64 2h4v1h-4zM74 2h4v1h-4zM0 3h4v1h-4zM10 3h4v1h-4zM16 3h4v1h-4zM26 3h4v1h-4zM32 3h4v1h-4zM48 3h4v1h-4zM58 3h4v1h-4zM64 3h4v1h-4zM74 3h4v1h-4zM0 4h4v1h-4zM10 4h4v1h-4zM16 4h4v1h-4zM26 4h4v1h-4zM32 4h4v1h-4zM48 4h4v1h-4zM64 4h4v1h-4zM0 5h4v1h-4zM10 5h4v1h-4zM16 5h4v1h-4zM26 5h4v1h-4zM32 5h4v1h-4zM48 5h4v1h-4zM64 5h4v1h-4zM0 6h4v1h-4zM10 6h4v1h-4zM16 6h4v1h-4zM24 6h6v1h-6zM32 6h12v1h-12zM50 6h10v1h-10zM66 6h10v1h-10zM0 7h4v1h-4zM10 7h4v1h-4zM16 7h4v1h-4zM24 7h6v1h-6zM32 7h12v1h-12zM50 7h10v1h-10zM66 7h10v1h-10zM0 8h12v1h-12zM16 8h10v1h-10zM32 8h4v1h-4zM58 8h4v1h-4zM74 8h4v1h-4zM0 9h12v1h-12zM16 9h10v1h-10zM32 9h4v1h-4zM58 9h4v1h-4zM74 9h4v1h-4zM0 10h4v1h-4zM16 10h4v1h-4zM22 10h6v1h-6zM32 10h4v1h-4zM48 10h4v1h-4zM58 10h4v1h-4zM64 10h4v1h-4zM74 10h4v1h-4zM0 11h4v1h-4zM16 11h4v1h-4zM22 11h6v1h-6zM32 11h4v1h-4zM48 11h4v1h-4zM58 11h4v1h-4zM64 11h4v1h-4zM74 11h4v1h-4zM0 12h4v1h-4zM16 12h4v1h-4zM24 12h6v1h-6zM32 12h14v1h-14zM50 12h10v1h-10zM66 12h10v1h-10zM0 13h4v1h-4zM16 13h4v1h-4zM24 13h6v1h-6zM32 13h14v1h-14zM50 13h10v1h-10zM66 13h10v1h-10zM5 16h10v1h-10zM19 16h12v1h-12zM35 16h6v1h-6zM47 16h12v1h-12zM63 16h12v1h-12zM5 17h10v1h-10zM19 17h12v1h-12zM35 17h6v1h-6zM47 17h12v1h-12zM63 17h12v1h-12zM3 18h4v1h-4zM13 18h4v1h-4zM23 18h4v1h-4zM33 18h4v1h-4zM39 18h4v1h-4zM47 18h4v1h-4zM57 18h4v1h-4zM67 18h4v1h-4zM3 19h4v1h-4zM13 19h4v1h-4zM23 19h4v1h-4zM33 19h4v1h-4zM39 19h4v1h-4zM47 19h4v1h-4zM57 19h4v1h-4zM67 19h4v1h-4zM3 20h4v1h-4zM23 20h4v1h-4zM31 20h4v1h-4zM41 20h4v1h-4zM47 20h4v1h-4zM57 20h4v1h-4zM67 20h4v1h-4zM3 21h4v1h-4zM23 21h4v1h-4zM31 21h4v1h-4zM41 21h4v1h-4zM47 21h4v1h-4zM57 21h4v1h-4zM67 21h4v1h-4zM5 22h10v1h-10zM23 22h4v1h-4zM31 22h4v1h-4zM41 22h4v1h-4zM47 22h4v1h-4zM55 22h6v1h-6zM67 22h4v1h-4zM5 23h10v1h-10zM23 23h4v1h-4zM31 23h4v1h-4zM41 23h4v1h-4zM47 23h4v1h-4zM55 23h6v1h-6zM67 23h4v1h-4zM13 24h4v1h-4zM23 24h4v1h-4zM31 24h14v1h-14zM47 24h10v1h-10zM67 24h4v1h-4zM13 25h4v1h-4zM23 25h4v1h-4zM31 25h14v1h-14zM47 25h10v1h-10zM67 25h4v1h-4zM3 26h4v1h-4zM13 26h4v1h-4zM23 26h4v1h-4zM31 26h4v1h-4zM41 26h4v1h-4zM47 26h4v1h-4zM53 26h6v1h-6zM67 26h4v1h-4zM3 27h4v1h-4zM13 27h4v1h-4zM23 27h4v1h-4zM31 27h4v1h-4zM41 27h4v1h-4zM47 27h4v1h-4zM53 27h6v1h-6zM67 27h4v1h-4zM5 28h10v1h-10zM23 28h4v1h-4zM31 28h4v1h-4zM41 28h4v1h-4zM47 28h4v1h-4zM55 28h6v1h-6zM67 28h4v1h-4zM5 29h10v1h-10zM23 29h4v1h-4zM31 29h4v1h-4zM41 29h4v1h-4zM47 29h4v1h-4zM55 29h6v1h-6zM67 29h4v1h-4z');
window.cpPS = PS_P; // o jogo da bolha usa o mesmo texto
const pixTexto = (_txt, mx, my, k) => {
  const s = k, w = 78 * s, h = 30 * s, x0 = Math.round(mx - w / 2), y0 = Math.round(my - h / 2);
  cx.save(); cx.translate(x0, y0); cx.scale(s, s);
  cx.save(); cx.translate(1, 1.4); cx.fillStyle = escuro() ? '#0d1218' : '#102532'; cx.fill(PS_P); cx.restore(); // sombra escura para ler em qualquer fundo
  cx.fillStyle = '#ffffff'; cx.fill(PS_P); cx.restore();
};
// modo noite que vai ganhando cor: quanto mais o cachorro avança na fase, mais o cenário volta às cores (nuvens, balão, moitas, chão)
const FORCA_P = (/[?&]amanhecer=([\d.]+)/.exec(location.search) || [])[1]; // teste: ?amanhecer=0.7 trava o progresso da fase (0 a 1)
const FASE0 = +((/[?&]fase=(\d+)/.exec(location.search) || [])[1] || 0); // teste: ?fase=1 começa na fase 1 (volta, entardecendo)
// fase par: anoitecido -> amanhece (0 a 1). fase ímpar (cenário espelhado, na volta): o contrário, vai do dia ao anoitecer
const progFase = () => { const r = FORCA_P !== undefined ? Math.min(1, +FORCA_P) : Math.max(0, Math.min(1, (dist - PORTAL_PTS * fase) / PORTAL_PTS)); return fase % 2 === 1 ? 1 - r : r; };
// amanhecer: perto do fim da fase noturna o céu sai do cinza, passa por roxo escuro, roxo claro, rosa e laranja, até o azul do dia
const CEU = [[0.45, '#26303f', '#26303f'], [0.62, '#2b2150', '#43306a'], [0.78, '#4d3b80', '#b8638f'], [0.9, '#8a7bc4', '#f6a35f'], [1, '#cfe6f5', '#cfe6f5']];
const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mistura = (a, b, t) => { const A = hex2(a), B = hex2(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
const ceuCores = (p) => { if (p <= CEU[0][0]) return null; for (let i = 1; i < CEU.length; i++) if (p <= CEU[i][0]) { const a = CEU[i - 1], b = CEU[i], t = (p - a[0]) / (b[0] - a[0]); return [mistura(a[1], b[1], t), mistura(a[2], b[2], t)]; } return [CEU[4][1], CEU[4][2]]; };
const ceuClaro = () => noite && progFase() > 0.82; // céu claro: textos escuros
const escuro = () => noite && !ceuClaro(); // tema escuro dos textos e da barra (some quando o céu clareia)
const faixa = (a, b) => Math.max(0, Math.min(1, (progFase() - a) / (b - a)));
const dCor = (im, k, ...a) => { cx.drawImage(S(im), ...a); if (noite && k > 0.01) { const g = cx.globalAlpha; cx.globalAlpha = g * k; cx.drawImage(im, ...a); cx.globalAlpha = g; } };

let W = 0, H = 0, dpr = 1;
const mede = () => {
  const r = box.getBoundingClientRect(); if (!r.width) return;
  dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.round(r.width); H = Math.round(r.height);
  cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.imageSmoothingEnabled = false;
};

// ---------- portal: a cada 10.000 pontos o jogo vira do outro lado ----------
const PORTAL_PTS = 10000; // pontuação do primeiro portal e de cada portal seguinte
const PORT_N = 10, PORT_W = 33, PORT_H = 62; // quadros do GIF do portal (10 quadros de 33 x 62)
const T_SUGA = 0.55, T_VIRA = 0.55, T_SOLTA = 0.3; // segundos: o cachorro entra, vira, sai e o portal some

// ---------- tempestade: chuva e raio lá no fundo, só um pouquinho de chuva na frente ----------
// Vem e vai sozinha (começa em 10 a 20 s, dura 35 a 60 s, descansa 20 a 40 s). O raio é pequeno e distante, atrás das moitas, a cada ~28 s.
// Com ?chuva na URL fica sempre ligada, para testar.
const flagChuva = /[?&]chuva(=|&|$)/.test(location.search);
let ch = null;
const chReset = () => { ch = { k: flagChuva ? 1 : 0, alvo: flagChuva ? 1 : 0, em: flagChuva ? 1e9 : 10 + Math.random() * 10, fundo: [], frente: [], ondas: [], raio: null, raioEm: flagChuva ? 3 : 8 }; };
const chGota = (fundo, espalha) => { const cy = chaoY(); if (fundo) { const yEnd = cy - 2 - Math.random() * 6, len = 7 + Math.random() * 10; return { x: -H * 0.3 + Math.random() * (W + H * 0.3), y: espalha ? Math.random() * yEnd : -len, len, v: 420 + Math.random() * 260, a: 0.12 + Math.random() * 0.18, yEnd }; } const yEnd = cy + 2 + Math.random() * 5, len = 16 + Math.random() * 14; return { x: -H * 0.4 + Math.random() * (W + H * 0.4), y: espalha ? Math.random() * yEnd : -len, len, v: 900 + Math.random() * 350, a: 0.3 + Math.random() * 0.25, yEnd }; };
const chRaio = () => { const cy = chaoY(), alt = cy - 6, pts = [[W * (0.1 + Math.random() * 0.8), 0]], ramos = []; let [x, y] = pts[0]; while (y < alt) { y += 7 + Math.random() * 9; x += (Math.random() - 0.5) * 16; pts.push([x, Math.min(y, alt)]); } for (let q = 0; q < 2 + Math.floor(Math.random() * 2); q++) { const i = 2 + Math.floor(Math.random() * Math.max(1, pts.length - 4)), s = Math.random() < 0.5 ? -1 : 1, r = [pts[i].slice()]; let [bx, by] = r[0]; for (let m = 0, n = 3 + Math.floor(Math.random() * 3); m < n; m++) { by += 6 + Math.random() * 6; bx += s * (3 + Math.random() * 8); if (by < alt) r.push([bx, by]); } ramos.push(r); } return { t: 0, pts, ramos }; };
const chMove = (arr, n, fundo, dt) => {
  while (arr.length < n) arr.push(chGota(fundo, true));
  for (let i = arr.length - 1; i >= 0; i--) { const g = arr[i]; g.y += g.v * dt; g.x += g.v * dt * 0.5; if (g.y >= g.yEnd) { if (arr.length > n) arr.splice(i, 1); else arr[i] = chGota(fundo, false); } }
};
const chPasso = (dt) => {
  if (!ch) chReset();
  if (!flagChuva && fase !== 2) { ch.alvo = 0; ch.em = 10 + Math.random() * 10; } // a tempestade é só da terceira etapa (ir, voltar e ir de novo)
  else if (!flagChuva) { ch.em -= dt; if (ch.em <= 0) { ch.alvo = ch.alvo ? 0 : 1; ch.em = ch.alvo ? 35 + Math.random() * 25 : 20 + Math.random() * 20; if (ch.alvo) ch.raioEm = 6 + Math.random() * 6; } }
  ch.k += Math.sign(ch.alvo - ch.k) * Math.min(Math.abs(ch.alvo - ch.k), dt / 2);
  chMove(ch.fundo, Math.round(Math.min(110, 30 + W / 14) * ch.k), true, dt);
  chMove(ch.frente, Math.round(Math.min(6, 3 + W / 500) * ch.k), false, dt);
  ch.ondas.forEach((o) => { o.t += dt; }); ch.ondas = ch.ondas.filter((o) => o.t < 0.7);
  if (ch.k > 0.7 && !ch.raio) { ch.raioEm -= dt; if (ch.raioEm <= 0) { ch.raioEm = flagChuva ? 6 : 27 + Math.random() * 3; ch.raio = chRaio(); } }
  if (ch.raio) { ch.raio.t += dt; if (ch.raio.t > 0.5) ch.raio = null; }
};
const chCor = () => (escuro() ? '223,233,247' : '70,100,130');
const chRisca = (arr, k) => { const cor = chCor(); cx.lineWidth = 1; arr.forEach((g) => { cx.strokeStyle = 'rgba(' + cor + ',' + (g.a * k) + ')'; cx.beginPath(); cx.moveTo(Math.round(g.x), Math.round(g.y)); cx.lineTo(Math.round(g.x - g.len * 0.45), Math.round(g.y - g.len)); cx.stroke(); }); };
const chFundo = () => { // atrás de tudo (nuvens, moitas, cachorro): céu fechado, chuvisco distante e o raio lá longe
  if (!ch || ch.k <= 0.01) return;
  cx.save(); if (espelho) { cx.translate(W, 0); cx.scale(-1, 1); } // desfaz o espelho das fases ímpares: a chuva cai sempre para o mesmo lado
  const cy = chaoY(); cx.fillStyle = 'rgba(10,16,28,' + (0.14 * ch.k) + ')'; cx.fillRect(0, 0, W, cy);
  const r = ch.raio;
  if (r) { const u = r.t, vis = u < 0.08 || (u > 0.14 && u < 0.28), fade = Math.max(0, 1 - u / 0.5); cx.fillStyle = 'rgba(205,222,255,' + ((vis ? 0.16 : 0.05) * fade) + ')'; cx.fillRect(0, 0, W, cy);
    if (vis) { const traca = (p, w, c) => { cx.strokeStyle = c; cx.lineWidth = w; cx.lineJoin = 'miter'; cx.beginPath(); p.forEach((q, i) => (i ? cx.lineTo(Math.round(q[0]), Math.round(q[1])) : cx.moveTo(Math.round(q[0]), Math.round(q[1])))); cx.stroke(); }; traca(r.pts, 5, 'rgba(140,180,255,.14)'); r.ramos.forEach((b) => traca(b, 1, 'rgba(225,236,255,.6)')); traca(r.pts, 2, 'rgba(200,220,255,.9)'); traca(r.pts, 1, '#fff'); } }
  chRisca(ch.fundo, ch.k);
  cx.restore();
};
const chDesenha = () => { // na frente: só alguns pingos e marolas no chão
  if (!ch || ch.k <= 0.01) return;
  cx.save(); cx.beginPath(); cx.rect(0, 0, W, chaoY() + 8); cx.clip(); chRisca(ch.frente, ch.k); cx.restore(); // nada passa da faixa da grama
};

// ---------- balão: de vez em quando sobe de trás da paisagem (grande, na diagonal) ou passa pequeno ao fundo ----------
const BAL_AR = 31 / 42; // largura / altura do desenho

// ---------- estado ----------
let curaT = 0, voam = []; // curaT: brilho do coração que voltou; voam: coraçõezinhos que sobem em espiral
let vidas = 3, invul = 0; // 3 vidas: cada batida tira uma e o cachorro vai perdendo a cor
let mor = null, morEm = 7, aveModo = null, decoX = 0, ave = null, aveEm = 6; // decoX: cenário ao fundo (cerca e banco); ave: passarinho que cruza o céu
let balao = null, balaoEm = 8; // balaoEm: segundos de jogo até o próximo balão
let fase = 0, espelho = false, portal = null, tPortal = 0, viraFeito = false, fasePt = 0, avisoFase = 0;
let motivo = '', fimEm = 0, aberto = false, estado = 'pronto', raf = 0, t0 = 0, morreuEm = 0;
let folhas = [], burst = null, poeira = [], poeiraEm = 0, acel = 1, alvoAcel = 1, matoX = 0, arvO = null, arvEm = 0, arvTipo = 'chao', vel, dist, recorde = 0, obst, nuvensF, chaoX, prox;
const player = { x: 90, y: 0, vy: 0, w: 105, h: 50, noChao: true };
try { recorde = parseInt(localStorage.getItem(CH) || '0', 10) || 0; } catch (e) { recorde = 0; }
const CHAO_W = 256, CHAO_H = 60; // faixa do chão: 64x15 quadradinhos de 4 px
const chaoY = () => H - CHAO_H;
const ARV_U = 2.4, ARVG_U = 2.9; // uma árvore por vez na tela: 'fundo' (atrás da moita, anda com ela) ou 'chao' (em pé na linha da grama, maior)
const arvTam = (t) => { const im = IM.arv[0]; return im && im.naturalWidth ? [im.naturalWidth * (t === 'chao' ? ARVG_U : ARV_U), im.naturalHeight * (t === 'chao' ? ARVG_U : ARV_U)] : [0, 0]; };
const arvAnda = (v, dt) => { if (!arvO) return; arvO.x -= v * dt * (arvO.tipo === 'fundo' ? 0.6 : 1); if (arvO.tipo === 'chao' && !arvO.cor && arvO.x + arvTam('chao')[0] / 2 < player.x + player.w / 2) arvO.cor = true; /* árvore que o cachorro já passou fica colorida, como as pedras */ if (arvO.x < -400) { arvO = null; arvEm = 2 + Math.random() * 5; } };
const arvNasce = (dt) => { if (arvO) return; arvEm -= dt; if (arvEm > 0) return; const t = arvTipo; arvTipo = t === 'chao' ? 'fundo' : 'chao'; const [aw] = arvTam(t); if (!aw) return; if (t === 'chao') arvO = { tipo: t, x: W + 40, v: fase % 3 }; else { const xm = matoX + Math.ceil((W + aw / 2 - 300 - matoX) / MATO_P) * MATO_P; arvO = { tipo: t, x: xm + 300 - aw / 2, v: fase % 3 }; } }; // árvore: aparece junto de uma moita a cada 2 moitas; ARV_U = tamanho de cada quadradinho
const MATO_W = 330, MATO_H = 330 * 13 / 91, MATO_P = 560; // moita ao fundo: largura, altura e distância entre uma e outra
const AFUNDA = 7; // quanto os desenhos entram na grama (para não flutuar)
const PASSO = 3; // distância por quadro (a 430 de velocidade = 10 quadros/s, como no GIF)
const GRAV = 2600, PULO = 880;
// nuvens de tamanhos variados (pequenas, médias, grandes e bem grandes), bem espaçadas e aleatórias
const novaNuvem = (x) => {
  const r = Math.random(); let w;
  if (r < 0.4) w = 45 + Math.random() * 40; else if (r < 0.8) w = 95 + Math.random() * 70; else w = 165 + Math.random() * 75; // nuvens de 45 a 240 px (sem as gigantes)
  const h = w * 107.2 / 171;
  return { x, w, y: -8 + Math.random() * Math.max(10, H * 0.62 - h * 0.7), v: 8 + Math.random() * 20 };
};
let fantLib = 0, trenoLib = 0;
const reinicia = () => {
  fantLib = 0; trenoLib = 0; neveT = 0; chReset(); vidas = 3; invul = 0; voam = []; curaT = 0; burst = null; poeira = []; folhas = []; mor = null; morEm = 5 + Math.random() * 5; acel = 1; alvoAcel = 1; player.x = 90; vel = 430; dist = PORTAL_PTS * FASE0; matoX = 0; arvO = { tipo: 'chao', x: 600, v: FASE0 % 3 }; arvEm = 0; arvTipo = 'fundo'; obst = []; chaoX = 0; prox = 900; fase = FASE0; noite = true; aplicaTema(); espelho = FASE0 % 2 === 1; portal = null; avisoFase = 0; balao = null; balaoEm = 6 + Math.random() * 6; decoX = 0; ave = null; aveEm = 10 + Math.random() * 8;
  nuvensF = []; let nx = -Math.random() * 200;
  while (nx < W * 1.4) { const n = novaNuvem(nx); nuvensF.push(n); nx += n.w + 150 + Math.random() * 450; }
  player.y = chaoY() - player.h; player.vy = 0; player.noChao = true;
};
// buraco no chão (obra): bacia em degraus de 4 px aberta na grama (cantinhos verdes arredondados), terra marrom clara na borda e mais escura no fundo
const mistCor = (h, alvo, t) => { const a = [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)), b = [1, 3, 5].map((k) => parseInt(alvo.slice(k, k + 2), 16)); return 'rgb(' + a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(',') + ')'; };
const desenhaBuraco = (o, cy) => {
  const esc = noite && !o.cor, P = (h0) => { // antes de o cachorro passar o buraco é cinza azulado, como as pedras; depois ganha cor
    let h = h0;
    if (neve) { // na neve o buraco fica coberto: brancos e azuis um pouco mais escuros que o chão; a grama vira neve
      const r = parseInt(h0.slice(1, 3), 16), g = parseInt(h0.slice(3, 5), 16), b = parseInt(h0.slice(5, 7), 16), Ln = (0.299 * r + 0.587 * g + 0.114 * b) / 255, t = g > r + 20 && g > b + 20 ? 1 : Math.min(1, 0.1 + Ln * 1.3), hx = (a0, a1) => Math.round(a0 + (a1 - a0) * t).toString(16).padStart(2, '0');
      h = '#' + hx(0x86, 0xf2) + hx(0xa9, 0xf8) + hx(0xcb, 0xfd);
    }
    if (!esc) return h;
    const L = (0.299 * parseInt(h.slice(1, 3), 16) + 0.587 * parseInt(h.slice(3, 5), 16) + 0.114 * parseInt(h.slice(5, 7), 16)) / 255;
    return mistCor('#26303f', '#8b9bb3', Math.min(1, 0.15 + L * 1.1));
  };
  const cell = 4, x0 = Math.round(o.x), w = Math.round(o.w / cell) * cell, y0 = Math.round(cy) - 2;
  const INS = [0, 0, 4, 8, 12, 20, 28]; // quanto a bacia entra de cada lado, linha a linha (fundo arredondado)
  INS.forEach((ins, r) => {
    const y = y0 + r * cell, xl = x0 + ins, xr = x0 + w - ins;
    cx.fillStyle = P(r === INS.length - 1 ? '#4a2c1a' : (r < 4 ? '#8f5d33' : '#6b4226')); cx.fillRect(xl, y, xr - xl, cell); // parede (marrom médio; fundo mais escuro)
    cx.fillStyle = P(r < 2 ? '#b57e47' : (r < 4 ? '#8f5d33' : (r < 5 ? '#6b4226' : '#4a2c1a'))); if (r < INS.length - 1) cx.fillRect(xl + cell, y, xr - xl - cell * 2, cell); // miolo: terra escura que escurece com a profundidade
    if (r < INS.length - 1) { cx.fillStyle = P('#b57e47'); cx.fillRect(xl, y, cell, cell); } // lado esquerdo iluminado (marrom mais claro)
    if (r < 3) { cx.fillStyle = P('#6b4226'); cx.fillRect(xr - cell, y, cell, cell); } // lado direito, um pouco mais escuro
  });
  // grama de cada lado avançando para dentro do buraco, irregular (cada buraco tem o seu jeito)
  const jg = o.jag, gl = [8 + jg[0][0] * 2, 4 + jg[1][0], 4 + jg[2][0] / 2], gr = [8 + jg[0][1] * 2, 4 + jg[1][1], 4 + jg[2][1] / 2];
  [[0, gl, 1], [1, gr, -1]].forEach(([lado, g, dir]) => g.forEach((len, r) => {
    const y = y0 - 2 + r * 3, h = r === 0 ? 3 : 3, xa = lado === 0 ? x0 - 2 : x0 + w + 2 - len;
    cx.fillStyle = P(r === 0 ? '#6fcf55' : '#55b83f'); cx.fillRect(xa, y, len + (lado === 0 ? 2 : 0), h);
  }));
};
// fumaça da largada: 23 quadros do GIF (puff que abre em anel e some). Ordem: 15..22 (nasce) e 0..13 (anel se desfaz); o quadro 14 é vazio
const BURST_ORD = [15, 16, 17, 18, 19, 20, 21, 22, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], BURST_W = 287, BURST_H = 252, BURST_ESC = 0.45, BURST_DT = 0.045;
// poeirinha nas patinhas: bolinhas brancas com sombra cinza, nascem nos pés, andam com o chão e somem
const sopra = (x, y, n, forca) => { for (let i = 0; i < n; i++) poeira.push({ x: x + (Math.random() - 0.5) * 10, y: y - Math.random() * 3, vx: -(30 + Math.random() * 50) * forca, vy: -(18 + Math.random() * 34), r: 2 + Math.random() * 2, t: 0, vida: 0.35 + Math.random() * 0.25 }); };
const FOLHA_COR = ['#00b84a', '#05823a', '#00ff6a', '#024a29']; // verdes da moita
const atualizaFolhas = (dt, v) => { folhas.forEach((f) => { f.t += dt; f.x += (f.vx - v * 0.5) * dt; f.y += f.vy * dt; f.vy += 420 * dt; }); folhas = folhas.filter((f) => f.t < f.vida); };
const atualizaPoeira = (dt, v) => { atualizaFolhas(dt, v); poeira.forEach((p) => { p.t += dt; p.x += (p.vx - v * 0.9) * dt; p.y += p.vy * dt; p.vy *= 0.94; }); poeira = poeira.filter((p) => p.t < p.vida); if (burst) { burst.t += dt; burst.x -= v * dt * 0.35; if (burst.t >= BURST_ORD.length * BURST_DT) burst = null; } };
const pula = () => {
  if (estado === 'pronto') { estado = 'jogando'; dica.classList.add('off'); burst = { t: 0, x: player.x + 15, y: chaoY() - 42 }; }
  if (estado === 'jogando' && player.noChao) { player.vy = -PULO; player.noChao = false; sopra(player.x + 25, chaoY() + 2, 4, 1.2); }
  else if (estado === 'morto' && performance.now() - morreuEm > 450) { reinicia(); estado = 'jogando'; burst = { t: 0, x: player.x + 15, y: chaoY() - 42 }; }
};
const sorteiaAve = () => (Math.random() < 0.5 ? IM.ave : IM.ave2); // alterna entre o passarinho do balão e o do café
const AVE_W = 66; // largura do passarinho no chão (33 quadradinhos x 2)
const novoObst = () => {
  const n0 = obst.length;
  let poleiro = false;
  const grande = Math.random() < Math.min(0.3, 0.14 + 0.05 * fase); // pedra gigante: ~2,7x a pedra básica, ainda dá para pular (pulo máximo ~149 px)
  const k = grande ? 4.8 : 1.8 + Math.random() * 0.7; // escala da pedra (32x22 quadradinhos)
  // cone de trânsito (22x24 quadradinhos) no lugar de algumas pedras: ~28% dos obstáculos comuns
  // cena de obra (cone + buraco + montinho): ~9%; cone sozinho: ~5%
  const cena = !grande && Math.random() < 0.14; // monte de terra nunca vem sozinho (sempre com buraco), e o cone sinaliza o buraco
  const cone = cena, kc = 2.1 + Math.random() * 0.4;
  // montinho de terra (20x13 quadradinhos): ~15% dos obstáculos que não são cone nem pedra gigante
  const terra = false, kt = 3;
  // moita no chão (48x39 quadradinhos): o cachorro atravessa, mas metade esconde uma pedra menor lá dentro
  const moita = !grande && !cena && Math.random() < 0.1, km = Math.random() < 0.4 ? 2.3 : 1.4 + Math.random() * 0.9, roca = moita && Math.random() < 0.55, rs = 0.55 + 0.45 * Math.min(1, (km - 1.4) / 0.9) * (0.8 + Math.random() * 0.2); // moita: 2.3 e o tamanho maximo; menores levam pedra menor; menos moitas
  const treno = neve && !moita && !grande && !cena && dist >= trenoLib && Math.random() < 0.3, TS = 3.4;
  const fant = !treno && !moita && !grande && !cena && (neve || (noite && progFase() < 0.55)) && dist >= fantLib && Math.random() < 0.5, bs = 1 + Math.random() * 0.5, fh = neve ? (Math.random() < 0.5 ? 96 : 142) : (22 * 1.8 + 46 + 2.3), froca = fant && Math.random() < 0.55; // fantasma (teste de Halloween): lençol do tamanho da pedra + passarinho; ou vazio (atravessa) ou cobrindo uma pedra
  const o = treno ? { x: W + 20, w: 47 * TS, h: 16 * TS, k: TS, treno: true, vs: 0 } : fant ? { x: W + 20, w: neve ? fh * 36 / 65 : fh * 32 / 38 * 1.3, h: fh, k: 1, moita: true, fantasma: true, boneco: neve, roca: froca ? { w: 32 * 1.5, h: 22 * 1.5 } : null } : moita ? { x: W + 20, w: 48 * km, h: 39 * km, k: km, moita: true, roca: roca ? { w: 32 * 1.5 * rs, h: 22 * 1.5 * rs } : null } : terra ? { x: W + 20, w: 20 * kt, h: 13 * kt, k: kt, terra: true } : cone ? { x: W + 20, w: 22 * kc, h: 24 * kc, k: kc, cone: true } : { x: W + 20, w: 32 * k, h: 22 * k, k, baixo: grande ? 8 : 0 }; // a pedra gigante afunda mais 10 px no chão
  if (fant) fantLib = dist + 1400 + Math.random() * 500; // fantasma é raro: só volta depois de um bom trecho (uns 3 por fase)
  obst.push(o);
  if (treno) trenoLib = dist + 500 + Math.random() * 400;
  if (!ave && aveEm <= 0 && aveModo === 'pedra' && !o.cone && !o.terra && !o.moita && !o.treno) { ave = { rock: o, sp: sorteiaAve() }; aveModo = null; poleiro = true; }
  // a cada portal o jogo fica mais difícil: mais duplas e, a partir da fase 2, trios para pular em 2 toques
  const P = (x) => ({ x, w: 32 * 1.8, h: 22 * 1.8, k: 1.8 });
  let fim = o;
  if (o.treno) { // trenó: às vezes sozinho, às vezes com um alvo logo à frente (boneco de neve ou pedra pequena) para ele arrebentar
    if (Math.random() < 0.75) { const ax = o.x + o.w + 260 + Math.random() * 160; if (Math.random() < 0.55) { const fh2 = Math.random() < 0.5 ? 96 : 142; fim = { x: ax, w: fh2 * 36 / 65, h: fh2, k: 1, moita: true, fantasma: true, boneco: true, roca: Math.random() < 0.55 ? { w: 32 * 1.5, h: 22 * 1.5 } : null }; } else fim = P(ax); obst.push(fim); }
  } else if (grande || o.moita) { /* gigante e moita vêm sozinhas */ } else if (o.cone) {
    if (cena) { // cone, depois (buraco e montinho) em qualquer ordem: um pulo no cone, aterrissa e outro pulo passa o par
      const bu = { x: 0, w: 76, h: 20, buraco: true, jag: Array.from({ length: 16 }, () => [Math.random() < 0.4 ? 4 : 0, Math.random() < 0.4 ? 4 : 0]) }, mt = { x: 0, w: 20 * 3.1, h: 13 * 3.1, k: 3.1, terra: true };
      const ini = o.x + o.w + 80 + Math.random() * 20;
      if (Math.random() < 0.5) { bu.x = ini; mt.x = bu.x + bu.w + 6; obst.push(bu, mt); fim = mt; } else { mt.x = ini; bu.x = mt.x + mt.w + 6; obst.push(mt, bu); fim = bu; }
    } /* senão: cone sozinho, nunca dois cones juntos */
  } else if (Math.random() < Math.min(0.55, 0.22 + 0.1 * fase)) {
    // trio: duas pedras coladas (um pulo passa nas duas) e a terceira logo depois do pouso (segundo pulo)
    const b2 = P(o.x + o.w + 22 + Math.random() * 16); obst.push(b2);
    fim = P(b2.x + b2.w + vel * (0.5 + Math.random() * 0.06)); obst.push(fim);
  } else if (Math.random() < Math.min(0.6, 0.3 + 0.1 * fase)) { fim = P(o.x + o.w + 22 + Math.random() * 16); obst.push(fim); }
  if (ave && !ave.rock && fim.x + fim.w > ave.x - 70 && o.x < ave.x + AVE_W + 70) { const dx = ave.x + AVE_W + 70 - o.x; for (let q = n0; q < obst.length; q++) obst[q].x += dx; fim = obst[obst.length - 1]; } // pedra nunca nasce em cima do passarinho
  return fim.x + fim.w - Math.min(...obst.slice(n0).map((q) => q.x)); // largura do conjunto, para o espaçamento da próxima
};

// o balão anda em coordenadas de tela (sempre da direita para a esquerda, mesmo com o jogo espelhado)
const novoBalao = () => {
  const cy = chaoY();
  const sorte = Math.random();
  if (sorte < 0.22) { // gigante: bem mais alto que a tela, lá no fundo, sobe devagar
    const h = Math.max(300, Math.min(600, cy * 1.9)), w = h * BAL_AR;
    balao = { grande: true, gigante: true, w, h, x: W * (0.1 + Math.random() * 0.6), y: cy - 30, vx: -(10 + Math.random() * 8), vy: -(22 + Math.random() * 10), a: 0.95 };
  } else if (sorte < 0.6) { // grande: nasce atrás do chão, à direita, e sobe na diagonal para a esquerda
    const h = Math.max(120, Math.min(300, cy * 1.05)), w = h * BAL_AR;
    balao = { grande: true, w, h, x: W * (0.45 + Math.random() * 0.4), y: cy - 6, vx: -(26 + Math.random() * 14), vy: -(16 + Math.random() * 10), a: 1 };
  } else { // pequeno, lá no fundo, devagar
    const h = 34 + Math.random() * 22, w = h * BAL_AR;
    balao = { grande: false, w, h, x: W + 10, y: H * (0.1 + Math.random() * 0.22), vx: -(14 + Math.random() * 10), vy: -(1 + Math.random() * 4), a: 0.85 };
  }
};
// altura do portal: cabe na área acima do chão
const portalAlt = () => Math.max(110, Math.min(190, chaoY() - 14));
// o cachorro entra no portal, o jogo vira (esquerda/direita) e ele sai do outro lado, mais rápido
const passoPortal = (dt) => {
  tPortal += dt;
  if (tPortal < T_SUGA) { vel = fasePt * Math.max(0, 1 - tPortal / T_SUGA); }
  else {
    if (!viraFeito) { viraFeito = true; fase++; if (vidas < 3) vidas++; mor = null; morEm = 5 + Math.random() * 5; aplicaTema(); espelho = !espelho; obst = []; vel = 0; prox = 700; avisoFase = 2.6;
      portal = { x: player.x + player.w / 2 - portalAlt() * PORT_W / PORT_H / 2, w: portalAlt() * PORT_W / PORT_H, h: portalAlt() }; }
    if (tPortal >= T_SUGA + T_VIRA + T_SOLTA) { portal = null; vel = 520 + 50 * fase; estado = 'jogando'; }
  }
};
// ---------- trenó (fase da neve): o cachorro pula em cima, o trenó desliza e arrebenta o que estiver na frente ----------
const quebra = (al, cores, n) => { for (let q = 0; q < n; q++) folhas.push({ x: al.x + al.w * Math.random(), y: chaoY() - al.h * Math.random(), vx: 40 + Math.random() * 280, vy: -120 - Math.random() * 340, t: 0, vida: 0.8 + Math.random() * 0.8, c: 0, k: cores[Math.floor(Math.random() * cores.length)], r: 4 + 2 * Math.floor(Math.random() * 3) }); };
const COR_NEVE = ['#ffffff', '#e7fafe', '#9ad3f4', '#77a7d0'], COR_PEDRA = ['#8c8a96', '#6c6a78', '#b3b1bd', '#55535f'], COR_TRENO = ['#f8a830', '#d87040', '#f8e860', '#b4583a'];
const trenoPasso = (a, v, dt) => {
  for (const o of obst) {
    if (!o.treno || o.sumiu) continue;
    const topo = chaoY() - o.h + AFUNDA + 3 * o.k; // altura do banco do trenó
    if (o.pulou > 0) o.pulou -= dt;
    if (o.montado) { // o cachorro vai em cima; sai pulando ou depois de uns 2 segundos
      o.montT = (o.montT || 0) + dt;
      if (player.vy < -50 || o.montT > 2.2) { o.montado = false; o.pulou = 0.5; }
      else { const tx = player.x + player.w * 0.5 - o.w * 0.45; o.x += (tx - o.x) * Math.min(1, 7 * dt); player.y = topo - player.h + 6; player.vy = 0; player.noChao = true; }
    } else if (!(o.pulou > 0) && estado === 'jogando' && a.x + a.w > o.x + 6 && a.x < o.x + o.w - 6 && a.y + a.h > topo + 4 && a.y < chaoY()) {
      if (player.vy >= 0 && a.y + a.h <= topo + 24) { o.montado = true; o.desl = true; o.montT = 0; }
      else { if (!o.desl) { o.desl = true; player.vy = -430; player.noChao = false; } o.pulou = 0.3; } // bateu com a perna: o trenó sai deslizando e o cachorro dá um pulinho (sem se machucar)
    }
    if (o.desl) { o.cor = true; const al = o.montado ? v : v * 1.55; o.vs = (o.vs || 0) + (al - (o.vs || 0)) * Math.min(1, (o.montado ? 5 : 2.5) * dt); }
    if (!o.desl) continue;
    for (const t of obst) { // o que o trenó encontra pelo caminho
      if (t === o || t.treno || t.buraco || t.terra || t.sumiu || (t.moita && !t.boneco && !t.roca)) continue;
      if (!(o.x + o.w > t.x + t.w * 0.25 && o.x < t.x + t.w * 0.75)) continue;
      if (t.k > 4) { quebra(o, COR_TRENO, 34); o.sumiu = true; if (o.montado) { o.montado = false; player.vy = -380; player.noChao = false; } break; } // pedra gigante: quem quebra é o trenó
      t.sumiu = true;
      if (t.boneco) { quebra(t, COR_NEVE, 44); quebra(t, ['#c23943', '#160b1e', '#fb7e60', '#2a8f4d'], 8); if (t.roca) quebra({ x: t.x, w: t.w, h: 30 }, COR_PEDRA, 12); }
      else if (t.cone) quebra(t, ['#f26a1b', '#ffffff', '#d85a14'], 22);
      else quebra(t, COR_PEDRA, 22);
    }
  }
};
// ---------- laço ----------
const passo = (agora) => {
  raf = requestAnimationFrame(passo);
  const dt = Math.min(0.034, (agora - t0) / 1000 || 0); t0 = agora;
  if (estado !== 'fim') {
    if (estado === 'jogando') { usado += dt; if (++cont % 120 === 0) gravaUso(); }
    if (usado >= LIMITE || !janela()) { motivo = usado >= LIMITE ? 'Acabaram seus 8 minutos de hoje.' : 'O pause pro café acabou.'; estado = 'fim'; fimEm = agora; gravaUso(); }
  } else if (agora - fimEm > 3200) { fecha(); return; }
  if (estado === 'portal') passoPortal(dt);
  if (estado === 'jogando') {
    vel = Math.min(1040 + 80 * fase, vel + (14 + 3 * fase) * dt);
    acel += (alvoAcel - acel) * Math.min(1, 4 * dt); const v = vel * acel; player.x = 90 + (acel - 1) * 90; // acelerar: o cachorro corre mais e avança na tela; frear: recua
    dist += v * dt / 14;
    chaoX = (chaoX - v * dt) % CHAO_W; matoX = (matoX - v * dt * 0.6) % MATO_P; arvAnda(v, dt); arvNasce(dt); decoX = (decoX - v * dt * 0.8) % DECO_P;
    player.vy += GRAV * dt; player.y += player.vy * dt;
    const solo = chaoY() - player.h;
    if (player.y >= solo) { if (!player.noChao && player.vy > 250) { sopra(player.x + 25, chaoY() + 2, 4, 1.2); sopra(player.x + 85, chaoY() + 2, 3, 0.8); } player.y = solo; player.vy = 0; player.noChao = true; }
    if (player.noChao && !obst.some((o) => o.treno && o.montado)) { poeiraEm -= dt; if (poeiraEm <= 0) { poeiraEm = 0.1; sopra(player.x + 24, chaoY() + 2, 1, 1); } }
    atualizaPoeira(dt, v); nevePegas(dt, v);
    prox -= v * dt;
    const alvo = PORTAL_PTS * (fase + 1);
    if (!portal && dist >= alvo) { // hora do portal: ele entra depois da última pedra, sem pedras novas na frente
      const ult = obst.reduce((m, o) => Math.max(m, o.x + o.w), 0);
      const ph = portalAlt();
      portal = { x: Math.max(W + 40, ult + 280), w: ph * PORT_W / PORT_H, h: ph };
    }
    if (prox <= 0 && !portal) { prox = novoObst() + vel * Math.max(0.5, 0.85 - 0.08 * fase + Math.random() * 0.8) + 120; }
    if (portal) {
      portal.x -= v * dt;
      if (portal.x + portal.w / 2 <= player.x + player.w * 0.85) { estado = 'portal'; tPortal = 0; viraFeito = false; fasePt = vel; }
    }
    obst.forEach((o) => { o.x -= (v - (o.vs || 0)) * dt; if (!o.cor && o.x + o.w / 2 < player.x + player.w / 2) o.cor = true; }); // pedra que o cachorro já pulou fica colorida
    if (ave && !ave.rock) { ave.x -= v * dt; if (ave.x < -140) { ave = null; aveEm = 20 + Math.random() * 20; } } // anda junto com o chão
    obst = obst.filter((o) => o.x + o.w > -10 && !(o.treno && o.x > W + 220) && !o.sumiu);
    if (ave && ave.rock && !obst.includes(ave.rock)) { ave = null; aveEm = 20 + Math.random() * 20; } // a pedra saiu da tela: o passarinho vai embora com ela
    // colisão (caixa da nuvem um pouco menor que o desenho)
    const a = { x: player.x + 18, y: player.y + 8, w: player.w - 40, h: player.h - 12 };
    trenoPasso(a, v, dt);
    if (invul > 0) invul -= dt;
    if (curaT > 0) curaT -= dt;
    for (const o of obst) if (o.fantasma && !o.boneco) { if (o.flashT === undefined && o.x - (player.x + player.w) < 340 && o.x > player.x) o.flashT = 0.4; else if (o.flashT > 0) o.flashT -= dt; } // relâmpago: pouco antes do fantasma chegar, clareia e mostra o que está debaixo do lençol
    voam.forEach((h) => { h.t += dt; }); voam = voam.filter((h) => h.t < 1.8);
    for (const o of obst) {
      if (o.moita) { // o cachorro passando pela moita: folhinhas voam e ficam para trás
        const dentro = a.x + a.w > o.x + 8 && a.x < o.x + o.w - 8 && a.y + a.h > chaoY() - o.h + 8;
        if (dentro && !o.roca && !o.vidaDada && vidas < 3 && estado === 'jogando') { o.vidaDada = true; vidas++; curaT = 1.2; voam.push({ x: player.x + player.w * 0.55, y: player.y + 4, t: 0, f: Math.random() * 6.28 }); for (let q = 0; q < (o.fantasma ? 0 : 10); q++) folhas.push({ x: a.x + a.w * Math.random(), y: a.y + a.h * (0.2 + Math.random() * 0.5), vx: -20 - Math.random() * 60, vy: -80 - Math.random() * 90, t: 0, vida: 0.7 + Math.random() * 0.5, c: Math.floor(Math.random() * FOLHA_COR.length), r: Math.random() < 0.4 ? 4 : 3 }); } // moita vazia: recupera uma vida
        if (dentro && !o.fantasma) { o.folhaT = (o.folhaT || 0) - dt; if (o.folhaT <= 0) { o.folhaT = 0.045; for (let q = 0; q < 2; q++) folhas.push({ x: a.x + a.w * (0.2 + Math.random() * 0.6), y: a.y + a.h * (0.3 + Math.random() * 0.6), vx: -30 - Math.random() * 90, vy: -80 - Math.random() * 90, t: 0, vida: 0.7 + Math.random() * 0.5, c: Math.floor(Math.random() * FOLHA_COR.length), r: Math.random() < 0.4 ? 4 : 3 }); } }
      }
      if (o.batida || o.treno || (o.moita && !o.roca)) continue; // moita sem pedra: o cachorro atravessa
      // buraco: só pega quem está com as patas no chão em cima dele (pulando alto, passa)
      const rk = o.moita ? o.roca : null; // moita com pedra: só a pedra escondida machuca
      const b = o.buraco ? { x: o.x + 12, y: chaoY() - 14, w: o.w - 24, h: 24 } : rk ? { x: o.x + (o.w - rk.w) / 2 + rk.w * 0.14, y: chaoY() - rk.h + AFUNDA + rk.h * 0.2, w: rk.w * 0.72, h: rk.h * 0.8 } : { x: o.x + o.w * 0.14, y: chaoY() - o.h + AFUNDA + (o.baixo || 0) + o.h * 0.2, w: o.w * 0.72, h: o.h * 0.8 };
      const ax = o.buraco ? a.x + 14 : a.x, aw = o.buraco ? a.w - 28 : a.w;
      if (ax < b.x + b.w && ax + aw > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        if (invul > 0) continue;
        vidas--; o.batida = true;
        if (vidas > 0) { invul = 1.6; continue; } // perdeu uma vida, mas segue: pisca um pouco e fica mais cinza
        estado = 'morto'; morreuEm = performance.now();
        const pts = Math.floor(dist);
        if (pts > recorde) { recorde = pts; try { localStorage.setItem(CH, String(recorde)); } catch (e) { /* segue */ } }
        break;
      }
    }
  }
  if (estado === 'portal') { if (ave && !ave.rock) ave.x -= vel * dt; chaoX = (chaoX - vel * dt) % CHAO_W; matoX = (matoX - vel * dt * 0.6) % MATO_P; arvAnda(vel, dt); decoX = (decoX - vel * dt * 0.8) % DECO_P; }
  if (avisoFase > 0) avisoFase -= dt;
  chPasso(dt);
  if (estado === 'jogando' || estado === 'portal') {
    if (!ave) { aveEm -= dt; if (aveEm <= 0) { if (!aveModo) aveModo = Math.random() < 0.5 ? 'pedra' : 'chao'; if (aveModo === 'chao' && !obst.some((o) => o.x + o.w > W - 40 && o.x < W + 60 + AVE_W + 70)) { ave = { x: W + 60, sp: sorteiaAve() }; aveModo = null; } } } // passarinho: ou de pé no chão, ou em cima da próxima pedra
    if (!mor && noite && progFase() < 0.55) { morEm -= dt; if (morEm <= 0) { const peq = Math.random() < 0.4; mor = { x: W + 60, y0: H * (0.08 + Math.random() * 0.3), u: peq ? 0.9 : 1.6, v: (peq ? 130 : 95) + Math.random() * 40, t: 0, f: Math.random() * 6 }; } } // morcego: médio (60%) ou pequeno (40%)
    else if (mor) { mor.x -= mor.v * dt; mor.t += dt; if (mor.x < -110) { mor = null; morEm = 8 + Math.random() * 10; } }
    if (!balao) { balaoEm -= dt; if (balaoEm <= 0) novoBalao(); }
    else {
      balao.x += balao.vx * dt; balao.y += balao.vy * dt;
      if (balao.x + balao.w < -20 || balao.y + balao.h < -20) { balao = null; balaoEm = 14 + Math.random() * 16; }
    }
  }
  if (estado !== 'morto' && estado !== 'fim') {
    nuvensF.forEach((n) => { n.x -= n.v * dt * (estado === 'jogando' ? 1 + vel / 600 : 1); });
    nuvensF = nuvensF.filter((n) => n.x + n.w > -10);
    const ult = nuvensF.reduce((m, n) => Math.max(m, n.x + n.w), 0);
    if (ult < W + 120) nuvensF.push(novaNuvem(Math.max(W + 30, ult) + 150 + Math.random() * 450));
  }
  neveAnda(dt); desenha();
};
const pts5 = (n) => String(Math.floor(n)).padStart(5, '0');
// ---------- cenário ao fundo: cerquinha, banco, tufos de grama e passarinho (tudo desenhado em código) ----------
const DECO_P = 1180;
const ASA = [['x.......x', '.x.....x.', '..xxxxx..', '.........'], ['.........', '..xxxxx..', '.x.....x.', 'x.......x']];
const cor = (dia, noiteC) => (noite ? noiteC : dia);
const cerca = (x, yb) => {
  const u = 4;
  cx.fillStyle = cor('#b9ae98', '#6b7a90'); cx.fillRect(x, yb - 4.5 * u, 7 * 16 - 4, u); cx.fillRect(x, yb - 2 * u, 7 * 16 - 4, u);
  for (let i = 0; i < 7; i++) {
    const px = x + i * 16;
    cx.fillStyle = cor('#f6f3ea', '#c3ccd9'); cx.fillRect(px, yb - 6 * u, 3 * u, 6 * u); cx.fillRect(px + u, yb - 7 * u, u, u);
    cx.fillStyle = cor('#cfc7b5', '#8795aa'); cx.fillRect(px + 2 * u, yb - 6 * u, u, 6 * u);
  }
};
const banco = (x, yb) => {
  const u = 4;
  cx.fillStyle = cor('#5d4038', '#6b7a90'); cx.fillRect(x + 2 * u, yb - 3 * u, u, 3 * u); cx.fillRect(x + 11 * u, yb - 3 * u, u, 3 * u); cx.fillRect(x + 2 * u, yb - 7 * u, u, 4 * u);
  cx.fillStyle = cor('#8a5a3c', '#c3ccd9'); cx.fillRect(x, yb - 4 * u, 14 * u, u + 2); cx.fillRect(x + u, yb - 7 * u, 12 * u, u);
};
const tufo = (x, yb, k) => {
  const t = performance.now();
  for (let j = 0; j < 3; j++) {
    const alt = (j === 1 ? 7 : 5) * 3, s = Math.sin(t / 520 + k * 1.7 + j), sw = s > 0.35 ? 3 : (s < -0.35 ? -3 : 0);
    cx.fillStyle = cor(j === 1 ? '#3f9a39' : '#5fbf4a', j === 1 ? '#e3e9f2' : '#b4bfce');
    cx.fillRect(x + j * 5, yb - alt / 2, 4, alt / 2); cx.fillRect(x + j * 5 + sw, yb - alt, 4, alt / 2);
  }
};
const passaro = (a) => {
  const u = 4, m = ASA[Math.floor(a.t * 5) % 2];
  cx.fillStyle = cor('#2f3d4d', '#e3e9f2');
  m.forEach((lin, r) => { for (let c = 0; c < lin.length; c++) if (lin[c] === 'x') cx.fillRect(Math.round(a.x + c * u), Math.round(a.y + r * u), u, u); });
};
// ---------- estrelas do céu da noite: espalhadas, de tamanhos bem variados, com brilho lento ----------
const ESTRELAS = (() => { let a = 7; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; const tipos = ['ponto', 'ponto', 'ponto', 'ponto', 'mais', 'mais', 'losango', 'brilho']; const l = [];
  for (let i = 0; i < 34; i++) { const tp = i % 17 === 0 ? 'grande' : tipos[Math.floor(r() * tipos.length)]; l.push({ x: r(), y: r(), tp, c: tp === 'grande' ? 3 : (tp === 'ponto' ? 1 + Math.floor(r() * 2) : 2), vel: 0.35 + r() * 0.5, fase: r() * 6.28 }); } return l; })();
const desenhaLua = (cyChao) => { // a imagem da lua tem 4 px de halo em volta: por isso sobe 4 px (4 * q) para a lua continuar alinhada à guia
 // lua minguante: aparece à noite, anda devagar pelo céu e, com o amanhecer, desce e se esconde atrás do chão (e some na tempestade)
  const t = faixa(0.5, 0.92), v = 1 - (ch ? ch.k : 0), im = IM.lua; if (!noite || t >= 1 || v <= 0.02 || !im.complete || !im.naturalWidth) return;
  const q = 3.5, w = Math.round(im.naturalWidth * q), h = Math.round(im.naturalHeight * q), p = Math.max(0, Math.min(1, progFase())), y0 = 24, desce = (cyChao - y0 + 6) * t * t * (3 - 2 * t); // desce suave até passar da linha do chão
  cx.save(); cx.beginPath(); cx.rect(0, 0, W, cyChao); cx.clip(); // o chão esconde a parte de baixo
  if (espelho) { cx.translate(W, 0); cx.scale(-1, 1); } cx.imageSmoothingEnabled = false; cx.globalAlpha = 0.96 * v * (1 - 0.5 * t);
  cx.drawImage(im, Math.round(W * (0.78 - 0.35 * p) - w / 2), Math.round(y0 + desce - 4 * q), w, h); cx.restore(); };
const desenhaEstrelas = (cyChao) => {
  if (!noite) return;
  desenhaLua(cyChao);
  const some = (1 - faixa(0.55, 0.85)) * (1 - 0.8 * (ch ? ch.k : 0)); if (some <= 0.02) return;
  const t = performance.now() / 1000, topo = 30, base = Math.max(topo + 20, cyChao - 70);
  ESTRELAS.forEach((e) => {
    const b = 0.5 + 0.5 * Math.sin(t * e.vel + e.fase); // um ciclo leva de 7 a 18 segundos
    const a = (0.3 + 0.7 * b) * some; if (a < 0.05) return;
    const x = Math.round(e.x * (W - 20) + 10), y = Math.round(topo + e.y * (base - topo)), c = e.c;
    cx.globalAlpha = a; cx.fillStyle = '#f4f7ff';
    const q = (dx, dy) => cx.fillRect(x + dx * c, y + dy * c, c, c);
    if (e.tp === 'ponto') q(0, 0);
    else if (e.tp === 'mais') { q(0, 0); q(-1, 0); q(1, 0); q(0, -1); q(0, 1); }
    else if (e.tp === 'losango') { q(0, -1); q(-1, 0); q(1, 0); q(0, 1); }
    else { q(0, 0); q(-1, 0); q(1, 0); q(0, -1); q(0, 1); if (b > 0.55) { q(-2, 0); q(2, 0); q(0, -2); q(0, 2); } if (e.tp === 'grande' && b > 0.8) { q(-3, 0); q(3, 0); q(0, -3); q(0, 3); } }
  });
  cx.globalAlpha = 1;
};
// coração de 7x7 quadradinhos, desenhado célula por célula (nítido em qualquer tela)
const CORACAO = ['.##.##.', '#WR#Rd#', '#RRRRd#', '#RRRRd#', '.#RRd#.', '..#d#..', '...#...'];
const COR_CHEIO = { '#': '#000', W: '#fff', R: '#e00024', d: '#b40200' }, COR_VAZIO = { '#': '#000', W: '#fff', R: '#d9d9d9', d: '#b3b3b3' };
const desenhaCoracao = (x, y, c, cheio) => { // cada quadradinho ocupa um número inteiro de pixels da tela (em qualquer zoom), para os dois lados ficarem iguais
  const p = cheio ? COR_CHEIO : COR_VAZIO, cd = Math.max(2, Math.round(c * dpr)), x0 = Math.round(x * dpr), y0 = Math.round(y * dpr);
  CORACAO.forEach((lin, j) => { for (let i = 0; i < 7; i++) { const ch = lin[i]; if (ch === '.') continue; cx.fillStyle = p[ch]; cx.fillRect((x0 + i * cd) / dpr, (y0 + j * cd) / dpr, cd / dpr, cd / dpr); } });
};
const desenha = () => {
  if (!W) return;
  cx.clearRect(0, 0, W, H);
  if (noite) { const c = ceuCores(progFase()); if (c) { const g = cx.createLinearGradient(0, 0, 0, chaoY()); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); cx.fillStyle = g; cx.fillRect(0, 0, W, H); } }
  const cy = chaoY();
  cx.save();
  if (espelho) { cx.translate(W, 0); cx.scale(-1, 1); } // fases ímpares: tudo espelhado, o cachorro corre da direita para a esquerda
  desenhaEstrelas(cy);
  chFundo(); // raio e chuvisco bem ao fundo, atrás das nuvens e das moitas
  // nuvenzinhas ao fundo
  cx.save(); cx.globalAlpha = 0.8;
  nuvensF.slice().sort((a, b) => b.w - a.w).forEach((n) => { dCor(IM.nuvem, faixa(0, 0.35), n.x, n.y, n.w, n.w * 107.2 / 171); if (ch && ch.k > 0.01) { const nt = nuvemTemp(); if (nt) { const g0 = cx.globalAlpha; cx.globalAlpha = g0 * ch.k; cx.drawImage(nt, n.x, n.y, n.w, n.w * 107.2 / 171); cx.globalAlpha = g0; } } }); // maiores atrás; na tempestade viram cinza escuro
  cx.restore();
  // chão
  // balão: atrás das moitas e do chão
  if (balao) {
    cx.save(); cx.globalAlpha = balao.a;
    const bx = espelho ? W - balao.x - balao.w : balao.x; // posição na tela vira posição do mundo espelhado
    if (espelho) { cx.translate(bx + balao.w / 2, 0); cx.scale(-1, 1); cx.translate(-(bx + balao.w / 2), 0); }
    dCor(IM.balao, faixa(0.15, 0.5), bx, balao.y, balao.w, balao.h);
    cx.restore();
  }
  /* morcego sempre na frente do balão (que está mais longe) */ if (mor) { const fr = IM.mor[Math.floor(mor.t / 0.08) % 4]; if (fr.complete && fr.naturalWidth) { const w = fr.naturalWidth * mor.u, h = fr.naturalHeight * mor.u; cx.drawImage(fr, Math.round(mor.x), Math.round(mor.y0 + Math.sin(mor.t * 2.2 + mor.f) * 14), w, h); } } // morcego batendo asa (4 quadros)
  // árvore ao fundo, metade escondida atrás da moita (cor muda a cada fase: rosa, azul claro, verde)
  if (arvO && arvO.tipo === 'fundo') { const ai = IM.arv[arvO.v], [aw, ah] = arvTam('fundo'); if (ai && ai.complete && ai.naturalWidth) dCor(ai, faixa(0.35, 0.7), Math.round(arvO.x), Math.round(cy + 4 - ah), aw, ah); }
  // moitas ao fundo (andam mais devagar que o chão)
  for (let x = matoX - MATO_P; x < W + MATO_W; x += MATO_P) dCor(IM.mato, faixa(0.35, 0.7), x, cy - MATO_H + 4, MATO_W, MATO_H);
  for (let x = chaoX - CHAO_W; x < W; x += CHAO_W) dCor(IM.chao, faixa(0.55, 0.9), Math.round(x), cy, CHAO_W + 1, CHAO_H);
  nevePegasDesenha(); // pegadas do cachorro na neve
  // árvore em pé na grama, na frente das moitas
  if (arvO && arvO.tipo === 'chao') { const ai = IM.arv[arvO.v], [aw, ah] = arvTam('chao'); if (ai && ai.complete && ai.naturalWidth) { if (arvO.cor) cx.drawImage(ai, Math.round(arvO.x), Math.round(cy + 2 - ah), aw, ah); else dCor(ai, faixa(0.55, 0.9), Math.round(arvO.x), Math.round(cy + 2 - ah), aw, ah); } }
  const piaAve = () => { const im = ave && (ave.sp || IM.ave); if (!(im && im.complete && im.naturalWidth)) return; const u = 2, w = im.naturalWidth * u, h = im.naturalHeight * u; const r = ave.rock; const ax = r ? r.x + r.w / 2 - w / 2 : ave.x, ay = r ? cy - r.h + AFUNDA + (r.baixo || 0) + 3 - h : cy + 5 - h; cx.save(); cx.translate(Math.round(ax) + w, Math.round(ay)); cx.scale(-1, 1); cx.drawImage(im, 0, 0, w, h); cx.restore(); }; // olhando para o cachorro
  if (ave && !ave.rock) piaAve();
  // pedras
  obst.forEach((o) => o.moita ? (o.roca && !o.fantasma && cx.drawImage(o.cor ? IM.pedra : S(IM.pedra), o.x + (o.w - o.roca.w) / 2, cy - o.roca.h + AFUNDA, o.roca.w, o.roca.h)) : o.buraco ? desenhaBuraco(o, cy)   : o.treno ? cx.drawImage(o.cor ? IM.treno : S(IM.treno), Math.round(o.x), Math.round(cy - o.h + AFUNDA), o.w, o.h) : cx.drawImage(o.terra ? (o.cor ? IM.terra : S(IM.terra)) : o.cone ? (o.cor ? IM.cone : S(IM.cone)) : (o.cor ? IM.pedra : S(IM.pedra)), o.x, cy - o.h + AFUNDA + (o.baixo || 0), o.w, o.h));
  if (ave && ave.rock) piaAve();
  // fumaça da largada (atrás do cachorro) e poeirinha nas patas
  if (burst && IM.fumaca.complete && IM.fumaca.naturalWidth) { const f = BURST_ORD[Math.min(BURST_ORD.length - 1, Math.floor(burst.t / BURST_DT))], w = BURST_W * BURST_ESC, h = BURST_H * BURST_ESC; cx.save(); if (noite) cx.globalAlpha = 0.9; cx.drawImage(IM.fumaca, (f % 6) * BURST_W, Math.floor(f / 6) * BURST_H, BURST_W, BURST_H, Math.round(burst.x - w / 2), Math.round(burst.y - h / 2), w, h); cx.restore(); }
  poeira.forEach((p) => { const u = p.t / p.vida, r = p.r * (1 + u * 0.9), a = 1 - u * u; cx.globalAlpha = a; cx.fillStyle = escuro() ? '#7f8da3' : '#d7d7d7'; cx.beginPath(); cx.arc(Math.round(p.x) + 1, Math.round(p.y) + 1, r, 0, 6.2832); cx.fill(); cx.fillStyle = noite ? '#dfe5ee' : '#ffffff'; cx.beginPath(); cx.arc(Math.round(p.x), Math.round(p.y), r, 0, 6.2832); cx.fill(); cx.globalAlpha = 1; });
  // gatinho (inclina no ar e quica correndo)
  cx.save();
  const sx = player.x + player.w / 2, sy = player.y + player.h / 2;
  // cachorro: 6 quadros do GIF (agacha, impulso, sobe esticando, pico, voo, aterrissa)
  const corre = (player.noChao && estado === 'jogando' && !obst.some((o) => o.treno && o.montado)); // dentro do trenó o cachorro fica parado
  const q = corre ? Math.floor(dist / PASSO) % 6 : 0;
  const pose = player.noChao ? IM['cao' + (q + 1)] : IM.cao5; // no pulo: quadro do voo esticado
  const queda = AFUNDA - 2; // pés um pouco dentro da grama
  cx.translate(sx, sy + queda); if (!player.noChao) cx.rotate(Math.max(-0.12, Math.min(0.12, player.vy / 6500)));
  let esc = 1, alfa = 1;
  if (estado === 'portal') {
    if (tPortal < T_SUGA) { const u = Math.min(1, tPortal / T_SUGA); esc = 1 - u; alfa = 1 - u * 0.4; if (portal) cx.translate((portal.x + portal.w / 2 - sx) * u * 0.9, 0); }
    else if (tPortal < T_SUGA + T_VIRA) esc = 0;
    else esc = Math.min(1, (tPortal - T_SUGA - T_VIRA) / T_SOLTA);
  }
  if (esc > 0.01) {
    cx.scale(esc, esc);
    if (invul > 0 && Math.floor(invul * 10) % 2 === 0) alfa *= 0.35; // pisca enquanto está protegido
    const cor = vidas >= 3 ? 1 : (vidas === 2 ? 0.6 : (vidas === 1 ? 0.22 : 0)); // cada vida perdida tira cor
    cx.globalAlpha = alfa;
    if (cor >= 1) cx.drawImage(pose, -player.w / 2, -player.h / 2, player.w, player.h);
    else { cx.drawImage(mono(pose, 0), -player.w / 2, -player.h / 2, player.w, player.h); if (cor > 0.01) { cx.globalAlpha = alfa * cor; cx.drawImage(pose, -player.w / 2, -player.h / 2, player.w, player.h); } }
  }
  cx.restore();
  // moitas do chão: ficam na frente do cachorro, que passa por dentro delas
  const SIL = '#0b0f16', silDe = (im, w, h, olho) => { const k = im.src + w + h + olho; silDe.c = silDe.c || {}; if (silDe.c[k]) return silDe.c[k]; const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, w, h); g.globalCompositeOperation = 'source-atop'; g.fillStyle = SIL; g.fillRect(0, 0, w, h); if (olho) { g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 0, Math.round(w * 13 / 33), Math.round(h * 15 / 31)); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#fff'; g.fillRect(Math.round(w * 17 / 33), Math.round(h * 12 / 31), Math.round(w * 3 / 33), Math.round(h * 3 / 31)); } return (silDe.c[k] = c); };
  obst.forEach((o) => { // relâmpago do fantasma: dois clarões rápidos que mostram a silhueta da pedra e do passarinho escondidos
    if (!o.fantasma || o.boneco) return; if (!(o.flashT > 0)) { o.piscando = false; return; } const u = 0.4 - o.flashT; o.piscando = u < 0.09 || (u > 0.15 && u < 0.36); if (!o.piscando) return;
    cx.globalAlpha = 0.24; cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); cx.globalAlpha = 1;
    if (!o.roca) return; const r = o.roca, rx = o.x + (o.w - r.w) / 2, ry = cy - r.h + AFUNDA;
    if (IM.pedra.complete && IM.pedra.naturalWidth) cx.drawImage(silDe(IM.pedra, Math.round(r.w), Math.round(r.h), false), Math.round(rx), Math.round(ry));
    const im = IM.ave; if (im.complete && im.naturalWidth) { const u2 = 2, w = im.naturalWidth * u2, h = im.naturalHeight * u2; cx.save(); cx.translate(Math.round(o.x + o.w / 2 - w / 2) + w, Math.round(ry + 3 - h)); cx.scale(-1, 1); cx.drawImage(silDe(im, w, h, true), 0, 0); cx.restore(); }
  });
  obst.forEach((o) => { const mi = o.fantasma ? (o.boneco ? IM.boneco : IM.fantasma) : IM.moita; if (o.fantasma && o.piscando) cx.globalAlpha = 0.16; if (o.moita && mi.complete && mi.naturalWidth) cx.drawImage(o.cor ? mi : S(mi), Math.round(o.x), Math.round(cy - o.h + AFUNDA), Math.round(o.w), Math.round(o.h)); cx.globalAlpha = 1; });
  voam.forEach((h) => { const e = h.t / 1.8, ang = h.f + h.t * 7, raio = 6 + 20 * e; cx.globalAlpha = Math.min(1, (1 - e) * 2.2); desenhaCoracao(h.x + Math.cos(ang) * raio - 10, h.y - h.t * 62 + Math.sin(ang) * raio * 0.35, 2, true); cx.globalAlpha = 1; }); // coração subindo em espiral
  folhas.forEach((f) => { cx.globalAlpha = Math.min(1, (f.vida - f.t) * 3); cx.fillStyle = f.k || FOLHA_COR[f.c]; cx.fillRect(Math.round(f.x), Math.round(f.y), f.r, f.r); cx.globalAlpha = 1; });
  // portal (10 quadros do GIF, 10 por segundo)
  if (portal) {
    let a = 1;
    if (estado === 'portal' && tPortal >= T_SUGA + T_VIRA + T_SOLTA * 0.4) a = Math.max(0, 1 - (tPortal - T_SUGA - T_VIRA - T_SOLTA * 0.4) / (T_SOLTA * 0.6));
    cx.save(); cx.globalAlpha = a;
    cx.drawImage(S(IM.portal), (Math.floor(performance.now() / 100) % PORT_N) * PORT_W, 0, PORT_W, PORT_H, portal.x, cy + AFUNDA - portal.h, portal.w, portal.h);
    cx.restore();
  }
  cx.restore(); // fim da parte espelhada; placar e textos ficam sempre na posição normal
  if (estado === 'portal') { // clarão azul na hora da virada
    const d = Math.abs(tPortal - T_SUGA - T_VIRA / 2) / (T_VIRA / 2 + 0.15);
    if (d < 1) { cx.fillStyle = (escuro() ? 'rgba(154,165,181,' : 'rgba(35,62,246,') + (0.85 * (1 - d)).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
  }
  if (avisoFase > 0 && estado !== 'portal') {
    cx.globalAlpha = Math.min(1, avisoFase); cx.fillStyle = TINTA(); cx.textAlign = 'center'; cx.font = '700 18px system-ui, sans-serif';
    cx.fillText('Fase ' + (fase + 1) + ' · agora é ' + (espelho ? 'da direita para a esquerda' : 'da esquerda para a direita'), W / 2, Math.max(24, H * 0.34));
    cx.globalAlpha = 1;
  }
  neveDesenha(); chDesenha(); // chuva e raios por cima do cenário, abaixo do placar
  // bolinhas: quanto falta para o próximo portal (cada bolinha = 10% do caminho)
  { const prog = Math.max(0, Math.min(1, (dist - PORTAL_PTS * fase) / PORTAL_PTS)), cheias = Math.floor(prog * 10 + 1e-6);
    for (let i = 0; i < 10; i++) {
      const bx = W - 24 - (9 - i) * 16, by = H - 14;
      cx.beginPath(); cx.arc(bx, by, 4, 0, Math.PI * 2);
      cx.fillStyle = i < cheias ? (escuro() ? '#e3e9f2' : '#fff') : (escuro() ? '#3a4658' : 'rgba(255,255,255,.35)'); cx.fill();
    } }
  // barrinha de velocidade (frear ◀ / acelerar ▶): moldura escura e listras na diagonal
  { const bx = 16, by = Math.round(chaoY() + 33), bw = 84, bh = 12, nivel = Math.max(0, Math.min(1, (acel - 0.6) / 0.85));
    cx.fillStyle = TINTA(); cx.fillRect(bx, by, bw, bh); cx.fillStyle = escuro() ? NOITE_FUNDO : '#ffffff'; cx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    cx.save(); cx.beginPath(); cx.rect(bx + 3, by + 3, (bw - 6) * nivel, bh - 6); cx.clip(); cx.fillStyle = TINTA();
    for (let x = bx - bh; x < bx + bw; x += 6) { cx.beginPath(); cx.moveTo(x, by + bh); cx.lineTo(x + 3, by + bh); cx.lineTo(x + 3 + bh, by); cx.lineTo(x + bh, by); cx.fill(); }
    cx.restore(); }
  // placar
  cx.fillStyle = TINTA(); cx.font = '600 15px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'right';
  cx.fillText('HI ' + pts5(recorde) + '   ' + pts5(dist), W - 58, 30);
  if (estado !== 'fim') { cx.fillStyle = TINTA2(); cx.font = '600 13px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'left'; cx.fillText('restam ' + mmss(LIMITE - usado), 16, 28); }
  if (estado !== 'fim') { // vidas: 3 corações
    for (let i = 0; i < 3; i++) { const pulsa = curaT > 0 && i === vidas - 1 && Math.floor(curaT * 8) % 2 === 0; desenhaCoracao(16 + i * 26 - (pulsa ? 2 : 0), 40 - (pulsa ? 2 : 0), pulsa ? 4 : 3, i < vidas); }
  }
  if (estado === 'fim') {
    cx.fillStyle = 'rgba(16,37,50,.72)'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = '700 20px system-ui, sans-serif'; cx.fillText(motivo, W / 2, H / 2 - 6);
    cx.font = '600 15px system-ui, sans-serif'; cx.fillText('Volta ao trabalho!', W / 2, H / 2 + 22);
  }
  if (estado === 'pronto') pixTexto('', W / 2, H * 0.53, Math.max(1.3, Math.min(1.8, W / 500)));
  if (estado === 'morto') {
    const w = Math.min(165, W * 0.3), h = w * 15.5 / 31;
    cx.drawImage(S(IM.fim), (W - w) / 2, Math.max(16, (cy - h) / 2 + 10), w, h);
    pixTexto('', W / 2, Math.max(16, (cy - h) / 2 + 10) + h + 16 + 15 * 0.9, 0.9);
  }
};

// ---------- abrir e fechar ----------
// terça-feira é o dia da bolha e quarta o do cãozinho; ?bolha e ?cao forçam um deles
const jogoDoParam = () => { const m = /[?&]cafe=([a-z]+)/i.exec(location.search); const v = m && m[1].toLowerCase(); return v === 'bolha' ? 'bolha' : (v === 'dog' || v === 'cao') ? 'cao' : null; }; // ?cafe=dog ou ?cafe=bolha escolhe o jogo
const jogoDoDia = () => jogoDoParam() || (/[?&]bolha(=|&|$)/.test(location.search) ? 'bolha' : /[?&]cao(=|&|$)/.test(location.search) ? 'cao' : LIBERADO ? 'cao' : ({ 2: 'bolha', 3: 'cao' })[new Date().getDay()] || 'cao');
// trava a página no topo enquanto o jogo está aberto (setas, espaço, roda do mouse e dedo não rolam a tela)
const SCROLL_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
let travado = false;
const semRolar = (e) => { if (travado && e.cancelable) e.preventDefault(); };
const semRolarTecla = (e) => { if (travado && SCROLL_KEYS.includes(e.key) && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || '')) e.preventDefault(); };
window.cpTrava = (on) => {
  if (on === travado) return; travado = on;
  const h = document.documentElement, b = document.body;
  if (on) { h.scrollTop = 0; b.scrollTop = 0; window.scrollTo(0, 0); document.querySelectorAll('.cp-main, .cp-app').forEach((el) => { el.scrollTop = 0; }); h.style.overflow = 'hidden'; b.style.overflow = 'hidden'; }
  else { h.style.overflow = ''; b.style.overflow = ''; }
};
window.addEventListener('wheel', semRolar, { passive: false });
window.addEventListener('touchmove', semRolar, { passive: false });
window.addEventListener('keydown', semRolarTecla, true);
const abre = () => {
  if (aberto) return;
  if (jogoDoDia() === 'bolha' && window.cpBolha) { window.cpBolha.abre(); return; }
  if (!janela()) { avisa('O joguinho só abre no pause pro café: nas horas pares, nos primeiros 15 minutos.'); return; }
  usado = leUso();
  if (usado >= LIMITE) { avisa('Seus 8 minutos de jogo de hoje já acabaram. Volte amanhã!'); return; }
  aberto = true; window.cpTrava(true); box.hidden = false; mede(); reinicia(); estado = 'pronto'; dica.classList.remove('off');
  requestAnimationFrame(() => box.classList.add('on'));
  t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(passo);
  box.focus({ preventScroll: true });
};
const fecha = () => {
  if (!aberto) return;
  aberto = false; window.cpTrava(false); box.classList.remove('on'); cancelAnimationFrame(raf); gravaUso();
  setTimeout(() => { if (!aberto) box.hidden = true; }, 260);
};
window.cpJogo = { abre, fecha };
fechar.addEventListener('click', (e) => { e.stopPropagation(); fecha(); });
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); pula(); });
window.addEventListener('resize', () => { if (aberto) { mede(); } });

// ---------- teclado: pular, sair e código Konami ----------
const KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let pos = 0;
document.addEventListener('keydown', (e) => { if (!box.hidden && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'v' || e.key === 'V')) { neve = !neve; neveT = 0; neveAtualiza(); } });
document.addEventListener('keydown', (e) => { if (!box.hidden && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N')) { noite = !noite; if (!noite) mor = null; aplicaTema(); } });
document.addEventListener('keyup', (e) => { if (aberto && ['ArrowRight', 'ArrowLeft', 'd', 'D', 'a', 'A'].includes(e.key)) alvoAcel = 1; });
document.addEventListener('keydown', (e) => {
  if (aberto) {
    if (e.key === 'Escape') { e.preventDefault(); fecha(); return; }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); alvoAcel = 1.45; return; }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); alvoAcel = 0.6; return; }
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); if (!e.repeat) pula(); }
    return;
  }
  const t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { pos = 0; return; }
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (k === KON[pos]) { pos++; if (pos === KON.length) { pos = 0; abre(); } } else pos = (k === KON[0]) ? 1 : 0;
});

// ---------- código no toque: deslizar ↑ ↑ ↓ ↓ ← → ← → e tocar 2 vezes ----------
const KT = ['U', 'U', 'D', 'D', 'L', 'R', 'L', 'R', 'T', 'T'];
let tp = 0, tUlt = 0, t0x = 0, t0y = 0, t0t = 0;
document.addEventListener('touchstart', (e) => { if (aberto || e.touches.length !== 1) return; t0x = e.touches[0].clientX; t0y = e.touches[0].clientY; t0t = Date.now(); }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (aberto || !e.changedTouches.length) return;
  const dx = e.changedTouches[0].clientX - t0x, dy = e.changedTouches[0].clientY - t0y, ax = Math.abs(dx), ay = Math.abs(dy), agora = Date.now();
  let g = null;
  if (ax < 12 && ay < 12 && agora - t0t < 350) g = 'T';
  else if (Math.max(ax, ay) >= 45) g = ax > ay ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U');
  if (!g) return;
  if (agora - tUlt > 6000) tp = 0;
  tUlt = agora;
  if (g === KT[tp]) { tp++; if (tp === KT.length) { tp = 0; abre(); } } else tp = (g === KT[0]) ? 1 : 0;
}, { passive: true });

// ---------- palavra no teclado: digitar "gato", "dog" ou "cao" ----------
let pal = '', palT = 0;
document.addEventListener('keydown', (e) => {
  if (aberto || e.key.length !== 1) return;
  const t = e.target, tag = t && t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
  const agora = Date.now(); if (agora - palT > 2500) pal = ''; palT = agora;
  pal = (pal + e.key.toLowerCase()).slice(-4); if (pal === 'gato' || pal.endsWith('dog') || pal.endsWith('cao')) { pal = ''; abre(); }
});

// ---------- 5 toques em "Hi, Jeff" ----------
if (nome) {
  let n = 0, ini = 0;
  nome.addEventListener('click', () => { const agora = Date.now(); if (agora - ini > 3000) n = 0; if (!n) ini = agora; n++; if (n >= 5) { n = 0; abre(); } });
}
})();
