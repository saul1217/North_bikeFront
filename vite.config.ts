import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// Aliases let us reuse the NorthBike (Next.js) components verbatim:
// the `next/*` specifiers resolve to lightweight shims in src/shims.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "next/image": fileURLToPath(new URL("./src/shims/next-image.tsx", import.meta.url)),
      "next/link": fileURLToPath(new URL("./src/shims/next-link.tsx", import.meta.url)),
      "next/navigation": fileURLToPath(new URL("./src/shims/next-navigation.ts", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
});
