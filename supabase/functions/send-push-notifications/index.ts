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

// Function to create JWT for Firebase Admin SDK
async function createFirebaseJWT(): Promise<string> {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');
  const tokenUri = Deno.env.get('FIREBASE_TOKEN_URI');

  console.log('Firebase Service Account status:', {
    projectId: projectId ? 'Present' : 'Missing',
    clientEmail: clientEmail ? 'Present' : 'Missing',
    privateKey: privateKey ? `Present (${privateKey.length} chars)` : 'Missing',
    tokenUri: tokenUri ? 'Present' : 'Missing'
  });

  if (!projectId || !clientEmail || !privateKey || !tokenUri) {
    throw new Error('Missing Firebase Service Account credentials');
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiration

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: tokenUri,
    iat: now,
    exp: exp
  };

  // Create JWT manually using Web Crypto API
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  
  try {
    // Clean and process private key
    let keyData = privateKey;
    
    // Remove quotes if present
    if (keyData.startsWith('"') && keyData.endsWith('"')) {
      keyData = keyData.slice(1, -1);
    }
    
    // Replace escaped newlines with actual newlines
    keyData = keyData.replace(/\\n/g, '\n');
    
    console.log('Processing private key...');
    console.log('Key starts with:', keyData.substring(0, 50));
    console.log('Key ends with:', keyData.substring(keyData.length - 50));
    
    // Extract PEM content
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    
    if (!keyData.includes(pemHeader) || !keyData.includes(pemFooter)) {
      throw new Error('Invalid PEM format: missing header or footer');
    }
    
    const startIndex = keyData.indexOf(pemHeader) + pemHeader.length;
    const endIndex = keyData.indexOf(pemFooter);
    
    if (startIndex >= endIndex) {
      throw new Error('Invalid PEM format: header after footer');
    }
    
    const pemContents = keyData.substring(startIndex, endIndex)
      .replace(/\s/g, ''); // Remove all whitespace including newlines
    
    console.log('PEM content length:', pemContents.length);
    console.log('PEM content sample:', pemContents.substring(0, 50));
    
    // Decode base64
    let binaryDer;
    try {
      // Use Deno's built-in base64 decoder which is more robust
      const decoder = new TextDecoder();
      const uint8Array = new Uint8Array(atob(pemContents).split('').map(c => c.charCodeAt(0)));
      binaryDer = uint8Array;
      console.log('Successfully decoded base64, length:', binaryDer.length);
    } catch (decodeError) {
      console.error('Base64 decode error:', decodeError);
      throw new Error(`Failed to decode base64 private key: ${decodeError.message}`);
    }
    
    // Import private key
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    console.log('Successfully imported private key');

    // Sign the JWT
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data);
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    console.log('Successfully created JWT');
    return `${headerB64}.${payloadB64}.${signatureB64}`;
    
  } catch (error) {
    console.error('Error creating JWT:', error);
    throw new Error(`JWT creation failed: ${error.message}`);
  }
}

// Function to get Firebase access token
async function getFirebaseAccessToken(): Promise<string> {
  try {
    console.log('Creating Firebase JWT...');
    const jwt = await createFirebaseJWT();
    console.log('JWT created successfully, length:', jwt.length);
    
    const tokenUri = Deno.env.get('FIREBASE_TOKEN_URI');

    console.log('Requesting access token from:', tokenUri);
    const response = await fetch(tokenUri!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token request failed:', response.status, error);
      throw new Error(`Failed to get access token: ${response.status} ${error}`);
    }

    const tokenData = await response.json();
    console.log('Access token obtained successfully');
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting Firebase access token:', error);
    throw error;
  }
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

    // Check Firebase Service Account credentials
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');
    
    if (!projectId || !clientEmail || !privateKey) {
      console.error('Firebase Service Account credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Firebase Service Account not configured',
          details: 'Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Supabase environment variables'
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

    // Get Firebase access token
    console.log('Getting Firebase access token...');
    const accessToken = await getFirebaseAccessToken();
    console.log('Firebase access token obtained successfully');

    // Send FCM messages using Firebase Admin SDK v1 API
    let sentCount = 0;
    let failedCount = 0;
    const invalidTokens: string[] = [];
    const results: any[] = [];

    for (const tokenData of tokens) {
      try {
        console.log(`Sending notification to token: ${tokenData.fcm_token.substring(0, 20)}...`);
        
        const fcmPayload = {
          message: {
            token: tokenData.fcm_token,
            notification: {
              title,
              body,
              image: 'https://i.postimg.cc/rygydTNp/9.png'
            },
            data: {
              ...data,
              click_action: data?.deepLink || '/',
              deepLink: data?.deepLink || '/'
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
          }
        };

        const fcmResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fcmPayload)
        });

        const fcmResult = await fcmResponse.json();
        console.log(`FCM Response for token ${tokenData.fcm_token.substring(0, 20)}:`, fcmResult);
        
        results.push({
          token: tokenData.fcm_token.substring(0, 20) + '...',
          success: fcmResponse.ok,
          result: fcmResult
        });

        if (fcmResponse.ok && fcmResult.name) {
          sentCount++;
          console.log('✅ Notification sent successfully');
        } else {
          failedCount++;
          
          // Check for invalid token errors
          if (fcmResult.error?.details?.[0]?.errorCode === 'UNREGISTERED' || 
              fcmResult.error?.details?.[0]?.errorCode === 'INVALID_ARGUMENT' ||
              fcmResult.error?.code === 404) {
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