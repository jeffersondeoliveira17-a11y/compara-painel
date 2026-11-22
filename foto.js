// Foto do perfil: escolhe uma imagem, recorta em quadrado, reduz e guarda no Supabase (painel_config.avatar).
(() => {
  const sb = window.painelSb; if (!sb) return;
  const $ = (id) => document.getElementById(id);
  const LS = 'cp-foto';
  const sq = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const sql = async (q) => { const { data, error } = await sb.rpc('painel_sql', { q }); if (error) throw error; return data || []; };
  const avs = () => document.querySelectorAll('.cp-ava');
  function aplica(url) {
    avs().forEach((e) => {
      if (url) { e.style.backgroundImage = 'url("' + url + '")'; e.classList.add('com-foto'); }
      else { e.style.backgroundImage = ''; e.classList.remove('com-foto'); }
    });
    const rm = $('cp-foto-rm'); if (rm) rm.hidden = !url;
  }
  try { aplica(localStorage.getItem(LS)); } catch (e) { /* sem cache */ }
  (async () => { try { const r = await sql(`select valor from public.painel_arquivo where chave = 'avatar'`); const v = r[0] && r[0].valor; aplica(v || null); try { v ? localStorage.setItem(LS, v) : localStorage.removeItem(LS); } catch (e) { /* ok */ } } catch (e) { /* mantém o cache */ } })();
  const aviso = (t) => { const b = $('cp-foto-item'); if (b) { const s = b.querySelector('small'); if (s) s.textContent = t; } };
  const guarda = async (url) => {
    if (url) await sql(`insert into public.painel_arquivo (chave, valor) values ('avatar', ${sq(url)}) on conflict (chave) do update set valor = excluded.valor, atualizado_em = now()`);
    else await sql(`delete from public.painel_arquivo where chave = 'avatar'`);
    try { url ? localStorage.setItem(LS, url) : localStorage.removeItem(LS); } catch (e) { /* ok */ }
    aplica(url);
  };
  function reduz(img) {
    for (const [lado, q] of [[192, .82], [160, .78], [128, .75], [96, .7]]) {
      const c = document.createElement('canvas'); c.width = c.height = lado; const x = c.getContext('2d');
      const m = Math.min(img.width, img.height), sx = (img.width - m) / 2, sy = (img.height - m) / 2;
      x.drawImage(img, sx, sy, m, m, 0, 0, lado, lado);
      const u = c.toDataURL('image/jpeg', q); if (u.length < 17000) return u;
    }
    return null;
  }
  $('cp-foto-item').addEventListener('click', () => $('cp-foto-in').click());
  $('cp-foto-rm').addEventListener('click', async () => { try { await guarda(null); aviso('Escolha uma imagem do seu computador'); } catch (e) { aviso('Não consegui remover. Tente de novo.'); } });
  $('cp-foto-in').addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
    if (!/^image\//.test(f.type)) { aviso('Escolha um arquivo de imagem.'); return; }
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const u = reduz(img); if (!u) { aviso('Imagem complexa demais. Tente outra.'); return; }
      aviso('Salvando…');
      try { await guarda(u); aviso('Foto atualizada.'); } catch (e) { aviso('Não consegui salvar. Tente de novo.'); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); aviso('Não consegui abrir essa imagem.'); };
    img.src = url;
  });
})();
