// Retro Minesweeper Game Module
const Minesweeper = (() => {
  const ROWS = 9;
  const COLS = 9;
  const MINES = 10;

  let board = [];
  let mineLocations = new Set();
  let firstClick = true;
  let gameOver = false;
  let flagCount = 0;
  let timer = 0;
  let timerInterval = null;
  let flagMode = false;
  let p1 = 'PLAYER 1';

  function init(player1) {
    p1 = player1 || 'PLAYER 1';
    setupDOM();
    startGame();
  }

  function setupDOM() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    gameArea.innerHTML = `
      <div class="retro-game-wrapper ms-wrapper">
        <div class="ms-window">
          <div class="ms-header">
            <div class="ms-lcd" id="msMineCount">010</div>
            <button class="ms-face-btn" id="msFaceBtn">🙂</button>
            <div class="ms-lcd" id="msTimer">000</div>
          </div>
          <div class="ms-grid" id="msGrid"></div>
        </div>
        <div class="ms-controls">
          <button class="retro-btn secondary" id="msToggleMode">⛏ REVEAL MODE</button>
          <button class="retro-btn" id="msNewGame">↺ NEW GAME</button>
        </div>
        <div class="retro-ctrl-hint">CLICK TO DIG · RIGHT-CLICK TO FLAG · TOGGLE FOR TOUCH</div>
      </div>
    `;

    document.getElementById('msFaceBtn').onclick = () => restart();
    document.getElementById('msNewGame').onclick = () => restart();

    const modeBtn = document.getElementById('msToggleMode');
    modeBtn.onclick = () => {
      flagMode = !flagMode;
      modeBtn.textContent = flagMode ? '🚩 FLAG MODE' : '⛏ REVEAL MODE';
      modeBtn.classList.toggle('flag-active', flagMode);
      if (typeof Sound !== 'undefined') Sound.play('click');
    };
  }

  function startGame() {
    if (timerInterval) clearInterval(timerInterval);
    timer = 0;
    firstClick = true;
    gameOver = false;
    flagCount = 0;
    mineLocations = new Set();
    updateFace('🙂');
    updateLCD();

    // Initialize board state
    board = [];
    for (let r = 0; r < ROWS; r++) {
      board[r] = [];
      for (let c = 0; c < COLS; c++) {
        board[r][c] = {
          r,
          c,
          isMine: false,
          revealed: false,
          flagged: false,
          neighborMines: 0,
        };
      }
    }

    renderGrid();
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timer++;
      updateLCD();
    }, 1000);
  }

  function updateLCD() {
    const mEl = document.getElementById('msMineCount');
    const tEl = document.getElementById('msTimer');
    if (mEl) {
      const remaining = Math.max(0, MINES - flagCount);
      mEl.textContent = String(remaining).padStart(3, '0');
    }
    if (tEl) {
      tEl.textContent = String(Math.min(999, timer)).padStart(3, '0');
    }
  }

  function updateFace(emoji) {
    const face = document.getElementById('msFaceBtn');
    if (face) face.textContent = emoji;
  }

  function plantMines(safeR, safeC) {
    const forbidden = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        forbidden.add(`${safeR + dr},${safeC + dc}`);
      }
    }

    let planted = 0;
    while (planted < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      const key = `${r},${c}`;
      if (!forbidden.has(key) && !board[r][c].isMine) {
        board[r][c].isMine = true;
        mineLocations.add(key);
        planted++;
      }
    }

    // Calculate neighbor numbers
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (board[nr][nc].isMine) count++;
              }
            }
          }
          board[r][c].neighborMines = count;
        }
      }
    }
  }

  function handleClick(r, c) {
    if (gameOver) return;

    if (flagMode) {
      handleRightClick(r, c);
      return;
    }

    const cell = board[r][c];
    if (cell.flagged || cell.revealed) return;

    if (firstClick) {
      firstClick = false;
      plantMines(r, c);
      startTimer();
    }

    if (cell.isMine) {
      triggerLoss(r, c);
      return;
    }

    revealCell(r, c);
    if (typeof Sound !== 'undefined') Sound.play('move');
    renderGrid();
    checkWin();
  }

  function handleRightClick(r, c, e) {
    if (e) e.preventDefault();
    if (gameOver || firstClick) return;

    const cell = board[r][c];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    flagCount += cell.flagged ? 1 : -1;
    if (typeof Sound !== 'undefined') Sound.play('place');
    updateLCD();
    renderGrid();
  }

  function revealCell(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    const cell = board[r][c];
    if (cell.revealed || cell.flagged || cell.isMine) return;

    cell.revealed = true;

    // If 0 neighbors, cascade reveal
    if (cell.neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            revealCell(r + dr, c + dc);
          }
        }
      }
    }
  }

  function checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        if (!cell.isMine && !cell.revealed) unrevealedSafe++;
      }
    }

    if (unrevealedSafe === 0) {
      triggerWin();
    }
  }

  function triggerWin() {
    gameOver = true;
    if (timerInterval) clearInterval(timerInterval);
    updateFace('😎');
    if (typeof Sound !== 'undefined') Sound.play('win');

    const coins = 18;
    if (typeof PlayerDB !== 'undefined') {
      PlayerDB.awardCoins(coins, 'minesweeper');
      PlayerDB.recordGame('minesweeper', true);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: 'MINEFIELD CLEARED!',
          subtitle: `${pName} swept all 10 mines in ${timer} seconds!`,
          coins: coins,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 450);
  }

  function triggerLoss(hitR, hitC) {
    gameOver = true;
    if (timerInterval) clearInterval(timerInterval);
    updateFace('💥');
    if (typeof Sound !== 'undefined') Sound.play('error');

    // Reveal all mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c].isMine) {
          board[r][c].revealed = true;
        }
      }
    }
    board[hitR][hitC].hit = true;
    renderGrid();

    if (typeof PlayerDB !== 'undefined') {
      PlayerDB.recordGame('minesweeper', false);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: 'DETONATION!',
          subtitle: `${pName} triggered a mine after ${timer}s. Watch your step!`,
          coins: 2,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 450);
  }

  function renderGrid() {
    const gridEl = document.getElementById('msGrid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        const btn = document.createElement('div');
        btn.className = 'ms-cell';

        if (cell.revealed) {
          btn.classList.add('revealed');
          if (cell.isMine) {
            btn.classList.add('mine');
            btn.textContent = '💣';
            if (cell.hit) btn.classList.add('hit');
          } else if (cell.neighborMines > 0) {
            btn.textContent = cell.neighborMines;
            btn.classList.add(`num-${cell.neighborMines}`);
          }
        } else if (cell.flagged) {
          btn.classList.add('flagged');
          btn.textContent = '🚩';
        }

        btn.onmousedown = () => { if (!gameOver) updateFace('😮'); };
        btn.onmouseup = () => { if (!gameOver) updateFace('🙂'); };
        btn.onclick = () => handleClick(r, c);
        btn.oncontextmenu = (e) => handleRightClick(r, c, e);

        gridEl.appendChild(btn);
      }
    }
  }

  function restart() {
    startGame();
  }

  return { init, restart };
})();

window.Minesweeper = Minesweeper;
