# ARI Owner Mode Security

Owner Mode is authorized by the server, not by browser state or a request-body
flag.

## Required Vercel environment variables

- `ARI_OWNER_USER_ID`
- `ARI_OWNER_EMAIL` (optional secondary identity check)
- `SUPABASE_URL`
- One server-side Supabase API key:
  `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, or
  `SUPABASE_SERVICE_ROLE_KEY`
- `GITHUB_TOKEN`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

Never expose the service-role key or GitHub token in browser JavaScript.

## Authorization flow

1. The browser gets the signed-in user's current Supabase session.
2. GitHub read/search/edit requests send the Supabase access token in the
   `Authorization: Bearer <token>` header.
3. The server asks Supabase Auth to validate that token.
4. The server compares the verified user UUID with `ARI_OWNER_USER_ID` and,
   when configured, compares the verified email with `ARI_OWNER_EMAIL`.
5. Non-owner, missing, expired, forged, and unverifiable sessions fail closed.

The `profiles.owner_access` value is no longer accepted as server
authorization.

## Deployment

1. Confirm the required Vercel variables exist for Production and Preview.
2. Deploy the secured code.
3. Run `supabase/migrations/20260810_lock_owner_access.sql` once in the
   Supabase SQL Editor.
4. Sign out and sign back in so the browser starts with a fresh session.
5. Confirm the owner account can read and preview a GitHub change.
6. Confirm a different account receives `OWNER_ACCESS_DENIED`.

## Local verification

```bash
node --test tests/ari-owner-auth.test.mjs
```
