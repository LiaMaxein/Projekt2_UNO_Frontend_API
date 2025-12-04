# UNO Browser Game

A multiplayer UNO card game built as a browser application with a Christmas theme.

## Features

- **4-player gameplay** with backend API integration
- **Christmas-themed avatars** (Santa, Grinch, Snowman, etc.)
- **Sound effects** - Click avatars for holiday sounds
- **Flying card animations** for +2/+4 penalty cards
- **UNO button** with 20-second timer and penalty system
- **Wild card color picker** modal
- **Responsive design** - Works on desktop, tablet, and mobile
- **Snowfall Easter egg** - Click the turn indicator

## Getting Started

### Prerequisites

No build tools required - this is a vanilla HTML/CSS/JavaScript application.

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/LiaMaxein/UNO-UX.git
   cd UNO-UX
   ```

2. Open `index.html` in a web browser, or use a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve
   ```

3. Open `http://localhost:8000` in your browser

### How to Play

1. Enter 4 player names on the start screen
2. Click "Spiel starten" (Start Game)
3. The active player's cards are face-up
4. Click a card to play it (if valid)
5. Click the draw pile or "Karte ziehen" button to draw
6. When you have 1 card left, press the UNO button within 20 seconds!

## Project Structure

```
UNO-UX/
├── index.html           # Main HTML file
├── styles/
│   └── style.css        # All styling (with CSS variables & responsive)
├── scripts/
│   └── script.js        # Game logic and API integration
├── images/
│   └── cards/           # Card images (e.g., Red5.png, Blue10.png)
├── symbols/             # Avatar images (Christmas theme)
├── sounds/              # Audio files for Easter eggs
├── anforderungen/       # Requirements documentation (German)
└── Claude.md            # Development guidelines
```

## API Backend

The game connects to: `https://nowaunoweb.azurewebsites.net`

### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/Game/Start` | Start new game |
| GET | `/api/Game/TopCard/{id}` | Get top discard card |
| PUT | `/api/Game/DrawCard/{id}` | Draw a card |
| PUT | `/api/Game/PlayCard/{id}?...` | Play a card |
| GET | `/api/Game/GetCards/{id}?playerName=...` | Get player's hand |

## Card Values

| Value | Card Type | Effect |
|-------|-----------|--------|
| 0-9 | Number | None |
| 10 | Draw Two (+2) | Next player draws 2, loses turn |
| 11 | Skip | Next player loses turn |
| 12 | Reverse | Direction changes |
| 13 | Draw Four (+4) | Next player draws 4, choose color |
| 14 | Wild | Choose color |

## Accessibility

- ARIA labels for screen readers
- Keyboard navigable
- High contrast colors
- Responsive touch targets

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - See LICENSE file for details

## Credits

- Christmas avatar icons
- Sound effects from freesound.org
- UNO rules: [uno-kartenspiel.de](https://www.uno-kartenspiel.de/spielregeln/)
