import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "convex/**/*.test.ts"],
    exclude: ["src/**/*.component.test.{ts,tsx}"],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    coverage: {
      reporter: ["text", "html"],
      include: ["src/app/lib/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
