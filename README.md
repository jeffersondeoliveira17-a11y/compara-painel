# Painel Compara

Painel de gestão do app Compara (Barueri). Site estático com login de administrador (Supabase Auth).

- Abra `index.html` pelo GitHub Pages: https://jeffersondeoliveira17-a11y.github.io/compara-painel/
- Só entra quem está na tabela `painel_admin` do Supabase. A chave em `config.js` é a "publishable" (pública por desenho); a proteção está no banco (RLS + função `painel_sql` restrita a administradores).
- Para liberar outro administrador: a pessoa cria a conta em `.../#criar` e o administrador insere o e-mail dela em `painel_admin`.
