// js/ari-circle/media/profile-media.js
// ARI Circle
// V1.0.0
//
// Purpose:
// - Own profile avatar and background image selection.
// - Validate image files selected from the user's device.
// - Compress / resize images in the browser before upload.
// - Preview selected media immediately.
// - Emit upload/remove intents for the future data layer.
// - Keep media behavior separate from profile editing.
//
// This module does NOT:
// - Upload directly to Supabase Storage.
// - Persist profile URLs.
// - Query profile data.
// - Own general profile rendering.
//
// Future persistence flow:
//   ProfileMedia
//        -> optimized File
//        -> CircleEvents upload intent
//        -> data/circle-api.js
//        -> Supabase Storage
//        -> persisted public URL
//        -> CircleStore profile update
//
// Canonical media:
//   avatar
//   cover
//
// Mobile-first goal:
// Users should be able to choose a normal photo directly from
// their phone without HTML/CSS codes or external template sites.

import CircleStore from "../core/circle-store.js";
import CircleEvents, {
  EVENT_NAMES
} from "../core/circle-events.js";

const VERSION = "1.0.0";
const SOURCE = "ari-circle/media/profile-media";

const MEDIA_TYPES = Object.freeze({
  AVATAR:
    "avatar",

  COVER:
    "cover"
});

const MEDIA_CONFIG = Object.freeze({
  avatar: Object.freeze({
    maxBytes:
      8 * 1024 * 1024,

    outputMaxBytes:
      1.5 * 1024 * 1024,

    maxWidth:
      1200,

    maxHeight:
      1200,

    quality:
      0.86,

    outputType:
      "image/webp"
  }),

  cover: Object.freeze({
    maxBytes:
      12 * 1024 * 1024,

    outputMaxBytes:
      2.5 * 1024 * 1024,

    maxWidth:
      2000,

    maxHeight:
      1200,

    quality:
      0.84,

    outputType:
      "image/webp"
  })
});

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif"
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

function normalizeMediaType(value) {
  const normalized =
    normalizeString(value)
      ?.toLowerCase();

  if (
    normalized ===
    MEDIA_TYPES.AVATAR
  ) {
    return MEDIA_TYPES.AVATAR;
  }

  if (
    normalized ===
    MEDIA_TYPES.COVER
  ) {
    return MEDIA_TYPES.COVER;
  }

  return null;
}

function createFileName(
  type,
  mimeType
) {
  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/jpeg"
        ? "jpg"
        : "webp";

  return (
    `ari-circle-${type}-` +
    `${Date.now()}.${extension}`
  );
}

