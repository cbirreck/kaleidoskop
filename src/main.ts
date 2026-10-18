/**
 * Kaleidoskop -- Iteration 1 (Laptop).
 *
 * Leitprinzip: Maus = Kind, Tastatur = Papa.
 * Alles Sichtbare gehoert ihm, alles Unsichtbare mir.
 */
import { createTiles } from "./tiles";
import { getTexture, type TextureDef } from "./textures";
import { drawKaleidoscope, stateAt } from "./kaleidoscope";
import { renderSnapshotCanvas, drawSnapRing } from "./snapshot";
import {
  SPEED_LEVELS_DEG_PER_SEC,
  DEFAULT_SPEED_INDEX,
  SYMMETRY,
  SYMMETRY_STEPS,
  SNAP_FILENAME,
  SNAP_FRACTIONS,
} from "./config";
import * as timer from "./timer";

type Screen = "start" | "viewer" | "end";

const el = {
  start: document.querySelector<HTMLElement>("#start")!,
  tiles: document.querySelector<HTMLElement>("#tiles")!,
  viewer: document.querySelector<HTMLElement>("#viewer")!,
  stage: document.querySelector<HTMLCanvasElement>("#stage")!,
  btnBack: document.querySelector<HTMLButtonElement>("#btn-back")!,
  btnPlay: document.querySelector<HTMLButtonElement>("#btn-play")!,
  btnSnap: document.querySelector<HTMLButtonElement>("#btn-snap")!,
  iconPlay: document.querySelector<SVGPathElement>("#icon-play path")!,
  endscreen: document.querySelector<HTMLElement>("#endscreen")!,
  timerbar: document.querySelector<HTMLElement>("#timerbar")!,
  hud: document.querySelector<HTMLElement>("#hud")!,
  dots: document.querySelector<HTMLElement>("#dots")!,
  pagePrev: document.querySelector<HTMLButtonElement>("#page-prev")!,
  pageNext: document.querySelector<HTMLButtonElement>("#page-next")!,
};

const ICON_PAUSE = "M6 4h4v16H6zm8 0h4v16h-4z";
const ICON_PLAY = "M7 4l13 8-13 8z";

const ctx = el.stage.getContext("2d")!;

let screen: Screen = "start";
let current: TextureDef | null = null;
let speedIndex = DEFAULT_SPEED_INDEX;
let symmetryIndex = Math.max(0, SYMMETRY_STEPS.indexOf(SYMMETRY));
let paused = false;
/** Index in SNAP_FRACTIONS -- 0 ist der volle Kreis, also das bisherige Verhalten. */
let snapIndex = 0;

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

/**
 * Einzige Stelle, die `paused` aendert -- Icon und Snap-Button haengen daran.
 * Der Snap-Button erscheint nur in Pause: im Lauf gibt es kein stehendes Bild,
 * das man ausschneiden koennte.
 */
function setPaused(next: boolean): void {
  paused = next;
  el.iconPlay.setAttribute("d", paused ? ICON_PLAY : ICON_PAUSE);
  el.btnSnap.hidden = !paused;
}

function openViewer(def: TextureDef): void {
  current = def;
  setPaused(false);
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
    const state = stateAt(spinSeconds, rotationRad);
    drawKaleidoscope(ctx, tex, tex.width, tex.height, stageSize, state, SYMMETRY_STEPS[symmetryIndex]);

    // Nur in Pause, also genau dann, wenn auch der Snap-Button da ist: zeigen, was
    // der Snapshot behalten wuerde. Ohne das raet man, welche Formen noch reinpassen.
    if (paused) drawSnapRing(ctx, stageSize, SNAP_FRACTIONS[snapIndex]);
  }

  requestAnimationFrame(frame);
}

// --- Snapshot (A4) ----------------------------------------------------------

/**
 * Zielhandle fuer snap.png. Bewusst NUR im Speicher und nicht in IndexedDB:
 * requirements.md erlaubt ausser der einen sessionStorage-Zeile fuer den Timer keine
 * Persistenz. Folge: einmal pro Sitzung fragt der Browser nach dem Ort, danach
 * ueberschreibt jeder weitere Snap still.
 */
let snapHandle: FileSystemFileHandle | null = null;
let snapBusy = false;

/**
 * Speichert das stehende Bild als PNG.
 *
 * Eine Browser-Seite kann nicht von sich aus in den Projektordner schreiben -- es gibt
 * keinen Weg, der ohne Zutun einen festen Pfad beschreibt. Zwei Wege existieren:
 *
 *   1. File System Access API: der Ort wird einmal gewaehlt, danach ist jedes weitere
 *      Speichern still und ueberschreibt dieselbe Datei. Das ist der Wunsch, minus den
 *      einen Dialog zu Beginn.
 *   2. Download-Fallback, wenn (1) nicht verfuegbar ist oder abgelehnt wird. Landet im
 *      Download-Ordner, und der Browser zaehlt hoch: snap (1).png. Ueberschreiben kann
 *      er dort grundsaetzlich nicht.
 */
