import { SYMMETRY, ZOOM, DRIFT_SPEED_X, DRIFT_SPEED_Y } from "./config";

/** Winkel-Ueberlappung in rad, verhindert Haarlinien zwischen den Sektoren. */
const SEAM_OVERLAP = 0.004;

export interface KaleidoscopeState {
  /** Gesamtdrehung in rad. */
  rotation: number;
  /** Position des abgetasteten Ausschnitts, jeweils 0..1. */
  driftX: number;
  driftY: number;
}

/** Wohin das Quellbild im Sektor-Koordinatensystem gezeichnet wird. */
export interface ImagePlacement {
  drawW: number;
  drawH: number;
  /** Punkt des Bildes, der in der Sektorspitze landet. */
  offsetX: number;
  offsetY: number;
}

/**
 * Berechnet den Zustand fuer einen Zeitpunkt.
 * `spinSeconds` ist die aufsummierte *laufende* Zeit (Pausen zaehlen nicht mit),
 * damit Pause wirklich einfriert und nicht nur die Rotation anhaelt.
 */
export function stateAt(spinSeconds: number, rotationRad: number): KaleidoscopeState {
  return {
    rotation: rotationRad,
    driftX: 0.5 + 0.5 * Math.sin(spinSeconds * DRIFT_SPEED_X),
    driftY: 0.5 + 0.5 * Math.sin(spinSeconds * DRIFT_SPEED_Y + 1.3),
  };
}

/**
 * Wie weit der abgetastete Keil von der Sektorspitze aus nach -x und -y reicht,
 * als Vielfaches des Radius.
 *
 * Normalerweise ist das null: alle Sektoren tasten *denselben* schmalen Keil in
 * +x-Richtung ab -- genau das macht es zum Kaleidoskop. Bei weiten Keilen ist das
 * anders: 1 Zacke spannt 180 Grad, 0 Zacken den ganzen Kreis. Dann reicht die
 * Abtastung hinter die Spitze zurueck, und ohne diesen Rand liegt sie bei niedrigem
 * Drift ausserhalb des Bildes -- gemessen bis zu 74 Prozent durchsichtige Flaeche.
 */
function sampleMargin(symmetry: number): { x: number; y: number } {
  if (symmetry < 1) return { x: 1, y: 1 };

  const from = -SEAM_OVERLAP;
  const to = Math.min(Math.PI / symmetry + SEAM_OVERLAP, Math.PI);
  // cos faellt auf [0, pi] monoton, sin ist dort nie negativ -- bis auf das
  // kleine Stueck Ueberlappung vor dem Nullpunkt.
  return {
    x: Math.max(0, -Math.cos(to)),
    y: Math.max(0, -Math.sin(from)),
  };
}

/**
 * Platzierung des Quellbildes fuer einen Kreis vom Radius `radius`.
 *
 * Der Drift verschiebt die Sektorspitze ueber das Bild, aber nur so weit, dass der
 * abgetastete Keil vollstaendig im Bild bleibt.
 */
export function imagePlacement(
  radius: number,
  imageW: number,
  imageH: number,
  state: KaleidoscopeState,
  symmetry: number = SYMMETRY,
): ImagePlacement {
  const drawW = radius * ZOOM;
  const drawH = drawW * (imageH / imageW);
  const margin = sampleMargin(symmetry);

  // Zwischen dem kleinstmoeglichen und dem groesstmoeglichen Spitzenpunkt
  // interpolieren, statt am Rand zu klemmen: so laeuft der Drift gleichmaessig
  // weiter, nur mit etwas kleinerem Hub.
  const span = (lo: number, hi: number, t: number): number =>
    hi > lo ? lo + (hi - lo) * t : (lo + hi) / 2;

  return {
    drawW,
    drawH,
    offsetX: span(margin.x * radius, drawW - radius, state.driftX),
    offsetY: span(margin.y * radius, drawH - radius, state.driftY),
  };
}

/**
 * Zeichnet das Kaleidoskop in ein beliebiges Canvas beliebiger Groesse.
 *
 * Bewusst unabhaengig von DOM, Zustand und Bildquelle: dieselbe Funktion bedient den
 * Vollbild-Modus, die Hover-Vorschau der Kacheln und den Snapshot.
 *
 * @param size      Kantenlaenge des quadratischen Zeichenbereichs in Geraetepixeln.
 * @param symmetry  Anzahl der Zacken. Jede Zacke sind zwei gespiegelte Sektoren, es
 *                  wird also an jeder Kante gespiegelt -- deshalb ist das Ergebnis fuer
 *                  *jeden* ganzzahligen Wert nahtlos, auch fuer 7 oder 9.
 *                  0 schaltet die Spiegelung ganz ab.
 * @param placement Ueberschreibt, wohin das Quellbild gelegt wird. Der Snapshot nutzt
 *                  das, um ein vorab zugeschnittenes Texturfenster einzusetzen.
 */
export function drawKaleidoscope(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageW: number,
  imageH: number,
  size: number,
  state: KaleidoscopeState,
  symmetry: number = SYMMETRY,
  placement?: ImagePlacement,
): void {
  const radius = size / 2;
  const { drawW, drawH, offsetX, offsetY } =
    placement ?? imagePlacement(radius, imageW, imageH, state, symmetry);

  ctx.clearRect(0, 0, size, size);

  // Sonderfall ohne Spiegelung: ein einziger runder Ausschnitt, der sich dreht.
  if (symmetry < 1) {
    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(state.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, -offsetX, -offsetY, drawW, drawH);
    ctx.restore();
    return;
  }

  const sectors = symmetry * 2;
  const sectorAngle = Math.PI / symmetry;

  for (let i = 0; i < sectors; i++) {
    const mirrored = i % 2 === 1;

    // Ein gespiegelter Sektor landet eine Sektorbreite zurueck, also vorher
    // eine Breite weiter drehen, damit die Sektoren luecken- und ueberlappungsfrei passen.
    const angle = mirrored ? (i + 1) * sectorAngle : i * sectorAngle;

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(state.rotation + angle);
    if (mirrored) ctx.scale(1, -1);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, -SEAM_OVERLAP, sectorAngle + SEAM_OVERLAP);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(image, -offsetX, -offsetY, drawW, drawH);
    ctx.restore();
  }
}
