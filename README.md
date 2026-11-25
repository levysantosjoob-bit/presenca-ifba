# Presença IFBA — versão integrada ao Supabase

Esta versão corrige o compartilhamento do formulário: eventos são gravados na tabela `public.events`, e qualquer celular abre o formulário consultando o evento pelo UUID no Supabase. As respostas são gravadas em `public.form_responses` e podem ser consultadas no painel administrativo.

## Arquivos
- `index.html`: interface e carregamento das bibliotecas.
- `style.css`: estilos.
- `app.js`: autenticação, cadastro/edição de eventos e consulta de respostas no Supabase.
- `presenca.html` e `public.js`: formulário público independente, envio de respostas e mensagem de confirmação.
- `supabase.sql`: políticas de acesso e publicação Realtime (migração complementar).
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
No SQL Editor do projeto `kvcqgceqgmagqlcazrxa`, execute `supabase.sql`. O script aplica políticas de leitura das respostas para administradores, envio público para eventos ativos, leitura pública de eventos ativos e habilitação do Realtime. Não apaga tabelas nem registros. As tabelas e políticas de administração e envio de respostas devem continuar existentes: `events`, `form_responses`, `admin_users` e `public.is_admin()`.

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


ATUALIZAÇÃO — LINK PÚBLICO E RESPOSTAS EM TEMPO REAL

- A área administrativa continua em index.html e exige login de administrador.
- O link e o QR Code gerados pelo painel apontam para presenca.html?id=UUID. Essa página é independente e não pede e-mail nem senha do estudante.
- O estudante envia a resposta diretamente para a tabela form_responses do Supabase.
- Ao abrir Respostas de um evento no painel, a lista e o contador são atualizados automaticamente pelo Supabase Realtime.
- Execute novamente o arquivo supabase.sql no SQL Editor do projeto para habilitar a publicação Realtime de form_responses e a leitura pública de eventos ativos.
- No painel do Supabase, confirme também que Realtime está habilitado para a tabela public.form_responses caso a atualização automática não apareça.
- Publique todos os arquivos juntos na raiz do GitHub Pages: index.html, presenca.html, app.js, public.js, style.css e supabase.sql.

Importante: o ZIP foi verificado localmente, mas não foi possível testar login, gravação ou notificações no seu projeto Supabase ao vivo. Faça um evento de teste e envie uma resposta por outro celular antes de usar oficialmente.


## Correções desta versão
- A consulta administrativa de respostas usa uma política RLS explícita baseada em `public.is_admin()`.
- A gravação do evento salva campos, perguntas, localidades e raios GPS no `form_config` do próprio evento.
- A página pública confirma: “Formulário respondido com sucesso! Sua resposta foi registrada.”
- O painel apresenta o detalhe do erro de consulta em vez de ocultá-lo.
