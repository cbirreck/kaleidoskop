/**
 * Die acht Bildquellen -- prozedural gemalt statt generiert oder fotografiert.
 *
 * Alle folgen derselben Regel, ohne die der Kaleidoskop-Effekt zu Matsch wird:
 * flaechenfuellend, kleinteilig, KEIN zentrales Motiv, kein Rand, kein leerer Bereich.
 * Jede Textur hat eine eigene dominante Farbwelt, damit er sie auf den Kacheln
 * unterscheiden kann, ohne lesen zu koennen.
 */

type Rnd = () => number;

/** Deterministischer Zufall: dieselbe Textur sieht bei jedem Start gleich aus. */
function makeRandom(seed: number): Rnd {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pick = <T>(rnd: Rnd, xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
const range = (rnd: Rnd, a: number, b: number): number => a + rnd() * (b - a);

/** Grundflaeche mit unregelmaessigen Flecken -- verhindert tote, glatte Bereiche. */
function mottle(
  ctx: CanvasRenderingContext2D,
  size: number,
  rnd: Rnd,
  base: string,
  hue: [number, number],
  sat: [number, number],
  light: [number, number],
  count = 900,
): void {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    const r = size * range(rnd, 0.008, 0.05);
    ctx.fillStyle = `hsl(${range(rnd, ...hue)} ${range(rnd, ...sat)}% ${range(rnd, ...light)}%)`;
    ctx.beginPath();
    ctx.ellipse(rnd() * size, rnd() * size, r, r * range(rnd, 0.3, 0.9), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Streut `count` Objekte ueber die Flaeche -- bewusst ueber den Rand hinaus,
 * damit keine leeren Raender entstehen.
 */
function scatter(
  ctx: CanvasRenderingContext2D,
  size: number,
  rnd: Rnd,
  count: number,
  draw: (ctx: CanvasRenderingContext2D, scale: number, rnd: Rnd) => void,
  scaleRange: [number, number] = [0.02, 0.055],
  rotate = true,
): void {
  const margin = size * 0.1;
  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.translate(-margin + rnd() * (size + margin * 2), -margin + rnd() * (size + margin * 2));
    if (rotate) ctx.rotate(rnd() * Math.PI * 2);
    draw(ctx, size * range(rnd, ...scaleRange), rnd);
    ctx.restore();
  }
}

// --- Die acht Motive --------------------------------------------------------

const FLOWER_COLORS = ["#e8344e", "#f5a524", "#ffd93d", "#e94f97", "#9b5de5", "#ffffff", "#ff6b35", "#4cc9f0"];

function blumenwiese(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#2f6b2f", [95, 135], [45, 75], [18, 46]);
  scatter(ctx, size, rnd, 520, (c, r, q) => {
    const petals = 5 + Math.floor(q() * 3);
    c.fillStyle = pick(q, FLOWER_COLORS);
    for (let p = 0; p < petals; p++) {
      c.save();
      c.rotate((p / petals) * Math.PI * 2);
      c.beginPath();
      c.ellipse(0, -r * 0.9, r * 0.45, r * 0.9, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.fillStyle = "#ffcf2b";
    c.beginPath();
    c.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    c.fill();
  });
}

const LEAF_COLORS = ["#c1440e", "#e8751a", "#f2a154", "#ffc23c", "#8c2f0d", "#d95d1e", "#a8bf2f"];

function herbstlaub(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#4a2410", [15, 40], [50, 80], [12, 32]);
  scatter(
    ctx,
    size,
    rnd,
    340,
    (c, r, q) => {
      c.fillStyle = pick(q, LEAF_COLORS);
      c.beginPath();
      c.moveTo(0, -r);
      c.bezierCurveTo(r * 0.85, -r * 0.4, r * 0.7, r * 0.6, 0, r);
      c.bezierCurveTo(-r * 0.7, r * 0.6, -r * 0.85, -r * 0.4, 0, -r);
      c.fill();
      c.strokeStyle = "rgb(0 0 0 / 0.28)";
      c.lineWidth = Math.max(1, r * 0.06);
      c.beginPath();
      c.moveTo(0, -r * 0.9);
      c.lineTo(0, r * 0.9);
      c.stroke();
    },
    [0.03, 0.075],
  );
}

function sternenhimmel(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#070d2b", [215, 275], [55, 90], [10, 30], 700);
  // Kleine Sternpunkte als Grundrauschen.
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `hsl(${range(rnd, 40, 220)} ${range(rnd, 20, 80)}% ${range(rnd, 70, 100)}%)`;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, size * range(rnd, 0.0015, 0.005), 0, Math.PI * 2);
    ctx.fill();
  }
  // Funkelnde Vierstrahler daruber.
  scatter(
    ctx,
    size,
    rnd,
    260,
    (c, r, q) => {
      c.fillStyle = q() > 0.45 ? "#ffe9a8" : "#ffffff";
      c.beginPath();
      c.moveTo(0, -r);
      c.quadraticCurveTo(0, 0, r, 0);
      c.quadraticCurveTo(0, 0, 0, r);
      c.quadraticCurveTo(0, 0, -r, 0);
      c.quadraticCurveTo(0, 0, 0, -r);
      c.fill();
    },
    [0.01, 0.035],
  );
}

/** Rubin, Smaragd, Saphir, Amethyst, Topas, Aquamarin. */
const GEM_HUES = [348, 150, 215, 280, 45, 190];

function edelsteine(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#120d1c", [250, 300], [20, 50], [8, 24], 700);

  scatter(
    ctx,
    size,
    rnd,
    300,
    (c, r, q) => {
      const hue = pick(q, GEM_HUES);
      const corners = 5 + Math.floor(q() * 4);
      const pts: Array<[number, number]> = [];
      for (let i = 0; i < corners; i++) {
        const a = (i / corners) * Math.PI * 2;
        const rr = r * range(q, 0.76, 1);
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }

      // Facetten: jedes Dreieck leicht anders hell, das erzeugt den Schliff.
      for (let i = 0; i < corners; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % corners];
        c.fillStyle = `hsl(${hue} ${range(q, 60, 95)}% ${range(q, 24, 60)}%)`;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(x1, y1);
        c.lineTo(x2, y2);
        c.closePath();
        c.fill();
      }

      // Tafel in der Mitte, heller als die Facetten.
      c.fillStyle = `hsl(${hue} 85% ${range(q, 55, 76)}%)`;
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x * 0.46, y * 0.46) : c.moveTo(x * 0.46, y * 0.46)));
      c.closePath();
      c.fill();

      // Glanzlicht.
      c.fillStyle = "rgb(255 255 255 / 0.7)";
      c.beginPath();
      c.ellipse(-r * 0.22, -r * 0.27, r * 0.19, r * 0.09, -0.6, 0, Math.PI * 2);
      c.fill();
    },
    [0.018, 0.042],
  );

  // Feiner Glitzerstaub in den Zwischenraeumen.
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `hsl(${pick(rnd, GEM_HUES)} 90% ${range(rnd, 70, 95)}%)`;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, size * range(rnd, 0.001, 0.004), 0, Math.PI * 2);
    ctx.fill();
  }
}

