# We-ne Mobile

[日本語版 README はこちら](./README.ja.md)

Recipient-facing UI built with React Native (Expo + TypeScript)

## Setup

```bash
# Install dependencies
npm install

# Start the app
npm start
```

## Directory Structure

```
wene-mobile/
├── app/
│   ├── _layout.tsx          # Root layout (Stack, hidden header)
│   ├── index.tsx            # Recipient home screen
│   ├── phantom/
│   │   └── [action].tsx     # Phantom wallet redirect handler
│   └── r/
│       └── [campaignId].tsx # Claim screen
├── assets/
│   ├── icon.png             # App icon (1024x1024)
│   ├── adaptive-icon.png    # Android adaptive icon
│   ├── splash.png           # Splash screen image
│   └── icon-source.png      # Source image for icon generation
├── scripts/
│   ├── generate-icons.js    # Icon generation script
│   └── deploy-via-adb.sh    # ADB deployment script
├── app.config.ts            # Expo configuration (deeplinks included)
├── package.json
└── tsconfig.json
```

## Deep Links

### Custom Scheme
- Scheme: `wene`
- Format: `wene://r/<campaignId>?code=...`
- Example: `wene://r/demo-campaign?code=demo-invite`

### Universal Links / App Links (HTTPS)
- URL: `https://wene.app/r/<campaignId>?code=...`
- Example: `https://wene.app/r/demo-campaign?code=demo-invite`
- iOS: Universal Links (associatedDomains configured)
- Android: App Links (intentFilters configured)

## Universal Links / App Links Configuration

### iOS: Apple App Site Association (AASA)

**Why it's needed:**
To enable Universal Links on iOS, you need to place an AASA file at the root of your domain (wene.app). iOS validates this file to confirm the app can handle links from that domain.

**Location:**
- `https://wene.app/.well-known/apple-app-site-association`
- Must be accessible via HTTPS
- Must be served with Content-Type: `application/json`

