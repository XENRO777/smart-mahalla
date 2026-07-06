-- 1) Mahallalar jadvali
CREATE TABLE public.mahallalar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomi TEXT NOT NULL,
  tuman TEXT,
  sektor TEXT,
  rais_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mahallalar ENABLE ROW LEVEL SECURITY;

CREATE POLICY mahallalar_auth_read ON public.mahallalar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY mahallalar_admin_write ON public.mahallalar
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER mahallalar_touch BEFORE UPDATE ON public.mahallalar
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Profiles ga mahalla_id va phone qo'shish
ALTER TABLE public.profiles
  ADD COLUMN mahalla_id UUID REFERENCES public.mahallalar(id) ON DELETE SET NULL,
  ADD COLUMN phone TEXT;

CREATE INDEX idx_profiles_mahalla ON public.profiles(mahalla_id);
CREATE UNIQUE INDEX idx_profiles_phone ON public.profiles(phone) WHERE phone IS NOT NULL;

-- 3) citizens va token_ledger ga mahalla_id
ALTER TABLE public.citizens
  ADD COLUMN mahalla_id UUID REFERENCES public.mahallalar(id) ON DELETE SET NULL;
CREATE INDEX idx_citizens_mahalla ON public.citizens(mahalla_id);

ALTER TABLE public.token_ledger
  ADD COLUMN mahalla_id UUID REFERENCES public.mahallalar(id) ON DELETE SET NULL;
CREATE INDEX idx_ledger_mahalla ON public.token_ledger(mahalla_id);

-- 4) Helper: foydalanuvchining mahalla_id (RLS recursion'dan qochish uchun definer)
CREATE OR REPLACE FUNCTION public.current_mahalla_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT mahalla_id FROM public.profiles WHERE id = auth.uid() $$;

REVOKE EXECUTE ON FUNCTION public.current_mahalla_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_mahalla_id() TO authenticated;

-- 5) Citizens RLS qayta yozish
DROP POLICY IF EXISTS citizens_auth_read ON public.citizens;
DROP POLICY IF EXISTS citizens_admin_write ON public.citizens;

CREATE POLICY citizens_read ON public.citizens
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR mahalla_id = public.current_mahalla_id()
  );

CREATE POLICY citizens_write ON public.citizens
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      (public.has_role(auth.uid(), 'rais') OR public.has_role(auth.uid(), 'kotib'))
      AND mahalla_id = public.current_mahalla_id()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      (public.has_role(auth.uid(), 'rais') OR public.has_role(auth.uid(), 'kotib'))
      AND mahalla_id = public.current_mahalla_id()
    )
  );

-- 6) Token ledger RLS qayta yozish
DROP POLICY IF EXISTS ledger_auth_read ON public.token_ledger;
DROP POLICY IF EXISTS ledger_admin_insert ON public.token_ledger;

CREATE POLICY ledger_read ON public.token_ledger
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR mahalla_id = public.current_mahalla_id()
  );

CREATE POLICY ledger_insert ON public.token_ledger
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      (public.has_role(auth.uid(), 'rais') OR public.has_role(auth.uid(), 'kotib'))
      AND mahalla_id = public.current_mahalla_id()
    )
  );

-- 7) award_token va manual_token funksiyalarini mahalla_id bilan yangilash
CREATE OR REPLACE FUNCTION public.award_token(_citizen_id UUID, _action_key TEXT, _performed_by UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rule public.token_rules%ROWTYPE;
  _today_count INT;
  _mid UUID;
BEGIN
  SELECT * INTO _rule FROM public.token_rules WHERE action_key = _action_key AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'rule_not_found'); END IF;

  SELECT mahalla_id INTO _mid FROM public.citizens WHERE id = _citizen_id;

  SELECT COUNT(*) INTO _today_count FROM public.token_ledger
  WHERE citizen_id = _citizen_id AND rule_id = _rule.id
    AND created_at >= date_trunc('day', now());

  IF _today_count >= _rule.daily_limit THEN
    UPDATE public.citizens SET is_suspicious = true WHERE id = _citizen_id;
    RETURN jsonb_build_object('success', false, 'error', 'daily_limit_exceeded');
  END IF;

  INSERT INTO public.token_ledger (citizen_id, amount, entry_type, reason, rule_id, performed_by, mahalla_id)
  VALUES (_citizen_id, _rule.token_amount, 'earn', _rule.action_name, _rule.id, _performed_by, _mid);

  UPDATE public.citizens SET tokens = tokens + _rule.token_amount WHERE id = _citizen_id;
  RETURN jsonb_build_object('success', true, 'amount', _rule.token_amount);
END; $$;

CREATE OR REPLACE FUNCTION public.manual_token(_citizen_id UUID, _amount INT, _reason TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _mid UUID;
  _user_mid UUID;
BEGIN
  SELECT mahalla_id INTO _mid FROM public.citizens WHERE id = _citizen_id;
  SELECT mahalla_id INTO _user_mid FROM public.profiles WHERE id = _uid;

  IF NOT (
    public.has_role(_uid, 'admin')
    OR ((public.has_role(_uid, 'rais') OR public.has_role(_uid, 'kotib')) AND _mid = _user_mid)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  IF _amount = 0 THEN RETURN jsonb_build_object('success', false, 'error', 'invalid_amount'); END IF;

  INSERT INTO public.token_ledger (citizen_id, amount, entry_type, reason, performed_by, mahalla_id)
  VALUES (_citizen_id, _amount, 'manual', _reason, _uid, _mid);

  UPDATE public.citizens SET tokens = GREATEST(tokens + _amount, 0) WHERE id = _citizen_id;

  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (_uid, 'manual_token', 'citizen', _citizen_id::TEXT,
    jsonb_build_object('amount', _amount, 'reason', _reason, 'mahalla_id', _mid));

  RETURN jsonb_build_object('success', true);
END; $$;

-- 8) Password OTP jadvali (telefon orqali parol tiklash)
CREATE TABLE public.password_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_phone ON public.password_otp(phone, created_at DESC);

ALTER TABLE public.password_otp ENABLE ROW LEVEL SECURITY;
-- Hech qanday policy yo'q => barcha clientlar uchun yopiq, faqat service_role (edge function) kira oladi

-- 9) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mahallalar;