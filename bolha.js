// Jogo da bolha (terça-feira): a bolha flutua e a pessoa toca perto dela para empurrar com o dedo.
// Se a bolha encostar nos espinhos da roseira em volta, ela estoura. Abre pelos mesmos gestos do jogo do cãozinho.
// Para testar: ?bolha (abre no dia que for) junto com ?cafe.
(() => {
const area = document.getElementById('cp-oi');
if (!area) return;
const V = window.PAINEL_VERSAO || '1';
const CT = 'cp-jogo-tempo', CR = 'cp-bolha-recorde', LIMITE = 8 * 60; // o tempo diário de 8 minutos é dividido com o jogo do cãozinho
const forca = /[?&](cafe|bolha)(=|&|$)/.test(location.search);
const janela = () => { const d = new Date(); return window.cpLiberado || forca || (d.getHours() % 2 === 0 && d.getMinutes() < 15); };
const hoje = () => new Date().toDateString();
const leUso = () => { if (forca) return 0; try { const o = JSON.parse(localStorage.getItem(CT) || '{}'); return o.dia === hoje() ? (+o.s || 0) : 0; } catch (e) { return 0; } };
let usado = 0;
const gravaUso = () => { try { localStorage.setItem(CT, JSON.stringify({ dia: hoje(), s: Math.round(usado) })); } catch (e) { /* segue */ } };
const mmss = (n) => { n = Math.max(0, Math.ceil(n)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
const pts5 = (n) => String(Math.floor(n)).padStart(5, '0');
const img = (src) => { const i = new Image(); i.src = src + '?v=' + V; return i; };
const IMfim = img('icones/game-over.svg');
let recorde = 0; try { recorde = +localStorage.getItem(CR) || 0; } catch (e) { /* sem recorde salvo */ }

// ---------- camada ----------
const box = document.createElement('div');
box.id = 'cp-bolha'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Jogo da bolha'); box.hidden = true; box.tabIndex = -1;
box.innerHTML = '<canvas></canvas><button type="button" class="jg-x" aria-label="Fechar o jogo" title="Fechar (Esc)"><img src="icones/fechar.svg?v=' + V + '" alt="" width="26" height="26"></button>';
area.append(box);
const cv = box.querySelector('canvas'), cx = cv.getContext('2d'), fechar = box.querySelector('.jg-x');
const aviso = document.createElement('div');
aviso.className = 'cp-jogo-aviso'; aviso.setAttribute('role', 'status'); aviso.hidden = true; area.append(aviso);
let avT = 0;
const avisa = (t) => { aviso.textContent = t; aviso.hidden = false; requestAnimationFrame(() => aviso.classList.add('on')); clearTimeout(avT); avT = setTimeout(() => { aviso.classList.remove('on'); setTimeout(() => { aviso.hidden = true; }, 300); }, 3600); };

let W = 0, H = 0, dpr = 1;
const ZONA = 30; // da borda até a ponta dos espinhos: a bolha estoura se passar daqui
const mede = () => {
  const r = area.getBoundingClientRect();
  dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.round(r.width); H = Math.round(r.height);
  cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.imageSmoothingEnabled = false;
  moldura();
};

// ---------- desenhos em pixel ----------
// bolha vetorizada da referência (24 x 24 quadradinhos): anel cinza e branco com reflexos em azul-água e rosa
const BU = 2, BN = 24;
const BOLHA = ['.........gWWWWg.........', '.......gg......WW.......', '.....gg..........WW.....', '....g.....CCCCW....W....', '...g...P...PPCCWWW..W...', '..g..........CCCCCW..W..', '..g..........PPCCCWW.g..', '.g.............PCCCW..W.', '.g..............PCCW..g.', 'g................PCWW..W', 'g................PCCW..W', 'W.................CCC..g', 'W.................PCC..g', 'W.................PC...g', 'W...P..............P...g', '.W..P..............P..g.', '.W..CP................g.', '..W.WCP...........C..g..', '..W..CWP.........CC..g..', '...g..WCPPg.....CP..g...', '....W..............g....', '.....Wg..........gg.....', '.......WgPg....gg.......', '.........WWWWgg.........'];
const BCOR = { g: '#6a6a6a', W: '#eaf2f2', C: '#52e4f2', P: '#f77ae9' };
const bolhaSpr = (() => {
  const c = document.createElement('canvas'); c.width = c.height = BN * BU; const g = c.getContext('2d');
  BOLHA.forEach((l, j) => [...l].forEach((ch, i) => { if (BCOR[ch]) { g.fillStyle = BCOR[ch]; g.fillRect(i * BU, j * BU, BU, BU); } }));
  return c;
})();
const BR = BN * BU / 2; // raio da bolha em pixels (24)
// dedinho que empurra (12 x 14 quadradinhos)
const DEDO = ['....KKKK....', '...KWWWWK...', '...KWWWWK...', '...KWWWWK...', '...KWWWWKKK.', '...KWWWWKWWK', '..KKWWWWKWWK', '.KSKWWWWWWWK', '.KSWWWWWWWWK', '.KSWWWWWWWWK', '..KSWWWWWWK.', '..KSWWWWWWK.', '...KSWWWWK..', '...KKKKKKK..'];
const dedoSpr = (() => {
  const u = 3, c = document.createElement('canvas'); c.width = 12 * u; c.height = DEDO.length * u; const g = c.getContext('2d');
  const cor = { K: '#2b3140', W: '#ffffff', S: '#c4cad6' };
  DEDO.forEach((l, j) => [...l].forEach((ch, i) => { if (cor[ch]) { g.fillStyle = cor[ch]; g.fillRect(i * u, j * u, u, u); } }));
  return c;
})();
// moldura de roseira em trechos trançados: um trecho com espinhos (estoura), outro só com o caule trançado (a bolha quica)
const SEG = 120, ZLISO = 20; // comprimento de cada trecho; distância da borda onde a bolha quica no trecho liso
const OFF = [0, 1, 1, 0]; // desencontro entre cima, baixo, esquerda e direita: onde um lado tem espinho, o oposto costuma ser liso
const trecho = (lado, pos) => (Math.floor(pos / SEG) + OFF[lado]) % 2 === 0; // este trecho da borda é o do caule com espinhos (senão é o trançado)
// espinhos: poucos, em lugares sorteados (1 ou 2 por trecho, nunca colados); a bolha só estoura perto de um deles
const esp = [[], [], [], []], rosas = [[], [], [], []];
const sorteio = (sem) => { let a = sem; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };
const sorteiaEspinhos = () => {
  [W, W, H, H].forEach((L, lado) => {
    const r = sorteio(91 + lado * 37 + Math.round(L)); esp[lado] = []; rosas[lado] = [];
    const off = (lado === 1 || lado === 2) ? (((L - 4) % 4) + 4) % 4 : 0, ajusta = (t) => Math.round((t - off) / 4) * 4 + off; // casa com a grade de 4 px de cada lado
    for (let s0 = 0; s0 < L; s0 += SEG) {
      if (!trecho(lado, s0)) continue;
      const n = r() < 0.55 ? 1 : 2, a = s0 + 22 + r() * (SEG - 44); const lista = [a];
      if (n === 2) { let b = s0 + 22 + r() * (SEG - 44); if (Math.abs(b - a) < 44) b = a + (a - s0 < SEG / 2 ? 48 : -48); lista.push(b); }
      lista.forEach((t) => { if (t > 26 && t < L - 26) esp[lado].push(ajusta(t)); });
    }
    const q = Math.max(1, Math.round(L / 400)), ini = lado === 0 ? 150 : 90, fim = L - (lado === 0 ? 260 : 90); // rosinhas: poucas por lado, longe dos cantos, do texto e dos espinhos
    for (let k = 0, tent = 0; k < q && tent < 60 && fim > ini; tent++) { const t = ini + r() * (fim - ini); if (esp[lado].some((e) => Math.abs(e - t) < 46) || rosas[lado].some((e) => Math.abs(e - t) < 160)) continue; rosas[lado].push(ajusta(t)); k++; }
  });
};
const espinho = (lado, pos) => esp[lado].some((t) => Math.abs(pos - (t + 2)) <= 17);
const ROSA = ["...RR.....", ".RRRWRRR..", ".RRWRRWWR.", ".RRWRRWWR.", "RRRWRRRRR.", "RRRRWRRRWR", ".RRRRWWWRR", "...RRRRRR.", ".G.RRR.RR.", ".GG.RR....", "GG........", "G.........", "G..GGG....", "G.GGG.....", "G.GG......"]; // rosa vetorizada (10 x 15 quadradinhos): R pétala, W brilho, G caule e folha
const COR_ROSA = { R: '#d3202f', W: '#f6dede', G: '#2f9a4a' };
let molduraC = null;
const moldura = () => {
  sorteiaEspinhos();
  const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
  const u = 4;
  const cima = (comp, lado) => {
    for (let p = 0; p < comp; p += u) {
      const canon = lado === 1 ? W - p - u : lado === 2 ? H - p - u : p; // posição "de verdade" ao longo da borda
      const n = p / u;
      if (trecho(lado, canon)) {
        const y = 8 + (Math.sin(p / 46) > 0.35 ? u : 0); // o caule serpenteia 1 quadradinho
        g.fillStyle = '#35a24e'; g.fillRect(p, y, u, u); g.fillStyle = '#1f6a36'; g.fillRect(p, y + u, u, u);
        if (esp[lado].some((t) => Math.abs(canon - t) < u / 2 + 0.01)) { // espinho: triângulo de 3 quadradinhos de altura
          g.fillStyle = '#f3e6ec'; g.fillRect(p - u, y + 2 * u, 3 * u, u); g.fillStyle = '#e1cdd7'; g.fillRect(p, y + 3 * u, 2 * u, u); g.fillStyle = '#ffffff'; g.fillRect(p, y + 4 * u, u, u);
        }
        if (n % 19 === 10) { g.fillStyle = '#4cc063'; g.fillRect(p, y - u, 2 * u, u); g.fillRect(p + u, y - 2 * u, u, u); } // folhinha
      } else { // trecho liso: dois fios que se trançam, sem espinho
        const k = Math.round(Math.sin(p / 11)); // -1, 0 ou 1
        const ya = 8 + u * (1 + k), yb = 8 + u * (1 - k);
        const frente = Math.cos(p / 11) > 0;
        g.fillStyle = '#17502a'; g.fillRect(p, 8 + u, u, u); // miolo escuro que liga os dois fios
        g.fillStyle = '#1f6a36'; g.fillRect(p, frente ? yb : ya, u, u);
        g.fillStyle = frente ? '#35a24e' : '#4cc063'; g.fillRect(p, frente ? ya : yb, u, u);
      }
    }
  };
  const TAM = [2.5, 1.5, 2, 1.5, 2.5]; // tamanhos alternados (em px por quadradinho)
  const flor = (lado) => rosas[lado].forEach((t, n) => { // rosa crescendo do caule para dentro da arena
    const p = lado === 1 ? W - t - u : lado === 2 ? H - t - u : t, k = Math.max(1, Math.round(TAM[(n + lado * 2) % TAM.length] * dpr)) / dpr;
    ROSA.forEach((lin, j) => { for (let i = 0; i < lin.length; i++) { const ch = lin[i]; if (ch === '.') continue; g.fillStyle = COR_ROSA[ch]; g.fillRect(p + i * k, 12 + (14 - j) * k, k, k); } });
  });
  const lado = (tx, ty, ang, comp, l) => { g.save(); g.translate(tx, ty); g.rotate(ang); cima(comp, l); flor(l); g.restore(); };
  lado(0, 0, 0, W, 0); lado(W, H, Math.PI, W, 1); lado(0, H, -Math.PI / 2, H, 2); lado(W, 0, Math.PI / 2, H, 3);
  molduraC = c;
};

// ---------- estado do jogo ----------
let aberto = false, estado = 'pronto', raf = 0, t0 = 0, tJogo = 0, morreuEm = 0, fimEm = 0, motivo = '';
let bs = [], parts = [], dedos = [], rajada = 0, fase0 = 0, salva = 0, mult = 14, MAX = 8;
const nova = (x, y, vx, vy) => ({ x, y, vx, vy, sq: 0, ph: Math.random() * 6.28 });
const reinicia = () => {
  bs = [nova(W / 2, H / 2, (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 14), -6)];
  parts = []; dedos = []; tJogo = 0; rajada = 3 + Math.random() * 2; fase0 = Math.random() * 6.28; salva = 0; mult = 14;
};
const empurra = (px, py) => {
  dedos.push({ x: px, y: py, t: 0 });
  bs.forEach((b) => {
    const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy) || 1, alcance = BR + 70;
    if (d > alcance) return;
    const forcaP = 55 + 110 * (1 - d / alcance); // empurrão suave: quanto mais perto do toque, mais forte
    b.vx += dx / d * forcaP; b.vy += dy / d * forcaP;
    const v = Math.hypot(b.vx, b.vy), lim = 210; if (v > lim) { b.vx *= lim / v; b.vy *= lim / v; }
    b.sq = 1;
  });
};
const estoura = () => {
  estado = 'estourando'; morreuEm = performance.now();
  const cores = ['#52e4f2', '#f77ae9', '#eaf2f2', '#6a6a6a'];
  bs.forEach((b) => { for (let k = 0; k < 18; k++) { const a = Math.random() * 6.28, sp = 60 + Math.random() * 170; parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, c: cores[k % 4], t: 0 }); } });
  bs = [];
  const pts = Math.floor(tJogo * 10);
  if (pts > recorde) { recorde = pts; try { localStorage.setItem(CR, String(recorde)); } catch (e) { /* segue */ } }
  gravaUso();
};
const toque = (e) => {
  e.preventDefault();
  const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (H / r.height);
  if (estado === 'pronto') { estado = 'jogando'; empurra(px, py); return; }
  if (estado === 'jogando') { empurra(px, py); return; }
  if (estado === 'morto' && performance.now() - morreuEm > 700) { reinicia(); estado = 'jogando'; }
};

const passo = (agora) => {
  if (!aberto) return;
  const dt = Math.min(0.05, (agora - t0) / 1000); t0 = agora;
  if (estado === 'jogando') {
    tJogo += dt; usado += dt; salva += dt; if (salva > 5) { salva = 0; gravaUso(); }
    if (usado >= LIMITE || !janela()) { motivo = usado >= LIMITE ? 'Acabaram seus 8 minutos de hoje.' : 'O pause pro café acabou.'; estado = 'fim'; fimEm = agora; gravaUso(); }
    const dif = Math.min(1, tJogo / 120);
    // a cada tanto tempo uma bolha se divide em duas: cada vez mais bolhas para cuidar
    mult -= dt;
    if (mult <= 0 && bs.length < MAX) {
      mult = Math.max(7, 14 - tJogo / 25);
      const o = bs[Math.floor(Math.random() * bs.length)], lado = o.x < W / 2 ? 1 : -1, cima = o.y < H / 2 ? 1 : -1;
      bs.push(nova(o.x + lado * BR * 1.3, o.y + cima * BR * 0.8, lado * 22, cima * 12));
    }
    rajada -= dt; const sopra = rajada <= 0; if (sopra) rajada = 4 + Math.random() * 3 - dif * 1.5;
    const rr = BR * 0.88;
    for (const b of bs) {
      if (sopra) { b.vx += (Math.random() < 0.5 ? -1 : 1) * (18 + 40 * dif); b.vy += (Math.random() - 0.5) * (20 + 40 * dif); }
      const vento = Math.sin(tJogo * 0.7 + fase0 + b.ph) * (10 + 38 * dif);
      b.vx += vento * dt; b.vy += (14 + 10 * dif) * dt + Math.sin(tJogo * 1.1 + b.ph) * 8 * dt; // peso bem leve para baixo
      b.vx *= Math.pow(0.72, dt); b.vy *= Math.pow(0.72, dt);
    }
    // as bolhas não se atravessam: afastam-se com delicadeza
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const p = bs[i], q = bs[j], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, min = BR * 1.9;
      if (d < min) { const f = (min - d) / min * 120 * dt, nx = dx / d, ny = dy / d; p.vx -= nx * f; p.vy -= ny * f; q.vx += nx * f; q.vy += ny * f; }
    }
    for (const b of bs) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.sq = Math.max(0, b.sq - dt * 3.2);
      // paredes: no trecho com espinhos a bolha estoura; no trecho liso ela bate e volta
      const zc = espinho(0, b.x) ? ZONA : ZLISO, zb = espinho(1, b.x) ? ZONA : ZLISO, ze = espinho(2, b.y) ? ZONA : ZLISO, zd = espinho(3, b.y) ? ZONA : ZLISO;
      if (b.y - rr < zc) { if (zc === ZONA) { estoura(); break; } b.y = zc + rr; b.vy = Math.abs(b.vy) * 0.75 + 8; b.sq = 1; }
      if (b.y + rr > H - zb) { if (zb === ZONA) { estoura(); break; } b.y = H - zb - rr; b.vy = -Math.abs(b.vy) * 0.75 - 8; b.sq = 1; }
      if (b.x - rr < ze) { if (ze === ZONA) { estoura(); break; } b.x = ze + rr; b.vx = Math.abs(b.vx) * 0.75 + 8; b.sq = 1; }
      if (b.x + rr > W - zd) { if (zd === ZONA) { estoura(); break; } b.x = W - zd - rr; b.vx = -Math.abs(b.vx) * 0.75 - 8; b.sq = 1; }
    }
  } else if (estado === 'estourando') {
    if (agora - morreuEm > 650) estado = 'morto';
  } else if (estado === 'fim' && agora - fimEm > 3200) { fecha(); return; }
  parts.forEach((p) => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; });
  parts = parts.filter((p) => p.t < 0.9);
  dedos.forEach((d) => { d.t += dt; }); dedos = dedos.filter((d) => d.t < 0.28);
  desenha(agora);
  raf = requestAnimationFrame(passo);
};

