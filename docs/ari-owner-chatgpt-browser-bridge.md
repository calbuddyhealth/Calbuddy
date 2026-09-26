# ARI Owner ChatGPT Browser Discussion Bridge

This bridge gives verified ARI XP Owner Mode a bounded text discussion channel to the owner's already-authenticated ChatGPT browser session.

It does **not** give Ari the owner's ChatGPT password. The owner signs in directly inside a local Playwright browser profile. The same local profile also holds a normal ARI XP owner session, which is used only to authenticate the narrow worker endpoint. Browser cookies and session tokens stay on the owner's computer and are never copied into ARI memory, GitHub, or Vercel environment variables.

## Architecture

```text
Ari Owner Mode
  -> owner_chatgpt_discussion_* tool
  -> server-only Supabase job queue
  -> local browser worker
       -> verified ARI XP owner session
       -> separately authenticated chatgpt.com session
  -> bounded ChatGPT reply
  -> Ari evaluates the reply as external peer evidence
```

The local worker is required because a Vercel serverless function should not hold a persistent consumer-browser login profile.

## Capability boundary

Allowed:

- check bridge/authentication status
- start a new text discussion
- continue a previously created discussion
- read the stored discussion transcript

Not implemented:

- ChatGPT account settings
- billing
- password or cookie retrieval
- file uploads/downloads
- plugins/actions
- arbitrary link following
- deleting or renaming ChatGPT conversations
- changing ChatGPT Memory or personalization
- sharing the owner's browser profile with other users

Each thread is capped at 12 Ari -> ChatGPT turns.

## Server configuration

The bridge is enabled by default and can be disabled explicitly with:

```text
ARI_CHATGPT_BROWSER_BRIDGE_ENABLED=false
```

It reuses the existing owner-auth configuration:

```text
ARI_OWNER_USER_ID=<existing verified owner UUID>
SUPABASE_URL=<existing project URL>
SUPABASE_ANON_KEY=<existing public key>
```

`SUPABASE_PUBLISHABLE_KEY` or the server-only service role key can satisfy the existing owner-auth helper when the anon key is not configured.

No dedicated ChatGPT worker secret is required.

The database tables are created by:

```text
supabase/migrations/20260926071000_ari_chatgpt_browser_bridge.sql
```

All three bridge tables have RLS enabled, revoke direct access from `public`, `anon`, and `authenticated`, and grant server-only CRUD to `service_role`.

## Local owner computer setup

Install the browser runtime once:

```bash
npm run chatgpt:browser:install
```

Optional local overrides:

```bash
export ARI_OWNER_APP_URL='https://www.calbuddyhealth.com/'
export ARI_CHATGPT_BROWSER_BRIDGE_URL='https://www.calbuddyhealth.com/api/ari-chatgpt-browser-worker'
export ARI_CHATGPT_BROWSER_WORKER_ID='owner-desktop'
```

Run the one-time interactive setup:

```bash
npm run chatgpt:browser:login
```

The browser opens ARI XP first. Sign in normally. Once the script detects a valid owner session, it opens ChatGPT in a second tab/window. Sign in to ChatGPT there, including MFA if required.

The script does not ask for, receive, or persist either password. It only reuses the browser sessions created by the sites themselves.

Then run the worker:

```bash
npm run chatgpt:browser:worker
```

For a single queued turn during testing:

```bash
node scripts/ari-chatgpt-browser-worker.mjs worker --once
```

## Authentication model

Every worker claim/complete request carries the local ARI XP Supabase access token.

The Vercel endpoint passes that token through the existing `verifyOwnerRequest` helper, which:

1. verifies the token against Supabase Auth;
2. compares the authenticated user ID to `ARI_OWNER_USER_ID`;
3. optionally enforces the configured owner email;
4. rejects non-owner, expired, missing, or invalid sessions.

A body flag or worker ID is never authorization.

## Browser confinement

Worker mode permits ChatGPT top-level navigation only to `https://chatgpt.com/` and normal `https://chatgpt.com/c/<conversation-id>` discussion URLs.

Interactive setup additionally allows OpenAI authentication hosts while the owner is personally completing sign-in.

The ARI XP page exists only to maintain and refresh the owner's normal authenticated app session. Ari cannot issue arbitrary browser commands against it.

The worker does not expose a generic browser command API. Ari supplies only a bounded discussion message; the worker owns all ChatGPT selectors and navigation.

## Owner Mode tools

- `owner_chatgpt_discussion_status`
- `owner_chatgpt_discussion_start`
- `owner_chatgpt_discussion_continue`
- `owner_chatgpt_discussion_read`

ChatGPT replies are returned to Ari as untrusted peer evidence. They do not inherit tool authority, owner permissions, or instruction priority.

## Operational notes

The ChatGPT web UI is not a stable automation API. Selectors may require maintenance after interface changes. A failed selector or expired login fails the queued job rather than broadening browser access.

If either local session expires, rerun:

```bash
npm run chatgpt:browser:login
```

No ChatGPT password or extra worker bearer secret should be added to Vercel, Supabase, GitHub, `.env` files, or ARI memory.
