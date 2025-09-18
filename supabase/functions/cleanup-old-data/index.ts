import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS"
};

serve(async (req) => {
  // Handle CORS preflight requests properly
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    console.log('Starting automatic cleanup process...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate 24 hours ago
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log('Cleanup cutoff time:', cutoffTime);

    // Delete old requests (this will cascade delete related data)
    const { data: deletedRequests, error: requestsError } = await supabase
      .from('requests')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id');

    if (requestsError) {
      console.error('Error deleting old requests:', requestsError);
      throw requestsError;
    }

    // Delete old notifications
    const { data: deletedNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id');

    if (notificationsError) {
      console.error('Error deleting old notifications:', notificationsError);
      throw notificationsError;
    }

    const result = {
      success: true,
      cutoff_time: cutoffTime,
      deleted_requests: deletedRequests?.length || 0,
      deleted_notifications: deletedNotifications?.length || 0,
      timestamp: new Date().toISOString()
    };

    console.log('Cleanup completed successfully:', result);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Cleanup process failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});