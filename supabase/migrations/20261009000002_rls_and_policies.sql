-- ==============================================================================
-- PHARMADEX-2: ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR ROLE-BASED ACCESS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND is_active = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY ON ALL APPLICATION TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Authenticated users can view active team profiles
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR id = auth.uid() OR public.is_admin());

-- Users can update their own personal details (name, phone)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admins can insert and manage all profiles
CREATE POLICY "Admins have full access to profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- SUPPLIERS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can manage suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- MEDICINES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view medicines"
  ON medicines FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can insert and update medicines"
  ON medicines FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update medicines"
  ON medicines FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- BATCHES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view batches"
  ON batches FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can insert batches"
  ON batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update batches"
  ON batches FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- SHIFTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can open a shift"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Shift owners or admins can close shift"
  ON shifts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- SALES & SALE ITEMS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Cashiers can record sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (cashier_id = auth.uid());

CREATE POLICY "Admins can update sales status"
  ON sales FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users can view sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can insert sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------------------------
-- RETURNS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view returns"
  ON returns FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can authorize returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND authorized_by = auth.uid());

-- ------------------------------------------------------------------------------
-- CASH MOVEMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view cash movements"
  ON cash_movements FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can log cash movements"
  ON cash_movements FOR INSERT
  TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- ------------------------------------------------------------------------------
-- STOCK MOVEMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view stock movements"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can insert stock movements"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (performed_by = auth.uid());

-- ------------------------------------------------------------------------------
-- AUDIT LOGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "System and users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);
