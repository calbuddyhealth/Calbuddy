# ARI XP — App Store Release 1.0 (Build 7)

This is the release-specific App Store Connect answer sheet for ARI XP 1.0 Build 7. It replaces older submission guidance where current product behavior has changed.

Validated against the current shipping repository and Apple App Store Connect guidance on September 14, 2026.

## 1. Product position

ARI XP is an AI-assisted health, fitness, nutrition, training, and social experience. Ask ARI uses OpenAI for AI responses after explicit user permission. ARI Circle is restricted by ARI XP to verified adult accounts age 18+ and includes user-generated posts, messaging, reporting, blocking, moderation, optional approximate-location discovery, and meetup features.

ARI XP is positioned as a health/wellness product, not as a diagnostic service or replacement for professional medical care.

## 2. App Privacy — exact App Store Connect selections

### Data collection question

Select:

- **Yes, we collect data from this app.**

Apple defines collection as transmitting data off-device in a way that allows the developer or a third party to access it for longer than is necessary to service the request in real time. Apple requires the label to include the practices of third-party partners as well as the developer.

### Select these data types

For Build 7, select the following App Privacy data types:

| Apple data type | Collected | Linked to user | Used for tracking | Purposes |
| --- | --- | --- | --- | --- |
| **Name** | Yes | Yes | No | App Functionality; Product Personalization |
| **Email Address** | Yes | Yes | No | App Functionality |
| **Health** | Yes | Yes | No | App Functionality; Product Personalization |
| **Fitness** | Yes | Yes | No | App Functionality; Product Personalization |
| **Coarse Location** | Yes | Yes | No | App Functionality; Product Personalization |
| **Emails or Text Messages** | Yes | Yes | No | App Functionality |
| **Photos or Videos** | Yes | Yes | No | App Functionality |
| **Audio Data** | Yes | Yes | No | App Functionality |
| **Customer Support** | Yes | Yes | No | App Functionality |
| **Other User Content** | Yes | Yes | No | App Functionality; Product Personalization |
| **User ID** | Yes | Yes | No | App Functionality |
| **Device ID** | Yes | Yes | No | App Functionality |
| **Product Interaction** | Yes | Yes | No | App Functionality |
| **Other Diagnostic Data** | Yes | Yes | No | App Functionality |
| **Other Data Types** | Yes | Yes | No | App Functionality; Product Personalization |

### Why each less-obvious selection is present

- **Coarse Location:** ARI Circle can receive device coordinates after the user deliberately chooses current location. The server reduces coordinate precision before storing location used for nearby discovery. Apple specifically instructs developers to disclose Coarse Location when precise coordinates are immediately coarsened and precise location is not stored.
- **Emails or Text Messages:** ARI Circle provides private in-app messaging. Apple explicitly says non-SMS in-app private messages belong under Emails or Text Messages.
- **Audio Data:** the iOS app can record video with microphone audio when the user chooses that feature.
- **Other User Content:** Ask ARI conversations, ARI Circle posts/comments/profile text, preferences, memories, and other free-form user content fall here.
- **Device ID:** ARI XP stores the APNs device token with the authenticated user to provide push notifications. Treat this conservatively as a device-level identifier used only for App Functionality.
- **Product Interaction:** ARI XP retains AI/feature-usage records associated with the user to operate usage limits, provider accounting, and related app behavior.
- **Other Diagnostic Data:** the privacy notice allows service/security/diagnostic logs used to operate, secure, and troubleshoot ARI XP. Do not mark Crash Data or Performance Data unless the final archive or a third-party SDK separately collects those categories.
- **Other Data Types:** use this for account age/date-of-birth and similar account attributes not represented by another Apple privacy-label category. Height, weight, heart rate, goals, and other health/body-profile values belong under Health/Fitness rather than Other Data Types.

### Do not select these unless the final shipping build changes

- Precise Location
- Phone Number
- Physical Address
- Contacts
- Payment Info
- Credit Info
- Other Financial Info
- Purchase History
- Browsing History
- Search History
- Advertising Data
- Crash Data
- Performance Data
- Environment Scanning
- Hands
- Head
- Tracking
- Third-Party Advertising
- Developer Advertising or Marketing

### Tracking

For every selected data type:

- **Used for Tracking: No**

ARI XP does not link user/device data with third-party data for targeted advertising or advertising measurement and does not share app data with data brokers.

### Privacy links

- **Privacy Policy URL:** required. Use the public production URL that loads `privacy.html` without authentication.
- **Privacy Choices URL:** optional. It may point to a public page explaining how to change AI-processing permission, memory, notification choices, location choice, and account deletion. Do not enter a URL that requires login unless Apple can still understand the available choices from the public page.

## 3. Third-party AI disclosure — current release position

