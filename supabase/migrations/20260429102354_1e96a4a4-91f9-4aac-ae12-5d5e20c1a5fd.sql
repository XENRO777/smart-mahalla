-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- profile auto create + first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ CITIZENS ============
CREATE TABLE public.citizens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mahalla TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'oddiy',
  tokens INT NOT NULL DEFAULT 0,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;

-- ============ TOKEN RULES ============
CREATE TABLE public.token_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name TEXT NOT NULL,
  action_key TEXT UNIQUE NOT NULL,
  token_amount INT NOT NULL CHECK (token_amount > 0),
  daily_limit INT NOT NULL DEFAULT 1 CHECK (daily_limit >= 1),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.token_rules ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_token_rules_updated
BEFORE UPDATE ON public.token_rules
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ TOKEN LEDGER ============
CREATE TYPE public.token_entry_type AS ENUM ('earn', 'spend', 'manual');

CREATE TABLE public.token_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES public.citizens(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  entry_type public.token_entry_type NOT NULL,
  reason TEXT NOT NULL,
  rule_id UUID REFERENCES public.token_rules(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.token_ledger ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ledger_citizen ON public.token_ledger(citizen_id);
CREATE INDEX idx_ledger_created ON public.token_ledger(created_at DESC);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============ AWARD TOKEN FUNCTION ============
CREATE OR REPLACE FUNCTION public.award_token(
  _citizen_id UUID,
  _action_key TEXT,
  _performed_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rule public.token_rules%ROWTYPE;
  _today_count INT;
BEGIN
  SELECT * INTO _rule FROM public.token_rules WHERE action_key = _action_key AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'rule_not_found');
  END IF;

  SELECT COUNT(*) INTO _today_count FROM public.token_ledger
  WHERE citizen_id = _citizen_id
    AND rule_id = _rule.id
    AND created_at >= date_trunc('day', now());

  IF _today_count >= _rule.daily_limit THEN
    UPDATE public.citizens SET is_suspicious = true WHERE id = _citizen_id;
    RETURN jsonb_build_object('success', false, 'error', 'daily_limit_exceeded');
  END IF;

  INSERT INTO public.token_ledger (citizen_id, amount, entry_type, reason, rule_id, performed_by)
  VALUES (_citizen_id, _rule.token_amount, 'earn', _rule.action_name, _rule.id, _performed_by);

  UPDATE public.citizens SET tokens = tokens + _rule.token_amount WHERE id = _citizen_id;

  RETURN jsonb_build_object('success', true, 'amount', _rule.token_amount);
END;
$$;

-- ============ MANUAL TOKEN FUNCTION ============
CREATE OR REPLACE FUNCTION public.manual_token(
  _citizen_id UUID,
  _amount INT,
  _reason TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'forbidden');
  END IF;
  IF _amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  INSERT INTO public.token_ledger (citizen_id, amount, entry_type, reason, performed_by)
  VALUES (_citizen_id, _amount, 'manual', _reason, _uid);

  UPDATE public.citizens SET tokens = GREATEST(tokens + _amount, 0) WHERE id = _citizen_id;

  INSERT INTO public.audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (_uid, 'manual_token', 'citizen', _citizen_id::TEXT,
    jsonb_build_object('amount', _amount, 'reason', _reason));

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles
CREATE POLICY "roles_self_view" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- citizens
CREATE POLICY "citizens_auth_read" ON public.citizens FOR SELECT TO authenticated USING (true);
CREATE POLICY "citizens_admin_write" ON public.citizens FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- token_rules
CREATE POLICY "rules_auth_read" ON public.token_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "rules_admin_write" ON public.token_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- token_ledger
CREATE POLICY "ledger_auth_read" ON public.token_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "ledger_admin_insert" ON public.token_ledger FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- audit_log
CREATE POLICY "audit_admin_read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ REALTIME ============
ALTER TABLE public.token_ledger REPLICA IDENTITY FULL;
ALTER TABLE public.token_rules REPLICA IDENTITY FULL;
ALTER TABLE public.citizens REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.citizens;

-- ============ SEED DATA ============
INSERT INTO public.token_rules (action_name, action_key, token_amount, daily_limit, is_active) VALUES
  ('Subbotnikda qatnashish', 'subbotnik', 50, 1, true),
  ('Murojaat qoldirish', 'appeal_submit', 5, 3, true),
  ('Qo''shni mahallaga yordam', 'help_neighbor', 20, 2, true),
  ('Bolalar tadbiriga ko''ngilli', 'kids_volunteer', 30, 1, true),
  ('Onlayn so''rovnomada qatnashish', 'survey', 10, 5, true);

INSERT INTO public.citizens (full_name, mahalla, phone, status, tokens) VALUES
  ('Akmal Karimov', 'Yunusobod-12', '+998901234567', 'lider', 1240),
  ('Dilnoza Yusupova', 'Chilonzor-3', '+998907654321', 'faol', 980),
  ('Bekzod Tursunov', 'Mirzo Ulug''bek-7', '+998935551122', 'faol', 870),
  ('Nargiza Ahmedova', 'Sergeli-1', '+998933334455', 'faol', 720),
  ('Sherzod Norqulov', 'Olmazor-4', '+998901112233', 'oddiy', 540),
  ('Munira Saidova', 'Yashnobod-9', '+998999998877', 'oddiy', 410),
  ('Jasur Rahimov', 'Yakkasaroy-2', '+998946667788', 'oddiy', 320),
  ('Zilola Mirzayeva', 'Shayxontohur-6', '+998978889900', 'oddiy', 250);