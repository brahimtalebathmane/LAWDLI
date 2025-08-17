import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  try {
    console.log('Starting automatic cleanup process...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const cutoffTime = twentyFourHoursAgo.toISOString();

    console.log(`Deleting data older than: ${cutoffTime}`);

    // Delete old requests (claims) - this will cascade delete related data
    const { data: oldRequests, error: requestsError } = await supabase
      .from('requests')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id, title, created_at');

    if (requestsError) {
      console.error('Error deleting old requests:', requestsError);
      throw requestsError;
    }

    const deletedRequestsCount = oldRequests?.length || 0;
    console.log(`Deleted ${deletedRequestsCount} old requests`);

    // Delete old notifications
    const { data: oldNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffTime)
      .select('id, title, created_at');

    if (notificationsError) {
      console.error('Error deleting old notifications:', notificationsError);
      throw notificationsError;
    }

    const deletedNotificationsCount = oldNotifications?.length || 0;
    console.log(`Deleted ${deletedNotificationsCount} old notifications`);

    // Log cleanup summary
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      cutoffTime,
      deletedRequests: deletedRequestsCount,
      deletedNotifications: deletedNotificationsCount,
      totalDeleted: deletedRequestsCount + deletedNotificationsCount
    };

    console.log('Cleanup completed successfully:', summary);

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error('Cleanup process failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: "Cleanup process failed", 
        details: String(error),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});