// js/ari-circle/index.js
// ARI Circle
// V1.3.1
//
// Single executable entry point for ari-circle.html.
//
// ari-circle.html should load ONLY:
//
//   <script
//     type="module"
//     src="js/ari-circle/index.js?v=1.3.1">
//   </script>
//
// All ARI Circle feature modules are imported here.
//
// Boot order:
//   1. CircleEvents
//   2. Viewer/auth identity
//   3. CircleContext
//   4. CircleStore
//   5. CircleApi / CircleRealtime configuration
//   6. Feature modules
//   7. Initial Circle data / first-run owner profile creation
//   8. Viewer-level conversations, notifications, requests, accepted Circle
//   9. Realtime bridges + subscriptions
//
// Supabase is injected rather than created here.
// Preferred explicit integration:
//
//   window.AriCircleConfig = {
//     supabaseClient
//   };
//
// Or:
//
//   AriCircleApp.configure({
//     client: supabaseClient
//   });
//
// This file does not create a duplicate Supabase client.
//
// V1.3.1:
// - Loads accepted Circle connections through CircleApi.getAcceptedConnections().
// - Resolves all accepted friend profiles for Top Circle editor choices.
// - Keeps incoming and outgoing pending requests loaded separately.
// - Returns accepted connections from loadViewerData().
// - Uses CircleApi V1.3.1.

import CircleContext from "./core/circle-context.js";
import CircleStore from "./core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "./core/circle-events.js";

import ProfileController from "./profile/profile-controller.js";
import ProfileRenderer from "./profile/profile-renderer.js";
import ProfileEditor from "./profile/profile-editor.js";

import ConnectionsController from "./connections/connections-controller.js";
import ConnectionRequests from "./connections/connection-requests.js?v=1.1.0";
import TopCircle from "./connections/top-circle.js";
import PeopleDiscovery from "./connections/people-discovery.js";

import LeaveSomeLove from "./comments/leave-some-love.js";

import MessagesController from "./messaging/messages-controller.js";
import Conversations from "./messaging/conversations.js";
import MessageRequests from "./messaging/message-requests.js";

import PresenceController from "./presence/presence-controller.js";
import ProfileMedia from "./media/profile-media.js";
import CircleNotifications from "./notifications/circle-notifications.js?v=1.1.0";

import CircleApi from "./data/circle-api.js?v=1.3.1";
import CircleRealtime, {
  REALTIME_EVENTS
} from "./data/circle-realtime.js";

const VERSION = "1.3.1";
const SOURCE = "ari-circle/index";

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

function looksLikeSupabaseClient(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.from === "function" &&
    typeof value.channel === "function"
  );
}

function mapTopCircleRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map(
      (row, index) => {
        const profile =
          row?.member &&
          typeof row.member === "object"
            ? row.member
            : row?.profile &&
              typeof row.profile === "object"
              ? row.profile
              : row;

        const userId =
          normalizeId(
            profile?.user_id ||
            profile?.userId ||
            row?.member_user_id ||
            row?.memberUserId ||
            profile?.id
          );

        if (!userId) {
          return null;
        }

        return {
          ...profile,

          userId,

          position:
            Number.isFinite(
              Number(
                row?.position
              )
            )
              ? Number(
                  row.position
                )
              : index
        };
      }
    )
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(a.position) -
        Number(b.position)
    );
}

function mapAcceptedConnectionProfiles(
  connections
) {
  if (!Array.isArray(connections)) {
    return [];
  }

  const seen =
    new Set();

  return connections
    .map(
      connection => {
        const profile =
          connection?.friendProfile &&
          typeof connection.friendProfile ===
            "object"
            ? connection.friendProfile
            : null;

        const userId =
          normalizeId(
            profile?.user_id ||
            profile?.userId ||
            connection?.friend_user_id ||
            profile?.id
          );

        if (
          !profile ||
          !userId ||
          seen.has(userId)
        ) {
          return null;
        }

        seen.add(userId);

        return {
          ...profile,
          userId
        };
      }
    )
    .filter(Boolean);
}

