LAWDLI

## Setup Instructions

### Firebase Push Notifications Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Cloud Messaging

2. **Get Firebase Configuration**
   - Go to Project Settings > General
   - Add a web app if not already added
   - Copy the Firebase config object values

3. **Generate VAPID Key**
   - Go to Project Settings > Cloud Messaging
   - In "Web configuration" section, generate a new key pair
   - Copy the VAPID key

4. **Get FCM Server Key**
   - Go to Project Settings > Cloud Messaging
   - Copy the "Server key" (legacy)
   - This will be used in the server environment

5. **Environment Variables**
   Add these variables to your `.env` file:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_VAPID_KEY=your_vapid_key
   ```

6. **Server Environment (Supabase Edge Functions)**
   Add to your Supabase project environment:
   ```
   FCM_SERVER_KEY=your_fcm_server_key
   ```

### PWA Installation
- The app can be installed as a PWA on mobile devices
- Push notifications work even when the app is closed
- Supported on Android Chrome and iOS Safari (16.4+)

### Features
- Real-time push notifications for new requests and responses
- Works offline with service worker caching
- Multi-language support (Arabic/French)
- Admin and user role management
- Group-based request distribution