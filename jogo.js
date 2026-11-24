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
const IM = { nuvem: img('icones/nuvem.svg'), cao1: img('icones/cao1.svg'), cao2: img('icones/cao2.svg'), cao3: img('icones/cao3.svg'), cao4: img('icones/cao4.svg'), cao5: img('icones/cao5.svg'), cao6: img('icones/cao6.svg'), pedra: img('icones/pedra.svg'), mato: img('icones/mato.svg'), chao: img('icones/chao.svg'), fim: img('icones/game-over.svg'), portal: img('icones/portal.png'), balao: img('icones/balao.svg'), ave: img('icones/passarinho-completo.svg'), ave2: img('icones/passarinho-cafe.svg'), vida1: img('icones/coracao-cheio.svg'), vida0: img('icones/coracao-vazio.svg'), mor: [1, 2, 3, 4].map((q) => img('icones/morcego' + q + '.svg')) };
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
const S = (im) => (noite ? mono(im, im === IM.nuvem ? 2 : (im === IM.chao ? 3 : im === IM.mato ? 1 : 0)) : im);
const TINTA = () => (noite ? NOITE_TOM[0] : '#102532'), TINTA2 = () => (noite ? NOITE_TOM[1] : '#2c4a5c');

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
  cx.save(); cx.translate(1, 1.4); cx.fillStyle = noite ? '#0d1218' : '#102532'; cx.fill(PS_P); cx.restore(); // sombra escura para ler em qualquer fundo
  cx.fillStyle = '#ffffff'; cx.fill(PS_P); cx.restore();
};
// modo noite que vai ganhando cor: quanto mais o cachorro avança na fase, mais o cenário volta às cores (nuvens, balão, moitas, chão)
const progFase = () => Math.max(0, Math.min(1, (dist - PORTAL_PTS * fase) / PORTAL_PTS));
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

// ---------- balão: de vez em quando sobe de trás da paisagem (grande, na diagonal) ou passa pequeno ao fundo ----------
const BAL_AR = 31 / 42; // largura / altura do desenho

