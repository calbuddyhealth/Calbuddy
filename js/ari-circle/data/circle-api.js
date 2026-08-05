// js/ari-circle/data/circle-api.js
// ARI Circle
// V1.1.2
//
// Backend contract:
//   ARI Circle Supabase Schema V1.0.1
//   ARI Circle Block User Patch V1.0.2
//
// Purpose:
// - Be the single Supabase/data boundary for ARI Circle.
// - Keep Supabase table/storage calls out of UI and feature modules.
// - Load and persist profiles, connections, Top Circle, comments,
//   conversations, messages, message requests, notifications,
//   and profile media.
// - Use the protected direct-conversation RPC from schema V1.0.1.
// - Automatically create the authenticated user's starter Circle profile
//   on first visit when their own Circle does not exist yet.
// - Listen for persistence events emitted by ARI Circle feature modules.
//
// This module intentionally does NOT create a Supabase client.
//
// Configure it with Ari's existing client:
//
//   CircleApi.configure({
//     client: supabase
//   });
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

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.1.2";
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

const DEFAULT_RPCS = Object.freeze({
  createDirectConversation:
    "ari_circle_create_direct_conversation",

  findDirectConversation:
    "ari_circle_find_direct_conversation",

  blockUser:
    "ari_circle_block_user",

  unblockUser:
    "ari_circle_unblock_user"
});

const CONNECTION_BACKEND_STATES =
  new Set([
    "pending",
    "accepted",
    "declined",
    "blocked"
  ]);

const MESSAGE_REQUEST_STATES =
  new Set([
    "pending",
    "accepted",
    "declined",
    "canceled"
  ]);

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
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return normalizeString(
    String(value)
  );
}

function normalizeInteger(
  value,
  fallback = 0
) {
  const parsed =
    Number.parseInt(
      value,
      10
    );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function normalizeTopCircleLimit(value) {
  return Number(value) === 4
    ? 4
    : 6;
}

function getEventDetail(payload) {
  if (
    payload?.detail &&
    typeof payload.detail ===
      "object"
  ) {
    return payload.detail;
  }

  if (
    payload &&
    typeof payload ===
      "object"
  ) {
    return payload;
  }

  return {};
}

function assertClient(client) {
  if (!client) {
    throw new Error(
      "ARI Circle Supabase client has not been configured."
    );
  }
}

function throwIfError(
  error,
  fallbackMessage
) {
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

  wrapped.details =
    error.details ||
    null;

  wrapped.hint =
    error.hint ||
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

function uniqueIds(values) {
  return [
    ...new Set(
      asArray(values)
        .map(normalizeId)
        .filter(Boolean)
    )
  ];
}

function toProfileRow(
  profile,
  ownerUserId
) {
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
        "object" &&
      !Array.isArray(
        profile.icebreakers
      )
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

    top_circle_limit:
      normalizeTopCircleLimit(
        profile?.top_circle_limit ||
        profile?.topCircleLimit
      ),

    messaging_visibility:
      normalizeString(
        profile?.messaging_visibility ||
        profile?.messagingVisibility
      ) ||
      "request",

    presence_visible:
      profile?.presence_visible ??
      profile?.presenceVisible ??
      true
  };
}

function mapProfileById(
  profiles
) {
  const map =
    new Map();

  for (
    const profile
    of asArray(profiles)
  ) {
    const userId =
      normalizeId(
        profile?.user_id
      );

    if (userId) {
      map.set(
        userId,
        profile
      );
    }
  }

  return map;
}

function extractStoragePathFromPublicUrl(
  publicUrl,
  bucketName
) {
  const url =
    normalizeString(
      publicUrl
    );

  const bucket =
    normalizeString(
      bucketName
    );

  if (
    !url ||
    !bucket
  ) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    const marker =
      `/storage/v1/object/public/${bucket}/`;

    const index =
      parsed.pathname.indexOf(
        marker
      );

    if (index < 0) {
      return null;
    }

    return decodeURIComponent(
      parsed.pathname.slice(
        index +
        marker.length
      )
    );
  } catch {
    return null;
  }
}


function sanitizeStarterHandle(value) {
  const normalized =
    normalizeString(
      value
    )
      ?.replace(/^@+/, "")
      .toLowerCase()
      .replace(
        /[^a-z0-9._]+/g,
        "_"
      )
      .replace(
        /[._]{2,}/g,
        "_"
      )
      .replace(
        /^[._]+|[._]+$/g,
        ""
      );

  if (!normalized) {
    return null;
  }

  let handle =
    normalized;

  if (handle.length < 3) {
    handle =
      `ari_${handle}`;
  }

  return handle
    .slice(
      0,
      30
    )
    .replace(
      /[._]+$/g,
      ""
    ) || null;
}

