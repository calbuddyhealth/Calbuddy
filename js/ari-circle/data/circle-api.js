// js/ari-circle/data/circle-api.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Be the single Supabase/data boundary for ARI Circle.
// - Keep Supabase table/storage calls out of UI and feature modules.
// - Load Circle profile data.
// - Persist profile edits, connections, Top Circle, comments,
//   conversations, messages, message requests, notifications,
//   and profile media.
// - Listen for persistence events emitted by feature modules.
//
// This module intentionally does NOT import a specific Supabase bootstrap
// file. The existing Ari Supabase client should be injected:
//
//   import CircleApi from "./data/circle-api.js";
//   CircleApi.configure({ client: supabase });
//
// That keeps ARI Circle portable and avoids duplicate Supabase clients.
//
// Data flow:
//
//   UI / feature modules
//          ↓
//      CircleStore
//          ↓
//      CircleEvents
//          ↓
//      circle-api.js
//          ↓
//        Supabase
//
// Table names are centralized below so schema names can change without
// touching the rest of the ARI Circle frontend.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/data/circle-api";

const DEFAULT_TABLES = Object.freeze({
  profiles:
    "ari_circle_profiles",

  connections:
    "ari_circle_connections",

  topCircle:
    "ari_circle_top_members",

  love:
    "ari_circle_comments",

  conversations:
    "ari_conversations",

  conversationMembers:
    "ari_conversation_members",

  messages:
    "ari_messages",

  messageRequests:
    "ari_message_requests",

  notifications:
    "ari_circle_notifications"
});

const DEFAULT_BUCKETS = Object.freeze({
  profileMedia:
    "ari-circle-media"
});

function normalizeString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized
    ? normalized
    : null;
}

function normalizeHandle(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  return normalized
    .replace(/^@+/, "")
    .trim()
    .toLowerCase() || null;
}

function normalizeId(value) {
  return normalizeString(
    String(value ?? "")
  );
}

function assertClient(client) {
  if (!client) {
    throw new Error(
      "ARI Circle Supabase client has not been configured."
    );
  }
}

function throwIfError(error, fallbackMessage) {
  if (!error) {
    return;
  }

  const message =
    normalizeString(
      error.message
    ) ||
    fallbackMessage ||
    "ARI Circle data request failed.";

  const wrapped =
    new Error(message);

  wrapped.cause =
    error;

  wrapped.code =
    error.code ||
    null;

  throw wrapped;
}

function createSafeFileName(name) {
  const raw =
    normalizeString(name) ||
    "image.webp";

  return raw
    .toLowerCase()
    .replace(
      /[^a-z0-9._-]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    ) ||
    "image.webp";
}

function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function toProfileRow(profile, ownerUserId) {
  const userId =
    normalizeId(
      ownerUserId ||
      profile?.user_id ||
      profile?.userId ||
      profile?.id
    );

  if (!userId) {
    throw new Error(
      "Profile user ID is required."
    );
  }

  return {
    user_id:
      userId,

    display_name:
      normalizeString(
        profile?.display_name ||
        profile?.displayName ||
        profile?.name
      ),

    handle:
      normalizeHandle(
        profile?.handle ||
        profile?.username
      ),

    bio:
      normalizeString(
        profile?.bio
      ),

    location:
      normalizeString(
        profile?.location
      ),

    birthday:
      normalizeString(
        profile?.birthday
      ),

    goal:
      normalizeString(
        profile?.goal
      ),

    bucket_list:
      normalizeString(
        profile?.bucket_list ||
        profile?.bucketList
      ),

    favorite_song:
      normalizeString(
        profile?.favorite_song ||
        profile?.favoriteSong
      ),

    favorite_food:
      normalizeString(
        profile?.favorite_food ||
        profile?.favoriteFood
      ),

    favorite_movie:
      normalizeString(
        profile?.favorite_movie ||
        profile?.favoriteMovie
      ),

    favorite_hobby:
      normalizeString(
        profile?.favorite_hobby ||
        profile?.favoriteHobby
      ),

    icebreakers:
      profile?.icebreakers &&
      typeof profile.icebreakers ===
        "object"
        ? profile.icebreakers
        : {},

    avatar_url:
      normalizeString(
        profile?.avatar_url ||
        profile?.avatarUrl
      ),

    cover_url:
      normalizeString(
        profile?.cover_url ||
        profile?.coverUrl
      ),

    messaging_visibility:
      normalizeString(
        profile?.messaging_visibility ||
        profile?.messagingVisibility
      ) ||
      "request"
  };
}