// ---------- estado ----------
let vidas = 3, invul = 0; // 3 vidas: cada batida tira uma e o cachorro vai perdendo a cor
let mor = null, morEm = 7, aveModo = null, decoX = 0, ave = null, aveEm = 6; // decoX: cenário ao fundo (cerca e banco); ave: passarinho que cruza o céu
let balao = null, balaoEm = 8; // balaoEm: segundos de jogo até o próximo balão
let fase = 0, espelho = false, portal = null, tPortal = 0, viraFeito = false, fasePt = 0, avisoFase = 0;
let motivo = '', fimEm = 0, aberto = false, estado = 'pronto', raf = 0, t0 = 0, morreuEm = 0;
let acel = 1, alvoAcel = 1, matoX = 0, vel, dist, recorde = 0, obst, nuvensF, chaoX, prox;
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
  vidas = 3; invul = 0; mor = null; morEm = 5 + Math.random() * 5; acel = 1; alvoAcel = 1; player.x = 90; vel = 430; dist = 0; matoX = 0; obst = []; chaoX = 0; prox = 900; fase = 0; noite = true; aplicaTema(); espelho = false; portal = null; avisoFase = 0; balao = null; balaoEm = 6 + Math.random() * 6; decoX = 0; ave = null; aveEm = 10 + Math.random() * 8;
  nuvensF = []; let nx = -Math.random() * 200;
  while (nx < W * 1.4) { const n = novaNuvem(nx); nuvensF.push(n); nx += n.w + 150 + Math.random() * 450; }
  player.y = chaoY() - player.h; player.vy = 0; player.noChao = true;
};
const pula = () => {
  if (estado === 'pronto') { estado = 'jogando'; dica.classList.add('off'); }
  if (estado === 'jogando' && player.noChao) { player.vy = -PULO; player.noChao = false; }
  else if (estado === 'morto' && performance.now() - morreuEm > 450) { reinicia(); estado = 'jogando'; }
};
const sorteiaAve = () => (Math.random() < 0.5 ? IM.ave : IM.ave2); // alterna entre o passarinho do balão e o do café
const AVE_W = 66; // largura do passarinho no chão (33 quadradinhos x 2)
const novoObst = () => {
  const n0 = obst.length;
  let poleiro = false;
  const grande = Math.random() < Math.min(0.3, 0.14 + 0.05 * fase); // pedra gigante: ~2,7x a pedra básica, ainda dá para pular (pulo máximo ~149 px)
  const k = grande ? 4.8 : 1.8 + Math.random() * 0.7; // escala da pedra (32x22 quadradinhos)
  const o = { x: W + 20, w: 32 * k, h: 22 * k, k, baixo: grande ? 8 : 0 }; // a pedra gigante afunda mais 10 px no chão
  obst.push(o);
  if (!ave && aveEm <= 0 && aveModo === 'pedra') { ave = { rock: o, sp: sorteiaAve() }; aveModo = null; poleiro = true; }
  // a cada portal o jogo fica mais difícil: mais duplas e, a partir da fase 2, trios para pular em 2 toques
  const P = (x) => ({ x, w: 32 * 1.8, h: 22 * 1.8, k: 1.8 });
  let fim = o;
  if (grande) { /* gigante vem sozinha */ } else if (Math.random() < Math.min(0.55, 0.22 + 0.1 * fase)) {
    // trio: duas pedras coladas (um pulo passa nas duas) e a terceira logo depois do pouso (segundo pulo)
    const b2 = P(o.x + o.w + 22 + Math.random() * 16); obst.push(b2);
    fim = P(b2.x + b2.w + vel * (0.5 + Math.random() * 0.06)); obst.push(fim);
  } else if (Math.random() < Math.min(0.6, 0.3 + 0.1 * fase)) { fim = P(o.x + o.w + 22 + Math.random() * 16); obst.push(fim); }
  if (ave && !ave.rock && fim.x + fim.w > ave.x - 70 && o.x < ave.x + AVE_W + 70) { const dx = ave.x + AVE_W + 70 - o.x; for (let q = n0; q < obst.length; q++) obst[q].x += dx; fim = obst[obst.length - 1]; } // pedra nunca nasce em cima do passarinho
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
    if (!viraFeito) { viraFeito = true; fase++; noite = fase % 2 === 0; mor = null; morEm = 5 + Math.random() * 5; aplicaTema(); espelho = !espelho; obst = []; vel = 0; prox = 700; avisoFase = 2.6;
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
    vel = Math.min(1040 + 80 * fase, vel + (14 + 3 * fase) * dt);
    acel += (alvoAcel - acel) * Math.min(1, 4 * dt); const v = vel * acel; player.x = 90 + (acel - 1) * 90; // acelerar: o cachorro corre mais e avança na tela; frear: recua
    dist += v * dt / 14;
    chaoX = (chaoX - v * dt) % CHAO_W; matoX = (matoX - v * dt * 0.6) % MATO_P; decoX = (decoX - v * dt * 0.8) % DECO_P;
    player.vy += GRAV * dt; player.y += player.vy * dt;
    const solo = chaoY() - player.h;
    if (player.y >= solo) { player.y = solo; player.vy = 0; player.noChao = true; }
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
    obst.forEach((o) => { o.x -= v * dt; if (!o.cor && o.x + o.w / 2 < player.x + player.w / 2) o.cor = true; }); // pedra que o cachorro já pulou fica colorida
    if (ave && !ave.rock) { ave.x -= v * dt; if (ave.x < -140) { ave = null; aveEm = 20 + Math.random() * 20; } } // anda junto com o chão
    obst = obst.filter((o) => o.x + o.w > -10);
    if (ave && ave.rock && !obst.includes(ave.rock)) { ave = null; aveEm = 20 + Math.random() * 20; } // a pedra saiu da tela: o passarinho vai embora com ela
    // colisão (caixa da nuvem um pouco menor que o desenho)
    const a = { x: player.x + 18, y: player.y + 8, w: player.w - 40, h: player.h - 12 };
    if (invul > 0) invul -= dt;
    for (const o of obst) {
      if (o.batida) continue;
      const b = { x: o.x + o.w * 0.14, y: chaoY() - o.h + AFUNDA + (o.baixo || 0) + o.h * 0.2, w: o.w * 0.72, h: o.h * 0.8 };
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
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
  if (estado === 'portal') { if (ave && !ave.rock) ave.x -= vel * dt; chaoX = (chaoX - vel * dt) % CHAO_W; matoX = (matoX - vel * dt * 0.6) % MATO_P; decoX = (decoX - vel * dt * 0.8) % DECO_P; }
  if (avisoFase > 0) avisoFase -= dt;
  if (estado === 'jogando' || estado === 'portal') {
    if (!ave) { aveEm -= dt; if (aveEm <= 0) { if (!aveModo) aveModo = Math.random() < 0.5 ? 'pedra' : 'chao'; if (aveModo === 'chao' && !obst.some((o) => o.x + o.w > W - 40 && o.x < W + 60 + AVE_W + 70)) { ave = { x: W + 60, sp: sorteiaAve() }; aveModo = null; } } } // passarinho: ou de pé no chão, ou em cima da próxima pedra
    if (!mor && noite) { morEm -= dt; if (morEm <= 0) { const peq = Math.random() < 0.4; mor = { x: W + 60, y0: H * (0.08 + Math.random() * 0.3), u: peq ? 0.9 : 1.6, v: (peq ? 130 : 95) + Math.random() * 40, t: 0, f: Math.random() * 6 }; } } // morcego: médio (60%) ou pequeno (40%)
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
// ---------- estrelas do céu da noite: espalhadas, de tamanhos bem variados, com brilho lento ----------
const ESTRELAS = (() => { let a = 7; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; const tipos = ['ponto', 'ponto', 'ponto', 'ponto', 'mais', 'mais', 'losango', 'brilho']; const l = [];
  for (let i = 0; i < 34; i++) { const tp = i % 17 === 0 ? 'grande' : tipos[Math.floor(r() * tipos.length)]; l.push({ x: r(), y: r(), tp, c: tp === 'grande' ? 3 : (tp === 'ponto' ? 1 + Math.floor(r() * 2) : 2), vel: 0.35 + r() * 0.5, fase: r() * 6.28 }); } return l; })();
const desenhaEstrelas = (cyChao) => {
  if (!noite) return;
  const t = performance.now() / 1000, topo = 30, base = Math.max(topo + 20, cyChao - 70);
  ESTRELAS.forEach((e) => {
    const b = 0.5 + 0.5 * Math.sin(t * e.vel + e.fase); // um ciclo leva de 7 a 18 segundos
    const a = 0.3 + 0.7 * b; if (a < 0.05) return;
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
  const cy = chaoY();
  cx.save();
  if (espelho) { cx.translate(W, 0); cx.scale(-1, 1); } // fases ímpares: tudo espelhado, o cachorro corre da direita para a esquerda
  desenhaEstrelas(cy);
  // nuvenzinhas ao fundo
  cx.save(); cx.globalAlpha = 0.8;
  nuvensF.slice().sort((a, b) => b.w - a.w).forEach((n) => dCor(IM.nuvem, faixa(0, 0.35), n.x, n.y, n.w, n.w * 107.2 / 171)); // maiores atrás
  cx.restore();
  // chão
  // balão: atrás das moitas e do chão
  if (mor) { const fr = IM.mor[Math.floor(mor.t / 0.08) % 4]; if (fr.complete && fr.naturalWidth) { const w = fr.naturalWidth * mor.u, h = fr.naturalHeight * mor.u; cx.drawImage(fr, Math.round(mor.x), Math.round(mor.y0 + Math.sin(mor.t * 2.2 + mor.f) * 14), w, h); } } // morcego batendo asa (4 quadros)
  if (balao) {
    cx.save(); cx.globalAlpha = balao.a;
    const bx = espelho ? W - balao.x - balao.w : balao.x; // posição na tela vira posição do mundo espelhado
    if (espelho) { cx.translate(bx + balao.w / 2, 0); cx.scale(-1, 1); cx.translate(-(bx + balao.w / 2), 0); }
    dCor(IM.balao, faixa(0.15, 0.5), bx, balao.y, balao.w, balao.h);
    cx.restore();
  }
  // moitas ao fundo (andam mais devagar que o chão)
  for (let x = matoX - MATO_P; x < W + MATO_W; x += MATO_P) dCor(IM.mato, faixa(0.35, 0.7), x, cy - MATO_H + 4, MATO_W, MATO_H);
  for (let x = chaoX - CHAO_W; x < W; x += CHAO_W) dCor(IM.chao, faixa(0.55, 0.9), Math.round(x), cy, CHAO_W + 1, CHAO_H);
  const piaAve = () => { const im = ave && (ave.sp || IM.ave); if (!(im && im.complete && im.naturalWidth)) return; const u = 2, w = im.naturalWidth * u, h = im.naturalHeight * u; const r = ave.rock; const ax = r ? r.x + r.w / 2 - w / 2 : ave.x, ay = r ? cy - r.h + AFUNDA + (r.baixo || 0) + 3 - h : cy + 5 - h; cx.save(); cx.translate(Math.round(ax) + w, Math.round(ay)); cx.scale(-1, 1); cx.drawImage(im, 0, 0, w, h); cx.restore(); }; // olhando para o cachorro
  if (ave && !ave.rock) piaAve();
  // pedras
  obst.forEach((o) => cx.drawImage(o.cor ? IM.pedra : S(IM.pedra), o.x, cy - o.h + AFUNDA + (o.baixo || 0), o.w, o.h));
  if (ave && ave.rock) piaAve();
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
  if (esc > 0.01) {
    cx.scale(esc, esc);
    if (invul > 0 && Math.floor(invul * 10) % 2 === 0) alfa *= 0.35; // pisca enquanto está protegido
    const cor = vidas >= 3 ? 1 : (vidas === 2 ? 0.6 : (vidas === 1 ? 0.22 : 0)); // cada vida perdida tira cor
    cx.globalAlpha = alfa;
    if (cor >= 1) cx.drawImage(pose, -player.w / 2, -player.h / 2, player.w, player.h);
    else { cx.drawImage(mono(pose, 0), -player.w / 2, -player.h / 2, player.w, player.h); if (cor > 0.01) { cx.globalAlpha = alfa * cor; cx.drawImage(pose, -player.w / 2, -player.h / 2, player.w, player.h); } }
  }
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
  // barrinha de velocidade (frear ◀ / acelerar ▶): moldura escura e listras na diagonal
  { const bx = 16, by = Math.round(chaoY() + 28), bw = 84, bh = 12, nivel = Math.max(0, Math.min(1, (acel - 0.6) / 0.85));
    cx.fillStyle = TINTA(); cx.fillRect(bx, by, bw, bh); cx.fillStyle = noite ? NOITE_FUNDO : '#ffffff'; cx.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    cx.save(); cx.beginPath(); cx.rect(bx + 3, by + 3, (bw - 6) * nivel, bh - 6); cx.clip(); cx.fillStyle = TINTA();
    for (let x = bx - bh; x < bx + bw; x += 6) { cx.beginPath(); cx.moveTo(x, by + bh); cx.lineTo(x + 3, by + bh); cx.lineTo(x + 3 + bh, by); cx.lineTo(x + bh, by); cx.fill(); }
    cx.restore(); }
  // placar
  cx.fillStyle = TINTA(); cx.font = '600 15px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'right';
  cx.fillText('HI ' + pts5(recorde) + '   ' + pts5(dist), W - 58, 30);
  if (estado !== 'fim') { cx.fillStyle = TINTA2(); cx.font = '600 13px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'left'; cx.fillText('restam ' + mmss(LIMITE - usado), 16, 28); }
  if (estado !== 'fim') { // vidas: 3 corações
    for (let i = 0; i < 3; i++) desenhaCoracao(16 + i * 26, 40, 3, i < vidas);
  }
  if (estado === 'fim') {
    cx.fillStyle = 'rgba(16,37,50,.72)'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = '700 20px system-ui, sans-serif'; cx.fillText(motivo, W / 2, H / 2 - 6);
    cx.font = '600 15px system-ui, sans-serif'; cx.fillText('Volta ao trabalho!', W / 2, H / 2 + 22);
  }
  if (estado === 'pronto') pixTexto('', W / 2, H * 0.44, Math.max(1.6, Math.min(2.6, W / 360)));
  if (estado === 'morto') {
    const w = Math.min(230, W * 0.4), h = w * 15.5 / 31;
    cx.drawImage(S(IM.fim), (W - w) / 2, Math.max(16, (cy - h) / 2 - 6), w, h);
    pixTexto('', W / 2, Math.max(16, (cy - h) / 2 - 6) + h + 18 + 15 * 1.1, 1.1);
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
