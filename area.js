// Área de trabalho: lembretes de hoje (com baixa) e notas rápidas salvas no Supabase.
(() => {
  const sb = window.painelSb; if (!sb) return;
  const $ = (id) => document.getElementById(id);
  const sq = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = async (q) => { const { data, error } = await sb.rpc('painel_sql', { q }); if (error) throw error; return data || []; };
  const d0 = new Date(), p2 = (n) => String(n).padStart(2, '0');
  const hoje = d0.getFullYear() + '-' + p2(d0.getMonth() + 1) + '-' + p2(d0.getDate());
  const tx = (s) => String(s == null ? '' : s);

  // ações rápidas: "Novo lembrete" abre o formulário da Agenda
  document.querySelectorAll('.cp-qa[data-novo]').forEach((b) => b.addEventListener('click', () => setTimeout(() => { const n = $('ag-novo'); if (n) n.click(); }, 350)));

  // agenda de hoje: linha do tempo com rolagem
  const PX = 58, cores = ['#fde3cc', '#d3e6f6', '#d9f0e3', '#e6e0f7'];
  const tl = $('tl'), tin = $('tl-in');
  let rolou = false;
  const mins = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
  const lbl = (h) => h + 'h';
  function monta(rows) {
    tin.innerHTML = ''; tin.style.height = (24 * PX + 8) + 'px';
    for (let h = 0; h < 24; h++) {
      const l = document.createElement('div'); l.className = 'tl-h'; l.style.top = (h * PX) + 'px';
      const sp = document.createElement('span'); sp.textContent = lbl(h); l.append(sp); tin.append(l);
    }
    const agora = new Date(), top = (agora.getHours() * 60 + agora.getMinutes()) / 60 * PX;
    const nl = document.createElement('div'); nl.className = 'tl-now'; nl.style.top = top + 'px'; tin.append(nl);
    const dia = rows.filter((r) => !r.hi), hor = rows.filter((r) => r.hi);
    const mk = (r, i, topPx, hPx) => {
      const b = document.createElement('div'); b.className = 'tl-ev' + (r.feito ? ' fim' : ''); b.style.background = cores[i % cores.length];
      if (topPx != null) { b.style.top = topPx + 'px'; b.style.height = hPx + 'px'; }
      const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cb'; cb.setAttribute('aria-label', (r.feito ? 'Desmarcar: ' : 'Marcar como feito: ') + tx(r.titulo));
      const bx = document.createElement('div'); const t = document.createElement('b'); t.textContent = tx(r.titulo); bx.append(t);
      const sub = [r.hi ? r.hi + (r.hf ? '–' + r.hf : '') : 'Dia todo', r.nota].filter(Boolean).join(' · ');
      const s = document.createElement('small'); s.textContent = sub; bx.append(s);
      b.append(cb, bx);
      cb.addEventListener('click', async () => { b.classList.toggle('fim'); try { await sql(`update public.lembrete set feito = ${r.feito ? 'false' : 'true'} where id = ${sq(r.id)}::uuid`); if (window.cpAgendaRecarrega) window.cpAgendaRecarrega(); if (window.cpCalRecarrega) window.cpCalRecarrega(); carregaHoje(); } catch (e) { b.classList.toggle('fim'); } });
      return b;
    };
    hor.forEach((r, i) => { const ini = mins(r.hi), fim = r.hf ? mins(r.hf) : ini + 60; tin.append(mk(r, i, ini / 60 * PX + 2, Math.max(46, (fim - ini) / 60 * PX - 4))); });
    if (dia.length) { const box = document.createElement('div'); box.className = 'tl-dia'; dia.forEach((r, i) => box.append(mk(r, i + hor.length))); tin.prepend(box); }
    if (!rows.length) { const v = document.createElement('div'); v.className = 'tl-vz'; v.textContent = 'Nada marcado para hoje.'; tin.append(v); }
    if (!rolou) { rolou = true; const alvo = hor.length ? Math.min(...hor.map((r) => mins(r.hi))) / 60 * PX : top; tl.scrollTop = Math.max(0, Math.min(top, alvo) - PX); }
  }
  async function carregaHoje() {
    try {
      const rows = await sql(`select id, titulo, nota, feito, to_char(hora_ini,'HH24:MI') as hi, to_char(hora_fim,'HH24:MI') as hf from public.lembrete where status = 'ativo' and data = ${sq(hoje)}::date order by hora_ini nulls first, criado_em`);
      monta(rows);
    } catch (e) { tin.innerHTML = ''; const v = document.createElement('div'); v.className = 'tl-vz'; v.textContent = 'Não consegui carregar a agenda.'; tin.append(v); }
  }
  carregaHoje(); setInterval(carregaHoje, 120000);

  // notas rápidas
  const nt = $('nt-txt'), st = $('nt-st'); let tm = null, pronto = false;
  (async () => {
    try { const r = await sql(`select valor from public.painel_config where chave = 'notas_rapidas'`); nt.value = r[0] ? tx(r[0].valor) : ''; } catch (e) { st.textContent = 'sem conexão'; }
    pronto = true;
  })();
  nt.addEventListener('input', () => {
    if (!pronto) return; st.textContent = 'salvando…'; clearTimeout(tm);
    tm = setTimeout(async () => {
      try { await sql(`insert into public.painel_config (chave, valor) values ('notas_rapidas', ${sq(nt.value)}) on conflict (chave) do update set valor = excluded.valor, atualizado_em = now()`); st.textContent = 'salvo'; }
      catch (e) { st.textContent = 'não salvou'; }
    }, 800);
  });
})();
