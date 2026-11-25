-- Presenca IFBA: corrigir permissao de leitura administrativa e envio publico.
-- Script aditivo e seguro: nao apaga eventos nem respostas existentes.
-- Execute este arquivo inteiro no Supabase > SQL Editor > Run.

begin;

-- A API do Supabase precisa de USAGE no schema e privilegios na tabela.
alter table public.form_responses enable row level security;
grant usage on schema public to anon, authenticated;
grant select on table public.events to anon, authenticated;
grant select, insert on table public.form_responses to anon, authenticated;

-- Administradores podem consultar respostas; a funcao is_admin() identifica o usuario autorizado.
drop policy if exists "Admins read form responses" on public.form_responses;
drop policy if exists "Admin can read form responses" on public.form_responses;
create policy "Admin can read form responses"
on public.form_responses
for select
to authenticated
using (public.is_admin());

-- Participantes podem enviar respostas apenas para eventos ativos.
drop policy if exists "Public submit active form responses" on public.form_responses;
drop policy if exists "Public can submit active form responses" on public.form_responses;
create policy "Public can submit active form responses"
on public.form_responses
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = form_responses.event_id
      and e.is_active = true
  )
);

-- A funcao de autorizacao deve poder ser chamada por usuarios autenticados.
grant execute on function public.is_admin() to authenticated;

-- O formulario publico consulta apenas eventos ativos.
drop policy if exists "Public can view active events" on public.events;
create policy "Public can view active events"
on public.events
for select
to anon, authenticated
using (is_active = true);

commit;

-- Habilita Realtime para novas respostas, sem adicionar a tabela duas vezes.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'form_responses'
     ) then
    alter publication supabase_realtime add table public.form_responses;
  end if;
end $$;


-- Exclusao segura de formulario e respostas vinculadas.
-- A funcao valida o administrador e apaga as respostas antes do evento,
-- evitando falha por chave estrangeira. Nao afeta outros eventos.
create or replace function public.delete_event_with_responses(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'Apenas administradores podem excluir formularios.' using errcode = '42501';
  end if;

  delete from public.form_responses where event_id = p_event_id;
  delete from public.events where id = p_event_id;

  if not found then
    -- A ausência do evento não é erro: a operação é idempotente.
    return;
  end if;
end;
$$;

grant execute on function public.delete_event_with_responses(uuid) to authenticated;
