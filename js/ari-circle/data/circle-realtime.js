// js/ari-circle/data/circle-realtime.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Be the single Supabase Realtime boundary for ARI Circle.
// - Subscribe to database changes relevant to the current viewer/profile.
// - Track ephemeral online presence.
// - Normalize realtime payloads before the rest of the app sees them.
// - Update shared summary state where appropriate.
// - Emit ARI Circle realtime/domain events for feature modules.
//
// This module does NOT:
// - Persist data.
// - Render DOM.
// - Own connection/message/comment business rules.
// - Create a second copy of application state.
//
// Architecture:
//
//   Supabase Realtime
//          ↓
//   circle-realtime.js
//          ↓
//   CircleStore + CircleEvents
//          ↓
//   feature modules / renderers
//
// The Supabase client is injected:
//
//   CircleRealtime.configure({ client: supabase });
//
// Then:
//
//   await CircleRealtime.connect({
//     viewerUserId,
//     profileUserId,
//     conversationIds
//   });
//
// Presence is intentionally ephemeral. It is never written into the
// permanent profile row by this module.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

import {
  DEFAULT_TABLES
} from "./circle-api.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/data/circle-realtime";

const REALTIME_EVENTS = Object.freeze({
  PROFILE:
    "circle:realtime-profile",

  CONNECTION:
    "circle:realtime-connection",

  LOVE:
    "circle:realtime-love",

  MESSAGE:
    "circle:realtime-message",

  MESSAGE_REQUEST:
    "circle:realtime-message-request",

  NOTIFICATION:
    "circle:realtime-notification",

  PRESENCE:
    "circle:realtime-presence"
});

