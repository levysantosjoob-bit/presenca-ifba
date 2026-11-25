-- Presença IFBA: permitir que qualquer participante consulte eventos ativos
-- pelo UUID do link público. Mantém as demais políticas e não apaga dados.
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
ON public.events
FOR SELECT
TO anon, authenticated
USING (is_active = true);
