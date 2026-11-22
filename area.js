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

  // hoje
  const lista = $('hj-lista');
  const vazio = (t) => { lista.innerHTML = ''; const li = document.createElement('li'); li.className = 'cp-vz'; li.textContent = t; lista.append(li); };
  async function carregaHoje() {
    try {
      let rows = await sql(`select id, to_char(data,'DD/MM') as d, data::text as iso, titulo, to_char(hora_ini,'HH24:MI') as h from public.lembrete where status = 'ativo' and not feito and data <= ${sq(hoje)}::date order by data, hora_ini nulls last limit 2`);
      let tit = 'Hoje';
      if (!rows.length) { rows = await sql(`select id, to_char(data,'DD/MM') as d, data::text as iso, titulo, to_char(hora_ini,'HH24:MI') as h from public.lembrete where status = 'ativo' and not feito and data > ${sq(hoje)}::date order by data, hora_ini nulls last limit 2`); tit = 'Próximos'; }
      $('hj-tit').textContent = tit;
      if (!rows.length) return vazio('Nada marcado. Dia livre.');
      lista.innerHTML = '';
      rows.forEach((r) => {
        const li = document.createElement('li');
        const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cb'; cb.setAttribute('aria-label', 'Marcar como feito: ' + tx(r.titulo));
        const box = document.createElement('div'); const t = document.createElement('span'); t.textContent = tx(r.titulo);
        const s = document.createElement('small'); s.textContent = (r.iso === hoje ? 'Hoje' : r.iso < hoje ? 'Atrasado · ' + r.d : r.d) + (r.h ? ' · ' + r.h : '');
        box.append(t, s); li.append(cb, box); lista.append(li);
        cb.addEventListener('click', async () => {
          li.classList.add('fim');
          try { await sql(`update public.lembrete set feito = true where id = ${sq(r.id)}::uuid`); setTimeout(carregaHoje, 500); if (window.cpAgendaRecarrega) window.cpAgendaRecarrega(); if (window.cpCalRecarrega) window.cpCalRecarrega(); }
          catch (e) { li.classList.remove('fim'); }
        });
      });
    } catch (e) { vazio('Não consegui carregar os lembretes.'); }
  }
  carregaHoje();
  // novo lembrete direto do cartão
  const fd = $('agr-d'); fd.value = hoje; fd.min = '';
  $('agr').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = $('agr-t').value.trim(); if (!t) return;
    const bt = e.submitter || $('agr').querySelector('.agr-ok'); bt.disabled = true;
    try {
      await sql(`insert into public.lembrete (data, titulo) values (${sq(fd.value || hoje)}::date, ${sq(t)})`);
      $('agr-t').value = ''; await carregaHoje();
      if (window.cpAgendaRecarrega) window.cpAgendaRecarrega(); if (window.cpCalRecarrega) window.cpCalRecarrega();
    } catch (err) { $('agr-t').placeholder = 'Não consegui salvar. Tente de novo.'; }
    bt.disabled = false;
  });

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
