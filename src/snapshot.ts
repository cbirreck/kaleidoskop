/**
 * Snapshot (A4): das stehende Bild als druckbares PNG.
 *
 * Eigenes Modul, weil hier die einzige Stelle im Projekt steht, an der Aufloesung und
 * Bildausschnitt auseinanderlaufen -- und weil es sich so ohne DOM-Geruest der App
 * pruefen laesst.
 */
import { drawKaleidoscope, imagePlacement, type KaleidoscopeState } from "./kaleidoscope";
import { renderTextureWindow, type TextureDef } from "./textures";
import { SNAP_SIZE } from "./config";

/** Kleinster sinnvoller Ausschnitt -- darunter bleibt nur noch die Nabe uebrig. */
const MIN_FRACTION = 0.01;

/**
 * Zeichnet den Snapshot in ein frisches Canvas. Kantenlaenge immer SNAP_SIZE,
 * unabhaengig vom Ausschnitt.
 *
 * @param fraction Anteil am Radius des vollen Kreises, 1 = ganzer Kreis. Der Ausschnitt
 *                 ist konzentrisch: derselbe Mittelpunkt, nur kleinerer Radius.
 *
 * Ein Teilkreis entsteht NICHT durch Zuschneiden. Stattdessen wird ein gedachter,
 * entsprechend groesserer Vollkreis angenommen und von der Textur genau das Fenster
 * gezeichnet, das der Innenkreis zeigt -- in voller Zielaufloesung. Deshalb ist auch
 * der kleinste Ausschnitt so scharf wie der ganze Kreis, statt briefmarkengross oder
 * verwaschen zu sein.
 *
 * Der Hintergrund bleibt transparent: zum Ausschneiden ist ein weisser Kasten um den
 * Kreis nur im Weg.
 */
export function renderSnapshotCanvas(
  def: TextureDef,
  fraction: number,
  state: KaleidoscopeState,
  symmetry: number,
): HTMLCanvasElement {
  const f = Math.min(Math.max(fraction, MIN_FRACTION), 1);
  const out = SNAP_SIZE;
  const half = out / 2;

  // Radius des gedachten Vollkreises, bei dem der Innenkreis genau `out` Pixel breit
  // wird. Bei f = 1 ist das schlicht der Kreis selbst.
  const fullRadius = half / f;

  // Texturen sind quadratisch, daher 1:1 als Seitenverhaeltnis.
  const place = imagePlacement(fullRadius, 1, 1, state, symmetry);

  // Fenster um die Sektorspitze, Halbkante = sichtbarer Radius.
  const tex = renderTextureWindow(def, out, {
    x: (place.offsetX - half) / place.drawW,
    y: (place.offsetY - half) / place.drawH,
    size: out / place.drawW,
  });

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = out;
  const c = canvas.getContext("2d")!;

  // Das Fenster deckt jetzt genau den Ausgabekreis ab: Spitze in der Mitte,
  // Bildkante gleich Kreisdurchmesser.
  drawKaleidoscope(c, tex, tex.width, tex.height, out, state, symmetry, {
    drawW: out,
    drawH: out,
    offsetX: half,
    offsetY: half,
  });

  return canvas;
}

/**
 * Zeigt auf dem stehenden Bild, was ein Snapshot behalten wuerde: alles innerhalb des
 * Rings. Wird auf das Stage-Canvas gemalt und landet deshalb nie im Snapshot selbst --
 * der rendert in ein eigenes Canvas.
 *
 * Ohne diese Vorschau raet man, welche Formen noch in den Ausschnitt fallen.
 */
export function drawSnapRing(
  ctx: CanvasRenderingContext2D,
  size: number,
  fraction: number,
): void {
  const mid = size / 2;
  const r = mid * Math.min(Math.max(fraction, MIN_FRACTION), 1);

  ctx.save();

  // Was wegfaellt, wird abgedunkelt -- zwei Kreise gegenlaeufig ergeben den Ring.
  if (fraction < 1) {
    ctx.fillStyle = "rgb(3 5 12 / 0.55)";
    ctx.beginPath();
    ctx.arc(mid, mid, mid, 0, Math.PI * 2);
    ctx.arc(mid, mid, r, 0, Math.PI * 2, true);
    ctx.fill();
  }

  ctx.strokeStyle = "rgb(255 255 255 / 0.8)";
  ctx.lineWidth = Math.max(2, size * 0.003);
  ctx.setLineDash([size * 0.018, size * 0.014]);
  ctx.beginPath();
  ctx.arc(mid, mid, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
