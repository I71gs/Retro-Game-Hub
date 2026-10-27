// Retro 2048 Game Module
const Game2048 = (() => {
  const SIZE = 4;
  let grid = [];
  let score = 0;
  let bestScore = 0;
  let won = false;
  let gameOver = false;
  let p1 = 'PLAYER 1';
  let touchStartX = 0;
  let touchStartY = 0;

  function init(player1) {
    p1 = player1 || 'PLAYER 1';
    try {
      bestScore = parseInt(localStorage.getItem('retrohub_2048_best') || '0', 10);
    } catch (_) {
      bestScore = 0;
    }
    setupDOM();
    startGame();
  }

  function setupDOM() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    gameArea.innerHTML = `
      <div class="retro-game-wrapper g2048-wrapper">
        <div class="retro-hud-header">
          <div class="hud-item"><span class="hud-label">SCORE</span><span id="g2048Score" class="hud-val neon-green">0</span></div>
          <div class="hud-item"><span class="hud-label">TARGET</span><span class="hud-val neon-cyan">2048</span></div>
          <div class="hud-item"><span class="hud-label">BEST</span><span id="g2048Best" class="hud-val neon-gold">${bestScore}</span></div>
        </div>
        <div class="g2048-board-container" id="g2048BoardContainer">
          <div class="g2048-board" id="g2048Grid"></div>
        </div>
        <div class="retro-dpad">
          <button class="dpad-btn up" id="g2048Up">▲</button>
          <div class="dpad-mid">
            <button class="dpad-btn left" id="g2048Left">◀</button>
            <button class="dpad-btn center" id="g2048Reset">↺</button>
            <button class="dpad-btn right" id="g2048Right">▶</button>
          </div>
          <button class="dpad-btn down" id="g2048Down">▼</button>
        </div>
        <div class="retro-ctrl-hint">SWIPE OR USE ARROW KEYS / WASD</div>
      </div>
    `;

    window.removeEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    const container = document.getElementById('g2048BoardContainer');
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    document.getElementById('g2048Up').onclick = () => move('up');
    document.getElementById('g2048Down').onclick = () => move('down');
    document.getElementById('g2048Left').onclick = () => move('left');
    document.getElementById('g2048Right').onclick = () => move('right');
    document.getElementById('g2048Reset').onclick = () => restart();
  }

  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30) move(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) > 30) move(dy > 0 ? 'down' : 'up');
    }
  }

  function handleKeyDown(e) {
    if (gameOver) return;
    if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code) || ['ArrowUp', 'w', 'W'].includes(e.key)) {
      move('up');
      e.preventDefault();
    } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code) || ['ArrowDown', 's', 'S'].includes(e.key)) {
      move('down');
      e.preventDefault();
    } else if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
      move('left');
      e.preventDefault();
    } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
      move('right');
      e.preventDefault();
    }
  }

  function startGame() {
    grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
    score = 0;
    won = false;
    gameOver = false;
    spawnTile();
    spawnTile();
    updateHUD();
    renderGrid();
  }

  function spawnTile() {
    const emptyCells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return;
    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function move(direction) {
    if (gameOver) return;
    let moved = false;
    let pointsGained = 0;

    function slideRow(row) {
      let filtered = row.filter(val => val !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          pointsGained += filtered[i];
          filtered[i + 1] = 0;
          if (filtered[i] === 2048 && !won) {
            triggerWin();
          }
        }
      }
      filtered = filtered.filter(val => val !== 0);
      while (filtered.length < SIZE) filtered.push(0);
      return filtered;
    }

    if (direction === 'left') {
      for (let r = 0; r < SIZE; r++) {
        const original = [...grid[r]];
        grid[r] = slideRow(grid[r]);
        if (original.some((val, i) => val !== grid[r][i])) moved = true;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < SIZE; r++) {
        const original = [...grid[r]];
        grid[r] = slideRow(grid[r].reverse()).reverse();
        if (original.some((val, i) => val !== grid[r][i])) moved = true;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < SIZE; c++) {
        const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
        const newCol = slideRow(col);
        for (let r = 0; r < SIZE; r++) {
          if (grid[r][c] !== newCol[r]) moved = true;
          grid[r][c] = newCol[r];
        }
      }
    } else if (direction === 'down') {
      for (let c = 0; c < SIZE; c++) {
        const col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]].reverse();
        const newCol = slideRow(col).reverse();
        for (let r = 0; r < SIZE; r++) {
          if (grid[r][c] !== newCol[r]) moved = true;
          grid[r][c] = newCol[r];
        }
      }
    }

    if (moved) {
      if (pointsGained > 0) {
        score += pointsGained;
        if (typeof Sound !== 'undefined') Sound.play('capture');
      } else {
        if (typeof Sound !== 'undefined') Sound.play('move');
      }
      spawnTile();
      updateHUD();
      renderGrid();

      if (!canMove()) {
        triggerGameOver();
      }
    }
  }

  function canMove() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return true;
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true;
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  function updateHUD() {
    const sEl = document.getElementById('g2048Score');
    const bEl = document.getElementById('g2048Best');
    if (sEl) sEl.textContent = score;
    if (score > bestScore) {
      bestScore = score;
      try { localStorage.setItem('retrohub_2048_best', String(bestScore)); } catch (_) {}
    }
    if (bEl) bEl.textContent = bestScore;
  }

  function triggerWin() {
    won = true;
    if (typeof Sound !== 'undefined') Sound.play('win');
    if (typeof PlayerDB !== 'undefined') {
      PlayerDB.awardCoins(25, 'game2048');
      if (typeof UI !== 'undefined') UI.updateHUD();
    }
  }

  function triggerGameOver() {
    gameOver = true;
    if (typeof Sound !== 'undefined') Sound.play('error');

    const didReachGoal = won || score >= 1000;
    const coins = Math.min(30, Math.floor(score / 80) + (didReachGoal ? 12 : 2));

    if (typeof PlayerDB !== 'undefined') {
      if (didReachGoal) PlayerDB.awardCoins(coins, 'game2048');
      PlayerDB.recordGame('game2048', didReachGoal);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: won ? '2048 REBORN!' : 'NO MOVES LEFT',
          subtitle: `${pName} reached score ${score} (Best: ${bestScore})`,
          coins: coins,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 450);
  }

  function renderGrid() {
    const gridEl = document.getElementById('g2048Grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = grid[r][c];
        const tile = document.createElement('div');
        tile.className = `g2048-tile tile-${val}`;
        tile.textContent = val > 0 ? val : '';
        gridEl.appendChild(tile);
      }
    }
  }

  function restart() {
    startGame();
  }

  return { init, restart };
})();

window.Game2048 = Game2048;