function normalizeConnectionRow(
  row,
  viewerUserId
) {
  if (
    !row ||
    typeof row !== "object"
  ) {
    return {
      status:
        "none",

      requestId:
        null,

      requestedByUserId:
        null,

      targetUserId:
        null,

      pendingPersistence:
        false
    };
  }

  const viewerId =
    normalizeId(
      viewerUserId
    );

  const requesterId =
    normalizeId(
      row.requester_user_id ||
      row.requesterUserId
    );

  const addresseeId =
    normalizeId(
      row.addressee_user_id ||
      row.addresseeUserId
    );

  const backendStatus =
    normalizeString(
      row.status
    )?.toLowerCase();

  let status =
    "none";

  if (
    backendStatus === "accepted" ||
    backendStatus === "connected"
  ) {
    status =
      "connected";
  } else if (
    backendStatus === "blocked"
  ) {
    status =
      "blocked";
  } else if (
    backendStatus === "pending"
  ) {
    status =
      requesterId === viewerId
        ? "outgoing_pending"
        : "incoming_pending";
  }

  return {
    id:
      normalizeId(
        row.id
      ),

    status,

    requestId:
      normalizeId(
        row.id
      ),

    requestedByUserId:
      requesterId,

    targetUserId:
      requesterId === viewerId
        ? addresseeId
        : requesterId,

    pendingPersistence:
      false,

    backendStatus
  };
}

