# ARI Circle V5 — Real World Social

ARI Circle V5 shifts Circle from passive social engagement toward verified real-world participation while preserving Posts, Moments, messaging, connections, and safety controls.

## Primary experience

- **Feed** — Posts, Moments, reactions, comments, messaging, plus a Happening rail for real-world activity discovery.
- **Meet Up** — replaces Buddies. Users host or join activities and earn Real World XP only after verified completion.
- **Quests** — replaces competitive Challenges with bounded Personal, Community, and Crew objectives.
- **Profile** — displays Real World XP, level, verified meetups, successful hosting, leadership status, activity history, and an active hosted meetup card.

## Real World XP contract

- Hard server cap: **10 XP per UTC day**.
- Hard server cap: **70 XP per UTC week**.
- Verified meetup participant: up to **4 XP**.
- Verified meetup host: up to **6 XP** total.
- Quest reward: **0–3 XP**.
- Creating, joining, RSVPing, posting, reacting, commenting, or checking in earns **0 XP**.
- XP is stored in an idempotent server-authoritative ledger.
- A meetup releases XP only when every still-joined participant has completed it and at least two participants are verified.
- XP-bearing Quests cannot be Personal or self-verified and are restricted to eligible Community Leaders/owner/admin creators.

## Reputation and leadership

XP indicates participation, not a hidden trust score. Profiles surface factual signals such as verified meetups and successful hosted events. Leadership progression is based on completed hosted meetups:

- Organizer: 3
- Active Host: 10
- Community Leader: 25
- Community Builder: 50

## Community and civic events

Community walks, charity walks, volunteer events, awareness walks, and peaceful civic marches may be represented as Community meetups. ARI Circle rewards verified participation, not a political viewpoint, crowd size, distance race, or risky behavior.

## Safety architecture

- Circle remains adults-only.
- Direct access to V5 XP/meetup/quest tables is revoked from public, anonymous, and authenticated roles.
- Authenticated clients use guarded RPCs that derive the actor from `auth.uid()` and enforce adult access plus ownership/role rules.
- The raw XP-award helper is service-role only.
- New Meetup/Quest publication text uses the existing ARI Circle moderation service and fails closed when moderation is unavailable.
- Existing blocking/muting/privacy rules are reused for discovery.

## Ari personalization boundary

ARI Circle social activity is **not** an input to Ari direct-conversation personalization or behavioral learning. This release does not change that boundary.
