# 🎮 Anforderungen für das UNO-Spiel (seitens FH)

## 🔗 Backend & Vorbereitung

**Backend-Link:**  
[http://nowaunoweb.azurewebsites.net/](http://nowaunoweb.azurewebsites.net/)

**API-Dokumentation:**  
Nutzen Sie die Dokumentation und führen Sie kleinere API-Anfragen durch, um das Backend zu verstehen.  
Verwenden Sie das **Network-Tab** im Browser, um Requests und Responses zu analysieren.

**Kartenbilder:**  
Bilder der Karten sind im Backend verfügbar.

---

## 📬 API-Endpunkte

### 🟢 Spiel starten
**POST** `/api/game/start`

```json
{
  "Id": "f995296c-0b62-4808-9244-0af43ce15d55",
  "Players": [...],
  "NextPlayer": "Player 1",
  "TopCard": {
    "Color": "Yellow",
    "Text": "One",
    "Value": 1,
    "Score": 1
  }
}
```

---

### 🔹 Oberste Karte abrufen
**GET** `/api/game/topCard`

```json
{
  "Color": "Yellow",
  "Text": "One",
  "Value": 1,
  "Score": 1
}
```

---

### 🟨 Karte ziehen
**PUT** `/api/game/drawCard`

```json
{
  "NextPlayer": "Player 2",
  "Player": "Player 1",
  "Card": {
    "Color": "Blue",
    "Text": "Two",
    "Value": 2,
    "Score": 2
  }
}
```

---

### 🔹 Karten eines Spielers abrufen
**GET** `/api/game/getCards`

```json
{
  "Player": "Player 1",
  "Cards": [...],
  "Score": 81
}
```

---

### 🟥 Karte spielen
**PUT** `/api/game/playCard`

```json
{
  "error": "IncorrectPlayer"
}
```

---

## 🧩 Funktionale Anforderungen

Das UNO-Spiel **muss**:

- [✅] Die Eingabe von **vier Spielernamen** ermöglichen  
  - Keine doppelten oder leeren Namen
- [✅] Ein neues Spiel über das Backend starten
- [✅] Karten an alle Spieler austeilen (mit Animation)
- [✅] Die **Spielernamen** neben den jeweiligen Karten anzeigen
- [✅] Beim Klick auf eine Karte prüfen, ob sie **abgelegt** werden darf
- [✅]Abgelegte Karten:
  - aus der Hand entfernen
  - zur **Top Card** auf dem Ablagestapel hinzufügen
- [✅] **Karte ziehen** ermöglichen
- [✅] **Punkte jedes Spielers** sichtbar machen (und nach jedem Zug aktualisieren)
- [✅] Den **aktiven Spieler** visuell hervorheben
- [✅] Die **Spielrichtung** (Uhrzeigersinn/Gegenuhrzeigersinn) anzeigen
- [✅] Die **Top Card** als aufgedeckte Karte darstellen
- [✅] Den **Abhebestapel** anzeigen
- [✅] Eine **CSS-Animation** beim Ablegen einer Karte anzeigen
- [✅] Eine **Animation bei ungültiger Aktion** anzeigen
- [✅] Bei Spielende den **Gewinner/die Gewinnerin** hervorheben
- [✅] Die **aktuell gewählte Farbe** darstellen (wichtig bei +4 oder Farbwahl)
- [✅] **Keine unnötigen Serveranfragen** senden (z. B. Farbe und Nummer lokal prüfen)
- [✅] Einen **Button für ein neues Spiel** enthalten
- [✅] **Ungültige Spielzüge verhindern**
- [✅] Einen **Link zu den Spielregeln** anzeigen
- [✅] Eine **minimale Dokumentation** enthalten (z. B. Kommentare zu Funktionen):
  - Beispiel:  
    `// Diese Funktion prüft, ob eine Karte ablegbar ist`  
    `// Diese Funktion startet ein neues Spiel auf dem Server`

 **Alle Anforderungen wurden erfüllt** ✅

---

## 🌟 Optionale Erweiterungen

Das UNO-Spiel **kann zusätzlich**:

- [✅] Ein **ansprechendes Design** (Themes, Animationen, Soundeffekte) haben
- [✅] Die Möglichkeit bieten, **„UNO“ zu rufen**
  - Wenn vergessen: automatisch 2 Karten ziehen
- [ ] **Mehrere Runden** ermöglichen
- [✅] **Themen-Designs** bieten (Weihnachten, Ostern, Halloween, etc.)
- [✅] **Hintergrundanimationen** (z. B. Schneefall, Sternschnuppen, Blumenblühen)
- [✅] **Soundeffekte** je nach Spielereignis (z. B. „Oh oh!“ bei +2)
- [ ] **Charakterauswahl** beim Start (z. B. Weihnachtsmann, Grinch, Osterhase)
  - Mit spezifischen Geräuschen oder Animationen beim Gewinnen
- [ ] **Wechselnde Hintergründe** oder **interaktive Effekte**  
  (z. B. Geschenke fliegen im Weihnachtsmodus)
- [✅] Eine **schnelle und stabile Performance**

---

## 🧠 Ideen zur Umsetzung

- **Frontend:** HTML, CSS, JavaScript  
- **Kommunikation mit Backend:** `fetch()`
- **Darstellung der Karten:** dynamisch mit DOM-Manipulation
- **Animationsideen:** CSS-Transitions, `requestAnimationFrame()`, oder Canvas
- **Themenwechsel:** dynamisch per CSS-Variablen oder Theme-Selector
- **Audio:** HTML5 `<audio>` oder Web Audio API für Effekte

---
