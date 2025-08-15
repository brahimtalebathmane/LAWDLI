/*
  # Create push_tokens table for FCM tokens

  1. New Tables
    - `push_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `token` (text, unique FCM token)
      - `platform` (text, platform identifier)
      - `created_at` (timestamp)
      - `last_seen_at` (timestamp, nullable)

  2. Security
    - No RLS enabled to match existing security posture
    - Foreign key constraint to users table

  3. Changes
    - Make requests.title and requests.description nullable
*/

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  platform text DEFAULT 'web',
  created_at timestamptz DEFAULT now(),
  last_seen_at timestamptz
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Make requests title and description nullable
DO $$
BEGIN
  -- Check if title column is NOT NULL and alter if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' 
    AND column_name = 'title' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE requests ALTER COLUMN title DROP NOT NULL;
  END IF;
  
  -- Check if description column is NOT NULL and alter if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' 
    AND column_name = 'description' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE requests ALTER COLUMN description DROP NOT NULL;
  END IF;
END $$;