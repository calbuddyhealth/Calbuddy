import { timingSafeEqual } from "crypto";

// api/ari-github-read.js
// Ari GitHub Read Endpoint
//
// Purpose:
// Provide controlled, branch-aware, read-only repository access for Ari.
// Supports exact file reads, line-range reads, directory listings,
// batch file reads, and bounded repository text search.
//
// V3.0.1 — Repository Investigation / Search / Range Reads / Crypto Import Fix

const DEFAULT_BRANCH =
  "1-build-calbuddy-v02--supabase-login-and-data-saving";

const MAX_PREVIEW_LENGTH = 1200;
const MAX_BATCH_FILES = 12;
const MAX_SEARCH_RESULTS = 50;
const MAX_SEARCH_FILES = 250;
const MAX_SEARCH_FILE_BYTES = 350_000;
const MAX_TOTAL_SEARCH_BYTES = 4_000_000;
const MAX_READ_FILE_BYTES = 2_000_000;

const DEFAULT_ALLOWED_PREFIXES = [
  "ari/",
  "api/ari-",
  "rebirth/",
  "assets/"
];

const BLOCKED_PATH_PATTERNS = [
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)\.github\/workflows(\/|$)/i,
  /(^|\/)node_modules(\/|$)/i,
  /(^|\/)secrets?(\/|$)/i,
  /(^|\/)credentials?(\/|$)/i,
  /(^|\/)private[-_]?keys?(\/|$)/i,
  /(^|\/)\.env(?:\.|$)/i,
  /\.(?:pem|key|p12|pfx|jks|keystore)$/i
];

const SEARCHABLE_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".md",
  ".txt",
  ".sql",
  ".yml",
  ".yaml"
]);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED"
      });
    }

    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch =
      cleanString(req.body?.branch) ||
      process.env.GITHUB_BRANCH ||
      DEFAULT_BRANCH;

    const authorization =
      verifyOwnerAuthorization(req);

    if (!authorization.authorized) {
      return res.status(403).json({
        success: false,
        error: "Owner authorization required",
        code: "OWNER_AUTH_REQUIRED"
      });
    }

    if (!token || !repo) {
      return res.status(500).json({
        success: false,
        error: "GitHub env variables missing",
        code: "MISSING_GITHUB_ENV"
      });
    }

    const operation =
      normalizeOperation(req.body?.operation);

    switch (operation) {
      case "read_file":
        return await handleReadFile({
          req,
          res,
          token,
          repo,
          branch,
          authorization
        });

      case "list_directory":
        return await handleListDirectory({
          req,
          res,
          token,
          repo,
          branch,
          authorization
        });

      case "batch_read":
        return await handleBatchRead({
          req,
          res,
          token,
          repo,
          branch,
          authorization
        });

      case "search_code":
        return await handleSearchCode({
          req,
          res,
          token,
          repo,
          branch,
          authorization
        });

      default:
        return res.status(400).json({
          success: false,
          error: "Unsupported operation",
          code: "UNSUPPORTED_OPERATION",
          supportedOperations: [
            "read_file",
            "list_directory",
            "batch_read",
            "search_code"
          ]
        });
    }
  } catch (error) {
    console.error("Ari GitHub read error:", error);

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Something went wrong",
      code: "ARI_GITHUB_READ_FAILED"
    });
  }
}

/* =====================================================
   OPERATIONS
===================================================== */