**Required content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.jp.wene.app",
        "paths": ["/r/*"]
      }
    ]
  }
}
```
- `TEAM_ID`: Your Apple Developer account Team ID (10 alphanumeric characters)
- `paths`: Path patterns the app handles (`/r/*` handles all paths starting with /r/)

### Android: Digital Asset Links (assetlinks.json)

**Why it's needed:**
To enable App Links on Android, you need to place an assetlinks.json file at the root of your domain (wene.app). Android validates this file to confirm the app can handle links from that domain.

**Location:**
- `https://wene.app/.well-known/assetlinks.json`
- Must be accessible via HTTPS
- Must be served with Content-Type: `application/json`

**Required content:**
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "jp.wene.app",
    "sha256_cert_fingerprints": [
      "SHA256_FINGERPRINT"
    ]
  }
}]
```
- `package_name`: `jp.wene.app` as configured in app.config.ts
- `sha256_cert_fingerprints`: SHA256 fingerprint of your app's signing certificate (both release and debug can be configured)

**Getting the fingerprint:**
```bash
# For release keystore
keytool -list -v -keystore your-release-key.keystore -alias your-key-alias

# For debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Notes:**
- Both AASA and assetlinks.json must be served via HTTPS with correct Content-Type headers
- Files must be directly accessible without redirects
- iOS caches AASA files, so changes may take time to reflect
- Android validates App Links at runtime, requiring internet connection on first launch

## Screen Specifications

### Home Screen (app/index.tsx)
- White background
- Title: "We-ne"
- Description: "Receive support credits"
- Demo link button

### Claim Screen (app/r/[campaignId].tsx)
- Gets `campaignId` and `code` from URL parameters
- Displays information in card format
- "Claim" button

## Design Rules

- Black, white, and gray only
- No shadows
- Slightly large border radius (16px)
- One action per screen

## App Icon

### Custom Icon Setup

1. Save your icon image as `assets/icon-source.png` (1024x1024 recommended)
2. Run the icon generation script:
```bash
npm run generate-icons
```

This generates:
- `icon.png` - Main app icon
- `adaptive-icon.png` - Android adaptive icon
- `favicon.png` - Web favicon
- `splash.png` - Splash screen image

### Deploy to Device via ADB

```bash
npm run deploy:adb
```

This script:
1. Generates icons from `icon-source.png`
2. Runs prebuild (reflects icons in Android resources)
3. Builds APK
4. Installs to connected device via ADB

## Building APK

### Prerequisites

- **Java 17**: Gradle 8 doesn't support Java 25, so use Java 17.
  - macOS (Homebrew): `brew install openjdk@17`
- **Android SDK**: Requires `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`.
  - macOS (Homebrew): `brew install --cask android-commandlinetools`, then install the above via `sdkmanager`.
- Set `ANDROID_HOME` and `JAVA_HOME` if not already configured.

### Steps

```bash
# 1. First time only: Generate native Android project
npm run build:prebuild

# 2. Build APK (uses Java 17 and Android SDK)
npm run build:apk
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

If you installed Java 17 and Android command-line tools via Homebrew, `npm run build:apk` should work directly. For different paths, set `JAVA_HOME` and `ANDROID_HOME` before building.

### If Terminal Closes / Retrying Build

Open a **new terminal** and run:

```bash
cd wene-mobile
./scripts/build-apk.sh
# or
npm run build:apk
```

### APK Installation Notes

**If updates don't reflect:**

1. **Uninstall existing app**
   - Settings > Apps > wene-mobile (or jp.wene.app) > Uninstall
   - Or `adb uninstall jp.wene.app` (when connected via USB)

2. **Install new APK**
   - Open APK in file manager
   - Or `adb install android/app/build/outputs/apk/release/app-release.apk`

**Reasons:**
- Android won't recognize as update if `versionCode` is the same
- Can't overwrite if signed differently (e.g., installed via Expo Go)
- `app.config.ts` auto-updates `versionCode`, but uninstall may be needed for older versions

## iOS Local Build (Simulator)

### Prerequisites

- **Xcode app** must be installed (from App Store, ~12GB)
- Command Line Tools alone is insufficient
- After installation: Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`

**Verification:**
```bash
xcode-select -p
# Correct: /Applications/Xcode.app/Contents/Developer
# Wrong: /Library/Developer/CommandLineTools (Xcode app needed)
```

### Local Build Steps

```bash
cd wene-mobile
./scripts/build-ios.sh
# or
npm run build:ios
```

- First run executes `expo prebuild --platform ios --clean` equivalent (if `ios/` doesn't exist).
- Then `expo run:ios` builds and launches on Simulator.

**If terminal closes / retrying:** Open a new terminal and re-run the commands above.

### Without Xcode Installed

**Use EAS Build (cloud build):**
```bash
# 1. Install EAS CLI and login
npm install -g eas-cli
eas login

# 2. Initialize EAS project (first time only)
eas init

# 3. Build for iOS Simulator
eas build --platform ios --profile development
```

See the "iOS Simulator Support" section in `DEBUG_REPORT.md` for details.

## Troubleshooting

### Updates Not Reflecting on Android via Expo Go

Try these steps in order:

#### Method 1: Clear Cache (Recommended)
```bash
npm run start:clear
# or
npm run android:clear
```

#### Method 2: Full Reset (if Method 1 doesn't work)
```bash
npm run start:reset
# or
npm run android:reset
```

#### Method 3: Delete All Caches (if Method 2 doesn't work)
```bash
npm run clean
```

Then on your Android device:
1. **Completely close Expo Go**
   - Swipe Expo Go away from recent apps
   - Or Settings > Apps > Expo Go > Force Stop

2. **Restart Expo Go**
   - Reopen the app and scan QR code to reconnect

3. **Manual Reload**
   - In Expo Go, shake device or select "Reload" from menu

#### Method 4: Check Network Connection
- Ensure Android device and development machine are on the same Wi-Fi network
- Check if firewall or VPN is blocking connection to dev server
- For USB debugging: Run `adb reverse tcp:8081 tcp:8081`

#### Method 5: Check Dev Server Logs
- Check terminal for error messages from dev server
- Check Expo Go app logs on Android device (Settings > Debug > Show Logs)

#### Additional Notes
- `app.config.ts` auto-updates version during development, no manual changes needed
- If still not updating, try reinstalling Expo Go itself
