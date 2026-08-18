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
- OpenAI credentials are server-side and ordinary ARI conversation requests require a valid Supabase session.
- Supabase Security Advisor reports leaked-password protection disabled (dashboard/plan setting).
- Supabase Security Advisor reports many authenticated-callable SECURITY DEFINER RPCs. Most inspected functions explicitly validate auth.uid(), cohort rules, ownership, or admin status. These are intentional application RPCs and must remain callable when required by the client.
- Legacy `ari_circle_challenge_submit_entry` delegates to the guarded v3 implementation but does not authenticate before its preliminary challenge lookup. This will be hardened.
- Vercel did not have a centralized set of baseline response security headers in `vercel.json`; low-risk headers will be added without introducing a strict CSP that could break existing app assets/auth flows.

## Do not do blindly
- Do not revoke authenticated EXECUTE from all SECURITY DEFINER functions; many are the app's intentional RPC surface and doing so would break Circle, messages, challenges, account controls, and owner moderation.
- Do not add a strict Content-Security-Policy without inventorying inline scripts/styles, Supabase, Google Fonts, OpenAI/server routes, blob/data media, and native-wrapper behavior.
- Do not move or alter Supabase extensions in production without dependency testing.

## Next hardening passes
1. Harden legacy challenge-entry wrapper authentication.
2. Add baseline Vercel headers.
3. Audit each privileged RPC for caller binding, object ownership, cohort enforcement, parameter bounds, and search_path.
4. Add application-level abuse controls for costly AI/image endpoints.
5. Enable leaked-password protection if the Supabase plan supports it; otherwise strengthen password rules/CAPTCHA and monitor auth abuse.
6. Re-run Supabase Security Advisor after each database migration.
