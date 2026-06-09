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

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "prefer-const": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["hooks/use-client-search-params.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/navigation",
              importNames: ["useSearchParams"],
              message:
                "Use useClientSearchParams or useClientSearchParam from @/hooks/use-client-search-params instead.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclarator[init.callee.name='useSearchParams'] > ObjectPattern",
          message:
            "Do not destructure useSearchParams(). Use useClientSearchParams() from @/hooks/use-client-search-params.",
        },
        {
          selector:
            "VariableDeclarator[init.name='searchParams'] > ObjectPattern > Property[key.name=/^(get|has|getAll|entries|keys|values|forEach|toString)$/]",
          message:
            "Do not destructure URLSearchParams methods. Call them on the instance or use useClientSearchParams().",
        },
      ],
    },
  },

  {
    files: ["components/markdown-preview.tsx", "lib/og-card.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },

  {
    files: ["lib/email/auth-email-template.tsx"],
    rules: {
      "@next/next/no-head-element": "off",
      "@next/next/no-img-element": "off",
    },
  },

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
