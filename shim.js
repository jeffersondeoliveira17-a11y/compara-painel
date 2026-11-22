// Faz o painel funcionar fora do Claude: dados de exemplo, "dash" e ponte com o Supabase (login de administrador).
(() => {
  const cfg = window.PAINEL_CONFIG;
  const sb = window.supabase.createClient(cfg.url, cfg.chave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  window.painelSb = sb;

  // ---- runtime "dash": fontes de dados, cálculos e desenhos ----
  const fontes = {}, calcs = {}, memo = {}, desenhos = [];
  for (const k in window.PAINEL_CSV) fontes[k] = d3.csvParse(window.PAINEL_CSV[k]);
  const dado = (id) => {
    if (fontes[id]) return { status: 'ok', data: fontes[id] };
    if (memo[id]) return memo[id];
    const c = calcs[id];
    if (!c) return { status: 'error', data: null };
    try { return (memo[id] = { status: 'ok', data: c.fn(...c.inputs.map((i) => dado(i).data)) }); }
    catch (e) { return { status: 'error', data: null }; }
  };
  window.dash = {
    colors: ['#138A9C', '#D9A21B', '#D9567A', '#8E5CC4'],
    data: dado,
    calc: (id, o) => { calcs[id] = o; delete memo[id]; },
    draw: (nome, fn) => desenhos.push([nome, fn]),
    onData: (f) => { try { f(); } catch (e) { /* segue */ } },
    setLink: () => {},
    params: () => ({})
  };
  const desenhaTudo = () => desenhos.forEach(([nome, fn]) => document.querySelectorAll('[data-draw="' + nome + '"]').forEach((el) => { try { fn(el); } catch (e) { console.error(nome, e); } }));

  // ---- ponte com o Supabase no lugar do conector do Claude ----
  const embrulha = (obj) => '<untrusted-data-painel>\n' + JSON.stringify(obj) + '\n</untrusted-data-painel>';
  const mcp = {
    callTool: async (servidor, ferramenta, args) => {
      const q = String((args && args.query) || '');
      const m = q.match(/http_get\('(https:\/\/api\.open-meteo\.com\/[^']+)'/);
      if (m) { // clima: o navegador busca direto (o banco não é preciso aqui)
        const r = await fetch(m[1]); if (!r.ok) throw new Error('clima ' + r.status);
        const j = await r.json(); return { payload: embrulha([{ c: j.current, h: j.hourly }]) };
      }
      const { data, error } = await sb.rpc('painel_sql', { q });
      if (error) throw new Error(error.message);
      return { payload: embrulha(data) };
    }
  };
  window.claude = { use: async (nome) => (nome === 'mcp' ? mcp : null) };

  // ---- tela de login ----
  const raiz = document.documentElement;
  const el = (id) => document.getElementById(id);
  const msg = (t, ok) => { const m = el('lg-msg'); m.textContent = t || ''; m.className = ok ? 'ok' : ''; };
  const modo = (m) => { // entrar | criar | esqueci | nova
    ['entrar', 'criar', 'esqueci', 'nova'].forEach((x) => { el('lg-' + x).hidden = x !== m; });
    msg('');
  };
  let iniciou = false;
  async function liberar(sessao) {
    if (iniciou) return;
    const { data, error } = await sb.rpc('painel_eh_admin');
    if (error || data !== true) {
      await sb.auth.signOut(); raiz.classList.add('bloqueado'); el('login').hidden = false; modo('entrar');
      msg('Esta conta não tem acesso ao painel. Peça ao administrador para liberar o seu e-mail.');
      return;
    }
    iniciou = true;
    raiz.classList.remove('bloqueado'); el('login').hidden = true;
    const menu = document.getElementById('cp-menu-perfil');
    if (menu && !el('cp-sair')) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'it'; b.id = 'cp-sair';
      b.innerHTML = 'Sair<small>Encerrar a sessão neste navegador</small>';
      b.addEventListener('click', async () => { await sb.auth.signOut(); location.reload(); });
      menu.append(b);
      const h = menu.querySelector('h4'); if (h && sessao && sessao.user && sessao.user.email) h.textContent = sessao.user.email + ' · Administrador';
    }
    window.painelIniciar();
  }
  const pedir = async (fn, ok) => { try { const r = await fn(); if (r.error) throw r.error; if (ok) msg(ok, true); return r; } catch (e) { msg(/invalid login/i.test(e.message) ? 'E-mail ou senha incorretos.' : e.message); return null; } };
  el('lg-entrar').addEventListener('submit', async (e) => { e.preventDefault(); msg('Entrando…', true);
    const r = await pedir(() => sb.auth.signInWithPassword({ email: el('e-email').value.trim(), password: el('e-senha').value }));
    if (r) { msg(''); liberar(r.data.session); } });
  el('lg-criar').addEventListener('submit', async (e) => { e.preventDefault();
    const s = el('c-senha').value; if (s.length < 8) { msg('Use pelo menos 8 caracteres na senha.'); return; }
    await pedir(() => sb.auth.signUp({ email: el('c-email').value.trim(), password: s, options: { emailRedirectTo: location.origin + location.pathname } }), 'Conta criada. Se o Supabase pedir, confirme pelo link que chegou no seu e-mail e depois entre.'); });
  el('lg-esqueci').addEventListener('submit', async (e) => { e.preventDefault();
    await pedir(() => sb.auth.resetPasswordForEmail(el('s-email').value.trim(), { redirectTo: location.origin + location.pathname }), 'Se esse e-mail existir, mandamos um link para criar uma nova senha.'); });
  el('lg-nova').addEventListener('submit', async (e) => { e.preventDefault();
    const s = el('n-senha').value; if (s.length < 8) { msg('Use pelo menos 8 caracteres.'); return; }
    const r = await pedir(() => sb.auth.updateUser({ password: s })); if (r) { msg(''); const { data } = await sb.auth.getSession(); liberar(data.session); } });
  document.querySelectorAll('[data-lg]').forEach((b) => b.addEventListener('click', () => modo(b.dataset.lg)));

  window.painelIniciar = () => { window.painelCarregarScript(); };
  sb.auth.onAuthStateChange((evento) => { if (evento === 'PASSWORD_RECOVERY') { raiz.classList.add('bloqueado'); el('login').hidden = false; modo('nova'); } });
  (async () => {
    if (/#criar/.test(location.hash)) modo('criar'); else modo('entrar');
    const { data } = await sb.auth.getSession();
    if (data.session && !/type=recovery/.test(location.hash)) liberar(data.session);
  })();
  window.painelDesenhaTudo = desenhaTudo;
})();
