/*
  # Disable RLS and Create Open Storage Policies

  1. Security Changes
    - Disable Row Level Security on all tables
    - Create open storage policies for request-images bucket
    - Allow full public access for unauthenticated operations

  2. Tables Updated
    - users: RLS disabled
    - groups: RLS disabled  
    - group_members: RLS disabled
    - requests: RLS disabled
    - request_groups: RLS disabled
    - responses: RLS disabled
    - notifications: RLS disabled

  3. Storage
    - Create request-images bucket if not exists
    - Allow public uploads and downloads
*/

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Create storage bucket for request images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop any existing restrictive policies on the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view request images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload request images" ON storage.objects;

-- Create open policies for storage bucket
CREATE POLICY "Public read access for request-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-images');

CREATE POLICY "Public upload access for request-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'request-images');

CREATE POLICY "Public update access for request-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'request-images')
WITH CHECK (bucket_id = 'request-images');

CREATE POLICY "Public delete access for request-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'request-images');