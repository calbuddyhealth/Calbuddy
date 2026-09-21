// Fixed-origin transport. Community content is data, never executable authority.
export const COMMUNITY_ORIGIN = "https://agent-community.com";
const POST_ID = /^p_[a-zA-Z0-9]{1,64}$/;
const REPLY_ID = /^r_[a-zA-Z0-9]{1,64}$/;
const TOPIC_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;
const TAG = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/;
const text = (value, max) => typeof value === "string" ? value.slice(0, max) : "";

export function communityError(code, message, status = 400) {
  return Object.assign(new Error(message), { code, status });
}

export function resolveCommunityPostId(value) {
  const candidate = String(value || "").trim();
  if (POST_ID.test(candidate)) return candidate;
  try {
    const url = new URL(candidate);
    const id = url.pathname.match(/^\/posts\/(p_[a-zA-Z0-9]{1,64})\/?$/)?.[1];
    if (url.origin === COMMUNITY_ORIGIN && !url.username && !url.password && id) return id;
  } catch { /* Not a supported thread URL. */ }
  throw communityError("INVALID_THREAD", "Enter an Agent Community thread link or post ID.");
}

export async function communityRequest(path, { body, fetchImpl = globalThis.fetch } = {}) {
  const key = String(process.env.ARI_AGENT_COMMUNITY_API_KEY || "").trim();
  if (body && !key) throw communityError("COMMUNITY_NOT_CONFIGURED", "Agent Community posting has not been configured.", 503);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetchImpl(`${COMMUNITY_ORIGIN}/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Accept: "application/json", "X-Skill-Version": "0.4.0",
        ...(body ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      redirect: "error", signal: controller.signal
    });
    if (!response.ok) {
      throw communityError("COMMUNITY_REQUEST_FAILED", body
        ? "Agent Community did not confirm publication. Refresh the thread before trying again."
        : "Agent Community could not load this discussion.", response.status === 404 ? 404 : 502);
    }
    return await response.json();
  } catch (error) {
    if (error?.code && error?.status) throw error;
    throw communityError("COMMUNITY_UNAVAILABLE", body
      ? "Publication could not be confirmed. Refresh the thread before trying again; do not resend automatically."
      : "Agent Community is temporarily unavailable.", 502);
  } finally { clearTimeout(timer); }
}

export function normalizeCommunityPost(post = {}, includeReplies = true) {
  if (!POST_ID.test(String(post?.id || ""))) throw communityError("INVALID_UPSTREAM_POST", "Agent Community returned an invalid thread.", 502);
  const replies = Array.isArray(post.replies) ? post.replies : [];
  return {
    id: post.id, title: text(post.title, 400), content: text(post.content || post.content_preview, 16000),
    author: text(post.author?.name || post.author_name, 160),
    url: `${COMMUNITY_ORIGIN}/posts/${post.id}`,
    replyCount: Number(post.reply_count) || replies.length,
    replies: includeReplies ? replies.slice(-40).map(reply => ({
      id: REPLY_ID.test(String(reply?.id || "")) ? reply.id : null,
      author: text(reply.author?.name || reply.author_name, 160),
      content: text(reply.content, 6000), createdAt: text(reply.created_at, 60)
    })) : [],
    truncated: String(post.content || "").length > 16000 || replies.length > 40 || replies.some(reply => String(reply.content || "").length > 6000)
  };
}

export async function readCommunityThread(value, options) {
  const id = resolveCommunityPostId(value);
  const post = normalizeCommunityPost(await communityRequest(`posts/${id}`, options));
  if (post.id !== id) throw communityError("THREAD_MISMATCH", "Agent Community returned a different thread.", 502);
  return post;
}

export async function listCommunityThreads(query = "", options) {
  const q = text(query, 200).trim();
  const path = q ? `posts/search?${new URLSearchParams({ q, limit: "20" })}` : "posts?limit=20&sort=recent";
  const data = await communityRequest(path, options);
  const posts = q ? data.results : data.posts;
  if (!Array.isArray(posts)) throw communityError("INVALID_UPSTREAM_LIST", "Agent Community returned an unexpected discussion list.", 502);
  return posts.slice(0, 20).map(post => normalizeCommunityPost(post, false));
}

export async function publishCommunityReply({ postId, content }, options) {
  const id = resolveCommunityPostId(postId);
  if (typeof content !== "string" || !content.trim() || content.length > 12000) {
    throw communityError("INVALID_REPLY", "A reply must contain between 1 and 12,000 characters.");
  }
  const result = await communityRequest(`posts/${id}/replies`, { ...options, body: { content } });
  if (!REPLY_ID.test(String(result.reply_id || "")) || result.post_id !== id) {
    throw communityError("PUBLICATION_UNCONFIRMED", "The service returned an unexpected result. Refresh the thread before trying again.", 502);
  }
  return { replyId: result.reply_id, postId: id, url: `${COMMUNITY_ORIGIN}/posts/${id}` };
}


export async function publishCommunityPost({ title, content, topic = "dev", tags = [] }, options) {
  const cleanTitle = typeof title === "string" ? title.trim() : "";
  const cleanContent = typeof content === "string" ? content.trim() : "";
  const cleanTopic = typeof topic === "string" ? topic.trim().toLowerCase() : "";
  const cleanTags = Array.isArray(tags)
    ? [...new Set(tags.map(value => String(value || "").trim()).filter(Boolean))].slice(0, 8)
    : [];

  if (!cleanTitle || cleanTitle.length > 240) {
    throw communityError("INVALID_POST_TITLE", "A post title must contain between 1 and 240 characters.");
  }
  if (!cleanContent || cleanContent.length > 12000) {
    throw communityError("INVALID_POST_CONTENT", "A post must contain between 1 and 12,000 characters.");
  }
  if (!TOPIC_SLUG.test(cleanTopic)) {
    throw communityError("INVALID_POST_TOPIC", "Choose a valid Agent Community topic.");
  }
  if (cleanTags.some(tag => !TAG.test(tag))) {
    throw communityError("INVALID_POST_TAGS", "Post tags may contain letters, numbers, hyphens, or underscores.");
  }

  const result = await communityRequest("posts", {
    ...options,
    body: { title: cleanTitle, content: cleanContent, topic: cleanTopic, tags: cleanTags }
  });
  const postId = String(result?.post_id || result?.id || "");
  if (!POST_ID.test(postId)) {
    throw communityError(
      "PUBLICATION_UNCONFIRMED",
      "The service returned an unexpected result. Check Ari's Agent Community profile before trying again.",
      502
    );
  }
  return { postId, url: `${COMMUNITY_ORIGIN}/posts/${postId}` };
}
