# UNO Frontend – Komplettes Layout & Styleguide

Dieses Dokument kombiniert Layoutbeschreibung, CSS-Design, Styleguide, Interaktionen und Zusatzideen für das UNO-Webfrontend.

---

## 🎨 1. Grundlayout

- **Hintergrund:** Dunkelblau (#003366–#004b8d), radialer Verlauf von dunkler Mitte zu hellerem Rand.  
- **Spielfeld:** Zentrierte 16:9-Spielfläche.  
- **Kartenrückseiten:** Schwarzer Hintergrund mit UNO-Logo.  
- **Spielerpositionen:**  
  - Spieler 1: unten zentriert  
  - Spieler 2: links mittig  
  - Spieler 3: oben zentriert  
  - Spieler 4: rechts mittig  

---

## 🧍 2. Spieler-Icons & Darstellung

- Jeder Spieler erhält beim Spielstart **ein zufälliges Icon** aus dem Ordner `symbols/`.  
- Alle Icons sind **gleich groß** und stehen **links vom Spielernamen**.  
- Punktestand ist **nur sichtbar, wenn der jeweilige Spieler am Zug ist**.

### Spieler-Layout
- **Spieler 1 (User):** Karten sichtbar und nebeneinander unten.  
- **Andere Spieler:** Kartenrückseiten – horizontal (oben/unten) oder vertikal (links/rechts).  
- Optional: Name + Icon + Punktestand (kontextabhängig sichtbar).

---

## 🃏 3. Karten-Design

### Eigenschaften
- Abgerundete Ecken (`border-radius: 12px`)
- Schatten (`box-shadow: 0 2px 5px rgba(0,0,0,0.5)`)
- Farbe via CSS-Klassen (rot, blau, grün, gelb, schwarz)
- Hover-Effekte: leichtes Anheben / Rotation

### Beispiel (CSS)
```css
.card {
  width: 80px;
  height: 120px;
  border-radius: 12px;
  border: 3px solid white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2em;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.4);
  transition: transform 0.2s;
}
.card:hover { transform: translateY(-5px) rotate(-2deg); }

.card.red    { background: #e53935; }
.card.blue   { background: #1e88e5; }
.card.green  { background: #43a047; }
.card.yellow { background: #fdd835; color: black; }
.card.black  { background: #212121; }

---

## 4. Zentraler Spielbereich

Der zentrale Bereich des Spielfeldes enthält:

- **Nachziehstapel (Draw Pile)**  
- **Ablagestapel (Discard Pile)**  
- **Farbindikator** zur Anzeige der aktiven Farbe (Diamantform)  
- **Zug- oder Rundenzähler**

### Beispiel-HTML
```html
<div id="center-area">
  <div id="draw-pile" class="pile"></div>
  <div id="discard-pile" class="pile"></div>
  <div id="color-indicator" class="diamond red"></div>
</div>

Beispiel CSS:
#center-area {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 20px;
}

.pile {
  width: 80px;
  height: 120px;
  border-radius: 12px;
  background: black;
  border: 3px solid white;
}

.diamond {
  width: 25px;
  height: 25px;
  transform: rotate(45deg);
}

.diamond.red    { background: #e53935; }
.diamond.green  { background: #43a047; }
.diamond.yellow { background: #fdd835; }
.diamond.blue   { background: #1e88e5; }

5. Buttons & Interaktionen
UNO-Button
Visuelles Feedback bei Aktivierung
Animation (z. B. Pulsieren), wenn der Spieler UNO rufen soll
Spielregeln-Button
Immer sichtbar (z. B. Fragezeichen-Icon)
Öffnet ein Overlay oder Modal mit Spielregeln
Overlay pausiert das restliche UI

6. JavaScript – Grundlogik & Spielfluss
Spielerhände: Arrays pro Spieler
Stapel: drawPile, discardPile
Spielstatus: currentColor, currentValue, currentPlayer
Nur Spieler 1 kann Karten aktiv per Klick spielen
Farb- und Wertprüfung für gültige Züge
Spezialkarten lösen Farbwahl-Popup aus
updateUI() aktualisiert DOM (Hände, Indikator, Stapel, Icons …)
Beispiel-JavaScript

let players = [[], [], [], []];
let discardPile = [];
let drawPile = [];
let currentColor = null;
let currentValue = null;
let currentPlayer = 0;

function playCard(card) {
  if (card.color === currentColor ||
      card.value === currentValue ||
      card.color === 'black') {

    discardPile.push(card);
    currentColor = card.color;
    currentValue = card.value;

    updateUI();
    nextPlayer();
  } else {
    alert("Karte kann nicht gelegt werden!");
  }
}

function updateUI() {
  // Karten, Stapel, Farbindikator und UI-Elemente aktualisieren
}

7. Zusatzideen & Easter Eggs
Optische Effekte
Schnee-Animation: Klick auf Farbindikator → 10 Sekunden Schneefall
Animiertes Ablegen der Karten (z. B. „fliegen“ zum Ablagestapel)
Hover-Effekte: Schatten, leichte Rotation, Mini-Skalierung
Sound-Effekte
Avatar-Klick → „Merry Christmas Sound“
Grinch-Avatar → „ready-to-rumble-grinch.mp3“
Weitere Ideen
Visuelles Feedback bei ungültigen Zügen (Shake-Effekt)
Abschließende Punkteübersicht nach dem Spiel
Optionales Mini-Tutorial beim ersten Start