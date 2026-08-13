# ARI XP iOS Bootstrap

## Goal

Create the first native iPhone shell for ARI XP without changing the live production web application.

## Current phase

This branch is **Phase 1 / native-shell validation**.

- App name: `ARI XP`
- Development bundle identifier: `com.arixp.app`
- Capacitor: `8.4.2`
- Web source during Phase 1: `https://arixp.com`
- Live production branch remains: `Ari-rebirth-stable`

The committed `server.url` is intentional for the first Xcode/TestFlight smoke test because ARI XP currently depends on same-origin Vercel `/api/*` routes. It keeps the first native build behavior identical to the working web application.

**Do not submit this remote-shell configuration to App Review as the final production architecture.** Before App Store submission, remove the remote `server.url`, bundle the frontend into `www`, and route native API requests to the ARI XP backend explicitly.

## Mac requirements

You need a Mac with:

1. Xcode installed and signed in with the Apple Developer account.
2. Node.js/npm installed.
3. Git installed.

## First native project generation

From a terminal on the Mac:

```bash
git clone https://github.com/calbuddyhealth/Calbuddy.git
cd Calbuddy
git checkout agent/ari-xp-ios
npm install
npm run cap:doctor
npm run ios:add
npm run ios:open
```

`npm run ios:add` generates the native `ios/` Xcode project. Capacitor treats native projects as source artifacts, so after the first successful generation the `ios/` directory and `package-lock.json` should be committed to this branch.

## First Xcode target

In Xcode:

1. Open the generated `App` target.
2. Select the Apple Developer team under **Signing & Capabilities**.
3. Confirm the bundle identifier is `com.arixp.app` for development.
4. Select a connected iPhone.
5. Build and run.

The first milestone is simple: ARI XP opens as a full-screen installed iPhone app and the existing sign-in, Home, Ask Ari, Nutrition, Goals, Training, and Circle paths still work.

## Phase 1 smoke-test checklist

- [ ] App launches without Safari chrome.
- [ ] Sign in works.
- [ ] Existing Supabase session persists after closing/reopening the app.
- [ ] Home loads.
- [ ] Ask Ari sends and receives responses.
- [ ] Nutrition loads and can save a meal.
- [ ] Goals loads.
- [ ] Training loads.
- [ ] ARI Circle loads.
- [ ] Back/Home navigation behaves correctly.
- [ ] iPhone keyboard does not cover important inputs.
- [ ] Dynamic Island/notch and home-indicator safe areas look correct.

## Phase 2 before public App Store submission

After the native shell is proven:

1. Build a local/bundled mobile frontend into `www`.
2. Replace same-origin `/api/*` assumptions with an explicit ARI XP API base for native builds.
3. Remove `server.url` from `capacitor.config.json`.
4. Add native app lifecycle/deep-link handling where needed.
5. Add in-app account deletion.
6. Review Support ARI/payment flow for App Store compliance.
7. Add App Store icon, splash assets, privacy disclosures, screenshots, support/privacy URLs, and App Review notes.
8. Upload to TestFlight and test before public review.

## Future native features

Camera/Nutrition Facts scanning, notifications, haptics, and Apple Health can be added after the native foundation is stable. They do not need to block version 1.0.
