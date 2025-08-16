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
    console.log('Push notification request received:', { userIds, title, body });

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error('Invalid userIds:', userIds);
      return new Response(
        JSON.stringify({ error: 'userIds array is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!title || !body) {
      console.error('Missing title or body:', { title, body });
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
    console.log('FCM Server Key status:', fcmServerKey ? 'Present' : 'Missing');
    
    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY environment variable not set');
      return new Response(
        JSON.stringify({ 
          error: 'FCM Server Key not configured in Supabase environment variables',
          details: 'Please set FCM_SERVER_KEY in your Supabase project settings > Edge Functions > Environment Variables'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Supabase client configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Supabase config:', {
      url: supabaseUrl ? 'Present' : 'Missing',
      serviceKey: supabaseServiceKey ? 'Present' : 'Missing'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Fetch FCM tokens for the specified users
    const tokensUrl = `${supabaseUrl}/rest/v1/user_tokens?user_id=in.(${userIds.join(',')})&select=fcm_token,user_id`;
    console.log('Fetching tokens from:', tokensUrl);
    
    const tokensResponse = await fetch(tokensUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
        'Content-Type': 'application/json'
      }
    });

    if (!tokensResponse.ok) {
      const errorText = await tokensResponse.text();
      console.error('Failed to fetch FCM tokens:', tokensResponse.status, errorText);
      throw new Error(`Failed to fetch FCM tokens: ${tokensResponse.status}`);
    }

    const tokens = await tokensResponse.json();
    console.log('Fetched tokens:', tokens?.length || 0, 'tokens found');
    
    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for users:', userIds);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No FCM tokens found for specified users',
          sent: 0,
          failed: 0,
          details: 'Users may not have enabled notifications or tokens may be expired'
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
    const results: any[] = [];

    for (const tokenData of tokens) {
      try {
        console.log(`Sending notification to token: ${tokenData.fcm_token.substring(0, 20)}...`);
        
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
          data: {
            ...data,
            click_action: data?.deepLink || '/'
          },
          webpush: {
            headers: {
              'Urgency': 'high',
              'TTL': '86400'
            },
            fcm_options: {
              link: data?.deepLink || '/'
            },
            notification: {
              title,
              body,
              icon: 'https://i.postimg.cc/rygydTNp/9.png',
              badge: 'https://i.postimg.cc/rygydTNp/9.png',
              vibrate: [200, 100, 200, 100, 200],
              requireInteraction: true,
              silent: false,
              tag: 'lawdli-notification',
              renotify: true,
              timestamp: Date.now(),
              actions: [
                {
                  action: 'open',
                  title: 'فتح',
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
              tag: 'lawdli-notification',
              channel_id: 'lawdli_notifications'
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
                sound: 'default',
                'content-available': 1
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
        console.log(`FCM Response for token ${tokenData.fcm_token.substring(0, 20)}:`, fcmResult);
        
        results.push({
          token: tokenData.fcm_token.substring(0, 20) + '...',
          success: fcmResponse.ok && fcmResult.success === 1,
          result: fcmResult
        });

        if (fcmResponse.ok && fcmResult.success === 1) {
          sentCount++;
          console.log('✅ Notification sent successfully');
        } else {
          failedCount++;
          
          // Check for invalid token errors
          if (fcmResult.results?.[0]?.error === 'NotRegistered' || 
              fcmResult.results?.[0]?.error === 'InvalidRegistration' ||
              fcmResult.results?.[0]?.error === 'MismatchSenderId') {
            invalidTokens.push(tokenData.fcm_token);
            console.log('❌ Invalid token detected, will be removed');
          }
          
          console.error('❌ FCM send failed:', fcmResult);
        }
      } catch (error) {
        failedCount++;
        console.error('❌ Error sending FCM message:', error);
        results.push({
          token: tokenData.fcm_token.substring(0, 20) + '...',
          success: false,
          error: error.message
        });
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      try {
        console.log(`Cleaning up ${invalidTokens.length} invalid tokens`);
        const deleteUrl = `${supabaseUrl}/rest/v1/user_tokens?fcm_token=in.(${invalidTokens.map(t => `"${t}"`).join(',')})`;
        
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          }
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Cleaned up ${invalidTokens.length} invalid tokens`);
        } else {
          console.error('❌ Failed to clean up invalid tokens:', await deleteResponse.text());
        }
      } catch (error) {
        console.error('❌ Error cleaning up invalid tokens:', error);
      }
    }

    const response = {
      success: true,
      sent: sentCount,
      failed: failedCount,
      invalidTokensRemoved: invalidTokens.length,
      totalTokens: tokens.length,
      results: results
    };

    console.log('Final push notification result:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in send-push-notifications function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});