async function handleReadFile({
  req,
  res,
  token,
  repo,
  branch,
  authorization
}) {
  const filePath =
    cleanRepositoryPath(
      req.body?.filePath ||
      req.body?.path
    );

  const pathValidation =
    validateRepositoryPath(
      filePath,
      {
        allowRoot: false
      }
    );

  if (!pathValidation.valid) {
    return res.status(400).json({
      success: false,
      error: pathValidation.error,
      code: pathValidation.code,
      filePath
    });
  }

  const fileResult =
    await readGitHubFile({
      token,
      repo,
      branch,
      filePath
    });

  if (!fileResult.success) {
    return res
      .status(fileResult.status)
      .json(fileResult.body);
  }

  const startLine =
    normalizePositiveInteger(
      req.body?.startLine
    );

  const endLine =
    normalizePositiveInteger(
      req.body?.endLine
    );

  const rangeResult =
    selectLineRange({
      content:
        fileResult.content,
      startLine,
      endLine
    });

  return res.status(200).json({
    success: true,
    operation:
      "read_file",

    filePath,
    branch,

    sha:
      fileResult.sha,

    size:
      fileResult.size,

    encoding:
      fileResult.encoding,

    content:
      rangeResult.content,

    contentLength:
      rangeResult.content.length,

    fullFileContentLength:
      fileResult.content.length,

    lineCount:
      rangeResult.lineCount,

    fullFileLineCount:
      fileResult.lineCount,

    lineRange:
      rangeResult.lineRange,

    fullContent:
      rangeResult.isFullFile,

    contentComplete:
      rangeResult.isFullFile,

    isFullFile:
      rangeResult.isFullFile,

    hasExactCurrentCode:
      true,

    contentPreview:
      makePreview(
        rangeResult.content
      ),

    previewLength:
      Math.min(
        rangeResult.content.length,
        MAX_PREVIEW_LENGTH
      ),

    previewIsTruncated:
      rangeResult.content.length >
      MAX_PREVIEW_LENGTH,

    authorizationMode:
      authorization.mode,

    message:
      rangeResult.isFullFile
        ? `Read full file ${filePath} successfully.`
        : `Read lines ${rangeResult.lineRange.startLine}-${rangeResult.lineRange.endLine} from ${filePath} successfully.`
  });
}

async function handleListDirectory({
  req,
  res,
  token,
  repo,
  branch,
  authorization
}) {
  const directoryPath =
    cleanRepositoryPath(
      req.body?.directoryPath ??
      req.body?.filePath ??
      req.body?.path ??
      ""
    );

  const pathValidation =
    validateRepositoryPath(
      directoryPath,
      {
        allowRoot: true
      }
    );

  if (!pathValidation.valid) {
    return res.status(400).json({
      success: false,
      error: pathValidation.error,
      code: pathValidation.code,
      directoryPath
    });
  }

  const apiUrl =
    directoryPath
      ? buildContentsUrl({
          repo,
          path:
            directoryPath,
          branch
        })
      : `https://api.github.com/repos/${repo}/contents?ref=${encodeURIComponent(
          branch
        )}`;

  const response =
    await githubFetch(
      apiUrl,
      token
    );

  const data =
    await parseJsonResponse(
      response
    );

  if (!response.ok) {
    return res.status(
      response.status
    ).json({
      success: false,
      error:
        data?.message ||
        "GitHub directory listing failed",
      code:
        "GITHUB_DIRECTORY_LIST_FAILED",
      directoryPath,
      branch,
      github:
        sanitizeGitHubError(data)
    });
  }

  if (!Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      error:
        "Requested path is a file, not a directory.",
      code:
        "PATH_IS_FILE",
      directoryPath,
      branch
    });
  }

  const entries =
    data
      .map(item => ({
        name:
          item.name,
        path:
          item.path,
        type:
          item.type,
        sha:
          item.sha ||
          null,
        size:
          Number(item.size) ||
          0
      }))
      .filter(entry =>
        isRepositoryPathAllowed(
          entry.path,
          {
            allowRoot: false
          }
        )
      );

  return res.status(200).json({
    success: true,
    operation:
      "list_directory",

    directoryPath:
      directoryPath ||
      "/",

    branch,

    entryCount:
      entries.length,

    entries,

    authorizationMode:
      authorization.mode,

    message:
      `Listed ${entries.length} repository entries successfully.`
  });
}

