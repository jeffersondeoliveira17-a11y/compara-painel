
window.cpNum = new Intl.NumberFormat('pt-BR');
window.cpDec = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
window.cpBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
window.cpBRL0 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
window.cpPct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
window.cpDay = d3.utcFormat('%d/%m');
window.cpParse = d3.utcParse('%Y-%m-%d');
window.cpACC = 'var(--cp-acc)';
window.cpMUT = 'var(--cp-mut)';

dash.calc('kpi', {
title: 'Indicadores da última semana',
description: 'Última semana comparada com a anterior.',
inputs: ['semanas'],
fn: (semanas) => {
if (semanas.length < 2) return [];
const s = semanas.slice().sort((a, b) => String(a.semana).localeCompare(String(b.semana)));
const at = s[s.length - 1], an = s[s.length - 2];
const n = (v) => Number(v);
const cpu = (r) => n(r.conferencias) / n(r.usuarios_ativos);
return [{
semana: at.semana,
usuarios: n(at.usuarios_ativos),
var_usuarios: n(at.usuarios_ativos) / n(an.usuarios_ativos) - 1,
conf_por_usuario: Math.round(cpu(at) * 10) / 10,
var_conf: cpu(at) / cpu(an) - 1,
divergencias: n(at.divergencias),
itens: n(at.itens_conferidos),
taxa_div: n(at.divergencias) / n(at.itens_conferidos),
cobrado: n(at.cobrado_a_mais),
var_cobrado: n(at.cobrado_a_mais) / n(an.cobrado_a_mais) - 1
}];
}
});

dash.calc('taxa_rede', {
title: 'Divergências a cada 100 conferências',
description: 'Por rede, nas últimas 4 semanas.',
inputs: ['redes'],
fn: (redes) => redes.map((r) => ({
rede: r.rede,
conferencias: Number(r.conferencias),
divergencias: Number(r.divergencias),
por_100: Math.round(Number(r.divergencias) / Number(r.conferencias) * 1000) / 10
})).sort((a, b) => b.por_100 - a.por_100)
});

dash.calc('qualidade_pct', {
title: 'Parte dos preços aceitos',
description: 'Preços válidos sobre todos os enviados.',
inputs: ['qualidade'],
fn: (qualidade) => {
const tot = d3.sum(qualidade, (r) => Number(r.registros));
const ok = d3.sum(qualidade.filter((r) => r.status === 'Válido'), (r) => Number(r.registros));
return tot ? ok / tot : null;
}
});

dash.calc('cobertura_pct', {
title: 'Produtos com 5 ou mais registros',
description: 'Parte do catálogo pronta para o radar.',
inputs: ['cobertura'],
fn: (cobertura) => {
const tot = d3.sum(cobertura, (r) => Number(r.produtos));
const ok = d3.sum(cobertura.filter((r) => r.faixa === '5 ou mais'), (r) => Number(r.produtos));
return tot ? ok / tot : null;
}
});

window.cpOnce = (id, fmt, cls) => (el) => {
const d = dash.data(id);
if (d.status !== 'ok' || d.data == null || (Array.isArray(d.data) && !d.data.length)) { el.textContent = '—'; return; }
el.textContent = fmt(d.data);
if (cls) el.className = cls(d.data);
};
window.cpVar = (field, goodUp) => cpOnce('kpi', (r) => {
const v = r[0][field];
return (v > 0 ? '▲ +' : v < 0 ? '▼ ' : '') + cpPct.format(v).replace('-', '−');
}, (r) => {
const v = r[0][field];
if (goodUp === null || Math.abs(v) < 0.005) return 'cp-flat';
return (v > 0) === goodUp ? 'cp-up' : 'cp-down';
});

dash.draw('semana', cpOnce('kpi', (r) => cpDay(cpParse(r[0].semana))));
dash.draw('k-usuarios', cpOnce('kpi', (r) => cpNum.format(r[0].usuarios)));
dash.draw('k-div-lead', cpOnce('kpi', (r) => cpNum.format(r[0].divergencias)));
dash.draw('k-cobrado-lead', cpOnce('kpi', (r) => cpBRL.format(r[0].cobrado)));
dash.draw('t-usuarios', cpOnce('kpi', (r) => cpNum.format(r[0].usuarios)));
dash.draw('t-conf', cpOnce('kpi', (r) => cpDec.format(r[0].conf_por_usuario)));
dash.draw('t-taxa', cpOnce('kpi', (r) => cpPct.format(r[0].taxa_div)));
dash.draw('t-div', cpOnce('kpi', (r) => cpNum.format(r[0].divergencias)));
dash.draw('t-itens', cpOnce('kpi', (r) => cpNum.format(r[0].itens)));
dash.draw('t-cobrado', cpOnce('kpi', (r) => cpBRL.format(r[0].cobrado)));
dash.draw('v-usuarios', cpVar('var_usuarios', true));
dash.draw('v-conf', cpVar('var_conf', true));
dash.draw('v-cobrado', cpVar('var_cobrado', null));
dash.draw('q-valido', cpOnce('qualidade_pct', (v) => cpPct.format(v)));
dash.draw('c-pct', cpOnce('cobertura_pct', (v) => cpPct.format(v)));
dash.draw('leg0', (el) => { el.style.background = cpACC; });
dash.draw('leg1', (el) => { el.style.background = cpMUT; });

window.cpTip = (el) => {
let tt = el.querySelector(':scope > .cp-tt');
if (!tt) { tt = document.createElement('div'); tt.className = 'cp-tt'; tt.hidden = true; el.appendChild(tt); }
return {
show(ev, lines) {
tt.replaceChildren(...lines.map(([k, v]) => { const d = document.createElement('div'); if (k) { const s = document.createElement('span'); s.textContent = k + ' '; d.appendChild(s); } d.appendChild(document.createTextNode(v)); return d; }));
tt.hidden = false;
const box = el.getBoundingClientRect();
let x = ev.clientX - box.left + 12;
const y = ev.clientY - box.top - 10;
const w = tt.offsetWidth;
if (x + w > box.width) x = Math.max(0, ev.clientX - box.left - w - 12);
tt.style.left = x + 'px'; tt.style.top = Math.max(0, y) + 'px';
},
hide() { tt.hidden = true; }
};
};

window.cpEmpty = (el, d) => {
el.replaceChildren();
if (d.status === 'error') { const p = document.createElement('div'); p.className = 'cp-fail'; p.textContent = 'Não carregou.'; el.appendChild(p); }
};

window.cpVBars = (el, rows, o) => {
el.replaceChildren();
const W = el.clientWidth || 400, H = o.H;
const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', o.aria);
const y = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.v) * 1.12 || 1]).nice().range([H - 30, 10]);
const yt = svg.append('g').call(d3.axisLeft(y).ticks(o.ticks || 4).tickFormat(o.fmtAxis).tickSize(0));
let ml = 0; yt.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength()); });
ml = Math.ceil(ml) + 14;
yt.attr('transform', `translate(${ml - 8},0)`).call((g) => g.select('.domain').remove());
const x = d3.scaleBand().domain(rows.map((_, i) => i)).range([ml + 8, W - 8]).padding(o.pad || 0.42);
svg.insert('rect', ':first-child').attr('x', ml).attr('y', 4).attr('width', W - ml - 1).attr('height', H - 34).attr('rx', 10)
.style('fill', 'var(--cp-bg)').style('stroke', 'var(--color-border-line)');
svg.insert('g', 'g').selectAll('line').data(y.ticks(o.ticks || 4).slice(1)).join('line')
.attr('x1', ml).attr('x2', W - 1).attr('y1', (v) => y(v)).attr('y2', (v) => y(v)).style('stroke', 'var(--cds-chart-grid)');
const lab = svg.append('g');
const every = o.every || Math.max(1, Math.ceil(rows.length / Math.max(2, Math.floor((W - ml) / 46))));
const txts = [];
rows.forEach((r, i) => {
if ((rows.length - 1 - i) % every) return;
txts.push([lab.append('text').attr('x', x(i) + x.bandwidth() / 2).attr('y', H - 10).attr('text-anchor', 'middle').text(r.label), r]);
});
if (o.short && txts.some(([t]) => t.node().getComputedTextLength() > x.step() * every - 4)) txts.forEach(([t, r]) => t.text(o.short(r)));
const tip = cpTip(el);
svg.append('g').selectAll('rect').data(rows).join('rect')
.attr('x', (_, i) => x(i)).attr('width', x.bandwidth())
.attr('y', (r) => y(r.v)).attr('height', (r) => Math.max(0, y(0) - y(r.v))).attr('rx', Math.min(5, x.bandwidth() / 3))
.style('fill', (_, i) => (i === o.hi ? cpACC : cpMUT))
.on('pointermove', (ev, r) => tip.show(ev, o.tip(r)))
.on('pointerleave', () => tip.hide());
if (o.hi != null && rows[o.hi]) {
const r = rows[o.hi];
svg.append('text').attr('class', 'cp-vlabel').attr('text-anchor', 'middle').attr('x', x(o.hi) + x.bandwidth() / 2).attr('y', y(r.v) - 6).text(o.fmtVal(r.v));
}
};

dash.draw('ch-cobrado', (el) => {
const d = dash.data('semanas');
if (d.status !== 'ok' || !d.data.length) { cpEmpty(el, d); return; }
const rows = d.data.map((r) => ({ t: cpParse(r.semana), v: +r.cobrado_a_mais }))
.sort((a, b) => a.t - b.t).map((r) => ({ ...r, label: cpDay(r.t) }));
cpVBars(el, rows, {
H: 270, hi: rows.length - 1, pad: 0.45,
aria: 'Barras do valor cobrado a mais por semana, em reais, com a última semana em destaque',
fmtAxis: (v) => cpBRL0.format(v), fmtVal: (v) => cpBRL0.format(v),
tip: (r) => [['', 'Semana de ' + r.label], ['Cobrado a mais', cpBRL.format(r.v)]]
});
});

dash.draw('ch-rede', (el) => {
const d = dash.data('taxa_rede');
if (d.status !== 'ok' || !d.data || !d.data.length) { cpEmpty(el, d); return; }
const rows = d.data.map((r) => ({ label: r.rede, v: r.por_100, r }));
cpVBars(el, rows, {
H: 180, hi: 0, pad: 0.38, ticks: 3, every: 1,
aria: 'Barras de divergências a cada 100 conferências por rede, com a maior em destaque',
fmtAxis: (v) => cpNum.format(v), fmtVal: (v) => cpDec.format(v),
short: (r) => String(r.label).split(' ').pop(),
tip: (b) => [['', b.label], ['A cada 100 conferências', cpDec.format(b.v)], ['Divergências', cpNum.format(b.r.divergencias)], ['Conferências', cpNum.format(b.r.conferencias)]]
});
});

