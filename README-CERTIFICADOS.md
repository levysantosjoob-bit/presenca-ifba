# Módulo de certificados — Presença IFBA

## Alteração solicitada
A identificação do participante para emissão é pelo **NOME COMPLETO**, não por matrícula. O sistema compara o nome digitado com `form_responses.answers.name` nos formulários associados ao certificado e usa o nome efetivamente gravado no banco para emitir o documento.

## Arquivos adicionados
- `certificado.html` e `certificado.js`: página pública de solicitação e emissão.
- `validar-certificado.html` e `validar-certificado.js`: consulta pública de autenticidade.
- `certificados-supabase.sql`: tabelas, políticas e funções do banco.

## Instalação
1. Faça backup do repositório atual.
2. Copie o conteúdo deste ZIP para a raiz do repositório GitHub Pages, substituindo os arquivos existentes e adicionando os novos.
3. No Supabase, abra SQL Editor, cole e execute todo o arquivo `certificados-supabase.sql`.
4. Após a publicação no GitHub Pages, entre no administrador > **Criar certificado**.
5. Preencha os dados e associe um ou mais formulários de presença; salve e compartilhe o link.

## Autenticidade
Cada emissão recebe código individual e URL pública `validar-certificado.html?codigo=...`, que consulta o banco para confirmar o participante e o evento.

## Observações
A comparação ignora diferenças entre maiúsculas/minúsculas e espaços nas extremidades, mas o nome deve corresponder ao registrado. Homônimos podem exigir conferência manual.
O certificado é renderizado como documento HTML pronto para imprimir/salvar em PDF, mantendo o texto institucional do modelo. O PDF original `modelo-certificado.pdf` é mantido no pacote como referência visual; a arte de fundo original não é aplicada automaticamente.
