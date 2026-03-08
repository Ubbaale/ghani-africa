# Ghani Africa - Native App Build & Publish Guide

## Overview
This mobile project wraps your Ghani Africa web marketplace into native iOS and Android apps using Expo and EAS Build. The apps load your deployed web app in a native shell with features like push notifications, native WhatsApp/phone/email handling, offline detection, and proper app store presence.

---

## Prerequisites

Before building, you need:

1. **A computer** (Mac, Windows, or Linux) — the build happens in the cloud via EAS, but you run commands locally
2. **Node.js 18+** installed — download from https://nodejs.org
3. **An Expo account** — sign up free at https://expo.dev
4. **For iOS App Store**: An Apple Developer account ($99/year) — https://developer.apple.com
5. **For Google Play Store**: A Google Play Developer account ($25 one-time) — https://play.google.com/console

---

## Step 1: Set Up on Your Computer

Download or copy the entire `mobile/` folder to your computer, then open a terminal in that folder:

```bash
# Install dependencies
npm install

# Install Expo CLI and EAS CLI globally
npm install -g expo-cli eas-cli

# Log in to your Expo account
eas login
```

---

## Step 2: Initialize EAS Project

```bash
# This links your project to Expo's build servers
eas init
```

This will create a project on Expo's servers and give you a **Project ID**. Open `app.json` and replace `YOUR_EAS_PROJECT_ID` with the ID it gives you.

---

## Step 3: Configure Your App URL

In `app.json`, update the `appUrl` under `extra` to your actual deployed URL:

```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  },
  "appUrl": "https://your-app-domain.replit.app"
}
```

Also update `APP_URL` in `eas.json` for all build profiles.

---

## Step 4: App Icons & Splash Screen

Replace the placeholder images in the `assets/` folder with your final designs:

- **icon.png** — 1024x1024px, your app icon (no transparency for iOS)
- **adaptive-icon.png** — 1024x1024px, Android adaptive icon foreground
- **splash-icon.png** — 512x512px or larger, shown during app loading
- **favicon.png** — 48x48px, for web builds

**Tip**: Use https://icon.kitchen or https://appicon.co to generate properly sized icons.

---

## Step 5: Build for Testing (Preview)

```bash
# Build for Android (creates an APK you can install on any Android phone)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile preview
```

The build runs in the cloud — it takes about 10-15 minutes. When done, you'll get a download link for the APK (Android) or IPA (iOS) file.

**Test the Android APK**: Download it on your Android phone and install it.
**Test the iOS build**: You'll need to set up Ad Hoc provisioning or use TestFlight.

---

## Step 6: Build for Production

```bash
# Build for both platforms
eas build --platform all --profile production

# Or build separately
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Step 7: Submit to App Stores

### Google Play Store

1. Go to https://play.google.com/console
2. Create a new app called "Ghani Africa"
3. Complete all the required store listing details (description, screenshots, etc.)
4. Create a **Google Service Account** for automated uploads:
   - Go to Google Cloud Console → IAM → Service Accounts
   - Create a service account with "Service Account User" role
   - In Play Console → Setup → API Access, link the service account
   - Download the JSON key and save it as `google-service-account.json` in the `mobile/` folder
5. Update `eas.json` with the path to your service account key
6. Submit:

```bash
eas submit --platform android --profile production
```

### Apple App Store

1. Go to https://appstoreconnect.apple.com
2. Create a new app with bundle ID `com.ghaniafrica.marketplace`
3. Complete the app information, screenshots, and description
4. Update `eas.json` with your Apple ID, Team ID, and App Store Connect App ID
5. Submit:

```bash
eas submit --platform ios --profile production
```

---

## Step 8: App Store Listing Content

Use this content for your store listings:

### App Name
Ghani Africa - African Marketplace

### Short Description (Play Store - 80 chars)
Buy & sell across Africa. Secure payments, 50+ currencies, cross-border trade.

### Full Description
Ghani Africa is Africa's leading digital marketplace connecting businesses, traders, manufacturers, and consumers across all 54 African countries.

Features:
- Buy and sell products across Africa with secure escrow payments
- Support for 50+ African currencies with automatic conversion
- WhatsApp integration for direct seller communication
- Request bulk quotes and negotiate wholesale pricing
- Group buying to unlock better prices together
- AfCFTA-compliant cross-border trade with duty calculators
- Mobile money payment support (M-Pesa, MTN, Airtel, Orange)
- Multi-language support: English, French, Swahili, Arabic, and 7 more
- Photo reviews to see products before you buy
- Supplier factory profiles for verified manufacturers
- Real-time order tracking and logistics
- Express delivery and 25+ pickup points across major cities

Whether you're a buyer looking for quality African products or a seller wanting to reach millions of customers across the continent, Ghani Africa makes trade simple, secure, and accessible.

### Keywords
african marketplace, buy sell africa, e-commerce africa, trade africa, wholesale africa, african products, cross-border trade, mobile money, escrow payment, group buying

### Category
Shopping (primary), Business (secondary)

---

## Updating Your App

When you update the web app (which is deployed separately), the native app automatically reflects those changes since it loads the web URL. You only need to rebuild and resubmit the native app when you:

- Change native features (push notifications, new native modules)
- Update the app icon or splash screen
- Need to update the version number for store compliance
- Add new native permissions

To update the version, just run:
```bash
eas build --platform all --profile production --auto-submit
```

EAS auto-increments the build number for you.

---

## Troubleshooting

**Build fails?**
- Run `npx expo-doctor` to check for issues
- Make sure all dependencies are compatible: `npx expo install --check`

**App shows blank screen?**
- Check that your deployed web URL is accessible
- Verify the URL in `app.json` → `extra.appUrl` is correct

**Push notifications not working?**
- Make sure you set the correct `projectId` in `app.json`
- For iOS, push notifications only work on physical devices

**iOS build needs certificates?**
- EAS handles certificate management automatically
- Just make sure you're logged into your Apple Developer account

---

## Cost Summary

| Service | Cost |
|---------|------|
| Expo (EAS Build) | Free tier: 15 builds/month. $99/month for more |
| Apple Developer | $99/year |
| Google Play Developer | $25 one-time |
| Total to get started | ~$124 |