dash.draw('ch-uso', (el) => {
const d = dash.data('semanas');
if (d.status !== 'ok' || !d.data.length) { cpEmpty(el, d); return; }
const rows = d.data.map((r) => ({ t: cpParse(r.semana), u: +r.usuarios_ativos, c: +r.conferencias })).sort((a, b) => a.t - b.t);
el.replaceChildren();
const W = el.clientWidth || 260, H = 170;
const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
.attr('aria-label', 'Linhas de usuários ativos e conferências por semana nas últimas 12 semanas');
const y = d3.scaleLinear().domain([0, d3.max(rows, (r) => Math.max(r.u, r.c)) * 1.08]).nice().range([H - 24, 8]);
const yt = svg.append('g').call(d3.axisLeft(y).ticks(3).tickFormat((v) => cpNum.format(v)).tickSize(0));
let ml = 0; yt.selectAll('text').each(function () { ml = Math.max(ml, this.getComputedTextLength()); });
ml = Math.ceil(ml) + 10;
const last = rows[rows.length - 1];
const probe = svg.append('text').attr('class', 'cp-vlabel').text(cpNum.format(last.c));
const mr = Math.ceil(probe.node().getComputedTextLength()) + 10; probe.remove();
const x = d3.scaleUtc().domain(d3.extent(rows, (r) => r.t)).range([ml, W - mr]);
yt.attr('transform', `translate(${ml - 6},0)`).call((g) => g.select('.domain').remove());
svg.insert('g', ':first-child').selectAll('line').data(y.ticks(3)).join('line')
.attr('x1', ml).attr('x2', W - mr).attr('y1', (v) => y(v)).attr('y2', (v) => y(v)).style('stroke', 'var(--cds-chart-grid)');
const ticks = [rows[0].t, last.t];
svg.append('g').attr('transform', `translate(0,${H - 24})`)
.call(d3.axisBottom(x).tickValues(ticks).tickFormat(cpDay).tickSize(0).tickPadding(8))
.call((g) => g.select('.domain').style('stroke', 'var(--cds-chart-axis)'))
.call((g) => g.selectAll('text').attr('text-anchor', (_, i) => (i === 0 ? 'start' : 'end')));
[['c', cpMUT], ['u', cpACC]].forEach(([k, col]) => {
svg.append('path').datum(rows).attr('fill', 'none').style('stroke', col).attr('stroke-width', 2.2)
.attr('d', d3.line().x((r) => x(r.t)).y((r) => y(r[k])));
svg.append('circle').attr('cx', x(last.t)).attr('cy', y(last[k])).attr('r', 3.5).style('fill', col);
});
const ly = [y(last.u), y(last.c)];
if (Math.abs(ly[0] - ly[1]) < 14) { if (ly[0] > ly[1]) ly[0] = ly[1] + 14; else ly[1] = ly[0] + 14; }
svg.append('text').attr('class', 'cp-vlabel').attr('x', x(last.t) + 6).attr('y', ly[0] + 4).text(cpNum.format(last.u));
svg.append('text').attr('class', 'cp-vlabel').attr('x', x(last.t) + 6).attr('y', ly[1] + 4).text(cpNum.format(last.c));
const tip = cpTip(el);
const guide = svg.append('line').attr('y1', 8).attr('y2', H - 24).style('stroke', 'var(--cds-chart-reference)').attr('opacity', 0);
svg.append('rect').attr('x', ml).attr('y', 0).attr('width', Math.max(0, W - ml - mr)).attr('height', H - 24).attr('fill', 'transparent')
.on('pointermove', (ev) => {
const [px] = d3.pointer(ev);
const t = x.invert(px), r = rows[d3.leastIndex(rows, (q) => Math.abs(q.t - t))];
guide.attr('x1', x(r.t)).attr('x2', x(r.t)).attr('opacity', 1);
tip.show(ev, [['', 'Semana de ' + cpDay(r.t)], ['Usuários ativos', cpNum.format(r.u)], ['Conferências', cpNum.format(r.c)]]);
})
.on('pointerleave', () => { guide.attr('opacity', 0); tip.hide(); });
});

window.cpHBars = (el, rows, opts) => {
el.replaceChildren();
const W = el.clientWidth || 260, bh = 18, gap = 9, H = rows.length * (bh + gap);
const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', opts.aria);
const probe = svg.append('g');
let ml = 0, mr = 0;
rows.forEach((r) => { const t = probe.append('text').text(r.label); ml = Math.max(ml, t.node().getComputedTextLength()); const u = probe.append('text').attr('class', 'cp-vlabel').text(opts.fmt(r.v)); mr = Math.max(mr, u.node().getComputedTextLength()); });
probe.remove(); ml = Math.ceil(ml) + 10; mr = Math.ceil(mr) + 8;
const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.v) || 1]).range([ml, Math.max(ml + 20, W - mr)]);
const tip = cpTip(el);
const g = svg.selectAll('g.row').data(rows).join('g').attr('class', 'row').attr('transform', (_, i) => `translate(0,${i * (bh + gap)})`);
g.append('text').attr('x', ml - 8).attr('y', bh / 2 + 4).attr('text-anchor', 'end').text((r) => r.label);
g.append('rect').attr('x', ml).attr('y', 0).attr('height', bh).attr('rx', 4).attr('width', (r) => Math.max(1, x(r.v) - ml))
.style('fill', (r, i) => opts.color(r, i))
.on('pointermove', (ev, r) => tip.show(ev, opts.tip(r)))
.on('pointerleave', () => tip.hide());
g.append('text').attr('class', 'cp-vlabel').attr('x', (r) => x(r.v) + 6).attr('y', bh / 2 + 4).text((r) => opts.fmt(r.v));
};

dash.draw('ch-qualidade', (el) => {
const d = dash.data('qualidade');
if (d.status !== 'ok' || !d.data.length) { cpEmpty(el, d); return; }
const tot = d3.sum(d.data, (r) => +r.registros);
const cor = { 'Válido': 'var(--color-ok)', 'Em quarentena': 'var(--color-warn)', 'Rejeitado': 'var(--color-bad)' };
cpHBars(el, d.data.map((r) => ({ label: r.status, v: +r.registros })), {
aria: 'Barras de preços válidos, em quarentena e rejeitados',
fmt: (v) => cpNum.format(v),
color: (b) => cor[b.label] || cpACC,
tip: (b) => [['', b.label], ['Preços', cpNum.format(b.v)], ['Do total', cpPct.format(b.v / tot)]]
});
});

dash.draw('ch-cobertura', (el) => {
const d = dash.data('cobertura');
if (d.status !== 'ok' || !d.data.length) { cpEmpty(el, d); return; }
const tot = d3.sum(d.data, (r) => +r.produtos);
cpHBars(el, d.data.map((r) => ({ label: r.faixa, v: +r.produtos })), {
aria: 'Barras de produtos por número de registros de preço',
fmt: (v) => cpNum.format(v),
color: (b) => (b.label === '5 ou mais' ? cpACC : cpMUT),
tip: (b) => [['', b.label], ['Produtos', cpNum.format(b.v)], ['Do catálogo', cpPct.format(b.v / tot)]]
});
});

dash.draw('tb-produtos', (tb) => {
const d = dash.data('produtos');
tb.replaceChildren();
if (d.status !== 'ok') return;
d.data.slice().sort((a, b) => +b.registros - +a.registros).forEach((r) => {
const tr = document.createElement('tr');
const td = (v, c) => { const e = document.createElement('td'); if (c) e.className = c; if (v instanceof Node) e.appendChild(v); else e.textContent = v; tr.appendChild(e); };
td(r.produto, 'cp-nome');
const pill = document.createElement('span'); pill.className = 'cp-cat'; pill.textContent = r.categoria; td(pill);
td(cpNum.format(+r.registros), 'cp-num');
td(cpNum.format(+r.lojas), 'cp-num');
td(cpBRL.format(+r.ultimo_preco), 'cp-num');
tb.appendChild(tr);
});
});

window.cpAbrir = (id, rolar) => {
const secs = document.querySelectorAll('.cp-sec');
let achou = false;
secs.forEach((s) => { if (s.id === id) achou = true; });
if (!achou) id = 'setores';
secs.forEach((s) => { if (s.id !== id) s.classList.remove('cp-troca'); s.hidden = s.id !== id; });
const vis = document.querySelector('section.cp-sec#' + id);
if (vis) { vis.classList.remove('cp-troca'); void vis.offsetWidth; vis.classList.add('cp-troca'); }
const navs = document.querySelectorAll('[data-nav]');
let temNoMenu = false;
navs.forEach((b) => { if (b.getAttribute('data-nav') === id) temNoMenu = true; });
const ativo = temNoMenu ? id : 'setores';
navs.forEach((b) => {
if (b.getAttribute('data-nav') === ativo) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
});
dash.setLink(id);
if (rolar) document.querySelectorAll('.cp-app').forEach((a) => a.scrollIntoView({ block: 'start' }));
};
document.querySelectorAll('.cp-app').forEach((app) => {
app.addEventListener('click', (ev) => {
const alvo = ev.target.closest('[data-go]');
if (!alvo || !app.contains(alvo)) return;
ev.preventDefault();
cpAbrir(alvo.getAttribute('data-go'), true);
});
});
document.querySelectorAll('.cp-sec').forEach((s) => {
let i = 0;
s.querySelectorAll('.cp-sc, .cp-box, .cp-card, .cp-pronto').forEach((c) => { if (!c.closest('.cp-box') || c.classList.contains('cp-box')) c.style.setProperty('--i', i++); });
});
cpAbrir(decodeURIComponent((location.hash || '').slice(1)) || 'setores', false);


(() => {
const app = document.querySelector('.cp-app');
document.querySelectorAll('.cp-item[data-nav]').forEach((it) => {
let rot = it.querySelector(':scope > span:not(.cp-conta)');
if (!rot) {
const nos = [...it.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
const t = nos.map((n) => n.textContent.trim()).join(' ');
nos.forEach((n) => n.remove());
rot = document.createElement('span'); rot.textContent = t; it.append(rot);
}
rot.classList.add('cp-rot');
const texto = rot.textContent.trim();
const conta = document.createElement('span'); conta.className = 'cp-conta'; conta.id = 'conta-' + it.getAttribute('data-nav');
it.append(conta);
it.title = texto;
const pag = document.getElementById(it.getAttribute('data-nav'));
const links = pag ? [...pag.querySelectorAll('a.cp-abrir')] : [];
if (!links.length) return;
const abre = document.createElement('button');
abre.type = 'button'; abre.className = 'cp-abre'; abre.setAttribute('aria-expanded', 'false');
abre.setAttribute('aria-label', 'Mostrar o que há em ' + texto);
abre.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
it.append(abre);
const sub = document.createElement('div');
sub.className = 'cp-sub';
const verSetor = document.createElement('button');
verSetor.type = 'button'; verSetor.textContent = 'Ver o setor';
verSetor.addEventListener('click', () => { if (typeof cpAbrir === 'function') cpAbrir(it.getAttribute('data-nav'), true); });
sub.append(verSetor);
links.forEach((a) => {
const b = document.createElement('a');
b.href = a.href; b.target = '_blank'; b.rel = 'noopener';
b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>';
b.append(a.textContent.replace(/^Abrir\s+(o|a|os|as)?\s*/i, '').replace(/\s*›\s*$/, '').replace(/^./, (c) => c.toUpperCase()));
sub.append(b);
});
it.after(sub);
abre.addEventListener('click', (e) => {
e.stopPropagation();
const ab = !sub.classList.contains('aberto');
sub.classList.toggle('aberto', ab);
abre.setAttribute('aria-expanded', String(ab));
});
});
const marcar = () => {
document.querySelectorAll('.cp-item[data-nav]').forEach((it) => {
const sub = it.nextElementSibling;
if (!sub || !sub.classList.contains('cp-sub')) return;
const aqui = it.getAttribute('aria-current') === 'page';
if (aqui) { sub.classList.add('aberto'); const b = it.querySelector('.cp-abre'); if (b) b.setAttribute('aria-expanded', 'true'); }
});
};
marcar();
document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => setTimeout(marcar, 30)));
window.addEventListener('hashchange', () => setTimeout(marcar, 30));

const bt = document.getElementById('cp-encolher');
const aplicar = (v) => {
app.classList.toggle('estreito', v);
bt.setAttribute('aria-label', v ? 'Abrir o menu' : 'Encolher o menu');
bt.title = v ? 'Abrir o menu' : 'Encolher o menu';
};
let guardado = false;
try { guardado = localStorage.getItem('cp-menu-estreito') === '1'; } catch (e) { /* segue */ }
aplicar(guardado);
bt.addEventListener('click', () => {
const v = !app.classList.contains('estreito');
aplicar(v);
try { localStorage.setItem('cp-menu-estreito', v ? '1' : '0'); } catch (e) { /* segue */ }
});
})();
(() => {
const semAcento = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const itens = [];
document.querySelectorAll('.cp-sc').forEach((c) => {
const id = c.getAttribute('data-go');
const tit = (c.querySelector('h3') || {}).textContent || '';
const sub = (c.querySelector('.cp-sc-sub') || {}).textContent || '';
const corpo = (c.querySelector('.cp-sc-body') || {}).textContent || '';
const pronto = !!c.querySelector('.cp-chip-ok');
itens.push({ tipo: 'setor', id, tit, sub: sub + (pronto ? '' : ' · em breve'), busca: semAcento(tit + ' ' + sub + ' ' + corpo + ' ' + id) });
});
document.querySelectorAll('.cp-page').forEach((p) => {
const setor = p.id;
const nome = ((p.querySelector('h1') || {}).textContent || setor).trim();
p.querySelectorAll('a.cp-abrir').forEach((a) => {
const t = a.textContent.replace(/\s*›\s*$/, '').trim();
itens.push({ tipo: 'editor', href: a.href, tit: t, sub: 'Editor do setor ' + nome, busca: semAcento(t + ' ' + nome + ' editor') });
});
});
const extras = [
['lojas endereco endereços coordenada cnpj mapa distancia', 'Lojas e endereços', 'redes'],
['erro erros reportados bug mensagem sugestao sugestões usuarios resposta', 'Sugestões e erros', 'sugestoes'],
['promocao promoções cupom cupons banner cartaz', 'Banners e promoções', 'promocoes'],
['receita receitas ingredientes', 'Receitas', 'receitas'],
['tema natal neve abertura logo fundo efeito', 'Aparência e temas', 'aparencia'],
['numeros metricas grafico conferencias divergencias semana', 'Visão geral', 'visao-geral'],
['agenda calendario lembrete lembretes reuniao evento compromisso data', 'Agenda', 'agenda'],
];
extras.forEach(([k, tit, id]) => itens.push({ tipo: 'atalho', id, tit, sub: 'Ir para o setor', busca: semAcento(k + ' ' + tit) }));

const q = document.getElementById('cp-q'), acha = document.getElementById('cp-acha');
let sel = -1, achados = [];
const fechaBusca = () => { acha.hidden = true; sel = -1; };
const irPara = (it) => {
fechaBusca(); q.value = '';
if (it.href) window.open(it.href, '_blank', 'noopener');
else if (typeof cpAbrir === 'function') cpAbrir(it.id, true);
};
const desenhaBusca = () => {
const t = semAcento(q.value.trim());
if (t.length < 2) { fechaBusca(); return; }
const vistos = new Set();
achados = itens.filter((i) => i.busca.includes(t)).filter((i) => { const k = i.tipo + (i.id || i.href); if (vistos.has(k)) return false; vistos.add(k); return true; }).slice(0, 8);
acha.replaceChildren();
if (!achados.length) { const d = document.createElement('div'); d.className = 'vazio'; d.textContent = 'Nada com “' + q.value.trim() + '”. Tente promoções, receitas, lojas, erros, temas…'; acha.append(d); }
achados.forEach((it, k) => {
const b = document.createElement('button');
b.type = 'button'; b.setAttribute('aria-selected', String(k === sel));
const n = document.createElement('b'); n.textContent = it.tit;
const s = document.createElement('span'); s.textContent = (it.tipo === 'editor' ? 'Abre em outra aba · ' : '') + it.sub;
b.append(n, s); b.addEventListener('click', () => irPara(it)); acha.append(b);
});
acha.hidden = false;
};
q.addEventListener('input', () => { sel = -1; desenhaBusca(); });
q.addEventListener('keydown', (e) => {
if (acha.hidden || !achados.length) return;
if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % achados.length; desenhaBusca(); }
else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + achados.length) % achados.length; desenhaBusca(); }
else if (e.key === 'Enter') { e.preventDefault(); irPara(achados[Math.max(0, sel)]); }
else if (e.key === 'Escape') fechaBusca();
});
document.addEventListener('click', (e) => { if (!e.target.closest('.cp-busca')) fechaBusca(); });
document.addEventListener('keydown', (e) => { if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement !== q) { e.preventDefault(); q.focus(); } });

