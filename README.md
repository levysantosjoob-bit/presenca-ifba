# Presença IFBA

Versão estática para GitHub Pages integrada ao Supabase.

## Integração nesta versão

- Supabase Auth para autenticação administrativa.
- `public.events` para criação, edição, listagem e estado dos eventos.
- `events.form_config` (JSONB) para campos e perguntas dinâmicas.
- `public.form_responses` para submissões públicas compartilhadas entre dispositivos.
- Links `#presenca=<UUID>` consultam o evento diretamente no Supabase.

## Publicação

Envie o conteúdo desta pasta para a raiz do repositório GitHub Pages e faça commit. Consulte `LEIA-PRIMEIRO.txt` para o roteiro completo e para as limitações conhecidas.

## Segurança e limitações

O navegador usa apenas a chave `sb_publishable`. A política RLS do banco continua sendo a camada de autorização. A checagem de GPS nesta versão é client-side e não deve ser considerada antifraude; a validação real precisa de RPC ou Edge Function. Banners ainda precisam de integração dedicada com Supabase Storage.
