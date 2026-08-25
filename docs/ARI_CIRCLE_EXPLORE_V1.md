# ARI Circle Explore V1

## Purpose

Explore turns the Action Network into a real-world discovery surface: things worth doing and safe public places where activity can happen.

It is not a people-tracking map.

## V1 objects

- **Opportunity** — existing normalized Meet Up or Mission read model.
- **Place** — curated or partner-verified public activity destination.
- **Action Intent** — private, expiring user matching context that may be used to rank public Places without exposing the intent coordinates.

## Privacy invariants

1. Explore never shows live individual-user locations.
2. Explore V1 never asks the browser or native app for GPS permission.
3. Place coordinates describe public destinations, not people.
4. An Action Intent's coarse coordinates may be consumed server-side by `ari_circle_list_places_for_intent`, but those coordinates are not returned by that RPC and are never copied into Place records.
5. Exact Meetup Room meeting points remain accepted-room-only and are not part of Explore.
6. Candidate/unverified Places are not discoverable.

## Ranking invariants

V1 Place ordering is deterministic:

1. distance when a private Action Intent provides coarse location;
2. place name;
3. stable place ID.

Paid status, sponsorship, follower counts, likes, reactions, views, popularity, and XP are not organic Place-ranking signals.

## Product behavior

Explore should answer: **what is worth doing and where could I do it?**

It should not answer: **which strangers are standing near me?**

The first lab route combines:

- current Opportunities;
- measurable Missions through Opportunity metadata;
- curated public Places;
- optional manual area search;
- optional privacy-safe nearby ranking from an already-active Action Intent.

## Deliberate omissions

V1 does not yet include:

- device GPS;
- a map renderer;
- place check-ins;
- live crowd counts;
- automatic Meetup-to-Place association;
- partner/business promotion;
- user-submitted public Places;
- place-based Mission verification.

Those should be added only after their trust and moderation contracts are explicit.
