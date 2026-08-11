import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

/**
 * ESLint flat config.
 *
 * `next lint` is deprecated and prompts interactively when no config exists, so
 * the Next.js shareable configs are loaded through `FlatCompat` and linting runs
 * through the ESLint CLI instead.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "prisma/generated/**",
      "storage/**",
      "vendor/**",
      "next-env.d.ts"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The editor model carries genuinely dynamic element properties, so a
      // handful of assertions are unavoidable; unused code is still an error.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  }
];

export default config;
