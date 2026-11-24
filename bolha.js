// Jogo da bolha (terça-feira): a bolha flutua e a pessoa toca perto dela para empurrar com o dedo.
// Se a bolha encostar nos espinhos da roseira em volta, ela estoura. Abre pelos mesmos gestos do jogo do cãozinho.
// Para testar: ?bolha (abre no dia que for) junto com ?cafe.
(() => {
const area = document.getElementById('cp-oi');
if (!area) return;
const V = window.PAINEL_VERSAO || '1';
const CT = 'cp-jogo-tempo', CR = 'cp-bolha-recorde', LIMITE = 8 * 60; // o tempo diário de 8 minutos é dividido com o jogo do cãozinho
const forca = /[?&](cafe|bolha)(=|&|$)/.test(location.search);
const janela = () => { const d = new Date(); return forca || (d.getHours() % 2 === 0 && d.getMinutes() < 15); };
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
// bolha: anel cinza/branco com dois reflexos em azul-água e rosa (17 x 17 quadradinhos)
const BU = 4, BN = 17;
const bolhaSpr = (() => {
  const c = document.createElement('canvas'); c.width = c.height = BN * BU; const g = c.getContext('2d');
  const R = 7.6;
  for (let j = 0; j < BN; j++) for (let i = 0; i < BN; i++) {
    const dx = i - 8, dy = j - 8, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx) * 180 / Math.PI; // a: 0 = direita, -90 = cima
    let cor = null;
    if (Math.abs(d - R) < 0.75) cor = ((a > -75 && a < -15) || (a > 105 && a < 165)) ? '#f2f4f8' : (Math.abs(a) < 40 || Math.abs(a) > 140 ? '#6b717d' : '#9aa0ab');
    else if (d > 4.7 && d < 6.7 && a > -80 && a < -12) cor = d < 5.5 ? '#ff7ee0' : (d > 6.1 && a < -50 ? '#e9fcff' : '#59dff0');
    else if (d > 4.9 && d < 6.4 && a > 98 && a < 168) cor = d < 5.6 ? '#ff7ee0' : '#59dff0';
    if (cor) { g.fillStyle = cor; g.fillRect(i * BU, j * BU, BU, BU); }
  }
  return c;
})();
const BR = BN * BU / 2; // raio da bolha em pixels
// dedinho que empurra (12 x 14 quadradinhos)
const DEDO = ['....KKKK....', '...KWWWWK...', '...KWWWWK...', '...KWWWWK...', '...KWWWWKKK.', '...KWWWWKWWK', '..KKWWWWKWWK', '.KSKWWWWWWWK', '.KSWWWWWWWWK', '.KSWWWWWWWWK', '..KSWWWWWWK.', '..KSWWWWWWK.', '...KSWWWWK..', '...KKKKKKK..'];
const dedoSpr = (() => {
  const u = 3, c = document.createElement('canvas'); c.width = 12 * u; c.height = DEDO.length * u; const g = c.getContext('2d');
  const cor = { K: '#2b3140', W: '#ffffff', S: '#c4cad6' };
  DEDO.forEach((l, j) => [...l].forEach((ch, i) => { if (cor[ch]) { g.fillStyle = cor[ch]; g.fillRect(i * u, j * u, u, u); } }));
  return c;
})();
// moldura de roseira: caule verde ondulado com espinhos para dentro e algumas rosas; cada lado é desenhado "em cima" e girado
let molduraC = null;
const moldura = () => {
  const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.imageSmoothingEnabled = false;
  const u = 4, R = { R: '#d62445', r: '#f0657c', D: '#8e1630' };
  const rosa = ['.RRR.', 'RrRrR', 'RRDRR', 'RrRrR', '.RRR.'];
  const cima = (comp) => {
    for (let p = 0; p < comp; p += u) {
      const y = 8 + (Math.sin(p / 46) > 0.35 ? u : 0); // o caule serpenteia 1 quadradinho
      g.fillStyle = '#35a24e'; g.fillRect(p, y, u, u); g.fillStyle = '#1f6a36'; g.fillRect(p, y + u, u, u);
      const n = p / u;
      if (n % 7 === 3) { // espinho: triangulo de 3 quadradinhos de altura
        g.fillStyle = '#f3e6ec'; g.fillRect(p - u, y + 2 * u, 3 * u, u); g.fillStyle = '#e1cdd7'; g.fillRect(p, y + 3 * u, 2 * u, u); g.fillStyle = '#ffffff'; g.fillRect(p, y + 4 * u, u, u);
      }
      if (n % 19 === 10) { // folha pendurada no caule
        g.fillStyle = '#4cc063'; g.fillRect(p, y - u, 2 * u, u); g.fillRect(p + u, y - 2 * u, u, u);
      }
      if (n % 37 === 18) { // rosa por cima do caule
        rosa.forEach((l, j) => [...l].forEach((ch, i) => { if (R[ch]) { g.fillStyle = R[ch]; g.fillRect(p - 2 * u + i * u, y - u + j * u, u, u); } }));
      }
    }
  };
  const lado = (tx, ty, ang, comp) => { g.save(); g.translate(tx, ty); g.rotate(ang); cima(comp); g.restore(); };
  lado(0, 0, 0, W); lado(W, H, Math.PI, W); lado(0, H, -Math.PI / 2, H); lado(W, 0, Math.PI / 2, H);
  molduraC = c;
};

// ---------- estado do jogo ----------
let aberto = false, estado = 'pronto', raf = 0, t0 = 0, tJogo = 0, morreuEm = 0, fimEm = 0, motivo = '';
let b, parts = [], dedos = [], vento = 0, rajada = 0, fase0 = 0, salva = 0;
const reinicia = () => {
  b = { x: W / 2, y: H / 2, vx: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 30), vy: -20, sq: 0, rot: 0 };
  parts = []; dedos = []; tJogo = 0; vento = 0; rajada = 2.5 + Math.random() * 2; fase0 = Math.random() * 6.28; salva = 0;
};
const empurra = (px, py) => {
  dedos.push({ x: px, y: py, t: 0 });
  const dx = b.x - px, dy = b.y - py, d = Math.hypot(dx, dy) || 1, alcance = BR + 80;
  if (d > alcance) return;
  const forcaP = 230 + 330 * (1 - d / alcance); // quanto mais perto do toque, mais forte o empurrão
  b.vx += dx / d * forcaP; b.vy += dy / d * forcaP;
  const v = Math.hypot(b.vx, b.vy), lim = 560; if (v > lim) { b.vx *= lim / v; b.vy *= lim / v; }
  b.sq = 1;
};
const estoura = () => {
  estado = 'estourando'; morreuEm = performance.now();
  const cores = ['#59dff0', '#ff7ee0', '#f2f4f8', '#9aa0ab'];
  for (let k = 0; k < 26; k++) { const a = Math.random() * 6.28, s = 80 + Math.random() * 220; parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, c: cores[k % 4], t: 0 }); }
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
    // vento: sopra para os lados e cresce com o tempo; de vez em quando vem uma rajada
    const dif = Math.min(1, tJogo / 90);
    rajada -= dt; if (rajada <= 0) { rajada = 3 + Math.random() * 3 - dif * 1.5; const lado = Math.random() < 0.5 ? -1 : 1; b.vx += lado * (60 + 120 * dif); b.vy += (Math.random() - 0.5) * (80 + 120 * dif); }
    vento = Math.sin(tJogo * 0.8 + fase0) * (35 + 110 * dif);
    b.vx += vento * dt; b.vy += (46 + 30 * dif) * dt + Math.sin(tJogo * 1.3 + fase0) * 20 * dt; // leve peso para baixo
    b.vx *= Math.pow(0.86, dt); b.vy *= Math.pow(0.86, dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.sq = Math.max(0, b.sq - dt * 3.2); b.rot += b.vx * dt * 0.004;
    const rr = BR * 0.88;
    if (b.x - rr < ZONA || b.x + rr > W - ZONA || b.y - rr < ZONA || b.y + rr > H - ZONA) estoura();
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
  // bolha (achata um pouco ao ser empurrada)
  if (estado !== 'estourando' && estado !== 'morto') {
    const s = Math.sin(agora / 260) * 0.03, q = b.sq * 0.12;
    const sx = 1 + s + q, sy = 1 - s - q;
    g.save(); g.translate(Math.round(b.x), Math.round(b.y)); g.scale(sx, sy); g.drawImage(bolhaSpr, -BR, -BR); g.restore();
  }
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
  aberto = true; box.hidden = false; mede(); reinicia(); estado = 'pronto';
  requestAnimationFrame(() => box.classList.add('on'));
  t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(passo);
  box.focus({ preventScroll: true });
};
const fecha = () => {
  if (!aberto) return;
  aberto = false; box.classList.remove('on'); cancelAnimationFrame(raf); gravaUso();
  setTimeout(() => { if (!aberto) box.hidden = true; }, 260);
};
window.cpBolha = { abre, fecha };
fechar.addEventListener('click', (e) => { e.stopPropagation(); fecha(); });
cv.addEventListener('pointerdown', toque);
window.addEventListener('resize', () => { if (aberto) mede(); });
document.addEventListener('keydown', (e) => { if (aberto && e.key === 'Escape') { e.preventDefault(); fecha(); } });
})();
