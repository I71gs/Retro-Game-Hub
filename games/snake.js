// Retro Snake Game Module
const Snake = (() => {
  const GRID_SIZE = 20;
  const CELL_COUNT = 20; // 20x20 grid = 400x400 canvas
  const CANVAS_SIZE = GRID_SIZE * CELL_COUNT;

  let canvas, ctx;
  let snake = [];
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let food = { x: 15, y: 10 };
  let goldenFruit = null;
  let goldenTimer = 0;
  let score = 0;
  let highScore = 0;
  let gameInterval = null;
  let gameOver = false;
  let isPaused = false;
  let p1 = 'PLAYER 1';
  let speed = 110;
  let touchStartX = 0;
  let touchStartY = 0;

  function init(player1) {
    p1 = player1 || 'PLAYER 1';
    try {
      highScore = parseInt(localStorage.getItem('retrohub_snake_hs') || '0', 10);
    } catch (_) {
      highScore = 0;
    }
    setupDOM();
    startGame();
  }

  function setupDOM() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    gameArea.innerHTML = `
      <div class="retro-game-wrapper">
        <div class="retro-hud-header">
          <div class="hud-item"><span class="hud-label">SCORE</span><span id="snakeScore" class="hud-val neon-green">0</span></div>
          <div class="hud-item"><span class="hud-label">LENGTH</span><span id="snakeLen" class="hud-val">3</span></div>
          <div class="hud-item"><span class="hud-label">RECORD</span><span id="snakeHigh" class="hud-val neon-gold">${highScore}</span></div>
        </div>
        <div class="canvas-container">
          <canvas id="snakeCanvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          <div id="snakePauseOverlay" class="canvas-overlay" style="display:none;">
            <div class="overlay-text blink">PAUSED</div>
            <div class="overlay-sub">PRESS SPACE TO RESUME</div>
          </div>
        </div>
        <div class="retro-dpad">
          <button class="dpad-btn up" id="dpadUp">▲</button>
          <div class="dpad-mid">
            <button class="dpad-btn left" id="dpadLeft">◀</button>
            <button class="dpad-btn center" id="dpadPause">⏸</button>
            <button class="dpad-btn right" id="dpadRight">▶</button>
          </div>
          <button class="dpad-btn down" id="dpadDown">▼</button>
        </div>
        <div class="retro-ctrl-hint">CONTROLS: ARROW KEYS / WASD / SWIPE / D-PAD</div>
      </div>
    `;

    canvas = document.getElementById('snakeCanvas');
    ctx = canvas.getContext('2d');

    // Key listeners
    window.removeEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);

    // Touch swipe support
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // D-Pad buttons
    document.getElementById('dpadUp').onclick = () => setDir(0, -1);
    document.getElementById('dpadDown').onclick = () => setDir(0, 1);
    document.getElementById('dpadLeft').onclick = () => setDir(-1, 0);
    document.getElementById('dpadRight').onclick = () => setDir(1, 0);
    document.getElementById('dpadPause').onclick = togglePause;
  }

  function handleTouchStart(e) {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function handleTouchEnd(e) {
    e.preventDefault();
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 20) setDir(dx > 0 ? 1 : -1, 0);
    } else {
      if (Math.abs(dy) > 20) setDir(0, dy > 0 ? 1 : -1);
    }
  }

  function handleKeyDown(e) {
    if (gameOver) return;
    if (['ArrowUp', 'KeyW', 'w', 'W'].includes(e.code) || ['ArrowUp', 'w', 'W'].includes(e.key)) {
      setDir(0, -1);
      e.preventDefault();
    } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code) || ['ArrowDown', 's', 'S'].includes(e.key)) {
      setDir(0, 1);
      e.preventDefault();
    } else if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
      setDir(-1, 0);
      e.preventDefault();
    } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
      setDir(1, 0);
      e.preventDefault();
    } else if (e.code === 'Space') {
      togglePause();
      e.preventDefault();
    }
  }

  function setDir(x, y) {
    if (isPaused) isPaused = false;
    // Disallow 180 reverse
    if (x !== 0 && direction.x === -x) return;
    if (y !== 0 && direction.y === -y) return;
    nextDirection = { x, y };
  }

  function togglePause() {
    isPaused = !isPaused;
    const overlay = document.getElementById('snakePauseOverlay');
    if (overlay) overlay.style.display = isPaused ? 'flex' : 'none';
  }

  function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = 110;
    gameOver = false;
    isPaused = false;
    goldenFruit = null;
    goldenTimer = 0;
    spawnFood();
    updateHUD();
    draw();
    gameInterval = setInterval(gameStep, speed);
  }

  function spawnFood() {
    let valid = false;
    while (!valid) {
      food = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT),
      };
      valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
    // Occasional golden fruit chance
    if (!goldenFruit && Math.random() < 0.25 && score >= 30) {
      goldenFruit = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT),
      };
      goldenTimer = 35; // steps left
    }
  }

  function gameStep() {
    if (gameOver || isPaused) return;

    direction = { ...nextDirection };
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Wall collision
    if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
      triggerGameOver('Crashed into the grid perimeter!');
      return;
    }

    // Self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      triggerGameOver('Bit your own tail!');
      return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      if (typeof Sound !== 'undefined') Sound.play('capture');
      spawnFood();
      // Increase speed slightly
      if (speed > 60 && score % 40 === 0) {
        speed = Math.max(55, speed - 6);
        clearInterval(gameInterval);
        gameInterval = setInterval(gameStep, speed);
      }
    } else if (goldenFruit && head.x === goldenFruit.x && head.y === goldenFruit.y) {
      score += 35;
      goldenFruit = null;
      if (typeof Sound !== 'undefined') Sound.play('coin');
    } else {
      snake.pop();
    }

    // Golden fruit countdown
    if (goldenFruit) {
      goldenTimer--;
      if (goldenTimer <= 0) goldenFruit = null;
    }

    updateHUD();
    draw();
  }

  function updateHUD() {
    const sEl = document.getElementById('snakeScore');
    const lEl = document.getElementById('snakeLen');
    const hEl = document.getElementById('snakeHigh');
    if (sEl) sEl.textContent = score;
    if (lEl) lEl.textContent = snake.length;
    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem('retrohub_snake_hs', String(highScore)); } catch (_) {}
    }
    if (hEl) hEl.textContent = highScore;
  }

  function triggerGameOver(reason) {
    gameOver = true;
    clearInterval(gameInterval);
    if (typeof Sound !== 'undefined') Sound.play('error');

    const won = score >= 50;
    const coins = Math.min(30, Math.floor(score / 5) + (won ? 10 : 2));

    if (typeof PlayerDB !== 'undefined') {
      if (won) PlayerDB.awardCoins(coins, 'snake');
      PlayerDB.recordGame('snake', won);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: won ? 'SERPENT MASTER!' : 'GAME OVER',
          subtitle: `${pName} scored ${score} pts (${snake.length} segments). ${reason}`,
          coins: coins,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 450);
  }

  function draw() {
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines (subtle retro CRT look)
    ctx.strokeStyle = '#151525';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE);
      ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw Food
    const fx = food.x * GRID_SIZE + GRID_SIZE / 2;
    const fy = food.y * GRID_SIZE + GRID_SIZE / 2;
    ctx.fillStyle = '#ff2255';
    ctx.shadowColor = '#ff2255';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(fx, fy, GRID_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Golden Fruit
    if (goldenFruit) {
      const gx = goldenFruit.x * GRID_SIZE + GRID_SIZE / 2;
      const gy = goldenFruit.y * GRID_SIZE + GRID_SIZE / 2;
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(gx, gy, GRID_SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Snake
    snake.forEach((seg, index) => {
      const isHead = index === 0;
      const x = seg.x * GRID_SIZE;
      const y = seg.y * GRID_SIZE;

      ctx.fillStyle = isHead ? '#00ffaa' : '#00bb77';
      if (isHead) {
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

      // Eye details on head
      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#0a0a12';
        const eyeSize = 3;
        if (direction.x === 1) {
          ctx.fillRect(x + 13, y + 4, eyeSize, eyeSize);
          ctx.fillRect(x + 13, y + 13, eyeSize, eyeSize);
        } else if (direction.x === -1) {
          ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
          ctx.fillRect(x + 4, y + 13, eyeSize, eyeSize);
        } else if (direction.y === -1) {
          ctx.fillRect(x + 4, y + 4, eyeSize, eyeSize);
          ctx.fillRect(x + 13, y + 4, eyeSize, eyeSize);
        } else {
          ctx.fillRect(x + 4, y + 13, eyeSize, eyeSize);
          ctx.fillRect(x + 13, y + 13, eyeSize, eyeSize);
        }
      }
    });
    ctx.shadowBlur = 0;
  }

  function restart() {
    if (gameInterval) clearInterval(gameInterval);
    startGame();
  }

  return { init, restart };
})();

window.Snake = Snake;
