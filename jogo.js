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
const janela = () => { const d = new Date(); return forca || (d.getHours() % 2 === 0 && d.getMinutes() < 15); };
const hoje = () => new Date().toDateString();
const leUso = () => { if (forca) return 0; try { const o = JSON.parse(localStorage.getItem(CT) || '{}'); return o.dia === hoje() ? (+o.s || 0) : 0; } catch (e) { return 0; } };
let usado = leUso(), cont = 0;
const gravaUso = () => { try { localStorage.setItem(CT, JSON.stringify({ dia: hoje(), s: Math.round(usado) })); } catch (e) { /* segue sem salvar */ } };
const mmss = (n) => { n = Math.max(0, Math.ceil(n)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
const img = (src) => { const i = new Image(); i.src = src + '?v=' + V; return i; };
const IM = { nuvem: img('icones/nuvem.svg'), cao1: img('icones/cao1.svg'), cao2: img('icones/cao2.svg'), cao3: img('icones/cao3.svg'), cao4: img('icones/cao4.svg'), cao5: img('icones/cao5.svg'), cao6: img('icones/cao6.svg'), pedra: img('icones/pedra.svg'), mato: img('icones/mato.svg'), chao: img('icones/chao.svg'), fim: img('icones/game-over.svg'), portal: img('icones/portal.png'), balao: img('icones/balao.svg') };
// ---------- tema noite: tons de cinza no estilo Game Boy, para descansar a vista ----------
// Alterna a cada fase (portal), com a tecla N, ou fica sempre ligado com ?noite na URL.
const flagNoite = /[?&]noite(=|&|$)/.test(location.search);
let noite = flagNoite;
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
    const t = (cen === 2 ? TOM_NUVEM : cen ? TOM_CENARIO : TOM_OBJETO)[Math.min(NIV - 1, Math.floor((0.299 * p[n] + 0.587 * p[n + 1] + 0.114 * p[n + 2]) / (256 / NIV)))];
    p[n] = t[0]; p[n + 1] = t[1]; p[n + 2] = t[2]; p[n + 3] = p[n + 3] < 128 ? 0 : 255;
  }
  g.putImageData(d, 0, 0); monoC.set(im, c); return c;
};
const S = (im) => (noite ? mono(im, im === IM.nuvem ? 2 : (im === IM.chao || im === IM.mato ? 1 : 0)) : im);
const TINTA = () => (noite ? NOITE_TOM[0] : '#102532'), TINTA2 = () => (noite ? NOITE_TOM[1] : '#2c4a5c');

// ---------- camada do jogo ----------
const box = document.createElement('div');
box.id = 'cp-jogo'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Jogo da nuvem'); box.hidden = true; box.tabIndex = -1;
box.innerHTML = '<canvas></canvas><button type="button" class="jg-x" aria-label="Fechar o jogo" title="Fechar (Esc)">×</button><div class="jg-dica" aria-hidden="true">Toque ou barra de espaço para pular · Esc para sair</div>';
area.append(box);
const aplicaTema = () => { box.classList.toggle('noite', noite); };
aplicaTema();
const aviso = document.createElement('div');
aviso.className = 'cp-jogo-aviso'; aviso.setAttribute('role', 'status'); aviso.hidden = true; area.append(aviso);
let avT = 0;
const avisa = (t) => { aviso.textContent = t; aviso.hidden = false; requestAnimationFrame(() => aviso.classList.add('on')); clearTimeout(avT); avT = setTimeout(() => { aviso.classList.remove('on'); setTimeout(() => { aviso.hidden = true; }, 300); }, 4500); };
const cv = box.querySelector('canvas'), cx = cv.getContext('2d'), dica = box.querySelector('.jg-dica'), fechar = box.querySelector('.jg-x');

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

// ---------- balão: de vez em quando sobe de trás da paisagem (grande, na diagonal) ou passa pequeno ao fundo ----------
const BAL_AR = 31 / 42; // largura / altura do desenho

