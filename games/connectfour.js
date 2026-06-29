/**
 * RETRO GAME HUB — connectfour.js
 * Connect Four — drop discs, get 4 in a row to win!
 * Player vs Player or Player vs AI (minimax with alpha-beta)
 */

const ConnectFour = (() => {
  const ROWS = 6;
  const COLS = 7;
  const EMPTY = 0;
  const P1    = 1;
  const P2    = 2;

  let board       = [];
  let current     = P1;
  let scores      = { 1: 0, 2: 0 };
  let gameOver    = false;
  let vsAI        = false;
  let online      = false;
  let playerId    = P1;
  let p1name      = 'PLAYER 1';
  let p2name      = 'PLAYER 2';
  let winCells    = [];
  let aiThinking  = false;

  // ── Board helpers ─────────────────────────────────────────────
  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
  }

  function copyBoard(b) {
    return b.map(row => [...row]);
  }

  function getRow(b, col) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (b[r][col] === EMPTY) return r;
    }
    return -1; // column full
  }

  function validCols(b) {
    return Array.from({ length: COLS }, (_, c) => c).filter(c => getRow(b, c) !== -1);
  }

  function drop(b, col, player) {
    const r = getRow(b, col);
    if (r === -1) return null;
    const nb = copyBoard(b);
    nb[r][col] = player;
    return nb;
  }

  // ── Win detection ─────────────────────────────────────────────
  function checkWin(b, player) {
    // horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if ([0,1,2,3].every(i => b[r][c+i] === player))
          return [[r,c],[r,c+1],[r,c+2],[r,c+3]];
      }
    }
    // vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        if ([0,1,2,3].every(i => b[r+i][c] === player))
          return [[r,c],[r+1,c],[r+2,c],[r+3,c]];
      }
    }
    // diagonal down-right
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if ([0,1,2,3].every(i => b[r+i][c+i] === player))
          return [[r,c],[r+1,c+1],[r+2,c+2],[r+3,c+3]];
      }
    }
    // diagonal down-left
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 3; c < COLS; c++) {
        if ([0,1,2,3].every(i => b[r+i][c-i] === player))
          return [[r,c],[r+1,c-1],[r+2,c-2],[r+3,c-3]];
      }
    }
    return null;
  }

  function isDraw(b) {
    return validCols(b).length === 0;
  }

  // ── AI (minimax with alpha-beta pruning, depth 5) ─────────────
  function scoreWindow(window, player) {
    const opp = player === P1 ? P2 : P1;
    const pCount = window.filter(c => c === player).length;
    const eCount = window.filter(c => c === EMPTY).length;
    const oCount = window.filter(c => c === opp).length;
    if (pCount === 4)       return 100;
    if (pCount === 3 && eCount === 1) return 5;
    if (pCount === 2 && eCount === 2) return 2;
    if (oCount === 3 && eCount === 1) return -4;
    return 0;
  }

  function scoreBoard(b, player) {
    let score = 0;
    // centre column bonus
    const centre = b.map(r => r[Math.floor(COLS/2)]);
    score += centre.filter(c => c === player).length * 3;
    // horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += scoreWindow([b[r][c],b[r][c+1],b[r][c+2],b[r][c+3]], player);
      }
    }
    // vertical
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        score += scoreWindow([b[r][c],b[r+1][c],b[r+2][c],b[r+3][c]], player);
      }
    }
    // diagonals
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        score += scoreWindow([b[r][c],b[r+1][c+1],b[r+2][c+2],b[r+3][c+3]], player);
      }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 3; c < COLS; c++) {
        score += scoreWindow([b[r][c],b[r+1][c-1],b[r+2][c-2],b[r+3][c-3]], player);
      }
    }
    return score;
  }

  function minimax(b, depth, alpha, beta, maximising) {
    const w1 = checkWin(b, P1);
    const w2 = checkWin(b, P2);
    if (w2) return  10000 + depth;
    if (w1) return -10000 - depth;
    if (isDraw(b) || depth === 0) return scoreBoard(b, P2);

    const cols = validCols(b);
    if (maximising) {
      let best = -Infinity;
      for (const col of cols) {
        const nb = drop(b, col, P2);
        best = Math.max(best, minimax(nb, depth - 1, alpha, beta, false));
        alpha = Math.max(alpha, best);
        if (alpha >= beta) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const col of cols) {
        const nb = drop(b, col, P1);
        best = Math.min(best, minimax(nb, depth - 1, alpha, beta, true));
        beta = Math.min(beta, best);
        if (alpha >= beta) break;
      }
      return best;
    }
  }

  function getBestCol() {
    const cols = validCols(board);
    // immediate win
    for (const col of cols) {
      const nb = drop(board, col, P2);
      if (checkWin(nb, P2)) return col;
    }
    // block player win
    for (const col of cols) {
      const nb = drop(board, col, P1);
      if (checkWin(nb, P1)) return col;
    }
    // minimax
    let best = -Infinity, bestCol = cols[0];
    for (const col of cols) {
      const nb   = drop(board, col, P2);
      const val  = minimax(nb, 5, -Infinity, Infinity, false);
      if (val > best) { best = val; bestCol = col; }
    }
    return bestCol;
  }

  // ── Rendering ─────────────────────────────────────────────────
  function isWinCell(r, c) {
    return winCells.some(([wr, wc]) => wr === r && wc === c);
  }

  function render() {
    const area = document.getElementById('gameArea');

    // Column drop buttons
    let colBtns = '<div class="c4-col-btns">';
    for (let c = 0; c < COLS; c++) {
      const full    = getRow(board, c) === -1;
      const active  = !gameOver && !aiThinking && (!online ? !(vsAI && current === P2) : current === playerId);
      colBtns += `<button class="c4-drop-btn${full ? ' full' : ''}" data-col="${c}" ${(!active || full) ? 'disabled' : ''}>▼</button>`;
    }
    colBtns += '</div>';

    // Board grid
    let grid = '<div class="c4-board">';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const val = board[r][c];
        const win = isWinCell(r, c);
        let cls = 'c4-cell';
        if (val === P1) cls += ' p1';
        if (val === P2) cls += ' p2';
        if (win)        cls += ' win-cell';
        // animation: freshly placed (last row filled in col)
        grid += `<div class="${cls}"><div class="c4-disc"></div></div>`;
      }
    }
    grid += '</div>';

    // Status
    const name    = current === P1 ? p1name : p2name;
    const colour  = current === P1 ? 'var(--p1)' : 'var(--p2)';
    let statusTxt = gameOver ? '' : (aiThinking ? '🤖 AI is thinking...' : (online ? (current === playerId ? 'Your turn' : "Opponent's turn") : `${name}'s turn`));

    area.innerHTML = `
      <div class="c4-wrap">
        <div class="c4-scores">
          <div class="c4-score-chip p1">
            <span class="c4-disc-sm p1"></span>
            <span>${p1name}</span>
            <strong>${scores[1]}</strong>
          </div>
          <div class="c4-score-chip p2">
            <span class="c4-disc-sm p2"></span>
            <span>${vsAI ? 'CPU' : p2name}</span>
            <strong>${scores[2]}</strong>
          </div>
        </div>
        ${colBtns}
        ${grid}
        <div class="c4-status" id="c4Status" style="color:${colour}">${statusTxt}</div>
      </div>
    `;

    UI.setGameScores(p1name, scores[1], vsAI ? 'CPU' : p2name, scores[2]);
    attachEvents();
  }

  function attachEvents() {
    document.querySelectorAll('.c4-drop-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (gameOver || aiThinking) return;
        if (online && current !== playerId) return;
        if (vsAI && current === P2) return;
        handleDrop(parseInt(btn.dataset.col));
      });
      btn.addEventListener('mouseenter', () => {
        if (!btn.disabled) Sound.play('move');
      });
    });
  }

  // ── Drop logic ────────────────────────────────────────────────
  function handleDrop(col) {
    const r = getRow(board, col);
    if (r === -1) return;

    board[r][col] = current;
    Sound.play('place');

    if (online && current === playerId) {
      Network.broadcast('c4-move', { col });
    }

    const win = checkWin(board, current);
    if (win) {
      winCells = win;
      scores[current]++;
      render();
      endGame(current);
      return;
    }
    if (isDraw(board)) {
      render();
      setTimeout(() => {
        UI.showWinModal({
          title: "IT'S A DRAW!",
          subtitle: 'The board is full — nobody wins!',
          coins: null,
          onPlayAgain: softRestart,
          onHome: () => UI.showScreen('home'),
        });
        Sound.play('draw');
      }, 400);
      PlayerDB.recordGame('c4', false);
      return;
    }

    current = current === P1 ? P2 : P1;
    render();

    if (vsAI && current === P2 && !gameOver) {
      aiThinking = true;
      render();
      setTimeout(() => {
        const col = getBestCol();
        aiThinking = false;
        handleDrop(col);
      }, 450);
    }
  }

  function receiveRemoteMove(col) {
    if (gameOver) return;
    const r = getRow(board, col);
    if (r === -1) return;
    board[r][col] = current;
    Sound.play('place');

    const win = checkWin(board, current);
    if (win) {
      winCells = win;
      scores[current]++;
      render();
      endGame(current);
      return;
    }
    if (isDraw(board)) {
      render();
      setTimeout(() => {
        UI.showWinModal({
          title: "IT'S A DRAW!",
          subtitle: 'The board is full — nobody wins!',
          coins: null,
          onPlayAgain: softRestart,
          onHome: () => UI.showScreen('home'),
        });
        Sound.play('draw');
      }, 400);
      PlayerDB.recordGame('c4', false);
      return;
    }

    current = current === P1 ? P2 : P1;
    render();
  }

  function endGame(winner) {
    gameOver = true;
    const playerWon = winner === P1;
    let coinsAwarded = null;
    const player = PlayerDB.getCurrentPlayer();
    if (playerWon && player && player.id !== 'GUEST') {
      PlayerDB.awardCoins(12, 'c4');
      coinsAwarded = 12;
      UI.updateHUD();
    }
    PlayerDB.recordGame('c4', playerWon);

    const winnerName = winner === P1 ? p1name : (vsAI ? 'CPU' : p2name);
    Sound.play(playerWon || !vsAI ? 'win' : 'draw');

    setTimeout(() => {
      UI.showWinModal({
        title: `${winnerName} WINS!`,
        subtitle: winner === P1 ? '4 in a row — brilliant!' : 'CPU wins this round!',
        coins: coinsAwarded,
        onPlayAgain: softRestart,
        onHome: () => UI.showScreen('home'),
      });
    }, 700);
  }

  // soft restart keeps scores
  function softRestart() {
    board     = emptyBoard();
    current   = P1;
    gameOver  = false;
    winCells  = [];
    aiThinking = false;
    render();
  }

  function restart() {
    scores    = { 1: 0, 2: 0 };
    softRestart();
  }

  function init(p1, p2, ai, isOnline = false, playerIdx = 1) {
    online   = isOnline;
    playerId = playerIdx === 1 ? P1 : P2;
    vsAI     = isOnline ? false : ai;
    p1name   = isOnline ? (playerIdx === 1 ? (p1 || 'PLAYER 1') : 'REMOTE') : (p1 || 'PLAYER 1');
    p2name   = isOnline ? (playerIdx === 2 ? (p1 || 'PLAYER 1') : 'REMOTE') : (ai ? 'CPU' : (p2 || 'PLAYER 2'));
    restart();
    UI.setGameTitle('CONNECT FOUR');
    if (!isOnline) {
      document.getElementById('btnGameMode').textContent = vsAI ? '👥 VS HUMAN' : '🤖 VS AI';
      document.getElementById('btnGameMode').style.display = '';
    } else {
      document.getElementById('btnGameMode').style.display = 'none';
    }
  }

  return { init, restart, receiveRemoteMove };
})();

window.ConnectFour = ConnectFour;
