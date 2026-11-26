-- CERTIFICADOS PRESENÇA IFBA — execute no Supabase SQL Editor.
-- A busca é pelo nome completo salvo em form_responses.answers.name.
begin;
create extension if not exists pgcrypto;
create table if not exists public.certificate_configs(
 id uuid primary key default gen_random_uuid(),event_name text not null,event_date text not null,event_theme text not null,
 portaria_sei text not null,commission_president text not null,appointment_portaria text not null,issue_date date not null,
 internal_name text,form_ids uuid[] not null,is_active boolean not null default true,public_token uuid not null unique default gen_random_uuid(),created_at timestamptz not null default now());
create table if not exists public.issued_certificates(
 id uuid primary key default gen_random_uuid(),config_id uuid not null references public.certificate_configs(id),
 participant_name text not null,auth_code text not null unique,issued_at timestamptz not null default now());
alter table public.certificate_configs enable row level security;alter table public.issued_certificates enable row level security;
grant usage on schema public to anon,authenticated;
grant select,insert,update,delete on public.certificate_configs to authenticated;
grant select on public.certificate_configs to anon;
drop policy if exists "Admins manage certificate configs" on public.certificate_configs;
create policy "Admins manage certificate configs" on public.certificate_configs for all to authenticated using(public.is_admin()) with check(public.is_admin());
drop policy if exists "Public read active certificate configs" on public.certificate_configs;
create policy "Public read active certificate configs" on public.certificate_configs for select to anon,authenticated using(is_active=true);
grant select on public.issued_certificates to anon,authenticated;
create or replace function public.issue_certificate_by_name(p_public_token uuid,p_full_name text)
returns table(auth_code text,participant_name text) language plpgsql security definer set search_path=public as $$
declare c public.certificate_configs%rowtype; found_name text; new_code text;
begin
 select * into c from public.certificate_configs where public_token=p_public_token and is_active=true;
 if not found then raise exception 'Evento indisponível para emissão.';end if;
 select trim(r.answers->>'name') into found_name from public.form_responses r
 where r.event_id=any(c.form_ids) and lower(trim(coalesce(r.answers->>'name','')))=lower(trim(coalesce(p_full_name,'')))
 order by r.created_at desc limit 1;
 if found_name is null or found_name='' then raise exception 'Não encontramos presença com esse nome nos formulários vinculados ao evento.';end if;
 new_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 insert into public.issued_certificates(config_id,participant_name,auth_code) values(c.id,found_name,new_code);
 return query select new_code,found_name;
end $$;
create or replace function public.validate_certificate_code(p_auth_code text)
returns table(auth_code text,participant_name text,event_name text,issued_at timestamptz)
language sql security definer set search_path=public as $$
 select i.auth_code,i.participant_name,c.event_name,i.issued_at from public.issued_certificates i
 join public.certificate_configs c on c.id=i.config_id where upper(i.auth_code)=upper(trim(p_auth_code))
$$;
revoke all on function public.issue_certificate_by_name(uuid,text) from public;
grant execute on function public.issue_certificate_by_name(uuid,text) to anon,authenticated;
revoke all on function public.validate_certificate_code(text) from public;
grant execute on function public.validate_certificate_code(text) to anon,authenticated;
commit;
