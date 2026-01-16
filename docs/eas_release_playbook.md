# EAS Release Playbook (iPhone + iPad)

## Preconditions
- Expo account
- Apple Developer membership
- App Store Connect app exists:
  - **Bundle ID**: `com.mertefesensoy.MicroTowerDefenceGame`

## Setup
```bash
cd expo
npm i
npm i -g eas-cli
eas login
eas build:configure
```

## Build (cloud)
```bash
eas build --platform ios --profile preview
```

## Submit
```bash
eas submit --platform ios --latest
```
