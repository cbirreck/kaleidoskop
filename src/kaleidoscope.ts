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
 * Zeichnet das Kaleidoskop in ein beliebiges Canvas beliebiger Groesse.
 *
 * Bewusst unabhaengig von DOM, Zustand und Bildquelle: dieselbe Funktion bedient den
 * Vollbild-Modus und die Hover-Vorschau der Kacheln (und spaeter animierte Kacheln).
 *
 * @param size      Kantenlaenge des quadratischen Zeichenbereichs in Geraetepixeln.
 * @param symmetry  Anzahl der Zacken. Jede Zacke sind zwei gespiegelte Sektoren, es
 *                  wird also an jeder Kante gespiegelt -- deshalb ist das Ergebnis fuer
 *                  *jeden* ganzzahligen Wert nahtlos, auch fuer 7 oder 9.
 *                  0 schaltet die Spiegelung ganz ab.
 */
export function drawKaleidoscope(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageW: number,
  imageH: number,
  size: number,
  state: KaleidoscopeState,
  symmetry: number = SYMMETRY,
): void {
  const radius = size / 2;

  // Das Bild wird vergroessert gezeichnet; der Sektor tastet nur einen Keil davon ab.
  const drawW = radius * ZOOM;
  const drawH = drawW * (imageH / imageW);

  // Der Punkt des Bildes, der in der Sektorspitze landet -- er wandert (Drift).
  const offsetX = Math.max(0, drawW - radius) * state.driftX;
  const offsetY = Math.max(0, drawH - radius) * state.driftY;

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