const desenha = (agora) => {
  const g = cx;
  const fundo = g.createLinearGradient(0, 0, 0, H); fundo.addColorStop(0, '#222a3b'); fundo.addColorStop(1, '#161b27');
  g.fillStyle = fundo; g.fillRect(0, 0, W, H);
  // brilhinhos de fundo
  g.fillStyle = 'rgba(200,215,240,.16)';
  for (let k = 0; k < 18; k++) { const sx = ((k * 137.5) % 1) * 0 + (k * 211 % Math.max(60, W - 2 * ZONA)) + ZONA, sy = (k * 97 % Math.max(40, H - 2 * ZONA)) + ZONA; g.fillRect(Math.round(sx), Math.round(sy), 4, 4); }
  if (molduraC) g.drawImage(molduraC, 0, 0, W, H);
  // bolhas (achatam um pouco ao serem empurradas)
  bs.forEach((b) => {
    const s = Math.sin(agora / 260 + b.ph) * 0.03, q = b.sq * 0.12;
    g.save(); g.translate(Math.round(b.x), Math.round(b.y)); g.scale(1 + s + q, 1 - s - q); g.drawImage(bolhaSpr, -BR, -BR); g.restore();
  });
  parts.forEach((p) => { g.globalAlpha = Math.max(0, 1 - p.t / 0.9); g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), 5, 5); }); g.globalAlpha = 1;
  // dedo: sobe até o ponto do toque e some
  dedos.forEach((d) => { const k = Math.min(1, d.t / 0.12), sai = Math.max(0, (d.t - 0.16) / 0.12); g.globalAlpha = 1 - sai; g.drawImage(dedoSpr, Math.round(d.x - 6 * 3 + 0), Math.round(d.y - 2 + (1 - k) * 26 + sai * 10)); }); g.globalAlpha = 1;
  // placar
  g.fillStyle = '#c3ccd9'; g.font = '600 13px ui-monospace, Menlo, Consolas, monospace'; g.textAlign = 'left';
  if (estado !== 'fim') g.fillText('restam ' + mmss(LIMITE - usado), ZONA + 8, ZONA + 18);
  g.textAlign = 'right'; g.font = '700 14px ui-monospace, Menlo, Consolas, monospace';
  g.fillText('HI ' + pts5(recorde) + '   ' + pts5(tJogo * 10), W - ZONA - 44, ZONA + 18);
  g.textAlign = 'center';
  const ps = window.cpPS;
  const pixPS = (mx, my, s) => { if (!ps) return; g.save(); g.translate(Math.round(mx - 39 * s), Math.round(my - 15 * s)); g.scale(s, s); g.save(); g.translate(1, 1.4); g.fillStyle = '#0d1218'; g.fill(ps); g.restore(); g.fillStyle = '#ffffff'; g.fill(ps); g.restore(); };
  if (estado === 'pronto') pixPS(W / 2, H * 0.34, Math.max(1.4, Math.min(2.4, W / 380)));
  if (estado === 'morto') {
    const w = Math.min(230, W * 0.4), h = w * 15.5 / 31;
    g.drawImage(IMfim, (W - w) / 2, Math.max(ZONA + 6, H * 0.3 - h / 2), w, h);
    pixPS(W / 2, Math.max(ZONA + 6, H * 0.3 - h / 2) + h + 30, 1.1);
  }
  if (estado === 'fim') { g.fillStyle = 'rgba(13,18,24,.7)'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '700 20px system-ui, sans-serif'; g.fillText(motivo, W / 2, H / 2 - 6); g.font = '600 15px system-ui, sans-serif'; g.fillText('Volta ao trabalho!', W / 2, H / 2 + 22); }
};

