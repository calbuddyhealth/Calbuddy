# ARI Circle V6 Experience

## Product contract

ARI Circle V6 is the integrated Action Network experience built on the existing Opportunity, Action Intent, Match, Places, Mission, Domain Event, Action Graph, and Crew substrates.

The primary loop is:

`Intent → best current actions → commitment → real-world activity → verified history → Crew/community → next action`

The Ari-driven surface is **ARI Next**. It is intentionally not another social feed or a second manual meetup browser. The user starts with **What are you up for?** and receives current, explainable recommendations rather than people ranked for attention.

## Navigation contract

Circle has one persistent three-destination navigation model, in this order:

- **Feed** — social storytelling: posts, Moments, photos/video, reactions, comments, and activity-after-the-fact content.
- **Connect** — manual participation. It contains two peer modes: **Meetups** for time/place/people coordination and **Missions** for measurable objectives and progress.
- **ARI Next** — Circle intelligence. It contains Action Intents, Match Engine recommendations, Explore entry points, Crews, selected opportunities, matched plans, and a compact summary of upcoming commitments.

There is no second global navigation row. **Meetups | Missions** is a contextual switch inside Connect, not another primary navigation system. **Explore** and **Crews** are secondary ARI Next features. **Moments** is a Feed content type, not a separate global destination. Profile, notifications, friend discovery, privacy, safety, and Messages remain secondary controls rather than primary tabs.

The ARI CIRCLE wordmark always returns to **ARI Next**.

## Surface boundaries

### Feed

Feed answers: **What are people sharing?** It owns Moments, posts, media, reactions, comments, and social storytelling after or around activity. It does not own meetup coordination or Ari recommendation logic.

### Connect

Connect answers: **What can I deliberately join, create, or manage?**

- **Meetups** are events: a real time, broad area/place, host, capacity, join state, attendees, requests, and Meetup Room coordination. The shared Circle Search Location and radius are meaningful here because meetup discovery is local.
- **Missions** are objectives: measurable goals, progress, verification, and completion. Missions are not forced into a radius because some are local and some can be completed anywhere.

ARI Next may hand a suggested meetup draft into the canonical Connect/Meetups host flow, but it does not silently publish a meetup or add people.

### ARI Next

ARI Next answers: **What should I do next?** It can recommend Meetups, Missions, public Places, compatible people, or a matched plan. It should show a small number of strong options and shortcuts, not recreate the Connect catalog or management tools.

The intent composer asks for the user's immediate intent such as activity, time, and group preference. It does not repeat the visible radius/general-area controls. ARI Next automatically uses the shared Circle Search Location preference as the location authority.

## Intent boundary

The V6 composer writes only the signed-in user's private, expiring Action Intent through `ari_circle_create_action_intent` and clears it through `ari_circle_cancel_action_intent`.

- no automatic browser GPS prompt
- no persisted exact device location
- the shared Circle Search Location is user-controlled and coarse
- location/radius are not repeatedly requested inside the ARI Next intent form
- multiple active intents are rendered truthfully instead of silently hiding all but one
- the Match Engine remains the ranking authority
- internal match scores are not displayed to users

## Needs attention

ARI Next surfaces a bounded set of meaningful shared-state changes such as accepted/cancelled/waitlisted Meetup state, host requests, Mission review state, matched spot openings, and Crew invitations.

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

`ari-circle-v6.html` is the canonical **ARI Next** route. The persistent Circle shell owns primary navigation across Feed, Connect, ARI Next, Explore, Missions, Profile, and related Circle routes so secondary pages do not invent competing navigation.