# ARI Next Intent-First V1

ARI Next is the intelligence surface in ARI Circle. It should not feel like a manual search form.

## Primary interaction

- The user can tell Ari what sounds good in plain language.
- Quick intents provide one-tap shortcuts for Anything, Workout, Outside, and Social.
- Activity, When, and Group remain available under **Refine preferences** for people who want explicit control.
- Saved Circle search area and radius remain owned by **Connect → Meetups** and are consumed automatically by ARI Next.

## Automatic first paint

ARI Next reads current Circle context immediately. If the user has no active intent and there are current public opportunities, ARI Next may surface those as **available current options**. They must not be labeled as matched, best-fit, or personalized until the Match Engine has an actual Action Intent.

## Trust boundaries

- No automatic GPS.
- No exact meetup location in ARI Next discovery context.
- No silent meetup joins, invites, or membership mutations.
- Plain-language intent is translated into the existing private Action Intent fields; the existing guarded RPC remains the mutation authority.
- The production context bridge supplies only the same public Supabase project URL/publishable key already used by the browser. The signed-in user's Bearer JWT remains the authorization identity for the existing bounded context handler and Circle RPCs.

## User-facing language

Architecture terms such as **Action Network** are not loading/status copy. User-facing states should describe what Ari is doing or what the user can do next.
