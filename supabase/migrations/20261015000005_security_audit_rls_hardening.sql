-- ==============================================================================
-- PHARMADEX-2: MIGRATION 005 - SECURITY AUDIT & RLS HARDENING
-- Restricts sensitive tables to Admin/Owner only and prevents privilege escalation
-- ==============================================================================

-- 1. HARDEN BATCHES TABLE RLS
-- Pharmacists must not insert batches or update stock/prices directly via REST API.
-- Automated sales deductions occur safely via server actions with Service Role.
DROP POLICY IF EXISTS "Authenticated users can insert batches" ON batches;
DROP POLICY IF EXISTS "Authenticated users can update batches" ON batches;

CREATE POLICY "Admins can insert batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update batches"
  ON batches FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. HARDEN STOCK RECEIPTS TABLE RLS
-- Supplier invoices, costs, and unpaid Dube credit balances must be Admin-only.
DROP POLICY IF EXISTS "Authenticated users can view stock receipts" ON stock_receipts;
DROP POLICY IF EXISTS "Authenticated users can create stock receipts" ON stock_receipts;

CREATE POLICY "Admins can view stock receipts"
  ON stock_receipts FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can create stock receipts"
  ON stock_receipts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3. HARDEN PROFILES TABLE RLS
-- Prevent deactivated staff members from self-reactivating by modifying is_active.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND is_active = TRUE)
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM profiles WHERE id = auth.uid())
  );

-- 4. HARDEN AUDIT LOGS TABLE RLS
-- Restrict direct insertion to prevent forging audit events via REST API
DROP POLICY IF EXISTS "System and users can insert audit logs" ON audit_logs;

CREATE POLICY "Authenticated users can log own audit events"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (performed_by IS NULL OR performed_by = auth.uid() OR public.is_admin());
