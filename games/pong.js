// Pong Game Module
const Pong = (() => {
  const WIDTH = 600;
  const HEIGHT = 400;
  const PADDLE_WIDTH = 12;
  const PADDLE_HEIGHT = 80;
  const BALL_SIZE = 12;
  const WIN_SCORE = 7;
  
  let canvas, ctx;
  let p1Score = 0;
  let p2Score = 0;
  let p1 = null;
  let p2 = null;
  let vsAI = false;
  let gameOver = false;
  
  let ball = { x: 0, y: 0, vx: 0, vy: 0, speed: 5 };
  let paddle1 = { y: 0, score: 0 };
  let paddle2 = { y: 0, score: 0 };
  
  let animationId = null;
  
  function resetBall() {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = 5;
    ball.vx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.vy = (Math.random() * 2 - 1) * ball.speed;
  }
  
  function startGame() {
    canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.className = 'pong-canvas';
    ctx = canvas.getContext('2d');
    
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    
    gameArea.innerHTML = '';
    gameArea.appendChild(canvas);
    
    paddle1.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    paddle2.y = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    p1Score = 0;
    p2Score = 0;
    gameOver = false;
    
    resetBall();
    
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
  }
  
  function handleMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    paddle1.y = mouseY - PADDLE_HEIGHT / 2;
    paddle1.y = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, paddle1.y));
  }
  
  function handleTouch(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    paddle1.y = touchY - PADDLE_HEIGHT / 2;
    paddle1.y = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, paddle1.y));
  }
  
  function updateAI() {
    const center = paddle2.y + PADDLE_HEIGHT / 2;
    const target = ball.y;
    const diff = target - center;
    
    if (Math.abs(diff) > 10) {
      paddle2.y += diff * 0.08;
      paddle2.y = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, paddle2.y));
    }
  }
  
  function update() {
    if (gameOver) return;
    
    if (vsAI) {
      updateAI();
    }
    
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Wall collision (top/bottom)
    if (ball.y <= 0 || ball.y >= HEIGHT - BALL_SIZE) {
      ball.vy = -ball.vy;
    }
    
    // Paddle collision
    if (ball.x <= PADDLE_WIDTH && ball.y + BALL_SIZE >= paddle1.y && ball.y <= paddle1.y + PADDLE_HEIGHT) {
      hitPaddle(1);
    }
    if (ball.x >= WIDTH - PADDLE_WIDTH - BALL_SIZE && ball.y + BALL_SIZE >= paddle2.y && ball.y <= paddle2.y + PADDLE_HEIGHT) {
      hitPaddle(2);
    }
    
    // Score
    if (ball.x < 0) {
      p2Score++;
      checkWin();
      resetBall();
    }
    if (ball.x > WIDTH) {
      p1Score++;
      checkWin();
      resetBall();
    }
  }
  
  function hitPaddle(player) {
    const paddle = player === 1 ? paddle1 : paddle2;
    const hitPos = (ball.y + BALL_SIZE / 2 - paddle.y) / PADDLE_HEIGHT;
    const angle = (hitPos - 0.5) * Math.PI / 3;
    
    ball.speed = Math.min(ball.speed + 0.5, 12);
    ball.vx = (player === 1 ? 1 : -1) * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
  }
  
  function checkWin() {
    if (p1Score >= WIN_SCORE || p2Score >= WIN_SCORE) {
      gameOver = true;
      const won = p1Score >= WIN_SCORE;
      const playerName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
      if (p1 && won) {
        const coins = 12;
        PlayerDB.awardCoins(coins, 'pong');
        PlayerDB.recordGame('pong', true);
        UI.updateHUD();
        setTimeout(() => {
          UI.showWinModal({
            title: 'VICTORY',
            subtitle: `${playerName} wins ${p1Score} - ${p2Score}`,
            coins,
            onPlayAgain: () => restart(),
            onHome: () => UI.showScreen('home'),
          });
        }, 500);
      } else {
        if (p1) {
          PlayerDB.recordGame('pong', false);
          UI.updateHUD();
        }
        setTimeout(() => {
          UI.showWinModal({
            title: 'GAME OVER',
            subtitle: `${playerName} lost ${p1Score} - ${p2Score}`,
            coins: 0,
            onPlayAgain: () => restart(),
            onHome: () => UI.showScreen('home'),
          });
        }, 500);
      }
    }
  }
  
  function draw() {
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Center line
    ctx.strokeStyle = '#333';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Paddles
    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(0, paddle1.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillRect(WIDTH - PADDLE_WIDTH, paddle2.y, PADDLE_WIDTH, PADDLE_HEIGHT);
    
    // Ball
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(ball.x, ball.y, BALL_SIZE, BALL_SIZE);
    
    // Scores
    ctx.font = '48px "VT323", monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(p1Score, WIDTH / 4, 60);
    ctx.fillText(p2Score, 3 * WIDTH / 4, 60);
  }
  
  function gameLoop() {
    update();
    draw();
    if (!gameOver) {
      animationId = requestAnimationFrame(gameLoop);
    }
  }
  
  function init(player1, player2, ai) {
    p1 = player1;
    p2 = player2;
    vsAI = ai;
    startGame();
  }
  
  function restart() {
    if (animationId) cancelAnimationFrame(animationId);
    init(p1, p2, vsAI);
  }
  
  return { init, restart };
})();