async function handleBatchRead({
  req,
  res,
  token,
  repo,
  branch,
  authorization
}) {
  const requestedPaths =
    Array.isArray(
      req.body?.filePaths
    )
      ? req.body.filePaths
      : [];

  const filePaths = [
    ...new Set(
      requestedPaths
        .map(cleanRepositoryPath)
        .filter(Boolean)
    )
  ];

  if (!filePaths.length) {
    return res.status(400).json({
      success: false,
      error:
        "filePaths must contain at least one repository file path.",
      code:
        "MISSING_FILE_PATHS"
    });
  }

  if (
    filePaths.length >
    MAX_BATCH_FILES
  ) {
    return res.status(400).json({
      success: false,
      error:
        `A maximum of ${MAX_BATCH_FILES} files may be read per batch.`,
      code:
        "BATCH_LIMIT_EXCEEDED",
      maxBatchFiles:
        MAX_BATCH_FILES
    });
  }

  const invalidPath =
    filePaths.find(path =>
      !validateRepositoryPath(
        path,
        {
          allowRoot: false
        }
      ).valid
    );

  if (invalidPath) {
    const validation =
      validateRepositoryPath(
        invalidPath,
        {
          allowRoot: false
        }
      );

    return res.status(400).json({
      success: false,
      error:
        validation.error,
      code:
        validation.code,
      filePath:
        invalidPath
    });
  }

  const results =
    await mapWithConcurrency(
      filePaths,
      4,
      async filePath => {
        const result =
          await readGitHubFile({
            token,
            repo,
            branch,
            filePath
          });

        if (!result.success) {
          return {
            success:
              false,
            filePath,
            status:
              result.status,
            error:
              result.body?.error ||
              "GitHub read failed",
            code:
              result.body?.code ||
              "GITHUB_READ_FAILED"
          };
        }

        return {
          success:
            true,
          filePath,
          sha:
            result.sha,
          size:
            result.size,
          lineCount:
            result.lineCount,
          content:
            result.content,
          fullContent:
            true,
          contentComplete:
            true,
          hasExactCurrentCode:
            true
        };
      }
    );

  const successCount =
    results.filter(
      result =>
        result.success
    ).length;

  return res.status(200).json({
    success:
      successCount > 0,

    operation:
      "batch_read",

    branch,

    requestedCount:
      filePaths.length,

    successCount,

    failureCount:
      filePaths.length -
      successCount,

    files:
      results,

    authorizationMode:
      authorization.mode,

    message:
      `Read ${successCount} of ${filePaths.length} requested files.`
  });
}

