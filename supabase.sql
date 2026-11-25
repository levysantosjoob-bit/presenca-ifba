-- Presença IFBA: permitir que qualquer participante consulte eventos ativos
-- pelo UUID do link público. Mantém as demais políticas e não apaga dados.
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
ON public.events
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Habilita notificações em tempo real para novas respostas no painel administrativo.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'form_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.form_responses;
  END IF;
END $$;
