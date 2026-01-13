# MicroTowerDefenceGame – iOS Release Playbook (Xcode 15.2)

## Goal
Ship one universal iOS build (iPhone + iPad) to TestFlight, then App Store.

---

## 0. Preconditions
- Xcode 15.2 installed
- Xcode license accepted:
  `sudo xcodebuild -license accept`
- Correct Xcode selected:
  `sudo xcode-select -s /Applications/Xcode.app`
- You are signed into Xcode:
  **Xcode → Settings → Accounts → Apple ID** (with dev program access)

---

## 1. Generate Project (XcodeGen)
From repo root:
```bash
./bin/xcodegen-final generate --spec project.yml
```

Verify:
```bash
xcodebuild -list -project MicroTowerDefenceGame.xcodeproj
```

---

## 2. Confirm Universal iPhone + iPad
In `project.yml`, ensure:
`TARGETED_DEVICE_FAMILY: "1,2"`

Build once and run on:
- iPhone simulator
- iPad simulator

---

## 3. App Store Connect Setup
- Create the app record with bundle id:
  `com.mertefesensoy.MicroTowerDefenceGame`
- Ensure "iPhone and iPad" is selected.

---

## 4. Match Repo Setup (one time)
Create a private git repo: `microtd-match`

## 4. Match Repo Setup (one time)
Create a private git repo: `microtd-match`

Test access (HTTPS Token):
```bash
# 1. Be sure you have your MATCH_GIT_BASIC_AUTHORIZATION ready
# 2. Test headers
git -c http.extraHeader="AUTHORIZATION: basic $MATCH_GIT_BASIC_AUTHORIZATION" ls-remote https://github.com/mertefesensoy/microtd-match.git
```

---

## 5. Signing Bootstrap (one time)
Create `.env.match` from template, then load it:

```bash
# Generate Auth Header first:
# printf "mertefesensoy:YOUR_GITHUB_TOKEN" | base64 | tr -d '\n' | pbcopy

cp .env.match.template .env.match
# Edit .env.match with real values

set -a
source .env.match
set +a
```

Run:
```bash
bundle install
bundle exec fastlane bootstrap_signing
```

Expected:
- Apple login + 2FA prompts
- cert/profile created
- committed to match repo

---

## 6. Upload to TestFlight
```bash
set -a
source .env.match
set +a

bundle exec fastlane beta
```

Verify in App Store Connect → TestFlight.

---

## 7. App Store Submission (after TestFlight)
- Fill metadata (description, keywords, support URL, privacy)
- Upload screenshots for iPhone + iPad (ASC UI will show exact required sets)
- Select the build
- Submit for review

---

## Troubleshooting
### "No profiles for 'com....' were found"
- You didn't run match bootstrap OR wrong team_id.
- Re-run bootstrap_signing with correct DEVELOPER_PORTAL_TEAM_ID.

### "App not found"
- The ASC app record doesn’t exist OR bundle id mismatch.

### "Repository not found"
- MATCH_GIT_URL auth issue (SSH key or PAT scope).
