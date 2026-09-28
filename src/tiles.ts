import { TEXTURES, getTexture, type TextureDef } from "./textures";
import { drawKaleidoscope, stateAt } from "./kaleidoscope";

/**
 * Verzoegerung, bevor die Hover-Vorschau anspringt. Ohne sie flackert beim Queren
 * der Startseite jede ueberfahrene Kachel kurz auf.
 */
const HOVER_DELAY_MS = 150;

/** Weiches Ein-/Ausblenden der Vorschau statt hartem Einfrieren. */
const FADE_MS = 420;

/** Ausschnitt der Textur, den die statische Kachel zeigt (0.45 = mittlere 45%). */
const TILE_CROP = 0.45;

interface Tile {
  def: TextureDef;
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

export function createTiles(container: HTMLElement, onPick: (def: TextureDef) => void): void {
  const tiles: Tile[] = [];

  for (const def of TEXTURES) {
    const button = document.createElement("button");
    button.className = "tile";
    button.setAttribute("aria-label", def.label);

    const canvas = document.createElement("canvas");
    button.appendChild(canvas);
    container.appendChild(button);

    const fx = document.createElement("canvas");
    const tile: Tile = {
      def,
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
    button.addEventListener("click", () => onPick(def));
  }

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    for (const tile of tiles) {
      const css = tile.canvas.clientWidth || tile.canvas.parentElement!.clientWidth;
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

  window.addEventListener("resize", resize);
  // Nach dem ersten Layout messen, sonst ist clientWidth noch 0.
  requestAnimationFrame(() => {
    resize();
    requestAnimationFrame(frame);
  });
}
