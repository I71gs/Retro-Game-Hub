# 🕹️ RETRO GAME HUB

> *Notebook classics, digitally reborn.*

A browser-based retro gaming platform built entirely with **HTML, CSS, and Vanilla JavaScript**.  
No frameworks. No libraries. No ads. Installable, locally persistent, and playable without interruptions.

---

## 📋 Table of Contents

1. [What is Retro Game Hub?](#what-is-retro-game-hub)
2. [Latest Fixes](#latest-fixes)
3. [Folder Structure](#folder-structure)
4. [How to Run](#how-to-run)
5. [Games](#games)
6. [Player System](#player-system)
7. [Coin & Reward System](#coin--reward-system)
8. [Display Themes](#display-themes)
9. [Sound & Music System](#sound--music-system)
10. [Settings](#settings)
11. [Architecture Overview](#architecture-overview)
12. [Module Reference](#module-reference)
13. [How to Add a New Game](#how-to-add-a-new-game)
14. [How to Add a Music Track](#how-to-add-a-music-track)
15. [Future Roadmap](#future-roadmap)
16. [Team](#team)

---

## What is Retro Game Hub?

Retro Game Hub brings back the classic games that once lived on the back pages of school notebooks — Tic-Tac-Toe, Dots & Boxes, Snakes & Ladders — and gives them a modern digital home with:

- **AI opponents** powered by Minimax, Alpha-Beta pruning, and heuristic strategies
- **Player profiles** with PIN authentication and persistent coin tracking
- **Leaderboards** — global and per-game
- **7 background music tracks** and **10 sound effects** — all synthesised in real time, zero audio files
- **4 retro display themes** — Default CRT, Notebook, Game Boy, Neon
- **Fully responsive** — works on any screen from 360px mobile to 1440px desktop
- **Offline capable** — works without internet after first load

## Latest Fixes

- Removed the old `Mastermind` game from the project and menu.
- Fixed `Tetris` and `Pong` reward handling so coins are properly added to `PlayerDB`.
- Corrected game-over modal handling for all games by unifying `UI.showWinModal()` behavior.
- Ensured `Tetris` does not create duplicate keyboard listeners and resets cleanly on restart.
- Fixed `Pong` startup logic to avoid recursive initialization and added a proper defeat modal.
- Updated HUD refresh after coins change, so home screen displays current balance immediately.
- Corrected draw/loss messaging so `NO COINS AWARDED` is shown instead of the guest-mode message when a logged-in player finishes a game without reward.

> For the full PBL report, see [PBL_Report.md](PBL_Report.md).

---

## Folder Structure

```
retro-game-hub/
│
├── index.html                  ← Main app shell — all 6 screens in one file
│
├── css/
│   └── main.css                ← All styles, themes, animations, CRT effects
│
├── js/
│   ├── sound.js                ← Web Audio sound engine + 7 music tracks
│   ├── player.js               ← Player database (LocalStorage)
│   ├── ui.js                   ← Screen manager, modals, HUD, music indicator
│   └── main.js                 ← App controller, boot sequence, routing
│
├── games/
│   ├── tictactoe.js            ← Tic-Tac-Toe + Minimax AI
│   ├── dots.js                 ← Dots & Boxes + heuristic AI
│   ├── snl.js                  ← Snakes & Ladders + dice engine
│   ├── battleship.js           ← Battleship + Hunt/Target AI
│   ├── connectfour.js          ← Connect Four + Alpha-Beta Minimax AI
│   ├── hangman.js              ← Hangman + hint system
│   ├── memorymatch.js          ← Memory Match + card flipping
│   ├── tetris.js               ← Tetris + line clearing
│   └── pong.js                 ← Pong + paddle battle
│
└── README.md                   ← This file
```

**Total: 13 files. ~4,200 lines of code.**

---

## How to Run

### On Desktop / Laptop
```
1. Install Node.js if you do not already have it.
2. Open a terminal in the retro-game-hub folder.
3. Run `npm install`.
4. Start the app with `npm start`.
5. Open `http://localhost:3000` in your browser.
```

### Online Multiplayer
Online play requires the same server process. This release supports multiplayer across the built-in games.
```
1. Install Node.js if you do not already have it.
2. Open a terminal in the retro-game-hub folder.
3. Run `npm install`.
4. Start the server with `npm start`.
5. Open `http://localhost:3000` in your browser.
6. Click the `🌐 ONLINE` button, then host or join a room.
```

### Docker Deployment
Build and run the app in a container:
```
docker build -t retro-game-hub .
docker run -p 3000:3000 retro-game-hub
```
Then open `http://localhost:3000`.

### Cloud Deployment
This app can run on platforms that support Node.js or Docker.
- For Heroku: deploy the repository and use `Procfile` with `web: npm start`.
- For Render / Fly.io / Railway: deploy the repo and use the existing `package.json` start script.
- For HTTPS/WSS production, host the app behind a TLS-enabled frontend or proxy.

### On Android (as an App)
```
1. Host the folder on GitHub Pages, Netlify, or Vercel (all free)
2. Open the link in Chrome on your Android device
3. Tap the browser menu → "Add to Home Screen"
4. The app installs to your home screen like a native app
```

### Browser Support
| Browser | Support |
|---|---|
| Chrome 100+ | ✅ Full |
| Firefox 100+ | ✅ Full |
| Samsung Internet 20+ | ✅ Full |
| Safari 15+ | ✅ Full (audio starts on first tap) |
| Edge 100+ | ✅ Full |

---

## Games

### ✅ Playable Now

| Game | Grid | AI Type | Coin Reward | Players |
|---|---|---|---|---|
| Tic-Tac-Toe | 3×3 | Minimax (unbeatable) | +10 | 2 |
| Dots & Boxes | 4×4 | Heuristic (beatable) | +15 | 2 |
| Snakes & Ladders | 10×10 (100 sq) | Auto-dice | +20 | 2–4 |
| Battleship | 10×10 (each) | Hunt & Target | +25 | 2 |
| Connect Four | 6×7 | Alpha-Beta depth 5 | +12 | 2 |
| Hangman | Word puzzle | Hint system | +14 | 1 |
| Memory Match | 4×4 (8 pairs) | Card matching | +16 | 1 |
| Tetris | 10×20 | Stack & clear | +20 | 1 |
| Pong | 600×400 | Paddle battle | +12 | 2 |

### Game Details

**Tic-Tac-Toe**
- Classic 3×3 grid, X vs O
- AI uses full Minimax — evaluates all 362,880 possible states
- Unbeatable: best human result is a draw
- Win cells animate with a glowing pulse on victory

**Dots & Boxes**
- 4×4 grid: 25 dots, 48 lines, 16 boxes
- Claim a box by completing all 4 sides — earn an extra turn
- AI uses 3-tier strategy: capture → safe move → random
- Board rendered entirely in SVG for crisp display at all sizes

**Snakes & Ladders**
- Full 100-square board with boustrophedon (snake-pattern) numbering
- 6 snakes and 8 ladders at historically standard positions
- Animated dice roll with cycling face animation and sound
- Supports 2–4 players; AI auto-rolls for computer turns

**Battleship**
- Two-phase game: ship placement then combat
- 5 ships: Carrier (5), Battleship (4), Cruiser (3), Submarine (3), Destroyer (2)
- Auto-place option available during setup
- AI Hunt mode: random search → Target mode: systematic destruction on hit

**Connect Four**
- 6-row, 7-column board with animated disc drop
- AI uses Minimax with Alpha-Beta pruning at depth 5
- Heuristic scoring rewards centre column control
- Score carries across rounds within a session

**Hangman**
- Word-guessing game with 18+ words across 10 categories  
- 2 hint types: reveal random letter or reveal all vowels
- Visual gallow with progressive stick figure drawing
- Category shown to help deduction

**Memory Match**
- 8 pairs of emoji cards (16 total) in 4×4 grid
- Flip two cards per turn, find matching pairs
- Matched pairs stay face-up and glow
- Complete the board to win

**Tetris**
- Classic 10×20 grid with 7 tetromino shapes (I, O, T, S, Z, J, L)
- Arrow keys: move left/right, rotate, soft drop
- Spacebar for hard drop (instant placement)
- Clear lines to score, speed increases every 5 levels
- Next piece preview, score, level, and lines display

**Pong**
- Original 1972 arcade classic
- Mouse or touch control for paddle movement
- First to 7 points wins
- Ball speeds up on paddle hit, angle varies by hit position
- AI opponent with smooth tracking

---

## Player System

### Creating a Profile
- **Player ID:** 3–16 characters, letters/numbers/underscore/hyphen only
- **PIN:** 4 digits, hashed before storage — never stored in plain text
- **Avatar:** Choose from 24 emoji avatars
- All data stored in browser LocalStorage — nothing sent to any server

### Guest Mode
- Play without creating an account
- No coins awarded, no leaderboard entry
- Full game access

### Leaderboard
- Top 20 players globally by total coins
- Per-game tabs: Dots, Tic-Tac-Toe, Snakes, and more
- 5 demo players pre-seeded on first load so the board is never empty

### Deleting Your Account
- Settings → Danger Zone → Delete My Account
- All data removed from LocalStorage permanently

---

## Coin & Reward System

| Action | Coins Earned |
|---|---|
| Win Tic-Tac-Toe | +10 |
| Win Connect Four | +12 |
| Win Pong | +12 |
| Win Hangman | +14 |
| Win Dots & Boxes | +15 |
| Win Memory Match | +16 |
| Win Tetris | +20 |
| Win Snakes & Ladders | +20 |
| Win Battleship | +25 |
| Play any game (win or lose) | +2 |
| 3-win streak bonus | +5 |

> **Note:** Guest players do not earn coins. Coins have no real-world value.

---

## Display Themes

Switch themes any time in **Settings → Display Theme**.

| Theme | Description | Best For |
|---|---|---|
| **Default** | Dark background, green CRT glow, scanlines, vignette | Night use, immersive feel |
| **Notebook** | Ruled paper background, blue ink accents | Nostalgia, daytime use |
| **Game Boy** | 4-colour green LCD palette, pixelated rendering | Maximum retro authenticity |
| **Neon** | Pure black, magenta/cyan glow effects | Dark rooms, vivid contrast |

All themes use CSS variables — switching is instant with no page reload.

---

## Sound & Music System

All audio is **procedurally synthesised** using the Web Audio API.  
**Zero audio files. Zero kilobytes of sound assets.**

### Sound Effects

| Sound | Trigger |
|---|---|
| `click` | Any button press |
| `move` | Placing a mark in any game |
| `place` | Drawing a line in Dots & Boxes |
| `capture` | Claiming a box in Dots & Boxes |
| `roll` | Dice roll in Snakes & Ladders |
| `ladder` | Landing on a ladder |
| `snake` | Landing on a snake |
| `win` | Victory fanfare |
| `draw` | Draw result |
| `coin` | Coin reward awarded |
| `error` | Login failure or invalid move |
| `select` | Screen navigation |

### Background Music Tracks

| Screen | Track | Key | BPM | Feel |
|---|---|---|---|---|
| Login / Register | `login` | C major | 88 | Gentle, ambient, welcoming |
| Home / Leaderboard / Settings | `home` | C major | 152 | Upbeat, bouncy, arcade lobby |
| Tic-Tac-Toe | `ttt` | A minor | 130 | Tense, focused, competitive |
| Dots & Boxes | `dots` | F major | 140 | Funky, playful, strategic |
| Snakes & Ladders | `snl` | G major | 122 | Cheerful, adventurous, lucky |

Each track uses three synthesised voices:
- **Square wave** — melody lead (classic 8-bit chip sound)
- **Triangle wave** — bass line (warm low end)
- **Sine wave** — harmony chords (smooth background)

Music fades in over 1.5 seconds when entering a screen and crossfades when switching.

### Enabling Music
Music is **off by default**.  
Enable it in **Settings → Sound → Music toggle**.  
The setting persists across sessions.

### Safari Note
Safari requires a user gesture before audio can play. The engine initialises on the user's first tap — after that, all sound works normally.

---

## Settings

All settings persist in LocalStorage across sessions.

| Setting | Options | Default |
|---|---|---|
| Display Theme | Default / Notebook / Game Boy / Neon | Default |
| Scanlines | On / Off | On |
| CRT Vignette | On / Off | On |
| Pixel Font | On / Off | On |
| Sound Effects | On / Off | On |
| Music | On / Off | **Off** |

---

## Architecture Overview

Retro Game Hub is a **Single Page Application (SPA)**.

All 6 screens exist in `index.html` simultaneously. Only one screen is visible at a time, controlled by a lightweight CSS class toggler in `ui.js`. There are no page reloads, no server requests during gameplay, and no routing library.

```
Boot Screen
    └── Player Screen (login / register)
            └── Home Screen (game selection)
                    ├── Game Screen (active game)
                    ├── Leaderboard Screen
                    └── Settings Screen
```

**Data Flow:**
```
Boot → Auth Check → Home
         ↓
    Pick a Game → Game Screen → Win Modal → Home
                                    ↓
                              Coins Awarded → LocalStorage Updated → HUD Refreshed
```

**Pattern:** MVC-inspired
- `player.js` = Model (all data)
- `ui.js` = View (all rendering)
- `main.js` = Controller (all events and flow)

---

## Module Reference

### `js/sound.js`
Web Audio API synthesis engine.

```javascript
Sound.play('click')          // Play a sound effect
Sound.playMusic('home')      // Start a music track (fades in)
Sound.stopMusic()            // Stop music (fades out)
Sound.setEnabled(true)       // Toggle sound effects
Sound.setMusicEnabled(true)  // Toggle music
Sound.isMusicEnabled()       // Returns boolean
Sound.getCurrentTrack()      // Returns current track name or null
```

Available sound names: `click`, `move`, `place`, `capture`, `roll`, `ladder`, `snake`, `win`, `draw`, `coin`, `error`, `select`, `boot`

Available music tracks: `home`, `login`, `ttt`, `dots`, `snl`

---

### `js/player.js`
LocalStorage player database.

```javascript
PlayerDB.createPlayer(id, pin, avatar)  // Returns { ok, player } or { ok, msg }
PlayerDB.loginPlayer(id, pin)           // Returns { ok, player } or { ok, msg }
PlayerDB.getCurrentPlayer()             // Returns current session player or null
PlayerDB.guestPlayer()                  // Create guest session
PlayerDB.logout()                       // Clear session
PlayerDB.awardCoins(amount, gameKey)    // Award coins + record win
PlayerDB.recordGame(gameKey, won)       // Record game played (no coins)
PlayerDB.getLeaderboard(gameKey)        // Returns sorted array of top 20
PlayerDB.deletePlayer(id)              // Permanently delete account
PlayerDB.getSettings()                  // Returns settings object
PlayerDB.saveSetting(key, value)        // Save one setting
PlayerDB.getAvatars()                   // Returns array of avatar emojis
```

**Game keys:** `ttt`, `dots`, `snl`, `bs`, `c4` (add new ones when adding games)

---

### `js/ui.js`
Screen manager and HUD controller.

```javascript
UI.showScreen('home')                    // Navigate to a screen
UI.showModal('winModal')                 // Show a modal overlay
UI.hideModal('winModal')                 // Hide a modal overlay
UI.showWinModal({ title, subtitle, coins, onPlayAgain, onHome })
UI.updateHUD()                           // Refresh avatar, name, coins
UI.setGameTitle('TIC-TAC-TOE')          // Update game screen header
UI.setGameScores(p1, s1, p2, s2)        // Update score chips
UI.updateMusicIndicator('home')         // Show/hide music bar indicator
UI.renderLeaderboard('all')             // Render leaderboard for a game key
UI.buildAvatarGrid()                    // Render avatar picker
UI.applySettings()                      // Apply all saved settings
UI.initSettings()                       // Wire settings toggles
UI.showConfirm(title, msg, onYes)       // Show confirmation dialog
```

**Screen IDs:** `boot`, `player`, `home`, `game`, `leaderboard`, `settings`

---

### `js/main.js`
App controller and boot sequence.

Handles: boot animation, player screen events, game card clicks, game launch, restart, win modal buttons, leaderboard tabs, back buttons, settings page, global click sounds, demo data seeding.

**Key internal function:**
```javascript
launchGame(gameId, vsAI)
// gameId: 'ttt' | 'dots' | 'snl' | 'bs' | 'c4' | your new game key
// vsAI: true | false
```

---

## How to Add a New Game

Adding a new game takes **4 steps** and touches only **4 files**.  
No existing code needs to be modified beyond a single line in each file.

---

### Step 1 — Create `games/yourgame.js`

Use this exact structure:

```javascript
const YourGame = (() => {
  // ── State ────────────────────────────────────────────
  let vsAI   = false;
  let p1name = 'PLAYER 1';
  let p2name = 'PLAYER 2';
  let gameOver = false;
  let scores = { p1: 0, p2: 0 };

  // ── Render ───────────────────────────────────────────
  function render() {
    const area = document.getElementById('gameArea');
    area.innerHTML = `
      <!-- Your game HTML here -->
    `;
    UI.setGameScores(p1name, scores.p1, p2name, scores.p2);
    attachEvents();
  }

  function attachEvents() {
    // Attach click listeners to game elements
  }

  // ── Win / End ─────────────────────────────────────────
  function endGame(playerWon) {
    gameOver = true;
    let coinsAwarded = null;
    const player = PlayerDB.getCurrentPlayer();

    if (playerWon && player && player.id !== 'GUEST') {
      PlayerDB.awardCoins(15, 'mygame');   // ← your coin amount + game key
      coinsAwarded = 15;
      UI.updateHUD();
    }
    PlayerDB.recordGame('mygame', playerWon);

    setTimeout(() => {
      UI.showWinModal({
        title:    playerWon ? 'YOU WIN!' : 'GAME OVER',
        subtitle: playerWon ? 'Great play!' : 'Better luck next time!',
        coins:    coinsAwarded,
        onPlayAgain: restart,
        onHome: () => UI.showScreen('home'),
      });
    }, 500);
  }

  // ── Restart ───────────────────────────────────────────
  function restart() {
    gameOver = false;
    // reset all state
    render();
  }

  // ── Init ─────────────────────────────────────────────
  function init(p1, p2, ai) {
    vsAI   = ai;
    p1name = p1 || 'PLAYER 1';
    p2name = ai ? 'COMPUTER' : (p2 || 'PLAYER 2');
    scores = { p1: 0, p2: 0 };
    restart();
    UI.setGameTitle('MY GAME NAME');
    document.getElementById('btnGameMode').textContent = vsAI ? '👥 VS HUMAN' : '🤖 VS AI';
    document.getElementById('btnGameMode').style.display = '';
  }

  return { init, restart };
})();

window.YourGame = YourGame;
```

---

### Step 2 — Add a game card to `index.html`

Inside the `.game-grid` div, before the closing `</div>`:

```html
<div class="game-card" data-game="mygame" data-coins="15">
  <div class="game-card-art">
    <!-- Preview art: emoji, CSS shapes, SVG, etc. -->
    <div class="soon-art">🎯</div>
  </div>
  <div class="game-card-info">
    <div class="game-name">MY GAME</div>
    <div class="game-desc">Short one-line description</div>
    <div class="game-reward">🪙 +15 per win</div>
  </div>
  <button class="play-btn">PLAY</button>
</div>
```

---

### Step 3 — Add a `<script>` tag to `index.html`

In the SCRIPTS section at the bottom, before `<script src="js/main.js">`:

```html
<script src="games/yourgame.js"></script>
```

---

### Step 4 — Register in `js/main.js`

In the `launchGame` function, add your game to the switch statement:

```javascript
case 'mygame':
  YourGame.init(p1, 'PLAYER 2', vsAI);
  break;
```

And add it to the restart switch:

```javascript
case 'mygame': YourGame.restart(); break;
```

And optionally assign it a music track:

```javascript
const GAME_TRACKS = { ttt:'ttt', dots:'dots', snl:'snl', bs:'ttt', c4:'dots', mygame:'home' };
```

---

### Step 5 — Register in `js/player.js` *(optional but recommended)*

So wins and game plays are tracked per game in the database:

```javascript
// In createPlayer(), update both objects:
wins:  { total:0, dots:0, ttt:0, snl:0, bs:0, c4:0, mygame:0 },
games: { total:0, dots:0, ttt:0, snl:0, bs:0, c4:0, mygame:0 },
```

That's it. **Your game is fully integrated.**

---

## How to Add a Music Track

### Step 1 — Add the track definition to `js/sound.js`

Inside the `TRACKS` object, add your track:

```javascript
mygame: {
  bpm: 130,
  melody: [
    N.C5, N.E5, N.G5, N._, ...   // 32 notes, loops
  ],
  bass: [
    N.C3, N._, N.G3, N._, ...    // same length as melody
  ],
  harmony: [                      // set to null to skip
    N.E4, N._, N.G4, N._, ...
  ],
},
```

**Note frequency reference (all in Hz):**
```
C3=130.8  D3=146.8  E3=164.8  F3=174.6  G3=196.0  A3=220.0  B3=246.9
C4=261.6  D4=293.7  E4=329.6  F4=349.2  G4=392.0  A4=440.0  B4=493.9
C5=523.3  D5=587.3  E5=659.3  F5=698.5  G5=784.0  A5=880.0  B5=987.8
_=0  (rest / silence)
```

### Step 2 — Map the track to your game in `js/main.js`

```javascript
const GAME_TRACKS = { ..., mygame: 'mygame' };
```

### Step 3 — Map the track name for the HUD indicator in `js/ui.js`

```javascript
const labelMap = {
  home:'HOME', login:'MENU', ttt:'X vs O', dots:'DOTS', snl:'ROLL!',
  mygame: 'PLAY!',   // ← add this
};
```

---

## Future Roadmap

### Phase 2 — Multiplayer & More Games
- [ ] WebSocket online multiplayer with 6-character room codes
- [ ] Hangman — word guessing with category selection
- [ ] Rock Paper Scissors — best of 5 with AI opponent
- [ ] Memory Match — card flip and pair matching
- [ ] Progressive Web App (PWA) manifest for Android home screen install

### Phase 3 — Enhanced Experience
- [ ] Achievement badge system
- [ ] Daily challenge mode (new game every 24 hours)
- [ ] Unlockable game-piece skins (purchased with coins)
- [ ] Global tournament bracket mode
- [ ] Cloud save via Firebase / Supabase (cross-device profile sync)
- [ ] 4-player mini game modes

### PWA Quick Setup
Add these two files to enable Android installation:

**`index.html`** — inside `<head>`:
```html
<link rel="manifest" href="manifest.json" />
<meta name="theme-color" content="#0a0a0f" />
```

**`manifest.json`** — new file in root:
```json
{
  "name": "Retro Game Hub",
  "short_name": "RetroHub",
  "description": "Notebook classics, digitally reborn",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#00ffaa",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Team

| Member | Role | Contribution |
|---|---|---|
| Shubham Salunke | Lead Developer | Architecture, SPA engine, Tic-Tac-Toe (Minimax AI), Battleship (Hunt/Target AI) |
| Atharva | Developer | Dots & Boxes (heuristic AI), Snakes & Ladders, Connect Four (Alpha-Beta AI), sound engine, 5 music tracks |
| Rishit Kinge | UI/UX Designer | 4 retro themes, CRT effects, animations, game card art, music indicator, responsive layout |
| Tavnvee Thakre | Designer | Game research & history, coin economy design, leaderboard structure, documentation |
| Dristhi Gallani | Designer | Cross-platform testing, QA, PowerPoint presentation, future scope roadmap |

---

## Project Stats

| Metric | Value |
|---|---|
| Total files | 11 |
| Lines of code | ~3,400 |
| External dependencies | 0 |
| Audio files | 0 |
| Server infrastructure | 0 |
| Background music tracks | 5 |
| Sound effects | 12 |
| Display themes | 4 |
| Playable games | 5 |
| Coming soon games | 3 |
| Supported browsers | 5 |
| Responsive breakpoints | 5 |
| Page load time | < 200ms |
| Min screen size supported | 360px |
| Max screen size tested | 1440px |

---

## Quick Reference

```
Open the app          →  Open index.html in any browser
Enable music          →  Settings ⚙ → Music toggle ON
Switch theme          →  Settings ⚙ → Display Theme
Create account        →  Player Station → NEW PLAYER tab
Play as guest         →  Player Station → PLAY AS GUEST
View leaderboard      →  Home → 🏆 button
Add a new game        →  Follow the 4-step guide above
```

---

*Built with ❤️ using HTML, CSS, and Vanilla JavaScript.*  
*Symbiosis Skills and Professional University, Pune — BTech CSIT — 2025–26*
