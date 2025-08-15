LAWDLI

## Firebase Cloud Messaging (FCM) Integration

This application uses Firebase Cloud Messaging for real-time push notifications on mobile and desktop devices.

### Firebase Configuration

The application is pre-configured with the following Firebase project:
- **Project ID**: lawdli
- **App ID**: 1:1095350923790:web:93631ae307a6ecdce5425f
- **VAPID Key**: BOPyVXW3oxnwPsk1dKk1gcTWhfREpYbNDv3YHPedB-7zIXUoHlp6otcX1ypLj068bIZnunwrbqzaeTjnzG_vyc0

### Push Notification Features

1. **Automatic Token Registration**
   - FCM tokens are automatically registered when users log in
   - Tokens are stored in the `user_tokens` table in Supabase
   - One unique token per user (upsert on user_id)

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

### Database Schema

**New Table: user_tokens**
```sql
CREATE TABLE user_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  fcm_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

**Updated: requests table**
- `title` and `description` columns are now nullable (optional)
- Image upload remains required (validated in UI)

### Server Configuration

For the push notification edge function to work, you need to set the FCM server key in your Supabase environment:

```bash
# In your Supabase project settings > Edge Functions > Environment Variables
FCM_SERVER_KEY=your_fcm_server_key_here
```

You can get the FCM server key from:
1. Firebase Console → Project Settings → Cloud Messaging
2. Copy the "Server key" (legacy) value

## Setup Instructions

### Firebase Push Notifications Setup

The application is pre-configured with Firebase. You only need to:

1. **Set FCM Server Key in Supabase**
   - Go to your Supabase project dashboard
   - Navigate to Edge Functions → Environment Variables
   - Add: `FCM_SERVER_KEY` with your Firebase server key

2. **Deploy Database Migrations**
   ```bash
   # Run the migrations to create user_tokens table and update requests
   supabase db push
   ```

3. **Deploy Edge Function**
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
- Online-only operation (no offline caching to ensure fresh content)
- Multi-language support (Arabic/French)
- Admin and user role management
- Group-based request distribution
- Real-time push notifications via Firebase FCM
- PWA installable on mobile devices
- Always loads fresh content from server

## PWA Configuration
- The app can be installed as a PWA on mobile devices
- Push notifications work even when the app is closed
- **Online-only mode**: No offline caching to prevent stale content issues
- Always loads the latest version from the server
- Supported on Android Chrome and iOS Safari (16.4+)