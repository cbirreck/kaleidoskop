/**
 * Kaleidoskop -- Iteration 1 (Laptop).
 *
 * Leitprinzip: Maus = Kind, Tastatur = Papa.
 * Alles Sichtbare gehoert ihm, alles Unsichtbare mir.
 */
import { createTiles } from "./tiles";
import { getTexture, type TextureDef } from "./textures";
import { drawKaleidoscope, stateAt } from "./kaleidoscope";
import { SPEED_LEVELS_DEG_PER_SEC, DEFAULT_SPEED_INDEX } from "./config";
import * as timer from "./timer";

type Screen = "start" | "viewer" | "end";

const el = {
  start: document.querySelector<HTMLElement>("#start")!,
  tiles: document.querySelector<HTMLElement>("#tiles")!,
  viewer: document.querySelector<HTMLElement>("#viewer")!,
  stage: document.querySelector<HTMLCanvasElement>("#stage")!,
  btnBack: document.querySelector<HTMLButtonElement>("#btn-back")!,
  btnPlay: document.querySelector<HTMLButtonElement>("#btn-play")!,
  iconPlay: document.querySelector<SVGPathElement>("#icon-play path")!,
  endscreen: document.querySelector<HTMLElement>("#endscreen")!,
  timerbar: document.querySelector<HTMLElement>("#timerbar")!,
  hud: document.querySelector<HTMLElement>("#hud")!,
};

const ICON_PAUSE = "M6 4h4v16H6zm8 0h4v16h-4z";
const ICON_PLAY = "M7 4l13 8-13 8z";

const ctx = el.stage.getContext("2d")!;

let screen: Screen = "start";
let current: TextureDef | null = null;
let speedIndex = DEFAULT_SPEED_INDEX;
let paused = false;

/** Laufende Zeit ohne Pausen -- damit Pause den Drift wirklich einfriert. */
let spinSeconds = 0;
let rotationRad = 0;
let stageSize = 0;
let last = performance.now();

// --- Screens ----------------------------------------------------------------

function show(next: Screen): void {
  screen = next;
  el.start.hidden = next !== "start";
  el.viewer.hidden = next !== "viewer";
}

function openViewer(def: TextureDef): void {
  current = def;
  paused = false;
  el.iconPlay.setAttribute("d", ICON_PAUSE);
  show("viewer");
  resizeStage();
}

function backToStart(): void {
  current = null;
  show("start");
}

/**
 * Timer abgelaufen: Das letzte Muster bleibt stehen, dunkelt ab, der Mond legt sich
 * darueber. Es ist noch da, es schlaeft nur -- das ist leichter zu akzeptieren als
 * ein schwarzer Bildschirm. Nur Esc gibt frei, Mausklicks laufen ins Leere.
 */
function showEndscreen(): void {
  screen = "end";
  el.endscreen.hidden = false;
  requestAnimationFrame(() => el.endscreen.classList.add("visible"));
}

function release(): void {
  el.endscreen.classList.remove("visible");
  el.endscreen.hidden = true;
  timer.reset();
  el.stage.style.opacity = "1";
  backToStart();
}

// --- Rendering --------------------------------------------------------------

function resizeStage(): void {
  const dpr = window.devicePixelRatio || 1;
  const css = Math.min(window.innerWidth, window.innerHeight) * 0.92;
  el.stage.style.width = `${css}px`;
  el.stage.style.height = `${css}px`;
  el.stage.width = Math.round(css * dpr);
  el.stage.height = Math.round(css * dpr);
  stageSize = el.stage.width;
}

function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  el.timerbar.style.transform = `scaleX(${timer.progress()})`;

  if (screen !== "end" && timer.isExpired()) showEndscreen();

  if (screen === "viewer" && current) {
    // Ausklang der letzten Minute: langsamer und blasser, bis alles steht.
    const fade = timer.fadeFactor();
    el.stage.style.opacity = String(0.25 + 0.75 * fade);

    if (!paused) {
      spinSeconds += dt * fade;
      rotationRad += ((SPEED_LEVELS_DEG_PER_SEC[speedIndex] * Math.PI) / 180) * dt * fade;
    }

    const tex = getTexture(current);
    drawKaleidoscope(ctx, tex, tex.width, tex.height, stageSize, stateAt(spinSeconds, rotationRad));
  }

  requestAnimationFrame(frame);
}

// --- HUD (nur fuer Papa) ----------------------------------------------------

let hudTimer = 0;
function hud(text: string): void {
  el.hud.textContent = text;
  el.hud.classList.add("visible");
  window.clearTimeout(hudTimer);
  hudTimer = window.setTimeout(() => el.hud.classList.remove("visible"), 1400);
}

// --- Seine Bedienung: Maus --------------------------------------------------

createTiles(el.tiles, openViewer);

el.btnBack.addEventListener("click", backToStart);
el.btnPlay.addEventListener("click", () => {
  paused = !paused;
  el.iconPlay.setAttribute("d", paused ? ICON_PLAY : ICON_PAUSE);
});

// --- Meine Bedienung: Tastatur ----------------------------------------------

window.addEventListener("keydown", (e) => {
  if (screen === "end") {
    if (e.key === "Escape") release();
    return;
  }

  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown": {
      const dir = e.key === "ArrowUp" ? 1 : -1;
      speedIndex = Math.min(Math.max(speedIndex + dir, 0), SPEED_LEVELS_DEG_PER_SEC.length - 1);
      hud(`Tempo ${speedIndex + 1}/5`);
      break;
    }
    case "+":
    case "-": {
      const minutes = timer.adjust(e.key === "+" ? 1 : -1);
      hud(`Timer ${minutes} min`);
      break;
    }
    case "f":
    case "F":
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
      break;
  }
});

// --- Timerstart: erste Mausbewegung -----------------------------------------
// Nicht beim Laden (mein Setup zaehlt nicht als seine Bildschirmzeit) und nicht erst
// beim ersten Klick (sonst waere die Hover-Startseite ein timerfreier Spielplatz).

const startTimer = (): void => {
  timer.start();
  window.removeEventListener("pointermove", startTimer);
  window.removeEventListener("pointerdown", startTimer);
};
window.addEventListener("pointermove", startTimer);
window.addEventListener("pointerdown", startTimer);

window.addEventListener("resize", resizeStage);
resizeStage();
requestAnimationFrame(frame);
