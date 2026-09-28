import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Der Build wird zu EINER self-contained index.html.
 *
 * Grund: Kaleidoskop.cmd oeffnet die Datei direkt per file:// in Edge, und Chromium
 * blockiert dort das Laden externer ES-Module (CORS). Inline-Skripte trifft das nicht.
 * Das funktioniert nur, weil alle Texturen prozedural entstehen -- es gibt keine
 * Bild-Assets, die mitgeschleppt werden muessten.
 */
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  server: { open: true },
});
