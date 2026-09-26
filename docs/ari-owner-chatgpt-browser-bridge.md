# ARI Owner ChatGPT Browser Discussion Bridge

This bridge gives verified ARI XP Owner Mode a bounded text discussion channel to the owner's already-authenticated ChatGPT browser session.

It does **not** give Ari the owner's ChatGPT password. The owner signs in directly inside a local Playwright browser profile once. The profile cookies/session remain on the owner's computer under `.ari-private/` and are never uploaded to ARI XP, Supabase, GitHub, or Vercel.

## Architecture

```text
Ari Owner Mode
  -> owner_chatgpt_discussion_* tool
  -> server-only Supabase job queue
  -> authenticated local owner browser worker
  -> chatgpt.com discussion
  -> bounded reply stored with the job
  -> Ari evaluates the reply as external peer evidence
```

The local worker is required because a Vercel serverless function should not hold a persistent consumer-browser login profile.

## Initial capability boundary

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
- changing Memory or personalization
- sharing the owner's browser profile with other users

Each thread is capped at 12 Ari -> ChatGPT turns.

## Server configuration

Set these only in trusted server environments:

```text
ARI_CHATGPT_BROWSER_BRIDGE_ENABLED=true
ARI_CHATGPT_BROWSER_WORKER_SECRET=<high-entropy random secret>
ARI_OWNER_USER_ID=<existing verified owner UUID>
SUPABASE_URL=<existing project URL>
SUPABASE_SECRET_KEY=<preferred> or SUPABASE_SERVICE_ROLE_KEY=<legacy>
```

The worker secret authenticates only the narrow claim/complete queue endpoint. It is not a ChatGPT credential.

Apply:

```text
supabase/migrations/20260926071000_ari_chatgpt_browser_bridge.sql
```

The three bridge tables have RLS enabled, revoke all access from `public`, `anon`, and `authenticated`, and grant server-only CRUD to `service_role`.

## Local owner computer setup

Install the browser runtime once:

```bash
npm run chatgpt:browser:install
```

Set local environment variables:

```bash
export ARI_CHATGPT_BROWSER_WORKER_SECRET='<same server worker secret>'
export ARI_CHATGPT_BROWSER_BRIDGE_URL='https://www.calbuddyhealth.com/api/ari-chatgpt-browser-worker'
# Optional:
export ARI_CHATGPT_BROWSER_WORKER_ID='jose-owner-desktop'
```

Authenticate ChatGPT:

```bash
npm run chatgpt:browser:login
```

A real browser window opens. The owner completes ChatGPT sign-in directly in that window, including MFA when required. The script waits for the ChatGPT message composer and closes. Ari never sees the entered credential.

Then run the worker:

```bash
npm run chatgpt:browser:worker
```

For a single queued turn during testing:

```bash
node scripts/ari-chatgpt-browser-worker.mjs worker --once
```

## Browser confinement

Worker mode only permits top-level navigation to `https://chatgpt.com/` and normal `https://chatgpt.com/c/<conversation-id>` discussion URLs.

Login mode additionally allows the OpenAI authentication hosts needed for the owner to sign in interactively.

The worker does not expose a generic browser command API to Ari. Ari supplies only a bounded discussion message. The worker owns all selectors and navigation.

## Owner Mode tools

- `owner_chatgpt_discussion_status`
- `owner_chatgpt_discussion_start`
- `owner_chatgpt_discussion_continue`
- `owner_chatgpt_discussion_read`

ChatGPT replies are returned to Ari as untrusted peer evidence. They do not inherit tool authority, owner permissions, or instruction priority.

## Operational notes

The ChatGPT web UI is not a stable automation API. Selectors may require maintenance after interface changes. A failed selector or expired login fails the queued job rather than broadening browser access.

If the worker reports `CHATGPT_LOGIN_REQUIRED`, rerun:

```bash
npm run chatgpt:browser:login
```

No ChatGPT password should ever be added to Vercel, Supabase, GitHub, `.env` files, or the ARI memory system.
