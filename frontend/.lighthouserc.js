module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000", "http://localhost:3000/info/1"],
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "categories:pwa": "off",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
