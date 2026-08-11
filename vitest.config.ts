import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    // Pure logic and store tests run in `node`. Files that need a DOM opt in
    // with a `@vitest-environment jsdom` pragma so they carry the setup cost
    // alone.
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"]
  }
});
