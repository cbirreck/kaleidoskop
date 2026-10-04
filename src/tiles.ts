import { TEXTURES, getTexture, type TextureDef } from "./textures";
import { drawKaleidoscope, stateAt } from "./kaleidoscope";
import { TILES_PER_PAGE } from "./config";

/**
 * Verzoegerung, bevor die Hover-Vorschau anspringt. Ohne sie flackert beim Queren
 * der Startseite jede ueberfahrene Kachel kurz auf.
 */
const HOVER_DELAY_MS = 150;

/** Weiches Ein-/Ausblenden der Vorschau statt hartem Einfrieren. */
const FADE_MS = 420;

/** Ausschnitt der Textur, den die statische Kachel zeigt (0.45 = mittlere 45%). */
const TILE_CROP = 0.45;

/** Dauer des Ueberblendens beim Seitenwechsel. */
const TURN_MS = 220;

interface Tile {
  def: TextureDef;
  button: HTMLButtonElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  /** Der Effekt wird offscreen gerendert und dann ueber das statische Bild geblendet. */
  fx: HTMLCanvasElement;
  fxCtx: CanvasRenderingContext2D;
  size: number;
  hovered: boolean;
  blend: number;
  hoverSince: number;
  spin: number;
  rotation: number;
}

export interface TileDeck {
  next(): void;
  prev(): void;
  readonly pageCount: number;
}

export function createTiles(
  container: HTMLElement,
  dots: HTMLElement,
  prevButton: HTMLButtonElement,
  nextButton: HTMLButtonElement,
  onPick: (def: TextureDef) => void,
): TileDeck {
  const pageCount = Math.ceil(TEXTURES.length / TILES_PER_PAGE);
  let page = 0;

  // Die Kacheln werden einmal gebaut und beim Blaettern nur neu belegt --
  // kein DOM-Neuaufbau, keine haengenden Hover-Zustaende.
  const tiles: Tile[] = [];
  for (let i = 0; i < TILES_PER_PAGE; i++) {
    const button = document.createElement("button");
    button.className = "tile";

    const canvas = document.createElement("canvas");
    button.appendChild(canvas);
    container.appendChild(button);

    const fx = document.createElement("canvas");
    const tile: Tile = {
      def: TEXTURES[i],
      button,
      canvas,
      ctx: canvas.getContext("2d")!,
      fx,
      fxCtx: fx.getContext("2d")!,
      size: 0,
      hovered: false,
      blend: 0,
      hoverSince: 0,
      spin: Math.random() * 500, // Versatz, damit nicht alle Kacheln synchron laufen
      rotation: Math.random() * Math.PI * 2,
    };
    tiles.push(tile);

    button.addEventListener("pointerenter", () => {
      tile.hovered = true;
      tile.hoverSince = performance.now();
    });
    button.addEventListener("pointerleave", () => {
      tile.hovered = false;
    });
    button.addEventListener("click", () => onPick(tile.def));
  }

  for (let p = 0; p < pageCount; p++) {
    dots.appendChild(document.createElement("span"));
  }

  function applyPage(): void {
    const start = page * TILES_PER_PAGE;
    tiles.forEach((tile, i) => {
      const def = TEXTURES[start + i];
      // Letzte Seite kann unvollstaendig sein.
      tile.button.hidden = def === undefined;
      if (!def) return;
      tile.def = def;
      tile.button.setAttribute("aria-label", def.label);
      tile.hovered = false;
      tile.blend = 0;
      drawStatic(tile);
    });

    dots.querySelectorAll("span").forEach((dot, i) => dot.classList.toggle("active", i === page));
    prevButton.disabled = page === 0;
    nextButton.disabled = page >= pageCount - 1;
  }

  function turnTo(next: number): void {
    const clamped = Math.min(Math.max(next, 0), pageCount - 1);
    if (clamped === page) return;
    page = clamped;
    container.classList.add("turning");
    window.setTimeout(() => {
      applyPage();
      container.classList.remove("turning");
    }, TURN_MS);
  }

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    for (const tile of tiles) {
      const css = tile.canvas.clientWidth || tile.button.clientWidth;
      if (!css) continue;
      const px = Math.max(1, Math.round(css * dpr));
      tile.canvas.width = px;
      tile.canvas.height = px;
      tile.fx.width = px;
      tile.fx.height = px;
      tile.size = px;
      drawStatic(tile);
    }
  }

  function drawStatic(tile: Tile): void {
    if (!tile.size) return;
    const tex = getTexture(tile.def);
    const crop = tex.width * TILE_CROP;
    const offset = (tex.width - crop) / 2;
    tile.ctx.drawImage(tex, offset, offset, crop, crop, 0, 0, tile.size, tile.size);
  }

  let last = performance.now();
  function frame(now: number): void {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    for (const tile of tiles) {
      if (tile.button.hidden) continue;

      const active = tile.hovered && now - tile.hoverSince >= HOVER_DELAY_MS;
      const target = active ? 1 : 0;
      const step = (dt * 1000) / FADE_MS;
      tile.blend += Math.sign(target - tile.blend) * Math.min(step, Math.abs(target - tile.blend));

      if (tile.blend <= 0) continue;

      // Solange die Vorschau sichtbar ist, laeuft sie weiter -- auch waehrend sie ausblendet.
      tile.spin += dt;
      tile.rotation += dt * 0.35;

      const tex = getTexture(tile.def);
      drawKaleidoscope(tile.fxCtx, tex, tex.width, tex.height, tile.size, stateAt(tile.spin, tile.rotation));

      drawStatic(tile);
      tile.ctx.globalAlpha = tile.blend;
      tile.ctx.drawImage(tile.fx, 0, 0);
      tile.ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }

  prevButton.addEventListener("click", () => turnTo(page - 1));
  nextButton.addEventListener("click", () => turnTo(page + 1));
  window.addEventListener("resize", resize);

  // Nach dem ersten Layout messen, sonst ist clientWidth noch 0.
  requestAnimationFrame(() => {
    applyPage();
    resize();
    requestAnimationFrame(frame);
  });

  return {
    next: () => turnTo(page + 1),
    prev: () => turnTo(page - 1),
    pageCount,
  };
}
