# ARI XP Security Audit — 2026-08-17

This document tracks production security hardening for ARI XP.

## Scope
- Supabase RLS and RPC exposure
- Supabase Storage access
- Server-side authentication and secrets
- Vercel response security headers
- Abuse/rate-limit controls
- Owner-only developer endpoints

## Initial findings
- All public tables inspected have RLS enabled.
- No permissive public write policies were found in the first-pass audit.
- Teen, challenge, and post media use private buckets with authenticated path/cohort checks; the adult profile-media bucket is public by design.
- Owner GitHub editing requires a verified Supabase session tied to the configured owner and exact confirmation before commit.
- OpenAI credentials are server-side. The fast conversation endpoint requires a valid Supabase session.
- The legacy `/api/ari-intent-router`, `/api/ask-calbuddy`, and deep `/api/knowledge` transport do not yet require bearer authentication because the currently submitted native client calls those routes without an Authorization header. Turning on mandatory auth server-side before updating the native client would break that build.
- Supabase Security Advisor reports leaked-password protection disabled (dashboard/plan setting).
- Supabase Security Advisor reports many authenticated-callable SECURITY DEFINER RPCs. The audit found that the callable functions inspected now contain caller/admin/cohort authorization checks; these functions are intentional app RPCs and cannot be revoked wholesale without breaking the app.
- Legacy `ari_circle_challenge_submit_entry` delegated to the guarded v3 implementation but did not authenticate before its preliminary challenge lookup. This has now been hardened.
- A group of personal-data RLS policies used the broad Postgres `public` role even though their expressions required `auth.uid()`. They did not expose anonymous rows because an anonymous caller has no matching user id, but they have now been narrowed to `authenticated` explicitly.
- Vercel previously lacked a centralized set of baseline response security headers in `vercel.json`; low-risk headers have now been added without introducing a strict CSP that could break existing app assets/auth flows.

## Corrections completed
1. Added an explicit authenticated caller check, null challenge validation, and safe search path to the legacy challenge-entry RPC.
2. Revoked legacy challenge-entry execution from `anon` and `public`; retained `authenticated` execution because the app uses it as a signed-in RPC.
3. Narrowed clearly personal RLS policies from `public` to `authenticated` while preserving the same `auth.uid()` ownership checks. This includes personal profile, meal/AI usage, chat/session, workout, upload, memory, pattern, weight, and related user-owned tables. Shared knowledge/document policies were deliberately left unchanged pending a separate access-model review.
4. Added baseline Vercel headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, and a restrictive `Permissions-Policy` limited to same-origin camera, microphone, and geolocation.
5. Added a server-only Supabase fixed-window rate-limit bucket/RPC. Client roles have no table access and cannot execute the limiter RPC.
6. Added `api/secure-ai-gateway.js`, which places global emergency request ceilings in front of the legacy unauthenticated OpenAI routes without changing their submitted-client request contract.
7. Updated `vercel.json` so `/api/ari-intent-router`, `/api/ask-calbuddy`, `/api/knowledge`, and direct `/api/usage?mode=knowledge` traffic route through the compatibility-safe abuse gateway on deployments containing this commit.
8. Added `api/_lib/ai-rate-limit.js` as infrastructure for future authenticated per-user AI limits.
9. Recorded this audit in-repo so future security work remains reproducible.

## Deployment state
- Supabase database migrations above were applied directly to the active project.
- The latest `main` Vercel preview containing the security gateway and rewrites builds successfully and is READY.
- The custom production domain is still pinned to an older promoted Vercel deployment, so Vercel-only changes are not considered production-live until that newer deployment is deliberately promoted.

## Important remaining work
1. Update the native clients for `/api/ari-intent-router` and `/api/knowledge` to send the signed-in Supabase bearer token, then make bearer authentication mandatory server-side in a later native build. The compatibility gateway reduces abuse risk in the meantime but is not equivalent to authentication.
2. Enable leaked-password protection in Supabase Auth if the current plan supports it.
3. Review Supabase Auth rate limits/CAPTCHA before broad public launch.
4. Continue RPC-by-RPC authorization tests, especially object ownership, cohort checks, parameter bounds, and admin functions.
5. Add authenticated per-user rate limits to expensive image/AI endpoints after confirming desired product quotas.
6. Review `vector`, `citext`, and `pg_net` extension placement separately; do not move production extensions without dependency testing.
7. Re-run Supabase Security Advisor after each database migration.

## Do not do blindly
- Do not revoke authenticated EXECUTE from all SECURITY DEFINER functions; many are the app's intentional RPC surface and doing so would break Circle, messages, challenges, account controls, and owner moderation.
- Do not add a strict Content-Security-Policy without inventorying inline scripts/styles, Supabase, Google Fonts, blob/data media, and native-wrapper behavior.
- Do not force mandatory bearer auth onto legacy AI routes until the submitted native client is updated to send the token.
- Do not move or alter Supabase extensions in production without dependency testing.
