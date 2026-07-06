-- Add citizen detail columns used by the UI (optional fields)
ALTER TABLE public.citizens
  ADD COLUMN IF NOT EXISTS pinfl TEXT,
  ADD COLUMN IF NOT EXISTS birth_year INT,
  ADD COLUMN IF NOT EXISTS household TEXT,
  ADD COLUMN IF NOT EXISTS notebook TEXT;

CREATE INDEX IF NOT EXISTS citizens_mahalla_idx ON public.citizens(mahalla_id);
CREATE INDEX IF NOT EXISTS citizens_pinfl_idx ON public.citizens(pinfl);
CREATE UNIQUE INDEX IF NOT EXISTS citizens_pinfl_unique ON public.citizens(pinfl) WHERE pinfl IS NOT NULL;
