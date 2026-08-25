# ARI Circle Action Network V6

Status: architecture contract for `feature/ari-circle-action-network`.

## Product definition

ARI Circle is not a feed-first social network. It is a real-world action network whose job is to make the physical world around a user feel full of worthwhile things to do.

The core loop is:

`Intent -> Opportunity -> Commit -> Go -> Do -> Verify -> Contribute -> Repeat -> Crew -> Community -> Moment`

Content documents life after it happens. Content is not the primary object and engagement is not the primary outcome.

## North-star outcome

Primary product metric:

**Verified real-world actions completed per active Circle member.**

Supporting metrics:

- opportunity -> commitment conversion
- commitment -> verified completion
- first shared action -> second shared action
- repeat group -> Crew formation
- first host -> repeat host
- mission join -> contribution
- time from intent to useful opportunity
- safety incidents per completed action

Minutes in app, post volume, reaction volume, and notification opens are not north-star metrics.

## Non-negotiable product rules

1. Core opportunity discovery, normal hosting, joining, Crews, community Missions, and basic matching are not pay-to-play.
2. XP, reputation, leadership, compatibility, and organic opportunity ranking cannot be purchased.
3. Sponsored content must be explicitly labeled and cannot secretly change compatibility ranking.
4. Ari never receives unrestricted database mutation authority. The model proposes meaning; trusted application code validates and executes.
5. Exact individual location is private by default. Public discovery uses a public place, broad area, or deliberately coarse location. Exact meetup points remain accepted-room-only.
6. Circle must never expose a live map of individual users by default.
7. Blocking, adult entitlement, privacy, moderation, and capacity gates run before ranking or Ari recommendations.
8. Missing state is unknown. Ari may not invent an opportunity, attendee, acceptance, location, completion, or relationship.
9. Real-world reputation comes from verified participation and contribution, not posting frequency or follower count.
10. V5 remains the production fallback until V6 proves equal or better safety and reliability.

## Canonical domain objects

### Person
An adult Circle member with profile identity, privacy settings, explicit relationships, earned reputation, preferences, and verified action history.

### Action Intent
A temporary statement of what the user is open to doing. Intent is not a public dating-style profile and expires automatically.

Examples:

- gym tonight 5-8 PM, small group, intermediate
- something outdoors Saturday morning, easy intensity
- volunteer this weekend within 10 miles

V6 should reuse the good parts of the historical `ari_circle_partner_intents` design: activity, mode, experience, area, time preference, expiration, and coarse location. It must use the current adult-only Circle entitlement rather than revive retired Teen Circle behavior.

### Opportunity
The normalized thing a user can reasonably do next.

V1 sources:

- `meetup`
- `mission` (current Quest backend)

Future sources:

- `crew_activity`
- `community_event`
- `place_mission`
- verified external community event

An Opportunity is a read model. Existing source tables remain authoritative for writes and source-specific state machines.

### Place
A safe public activity destination or verified venue. Places describe where worthwhile activity can happen, not where a specific person is currently standing.

### Action
A verified real-world completion. Actions are the evidence layer that can later power relationship history, Crew formation, contribution, and reputation.

### Mission
The evolution of Quests into measurable cooperative objectives. Missions can track completion, count, distance, attendance, place exploration, or collective progress. Existing verified/capped XP remains a secondary reward layer.

### Crew
A persistent group formed from repeated shared action. Crews should normally be suggested after meaningful repeat participation rather than being the first interaction between strangers.

### Moment
Optional text/photo/video documenting an experience. Moments remain social content, but the Action Network does not require content creation to be useful.

### Domain Event
A server-authoritative fact that something meaningful changed, for example:

- `opportunity.created`
- `meetup.requested`
- `meetup.accepted`
- `opportunity.spot_opened`
- `mission.progressed`
- `mission.completed`
- `crew.candidate_detected`
- `crew.created`

Domain events can later drive CircleRealtime, Ari initiative, and push delivery without each feature inventing a new notification system.

## Opportunity V1 read contract

`ari_circle_list_opportunities` normalizes current Meetups and Quests without replacing either source.

Fields:

- `opportunity_key` - stable source-qualified identifier (`meetup:<uuid>` or `mission:<uuid>`)
- `opportunity_type`
- `opportunity_id`
- `title`
- `activity`
- `description`
- `area`
- `starts_at`
- `ends_at`
- `organizer_user_id`
- `organizer_display_name`
- `organizer_handle`
- `organizer_avatar_url`
- `participant_count`
- `capacity`
- `spots_remaining`
- `viewer_state`
- `verification_mode`
- `join_mode`
- `reward_xp`
- `metadata`

