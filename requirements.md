# Kaleidoskop

Ein Tool, das meinen 3-jährigen Sohn entertainen soll. Er liebt symmetrische Formen,
z.B. Sterne und Blumen. Wir bedienen es gemeinsam.

**Status:** Iteration 1 (i-1) — Laptop-Version.

---

## Leitprinzip

**Maus = Kind, Tastatur = Papa.**

Alles Sichtbare gehört ihm, alles Unsichtbare mir. Keine Regler, keine Beschriftungen,
keine Einstellungsdialoge auf dem Bildschirm. Daraus folgt fast jede andere Entscheidung
in diesem Dokument.

## Zielgerät (i-1)

Laptop, 1440×900, Maus/Trackpad + Tastatur, Edge im Kiosk-Modus.
Bewusst **nicht** responsive. iPad ist i-2 (siehe unten).

---

## Anforderungen

### A1 — Startseite

- 8 kreisrund beschnittene Kacheln mit den Bildern.
- Kacheln sind **statisch**, bis die Maus darüber fährt.
- **Hover:** nur die Kachel unter dem Cursor animiert (echte Kaleidoskop-Vorschau
  ihres Bildes), 150 ms Verzögerung vor dem Start, beim Verlassen weiches Ausfaden.
  Die Verzögerung verhindert Geflacker beim Queren der Startseite.
- Kein Text. Er kann nicht lesen.

### A2 — Kaleidoskop-Modus

- **A2a — Effekt:** Canvas 2D. Spiegelsymmetrie, Default 6 Zacken (= 12 Sektoren).
  Es rotiert *und* der abgetastete Bildausschnitt driftet langsam über das Bild.
  Der Drift ist der Unterschied zwischen Bildschirmschoner und "das Kind guckt
  zehn Minuten hin".
- **A2b — Steuerung:**
  - **Seine Buttons** (Maus, groß, unten, Symbole): Play/Pause, Zurück zur Auswahl.
  - **Meine Tasten** (unsichtbar): `↑`/`↓` Tempo, `←`/`→` Zackenzahl (auf der
    Startseite blättern dieselben Tasten die Kachelseiten), `+`/`−` Timer,
    `F` Fullscreen, `Esc` Freigabe des Endscreens.
- **Tempostufen:** 7 diskrete Stufen, Default Stufe 2.
  Startwerte ca. 1 / 3 / 6 / 12 / 25 / 50 / 100 °/s — **geschätzt, nicht gemessen.**
  Als benannte Konstanten oben in der Datei halten; nach der ersten Sitzung justieren.
  (Bei 6 Zacken wiederholt sich das Muster alle 60°, die gefühlte Geschwindigkeit
  ist deutlich höher als die Gradzahl vermuten lässt.)
- **A2c — Zackenzahl:** lückenlos 1 … 20, Default 6, plus eine Stufe 0 ganz ohne
  Spiegelung (das Bild dreht sich dann einfach). Die oberen Stufen sind feines
  Flirren — 20 Zacken sind 40 Sektoren.

  Gezählt werden **Zacken**, nicht Sektoren. Das ist keine Kosmetik, sondern Geometrie:
  nahtlos wird das Bild nur, wenn an *jeder* Sektorkante gespiegelt wird — nach einem
  Umlauf muss die Orientierung wieder stimmen, die Sektorzahl ist damit zwangsläufig
  gerade. Eine ungerade Sektorzahl (7, 9) lässt sich **nicht** nahtlos zeichnen; sie
  behielte immer eine mitdrehende Bruchkante. Zählt man Zacken — je zwei gespiegelte
  Sektoren —, ist jeder ganzzahlige Wert erreichbar und nahtlos, 7 und 9 inklusive.

### A3 — Timer

Begrenzt die Bildschirmzeit. Default 10 Minuten.

- **Start:** bei der ersten Mausbewegung nach dem Laden.
  Nicht beim Laden (mein Setup zählt nicht als seine Zeit), nicht beim ersten Klick
  (sonst wird die Hover-Startseite zum timerfreien Spielplatz).
- **Läuft global:** über Bildwechsel *und* über Pause hinweg. Es geht um Bildschirmzeit,
  nicht um Animationszeit.
- **Reload-Schutz:** Restzeit in `sessionStorage`. Ohne das ist A3 nach dem ersten
  F5 wertlos.
- **Anzeige:** blasser dünner Fortschrittsbalken am oberen Rand. Kein Zahlen-Countdown —
  für ihn bedeutungslos, für die Stimmung schädlich.
- **Ausklang:** ab 1:00 wird die Rotation langsamer und das Bild blasser.
- **Ende:** Das letzte Muster friert ein, dunkelt ab, ein Mond-Symbol legt sich darüber.
  Es ist noch da, es schläft nur. Freigabe **nur** per `Esc`; Mausklicks werden auf
  dem Endscreen vollständig ignoriert.

---

## Bilder

8 generierte PNGs (1024×1024) im Repo. Je eine dominante Farbwelt, damit er sie
unterscheiden kann, ohne lesen zu können:

| # | Motiv | Farbwelt |
|---|---|---|
| 1 | Blumenwiese | bunt |
| 2 | Herbstlaub | orange/rot |
| 3 | Sternenhimmel | blau/gold |
| 4 | Korallenriff | türkis |
| 5 | Buntstifte | regenbogen |
| 6 | Legosteine | primärfarben |
| 7 | Federn | grün/lila |
| 8 | Bonbons | rosa |

**Wichtig:** flächenfüllende Muster, **kein zentrales Motiv**, kein Rand, kein Text.
Ein Kaleidoskop sampelt einen *Ausschnitt* — ein Foto mit einem Hauptmotiv in der Mitte
wird zu Matsch.

---

## Architektur

