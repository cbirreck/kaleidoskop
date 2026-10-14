/**
 * Symmetriegrad = Anzahl der "Zacken".
 *
 * Eine Zacke besteht aus zwei gespiegelten Bildsektoren, der Wert ist also die Haelfte
 * der sichtbaren Keile. 6 wirkt grob-blumig, 10 klassisch, ab 16 wird es feines Flirren.
 *
 * Warum Zacken und nicht Sektoren: Nahtlosigkeit erfordert, dass an *jeder* Kante
 * gespiegelt wird -- nach einem Umlauf muss die Orientierung wieder stimmen, die
 * Sektorzahl ist damit zwangslaeufig gerade. Zaehlt man stattdessen Zacken, ist jeder
 * ganzzahlige Wert erreichbar, auch 7 und 9.
 */
export const SYMMETRY = 6;

/**
 * Waehlbare Symmetriegrade (Papa-Taste links/rechts).
 *
 * Lueckenlos 1..20, damit jeder Zwischenschritt existiert.
 * 0 ist der Sonderfall ohne jede Spiegelung -- das Bild dreht sich einfach, mehr nicht.
 * 1 ergibt eine einzelne Spiegelachse.
 *
 * 20 Zacken sind 40 Sektoren: die Keile werden dort so schmal, dass vom Bild kaum mehr
 * als ein Farbstreifen pro Sektor uebrig bleibt. Das ist gewollt -- es sieht aus wie
 * eine Dahlie und ist der sichtbarste Kontrast zu den niedrigen Stufen.
 */
export const SYMMETRY_STEPS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

/** Kacheln pro Seite auf der Startseite (A1). */
export const TILES_PER_PAGE = 8;

/**
 * Tempostufen in Grad pro Sekunde.
 *
 * GESCHAETZTE Startwerte, nicht gemessen. Nach der ersten Sitzung mit ihm justieren --
 * das ist kein Versagen der Planung, sondern der einzige Weg, die richtigen Werte zu finden.
 *
 * Achtung: Bei S Zacken wiederholt sich das Muster schon alle 360/S Grad, bei 6 also
 * alle 60. Die gefuehlte Geschwindigkeit ist deshalb deutlich hoeher als die Gradzahl
 * vermuten laesst -- Stufe 7 laeuft rund drei Mustern pro Sekunde entgegen.
 */
export const SPEED_LEVELS_DEG_PER_SEC = [1, 3, 6, 12, 25, 50, 100];

/** Stufe 2 (Index 1) ist der Default. */
export const DEFAULT_SPEED_INDEX = 1;

/**
 * Vergroesserung des Quellbildes relativ zum Radius.
 * Groesser = kleinerer Ausschnitt = feineres Muster, aber unschaerfer.
 */
export const ZOOM = 2.8;

/**
 * Drift-Geschwindigkeiten in rad/s fuer die beiden Lissajous-Achsen.
 * Bewusst inkommensurabel, damit sich der Ausschnitt nie sichtbar wiederholt.
 * Bei Stufe 2 legt der Drift den groesseren Teil der Bewegung zurueck --
 * er ist der Unterschied zwischen Bildschirmschoner und "das Kind guckt zehn Minuten hin".
 */
export const DRIFT_SPEED_X = 0.043;
export const DRIFT_SPEED_Y = 0.029;

/** Timer-Default in Minuten (A3). */
export const TIMER_DEFAULT_MINUTES = 10;
