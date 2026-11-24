# Presença IFBA — Campus Vitória da Conquista

Aplicação estática para gerenciamento de eventos e registro público de presença, usando Supabase Auth, PostgreSQL e GitHub Pages.

## Arquivos

- `index.html`: estrutura da aplicação.
- `style.css`: identidade visual responsiva verde, branca e vermelha.
- `app.js`: autenticação, gerenciamento de eventos, formulário público, QR Code e CSV.
- `supabase.sql`: ajuste opcional/recomendado da política pública de leitura e índices.

## Configuração atual

O `app.js` já contém a URL do projeto Supabase e a chave `sb_publishable_...` fornecidas para este projeto. A chave publishable é apropriada para uso no navegador; nunca coloque uma chave `service_role` no frontend.

## 1. Conferir o Supabase

O sistema utiliza as tabelas existentes:

- `events`: `id`, `title`, `description`, `is_active`, `start_at`, `end_at`, `created_at`.
- `attendances`: `id`, `event_id`, `full_name`, `enrollment`, `modality`, `course`, `period`, `class_name`, `created_at`.
- `admin_users`: `user_id`, `created_at`.

A função `public.is_admin()`, o vínculo de administrador e as políticas administrativas já foram criados no projeto. O banco também possui o índice único `(event_id, enrollment)` para impedir duplicidade.

### Ajuste de política para eventos agendados

Execute `supabase.sql` no SQL Editor. A política de leitura pública passa a permitir consultar os dados básicos de qualquer evento ativo, inclusive antes do horário de abertura ou depois do encerramento. Isso permite que a página mostre “inscrições ainda não começaram” ou “período encerrado”. A política de INSERT de presenças continua validando `is_active`, `start_at` e `end_at` no banco.

Não remova nem desative RLS. Não publique `service_role`.

## 2. Login administrativo

O painel usa Supabase Auth com e-mail e senha. O usuário que fará login precisa:

1. existir em `auth.users`;
2. estar cadastrado em `public.admin_users` pelo `user_id` correspondente.

O ID de usuário não é senha. Se precisar redefinir a senha, use o fluxo de recuperação do Supabase Auth ou o painel de autenticação.

## 3. Teste local

Como o Supabase é acessado pelo navegador, teste servindo a pasta por HTTP (não é necessário backend próprio). Por exemplo, com Python instalado:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

Teste nesta ordem:

1. Faça login como administrador.
2. Crie um evento com início imediato e encerramento futuro.
3. Abra o link/QR Code em janela anônima ou outro navegador.
4. Registre uma presença de teste.
5. Tente enviar novamente a mesma matrícula no mesmo evento: o banco deve bloquear a duplicidade.
6. Volte ao painel e confira a presença; teste a exportação CSV.
7. Teste um evento futuro e um encerrado.

## 4. Publicar no GitHub Pages

1. Envie os quatro arquivos (`index.html`, `style.css`, `app.js`, `supabase.sql`) e este `README.md` para a raiz do repositório `presenca-ifba`.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**.
4. Escolha a branch principal (`main`) e a pasta `/ (root)`; salve.
5. Aguarde o endereço publicado aparecer na mesma tela.
6. Cadastre esse domínio em **Supabase → Authentication → URL Configuration → Site URL** e inclua também a URL de produção em **Redirect URLs**, se utilizar recuperação de senha.

## Limitações e segurança

- O cadastro público não exige login, conforme o objetivo do sistema. A proteção contra duplicidade é aplicada pelo índice único no PostgreSQL, não apenas pelo JavaScript.
- A página pública não tem permissão de consultar a lista de presenças. Somente usuários autenticados reconhecidos por `is_admin()` podem consultar/gerenciar registros.
- O sistema não implementa bloqueio por IP: o HTML original apenas guardava uma lista informativa, sem mecanismo de servidor que verificasse o IP. Não use essa opção como controle de segurança.
- A versão inicial utiliza os campos existentes e não inclui perguntas personalizadas, banner de evento ou código de sala, pois essas funcionalidades exigiriam campos e validações adicionais no banco/servidor.
- O formulário coleta dados pessoais de estudantes. Restrinja o acesso administrativo, divulgue a finalidade da coleta e mantenha os registros somente pelo período institucionalmente necessário.
- O GitHub Pages hospeda arquivos estáticos. As regras de segurança e validação sensível devem permanecer no Supabase, nunca depender apenas do código do navegador.