function buildStarterDisplayName(user) {
  const metadata =
    user?.user_metadata &&
    typeof user.user_metadata ===
      "object"
      ? user.user_metadata
      : {};

  const emailName =
    normalizeString(
      user?.email
    )
      ?.split("@")[0]
      ?.replace(
        /[._-]+/g,
        " "
      );

  const candidate =
    normalizeString(
      metadata.display_name ||
      metadata.displayName ||
      metadata.full_name ||
      metadata.fullName ||
      metadata.name ||
      metadata.preferred_username ||
      metadata.username ||
      metadata.user_name ||
      emailName
    ) ||
    "ARI User";

  return candidate
    .slice(
      0,
      60
    )
    .trim() ||
    "ARI User";
}

function buildStarterHandleCandidates(
  user,
  preferredHandle = null
) {
  const metadata =
    user?.user_metadata &&
    typeof user.user_metadata ===
      "object"
      ? user.user_metadata
      : {};

  const userId =
    normalizeId(
      user?.id
    );

  const compactId =
    userId
      ?.replace(
        /-/g,
        ""
      ) ||
    "";

  const shortId =
    compactId.slice(
      0,
      8
    ) ||
    Math.random()
      .toString(36)
      .slice(2, 10);

  const emailLocal =
    normalizeString(
      user?.email
    )
      ?.split("@")[0];

  const rawCandidates = [
    preferredHandle,
    metadata.handle,
    metadata.username,
    metadata.user_name,
    metadata.preferred_username,
    emailLocal,
    `ari_${shortId}`
  ];

  const baseCandidates =
    [
      ...new Set(
        rawCandidates
          .map(
            sanitizeStarterHandle
          )
          .filter(Boolean)
      )
    ];

  const withFallback =
    baseCandidates.length
      ? baseCandidates
      : [
          `ari_${shortId}`
        ];

  const suffixed =
    withFallback.map(
      base => {
        const suffix =
          `_${shortId.slice(0, 6)}`;

        const maxBaseLength =
          30 -
          suffix.length;

        return sanitizeStarterHandle(
          `${base.slice(
            0,
            maxBaseLength
          )}${suffix}`
        );
      }
    );

  return [
    ...new Set(
      [
        ...withFallback,
        ...suffixed,
        sanitizeStarterHandle(
          `ari_${shortId}`
        )
      ]
        .filter(Boolean)
    )
  ];
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

    rpcs: {
      ...DEFAULT_RPCS
    },

    unsubscribers:
      []
  },

  configure({
    client,
    tables = {},
    buckets = {},
    rpcs = {}
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

    this.state.rpcs = {
      ...DEFAULT_RPCS,
      ...rpcs
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

  rpc(name) {
    const rpcName =
      this.state.rpcs[
        name
      ];

    if (!rpcName) {
      throw new Error(
        `Unknown ARI Circle RPC: ${name}`
      );
    }

    return rpcName;
  },

  async getAuthenticatedUser() {
    const client =
      this.getClient();

    if (
      !client.auth ||
      typeof client.auth.getUser !==
        "function"
    ) {
      return null;
    }

    const {
      data,
      error
    } =
      await client.auth
        .getUser();

    throwIfError(
      error,
      "Could not verify the signed-in user."
    );

    return data?.user ||
      null;
  },

  async getAuthenticatedUserId() {
    const user =
      await this
        .getAuthenticatedUser();

    return normalizeId(
      user?.id
    );
  },

  async ensureOwnProfile({
    userId = null,
    preferredHandle = null
  } = {}) {
    const authenticatedUser =
      await this
        .getAuthenticatedUser();

    const authenticatedUserId =
      normalizeId(
        authenticatedUser?.id
      );

    const requestedUserId =
      normalizeId(
        userId
      ) ||
      authenticatedUserId;

    if (
      !authenticatedUserId ||
      !requestedUserId
    ) {
      throw new Error(
        "You must be signed in to create an ARI Circle."
      );
    }

    if (
      requestedUserId !==
      authenticatedUserId
    ) {
      throw new Error(
        "A starter Circle can only be created for the signed-in user."
      );
    }

    const existing =
      await this
        .getProfileByUserId(
          authenticatedUserId
        );

    if (existing) {
      return existing;
    }

    const displayName =
      buildStarterDisplayName(
        authenticatedUser
      );

    const handleCandidates =
      buildStarterHandleCandidates(
        authenticatedUser,
        preferredHandle
      );

    const client =
      this.getClient();

    for (
      const handle
      of handleCandidates
    ) {
      const row = {
        user_id:
          authenticatedUserId,

        display_name:
          displayName,

        handle,

        bio:
          null,

        location:
          null,

        birthday:
          null,

        goal:
          null,

        bucket_list:
          null,

        favorite_song:
          null,

        favorite_food:
          null,

        favorite_movie:
          null,

        favorite_hobby:
          null,

        icebreakers:
          {},

        avatar_url:
          null,

        cover_url:
          null,

        top_circle_limit:
          6,

        messaging_visibility:
          "request",

        presence_visible:
          true
      };

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
          .insert(row)
          .select("*")
          .single();

      if (!error) {
        return data;
      }

      /*
       * 23505 = unique_violation.
       *
       * Two useful cases:
       * - another tab created this user's profile at the same time;
       * - the proposed @handle already belongs to somebody else.
       */
      if (
        error.code ===
        "23505"
      ) {
        const racedProfile =
          await this
            .getProfileByUserId(
              authenticatedUserId
            );

        if (racedProfile) {
          return racedProfile;
        }

        continue;
      }

      throwIfError(
        error,
        "Could not create your ARI Circle."
      );
    }

    throw new Error(
      "Could not generate an available ARI Circle handle."
    );
  },

  async getProfilesByIds(
    userIds
  ) {
    const ids =
      uniqueIds(
        userIds
      );

    if (!ids.length) {
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
            "profiles"
          )
        )
        .select("*")
        .in(
          "user_id",
          ids
        );

    throwIfError(
      error,
      "Could not load ARI Circle profiles."
    );

    return asArray(data);
  },

  async getProfileByUserId(
    userId
  ) {
    const id =
      normalizeId(
        userId
      );

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

    if (normalizedHandle) {
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

    if (
      !row.display_name ||
      !row.handle
    ) {
      throw new Error(
        "Display name and @handle are required before a Circle profile can be saved."
      );
    }

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
            "pending",

          blocked_by_user_id:
            null
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
      )
        ?.toLowerCase();

    if (
      !id ||
      !nextStatus ||
      !CONNECTION_BACKEND_STATES
        .has(nextStatus)
    ) {
      throw new Error(
        "A valid connection ID and status are required."
      );
    }

    const client =
      this.getClient();

    const patch = {
      status:
        nextStatus
    };

    if (
      nextStatus ===
      "blocked"
    ) {
      const blockerId =
        await this
          .getAuthenticatedUserId();

      if (!blockerId) {
        throw new Error(
          "You must be signed in to block a profile."
        );
      }

      patch.blocked_by_user_id =
        blockerId;
    } else {
      patch.blocked_by_user_id =
        null;
    }

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
        .update(patch)
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

  async blockUser(
    targetUserId
  ) {
    const targetId =
      normalizeId(
        targetUserId
      );

    if (!targetId) {
      throw new Error(
        "Target user ID is required."
      );
    }

    const client =
      this.getClient();

    /*
     * Block Patch V1.0.2:
     * - creates a blocked relationship if none exists
     * - reuses an existing pending/accepted relationship
     * - remains idempotent if already blocked
     * - cleans stale connection-request notifications
     */
    const {
      data,
      error
    } =
      await client.rpc(
        this.rpc(
          "blockUser"
        ),
        {
          target_user_id:
            targetId
        }
      );

    throwIfError(
      error,
      "Could not block this profile."
    );

    const relationshipId =
      normalizeId(
        data
      );

    if (!relationshipId) {
      throw new Error(
        "Profile was blocked but no relationship ID was returned."
      );
    }

    return {
      id:
        relationshipId,

      requestId:
        relationshipId,

      status:
        "blocked",

      targetUserId:
        targetId
    };
  },

  async unblockUser(
    targetUserId
  ) {
    const targetId =
      normalizeId(
        targetUserId
      );

    if (!targetId) {
      throw new Error(
        "Target user ID is required."
      );
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client.rpc(
        this.rpc(
          "unblockUser"
        ),
        {
          target_user_id:
            targetId
        }
      );

    throwIfError(
      error,
      "Could not unblock this profile."
    );

    return Boolean(data);
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
      data: rows,
      error
    } =
      await client
        .from(
          this.table(
            "topCircle"
          )
        )
        .select(
          "id, owner_user_id, member_user_id, position, created_at"
        )
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

    const cleanRows =
      asArray(rows);

    const memberIds =
      cleanRows
        .map(
          row =>
            normalizeId(
              row.member_user_id
            )
        )
        .filter(Boolean);

    const profiles =
      await this.getProfilesByIds(
        memberIds
      );

    const profileMap =
      mapProfileById(
        profiles
      );

    return cleanRows.map(
      row => ({
        ...row,

        member:
          profileMap.get(
            normalizeId(
              row.member_user_id
            )
          ) ||
          null
      })
    );
  },

  async saveTopCircle({
    ownerUserId,
    limit = 6,
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

    const selectedLimit =
      normalizeTopCircleLimit(
        limit
      );

    const normalizedMembers =
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

            const requestedPosition =
              normalizeInteger(
                member?.position,
                index
              );

            return {
              owner_user_id:
                ownerId,

              member_user_id:
                memberId,

              position:
                requestedPosition
            };
          }
        )
        .filter(Boolean)
        .slice(
          0,
          selectedLimit
        )
        .map(
          (
            row,
            index
          ) => ({
            ...row,

            position:
              index
          })
        );

    const client =
      this.getClient();

    /*
     * Schema V1.0.1 explicitly stores Top 4 vs Top 6 on the profile.
     * Save that first so the Top Circle limit trigger sees the new value.
     */
    const {
      error: profileError
    } =
      await client
        .from(
          this.table(
            "profiles"
          )
        )
        .update({
          top_circle_limit:
            selectedLimit
        })
        .eq(
          "user_id",
          ownerId
        );

    throwIfError(
      profileError,
      "Could not save the Top Circle size."
    );

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

    if (
      !normalizedMembers.length
    ) {
      return [];
    }

    const {
      data,
      error
    } =
      await client
        .from(table)
        .insert(
          normalizedMembers
        )
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
        normalizeInteger(
          offset,
          0
        )
      );

    const size =
      Math.min(
        100,
        Math.max(
          1,
          normalizeInteger(
            limit,
            20
          )
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
          "*",
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

    const rows =
      asArray(data);

    const authorIds =
      uniqueIds(
        rows.map(
          row =>
            row.author_user_id
        )
      );

    const profiles =
      await this.getProfilesByIds(
        authorIds
      );

    const profileMap =
      mapProfileById(
        profiles
      );

    const items =
      rows.map(
        row => ({
          ...row,

          author:
            profileMap.get(
              normalizeId(
                row.author_user_id
              )
            ) ||
            null
        })
      );

    const total =
      Number.isFinite(
        Number(count)
      )
        ? Number(count)
        : items.length;

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

  async getConversationById(
    conversationId
  ) {
    const id =
      normalizeId(
        conversationId
      );

    if (!id) {
      return null;
    }

    const client =
      this.getClient();

    const {
      data: conversation,
      error
    } =
      await client
        .from(
          this.table(
            "conversations"
          )
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .maybeSingle();

    throwIfError(
      error,
      "Could not load conversation."
    );

    if (!conversation) {
      return null;
    }

    const userIds =
      uniqueIds([
        conversation.direct_user_a,
        conversation.direct_user_b
      ]);

    const profiles =
      await this.getProfilesByIds(
        userIds
      );

    const profileMap =
      mapProfileById(
        profiles
      );

    return {
      ...conversation,

      members:
        userIds.map(
          userId => ({
            user_id:
              userId,

            profile:
              profileMap.get(
                userId
              ) ||
              null
          })
        )
    };
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
      data: conversations,
      error
    } =
      await client
        .from(
          this.table(
            "conversations"
          )
        )
        .select("*")
        .or(
          `direct_user_a.eq.${id},direct_user_b.eq.${id}`
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

    const rows =
      asArray(
        conversations
      );

    if (!rows.length) {
      return [];
    }

    const profileIds =
      uniqueIds(
        rows.flatMap(
          conversation => [
            conversation
              .direct_user_a,

            conversation
              .direct_user_b
          ]
        )
      );

    const profiles =
      await this.getProfilesByIds(
        profileIds
      );

    const profileMap =
      mapProfileById(
        profiles
      );

    const conversationIds =
      rows
        .map(
          conversation =>
            normalizeId(
              conversation.id
            )
        )
        .filter(Boolean);

    const {
      data: ownMemberships,
      error: membershipsError
    } =
      await client
        .from(
          this.table(
            "conversationMembers"
          )
        )
        .select(
          "conversation_id, user_id, joined_at, last_read_at"
        )
        .eq(
          "user_id",
          id
        )
        .in(
          "conversation_id",
          conversationIds
        );

    throwIfError(
      membershipsError,
      "Could not load conversation read state."
    );

    const membershipMap =
      new Map(
        asArray(
          ownMemberships
        )
          .map(
            membership => [
              normalizeId(
                membership
                  .conversation_id
              ),
              membership
            ]
          )
      );

    return rows.map(
      conversation => {
        const userIds =
          uniqueIds([
            conversation
              .direct_user_a,

            conversation
              .direct_user_b
          ]);

        return {
          ...conversation,

          membership:
            membershipMap.get(
              normalizeId(
                conversation.id
              )
            ) ||
            null,

          members:
            userIds.map(
              memberUserId => ({
                user_id:
                  memberUserId,

                profile:
                  profileMap.get(
                    memberUserId
                  ) ||
                  null
              })
            )
        };
      }
    );
  },

  async findDirectConversation(
    otherUserId
  ) {
    const otherId =
      normalizeId(
        otherUserId
      );

    if (!otherId) {
      return null;
    }

    const client =
      this.getClient();

    const {
      data,
      error
    } =
      await client.rpc(
        this.rpc(
          "findDirectConversation"
        ),
        {
          other_user_id:
            otherId
        }
      );

    throwIfError(
      error,
      "Could not find direct conversation."
    );

    return normalizeId(
      data
    );
  },

  async createDirectConversation({
    otherUserId = null,
    userA = null,
    userB = null
  } = {}) {
    const callerId =
      await this
        .getAuthenticatedUserId();

    if (!callerId) {
      throw new Error(
        "You must be signed in to start a conversation."
      );
    }

    let otherId =
      normalizeId(
        otherUserId
      );

    /*
     * Backward-compatible support for the original
     * createDirectConversation({ userA, userB }) API.
     */
    if (!otherId) {
      const first =
        normalizeId(
          userA
        );

      const second =
        normalizeId(
          userB
        );

      if (
        first === callerId
      ) {
        otherId =
          second;
      } else if (
        second === callerId
      ) {
        otherId =
          first;
      }
    }

    if (
      !otherId ||
      otherId === callerId
    ) {
      throw new Error(
        "A direct conversation requires another user."
      );
    }

    const client =
      this.getClient();

    /*
     * Schema V1.0.1 blocks direct INSERTs into ari_conversations.
     * All new direct threads MUST go through this protected RPC.
     *
     * The RPC:
     * - prevents duplicates
     * - checks blocking
     * - checks recipient messaging_visibility
     * - recognizes accepted message requests
     * - creates both membership rows
     */
    const {
      data: conversationId,
      error
    } =
      await client.rpc(
        this.rpc(
          "createDirectConversation"
        ),
        {
          other_user_id:
            otherId
        }
      );

    throwIfError(
      error,
      "Could not start this conversation."
    );

    const id =
      normalizeId(
        conversationId
      );

    if (!id) {
      throw new Error(
        "Conversation was created but no conversation ID was returned."
      );
    }

    return this.getConversationById(
      id
    );
  },

  async markConversationRead(
    conversationId,
    userId = null
  ) {
    const conversation =
      normalizeId(
        conversationId
      );

    const memberId =
      normalizeId(
        userId
      ) ||
      await this
        .getAuthenticatedUserId();

    if (
      !conversation ||
      !memberId
    ) {
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
            "conversationMembers"
          )
        )
        .update({
          last_read_at:
            new Date()
              .toISOString()
        })
        .eq(
          "conversation_id",
          conversation
        )
        .eq(
          "user_id",
          memberId
        );

    throwIfError(
      error,
      "Could not update conversation read state."
    );

    return true;
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
              normalizeInteger(
                limit,
                50
              )
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

    /*
     * Do NOT update ari_conversations from the client.
     * Schema V1.0.1's message trigger updates
     * last_message_at / updated_at server-side.
     */
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
      )
        ?.toLowerCase();

    if (
      !id ||
      !nextStatus ||
      !MESSAGE_REQUEST_STATES
        .has(nextStatus) ||
      nextStatus === "pending"
    ) {
      throw new Error(
        "A valid message request ID and transition are required."
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
              normalizeInteger(
                limit,
                50
              )
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
    upsert = false
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

  async removeProfileMedia({
    ownerUserId,
    mediaType,
    currentUrl = null
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
      (
        type !== "avatar" &&
        type !== "cover"
      )
    ) {
      throw new Error(
        "Valid profile media removal information is required."
      );
    }

    const client =
      this.getClient();

    const column =
      type === "avatar"
        ? "avatar_url"
        : "cover_url";

    let mediaUrl =
      normalizeString(
        currentUrl
      );

    if (!mediaUrl) {
      const profile =
        await this
          .getProfileByUserId(
            ownerId
          );

      mediaUrl =
        normalizeString(
          profile?.[column]
        );
    }

    const bucket =
      this.bucket(
        "profileMedia"
      );

    const storagePath =
      extractStoragePathFromPublicUrl(
        mediaUrl,
        bucket
      );

    /*
     * Clear the profile first so a stale/broken image never remains
     * attached if Storage deletion itself fails.
     */
    const {
      data: profile,
      error: profileError
    } =
      await client
        .from(
          this.table(
            "profiles"
          )
        )
        .update({
          [column]:
            null
        })
        .eq(
          "user_id",
          ownerId
        )
        .select("*")
        .single();

    throwIfError(
      profileError,
      "Could not remove the profile image."
    );

    if (storagePath) {
      const {
        error: storageError
      } =
        await client
          .storage
          .from(bucket)
          .remove([
            storagePath
          ]);

      if (storageError) {
        console.warn(
          "ARI Circle profile URL was cleared but old storage object cleanup failed.",
          storageError
        );
      }
    }

    return {
      profile,
      removedPath:
        storagePath
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

    const on =
      (
        eventName,
        handler
      ) => {
        const unsubscribe =
          CircleEvents.on(
            eventName,
            payload =>
              handler.call(
                this,
                getEventDetail(
                  payload
                )
              )
          );

        this.state
          .unsubscribers
          .push(
            unsubscribe
          );
      };

    on(
      EVENT_NAMES.PROFILE_UPDATED,
      this.handleProfilePersist
    );

    on(
      EVENT_NAMES.CONNECTION_REQUESTED,
      this.handleConnectionRequestedPersist
    );

    on(
      EVENT_NAMES.CONNECTION_ACCEPTED,
      detail =>
        this.handleConnectionStatusPersist(
          detail,
          "accepted"
        )
    );

    on(
      EVENT_NAMES.CONNECTION_DECLINED,
      detail =>
        this.handleConnectionStatusPersist(
          detail,
          "declined"
        )
    );

    on(
      EVENT_NAMES.CONNECTION_REMOVED,
      this.handleConnectionRemovedPersist
    );

    /*
     * CONNECTION_CHANGED is intentionally used only for actions that do
     * not have a dedicated event name: cancel outgoing request and block.
     * Accept/decline have dedicated listeners above, avoiding duplicates.
     */
    on(
      EVENT_NAMES.CONNECTION_CHANGED,
      this.handleConnectionChangedPersist
    );

    on(
      EVENT_NAMES.TOP_CIRCLE_CHANGED,
      this.handleTopCirclePersist
    );

    on(
      EVENT_NAMES.LOVE_CREATED,
      this.handleLoveCreatedPersist
    );

    on(
      EVENT_NAMES.LOVE_DELETED,
      this.handleLoveDeletedPersist
    );

    on(
      "circle:conversation-created",
      this.handleConversationCreatedPersist
    );

    on(
      EVENT_NAMES.MESSAGE_SENT,
      this.handleMessageSentPersist
    );

    on(
      "circle:message-request-created",
      this.handleMessageRequestCreatedPersist
    );

    on(
      "circle:message-request-accepted",
      detail =>
        this.handleMessageRequestStatusPersist(
          detail,
          "accepted"
        )
    );

    on(
      "circle:message-request-declined",
      detail =>
        this.handleMessageRequestStatusPersist(
          detail,
          "declined"
        )
    );

    on(
      "circle:message-request-canceled",
      detail =>
        this.handleMessageRequestStatusPersist(
          detail,
          "canceled"
        )
    );

    on(
      "circle:notification-read",
      this.handleNotificationReadPersist
    );

    on(
      "circle:notification-unread",
      this.handleNotificationUnreadPersist
    );

    on(
      "circle:notifications-all-read",
      this.handleAllNotificationsReadPersist
    );

    on(
      "circle:profile-media-ready",
      this.handleProfileMediaPersist
    );

    on(
      "circle:profile-media-remove",
      this.handleProfileMediaRemovePersist
    );
  },

  async handleProfilePersist(
    detail
  ) {
    if (!detail?.persist) {
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
    if (!detail?.persist) {
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
        id:
          saved.id,

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
    if (!detail?.persist) {
      return;
    }

    const requestId =
      normalizeId(
        detail?.request?.id ||
        detail?.requestId ||
        detail?.connection
          ?.requestId ||
        detail?.connection?.id
      );

    if (!requestId) {
      return;
    }

    try {
      const saved =
        await this
          .updateConnectionStatus(
            requestId,
            status
          );

      if (
        status ===
        "accepted"
      ) {
        CircleStore.setConnection({
          id:
            saved?.id ||
            requestId,

          status:
            "connected",

          requestId:
            saved?.id ||
            requestId,

          requestedByUserId:
            saved
              ?.requester_user_id ||
            null,

          pendingPersistence:
            false
        });
      }

      if (
        status ===
        "declined"
      ) {
        CircleStore.setConnection({
          status:
            "none",

          id:
            null,

          requestId:
            null,

          requestedByUserId:
            null,

          pendingPersistence:
            false
        });
      }
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
    if (!detail?.persist) {
      return;
    }

    const id =
      normalizeId(
        detail?.previous?.id ||
        detail?.previous
          ?.requestId ||
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

  async handleConnectionChangedPersist(
    detail
  ) {
    if (!detail?.persist) {
      return;
    }

    const action =
      normalizeString(
        detail?.action
      )
        ?.toLowerCase();

    if (
      action ===
      "cancel-request"
    ) {
      const id =
        normalizeId(
          detail?.request?.id ||
          detail?.previous?.id ||
          detail?.previous
            ?.requestId ||
          detail?.connection
            ?.requestId
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
              "Could not cancel Circle request."
          }
        );
      }

      return;
    }

    if (
      action === "block"
    ) {
      const context =
        CircleStore.get(
          "context"
        );

      const profile =
        CircleStore.get(
          "profile"
        ) || {};

      const current =
        CircleStore.get(
          "connection"
        ) || {};

      const targetUserId =
        normalizeId(
          detail?.targetUserId ||
          detail?.userId ||
          detail?.profileUserId ||
          detail?.connection
            ?.targetUserId ||
          context?.profileUserId ||
          profile?.user_id ||
          profile?.userId ||
          profile?.id
        );

      if (!targetUserId) {
        CircleEvents.reportError(
          new Error(
            "Could not resolve the profile to block."
          ),
          {
            message:
              "Could not block this profile."
          }
        );

        return;
      }

      try {
        const saved =
          await this.blockUser(
            targetUserId
          );

        CircleStore.setConnection({
          ...current,

          ...saved,

          requestedByUserId:
            current
              .requestedByUserId ||
            null,

          pendingPersistence:
            false
        });

        CircleEvents.emit(
          "circle:user-blocked",
          {
            targetUserId,

            connection:
              CircleStore.get(
                "connection"
              )
          }
        );
      } catch (error) {
        CircleEvents.reportError(
          error,
          {
            message:
              "Could not block this profile."
          }
        );
      }

      return;
    }

    if (
      action === "unblock"
    ) {
      const context =
        CircleStore.get(
          "context"
        );

      const profile =
        CircleStore.get(
          "profile"
        ) || {};

      const targetUserId =
        normalizeId(
          detail?.targetUserId ||
          detail?.userId ||
          detail?.profileUserId ||
          context?.profileUserId ||
          profile?.user_id ||
          profile?.userId ||
          profile?.id
        );

      if (!targetUserId) {
        CircleEvents.reportError(
          new Error(
            "Could not resolve the profile to unblock."
          ),
          {
            message:
              "Could not unblock this profile."
          }
        );

        return;
      }

      try {
        await this.unblockUser(
          targetUserId
        );

        CircleStore.setConnection({
          id:
            null,

          status:
            "none",

          requestId:
            null,

          requestedByUserId:
            null,

          targetUserId,

          pendingPersistence:
            false
        });

        CircleEvents.emit(
          "circle:user-unblocked",
          {
            targetUserId
          }
        );
      } catch (error) {
        CircleEvents.reportError(
          error,
          {
            message:
              "Could not unblock this profile."
          }
        );
      }
    }
  },

  async handleTopCirclePersist(
    detail
  ) {
    if (!detail?.persist) {
      return;
    }

    try {
      const context =
        CircleStore.get(
          "context"
        );

      const topCircle =
        detail?.topCircle ||
        CircleStore.get(
          "topCircle"
        ) ||
        {};

      const rows =
        await this.saveTopCircle({
          ownerUserId:
            context?.viewerUserId,

          limit:
            topCircle.limit,

          members:
            topCircle.members
        });

      const profile =
        CircleStore.get(
          "profile"
        );

      if (profile) {
        CircleStore.setProfile({
          ...profile,

          top_circle_limit:
            normalizeTopCircleLimit(
              topCircle.limit
            )
        });
      }

      return rows;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not save Top Circle."
        }
      );

      return null;
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
    if (!detail?.persist) {
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

  async handleConversationCreatedPersist(
    detail
  ) {
    if (
      !detail?.persist ||
      !detail?.conversation
    ) {
      return;
    }

    const localConversation =
      detail.conversation;

    const context =
      CircleStore.get(
        "context"
      );

    const viewerUserId =
      normalizeId(
        context?.viewerUserId
      );

    const memberIds =
      uniqueIds(
        asArray(
          localConversation.members
        )
          .map(
            member =>
              member?.userId ||
              member?.user_id ||
              member?.id
          )
      );

    const otherUserId =
      memberIds.find(
        id =>
          id !==
          viewerUserId
      );

    if (
      !viewerUserId ||
      !otherUserId
    ) {
      return;
    }

    try {
      const persisted =
        await this
          .createDirectConversation({
            otherUserId
          });

      CircleEvents.emit(
        "circle:conversation-persisted",
        {
          localConversationId:
            localConversation.id,

          conversation:
            persisted
        }
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not start this conversation."
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

      const saved =
        await this.sendMessage({
          conversationId:
            message.conversationId,

          senderUserId:
            message.senderUserId,

          body:
            message.body
        });

      CircleEvents.emit(
        "circle:message-persisted",
        {
          localMessageId:
            message.id,

          message:
            saved
        }
      );
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

      const saved =
        await this
          .createMessageRequest({
            senderUserId:
              request.senderUserId,

            receiverUserId:
              request.receiverUserId,

            message:
              request.message
          });

      CircleEvents.emit(
        "circle:message-request-persisted",
        {
          localRequestId:
            request.id,

          request:
            saved
        }
      );
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
    if (!detail?.persist) {
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
      const savedRequest =
        await this.updateMessageRequest(
          id,
          status
        );

      let conversation =
        null;

      /*
       * Schema V1.0.1 creates a direct conversation automatically when
       * the receiver accepts a message request.
       */
      if (
        status ===
        "accepted"
      ) {
        const callerId =
          await this
            .getAuthenticatedUserId();

        const otherUserId =
          normalizeId(
            savedRequest
              ?.sender_user_id
          ) === callerId
            ? normalizeId(
                savedRequest
                  ?.receiver_user_id
              )
            : normalizeId(
                savedRequest
                  ?.sender_user_id
              );

        if (otherUserId) {
          const conversationId =
            await this
              .findDirectConversation(
                otherUserId
              );

          if (conversationId) {
            conversation =
              await this
                .getConversationById(
                  conversationId
                );
          }
        }
      }

      CircleEvents.emit(
        "circle:message-request-status-persisted",
        {
          status,

          request:
            savedRequest,

          conversation
        }
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
    if (!detail?.persist) {
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

  async handleNotificationUnreadPersist(
    detail
  ) {
    if (!detail?.persist) {
      return;
    }

    try {
      await this.markNotificationRead(
        detail.notificationId,
        false
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

  async handleProfileMediaRemovePersist(
    detail
  ) {
    if (!detail?.persist) {
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
        ) ||
        {};

      const type =
        normalizeString(
          detail.mediaType
        )
          ?.toLowerCase();

      const currentUrl =
        type === "avatar"
          ? (
              profile.avatar_url ||
              profile.avatarUrl
            )
          : (
              profile.cover_url ||
              profile.coverUrl
            );

      const result =
        await this
          .removeProfileMedia({
            ownerUserId:
              context?.viewerUserId,

            mediaType:
              type,

            currentUrl
          });

      CircleStore.setProfile(
        result.profile
      );

      CircleEvents.emit(
        "circle:profile-media-removed",
        {
          mediaType:
            type,

          profile:
            result.profile,

          removedPath:
            result.removedPath
        }
      );
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not remove profile image."
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

      schemaContract:
        "ARI Circle Supabase V1.0.1 + Block Patch V1.0.2",

      firstRunProfileCreation:
        true,

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

      rpcs: {
        ...this.state.rpcs
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
  DEFAULT_BUCKETS,
  DEFAULT_RPCS
};

export default CircleApi;
