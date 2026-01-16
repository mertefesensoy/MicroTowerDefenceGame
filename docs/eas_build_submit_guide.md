# EAS Build & Submit Guide

## ✅ Phase C5: Cloud Build Setup

This guide will enable you to build and submit your iOS app **without a Mac** using Expo Application Services (EAS).

---

## Prerequisites

Before you begin, you need:

1. **Expo Account** (free)
   - Sign up at: https://expo.dev/signup
   
2. **Apple Developer Account** ($99/year)
   - Required for TestFlight and App Store
   - Sign up at: https://developer.apple.com/programs/

3. **App Store Connect App Created**
   - Bundle ID: `com.mertefesensoy.MicroTowerDefenceGame`
   - Create at: https://appstoreconnect.apple.com

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Already done! ✅

---

## Step 2: Login to Expo

```bash
cd expo
eas login
```

Enter your Expo credentials when prompted.

---

## Step 3: Configure Your Project

Run the configuration wizard:

```bash
eas build:configure
```

This will:
- Create `eas.json` (already done ✅)
- Link your project to your Expo account
- Generate a project ID

**When prompted**, choose:
- Platform: **iOS**
- Build profile: **production**

---

## Step 4: Update Configuration

### 4.1 Update `app.json`

The file is already configured with:
- Bundle ID: `com.mertefesensoy.MicroTowerDefenceGame`
- Version: `1.0.0`
- Build number: `1`

### 4.2 Update `eas.json`

Update the `submit.production.ios` section with your Apple IDs:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

**Where to find these**:
- `appleId`: Your Apple Developer account email
- `ascAppId`: From App Store Connect → Your App → App Information → Apple ID
- `appleTeamId`: https://developer.apple.com/account → Membership → Team ID

---

## Step 5: Build Your App (Cloud)

### Option A: Preview Build (Internal Testing)

```bash
eas build --platform ios --profile preview
```

This creates an `.ipa` file you can install via TestFlight.

### Option B: Production Build (App Store)

```bash
eas build --platform ios --profile production
```

This creates an App Store-ready build.

**What happens**:
1. EAS uploads your code to the cloud
2. Builds are compiled on Apple hardware (no Mac needed!)
3. You receive a download link when complete (~15-20 min)

---

## Step 6: Submit to TestFlight

After your build completes:

### Automatic Submission

```bash
eas submit --platform ios --latest
```

This automatically submits your latest build to TestFlight!

### Manual Submission

1. Download the `.ipa` from the EAS build page
2. Upload to App Store Connect using **Transporter** app (Windows/Mac)

---

## Step 7: TestFlight Review

1. Go to App Store Connect → TestFlight
2. Your build will appear in "Builds" (processing ~10-30 min)
3. Add internal testers
4. Share TestFlight link with testers!

---

## Common Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Create a new build
eas build --platform ios --profile production

# Submit latest build
eas submit --platform ios --latest

# Check submission status
eas submit:list
```

---

## Troubleshooting

### "Missing credentials"

EAS will prompt you to create credentials automatically. Choose:
- **Let Expo handle credentials** (recommended)

### "Build failed"

```bash
# View detailed logs
eas build:view [build-id]
```

Common fixes:
- Ensure `app.json` has valid bundle ID
- Check that all dependencies are compatible with Expo
- Verify iOS version requirements

### "Submission failed"

Ensure:
- App exists in App Store Connect with matching bundle ID
- Apple IDs in `eas.json` are correct
- Your Apple Developer account is active

---

## Next Steps After TestFlight

Once your app is in TestFlight:

1. **Internal Testing** (immediate)
   - Add testers via email
   - They can install via TestFlight app

2. **External Testing** (requires App Review)
   - Submit for Beta App Review
   - Share public TestFlight link

3. **App Store Release**
   - Create App Store listing
   - Submit for App Review
   - Publish when approved!

---

## Cost Summary

| Service | Cost | Needed For |
|---------|------|------------|
| Expo Account | **Free** | EAS builds |
| Apple Developer | **$99/year** | TestFlight & App Store |
| EAS Build (Free Tier) | **Free** | 30 builds/month |
| EAS Build (Paid) | **$29/month** | Unlimited builds |

---

## You're Ready! 🚀

Everything is configured. To build and submit:

```bash
cd expo
eas login
eas build:configure  # If not done yet
eas build --platform ios --profile production
eas submit --platform ios --latest
```

**That's it!** No Mac required! ✅
