# Kartenlogik – Klassische UNO-Variante

Diese Datei beschreibt die Logik der Karten im klassischen UNO-Spiel, wie sie im Projekt umgesetzt werden soll.
Sie orientiert sich an den offiziellen Spielregeln: [UNO-Spielregeln](https://www.uno-kartenspiel.de/spielregeln/)

---

## 🎴 Allgemeine Struktur

Jede Karte im Spiel wird als PNG-Datei dargestellt.
Die Dateinamen folgen dem Schema:
[color][value].png


Beispiele:
- `red5.png` → Rote Fünf
- `blue11.png` → Blaue Aussetzen-Karte
- `black13.png` → +4 Karte
- `back0.png` → Rückseite der Karten

---

## 🟥 Zahlenkarten (0–9)

- Dateinamen: `color0.png` bis `color9.png`
- Farben: `red`, `yellow`, `green`, `blue`
- Diese Karten haben reine Zahlenwerte ohne Spezialeffekte.
- Sie können nur auf Karten derselben Farbe oder gleicher Zahl gelegt werden.

**Beispiel:**
- Auf `yellow5.png` darf `yellow8.png` oder `red5.png` gelegt werden.


---

## 🟨 +2-Karten (Value = 10)

- Dateinamen: `color10.png`
- Effekt: Der nächste Spieler muss **2 Karten ziehen** und **darf keine Karte ablegen**.
- Darauf dürfen gelegt werden:
  - Eine andere `color10.png` (egal, welche Farbe)
  - Zahlenkarten (0–9) derselben Farbe

**Beispiel:**
- `blue10.png` → +2 Karte
  → Darauf darf `blue7.png` oder `green10.png` gelegt werden.

---

## 🟩 Aussetzen-Karten (Value = 11)

- Dateinamen: `color11.png`
- Effekt: Der nächste Spieler **setzt eine Runde aus**.
- Darauf dürfen gelegt werden:
  - Alle Karten derselben Farbe (`color0-9.png`)
  - Alle anderen Aussetzen-Karten (11er) beliebiger Farbe

**Beispiel:**
- Auf `yellow11.png` dürfen `yellow5.png`, `green11.png`, `red11.png` oder `blue11.png` gelegt werden.
  → Diese Logik verhindert „Dead Ends“, falls nur eine Karte derselben Farbe erlaubt wäre.

---

## 🟦 Richtungswechsel-Karten (Value = 12)

- Dateinamen: `color12.png`
- Effekt: Die Spielrichtung wird **umgekehrt**.
- Darauf dürfen gelegt werden:
  - Andere Richtungswechsel-Karten (unabhängig von der Farbe)
  - Zahlenkarten (0–9) derselben Farbe

**Beispiel:**
- Auf `blue12.png` darf `blue8.png` oder `red12.png` gelegt werden.

---

## ⬛ Spezialkarten (schwarz)

### +4 Karte (Value = 13)
- Dateiname: `black13.png`
- Effekt:
  - Nächster Spieler muss **4 Karten ziehen**.
  - Der aktuelle Spieler darf **eine neue Farbe wählen** (rot = red, gelb = yellow, grün = green oder blau = blue).
- Diese Karte kann **auf jede andere Karte gelegt** werden, darf aber **nur gespielt werden**, wenn der Spieler keine Karte derselben Farbe auf der Hand hat, die gerade gefordert wird laut ablagestapel.

---

### Farbwahlkarte (Value = 14)
- Dateiname: `black14.png`
- Effekt:
  - Der Spieler darf **eine beliebige Farbe bestimmen**, mit der das Spiel fortgesetzt wird.
  - Keine zusätzlichen Karten werden gezogen.
- Kann **auf jede Karte gelegt** werden.

---

## 🔙 Rückseite der Karten
- Dateiname: `back0.png`
- Wird für verdeckte Karten (z. B. auf dem Nachziehstapel) verwendet.

---

## ⚙️ Logikübersicht

| Kartenart              | Beispiel-Datei  | Auf welche Karten darf sie gelegt werden | Effekt |
|-------------------------|----------------|------------------------------------------|---------|
| Zahlenkarten 0–9        | `red5.png`     | Gleiche Zahl oder gleiche Farbe          | Keine |
| +2-Karten (10)  Draw2   | `yellow10.png` | +2 beliebiger Farbe oder gleiche Farbe 0–9 | Nächster Spieler zieht 2 Karten |
| Aussetzen (11)          | `blue11.png`   | Alle Aussetzen-Karten oder gleiche Farbe | Nächster Spieler setzt aus |
| Richtungswechsel (12)   | `green12.png`  | Alle Richtungswechsel oder gleiche Farbe | Spielrichtung kehrt um |
| +4 (13) Draw4           | `black13.png`  | Auf jede Karte (unter Bedingung)         | +4 Karten, Farbwahl |
| Farbwahl (14)           | `black14.png`  | Auf jede Karte                           | Farbwahl |
| Rückseite               | `back0.png`    | —                                        | Dient der Darstellung verdeckter Karten |

---

## 📚 Quellen
- [UNO-Spielregeln (offiziell)](https://www.uno-kartenspiel.de/spielregeln/)

