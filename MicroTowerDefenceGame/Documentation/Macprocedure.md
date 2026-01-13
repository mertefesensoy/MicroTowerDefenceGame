## Step 2 — Apple side prerequisites (one time)

### A) Xcode setup

<pre class="overflow-visible! px-0!" data-start="1341" data-end="1429"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>sudo</span><span> xcode-select -s /Applications/Xcode.app
</span><span>sudo</span><span> xcodebuild -license accept
</span></span></code></div></div></pre>

Open Xcode → **Settings → Accounts** → sign in with your Developer Apple ID.

### B) App Store Connect app record

In App Store Connect:

* Create the app with bundle id: `com.mertefesensoy.MicroTowerDefenceGame`
* Ensure it’s **iOS** and supports **iPhone + iPad** (universal)

## Step 3 — bootstrap signing + upload

### 1) Generate the Xcode project (if needed)

<pre class="overflow-visible! px-0!" data-start="1792" data-end="1852"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>./bin/xcodegen-final generate --spec project.yml
</span></span></code></div></div></pre>

### 2) Bootstrap signing (creates certs/profiles and pushes to `microtd-match`)

<pre class="overflow-visible! px-0!" data-start="1934" data-end="2033"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>set</span><span> -a; </span><span>source</span><span> .env.match; </span><span>set</span><span> +a
bundle install
bundle </span><span>exec</span><span> fastlane bootstrap_signing
</span></span></code></div></div></pre>

You’ll likely get Apple login +  **2FA prompt** . That’s normal.

### 3) Create App Store Connect API key (for upload)

App Store Connect → Users and Access →  **Keys** :

* Create a key, download the `.p8`
* Then base64 it:

<pre class="overflow-visible! px-0!" data-start="2255" data-end="2307"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>base64</span><span> -i AuthKey_XXXXXX.p8 | </span><span>tr</span><span> -d </span><span>'\n'</span><span>
</span></span></code></div></div></pre>

Put into `.env.match`:

<pre class="overflow-visible! px-0!" data-start="2332" data-end="2401"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>ASC_KEY_ID=</span><span>"..."</span><span>
ASC_ISSUER_ID=</span><span>"..."</span><span>
ASC_KEY_P8_B64=</span><span>"..."</span><span>
</span></span></code></div></div></pre>

### 4) Upload to TestFlight

<pre class="overflow-visible! px-0!" data-start="2431" data-end="2502"><div class="contain-inline-size rounded-2xl corner-superellipse/1.1 relative bg-token-sidebar-surface-primary"><div class="sticky top-[calc(--spacing(9)+var(--header-height))] @w-xl/main:top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-bash"><span><span>set</span><span> -a; </span><span>source</span><span> .env.match; </span><span>set</span><span> +a
bundle </span><span>exec</span><span> fastlane beta</span></span></code></div></div></pre>


Nice — if CI is green  *now* , you’re at the point where the  **only remaining failures will be signing/auth/App Store Connect configuration** , not Swift compilation.

Below is the **exact Mac-side execution plan** (solo-friendly), with the two biggest “gotchas” called out.

---

## Gate checklist (do these once)

### 1) Xcode + account

```bash
sudo xcode-select -s /Applications/Xcode.app
sudo xcodebuild -license accept
xcodebuild -version
```

Open Xcode → **Settings → Accounts** → sign in with the Apple ID that has your paid Developer membership.

### 2) App Store Connect app record exists

In App Store Connect, make sure the app exists with  **bundle id** :
`com.mertefesensoy.MicroTowerDefenceGame`

### 3) Match repo access (your repo)

Your match repo is:
`https://github.com/mertefesensoy/microtd-match`

Pick **ONE** auth method:

#### Option A (recommended): SSH

```bash
ssh -T git@github.com
git ls-remote git@github.com:mertefesensoy/microtd-match.git
```

#### Option B: HTTPS + fine-grained PAT (no token in URL)

You’ll set:

* `MATCH_GIT_URL="https://github.com/mertefesensoy/microtd-match.git"`
* `MATCH_GIT_BASIC_AUTHORIZATION="BASE64(username:token)"`

Create that base64 on Mac:

```bash
printf "YOUR_GITHUB_USERNAME:YOUR_TOKEN" | base64 | tr -d '\n' | pbcopy
```

Then paste into `MATCH_GIT_BASIC_AUTHORIZATION`.

> **Important:** don’t paste tokens into chat again. Keep them only in `.env.match`.

---

## Step-by-step: ship to TestFlight

### Step 1) Generate the Xcode project

From repo root:

```bash
./bin/xcodegen-final generate --spec project.yml
```

### Step 2) Install gems

```bash
bundle install
```

### Step 3) Fill your env file

```bash
cp .env.match.template .env.match
open .env.match
```

Set these (solo = set all team IDs same):

* `MATCH_GIT_URL` → **either** SSH or HTTPS URL
* `MATCH_PASSWORD` → choose a strong password
* `FASTLANE_TEAM_ID="Q885KHD85V"`
* `DEVELOPER_PORTAL_TEAM_ID="Q885KHD85V"`
* `APP_STORE_CONNECT_TEAM_ID="Q885KHD85V"`

Also set your App Store Connect API key values for upload:

* `ASC_KEY_ID`
* `ASC_ISSUER_ID`
* `ASC_KEY_P8_B64` (base64 of the `.p8`, one line)

Base64 the `.p8` (Mac):

```bash
base64 -i /path/to/AuthKey_XXXXXX.p8 | tr -d '\n' | pbcopy
```

Load env:

```bash
set -a; source .env.match; set +a
```

### Step 4) Bootstrap signing (creates certs/profiles in match repo)

```bash
bundle exec fastlane bootstrap_signing
```

**Expected:** Apple login + 2FA prompts.

✅ After this succeeds, your match repo will no longer be empty.

### Step 5) Upload to TestFlight

```bash
bundle exec fastlane beta
```

Then confirm in App Store Connect →  **TestFlight** .

---

## The two most common failures (and the fixes)

### A) Match fails because branch is `main` not `master`

New GitHub repos default to `main`. If match complains about branch or can’t find repo state, fix by setting the branch in your `Matchfile`:

```ruby
git_url(ENV["MATCH_GIT_URL"])
git_branch("main")
```

### B) “App not found”

This means the **App Store Connect app record doesn’t exist** *or* bundle id mismatch.
Fix: create the app record in ASC with bundle id `com.mertefesensoy.MicroTowerDefenceGame`.

---

## Quick reality check (since you said you’re solo)

“CI passed” ≠ “ready for TestFlight” until  **these two commands succeed** :

* `bundle exec fastlane bootstrap_signing`
* `bundle exec fastlane beta`

If either fails, paste **only the last ~40 lines** of the fastlane output (redact emails/tokens). I’ll tell you exactly whether it’s:

* Git auth / match repo
* Team ID mismatch
* ASC app record missing
* Provisioning/profile generation issue
* Xcode build configuration issue
