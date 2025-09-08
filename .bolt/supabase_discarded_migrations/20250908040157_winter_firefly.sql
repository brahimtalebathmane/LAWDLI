/*
  # Create automatic cleanup schedule

  1. Cron Job
    - Schedule cleanup_old_data function to run every 24 hours
    - Runs at 2:00 AM daily to minimize impact
    - Uses pg_cron extension for scheduling

  2. Configuration
    - Job name: 'cleanup_old_data_daily'
    - Schedule: '0 2 * * *' (daily at 2:00 AM)
    - Calls the cleanup_old_data() function
*/

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing cleanup job to avoid duplicates
SELECT cron.unschedule('cleanup_old_data_daily');

-- Schedule the cleanup function to run daily at 2:00 AM
SELECT cron.schedule(
  'cleanup_old_data_daily',
  '0 2 * * *',
  'SELECT cleanup_old_data();'
);