/*
  # Ensure cleanup columns exist for automatic data cleanup

  1. Table Verification
    - Ensure requests table has created_at column
    - Ensure notifications table has created_at column
    - Add columns if missing with default NOW()

  2. Performance
    - Add simple indexes for efficient cleanup queries
    - Optimize deletion operations

  3. Safety
    - Only add columns if they don't exist
    - Preserve all existing data and functionality
*/

-- Ensure requests table has created_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE requests ADD COLUMN created_at timestamptz DEFAULT now();
    COMMENT ON COLUMN requests.created_at IS 'Timestamp for automatic cleanup';
  END IF;
END $$;

-- Ensure notifications table has created_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN created_at timestamptz DEFAULT now();
    COMMENT ON COLUMN notifications.created_at IS 'Timestamp for automatic cleanup';
  END IF;
END $$;

-- Add simple indexes for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_requests_created_at_cleanup 
ON requests(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at_cleanup 
ON notifications(created_at);