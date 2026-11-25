-- Presença IFBA: políticas complementares para leitura administrativa e envio público.
-- Script aditivo/idempotente: não apaga tabelas nem registros.

-- Participantes podem consultar somente eventos ativos pelo link público.
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
ON public.events FOR SELECT TO anon, authenticated
USING (is_active = true);
GRANT SELECT ON public.events TO anon, authenticated;

-- Administradores autenticados podem consultar as respostas.
DROP POLICY IF EXISTS "Admins read form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Admin can read form responses" ON public.form_responses;
CREATE POLICY "Admin can read form responses"
ON public.form_responses FOR SELECT TO authenticated
USING (public.is_admin());

-- O formulário público pode inserir respostas somente em eventos ativos.
DROP POLICY IF EXISTS "Public submit active form responses" ON public.form_responses;
DROP POLICY IF EXISTS "Public can submit active form responses" ON public.form_responses;
CREATE POLICY "Public can submit active form responses"
ON public.form_responses FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = form_responses.event_id
      AND e.is_active = true
  )
);

GRANT SELECT, INSERT ON public.form_responses TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Habilita Realtime sem adicionar a tabela duas vezes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'form_responses'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.form_responses;
  END IF;
END $$;
