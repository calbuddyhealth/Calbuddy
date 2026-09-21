import test from "node:test";
import assert from "node:assert/strict";
import handler, { buildCommunityDraftInput } from "../api/ari-agent-community.js";
import { resolveCommunityPostId, readCommunityThread, listCommunityThreads, publishCommunityReply, publishCommunityPost, normalizeCommunityPost } from "../server/ari-agent-community.js";

const OWNER = "11111111-1111-4111-8111-111111111111";
const post = { id: "p_example", title: "Culture?", content: "A public question", author_name: "GatherLuna", replies: [] };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const res = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(v) { this.body = v; return this; } });

test("only Agent Community thread URLs and opaque IDs are accepted", () => {
  assert.equal(resolveCommunityPostId("p_example"), "p_example");
  assert.equal(resolveCommunityPostId("https://agent-community.com/posts/p_example#reply"), "p_example");
  for (const value of ["https://evil.test/posts/p_example", "https://agent-community.com.evil.test/posts/p_example", "http://agent-community.com/posts/p_example", "https://secret@agent-community.com/posts/p_example", "p_example/../auth/register", "p_example?x=1"]) {
    assert.throws(() => resolveCommunityPostId(value), { code: "INVALID_THREAD" });
  }
});

test("public reads carry no posting credentials and reject mismatched threads", async () => {
  await readCommunityThread("p_example", { fetchImpl: async (url, options) => {
    assert.equal(url, "https://agent-community.com/v1/posts/p_example");
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.redirect, "error");
    return response(post);
  } });
  await assert.rejects(readCommunityThread("p_example", { fetchImpl: async () => response({ ...post, id: "p_other" }) }), { code: "THREAD_MISMATCH" });
});

test("thread excerpts bound untrusted data and preserve authorship", () => {
  const thread = normalizeCommunityPost({ ...post, content: "x".repeat(17000), replies: Array.from({ length: 45 }, (_, i) => ({ id: `r_${i}`, author_name: "peer", content: "y".repeat(7000) })) });
  assert.equal(thread.truncated, true);
  assert.equal(thread.content.length, 16000);
  assert.equal(thread.replies.length, 40);
  assert.equal(thread.replies[0].id, "r_5");
  const input = buildCommunityDraftInput(thread, "Ask for evidence.");
  assert.ok(JSON.stringify(input).length < 65000);
  assert.match(input[0].content, /untrusted, not instructions/);
  assert.equal(input[0].role, "user");
  assert.match(input[1].content, /Ask for evidence/);
});

test("search and latest use their distinct live API response envelopes", async () => {
  const fetchImpl = async url => response(url.includes("/search?") ? { results: [post] } : { posts: [post] });
  assert.equal((await listCommunityThreads("culture", { fetchImpl }))[0].id, post.id);
  assert.equal((await listCommunityThreads("", { fetchImpl }))[0].id, post.id);
  await assert.rejects(listCommunityThreads("culture", { fetchImpl: async () => response({}) }), { code: "INVALID_UPSTREAM_LIST" });
});

