import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { userIds, title, body, data }: PushPayload = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get FCM server key from environment
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Fetch FCM tokens for the specified users
    const tokensResponse = await fetch(`${supabaseUrl}/rest/v1/user_tokens?user_id=in.(${userIds.join(',')})&select=fcm_token,user_id`, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (!tokensResponse.ok) {
      throw new Error('Failed to fetch FCM tokens');
    }

    const tokens = await tokensResponse.json();
    
    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No FCM tokens found for specified users',
          sent: 0,
          failed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send FCM messages
    let sentCount = 0;
    let failedCount = 0;
    const invalidTokens: string[] = [];

    for (const tokenData of tokens) {
      try {
        const fcmPayload = {
          to: tokenData.fcm_token,
          notification: {
            title,
            body,
            icon: 'https://i.postimg.cc/rygydTNp/9.png',
            badge: 'https://i.postimg.cc/rygydTNp/9.png',
            click_action: data?.deepLink || '/',
            tag: 'lawdli-notification'
          },
          data: data || {},
          webpush: {
            headers: {
              'Urgency': 'high'
            },
            fcm_options: {
              link: data?.deepLink || '/'
            },
            notification: {
              title,
              body,
              icon: 'https://i.postimg.cc/rygydTNp/9.png',
              badge: 'https://i.postimg.cc/rygydTNp/9.png',
              vibrate: [200, 100, 200],
              requireInteraction: false,
              silent: false,
              tag: 'lawdli-notification',
              renotify: true,
              actions: [
                {
                  action: 'open',
                  title: 'Open',
                  icon: 'https://i.postimg.cc/rygydTNp/9.png'
                }
              ]
            }
          },
          android: {
            priority: 'high',
            notification: {
              title,
              body,
              icon: 'https://i.postimg.cc/rygydTNp/9.png',
              click_action: data?.deepLink || '/',
              tag: 'lawdli-notification'
            }
          },
          apns: {
            headers: {
              'apns-priority': '10'
            },
            payload: {
              aps: {
                alert: {
                  title,
                  body
                },
                badge: 1,
                sound: 'default'
              }
            }
          }
        };

        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
            'Priority': 'high'
          },
          body: JSON.stringify(fcmPayload)
        });

        const fcmResult = await fcmResponse.json();
        console.log('FCM Response:', fcmResult);

        if (fcmResponse.ok && fcmResult.success === 1) {
          sentCount++;
        } else {
          failedCount++;
          
          // Check for invalid token errors
          if (fcmResult.results?.[0]?.error === 'NotRegistered' || 
              fcmResult.results?.[0]?.error === 'InvalidRegistration' ||
              fcmResult.results?.[0]?.error === 'MismatchSenderId') {
            invalidTokens.push(tokenData.fcm_token);
          }
          
          console.error('FCM send failed:', fcmResult);
        }
      } catch (error) {
        failedCount++;
        console.error('Error sending FCM message:', error);
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/user_tokens?fcm_token=in.(${invalidTokens.join(',')})`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          }
        });
        console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
      } catch (error) {
        console.error('Error cleaning up invalid tokens:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        invalidTokensRemoved: invalidTokens.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-push-notifications function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});