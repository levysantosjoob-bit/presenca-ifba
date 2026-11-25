# Presença IFBA — correção de fotos, salvamento e respostas

Esta versão corrige o envio de banners para o Supabase Storage e reforça a gravação das respostas públicas.

## O que mudou
- A foto do evento é otimizada no navegador e enviada ao bucket `event-banners` do Supabase Storage. O banco guarda somente a URL pública da imagem, não uma imagem em base64 dentro do JSON do evento.
- O evento só gera o link/QR Code depois de salvar o registro e concluir o envio da foto.
- O formulário público grava as respostas em `public.form_responses`; em caso de falha, deixa o erro visível na tela em vez de escondê-lo num aviso temporário.
- Após a gravação confirmada pelo Supabase, aparece: **“Formulário respondido com sucesso! Sua resposta foi registrada.”**
- Campos de texto enviados pelo formulário são normalizados para texto antes do insert.

## Publicação
1. Faça backup dos arquivos atuais do repositório.
2. Extraia este ZIP e envie TODOS os arquivos para a raiz do repositório GitHub Pages, substituindo os anteriores: `index.html`, `presenca.html`, `app.js`, `public.js`, `style.css`, `supabase.sql`, `README.md` e `LEIA-PRIMEIRO.txt`.
3. Faça commit na branch `main` e aguarde o GitHub Pages concluir a publicação.
4. Abra o SQL Editor do projeto Supabase `kvcqgceqgmagqlcazrxa`, cole TODO o conteúdo de `supabase.sql` e execute. O script é aditivo/idempotente para as políticas e o bucket; não apaga eventos nem respostas.
5. Recarregue o site com `Ctrl + Shift + R`.

## Teste obrigatório
1. Entre no painel administrativo.
2. Crie um evento de teste com uma foto JPG/PNG/WebP. Clique em **Gerar formulário + QR Code**.
3. Confirme que o evento aparece na lista e que o link foi gerado. Abra o link numa janela anônima/outro celular.
4. Envie uma resposta de teste. A tela deve mostrar a confirmação de sucesso.
5. No Supabase Table Editor, abra `public.form_responses` e confirme que há uma linha com o `event_id` do evento.
6. Volte ao painel e abra **Respostas** para confirmar que o registro aparece.

## Supabase Storage
O SQL cria/atualiza o bucket público `event-banners` com limite de 5 MB e tipos JPEG, PNG e WebP. A leitura das imagens é pública para que os estudantes vejam o banner; somente usuários autenticados reconhecidos por `public.is_admin()` podem enviar, alterar ou excluir objetos nesse bucket. A chave publicável é usada no navegador. Nunca coloque `service_role` ou `sb_secret` no GitHub.

## Segurança e limitações
- O formulário público não recebe credenciais administrativas.
- O GPS continua validado no navegador; não é uma prova antifraude inviolável.
- Foi possível validar a sintaxe dos arquivos JavaScript e a estrutura do ZIP, mas não executar uma gravação real no Supabase deste projeto. Faça os testes acima antes de usar em produção.
