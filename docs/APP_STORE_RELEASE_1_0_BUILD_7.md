# ARI XP — App Store Release 1.0 (Build 7)

This document is the release-specific App Store checklist for ARI XP 1.0 Build 7. It replaces older submission guidance where current product behavior has changed.

## 1. Product description

ARI XP is an AI-assisted health, fitness, nutrition, training, and social experience. Ask ARI uses OpenAI for AI responses after explicit user permission. ARI Circle is restricted to verified adult accounts age 18+ and includes user-generated posts, messaging, reporting, blocking, moderation, optional approximate-location discovery, and meetup features.

## 2. App Privacy answers — current release

Review the final App Store Connect privacy questionnaire against the shipping build immediately before submission.

Current expected data categories include:

- Name / display name — linked to user; app functionality and personalization.
- Email address — linked to user; authentication and app functionality.
- User ID — linked to user; authentication, security, and app functionality.
- Age information / date of birth — linked to user; account eligibility, teen safeguards, and ARI Circle eligibility.
- Health information — linked to user; health, nutrition, goal, and AI functionality when the user provides it.
- Fitness information — linked to user; workout, training, and goal functionality.
- User Content — conversations with ARI, ARI Circle posts/comments/messages/profile content, support/safety reports, preferences, memories, and other user-submitted content.
- Photos and videos — when the user chooses media features in ARI XP / ARI Circle.
- Customer Support — linked to user when submitted while signed in.
- Product Interaction / usage records — where retained to operate features, enforce limits, protect the service, or troubleshoot.
- Diagnostic / technical information — where service, security, or diagnostic logs are retained.
- Coarse Location — linked to eligible adult ARI Circle users when they deliberately use current-location discovery. Device coordinates are reduced in precision before storage and used for nearby matching and distance calculations.
- Device identifier — review APNs push-token treatment in the final questionnaire; push tokens are used only for app functionality and are not used for advertising or tracking.

Expected privacy positions for this release:

- Tracking: No.
- Advertising Data: No.
- Data used for third-party advertising: No.
- Precise Location: do not select solely because the device initially provides coordinates when the shipping implementation immediately reduces precision before storage; confirm final App Store Connect wording against current Apple definitions.
- Coarse Location: Yes for the optional ARI Circle nearby-location feature.

## 3. Third-party AI disclosure

ARI XP uses OpenAI as a third-party AI processing provider for Ask ARI responses and ARI Circle safety screening.

Before AI-powered features transmit personal data to OpenAI, the user is presented with an AI-processing disclosure that identifies OpenAI, explains the categories of information that may be transmitted, and provides "Allow AI processing" and "Not now" choices. If permission is declined or withdrawn, Ask ARI remains unavailable and ARI Circle content that requires AI safety screening cannot be published until permission is granted. The permission can be changed later in Privacy & Ari Memory.

Information sent to OpenAI may include, when relevant to the feature being used:

- the user's current message or submitted content;
- limited recent conversation context;
- relevant profile, preference, memory, health, nutrition, fitness, or goal context needed for the request;
- ARI Circle text, photos, and sampled still frames from short videos submitted for safety screening.

OpenAI credentials remain server-side.

## 4. Age-rating answers

Answer App Store Connect based on the actual shipping feature set. ARI XP currently includes:

- Social Media: Yes.
- User-Generated Content: Yes.
- Messaging / Chat: Yes.
- Health / Wellness functionality: Yes, according to the wording presented by App Store Connect.

ARI Circle is restricted by ARI XP to active accounts verified as age 18 or older. Accounts age 13-17 may use eligible non-social ARI XP features with additional age-appropriate AI safeguards. ARI XP does not create accounts for users under 13.

Do not select special age-range declarations unless ARI XP satisfies the specific Apple requirements attached to those declarations.

## 5. Payments and Ari Unlimited

For ARI XP 1.0 Build 7:

