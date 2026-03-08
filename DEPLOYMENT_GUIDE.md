# Deployment Guide - LAWDLI Application

## Quick Start Deployment

Your application is ready for deployment. Follow these steps to deploy to production.

---

## Option 1: Netlify Deployment (Recommended)

### Prerequisites
- Netlify account (free tier available)
- Git repository (optional but recommended)

### Step 1: Deploy to Netlify

```bash
# Install Netlify CLI (if not already installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy (from project root)
netlify deploy --prod
```

### Step 2: Configure Environment Variables

In Netlify Dashboard:
1. Go to Site Settings → Environment Variables
2. Add these variables:
   ```
   VITE_SUPABASE_URL=https://usihugsxrcdydjwdbpok.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaWh1Z3N4cmNkeWRqd2RicG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODE2ODYsImV4cCI6MjA4ODU1NzY4Nn0.phbSYHDpDuX9mR0pk168mAL5wI3UTqVR5A1TBexfcm0
   ```

### Step 3: Verify Build Settings

Build command: `npm run build`
Publish directory: `dist`

The `netlify.toml` file is already configured with proper redirects.

---

## Option 2: Vercel Deployment

### Step 1: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Step 2: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:
```
VITE_SUPABASE_URL=https://usihugsxrcdydjwdbpok.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaWh1Z3N4cmNkeWRqd2RicG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODE2ODYsImV4cCI6MjA4ODU1NzY4Nn0.phbSYHDpDuX9mR0pk168mAL5wI3UTqVR5A1TBexfcm0
```

---

## Option 3: Firebase Hosting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### Step 2: Configure Firebase

Select:
- Existing project or create new
- Public directory: `dist`
- Single-page app: Yes
- GitHub deployment: Optional

### Step 3: Deploy

```bash
npm run build
firebase deploy --only hosting
```

---

## Converting to Mobile Apps

### Android (Google Play Store)

#### Option A: PWA Builder (Easiest)
1. Visit https://www.pwabuilder.com/
2. Enter your deployed URL
3. Download Android package
4. Sign and submit to Play Store

#### Option B: Capacitor (More Control)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize
npx cap init

# Build and add Android
npm run build
npx cap add android

# Open in Android Studio
npx cap open android
```

### iOS (Apple App Store)

```bash
# Install Capacitor iOS
npm install @capacitor/ios

# Add iOS platform
npx cap add ios

# Open in Xcode
npx cap open ios
```

---

## Post-Deployment Checklist

### Critical Verifications

1. **Test Authentication**
   - [ ] Login with phone number and PIN works
   - [ ] User sessions persist across page reloads
   - [ ] Logout functionality works

2. **Test Admin Features**
   - [ ] Create requests
   - [ ] Manage groups
   - [ ] View responses
   - [ ] Delete old data

3. **Test User Features**
   - [ ] View requests
   - [ ] Submit responses
   - [ ] Receive notifications

4. **Mobile Testing**
   - [ ] Install as PWA on mobile device
   - [ ] Touch interactions work smoothly
   - [ ] Notifications permission works
   - [ ] App works in portrait mode

5. **Database Security**
   - [ ] RLS policies are active
   - [ ] Users can't access unauthorized data
   - [ ] Admin operations work correctly

---

## Environment-Specific Configuration

### Production Environment

Update `index.html` OneSignal domain whitelist for production:
```javascript
if (hostname === 'localhost' || hostname === 'lawdli.com' || hostname === 'your-domain.com') {
```

### Staging Environment

Create a separate `.env.staging` file:
```
VITE_SUPABASE_URL=your_staging_supabase_url
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
```

---

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Restart dev server after changing .env
- Rebuild for production changes

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check RLS policies aren't blocking legitimate access
- Review browser console for specific errors

### Push Notifications Not Working
- Verify OneSignal configuration in index.html
- Check browser notification permissions
- Ensure service worker is registered

---

## Domain Configuration

### Custom Domain Setup

1. **Add Domain to Hosting Provider**
   - Netlify: Site Settings → Domain Management
   - Vercel: Project Settings → Domains
   - Firebase: Hosting → Add Custom Domain

2. **Update DNS Records**
   - Add A record or CNAME as instructed
   - Wait for DNS propagation (up to 48 hours)

3. **Enable HTTPS**
   - Hosting providers handle SSL automatically
   - Verify HTTPS is enforced

4. **Update OneSignal Configuration**
   - Add production domain to allowed list
   - Update any hardcoded URLs in code

---

## Monitoring & Maintenance

### Error Tracking

Consider adding Sentry:
```bash
npm install @sentry/react @sentry/vite-plugin
```

### Analytics

Google Analytics setup:
```bash
npm install react-ga4
```

### Database Monitoring

- Set up Supabase Dashboard alerts
- Monitor database size and performance
- Review logs regularly

---

## Backup & Recovery

### Database Backups

Supabase provides automatic backups, but for critical data:
1. Go to Supabase Dashboard → Database → Backups
2. Set up automated backup schedule
3. Test restoration process

### Code Backups

- Use Git version control
- Tag releases: `git tag v1.0.0`
- Keep dist folder backups before updates

---

## Support

### Documentation
- Production Readiness Report: See PRODUCTION_READY.md
- API Documentation: Supabase Auto-generated Docs

### Getting Help
- Supabase Support: https://supabase.com/support
- OneSignal Support: https://onesignal.com/support
- Hosting Provider Support: Check respective platforms

---

## Next Steps

1. Deploy to staging environment first
2. Test all functionality thoroughly
3. Deploy to production
4. Monitor for 24 hours
5. Gather user feedback
6. Plan next iteration

**Good luck with your deployment!** 🚀
