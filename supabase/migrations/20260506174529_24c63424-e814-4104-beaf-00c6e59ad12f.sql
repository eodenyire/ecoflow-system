
-- Enums
CREATE TYPE public.app_role AS ENUM ('citizen','collector','admin');
CREATE TYPE public.waste_type AS ENUM ('organic','plastic','metal','glass','paper','mixed','hazardous','e_waste');
CREATE TYPE public.pickup_status AS ENUM ('pending','assigned','in_progress','completed','cancelled');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Pickup requests
CREATE TABLE public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  waste_type public.waste_type NOT NULL DEFAULT 'mixed',
  estimated_weight_kg NUMERIC(10,2),
  actual_weight_kg NUMERIC(10,2),
  status public.pickup_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  proof_photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.pickup_requests(citizen_id);
CREATE INDEX ON public.pickup_requests(collector_id);
CREATE INDEX ON public.pickup_requests(status);

-- Waste items
CREATE TABLE public.waste_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
  category public.waste_type NOT NULL,
  weight_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  recyclable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waste_items ENABLE ROW LEVEL SECURITY;

-- Rewards
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  pickup_id UUID REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_pickups_updated BEFORE UPDATE ON public.pickup_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + default citizen role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'citizen');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: profiles
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'collector'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS: user_roles
CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RLS: pickup_requests
CREATE POLICY "pickups_citizen_select_own" ON public.pickup_requests FOR SELECT
  USING (
    auth.uid() = citizen_id
    OR auth.uid() = collector_id
    OR (public.has_role(auth.uid(),'collector') AND collector_id IS NULL AND status = 'pending')
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "pickups_citizen_insert" ON public.pickup_requests FOR INSERT
  WITH CHECK (auth.uid() = citizen_id);
CREATE POLICY "pickups_update" ON public.pickup_requests FOR UPDATE
  USING (
    auth.uid() = citizen_id
    OR auth.uid() = collector_id
    OR public.has_role(auth.uid(),'admin')
  );
CREATE POLICY "pickups_admin_delete" ON public.pickup_requests FOR DELETE
  USING (public.has_role(auth.uid(),'admin') OR auth.uid() = citizen_id);

-- RLS: waste_items
CREATE POLICY "waste_items_select" ON public.waste_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.pickup_requests p WHERE p.id = pickup_id
      AND (p.citizen_id = auth.uid() OR p.collector_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ));
CREATE POLICY "waste_items_insert" ON public.waste_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pickup_requests p WHERE p.id = pickup_id
      AND (p.collector_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ));

-- RLS: rewards
CREATE POLICY "rewards_select_own_or_admin" ON public.rewards FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "rewards_admin_insert" ON public.rewards FOR INSERT
  WITH CHECK (public.has_role(auth.uid(),'admin'));