async function handleSearchCode({
  req,
  res,
  token,
  repo,
  branch,
  authorization
}) {
  const query =
    cleanString(
      req.body?.query
    );

  if (!query) {
    return res.status(400).json({
      success: false,
      error:
        "query is required",
      code:
        "MISSING_SEARCH_QUERY"
    });
  }

  if (query.length > 300) {
    return res.status(400).json({
      success: false,
      error:
        "Search query is too long.",
      code:
        "SEARCH_QUERY_TOO_LONG"
    });
  }

  const searchPath =
    cleanRepositoryPath(
      req.body?.searchPath ??
      req.body?.path ??
      "ari"
    );

  const pathValidation =
    validateRepositoryPath(
      searchPath,
      {
        allowRoot: true
      }
    );

  if (!pathValidation.valid) {
    return res.status(400).json({
      success: false,
      error:
        pathValidation.error,
      code:
        pathValidation.code,
      searchPath
    });
  }

  const caseSensitive =
    req.body?.caseSensitive ===
    true;

  const maxResults =
    clampInteger(
      req.body?.maxResults,
      1,
      MAX_SEARCH_RESULTS,
      25
    );

  const fileExtensions =
    normalizeExtensionFilter(
      req.body?.extensions
    );

  const treeResult =
    await readRepositoryTree({
      token,
      repo,
      branch
    });

  if (!treeResult.success) {
    return res
      .status(treeResult.status)
      .json(treeResult.body);
  }

  const candidateFiles =
    treeResult.entries
      .filter(entry =>
        entry.type ===
        "blob"
      )
      .filter(entry =>
        isPathInside(
          entry.path,
          searchPath
        )
      )
      .filter(entry =>
        isRepositoryPathAllowed(
          entry.path,
          {
            allowRoot: false
          }
        )
      )
      .filter(entry =>
        isSearchableFile(
          entry.path,
          fileExtensions
        )
      )
      .filter(entry =>
        Number(entry.size || 0) <=
        MAX_SEARCH_FILE_BYTES
      )
      .slice(
        0,
        MAX_SEARCH_FILES
      );

  const needle =
    caseSensitive
      ? query
      : query.toLowerCase();

  let scannedBytes = 0;
  let scannedFiles = 0;
  const matches = [];

  await mapWithConcurrency(
    candidateFiles,
    5,
    async entry => {
      if (
        matches.length >=
        maxResults ||
        scannedBytes >=
        MAX_TOTAL_SEARCH_BYTES
      ) {
        return;
      }

      const result =
        await readGitHubFile({
          token,
          repo,
          branch,
          filePath:
            entry.path,
          maxBytes:
            MAX_SEARCH_FILE_BYTES
        });

      if (!result.success) {
        return;
      }

      scannedFiles += 1;
      scannedBytes +=
        result.content.length;

      const lines =
        result.content.split(
          "\n"
        );

      for (
        let index = 0;
        index < lines.length;
        index += 1
      ) {
        if (
          matches.length >=
          maxResults
        ) {
          break;
        }

        const line =
          lines[index];

        const haystack =
          caseSensitive
            ? line
            : line.toLowerCase();

        if (
          !haystack.includes(
            needle
          )
        ) {
          continue;
        }

        matches.push({
          filePath:
            entry.path,

          lineNumber:
            index + 1,

          line:
            line.trim(),

          context:
            buildLineContext(
              lines,
              index,
              2
            ),

          sha:
            result.sha
        });
      }
    }
  );

  return res.status(200).json({
    success: true,
    operation:
      "search_code",

    query,
    caseSensitive,

    searchPath:
      searchPath ||
      "/",

    branch,

    candidateFileCount:
      candidateFiles.length,

    scannedFileCount:
      scannedFiles,

    scannedBytes,

    resultCount:
      matches.length,

    maxResults,

    truncated:
      matches.length >=
        maxResults ||
      candidateFiles.length >=
        MAX_SEARCH_FILES ||
      scannedBytes >=
        MAX_TOTAL_SEARCH_BYTES,

    matches,

    authorizationMode:
      authorization.mode,

    message:
      `Found ${matches.length} matching code locations.`
  });
}

/* =====================================================
   GITHUB ACCESS
===================================================== */

