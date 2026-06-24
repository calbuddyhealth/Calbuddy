// ari/actions/ari-artifact-action-handoff.js
// Purpose: Convert Rebirth developer artifact understanding into safe proposed code/file actions.
// V1.0.0

window.Ari = window.Ari || {};

window.Ari.artifactActionHandoff = {
  version: "1.0.0",

  plan(summary = {}) {
    const fileContext =
      summary.githubFileContext ||
      summary.githubEvidence ||
      summary.appContext?.githubFileContext ||
      null;

    const content = String(fileContext?.content || "");
    const filePath = fileContext?.filePath || null;

    const text = String(
      summary.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).trim();

    const normalized = text.toLowerCase();

    const isArtifactRequest = this.isArtifactRequest(summary, normalized);

    if (!isArtifactRequest || !filePath || !content) {
      return {
        ...summary,
        artifactActionHandoffRan: true,
        artifactActionHandoffVersion: this.version,
        proposedArtifactActions: []
      };
    }

    const action = this.buildPatchAction({
      text,
      normalized,
      filePath,
      content
    });

    return {
      ...summary,
      artifactActionHandoffRan: true,
      artifactActionHandoffVersion: this.version,
      proposedArtifactActions: action ? [action] : []
    };
  },

  isArtifactRequest(summary = {}, text = "") {
    return Boolean(
      summary.githubEvidenceAvailable ||
      summary.semanticFrame?.responseCharacteristics?.expectsCodeOrArtifact ||
      summary.semanticResponseCharacteristics?.expectsCodeOrArtifact ||
      summary.situationMap?.needs?.includes("developer_artifact_operation") ||
      /\b(remove|change|update|replace|add|make|modify)\b/.test(text)
    );
  },

  buildPatchAction({ text = "", normalized = "", filePath = "", content = "" }) {
    let patched = content;

    if (
      normalized.includes("remove") &&
      normalized.includes("conversations") &&
      content.includes('<button class="ari-action-tile">Conversations</button>')
    ) {
      patched = content.replace(
        /\n\s*<button class="ari-action-tile">Conversations<\/button>/,
        ""
      );
    }

    if (
      normalized.includes("remove") &&
      normalized.includes("bottom") &&
      normalized.includes("3 tiles") &&
      content.includes('<section class="ari-action-grid three-actions">')
    ) {
      patched = content.replace(
        /<section class="ari-action-grid three-actions">[\s\S]*?<\/section>/,
        ""
      ).trim();
    }

    if (patched === content) return null;

    return {
      action_type: "github_edit_request",
      requires_approval: true,
      payload: {
        filePath,
        mode: "replace_file_content",
        originalContent: content,
        newContent: patched,
        userInstruction: text
      },
      confirmation_text: `Apply this change to ${filePath}?`
    };
  }
};