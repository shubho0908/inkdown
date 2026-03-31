// @ts-check

const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");
const nextTypescript = require("eslint-config-next/typescript");

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
  },

  // Next.js recommended rules (React, React Hooks, @next/next)
  ...nextCoreWebVitals,

  // TypeScript-aware rules via typescript-eslint
  ...nextTypescript,

  // Project-level overrides
  {
    rules: {
      // React Doctor currently bridges linting through Oxlint, which does not
      // understand this jsx-a11y rule name from the Next.js preset.
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      // Unused vars: allow underscore-prefixed names as intentional placeholders
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Explicit `any` is discouraged but not a hard block while migrating
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer const over let when the binding is never reassigned
      "prefer-const": "error",
      // Allow console.warn / console.error for intentional logging
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // These files render HTML in contexts where Next.js <Image /> is not a fit:
  // OG image generation uses ImageResponse markup and markdown preview accepts
  // arbitrary user-provided image URLs and unknown intrinsic sizes.
  {
    files: [
      "components/markdown-preview.tsx",
      "lib/og-card.tsx",
      "lib/og-document-paper.tsx",
      "lib/og-footer-pill.tsx",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },

  // Email templates render full HTML documents, so Next.js app-router HTML
  // restrictions do not apply there.
  {
    files: ["components/email-template.tsx"],
    rules: {
      "@next/next/no-head-element": "off",
      "@next/next/no-img-element": "off",
    },
  },

  // Ignore auto-generated and build artefacts
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.cjs",
      "postcss.config.*",
      "next-env.d.ts",
    ],
  },
];

module.exports = eslintConfig;