const CircleApi = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    configured:
      false,

    client:
      null,

    tables: {
      ...DEFAULT_TABLES
    },

    buckets: {
      ...DEFAULT_BUCKETS
    },

    unsubscribers:
      []
  },

  configure({
    client,
    tables = {},
    buckets = {}
  } = {}) {
    assertClient(client);

    this.state.client =
      client;

    this.state.tables = {
      ...DEFAULT_TABLES,
      ...tables
    };

    this.state.buckets = {
      ...DEFAULT_BUCKETS,
      ...buckets
    };

    this.state.configured =
      true;

    this.bindPersistenceEvents();

    return this.getDiagnostics();
  },

  getClient() {
    assertClient(
      this.state.client
    );

    return this.state.client;
  },

  table(name) {
    const tableName =
      this.state.tables[
        name
      ];

    if (!tableName) {
      throw new Error(
        `Unknown ARI Circle table: ${name}`
      );
    }

    return tableName;
  },

  bucket(name) {
    const bucketName =
      this.state.buckets[
        name
      ];

    if (!bucketName) {
      throw new Error(
        `Unknown ARI Circle storage bucket: ${name}`
      );
    }

    return bucketName;
  },

  async getProfileByUserId(
    userId
  ) {
    const id =
      normalizeId(userId);

    if (!id) {
      return null;
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "profiles"
          )
        )
        .select("*")
        .eq(
          "user_id",
          id
        )
        .maybeSingle();

    throwIfError(
      error,
      "Could not load ARI Circle profile."
    );

    return data || null;
  },

  async getProfileByHandle(
    handle
  ) {
    const normalized =
      normalizeHandle(
        handle
      );

    if (!normalized) {
      return null;
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "profiles"
          )
        )
        .select("*")
        .eq(
          "handle",
          normalized
        )
        .maybeSingle();

    throwIfError(
      error,
      "Could not find that ARI Circle."
    );

    return data || null;
  },

  async resolveProfile({
    userId,
    handle
  } = {}) {
    const id =
      normalizeId(
        userId
      );

    if (id) {
      return this.getProfileByUserId(
        id
      );
    }

    const normalizedHandle =
      normalizeHandle(
        handle
      );

    if (
      normalizedHandle
    ) {
      return this.getProfileByHandle(
        normalizedHandle
      );
    }

    return null;
  },

  async saveProfile(
    profile,
    {
      ownerUserId = null
    } = {}
  ) {
    const client =
      this.getClient();

    const row =
      toProfileRow(
        profile,
        ownerUserId
      );

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "profiles"
          )
        )
        .upsert(
          row,
          {
            onConflict:
              "user_id"
          }
        )
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not save ARI Circle profile."
    );

    return data;
  },

  async getConnection(
    viewerUserId,
    profileUserId
  ) {
    const viewerId =
      normalizeId(
        viewerUserId
      );

    const profileId =
      normalizeId(
        profileUserId
      );

    if (
      !viewerId ||
      !profileId ||
      viewerId === profileId
    ) {
      return null;
    }

    const client =
      this.getClient();

    /*
     * Relationship rows are stored as requester -> addressee.
     * We need either direction for the currently viewed profile.
     */
    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "connections"
          )
        )
        .select("*")
        .or(
          `and(requester_user_id.eq.${viewerId},addressee_user_id.eq.${profileId}),and(requester_user_id.eq.${profileId},addressee_user_id.eq.${viewerId})`
        )
        .maybeSingle();

    throwIfError(
      error,
      "Could not load Circle relationship."
    );

    return data || null;
  },

  async createConnectionRequest({
    requesterUserId,
    addresseeUserId
  } = {}) {
    const requesterId =
      normalizeId(
        requesterUserId
      );

    const addresseeId =
      normalizeId(
        addresseeUserId
      );

    if (
      !requesterId ||
      !addresseeId ||
      requesterId ===
        addresseeId
    ) {
      throw new Error(
        "A valid Circle request requires two different users."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "connections"
          )
        )
        .insert({
          requester_user_id:
            requesterId,

          addressee_user_id:
            addresseeId,

          status:
            "pending"
        })
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not send Circle request."
    );

    return data;
  },

  async updateConnectionStatus(
    connectionId,
    status
  ) {
    const id =
      normalizeId(
        connectionId
      );

    const nextStatus =
      normalizeString(
        status
      );

    if (
      !id ||
      !nextStatus
    ) {
      throw new Error(
        "Connection ID and status are required."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "connections"
          )
        )
        .update({
          status:
            nextStatus
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not update Circle relationship."
    );

    return data;
  },

  async deleteConnection(
    connectionId
  ) {
    const id =
      normalizeId(
        connectionId
      );

    if (!id) {
      throw new Error(
        "Connection ID is required."
      );
    }

    const client =
      this.getClient();

    const {
      error
    } =
      await client
        .from(
          this.table(
            "connections"
          )
        )
        .delete()
        .eq(
          "id",
          id
        );

    throwIfError(
      error,
      "Could not remove Circle relationship."
    );

    return true;
  },

  async getTopCircle(
    ownerUserId
  ) {
    const ownerId =
      normalizeId(
        ownerUserId
      );

    if (!ownerId) {
      return [];
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "topCircle"
          )
        )
        .select(`
          id,
          owner_user_id,
          member_user_id,
          position,
          member:ari_circle_profiles!member_user_id (
            *
          )
        `)
        .eq(
          "owner_user_id",
          ownerId
        )
        .order(
          "position",
          {
            ascending:
              true
          }
        );

    throwIfError(
      error,
      "Could not load Top Circle."
    );

    return asArray(data);
  },

  async saveTopCircle({
    ownerUserId,
    members
  } = {}) {
    const ownerId =
      normalizeId(
        ownerUserId
      );

    if (!ownerId) {
      throw new Error(
        "Top Circle owner user ID is required."
      );
    }

    const client =
      this.getClient();

    const table =
      this.table(
        "topCircle"
      );

    const {
      error: deleteError
    } =
      await client
        .from(table)
        .delete()
        .eq(
          "owner_user_id",
          ownerId
        );

    throwIfError(
      deleteError,
      "Could not update Top Circle."
    );

    const rows =
      asArray(members)
        .map(
          (
            member,
            index
          ) => {
            const memberId =
              normalizeId(
                member?.user_id ||
                member?.userId ||
                member?.id
              );

            if (!memberId) {
              return null;
            }

            return {
              owner_user_id:
                ownerId,

              member_user_id:
                memberId,

              position:
                Number.isFinite(
                  Number(
                    member?.position
                  )
                )
                  ? Number(
                      member.position
                    )
                  : index
            };
          }
        )
        .filter(Boolean);

    if (!rows.length) {
      return [];
    }

    const {
      data,
      error
    } =
      await client
        .from(table)
        .insert(rows)
        .select("*");

    throwIfError(
      error,
      "Could not save Top Circle."
    );

    return asArray(data);
  },

  async getLove({
    profileUserId,
    limit = 20,
    offset = 0
  } = {}) {
    const profileId =
      normalizeId(
        profileUserId
      );

    if (!profileId) {
      return {
        items: [],
        total: 0,
        hasMore: false
      };
    }

    const client =
      this.getClient();

    const start =
      Math.max(
        0,
        Number(offset) || 0
      );

    const size =
      Math.min(
        100,
        Math.max(
          1,
          Number(limit) || 20
        )
      );

    const end =
      start +
      size -
      1;

    const {
      data,
      error,
      count
    } =
      await client
        .from(
          this.table(
            "love"
          )
        )
        .select(
          `
            *,
            author:ari_circle_profiles!author_user_id (
              user_id,
              display_name,
              handle,
              avatar_url
            )
          `,
          {
            count:
              "exact"
          }
        )
        .eq(
          "profile_user_id",
          profileId
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .range(
          start,
          end
        );

    throwIfError(
      error,
      "Could not load profile comments."
    );

    const items =
      asArray(data);

    const total =
      Number(count) ||
      items.length;

    return {
      items,
      total,
      hasMore:
        start +
        items.length <
        total
    };
  },

  async createLove({
    profileUserId,
    authorUserId,
    text
  } = {}) {
    const profileId =
      normalizeId(
        profileUserId
      );

    const authorId =
      normalizeId(
        authorUserId
      );

    const body =
      normalizeString(
        text
      );

    if (
      !profileId ||
      !authorId ||
      !body
    ) {
      throw new Error(
        "Profile, author, and comment text are required."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "love"
          )
        )
        .insert({
          profile_user_id:
            profileId,

          author_user_id:
            authorId,

          body:
            body.slice(
              0,
              280
            )
        })
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not post profile comment."
    );

    return data;
  },

  async deleteLove(
    commentId
  ) {
    const id =
      normalizeId(
        commentId
      );

    if (!id) {
      throw new Error(
        "Comment ID is required."
      );
    }

    const client =
      this.getClient();

    const {
      error
    } =
      await client
        .from(
          this.table(
            "love"
          )
        )
        .delete()
        .eq(
          "id",
          id
        );

    throwIfError(
      error,
      "Could not remove profile comment."
    );

    return true;
  },

  async getConversations(
    userId
  ) {
    const id =
      normalizeId(
        userId
      );

    if (!id) {
      return [];
    }

    const client =
      this.getClient();

    const {
      data: memberships,
      error: membershipError
    } =
      await client
        .from(
          this.table(
            "conversationMembers"
          )
        )
        .select(
          "conversation_id"
        )
        .eq(
          "user_id",
          id
        );

    throwIfError(
      membershipError,
      "Could not load conversations."
    );

    const conversationIds =
      asArray(
        memberships
      )
        .map(
          row =>
            normalizeId(
              row.conversation_id
            )
        )
        .filter(Boolean);

    if (
      !conversationIds.length
    ) {
      return [];
    }

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "conversations"
          )
        )
        .select(`
          *,
          members:ari_conversation_members (
            user_id,
            profile:ari_circle_profiles!user_id (
              user_id,
              display_name,
              handle,
              avatar_url
            )
          )
        `)
        .in(
          "id",
          conversationIds
        )
        .order(
          "updated_at",
          {
            ascending:
              false
          }
        );

    throwIfError(
      error,
      "Could not load conversations."
    );

    return asArray(data);
  },

  async createDirectConversation({
    userA,
    userB
  } = {}) {
    const first =
      normalizeId(
        userA
      );

    const second =
      normalizeId(
        userB
      );

    if (
      !first ||
      !second ||
      first === second
    ) {
      throw new Error(
        "A direct conversation requires two different users."
      );
    }

    const client =
      this.getClient();

    const {
      data: conversation,
      error: conversationError
    } =
      await client
        .from(
          this.table(
            "conversations"
          )
        )
        .insert({
          type:
            "direct"
        })
        .select("*")
        .single();

    throwIfError(
      conversationError,
      "Could not create conversation."
    );

    const rows = [
      {
        conversation_id:
          conversation.id,

        user_id:
          first
      },
      {
        conversation_id:
          conversation.id,

        user_id:
          second
      }
    ];

    const {
      error: membersError
    } =
      await client
        .from(
          this.table(
            "conversationMembers"
          )
        )
        .insert(rows);

    throwIfError(
      membersError,
      "Could not create conversation members."
    );

    return conversation;
  },

  async getMessages({
    conversationId,
    limit = 50,
    before = null
  } = {}) {
    const id =
      normalizeId(
        conversationId
      );

    if (!id) {
      return [];
    }

    const client =
      this.getClient();

    let query =
      client
        .from(
          this.table(
            "messages"
          )
        )
        .select("*")
        .eq(
          "conversation_id",
          id
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .limit(
          Math.min(
            100,
            Math.max(
              1,
              Number(limit) || 50
            )
          )
        );

    const beforeValue =
      normalizeString(
        before
      );

    if (beforeValue) {
      query =
        query.lt(
          "created_at",
          beforeValue
        );
    }

    const {
      data,
      error
    } =
      await query;

    throwIfError(
      error,
      "Could not load messages."
    );

    return asArray(data)
      .reverse();
  },

  async sendMessage({
    conversationId,
    senderUserId,
    body
  } = {}) {
    const conversation =
      normalizeId(
        conversationId
      );

    const sender =
      normalizeId(
        senderUserId
      );

    const text =
      normalizeString(
        body
      );

    if (
      !conversation ||
      !sender ||
      !text
    ) {
      throw new Error(
        "Conversation, sender, and message body are required."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "messages"
          )
        )
        .insert({
          conversation_id:
            conversation,

          sender_user_id:
            sender,

          body:
            text.slice(
              0,
              4000
            )
        })
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not send message."
    );

    await client
      .from(
        this.table(
          "conversations"
        )
      )
      .update({
        updated_at:
          new Date()
            .toISOString(),

        last_message_at:
          data.created_at ||
          new Date()
            .toISOString()
      })
      .eq(
        "id",
        conversation
      );

    return data;
  },

  async createMessageRequest({
    senderUserId,
    receiverUserId,
    message
  } = {}) {
    const sender =
      normalizeId(
        senderUserId
      );

    const receiver =
      normalizeId(
        receiverUserId
      );

    const body =
      normalizeString(
        message
      );

    if (
      !sender ||
      !receiver ||
      !body
    ) {
      throw new Error(
        "Message request sender, recipient, and message are required."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "messageRequests"
          )
        )
        .insert({
          sender_user_id:
            sender,

          receiver_user_id:
            receiver,

          message:
            body.slice(
              0,
              1000
            ),

          status:
            "pending"
        })
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not send message request."
    );

    return data;
  },

  async updateMessageRequest(
    requestId,
    status
  ) {
    const id =
      normalizeId(
        requestId
      );

    const nextStatus =
      normalizeString(
        status
      );

    if (
      !id ||
      !nextStatus
    ) {
      throw new Error(
        "Message request ID and status are required."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "messageRequests"
          )
        )
        .update({
          status:
            nextStatus
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

    throwIfError(
      error,
      "Could not update message request."
    );

    return data;
  },

  async getNotifications({
    userId,
    limit = 50
  } = {}) {
    const id =
      normalizeId(
        userId
      );

    if (!id) {
      return [];
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client
        .from(
          this.table(
            "notifications"
          )
        )
        .select("*")
        .eq(
          "user_id",
          id
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .limit(
          Math.min(
            100,
            Math.max(
              1,
              Number(limit) || 50
            )
          )
        );

    throwIfError(
      error,
      "Could not load notifications."
    );

    return asArray(data);
  },

  async markNotificationRead(
    notificationId,
    read = true
  ) {
    const id =
      normalizeId(
        notificationId
      );

    if (!id) {
      return false;
    }

    const client =
      this.getClient();

    const {
      error
    } =
      await client
        .from(
          this.table(
            "notifications"
          )
        )
        .update({
          is_read:
            Boolean(read)
        })
        .eq(
          "id",
          id
        );

    throwIfError(
      error,
      "Could not update notification."
    );

    return true;
  },

  async markAllNotificationsRead(
    userId
  ) {
    const id =
      normalizeId(
        userId
      );

    if (!id) {
      return false;
    }

    const client =
      this.getClient();

    const {
      error
    } =
      await client
        .from(
          this.table(
            "notifications"
          )
        )
        .update({
          is_read:
            true
        })
        .eq(
          "user_id",
          id
        )
        .eq(
          "is_read",
          false
        );

    throwIfError(
      error,
      "Could not mark notifications read."
    );

    return true;
  },

  async uploadProfileMedia({
    ownerUserId,
    mediaType,
    file,
    upsert = true
  } = {}) {
    const ownerId =
      normalizeId(
        ownerUserId
      );

    const type =
      normalizeString(
        mediaType
      )
        ?.toLowerCase();

    if (
      !ownerId ||
      !file ||
      (
        type !== "avatar" &&
        type !== "cover"
      )
    ) {
      throw new Error(
        "Valid profile media upload information is required."
      );
    }

    const client =
      this.getClient();

    const bucket =
      this.bucket(
        "profileMedia"
      );

    const fileName =
      createSafeFileName(
        file.name
      );

    const path =
      `${ownerId}/${type}/${Date.now()}-${fileName}`;

    const {
      error: uploadError
    } =
      await client
        .storage
        .from(bucket)
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              Boolean(upsert),

            contentType:
              file.type ||
              undefined
          }
        );

    throwIfError(
      uploadError,
      "Could not upload profile image."
    );

    const {
      data: publicData
    } =
      client
        .storage
        .from(bucket)
        .getPublicUrl(path);

    const publicUrl =
      normalizeString(
        publicData?.publicUrl
      );

    if (!publicUrl) {
      throw new Error(
        "Profile image uploaded but no public URL was returned."
      );
    }

    const column =
      type === "avatar"
        ? "avatar_url"
        : "cover_url";

    const {
      data: profile,
      error: profileError
    } =
      await client
        .from(
          this.table(
            "profiles"
          )
        .update({
          [column]:
            publicUrl
        })
        .eq(
          "user_id",
          ownerId
        )
        .select("*")
        .single();

    throwIfError(
      profileError,
      "Image uploaded, but the profile could not be updated."
    );

    return {
      path,
      publicUrl,
      profile
    };
  },

  async loadCircleBundle({
    viewerUserId,
    profileUserId,
    profileHandle
  } = {}) {
    const viewerId =
      normalizeId(
        viewerUserId
      );

    const profile =
      await this.resolveProfile({
        userId:
          profileUserId,

        handle:
          profileHandle
      });

    if (!profile) {
      return null;
    }

    const targetId =
      normalizeId(
        profile.user_id
      );

    const [
      connection,
      topCircleRows,
      love
    ] =
      await Promise.all([
        viewerId &&
        targetId &&
        viewerId !== targetId
          ? this.getConnection(
              viewerId,
              targetId
            )
          : Promise.resolve(
              null
            ),

        this.getTopCircle(
          targetId
        ),

        this.getLove({
          profileUserId:
            targetId,

          limit:
            20,

          offset:
            0
        })
      ]);

    return {
      profile,
      connection,
      topCircleRows,
      love
    };
  },

  bindPersistenceEvents() {
    if (
      this.state.unsubscribers
        .length
    ) {
      return;
    }

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.PROFILE_UPDATED,
        event =>
          this.handleProfilePersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.CONNECTION_REQUESTED,
        event =>
          this.handleConnectionRequestedPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.CONNECTION_ACCEPTED,
        event =>
          this.handleConnectionStatusPersist(
            event?.detail,
            "accepted"
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.CONNECTION_DECLINED,
        event =>
          this.handleConnectionStatusPersist(
            event?.detail,
            "declined"
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.CONNECTION_REMOVED,
        event =>
          this.handleConnectionRemovedPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.TOP_CIRCLE_CHANGED,
        event =>
          this.handleTopCirclePersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.LOVE_CREATED,
        event =>
          this.handleLoveCreatedPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.LOVE_DELETED,
        event =>
          this.handleLoveDeletedPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        EVENT_NAMES.MESSAGE_SENT,
        event =>
          this.handleMessageSentPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:message-request-created",
        event =>
          this.handleMessageRequestCreatedPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:message-request-accepted",
        event =>
          this.handleMessageRequestStatusPersist(
            event?.detail,
            "accepted"
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:message-request-declined",
        event =>
          this.handleMessageRequestStatusPersist(
            event?.detail,
            "declined"
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:message-request-canceled",
        event =>
          this.handleMessageRequestStatusPersist(
            event?.detail,
            "canceled"
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:notification-read",
        event =>
          this.handleNotificationReadPersist(
            event?.detail
          )
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:notifications-all-read",
        () =>
          this.handleAllNotificationsReadPersist()
      )
    );

    this.state.unsubscribers.push(
      CircleEvents.on(
        "circle:profile-media-ready",
        event =>
          this.handleProfileMediaPersist(
            event?.detail
          )
      )
    );
  },

  async handleProfilePersist(
    detail
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    try {
      const context =
        CircleStore.get(
          "context"
        );

      const saved =
        await this.saveProfile(
          detail.profile ||
          CircleStore.get(
            "profile"
          ),
          {
            ownerUserId:
              context?.viewerUserId
          }
        );

      CircleStore.setProfile(
        saved
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not save your Circle."
        }
      );
    }
  },

  async handleConnectionRequestedPersist(
    detail
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    try {
      const context =
        CircleStore.get(
          "context"
        );

      const profile =
        CircleStore.get(
          "profile"
        );

      const saved =
        await this.createConnectionRequest({
          requesterUserId:
            context?.viewerUserId,

          addresseeUserId:
            profile?.user_id ||
            profile?.userId ||
            profile?.id
        });

      CircleStore.setConnection({
        status:
          "outgoing_pending",

        requestId:
          saved.id,

        requestedByUserId:
          saved.requester_user_id,

        targetUserId:
          saved.addressee_user_id,

        pendingPersistence:
          false
      });
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not send Circle request."
        }
      );
    }
  },

  async handleConnectionStatusPersist(
    detail,
    status
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    const requestId =
      normalizeId(
        detail?.request?.id ||
        detail?.requestId ||
        detail?.connection?.requestId
      );

    if (!requestId) {
      return;
    }

    try {
      await this.updateConnectionStatus(
        requestId,
        status
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not update Circle request."
        }
      );
    }
  },

  async handleConnectionRemovedPersist(
    detail
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    const id =
      normalizeId(
        detail?.previous?.id ||
        detail?.previous?.requestId ||
        detail?.connectionId
      );

    if (!id) {
      return;
    }

    try {
      await this.deleteConnection(
        id
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not remove Circle connection."
        }
      );
    }
  },

  async handleTopCirclePersist(
    detail
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    try {
      const context =
        CircleStore.get(
          "context"
        );

      await this.saveTopCircle({
        ownerUserId:
          context?.viewerUserId,

        members:
          detail?.topCircle
            ?.members ||
          []
      });
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not save Top Circle."
        }
      );
    }
  },

  async handleLoveCreatedPersist(
    detail
  ) {
    if (
      !detail?.persist ||
      !detail?.comment
    ) {
      return;
    }

    try {
      const comment =
        detail.comment;

      const saved =
        await this.createLove({
          profileUserId:
            comment.profileUserId,

          authorUserId:
            comment.authorUserId,

          text:
            comment.text
        });

      /*
       * Replace optimistic local ID with the backend row if possible.
       */
      const love =
        CircleStore.get(
          "love"
        ) || {};

      const items =
        asArray(
          love.items
        )
          .map(
            item =>
              item.id ===
              comment.id
                ? {
                    ...item,
                    id:
                      saved.id,
                    createdAt:
                      saved.created_at ||
                      item.createdAt
                  }
                : item
          );

      CircleStore.setLoveState({
        ...love,
        items
      });
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not save profile comment."
        }
      );
    }
  },

  async handleLoveDeletedPersist(
    detail
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    const id =
      normalizeId(
        detail?.comment?.id
      );

    if (!id) {
      return;
    }

    try {
      await this.deleteLove(
        id
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not remove profile comment."
        }
      );
    }
  },

  async handleMessageSentPersist(
    detail
  ) {
    if (
      !detail?.persist ||
      !detail?.message
    ) {
      return;
    }

    try {
      const message =
        detail.message;

      await this.sendMessage({
        conversationId:
          message.conversationId,

        senderUserId:
          message.senderUserId,

        body:
          message.body
      });
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not send message."
        }
      );
    }
  },

  async handleMessageRequestCreatedPersist(
    detail
  ) {
    if (
      !detail?.persist ||
      !detail?.request
    ) {
      return;
    }

    try {
      const request =
        detail.request;

      await this.createMessageRequest({
        senderUserId:
          request.senderUserId,

        receiverUserId:
          request.receiverUserId,

        message:
          request.message
      });
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not send message request."
        }
      );
    }
  },

  async handleMessageRequestStatusPersist(
    detail,
    status
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    const id =
      normalizeId(
        detail?.request?.id
      );

    if (!id) {
      return;
    }

    try {
      await this.updateMessageRequest(
        id,
        status
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not update message request."
        }
      );
    }
  },

  async handleNotificationReadPersist(
    detail
  ) {
    if (
      !detail?.persist
    ) {
      return;
    }

    try {
      await this.markNotificationRead(
        detail.notificationId,
        true
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not update notification."
        }
      );
    }
  },

  async handleAllNotificationsReadPersist() {
    try {
      const context =
        CircleStore.get(
          "context"
        );

      if (
        !context?.viewerUserId
      ) {
        return;
      }

      await this.markAllNotificationsRead(
        context.viewerUserId
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not update notifications."
        }
      );
    }
  },

  async handleProfileMediaPersist(
    detail
  ) {
    if (
      !detail?.persist ||
      !detail?.file
    ) {
      return;
    }

    try {
      const context =
        CircleStore.get(
          "context"
        );

      const result =
        await this.uploadProfileMedia({
          ownerUserId:
            context?.viewerUserId,

          mediaType:
            detail.mediaType,

          file:
            detail.file
        });

      CircleStore.setProfile(
        result.profile
      );

      CircleEvents.emit(
        "circle:profile-media-uploaded",
        {
          mediaType:
            detail.mediaType,

          publicUrl:
            result.publicUrl,

          path:
            result.path,

          profile:
            result.profile
        }
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not upload profile image."
        }
      );
    }
  },

  destroy() {
    for (
      const unsubscribe
      of this.state.unsubscribers
    ) {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn(
          "ARI Circle API unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.state.client =
      null;

    this.state.configured =
      false;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.configured,

      source:
        this.source,

      version:
        this.version,

      clientConfigured:
        Boolean(
          this.state.client
        ),

      tables: {
        ...this.state.tables
      },

      buckets: {
        ...this.state.buckets
      },

      persistenceListeners:
        this.state.unsubscribers
          .length
    };
  }
};

export {
  CircleApi,
  DEFAULT_TABLES,
  DEFAULT_BUCKETS
};

export default CircleApi;
