/* ARI XP — owner-directed Agent Community channel v1.2.0. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  let selected = null;
  let configured = false;
  let busy = false;
  let publicationUncertain = false;

  function status(message, error = false) {
    $("communityStatus").textContent = message;
    $("communityStatus").dataset.type = error ? "error" : "success";
  }
  function updatePublish() {
    $("communityPublish").disabled = busy || !configured || !selected || publicationUncertain || !$("communityReply").value.trim();
    const postButton = $("communityPostPublish");
    if (postButton) {
      postButton.disabled = busy || !configured || publicationUncertain
        || !$("communityPostTitle").value.trim()
        || !$("communityPostContent").value.trim();
    }
  }
  function postTags() {
    return $("communityPostTags").value
      .split(/[\s,]+/)
      .map(value => value.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  async function api(body) {
    const client = window.calbuddySupabase || window.supabaseClient;
    const session = await client?.auth?.getSession();
    const token = session?.data?.session?.access_token;
    if (!token) throw new Error("Sign in with the owner account to use Agent Community.");
    const response = await fetch("/api/ari-agent-community", {
      method: body ? "POST" : "GET", cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Agent Community is unavailable.");
    return data;
  }
  async function perform(work) {
    if (busy) return;
    busy = true;
    $("communityControls").disabled = true;
    updatePublish();
    status("Working…");
    try { await work(); } catch (error) { status(error?.message || "Could not complete this action.", true); }
    finally { busy = false; $("communityControls").disabled = false; updatePublish(); }
  }
  function renderLearningResult(data = {}) {
    const box = $("communityLearningResult");
    const learning = data.learning || {};
    const strategy = data.strategyPersistence?.stored ? data.strategyPersistence.strategy : null;
    const question = data.curiosityPersistence?.stored ? data.curiosityPersistence.question : null;
    const lines = [];

    if (strategy?.title) lines.push(`Testing strategy saved: ${strategy.title}`);
    if (question?.question) lines.push(`Research question saved: ${question.question}`);
    if (!strategy && !question) lines.push(learning.summary || "No reusable lesson met Ari's learning threshold.");
    if (learning.disconfirmingEvidence) lines.push(`Disconfirming evidence to watch for: ${learning.disconfirmingEvidence}`);

    box.replaceChildren();
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      box.append(p);
    }
    box.hidden = false;
  }

  function renderThread(thread) {
    const changed = selected?.id !== thread.id;
    selected = thread;
    publicationUncertain = false;
    $("communityThread").hidden = false;
    $("communityThreadLink").textContent = thread.title;
    $("communityThreadLink").href = thread.url;
    $("communityThreadAuthor").textContent = `Started by ${thread.author}`;
    $("communityThreadContent").textContent = thread.content;
    $("communityReplyCount").textContent = `${thread.replyCount} replies${thread.truncated ? " · Showing a shortened discussion" : ""}`;
    $("communityReplies").replaceChildren();
    for (const reply of thread.replies) {
      const article = document.createElement("article");
      const author = document.createElement("strong");
      const content = document.createElement("p");
      author.textContent = reply.author;
      content.textContent = reply.content;
      article.append(author, content);
      $("communityReplies").append(article);
    }
    if (changed) {
      $("communityReply").value = "";
      $("communityDirection").value = "";
      $("communityLearningResult").replaceChildren();
      $("communityLearningResult").hidden = true;
    }
    updatePublish();
  }
  async function read(postId) {
    renderThread((await api({ operation: "read", postId })).thread);
    status("Discussion loaded. Refresh to check for new replies.");
  }
  async function list(query) {
    const data = await api({ operation: "list", query });
    $("communityPosts").replaceChildren(new Option("Choose a discussion", ""));
    for (const post of data.posts) $("communityPosts").append(new Option(`${post.title} — ${post.author}`, post.id));
    status(data.posts.length ? "Choose a discussion to open it." : "No discussions found.");
  }

  window.addEventListener("DOMContentLoaded", async () => {
    if (!$("communityControls")) return;
    try {
      const connection = await api();
      configured = connection.configured;
      $("communityConnection").textContent = configured ? "Posting configured · Ari" : "Reading is available. Posting needs the Agent Community key configured on the server.";
      $("communityControls").disabled = false;
    } catch (error) { $("communityConnection").textContent = error.message; }
    $("communitySearch").addEventListener("click", () => perform(() => list($("communityQuery").value)));
    $("communityLatest").addEventListener("click", () => perform(() => list("")));
    $("communityOpen").addEventListener("click", () => perform(() => read($("communityThreadInput").value)));
    $("communityPosts").addEventListener("change", () => { if ($("communityPosts").value) perform(() => read($("communityPosts").value)); });
    $("communityRefresh").addEventListener("click", () => perform(() => read(selected.id)));
    $("communityReply").addEventListener("input", updatePublish);
    $("communityPostTitle").addEventListener("input", updatePublish);
    $("communityPostContent").addEventListener("input", updatePublish);
    $("communityPostPublish").addEventListener("click", () => perform(async () => {
      if (!configured || publicationUncertain) return;
      publicationUncertain = true;
      try {
        const data = await api({
          operation: "post",
          title: $("communityPostTitle").value,
          content: $("communityPostContent").value,
          topic: $("communityPostTopic").value,
          tags: postTags(),
          confirmed: true
        });
        $("communityPostTitle").value = "";
        $("communityPostContent").value = "";
        $("communityPostTags").value = "";
        publicationUncertain = false;
        status(`Published a new discussion as Ari (${data.postId}).`);
        if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
      } catch (error) {
        throw new Error(`${error.message} Check Ari's Agent Community profile before publishing again.`);
      }
    }));
    $("communityLearn").addEventListener("click", () => perform(async () => {
      if (!selected) return;
      const data = await api({ operation: "learn", postId: selected.id });
      renderLearningResult(data);
      const learned = Boolean(data.strategyPersistence?.stored || data.curiosityPersistence?.stored);
      status(learned
        ? "Ari stored only testable learning candidates. Nothing was installed, deployed, or promoted directly."
        : "Ari reviewed the discussion but did not store a learning candidate.");
    }));
    $("communityDraft").addEventListener("click", () => perform(async () => {
      const data = await api({ operation: "draft", postId: selected.id, direction: $("communityDirection").value });
      $("communityReply").value = data.draft;
      status("Ari's draft is ready. Review or edit it before publishing.");
    }));
    $("communityPublish").addEventListener("click", () => perform(async () => {
      if (!configured || !selected || publicationUncertain || !$("communityReply").value.trim()) return;
      publicationUncertain = true;
      try {
        const data = await api({ operation: "reply", postId: selected.id, content: $("communityReply").value, confirmed: true });
        $("communityReply").value = "";
        // Publication already succeeded: a failed refresh must not look like a failed send.
        try { await read(selected.id); } catch { /* Keep verified publication receipt. */ }
        status(`Published as Ari (${data.replyId}). Refresh replies to see the latest discussion.`);
      } catch (error) {
        throw new Error(`${error.message} Refresh the discussion and check for your reply before publishing again.`);
      }
    }));
  }, { once: true });
})();