async function snapshot(): Promise<void> {
  if (!current || snapBusy) return;
  snapBusy = true;
  try {
    hud("Snap ...");
    const blob = await renderSnapshot(current);
    if (!blob) {
      hud("Snap fehlgeschlagen");
      return;
    }
    hud(await writeSnapshot(blob));
  } finally {
    snapBusy = false;
  }
}

/**
 * Setzt den Snapshot-Ausschnitt. SNAP_FRACTIONS ist absteigend sortiert: kleinerer
 * Index = groesserer Kreis.
 */
function setSnapIndex(next: number): void {
  snapIndex = Math.min(Math.max(next, 0), SNAP_FRACTIONS.length - 1);
  hud(`Ausschnitt ${Math.round(SNAP_FRACTIONS[snapIndex] * 100)} %`);
}

/** Rendert den sichtbaren Kreis als druckbares PNG. Die Logik steht in snapshot.ts. */
async function renderSnapshot(def: TextureDef): Promise<Blob | null> {
  const canvas = renderSnapshotCanvas(
    def,
    SNAP_FRACTIONS[snapIndex],
    stateAt(spinSeconds, rotationRad),
    SYMMETRY_STEPS[symmetryIndex],
  );
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Schreibt den Blob und gibt die Meldung fuer das HUD zurueck. */
async function writeSnapshot(blob: Blob): Promise<string> {
  const picker = (window as unknown as {
    showSaveFilePicker?: (o: unknown) => Promise<FileSystemFileHandle>;
  }).showSaveFilePicker;

  if (picker) {
    try {
      if (!snapHandle) {
        snapHandle = await picker({
          suggestedName: SNAP_FILENAME,
          types: [{ description: "PNG-Bild", accept: { "image/png": [".png"] } }],
        });
      }
      const w = await snapHandle.createWritable();
      await w.write(blob);
      await w.close();
      return "Snap gespeichert";
    } catch (err) {
      // Abgebrochen heisst abgebrochen -- kein Fallback, der hinter seinem Ruecken
      // doch noch irgendwo eine Datei ablegt.
      if (err instanceof DOMException && err.name === "AbortError") return "Snap abgebrochen";
      // Alles andere (API auf file:// gesperrt, Handle ungueltig): Download-Weg.
      snapHandle = null;
    }
  }

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = SNAP_FILENAME;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return "Snap im Download-Ordner";
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

const deck = createTiles(el.tiles, el.dots, el.pagePrev, el.pageNext, openViewer);

el.btnBack.addEventListener("click", backToStart);
el.btnPlay.addEventListener("click", () => setPaused(!paused));
el.btnSnap.addEventListener("click", () => void snapshot());

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

      // In Pause steht die Rotation: ein Tempo einzustellen haette dort keine
      // sichtbare Wirkung, der Snapshot-Ausschnitt dagegen schon -- und der Ring
      // ist genau dann zu sehen. Also dieselbe Taste, das Passende je nach Lage.
      // Nicht +/-: der Timer laeuft laut A3 bewusst ueber Pausen hinweg weiter.
      if (paused) {
        setSnapIndex(snapIndex - dir);
        break;
      }

      speedIndex = Math.min(Math.max(speedIndex + dir, 0), SPEED_LEVELS_DEG_PER_SEC.length - 1);
      hud(`Tempo ${speedIndex + 1}/${SPEED_LEVELS_DEG_PER_SEC.length}`);
      break;
    }
    case "ArrowRight":
    case "ArrowLeft": {
      const dir = e.key === "ArrowRight" ? 1 : -1;

      // Auf der Startseite blaettern die Pfeile, im Kaleidoskop stellen sie die
      // Zackenzahl -- derselbe Finger, das Passende je nach Screen.
      if (screen === "start") {
        if (dir > 0) deck.next();
        else deck.prev();
        break;
      }

      // Zackenzahl bleibt eine Papa-Taste. Der offensichtliche Kandidat, daraus
      // spaeter einen Kind-Button zu machen -- sie veraendert sofort sichtbar etwas.
      symmetryIndex = Math.min(Math.max(symmetryIndex + dir, 0), SYMMETRY_STEPS.length - 1);
      const n = SYMMETRY_STEPS[symmetryIndex];
      hud(n < 1 ? "keine Spiegelung" : n === 1 ? "1 Spiegelachse" : `${n} Zacken`);
      break;
    }
    // Zweitbelegung fuer Tastaturen mit eigenem Nav-Block. Auf dem Laptop liegen
    // die beiden hinter der Fn-Taste, deshalb ist das nicht der Hauptweg.
    case "PageUp":
      if (paused) setSnapIndex(snapIndex - 1);
      break;
    case "PageDown":
      if (paused) setSnapIndex(snapIndex + 1);
      break;
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