// ---------- abrir e fechar ----------
const abre = () => {
  if (aberto) return;
  if (!janela()) { avisa('O joguinho só abre no pause pro café: nas horas pares, nos primeiros 15 minutos.'); return; }
  usado = leUso();
  if (usado >= LIMITE) { avisa('Seus 8 minutos de jogo de hoje já acabaram. Volte amanhã!'); return; }
  aberto = true; if (window.cpTrava) window.cpTrava(true); box.hidden = false; mede(); reinicia(); estado = 'pronto';
  requestAnimationFrame(() => box.classList.add('on'));
  t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(passo);
  box.focus({ preventScroll: true });
};
const fecha = () => {
  if (!aberto) return;
  aberto = false; if (window.cpTrava) window.cpTrava(false); box.classList.remove('on'); cancelAnimationFrame(raf); gravaUso();
  setTimeout(() => { if (!aberto) box.hidden = true; }, 260);
};
window.cpBolha = { abre, fecha };
fechar.addEventListener('click', (e) => { e.stopPropagation(); fecha(); });
cv.addEventListener('pointerdown', toque);
window.addEventListener('resize', () => { if (aberto) mede(); });
document.addEventListener('keydown', (e) => { if (aberto && e.key === 'Escape') { e.preventDefault(); fecha(); } });
})();