function formatBytes(value) {
  const bytes =
    Number(value) || 0;

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb =
    bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(
    kb / 1024
  ).toFixed(1)} MB`;
}

function revokeObjectUrl(value) {
  if (
    typeof value === "string" &&
    value.startsWith("blob:")
  ) {
    URL.revokeObjectURL(
      value
    );
  }
}

const ProfileMedia = {
  version:
    VERSION,

  source:
    SOURCE,

  state: {
    initialized:
      false,

    processing:
      {
        avatar:
          false,

        cover:
          false
      },

    previewUrls:
      {
        avatar:
          null,

        cover:
          null
      },

    pendingFiles:
      {
        avatar:
          null,

        cover:
          null
      },

    unsubscribers:
      []
  },

  dom: {
    avatarButton:
      null,

    avatarInput:
      null,

    avatarImage:
      null,

    avatarFallback:
      null,

    coverEditButton:
      null,

    coverInput:
      null,

    coverImage:
      null,

    coverFallback:
      null
  },

  init() {
    if (
      this.state.initialized
    ) {
      return this.getDiagnostics();
    }

    this.cacheDom();
    this.bindActions();
    this.bindInputs();

    this.state.initialized =
      true;

    return this.getDiagnostics();
  },

  cacheDom() {
    this.dom.avatarButton =
      document.getElementById(
        "circle-avatar-button"
      );

    this.dom.avatarInput =
      document.getElementById(
        "circle-avatar-input"
      );

    this.dom.avatarImage =
      document.getElementById(
        "circle-avatar-image"
      );

    this.dom.avatarFallback =
      document.getElementById(
        "circle-avatar-fallback"
      );

    this.dom.coverEditButton =
      document.getElementById(
        "circle-edit-cover-button"
      );

    this.dom.coverInput =
      document.getElementById(
        "circle-cover-input"
      );

    this.dom.coverImage =
      document.getElementById(
        "circle-cover-image"
      );

    this.dom.coverFallback =
      document.getElementById(
        "circle-cover-fallback"
      );
  },

  bindActions() {
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "edit-cover",
        () =>
          this.chooseCover()
      )
    );

    /*
     * profile-controller.js also listens for "avatar".
     * Keeping the actual file selection here makes this module
     * the final media authority. If ProfileController triggers
     * the input first, this call is harmless.
     */
    this.state.unsubscribers.push(
      CircleEvents.onAction(
        "avatar",
        () =>
          this.chooseAvatar()
      )
    );
  },

  bindInputs() {
    this.dom.avatarInput
      ?.addEventListener(
        "change",
        event =>
          this.handleInputChange(
            MEDIA_TYPES.AVATAR,
            event
          )
      );

    this.dom.coverInput
      ?.addEventListener(
        "change",
        event =>
          this.handleInputChange(
            MEDIA_TYPES.COVER,
            event
          )
      );
  },

  canEdit() {
    return Boolean(
      CircleStore.get(
        "context.isOwner"
      )
    );
  },

  chooseAvatar() {
    if (!this.canEdit()) {
      return false;
    }

    if (
      this.state.processing
        .avatar
    ) {
      return false;
    }

    this.dom.avatarInput
      ?.click();

    return true;
  },

  chooseCover() {
    if (!this.canEdit()) {
      return false;
    }

    if (
      this.state.processing
        .cover
    ) {
      return false;
    }

    this.dom.coverInput
      ?.click();

    return true;
  },

  async handleInputChange(
    mediaType,
    event
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      return;
    }

    const input =
      event?.target;

    const file =
      input?.files?.[0];

    /*
     * Reset immediately so choosing the same photo again later
     * still triggers a change event.
     */
    if (input) {
      input.value =
        "";
    }

    if (!file) {
      return;
    }

    await this.processFile(
      type,
      file
    );
  },

  async processFile(
    mediaType,
    file
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      throw new Error(
        "Unknown ARI Circle media type."
      );
    }

    if (!this.canEdit()) {
      CircleEvents.showToast(
        "You can only change media on your own Circle."
      );

      return null;
    }

    const validation =
      this.validateFile(
        type,
        file
      );

    if (!validation.valid) {
      CircleEvents.showToast(
        validation.message,
        {
          type:
            "error"
        }
      );

      return null;
    }

    this.setProcessing(
      type,
      true
    );

    try {
      const optimizedFile =
        await this.optimizeImage(
          type,
          file
        );

      this.setPendingFile(
        type,
        optimizedFile
      );

      this.previewFile(
        type,
        optimizedFile
      );

      const detail = {
        mediaType:
          type,

        originalFile:
          file,

        file:
          optimizedFile,

        originalBytes:
          file.size,

        optimizedBytes:
          optimizedFile.size,

        persist:
          true
      };

      CircleEvents.emit(
        "circle:profile-media-ready",
        detail
      );

      CircleEvents.showToast(
        `${type === MEDIA_TYPES.AVATAR ? "Profile photo" : "Background"} ready to upload.`
      );

      return optimizedFile;
    } catch (error) {
      CircleEvents.reportError(
        error,
        {
          message:
            "Could not process that image."
        }
      );

      return null;
    } finally {
      this.setProcessing(
        type,
        false
      );
    }
  },

  validateFile(
    mediaType,
    file
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (
      !type ||
      !(file instanceof File)
    ) {
      return {
        valid:
          false,

        message:
          "Choose a valid image file."
      };
    }

    const config =
      MEDIA_CONFIG[type];

    const mimeType =
      normalizeString(
        file.type
      )
        ?.toLowerCase();

    if (
      mimeType &&
      !ALLOWED_IMAGE_TYPES.has(
        mimeType
      )
    ) {
      return {
        valid:
          false,

        message:
          "Use a JPG, PNG, WebP, HEIC, or HEIF image."
      };
    }

    if (
      file.size >
      config.maxBytes
    ) {
      return {
        valid:
          false,

        message:
          `${type === MEDIA_TYPES.AVATAR ? "Profile photos" : "Background images"} must be under ${formatBytes(config.maxBytes)}.`
      };
    }

    return {
      valid:
        true,

      message:
        null
    };
  },

  async optimizeImage(
    mediaType,
    file
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    const config =
      MEDIA_CONFIG[type];

    /*
     * createImageBitmap has broad modern-browser support and
     * avoids manually keeping an <img> element around.
     *
     * HEIC/HEIF decoding depends on browser support. If the
     * browser cannot decode it, we surface a clean error instead
     * of silently uploading an unusable file.
     */
    let bitmap =
      null;

    try {
      bitmap =
        await createImageBitmap(
          file
        );
    } catch {
      throw new Error(
        "This device could not read that image format. Try JPG, PNG, or WebP."
      );
    }

    try {
      const dimensions =
        this.calculateDimensions({
          width:
            bitmap.width,

          height:
            bitmap.height,

          maxWidth:
            config.maxWidth,

          maxHeight:
            config.maxHeight
        });

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        dimensions.width;

      canvas.height =
        dimensions.height;

      const context =
        canvas.getContext(
          "2d",
          {
            alpha:
              false
          }
        );

      if (!context) {
        throw new Error(
          "Image processing is unavailable in this browser."
        );
      }

      context.imageSmoothingEnabled =
        true;

      context.imageSmoothingQuality =
        "high";

      context.drawImage(
        bitmap,
        0,
        0,
        dimensions.width,
        dimensions.height
      );

      let quality =
        config.quality;

      let blob =
        await this.canvasToBlob(
          canvas,
          config.outputType,
          quality
        );

      /*
       * Reduce JPEG/WebP quality gradually if the result is still
       * larger than our preferred upload target.
       */
      while (
        blob.size >
          config.outputMaxBytes &&
        quality >
          0.58
      ) {
        quality -=
          0.06;

        blob =
          await this.canvasToBlob(
            canvas,
            config.outputType,
            quality
          );
      }

      return new File(
        [
          blob
        ],
        createFileName(
          type,
          blob.type ||
          config.outputType
        ),
        {
          type:
            blob.type ||
            config.outputType,

          lastModified:
            Date.now()
        }
      );
    } finally {
      bitmap.close?.();
    }
  },

  calculateDimensions({
    width,
    height,
    maxWidth,
    maxHeight
  }) {
    const sourceWidth =
      Math.max(
        1,
        Number(width) || 1
      );

    const sourceHeight =
      Math.max(
        1,
        Number(height) || 1
      );

    const ratio =
      Math.min(
        1,
        maxWidth /
          sourceWidth,
        maxHeight /
          sourceHeight
      );

    return {
      width:
        Math.max(
          1,
          Math.round(
            sourceWidth *
            ratio
          )
        ),

      height:
        Math.max(
          1,
          Math.round(
            sourceHeight *
            ratio
          )
        )
    };
  },

  canvasToBlob(
    canvas,
    type,
    quality
  ) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(
                new Error(
                  "Image compression failed."
                )
              );

              return;
            }

            resolve(blob);
          },
          type,
          quality
        );
      }
    );
  },

  previewFile(
    mediaType,
    file
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type || !file) {
      return false;
    }

    this.clearPreviewUrl(
      type
    );

    const url =
      URL.createObjectURL(
        file
      );

    this.state.previewUrls[
      type
    ] =
      url;

    if (
      type ===
      MEDIA_TYPES.AVATAR
    ) {
      if (
        this.dom.avatarImage
      ) {
        this.dom.avatarImage.src =
          url;

        this.dom.avatarImage.alt =
          "Profile photo preview";

        this.dom.avatarImage.hidden =
          false;
      }

      if (
        this.dom.avatarFallback
      ) {
        this.dom.avatarFallback.hidden =
          true;
      }

      return true;
    }

    if (
      this.dom.coverImage
    ) {
      this.dom.coverImage.src =
        url;

      this.dom.coverImage.alt =
        "";

      this.dom.coverImage.hidden =
        false;
    }

    if (
      this.dom.coverFallback
    ) {
      this.dom.coverFallback.hidden =
        true;
    }

    return true;
  },

  setPendingFile(
    mediaType,
    file
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      return false;
    }

    this.state.pendingFiles[
      type
    ] =
      file || null;

    return true;
  },

  getPendingFile(
    mediaType
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      return null;
    }

    return (
      this.state.pendingFiles[
        type
      ] ||
      null
    );
  },

  commitMediaUrl(
    mediaType,
    url
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    const publicUrl =
      normalizeString(
        url
      );

    if (
      !type ||
      !publicUrl
    ) {
      return false;
    }

    const profile =
      CircleStore.get(
        "profile"
      ) || {};

    const patch =
      type === MEDIA_TYPES.AVATAR
        ? {
            avatar_url:
              publicUrl
          }
        : {
            cover_url:
              publicUrl
          };

    CircleStore.setProfile({
      ...profile,
      ...patch
    });

    this.state.pendingFiles[
      type
    ] =
      null;

    this.clearPreviewUrl(
      type
    );

    CircleEvents.emit(
      EVENT_NAMES.PROFILE_UPDATED,
      {
        profile:
          CircleStore.get(
            "profile"
          ),

        changes:
          patch,

        persist:
          false,

        source:
          this.source
      }
    );

    return true;
  },

  requestRemove(
    mediaType
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (
      !type ||
      !this.canEdit()
    ) {
      return false;
    }

    CircleEvents.emit(
      "circle:profile-media-remove",
      {
        mediaType:
          type,

        persist:
          true
      }
    );

    return true;
  },

  clearMedia(
    mediaType
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      return false;
    }

    const profile =
      CircleStore.get(
        "profile"
      ) || {};

    const nextProfile = {
      ...profile
    };

    if (
      type ===
      MEDIA_TYPES.AVATAR
    ) {
      nextProfile.avatar_url =
        null;
    } else {
      nextProfile.cover_url =
        null;
    }

    CircleStore.setProfile(
      nextProfile
    );

    this.state.pendingFiles[
      type
    ] =
      null;

    this.clearPreviewUrl(
      type
    );

    return true;
  },

  setProcessing(
    mediaType,
    value
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      return;
    }

    this.state.processing[
      type
    ] =
      Boolean(value);

    const control =
      type ===
      MEDIA_TYPES.AVATAR
        ? this.dom.avatarButton
        : this.dom.coverEditButton;

    if (control) {
      control.disabled =
        Boolean(value);

      control.setAttribute(
        "aria-busy",
        String(
          Boolean(value)
        )
      );
    }
  },

  clearPreviewUrl(
    mediaType
  ) {
    const type =
      normalizeMediaType(
        mediaType
      );

    if (!type) {
      return;
    }

    revokeObjectUrl(
      this.state.previewUrls[
        type
      ]
    );

    this.state.previewUrls[
      type
    ] =
      null;
  },

  clearAllPreviews() {
    this.clearPreviewUrl(
      MEDIA_TYPES.AVATAR
    );

    this.clearPreviewUrl(
      MEDIA_TYPES.COVER
    );
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
          "ARI Circle profile media unsubscribe failed",
          error
        );
      }
    }

    this.state.unsubscribers =
      [];

    this.clearAllPreviews();

    this.state.pendingFiles.avatar =
      null;

    this.state.pendingFiles.cover =
      null;

    this.state.processing.avatar =
      false;

    this.state.processing.cover =
      false;

    this.state.initialized =
      false;
  },

  getDiagnostics() {
    return {
      ready:
        this.state.initialized,

      source:
        this.source,

      version:
        this.version,

      processing: {
        ...this.state.processing
      },

      hasPendingAvatar:
        Boolean(
          this.state.pendingFiles
            .avatar
        ),

      hasPendingCover:
        Boolean(
          this.state.pendingFiles
            .cover
        ),

      avatarInputFound:
        Boolean(
          this.dom.avatarInput
        ),

      coverInputFound:
        Boolean(
          this.dom.coverInput
        )
    };
  }
};

export {
  ProfileMedia,
  MEDIA_TYPES,
  MEDIA_CONFIG,
  ALLOWED_IMAGE_TYPES
};

export default ProfileMedia;
