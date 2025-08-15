/*
  # Create user_tokens table for FCM tokens

  1. New Tables
    - `user_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users.id)
      - `fcm_token` (text, FCM token for push notifications)
      - `created_at` (timestamp)

  2. Security
    - No RLS policies (consistent with existing tables)
    - Unique constraint on user_id to ensure one token per user
*/

CREATE TABLE IF NOT EXISTS user_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  fcm_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);