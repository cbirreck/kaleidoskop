import { TIMER_DEFAULT_MINUTES } from "./config";

/**
 * Bildschirmzeit-Timer (A3).
 *
 * Laeuft global: ueber Bildwechsel UND ueber Pause hinweg. Es geht um Bildschirmzeit,
 * nicht um Animationszeit -- sonst waere "Pause druecken und Standbild angucken"
 * die naechste Luecke.
 *
 * Der Ablaufzeitpunkt liegt in sessionStorage. Das ueberlebt F5 (sonst waere A3 nach
 * dem ersten Reload wertlos), wird aber beim Schliessen des Tabs geleert -- genau
 * das gewuenschte Verhalten: neue Sitzung, neue volle Zeit.
 */
const STORAGE_KEY = "kaleidoskop.deadline";

/** Letzte Minute: hier faengt der Ausklang an. */
export const WARN_SECONDS = 60;

let deadline: number | null = null;
let totalMs = TIMER_DEFAULT_MINUTES * 60_000;

export function isRunning(): boolean {
  return deadline !== null;
}

/** Startet den Timer -- oder setzt eine noch laufende Sitzung nach einem Reload fort. */
export function start(): void {
  if (deadline !== null) return;

  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      deadline = parsed;
      return;
    }
  }
  deadline = Date.now() + totalMs;
  persist();
}

/** Nach dem Endscreen: neue volle Zeit. */
export function reset(): void {
  deadline = null;
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Papa-Taste: verlaengert oder kuerzt die laufende Zeit um `minutes`. */
export function adjust(minutes: number): number {
  totalMs = Math.max(60_000, totalMs + minutes * 60_000);
  if (deadline !== null) {
    deadline = Math.max(Date.now() + 60_000, deadline + minutes * 60_000);
    persist();
  }
  return Math.round(totalMs / 60_000);
}

export function remainingSeconds(): number {
  if (deadline === null) return totalMs / 1000;
  return Math.max(0, (deadline - Date.now()) / 1000);
}

/** 0 = gerade gestartet, 1 = abgelaufen. */
export function progress(): number {
  if (deadline === null) return 0;
  return 1 - Math.min(1, (remainingSeconds() * 1000) / totalMs);
}

export function isExpired(): boolean {
  return deadline !== null && remainingSeconds() <= 0;
}

/**
 * Ausklang-Faktor der letzten Minute: 1 = normal, 0 = steht still.
 * Rotation und Farbigkeit haengen daran.
 */
export function fadeFactor(): number {
  const left = remainingSeconds();
  if (left >= WARN_SECONDS) return 1;
  return Math.max(0, left / WARN_SECONDS);
}

function persist(): void {
  if (deadline !== null) sessionStorage.setItem(STORAGE_KEY, String(deadline));
}
