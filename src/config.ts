/** Anzahl der Spiegelsegmente. 6 wirkt grob-blumig, 12 klassisch, 20 zappelig. */
export const SEGMENTS = 12;

/**
 * Tempostufen in Grad pro Sekunde.
 *
 * GESCHAETZTE Startwerte, nicht gemessen. Nach der ersten Sitzung mit ihm justieren --
 * das ist kein Versagen der Planung, sondern der einzige Weg, die richtigen Werte zu finden.
 *
 * Achtung: Bei 12 Segmenten wiederholt sich das Muster schon alle 30 Grad. Die gefuehlte
 * Geschwindigkeit ist deshalb deutlich hoeher als die Gradzahl vermuten laesst.
 */
export const SPEED_LEVELS_DEG_PER_SEC = [1, 3, 6, 12, 25];

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
