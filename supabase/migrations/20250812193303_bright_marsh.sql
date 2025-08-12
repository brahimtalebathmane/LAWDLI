/*
  # LAWDLI Database Schema

  1. New Tables
    - `users` - Store user information with phone/pin authentication
    - `groups` - Resource groups that can receive requests
    - `group_members` - Many-to-many relationship between users and groups
    - `requests` - Requests created by admins
    - `request_groups` - Many-to-many relationship between requests and groups
    - `responses` - User responses to requests
    - `notifications` - System notifications for users

  2. Security
    - No RLS enabled as per requirements
    - All tables allow unrestricted access
    - Authentication handled client-side only

  3. Initial Data
    - Seed admin user with specified credentials
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone_number text UNIQUE NOT NULL CHECK (LENGTH(phone_number) = 8),
  pin_code text NOT NULL CHECK (LENGTH(pin_code) = 4),
  role text NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create request_groups table
CREATE TABLE IF NOT EXISTS request_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(request_id, group_id)
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  response text NOT NULL CHECK (response IN ('موجود', 'غير موجود', 'بديل', 'Disponible', 'Indisponible', 'Alternative')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Insert seed admin user
INSERT INTO users (full_name, phone_number, pin_code, role, created_at)
VALUES ('LAWDLI Admin', '22262241', '3690', 'admin', now())
ON CONFLICT (phone_number) DO NOTHING;

-- Create storage bucket for request images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;