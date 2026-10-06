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

function schneeflocken(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#0a1a33", [200, 235], [50, 90], [10, 30], 700);
  scatter(
    ctx,
    size,
    rnd,
    240,
    (c, r, q) => {
      c.strokeStyle = q() > 0.3 ? "#ffffff" : "#bfe6ff";
      c.lineWidth = Math.max(1, r * 0.1);
      c.lineCap = "round";
      // Sechs Arme mit je zwei Verzweigungen -- in sich schon symmetrisch.
      for (let a = 0; a < 6; a++) {
        c.save();
        c.rotate((a / 6) * Math.PI * 2);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -r);
        c.moveTo(0, -r * 0.45);
        c.lineTo(r * 0.3, -r * 0.68);
        c.moveTo(0, -r * 0.45);
        c.lineTo(-r * 0.3, -r * 0.68);
        c.moveTo(0, -r * 0.75);
        c.lineTo(r * 0.2, -r * 0.93);
        c.moveTo(0, -r * 0.75);
        c.lineTo(-r * 0.2, -r * 0.93);
        c.stroke();
        c.restore();
      }
    },
    [0.018, 0.042],
  );
}

function schmetterlinge(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#1d3326", [95, 165], [35, 70], [14, 36]);
  scatter(
    ctx,
    size,
    rnd,
    250,
    (c, r, q) => {
      const hue = range(q, 0, 360);
      c.fillStyle = `hsl(${hue} 80% 62%)`;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.ellipse(s * r * 0.5, -r * 0.25, r * 0.5, r * 0.38, s * 0.5, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(s * r * 0.42, r * 0.3, r * 0.36, r * 0.3, -s * 0.4, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = `hsl(${(hue + 180) % 360} 85% 78%)`;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.arc(s * r * 0.58, -r * 0.28, r * 0.13, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "#241a12";
      c.beginPath();
      c.ellipse(0, 0, r * 0.1, r * 0.55, 0, 0, Math.PI * 2);
      c.fill();
    },
    [0.02, 0.045],
  );
}

const FISH_COLORS = ["#ff8c42", "#ffd23f", "#ee4266", "#3bceac", "#5390d9", "#f7b2ad"];

function fische(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#06283d", [185, 215], [55, 90], [14, 38], 800);
  scatter(
    ctx,
    size,
    rnd,
    300,
    (c, r, q) => {
      c.fillStyle = pick(q, FISH_COLORS);
      c.beginPath();
      c.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      c.fill();
      // Schwanzflosse
      c.beginPath();
      c.moveTo(-r * 0.85, 0);
      c.lineTo(-r * 1.6, -r * 0.5);
      c.lineTo(-r * 1.6, r * 0.5);
      c.closePath();
      c.fill();
      // Rueckenflosse
      c.beginPath();
      c.moveTo(r * 0.1, -r * 0.45);
      c.lineTo(r * 0.2, -r * 0.95);
      c.lineTo(-r * 0.35, -r * 0.45);
      c.closePath();
      c.fill();
      c.fillStyle = "#ffffff";
      c.beginPath();
      c.arc(r * 0.5, -r * 0.12, r * 0.17, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#14202b";
      c.beginPath();
      c.arc(r * 0.55, -r * 0.12, r * 0.08, 0, Math.PI * 2);
      c.fill();
    },
    [0.016, 0.034],
  );
  // Luftblasen zwischen den Fischen.
  for (let i = 0; i < 500; i++) {
    ctx.strokeStyle = `rgb(255 255 255 / ${range(rnd, 0.1, 0.4)})`;
    ctx.lineWidth = size * 0.0015;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, size * range(rnd, 0.002, 0.009), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function murmeln(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#2b2f36", [200, 235], [4, 20], [16, 40], 600);
  scatter(
    ctx,
    size,
    rnd,
    280,
    (c, r, q) => {
      const hue = range(q, 0, 360);
      c.save();
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.clip();

      c.fillStyle = `hsl(${hue} 70% 52%)`;
      c.fillRect(-r, -r, r * 2, r * 2);
      // Die eingeschlossenen Farbbaender.
      c.fillStyle = `hsl(${(hue + 60) % 360} 85% 72%)`;
      c.beginPath();
      c.ellipse(0, 0, r * 0.78, r * 0.3, q() * Math.PI, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = `hsl(${(hue + 300) % 360} 80% 66%)`;
      c.beginPath();
      c.ellipse(0, 0, r * 0.46, r * 0.17, q() * Math.PI, 0, Math.PI * 2);
      c.fill();
      c.restore();

      c.fillStyle = "rgb(255 255 255 / 0.8)";
      c.beginPath();
      c.ellipse(-r * 0.35, -r * 0.38, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2);
      c.fill();
    },
    [0.018, 0.04],
  );
}

function pilze(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#3b2a1a", [18, 70], [25, 60], [12, 32]);
  scatter(
    ctx,
    size,
    rnd,
    250,
    (c, r, q) => {
      c.fillStyle = "#f0e4cf";
      c.fillRect(-r * 0.22, -r * 0.05, r * 0.44, r * 0.95);
      c.fillStyle = q() > 0.25 ? "#d12b2b" : "#e08a2b";
      c.beginPath();
      c.ellipse(0, 0, r, r * 0.72, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.arc(range(q, -r * 0.68, r * 0.68), range(q, -r * 0.5, -r * 0.06), r * 0.11, 0, Math.PI * 2);
        c.fill();
      }
    },
    [0.02, 0.045],
  );
}

function sterneUndMonde(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#241046", [258, 300], [50, 88], [12, 34], 700);
  scatter(
    ctx,
    size,
    rnd,
    330,
    (c, r, q) => {
      c.fillStyle = q() > 0.4 ? "#ffd84d" : "#ffeaa0";
      if (q() > 0.32) {
        // Fuenfzackiger Stern.
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const rr = i % 2 ? r * 0.44 : r;
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr;
          if (i) c.lineTo(x, y);
          else c.moveTo(x, y);
        }
        c.closePath();
        c.fill();
      } else {
        // Mondsichel aus zwei Boegen -- kein destination-out, das wuerde den
        // gemusterten Hintergrund mit ausradieren.
        c.beginPath();
        c.arc(0, 0, r, 0.6, -0.6);
        c.arc(r * 0.42, 0, r * 0.88, -0.75, 0.75, true);
        c.closePath();
        c.fill();
      }
    },
    [0.016, 0.04],
  );
}

const METAL_COLORS = ["#c9972b", "#b87333", "#9fa8ad", "#d9c27e", "#8c6239"];

function zahnraeder(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#2a1d12", [18, 42], [28, 62], [10, 28], 600);
  scatter(
    ctx,
    size,
    rnd,
    230,
    (c, r, q) => {
      c.fillStyle = pick(q, METAL_COLORS);
      const teeth = 8 + Math.floor(q() * 6);
      c.beginPath();
      c.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      c.fill();
      for (let t = 0; t < teeth; t++) {
        c.save();
        c.rotate((t / teeth) * Math.PI * 2);
        c.fillRect(-r * 0.13, -r, r * 0.26, r * 0.4);
        c.restore();
      }
      c.fillStyle = "rgb(0 0 0 / 0.5)";
      c.beginPath();
      c.arc(0, 0, r * 0.26, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgb(255 255 255 / 0.28)";
      c.lineWidth = r * 0.06;
      c.beginPath();
      c.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      c.stroke();
    },
    [0.022, 0.05],
  );
}

function wollknaeuel(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd): void {
  mottle(ctx, size, rnd, "#4a3b2f", [18, 48], [18, 48], [20, 46], 600);
  scatter(
    ctx,
    size,
    rnd,
    240,
    (c, r, q) => {
      const hue = range(q, 0, 360);
      c.save();
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.clip();
      c.fillStyle = `hsl(${hue} 62% 52%)`;
      c.fillRect(-r, -r, r * 2, r * 2);
      // Gewickelte Garnlagen.
      c.lineWidth = r * 0.15;
      c.lineCap = "round";
      for (let i = 0; i < 7; i++) {
        c.strokeStyle = `hsl(${hue} 68% ${range(q, 36, 74)}%)`;
        c.save();
        c.rotate(q() * Math.PI);
        c.beginPath();
        c.ellipse(0, 0, r * range(q, 0.5, 0.96), r * range(q, 0.14, 0.5), 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }
      c.restore();
    },
    [0.02, 0.044],
  );
}

// --- Seite 3: Florale Symmetrien --------------------------------------------
//
// Diese acht brechen bewusst mit der Regel "kein zentrales Motiv": jedes ist EIN
// grosses Ornament. Damit das im Kaleidoskop trotzdem funktioniert, waechst jedes
// ueber die Bildecken hinaus (bis 1.5 x Halbbreite) -- ein Mandala mit leerem Rand
// wuerde beim Abtasten meistens nichts zeigen.
//
// Schwarz-weiss, aber jede Kachel mit eigenem Farbstich im Grund: ohne den waeren
// acht graue Kacheln fuer ein nicht lesendes Kind nicht unterscheidbar.

const TAU = Math.PI * 2;

/** Dunkler Grund mit Farbstich und feinem Rauschen. */
function inkBackground(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd, hue: number): void {
  ctx.fillStyle = `hsl(${hue} 42% 7%)`;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `hsl(${hue} ${range(rnd, 25, 60)}% ${range(rnd, 9, 26)}%)`;
    ctx.beginPath();
    ctx.arc(rnd() * size, rnd() * size, size * range(rnd, 0.002, 0.016), 0, TAU);
    ctx.fill();
  }
}

/** Ein Bluetenblatt mit Spitze nach oben, Basis im Ursprung. */
function petalPath(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(w, -h * 0.3, w * 0.55, -h, 0, -h);
  c.bezierCurveTo(-w * 0.55, -h, -w, -h * 0.3, 0, 0);
  c.closePath();
}

/** Zeichnet `count` Kopien rotationssymmetrisch um den Ursprung. */
function ringOf(c: CanvasRenderingContext2D, count: number, draw: (i: number) => void, phase = 0): void {
  for (let i = 0; i < count; i++) {
    c.save();
    c.rotate(phase + (i / count) * TAU);
    draw(i);
    c.restore();
  }
}

/**
 * Radiales Blueten-Mandala mit `n`-zaehliger Symmetrie.
 * Die Ringe reichen bis 1.5 x Halbbreite, damit auch die Bildecken gefuellt sind.
 */
function radialMandala(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd, n: number, hue: number): void {
  inkBackground(ctx, size, rnd, hue);

  const half = size / 2;
  ctx.save();
  ctx.translate(half, half);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const radii = [0.16, 0.3, 0.46, 0.64, 0.86, 1.1, 1.38];

  radii.forEach((rel, ringIndex) => {
    const radius = half * rel;
    const prev = half * (ringIndex ? radii[ringIndex - 1] : 0.04);
    const band = radius - prev;
    // Aeussere Ringe bekommen mehr Elemente, sonst wird es dort zu luftig.
    const count = n * (ringIndex < 2 ? 1 : ringIndex < 4 ? 2 : 3);
    const light = 70 + rnd() * 25;

    switch (ringIndex % 4) {
      case 0:
        // Gefuellte Blueten.
        ctx.fillStyle = `hsl(${hue} 8% ${light}%)`;
        ringOf(ctx, count, () => {
          ctx.translate(0, -prev);
          petalPath(ctx, band * 0.44, band * 1.05);
          ctx.fill();
        });
        break;
      case 1:
        // Umrissene Blueten, versetzt zum vorigen Ring.
        ctx.strokeStyle = `hsl(${hue} 12% ${light}%)`;
        ctx.lineWidth = Math.max(1, size * 0.0022);
        ringOf(
          ctx,
          count,
          () => {
            ctx.translate(0, -prev);
            petalPath(ctx, band * 0.4, band * 1.1);
            ctx.stroke();
          },
          Math.PI / count,
        );
        break;
      case 2:
        // Strahlenkranz mit Punkten an den Spitzen.
        ctx.strokeStyle = `hsl(${hue} 10% ${light}%)`;
        ctx.fillStyle = `hsl(${hue} 10% ${light}%)`;
        ctx.lineWidth = Math.max(1, size * 0.0018);
        ringOf(ctx, count, () => {
          ctx.beginPath();
          ctx.moveTo(0, -prev);
          ctx.lineTo(0, -radius);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, -radius, band * 0.14, 0, TAU);
          ctx.fill();
        });
        break;
      default:
        // Bogenkranz: benachbarte Punkte durch Boegen verbunden.
        ctx.strokeStyle = `hsl(${hue} 14% ${light}%)`;
        ctx.lineWidth = Math.max(1, size * 0.0026);
        ringOf(ctx, count, () => {
          ctx.beginPath();
          ctx.arc(0, -radius + band * 0.3, band * 0.42, 0, Math.PI, true);
          ctx.stroke();
        });
        break;
    }

    // Feiner Trennkreis zwischen den Ringen.
    if (ringIndex < radii.length - 1) {
      ctx.strokeStyle = `hsl(${hue} 20% ${40 + rnd() * 20}%)`;
      ctx.lineWidth = Math.max(1, size * 0.0014);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, TAU);
      ctx.stroke();
    }
  });

  // Bluetenmitte.
  ctx.fillStyle = `hsl(${hue} 10% 88%)`;
  ringOf(ctx, n, () => {
    ctx.translate(0, -half * 0.03);
    petalPath(ctx, half * 0.035, half * 0.1);
    ctx.fill();
  });
  ctx.fillStyle = `hsl(${hue} 35% 55%)`;
  ctx.beginPath();
  ctx.arc(0, 0, half * 0.028, 0, TAU);
  ctx.fill();

  ctx.restore();
}

/**
 * Zygomorphe Bluete: nur EINE Spiegelachse statt Rotationssymmetrie
 * (Orchideen, Lippenbluetler). Ranken fuellen die Flaeche bis in die Ecken.
 */
function zygomorph(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd, hue: number): void {
  inkBackground(ctx, size, rnd, hue);

  const half = size / 2;
  ctx.save();
  ctx.translate(half, half);
  ctx.lineCap = "round";

  // Alles zweimal: einmal normal, einmal an der Senkrechten gespiegelt.
  for (const mirror of [1, -1]) {
    ctx.save();
    ctx.scale(mirror, 1);

    // Seitliche Bluetenblaetter in mehreren Groessen nach aussen.
    for (let i = 0; i < 7; i++) {
      const spread = 0.2 + i * 0.19;
      ctx.save();
      ctx.translate(half * spread * 0.35, -half * 0.05 + half * spread * 0.12);
      ctx.rotate(-0.5 - i * 0.16);
      ctx.fillStyle = `hsl(${hue} 9% ${72 + rnd() * 20}%)`;
      petalPath(ctx, half * (0.1 + i * 0.03), half * (0.3 + i * 0.12));
      ctx.fill();
      ctx.restore();
    }

    // Ranken, die in die Ecken laufen.
    ctx.strokeStyle = `hsl(${hue} 14% ${60 + rnd() * 25}%)`;
    ctx.lineWidth = Math.max(1, size * 0.0024);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      ctx.beginPath();
      ctx.moveTo(0, half * 0.1);
      ctx.bezierCurveTo(half * 0.5 * t, half * (0.2 + t), half * (0.6 + t), half * 0.3 * t, half * 1.5, half * (t * 2 - 1));
      ctx.stroke();
    }

    // Kleine Blaetter entlang der Ranken.
    ctx.fillStyle = `hsl(${hue} 10% ${78 + rnd() * 15}%)`;
    for (let i = 0; i < 16; i++) {
      ctx.save();
      ctx.translate(half * range(rnd, 0.15, 1.4), half * range(rnd, -1.4, 1.4));
      ctx.rotate(rnd() * TAU);
      petalPath(ctx, half * 0.035, half * 0.11);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // Lippe in der Mitte.
  ctx.fillStyle = `hsl(${hue} 12% 90%)`;
  petalPath(ctx, half * 0.3, half * 0.5);
  ctx.fill();
  ctx.save();
  ctx.rotate(Math.PI);
  ctx.fillStyle = `hsl(${hue} 30% 62%)`;
  petalPath(ctx, half * 0.22, half * 0.42);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Spiralige Anordnung nach dem goldenen Winkel (137.5 Grad) -- der Bauplan
 * eines Sonnenblumenkorbs. Fuellt die Flaeche von Natur aus gleichmaessig.
 */
function spiralbluete(ctx: CanvasRenderingContext2D, size: number, rnd: Rnd, hue: number): void {
  inkBackground(ctx, size, rnd, hue);

  const half = size / 2;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const seeds = 900;
  const scale = (half * 1.5) / Math.sqrt(seeds);

  ctx.save();
  ctx.translate(half, half);

  for (let i = 0; i < seeds; i++) {
    const radius = scale * Math.sqrt(i);
    const angle = i * golden;
    const grow = 0.02 + (i / seeds) * 0.055;

    ctx.save();
    ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = `hsl(${hue} ${i % 7 === 0 ? 30 : 8}% ${62 + (i % 5) * 7}%)`;
    petalPath(ctx, half * grow * 0.45, half * grow);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
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
  // Seite 2
  { id: "schneeflocken", label: "Schneeflocken", seed: 101, draw: schneeflocken },
  { id: "schmetterlinge", label: "Schmetterlinge", seed: 112, draw: schmetterlinge },
  { id: "fische", label: "Fische", seed: 123, draw: fische },
  { id: "murmeln", label: "Murmeln", seed: 134, draw: murmeln },
  { id: "pilze", label: "Pilze", seed: 145, draw: pilze },
  { id: "sterne", label: "Sterne und Monde", seed: 156, draw: sterneUndMonde },
  { id: "zahnraeder", label: "Zahnraeder", seed: 167, draw: zahnraeder },
  { id: "wolle", label: "Wollknaeuel", seed: 178, draw: wollknaeuel },
  // Seite 3: florale Symmetrien, schwarz-weiss mit je einem Akzentton.
  { id: "sym3", label: "Dreizaehlig (Lilie)", seed: 301, draw: (c, s, r) => radialMandala(c, s, r, 3, 350) },
  { id: "sym4", label: "Vierzaehlig (Mohn)", seed: 302, draw: (c, s, r) => radialMandala(c, s, r, 4, 212) },
  { id: "sym5", label: "Fuenfzaehlig (Rose)", seed: 303, draw: (c, s, r) => radialMandala(c, s, r, 5, 328) },
  { id: "sym6", label: "Sechszaehlig (Narzisse)", seed: 304, draw: (c, s, r) => radialMandala(c, s, r, 6, 45) },
  { id: "sym8", label: "Achtzaehlig (Anemone)", seed: 305, draw: (c, s, r) => radialMandala(c, s, r, 8, 272) },
  { id: "sym12", label: "Zwoelfzaehlig (Ringelblume)", seed: 306, draw: (c, s, r) => radialMandala(c, s, r, 12, 178) },
  { id: "symzygo", label: "Zygomorph (Orchidee)", seed: 307, draw: (c, s, r) => zygomorph(c, s, r, 140) },
  { id: "symspiral", label: "Spiralig (Sonnenblume)", seed: 308, draw: (c, s, r) => spiralbluete(c, s, r, 28) },
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
