# ARI Circle Domain Events V1

Domain Events V1 is a short-lived, server-authoritative coordination layer for the ARI Circle Action Network.

## Purpose

The event ledger exists so trusted consumers can react to meaningful Circle state changes without polling private chats or treating historical events as source truth. The underlying Meetup, request, participant, Mission, contribution, and Action Network tables remain authoritative.

## Event vocabulary

### Meetup
- `meetup.created`
- `meetup.requested`
- `meetup.waitlisted`
- `meetup.accepted`
- `meetup.declined`
- `meetup.withdrawn`
- `meetup.joined`
- `meetup.left`
- `meetup.spot_opened`
- `meetup.cancelled`
- `meetup.completed`

`meetup.accepted` is a private host-approval event. The host is the actor and the applicant is the affected user. Approval Meetups do not also emit a misleading user-authored `meetup.joined` event.

### Mission
- `mission.created`
- `mission.joined`
- `mission.progress_submitted`
- `mission.progress_verified`
- `mission.progress_rejected`
- `mission.objective_reached`

## Trust rules

1. Browsers and normal authenticated callers cannot insert/update/delete event rows.
2. Event rows are emitted from authoritative database transitions.
3. Event writes use unique source keys so retries cannot create duplicate facts.
4. Events expire within 30 days and reads never return expired rows.
5. The authenticated read RPC re-checks current source visibility, adult access, and blocking before returning public Opportunity events.
6. Private coordination events are limited to involved users.
7. Event metadata must never contain exact meeting points, user coordinates, messages, proof notes, contact information, XP/reward data, payment/subscription state, popularity, or engagement ranking signals. This applies to nested metadata keys as well as top-level keys.
8. `meetup.spot_opened` is emitted only when a real departure changes a previously full scheduled Meetup to exactly one available spot.
9. Completion-style legacy Quests do not enter the Mission V2 event path.
10. The event ledger is coordination infrastructure, not durable Ari social memory or a user-engagement feed.

## Consumer boundary

V1 exposes `ari_circle_list_domain_events(...)` as the only authenticated event read path. Future Ari consumers should consume this bounded projection rather than direct table access. No consumer should infer that an event is still actionable without the server-side current-state checks performed by the RPC.

## Retention

`ari_circle_prune_domain_events()` is service-only. Expired rows are excluded from the read RPC even before physical pruning occurs.