async function readGitHubFile({
  token,
  repo,
  branch,
  filePath,
  maxBytes =
    MAX_READ_FILE_BYTES
}) {
  const apiUrl =
    buildContentsUrl({
      repo,
      path:
        filePath,
      branch
    });

  const response =
    await githubFetch(
      apiUrl,
      token
    );

  const data =
    await parseJsonResponse(
      response
    );

  if (!response.ok) {
    return {
      success:
        false,

      status:
        response.status,

      body: {
        success:
          false,
        error:
          data?.message ||
          "GitHub read failed",
        code:
          "GITHUB_READ_FAILED",
        filePath,
        branch,
        github:
          sanitizeGitHubError(
            data
          )
      }
    };
  }

  if (Array.isArray(data)) {
    return {
      success:
        false,

      status:
        400,

      body: {
        success:
          false,
        error:
          "Requested path is a directory, not a file.",
        code:
          "PATH_IS_DIRECTORY",
        filePath,
        branch,
        entries:
          data.map(item => ({
            name:
              item.name,
            path:
              item.path,
            type:
              item.type
          }))
      }
    };
  }

  const declaredSize =
    Number(data?.size) ||
    0;

  if (
    declaredSize >
    maxBytes
  ) {
    return {
      success:
        false,

      status:
        413,

      body: {
        success:
          false,
        error:
          `File exceeds the ${maxBytes}-byte read limit.`,
        code:
          "FILE_TOO_LARGE",
        filePath,
        branch,
        size:
          declaredSize,
        maxBytes
      }
    };
  }

  if (
    !data?.content ||
    data.encoding !==
      "base64"
  ) {
    return {
      success:
        false,

      status:
        400,

      body: {
        success:
          false,
        error:
          "GitHub file content was not readable.",
        code:
          "UNREADABLE_CONTENT",
        filePath,
        branch,
        encoding:
          data?.encoding ||
          null
      }
    };
  }

  const content =
    Buffer.from(
      data.content,
      "base64"
    ).toString(
      "utf8"
    );

  if (
    content.length >
    maxBytes
  ) {
    return {
      success:
        false,

      status:
        413,

      body: {
        success:
          false,
        error:
          `Decoded file exceeds the ${maxBytes}-byte read limit.`,
        code:
          "FILE_TOO_LARGE",
        filePath,
        branch,
        size:
          content.length,
        maxBytes
      }
    };
  }

  return {
    success:
      true,

    filePath,
    branch,

    sha:
      data.sha,

    size:
      declaredSize ||
      content.length,

    encoding:
      data.encoding,

    content,

    lineCount:
      content
        ? content.split(
            "\n"
          ).length
        : 0
  };
}

async function readRepositoryTree({
  token,
  repo,
  branch
}) {
  const apiUrl =
    `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(
      branch
    )}?recursive=1`;

  const response =
    await githubFetch(
      apiUrl,
      token
    );

  const data =
    await parseJsonResponse(
      response
    );

  if (!response.ok) {
    return {
      success:
        false,

      status:
        response.status,

      body: {
        success:
          false,
        error:
          data?.message ||
          "GitHub repository tree read failed",
        code:
          "GITHUB_TREE_READ_FAILED",
        branch,
        github:
          sanitizeGitHubError(
            data
          )
      }
    };
  }

  return {
    success:
      true,

    entries:
      Array.isArray(
        data?.tree
      )
        ? data.tree
        : [],

    truncated:
      data?.truncated ===
      true
  };
}

function githubFetch(
  url,
  token
) {
  return fetch(url, {
    headers: {
      Authorization:
        `Bearer ${token}`,

      Accept:
        "application/vnd.github+json",

      "X-GitHub-Api-Version":
        "2022-11-28",

      "User-Agent":
        "Ari-CalBuddy-Repository-Reader"
    }
  });
}

async function parseJsonResponse(
  response
) {
  return response
    .json()
    .catch(() => ({}));
}

/* =====================================================
   AUTHORIZATION
===================================================== */

function verifyOwnerAuthorization(
  req
) {
  /*
   * Preferred production mode:
   * Set ARI_GITHUB_READ_SECRET and send:
   * Authorization: Bearer <secret>
   *
   * Legacy owner_access remains available for existing
   * owner-only application flows. Replace this fallback
   * with your authenticated Supabase owner lookup when
   * that server-side identity helper is available.
   */

  const configuredSecret =
    cleanString(
      process.env
        .ARI_GITHUB_READ_SECRET
    );

  const authorizationHeader =
    cleanString(
      req.headers
        ?.authorization
    );

  const bearerToken =
    authorizationHeader
      .toLowerCase()
      .startsWith(
        "bearer "
      )
      ? authorizationHeader
          .slice(7)
          .trim()
      : "";

  if (
    configuredSecret &&
    bearerToken &&
    timingSafeEqualStrings(
      bearerToken,
      configuredSecret
    )
  ) {
    return {
      authorized:
        true,
      mode:
        "server_secret"
    };
  }

  if (
    req.body?.owner_access ===
    true
  ) {
    return {
      authorized:
        true,
      mode:
        "legacy_owner_access"
    };
  }

  return {
    authorized:
      false,
    mode:
      null
  };
}