const PRESENCE_STATES = Object.freeze({
  ONLINE:
    "online",

  AWAY:
    "away",

  OFFLINE:
    "offline"
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

function normalizePresence(value) {
  const normalized =
    normalizeString(value)
      ?.toLowerCase();

  if (
    normalized ===
    PRESENCE_STATES.ONLINE ||
    normalized ===
    PRESENCE_STATES.AWAY
  ) {
    return normalized;
  }

  return PRESENCE_STATES.OFFLINE;
}

function normalizeTimestamp(value) {
  const normalized =
    normalizeString(value);

  if (!normalized) {
    return null;
  }

  const date =
    new Date(normalized);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function assertClient(client) {
  if (!client) {
    throw new Error(
      "ARI Circle Realtime client has not been configured."
    );
  }
}

function uniqueIds(values) {
  return [
    ...new Set(
      Array.isArray(values)
        ? values
            .map(normalizeId)
            .filter(Boolean)
        : []
    )
  ];
}

function getPayloadRow(payload) {
  if (
    payload?.eventType === "DELETE"
  ) {
    return payload.old || null;
  }

  return (
    payload?.new ||
    payload?.old ||
    null
  );
}

function rowTouchesUsers(
  row,
  userIds,
  keys
) {
  if (
    !row ||
    !userIds.length
  ) {
    return false;
  }

  for (const key of keys) {
    const value =
      normalizeId(
        row[key]
      );

    if (
      value &&
      userIds.includes(value)
    ) {
      return true;
    }
  }

  return false;
}

const CircleRealtime = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    configured:
      false,

    connected:
      false,

    client:
      null,

    tables: {
      ...DEFAULT_TABLES
    },

    viewerUserId:
      null,

    profileUserId:
      null,

    conversationIds:
      [],

    channels:
      new Map(),

    handlers:
      new Map(),

    presenceChannel:
      null,

    presenceKey:
      null,

    presenceVisible:
      true,

    lastPresenceState:
      PRESENCE_STATES.OFFLINE
  },

  configure({
    client,
    tables = {}
  } = {}) {
    assertClient(client);

    this.state.client =
      client;

    this.state.tables = {
      ...DEFAULT_TABLES,
      ...tables
    };

    this.state.configured =
      true;

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
      this.state.tables[name];

    if (!tableName) {
      throw new Error(
        `Unknown ARI Circle realtime table: ${name}`
      );
    }

    return tableName;
  },

  async connect({
    viewerUserId,
    profileUserId,
    conversationIds = [],
    presenceVisible = true
  } = {}) {
    if (
      !this.state.configured
    ) {
      throw new Error(
        "Configure CircleRealtime before connecting."
      );
    }

    await this.disconnect();

    this.state.viewerUserId =
      normalizeId(
        viewerUserId
      );

    this.state.profileUserId =
      normalizeId(
        profileUserId
      );

    this.state.conversationIds =
      uniqueIds(
        conversationIds
      );

    this.state.presenceVisible =
      presenceVisible !== false;

    this.subscribeProfile();
    this.subscribeConnections();
    this.subscribeLove();
    this.subscribeMessages();
    this.subscribeMessageRequests();
    this.subscribeNotifications();

    if (
      this.state.viewerUserId
    ) {
      await this.connectPresence();
    }

    this.state.connected =
      true;

    CircleEvents.emit(
      EVENT_NAMES.REALTIME_CONNECTED,
      {
        viewerUserId:
          this.state.viewerUserId,

        profileUserId:
          this.state.profileUserId,

        conversationIds: [
          ...this.state
            .conversationIds
        ]
      }
    );

    return this.getDiagnostics();
  },

  async disconnect() {
    const client =
      this.state.client;

    const channels =
      [
        ...this.state.channels
          .values()
      ];

    for (const channel of channels) {
      try {
        if (
          client &&
          typeof client.removeChannel ===
            "function"
        ) {
          await client.removeChannel(
            channel
          );
        } else {
          await channel
            ?.unsubscribe?.();
        }
      } catch (error) {
        console.warn(
          "ARI Circle realtime channel cleanup failed",
          error
        );
      }
    }

    this.state.channels.clear();

    this.state.presenceChannel =
      null;

    const wasConnected =
      this.state.connected;

    this.state.connected =
      false;

    if (wasConnected) {
      CircleEvents.emit(
        EVENT_NAMES.REALTIME_DISCONNECTED,
        {}
      );
    }

    return true;
  },

  createDatabaseChannel(
    name,
    table,
    callback
  ) {
    const client =
      this.getClient();

    const channel =
      client
        .channel(
          `ari-circle:${name}:${Date.now()}`
        )
        .on(
          "postgres_changes",
          {
            event:
              "*",

            schema:
              "public",

            table
          },
          callback
        )
        .subscribe(
          status => {
            if (
              status ===
              "CHANNEL_ERROR"
            ) {
              CircleEvents.reportError(
                new Error(
                  `Realtime channel failed: ${name}`
                ),
                {
                  message:
                    "ARI Circle realtime connection had a problem."
                }
              );
            }
          }
        );

    this.state.channels.set(
      name,
      channel
    );

    return channel;
  },

  subscribeProfile() {
    const profileUserId =
      this.state.profileUserId;

    if (!profileUserId) {
      return null;
    }

    return this.createDatabaseChannel(
      "profile",
      this.table(
        "profiles"
      ),
      payload => {
        const row =
          getPayloadRow(
            payload
          );

        if (
          normalizeId(
            row?.user_id
          ) !==
          profileUserId
        ) {
          return;
        }

        if (
          payload.eventType !==
          "DELETE"
        ) {
          CircleStore.setProfile(
            row
          );
        }

        this.dispatch(
          REALTIME_EVENTS.PROFILE,
          {
            eventType:
              payload.eventType,

            row
          }
        );
      }
    );
  },

  subscribeConnections() {
    const relevantUsers =
      uniqueIds([
        this.state.viewerUserId,
        this.state.profileUserId
      ]);

    if (
      !relevantUsers.length
    ) {
      return null;
    }

    return this.createDatabaseChannel(
      "connections",
      this.table(
        "connections"
      ),
      payload => {
        const row =
          getPayloadRow(
            payload
          );

        if (
          !rowTouchesUsers(
            row,
            relevantUsers,
            [
              "requester_user_id",
              "addressee_user_id",
              "user_id",
              "friend_user_id"
            ]
          )
        ) {
          return;
        }

        this.dispatch(
          REALTIME_EVENTS.CONNECTION,
          {
            eventType:
              payload.eventType,

            row
          }
        );
      }
    );
  },

  subscribeLove() {
    const profileUserId =
      this.state.profileUserId;

    if (!profileUserId) {
      return null;
    }

    return this.createDatabaseChannel(
      "love",
      this.table(
        "love"
      ),
      payload => {
        const row =
          getPayloadRow(
            payload
          );

        if (
          normalizeId(
            row?.profile_user_id
          ) !==
          profileUserId
        ) {
          return;
        }

        this.applyLoveChange(
          payload.eventType,
          row
        );

        this.dispatch(
          REALTIME_EVENTS.LOVE,
          {
            eventType:
              payload.eventType,

            row
          }
        );
      }
    );
  },

  subscribeMessages() {
    const viewerUserId =
      this.state.viewerUserId;

    if (!viewerUserId) {
      return null;
    }

    return this.createDatabaseChannel(
      "messages",
      this.table(
        "messages"
      ),
      payload => {
        const row =
          getPayloadRow(
            payload
          );

        const conversationId =
          normalizeId(
            row?.conversation_id
          );

        if (
          this.state.conversationIds
            .length &&
          conversationId &&
          !this.state.conversationIds
            .includes(
              conversationId
            )
        ) {
          return;
        }

        this.dispatch(
          REALTIME_EVENTS.MESSAGE,
          {
            eventType:
              payload.eventType,

            row
          }
        );

        if (
          payload.eventType ===
          "INSERT"
        ) {
          const senderUserId =
            normalizeId(
              row?.sender_user_id
            );

          if (
            senderUserId !==
            viewerUserId
          ) {
            const activeConversationId =
              normalizeId(
                CircleStore.get(
                  "messaging.activeConversationId"
                )
              );

            if (
              activeConversationId !==
              conversationId
            ) {
              const currentUnread =
                Number(
                  CircleStore.get(
                    "messaging.unreadCount"
                  )
                ) || 0;

              CircleStore.setMessagingState({
                unreadCount:
                  currentUnread + 1
              });
            }
          }
        }
      }
    );
  },

  subscribeMessageRequests() {
    const viewerUserId =
      this.state.viewerUserId;

    if (!viewerUserId) {
      return null;
    }

    return this.createDatabaseChannel(
      "message-requests",
      this.table(
        "messageRequests"
      ),
      payload => {
        const row =
          getPayloadRow(
            payload
          );

        if (
          !rowTouchesUsers(
            row,
            [
              viewerUserId
            ],
            [
              "sender_user_id",
              "receiver_user_id"
            ]
          )
        ) {
          return;
        }

        this.dispatch(
          REALTIME_EVENTS.MESSAGE_REQUEST,
          {
            eventType:
              payload.eventType,

            row
          }
        );

        if (
          payload.eventType ===
            "INSERT" &&
          normalizeId(
            row?.receiver_user_id
          ) === viewerUserId
        ) {
          CircleEvents.emit(
            EVENT_NAMES.MESSAGE_REQUEST_RECEIVED,
            {
              request:
                row
            }
          );
        }
      }
    );
  },

  subscribeNotifications() {
    const viewerUserId =
      this.state.viewerUserId;

    if (!viewerUserId) {
      return null;
    }

    return this.createDatabaseChannel(
      "notifications",
      this.table(
        "notifications"
      ),
      payload => {
        const row =
          getPayloadRow(
            payload
          );

        if (
          normalizeId(
            row?.user_id
          ) !==
          viewerUserId
        ) {
          return;
        }

        this.applyNotificationChange(
          payload.eventType,
          row
        );

        this.dispatch(
          REALTIME_EVENTS.NOTIFICATION,
          {
            eventType:
              payload.eventType,

            row
          }
        );
      }
    );
  },

  async connectPresence() {
    const client =
      this.getClient();

    const viewerUserId =
      this.state.viewerUserId;

    if (!viewerUserId) {
      return null;
    }

    const key =
      `user:${viewerUserId}`;

    this.state.presenceKey =
      key;

    const channel =
      client.channel(
        "ari-circle:presence",
        {
          config: {
            presence: {
              key
            }
          }
        }
      );

    channel.on(
      "presence",
      {
        event:
          "sync"
      },
      () => {
        this.handlePresenceSync(
          channel
        );
      }
    );

    channel.on(
      "presence",
      {
        event:
          "join"
      },
      ({
        key: joinedKey,
        newPresences
      }) => {
        this.handlePresenceJoin(
          joinedKey,
          newPresences
        );
      }
    );

    channel.on(
      "presence",
      {
        event:
          "leave"
      },
      ({
        key: leftKey,
        leftPresences
      }) => {
        this.handlePresenceLeave(
          leftKey,
          leftPresences
        );
      }
    );

    await new Promise(
      (
        resolve,
        reject
      ) => {
        channel.subscribe(
          async status => {
            if (
              status ===
              "SUBSCRIBED"
            ) {
              if (
                this.state
                  .presenceVisible
              ) {
                try {
                  await channel.track(
                    this.buildOwnPresence(
                      PRESENCE_STATES.ONLINE
                    )
                  );

                  this.state.lastPresenceState =
                    PRESENCE_STATES.ONLINE;
                } catch (error) {
                  console.warn(
                    "ARI Circle presence track failed",
                    error
                  );
                }
              }

              resolve();
            }

            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT"
            ) {
              reject(
                new Error(
                  "ARI Circle presence channel could not connect."
                )
              );
            }
          }
        );
      }
    );

    this.state.presenceChannel =
      channel;

    this.state.channels.set(
      "presence",
      channel
    );

    return channel;
  },

  buildOwnPresence(status) {
    return {
      user_id:
        this.state.viewerUserId,

      status:
        normalizePresence(
          status
        ),

      online_at:
        new Date()
          .toISOString(),

      visible:
        this.state
          .presenceVisible
    };
  },

  handlePresenceSync(channel) {
    const rawState =
      channel
        ?.presenceState?.() ||
      {};

    const flattened =
      [];

    for (
      const [
        key,
        entries
      ]
      of Object.entries(
        rawState
      )
    ) {
      const userId =
        normalizeId(
          key.replace(
            /^user:/,
            ""
          )
        );

      for (
        const entry
        of Array.isArray(entries)
          ? entries
          : []
      ) {
        flattened.push({
          userId:
            normalizeId(
              entry?.user_id
            ) ||
            userId,

          status:
            normalizePresence(
              entry?.status
            ),

          visible:
            entry?.visible !==
              false,

          lastSeenAt:
            normalizeTimestamp(
              entry?.online_at
            )
        });
      }
    }

    this.dispatch(
      REALTIME_EVENTS.PRESENCE,
      {
        action:
          "sync",

        presences:
          flattened
      }
    );

    for (
      const presence
      of flattened
    ) {
      this.applyPresenceToStore(
        presence
      );
    }
  },

  handlePresenceJoin(
    key,
    newPresences
  ) {
    const fallbackUserId =
      normalizeId(
        String(key || "")
          .replace(
            /^user:/,
            ""
          )
      );

    for (
      const entry
      of Array.isArray(
        newPresences
      )
        ? newPresences
        : []
    ) {
      const presence = {
        userId:
          normalizeId(
            entry?.user_id
          ) ||
          fallbackUserId,

        status:
          normalizePresence(
            entry?.status ||
            PRESENCE_STATES.ONLINE
          ),

        visible:
          entry?.visible !==
          false,

        lastSeenAt:
          normalizeTimestamp(
            entry?.online_at
          )
      };

      this.applyPresenceToStore(
        presence
      );

      this.dispatch(
        REALTIME_EVENTS.PRESENCE,
        {
          action:
            "join",

          presence
        }
      );
    }
  },

  handlePresenceLeave(
    key,
    leftPresences
  ) {
    const fallbackUserId =
      normalizeId(
        String(key || "")
          .replace(
            /^user:/,
            ""
          )
      );

    const entries =
      Array.isArray(
        leftPresences
      ) &&
      leftPresences.length
        ? leftPresences
        : [
            {}
          ];

    for (
      const entry
      of entries
    ) {
      const presence = {
        userId:
          normalizeId(
            entry?.user_id
          ) ||
          fallbackUserId,

        status:
          PRESENCE_STATES.OFFLINE,

        visible:
          entry?.visible !==
          false,

        lastSeenAt:
          new Date()
            .toISOString()
      };

      this.applyPresenceToStore(
        presence
      );

      this.dispatch(
        REALTIME_EVENTS.PRESENCE,
        {
          action:
            "leave",

          presence
        }
      );
    }
  },

  applyPresenceToStore(
    presence
  ) {
    const userId =
      normalizeId(
        presence?.userId
      );

    if (!userId) {
      return false;
    }

    const profileUserId =
      this.state.profileUserId;

    if (
      profileUserId &&
      userId === profileUserId
    ) {
      CircleStore.setPresence({
        status:
          normalizePresence(
            presence.status
          ),

        lastSeenAt:
          normalizeTimestamp(
            presence.lastSeenAt
          ),

        visible:
          presence.visible !==
          false
      });
    }

    const topCircle =
      CircleStore.get(
        "topCircle"
      ) || {};

    const members =
      Array.isArray(
        topCircle.members
      )
        ? topCircle.members
        : [];

    let changed =
      false;

    const nextMembers =
      members.map(
        member => {
          const memberUserId =
            normalizeId(
              member?.userId ||
              member?.user_id ||
              member?.id
            );

          if (
            memberUserId !==
            userId
          ) {
            return member;
          }

          changed =
            true;

          return {
            ...member,

            presence:
              normalizePresence(
                presence.status
              )
          };
        }
      );

    if (changed) {
      CircleStore.setTopCircle({
        ...topCircle,
        members:
          nextMembers
      });
    }

    CircleEvents.emit(
      EVENT_NAMES.PRESENCE_CHANGED,
      {
        scope:
          userId ===
          profileUserId
            ? "profile"
            : "member",

        userId,

        presence: {
          ...presence,

          status:
            normalizePresence(
              presence.status
            )
        }
      }
    );

    return true;
  },

  applyLoveChange(
    eventType,
    row
  ) {
    if (!row) {
      return;
    }

    const love =
      CircleStore.get(
        "love"
      ) || {};

    const currentItems =
      Array.isArray(
        love.items
      )
        ? love.items
        : [];

    const rowId =
      normalizeId(
        row.id
      );

    if (!rowId) {
      return;
    }

    let nextItems =
      currentItems;

    if (
      eventType === "INSERT"
    ) {
      const exists =
        currentItems.some(
          item =>
            normalizeId(
              item?.id
            ) === rowId
        );

      if (!exists) {
        nextItems =
          [
            row,
            ...currentItems
          ];
      }
    }

    if (
      eventType === "UPDATE"
    ) {
      nextItems =
        currentItems.map(
          item =>
            normalizeId(
              item?.id
            ) === rowId
              ? {
                  ...item,
                  ...row
                }
              : item
        );
    }

    if (
      eventType === "DELETE"
    ) {
      nextItems =
        currentItems.filter(
          item =>
            normalizeId(
              item?.id
            ) !== rowId
        );
    }

    CircleStore.setLoveState({
      ...love,

      items:
        nextItems,

      total:
        eventType === "INSERT"
          ? Math.max(
              Number(
                love.total
              ) || 0,
              currentItems.length
            ) +
            (
              nextItems.length >
              currentItems.length
                ? 1
                : 0
            )
          : eventType ===
              "DELETE"
            ? Math.max(
                0,
                (
                  Number(
                    love.total
                  ) ||
                  currentItems.length
                ) -
                (
                  nextItems.length <
                  currentItems.length
                    ? 1
                    : 0
                )
              )
            : Number(
                love.total
              ) ||
              nextItems.length
    });
  },

  applyNotificationChange(
    eventType,
    row
  ) {
    const currentUnread =
      Number(
        CircleStore.get(
          "notifications.unreadCount"
        )
      ) || 0;

    if (
      eventType === "INSERT" &&
      !Boolean(
        row?.is_read ||
        row?.read
      )
    ) {
      CircleStore.setNotificationsState({
        unreadCount:
          currentUnread + 1
      });

      return;
    }

    /*
     * Exact unread reconciliation for UPDATE/DELETE is best handled
     * by CircleNotifications, which owns the notification collection.
     * We emit the row so that module can reconcile precisely.
     */
  },

  async setOwnPresence(
    status
  ) {
    const channel =
      this.state
        .presenceChannel;

    if (
      !channel ||
      !this.state
        .viewerUserId
    ) {
      return false;
    }

    const normalized =
      normalizePresence(
        status
      );

    if (
      !this.state
        .presenceVisible
    ) {
      return false;
    }

    await channel.track(
      this.buildOwnPresence(
        normalized
      )
    );

    this.state.lastPresenceState =
      normalized;

    return true;
  },

  async setPresenceVisibility(
    visible
  ) {
    this.state.presenceVisible =
      Boolean(visible);

    const channel =
      this.state
        .presenceChannel;

    if (!channel) {
      return true;
    }

    if (
      !this.state
        .presenceVisible
    ) {
      try {
        await channel.untrack?.();
      } catch (error) {
        console.warn(
          "ARI Circle presence untrack failed",
          error
        );
      }

      return true;
    }

    await channel.track(
      this.buildOwnPresence(
        PRESENCE_STATES.ONLINE
      )
    );

    this.state.lastPresenceState =
      PRESENCE_STATES.ONLINE;

    return true;
  },

  async markAway() {
    return this.setOwnPresence(
      PRESENCE_STATES.AWAY
    );
  },

  async markOnline() {
    return this.setOwnPresence(
      PRESENCE_STATES.ONLINE
    );
  },

  registerConversation(
    conversationId
  ) {
    const id =
      normalizeId(
        conversationId
      );

    if (!id) {
      return false;
    }

    if (
      this.state
        .conversationIds
        .includes(id)
    ) {
      return true;
    }

    this.state.conversationIds =
      [
        ...this.state
          .conversationIds,
        id
      ];

    return true;
  },

  unregisterConversation(
    conversationId
  ) {
    const id =
      normalizeId(
        conversationId
      );

    if (!id) {
      return false;
    }

    const before =
      this.state
        .conversationIds
        .length;

    this.state.conversationIds =
      this.state
        .conversationIds
        .filter(
          item =>
            item !== id
        );

    return (
      this.state
        .conversationIds
        .length !== before
    );
  },

  on(
    eventName,
    handler
  ) {
    const name =
      normalizeString(
        eventName
      );

    if (
      !name ||
      typeof handler !==
        "function"
    ) {
      return () => {};
    }

    if (
      !this.state.handlers
        .has(name)
    ) {
      this.state.handlers.set(
        name,
        new Set()
      );
    }

    const handlers =
      this.state.handlers.get(
        name
      );

    handlers.add(
      handler
    );

    return () => {
      handlers.delete(
        handler
      );

      if (!handlers.size) {
        this.state.handlers.delete(
          name
        );
      }
    };
  },

  dispatch(
    eventName,
    detail
  ) {
    const handlers =
      this.state.handlers.get(
        eventName
      );

    if (handlers) {
      for (
        const handler
        of handlers
      ) {
        try {
          handler(detail);
        } catch (error) {
          console.error(
            "ARI Circle realtime handler failed",
            error
          );
        }
      }
    }

    CircleEvents.emit(
      eventName,
      detail
    );
  },

  async destroy() {
    await this.disconnect();

    this.state.handlers.clear();

    this.state.viewerUserId =
      null;

    this.state.profileUserId =
      null;

    this.state.conversationIds =
      [];

    this.state.presenceKey =
      null;

    this.state.client =
      null;

    this.state.configured =
      false;

    return true;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.configured,

      connected:
        this.state.connected,

      source:
        this.source,

      version:
        this.version,

      clientConfigured:
        Boolean(
          this.state.client
        ),

      viewerUserId:
        this.state.viewerUserId,

      profileUserId:
        this.state.profileUserId,

      conversationCount:
        this.state
          .conversationIds
          .length,

      channelCount:
        this.state
          .channels
          .size,

      presenceConnected:
        Boolean(
          this.state
            .presenceChannel
        ),

      presenceVisible:
        this.state
          .presenceVisible,

      presenceState:
        this.state
          .lastPresenceState
    };
  }
};

export {
  CircleRealtime,
  REALTIME_EVENTS,
  PRESENCE_STATES
};

export default CircleRealtime;
