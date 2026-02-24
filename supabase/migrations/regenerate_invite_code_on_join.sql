-- Update join_ledger_by_invite to regenerate the invite code after a partner joins.
-- This prevents the old invite code from being reused by strangers.

CREATE OR REPLACE FUNCTION join_ledger_by_invite(code TEXT)
RETURNS SETOF ledgers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ledger_id UUID;
BEGIN
  -- Find the ledger by invite code (must have no partner yet and not be deleted)
  SELECT id INTO v_ledger_id
  FROM ledgers
  WHERE invite_code = code
    AND user2_id IS NULL
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Set the partner AND regenerate the invite code atomically
  UPDATE ledgers
  SET user2_id = auth.uid()::TEXT,
      invite_code = substr(md5(random()::text || clock_timestamp()::text), 1, 12)
  WHERE id = v_ledger_id;

  -- Return the updated ledger
  RETURN QUERY SELECT * FROM ledgers WHERE id = v_ledger_id;
END;
$$;
