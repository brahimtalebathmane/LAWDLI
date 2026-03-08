/*
  # Fix RLS Policies for Custom Authentication
  
  ## Problem
  The previous RLS policies checked for JWT claims from Supabase Auth,
  but this application uses custom authentication (phone/PIN).
  
  ## Solution
  Since we cannot authenticate with JWT, we need to:
  1. Drop the restrictive policies that check JWT claims
  2. Create permissive policies that allow operations through the anon key
  3. Implement authorization logic at the application layer
  
  ## Security Note
  This approach trades database-level security for application-level security.
  For production, consider:
  - Migrating to Supabase Auth
  - Using service role key for admin operations
  - Implementing Edge Functions for secure operations
  
  ## Tables Affected
  - users
  - groups
  - group_members
  - requests
  - request_groups
  - responses
  - notifications
  - push_tokens
  - user_tokens
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
DROP POLICY IF EXISTS "Admins can insert groups" ON groups;
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;

DROP POLICY IF EXISTS "Users can view own memberships" ON group_members;
DROP POLICY IF EXISTS "Admins can insert group members" ON group_members;
DROP POLICY IF EXISTS "Admins can delete group members" ON group_members;

DROP POLICY IF EXISTS "Users can view requests for their groups" ON requests;
DROP POLICY IF EXISTS "Admins can insert requests" ON requests;
DROP POLICY IF EXISTS "Admins can delete requests" ON requests;

DROP POLICY IF EXISTS "Users can view request groups" ON request_groups;
DROP POLICY IF EXISTS "Admins can insert request groups" ON request_groups;
DROP POLICY IF EXISTS "Admins can delete request groups" ON request_groups;

DROP POLICY IF EXISTS "Users can view all responses" ON responses;
DROP POLICY IF EXISTS "Users can insert responses" ON responses;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view all push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can insert push tokens" ON push_tokens;
DROP POLICY IF EXISTS "Users can delete push tokens" ON push_tokens;

DROP POLICY IF EXISTS "Users can view all user tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can insert user tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can update user tokens" ON user_tokens;
DROP POLICY IF EXISTS "Users can delete user tokens" ON user_tokens;

-- Create permissive policies that work with anon key
-- Authorization will be handled at application layer

-- USERS TABLE
CREATE POLICY "Allow all users operations"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- GROUPS TABLE
CREATE POLICY "Allow all groups operations"
  ON groups FOR ALL
  USING (true)
  WITH CHECK (true);

-- GROUP MEMBERS TABLE
CREATE POLICY "Allow all group_members operations"
  ON group_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- REQUESTS TABLE
CREATE POLICY "Allow all requests operations"
  ON requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- REQUEST GROUPS TABLE
CREATE POLICY "Allow all request_groups operations"
  ON request_groups FOR ALL
  USING (true)
  WITH CHECK (true);

-- RESPONSES TABLE
CREATE POLICY "Allow all responses operations"
  ON responses FOR ALL
  USING (true)
  WITH CHECK (true);

-- NOTIFICATIONS TABLE
CREATE POLICY "Allow all notifications operations"
  ON notifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- PUSH TOKENS TABLE
CREATE POLICY "Allow all push_tokens operations"
  ON push_tokens FOR ALL
  USING (true)
  WITH CHECK (true);

-- USER TOKENS TABLE
CREATE POLICY "Allow all user_tokens operations"
  ON user_tokens FOR ALL
  USING (true)
  WITH CHECK (true);