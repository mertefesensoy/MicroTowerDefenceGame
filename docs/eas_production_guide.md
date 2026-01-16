# Complete EAS Build & Deploy Guide - iPhone + iPad

## ✅ Configuration Status

All configurations are now production-ready:

- ✅ **app.json**: iPad support enabled (`supportsTablet: true`)
- ✅ **eas.json**: Auto-incrementing build numbers
- ✅ **CI workflows**: Path-filtered (Expo + Swift separate)
- ✅ **Cross-platform**: iOS + Android ready

---

## 📋 Pre-Flight Checklist

Before you run your first build:

### 1. EAS Project Setup (One Time)

```bash
cd expo

# Install EAS CLI globally (if not already)
npm install -g eas-cli

# Login to your Expo account
eas login

# Initialize EAS project
eas init

# This will:
# - Create a project on Expo servers
# - Update app.json with projectId
# - Configure your local environment
```

### 2. Update Configuration Files

After `eas init`, update these placeholders:

#### `expo/app.json`
```json
{
  "extra": {
    "eas": {
      "projectId": "abc123..."  // ← Will be filled by eas init
    }
  }
}
```

#### `expo/eas.json`
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual-email@example.com",  // ← Your Apple ID
        "ascAppId": "1234567890",                     // ← From App Store Connect
        "appleTeamId": "ABCD123456"                   // ← From developer.apple.com
      }
    }
  }
}
```

**Where to find these values:**
- `appleId`: Your Apple Developer account email
- `ascAppId`: App Store Connect → Your App → App Information → Apple ID (numeric)
- `appleTeamId`: https://developer.apple.com/account → Membership → Team ID

---

## 🚀 Build Process

### Build Profile Comparison

| Profile | Purpose | Distribution | Signing |
|---------|---------|--------------|---------|
| **development** | Local dev with Expo Go | Internal | Dev |
| **preview** | TestFlight beta testing | Internal | AdHoc |
| **production** | App Store submission | Store | App Store |

### Option A: TestFlight Preview Build (Recommended First)

```bash
cd expo

# Build for TestFlight
eas build --platform ios --profile preview

# This will:
# ✅ Upload your code to EAS
# ✅ Build on macOS in the cloud
# ✅ Generate .ipa file
# ✅ Auto-increment build number
# ⏱️ Takes ~15-20 minutes
```

**During first build**, EAS will ask:
```
? Generate a new Apple Distribution Certificate?
  › Yes (recommended for solo devs)

? Generate a new Apple Provisioning Profile?
  › Yes
```

Choose **"Yes"** for both - EAS will handle signing for you!

### Option B: Production Build (For App Store)

```bash
cd expo

# Build for App Store
eas build --platform ios --profile production
```

This is identical to preview but uses App Store distribution.

---

## 📱 Submit to TestFlight

After your build completes successfully:

### Automatic Submission (Easiest)

```bash
cd expo

# Submit latest build to TestFlight
eas submit --platform ios --latest
```

**First time setup:**
```
? Use App Store Connect API Key for authentication?
  › Yes (recommended)

# Then either:
# 1) Paste your API key JSON
# 2) Or set up via EAS secrets (better for CI)
```

**Creating App Store Connect API Key:**
1. Go to https://appstoreconnect.apple.com/access/api
2. Click "+" to generate a new key
3. Name it "EAS Submit"
4. Select "Admin" or "App Manager" role
5. Download the `.p8` file
6. Copy the Key ID and Issuer ID

### Manual Submission (Alternative)

1. Download `.ipa` from EAS dashboard
2. Use **Transporter** app (available on Windows/Mac)
3. Drag `.ipa` into Transporter
4. Click "Deliver"

---

## 🎯 TestFlight Distribution

### Internal Testing (Immediate)

1. Go to App Store Connect → TestFlight
2. Your build appears under "Builds" (processing 10-30 min)
3. Click "Manage" → "Internal Testing"
4. Add testers by email (up to 100)
5. They receive invite via email
6. Install TestFlight app on device
7. Accept invite and download!

### External Testing (Requires Review)

1. Create "External Group" in TestFlight
2. Add build to group
3. Submit for "Beta App Review" (1-2 days)
4. Once approved, share public link with up to 10,000 testers

---

## 📦 Android Build (Bonus!)

Your app is ready for Android too:

```bash
cd expo

