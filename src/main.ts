/**
 * Schritt 2 der Bau-Reihenfolge: Effekt sichtbar machen.
 *
 * Bewusst noch ohne Kacheln, Buttons und Timer -- erst muss feststehen, ob der
 * Effekt ueberhaupt fesselt. Was hier schon drin ist, ist die Tempo-Steuerung,
 * damit die geschaetzten Werte aus config.ts justiert werden koennen (Schritt 3).
 */
import { drawKaleidoscope, stateAt } from "./kaleidoscope";
import { createMeadowTexture } from "./placeholder";
import { SPEED_LEVELS_DEG_PER_SEC, DEFAULT_SPEED_INDEX, SEGMENTS } from "./config";

const canvas = document.querySelector<HTMLCanvasElement>("#stage")!;
const ctx = canvas.getContext("2d")!;
const hud = document.querySelector<HTMLDivElement>("#hud")!;

const texture = createMeadowTexture();

let speedIndex = DEFAULT_SPEED_INDEX;
let segments = SEGMENTS;
let paused = false;

/** Aufsummierte laufende Zeit: Pausen zaehlen nicht mit, damit Pause wirklich einfriert. */
let spinSeconds = 0;
let rotationRad = 0;
let lastFrame = performance.now();

let size = 0;

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  const css = Math.min(window.innerWidth, window.innerHeight);
  canvas.style.width = `${css}px`;
  canvas.style.height = `${css}px`;
  canvas.width = Math.round(css * dpr);
  canvas.height = Math.round(css * dpr);
  size = canvas.width;
}

function showHud(text: string): void {
  hud.textContent = text;
  hud.classList.add("visible");
  window.clearTimeout(showHud.timer);
  showHud.timer = window.setTimeout(() => hud.classList.remove("visible"), 1400);
}
showHud.timer = 0 as number;

function frame(now: number): void {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;

  if (!paused) {
    spinSeconds += dt;
    rotationRad += (SPEED_LEVELS_DEG_PER_SEC[speedIndex] * Math.PI) / 180 * dt;
  }

  drawKaleidoscope(ctx, texture, texture.width, texture.height, size, stateAt(spinSeconds, rotationRad), segments);
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      speedIndex = Math.min(speedIndex + 1, SPEED_LEVELS_DEG_PER_SEC.length - 1);
      showHud(`Tempo ${speedIndex + 1}/5 — ${SPEED_LEVELS_DEG_PER_SEC[speedIndex]}°/s`);
      break;
    case "ArrowDown":
      speedIndex = Math.max(speedIndex - 1, 0);
      showHud(`Tempo ${speedIndex + 1}/5 — ${SPEED_LEVELS_DEG_PER_SEC[speedIndex]}°/s`);
      break;
    // Nur zum Ausprobieren in Schritt 2/3: Segmentzahl live veraendern.
    case "ArrowRight":
      segments = Math.min(segments + 2, 24);
      showHud(`${segments} Segmente`);
      break;
    case "ArrowLeft":
      segments = Math.max(segments - 2, 4);
      showHud(`${segments} Segmente`);
      break;
    case " ":
      paused = !paused;
      showHud(paused ? "Pause" : "Weiter");
      e.preventDefault();
      break;
    case "f":
    case "F":
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
      break;
  }
});

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
