-- Presença IFBA — ajuste recomendado para permitir mostrar eventos agendados/encerrados.
-- Execute no SQL Editor do Supabase após conferir o banco existente.
-- Esta alteração NÃO apaga dados nem recria tabelas.

-- A política anterior escondia eventos antes da abertura e depois do encerramento.
-- O formulário precisa conseguir ler o evento para exibir a mensagem correta.
-- O INSERT continua protegido pela política Students can register attendance,
-- que exige evento ativo e dentro do horário configurado.
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
ON public.events
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Garante que a restrição de duplicidade exista (não altera se já existir).
CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance_per_event
ON public.attendances (event_id, enrollment);

-- Índice auxiliar para acelerar a listagem de presenças por evento/data.
CREATE INDEX IF NOT EXISTS attendances_event_created_idx
ON public.attendances (event_id, created_at DESC);
