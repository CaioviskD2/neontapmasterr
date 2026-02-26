
-- Block direct INSERT on nicknames (force use of register_nickname RPC which is SECURITY DEFINER)
CREATE POLICY "Prevent direct inserts on nicknames"
  ON public.nicknames
  FOR INSERT
  WITH CHECK (false);

-- Block UPDATE on nicknames
CREATE POLICY "Prevent updates on nicknames"
  ON public.nicknames
  FOR UPDATE
  USING (false);

-- Block DELETE on nicknames
CREATE POLICY "Prevent deletes on nicknames"
  ON public.nicknames
  FOR DELETE
  USING (false);