// ---------- estado ----------
let decoX = 0, ave = null, aveEm = 6; // decoX: cenário ao fundo (cerca e banco); ave: passarinho que cruza o céu
let balao = null, balaoEm = 8; // balaoEm: segundos de jogo até o próximo balão
let fase = 0, espelho = false, portal = null, tPortal = 0, viraFeito = false, fasePt = 0, avisoFase = 0;
let motivo = '', fimEm = 0, aberto = false, estado = 'pronto', raf = 0, t0 = 0, morreuEm = 0;
let matoX = 0, vel, dist, recorde = 0, obst, nuvensF, chaoX, prox;
const player = { x: 90, y: 0, vy: 0, w: 105, h: 50, noChao: true };
try { recorde = parseInt(localStorage.getItem(CH) || '0', 10) || 0; } catch (e) { recorde = 0; }
const CHAO_W = 256, CHAO_H = 60; // faixa do chão: 64x15 quadradinhos de 4 px
const chaoY = () => H - CHAO_H;
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
const reinicia = () => {
  vel = 430; dist = 0; matoX = 0; obst = []; chaoX = 0; prox = 900; fase = 0; noite = flagNoite; aplicaTema(); espelho = false; portal = null; avisoFase = 0; balao = null; balaoEm = 6 + Math.random() * 6; decoX = 0; ave = null; aveEm = 4 + Math.random() * 5;
  nuvensF = []; let nx = -Math.random() * 200;
  while (nx < W * 1.4) { const n = novaNuvem(nx); nuvensF.push(n); nx += n.w + 150 + Math.random() * 450; }
  player.y = chaoY() - player.h; player.vy = 0; player.noChao = true;
};
const pula = () => {
  if (estado === 'pronto') { estado = 'jogando'; dica.classList.add('off'); }
  if (estado === 'jogando' && player.noChao) { player.vy = -PULO; player.noChao = false; }
  else if (estado === 'morto' && performance.now() - morreuEm > 450) { reinicia(); estado = 'jogando'; }
};
const novoObst = () => {
  const k = 1.8 + Math.random() * 0.7; // escala da pedra (32x22 quadradinhos)
  const o = { x: W + 20, w: 32 * k, h: 22 * k, k };
  obst.push(o);
  // a cada portal o jogo fica mais difícil: mais duplas e, a partir da fase 2, trios para pular em 2 toques
  const P = (x) => ({ x, w: 32 * 1.8, h: 22 * 1.8, k: 1.8 });
  let fim = o;
  if (fase >= 1 && Math.random() < Math.min(0.5, 0.25 + 0.1 * fase)) {
    // trio: duas pedras coladas (um pulo passa nas duas) e a terceira logo depois do pouso (segundo pulo)
    const b2 = P(o.x + o.w + 22 + Math.random() * 16); obst.push(b2);
    fim = P(b2.x + b2.w + vel * (0.5 + Math.random() * 0.06)); obst.push(fim);
  } else if (Math.random() < Math.min(0.6, 0.25 + 0.1 * fase)) { fim = P(o.x + o.w + 22 + Math.random() * 16); obst.push(fim); }
  return fim.x + fim.w - o.x; // largura do conjunto, para o espaçamento da próxima
};

