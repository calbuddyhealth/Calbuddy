# ARI XP — App Store Submission Answers

Prepared for the first iOS submission. Keep this document synchronized with the shipping build and App Store Connect.

## App Privacy

### Does this app or its third-party partners collect data?

**Yes.**

### Data types to select

Use the following conservative disclosures for the current ARI XP feature set.

| App Store Connect data type | Collected | Linked to user | Tracking | Purpose |
| --- | --- | --- | --- | --- |
| Contact Info → Name | Yes | Yes | No | App Functionality, Product Personalization |
| Contact Info → Email Address | Yes | Yes | No | App Functionality |
| Health & Fitness → Health | Yes | Yes | No | App Functionality, Product Personalization |
| Health & Fitness → Fitness | Yes | Yes | No | App Functionality, Product Personalization |
| User Content → Emails or Text Messages | Yes | Yes | No | App Functionality |
| User Content → Photos or Videos | Yes | Yes | No | App Functionality |
| User Content → Audio Data | Yes, when a shared video includes audio | Yes | No | App Functionality |
| User Content → Customer Support | Yes | Yes when submitted by a signed-in user; otherwise supplied contact email may identify the user | No | App Functionality |
| User Content → Other User Content | Yes | Yes | No | App Functionality, Product Personalization |
| Identifiers → User ID | Yes | Yes | No | App Functionality |
| Usage Data → Product Interaction | Yes | Yes | No | App Functionality |
| Diagnostics → Other Diagnostic Data | Yes | Yes where security/auth logs associate it with an account | No | App Functionality |
| Other Data → Other Data Types | Yes — date of birth/age-gate information | Yes | No | App Functionality |

### Do not select unless the shipping build changes

Do not declare these solely because Apple or an external payment provider processes them outside ARI XP: Payment Info. Do not select Advertising Data, Device ID for advertising, Precise Location, Coarse Location, Contacts, Browsing History, or tracking unless a future release actually collects or uses them.

### Tracking

**No.** ARI XP does not use collected data to track users across apps or websites for targeted advertising or advertising measurement and does not sell data to data brokers.

### Privacy Policy URL

Use the ARI XP production URL:

`https://arixp.com/privacy.html`

### Privacy Choices URL

Use:

`https://arixp.com/privacy-memory.html`

This page provides AI-processing and ARI memory controls for signed-in users. Account deletion is available in-app from My Account.

## Account creation and deletion

Reviewer path:

1. Open ARI XP.
2. Select **Create Account**.
3. Enter date of birth. Accounts under age 13 are not eligible.
4. Complete display name, email, password, and legal consent.
5. Confirm the email address.
6. To delete the account after sign-in: **My Account → Account Control → Delete account**.
7. Type `DELETE` and choose **Schedule deletion**.
8. ARI XP schedules permanent deletion after a seven-day recovery period. Signing in during that period allows the user to choose **Keep my account** and cancel deletion.

## User-generated content / ARI Circle

ARI Circle includes the controls expected for user-generated content:

- Content safety screening before publication where required.
- A user-reporting path.
- A user-blocking control from another user's profile.
- Published contact information through Help & Safety and the privacy/legal pages.
- Owner moderation workflow for submitted safety reports.

Reviewer paths:

- **Report a profile:** open another ARI Circle profile → `•••` → **Report**.
- **Block a profile:** open another ARI Circle profile → `•••` → **Block**.
- **General report/support:** **My Account → Help & Safety**.

## AI processing disclosure

ARI XP uses OpenAI for ARI responses and ARI Circle safety screening. ARI XP asks for explicit AI-processing permission before sending personal data for those features.

Reviewer behavior:

- If the user chooses **Allow AI processing**, Ask ARI and screened ARI Circle publication can operate.
- If the user chooses **Not now**, Ask ARI remains unavailable and Circle content that requires screening cannot be published.
- The choice can be changed later from **My Account → Privacy & Ari memory**.

## Camera, microphone, and photo library

The iOS build includes purpose strings for:

- Camera: user-chosen photo/video capture.
- Microphone: audio included when the user chooses to record video.
- Photo Library: user-chosen photo/video selection.
- Photo Library Add: saving media only when a user chooses a feature that saves media.

Do not request a permission before the user reaches a feature that actually needs it.

## Export compliance

The current iOS build declares:

`ITSAppUsesNonExemptEncryption = NO`

The shipping native shell uses standard platform/network encryption and does not currently include a custom cryptography library. This declaration must be re-reviewed if a future release adds proprietary encryption, a third-party cryptography implementation, VPN/security functionality, or another SDK that changes the export-compliance determination.

## Optional support / tips

ARI XP is free to use. Optional support must never unlock features, AI usage, credits, tokens, increased limits, or other digital benefits.

For the iOS build:

- Cash App and Venmo must not be shown inside the native iOS app.
- If the native StoreKit bridge is implemented and App Store tip products exist, use StoreKit consumable tip products.
- If StoreKit support is not enabled for the submitted build, the native app should show that optional support is unavailable rather than exposing external payment links.

For the web version only, external optional-support providers may be shown separately from the iOS experience.

## App Review Notes — suggested text

Use or adapt the following in App Store Connect Review Notes:

> ARI XP is a free AI-assisted health, fitness, nutrition, and social experience. Account creation begins with an age gate and email verification. ARI Circle includes user-generated posts/messages and provides content filtering, reporting, blocking, age-space controls, and owner moderation. To test reporting or blocking, open another user's ARI Circle profile and tap the three-dot profile menu. Account deletion is available at My Account → Account Control → Delete account and schedules permanent deletion after a seven-day recovery period. ARI XP uses OpenAI for ARI responses and Circle safety screening only after the user grants explicit AI-processing permission; this permission can be changed from My Account → Privacy & Ari memory. Optional support provides no digital benefits. The native iOS build does not expose Cash App or Venmo; if StoreKit tipping is not configured for this build, optional support is simply unavailable in iOS.

## Reviewer account

Before submission, create a clean non-owner reviewer account with realistic but non-sensitive test data. Put its email and password in App Store Connect's Sign-In Required fields. Do not give Apple the owner/admin account.

The reviewer account should be able to:

- Sign in without setup blockers.
- Open Ask ARI and see the AI consent flow if permission has not yet been granted.
- Open ARI Circle.
- View at least one other test profile so Report and Block can be exercised.
- Open My Account and reach Delete account.
- Open Privacy & Ari memory and toggle AI-processing permission.

## Final pre-submit checks

- Enable Supabase leaked-password protection in the hosted Auth settings.
- Confirm `https://arixp.com/privacy.html`, Terms, Community Guidelines, and Help & Safety load publicly without authentication where applicable.
- Confirm App Store Connect Privacy Policy URL is `https://arixp.com/privacy.html` and Privacy Choices URL is `https://arixp.com/privacy-memory.html`.
- Run the App Store browser smoke suite after any legal/auth/UI change.
- Build and archive the exact release configuration in Xcode.
- Test the archive on a physical iPhone through TestFlight before production review.
- Confirm `ITSAppUsesNonExemptEncryption` remains accurate for the shipping binary.
- Confirm camera, microphone, and photo permissions appear only when the corresponding user action requires them.
- Confirm no Cash App or Venmo link is reachable inside the native iOS experience.
- If StoreKit tips are enabled, create every configured consumable product in App Store Connect and test purchases in sandbox/TestFlight.
- Keep App Privacy answers synchronized with future features, SDKs, and data collection.