function timingSafeEqualStrings(
  left,
  right
) {
  const leftBuffer =
    Buffer.from(
      String(left || "")
    );

  const rightBuffer =
    Buffer.from(
      String(right || "")
    );

  if (
    leftBuffer.length !==
    rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer
  );
}

/* =====================================================
   PATH SAFETY
===================================================== */

function validateRepositoryPath(
  path,
  {
    allowRoot = false
  } = {}
) {
  if (
    !path &&
    allowRoot
  ) {
    return {
      valid:
        true
    };
  }

  if (!path) {
    return {
      valid:
        false,
      error:
        "A repository path is required.",
      code:
        "MISSING_FILE_PATH"
    };
  }

  if (
    path.includes("..") ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("\0")
  ) {
    return {
      valid:
        false,
      error:
        "Unsafe repository path rejected.",
      code:
        "UNSAFE_FILE_PATH"
    };
  }

  if (
    !isRepositoryPathAllowed(
      path,
      {
        allowRoot
      }
    )
  ) {
    return {
      valid:
        false,
      error:
        "Repository path is outside the approved read scope or matches a blocked sensitive path.",
      code:
        "FILE_PATH_NOT_ALLOWED"
    };
  }

  return {
    valid:
      true
  };
}

function isRepositoryPathAllowed(
  path,
  {
    allowRoot = false
  } = {}
) {
  const clean =
    cleanRepositoryPath(
      path
    );

  if (
    !clean &&
    allowRoot
  ) {
    return true;
  }

  if (!clean) {
    return false;
  }

  if (
    BLOCKED_PATH_PATTERNS.some(
      pattern =>
        pattern.test(clean)
    )
  ) {
    return false;
  }

  const configuredPrefixes =
    cleanString(
      process.env
        .ARI_GITHUB_READ_ALLOWED_PREFIXES
    )
      .split(",")
      .map(cleanRepositoryPath)
      .filter(Boolean);

  const allowedPrefixes =
    configuredPrefixes.length
      ? configuredPrefixes
      : DEFAULT_ALLOWED_PREFIXES;

  return allowedPrefixes.some(
    prefix =>
      clean ===
        prefix.replace(
          /\/$/,
          ""
        ) ||
      clean.startsWith(
        prefix.endsWith("/")
          ? prefix
          : `${prefix}/`
      ) ||
      (
        prefix.endsWith("-") &&
        clean.startsWith(
          prefix
        )
      )
  );
}

function cleanRepositoryPath(
  value
) {
  return cleanString(
    value
  )
    .replace(
      /^\.\/+/,
      ""
    )
    .replace(
      /\/+/g,
      "/"
    )
    .replace(
      /\/$/,
      ""
    );
}

function isPathInside(
  filePath,
  directoryPath
) {
  if (!directoryPath) {
    return true;
  }

  return (
    filePath ===
      directoryPath ||
    filePath.startsWith(
      `${directoryPath}/`
    )
  );
}

/* =====================================================
   CONTENT HELPERS
===================================================== */

function selectLineRange({
  content,
  startLine,
  endLine
}) {
  const lines =
    String(content || "")
      .split("\n");

  if (
    !startLine &&
    !endLine
  ) {
    return {
      content:
        String(content || ""),

      lineCount:
        lines.length,

      isFullFile:
        true,

      lineRange: {
        startLine:
          1,
        endLine:
          lines.length
      }
    };
  }

  const resolvedStart =
    Math.max(
      1,
      startLine ||
      1
    );

  const resolvedEnd =
    Math.min(
      lines.length,
      Math.max(
        resolvedStart,
        endLine ||
        resolvedStart
      )
    );

  const selected =
    lines.slice(
      resolvedStart - 1,
      resolvedEnd
    );

  return {
    content:
      selected.join(
        "\n"
      ),

    lineCount:
      selected.length,

    isFullFile:
      resolvedStart ===
        1 &&
      resolvedEnd ===
        lines.length,

    lineRange: {
      startLine:
        resolvedStart,
      endLine:
        resolvedEnd
    }
  };
}

