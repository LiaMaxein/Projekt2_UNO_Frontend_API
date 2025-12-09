// =============================================================================
// UNO Game - Main Script
// =============================================================================

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const API_BASE_URL = "https://nowaunoweb.azurewebsites.net";

// Player slot IDs matching HTML structure
const PLAYER_POSITIONS = ["player1", "player2", "player3", "player4"];

// Available avatars (Christmas theme)
const AVATARS = [
  "Angel.png", "elf.png", "gingerbread-man.png", "grinch.png",
  "Santa-claus.png", "Snowman.png", "christmas-bell.png", "christmas-tree.png",
  "christmas-wreath.png", "deer-rudolph.png", "gift.png", "jumper.png",
  "nutcracker.png", "reindeer.png", "snowflake.png", "sweater-with-deer.png"
];

// UNO timer duration in milliseconds
const UNO_TIMER_DURATION = 10000;

// -----------------------------------------------------------------------------
// Game State
// -----------------------------------------------------------------------------
let gameId = null;
let gameStarted = false;
let playerNames = [];
let currentPlayer = null;
let topCard = null;
let playerHands = {};
let playerScores = {};
let playerAvatars = {};
let gameDirection = 1; // 1 = clockwise, -1 = counter-clockwise
let gameWinner = null;
let chosenWildColor = null; // Gewählte Farbe bei Wild-Karten (für Anzeige)

// UNO Button State
let unoTimerActive = false;
let unoTimerId = null;
let unoPlayerName = null; // Spieler der UNO rufen muss
let unoButtonPressed = false;
let gameBlocked = false; // True während UNO-Countdown - Spiel pausiert
let pendingNextPlayer = null; // Nächster Spieler während UNO-Countdown

// EASTER EGG State
let snowfallActive = false;

// Audio Elements :)
let christmasSound = null;
let grinchSound = null;

// -----------------------------------------------------------------------------
// DOM Element References (initialized after DOM loads)
// -----------------------------------------------------------------------------
let startBtn, drawBtn, newGameBtn, unoBtn;
let drawPileEl, discardPileEl, colorIndicatorEl, directionEl;

// =============================================================================
// API Functions
// =============================================================================

/**
 * Startet ein neues Spiel auf dem Server
 * @param {string[]} names - Array mit 4 Spielernamen
 * @returns {Promise<Object>} - Server Response mit Id, Players, NextPlayer, TopCard
 */
