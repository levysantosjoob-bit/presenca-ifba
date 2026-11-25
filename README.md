# Presença IFBA — etapa de autenticação administrativa

Esta versão substitui o login demonstrativo por Supabase Auth e verifica a autorização administrativa usando a função `public.is_admin()` já existente no projeto.

## Configuração obrigatória

1. Abra `config.js`.
2. Cole em `PRESENCA_SUPABASE_PUBLISHABLE_KEY` a chave pública `sb_publishable_...` do projeto `kvcqgceqgmagqlcazrxa`.
3. Nunca coloque chave `secret` ou `service_role` no frontend.
4. No Supabase, em Authentication → URL Configuration, permita o domínio `https://levysantosjoob-bit.github.io`.
5. Publique `index.html`, `style.css`, `app.js` e `config.js` na raiz do repositório.

## Login

Use o e-mail e a senha da conta já cadastrada no Supabase Auth. O usuário precisa continuar vinculado à tabela `public.admin_users`. Após autenticar, o frontend chama `public.is_admin()`; se a função retornar `false` ou houver erro, o acesso ao painel é negado.

## Limitação importante desta entrega

Esta é uma etapa parcial e deliberadamente não declara a integração completa. O gerenciamento de eventos, as respostas, os links públicos e parte das configurações ainda usam `localStorage` no código existente. A validação de GPS também continua no navegador e não deve ser considerada segura contra falsificação. Esses módulos precisam ser migrados para operações Supabase e validação no backend antes de uso institucional.

Não execute scripts que apaguem/recriem tabelas ou dados. A autenticação desta etapa não exige recriar o banco nem cadastrar outro administrador.
