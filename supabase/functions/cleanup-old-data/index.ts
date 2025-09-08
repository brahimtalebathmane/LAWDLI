import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting automatic cleanup process...');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const cutoffTime = twentyFourHoursAgo.toISOString();

    console.log('Cleanup cutoff time:', cutoffTime);

    // Delete old requests (older than 24 hours)
    const { data: deletedRequests, error: requestsError } = await supabase
      .from('requests')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id');

    if (requestsError) {
      console.error('Error deleting old requests:', requestsError);
      throw requestsError;
    }

    // Delete old notifications (older than 24 hours)
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
      timestamp: new Date().toISOString(),
      cutoff_time: cutoffTime,
      deleted_requests: deletedRequests?.length || 0,
      deleted_notifications: deletedNotifications?.length || 0,
      message: `Cleanup completed: ${deletedRequests?.length || 0} requests and ${deletedNotifications?.length || 0} notifications deleted`
    };

    console.log('Cleanup completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Cleanup process failed:', error);
    
    const errorResponse = {
      success: false,
      error: "Cleanup process failed", 
      details: String(error),
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});