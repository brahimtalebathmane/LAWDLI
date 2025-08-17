import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PushPayload {
  userIds: string[]; // app user ids (external ids in OneSignal)
  title: string;
  body: string;
  data?: Record<string, any>;
  url?: string;
}

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
    const { userIds, title, body, data, url }: PushPayload = await req.json();
    console.log('OneSignal push notification request:', { userIds, title, body });

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "userIds array is required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const appId = Deno.env.get("ONESIGNAL_APP_ID");
    const restKey = Deno.env.get("ONESIGNAL_REST_API_KEY");
    
    console.log('OneSignal config status:', {
      appId: appId ? 'Present' : 'Missing',
      restKey: restKey ? 'Present' : 'Missing'
    });
    
    if (!appId || !restKey) {
      return new Response(
        JSON.stringify({ 
          error: "OneSignal not configured (appId/restKey missing)",
          details: "Please set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in Supabase environment variables"
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const payload = {
      app_id: appId,
      include_external_user_ids: userIds,
      headings: { en: title, ar: title },
      contents: { en: body, ar: body },
      url: url || (data && (data.deepLink || data.click_action)) || "/",
      data: data || {},
      web_push_topic: "lawdli-notification"
    };

    console.log('Sending OneSignal notification:', payload);

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${restKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    console.log('OneSignal response:', json);
    
    if (!res.ok) {
      console.error('OneSignal error:', json);
      return new Response(
        JSON.stringify({ 
          error: "OneSignal error", 
          details: json,
          status: res.status
        }), 
        { 
          status: 502, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        onesignal: json,
        sent: json.recipients || 0,
        external_ids: userIds
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (err) {
    console.error('OneSignal function error:', err);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: String(err) 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});