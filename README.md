لودلي | LAWDLI

## OneSignal Web Push Integration

This application uses OneSignal Web Push (v16) for real-time push notifications on mobile and desktop devices.

### OneSignal Configuration

The application is configured with the following OneSignal project:
- **App ID**: 2c99c3ab-54b1-4edb-b687-a436250ca0c4
- **Safari Web ID**: web.onesignal.auto.5f80e2fb-b063-4ecb-90f7-0c7e45de9678

### Push Notification Features

1. **Automatic Token Registration**
   - OneSignal subscriptions are automatically associated with user IDs when users log in
   - External user IDs map to your app's user.id
   - No manual token storage required (OneSignal handles this)

2. **Notification Triggers**
   - **New Request**: Sent to all users in selected groups when admin creates a request
   - **New Response**: Sent to admin users when any user responds to a request

3. **Mobile PWA Support**
   - Notifications work when app is installed as PWA ("Add to Home Screen")
   - Background notifications handled by service worker
   - Compatible with Android Chrome and iOS Safari 16.4+

4. **Multi-language Support**
   - Notification text localized in Arabic and French
   - Uses existing i18n system for consistency

### Server Configuration

For the push notification edge function to work, you need to set OneSignal credentials in your Supabase environment:

```bash
# In your Supabase project settings > Edge Functions > Environment Variables
ONESIGNAL_APP_ID=2c99c3ab-54b1-4edb-b687-a436250ca0c4
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key_here
```

**CRITICAL: OneSignal REST API Key Setup**

1. **Get OneSignal REST API Key:**
   - Go to [OneSignal Dashboard](https://app.onesignal.com/)
   - Select your app: `lawdli`
   - Go to Settings → Keys & IDs
   - Copy "REST API Key"

2. **Set in Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Edge Functions → Environment Variables
   - Add the following variables:
     - `ONESIGNAL_APP_ID` = `2c99c3ab-54b1-4edb-b687-a436250ca0c4`
     - `ONESIGNAL_REST_API_KEY` = `your_rest_api_key_here`
   - Deploy the edge function: `supabase functions deploy send-push-notifications`

3. **Verify Setup:**
   - Check browser console for "OneSignal initialized"
   - Test notifications by responding to requests
   - Check Edge Function logs in Supabase dashboard

## Setup Instructions

### OneSignal Push Notifications Setup

The application is pre-configured with OneSignal. You only need to:

1. **Set OneSignal REST API Key in Supabase**
   - Go to your Supabase project dashboard
   - Navigate to Edge Functions → Environment Variables
   - Add: `ONESIGNAL_REST_API_KEY` with your OneSignal REST API key

2. **Deploy Edge Function**
   ```bash
   # Deploy the push notification function
   supabase functions deploy send-push-notifications
   ```

### PWA Installation
- The app can be installed as a PWA on mobile devices
- Push notifications work even when the app is closed
- Supported on Android Chrome and iOS Safari (16.4+)

### Features
- Real-time push notifications for new requests and responses
- **Strict Online-Only Mode**: 
  - NO offline caching whatsoever
  - ALL resources always loaded fresh from server
  - Service workers ONLY handle push notifications
  - Prevents any stale content issues
  - Requires active internet connection
- Multi-language support (Arabic/French)
- Admin and user role management
- Group-based request distribution
- Real-time push notifications via OneSignal Web Push
- PWA installable on mobile devices
- Always loads fresh content from server

## PWA Configuration
- The app can be installed as a PWA on mobile devices
- Push notifications work even when the app is closed
- **Strict Online-Only Mode**: 
  - NO offline caching whatsoever
  - ALL resources always loaded fresh from server
  - Service workers ONLY handle push notifications
  - Prevents any stale content issues
  - Requires active internet connection
- Always loads the latest version from the server
  - NO offline caching whatsoever
  - ALL resources always loaded fresh from server
  - Service workers ONLY handle push notifications
  - Prevents any stale content issues
  - Requires active internet connection
- Always loads the latest version from the server
- Supported on Android Chrome and iOS Safari (16.4+)