const liga = (bt, menu) => {
bt.addEventListener('click', (e) => {
e.stopPropagation();
const abrir = menu.hidden;
document.querySelectorAll('.cp-menu').forEach((m) => { m.hidden = true; });
document.querySelectorAll('.cp-sino, .cp-perfil').forEach((b) => b.setAttribute('aria-expanded', 'false'));
menu.hidden = !abrir; bt.setAttribute('aria-expanded', String(abrir));
});
};
const sino = document.getElementById('cp-sino'), avisos = document.getElementById('cp-avisos');
const perfil = document.getElementById('cp-perfil'), menuP = document.getElementById('cp-menu-perfil');
liga(sino, avisos); liga(perfil, menuP);
document.addEventListener('click', (e) => { if (!e.target.closest('.cp-pop')) { avisos.hidden = true; menuP.hidden = true; sino.setAttribute('aria-expanded', 'false'); perfil.setAttribute('aria-expanded', 'false'); } });
menuP.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { menuP.hidden = true; }));

const corpo = document.getElementById('cp-avisos-corpo');
const linha = (titulo, texto, ir) => {
const b = document.createElement(ir ? 'button' : 'div');
b.className = 'it'; if (ir) { b.type = 'button'; b.addEventListener('click', () => { avisos.hidden = true; if (ir === '__cal') { const c = document.getElementById('cp-cal'); if (c) c.click(); } else if (typeof cpAbrir === 'function') cpAbrir(ir, true); }); }
const n = document.createElement('b'); n.textContent = titulo;
const s = document.createElement('small'); s.textContent = texto;
b.append(n, s); return b;
};
(async () => {
let mcp = null;
const dt = document.getElementById('cp-oi-data');
if (dt) { const w = new Date(), c = (t) => t.charAt(0).toUpperCase() + t.slice(1); dt.textContent = w.getDate() + ' de ' + c(w.toLocaleDateString('pt-BR', { month: 'long' })) + '\n' + c(w.toLocaleDateString('pt-BR', { weekday: 'long' })); }
const hojeL = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch (e) { mcp = null; }
if (!mcp) { corpo.replaceChildren(linha('Avisos ainda não ligados', 'Para contar mensagens novas aqui, o painel precisa do Supabase liberado nesta página. Por enquanto, abra o setor Sugestões.', 'sugestoes')); return; }
try {
const res = await mcp.callTool('Supabase', 'execute_sql', { project_id: 'ckhaolaprrtvwoadnnty', query: `select json_build_object(
'erros', (select count(*) from public.sugestoes where tipo = 'problema' and status = 'recebida'),
'mensagens', (select count(*) from public.sugestoes where status = 'recebida'),
'sem_resposta', (select count(*) from public.sugestoes where resposta is null and status <> 'arquivada'),
'promos_vencendo', (select count(*) from public.campanha where status = 'ativa' and fim is not null and fim between current_date and current_date + 3),
'lojas_sem_coord', (select count(*) from public.loja where status = 'ativa' and local is null),
'lembretes', (select count(*) from public.lembrete where status = 'ativo' and not feito and data <= '${hojeL}'::date)) as r;` }, { cache: false });
let p = res && res.payload !== undefined ? res.payload : res;
if (p && typeof p === 'object' && typeof p.result === 'string') p = p.result;
let dados = null;
if (typeof p === 'string') {
const fim = p.lastIndexOf('</untrusted-data');
if (fim > -1) { const ini = p.lastIndexOf('<untrusted-data-', fim); const f2 = ini > -1 ? p.indexOf('>', ini) : -1; if (f2 > -1) p = p.slice(f2 + 1, fim).trim(); }
dados = JSON.parse(p);
} else dados = p;
const d = (Array.isArray(dados) ? dados[0] : dados).r || {};
const cs = document.getElementById('cp-oi-chips');
if (cs) {
const chip = (n, t, cl, ir) => { const b = document.createElement('button'); b.type = 'button'; b.className = cl; const x = document.createElement('b'); x.textContent = n; b.append(x, ' ' + t); b.addEventListener('click', () => { if (ir === '__cal') { const c = document.getElementById('cp-cal'); if (c) c.click(); } else if (typeof cpAbrir === 'function') cpAbrir(ir, true); }); cs.append(b); };
const nv = (d.mensagens || 0) - (d.erros || 0);
if (d.lembretes) chip(d.lembretes, d.lembretes === 1 ? 'lembrete hoje' : 'lembretes hoje', 'a', '__cal');
if (d.erros) chip(d.erros, d.erros === 1 ? 'erro reportado' : 'erros reportados', 'r', 'sugestoes');
if (nv > 0) chip(nv, nv === 1 ? 'mensagem nova' : 'mensagens novas', 'v', 'sugestoes');
if (d.promos_vencendo) chip(d.promos_vencendo, d.promos_vencendo === 1 ? 'promoção acabando' : 'promoções acabando', '', 'promocoes');
if (!cs.children.length) chip('Tudo em dia', '', '', 'visao-geral');
}
const itens2 = [];
if (d.lembretes) itens2.push(['' + d.lembretes + (d.lembretes === 1 ? ' lembrete para hoje' : ' lembretes para hoje ou atrasados'), 'Abra o calendário para ver.', '__cal']);
if (d.erros) itens2.push(['' + d.erros + (d.erros === 1 ? ' erro reportado' : ' erros reportados'), 'Chegaram pelo app e ainda não foram lidos.', 'sugestoes']);
if (d.mensagens - d.erros > 0) itens2.push(['' + (d.mensagens - d.erros) + ' mensagem(ns) nova(s)', 'Sugestões e perguntas ainda não lidas.', 'sugestoes']);
if (d.sem_resposta) itens2.push(['' + d.sem_resposta + ' sem resposta', 'Mensagens esperando uma resposta sua.', 'sugestoes']);
if (d.promos_vencendo) itens2.push(['' + d.promos_vencendo + ' promoção(ões) acabando', 'Terminam nos próximos 3 dias.', 'promocoes']);
if (d.lojas_sem_coord) itens2.push(['' + d.lojas_sem_coord + ' lojas sem coordenada', 'O app não calcula distância para elas.', 'redes']);
corpo.replaceChildren();
if (!itens2.length) { const v = document.createElement('div'); v.className = 'nada'; v.textContent = 'Nada novo por aqui. Tudo lido e respondido.'; corpo.append(v); }
else itens2.forEach(([t, s, ir]) => corpo.append(linha(t, s, ir)));
const urgentes = (d.erros || 0) + (d.mensagens || 0) + (d.lembretes || 0);
if (urgentes) sino.classList.add('tem');
const põe = (nav, n) => { const e = document.getElementById('conta-' + nav); if (e && n) { e.textContent = n > 99 ? '99+' : n; e.classList.add('tem'); e.title = n + ' para ver'; } };
põe('sugestoes', d.mensagens || 0);
põe('promocoes', d.promos_vencendo || 0);
põe('redes', d.lojas_sem_coord || 0);
} catch (e) {
corpo.replaceChildren(linha('Não consegui ler os avisos', 'O Supabase recusou ou não foi liberado nesta página. O setor Sugestões mostra tudo.', 'sugestoes'));
}
})();
})();
(() => {
const g = (i) => document.getElementById(i);
const nuv = (dx, dy, f) => '<g transform="translate(' + dx + ' ' + dy + ')" fill="' + f + '"><circle cx="21" cy="42" r="9"/><circle cx="33" cy="36" r="13"/><circle cx="46" cy="43" r="8"/><rect x="21" y="42" width="25" height="9" rx="4.5"/></g>';
const NUV = (dx, dy) => nuv(dx, dy + 2, '#cfe2f6') + nuv(dx, dy, '#ffffff');
const sol = (x, y, k) => '<circle cx="' + x + '" cy="' + y + '" r="' + (17 * k) + '" fill="#FFFFFF" opacity=".28"/><circle cx="' + x + '" cy="' + y + '" r="' + (11 * k) + '" fill="#FFC93C"/>';
const lua = (x, y, k) => '<circle cx="' + x + '" cy="' + y + '" r="' + (18 * k) + '" fill="#FFE9A8" opacity=".25"/><path transform="translate(' + (x - 32 * k) + ' ' + (y - 32 * k) + ') scale(' + k + ')" d="M44 38A14 14 0 1 1 28 18a11 11 0 0 0 16 20z" fill="#FFE9A8"/>';
const GOTA = '<path d="M24 51l-2 5M33 51l-2 5M42 51l-2 5" stroke="#CFE8FF" stroke-width="3" stroke-linecap="round"/>';
const IM = (n, x, y, w, h) => '<image href="icones/' + n + '.svg?v=' + (window.PAINEL_VERSAO || 1) + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
const icone = (c, dia) => {
if (c <= 1) return IM(dia ? 'sol' : 'lua', 0, 0, 100, 100);
if (c === 2) return IM(dia ? 'nuvem-sol' : 'lua-nuvem', 0, 0, 100, 100);
if (c >= 95) return IM('nuvem-chuva', 0, 0, 100, 100) + IM('raio', 37, 46, 26, 40);
if (c >= 80 && c <= 82) return IM(dia ? 'sol-nuvem-chuva' : 'lua-nuvem-chuva', 0, 0, 100, 100);
if (c >= 51 && c <= 82) return IM('nuvem-chuva', 0, 0, 100, 100);
return IM('nuvem', 0, 0, 100, 100);
};
const TXT = (c) => c === 0 ? 'Céu limpo' : c === 1 ? 'Quase limpo' : c === 2 ? 'Parcialmente nublado' : c === 3 ? 'Nublado' : c < 50 ? 'Neblina' : c < 60 ? 'Garoa' : c < 70 ? 'Chuva' : c < 80 ? 'Neve' : c < 90 ? 'Pancadas de chuva' : 'Tempestade';
const DIR = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
const dec = (n, d) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pinta = (c, uv) => {
g('cl-t').textContent = Math.round(c.temperature_2m);
// se está chovendo agora (precipitação medida), mostra chuva mesmo que o código do tempo ainda diga nublado
const chove = (c.precipitation > 0 || c.rain > 0 || c.showers > 0) && c.weather_code < 51, cod = chove ? 61 : c.weather_code;
g('cl-i').setAttribute('viewBox', '0 0 100 100'); g('cl-i').innerHTML = icone(cod, c.is_day === 1);
const s = g('cl-s'); s.textContent = TXT(cod); s.classList.remove('erro');
const cp = g('cp-clima'); if (cp) cp.title = TXT(cod);
climaOk = true;
g('cl-d').textContent = typeof c.wind_direction_10m === 'number' ? DIR[Math.round(c.wind_direction_10m / 45) % 8] : 'Vento';
g('cl-v').textContent = dec(c.wind_speed_10m, 1) + ' km/h';
g('cl-f').textContent = typeof c.apparent_temperature === 'number' ? dec(c.apparent_temperature, 1) + ' °C' : '--';
g('cl-uv').textContent = typeof uv === 'number' ? dec(uv, 0) : '--';
g('cl-p').textContent = typeof c.relative_humidity_2m === 'number' ? Math.round(c.relative_humidity_2m) + '%' : '--';
};
let climaOk = false;
const carregaClima = async (quieto) => {
quieto = quieto === true;
const CH = 'cp-clima-cache3';
try { const k = JSON.parse(localStorage.getItem(CH) || 'null'); if (k && Date.now() - k.at < 5 * 6e4) { pinta(k.c, k.uv); return; } } catch (e) { }
let mcp = null;
try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch (e) { mcp = null; }
if (!mcp) { if (quieto && climaOk) return; g('cl-s').textContent = 'Clima indisponível aqui'; g('cl-s').classList.add('erro'); if (window.cp404) window.cp404('Clima não encontrado · toque para tentar de novo', 0, carregaClima); return; }
try {
const q = "select (content::json)->'current' as c, (content::json)->'hourly' as h from extensions.http_get('https://api.open-meteo.com/v1/forecast?latitude=-23.51&longitude=-46.88&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,is_day&hourly=uv_index&forecast_days=1&timezone=America%2FSao_Paulo');";
const res = await mcp.callTool('Supabase', 'execute_sql', { project_id: 'ckhaolaprrtvwoadnnty', query: q }, { cache: false });
let p = res && res.payload !== undefined ? res.payload : res;
if (p && typeof p === 'object' && typeof p.result === 'string') p = p.result;
if (typeof p === 'string') { const f = p.lastIndexOf('</untrusted-data'), i = p.lastIndexOf('<untrusted-data-', f), j = p.indexOf('>', i); p = JSON.parse(p.slice(j + 1, f).trim()); }
const r0 = Array.isArray(p) ? p[0] : p, c = r0.c;
if (typeof c.temperature_2m !== 'number') throw new Error('sem dados');
let uv = null; try { const hh = r0.h, ix = Math.min(23, new Date().getHours()); if (hh && hh.uv_index) uv = hh.uv_index[ix]; } catch (e) { }
pinta(c, uv);
try { localStorage.setItem(CH, JSON.stringify({ at: Date.now(), c, uv })); } catch (e) { }
} catch (e) { if (quieto && climaOk) return; g('cl-s').textContent = 'Clima indisponível agora'; g('cl-s').classList.add('erro'); if (window.cp404) window.cp404('Clima não encontrado · toque para tentar de novo', 0, () => carregaClima()); }
};
window.cpClimaCarrega = carregaClima;
setTimeout(carregaClima, 0);
// atualiza sozinho: a cada 10 minutos e quando a aba volta a ficar visível (antes só carregava ao abrir a página)
setInterval(() => { if (!document.hidden) carregaClima(true); }, 10 * 6e4);
document.addEventListener('visibilitychange', () => { if (!document.hidden) carregaClima(true); });
})();
(() => {
const secs = () => Array.from(document.querySelectorAll('.cp-sec'));
const titulo = (id) => { const s = document.querySelector('section.cp-sec#' + id), h = s && s.querySelector('h1'); return h ? h.textContent.trim() : id; };
const atualId = () => { const s = secs().find((x) => !x.hidden); return s ? s.id : 'setores'; };
let extra = null; // editor aberto a partir da página em que estamos
const caminho = () => {
const id = atualId(), c = [];
if (id === 'setores' || id === 'visao-geral') c.push({ t: titulo(id), id });
else c.push({ t: 'Setores', id: 'setores' }, { t: titulo(id), id });
if (extra && extra.sec === id) c.push({ t: extra.t, href: extra.href });
return c;
};
const desenha = (pop) => {
const c = caminho();
pop.replaceChildren();
c.forEach((p, i) => {
if (i) { const s = document.createElement('span'); s.className = 'sep'; s.textContent = '/'; s.setAttribute('aria-hidden', 'true'); pop.append(s); }
const fim = i === c.length - 1;
if (p.href && /^https?:/i.test(p.href)) { const a = document.createElement('a'); a.href = p.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = p.t; if (fim) a.className = 'fim'; pop.append(a); }
else if (fim) { const b = document.createElement('b'); b.textContent = p.t; pop.append(b); }
else { const b = document.createElement('button'); b.type = 'button'; b.textContent = p.t; b.addEventListener('click', () => { if (typeof cpAbrir === 'function') cpAbrir(p.id, true); }); pop.append(b); }
});
};
secs().forEach((s) => {
const h = s.querySelector('h1'); if (!h) return;
const w = document.createElement('div'); w.className = 'cp-ttl';
const pop = document.createElement('div'); pop.className = 'cp-trilha'; pop.setAttribute('role', 'navigation'); pop.setAttribute('aria-label', 'Caminho até esta página');
h.replaceWith(w); w.append(h, pop);
const atualiza = (ev) => { if (ev && ev.target && pop.contains(ev.target)) return; desenha(pop); };
w.addEventListener('mouseenter', atualiza); w.addEventListener('focusin', atualiza);
});
const orig = window.cpAbrir;
if (typeof orig === 'function') window.cpAbrir = (id, rolar) => { extra = null; orig(id, rolar); };
document.addEventListener('click', (e) => {
const a = e.target.closest ? e.target.closest('a[href][target="_blank"]') : null;
if (!a || !a.closest('.cp-app')) return;
const sec = a.closest('.cp-sec'), sub = a.closest('.cp-sub');
const dono = sec ? sec.id : (sub && sub.previousElementSibling ? sub.previousElementSibling.getAttribute('data-nav') : null);
if (!dono || dono !== atualId()) return;
const t = a.textContent.replace(/^\s*Abrir\s+(o|a|os|as)?\s*/i, '').replace(/\s*[›»→]\s*$/, '').trim();
if (!t) return;
extra = { sec: dono, t: t.charAt(0).toUpperCase() + t.slice(1), href: a.href };
}, true);
})();
(() => {
const PADRAO = 'É melhor o arrependimento de não ter tentado ou a frustração de não ter dado certo?';
const PADRAO_SAUD = 'Oi, Jefferson';
const $ = (id) => document.getElementById(id);
const nomeEl = $('cp-oi-nome'), saud = $('fr-saud'), saudOk = $('fr-saud-ok');
const alvo = $('cp-oi-frase'), pop = $('cp-frases'), editBtn = $('cp-oi-edit'), lista = $('fr-lista'), form = $('fr-form'), nova = $('fr-nova'), aviso = $('fr-aviso');
if (!alvo || !pop) return;
const CH = 'cp-frases-local';
let itens = [], saudacao = PADRAO_SAUD, modo = 'carregando', mcp = null, editando = null, tAviso = 0;

const dia = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const indiceHoje = () => (itens.length ? dia() % itens.length : -1);
const mostra = () => { const i = indiceHoje(); alvo.textContent = i >= 0 ? itens[i].texto : PADRAO; if (nomeEl) nomeEl.textContent = saudacao; };
const msg = (t, tipo) => { clearTimeout(tAviso); aviso.textContent = t || ''; aviso.className = 'fr-aviso' + (tipo ? ' ' + tipo : ''); if (t && tipo === 'ok') tAviso = setTimeout(() => { aviso.textContent = ''; aviso.className = 'fr-aviso'; base(); }, 2500); };
const base = () => { if (modo === 'local') msg('O Supabase não está liberado nesta página; as frases ficam só neste navegador.'); else if (!itens.length) msg('Nenhuma frase guardada: aparece a frase padrão.'); };

const lerLocal = () => { try { const v = JSON.parse(localStorage.getItem(CH) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
const guardaLocal = () => { try { localStorage.setItem(CH, JSON.stringify(itens)); } catch (e) { /* segue */ } };
const sq = (s) => "'" + String(s).replace(/\u0000/g, '').replace(/'/g, "''") + "'";
const rodar = (query) => mcp.callTool('Supabase', 'execute_sql', { project_id: 'ckhaolaprrtvwoadnnty', query }, { cache: false });
const linhas = (res) => {
let p = res && res.payload !== undefined ? res.payload : res;
if (p && typeof p === 'object' && typeof p.result === 'string') p = p.result;
if (typeof p === 'string') {
const fim = p.lastIndexOf('</untrusted-data');
if (fim > -1) { const ini = p.lastIndexOf('<untrusted-data-', fim); const f2 = ini > -1 ? p.indexOf('>', ini) : -1; if (f2 > -1) p = p.slice(f2 + 1, fim).trim(); }
p = JSON.parse(p);
}
return Array.isArray(p) ? p : (p ? [p] : []);
};
const LER = `select json_build_object(
'frases', coalesce((select json_agg(x order by x.criado_em) from (select id, texto, criado_em from public.frase_painel where status = 'ativa' order by criado_em limit 100) x), '[]'::json),
'saudacao', (select valor from public.painel_config where chave = 'saudacao')) as r;`;
const recarrega = async () => { const l = linhas(await rodar(LER)); const r = l[0] && l[0].r; itens = r && Array.isArray(r.frases) ? r.frases : []; saudacao = (r && r.saudacao) || PADRAO_SAUD; };
const lerSaudLocal = () => { try { return localStorage.getItem('cp-saudacao-local') || PADRAO_SAUD; } catch (e) { return PADRAO_SAUD; } };
const idOk = (id) => /^[0-9a-f-]{36}$/i.test(String(id));

async function carregar() {
try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch (e) { mcp = null; }
if (mcp) { try { await recarrega(); modo = 'sb'; } catch (e) { modo = 'local'; itens = lerLocal(); saudacao = lerSaudLocal(); } }
else { modo = 'local'; itens = lerLocal(); saudacao = lerSaudLocal(); }
mostra(); desenha(); base();
}
const salvarSaud = async (t) => {
if (modo === 'sb') { await rodar(`insert into public.painel_config (chave, valor) values ('saudacao', ${sq(t)}) on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();`); await recarrega(); }
else { saudacao = t; try { localStorage.setItem('cp-saudacao-local', t); } catch (e) { /* segue */ } }
};
const adicionar = async (t) => {
if (modo === 'sb') { await rodar(`insert into public.frase_painel (texto) values (${sq(t)});`); await recarrega(); }
else { itens.push({ id: 'l' + Date.now().toString(36), texto: t }); guardaLocal(); }
};
const salvarTexto = async (it, t) => {
if (modo === 'sb') { if (!idOk(it.id)) throw new Error('id'); await rodar(`update public.frase_painel set texto = ${sq(t)}, atualizado_em = now() where id = ${sq(it.id)}::uuid;`); await recarrega(); }
else { it.texto = t; guardaLocal(); }
};
const arquivar = async (it) => {
if (modo === 'sb') { if (!idOk(it.id)) throw new Error('id'); await rodar(`update public.frase_painel set status = 'arquivada', atualizado_em = now() where id = ${sq(it.id)}::uuid;`); await recarrega(); }
else { itens = itens.filter((x) => x !== it); guardaLocal(); }
};

function desenha() {
lista.replaceChildren();
if (!itens.length) { const v = document.createElement('div'); v.className = 'fr-it'; const t = document.createElement('div'); t.className = 'tx'; t.textContent = PADRAO; lista.append(v); v.append(t); return; }
const hoje = indiceHoje();
itens.forEach((it, i) => {
const row = document.createElement('div'); row.className = 'fr-it';
if (editando === it.id) {
const box = document.createElement('div'); box.className = 'fr-ed';
const ta = document.createElement('textarea'); ta.maxLength = 200; ta.rows = 3; ta.value = it.texto; ta.setAttribute('aria-label', 'Editar a frase');
const bt = document.createElement('div'); bt.className = 'bt';
const c = document.createElement('button'); c.type = 'button'; c.textContent = 'Cancelar'; c.addEventListener('click', () => { editando = null; desenha(); });
const s = document.createElement('button'); s.type = 'button'; s.className = 'pri'; s.textContent = 'Salvar';
s.addEventListener('click', async () => {
const t = ta.value.trim(); if (!t) { msg('A frase não pode ficar vazia.', 'erro'); return; }
s.disabled = true;
try { await salvarTexto(it, t); editando = null; mostra(); desenha(); msg('Frase salva.', 'ok'); }
catch (e) { s.disabled = false; msg('Não consegui salvar. Tente de novo.', 'erro'); }
});
bt.append(c, s); box.append(ta, bt); row.append(box); lista.append(row); setTimeout(() => ta.focus(), 0); return;
}
const tx = document.createElement('div'); tx.className = 'tx';
if (i === hoje && itens.length > 1) { const h = document.createElement('div'); h.className = 'hoje'; h.textContent = 'Hoje'; tx.append(h); }
tx.append(document.createTextNode(it.texto));
const ac = document.createElement('div'); ac.className = 'acoes';
const e = document.createElement('button'); e.type = 'button'; e.textContent = 'Editar'; e.addEventListener('click', () => { editando = it.id; desenha(); });
const a = document.createElement('button'); a.type = 'button'; a.textContent = 'Arquivar'; a.title = 'Tira do cabeçalho; não apaga';
a.addEventListener('click', async () => { try { await arquivar(it); mostra(); desenha(); msg('Frase arquivada.', 'ok'); } catch (err) { msg('Não consegui arquivar. Tente de novo.', 'erro'); } });
ac.append(e, a); row.append(tx, ac); lista.append(row);
});
}

saudOk.addEventListener('click', async () => {
const t = saud.value.trim(); if (!t) { msg('A saudação não pode ficar vazia.', 'erro'); return; }
saudOk.disabled = true;
try { await salvarSaud(t); mostra(); msg('Saudação salva.', 'ok'); }
catch (e) { msg('Não consegui salvar. Tente de novo.', 'erro'); }
saudOk.disabled = false;
});
saud.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saudOk.click(); } });
form.addEventListener('submit', async (ev) => {
ev.preventDefault();
const t = nova.value.trim(); if (!t) return;
const b = form.querySelector('button'); b.disabled = true;
try { await adicionar(t); nova.value = ''; mostra(); desenha(); msg('Frase adicionada.', 'ok'); }
catch (e) { msg('Não consegui guardar. Tente de novo.', 'erro'); }
b.disabled = false;
});
const abrir = () => {
document.querySelectorAll('.cp-menu').forEach((m) => { m.hidden = true; });
document.querySelectorAll('.cp-sino, .cp-perfil').forEach((b) => b.setAttribute('aria-expanded', 'false'));
editando = null; desenha(); saud.value = saudacao; pop.hidden = false;
};
const fecha = () => { pop.hidden = true; editando = null; };
pop.addEventListener('click', (e) => e.stopPropagation());
if (editBtn) editBtn.addEventListener('click', (e) => { e.stopPropagation(); if (pop.hidden) abrir(); else fecha(); });
const item = $('cp-frase-item');
if (item) item.addEventListener('click', (e) => { e.stopPropagation(); abrir(); });
document.addEventListener('click', () => { if (!pop.hidden) fecha(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) fecha(); });
alvo.textContent = PADRAO;
carregar();
})();
(() => {
const bar = document.querySelector('.cp-bar'), lupa = document.getElementById('cp-lupa');
const q = document.getElementById('cp-q'), acha = document.getElementById('cp-acha');
if (!bar || !lupa || !q) return;
const abre = () => { bar.classList.add('aberta'); q.focus(); };
const fecha = () => { if (!q.value) bar.classList.remove('aberta'); };
lupa.addEventListener('click', (e) => { e.stopPropagation(); if (bar.classList.contains('aberta')) { q.value = ''; q.dispatchEvent(new Event('input')); bar.classList.remove('aberta'); } else abre(); });
document.addEventListener('click', (e) => { if (!e.target.closest('.cp-busca') && !e.target.closest('#cp-lupa')) fecha(); });
acha.addEventListener('click', () => setTimeout(fecha, 0));
q.addEventListener('keydown', (e) => { if (e.key === 'Escape') { q.value = ''; bar.classList.remove('aberta'); } });
document.addEventListener('keydown', (e) => {
if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
e.preventDefault(); abre();
});
})();
(() => {
const btn = document.getElementById('cp-cal'), menu = document.getElementById('cp-cal-menu');
if (!btn || !menu) return;
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const DIA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const deIso = (s) => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const hojeIso = () => iso(new Date());
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const $ = (id) => document.getElementById(id);
const grade = $('cal-grade'), lista = $('cal-lista'), prox = $('cal-proximos'), aviso = $('cal-aviso'), form = $('cal-form');
let ref = new Date(); ref.setDate(1);
let selIso = hojeIso(), itens = [], modo = 'carregando', mcp = null, falhaLeitura = false, tAviso = 0;
const CH = 'cp-lembretes-local';

const setores = {};
document.querySelectorAll('.cp-sc').forEach((c) => {
const id = c.getAttribute('data-go'), t = (c.querySelector('h3') || {}).textContent || '';
if (id && t && /^[a-z0-9-]{1,40}$/.test(id)) setores[id] = t.trim();
});
const sel = $('cal-setor');
Object.keys(setores).forEach((id) => { const o = document.createElement('option'); o.value = id; o.textContent = setores[id]; sel.append(o); });

const msg = (t, tipo) => { clearTimeout(tAviso); aviso.textContent = t || ''; aviso.className = 'cal-aviso' + (tipo ? ' ' + tipo : ''); if (t && tipo === 'ok') tAviso = setTimeout(() => { aviso.textContent = ''; aviso.className = 'cal-aviso'; texto(); }, 2500); };
const texto = () => {
if (modo === 'local') msg(falhaLeitura ? 'Não consegui ler o Supabase; os lembretes ficam só neste navegador.' : 'O Supabase não está liberado nesta página; os lembretes ficam só neste navegador.');
};

const lerLocal = () => { try { const v = JSON.parse(localStorage.getItem(CH) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
const guardaLocal = () => { try { localStorage.setItem(CH, JSON.stringify(itens)); } catch (e) { /* segue */ } };
const sq = (s) => "'" + String(s).replace(/\u0000/g, '').replace(/'/g, "''") + "'";
const rodar = (query) => mcp.callTool('Supabase', 'execute_sql', { project_id: 'ckhaolaprrtvwoadnnty', query }, { cache: false });
const linhas = (res) => {
let p = res && res.payload !== undefined ? res.payload : res;
if (p && typeof p === 'object' && typeof p.result === 'string') p = p.result;
if (typeof p === 'string') {
const fim = p.lastIndexOf('</untrusted-data');
if (fim > -1) { const ini = p.lastIndexOf('<untrusted-data-', fim); const f2 = ini > -1 ? p.indexOf('>', ini) : -1; if (f2 > -1) p = p.slice(f2 + 1, fim).trim(); }
p = JSON.parse(p);
}
return Array.isArray(p) ? p : (p ? [p] : []);
};
const LER = `select coalesce(json_agg(x order by x.data, x.criado_em), '[]'::json) as r from (select id, to_char(data, 'YYYY-MM-DD') as data, titulo, nota, setor, feito, criado_em from public.lembrete where status = 'ativo' order by data, criado_em limit 500) x;`;
const recarrega = async () => { const l = linhas(await rodar(LER)); const r = l[0] && l[0].r; itens = Array.isArray(r) ? r : []; };

async function carregar() {
try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch (e) { mcp = null; }
if (mcp) { try { await recarrega(); modo = 'sb'; } catch (e) { modo = 'local'; falhaLeitura = true; itens = lerLocal(); } }
else { modo = 'local'; itens = lerLocal(); }
texto(); desenha(); pontinho();
}
async function adicionar(o) {
if (modo === 'sb') {
await rodar(`insert into public.lembrete (data, titulo, nota, setor) values (${sq(o.data)}::date, ${sq(o.titulo)}, ${o.nota ? sq(o.nota) : 'null'}, ${o.setor ? sq(o.setor) : 'null'});`);
await recarrega();
} else { itens.push({ id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), data: o.data, titulo: o.titulo, nota: o.nota || null, setor: o.setor || null, feito: false }); guardaLocal(); }
}
async function mudar(it, campo, valor) {
if (modo === 'sb') {
if (!/^[0-9a-f-]{36}$/i.test(String(it.id))) throw new Error('id');
const set = campo === 'feito' ? `feito = ${valor ? 'true' : 'false'}` : `status = 'arquivado'`;
await rodar(`update public.lembrete set ${set} where id = ${sq(it.id)}::uuid;`);
await recarrega();
} else {
if (campo === 'feito') it.feito = valor; else itens = itens.filter((x) => x !== it);
guardaLocal();
}
}

const svg = (d, extra) => { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('fill', 'none'); n.setAttribute('stroke', 'currentColor'); n.setAttribute('stroke-width', '2.4'); n.setAttribute('stroke-linecap', 'round'); n.setAttribute('stroke-linejoin', 'round'); n.setAttribute('aria-hidden', 'true'); n.innerHTML = d; return n; };
const porDia = () => { const m = {}; itens.forEach((it) => { const o = m[it.data] || (m[it.data] = { p: 0, f: 0 }); if (it.feito) o.f++; else o.p++; }); return m; };

function desenhaMes() {
$('cal-mes').textContent = cap(MES[ref.getMonth()]) + ' de ' + ref.getFullYear();
const m = porDia(), hoje = hojeIso(), off = new Date(ref.getFullYear(), ref.getMonth(), 1).getDay();
grade.replaceChildren();
for (let i = 0; i < 42; i++) {
const d = new Date(ref.getFullYear(), ref.getMonth(), 1 - off + i), k = iso(d);
const b = document.createElement('button'); b.type = 'button'; b.className = 'cal-d'; b.textContent = String(d.getDate()); b.dataset.d = k;
if (d.getMonth() !== ref.getMonth()) b.classList.add('fora');
if (k === hoje) b.classList.add('hoje');
if (k === selIso) b.classList.add('sel');
b.setAttribute('aria-label', d.getDate() + ' de ' + MES[d.getMonth()]);
const o = m[k];
if (o) { const p = document.createElement('i'); p.className = o.p ? (k < hoje ? 'a' : '') : 'f'; b.append(p); }
grade.append(b);
}
}
function desenhaProximos() {
const hoje = hojeIso();
const pend = itens.filter((it) => !it.feito).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0)).slice(0, 4);
prox.replaceChildren();
if (!pend.length) return;
const t = document.createElement('div'); t.className = 'cal-tit'; t.textContent = 'Próximos lembretes'; prox.append(t);
pend.forEach((it) => {
const b = document.createElement('button'); b.type = 'button'; b.className = 'cal-pr' + (it.data < hoje ? ' atr' : '');
const e = document.createElement('em'); e.textContent = it.data === hoje ? 'Hoje' : it.data.slice(8, 10) + '/' + it.data.slice(5, 7);
const s = document.createElement('span'); s.textContent = it.titulo;
b.append(e, s); b.addEventListener('click', () => { selIso = it.data; const d = deIso(it.data); ref = new Date(d.getFullYear(), d.getMonth(), 1); desenha(); });
prox.append(b);
});
}
function desenhaDia() {
const d = deIso(selIso);
$('cal-dt').textContent = cap(DIA[d.getDay()]) + ', ' + d.getDate() + ' de ' + MES[d.getMonth()] + (selIso === hojeIso() ? ' · hoje' : '');
lista.replaceChildren();
const dia = itens.filter((it) => it.data === selIso);
if (!dia.length) { const v = document.createElement('p'); v.className = 'cal-vazio'; v.textContent = 'Nada marcado para este dia.'; lista.append(v); return; }
dia.forEach((it) => {
const row = document.createElement('div'); row.className = 'cal-it' + (it.feito ? ' feito' : '');
const ck = document.createElement('button'); ck.type = 'button'; ck.className = 'cal-ck'; ck.setAttribute('aria-pressed', String(!!it.feito)); ck.setAttribute('aria-label', it.feito ? 'Marcar como pendente' : 'Marcar como feito');
ck.append(svg('<path d="m5 12 5 5 9-10"></path>'));
ck.addEventListener('click', async () => { try { await mudar(it, 'feito', !it.feito); desenha(); pontinho(); } catch (e) { msg('Não consegui atualizar. Tente de novo.', 'erro'); } });
const tx = document.createElement('div'); tx.className = 'cal-tx';
const b = document.createElement('b'); b.textContent = it.titulo; tx.append(b);
if (it.nota) { const s = document.createElement('small'); s.textContent = it.nota; tx.append(s); }
if (it.setor && setores[it.setor]) {
const l = document.createElement('button'); l.type = 'button'; l.className = 'cal-link'; l.textContent = 'Abrir ' + setores[it.setor];
l.addEventListener('click', () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (typeof cpAbrir === 'function') cpAbrir(it.setor, true); });
tx.append(l);
}
const ar = document.createElement('button'); ar.type = 'button'; ar.className = 'cal-arq'; ar.title = 'Arquivar'; ar.setAttribute('aria-label', 'Arquivar lembrete');
ar.append(svg('<rect x="3" y="4" width="18" height="4" rx="1"></rect><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4"></path>'));
ar.addEventListener('click', async () => { try { await mudar(it, 'arquivar'); desenha(); pontinho(); msg('Lembrete arquivado.', 'ok'); } catch (e) { msg('Não consegui arquivar. Tente de novo.', 'erro'); } });
row.append(ck, tx, ar); lista.append(row);
});
}
function desenha() { desenhaMes(); desenhaProximos(); desenhaDia(); }
function pontinho() {
const hoje = hojeIso(), n = itens.filter((it) => !it.feito && it.data <= hoje).length;
btn.classList.toggle('tem', n > 0);
btn.title = n ? (n === 1 ? '1 lembrete para hoje ou atrasado' : n + ' lembretes para hoje ou atrasados') : 'Calendário e lembretes';
}

grade.addEventListener('click', (e) => { const b = e.target.closest('.cal-d'); if (!b) return; selIso = b.dataset.d; const d = deIso(selIso); if (d.getMonth() !== ref.getMonth()) ref = new Date(d.getFullYear(), d.getMonth(), 1); desenha(); $('cal-titulo').focus(); });
$('cal-ant').addEventListener('click', () => { ref = new Date(ref.getFullYear(), ref.getMonth() - 1, 1); desenhaMes(); });
$('cal-prox').addEventListener('click', () => { ref = new Date(ref.getFullYear(), ref.getMonth() + 1, 1); desenhaMes(); });
$('cal-hoje').addEventListener('click', () => { selIso = hojeIso(); ref = new Date(); ref.setDate(1); desenha(); });
form.addEventListener('submit', async (e) => {
e.preventDefault();
const titulo = $('cal-titulo').value.trim(), nota = $('cal-nota').value.trim(), setor = sel.value;
if (!titulo || !/^\d{4}-\d{2}-\d{2}$/.test(selIso) || (setor && !/^[a-z0-9-]{1,40}$/.test(setor))) return;
const bs = $('cal-salvar'); bs.disabled = true;
try { await adicionar({ data: selIso, titulo, nota, setor }); $('cal-titulo').value = ''; $('cal-nota').value = ''; sel.value = ''; desenha(); pontinho(); msg('Lembrete guardado.', 'ok'); }
catch (err) { msg('Não consegui guardar. Tente de novo.', 'erro'); }
bs.disabled = false;
});
menu.addEventListener('click', (e) => e.stopPropagation());
btn.addEventListener('click', (e) => {
e.stopPropagation();
const abrir = menu.hidden;
document.querySelectorAll('.cp-menu').forEach((m) => { m.hidden = true; });
document.querySelectorAll('.cp-sino, .cp-perfil').forEach((b) => b.setAttribute('aria-expanded', 'false'));
menu.hidden = !abrir; btn.setAttribute('aria-expanded', String(abrir));
if (abrir) { desenha(); if (modo === 'sb') recarrega().then(() => { desenha(); pontinho(); }).catch(() => {}); }
});
document.addEventListener('click', () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
document.getElementById('cal-full').addEventListener('click', () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (typeof cpAbrir === 'function') cpAbrir('agenda', true); });
window.cpCalRecarrega = async () => { try { if (modo === 'sb') await recarrega(); else itens = lerLocal(); desenha(); pontinho(); } catch (e) { /* segue */ } };
desenha();
carregar();
})();
(() => {
const sec = document.querySelector('section.cp-sec#agenda');
if (!sec) return;
const $ = (id) => document.getElementById(id);
const MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MES3 = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const DIA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const DIA3 = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TIPOS = { promocao: 'Promoção', conteudo: 'Conteúdo', reuniao: 'Reunião', evento: 'Evento' };
const PLURAL = { promocao: 'Promoções', conteudo: 'Conteúdo', reuniao: 'Reuniões', evento: 'Eventos' };
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const deIso = (s) => { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const hojeIso = () => iso(new Date());
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const CH = 'cp-lembretes-local', CHEX = 'cp-agenda-ex';
const corpo = $('ag-corpo'), rot = $('ag-rot'), cards = $('ag-cards'), aviso = $('ag-aviso');
const modal = $('ag-modal'), form = $('ag-form'), erro = $('ag-erro');
let itens = [], modo = 'carregando', mcp = null, falha = false, vis = 'mes', ancora = new Date(), exemplos = false, editando = null, abridor = null, tAviso = 0, porId = {};
ancora = new Date(ancora.getFullYear(), ancora.getMonth(), ancora.getDate());
const filtros = { promocao: true, conteudo: true, reuniao: true, evento: true };
const setores = {};
document.querySelectorAll('.cp-sc').forEach((c) => {
const id = c.getAttribute('data-go'), t = (c.querySelector('h3') || {}).textContent || '';
if (id && t && /^[a-z0-9-]{1,40}$/.test(id)) setores[id] = t.trim();
});
Object.keys(setores).forEach((id) => { const o = mk('option', null, setores[id]); o.value = id; $('ag-setor').append(o); });
const msg = (t, tipo) => { clearTimeout(tAviso); aviso.textContent = t || ''; aviso.className = 'ag-aviso' + (tipo ? ' ' + tipo : ''); if (t && tipo === 'ok') tAviso = setTimeout(() => { aviso.textContent = ''; aviso.className = 'ag-aviso'; base(); }, 2500); };
const base = () => { if (modo === 'local') msg(falha ? 'Não consegui ler o Supabase; os lembretes ficam só neste navegador.' : 'O Supabase não está liberado nesta página; os lembretes ficam só neste navegador.'); };
const norm = (it) => ({
id: it.id, data: String(it.data).slice(0, 10), titulo: String(it.titulo || ''), nota: it.nota || null, setor: it.setor || null, feito: !!it.feito,
tipo: TIPOS[it.tipo] ? it.tipo : 'conteudo',
hora_ini: /^\d{2}:\d{2}/.test(it.hora_ini || '') ? String(it.hora_ini).slice(0, 5) : null,
hora_fim: /^\d{2}:\d{2}/.test(it.hora_fim || '') ? String(it.hora_fim).slice(0, 5) : null
});
const lerLocal = () => { try { const v = JSON.parse(localStorage.getItem(CH) || '[]'); return Array.isArray(v) ? v.map(norm) : []; } catch (e) { return []; } };
const guardaLocal = () => { try { localStorage.setItem(CH, JSON.stringify(itens)); } catch (e) { /* segue */ } };
const sq = (s) => "'" + String(s).replace(/\u0000/g, '').replace(/'/g, "''") + "'";
const sqT = (t) => (t ? sq(t) + '::time' : 'null');
const rodar = (query) => mcp.callTool('Supabase', 'execute_sql', { project_id: 'ckhaolaprrtvwoadnnty', query }, { cache: false });
const linhas = (res) => {
let p = res && res.payload !== undefined ? res.payload : res;
if (p && typeof p === 'object' && typeof p.result === 'string') p = p.result;
if (typeof p === 'string') {
const fim = p.lastIndexOf('</untrusted-data');
if (fim > -1) { const ini = p.lastIndexOf('<untrusted-data-', fim); const f2 = ini > -1 ? p.indexOf('>', ini) : -1; if (f2 > -1) p = p.slice(f2 + 1, fim).trim(); }
p = JSON.parse(p);
}
return Array.isArray(p) ? p : (p ? [p] : []);
};
const LER = `select coalesce(json_agg(x order by x.data, x.criado_em), '[]'::json) as r from (select id, to_char(data, 'YYYY-MM-DD') as data, titulo, nota, setor, feito, tipo, to_char(hora_ini, 'HH24:MI') as hora_ini, to_char(hora_fim, 'HH24:MI') as hora_fim, criado_em from public.lembrete where status = 'ativo' order by data, criado_em limit 1000) x;`;
const recarrega = async () => { const l = linhas(await rodar(LER)); const r = l[0] && l[0].r; itens = Array.isArray(r) ? r.map(norm) : []; };
const idOk = (id) => /^[0-9a-f-]{36}$/i.test(String(id));
const sincroniza = () => { if (typeof window.cpCalRecarrega === 'function') { try { window.cpCalRecarrega(); } catch (e) { /* segue */ } } };
async function adicionar(o) {
if (modo === 'sb') {
await rodar(`insert into public.lembrete (data, titulo, nota, setor, tipo, hora_ini, hora_fim) values (${sq(o.data)}::date, ${sq(o.titulo)}, ${o.nota ? sq(o.nota) : 'null'}, ${o.setor ? sq(o.setor) : 'null'}, ${sq(o.tipo)}, ${sqT(o.hora_ini)}, ${sqT(o.hora_fim)});`);
await recarrega();
} else { itens.push(norm({ id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...o, feito: false })); guardaLocal(); }
}
async function atualizar(it, o) {
if (modo === 'sb') {
if (!idOk(it.id)) throw new Error('id');
await rodar(`update public.lembrete set data = ${sq(o.data)}::date, titulo = ${sq(o.titulo)}, nota = ${o.nota ? sq(o.nota) : 'null'}, setor = ${o.setor ? sq(o.setor) : 'null'}, tipo = ${sq(o.tipo)}, hora_ini = ${sqT(o.hora_ini)}, hora_fim = ${sqT(o.hora_fim)} where id = ${sq(it.id)}::uuid and status = 'ativo';`);
await recarrega();
} else { Object.assign(it, norm({ ...it, ...o })); guardaLocal(); }
}
async function mudar(it, campo, valor) {
if (modo === 'sb') {
if (!idOk(it.id)) throw new Error('id');
const set = campo === 'feito' ? `feito = ${valor ? 'true' : 'false'}` : `status = 'arquivado'`;
await rodar(`update public.lembrete set ${set} where id = ${sq(it.id)}::uuid;`);
await recarrega();
} else {
if (campo === 'feito') it.feito = valor; else itens = itens.filter((x) => x !== it);
guardaLocal();
}
}
const EX = [
[3, 'reuniao', 'Alinhar a semana com o time', '09:00', '10:00'], [5, 'conteudo', 'Subir a arte da promoção da semana', '14:00', null],
[7, 'promocao', 'Começa uma promoção de exemplo', null, null], [10, 'evento', 'Data comemorativa: post especial', null, null],
[12, 'reuniao', 'Conversa com uma rede parceira', '15:30', '16:30'], [14, 'conteudo', 'Revisar fotos denunciadas', '11:00', null],
[18, 'promocao', 'Acaba uma promoção de exemplo', null, null], [20, 'reuniao', 'Revisar os números da semana', '10:00', '11:00'],
[24, 'evento', 'Véspera de feriado: avisar os usuários', null, null], [27, 'conteudo', 'Trocar o tema da abertura', '08:30', null]
];
const exemplosDoMes = (y, m) => EX.map(([d, t, ti, h1, h2], i) => ({ id: 'ex-' + y + '-' + m + '-' + i, data: iso(new Date(y, m, d)), titulo: ti, tipo: t, hora_ini: h1, hora_fim: h2, nota: null, setor: null, feito: false, ex: true }));
const todos = () => {
let l = itens;
if (exemplos) for (const k of [-1, 0, 1]) { const d = new Date(ancora.getFullYear(), ancora.getMonth() + k, 1); l = l.concat(exemplosDoMes(d.getFullYear(), d.getMonth())); }
return l;
};
const ordem = (a, b) => { const x = a.hora_ini || '99:99', y = b.hora_ini || '99:99'; return x < y ? -1 : x > y ? 1 : 0; };
const agrupa = (lista) => { const m = {}; lista.forEach((it) => { (m[it.data] || (m[it.data] = [])).push(it); }); Object.keys(m).forEach((k) => m[k].sort(ordem)); return m; };
const horaTxt = (it) => (it.hora_ini ? it.hora_ini + (it.hora_fim ? ' – ' + it.hora_fim : '') : '');
const chip = (it) => {
const hoje = hojeIso();
const b = mk('button', 'ag-ev t-' + it.tipo + (it.feito ? ' feito' : '') + (!it.feito && !it.ex && it.data < hoje ? ' atr' : '') + (it.ex ? ' ex' : ''));
b.type = 'button'; b.dataset.id = it.id; b.title = it.titulo + (it.ex ? ' (exemplo)' : '');
b.setAttribute('aria-label', TIPOS[it.tipo] + ': ' + it.titulo + (horaTxt(it) ? ', ' + horaTxt(it) : '') + (it.feito ? ', feito' : '') + (it.ex ? ', exemplo' : ''));
b.append(mk('span', 'tt', it.titulo));
if (it.hora_ini) b.append(mk('span', 'hh', horaTxt(it)));
return b;
};
const longo = (k) => { const d = deIso(k); return d.getDate() + ' de ' + MES[d.getMonth()]; };
function rotulo() {
const y = ancora.getFullYear(), m = ancora.getMonth(), d = ancora.getDate();
if (vis === 'mes') return cap(MES[m]) + ' de ' + y;
if (vis === 'dia') return cap(DIA[ancora.getDay()]) + ', ' + d + ' de ' + MES[m] + (iso(ancora) === hojeIso() ? ' · hoje' : '');
const a = new Date(y, m, d - ancora.getDay()), z = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6);
return a.getMonth() === z.getMonth() ? a.getDate() + ' – ' + z.getDate() + ' de ' + MES3[z.getMonth()] + ' de ' + z.getFullYear()
: a.getDate() + ' ' + MES3[a.getMonth()] + ' – ' + z.getDate() + ' ' + MES3[z.getMonth()] + ' de ' + z.getFullYear();
}
function desenhaCards() {
const pref = ancora.getFullYear() + '-' + pad(ancora.getMonth() + 1) + '-', n = { promocao: 0, conteudo: 0, reuniao: 0, evento: 0 };
todos().forEach((it) => { if (it.data.startsWith(pref)) n[it.tipo]++; });
cards.replaceChildren();
Object.keys(TIPOS).forEach((t) => {
const c = mk('div', 'ag-card t-' + t), tx = mk('div'), b = mk('b', null, PLURAL[t]);
tx.append(b, mk('small', null, 'em ' + MES[ancora.getMonth()]));
c.append(tx, mk('span', 'ag-n', String(n[t])));
cards.append(c);
});
}
function desenhaMes(map) {
const y = ancora.getFullYear(), m = ancora.getMonth(), off = new Date(y, m, 1).getDay(), dias = new Date(y, m + 1, 0).getDate(), linhasN = Math.ceil((off + dias) / 7), hoje = hojeIso();
const hdr = mk('div', 'ag-sem'); DIA3.forEach((n) => hdr.append(mk('span', null, n)));
const g = mk('div', 'ag-mes');
for (let i = 0; i < linhasN * 7; i++) {
const d = new Date(y, m, 1 - off + i), k = iso(d);
const c = mk('div', 'ag-d' + (d.getMonth() !== m ? ' fora' : '') + (k === hoje ? ' hoje' : '')); c.dataset.d = k;
const add = mk('button', 'ag-add'); add.type = 'button'; add.setAttribute('aria-label', 'Novo lembrete em ' + longo(k));
add.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const dn = mk('button', 'ag-dn', String(d.getDate())); dn.type = 'button'; dn.setAttribute('aria-label', 'Ver o dia ' + longo(k)); dn.dataset.ver = k;
c.append(add, dn);
const lista = map[k] || [];
lista.slice(0, 3).forEach((it) => c.append(chip(it)));
if (lista.length > 3) { const mais = mk('button', 'ag-mais', '+' + (lista.length - 3) + ' mais'); mais.type = 'button'; mais.dataset.ver = k; c.append(mais); }
g.append(c);
}
corpo.replaceChildren(hdr, g);
}
function desenhaSemana(map) {
const a = new Date(ancora.getFullYear(), ancora.getMonth(), ancora.getDate() - ancora.getDay()), hoje = hojeIso();
const g = mk('div', 'ag-semana');
for (let i = 0; i < 7; i++) {
const d = new Date(a.getFullYear(), a.getMonth(), a.getDate() + i), k = iso(d);
const c = mk('div', 'ag-col' + (k === hoje ? ' hoje' : '')); c.dataset.d = k;
const h = mk('div', 'ag-ch'), n = mk('button', 'ag-dn', String(d.getDate())); n.type = 'button'; n.dataset.ver = k; n.setAttribute('aria-label', 'Ver o dia ' + longo(k));
h.append(mk('span', null, DIA3[d.getDay()] + ' · ' + MES3[d.getMonth()]), n);
c.append(h);
(map[k] || []).forEach((it) => c.append(chip(it)));
g.append(c);
}
corpo.replaceChildren(g);
}
function desenhaDia(map) {
const k = iso(ancora), lista = map[k] || [], w = mk('div', 'ag-dia');
w.append(mk('div', 'ag-dt', cap(DIA[ancora.getDay()]) + ', ' + longo(k) + (k === hojeIso() ? ' · hoje' : '')));
if (!lista.length) {
w.append(mk('p', 'ag-vazio', 'Nada marcado para este dia.'));
const b = mk('button', 'ag-link', 'Marcar algo para este dia'); b.type = 'button'; b.dataset.novo = k; w.append(b);
}
lista.forEach((it) => {
const lin = mk('div', 'ag-lin t-' + it.tipo + (it.feito ? ' feito' : ''));
lin.append(mk('div', 'ag-hora', it.hora_ini ? it.hora_ini + (it.hora_fim ? ' – ' + it.hora_fim : '') : 'O dia todo'));
const ck = mk('button', 'ag-ck'); ck.type = 'button'; ck.dataset.feito = it.id; ck.disabled = !!it.ex;
ck.setAttribute('aria-pressed', String(!!it.feito)); ck.setAttribute('aria-label', it.feito ? 'Marcar como pendente' : 'Marcar como feito');
ck.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const cx = mk('div', 'ag-cx');
cx.append(mk('span', 'ag-tag', TIPOS[it.tipo] + (it.ex ? ' · exemplo' : '')), mk('b', null, it.titulo));
if (it.nota) cx.append(mk('small', null, it.nota));
if (it.setor && setores[it.setor]) { const l = mk('button', 'ag-link', 'Abrir ' + setores[it.setor]); l.type = 'button'; l.dataset.setor = it.setor; cx.append(l); }
const ed = mk('button', 'ag-ed', it.ex ? 'Ver' : 'Editar'); ed.type = 'button'; ed.dataset.id = it.id;
lin.append(ck, cx, ed); w.append(lin);
});
corpo.replaceChildren(w);
}
function desenha() {
const lista = todos(); porId = {}; lista.forEach((it) => { porId[it.id] = it; });
const map = agrupa(lista.filter((it) => filtros[it.tipo]));
rot.textContent = rotulo();
sec.querySelectorAll('.ag-vis button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === vis)));
desenhaCards();
if (vis === 'mes') desenhaMes(map); else if (vis === 'semana') desenhaSemana(map); else desenhaDia(map);
}
const campos = () => form.querySelectorAll('input, select, textarea');
const foco = () => [...modal.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([hidden])')].filter((e) => e.offsetParent !== null);
function abrirDlg(it, dataPadrao) {
editando = it || null; abridor = document.activeElement; erro.textContent = '';
const ex = !!(it && it.ex);
$('ag-dt').textContent = ex ? 'Exemplo' : it ? 'Editar lembrete' : 'Novo lembrete';
$('ag-exnota').hidden = !ex;
$('ag-titulo').value = it ? it.titulo : '';
const tp = it ? it.tipo : 'conteudo'; form.querySelectorAll('input[name="ag-tipo"]').forEach((r) => { r.checked = r.value === tp; });
$('ag-data').value = it ? it.data : (dataPadrao || iso(ancora));
$('ag-hini').value = it && it.hora_ini ? it.hora_ini : ''; $('ag-hfim').value = it && it.hora_fim ? it.hora_fim : '';
$('ag-setor').value = it && it.setor && setores[it.setor] ? it.setor : '';
$('ag-nota').value = it && it.nota ? it.nota : '';
campos().forEach((e) => { e.disabled = ex; });
$('ag-arq').hidden = !it || ex; $('ag-salvar').hidden = ex; $('ag-canc').textContent = ex ? 'Fechar' : 'Cancelar';
modal.hidden = false;
setTimeout(() => (ex ? $('ag-canc') : $('ag-titulo')).focus(), 0);
}
function fechaDlg() { modal.hidden = true; editando = null; if (abridor && abridor.isConnected) { try { abridor.focus(); } catch (e) { /* segue */ } } abridor = null; }
modal.addEventListener('click', (e) => { if (e.target === modal) fechaDlg(); });
$('ag-canc').addEventListener('click', fechaDlg);
document.addEventListener('keydown', (e) => {
if (modal.hidden) return;
if (e.key === 'Escape') { e.preventDefault(); fechaDlg(); return; }
if (e.key === 'Tab') { const f = foco(); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});
form.addEventListener('submit', async (e) => {
e.preventDefault();
if (editando && editando.ex) return;
const o = { titulo: $('ag-titulo').value.trim(), tipo: (form.querySelector('input[name="ag-tipo"]:checked') || {}).value, data: $('ag-data').value, hora_ini: $('ag-hini').value || null, hora_fim: $('ag-hfim').value || null, setor: $('ag-setor').value, nota: $('ag-nota').value.trim() };
const hh = /^\d{2}:\d{2}$/;
if (!o.titulo) { erro.textContent = 'Escreva o título.'; return; }
if (!TIPOS[o.tipo]) { erro.textContent = 'Escolha o tipo.'; return; }
if (!/^\d{4}-\d{2}-\d{2}$/.test(o.data)) { erro.textContent = 'Escolha o dia.'; return; }
if ((o.hora_ini && !hh.test(o.hora_ini)) || (o.hora_fim && !hh.test(o.hora_fim))) { erro.textContent = 'Confira as horas.'; return; }
if (o.hora_fim && !o.hora_ini) { erro.textContent = 'Coloque também a hora em que começa.'; return; }
if (o.hora_ini && o.hora_fim && o.hora_fim < o.hora_ini) { erro.textContent = 'O término não pode ser antes do começo.'; return; }
if (o.setor && !/^[a-z0-9-]{1,40}$/.test(o.setor)) { erro.textContent = 'Setor inválido.'; return; }
erro.textContent = '';
const bs = $('ag-salvar'); bs.disabled = true;
try {
if (editando) await atualizar(editando, o); else await adicionar(o);
ancora = deIso(o.data); fechaDlg(); desenha(); msg('Lembrete guardado.', 'ok'); sincroniza();
} catch (err) { erro.textContent = 'Não consegui guardar. Tente de novo.'; }
bs.disabled = false;
});
$('ag-arq').addEventListener('click', async () => {
if (!editando || editando.ex) return;
const b = $('ag-arq'); b.disabled = true;
try { await mudar(editando, 'arquivar'); fechaDlg(); desenha(); msg('Lembrete arquivado.', 'ok'); sincroniza(); }
catch (err) { erro.textContent = 'Não consegui arquivar. Tente de novo.'; }
b.disabled = false;
});
const estreito = () => matchMedia('(max-width: 720px)').matches;
corpo.addEventListener('click', async (e) => {
const t = e.target;
const ev = t.closest('.ag-ev, .ag-ed'); if (ev && ev.dataset.id && porId[ev.dataset.id]) { abrirDlg(porId[ev.dataset.id]); return; }
const ver = t.closest('[data-ver]'); if (ver) { ancora = deIso(ver.dataset.ver); vis = 'dia'; desenha(); return; }
const nv = t.closest('[data-novo]'); if (nv) { abrirDlg(null, nv.dataset.novo); return; }
const ck = t.closest('[data-feito]');
if (ck) { const it = porId[ck.dataset.feito]; if (it && !it.ex) { try { await mudar(it, 'feito', !it.feito); desenha(); sincroniza(); } catch (err) { msg('Não consegui atualizar. Tente de novo.', 'erro'); } } return; }
const st = t.closest('[data-setor]'); if (st) { if (typeof cpAbrir === 'function') cpAbrir(st.dataset.setor, true); return; }
const add = t.closest('.ag-add'); if (add) { abrirDlg(null, add.closest('[data-d]').dataset.d); return; }
const cel = t.closest('[data-d]');
if (cel) { if (vis === 'mes' && estreito()) { ancora = deIso(cel.dataset.d); vis = 'dia'; desenha(); } else abrirDlg(null, cel.dataset.d); }
});
sec.querySelector('.ag-vis').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; vis = b.dataset.v; desenha(); });
const mover = (s) => {
const y = ancora.getFullYear(), m = ancora.getMonth(), d = ancora.getDate();
if (vis === 'mes') ancora = new Date(y, m + s, Math.min(d, new Date(y, m + s + 1, 0).getDate()));
else ancora = new Date(y, m, d + (vis === 'semana' ? 7 : 1) * s);
desenha();
};
$('ag-ant').addEventListener('click', () => mover(-1));
$('ag-prox').addEventListener('click', () => mover(1));
$('ag-hoje').addEventListener('click', () => { const h = new Date(); ancora = new Date(h.getFullYear(), h.getMonth(), h.getDate()); desenha(); });
$('ag-novo').addEventListener('click', () => abrirDlg(null, iso(ancora)));
$('ag-filtros').addEventListener('change', (e) => {
const t = e.target;
if (t.id === 'ag-ex') { exemplos = t.checked; try { localStorage.setItem(CHEX, exemplos ? '1' : '0'); } catch (err) { /* segue */ } }
else if (t.dataset && t.dataset.t) filtros[t.dataset.t] = t.checked;
desenha();
});
async function carregar() {
try { mcp = window.claude && window.claude.use ? await window.claude.use('mcp') : null; } catch (e) { mcp = null; }
if (mcp) { try { await recarrega(); modo = 'sb'; } catch (e) { modo = 'local'; falha = true; itens = lerLocal(); } }
else { modo = 'local'; itens = lerLocal(); }
let g = null; try { g = localStorage.getItem(CHEX); } catch (e) { /* segue */ }
exemplos = g === null ? itens.length === 0 : g === '1';
$('ag-ex').checked = exemplos;
base(); desenha();
}
const recarregaQuieto = async () => {
try { if (modo === 'sb') await recarrega(); else if (modo === 'local') itens = lerLocal(); desenha(); } catch (e) { /* segue */ }
};
const orig = window.cpAbrir;
if (typeof orig === 'function') window.cpAbrir = (id, rolar) => { orig(id, rolar); if (id === 'agenda' && modo !== 'carregando') recarregaQuieto(); };
window.cpAgendaRecarrega = recarregaQuieto;
desenha();
carregar();
})();
(() => {
const app = document.querySelector('.cp-app');
if (!app || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
app.classList.add('cp-entrada');
app.addEventListener('animationend', (ev) => { if (ev.target === app) app.classList.remove('cp-entrada'); }, { once: true });
setTimeout(() => app.classList.remove('cp-entrada'), 1600);
})();
(() => {
// Pausa para o café: nas horas pares, durante 15 minutos (ou com ?cafe na URL), o widget do tempo mostra a ilustração.
const el = document.getElementById('cl-cafe'); if (!el) return;
const forca = /[?&]cafe(=|&|$)/.test(location.search);
let fechado = '';
const slot = () => { const d = new Date(); return d.toDateString() + '-' + d.getHours(); };
const confere = () => {
const d = new Date(), vez = forca || (d.getHours() % 2 === 0 && d.getMinutes() < 15);
const on = vez && fechado !== slot(); el.classList.toggle('on', on); el.setAttribute('aria-hidden', String(!on)); el.tabIndex = on ? 0 : -1;
};
el.addEventListener('click', () => { fechado = slot(); confere(); });
confere(); setInterval(confere, 30000);
})();
(() => {
// Fim do expediente: às 19h, durante 15 minutos, o widget do tempo mostra GAME OVER (na sexta, SEXTOU!). Toque para dispensar.
// Para testar: ?fim mostra GAME OVER e ?sexta mostra SEXTOU! na hora.
const a = document.getElementById('cl-fim'), b = document.getElementById('cl-sexta'); if (!a || !b) return;
const q = location.search, forcaA = /[?&]fim(=|&|$)/.test(q), forcaB = /[?&]sexta(=|&|$)/.test(q);
let fechado = '';
const dia = () => new Date().toDateString();
const confere = () => {
const d = new Date(), hora = d.getHours() === 19 && d.getMinutes() < 15, sexta = d.getDay() === 5;
const livre = fechado !== dia();
const onB = livre && (forcaB || (!forcaA && hora && sexta)), onA = livre && !onB && (forcaA || hora);
[[a, onA], [b, onB]].forEach(([el, on]) => { el.classList.toggle('on', on); el.setAttribute('aria-hidden', String(!on)); el.tabIndex = on ? 0 : -1; });
};
[a, b].forEach((el) => el.addEventListener('click', () => { fechado = dia(); confere(); }));
confere(); setInterval(confere, 30000);
})();
(() => {
// ERROR 404 no widget do tempo: aparece quando o clima não carrega (toque para tentar de novo) e na brincadeira dos 5 toques na temperatura.
const el = document.getElementById('cl-404'), tx = document.getElementById('cl-404-t'); if (!el) return;
let aoToque = null, tm = 0;
const fecha = () => { clearTimeout(tm); el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); el.tabIndex = -1; };
window.cp404 = (texto, ms, depois) => {
tx.textContent = texto || ''; aoToque = depois || null; clearTimeout(tm);
el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); el.tabIndex = 0;
if (ms) tm = setTimeout(fecha, ms);
};
el.addEventListener('click', () => { const f = aoToque; fecha(); aoToque = null; if (f) f(); });
// brincadeira: 5 toques na temperatura em até 3 segundos
const alvo = document.querySelector('#cp-clima .cl-n') || document.getElementById('cl-t'); if (!alvo) return;
let n = 0, t0 = 0;
alvo.addEventListener('click', () => { const agora = Date.now(); if (agora - t0 > 3000) n = 0; if (!n) t0 = agora; n++; if (n >= 5) { n = 0; window.cp404('Brincadeira! O clima está ok.', 5000, null); } });
if (/[?&]erro404(=|&|$)/.test(location.search)) window.cp404('Clima não encontrado · toque para tentar de novo', 0, null);
})();

(() => {
// Homenagens no widget do tempo: Dia das Mulheres (8 de março) e Dia das Mães (2º domingo de maio), o dia todo. Toque para dispensar.
// Para testar: ?mulheres ou ?maes mostra o cartão na hora.
const el = document.getElementById('cl-flor'), im = document.getElementById('cl-flor-i'); if (!el || !im) return;
const q = location.search, fM = /[?&]maes(=|&|$)/.test(q), fW = /[?&]mulheres(=|&|$)/.test(q);
let fechado = '';
const dia = () => new Date().toDateString();
const qual = () => {
const d = new Date(), m = d.getMonth(), n = d.getDate();
if (fM) return 'maes'; if (fW) return 'mulheres';
if (m === 2 && n === 8) return 'mulheres';
if (m === 4 && d.getDay() === 0 && n >= 8 && n <= 14) return 'maes';
return '';
};
const confere = () => {
const k = qual(), on = !!k && fechado !== dia();
if (k) { im.src = 'icones/dia-das-' + k + '.svg'; im.alt = k === 'maes' ? 'Feliz Dia das Mães' : 'Feliz Dia das Mulheres'; }
el.classList.toggle('on', on); el.setAttribute('aria-hidden', String(!on)); el.tabIndex = on ? 0 : -1;
};
el.addEventListener('click', () => { fechado = dia(); confere(); });
confere(); setInterval(confere, 60000);
})();
(() => {
// Celular: os gráficos medem o espaço quando são desenhados. Se a seção estava escondida (largura 0), saem cortados; por isso redesenha
// ao abrir uma seção e quando a largura da janela muda (girar o celular, abrir o teclado não conta: só a largura).
const redesenha = () => { try { if (typeof window.painelDesenhaTudo === 'function') window.painelDesenhaTudo(); } catch (e) { /* segue */ } };
const abre = window.cpAbrir;
if (typeof abre === 'function') window.cpAbrir = (id, rolar) => { abre(id, rolar); requestAnimationFrame(() => requestAnimationFrame(redesenha)); };
let larg = window.innerWidth, t = 0;
window.addEventListener('resize', () => { if (window.innerWidth === larg) return; larg = window.innerWidth; clearTimeout(t); t = setTimeout(redesenha, 200); });
})();
(() => {
const busca = document.querySelector('input[placeholder^="Procurar setor"]');
const ajusta = () => { if (busca) busca.placeholder = window.innerWidth <= 560 ? 'Procurar…' : 'Procurar setor, editor ou assunto…'; };
ajusta(); window.addEventListener('resize', ajusta);
const centraAba = () => { const a = document.querySelector('.cp-side .cp-item.on, .cp-side .cp-item.ativo, .cp-side .cp-item[aria-current]'); if (a && window.innerWidth <= 760) { try { a.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { /* segue */ } } };
document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-go]')) setTimeout(centraAba, 50); });
})();
