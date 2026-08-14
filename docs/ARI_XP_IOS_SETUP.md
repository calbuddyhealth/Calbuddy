# ARI XP iOS Bootstrap

## Goal

Validate ARI XP as a real installed iPhone app without changing the live production branch during development.

## Current phase

This branch is **Phase 1 / native-shell and physical-device validation**.

- App name: `ARI XP`
- Development bundle identifier: `com.arixp.app`
- Capacitor: `8.4.2`
- Node.js: `22+`
- Xcode: `26+`
- iOS project: generated and committed under `ios/`
- Current Phase 1 web source: `https://arixp.com`
- PR #20 is stacked on the `app-store-readiness` branch.
- Live production branch remains `Ari-rebirth-stable`.

The committed `server.url` is intentional only for the first installed-app smoke test because ARI XP currently depends on same-origin Vercel `/api/*` routes. It keeps the first native shell close to the behavior of the working website.

**Do not submit this remote-shell configuration to App Review as the final production architecture.** Before App Store submission, remove the remote `server.url`, bundle the mobile frontend into `www`, and route native API requests to the ARI XP backend explicitly.

## What is already generated and validated

GitHub Actions generated the native Xcode project on a macOS runner and committed it to this branch.

The automated native validation has already completed successfully with:

- Capacitor Doctor passing for iOS.
- Xcode simulator compilation with signing disabled.
- Bundle identifier `com.arixp.app`.
- Native app display name `ARI XP`.
- Camera, microphone, photo-library read, and photo-library add purpose strings in `Info.plist`.

The generated project lives at:

`ios/App/App.xcodeproj`

## Mac requirements

Use a Mac with:

1. Xcode 26 or newer installed.
2. Xcode signed in with the Apple ID that belongs to the ARI XP Apple Developer team.
3. Node.js 22 or newer.
4. Git.

## Open the existing native project

The iOS project already exists, so **do not run `cap add ios` again**.

```bash
git clone https://github.com/calbuddyhealth/Calbuddy.git
cd Calbuddy
git checkout agent/ari-xp-ios
npm install
npm run ios:sync
npm run ios:open
```

When web/native configuration changes later, run:

```bash
npm run ios:sync
```

before reopening or rebuilding in Xcode.

## First Xcode device build

In Xcode:

1. Open the `App` target.
2. Go to **Signing & Capabilities**.
3. Select the ARI XP Apple Developer team.
4. Confirm the bundle identifier is `com.arixp.app`.
5. Connect a physical iPhone by cable or trusted wireless connection.
6. Select that iPhone as the run destination.
7. Build and run.

The simulator compile is already green. This device run is for hardware-only behavior such as camera/photo formats, safe areas, keyboard behavior, permissions, and real session persistence.

## Native privacy purpose strings already present

The generated `ios/App/App/Info.plist` contains:

- `NSCameraUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`

ARI XP should request these permissions only when the user intentionally invokes the related feature.

## Physical iPhone smoke-test checklist

### Core app

- [ ] App launches without Safari chrome.
- [ ] Sign in works.
- [ ] Existing Supabase session persists after closing and reopening the app.
- [ ] Home loads.
- [ ] Ask ARI sends and receives responses.
- [ ] Nutrition loads and can save a meal.
- [ ] Goals loads.
- [ ] Training loads.
- [ ] ARI Circle loads.
- [ ] Back/Home navigation behaves correctly.
- [ ] iPhone keyboard does not cover important inputs.
- [ ] Dynamic Island/notch and home-indicator safe areas look correct.

### ARI Circle photo / HEIC validation

Use a non-owner test account for posting tests when practical.

- [ ] Open ARI Circle Feed and choose media.
- [ ] Capture a new photo with the iPhone camera and verify the camera permission prompt is understandable.
- [ ] Publish a normal safe camera photo and verify moderation completes before the post appears.
- [ ] Select an existing **HEIC/HEIF** photo from the iPhone Photos library.
- [ ] Confirm the HEIC/HEIF image previews correctly.
- [ ] Confirm ARI Circle safety screening completes.
- [ ] Confirm a safe HEIC/HEIF image can publish and remains visible after a reload.
- [ ] If HEIC/HEIF cannot be decoded, confirm ARI Circle fails closed and does not publish unmoderated media; record the exact user-facing error.
- [ ] Repeat a photo test for a Moment.
- [ ] Repeat a media test for a Challenge entry.

### ARI Circle video validation

- [ ] Capture a short video from the media picker.
- [ ] Verify camera and microphone permission prompts appear only when needed.
- [ ] Confirm sampled-frame moderation completes before publication.
- [ ] Confirm a safe short video publishes and plays after reload.
- [ ] Deny camera or microphone permission once and confirm the app fails gracefully rather than hanging or crashing.

### Support / payment boundary

Until the native StoreKit bridge is implemented:

- [ ] Open **Support ARI XP** inside the installed iOS shell.
- [ ] Confirm Cash App and Venmo are **not** displayed inside iOS.
- [ ] Confirm the page states that optional support is not available in this iOS version.
- [ ] Confirm ARI XP features remain available regardless of support.

## Phase 2 before public App Store submission

After the physical native shell is proven:

1. Build a local/bundled mobile frontend into `www`.
2. Replace same-origin `/api/*` assumptions with an explicit ARI XP API base for native builds.
3. Remove `server.url` from `capacitor.config.json`.
4. Add native app lifecycle/deep-link handling where needed.
5. Keep in-app account deletion accessible and verify it on device.
6. Either implement the native StoreKit tip bridge or keep support contributions unavailable in the iOS build.
7. Add final App Store icon/splash assets, screenshots, privacy disclosures, support/privacy URLs, and App Review notes.
8. Upload to TestFlight and complete a final device pass before public review.

## Future native features

The Nutrition Facts camera flow, notifications, haptics, and Apple Health can be layered onto the native foundation after the first release path is stable. They do not need to block ARI XP version 1.0 unless deliberately added to the initial submission scope.
