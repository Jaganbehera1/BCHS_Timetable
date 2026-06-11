-- Fix infinite recursion: Replace problematic policies
-- Drop policies that cause recursion
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_select_admin" ON users;

-- Simple policies without recursion
-- Allow all authenticated users to read all user profiles (needed for app)
CREATE POLICY "users_select_all" ON users FOR SELECT
  TO authenticated USING (true);

-- Allow users to update only their own profile
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id);

-- Allow anyone authenticated to insert (for registration)
CREATE POLICY "users_insert_authenticated" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Allow delete only own account
CREATE POLICY "users_delete_own" ON users FOR DELETE
  TO authenticated USING (auth.uid() = id);