/**
 * Prozedurale Platzhalter-Textur: eine "Blumenwiese" aus Code.
 *
 * Nur fuer Schritt 2 der Bau-Reihenfolge -- sie beantwortet die Frage
 * "sieht der Effekt gut aus?", ohne dass echte Bilder existieren muessen.
 * Erfuellt dieselben Regeln wie die echten Bilder: flaechenfuellend,
 * kleinteilig, kein zentrales Motiv, kein Rand.
 */

/** Deterministischer Zufall, damit die Textur bei jedem Start gleich aussieht. */
function makeRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const PETAL_COLORS = [
  "#e8344e", "#f5a524", "#ffd93d", "#e94f97",
  "#9b5de5", "#ffffff", "#ff6b35", "#4cc9f0",
];

export function createMeadowTexture(size = 1024, seed = 20260928): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rnd = makeRandom(seed);

  // Gruener Grund mit Fleckigkeit, damit keine toten Flaechen entstehen.
  ctx.fillStyle = "#2f6b2f";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = size * (0.01 + rnd() * 0.035);
    ctx.fillStyle = `hsl(${95 + rnd() * 40} ${45 + rnd() * 30}% ${18 + rnd() * 28}%)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.3 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blueten. Ueber den Rand hinaus streuen, damit keine leeren Raender entstehen.
  const margin = size * 0.08;
  for (let i = 0; i < 520; i++) {
    const x = -margin + rnd() * (size + margin * 2);
    const y = -margin + rnd() * (size + margin * 2);
    const r = size * (0.012 + rnd() * 0.026);
    const petals = 5 + Math.floor(rnd() * 3);
    const color = PETAL_COLORS[Math.floor(rnd() * PETAL_COLORS.length)];
    const turn = rnd() * Math.PI * 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.fillStyle = color;
    for (let p = 0; p < petals; p++) {
      ctx.save();
      ctx.rotate((p / petals) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.9, r * 0.45, r * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#ffcf2b";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return canvas;
}
