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

  // agenda do dia: horas rolando, blocos dos lembretes e a barra de cima (verde = em dia, vermelho claro = tem coisa atrasada)
  const ROW = 40, rol = $('ag-rol'), inn = $('ag-in'), barra = $('ag-bar'), dia = $('ag-dia'), res = $('ag-res');
  let diaSel = hoje; dia.value = hoje;
  const hm = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
  const rot = (h) => (h === 0 ? '12 AM' : h < 12 ? h + ' AM' : h === 12 ? '12 PM' : (h - 12) + ' PM');
  const agora = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
  async function marca(id) { try { await sql(`update public.lembrete set feito = true where id = ${sq(id)}::uuid`); carregaAgenda(); if (window.cpAgendaRecarrega) window.cpAgendaRecarrega(); if (window.cpCalRecarrega) window.cpCalRecarrega(); } catch (e) { /* mantém */ } }
  function pinta(rows, atrasados) {
    barra.className = 'ag-bar' + (atrasados ? ' at' : ''); barra.title = atrasados ? atrasados + (atrasados === 1 ? ' lembrete atrasado' : ' lembretes atrasados') : 'Nada atrasado';
    res.textContent = atrasados ? atrasados + ' atrasado' + (atrasados === 1 ? '' : 's') : '';
    inn.innerHTML = ''; inn.style.height = (24 * ROW) + 'px';
    for (let h = 0; h < 24; h++) { const l = document.createElement('div'); l.className = 'ag-h'; l.style.top = (h * ROW) + 'px'; l.innerHTML = '<span>' + rot(h) + '</span>'; inn.append(l); }
    const ehHoje = diaSel === hoje, ag = agora();
    const com = rows.filter((r) => hm(r.hi) != null).map((r) => { const a0 = hm(r.hi); let a1 = hm(r.hf); if (a1 == null || a1 <= a0) a1 = a0 + 45; return { r, a0, a1, lane: 0 }; }).sort((x, y) => x.a0 - y.a0);
    // colunas lado a lado quando dois lembretes se sobrepõem
    const fim = []; com.forEach((e) => { let k = 0; while (fim[k] != null && fim[k] > e.a0) k++; e.lane = k; fim[k] = e.a1; });
    com.forEach((e) => { e.n = 1; com.forEach((o) => { if (o.a0 < e.a1 && o.a1 > e.a0) e.n = Math.max(e.n, o.lane + 1, e.lane + 1); }); });
    const sem = rows.filter((r) => hm(r.hi) == null);
    const bloco = (r, st, cls) => {
      const b = document.createElement('div'); b.className = 'ag-b' + (cls || '');
      const tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = tx(r.titulo);
      if (r.hi) { const sm = document.createElement('small'); sm.textContent = r.hi + (r.hf ? ' – ' + r.hf : ''); tt.append(sm); }
      b.append(tt);
      if (!r.feito) { const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cb'; cb.setAttribute('aria-label', 'Marcar como feito: ' + tx(r.titulo)); cb.addEventListener('click', () => { b.classList.add('fim'); marca(r.id); }); b.append(cb); } else b.classList.add('fim');
      Object.assign(b.style, st); return b;
    };
    com.forEach((e) => {
      const atras = !e.r.feito && (diaSel < hoje || (ehHoje && e.a1 < ag));
      inn.append(bloco(e.r, { top: (e.a0 / 60 * ROW + 1) + 'px', height: Math.max(26, (e.a1 - e.a0) / 60 * ROW - 2) + 'px', left: (e.lane * 100 / e.n) + '%', width: (100 / e.n) + '%' }, atras ? ' at' : ''));
    });
    if (ehHoje) { const n = document.createElement('div'); n.className = 'ag-ag'; n.style.top = (ag / 60 * ROW) + 'px'; inn.append(n); }
    const f = $('ag-sh'); f.innerHTML = ''; f.hidden = !sem.length; // sem hora: por cima das horas, até 2 (o resto vira "+N")
    sem.slice(0, 2).forEach((r) => f.append(bloco(r, {}, !r.feito && diaSel < hoje ? ' at' : '')));
    if (sem.length > 2) { const m = document.createElement('div'); m.className = 'ag-mais'; m.textContent = '+' + (sem.length - 2) + ' sem hora'; f.append(m); }
    $('ag-cal').classList.toggle('out', diaSel !== hoje); $('ag-cal').title = diaSel === hoje ? 'Escolher o dia' : 'Dia ' + diaSel.split('-').reverse().join('/') + ' (toque para trocar)';
  }
  async function carregaAgenda(rolar) {
    try {
      const d = sq(diaSel), t = sq(p2(Math.floor(agora() / 60)) + ':' + p2(agora() % 60));
      const [rows, at] = await Promise.all([
        sql(`select id, titulo, to_char(hora_ini,'HH24:MI') as hi, to_char(hora_fim,'HH24:MI') as hf, feito from public.lembrete where status = 'ativo' and data = ${d}::date order by hora_ini nulls first, titulo limit 80`),
        sql(`select count(*)::int as n from public.lembrete where status = 'ativo' and not feito and (data < ${sq(hoje)}::date or (data = ${sq(hoje)}::date and hora_ini is not null and coalesce(hora_fim, hora_ini) < ${t}::time))`),
      ]);
      const prev = rol.scrollTop;
      pinta(rows, (at[0] && +at[0].n) || 0);
      if (rolar) { const h = rows.map((r) => hm(r.hi)).filter((x) => x != null).sort((a, b) => a - b)[0]; const alvo = diaSel === hoje ? agora() : (h != null ? h : 8 * 60); rol.scrollTop = Math.max(0, alvo / 60 * ROW - ROW * 0.8); } else rol.scrollTop = prev;
    } catch (e) { barra.className = 'ag-bar'; inn.innerHTML = '<div class="cp-vz" style="padding:10px">Não consegui carregar a agenda.</div>'; }
  }
  dia.addEventListener('change', () => { diaSel = dia.value || hoje; carregaAgenda(true); });
  $('ag-cal').addEventListener('click', () => { try { dia.showPicker(); } catch (e) { dia.focus(); } });
  carregaAgenda(true); setInterval(() => carregaAgenda(false), 60000);
  window.cpAgendaPainel = carregaAgenda;

  // notas rápidas
  const nt = $('nt-txt'), st = $('nt-st'); let tm = null, pronto = false;
  (async () => {
    try { const r = await sql(`select valor from public.painel_arquivo where chave = 'notas_rapidas'`); nt.value = r[0] ? tx(r[0].valor) : ''; } catch (e) { st.textContent = 'sem conexão'; }
    pronto = true;
  })();
  nt.addEventListener('input', () => {
    if (!pronto) return; st.textContent = 'salvando…'; clearTimeout(tm);
    tm = setTimeout(async () => {
      try { await sql(`insert into public.painel_arquivo (chave, valor) values ('notas_rapidas', ${sq(nt.value)}) on conflict (chave) do update set valor = excluded.valor, atualizado_em = now()`); st.textContent = 'salvo'; }
      catch (e) { st.textContent = 'não salvou'; }
    }, 800);
  });
})();
