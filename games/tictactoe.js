/**
 * RETRO GAME HUB — tictactoe.js
 * Tic-Tac-Toe with AI (minimax) and 2-player mode
 */

const TicTacToe = (() => {
  let board = Array(9).fill(null);
  let currentPlayer = 'X';
  let scores = { X: 0, O: 0 };
  let vsAI = false;
  let online = false;
  let playerSymbol = 'X';
  let gameOver = false;
  let p1name = 'P1', p2name = 'P2';

  const WINS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function checkWinner(b) {
    for (const [a, c, d] of WINS) {
      if (b[a] && b[a] === b[c] && b[a] === b[d])
        return { winner: b[a], line: [a, c, d] };
    }
    if (b.every(Boolean)) return { winner: 'draw' };
    return null;
  }

  function minimax(b, depth, isMax) {
    const r = checkWinner(b);
    if (r) {
      if (r.winner === 'O') return 10 - depth;
      if (r.winner === 'X') return depth - 10;
      return 0;
    }
    let best = isMax ? -Infinity : Infinity;
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = isMax ? 'O' : 'X';
      const score = minimax(b, depth + 1, !isMax);
      b[i] = null;
      best = isMax ? Math.max(best, score) : Math.min(best, score);
    }
    return best;
  }

  function getBestMove() {
    let best = -Infinity, move = -1;
    const b = [...board];
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = 'O';
      const s = minimax(b, 0, false);
      b[i] = null;
      if (s > best) { best = s; move = i; }
    }
    return move;
  }

  function render() {
    const area = document.getElementById('gameArea');
    area.innerHTML = `
      <div class="ttt-board" id="tttBoard">
        ${board.map((cell, i) => `
          <div class="ttt-cell${cell ? ' taken ' + cell.toLowerCase() : ''}" data-i="${i}">
            ${cell || ''}
          </div>
        `).join('')}
      </div>
      <div class="ttt-status" id="tttStatus"></div>
    `;
    updateStatus();
    document.querySelectorAll('.ttt-cell').forEach(cell => {
      cell.addEventListener('click', () => handleClick(parseInt(cell.dataset.i)));
    });
    UI.setGameScores(p1name, scores.X, p2name, scores.O);
  }

  function updateStatus() {
    const el = document.getElementById('tttStatus');
    if (!el) return;
    if (gameOver) return;
    const name = currentPlayer === 'X' ? p1name : p2name;
    el.textContent = `${name}'s turn  (${currentPlayer})`;
    el.style.color = currentPlayer === 'X' ? 'var(--p1)' : 'var(--p2)';
  }

  function handleClick(i) {
    if (gameOver || board[i]) return;
    if (online && currentPlayer !== playerSymbol) return;
    if (vsAI && currentPlayer === 'O') return;
    makeMove(i);
  }

  function makeMove(i) {
    board[i] = currentPlayer;
    Sound.play('move');
    render();

    // animate placed cell
    const cells = document.querySelectorAll('.ttt-cell');
    cells[i].classList.add('pop');

    if (online) {
      Network.broadcast('ttt-move', { index: i, player: currentPlayer });
    }

    const result = checkWinner(board);
    if (result) {
      endGame(result);
      return;
    }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if (vsAI && currentPlayer === 'O' && !gameOver) {
      setTimeout(aiMove, 420);
    }
  }

  function aiMove() {
    if (gameOver) return;
    const m = getBestMove();
    if (m === -1) return;
    makeMove(m);
  }

  function endGame(result) {
    gameOver = true;
    const cells = document.querySelectorAll('.ttt-cell');

    if (result.winner === 'draw') {
      document.getElementById('tttStatus').textContent = "IT'S A DRAW!";
      document.getElementById('tttStatus').style.color = 'var(--accent3)';
      Sound.play('draw');
      setTimeout(() => {
        UI.showWinModal({
          title: "DRAW!",
          subtitle: "Nobody wins this round...",
          coins: null,
          onPlayAgain: restart,
          onHome: () => UI.showScreen('home'),
        });
      }, 600);
      PlayerDB.recordGame('ttt', false);
    } else {
      result.line.forEach(i => cells[i].classList.add('win-cell'));
      const winnerName = result.winner === 'X' ? p1name : p2name;
      document.getElementById('tttStatus').textContent = `${winnerName} WINS!`;
      document.getElementById('tttStatus').style.color = result.winner === 'X' ? 'var(--p1)' : 'var(--p2)';
      scores[result.winner]++;

      let coinsAwarded = null;
      const player = PlayerDB.getCurrentPlayer();
      const localWin = online ? result.winner === playerSymbol : (result.winner === 'X' || !vsAI);
      if (player && player.id !== 'GUEST' && localWin) {
        PlayerDB.awardCoins(10, 'ttt');
        coinsAwarded = 10;
        UI.updateHUD();
      }
      PlayerDB.recordGame('ttt', localWin);

      setTimeout(() => {
        UI.showWinModal({
          title: "WINNER!",
          subtitle: `${winnerName} wins the match!`,
          coins: coinsAwarded,
          onPlayAgain: restart,
          onHome: () => UI.showScreen('home'),
        });
      }, 700);
    }
  }

  function restart() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    gameOver = false;
    render();
  }

  function receiveRemoteMove(i) {
    if (gameOver || board[i]) return;
    board[i] = currentPlayer;
    Sound.play('move');
    render();

    const result = checkWinner(board);
    if (result) {
      endGame(result);
      return;
    }
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
  }

  function init(p1, p2, ai, isOnline = false, playerIdx = 1) {
    online = isOnline;
    playerSymbol = playerIdx === 1 ? 'X' : 'O';
    vsAI = isOnline ? false : ai;
    scores = { X: 0, O: 0 };

    if (isOnline) {
      if (playerIdx === 1) {
        p1name = p1 || 'PLAYER 1';
        p2name = 'REMOTE';
      } else {
        p1name = 'REMOTE';
        p2name = p1 || 'PLAYER 1';
      }
    } else {
      p1name = p1 || 'PLAYER 1';
      p2name = ai ? 'COMPUTER' : (p2 || 'PLAYER 2');
    }

    restart();
    UI.setGameTitle('TIC-TAC-TOE');
    if (!isOnline) {
      document.getElementById('btnGameMode').textContent = vsAI ? '👥 VS HUMAN' : '🤖 VS AI';
    }
  }

  return { init, restart, receiveRemoteMove, toggleAI: (ai) => { vsAI = ai; } };
})();

window.TicTacToe = TicTacToe;