function buildLineContext(
  lines,
  index,
  radius = 2
) {
  const start =
    Math.max(
      0,
      index -
      radius
    );

  const end =
    Math.min(
      lines.length,
      index +
      radius +
      1
    );

  return lines
    .slice(
      start,
      end
    )
    .map(
      (line, offset) => ({
        lineNumber:
          start +
          offset +
          1,
        line
      })
    );
}

function makePreview(
  text = ""
) {
  const clean =
    String(text || "");

  if (
    clean.length <=
    MAX_PREVIEW_LENGTH
  ) {
    return clean;
  }

  return `${clean.slice(
    0,
    MAX_PREVIEW_LENGTH
  )}...`;
}

function isSearchableFile(
  filePath,
  extensionFilter
) {
  const extension =
    getExtension(
      filePath
    );

  if (
    extensionFilter.size
  ) {
    return extensionFilter.has(
      extension
    );
  }

  return SEARCHABLE_EXTENSIONS.has(
    extension
  );
}

function normalizeExtensionFilter(
  value
) {
  if (!Array.isArray(value)) {
    return new Set();
  }

  return new Set(
    value
      .map(extension =>
        cleanString(
          extension
        ).toLowerCase()
      )
      .filter(Boolean)
      .map(extension =>
        extension.startsWith(".")
          ? extension
          : `.${extension}`
      )
  );
}

function getExtension(
  filePath
) {
  const name =
    cleanString(
      filePath
    )
      .split("/")
      .pop() ||
    "";

  const dotIndex =
    name.lastIndexOf(".");

  return dotIndex >= 0
    ? name
        .slice(dotIndex)
        .toLowerCase()
    : "";
}

/* =====================================================
   GENERAL UTILITIES
===================================================== */

function normalizeOperation(
  value
) {
  const operation =
    cleanString(
      value
    )
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      );

  if (!operation) {
    return "read_file";
  }

  const aliases = {
    read:
      "read_file",
    file:
      "read_file",
    read_file:
      "read_file",

    list:
      "list_directory",
    directory:
      "list_directory",
    list_directory:
      "list_directory",

    batch:
      "batch_read",
    batch_read:
      "batch_read",

    search:
      "search_code",
    search_code:
      "search_code"
  };

  return aliases[operation] ||
    operation;
}

function cleanString(
  value
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function normalizePositiveInteger(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(
      number
    ) ||
    number < 1
  ) {
    return null;
  }

  return number;
}

function clampInteger(
  value,
  minimum,
  maximum,
  fallback
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      Math.trunc(number)
    )
  );
}

function buildContentsUrl({
  repo,
  path,
  branch
}) {
  return `https://api.github.com/repos/${repo}/contents/${encodeURIComponentPath(
    path
  )}?ref=${encodeURIComponent(
    branch
  )}`;
}

function encodeURIComponentPath(
  filePath = ""
) {
  return String(filePath)
    .split("/")
    .map(part =>
      encodeURIComponent(
        part
      )
    )
    .join("/");
}

function sanitizeGitHubError(
  value
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return {
    message:
      value.message ||
      null,

    documentation_url:
      value.documentation_url ||
      null,

    status:
      value.status ||
      null
  };
}

async function mapWithConcurrency(
  items,
  concurrency,
  worker
) {
  const results =
    new Array(
      items.length
    );

  let cursor = 0;

  async function runWorker() {
    while (
      cursor <
      items.length
    ) {
      const index =
        cursor;

      cursor += 1;

      results[index] =
        await worker(
          items[index],
          index
        );
    }
  }

  const workerCount =
    Math.min(
      Math.max(
        1,
        concurrency
      ),
      items.length
    );

  await Promise.all(
    Array.from(
      {
        length:
          workerCount
      },
      () =>
        runWorker()
    )
  );

  return results;
}