const PENCIL_COLORS = ["#e63946", "#f77f00", "#fcbf49", "#2a9d8f", "#264653", "#9b5de5", "#00bbf9", "#ff70a6"];

function buntstifte(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#d9cfc1", [25, 45], [10, 30], [55, 80], 500);
  scatter(
    ctx,
    size,
    rnd,
    420,
    (c, r, q) => {
      const len = r * range(q, 3.5, 6);
      const w = r * 0.55;
      c.fillStyle = pick(q, PENCIL_COLORS);
      c.fillRect(-w / 2, -len / 2, w, len);
      // Angespitztes Ende aus hellem Holz.
      c.fillStyle = "#f0dfc0";
      c.beginPath();
      c.moveTo(-w / 2, len / 2);
      c.lineTo(w / 2, len / 2);
      c.lineTo(0, len / 2 + w * 1.4);
      c.closePath();
      c.fill();
      c.fillStyle = "rgb(0 0 0 / 0.18)";
      c.fillRect(w * 0.12, -len / 2, w * 0.38, len);
    },
    [0.012, 0.024],
  );
}

const BRICK_COLORS = ["#d01012", "#0a5bd3", "#f6c000", "#00963f", "#ffffff", "#ff7f11"];

function legosteine(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#8d99a6", [200, 220], [5, 18], [45, 70], 500);
  scatter(
    ctx,
    size,
    rnd,
    300,
    (c, r, q) => {
      const studs = 2 + Math.floor(q() * 3);
      const w = r * studs;
      const h = r * 2;
      const color = pick(q, BRICK_COLORS);
      c.fillStyle = color;
      c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = "rgb(255 255 255 / 0.35)";
      for (let s = 0; s < studs; s++) {
        c.beginPath();
        c.arc(-w / 2 + r * (s + 0.5), -h * 0.22, r * 0.3, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "rgb(0 0 0 / 0.2)";
      c.fillRect(-w / 2, h * 0.3, w, h * 0.2);
    },
    [0.016, 0.034],
  );
}

const FEATHER_COLORS = ["#2d6a4f", "#40916c", "#7b2cbf", "#9d4edd", "#48cae4", "#b5e48c"];

function federn(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#1b2f2a", [140, 290], [35, 70], [14, 34]);
  scatter(
    ctx,
    size,
    rnd,
    260,
    (c, r, q) => {
      const len = r * 2.6;
      const color = pick(q, FEATHER_COLORS);
      c.fillStyle = color;
      c.beginPath();
      c.ellipse(0, 0, r * 0.62, len / 2, 0, 0, Math.PI * 2);
      c.fill();
      // Barben als feine Striche zu beiden Seiten des Kiels.
      c.strokeStyle = "rgb(255 255 255 / 0.25)";
      c.lineWidth = Math.max(0.8, r * 0.05);
      for (let b = -8; b <= 8; b++) {
        const y = (b / 9) * (len / 2) * 0.92;
        const spread = r * 0.6 * (1 - Math.abs(b) / 10);
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(spread, y + len * 0.06);
        c.moveTo(0, y);
        c.lineTo(-spread, y + len * 0.06);
        c.stroke();
      }
      c.strokeStyle = "rgb(0 0 0 / 0.35)";
      c.lineWidth = Math.max(1, r * 0.08);
      c.beginPath();
      c.moveTo(0, -len / 2);
      c.lineTo(0, len / 2);
      c.stroke();
    },
    [0.02, 0.042],
  );
}

const CANDY_COLORS = ["#ff5d8f", "#ffffff", "#e63946", "#a8e6cf", "#ffd6e0", "#c77dff"];

function bonbons(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#f7c7d9", [320, 355], [45, 85], [65, 88], 600);
  scatter(
    ctx,
    size,
    rnd,
    330,
    (c, r, q) => {
      const a = pick(q, CANDY_COLORS);
      const b = pick(q, CANDY_COLORS);
      // Bonbonkoerper.
      c.fillStyle = a;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      // Spiralstreifen.
      c.strokeStyle = b;
      c.lineWidth = r * 0.3;
      c.beginPath();
      for (let t = 0; t < Math.PI * 4; t += 0.2) {
        const rr = (t / (Math.PI * 4)) * r;
        c.lineTo(Math.cos(t) * rr, Math.sin(t) * rr);
      }
      c.stroke();
      // Eingedrehte Enden.
      c.fillStyle = a;
      for (const dir of [-1, 1]) {
        c.beginPath();
        c.moveTo(dir * r * 0.9, 0);
        c.lineTo(dir * r * 1.7, -r * 0.6);
        c.lineTo(dir * r * 1.7, r * 0.6);
        c.closePath();
        c.fill();
      }
    },
    [0.014, 0.03],
  );
}

// --- Registry ---------------------------------------------------------------

export interface TextureDef {
  id: string;
  /** Nur fuer uns im Code -- in der UI steht kein Text, er kann nicht lesen. */
  label: string;
  seed: number;
  draw: (ctx: CanvasRenderingContext2D, size: number, rnd: Rnd) => void;
}

export const TEXTURES: TextureDef[] = [
  { id: "blumenwiese", label: "Blumenwiese", seed: 11, draw: blumenwiese },
  { id: "herbstlaub", label: "Herbstlaub", seed: 22, draw: herbstlaub },
  { id: "sternenhimmel", label: "Sternenhimmel", seed: 33, draw: sternenhimmel },
  { id: "edelsteine", label: "Edelsteine", seed: 44, draw: edelsteine },
  { id: "buntstifte", label: "Buntstifte", seed: 55, draw: buntstifte },
  { id: "legosteine", label: "Legosteine", seed: 66, draw: legosteine },
  { id: "federn", label: "Federn", seed: 77, draw: federn },
  { id: "bonbons", label: "Bonbons", seed: 88, draw: bonbons },
];

const TEXTURE_SIZE = 1024;
const cache = new Map<string, HTMLCanvasElement>();

/** Rendert eine Textur (gecacht) und gibt sie als Canvas zurueck. */
export function getTexture(def: TextureDef): HTMLCanvasElement {
  const hit = cache.get(def.id);
  if (hit) return hit;

  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d")!;
  def.draw(ctx, TEXTURE_SIZE, makeRandom(def.seed));
  cache.set(def.id, canvas);
  return canvas;
}