ARI XP uses OpenAI as a third-party AI processing provider for Ask ARI responses and ARI Circle safety screening.

Before AI-powered features transmit personal data to OpenAI, the user is presented with an AI-processing disclosure that identifies OpenAI, explains the categories of information that may be transmitted, and provides **Allow AI processing** and **Not now** choices. If permission is declined or withdrawn, Ask ARI remains unavailable and ARI Circle content that requires AI safety screening cannot be published until permission is granted. The permission can be changed later in Privacy & Ari Memory.

Information sent to OpenAI may include, when relevant to the feature being used:

- the user's current message or submitted content;
- limited recent conversation context;
- relevant profile, preference, memory, health, nutrition, fitness, or goal context needed for the request;
- ARI Circle text, photos, and sampled still frames from short videos submitted for safety screening.

OpenAI credentials remain server-side.

Apple Guideline 5.1.2(i) requires disclosure of where personal data is shared with third parties, including third-party AI, and explicit permission before the sharing occurs. The existing ARI XP consent UI is intended to satisfy this requirement and passed the App Store smoke flow before this release checklist was finalized.

## 4. Age Ratings — exact questionnaire position

### Step: In-App Controls / Capabilities

Use these selections for the current Build 7 feature set:

| App Store Connect capability | Answer |
| --- | --- |
| **Parental Controls** | No |
| **Age Assurance** | Yes |
| **Unrestricted Web Access** | No |
| **User-Generated Content** | Yes |
| **Social Media** | Yes |
| **Social Media Disabled for Users Under 13** | No |
| **Messaging and Chat** | Yes |
| **Advertising** | No |

Notes:

- **Age Assurance = Yes** because ARI XP collects date of birth / age information to determine account eligibility and whether ARI Circle is available.
- **Social Media = Yes** because ARI Circle contains social/discovery feeds and interaction with broadly distributed user-generated content.
- **User-Generated Content = Yes** because Circle contains user-created posts, comments, profile content, photos/videos, and related content.
- **Messaging and Chat = Yes** because Circle includes direct messaging.
- **Social Media Disabled for Users Under 13 = No** for this Apple questionnaire field even though ARI XP itself restricts Circle to adults. Apple states that this special declaration requires, at minimum, use of the Declared Age Range API before enabling social media. Build 7 does not currently use that API.

### Step: Mature Themes

Recommended answers for the current moderated shipping experience:

| Content descriptor | Answer |
| --- | --- |
| **Profanity or Crude Humor** | Infrequent |
| **Horror or Fear Themes** | None |
| **Alcohol, Tobacco, or Drug Use or References** | Infrequent |

The Infrequent selections are conservative for a moderated social/AI product where mild user discussion may occasionally include these topics. If the final seeded reviewer content and first-party content contain none of them, these may be reduced to None, but do not understate content that is actually visible in the shipping app.

### Step: Medical or Wellness

| Content descriptor | Answer |
| --- | --- |
| **Medical or Treatment Information** | Infrequent |
| **Health or Wellness Topics** | Frequent |

Rationale:

- Health/wellness is core to ARI XP: calorie tracking, nutrition, fitness, training, body goals, and lifestyle recommendations are central features.
- ARI can respond to occasional user questions involving symptoms, medications, emergencies, or condition management, but the app is not positioned as a diagnostic/treatment product and high-stakes responses are intentionally cautious. Therefore **Infrequent** is the appropriate current position for Medical or Treatment Information.

If the shipping product is later changed to routinely provide condition-management, medication, emergency-care, or treatment guidance, this must be reassessed and may need to become Frequent.

### Step: Sexuality or Nudity

| Content descriptor | Answer |
| --- | --- |
| **Mature or Suggestive Themes** | Infrequent |
| **Sexual Content or Nudity** | None |
| **Graphic Sexual Content or Nudity** | None |

The Infrequent mature-theme selection is conservative because AI/wellness conversations may occasionally involve psychologically sensitive real-world topics. Explicit sexual/nude content is not an intended ARI XP feature and Circle moderation is intended to prevent it.

### Step: Violence

Select **None** for the current shipping product for:

- Cartoon or Fantasy Violence
- Realistic Violence
- Prolonged Graphic or Sadistic Realistic Violence
- Guns or Other Weapons

If seeded App Review content contains any such material, change the relevant answer before submission.

### Step: Chance-Based Activities

Select:

- Simulated Gambling: None
- Contests: None
- Gambling: No
- Loot Boxes: No

### Expected calculated rating

With **Social Media = Yes** and **Medical or Treatment Information = Infrequent**, the expected Apple global rating on OS 26-era devices is at least **13+**. Apple calculates and displays the final rating automatically, and regional ratings can differ.

