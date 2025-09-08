/*
  # Create automatic cleanup function for old data

  1. Database Function
    - Create cleanup_old_data() function that deletes records older than 24 hours
    - Function deletes from requests and notifications tables
    - Returns count of deleted records

  2. Security
    - Function runs with definer rights for proper permissions
    - No RLS conflicts as tables have RLS disabled

  3. Performance
    - Uses existing indexes on created_at columns
    - Efficient deletion with proper WHERE clauses
*/

-- Create the cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_requests_count integer := 0;
  deleted_notifications_count integer := 0;
  cutoff_time timestamptz;
BEGIN
  -- Calculate 24 hours ago
  cutoff_time := now() - interval '24 hours';
  
  -- Delete old requests (this will cascade delete related data)
  WITH deleted_requests AS (
    DELETE FROM requests 
    WHERE created_at < cutoff_time
    RETURNING id
  )
  SELECT count(*) INTO deleted_requests_count FROM deleted_requests;
  
  -- Delete old notifications
  WITH deleted_notifications AS (
    DELETE FROM notifications 
    WHERE created_at < cutoff_time
    RETURNING id
  )
  SELECT count(*) INTO deleted_notifications_count FROM deleted_notifications;
  
  -- Return summary
  RETURN json_build_object(
    'success', true,
    'timestamp', now(),
    'cutoff_time', cutoff_time,
    'deleted_requests', deleted_requests_count,
    'deleted_notifications', deleted_notifications_count,
    'total_deleted', deleted_requests_count + deleted_notifications_count
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', now()
  );
END;
$$;