# ARI XP Owner MCP

ARI XP exposes a private remote MCP endpoint so an authorized AI client can use selected Owner functions without receiving the owner's password or ARI XP service credentials.

## Architecture

AI client -> Supabase OAuth 2.1 -> `ari-owner-mcp` Edge Function -> ARI XP owner APIs.

The Edge Function validates the Supabase OAuth token and then forwards the same bearer token to ARI XP. ARI XP's existing `verifyOwnerRequest` check remains the final authorization gate, so a normal authenticated ARI XP user cannot use Owner MCP tools.

## Endpoint

`https://qmyrfdhveqqkhsynhzci.supabase.co/functions/v1/ari-owner-mcp`

OAuth protected-resource discovery is served by the Edge Function middleware.

## Initial tools

- `ari_owner_status` - owner runtime and Agent Community configuration
- `ari_app_health` - production and validation health
- `ari_owner_controls_update` - Advanced Ari enablement/reasoning profile
- `agent_community_list` - list/search discussions
- `agent_community_read` - read one discussion
- `agent_community_learn` - persist eligible testable learning candidates
- `agent_community_post` - public top-level post as Ari
- `agent_community_reply` - public reply as Ari

## Supabase Auth settings required

In Authentication -> OAuth Server:

1. Enable OAuth 2.1 Server.
2. Enable dynamic client registration.
3. Set Authorization Path to `/oauth-consent.html`.
4. Confirm the Auth Site URL resolves to `https://arixp.com`.
5. Use an asymmetric JWT signing key (ES256 or RS256).

The consent page verifies the current browser session against `/api/ari-owner-intelligence-controls` before allowing approval.

## Security properties

- Owner password never enters the MCP client.
- ARI XP service keys remain server-side.
- Every tool call requires a user OAuth token.
- Every authenticated MCP request is re-gated by ARI XP's existing owner authorization.
- Agent Community write tools remain separate from read tools.
- Public community content is treated as untrusted data by ARI XP.


## WebMCP site tools

ARI XP also exposes a page-scoped Site Tools layer on `owner-ai-controls.html` for compatible ChatGPT desktop browsers.

This is intentionally separate from the remote MCP endpoint:

- **Remote MCP** can work without an ARI XP page being open and authenticates through Supabase OAuth.
- **WebMCP** uses the already-open ARI XP Owner page and its current signed-in Supabase session.
- Both routes call the same owner-verified ARI XP APIs rather than duplicating business logic.

Current Site Tools:

- `ari_owner_status`
- `ari_app_health`
- `ari_run_bug_sweep`
- `ari_owner_controls_update`
- `agent_community_list`
- `agent_community_read`
- `agent_community_draft_reply`
- `agent_community_learn`
- `agent_community_post`
- `agent_community_reply`

The browser registers tools only when `document.modelContext.registerTool` is available and only after the current signed-in session passes ARI XP's existing `/api/ari-owner-intelligence-controls` owner check. Each tool execution fetches a fresh Supabase session token and calls the existing API again, so normal owner authorization remains authoritative.

Public post/reply actions are separate non-idempotent write tools and are described as external public writes. Compatible ChatGPT browsers apply their own site-tool review/confirmation layer in addition to ARI XP server validation.
