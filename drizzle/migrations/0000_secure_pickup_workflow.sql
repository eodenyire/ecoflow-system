REVOKE ALL PRIVILEGES ON TABLE public.pickup_requests, public.profiles, public.rewards, public.user_roles, public.waste_items FROM anon;
GRANT SELECT, INSERT ON TABLE public.pickup_requests TO authenticated;
REVOKE UPDATE, DELETE ON TABLE public.pickup_requests FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
REVOKE DELETE ON TABLE public.profiles FROM authenticated;
GRANT SELECT ON TABLE public.rewards, public.user_roles TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.rewards, public.user_roles FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.waste_items TO authenticated;
REVOKE UPDATE, DELETE ON TABLE public.waste_items FROM authenticated;
GRANT ALL ON TABLE public.pickup_requests, public.profiles, public.rewards, public.user_roles, public.waste_items TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;

CREATE OR REPLACE FUNCTION public.claim_pickup(p_pickup_id UUID)
RETURNS public.pickup_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup public.pickup_requests;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'collector'::public.app_role) THEN
    RAISE EXCEPTION 'Only signed-in collectors can claim pickups' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pickup_requests AS p
  SET collector_id = auth.uid(), status = 'assigned'::public.pickup_status
  WHERE p.id = p_pickup_id AND p.status = 'pending'::public.pickup_status AND p.collector_id IS NULL
  RETURNING p.* INTO v_pickup;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This pickup is no longer available' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_pickup;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_pickup(p_pickup_id UUID, p_collector_id UUID)
RETURNS public.pickup_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup public.pickup_requests;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only administrators can assign pickups' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_role(p_collector_id, 'collector'::public.app_role) THEN
    RAISE EXCEPTION 'Choose an active collector' USING ERRCODE = '22023';
  END IF;

  UPDATE public.pickup_requests AS p
  SET collector_id = p_collector_id, status = 'assigned'::public.pickup_status
  WHERE p.id = p_pickup_id AND p.status = 'pending'::public.pickup_status AND p.collector_id IS NULL
  RETURNING p.* INTO v_pickup;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This pickup is no longer open for assignment' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_pickup;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_assigned_pickup(
  p_pickup_id UUID,
  p_status public.pickup_status,
  p_actual_weight_kg NUMERIC DEFAULT NULL,
  p_proof_photo_url TEXT DEFAULT NULL
)
RETURNS public.pickup_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup public.pickup_requests;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'collector'::public.app_role) THEN
    RAISE EXCEPTION 'Only signed-in collectors can update assigned pickups' USING ERRCODE = '42501';
  END IF;

  IF p_status = 'in_progress'::public.pickup_status THEN
    UPDATE public.pickup_requests AS p
    SET status = 'in_progress'::public.pickup_status
    WHERE p.id = p_pickup_id AND p.collector_id = auth.uid() AND p.status = 'assigned'::public.pickup_status
    RETURNING p.* INTO v_pickup;
  ELSIF p_status = 'completed'::public.pickup_status THEN
    IF p_actual_weight_kg IS NULL OR p_actual_weight_kg <= 0 THEN
      RAISE EXCEPTION 'Enter an actual weight greater than zero' USING ERRCODE = '22023';
    END IF;
    UPDATE public.pickup_requests AS p
    SET status = 'completed'::public.pickup_status,
        actual_weight_kg = p_actual_weight_kg,
        proof_photo_url = NULLIF(BTRIM(p_proof_photo_url), ''),
        completed_at = now()
    WHERE p.id = p_pickup_id AND p.collector_id = auth.uid() AND p.status = 'in_progress'::public.pickup_status
    RETURNING p.* INTO v_pickup;
  ELSE
    RAISE EXCEPTION 'Collectors can only start or complete assigned pickups' USING ERRCODE = '22023';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This pickup is not assigned to you or its status changed' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_pickup;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_pickup(p_pickup_id UUID)
RETURNS public.pickup_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pickup public.pickup_requests;
BEGIN
  IF auth.uid() IS NULL OR NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'citizen'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Only the requesting customer or an administrator can cancel a pickup' USING ERRCODE = '42501';
  END IF;

  UPDATE public.pickup_requests AS p
  SET status = 'cancelled'::public.pickup_status
  WHERE p.id = p_pickup_id
    AND p.status IN ('pending'::public.pickup_status, 'assigned'::public.pickup_status)
    AND (p.citizen_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  RETURNING p.* INTO v_pickup;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This pickup cannot be cancelled at its current stage' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_pickup;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pickup(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_pickup(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_assigned_pickup(UUID, public.pickup_status, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cancel_pickup(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pickup(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_pickup(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_assigned_pickup(UUID, public.pickup_status, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_pickup(UUID) TO authenticated;