Do not override the calculated rating downward. An override upward is only needed if ARI XP's legal/EULA age requirement exceeds the calculated rating.

## 5. Regulated Medical Device Status

Apple may require a regulated-medical-device declaration when an app is in the Health & Fitness or Medical category, or when Medical or Treatment Information is marked Frequent.

Current Build 7 product position:

- **United States:** Not a regulated medical device
- **European Union / EEA:** Not a regulated medical device
- **United Kingdom:** Not a regulated medical device

Use that position only while ARI XP remains a general wellness/AI product and is not marketed or certified as a regulated diagnostic, monitoring, prevention, or treatment device. If regulatory status changes, update App Store Connect before submission.

## 6. Payments and Ari Unlimited

For ARI XP 1.0 Build 7:

- Do not expose a consumer-facing Ari Unlimited purchase or upgrade flow in the iOS app unless the release has a compliant Apple In-App Purchase implementation.
- Do not link from the iOS app to external purchase methods for digital functionality.
- Optional support must not unlock app functionality, AI usage, credits, limits, or other digital benefits.
- If StoreKit support/tip products are not enabled for this build, optional support should remain unavailable in the native iOS app.

## 7. Reviewer account requirements

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

## 8. App Review Notes

Recommended text:

> ARI XP uses OpenAI as a third-party AI processing provider for Ask ARI responses and ARI Circle safety screening.
>
> On the first attempt to use an AI-powered feature, ARI XP presents a disclosure identifying OpenAI and explaining the categories of information that may be transmitted. The user may select “Allow AI processing” or “Not now.” If permission is declined, AI-dependent functionality remains unavailable. The permission can later be changed under My Account > Privacy & Ari Memory.
>
> ARI Circle is restricted by ARI XP to verified users age 18 and older and includes user-generated posts, messaging, reporting, blocking, and automated safety screening.
>
> Device location is optional and is requested only when the user deliberately chooses a nearby-location feature. ARI XP reduces device coordinates in precision before storage and uses the resulting approximate location for nearby matching and distance calculations.
>
> Account deletion is available at My Account > Account Control > Delete Account and includes a seven-day recovery period before permanent deletion is processed.

Suggested review path:

1. Sign in with the reviewer account.
2. Open Ask ARI.
3. Review the AI-processing disclosure and select either option.
4. If **Allow AI processing** is selected, ask ARI a question.
5. Open ARI Circle and open the seeded sample profile.
6. Test Report and Block from the profile options menu.
7. Optionally test a nearby-location feature; iOS location permission is requested only after the user chooses to use current location.
8. Open My Account > Privacy & Ari Memory to view or change AI-processing permission.
9. Open My Account > Account Control to view account-deletion controls.

## 9. Final pre-submit checklist

- [ ] App Store version remains 1.0 and shipping build is Build 7 or later.
- [x] Production iOS bundle excludes Ari Lab and CI verifies its absence.
- [x] App Store browser smoke test verifies AI consent can be declined and later allowed.
- [x] iOS native validation and App Store release build validation passed on the compliance PR before merge.
- [ ] App Privacy Data Types are entered exactly from Section 2 and reviewed against the final archive.
- [ ] All selected privacy data types are marked **Not Used for Tracking**.
- [ ] Coarse Location is selected; Precise Location is not selected unless final implementation changes.
- [ ] September 2026 age-rating answers are entered from Section 4.
- [ ] Calculated age rating is reviewed after completing the questionnaire.
- [ ] Regulated Medical Device Status is completed if App Store Connect presents it.
- [ ] External Cash App / Venmo support methods are not exposed in the native iOS build.
- [ ] No consumer-facing Ari Unlimited purchase/upgrade path is exposed unless compliant IAP is implemented.
- [ ] ARI Circle filtering, Report, Block, moderation, and public support contact all work with the reviewer account.
- [ ] Account deletion works from inside the app.
- [ ] Privacy Notice, Terms, Community Guidelines, Help & Safety, and support URLs load publicly.
- [ ] Camera, microphone, photo-library, location, and push permission flows are tested on device.
- [ ] TestFlight release candidate is tested on iPhone and an 11-inch iPad-class device.
- [ ] Major medical/high-stakes prompts route to cautious, non-diagnostic guidance.
- [ ] Reviewer credentials and seeded Circle content are working immediately before submission.
- [ ] Review Notes are copied from Section 8 and adjusted only if the shipping build differs.

## 10. Apple references used for this answer sheet

- App privacy details: https://developer.apple.com/app-store/app-privacy-details/
- Manage app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Age rating values and definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- Set an app age rating: https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Regulated medical device status: https://developer.apple.com/help/app-store-connect/manage-app-information/declare-regulated-medical-device-status
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
