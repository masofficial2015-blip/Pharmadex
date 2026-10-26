-- ==============================================================================
-- PHARMADEX-2: MIGRATION 009 - PHARMACIST PRIVILEGED PERMISSIONS
-- ==============================================================================

-- 1. ADD PERMISSIONS ARRAY COLUMN TO PROFILES TABLE
-- Standard permission keys:
--   - 'receive_stock'    : Access /inventory/receive & receive supplier stock batches
--   - 'manage_suppliers' : Access /inventory/suppliers & create/edit supplier records
--   - 'manage_medicines' : Register & edit catalog medicines and packaging configs
--   - 'view_ledger'      : Access /inventory/movements to inspect stock movement history
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT '{}'::text[];

-- 2. CREATE GIN INDEX FOR FAST PERMISSION ARRAY LOOKUPS
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON profiles USING GIN (permissions);

-- 3. HELPER FUNCTION TO CHECK IF A USER HAS A SPECIFIC PERMISSION
CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND (role = 'ADMIN' OR p_permission = ANY(permissions))
  );
$$ LANGUAGE sql SECURITY DEFINER;