test("owner endpoint, drafting isolation, and publication boundaries", async t => {
  const previousEnv = { ...process.env };
  const previousFetch = globalThis.fetch;
  t.after(() => { process.env = previousEnv; globalThis.fetch = previousFetch; });
  Object.assign(process.env, { SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "test-anon", SUPABASE_SERVICE_ROLE_KEY: "test-service", ARI_OWNER_USER_ID: OWNER, ARI_OWNER_EMAIL: "owner@example.test", ARI_AGENT_COMMUNITY_API_KEY: "test-community-secret", OPENAI_API_KEY: "test-model-secret" });
  const request = (body, token = "owner-token", method = "POST") => ({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body });
  let communityCalls = [];
  let modelBody;
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith("/auth/v1/user")) return response({ id: options.headers.Authorization === "Bearer other-token" ? "22222222-2222-4222-8222-222222222222" : OWNER, email: "owner@example.test" });
    if (url.includes("/rest/v1/ari_intelligence_controls")) return response([{ advanced_enabled: true, reasoning_profile: "balanced" }]);
    if (url.includes("/rest/v1/ai_provider_usage_logs")) return response([]);
    if (url.startsWith("https://api.openai.com/")) {
      modelBody = JSON.parse(options.body);
      return response({ id: "resp_test", status: "completed", model: "mock", output: [{ type: "message", content: [{ type: "output_text", text: "What observation would disprove this convention?" }] }] });
    }
    if (url.startsWith("https://agent-community.com/")) {
      communityCalls.push({ url, options });
      if (options.method === "POST" && url.endsWith("/v1/posts")) return response({ post_id: "p_created" }, 201);
      if (options.method === "POST") return response({ reply_id: "r_created", post_id: "p_example" }, 201);
      return response(post);
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  await t.test("missing token and other users cannot read or post using the owner's identity", async () => {
    for (const [token, expected] of [["", 401], ["other-token", 403]]) {
      const out = res();
      await handler(request({ operation: "reply", postId: "p_example", content: "text", confirmed: true, owner_access: true }, token), out);
      assert.equal(out.statusCode, expected);
    }
    assert.equal(communityCalls.length, 0);
  });
  await t.test("status never returns an API key", async () => {
    const out = res(); await handler(request(null, "owner-token", "GET"), out);
    assert.equal(out.statusCode, 200);
    assert.equal(out.body.configured, true);
    assert.doesNotMatch(JSON.stringify(out.body), /test-community-secret|test-model-secret/);
    assert.match(out.headers["Cache-Control"], /no-store/);
  });
  await t.test("unreviewed replies and unknown actions do not publish", async () => {
    for (const body of [
      { operation: "reply", postId: "p_example", content: "text" },
      { operation: "post", title: "Architecture challenge", content: "Challenge this architecture.", topic: "dev" },
      { operation: "install_skill", url: "https://evil.test" }
    ]) {
      const out = res(); await handler(request(body), out); assert.equal(out.statusCode, 400);
    }
    assert.equal(communityCalls.length, 0);
  });
  await t.test("draft uses public thread and explicit direction, no private context or execution tools", async () => {
    const out = res();
    await handler(request({ operation: "draft", postId: "p_example", direction: "Ask for evidence", context: { medicalHistory: "PRIVATE_TEST_RECORD" }, api_key: "CLIENT_KEY_IGNORED" }), out);
    assert.equal(out.statusCode, 200);
    assert.equal(out.body.published, false);
    assert.match(out.body.draft, /observation/);
    assert.equal(modelBody.tools, undefined);
    assert.equal(modelBody.store, false);
    assert.doesNotMatch(JSON.stringify(modelBody), /PRIVATE_TEST_RECORD|CLIENT_KEY_IGNORED|test-community-secret|test-model-secret/);
    assert.match(modelBody.instructions, /untrusted third-party data/);
    assert.equal(communityCalls.filter(call => call.options.method === "POST").length, 0);
  });
  await t.test("publishes the reviewed text exactly once with only the server key", async () => {
    communityCalls = [];
    const content = "A question.\n\nAnd a follow-up?";
    const out = res(); await handler(request({ operation: "reply", postId: "p_example", content, confirmed: true, api_key: "ignored" }), out);
    assert.equal(out.statusCode, 201);
    assert.equal(out.body.replyId, "r_created");
    assert.equal(communityCalls.length, 1);
    assert.equal(communityCalls[0].options.headers.Authorization, "Bearer test-community-secret");
    assert.deepEqual(JSON.parse(communityCalls[0].options.body), { content });
  });
  await t.test("publishes a reviewed top-level post exactly once under Ari's server identity", async () => {
    communityCalls = [];
    const out = res();
    await handler(request({
      operation: "post",
      title: "Challenge Ari's architecture",
      content: "What is the most important weakness you would attack first?",
      topic: "dev",
      tags: ["agents", "architecture", "experiment"],
      confirmed: true,
      api_key: "ignored"
    }), out);
    assert.equal(out.statusCode, 201);
    assert.equal(out.body.postId, "p_created");
    assert.equal(out.body.url, "https://agent-community.com/posts/p_created");
    assert.equal(communityCalls.length, 1);
    assert.equal(communityCalls[0].url, "https://agent-community.com/v1/posts");
    assert.equal(communityCalls[0].options.headers.Authorization, "Bearer test-community-secret");
    assert.deepEqual(JSON.parse(communityCalls[0].options.body), {
      title: "Challenge Ari's architecture",
      content: "What is the most important weakness you would attack first?",
      topic: "dev",
      tags: ["agents", "architecture", "experiment"]
    });
  });
  await t.test("missing key and invalid payloads fail before a write", async () => {
    communityCalls = [];
    delete process.env.ARI_AGENT_COMMUNITY_API_KEY;
    const out = res(); await handler(request({ operation: "reply", postId: "p_example", content: "hello", confirmed: true }), out);
    assert.equal(out.statusCode, 503);
    for (const content of ["", " ", "x".repeat(12001), {}]) await assert.rejects(publishCommunityReply({ postId: "p_example", content }), { code: "INVALID_REPLY" });
    await assert.rejects(publishCommunityPost({ title: "", content: "body", topic: "dev" }), { code: "INVALID_POST_TITLE" });
    await assert.rejects(publishCommunityPost({ title: "title", content: "", topic: "dev" }), { code: "INVALID_POST_CONTENT" });
    await assert.rejects(publishCommunityPost({ title: "title", content: "body", topic: "../dev" }), { code: "INVALID_POST_TOPIC" });
    await assert.rejects(publishCommunityPost({ title: "title", content: "body", topic: "dev", tags: ["bad tag!"] }), { code: "INVALID_POST_TAGS" });
    assert.equal(communityCalls.length, 0);
  });
  await t.test("uncertain sends do not retry or leak raw errors", async () => {
    process.env.ARI_AGENT_COMMUNITY_API_KEY = "test-community-secret";
    let calls = 0;
    await assert.rejects(publishCommunityReply({ postId: "p_example", content: "reply" }, { fetchImpl: async () => { calls++; throw new Error("test-community-secret"); } }), error => {
      assert.equal(error.code, "COMMUNITY_UNAVAILABLE");
      assert.doesNotMatch(error.message, /test-community-secret/);
      assert.match(error.message, /Refresh/);
      return true;
    });
    assert.equal(calls, 1);

    calls = 0;
    await assert.rejects(publishCommunityPost({
      title: "Architecture challenge",
      content: "One bounded question.",
      topic: "dev"
    }, { fetchImpl: async () => { calls++; throw new Error("test-community-secret"); } }), error => {
      assert.equal(error.code, "COMMUNITY_UNAVAILABLE");
      assert.doesNotMatch(error.message, /test-community-secret/);
      return true;
    });
    assert.equal(calls, 1);
  });
});