async function startGameOnServer(names) {
  const response = await fetch(`${API_BASE_URL}/api/Game/Start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(names)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Start failed: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Holt die oberste Karte vom Ablagestapel
 * @returns {Promise<Object>} - CardResponse {Color, Text, Value, Score}
 */
async function getTopCardFromServer() {
  if (!gameId) throw new Error("Keine gameId vorhanden");

  const response = await fetch(`${API_BASE_URL}/api/Game/TopCard/${encodeURIComponent(gameId)}`);

  if (!response.ok) {
    throw new Error(`TopCard failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Holt die Karten eines Spielers vom Server
 * @param {string} playerName - Name des Spielers
 * @returns {Promise<Object>} - PlayerResponse {Player, Cards, Score}
 */
async function getCardsFromServer(playerName) {
  if (!gameId) throw new Error("Keine gameId vorhanden");

  const url = `${API_BASE_URL}/api/Game/GetCards/${encodeURIComponent(gameId)}?playerName=${encodeURIComponent(playerName)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`GetCards failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Zieht eine Karte vom Nachziehstapel
 * @returns {Promise<Object>} - {NextPlayer, Player, Card}
 */
async function drawCardOnServer() {
  if (!gameId) throw new Error("Keine gameId vorhanden");

  const response = await fetch(`${API_BASE_URL}/api/Game/DrawCard/${encodeURIComponent(gameId)}`, {
    method: "PUT"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DrawCard failed: ${response.status} ${text}`);
  }

  return response.json();
}

/**
 * Spielt eine Karte auf dem Server
 * @param {Object} card - Die zu spielende Karte {Color, Value}
 * @param {string|null} wildColor - Gewählte Farbe bei Wild-Karten
 * @returns {Promise<Object>} - PlayerResponse des nächsten Spielers
 */
async function playCardOnServer(card, wildColor = null) {
  if (!gameId) throw new Error("Keine gameId vorhanden");

  const value = encodeURIComponent(card.Value);
  const color = encodeURIComponent(card.Color);
  const wc = wildColor ? encodeURIComponent(wildColor) : "";

  const url = `${API_BASE_URL}/api/Game/PlayCard/${encodeURIComponent(gameId)}?value=${value}&color=${color}&wildColor=${wc}`;

  console.log("=== PlayCard API Call ===");
  console.log("URL:", url);
  console.log("Card:", JSON.stringify(card));
  console.log("WildColor:", wildColor);

  const response = await fetch(url, { method: "PUT" });

  // Versuche Response als Text zu lesen für Debugging
  const responseText = await response.text();
  console.log("Response status:", response.status);
  console.log("Response text:", responseText);

  // Versuche JSON zu parsen
  let body = null;
  try {
    body = JSON.parse(responseText);
    console.log("Response body (parsed):", body);
  } catch (e) {
    console.warn("Response ist kein gültiges JSON:", responseText);
  }

  if (!response.ok) {
    const msg = body?.error || body?.message || responseText || `PlayCard failed: ${response.status}`;
    console.error("PlayCard FAILED:", msg);
    throw new Error(msg);
  }

  console.log("PlayCard SUCCESS!");
  return body;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sicherheitsmaßnahme: Schützt vor XSS-Angriffen
 * Escapes HTML: heißt HTML Zeichen maskieren, nimmt Text & verändert ihn
 * so, dass besondere HTML-Zeichen nicht als Code interpretiert werden können
 * @param {string} text - Der Text der sicher gemacht werden soll / Eingabe für die Funktion
 * @returns {string} - Ausgabe, die wieder benutzt wird und sicher ist
 */
function escapeHtml(text) {
  const div = document.createElement("div"); // erstellt ein unsichtbares HTML-Element
  div.textContent = text; // setzt den Text in das Element.
  return div.innerHTML; // holt den sicheren Text zurück
}

/**
 * Fisher-Yates shuffle Algorythmus - erzeugt eine unverzerrte radomisierte Reihenfolge von Elementen in einem Array
 * @param {Array} array - der Array welcher geshuffelt wird
 * @returns {Array} - und das Endergebnis ;) 
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Prüft ob eine Karte auf die aktuelle TopCard gespielt werden kann
 * Lokale Validierung um unnötige Server-Anfragen zu vermeiden
 * Berücksichtigt gewählte Farben bei Wild-Karten
 * @param {Object} card - Die zu prüfende Karte
 * @param {Object} currentTopCard - Die aktuelle TopCard
 * @param {string} playerName - Name des Spielers (für Draw4 Validierung)
 * @returns {boolean}
 */
function isCardPlayable(card, currentTopCard, playerName = null) {
  if (!card || !currentTopCard) return false;

  const cardColor = card.Color;
  const cardValue = card.Value;
  const topValue = currentTopCard.Value;

  // Bei Wild-Karten (Value 13 oder 14) als TopCard: gewählte Farbe verwenden
  const isTopWild = topValue === 13 || topValue === 14;
  const effectiveTopColor = isTopWild && chosenWildColor ? chosenWildColor : currentTopCard.Color;

  // ChangeColor (Black14) ist immer spielbar
  if (cardColor === "Black" && cardValue === 14) return true;

  // Draw4 (Black13) nur spielbar wenn keine Karte der aktuellen Farbe vorhanden
  if (cardColor === "Black" && cardValue === 13) {
    // Wenn kein Spielername übergeben, erlaube (für Rückwärtskompatibilität)
    if (!playerName) return true;

    const hand = playerHands[playerName] || [];
    // Prüfe ob Spieler Karten der aktuellen Farbe hat (außer andere Black-Karten)
    const hasMatchingColor = hand.some(c => c.Color === effectiveTopColor && c.Color !== "Black");

    if (hasMatchingColor) {
      console.log("Draw4 nicht erlaubt - Spieler hat Karten der Farbe:", effectiveTopColor);
      return false;
    }
    return true;
  }

  // Gleiche Farbe oder gleicher Wert
  return cardColor === effectiveTopColor || cardValue === topValue;
}

/**
 * Erstellt den Pfad zum Kartenbild
 * @param {Object} card - Kartenobjekt {Color, Value}
 * @returns {string} - Bildpfad
 */
function getCardImagePath(card) {
  if (!card) return "images/cards/back0.png";
  return `images/cards/${card.Color}${card.Value}.png`;
}

/**
 * Erstellt den Pfad zum TopCard-Bild unter Berücksichtigung von Wild-Karten
 * Bei Black13 (+4) mit gewählter Farbe → [Color]13.png
 * Bei Black14 (ChangeColor) mit gewählter Farbe → wild_[b/r/v/j].png
 * @param {Object} card - TopCard Objekt
 * @param {string|null} wildColor - Gewählte Farbe bei Wild-Karten
 * @returns {string} - Bildpfad
 */
function getTopCardImagePath(card, wildColor) {
  if (!card) return "images/cards/back0.png";

  const value = card.Value;

  // Black14 (ChangeColor) mit gewählter Farbe → wild_[b/r/v/j].png
  if (value === 14 && wildColor) {
    const wildColorMap = {
      "Red": "wild_r.png",
      "Blue": "wild_b.png",
      "Green": "wild_v.png",
      "Yellow": "wild_j.png"
    };
    if (wildColorMap[wildColor]) {
      return `images/cards/${wildColorMap[wildColor]}`;
    }
  }

  // Black13 (+4) mit gewählter Farbe → [Color]13.png
  if (value === 13 && wildColor) {
    return `images/cards/${wildColor}13.png`;
  }

  // Standard: normale Kartendarstellung
  return `images/cards/${card.Color}${card.Value}.png`;
}

/**
 * Weist jedem Spieler zufällig einen Avatar zu (benutzt den Fisher-Yates shuffle)
 */
function assignAvatars() {
  const shuffled = shuffleArray([...AVATARS]);
  playerNames.forEach((name, idx) => {
    playerAvatars[name] = shuffled[idx % shuffled.length];
  });
}

/**
 * Zeigt eine Toast-Nachricht an
 * @param {string} message - Die anzuzeigende Nachricht
 */
function showToast(message) {
  const messagesEl = document.getElementById("messages");
  if (!messagesEl) return;

  messagesEl.textContent = message;
  messagesEl.style.display = "block";

  setTimeout(() => {
    messagesEl.style.display = "none";
  }, 3000);
}

/**
 * Zeigt eine Benachrichtigung für +2 oder +4 Karten (using toast instead of alert)
 * @param {Object} card - Die gespielte Karte
 */
function showCardEffectAlert(card) {
  if (!card) return;

  const value = card.Value;

  if (value === 10) {
    // +2 Karte
    showToast("+2 Karten für den nächsten Spieler!");
  } else if (value === 13) {
    // +4 Karte
    showToast("+4 Karten für den nächsten Spieler!");
  }
}

// =============================================================================
// UNO Button Logic
// =============================================================================

/**
 * Startet den UNO Timer wenn ein Spieler nur noch 2 Karten hat und eine spielt
 * Blockiert das Spiel während des Countdowns
 * @param {string} playerName - Name des Spielers der UNO rufen muss
 * @param {string} nextPlayer - Der nächste Spieler nach dem UNO-Countdown
 */
function startUnoTimer(playerName, nextPlayer) {
  // Vorherigen Timer abbrechen falls vorhanden
  cancelUnoTimer();

  unoTimerActive = true;
  unoPlayerName = playerName;
  unoButtonPressed = false;
  gameBlocked = true; // Spiel blockieren während UNO-Countdown
  pendingNextPlayer = nextPlayer; // Nächsten Spieler speichern

  console.log(`UNO Timer gestartet für ${playerName} - 20 Sekunden. Spiel blockiert.`);

  // Timer starten - nach 20 Sekunden Strafe
  // Hier wird eine sog. async IIFE genutzt
  unoTimerId = setTimeout(() => {
    // die Funktion wird direkt aufgerufen
    (async () => {
      if (!unoButtonPressed && unoTimerActive) {
        await applyUnoPenalty(playerName); // wartet sicher, bi die Strafe angewendet wurde - danach wird der Timer beendet
      }
      finishUnoTimer();
    })();
  }, UNO_TIMER_DURATION);
}

/**
 * Beendet den UNO Timer und gibt das Spiel frei
 */
function finishUnoTimer() {
  if (unoTimerId) {
    clearTimeout(unoTimerId);
    unoTimerId = null;
  }

  // Spieler wechseln zum gespeicherten nächsten Spieler
  if (pendingNextPlayer) {
    currentPlayer = pendingNextPlayer;
  }

  unoTimerActive = false;
  unoPlayerName = null;
  unoButtonPressed = false;
  gameBlocked = false; // Spiel wieder freigeben
  pendingNextPlayer = null;

  // UI aktualisieren
  renderAllPlayers();
}

/**
 * Bricht den UNO Timer ab (für Spielende etc.)
 */
function cancelUnoTimer() {
  if (unoTimerId) {
    clearTimeout(unoTimerId);
    unoTimerId = null;
  }
  unoTimerActive = false;
  unoPlayerName = null;
  unoButtonPressed = false;
  gameBlocked = false;
  pendingNextPlayer = null;
}

/**
 * Wendet die UNO-Strafe an (2 Karten ziehen)
 * @param {string} playerName - Name des Spielers
 */
async function applyUnoPenalty(playerName) {
  console.log(`UNO Strafe für ${playerName} - hat vergessen UNO zu rufen!`);

  // Strafpunkte-Bild anzeigen
  const penaltyOverlay = document.getElementById("penalty-overlay");
  if (penaltyOverlay) {
    penaltyOverlay.style.display = "flex";
  }

  // Toast instead of blocking alert
  showToast(`${escapeHtml(playerName)} hat vergessen UNO zu rufen! +2 Strafkarten`);

  // 2 Karten ziehen als Strafe
  try {
    // Erste Strafkarte
    await drawCardOnServer();
    // Zweite Strafkarte
    await drawCardOnServer();

    // Spielzustand aktualisieren
    await refreshGameState();
  } catch (err) {
    console.error("Fehler beim Ziehen der Strafkarten:", err);
  }

  // Strafpunkte-Bild nach 5 Sekunden ausblenden
  setTimeout(() => {
    if (penaltyOverlay) {
      penaltyOverlay.style.display = "none";
    }
  }, 5000);
}

/**
 * Prüft ob der Spieler UNO rufen muss (nur noch 2 Karten, spielt eine)
 * @param {string} playerName - Name des Spielers
 * @returns {boolean} - true wenn UNO gerufen werden muss
 */
function checkNeedsUno(playerName) {
  const hand = playerHands[playerName] || [];
  // Spieler hat genau 2 Karten und wird gleich eine spielen -> 1 Karte übrig
  return hand.length === 2;
}

// =============================================================================
// Winner Modal
// =============================================================================

/**
 * Zeigt das Gewinner-Modal mit allen Spielern und Punkten
 * @param {string} winnerName - Name des Gewinners
 */
function showWinnerModal(winnerName) {
  const modal = document.getElementById("winner-modal");
  const titleEl = document.getElementById("winner-title");
  const scoresEl = document.getElementById("winner-scores");

  if (!modal || !titleEl || !scoresEl) return;

  // Titel setzen
  titleEl.textContent = `🎉 ${winnerName} hat gewonnen! 🎉`;

  // Scores-Liste erstellen (sortiert nach Punkten, niedrigste zuerst)
  const sortedPlayers = [...playerNames].sort((a, b) => {
    return (playerScores[a] || 0) - (playerScores[b] || 0);
  });

  let scoresHtml = '<div class="scores-list">';
  sortedPlayers.forEach((name, idx) => {
    const score = playerScores[name] || 0;
    const isWinner = name === winnerName;
    const rank = idx + 1;
    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "  ";
    // Escape player name to prevent XSS attacks
    const safeName = escapeHtml(name);

    scoresHtml += `
      <div class="score-row ${isWinner ? 'winner-row' : ''}">
        <span class="player-name">${medal} ${safeName}</span>
        <span class="player-score">${score} Punkte</span>
      </div>
    `;
  });
  scoresHtml += '</div>';

  scoresEl.innerHTML = scoresHtml;

  // Modal anzeigen
  modal.style.display = "grid";

  // Event Handler für "Neues Spiel" Button
  const newGameBtn = document.getElementById("winner-new-game-btn");
  if (newGameBtn) {
    newGameBtn.onclick = () => {
      window.location.reload();
    };
  }
}

// =============================================================================
// UI Rendering Functions
// =============================================================================

/**
 * Rendert den Nachziehstapel (Kartenrückseite)
 */
function renderDrawPile() {
  if (!drawPileEl) drawPileEl = document.getElementById("draw-pile");
  if (drawPileEl) {
    drawPileEl.style.backgroundImage = "url('images/cards/back0.png')";
  }
}

/**
 * Rendert die TopCard auf dem Ablagestapel
 * Berücksichtigt gewählte Farben bei Wild-Karten
 */
function renderTopCard() {
  if (!discardPileEl) discardPileEl = document.getElementById("discard-pile");
  if (!colorIndicatorEl) colorIndicatorEl = document.getElementById("color-indicator");

  if (!topCard || !discardPileEl) return;

  // Kartenbild setzen - mit Wild-Karten-Logik
  const imagePath = getTopCardImagePath(topCard, chosenWildColor);
  console.log("renderTopCard:", topCard.Color, topCard.Value, "chosenWildColor:", chosenWildColor, "->", imagePath);
  discardPileEl.style.backgroundImage = `url('${imagePath}')`;

  // Animation triggern
  discardPileEl.classList.remove("discard-animate");
  void discardPileEl.offsetWidth; // Force reflow
  discardPileEl.classList.add("discard-animate");

  // Farbindikator aktualisieren
  if (colorIndicatorEl) {
    const colorMap = { Red: "red", Yellow: "yellow", Green: "green", Blue: "blue" };
    colorIndicatorEl.className = "diamond";

    // Bei Wild-Karten (Value 13 oder 14) die gewählte Farbe anzeigen
    const isWildCard = topCard.Value === 13 || topCard.Value === 14;
    const displayColor = isWildCard && chosenWildColor ? chosenWildColor : topCard.Color;

    if (displayColor && colorMap[displayColor]) {
      colorIndicatorEl.classList.add(colorMap[displayColor]);
    }
  }
}

/**
 * Aktualisiert die Spielrichtungs-Anzeige mit Rotation
 */
function updateDirectionIndicator() {
  if (!directionEl) directionEl = document.getElementById("direction");
  if (directionEl) {
    directionEl.textContent = "↻";
    directionEl.title = gameDirection === 1 ? "Im Uhrzeigersinn" : "Gegen den Uhrzeigersinn";
    console.log("updateDirectionIndicator: gameDirection =", gameDirection);

    // Rotation basierend auf Spielrichtung
    if (gameDirection === 1) {
      directionEl.classList.remove("counter-clockwise");
    } else {
      directionEl.classList.add("counter-clockwise");
    }
  }
}

/**
 * Hebt den aktuellen Spieler visuell hervor
 */
function highlightCurrentPlayer() {
  // Alle Spieler-Highlights entfernen
  document.querySelectorAll(".player").forEach(el => {
    el.classList.remove("current-turn", "active");
  });

  // Aktuellen Spieler hervorheben
  if (!currentPlayer) return;

  const idx = playerNames.indexOf(currentPlayer);
  if (idx === -1) return;

  const playerEl = document.getElementById(PLAYER_POSITIONS[idx]);
  if (playerEl) {
    playerEl.classList.add("current-turn", "active");
  }

  // Aktiven Spieler-Namen anzeigen
  const activePlayerEl = document.getElementById("active-player");
  if (activePlayerEl) {
    activePlayerEl.textContent = currentPlayer;
  }
}

/**
 * Rendert die Hand eines Spielers
 * Uses data attributes for event delegation (no individual listeners = no memory leak)
 * @param {string} name - Spielername
 * @param {number} idx - Index des Spielers (0-3)
 */
function renderPlayerHand(name, idx) {
  const playerEl = document.getElementById(PLAYER_POSITIONS[idx]);
  if (!playerEl) return;

  const handContainer = playerEl.querySelector(".hand");
  if (!handContainer) return;

  handContainer.innerHTML = "";
  // Store player name on container for event delegation
  handContainer.dataset.playerName = name;

  const cards = playerHands[name] || [];
  const isActive = currentPlayer === name;

  cards.forEach((card, cardIdx) => {
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    // Store card index for event delegation
    cardEl.dataset.cardIndex = cardIdx;

    if (isActive) {
      // Aktiver Spieler sieht seine Karten
      cardEl.style.backgroundImage = `url('${getCardImagePath(card)}')`;
      cardEl.classList.add("playable");
    } else {
      // Andere Spieler: Kartenrückseite
      cardEl.style.backgroundImage = "url('images/cards/back0.png')";
    }

    handContainer.appendChild(cardEl);
  });
}

/**
 * Rendert einen einzelnen Spieler-Slot (Name, Avatar, Score, Hand)
 * @param {string} name - Spielername
 * @param {number} idx - Index des Spielers (0-3)
 */
function renderPlayerSlot(name, idx) {
  const playerEl = document.getElementById(PLAYER_POSITIONS[idx]);
  if (!playerEl) return;

  // Name setzen
  const nameEl = playerEl.querySelector(".name");
  if (nameEl) nameEl.textContent = name;

  // Score setzen
  const scoreEl = playerEl.querySelector(".score");
  if (scoreEl) scoreEl.textContent = playerScores[name] ?? 0;

  // Avatar setzen
  const avatarEl = playerEl.querySelector(".avatar");
  if (avatarEl && playerAvatars[name]) {
    avatarEl.src = `symbols/${playerAvatars[name]}`;
    avatarEl.alt = name;
  }

  // Hand rendern
  renderPlayerHand(name, idx);

  // Gewinner-Highlight
  if (gameWinner === name) {
    playerEl.classList.add("winner");
  } else {
    playerEl.classList.remove("winner");
  }
}

/**
 * Rendert die gesamte Spieler-UI
 */
function renderAllPlayers() {
  playerNames.forEach((name, idx) => {
    renderPlayerSlot(name, idx);
  });

  highlightCurrentPlayer();
  renderTopCard();
  renderDrawPile();
  updateDirectionIndicator();
}

// =============================================================================
// Game Flow Functions
// =============================================================================

/**
 * Aktualisiert den gesamten Spielzustand vom Server
 */
async function refreshGameState() {
  if (!gameStarted || !gameId) return;

  // Kartenzahlen vorher loggen
  const cardCountsBefore = {};
  playerNames.forEach(name => cardCountsBefore[name] = (playerHands[name] || []).length);

  try {
    // TopCard holen
    topCard = await getTopCardFromServer();

    // Alle Spielerhände und Scores aktualisieren
    for (const name of playerNames) {
      try {
        const playerData = await getCardsFromServer(name);
        playerHands[name] = playerData.Cards || [];
        playerScores[name] = playerData.Score ?? 0;

        // Kartenänderung loggen
        const before = cardCountsBefore[name];
        const after = playerHands[name].length;
        if (before !== after) {
          console.log(`${name}: ${before} -> ${after} Karten (${after - before > 0 ? '+' : ''}${after - before})`);
        }

        // Gewinner prüfen (0 Karten)
        if (playerData.Cards?.length === 0 && !gameWinner) {
          gameWinner = name;
          cancelUnoTimer(); // Timer abbrechen
          showWinnerModal(name);
        }
      } catch (err) {
        console.warn(`GetCards failed for ${name}:`, err);
      }
    }

    renderAllPlayers();
  } catch (err) {
    console.error("refreshGameState failed:", err);
  }
}

/**
 * Zeigt den Farbauswahl-Dialog für Wild-Karten
 * @returns {Promise<string|null>} - Gewählte Farbe oder null
 */
function promptColorChoice() {
  return new Promise(resolve => {
    const modal = document.getElementById("color-picker");
    if (!modal) {
      resolve(null);
      return;
    }

    modal.style.display = "grid";

    function handleClick(e) {
      const btn = e.target;
      if (!btn.matches("button.color")) return;

      const color = btn.getAttribute("data-color");
      modal.style.display = "none";
      modal.removeEventListener("click", handleClick);
      resolve(color);
    }

    modal.addEventListener("click", handleClick);

    // Timeout nach 15 Sekunden
    setTimeout(() => {
      if (modal.style.display !== "none") {
        modal.style.display = "none";
        modal.removeEventListener("click", handleClick);
        resolve(null);
      }
    }, 15000);
  });
}

// =============================================================================
// Event Handlers
// =============================================================================

/**
 * Handler für Klick auf "Spiel starten"
 */
async function onStartGame() {
  // Namen aus Inputs sammeln
  const names = [];
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`p${i}`);
    if (input) {
      const name = input.value.trim();
      if (name) names.push(name);
    }
  }

  // Validierung: Genau 4 Namen
  if (names.length !== 4) {
    showToast("Bitte genau 4 Spielernamen eingeben");
    return;
  }

  // Validierung: Keine leeren Namen
  if (names.some(n => n.length === 0)) {
    showToast("Namen dürfen nicht leer sein");
    return;
  }

  // Validierung: Eindeutige Namen
  if (new Set(names).size !== names.length) {
    showToast("Namen müssen eindeutig sein");
    return;
  }

  try {
    // Spiel auf Server starten
    const response = await startGameOnServer(names);

    // State initialisieren
    gameId = response.Id;
    playerNames = names;
    currentPlayer = names[0]; // Immer Spieler 1 beginnt
    topCard = response.TopCard;
    gameWinner = null;
    gameDirection = 1;
    chosenWildColor = null;

    // Spielerhände und Scores aus Response
    playerHands = {};
    playerScores = {};
    if (Array.isArray(response.Players)) {
      response.Players.forEach(p => {
        playerHands[p.Player] = p.Cards || [];
        playerScores[p.Player] = p.Score ?? 0;
      });
    }

    // Avatare zuweisen
    assignAvatars();

    // UI wechseln
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";

    gameStarted = true;
    renderAllPlayers();

    // Avatar Click-Handler hinzufügen
    attachAvatarClickHandlers();

    console.log("Spiel gestartet:", { gameId, currentPlayer, topCard });
  } catch (err) {
    console.error("Start failed:", err);
    showToast("Fehler beim Starten: " + err.message);
  }
}

/**
 * Handler für Klick auf eine Karte
 * @param {string} playerName - Name des Spielers
 * @param {number} cardIndex - Index der Karte in der Hand
 */
async function onCardClick(playerName, cardIndex) {
  if (!gameStarted || gameWinner) return;

  // Spiel blockiert während UNO-Countdown
  if (gameBlocked) {
    showToast("Warte auf UNO-Ruf!");
    return;
  }

  // Nur der aktive Spieler darf spielen
  if (playerName !== currentPlayer) {
    showToast("Du bist nicht am Zug!");
    return;
  }

  const hand = playerHands[playerName] || [];
  const card = hand[cardIndex];
  if (!card) return;

  // Lokale Validierung (mit Spielername für Draw4-Prüfung)
  if (!isCardPlayable(card, topCard, playerName)) {
    showToast("Diese Karte kann nicht gespielt werden");
    animateInvalidMove(playerName, cardIndex);
    return;
  }

  // Prüfen ob Spieler UNO rufen muss (hat 2 Karten, spielt eine -> 1 übrig)
  const needsUno = checkNeedsUno(playerName);

  try {
    let wildColor = null;

    // Bei Wild-Karten Farbe wählen
    if (card.Color === "Black") {
      const cardType = card.Value === 13 ? "Draw4 (+4)" : "ChangeColor";
      console.log("=== BLACK CARD ===");
      console.log("Kartentyp:", cardType);
      console.log("Card object:", JSON.stringify(card));
      console.log("Aktuelle TopCard:", JSON.stringify(topCard));
      console.log("Aktuelle chosenWildColor:", chosenWildColor);

      wildColor = await promptColorChoice();
      console.log("Spieler wählte Farbe:", wildColor);

      if (!wildColor) {
        showToast("Bitte eine Farbe wählen");
        return;
      }

      if (card.Value === 13) {
        console.log(">>> DRAW4 wird gespielt! Nächster Spieler muss 4 Karten ziehen.");
      }
    }

    // Karte auf Server spielen
    const response = await playCardOnServer(card, wildColor);
    console.log("PlayCard Response:", response);

    // Nächsten Spieler ermitteln
    // Server gibt entweder NextPlayer oder Player zurück
    let nextPlayer = null;
    if (response.NextPlayer) {
      nextPlayer = response.NextPlayer;
    } else if (response.Player) {
      nextPlayer = response.Player;
    }
    console.log("nextPlayer from server:", nextPlayer);

    // Fallback: Wenn Server keinen nächsten Spieler zurückgibt, selbst berechnen
    if (!nextPlayer) {
      console.warn("Server hat keinen nextPlayer zurückgegeben, berechne selbst...");
      const currentIdx = playerNames.indexOf(playerName);
      let nextIdx = (currentIdx + gameDirection + 4) % 4;
      // Bei +2/+4/Skip wird der nächste Spieler übersprungen
      if (card.Value === 10 || card.Value === 11 || card.Value === 13) {
        nextIdx = (nextIdx + gameDirection + 4) % 4;
      }
      nextPlayer = playerNames[nextIdx];
      console.log("Fallback nextPlayer berechnet:", nextPlayer, "von currentIdx:", currentIdx, "direction:", gameDirection);
    }

    // Sicherheitscheck: nextPlayer muss ein gültiger Spielername sein
    if (!nextPlayer || !playerNames.includes(nextPlayer)) {
      console.error("nextPlayer ungültig:", nextPlayer, "- verwende ersten verfügbaren Spieler");
      const currentIdx = playerNames.indexOf(playerName);
      nextPlayer = playerNames[(currentIdx + 1) % 4];
    }

    // Richtungswechsel bei Reverse-Karte (Value 12)
    if (card.Value === 12) {
      console.log("REVERSE! Richtung wechselt von", gameDirection, "zu", gameDirection * -1);
      gameDirection = gameDirection * -1;
    } else {
      console.log("Kein Reverse (Value:", card.Value, ") - Richtung bleibt:", gameDirection);
    }

    // Gewählte Wild-Farbe speichern für TopCard-Anzeige
    if (card.Color === "Black" && wildColor) {
      chosenWildColor = wildColor;
      console.log("chosenWildColor gesetzt auf:", chosenWildColor);
    } else {
      // Bei normalen Karten die gewählte Farbe zurücksetzen
      chosenWildColor = null;
      console.log("chosenWildColor zurückgesetzt auf null");
    }

    console.log("Aktuelle Richtung:", gameDirection, "Karte gespielt:", card.Color, card.Value);

    // Alert für +2 oder +4 anzeigen
    showCardEffectAlert(card);

    // Animation für Strafkarten (+2 oder +4) - Karten fliegen zum bestraften Spieler
    // Der bestrafte Spieler ist der Spieler VOR nextPlayer (da nextPlayer der überspringende ist)
    if (card.Value === 10 || card.Value === 13) {
      const nextPlayerIdx = playerNames.indexOf(nextPlayer);
      // Bestrafter Spieler ist einer zurück von nextPlayer (entgegen Spielrichtung)
      const penaltyPlayerIdx = (nextPlayerIdx - gameDirection + 4) % 4;
      const penaltyCount = card.Value === 10 ? 2 : 4;
      console.log("Penalty animation to player:", playerNames[penaltyPlayerIdx], "idx:", penaltyPlayerIdx);
      await animatePenaltyCards(penaltyPlayerIdx, penaltyCount);
    }

    // UNO Timer starten wenn nötig (Spieler hat jetzt nur noch 1 Karte)
    // Spieler bleibt highlighted, Spiel wird blockiert
    if (needsUno && !gameWinner) {
      // currentPlayer bleibt der gleiche während des UNO-Countdowns
      // refreshGameState wird gerufen während Spieler noch highlighted ist
      await refreshGameState();
      startUnoTimer(playerName, nextPlayer);
    } else {
      // Normaler Spielerwechsel - WICHTIG: currentPlayer ERST setzen, dann refresh
      currentPlayer = nextPlayer;
      console.log("currentPlayer gesetzt auf:", currentPlayer);
      await refreshGameState();
      // renderAllPlayers() wird bereits in refreshGameState() aufgerufen
    }

    // Bei Draw4: Verifiziere dass die Karte entfernt und +4 verteilt wurden
    if (card.Value === 13) {
      console.log("=== DRAW4 VERIFICATION ===");
      console.log("Spieler", playerName, "hat jetzt", (playerHands[playerName] || []).length, "Karten");
      const penaltyPlayer = playerNames[(playerNames.indexOf(nextPlayer) - gameDirection + 4) % 4];
      console.log("Penalty-Spieler", penaltyPlayer, "hat jetzt", (playerHands[penaltyPlayer] || []).length, "Karten");
      console.log("TopCard ist jetzt:", JSON.stringify(topCard));
      console.log("chosenWildColor:", chosenWildColor);
    }

  } catch (err) {
    console.error("Play card failed:", err);
    showToast("Zug ungültig: " + err.message);
    animateInvalidMove(playerName, cardIndex);
  }
}

/**
 * Handler für Klick auf "Karte ziehen"
 */
async function onDrawCard() {
  if (!gameStarted || gameWinner) {
    showToast("Spiel nicht aktiv");
    return;
  }

  // Spiel blockiert während UNO-Countdown
  if (gameBlocked) {
    showToast("Warte auf UNO-Ruf!");
    return;
  }

  try {
    const response = await drawCardOnServer();

    // Nächsten Spieler setzen
    currentPlayer = response.NextPlayer;

    // Spielzustand aktualisieren
    await refreshGameState();

  } catch (err) {
    console.error("Draw card failed:", err);
    showToast("Karte ziehen fehlgeschlagen: " + err.message);
  }
}

/**
 * Handler für Klick auf "UNO" Button
 */
function onUnoClick() {
  if (!gameStarted) return;

  // Glitzer-Animation
  if (unoBtn) {
    unoBtn.classList.add("sparkle");
    setTimeout(() => unoBtn.classList.remove("sparkle"), 600);
  }

  // Wenn UNO Timer aktiv ist, wurde UNO rechtzeitig gerufen
  if (unoTimerActive && unoPlayerName) {
    unoButtonPressed = true;
    const playerWhoCalledUno = unoPlayerName; // Speichern bevor finishUnoTimer() es löscht
    showToast(`${playerWhoCalledUno} ruft UNO!`);
    console.log(`${playerWhoCalledUno} hat rechtzeitig UNO gerufen!`);
    finishUnoTimer(); // Gibt Spiel frei und wechselt zum nächsten Spieler
  } else {
    showToast("UNO!");
  }
}

/**
 * Handler für Klick auf "Neues Spiel"
 */
function onNewGame() {
  window.location.reload();
}

/**
 * Animiert einen ungültigen Spielzug
 * @param {string} playerName - Name des Spielers
 * @param {number} cardIndex - Index der Karte
 */
function animateInvalidMove(playerName, cardIndex) {
  const idx = playerNames.indexOf(playerName);
  if (idx === -1) return;

  const playerEl = document.getElementById(PLAYER_POSITIONS[idx]);
  if (!playerEl) return;

  const cardEl = playerEl.querySelector(`.hand .card:nth-child(${cardIndex + 1})`);
  if (cardEl) {
    cardEl.classList.add("invalid");
    setTimeout(() => cardEl.classList.remove("invalid"), 400);
  }
}

// =============================================================================
// Easter Eggs 
// =============================================================================

/**
 * Spielt einen Sound ab wenn auf einen Avatar geklickt wird
 * Grinch-Avatar spielt einen anderen Sound als alle anderen
 * @param {string} avatarFileName - Name der Avatar-Bilddatei
 */
function playAvatarSound(avatarFileName) {
  // Prüfe ob es der Grinch-Avatar ist (case insensitive)
  const isGrinch = avatarFileName && avatarFileName.toLowerCase().includes("grinch");

  if (isGrinch) {
    // Grinch-Sound abspielen
    if (!grinchSound) {
      grinchSound = new Audio("sounds/330383__ready-to-rumble-grinch.mp3");
    }
    grinchSound.currentTime = 0;
    grinchSound.play().catch(err => console.log("Sound play failed:", err));
  } else {
    // Christmas-Sound abspielen
    if (!christmasSound) {
      christmasSound = new Audio("sounds/536245___merry-christmas.mp3");
    }
    christmasSound.currentTime = 0;
    christmasSound.play().catch(err => console.log("Sound play failed:", err));
  }
}

/**
 * Fügt Click-Handler zu allen Avataren hinzu
 */
function attachAvatarClickHandlers() {
  document.querySelectorAll(".player .avatar").forEach(avatarEl => {
    avatarEl.style.cursor = "pointer";
    avatarEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const src = avatarEl.src || "";
      // Extrahiere den Dateinamen aus dem Pfad
      const fileName = src.split("/").pop();
      playAvatarSound(fileName);
    });
  });
}

/**
 * Erstellt Schneeflocken für den Schneefall-Effekt
 * @param {number} count - Anzahl der Schneeflocken
 */
function createSnowflakes(count) {
  const container = document.getElementById("snowfall-container");
  if (!container) return;

  const snowflakeChars = ["❄", "❅", "❆", "✻", "✼"];

  for (let i = 0; i < count; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake";
    flake.style.left = Math.random() * 100 + "%";
    flake.style.animationDuration = (Math.random() * 3 + 2) + "s";
    flake.style.animationDelay = Math.random() * 3 + "s";
    flake.style.fontSize = (Math.random() * 1 + 0.8) + "em";
    flake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
    container.appendChild(flake);
  }
}

/**
 * Toggelt den Schneefall-Effekt (Easter Egg)
 */
function toggleSnowfall() {
  const container = document.getElementById("snowfall-container");
  if (!container) return;

  if (snowfallActive) {
    // Schneefall stoppen
    container.innerHTML = "";
    container.style.display = "none";
    snowfallActive = false;
    console.log("Schneefall gestoppt");
  } else {
    // Schneefall starten
    container.style.display = "block";
    createSnowflakes(50);
    snowfallActive = true;
    console.log("Schneefall gestartet");
  }
}

// =============================================================================
// Card Dealing Animation
// =============================================================================

/**
 * Animiert eine fliegende Karte vom Nachziehstapel zu einem Spieler
 * @param {number} playerIdx - Index des Spielers (0-3)
 * @param {number} delay - Verzögerung in ms vor der Animation
 * @returns {Promise} - Wird aufgelöst wenn Animation fertig
 */
function animateCardDeal(playerIdx, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Nachziehstapel-Position ermitteln
      const drawPile = document.getElementById("draw-pile");
      if (!drawPile) {
        resolve();
        return;
      }
      const drawRect = drawPile.getBoundingClientRect();

      // Spieler-Hand-Position ermitteln
      const playerEl = document.getElementById(PLAYER_POSITIONS[playerIdx]);
      if (!playerEl) {
        resolve();
        return;
      }
      const handEl = playerEl.querySelector(".hand");
      if (!handEl) {
        resolve();
        return;
      }
      const handRect = handEl.getBoundingClientRect();

      // Fliegende Karte erstellen
      const flyingCard = document.createElement("div");
      flyingCard.className = "flying-card";
      flyingCard.style.left = drawRect.left + "px";
      flyingCard.style.top = drawRect.top + "px";
      document.body.appendChild(flyingCard);

      // Animation starten (nach kurzem Delay für Reflow)
      requestAnimationFrame(() => {
        // Zielposition berechnen (Mitte der Hand)
        const targetX = handRect.left + handRect.width / 2 - 30; // 30 = halbe Kartenbreite
        const targetY = handRect.top + handRect.height / 2 - 45; // 45 = halbe Kartenhöhe

        flyingCard.style.transform = `translate(${targetX - drawRect.left}px, ${targetY - drawRect.top}px) rotate(${(Math.random() - 0.5) * 20}deg)`;
      });

      // Nach Animation entfernen
      setTimeout(() => {
        flyingCard.remove();
        resolve();
      }, 400); // Animation dauert 350ms + Puffer

    }, delay);
  });
}

/**
 * Animiert Strafkarten die zum nächsten Spieler fliegen (+2 oder +4)
 * @param {number} targetPlayerIdx - Index des Spielers der die Karten bekommt
 * @param {number} cardCount - Anzahl der Strafkarten (2 oder 4)
 */
async function animatePenaltyCards(targetPlayerIdx, cardCount) {
  const delayBetweenCards = 150; // ms zwischen Karten

  for (let i = 0; i < cardCount; i++) {
    await animateCardDeal(targetPlayerIdx, delayBetweenCards);
  }
}

// =============================================================================
// Initialization
// =============================================================================

/**
 * Sets up event delegation for card clicks (prevents memory leaks)
 * Called once during initialization - no need to re-attach listeners
 */
function setupCardEventDelegation() {
  // Use event delegation on the board element for all card clicks
  const boardEl = document.getElementById("board");
  if (!boardEl) return;

  boardEl.addEventListener("click", (e) => {
    // Find the clicked card element
    const cardEl = e.target.closest(".card.playable");
    if (!cardEl) return;

    // Get the hand container to find player name
    const handContainer = cardEl.closest(".hand");
    if (!handContainer) return;

    const playerName = handContainer.dataset.playerName;
    const cardIndex = parseInt(cardEl.dataset.cardIndex, 10);

    if (playerName && !isNaN(cardIndex)) {
      onCardClick(playerName, cardIndex);
    }
  });
}

/**
 * Initialisiert die Event-Handler und UI-Referenzen
 */
function initializeApp() {
  // DOM-Referenzen
  startBtn = document.getElementById("start-btn");
  drawBtn = document.getElementById("draw-btn");
  newGameBtn = document.getElementById("new-game-btn");
  unoBtn = document.getElementById("uno-btn");
  drawPileEl = document.getElementById("draw-pile");
  discardPileEl = document.getElementById("discard-pile");
  colorIndicatorEl = document.getElementById("color-indicator");
  directionEl = document.getElementById("direction");

  const rulesBtn = document.getElementById("rules-btn");
  if (rulesBtn) {
    rulesBtn.addEventListener("click", (e) => {
      console.log("Regeln geöffnet");
    })
  }

  // Event-Handler registrieren
  if (startBtn) startBtn.addEventListener("click", onStartGame);
  if (drawBtn) drawBtn.addEventListener("click", onDrawCard);
  if (drawPileEl) drawPileEl.addEventListener("click", onDrawCard);
  if (newGameBtn) newGameBtn.addEventListener("click", onNewGame);
  if (unoBtn) unoBtn.addEventListener("click", onUnoClick);

  // Set up event delegation for card clicks (memory leak fix)
  setupCardEventDelegation();

  // Easter Egg: Schneefall bei Klick auf Turn-Info
  const turnInfoEl = document.getElementById("turn-info");
  if (turnInfoEl) turnInfoEl.addEventListener("click", toggleSnowfall);

  // Platzhalter-UI initialisieren
  initPlaceholderUI();

  console.log("UNO App initialized");
}

/**
 * Initialisiert die Platzhalter-UI vor Spielstart
 */
function initPlaceholderUI() {
  // Platzhalter für Spieler-Slots
  PLAYER_POSITIONS.forEach((posId, idx) => {
    const playerEl = document.getElementById(posId);
    if (!playerEl) return;

    const nameEl = playerEl.querySelector(".name");
    if (nameEl) nameEl.textContent = `Spieler ${idx + 1}`;

    const handContainer = playerEl.querySelector(".hand");
    if (handContainer) {
      handContainer.innerHTML = "";
      // 7 Karten als Platzhalter
      for (let k = 0; k < 7; k++) {
        const cardEl = document.createElement("div");
        cardEl.className = "card";
        cardEl.style.backgroundImage = "url('images/cards/back0.png')";
        handContainer.appendChild(cardEl);
      }
    }
  });

  // Nachziehstapel
  renderDrawPile();
}

// App starten wenn DOM geladen
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