- **Vite** (vanilla-ts), kein Framework. Drei Screens ohne geteilten Zustand brauchen
  kein React.
- Canvas 2D. Kein WebGL — "quick and dirty" steht so in der ursprünglichen Anforderung,
  und bei 1440×900 reicht 2D locker für 60 fps.
- Die Render-Funktion muss in ein **beliebiges Canvas beliebiger Größe** zeichnen können.
  Davon hängt die Hover-Vorschau ab (und später die animierten Kacheln).
- Keine Persistenz außer der einen `sessionStorage`-Zeile für den Timer.
  Kein Server, keine Anmeldung, keine Abhängigkeit zur Laufzeit.

## Start im Alltag

Die Startlogik steht an **einer** Stelle: `bin/kaleidoskop.ps1`. Sie findet den
Projektordner relativ zu sich selbst, baut neu falls eine Quelldatei jünger ist als
`dist/index.html`, und öffnet die Seite in **Edge im Kiosk-Modus**: Vollbild, keine
Tabs, keine Adressleiste, kein X zum Wegklicken.

Drei Wege führen hinein, alle auf dieselbe Datei:

| Weg | wofür |
|---|---|
| `kaleidoskop` im Terminal | PATH-registriert (`bin/` im User-PATH) |
| `Kaleidoskop.cmd` im Wurzelverzeichnis | Desktop-Verknüpfung, leitet nur weiter |
| `bin/kaleidoskop.cmd` | Shim für cmd.exe, Win+R, Explorer-Adressleiste |

Schalter: `-Rebuild` (Neubau erzwingen), `-Windowed` (normales Fenster statt Kiosk —
im Kiosk gibt es keine Entwicklertools), `-Restart` (laufende Instanz ersetzen).
Ohne `-Restart` meldet ein zweiter Aufruf nur, dass schon etwas läuft; zwei
Kiosk-Fenster übereinander sind nicht offensichtlich, aber sehr verwirrend.

Zwei Dinge, die dabei nicht offensichtlich sind:

- **`.PS1` steht nicht in `PATHEXT`.** PowerShell findet `.ps1` im PATH trotzdem
  (als `ExternalScript`), cmd.exe nicht. Daher der `.cmd`-Shim daneben.
- **Der automatische Neubau ist kein Komfort.** Ohne ihn startet man irgendwann
  ahnungslos einen alten Stand und sucht den Fehler im Code statt im Build.

Das alles ist kein Komfort-Feature. Wenn "Kaleidoskop gucken" bedeutet, erst ein
Terminal zu öffnen, benutzen wir es dreimal und nie wieder.

`npm run dev` bleibt fürs Entwickeln.

## Repo

Privates GitHub-Repo. Die Entscheidung öffentlich/privat fällt erst in i-2, wenn Hosting
relevant wird — privat → öffentlich ist ein Klick, die Gegenrichtung nicht.

Fakt dazu: GitHub Pages funktioniert bei einem **kostenlosen** Account nur mit
öffentlichen Repos; stellt man ein Repo mit aktiver Pages-Seite auf privat, wird die
Seite automatisch depubliziert. Alternativen mit privatem Repo: Cloudflare Pages
oder Netlify. Bei allen dreien ist die *veröffentlichte Seite* öffentlich erreichbar —
privat schützt den Code, nicht die App.

---

## Bau-Reihenfolge

Das Risiko zuerst: Wenn der Effekt nicht fesselt, ändert das alles Nachfolgende.

1. Repo + Vite-Setup
2. **Ein** Bild, Effekt sichtbar machen ← hier entscheidet sich das Projekt
3. Tempowerte justieren
4. Kacheln + Hover-Vorschau
5. Buttons
6. Timer
7. Restliche 7 Bilder

---

## Bewusst nicht in i-1

Ton · Bild-Upload · Kamera-Modus · animierte Vorschau für *alle* Kacheln gleichzeitig ·
Persistenz · Hosting · responsive Layout

**Stärkste Kandidaten für i-1.5:** die Zackenzahl als **sein** Button (sie liegt bisher
nur auf meinen Pfeiltasten — verändert sichtbar sofort etwas, genau das, was ein
3-Jähriger an Knöpfen liebt) und die Kamera als Bildquelle (er sieht sich selbst
gespiegelt).

## i-2 — iPad

Das iPad meiner Partnerin. Sie ist nicht technikaffin, das Ding muss ohne mich laufen.

**i-2 ist kein Port, sondern eine zweite Bedienschicht.** Auf Touch fallen *beide*
Papa-Mechanismen ersatzlos weg: die Tastatur und der Hover. Beides braucht dort einen
Ersatz (Erwachsenen-Ecke mit Langdruck; Animation bei Fingerkontakt oder alle Kacheln
animiert). Das ist akzeptiert, nicht übersehen.

Offene Frage für i-2: wie die App überhaupt in ihren iPad-Browser kommt
(Hosting + "Zum Homescreen hinzufügen").

---

## Annahmen, die wir auf Verdacht treffen

1. **Die Tempowerte sind geraten.** Die richtigen findet man nur, wenn man davorsitzt.
2. **Der schlafende Mond als "vorbei"-Signal** ist eine Einschätzung, kein Befund.
   Kann beim ersten Mal trotzdem Tränen geben.
3. **Die zentrale Wette:** Er liebt Sterne und Blumen — und die Bilder enthalten
   bewusst *keine*. Die Symmetrie soll aus dem **Effekt** entstehen, nicht aus dem Bild.
   Ein Kaleidoskop macht aus einer Blumenwiese permanent neue Sterne und Blumen.
   Geht diese Wette nicht auf, kippt das Projekt — deshalb steht der Effekt in
   Schritt 2 der Bau-Reihenfolge und nicht am Ende.
