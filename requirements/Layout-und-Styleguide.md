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
- **Spieler 1 (User):** Karten sichtbar in einem Grid 
- **Andere Spieler:** Kartenrückseiten wenn nicht aktiv
-  Name + Icon + Punktestand (oberhalb der Spieler"boxen" stets sichtbar)

---

## 🃏 3. Karten-Design

### Eigenschaften
- Abgerundete Ecken (`border-radius: 12px`)
- Schatten (`box-shadow: 0 2px 5px rgba(0,0,0,0.5)`)
- Hover-Effekte: leichtes Anheben / Rotation


## 4. Zentraler Spielbereich

Der zentrale Bereich des Spielfeldes enthält:

- **Nachziehstapel (Draw Pile)**  
- **Ablagestapel (Discard Pile)**  
- **Farbindikator** zur Anzeige der aktiven geforderten Farbe (Diamantform)  
- **Aktiven Spielernamen + Richtungsanzeige**


## 5. Buttons & Interaktionen
- **UNO-Button**
Visuelles Feedback bei Aktivierung
Animation (z. B. Pulsieren), wenn der Spieler UNO rufen soll

- **Spielregeln-Button**
Immer sichtbar (z. B. Fragezeichen-Icon)
Öffnet einen Link zu den offiziellen Uno-Spielregeln

## 6. JavaScript – Grundlogik & Spielfluss
- **Spielerhände**: Arrays pro Spieler
- **Stapel**: drawPile, discardPile
- **Spielstatus**: currentColor, currentValue, currentPlayer
- Nur Spieler 1 kann Karten aktiv per Klick spielen
- Farb- und Wertprüfung für gültige Züge
- **Spezialkarten** lösen Farbwahl-Popup aus
- updateUI() aktualisiert DOM (Hände, Indikator, Stapel, Icons …)

**Beispiel-JavaScript**

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