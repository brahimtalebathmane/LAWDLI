/*
  # Setup Automatic Cleanup System

  1. Database Function
    - Creates `cleanup_old_data()` function to delete old records
    - Deletes requests and notifications older than 24 hours
    - Returns cleanup statistics

  2. Automatic Scheduling
    - Uses pg_cron extension for server-side scheduling
    - Runs daily at 2:00 AM automatically
    - No client-side dependencies

  3. Performance
    - Uses existing created_at indexes
    - Efficient deletion queries
    - Proper error handling
*/

-- Enable pg_cron extension for scheduling (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_requests integer := 0;
  deleted_notifications integer := 0;
  cutoff_time timestamp with time zone;
  result json;
BEGIN
  -- Calculate 24 hours ago
  cutoff_time := now() - interval '24 hours';
  
  -- Log the cleanup operation
  RAISE NOTICE 'Starting cleanup for data older than %', cutoff_time;
  
  -- Delete old requests (cascade will handle related data)
  DELETE FROM requests 
  WHERE created_at < cutoff_time;
  
  GET DIAGNOSTICS deleted_requests = ROW_COUNT;
  
  -- Delete old notifications
  DELETE FROM notifications 
  WHERE created_at < cutoff_time;
  
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;
  
  -- Create result JSON
  result := json_build_object(
    'success', true,
    'timestamp', now(),
    'cutoff_time', cutoff_time,
    'deleted_requests', deleted_requests,
    'deleted_notifications', deleted_notifications,
    'message', format('Cleanup completed: %s requests and %s notifications deleted', 
                     deleted_requests, deleted_notifications)
  );
  
  -- Log the results
  RAISE NOTICE 'Cleanup completed: % requests, % notifications deleted', 
               deleted_requests, deleted_notifications;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return error result
    RAISE NOTICE 'Cleanup failed: %', SQLERRM;
    
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$;

-- Schedule the cleanup to run daily at 2:00 AM
SELECT cron.schedule(
  'daily-cleanup',
  '0 2 * * *',
  'SELECT cleanup_old_data();'
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_data() TO service_role;

-- Add helpful indexes if they don't exist (for performance)
CREATE INDEX IF NOT EXISTS idx_requests_created_at_cleanup 
ON requests(created_at) 
WHERE created_at < (now() - interval '1 day');

CREATE INDEX IF NOT EXISTS idx_notifications_created_at_cleanup 
ON notifications(created_at) 
WHERE created_at < (now() - interval '1 day');