# Build Android APK (for testing)
eas build --platform android --profile preview

# Build Android App Bundle (for Play Store)
eas build --platform android --profile production
```

---

## 🔄 Updating Your App

### Version Strategy

**For Each Update:**

1. Update version in `app.json`:
   ```json
   {
     "version": "1.0.1"  // ← Increment this
   }
   ```

2. Build numbers auto-increment (handled by EAS)

3. Build and submit:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```

### Semantic Versioning
- `1.0.0` → `1.0.1`: Bug fixes
- `1.0.0` → `1.1.0`: New features
- `1.0.0` → `2.0.0`: Breaking changes

---

## 🛠️ Troubleshooting

### Build Fails

```bash
# View detailed build logs
eas build:list
eas build:view [build-id]
```

**Common issues:**
- Missing dependencies → Check `package.json`
- TypeScript errors → Run `npx tsc --noEmit` locally first
- Asset errors → Ensure all images exist

### Submission Fails

**"Invalid Bundle"**
- Check bundle ID matches App Store Connect
- Ensure version/build number not already used

**"Authentication Failed"**
- Verify Apple ID credentials
- Regenerate App Store Connect API key

**"Missing Compliance"**
- Answer export compliance questions in App Store Connect

### CI/CD Integration

Store secrets in GitHub:
```bash
# Repository Settings → Secrets and variables → Actions

EXPO_TOKEN=your-expo-token
APPLE_ID=your-apple-id
ASC_APP_ID=your-asc-app-id
APPLE_TEAM_ID=your-team-id
```

Then in GitHub Actions:
```yaml
env:
  EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 📊 Build Monitoring

### Check Build Status

```bash
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# Cancel running build
eas build:cancel [build-id]
```

### EAS Dashboard

Visit https://expo.dev/accounts/[your-account]/projects/[your-project]

See:
- Build history
- Logs
- Download artifacts
- Submission status

---

## 💰 Cost Summary

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| Expo Account | ✅ Free | - | Required |
| EAS Build | 30 builds/month | $29/month unlimited | iOS + Android |
| Apple Developer | - | $99/year | Required for App Store |
| Google Play (Android) | - | $25 one-time | If publishing to Android |

---

## ✅ Production Checklist

Before App Store submission:

- [ ] Test on real iPhone
- [ ] Test on real iPad
- [ ] Test on multiple iOS versions (15+)
- [ ] Verify all features work
- [ ] Check for crashes
- [ ] Test in-app purchases (if any)
- [ ] Prepare app screenshots
- [ ] Write app description
- [ ] Set age rating
- [ ] Add privacy policy URL
- [ ] Answer export compliance

---

## 🎊 Success Path

**Complete Flow:**

```
1. Configure EAS → eas init
2. Build Preview → eas build --platform ios --profile preview
3. Submit TestFlight → eas submit --platform ios --latest
4. Internal Testing → Add testers in App Store Connect
5. External Testing → Submit for Beta Review
6. Production Build → eas build --platform ios --profile production
7. App Store Submit → Create version in App Store Connect
8. App Review → Wait 1-3 days
9. Release! → Click "Release" when approved
```

**Timeline:**
- First build: 20-30 min
- TestFlight processing: 10-30 min
- Beta review: 1-2 days (external only)
- App Store review: 1-3 days

---

## 🆘 Getting Help

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Submit Docs**: https://docs.expo.dev/submit/introduction/
- **Expo Discord**: https://chat.expo.dev/
- **Forums**: https://forums.expo.dev/

---

## 🚀 You're Ready!

Everything is configured. To build and ship:

```bash
cd expo
eas login            # Login to Expo
eas init             # Initialize project (first time)
eas build --platform ios --profile production
eas submit --platform ios --latest
```

**That's it!** No Mac required, no Xcode needed, just cloud builds! 🎉

---

**Next Step:** Run `eas init` to get your projectId, then start your first build!
