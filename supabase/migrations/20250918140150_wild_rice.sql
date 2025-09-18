@@ .. @@
 -- Add indexes for efficient cleanup queries if they don't exist
-CREATE INDEX IF NOT EXISTS idx_requests_created_at_cleanup 
-ON requests(created_at) 
-WHERE created_at < (now() - interval '1 day');
+CREATE INDEX IF NOT EXISTS idx_requests_created_at_cleanup 
+ON requests(created_at);

-CREATE INDEX IF NOT EXISTS idx_notifications_created_at_cleanup 
-ON notifications(created_at) 
-WHERE created_at < (now() - interval '1 day');
+CREATE INDEX IF NOT EXISTS idx_notifications_created_at_cleanup 
+ON notifications(created_at);