// Tetris Game Module
const Tetris = (() => {
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 28;
  
  const SHAPES = [
    [[1,1,1,1]],           // I
    [[1,1],[1,1]],         // O
    [[0,1,0],[1,1,1]],     // T
    [[1,1,0],[0,1,1]],     // S
    [[0,1,1],[1,1,0]],     // Z
    [[1,0,0],[1,1,1]],     // J
    [[0,0,1],[1,1,1]]      // L
  ];
  
  const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#00f000', '#f00000', '#0000f0', '#f0a000'];
  
  let board = [];
  let currentPiece = null;
  let nextPiece = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let gameOver = false;
  let dropInterval = null;
  let p1 = null;
  let p2 = null;
  
  function createPiece() {
    const idx = Math.floor(Math.random() * SHAPES.length);
    return {
      shape: SHAPES[idx].map(row => [...row]),
      color: COLORS[idx],
      x: Math.floor(COLS / 2) - Math.ceil(SHAPES[idx][0].length / 2),
      y: 0
    };
  }
  
  function initBoard() {
    board = [];
    for (let r = 0; r < ROWS; r++) {
      board[r] = [];
      for (let c = 0; c < COLS; c++) {
        board[r][c] = null;
      }
    }
  }
  
  function isValid(piece, offsetX = 0, offsetY = 0) {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c]) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
          if (newY >= 0 && board[newY][newX]) return false;
        }
      }
    }
    return true;
  }
  
  function rotate(piece) {
    const rotated = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
    const oldShape = piece.shape;
    piece.shape = rotated;
    if (!isValid(piece)) {
      piece.shape = oldShape;
    }
  }
  
  function merge() {
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          if (currentPiece.y + r >= 0) {
            board[currentPiece.y + r][currentPiece.x + c] = currentPiece.color;
          }
        }
      }
    }
  }
  
  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(cell => cell !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800];
      score += points[cleared] * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      updateSpeed();
    }
  }
  
  function updateSpeed() {
    if (dropInterval) clearInterval(dropInterval);
    const speed = Math.max(100, 1000 - (level - 1) * 100);
    dropInterval = setInterval(drop, speed);
  }
  
  function drop() {
    if (gameOver) return;
    if (isValid(currentPiece, 0, 1)) {
      currentPiece.y++;
    } else {
      merge();
      clearLines();
      currentPiece = nextPiece;
      nextPiece = createPiece();
      if (!isValid(currentPiece)) {
        endGame();
      }
    }
    render();
  }
  
  function hardDrop() {
    while (isValid(currentPiece, 0, 1)) {
      currentPiece.y++;
      score += 2;
    }
    drop();
  }
  
  function move(dir) {
    if (isValid(currentPiece, dir, 0)) {
      currentPiece.x += dir;
      render();
    }
  }
  
  function endGame() {
    gameOver = true;
    clearInterval(dropInterval);
    const coins = Math.floor(score / 100) + 20;
    if (p1) {
      PlayerDB.awardCoins(coins, 'tetris');
      PlayerDB.recordGame('tetris', true);
      UI.updateHUD();
    }
    const playerName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      UI.showWinModal({
        title: 'GAME OVER',
        subtitle: `${playerName} scored ${score} with ${lines} lines`,
        coins,
        onPlayAgain: () => restart(),
        onHome: () => UI.showScreen('home'),
      });
    }, 500);
  }
  
  function render() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;
    
    let html = '<div class="tetris-wrap">';
    html += '<div class="tetris-board">';
    
    // Render board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c] || (currentPiece && isCurrentPiece(r, c) ? currentPiece.color : null);
        html += `<div class="tetris-cell ${cell ? 'filled' : ''}" style="${cell ? `background:${cell}` : ''}"></div>`;
      }
    }
    
    html += '</div>';
    html += '<div class="tetris-side">';
    html += `<div class="tetris-next"><div>NEXT</div><div class="tetris-next-piece">${renderNext()}</div></div>`;
    html += `<div class="tetris-score"><div>SCORE</div><div>${score}</div></div>`;
    html += `<div class="tetris-level"><div>LEVEL</div><div>${level}</div></div>`;
    html += `<div class="tetris-lines"><div>LINES</div><div>${lines}</div></div>`;
    html += '</div></div>';
    
    gameArea.innerHTML = html;
  }
  
  function isCurrentPiece(r, c) {
    if (!currentPiece) return false;
    for (let pr = 0; pr < currentPiece.shape.length; pr++) {
      for (let pc = 0; pc < currentPiece.shape[pr].length; pc++) {
        if (currentPiece.shape[pr][pc]) {
          if (currentPiece.y + pr === r && currentPiece.x + pc === c) return true;
        }
      }
    }
    return false;
  }
  
  function renderNext() {
    if (!nextPiece) return '';
    let html = '<div class="tetris-next-grid">';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const hasBlock = nextPiece.shape[r] && nextPiece.shape[r][c];
        html += `<div class="tetris-next-cell ${hasBlock ? 'filled' : ''}" style="${hasBlock ? `background:${nextPiece.color}` : ''}"></div>`;
      }
    }
    html += '</div>';
    return html;
  }
  
  function init(player1, player2, vsAI) {
    if (dropInterval) clearInterval(dropInterval);
    document.removeEventListener('keydown', handleKey);

    p1 = player1;
    p2 = player2;
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    initBoard();
    currentPiece = createPiece();
    nextPiece = createPiece();
    updateSpeed();
    render();
    
    document.addEventListener('keydown', handleKey);
  }
  
  function handleKey(e) {
    if (gameOver) return;
    switch(e.key) {
      case 'ArrowLeft': move(-1); break;
      case 'ArrowRight': move(1); break;
      case 'ArrowDown': drop(); break;
      case 'ArrowUp': rotate(currentPiece); render(); break;
      case ' ': hardDrop(); break;
    }
  }
  
  function restart() {
    if (dropInterval) clearInterval(dropInterval);
    document.removeEventListener('keydown', handleKey);
    init(p1, p2, false);
  }
  
  return { init, restart };
})();
