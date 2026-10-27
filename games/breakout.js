// Retro Breakout / Brick Breaker Game Module
const Breakout = (() => {
  const WIDTH = 480;
  const HEIGHT = 420;
  const PADDLE_WIDTH = 80;
  const PADDLE_HEIGHT = 12;
  const BALL_RADIUS = 6;
  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;
  const BRICK_HEIGHT = 16;
  const BRICK_GAP = 5;
  const BRICK_TOP_OFFSET = 45;

  const ROW_COLORS = ['#ff2255', '#ff7700', '#ffd700', '#00ffaa', '#00e5ff'];
  const ROW_POINTS = [50, 40, 30, 20, 10];

  let canvas, ctx;
  let animationId = null;
  let p1 = 'PLAYER 1';
  let paddleX = (WIDTH - PADDLE_WIDTH) / 2;
  let ballX = WIDTH / 2;
  let ballY = HEIGHT - 60;
  let ballSpeed = 4.5;
  let ballVx = 3;
  let ballVy = -3.5;
  let bricks = [];
  let score = 0;
  let lives = 3;
  let gameOver = false;
  let isServing = true;
  let keys = { left: false, right: false };

  function init(player1) {
    p1 = player1 || 'PLAYER 1';
    setupDOM();
    startGame();
  }

  function setupDOM() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    gameArea.innerHTML = `
      <div class="retro-game-wrapper">
        <div class="retro-hud-header">
          <div class="hud-item"><span class="hud-label">SCORE</span><span id="breakoutScore" class="hud-val neon-green">0</span></div>
          <div class="hud-item"><span class="hud-label">LIVES</span><span id="breakoutLives" class="hud-val neon-red">♥♥♥</span></div>
          <div class="hud-item"><span class="hud-label">BRICKS</span><span id="breakoutRemaining" class="hud-val neon-cyan">40</span></div>
        </div>
        <div class="canvas-container">
          <canvas id="breakoutCanvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div id="breakoutServeOverlay" class="canvas-overlay">
            <div class="overlay-text blink">CLICK OR PRESS SPACE TO LAUNCH</div>
          </div>
        </div>
        <div class="retro-paddle-ctrls">
          <button class="paddle-btn" id="paddleLeft">◀ MOVE LEFT</button>
          <button class="paddle-btn launch-btn" id="paddleLaunch">🚀 LAUNCH</button>
          <button class="paddle-btn" id="paddleRight">MOVE RIGHT ▶</button>
        </div>
        <div class="retro-ctrl-hint">MOUSE / TOUCH DRAG / ARROW KEYS / A & D</div>
      </div>
    `;

    canvas = document.getElementById('breakoutCanvas');
    ctx = canvas.getContext('2d');

    // Mouse & Touch controls
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('click', launchBall);

    // Keyboard
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mobile buttons
    const btnL = document.getElementById('paddleLeft');
    const btnR = document.getElementById('paddleRight');
    const btnLaunch = document.getElementById('paddleLaunch');

    btnL.onmousedown = () => { keys.left = true; };
    btnL.onmouseup = () => { keys.left = false; };
    btnL.ontouchstart = (e) => { e.preventDefault(); keys.left = true; };
    btnL.ontouchend = (e) => { e.preventDefault(); keys.left = false; };

    btnR.onmousedown = () => { keys.right = true; };
    btnR.onmouseup = () => { keys.right = false; };
    btnR.ontouchstart = (e) => { e.preventDefault(); keys.right = true; };
    btnR.ontouchend = (e) => { e.preventDefault(); keys.right = false; };

    btnLaunch.onclick = launchBall;
  }

  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
    if (isServing) {
      ballX = paddleX + PADDLE_WIDTH / 2;
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
    if (isServing) {
      ballX = paddleX + PADDLE_WIDTH / 2;
    }
  }

  function handleKeyDown(e) {
    if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
      keys.left = true;
      e.preventDefault();
    } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
      keys.right = true;
      e.preventDefault();
    } else if (e.code === 'Space') {
      launchBall();
      e.preventDefault();
    }
  }

  function handleKeyUp(e) {
    if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
      keys.left = false;
    } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
      keys.right = false;
    }
  }

  function launchBall() {
    if (isServing && !gameOver) {
      isServing = false;
      const overlay = document.getElementById('breakoutServeOverlay');
      if (overlay) overlay.style.display = 'none';
      ballVx = (Math.random() > 0.5 ? 1 : -1) * (2.5 + Math.random() * 1.5);
      ballVy = -ballSpeed;
      if (typeof Sound !== 'undefined') Sound.play('place');
    }
  }

  function startGame() {
    if (animationId) cancelAnimationFrame(animationId);
    score = 0;
    lives = 3;
    gameOver = false;
    resetPaddleAndBall();
    initBricks();
    updateHUD();
    gameLoop();
  }

  function resetPaddleAndBall() {
    paddleX = (WIDTH - PADDLE_WIDTH) / 2;
    ballX = paddleX + PADDLE_WIDTH / 2;
    ballY = HEIGHT - 35;
    ballSpeed = 4.5;
    isServing = true;
    const overlay = document.getElementById('breakoutServeOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function initBricks() {
    bricks = [];
    const brickWidth = (WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        const x = BRICK_GAP + c * (brickWidth + BRICK_GAP);
        const y = BRICK_TOP_OFFSET + r * (BRICK_HEIGHT + BRICK_GAP);
        bricks[r][c] = {
          x,
          y,
          width: brickWidth,
          height: BRICK_HEIGHT,
          alive: true,
          color: ROW_COLORS[r],
          points: ROW_POINTS[r],
        };
      }
    }
  }

  function update() {
    if (gameOver) return;

    // Keyboard paddle movement
    const paddleSpeed = 7;
    if (keys.left) {
      paddleX = Math.max(0, paddleX - paddleSpeed);
      if (isServing) ballX = paddleX + PADDLE_WIDTH / 2;
    }
    if (keys.right) {
      paddleX = Math.min(WIDTH - PADDLE_WIDTH, paddleX + paddleSpeed);
      if (isServing) ballX = paddleX + PADDLE_WIDTH / 2;
    }

    if (isServing) return;

    ballX += ballVx;
    ballY += ballVy;

    // Wall collisions
    if (ballX - BALL_RADIUS <= 0) {
      ballX = BALL_RADIUS;
      ballVx = -ballVx;
      if (typeof Sound !== 'undefined') Sound.play('move');
    } else if (ballX + BALL_RADIUS >= WIDTH) {
      ballX = WIDTH - BALL_RADIUS;
      ballVx = -ballVx;
      if (typeof Sound !== 'undefined') Sound.play('move');
    }

    if (ballY - BALL_RADIUS <= 0) {
      ballY = BALL_RADIUS;
      ballVy = -ballVy;
      if (typeof Sound !== 'undefined') Sound.play('move');
    }

    // Paddle collision
    const paddleY = HEIGHT - 22;
    if (
      ballY + BALL_RADIUS >= paddleY &&
      ballY - BALL_RADIUS <= paddleY + PADDLE_HEIGHT &&
      ballX >= paddleX &&
      ballX <= paddleX + PADDLE_WIDTH &&
      ballVy > 0
    ) {
      // Angle reflection based on hit position
      const hitPoint = (ballX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
      const maxBounceAngle = (5 * Math.PI) / 12; // 75 degrees
      const bounceAngle = hitPoint * maxBounceAngle;

      const currentSpeed = Math.min(8, ballSpeed + 0.15);
      ballSpeed = currentSpeed;
      ballVx = currentSpeed * Math.sin(bounceAngle);
      ballVy = -currentSpeed * Math.cos(bounceAngle);

      if (typeof Sound !== 'undefined') Sound.play('move');
    }

    // Brick collisions
    let remainingBricks = 0;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks[r][c];
        if (b.alive) {
          remainingBricks++;
          if (
            ballX + BALL_RADIUS > b.x &&
            ballX - BALL_RADIUS < b.x + b.width &&
            ballY + BALL_RADIUS > b.y &&
            ballY - BALL_RADIUS < b.y + b.height
          ) {
            b.alive = false;
            remainingBricks--;
            score += b.points;
            ballVy = -ballVy;
            if (typeof Sound !== 'undefined') Sound.play('capture');
            updateHUD(remainingBricks);

            if (remainingBricks === 0) {
              triggerWin();
              return;
            }
          }
        }
      }
    }

    // Bottom out (life lost)
    if (ballY - BALL_RADIUS > HEIGHT) {
      lives--;
      updateHUD(remainingBricks);
      if (typeof Sound !== 'undefined') Sound.play('error');

      if (lives <= 0) {
        triggerGameOver();
      } else {
        resetPaddleAndBall();
      }
    }
  }

  function updateHUD(remainingCount) {
    const sEl = document.getElementById('breakoutScore');
    const lEl = document.getElementById('breakoutLives');
    const rEl = document.getElementById('breakoutRemaining');
    if (sEl) sEl.textContent = score;
    if (lEl) lEl.textContent = '♥'.repeat(Math.max(0, lives));
    if (rEl) {
      if (remainingCount !== undefined) {
        rEl.textContent = remainingCount;
      }
    }
  }

  function triggerWin() {
    gameOver = true;
    if (animationId) cancelAnimationFrame(animationId);
    if (typeof Sound !== 'undefined') Sound.play('win');

    const coins = 25;
    if (typeof PlayerDB !== 'undefined') {
      PlayerDB.awardCoins(coins, 'breakout');
      PlayerDB.recordGame('breakout', true);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: 'WALL SHATTERED!',
          subtitle: `${pName} cleared all bricks with ${score} pts!`,
          coins: coins,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 450);
  }

  function triggerGameOver() {
    gameOver = true;
    if (animationId) cancelAnimationFrame(animationId);

    const coins = Math.floor(score / 50) + 2;
    if (typeof PlayerDB !== 'undefined') {
      PlayerDB.recordGame('breakout', false);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: 'BALL LOST',
          subtitle: `${pName} scored ${score} pts before losing all lives.`,
          coins: coins,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 450);
  }

  function draw() {
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Subtle background grid
    ctx.strokeStyle = '#121225';
    ctx.lineWidth = 1;
    for (let x = 0; x < WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    // Draw Bricks
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const b = bricks[r][c];
        if (b && b.alive) {
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 6;
          ctx.fillRect(b.x, b.y, b.width, b.height);
          // Highlight line
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(b.x, b.y, b.width, 2);
        }
      }
    }
    ctx.shadowBlur = 0;

    // Draw Paddle
    const paddleY = HEIGHT - 22;
    ctx.fillStyle = '#00ffaa';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    // Paddle bevel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(paddleX + 2, paddleY + 2, PADDLE_WIDTH - 4, 2);
    ctx.shadowBlur = 0;

    // Draw Ball
    ctx.fillStyle = '#ff0066';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function gameLoop() {
    update();
    draw();
    if (!gameOver) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  function restart() {
    startGame();
  }

  return { init, restart };
})();

window.Breakout = Breakout;
