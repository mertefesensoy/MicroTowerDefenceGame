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