- Do not expose a consumer-facing Ari Unlimited purchase or upgrade flow in the iOS app unless the release has a compliant Apple In-App Purchase implementation.
- Do not link from the iOS app to external purchase methods for digital functionality.
- Optional support must not unlock app functionality, AI usage, credits, limits, or other digital benefits.
- If StoreKit support/tip products are not enabled for this build, optional support should remain unavailable in the native iOS app.

## 6. Reviewer account requirements

Provide a dedicated non-owner reviewer account that is:

- adult and eligible for ARI Circle;
- email verified;
- not an owner/admin account;
- able to sign in without additional verification friction;
- seeded with a basic ARI XP profile;
- able to view at least one other ARI Circle profile and sample content so Report and Block can be tested;
- able to test messaging and nearby discovery if those features are part of the shipping build;
- initially left without AI-processing permission so App Review can see the disclosure flow itself.

Reviewer credentials must be tested immediately before submission.

## 7. Recommended App Review Notes

ARI XP uses OpenAI as a third-party AI processing provider for Ask ARI responses and ARI Circle safety screening.

On the first attempt to use an AI-powered feature, ARI XP presents a disclosure identifying OpenAI and explaining the categories of information that may be transmitted. The user may select "Allow AI processing" or "Not now." If permission is declined, AI-dependent functionality remains unavailable. The permission can later be changed under My Account > Privacy & Ari Memory.

ARI Circle is restricted to verified users age 18 and older and includes user-generated posts, messaging, reporting, blocking, and automated safety screening.

Device location is optional and is requested only when the user deliberately chooses a nearby-location feature. ARI XP reduces device coordinates in precision before storage and uses the resulting approximate location for nearby matching and distance calculations.

Account deletion is available at My Account > Account Control > Delete Account and includes a seven-day recovery period before permanent deletion is processed.

Suggested review path:

1. Sign in with the reviewer account.
2. Open Ask ARI.
3. Review the AI-processing disclosure and select either option.
4. If "Allow AI processing" is selected, ask ARI a question.
5. Open ARI Circle and open the seeded sample profile.
6. Test Report and Block from the profile options menu.
7. Optionally test a nearby-location feature; iOS location permission is requested only after the user chooses to use current location.
8. Open My Account > Privacy & Ari Memory to view or change AI-processing permission.
9. Open My Account > Account Control to view account-deletion controls.

## 8. Final pre-submit checklist

- [ ] App Store version remains 1.0 and shipping build is Build 7 or later.
- [ ] Production iOS bundle excludes Ari Lab and other clearly development-only test pages.
- [ ] AI-processing disclosure renders correctly for a fresh reviewer account.
- [ ] "Not now" leaves Ask ARI unavailable and does not silently process the request.
- [ ] "Allow AI processing" enables the expected AI features.
- [ ] Revoking AI-processing permission from Privacy & Ari Memory disables related features.
- [ ] App Privacy questionnaire matches current ARI XP behavior, including Coarse Location.
- [ ] September 2026 age-rating/social-media questions are answered from the current shipping build.
- [ ] External Cash App / Venmo support methods are not exposed in the native iOS build.
- [ ] No consumer-facing Ari Unlimited purchase/upgrade path is exposed unless compliant IAP is implemented.
- [ ] ARI Circle filtering, Report, Block, moderation, and public support contact all work.
- [ ] Account deletion works from inside the app.
- [ ] Privacy Notice, Terms, Community Guidelines, Help & Safety, and support URLs load publicly.
- [ ] Camera, microphone, photo-library, location, and push permission flows are tested on device.
- [ ] TestFlight release candidate is tested on iPhone and an 11-inch iPad-class device.
- [ ] Major medical/high-stakes prompts route to cautious, non-diagnostic guidance.
- [ ] Reviewer credentials and seeded Circle content are working immediately before submission.
- [ ] Review Notes are copied from this release document and adjusted only if the shipping build differs.
