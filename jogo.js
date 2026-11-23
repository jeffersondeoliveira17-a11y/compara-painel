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
const leUso = () => { try { const o = JSON.parse(localStorage.getItem(CT) || '{}'); return o.dia === hoje() ? (+o.s || 0) : 0; } catch (e) { return 0; } };
let usado = leUso(), cont = 0;
const gravaUso = () => { try { localStorage.setItem(CT, JSON.stringify({ dia: hoje(), s: Math.round(usado) })); } catch (e) { /* segue sem salvar */ } };
const mmss = (n) => { n = Math.max(0, Math.ceil(n)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
const img = (src) => { const i = new Image(); i.src = src + '?v=' + V; return i; };
const IM = { nuvem: img('icones/nuvem.svg'), cao1: img('icones/cao1.svg'), cao2: img('icones/cao2.svg'), cao3: img('icones/cao3.svg'), cao4: img('icones/cao4.svg'), cao5: img('icones/cao5.svg'), cao6: img('icones/cao6.svg'), pedra: img('icones/pedra.svg'), m1: img('icones/menina1.svg'), m2: img('icones/menina2.svg'), m3: img('icones/menina3.svg'), m4: img('icones/menina4.svg'), m5: img('icones/menina5.svg'), m6: img('icones/menina6.svg'), m7: img('icones/menina7.svg'), m8: img('icones/menina8.svg'), mato: img('icones/mato.svg'), chao: img('icones/chao.svg'), fim: img('icones/game-over.svg') };

// ---------- camada do jogo ----------
const box = document.createElement('div');
box.id = 'cp-jogo'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Jogo da nuvem'); box.hidden = true; box.tabIndex = -1;
box.innerHTML = '<canvas></canvas><button type="button" class="jg-x" aria-label="Fechar o jogo" title="Fechar (Esc)">×</button><div class="jg-dica" aria-hidden="true">Toque ou barra de espaço para pular · Esc para sair</div>';
area.append(box);
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

// ---------- estado ----------
let motivo = '', fimEm = 0, aberto = false, estado = 'pronto', raf = 0, t0 = 0, morreuEm = 0;
let matoX = 0, vel, dist, recorde = 0, obst, nuvensF, chaoX, prox;
const menina = { x: 232, y: 0, vy: 0, w: 62, h: 62, noChao: true }; // corre à frente do cachorro e pula as pedras sozinha
const player = { x: 90, y: 0, vy: 0, w: 105, h: 50, noChao: true };
try { recorde = parseInt(localStorage.getItem(CH) || '0', 10) || 0; } catch (e) { recorde = 0; }
const CHAO_W = 256, CHAO_H = 60; // faixa do chão: 64x15 quadradinhos de 4 px
const chaoY = () => H - CHAO_H;
const MATO_W = 330, MATO_H = 330 * 13 / 91, MATO_P = 560; // moita ao fundo: largura, altura e distância entre uma e outra
const AFUNDA = 7; // quanto os desenhos entram na grama (para não flutuar)
const PASSO = 3; // distância por quadro (a 430 de velocidade = 10 quadros/s, como no GIF)
const GRAV = 2600, PULO = 880;
const reinicia = () => {
  vel = 430; dist = 0; matoX = 0; obst = []; chaoX = 0; prox = 900;
  nuvensF = Array.from({ length: 7 }, (_, i) => ({ x: (W / 7) * i + Math.random() * 120, y: 20 + Math.random() * (H * 0.4), w: 60 + Math.random() * 70, v: 14 + Math.random() * 16 }));
  player.y = chaoY() - player.h; player.vy = 0; player.noChao = true;
  menina.y = chaoY() - menina.h; menina.vy = 0; menina.noChao = true;
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
  if (Math.random() < 0.25) obst.push({ x: o.x + o.w + 22 + Math.random() * 16, w: 32 * 1.8, h: 22 * 1.8, k: 1.8 }); // dupla
};

// ---------- laço ----------
const passo = (agora) => {
  raf = requestAnimationFrame(passo);
  const dt = Math.min(0.034, (agora - t0) / 1000 || 0); t0 = agora;
  if (estado !== 'fim') {
    if (estado === 'jogando') { usado += dt; if (++cont % 120 === 0) gravaUso(); }
    if (usado >= LIMITE || !janela()) { motivo = usado >= LIMITE ? 'Acabaram seus 8 minutos de hoje.' : 'O pause pro café acabou.'; estado = 'fim'; fimEm = agora; gravaUso(); }
  } else if (agora - fimEm > 3200) { fecha(); return; }
  if (estado === 'jogando') {
    vel = Math.min(920, vel + 9 * dt); dist += vel * dt / 14;
    chaoX = (chaoX - vel * dt) % CHAO_W; matoX = (matoX - vel * dt * 0.3) % MATO_P;
    player.vy += GRAV * dt; player.y += player.vy * dt;
    const solo = chaoY() - player.h;
    if (player.y >= solo) { player.y = solo; player.vy = 0; player.noChao = true; }
    prox -= vel * dt;
    if (prox <= 0) { novoObst(); prox = vel * (0.85 + Math.random() * 0.8) + 120; }
    obst.forEach((o) => { o.x -= vel * dt; });
    obst = obst.filter((o) => o.x + o.w > -10);
    // a menina enxerga a pedra chegando e pula
    if (menina.noChao && obst.some((o) => { const d = o.x - (menina.x + menina.w - 8); return d > 0 && d < vel * 0.2; })) { menina.vy = -PULO; menina.noChao = false; }
    menina.vy += GRAV * dt; menina.y += menina.vy * dt;
    const soloM = chaoY() - menina.h;
    if (menina.y >= soloM) { menina.y = soloM; menina.vy = 0; menina.noChao = true; }
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
  if (estado !== 'morto' && estado !== 'fim') nuvensF.forEach((n) => { n.x -= n.v * dt * (estado === 'jogando' ? 1 + vel / 600 : 1); if (n.x + n.w < -10) { n.x = W + 20; n.y = 20 + Math.random() * (H * 0.4); } });
  desenha();
};
const pts5 = (n) => String(Math.floor(n)).padStart(5, '0');
const desenha = () => {
  if (!W) return;
  cx.clearRect(0, 0, W, H);
  const cy = chaoY();
  // nuvenzinhas ao fundo
  cx.save(); cx.globalAlpha = 0.35;
  nuvensF.forEach((n) => cx.drawImage(IM.nuvem, n.x, n.y, n.w, n.w * 107.2 / 171));
  cx.restore();
  // chão
  // moitas ao fundo (andam mais devagar que o chão)
  for (let x = matoX - MATO_P; x < W + MATO_W; x += MATO_P) cx.drawImage(IM.mato, x, cy - MATO_H + 4, MATO_W, MATO_H);
  for (let x = chaoX - CHAO_W; x < W; x += CHAO_W) cx.drawImage(IM.chao, Math.round(x), cy, CHAO_W + 1, CHAO_H);
  // pedras
  obst.forEach((o) => cx.drawImage(IM.pedra, o.x, cy - o.h + AFUNDA, o.w, o.h));
  // gatinho (inclina no ar e quica correndo)
  cx.save();
  const sx = player.x + player.w / 2, sy = player.y + player.h / 2;
  // menina (8 quadros do GIF, 80 ms cada) correndo à frente do cachorro
  const qm = estado === 'jogando' ? Math.floor(dist / 2.45) % 8 : 0;
  cx.drawImage(IM['m' + (qm + 1)], Math.round(menina.x), Math.round(menina.y + AFUNDA - 2), menina.w, menina.h);
  // cachorro: 6 quadros do GIF (agacha, impulso, sobe esticando, pico, voo, aterrissa)
  const corre = (player.noChao && estado === 'jogando');
  const q = corre ? Math.floor(dist / PASSO) % 6 : 0;
  const pose = player.noChao ? IM['cao' + (q + 1)] : IM.cao5; // no pulo: quadro do voo esticado
  const queda = AFUNDA - 2; // pés um pouco dentro da grama
  cx.translate(sx, sy + queda); if (!player.noChao) cx.rotate(Math.max(-0.12, Math.min(0.12, player.vy / 6500)));
  cx.drawImage(pose, -player.w / 2, -player.h / 2, player.w, player.h);
  cx.restore();
  // placar
  cx.fillStyle = '#102532'; cx.font = '600 15px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'right';
  cx.fillText('HI ' + pts5(recorde) + '   ' + pts5(dist), W - 58, 30);
  if (estado !== 'fim') { cx.fillStyle = '#2c4a5c'; cx.font = '600 13px ui-monospace, Menlo, Consolas, monospace'; cx.textAlign = 'left'; cx.fillText('restam ' + mmss(LIMITE - usado), 16, 28); }
  if (estado === 'fim') {
    cx.fillStyle = 'rgba(16,37,50,.72)'; cx.fillRect(0, 0, W, H);
    cx.fillStyle = '#fff'; cx.textAlign = 'center'; cx.font = '700 20px system-ui, sans-serif'; cx.fillText(motivo, W / 2, H / 2 - 6);
    cx.font = '600 15px system-ui, sans-serif'; cx.fillText('Volta ao trabalho!', W / 2, H / 2 + 22);
  }
  if (estado === 'morto') {
    const w = Math.min(230, W * 0.4), h = w * 15.5 / 31;
    cx.drawImage(IM.fim, (W - w) / 2, Math.max(16, (cy - h) / 2 - 6), w, h);
    cx.textAlign = 'center'; cx.font = '600 13px system-ui, sans-serif'; cx.fillStyle = '#102532';
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
