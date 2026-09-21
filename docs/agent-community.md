# Agent Community owner channel

The Owner Control Center (`owner-ai-controls.html`) can list/search public threads,
open a thread, refresh its replies, ask Ari for a draft, and publish reviewed text.
All endpoint operations require the existing server-verified owner identity.

## Configuration

Set `ARI_AGENT_COMMUNITY_API_KEY` as a **server-only sensitive Vercel environment
variable** using the existing Ari Agent Community account. Do not register a second
identity, put the key in client JavaScript, or commit it. Redeploy after setting it.
The existing Supabase owner authorization and OpenAI settings are also required.
Reads work without a Community key; publishing fails closed without one.

Drafting uses Ari's shared persona and existing owner model/entitlement settings,
with provider usage recorded in the existing ledger. Only the selected public
discussion and the owner's writing direction enter the model input. This dedicated
channel does not load private user memories, health records, or chat history.

## Behavior and limits

- Publishing is an explicit button action with the complete editable reply visible.
- No background scanning, auto-replies, new top-level posts, or DMs are enabled.
- There are no automatic write retries. On an uncertain response, refresh and check
  the discussion before sending again; the upstream API does not document idempotency.
- External content is rendered as text and has no code-execution path.
- Thread input is restricted to `agent-community.com/posts/p_…` or a post ID.
  Transport uses a fixed origin and rejects redirects, including on authenticated writes.
- Long discussions show bounded excerpts, with a visible truncation notice.
- Drafts are suggestions, not installed skills. Shared code, workflow instructions,
  or tool offers need separate review, tests, and deployment before becoming abilities.
- This channel shares Ari's voice/model selection, not her complete private cognitive
  state. It does not train model weights or silently store community claims as memory.


## Learning from discussions

Owner mode can explicitly choose **Analyze for learning** on a loaded discussion.

This does not create a second learning architecture. The Agent Community adapter feeds Ari's existing vNext learning systems:

- transferable process lessons enter the Adaptive Strategy Layer as `testing` challengers only;
- high-value unresolved ideas can enter persistent Curiosity as Ari-owned research questions;
- scheduled Autonomy may later investigate eligible Curiosity questions using its existing isolated-branch rules;
- strategy adoption and practical-prior maturation still require Ari's existing outcome evidence and repeated trials.

Public discussion text remains untrusted third-party data. A community post cannot directly install a skill, grant a permission, edit production, change Ari's constitutional boundaries, or become a verified fact. Agreement between multiple agents is not treated as independent evidence by itself.

The learning adapter stores compact provenance such as thread ID, public thread URL, author, evidence-quality estimate, and the model that distilled the candidate. It does not store hidden chain-of-thought or silently copy the full public discussion into Ari's private memory.

## Verification

Run `node --test tests/ari-agent-community.test.mjs tests/ari-owner-auth.test.mjs`.
After deployment, sign in as the owner, open the existing culture discussion,
read the existing Ari reply, and generate a draft. Publish only a real intended
message; do not use the public board for test posts.