// o balão anda em coordenadas de tela (sempre da direita para a esquerda, mesmo com o jogo espelhado)
const novoBalao = () => {
  const cy = chaoY();
  if (Math.random() < 0.55) { // grande: nasce atrás do chão, à direita, e sobe na diagonal para a esquerda
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
    if (!viraFeito) { viraFeito = true; fase++; noite = flagNoite || fase % 2 === 1; aplicaTema(); espelho = !espelho; obst = []; vel = 0; prox = 700; avisoFase = 2.6;
      portal = { x: player.x + player.w / 2 - portalAlt() * PORT_W / PORT_H / 2, w: portalAlt() * PORT_W / PORT_H, h: portalAlt() }; }
    if (tPortal >= T_SUGA + T_VIRA + T_SOLTA) { portal = null; vel = 520 + 50 * fase; estado = 'jogando'; }
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
    vel = Math.min(920 + 60 * fase, vel + (9 + 2 * fase) * dt); dist += vel * dt / 14;
    chaoX = (chaoX - vel * dt) % CHAO_W; matoX = (matoX - vel * dt * 0.6) % MATO_P; decoX = (decoX - vel * dt * 0.8) % DECO_P;
    player.vy += GRAV * dt; player.y += player.vy * dt;
    const solo = chaoY() - player.h;
    if (player.y >= solo) { player.y = solo; player.vy = 0; player.noChao = true; }
    prox -= vel * dt;
    const alvo = PORTAL_PTS * (fase + 1);
    if (!portal && dist >= alvo) { // hora do portal: ele entra depois da última pedra, sem pedras novas na frente
      const ult = obst.reduce((m, o) => Math.max(m, o.x + o.w), 0);
      const ph = portalAlt();
      portal = { x: Math.max(W + 40, ult + 280), w: ph * PORT_W / PORT_H, h: ph };
    }
    if (prox <= 0 && !portal) { prox = novoObst() + vel * Math.max(0.5, 0.85 - 0.08 * fase + Math.random() * 0.8) + 120; }
    if (portal) {
      portal.x -= vel * dt;
      if (portal.x + portal.w / 2 <= player.x + player.w * 0.85) { estado = 'portal'; tPortal = 0; viraFeito = false; fasePt = vel; }
    }
    obst.forEach((o) => { o.x -= vel * dt; });
    obst = obst.filter((o) => o.x + o.w > -10);
    // colisão (caixa da nuvem um pouco menor que o desenho)
    const a = { x: player.x + 18, y: player.y + 8, w: player.w - 40, h: player.h - 12 };
    for (const o of obst) {
      const b = { x: o.x + o.w * 0.14, y: chaoY() - o.h + AFUNDA + o.h * 0.2, w: o.w * 0.72, h: o.h * 0.8 };
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        estado = 'morto'; morreuEm = performance.now();
        const pts = Math.floor(dist);
        if (pts > recorde) { recorde = pts; try { localStorage.setItem(CH, String(recorde)); } catch (e) { /* segue */ } }
        break;
      }
    }
  }
  if (estado === 'portal') { chaoX = (chaoX - vel * dt) % CHAO_W; matoX = (matoX - vel * dt * 0.6) % MATO_P; decoX = (decoX - vel * dt * 0.8) % DECO_P; }
  if (avisoFase > 0) avisoFase -= dt;
  if (estado === 'jogando' || estado === 'portal') {
    if (!ave) { aveEm -= dt; if (aveEm <= 0) ave = { x: W + 20, y: H * (0.08 + Math.random() * 0.28), v: 60 + Math.random() * 40, t: 0 }; }
    else { ave.x -= ave.v * dt; ave.t += dt; if (ave.x < -40) { ave = null; aveEm = 7 + Math.random() * 9; } }
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
  desenha();
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
const desenha = () => {
  if (!W) return;
  cx.clearRect(0, 0, W, H);
  const cy = chaoY();
  cx.save();
  if (espelho) { cx.translate(W, 0); cx.scale(-1, 1); } // fases ímpares: tudo espelhado, o cachorro corre da direita para a esquerda
  // nuvenzinhas ao fundo
  cx.save(); cx.globalAlpha = 0.8;
  nuvensF.slice().sort((a, b) => b.w - a.w).forEach((n) => cx.drawImage(S(IM.nuvem), n.x, n.y, n.w, n.w * 107.2 / 171)); // maiores atrás
  cx.restore();
  // chão
  if (ave) passaro(ave);
  // balão: atrás das moitas e do chão
  if (balao) {
    cx.save(); cx.globalAlpha = balao.a;
    const bx = espelho ? W - balao.x - balao.w : balao.x; // posição na tela vira posição do mundo espelhado
    if (espelho) { cx.translate(bx + balao.w / 2, 0); cx.scale(-1, 1); cx.translate(-(bx + balao.w / 2), 0); }
    cx.drawImage(S(IM.balao), bx, balao.y, balao.w, balao.h);
    cx.restore();
  }
  // moitas ao fundo (andam mais devagar que o chão)
  for (let x = matoX - MATO_P; x < W + MATO_W; x += MATO_P) cx.drawImage(S(IM.mato), x, cy - MATO_H + 4, MATO_W, MATO_H);
  for (let b = decoX - DECO_P; b < W + 40; b += DECO_P) { cerca(Math.round(b + 160), cy + 5); banco(Math.round(b + 640), cy + 5); } // atrás do chão, que cobre a base
  for (let x = chaoX - CHAO_W; x < W; x += CHAO_W) cx.drawImage(S(IM.chao), Math.round(x), cy, CHAO_W + 1, CHAO_H);
  for (let x = chaoX - CHAO_W, k = 0; x < W; x += CHAO_W, k++) [34, 122, 205].forEach((o, q) => tufo(Math.round(x + o), cy + 4, k * 3 + q)); // tufos balançando
  // pedras
  obst.forEach((o) => cx.drawImage(S(IM.pedra), o.x, cy - o.h + AFUNDA, o.w, o.h));
  // gatinho (inclina no ar e quica correndo)
  cx.save();
  const sx = player.x + player.w / 2, sy = player.y + player.h / 2;
  // cachorro: 6 quadros do GIF (agacha, impulso, sobe esticando, pico, voo, aterrissa)
  const corre = (player.noChao && estado === 'jogando');
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
  if (esc > 0.01) { cx.scale(esc, esc); cx.globalAlpha = alfa; cx.drawImage(S(pose), -player.w / 2, -player.h / 2, player.w, player.h); }
  cx.restore();
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
    if (d < 1) { cx.fillStyle = (noite ? 'rgba(154,165,181,' : 'rgba(35,62,246,') + (0.85 * (1 - d)).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
  }
  if (avisoFase > 0 && estado !== 'portal') {
    cx.globalAlpha = Math.min(1, avisoFase); cx.fillStyle = TINTA(); cx.textAlign = 'center'; cx.font = '700 18px system-ui, sans-serif';
    cx.fillText('Fase ' + (fase + 1) + ' · agora é ' + (espelho ? 'da direita para a esquerda' : 'da esquerda para a direita'), W / 2, Math.max(24, H * 0.34));
    cx.globalAlpha = 1;
  }
  // bolinhas: quanto falta para o próximo portal (cada bolinha = 10% do caminho)
  { const prog = Math.max(0, Math.min(1, (dist - PORTAL_PTS * fase) / PORTAL_PTS)), cheias = Math.floor(prog * 10 + 1e-6);
    for (let i = 0; i < 10; i++) {
      const bx = W - 24 - (9 - i) * 16, by = H - 14;
      cx.beginPath(); cx.arc(bx, by, 4, 0, Math.PI * 2);
      cx.fillStyle = i < cheias ? (noite ? '#e3e9f2' : '#fff') : (noite ? '#3a4658' : 'rgba(255,255,255,.35)'); cx.fill();
    } }
  // placar
  cx.fillStyle = TINTA(); cx.font = '600 15px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'right';
  cx.fillText('HI ' + pts5(recorde) + '   ' + pts5(dist), W - 58, 30);
  if (estado !== 'fim') { cx.fillStyle = TINTA2(); cx.font = '600 13px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'left'; cx.fillText('restam ' + mmss(LIMITE - usado), 16, 28); }
  if (estado === 'fim') {
    cx.fillStyle = 'rgba(16,37,50,.72)'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = '700 20px system-ui, sans-serif'; cx.fillText(motivo, W / 2, H / 2 - 6);
    cx.font = '600 15px system-ui, sans-serif'; cx.fillText('Volta ao trabalho!', W / 2, H / 2 + 22);
  }
  if (estado === 'morto') {
    const w = Math.min(230, W * 0.4), h = w * 15.5 / 31;
    cx.drawImage(S(IM.fim), (W - w) / 2, Math.max(16, (cy - h) / 2 - 6), w, h);
    cx.textAlign = 'center'; cx.font = '600 13px system-ui, sans-serif'; cx.fillStyle = TINTA();
    cx.fillText('Toque ou espaço para jogar de novo', W / 2, Math.max(16, (cy - h) / 2 - 6) + h + 24);
  }
};

// ---------- abrir e fechar ----------
const abre = () => {
  if (aberto) return;
  if (!janela()) { avisa('O joguinho só abre no pause pro café: nas horas pares, nos primeiros 15 minutos.'); return; }
  usado = leUso();
  if (usado >= LIMITE) { avisa('Seus 8 minutos de jogo de hoje já acabaram. Volte amanhã!'); return; }
  aberto = true; box.hidden = false; mede(); reinicia(); estado = 'pronto'; dica.classList.remove('off');
  requestAnimationFrame(() => box.classList.add('on'));
  t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(passo);
  box.focus({ preventScroll: true });
};
const fecha = () => {
  if (!aberto) return;
  aberto = false; box.classList.remove('on'); cancelAnimationFrame(raf); gravaUso();
  setTimeout(() => { if (!aberto) box.hidden = true; }, 260);
};
window.cpJogo = { abre, fecha };
fechar.addEventListener('click', (e) => { e.stopPropagation(); fecha(); });
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); pula(); });
window.addEventListener('resize', () => { if (aberto) { mede(); } });

// ---------- teclado: pular, sair e código Konami ----------
const KON = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let pos = 0;
document.addEventListener('keydown', (e) => { if (!box.hidden && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'n' || e.key === 'N')) { noite = !noite; aplicaTema(); } });
document.addEventListener('keydown', (e) => {
  if (aberto) {
    if (e.key === 'Escape') { e.preventDefault(); fecha(); return; }
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
