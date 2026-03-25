import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react";
          }
          if (id.includes("@tanstack/")) {
            return "tanstack";
          }
          if (id.includes("@radix-ui/")) {
            return "radix";
          }
          if (id.includes("drizzle-orm") || id.includes("better-auth") || id.includes("@libsql/")) {
            return "db-auth";
          }
        },
      },
    },
  },
});
