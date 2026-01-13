# Mission 5: Release Completion Checklist (Mac Execution)

## 🛑 External Gates (Verify BEFORE Running Commands)

### Gate 0: Xcode Environment
- [ ] Mac has **Xcode 15.2+** installed.
- [ ] License accepted: `sudo xcodebuild -license accept`
- [ ] Apple ID signed in (Xcode → Settings → Accounts) with **Paid Developer Program** access.

### Gate 1: App Store Connect Record
- [ ] Log in to [App Store Connect](https://appstoreconnect.apple.com).
- [ ] Create New App (iOS).
- [ ] **Bundle ID**: `com.mertefesensoy.MicroTowerDefenceGame` (Must match exactly).
- [ ] **SKU**: `micro-td-game` (or similar).
- [ ] **Platforms**: Select "iOS" (this covers iPhone + iPad).

### Gate 2: Match Repository
- [ ] Create a **private** GitHub repository (e.g., `microtd-match`).
- [ ] Verify access from terminal: `git ls-remote <YOUR_MATCH_REPO_URL>` (Should not error).

---

## 🚀 Execution Sequence

### Step 1: Generate Project
```bash
./bin/xcodegen-final generate --spec project.yml
```
*Verify:* Open `MicroTowerDefenceGame.xcodeproj`. Check Target > General > Deployment Info. Ensure **iPhone** and **iPad** are both checked.

### Step 2: Configure Secrets
1. Copy template: `cp .env.match.template .env.match`
2. Edit `.env.match` with:
   - `MATCH_GIT_URL` (Your private repo URL)
   - `MATCH_PASSWORD` (Strong encryption password)
   - `DEVELOPER_PORTAL_TEAM_ID` (From developer.apple.com)
3. Load env:
   ```bash
   set -a; source .env.match; set +a
   ```

### Step 3: Bootstrap Signing (One -Time)
```bash
bundle install
bundle exec fastlane bootstrap_signing
```
*Expected:* Prompts for Apple ID/2FA. Creates certs/profiles. Pushes to `microtd-match` repo.

### Step 4: Upload to TestFlight
```bash
bundle exec fastlane beta
```
*Expected:* Builds app, uploads to ASC. Success message.

### Step 5: Verify
- Check [App Store Connect > TestFlight](https://appstoreconnect.apple.com).
- Confirm build `1.0.0 (1)` is Processing or Ready for Testing.

---

## 🆘 Troubleshooting

| Error | Likely Cause | Fix |
| :--- | :--- | :--- |
| `App not found` | App Store Connect record missing | Create app in ASC with matching Bundle ID (Gate 1). |
| `Repository not found` | Git Auth / URL wrong | Check `MATCH_GIT_URL` and SSH/PAT access. |
| `Team not found` | Wrong Team ID in `.env.match` | Check `DEVELOPER_PORTAL_TEAM_ID` vs paid account. |
| `No profiles found` | Bootstrap didn't run | Run Step 3 (`bootstrap_signing`) first. |

---

## ✅ Mission Complete Definition
Mission 5 is **COMPLETE** when:
1. `bootstrap_signing` succeeds.
2. `beta` succeeds.
3. Build appears in TestFlight.
