-- RPC function to get the partner's email for a given ledger
-- This is a SECURITY DEFINER function so it can access auth.users
-- It only returns the email of the OTHER user in the ledger (not the caller)

CREATE OR REPLACE FUNCTION get_partner_email(p_ledger_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user1_id UUID;
  v_user2_id UUID;
  v_partner_id UUID;
  v_email TEXT;
BEGIN
  -- Get the ledger
  SELECT user1_id::UUID, user2_id::UUID
  INTO v_user1_id, v_user2_id
  FROM ledgers
  WHERE id = p_ledger_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Determine who is the partner (the other user, not the caller)
  IF v_user1_id = auth.uid() THEN
    v_partner_id := v_user2_id;
  ELSIF v_user2_id = auth.uid() THEN
    v_partner_id := v_user1_id;
  ELSE
    -- Caller is not part of this ledger
    RETURN NULL;
  END IF;

  IF v_partner_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Look up the partner's email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_partner_id;

  RETURN v_email;
END;
$$;
