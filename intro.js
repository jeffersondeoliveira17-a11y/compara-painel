// Abertura do login: usa o mesmo tema do app (tabela tema_abertura do Supabase, lida sem login).
// Sem internet ou sem tema válido, vale o Natal embutido; a última resposta fica guardada neste navegador.
(function () {
  var box = document.getElementById('lg-intro'); if (!box) return;
  var C = window.PAINEL_CONFIG || {};
  var BANNER = (C.url || '') + '/functions/v1/banner?id=';
  var PADRAO = [{ nome: 'Natal 2026', inicio: '2026-11-15', fim: '2026-12-25', prioridade: 10, logo_padrao: 'natal', efeito: 'neve', efeito_cores: ['#FFFFFF'], efeito_quantidade: 84, efeito_tamanho: 'medio', efeito_velocidade: 'media', chao_neve: true }];
  var CH = 'cp-intro-tema';
  var CORES = { neve: ['#FFFFFF'], confete: ['#F5C542', '#FFFFFF', '#C9A227'], estrelas: ['#F5C542', '#FFFFFF'], coracoes: ['#E74C3C', '#FF7AA2'] };
  var VEL = { lenta: 1.45, media: 1, rapida: 0.62 }, TAM = { pequeno: 0.7, medio: 1, grande: 1.4 };
  var rnd = function (i, n) { var x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  var hoje = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  var temaDoDia = function (l) {
    var h = hoje();
    return (l || []).filter(function (t) { return (!t.inicio || t.inicio <= h) && (!t.fim || t.fim >= h); })
      .sort(function (a, b) { return ((b.prioridade || 0) - (a.prioridade || 0)) || String(b.inicio || '').localeCompare(String(a.inicio || '')); })[0] || null;
  };
  function particulas(t) {
    if (!t || !t.efeito || t.efeito === 'nenhum') return [];
    var n = Math.max(0, Math.min(160, t.efeito_quantidade == null ? 84 : t.efeito_quantidade));
    var k = TAM[t.efeito_tamanho] || 1, v = VEL[t.efeito_velocidade] || 1;
    var cores = t.efeito_cores && t.efeito_cores.length ? t.efeito_cores : (CORES[t.efeito] || ['#FFFFFF']);
    var r = [];
    for (var i = 0; i < n; i++) {
      var a = rnd(i, 2);
      var base = t.efeito === 'neve' ? (a < 0.55 ? 3 + Math.round(rnd(i, 8) * 2) : a < 0.87 ? 5 + Math.round(rnd(i, 8) * 3) : 8 + Math.round(rnd(i, 8) * 4))
        : t.efeito === 'confete' ? 6 + rnd(i, 8) * 5 : 8 + rnd(i, 8) * 8;
      var dur = (t.efeito === 'confete' ? 4200 + rnd(i, 3) * 5200 : t.efeito === 'estrelas' ? 2200 + rnd(i, 3) * 2600 : 6500 + Math.round(rnd(i, 3) * 11000)) * v;
      r.push({ tipo: t.efeito, x: (i * 0.618034 + rnd(i, 1) * 0.12) % 1, y: rnd(i, 7), tam: Math.round(base * k * 10) / 10, dur: Math.round(dur), p0: rnd(i, 4), bal: 4 + Math.round(rnd(i, 5) * 14), op: 0.6 + rnd(i, 6) * 0.4, cor: cores[i % cores.length], giro: rnd(i, 9) < 0.5 ? -1 : 1 });
    }
    return r;
  }
  var HEART = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="COR"/></svg>';
  var ultimo = '';
  function desenhar(t) {
    var W = box.clientWidth || 450, H = box.clientHeight || 600;
    var chao = !!(t && t.chao_neve), altChao = Math.round(W * 236 / 966);
    var fundo = t && t.fundo_id ? BANNER + t.fundo_id : 'intro/fundo.jpg';
    var natal = !!(t && !t.logo_id && t.logo_padrao === 'natal');
    var logo = '';
    if (t && t.logo_id) logo = '<img class="lg-logo" style="width:' + (66.9 * (t.logo_escala || 100) / 100).toFixed(1) + '%;top:' + (t.logo_altura || 48) + '%" src="' + BANNER + t.logo_id + '" alt="">';
    else logo = '<img class="lg-logo" src="intro/' + (natal ? 'logo.png' : 'logo-original.png') + '" alt="">';
    var escala = Math.max(0.35, Math.min(1, W * H / (450 * 600)));
    var ps = particulas(t); if (escala < 1) ps = ps.filter(function (p, i) { return i % 100 < escala * 100; });
    var fim = chao ? H - Math.round(altChao * 0.55) : H + 12;
    var h = '';
    ps.forEach(function (f) {
      var left = (f.x * (W - f.tam)).toFixed(1), d = (f.dur / 1000).toFixed(2), dl = '-' + (f.p0 * f.dur / 1000).toFixed(2) + 's';
      var vars = '--o:' + f.op.toFixed(2) + ';--b:' + (f.bal * (f.giro)) + 'px;--h:' + fim + 'px;';
      if (f.tipo === 'estrelas') {
        h += '<i class="est" style="left:' + left + 'px;top:' + Math.round((0.06 + f.y * 0.88) * H) + 'px;font-size:' + Math.round(f.tam * 1.5) + 'px;color:' + f.cor + ';--o:' + f.op.toFixed(2) + ';animation-duration:' + d + 's;animation-delay:' + dl + '">✦</i>';
      } else if (f.tipo === 'confete') {
        h += '<i style="left:' + left + 'px;width:' + f.tam + 'px;height:' + Math.max(2, Math.round(f.tam * 0.45)) + 'px;background:' + f.cor + ';border-radius:1px;' + vars + '--g:' + (f.giro * 360) + 'deg;animation-name:lgConf;animation-duration:' + d + 's;animation-delay:' + dl + '"></i>';
      } else if (f.tipo === 'coracoes') {
        var l = Math.round(f.tam * 1.3);
        h += '<i style="left:' + left + 'px;width:' + l + 'px;height:' + l + 'px;background:none;' + vars + 'animation-duration:' + d + 's;animation-delay:' + dl + '">' + HEART.replace('COR', f.cor) + '</i>';
      } else {
        h += '<i style="left:' + left + 'px;width:' + f.tam + 'px;height:' + f.tam + 'px;' + vars + 'animation-duration:' + d + 's;animation-delay:' + dl + '"></i>';
      }
    });
    box.style.backgroundImage = 'url("' + fundo + '")';
    box.innerHTML = '<div class="lg-nv">' + h + '</div>' + logo + (chao ? '<img class="lg-chao" src="intro/neve-chao.png" alt="">' : '');
  }
  function aplicar(lista) {
    var t = temaDoDia(lista), chave = JSON.stringify(t) + box.clientWidth + 'x' + box.clientHeight;
    if (chave === ultimo) return; ultimo = chave; desenhar(t);
  }
  var guardado = null; try { guardado = JSON.parse(localStorage.getItem(CH)); } catch (e) {}
  var atual = Array.isArray(guardado) ? guardado : PADRAO;
  aplicar(atual);
  var campos = 'nome,inicio,fim,prioridade,fundo_id,logo_id,logo_padrao,logo_escala,logo_altura,efeito,efeito_cores,efeito_quantidade,efeito_tamanho,efeito_velocidade,chao_neve';
  if (C.url && C.chave && window.fetch) {
    fetch(C.url + '/rest/v1/tema_abertura?select=' + campos + '&status=eq.ativa', { headers: { apikey: C.chave } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (l) { if (!Array.isArray(l)) return; atual = l.length ? l : PADRAO; try { localStorage.setItem(CH, JSON.stringify(atual)); } catch (e) {} aplicar(atual); })
      .catch(function () {});
  }
  var tm; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { aplicar(atual); }, 250); });
})();
