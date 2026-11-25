# Presença IFBA — formulário público independente

## Como o sistema funciona

- `index.html` é **somente a área administrativa**. Exige e-mail e senha do Supabase Auth e valida a permissão com `public.is_admin()`.
- `presenca.html?id=UUID` é a **página pública independente**. É o endereço colocado no link e no QR Code. O estudante não precisa de conta, e-mail, senha ou código de acesso.
- `app.js` controla o painel administrativo, criação de eventos e consulta das respostas.
- `public.js` carrega e envia o formulário público.
- `style.css` contém os estilos das duas páginas.
- `supabase.sql` ajusta a leitura pública de eventos ativos e habilita Realtime em `form_responses`.

## Publicação no GitHub Pages

1. Faça uma cópia de segurança do repositório.
2. Extraia este ZIP.
3. Envie todos os arquivos para a raiz do repositório `presenca-ifba`, substituindo os arquivos de mesmo nome: `index.html`, `presenca.html`, `app.js`, `public.js`, `style.css`, `supabase.sql`, `README.md` e `LEIA-PRIMEIRO.txt`.
4. Faça commit na branch publicada pelo GitHub Pages e aguarde a atualização do site.
5. O painel administrativo fica em `https://levysantosjoob-bit.github.io/presenca-ifba/`.

## Configuração do Supabase

1. Abra o SQL Editor do projeto Supabase.
2. Execute o conteúdo de `supabase.sql`.
3. Confirme que as políticas RLS existentes continuam ativas:
   - leitura pública apenas de eventos ativos;
   - inserção pública em `form_responses` para evento ativo e dentro do período permitido;
   - leitura de `form_responses` somente por administradores.
4. Confirme que `public.form_responses` está na publicação `supabase_realtime` (o SQL tenta adicioná-la sem duplicar).
5. O administrador deve existir no Supabase Auth e estar autorizado em `public.admin_users`.

Não coloque chave `service_role` no navegador. O projeto usa somente a chave pública `sb_publishable`.

## Fluxo de uso

1. Entre no `index.html` com a conta administrativa.
2. Cadastre e salve um evento.
3. Clique em **Gerar formulário + QR Code**.
4. Compartilhe o link ou QR Code. Ele abrirá `presenca.html?id=UUID`, sem passar pela tela administrativa.
5. O estudante responde no próprio celular. Se o evento exigir GPS, o navegador solicita a localização e o formulário só é liberado se a posição estiver dentro de uma das localidades configuradas.
6. As respostas são gravadas em `form_responses`.
7. No painel, abra **Respostas** no evento. A lista é carregada do Supabase e recebe novas respostas automaticamente por Realtime; também é possível exportar CSV.

## Testes obrigatórios antes do uso oficial

- Abrir o painel e autenticar com a conta administrativa.
- Criar um evento novo e gerar o link/QR Code.
- Abrir o link em outro celular ou janela anônima: não deve pedir login, e-mail, senha nem código.
- Enviar uma resposta e conferir se ela aparece em **Respostas** no painel.
- Manter a tela de respostas aberta e enviar outra resposta de um segundo aparelho: a lista e o contador devem atualizar sem recarregar.
- Testar GPS dentro e fora das localidades cadastradas.
- Testar encerramento e início futuro do evento.
- Testar exportação CSV.

## Limitações importantes

- A verificação GPS desta versão é feita no navegador. Para impedir falsificação de coordenadas, a validação também precisaria ser implementada no servidor (por exemplo, função RPC/Edge Function com validação confiável).
- A integração depende das políticas RLS já existentes no banco. Se uma política de INSERT em `form_responses` não permitir envio anônimo de eventos ativos, o formulário mostrará o erro do Supabase.
- O ZIP foi verificado localmente, mas a gravação e as notificações não foram testadas no projeto Supabase ao vivo nesta sessão.
