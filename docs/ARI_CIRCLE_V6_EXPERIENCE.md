# ARI Circle V6 Experience Lab

## Product contract

ARI Circle V6 is the first integrated Action Network experience built on the existing Opportunity, Action Intent, Match, Places, Mission, Domain Event, Action Graph, and Crew substrates.

The primary loop is:

`Intent → best current actions → commitment → real-world activity → verified history → Crew/community → next action`

The page is intentionally not another social feed. The user starts with **What are you up for?** and receives current, explainable actions rather than people ranked for attention.

## V6 views

- **For You** — current Match Engine recommendations with user-readable reasons. Internal match scores are not displayed.
- **Explore** — public Places, Meetups, and Missions. Public destinations are not live-user location surfaces.
- **Crews** — private repeated-activity groups. Crew eligibility comes from verified shared activity, not follows, popularity, or manual arbitrary member selection.
- **Moments** — downstream storytelling after activity; activity first, content second.

## Intent boundary

The V6 composer writes only the signed-in user's private, expiring Action Intent through `ari_circle_create_action_intent` and clears it through `ari_circle_cancel_action_intent`.

- no browser GPS prompt
- no persisted exact location
- optional general area only in the V6 composer
- multiple active intents are rendered truthfully instead of silently hiding all but one
- the Match Engine remains the ranking authority

## Needs attention

The V6 page surfaces a bounded set of meaningful shared-state changes such as accepted/cancelled/waitlisted Meetup state, host requests, Mission review state, matched spot openings, and Crew invitations.

This is not a generic engagement notification feed. The controller caps the surface and derives it only from the sanitized Action Network context already provided by the server.

## Crew action boundary

Direct V6 Crew actions delegate only to existing guarded RPCs:

- `ari_circle_create_crew`
- `ari_circle_respond_crew_invite`
- `ari_circle_leave_crew`
- `ari_circle_archive_crew`

Crew creation accepts only the opaque evidence-backed candidate key plus a bounded name and a stable operation UUID. The browser does not submit arbitrary member IDs.

Founding consent remains explicit: the creator becomes active and the other founding members receive invitations. Leave/archive/decline decisions use explicit UI confirmation where destructive or irreversible enough to warrant it.

## Privacy and ranking

V6 does not introduce:

- direct table access
- service-role browser access
- raw meeting points or DMs
- raw live-user coordinates
- public Crew discovery
- arbitrary member management
- pay-to-rank or premium social advantage
- follower/like/view popularity ranking
- user-visible compatibility percentages

## Rollout state

`ari-circle-v6.html` remains a **lab route**. Production Circle navigation is intentionally unchanged until the dependent backend stack is merged/applied, V6 CI is green, and Safari/iOS smoke testing is complete.