const AriCircleApp = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    configured:
      false,

    booting:
      false,

    ready:
      false,

    destroyed:
      false,

    client:
      null,

    viewerUserId:
      null,

    viewerHandle:
      null,

    autoConnectRealtime:
      true,

    realtimeUnsubscribers:
      [],

    diagnostics:
      {}
  },

  dom: {
    main:
      null,

    status:
      null,

    statusText:
      null
  },

  modules: Object.freeze({
    CircleContext,
    CircleStore,
    CircleEvents,

    ProfileController,
    ProfileRenderer,
    ProfileEditor,

    ConnectionsController,
    ConnectionRequests,
    TopCircle,
    PeopleDiscovery,

    LeaveSomeLove,

    MessagesController,
    Conversations,
    MessageRequests,

    PresenceController,
    ProfileMedia,
    CircleNotifications,

    CircleApi,
    CircleRealtime
  }),

  configure({
    client = null,
    viewerUserId = null,
    viewerHandle = null,
    autoConnectRealtime = true
  } = {}) {
    if (
      client &&
      !looksLikeSupabaseClient(
        client
      )
    ) {
      throw new TypeError(
        "AriCircleApp.configure received an invalid Supabase client."
      );
    }

    if (client) {
      this.state.client =
        client;
    }

    if (
      viewerUserId !== null
    ) {
      this.state.viewerUserId =
        normalizeId(
          viewerUserId
        );
    }

    if (
      viewerHandle !== null
    ) {
      this.state.viewerHandle =
        normalizeHandle(
          viewerHandle
        );
    }

    this.state.autoConnectRealtime =
      autoConnectRealtime !== false;

    this.state.configured =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.main =
      document.getElementById(
        "ari-circle"
      );

    this.dom.status =
      document.getElementById(
        "circle-page-status"
      );

    this.dom.statusText =
      document.getElementById(
        "circle-page-status-text"
      );
  },

  setStatus(
    message,
    {
      error = false,
      hide = false
    } = {}
  ) {
    if (
      this.dom.statusText &&
      message !== undefined
    ) {
      this.dom.statusText.textContent =
        message || "";
    }

    if (this.dom.status) {
      this.dom.status.hidden =
        Boolean(hide);

      this.dom.status.dataset.state =
        error
          ? "error"
          : "loading";
    }
  },

  revealMain() {
    if (this.dom.main) {
      this.dom.main.hidden =
        false;
    }
  },

  hideMain() {
    if (this.dom.main) {
      this.dom.main.hidden =
        true;
    }
  },

  findSupabaseClient() {
    if (
      looksLikeSupabaseClient(
        this.state.client
      )
    ) {
      return this.state.client;
    }

    const explicitConfig =
      globalThis
        .AriCircleConfig;

    const candidates = [
      explicitConfig
        ?.supabaseClient,

      explicitConfig
        ?.client,

      globalThis
        .Ari
        ?.supabaseClient,

      globalThis
        .Ari
        ?.supabase,

      globalThis
        .ARI
        ?.supabaseClient,

      globalThis
        .ARI
        ?.supabase,

      globalThis
        .supabaseClient
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        looksLikeSupabaseClient(
          candidate
        )
      ) {
        this.state.client =
          candidate;

        return candidate;
      }
    }

    return null;
  },

  async resolveViewerIdentity(
    client
  ) {
    let viewerUserId =
      this.state.viewerUserId;

    let viewerHandle =
      this.state.viewerHandle;

    if (
      !viewerUserId &&
      client?.auth &&
      typeof client.auth.getUser ===
        "function"
    ) {
      try {
        const {
          data,
          error
        } =
          await client.auth
            .getUser();

        if (!error) {
          const user =
            data?.user;

          viewerUserId =
            normalizeId(
              user?.id
            );

          viewerHandle =
            viewerHandle ||
            normalizeHandle(
              user
                ?.user_metadata
                ?.handle ||
              user
                ?.user_metadata
                ?.username
            );
        }
      } catch (error) {
        console.warn(
          "ARI Circle could not resolve authenticated viewer.",
          error
        );
      }
    }

    this.state.viewerUserId =
      viewerUserId;

    this.state.viewerHandle =
      viewerHandle;

    return {
      viewerUserId,
      viewerHandle
    };
  },

  configureDataLayers(
    client
  ) {
    if (!client) {
      return false;
    }

    CircleApi.configure({
      client
    });

    CircleRealtime.configure({
      client
    });

    return true;
  },

  initializeFeatureModules() {
    /*
     * Core event delegation must exist before feature action
     * listeners begin receiving clicks.
     */
    CircleEvents.init({
      root:
        document,

      toast:
        document.getElementById(
          "circle-toast"
        )
    });

    const featureModules = [
      ProfileController,
      ProfileRenderer,
      ProfileEditor,

      ConnectionsController,
      ConnectionRequests,
      TopCircle,
      PeopleDiscovery,

      LeaveSomeLove,

      MessagesController,
      Conversations,
      MessageRequests,

      PresenceController,
      ProfileMedia,
      CircleNotifications
    ];

    for (
      const module
      of featureModules
    ) {
      try {
        module.init?.();
      } catch (error) {
        console.error(
          `ARI Circle module init failed: ${module?.source || "unknown"}`,
          error
        );

        CircleEvents.reportError(
          error,
          {
            message:
              "Part of ARI Circle could not start."
          }
        );
      }
    }
  },

  async resolveContext({
    viewerUserId,
    viewerHandle,
    client
  }) {
    let context =
      CircleContext.resolve({
        viewerUserId,
        viewerHandle
      });

    /*
     * ?handle= deliberately starts without a profile user ID.
     * Resolve it through CircleApi when a data client exists.
     */
    if (
      client &&
      context.profileReference
        ?.type === "handle" &&
      context.profileHandle
    ) {
      const profile =
        await CircleApi
          .getProfileByHandle(
            context.profileHandle
          );

      if (profile) {
        context =
          CircleContext.resolve({
            viewerUserId,
            viewerHandle,

            resolvedProfileUserId:
              profile.user_id,

            resolvedProfileHandle:
              profile.handle
          });
      }
    }

    return context;
  },

  async loadInitialData(
    context
  ) {
    const client =
      this.state.client;

    if (!client) {
      return {
        loaded:
          false,

        reason:
          "no-data-client"
      };
    }

    if (
      !context?.profileUserId &&
      !context?.profileHandle
    ) {
      return {
        loaded:
          false,

        reason:
          "no-profile-target"
      };
    }

    let activeContext =
      context;

    let bundle =
      await CircleApi
        .loadCircleBundle({
          viewerUserId:
            activeContext.viewerUserId,

          profileUserId:
            activeContext.profileUserId,

          profileHandle:
            activeContext.profileHandle
        });

    /*
     * First-run owner flow:
     *
     * Bare ari-circle.html means "open my Circle".
     * If the signed-in user's profile row does not exist yet,
     * create a safe starter profile and continue booting.
     *
     * Explicit ?user= / ?handle= visitor routes NEVER auto-create.
     */
    const shouldCreateOwnProfile =
      Boolean(
        !bundle?.profile &&
        activeContext.isAuthenticated &&
        activeContext.isOwner &&
        !activeContext.hasExplicitProfileTarget &&
        activeContext.viewerUserId &&
        activeContext.profileUserId ===
          activeContext.viewerUserId
      );

    if (shouldCreateOwnProfile) {
      this.setStatus(
        "Creating your ARI Circle..."
      );

      const starterProfile =
        await CircleApi
          .ensureOwnProfile({
            userId:
              activeContext.viewerUserId,

            preferredHandle:
              activeContext.viewerHandle
          });

      this.state.viewerHandle =
        normalizeHandle(
          starterProfile?.handle
        ) ||
        this.state.viewerHandle;

      activeContext =
        CircleContext.resolve({
          viewerUserId:
            activeContext.viewerUserId,

          viewerHandle:
            this.state.viewerHandle,

          resolvedProfileUserId:
            starterProfile.user_id,

          resolvedProfileHandle:
            starterProfile.handle
        });

      CircleStore.setContext(
        activeContext
      );

      bundle =
        await CircleApi
          .loadCircleBundle({
            viewerUserId:
              activeContext.viewerUserId,

            profileUserId:
              starterProfile.user_id,

            profileHandle:
              starterProfile.handle
          });
    }

    if (!bundle?.profile) {
      return {
        loaded:
          false,

        reason:
          "profile-not-found"
      };
    }

    /*
     * Resolve context one final time using the canonical profile
     * identity returned by the backend.
     */
    const finalContext =
      CircleContext.resolve({
        viewerUserId:
          activeContext.viewerUserId,

        viewerHandle:
          this.state.viewerHandle ||
          activeContext.viewerHandle ||
          bundle.profile.handle,

        resolvedProfileUserId:
          bundle.profile.user_id,

        resolvedProfileHandle:
          bundle.profile.handle
      });

    CircleStore.setContext(
      finalContext
    );

    CircleStore.setProfile(
      bundle.profile
    );

    CircleStore.setConnection(
      normalizeConnectionRow(
        bundle.connection,
        finalContext.viewerUserId
      )
    );

    const topMembers =
      mapTopCircleRows(
        bundle.topCircleRows
      );

    CircleStore.setTopCircle({
      /*
       * A saved list of 1-4 members is treated as Top 4.
       * Otherwise the page defaults to Top 6.
       */
      limit:
        topMembers.length > 0 &&
        topMembers.length <= 4
          ? 4
          : 6,

      members:
        topMembers
    });

    /*
     * Seed the Top Circle editor with the currently saved members.
     * loadViewerData() replaces this with the viewer's entire accepted
     * Circle once accepted relationships finish loading.
     */
    TopCircle.setAvailableMembers(
      topMembers
    );

    CircleStore.setLoveState({
      items:
        bundle.love?.items ||
        [],

      total:
        Number(
          bundle.love?.total
        ) || 0,

      hasMore:
        Boolean(
          bundle.love?.hasMore
        ),

      loading:
        false
    });

    CircleEvents.emit(
      EVENT_NAMES.PROFILE_LOADED,
      {
        profile:
          bundle.profile
      }
    );

    CircleEvents.emit(
      EVENT_NAMES.CONTEXT_READY,
      {
        context:
          finalContext
      }
    );

    /*
     * Viewer-level data is independent of which Circle is open.
     */
    if (
      finalContext.viewerUserId
    ) {
      await this.loadViewerData(
        finalContext.viewerUserId
      );
    }

    return {
      loaded:
        true,

      context:
        finalContext,

      profile:
        bundle.profile
    };
  },

  async loadViewerData(
    viewerUserId
  ) {
    const id =
      normalizeId(
        viewerUserId
      );

    if (!id) {
      return {
        conversations: [],
        notifications: [],
        connectionRequests: [],
        connections: []
      };
    }

    const [
      conversationsResult,
      notificationsResult,
      connectionRequestsResult,
      connectionsResult
    ] =
      await Promise.allSettled([
        CircleApi.getConversations(
          id
        ),

        CircleApi.getNotifications({
          userId:
            id,

          limit:
            50
        }),

        CircleApi.getPendingConnectionRequests(
          id
        ),

        CircleApi.getAcceptedConnections(
          id
        )
      ]);

    let conversations =
      [];

    let notifications =
      [];

    let connectionRequests =
      [];

    let connections =
      [];

    if (
      conversationsResult.status ===
      "fulfilled"
    ) {
      conversations =
        conversationsResult.value ||
        [];

      Conversations.setConversations(
        conversations
      );
    } else {
      console.warn(
        "ARI Circle conversations did not load.",
        conversationsResult.reason
      );
    }

    if (
      notificationsResult.status ===
      "fulfilled"
    ) {
      notifications =
        notificationsResult.value ||
        [];

      CircleNotifications
        .setNotifications(
          notifications
        );
    } else {
      console.warn(
        "ARI Circle notifications did not load.",
        notificationsResult.reason
      );
    }

    if (
      connectionRequestsResult.status ===
      "fulfilled"
    ) {
      connectionRequests =
        connectionRequestsResult.value ||
        [];

      const incoming =
        connectionRequests.filter(
          request =>
            normalizeId(
              request.addressee_user_id ||
              request.receiver_user_id
            ) === id
        );

      const outgoing =
        connectionRequests.filter(
          request =>
            normalizeId(
              request.requester_user_id ||
              request.sender_user_id
            ) === id
        );

      ConnectionRequests
        .setIncomingRequests(
          incoming
        );

      ConnectionRequests
        .setOutgoingRequests(
          outgoing
        );
    } else {
      console.warn(
        "ARI Circle requests did not load.",
        connectionRequestsResult.reason
      );
    }

    if (
      connectionsResult.status ===
      "fulfilled"
    ) {
      connections =
        connectionsResult.value ||
        [];

      /*
       * The Top Circle editor should be able to choose from every
       * accepted Circle member, not only people already featured.
       */
      const availableMembers =
        mapAcceptedConnectionProfiles(
          connections
        );

      TopCircle.setAvailableMembers(
        availableMembers
      );
    } else {
      console.warn(
        "ARI Circle accepted connections did not load.",
        connectionsResult.reason
      );
    }

    return {
      conversations,
      notifications,
      connectionRequests,
      connections
    };
  },

  bindRealtimeBridges() {
    if (
      this.state
        .realtimeUnsubscribers
        .length
    ) {
      return;
    }

    /*
     * Realtime transport emits normalized domain payloads.
     * The feature modules remain responsible for their own
     * detailed collections/business behavior.
     */

    this.state.realtimeUnsubscribers.push(
      CircleRealtime.on(
        REALTIME_EVENTS.MESSAGE,
        detail => {
          if (
            detail?.eventType ===
              "INSERT" &&
            detail?.row
          ) {
            const viewerUserId =
              CircleStore.get(
                "context.viewerUserId"
              );

            if (
              normalizeId(
                detail.row.sender_user_id
              ) !==
              normalizeId(
                viewerUserId
              )
            ) {
              Conversations.receiveMessage(
                detail.row
              );
            }
          }
        }
      )
    );

    this.state.realtimeUnsubscribers.push(
      CircleRealtime.on(
        REALTIME_EVENTS.MESSAGE_REQUEST,
        detail => {
          if (
            detail?.eventType !==
              "INSERT" ||
            !detail?.row
          ) {
            return;
          }

          const viewerUserId =
            normalizeId(
              CircleStore.get(
                "context.viewerUserId"
              )
            );

          const receiverUserId =
            normalizeId(
              detail.row
                .receiver_user_id
            );

          if (
            viewerUserId &&
            receiverUserId ===
              viewerUserId
          ) {
            MessageRequests.addIncomingRequest(
              detail.row
            );
          }
        }
      )
    );

    this.state.realtimeUnsubscribers.push(
      CircleRealtime.on(
        REALTIME_EVENTS.NOTIFICATION,
        detail => {
          if (!detail?.row) {
            return;
          }

          if (
            detail.eventType ===
            "INSERT"
          ) {
            CircleNotifications
              .addNotification(
                detail.row
              );

            return;
          }

          if (
            detail.eventType ===
            "DELETE"
          ) {
            CircleNotifications
              .removeNotification(
                detail.row.id
              );

            return;
          }

          if (
            detail.eventType ===
            "UPDATE"
          ) {
            /*
             * Replacing the collection keeps unread totals exact
             * without creating a second notification state model.
             */
            const current =
              CircleNotifications
                .getNotifications();

            const next =
              current.map(
                notification =>
                  normalizeId(
                    notification.id
                  ) ===
                  normalizeId(
                    detail.row.id
                  )
                    ? {
                        ...notification,
                        ...detail.row,

                        read:
                          Boolean(
                            detail.row
                              .is_read ??
                            detail.row
                              .read
                          )
                      }
                    : notification
              );

            CircleNotifications
              .setNotifications(
                next
              );
          }
        }
      )
    );

    this.state.realtimeUnsubscribers.push(
      CircleRealtime.on(
        REALTIME_EVENTS.CONNECTION,
        detail => {
          this.handleRealtimeConnection(
            detail
          );
        }
      )
    );
  },

  handleRealtimeConnection(
    detail
  ) {
    const row =
      detail?.row;

    if (!row) {
      return;
    }

    const context =
      CircleStore.get(
        "context"
      );

    const viewerUserId =
      normalizeId(
        context?.viewerUserId
      );

    const profileUserId =
      normalizeId(
        context?.profileUserId
      );

    if (!viewerUserId) {
      return;
    }

    const requesterUserId =
      normalizeId(
        row.requester_user_id
      );

    const addresseeUserId =
      normalizeId(
        row.addressee_user_id
      );

    const requestId =
      normalizeId(
        row.id
      );

    /*
     * Keep the viewer's request inbox live no matter which profile
     * is currently open.
     */
    if (requestId) {
      if (
        detail.eventType ===
          "DELETE" ||
        normalizeString(
          row.status
        ) !==
          "pending"
      ) {
        ConnectionRequests
          .removeIncomingRequest(
            requestId
          );

        ConnectionRequests
          .removeOutgoingRequest(
            requestId
          );
      } else if (
        addresseeUserId ===
          viewerUserId
      ) {
        ConnectionRequests
          .addIncomingRequest(
            row
          );
      } else if (
        requesterUserId ===
          viewerUserId
      ) {
        ConnectionRequests
          .addOutgoingRequest(
            row
          );
      }
    }

    /*
     * V1.3.1:
     * Accepted-Circle membership is now loadable through CircleApi.
     * Refresh viewer-level data when a relationship changes so the
     * Top Circle editor immediately gains/removes accepted members.
     *
     * This intentionally reuses the existing loader instead of creating
     * a second accepted-connection state authority in index.js.
     */
    const relationshipBelongsToViewer =
      requesterUserId ===
        viewerUserId ||
      addresseeUserId ===
        viewerUserId;

    if (relationshipBelongsToViewer) {
      this.loadViewerData(
        viewerUserId
      ).catch(
        error => {
          console.warn(
            "ARI Circle viewer connection data did not refresh.",
            error
          );
        }
      );
    }

    if (!profileUserId) {
      return;
    }

    const belongsToCurrentPair =
      (
        requesterUserId ===
          viewerUserId &&
        addresseeUserId ===
          profileUserId
      ) ||
      (
        requesterUserId ===
          profileUserId &&
        addresseeUserId ===
          viewerUserId
      );

    if (!belongsToCurrentPair) {
      return;
    }

    if (
      detail.eventType ===
      "DELETE"
    ) {
      CircleStore.setConnection({
        status:
          "none",

        requestId:
          null,

        requestedByUserId:
          null,

        targetUserId:
          profileUserId,

        pendingPersistence:
          false
      });

      return;
    }

    CircleStore.setConnection(
      normalizeConnectionRow(
        row,
        viewerUserId
      )
    );
  },

  async connectRealtime() {
    const context =
      CircleStore.get(
        "context"
      );

    if (
      !this.state.client ||
      !this.state
        .autoConnectRealtime ||
      !context
    ) {
      return false;
    }

    this.bindRealtimeBridges();

    const conversationIds =
      Conversations
        .getConversations()
        .map(
          conversation =>
            conversation.id
        )
        .filter(Boolean);

    try {
      await CircleRealtime.connect({
        viewerUserId:
          context.viewerUserId,

        profileUserId:
          context.profileUserId,

        conversationIds,

        presenceVisible:
          true
      });

      return true;
    } catch (error) {
      console.warn(
        "ARI Circle realtime did not connect.",
        error
      );

      return false;
    }
  },

  async boot(options = {}) {
    if (
      this.state.booting
    ) {
      return this.getDiagnostics();
    }

    if (
      this.state.ready &&
      !options.force
    ) {
      return this.getDiagnostics();
    }

    this.state.booting =
      true;

    this.state.destroyed =
      false;

    this.cacheDom();
    this.hideMain();

    this.setStatus(
      "Loading ARI Circle..."
    );

    try {
      if (
        options.client ||
        options.viewerUserId ||
        options.viewerHandle ||
        options.autoConnectRealtime !==
          undefined
      ) {
        this.configure(options);
      }

      /*
       * CircleEvents comes first so every later module can safely
       * report errors or register delegated actions.
       */
      CircleEvents.init({
        root:
          document,

        toast:
          document.getElementById(
            "circle-toast"
          )
      });

      const client =
        this.findSupabaseClient();

      if (client) {
        this.configureDataLayers(
          client
        );
      }

      const identity =
        await this
          .resolveViewerIdentity(
            client
          );

      const context =
        await this.resolveContext({
          ...identity,
          client
        });

      CircleStore.initialize(
        context
      );

      this.initializeFeatureModules();

      /*
       * No explicit profile + no authenticated viewer means there
       * is no Circle to resolve.
       */
      if (
        !context.profileUserId &&
        !context.profileHandle
      ) {
        this.setStatus(
          "Sign in to open your ARI Circle.",
          {
            error:
              false
          }
        );

        this.state.ready =
          true;

        this.state.booting =
          false;

        this.publishGlobal();

        return this.getDiagnostics();
      }

      if (!client) {
        /*
         * Keep the UI bootable for static/front-end integration.
         * Real data appears as soon as Ari injects its Supabase client.
         */
        this.revealMain();

        this.setStatus(
          "ARI Circle is ready for its data connection."
        );

        CircleEvents.emit(
          EVENT_NAMES.CONTEXT_READY,
          {
            context
          }
        );

        this.state.ready =
          true;

        this.state.booting =
          false;

        this.publishGlobal();

        return this.getDiagnostics();
      }

      CircleStore.set(
        "ui.loading",
        true
      );

      const result =
        await this.loadInitialData(
          context
        );

      CircleStore.set(
        "ui.loading",
        false
      );

      if (
        !result.loaded
      ) {
        if (
          result.reason ===
          "profile-not-found"
        ) {
          this.setStatus(
            "That ARI Circle could not be found.",
            {
              error:
                true
            }
          );
        } else {
          this.setStatus(
            "ARI Circle could not load this profile.",
            {
              error:
                true
            }
          );
        }

        this.state.ready =
          true;

        this.state.booting =
          false;

        this.publishGlobal();

        return this.getDiagnostics();
      }

      this.revealMain();

      this.setStatus(
        "",
        {
          hide:
            true
        }
      );

      await this.connectRealtime();

      this.state.ready =
        true;

      CircleEvents.emit(
        EVENT_NAMES.APP_READY,
        {
          context:
            CircleStore.get(
              "context"
            ),

          profile:
            CircleStore.get(
              "profile"
            )
        }
      );

      this.publishGlobal();

      return this.getDiagnostics();
    } catch (error) {
      console.error(
        "ARI Circle boot failed.",
        error
      );

      try {
        CircleStore.set(
          "ui.error",
          {
            message:
              error?.message ||
              "ARI Circle failed to load."
          }
        );
      } catch {
        // Store may not have initialized yet.
      }

      this.setStatus(
        "ARI Circle could not load.",
        {
          error:
            true
        }
      );

      CircleEvents.reportError?.(
        error,
        {
          message:
            "ARI Circle could not load."
        }
      );

      this.publishGlobal();

      return this.getDiagnostics();
    } finally {
      this.state.booting =
        false;
    }
  },

  publishGlobal() {
    const root =
      globalThis.Ari ||
      {};

    root.circle =
      this;

    globalThis.Ari =
      root;

    /*
     * Also expose the explicit app name for debugging/integration.
     */
    globalThis.AriCircleApp =
      this;
  },

  async reload() {
    const context =
      CircleStore.get(
        "context"
      );

    if (
      !context ||
      !this.state.client
    ) {
      return false;
    }

    this.setStatus(
      "Refreshing ARI Circle..."
    );

    CircleStore.set(
      "ui.loading",
      true
    );

    try {
      const result =
        await this.loadInitialData(
          context
        );

      if (result.loaded) {
        this.revealMain();

        this.setStatus(
          "",
          {
            hide:
              true
          }
        );

        return true;
      }

      return false;
    } finally {
      CircleStore.set(
        "ui.loading",
        false
      );
    }
  },

  async destroy() {
    if (
      this.state.destroyed
    ) {
      return true;
    }

    this.state.destroyed =
      true;

    for (
      const unsubscribe
      of this.state
        .realtimeUnsubscribers
    ) {
      try {
        unsubscribe?.();
      } catch (error) {
        console.warn(
          "ARI Circle realtime bridge cleanup failed.",
          error
        );
      }
    }

    this.state.realtimeUnsubscribers =
      [];

    const modules = [
      CircleNotifications,
      ProfileMedia,
      PresenceController,

      MessageRequests,
      Conversations,
      MessagesController,

      LeaveSomeLove,

      PeopleDiscovery,
      TopCircle,
      ConnectionRequests,
      ConnectionsController,

      ProfileEditor,
      ProfileRenderer,
      ProfileController
    ];

    for (
      const module
      of modules
    ) {
      try {
        await module.destroy?.();
      } catch (error) {
        console.warn(
          `ARI Circle module cleanup failed: ${module?.source || "unknown"}`,
          error
        );
      }
    }

    try {
      await CircleRealtime.destroy();
    } catch (error) {
      console.warn(
        "ARI Circle realtime cleanup failed.",
        error
      );
    }

    try {
      CircleApi.destroy();
    } catch (error) {
      console.warn(
        "ARI Circle API cleanup failed.",
        error
      );
    }

    CircleContext.clear();
    CircleStore.reset?.();

    this.state.ready =
      false;

    return true;
  },

  getDiagnostics() {
    const diagnostics = {
      ready:
        this.state.ready,

      booting:
        this.state.booting,

      source:
        this.source,

      version:
        this.version,

      clientConfigured:
        Boolean(
          this.state.client
        ),

      acceptedConnectionsLoader:
        typeof CircleApi
          .getAcceptedConnections ===
          "function",

      context:
        CircleContext
          .getCurrent?.() ||
        null,

      store:
        CircleStore
          .getState?.() ||
        null,

      modules: {
        events:
          CircleEvents
            .getDiagnostics?.(),

        profileController:
          ProfileController
            .getDiagnostics?.(),

        profileRenderer:
          ProfileRenderer
            .getDiagnostics?.(),

        profileEditor:
          ProfileEditor
            .getDiagnostics?.(),

        connections:
          ConnectionsController
            .getDiagnostics?.(),

        connectionRequests:
          ConnectionRequests
            .getDiagnostics?.(),

        topCircle:
          TopCircle
            .getDiagnostics?.(),

        peopleDiscovery:
          PeopleDiscovery
            .getDiagnostics?.(),

        love:
          LeaveSomeLove
            .getDiagnostics?.(),

        messages:
          MessagesController
            .getDiagnostics?.(),

        conversations:
          Conversations
            .getDiagnostics?.(),

        messageRequests:
          MessageRequests
            .getDiagnostics?.(),

        presence:
          PresenceController
            .getDiagnostics?.(),

        media:
          ProfileMedia
            .getDiagnostics?.(),

        notifications:
          CircleNotifications
            .getDiagnostics?.(),

        api:
          CircleApi
            .getDiagnostics?.(),

        realtime:
          CircleRealtime
            .getDiagnostics?.()
      }
    };

    this.state.diagnostics =
      diagnostics;

    return diagnostics;
  }
};

/*
 * Publish immediately so an existing Ari bootstrap can configure
 * the app before DOMContentLoaded if needed.
 */
AriCircleApp.publishGlobal();

async function autoBoot() {
  const explicit =
    globalThis
      .AriCircleConfig;

  if (
    explicit &&
    typeof explicit === "object"
  ) {
    AriCircleApp.configure({
      client:
        explicit.supabaseClient ||
        explicit.client ||
        null,

      viewerUserId:
        explicit.viewerUserId ||
        null,

      viewerHandle:
        explicit.viewerHandle ||
        null,

      autoConnectRealtime:
        explicit.autoConnectRealtime !==
        false
    });
  }

  await AriCircleApp.boot();
}

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      autoBoot();
    },
    {
      once:
        true
    }
  );
} else {
  autoBoot();
}

export {
  AriCircleApp
};

export default AriCircleApp;
