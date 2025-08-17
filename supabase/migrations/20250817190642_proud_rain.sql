/*
  # Add indexes for cleanup operations

  1. Performance Optimization
    - Add indexes on created_at columns for faster cleanup queries
    - Optimize deletion operations for requests and notifications tables

  2. Database Performance
    - Ensure cleanup operations run efficiently
    - Prevent performance impact on regular operations
*/

-- Add index on requests.created_at for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_requests_created_at 
ON requests(created_at);

-- Add index on notifications.created_at for faster cleanup queries  
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at);

-- Add index on responses.created_at for related cleanup operations
CREATE INDEX IF NOT EXISTS idx_responses_created_at 
ON responses(created_at);

-- Add index on request_groups for cascade cleanup efficiency
CREATE INDEX IF NOT EXISTS idx_request_groups_request_id 
ON request_groups(request_id);