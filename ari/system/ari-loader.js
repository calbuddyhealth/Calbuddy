// ari/system/ari-loader.js
// Ari Architecture Loader
// Purpose: Load Ari's foundational architecture into a single usable object.
// This is the first code bridge between Ari's written architecture and the live app.

window.Ari = window.Ari || {};

window.Ari.loader = {
  version: "1.0.0",

  async loadTextFile(path) {
    const response = await fetch(path, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Failed to load Ari architecture file: ${path}`);
    }

    return await response.text();
  },

  async loadArchitecture() {
    const files = {
      constitution: "ari/constitution/ari-constitution.md",
      soul: "ari/soul/ari-soul.md",
      authority: "ari/authority/ari-authority-map.md",
      guardian: "ari/guardian/ari-guardian.md",
      brain: "ari/brain/ari-brain.md",
      router: "ari/brain/ari-router.md",
      selfModel: "ari/brain/ari-self-model.md",
      heart: "ari/heart/ari-heart.md",
      emotions: "ari/heart/ari-emotions.md",
      emotionEngine: "ari/heart/ari-emotion-engine.md",
      memoryEngine: "ari/memory-system/ari-memory-engine.md",
      canvas: "ari/canvas/ari-canvas.md",
      operatingModel: "ari/system/ari-operating-model.md",
      priorityMatrix: "ari/system/ari-priority-matrix.md",

      organs: {
        builder: "ari/organs/builder/ari-builder.md",
        coach: "ari/organs/coach/ari-coach.md",
        companion: "ari/organs/companion/ari-companion.md",
        creator: "ari/organs/creator/ari-creator.md",
        explorer: "ari/organs/explorer/ari-explorer.md",
        memory: "ari/organs/memory/ari-memory.md",
        observer: "ari/organs/observer/ari-observer.md",
        planner: "ari/organs/planner/ari-planner.md",
        reflection: "ari/organs/reflection/ari-reflection.md",
        relationship: "ari/organs/relationship/ari-relationship.md",
        storykeeper: "ari/organs/storykeeper/ari-storykeeper.md",
        teacher: "ari/organs/teacher/ari-teacher.md"
      }
    };

    const architecture = {
      version: this.version,
      loadedAt: new Date().toISOString(),
      files: {},
      organs: {}
    };

    const topLevelEntries = Object.entries(files).filter(
      ([key]) => key !== "organs"
    );

    for (const [key, path] of topLevelEntries) {
      architecture.files[key] = await this.loadTextFile(path);
    }

    for (const [organName, path] of Object.entries(files.organs)) {
      architecture.organs[organName] = await this.loadTextFile(path);
    }

    window.Ari.architecture = architecture;

    window.dispatchEvent(
      new CustomEvent("ari:architectureLoaded", {
        detail: architecture
      })
    );

    console.log("Ari architecture loaded.", architecture);

    return architecture;
  },

  getArchitecture() {
    return window.Ari.architecture || null;
  },

  isLoaded() {
    return Boolean(window.Ari.architecture);
  }
};