V1 is deliberately a normalized discovery contract, not a recommendation model. Ranking comes later after Action Intent, safety gates, geography, and outcome telemetry exist.

## State authority

Source-specific state remains explicit and authoritative.

Meetup example:

`scheduled -> requested/accepted -> joined -> completed`

with alternate terminal/side states such as `declined`, `waitlisted`, `withdrawn`, `left`, and `cancelled`.

Mission example:

`active -> joined -> submitted -> verified`

with `rejected`, `left`, `ended`, and `cancelled` as applicable.

The Opportunity layer must never manufacture a state that the underlying source did not prove.

## Client architecture

Preserve and expand the existing Circle module spine:

`Supabase/RPC -> CircleApi/CircleRealtime -> CircleStore + CircleEvents -> feature controllers/UI`

Do not add independent V6 state owners for every feature.

Planned shared state domains:

- `opportunities`
- `intents`
- `missions`
- `crews`
- `places`
- `actionHistory`

Planned domain events should be added to CircleEvents rather than implemented as one-off DOM events when possible.

## Ari architecture

Build on Ari vNext, not the legacy Rebirth cognition stack.

Planned server/browser components:

- `api/_lib/ari-vnext/circle-context.js`
- `api/_lib/ari-vnext/circle-tools.js`
- `ari/vnext/ari-vnext-circle-action-adapter.js`
- Circle-specific deterministic proactive signals integrated with the existing initiative engine

Ari read path:

`authoritative Circle state -> compact situation packet -> context router -> model`

Ari mutation path:

`user intent -> model proposal -> semantic/action validation -> pending action -> user confirmation when required -> guarded Circle RPC -> verified result`

Raw private DMs, exact hidden locations, and unrestricted social history are not automatically dumped into the model.

## Matching architecture

V1 matching is deterministic and explainable.

Hard gates first:

1. adult Circle entitlement
2. block/privacy/moderation restrictions
3. opportunity validity/status
4. capacity
5. time window
6. geography when permission exists

Ranking signals can then include:

- activity/intent fit
- time fit
- distance
- experience fit
- prior successful shared actions
- reliability derived from actual participation
- novelty/diversity so the system does not trap users in one clique

Paid status is never a ranking signal.

The product should explain matches in natural language such as `you have trained together before`, `similar experience`, or `fits your usual evening window`, not expose a fake precision score.

## Location architecture

Reuse the historical privacy pattern of deliberately coarse coordinates for discovery. Exact meeting points remain inside accepted Meetup Rooms.

Future Places should use verified public destinations or coarse coordinates. Aggregate statements such as `18 people participated here today` may be useful; individual live-location exposure is out of scope by default.

## Verification evolution

Current mutual meetup completion remains valid for small groups, but V6 must support source-appropriate verification as participation scales:

- mutual/host verification for small meetups
- organizer attendance for larger events
- trusted activity-log evidence for measurable Missions
- peer verification where appropriate
- privacy-safe place check-in/geofence only when justified and permissioned
- system verification for trusted integrations

All reward settlement remains idempotent and server-authoritative.

## Build sequence

1. Action Network contract and Opportunity V1 read model.
2. Action Intent V1 using the best legacy Buddies concepts under current adult-only policy.
3. Deterministic Match Engine V1 with explanation reasons and outcome telemetry.
4. Ari read-only Circle context and opportunity tools.
5. Ari trusted Circle action adapter.
6. Mission V2 measurable/cooperative progress.
7. Shared-action relationship stats and emergent Crew suggestions.
8. Places + Explore with coarse/public location rules.
9. Domain-event outbox + CircleRealtime integration + useful-change notifications.
10. Ari proactive Circle initiative using the existing no-engagement-bait rules.
11. Owner-only V6 shell: For You, Explore, Crews, Moments.
12. Safety/reliability/effectiveness evaluation before any production cutover.

## Cold-start rule

Circle must remain useful before local network density is high.

Low density value:

- Missions
- Places
- exploration
- personal training integration
- contribution to aggregate community goals

Higher density progressively unlocks:

- meetups
- repeat partners
- Crews
- locally active communities

The product must not require a crowded map to have value.

## Definition of success

V6 succeeds when Ari Circle makes it materially easier for a person to discover something worthwhile, commit with minimal friction, actually do it, and naturally build repeated real-world relationships around shared action.
