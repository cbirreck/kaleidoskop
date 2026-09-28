import { defineConfig } from "vite";

export default defineConfig({
  // Relative Pfade im Build, damit die App auch ohne Server-Root laeuft.
  base: "./",
  server: { open: true },
});
