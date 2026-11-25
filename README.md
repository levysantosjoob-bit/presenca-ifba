# Presença IFBA — versão integrada ao Supabase

Esta versão corrige o compartilhamento do formulário: eventos são gravados na tabela `public.events`, e qualquer celular abre o formulário consultando o evento pelo UUID no Supabase. As respostas são gravadas em `public.form_responses` e podem ser consultadas no painel administrativo.

## Arquivos
- `index.html`: interface e carregamento das bibliotecas.
- `style.css`: estilos.
- `app.js`: autenticação, cadastro/consulta de eventos e respostas no Supabase.
- `supabase.sql`: política de leitura pública de eventos ativos (migração complementar).
- `LEIA-PRIMEIRO.txt`: passos resumidos.

## Supabase já configurado neste projeto
O aplicativo aponta para o projeto Supabase `kvcqgceqgmagqlcazrxa` e usa somente a chave publicável (`sb_publishable`) no navegador. Não coloque `service_role` ou `sb_secret` no site.

O painel usa Supabase Auth e a função `public.is_admin()` para verificar a autorização administrativa. A conta precisa existir em `auth.users` e estar cadastrada em `public.admin_users`. O código não cria administradores nem altera senhas.

## Publicação
1. Faça uma cópia de segurança dos arquivos atuais do repositório GitHub.
2. Extraia este ZIP.
3. Envie `index.html`, `style.css` e `app.js` para a raiz do repositório `presenca-ifba`, substituindo os arquivos antigos.
4. Envie também `supabase.sql` e `README.md` para manter a documentação junto do projeto.
5. Faça commit na branch principal (`main`).
6. Aguarde o GitHub Pages concluir a publicação em **Actions**.
7. Abra o site publicado em uma janela anônima e teste um evento novo.

## Supabase / SQL
No SQL Editor do projeto `kvcqgceqgmagqlcazrxa`, execute `supabase.sql`. O script apenas recria a política de leitura pública de eventos ativos; não apaga tabelas nem registros. As tabelas e políticas de administração e envio de respostas devem continuar existentes: `events`, `form_responses`, `admin_users` e `public.is_admin()`.

A estrutura utilizada é: `events(id, title, description, start_at, end_at, access_code, form_config, is_active, image_url, created_at)` e `form_responses(event_id, enrollment, answers, created_at)`. As configurações dinâmicas do formulário (campos, perguntas, GPS e localidades) são guardadas em `events.form_config`.

## Teste obrigatório
1. Entre com a conta administrativa existente.
2. Cadastre um evento com abertura no passado/próxima e encerramento futuro; deixe ativo.
3. Clique em **Gerar formulário + QR Code**.
4. Copie o link e abra em outro celular ou janela anônima.
5. Confira se título, descrição e campos aparecem.
6. Envie uma resposta de teste.
7. Volte ao painel e abra **Respostas** para conferir o registro.

## Limitações que ainda exigem trabalho
- A checagem de GPS desta versão continua sendo feita no navegador. Ela não é validação segura no servidor e pode ser burlada por dispositivo modificado. Não use como controle antifraude definitivo.
- A prevenção de duplicidade depende de uma restrição no banco compatível com a tabela e as regras atuais; este pacote não cria uma restrição nova em `form_responses`.
- Os banners são armazenados no JSON de configuração do evento nesta versão; para uso amplo, o ideal é migrá-los para Supabase Storage.
- Configurações auxiliares (listas de cursos/modalidades) continuam locais, mas a configuração efetiva usada no formulário é copiada para o evento ao salvá-lo.
- Eventos criados anteriormente apenas no `localStorage` não são migrados automaticamente. Recrie esses eventos no painel depois de publicar.

O pacote foi validado quanto à sintaxe JavaScript e à presença das chamadas de integração. Não foi possível autenticar no seu projeto nem executar uma gravação real daqui; faça o teste obrigatório acima antes de usar com dados reais.
