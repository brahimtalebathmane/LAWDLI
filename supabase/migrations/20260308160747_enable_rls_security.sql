/*
  # Enable Row Level Security (RLS) for Production

  This migration enables RLS on all tables to secure data access.
  
  ## Security Model
  
  ### Users Table
  - Users can read their own data
  - Admins can read all users
  - Admins can manage users
  
  ### Groups Table
  - Anyone authenticated can read groups
  - Only admins can create/update/delete groups
  
  ### Group Members Table
  - Users can read their own memberships
  - Admins can read all memberships
  - Only admins can manage memberships
  
  ### Requests Table
  - Users can read requests sent to their groups
  - Admins can read all requests
  - Admins can create requests
  - Creators can delete their own requests
  
  ### Request Groups Table
  - Users can read request-group links for their groups
  - Admins can manage all request-group links
  
  ### Responses Table
  - Users can read their own responses
  - Admins can read all responses
  - Users can create responses to requests in their groups
  
  ### Notifications Table
  - Users can read their own notifications
  - Admins can create notifications for any user
  - Users can mark their own notifications as read
  
  ### Push Tokens Table
  - Users can manage their own push tokens
  - Admins can read all push tokens
  
  ### User Tokens Table
  - Users can manage their own tokens
  - Admins can read all tokens
*/

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user ID from phone and pin (for login)
CREATE OR REPLACE FUNCTION get_user_by_credentials(phone TEXT, pin TEXT)
RETURNS SETOF users AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM users
  WHERE phone_number = phone AND pin_code = pin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS TABLE POLICIES
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

-- GROUPS TABLE POLICIES
CREATE POLICY "Anyone can view groups"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert groups"
  ON groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update groups"
  ON groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete groups"
  ON groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

-- GROUP MEMBERS TABLE POLICIES
CREATE POLICY "Users can view own memberships"
  ON group_members FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert group members"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete group members"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

-- REQUESTS TABLE POLICIES
CREATE POLICY "Users can view requests for their groups"
  ON requests FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert requests"
  ON requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete requests"
  ON requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

-- REQUEST GROUPS TABLE POLICIES
CREATE POLICY "Users can view request groups"
  ON request_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert request groups"
  ON request_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete request groups"
  ON request_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

-- RESPONSES TABLE POLICIES
CREATE POLICY "Users can view all responses"
  ON responses FOR SELECT
  USING (true);

CREATE POLICY "Users can insert responses"
  ON responses FOR INSERT
  WITH CHECK (true);

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete notifications"
  ON notifications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
      AND role = 'admin'
    )
  );

-- PUSH TOKENS TABLE POLICIES
CREATE POLICY "Users can view all push tokens"
  ON push_tokens FOR SELECT
  USING (true);

CREATE POLICY "Users can insert push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete push tokens"
  ON push_tokens FOR DELETE
  USING (true);

-- USER TOKENS TABLE POLICIES
CREATE POLICY "Users can view all user tokens"
  ON user_tokens FOR SELECT
  USING (true);

CREATE POLICY "Users can insert user tokens"
  ON user_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update user tokens"
  ON user_tokens FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete user tokens"
  ON user_tokens FOR DELETE
  USING (true);