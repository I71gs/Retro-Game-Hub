/**
 * RETRO GAME HUB — dots.js
 * Dots & Boxes — 4x4 grid by default, AI opponent available
 */

const DotsGame = (() => {
  let SIZE = 4; // grid of SIZE x SIZE boxes
  let hLines = []; // horizontal lines: hLines[row][col] 0..SIZE rows, SIZE cols
  let vLines = []; // vertical lines:   vLines[row][col] SIZE rows, 0..SIZE cols
  let boxes  = []; // boxes[row][col] = null | 'p1' | 'p2'
  let currentPlayer = 1;
  let scores = { p1: 0, p2: 0 };
  let vsAI = false;
  let online = false;
  let playerId = 1;
  let gameOver = false;
  let p1name = 'P1', p2name = 'P2';

  const CELL = 60; // px per cell
  const DOT_R = 6;
  const PAD = 20;

  function initState(size) {
    SIZE = size || 4;
    hLines = Array.from({length: SIZE + 1}, () => Array(SIZE).fill(0));
    vLines = Array.from({length: SIZE}, () => Array(SIZE + 1).fill(0));
    boxes  = Array.from({length: SIZE}, () => Array(SIZE).fill(null));
    currentPlayer = 1;
    scores = { p1: 0, p2: 0 };
    gameOver = false;
  }

  function render() {
    const area = document.getElementById('gameArea');
    const W = SIZE * CELL + PAD * 2;
    const H = SIZE * CELL + PAD * 2;

    area.innerHTML = `
      <div class="dots-game-wrap">
        <div class="dots-score-board">
          <div class="dots-player-score p1${currentPlayer === 1 ? ' active-turn' : ''}">
            <span class="p-name">${p1name}</span>
            <span class="p-score">${scores.p1}</span>
          </div>
          <div class="dots-player-score p2${currentPlayer === 2 ? ' active-turn' : ''}">
            <span class="p-name">${p2name}</span>
            <span class="p-score">${scores.p2}</span>
          </div>
        </div>
        <div class="dots-grid-container">
          <svg class="dots-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
            ${renderBoxFills()}
            ${renderLines()}
            ${renderDots()}
            ${renderBoxLabels()}
          </svg>
        </div>
        <div id="dotsStatus" class="ttt-status"></div>
      </div>
    `;
    updateStatus();
    attachEvents();
    UI.setGameScores(p1name, scores.p1, p2name, scores.p2);
  }

  function cx(col) { return PAD + col * CELL; }
  function cy(row) { return PAD + row * CELL; }

  function renderBoxFills() {
    let svg = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const owner = boxes[r][c];
        if (owner) {
          svg += `<rect class="box-fill ${owner}" x="${cx(c)+1}" y="${cy(r)+1}" width="${CELL-2}" height="${CELL-2}"/>`;
        }
      }
    }
    return svg;
  }

  function renderBoxLabels() {
    let svg = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const owner = boxes[r][c];
        if (owner) {
          const label = owner === 'p1' ? '1' : '2';
          svg += `<text class="box-label ${owner}" x="${cx(c) + CELL/2}" y="${cy(r) + CELL/2 + 5}" text-anchor="middle">${label}</text>`;
        }
      }
    }
    return svg;
  }

  function renderLines() {
    let svg = '';
    // Horizontal lines
    for (let r = 0; r <= SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const taken = hLines[r][c];
        const cls = taken ? (taken === 1 ? 'taken-p1' : 'taken-p2') : '';
        svg += `<line class="line-btn ${cls}" data-type="h" data-r="${r}" data-c="${c}"
          x1="${cx(c) + DOT_R}" y1="${cy(r)}" x2="${cx(c+1) - DOT_R}" y2="${cy(r)}"/>`;
      }
    }
    // Vertical lines
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c <= SIZE; c++) {
        const taken = vLines[r][c];
        const cls = taken ? (taken === 1 ? 'taken-p1' : 'taken-p2') : '';
        svg += `<line class="line-btn ${cls}" data-type="v" data-r="${r}" data-c="${c}"
          x1="${cx(c)}" y1="${cy(r) + DOT_R}" x2="${cx(c)}" y2="${cy(r+1) - DOT_R}"/>`;
      }
    }
    return svg;
  }

  function renderDots() {
    let svg = '';
    for (let r = 0; r <= SIZE; r++) {
      for (let c = 0; c <= SIZE; c++) {
        svg += `<circle class="dot-circle" cx="${cx(c)}" cy="${cy(r)}" r="${DOT_R}" fill="var(--accent3)" filter="url(#glow)"/>`;
      }
    }
    return svg;
  }

  function attachEvents() {
    document.querySelectorAll('.line-btn').forEach(line => {
      if (line.classList.contains('taken-p1') || line.classList.contains('taken-p2')) return;
      line.addEventListener('click', () => {
        if (gameOver) return;
        if (online && currentPlayer !== playerId) return;
        if (vsAI && currentPlayer === 2) return;
        const type = line.dataset.type;
        const r = parseInt(line.dataset.r);
        const c = parseInt(line.dataset.c);
        handleMove(type, r, c);
      });
    });
  }

  function handleMove(type, r, c) {
    if (type === 'h' && hLines[r][c]) return;
    if (type === 'v' && vLines[r][c]) return;

    if (type === 'h') hLines[r][c] = currentPlayer;
    else vLines[r][c] = currentPlayer;

    Sound.play('place');
    const captured = checkCapture();
    if (captured > 0) {
      Sound.play('capture');
    }

    if (online && currentPlayer === playerId) {
      Network.broadcast('dots-move', { type, r, c });
    }

    render();
    checkGameOver();

    if (!gameOver && captured === 0) {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
    render();

    if (!gameOver && vsAI && currentPlayer === 2) {
      setTimeout(aiMove, 500);
    }
  }

  function receiveRemoteMove(type, r, c) {
    if (gameOver) return;
    if (type === 'h') hLines[r][c] = currentPlayer;
    else vLines[r][c] = currentPlayer;

    Sound.play('place');
    const captured = checkCapture();
    if (captured > 0) Sound.play('capture');

    render();
    checkGameOver();

    if (!gameOver && captured === 0) {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
    render();
  }

  function checkCapture() {
    let captured = 0;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!boxes[r][c] && isBoxComplete(r, c)) {
          boxes[r][c] = currentPlayer === 1 ? 'p1' : 'p2';
          scores[currentPlayer === 1 ? 'p1' : 'p2']++;
          captured++;
        }
      }
    }
    return captured;
  }

  function isBoxComplete(r, c) {
    return hLines[r][c] && hLines[r+1][c] && vLines[r][c] && vLines[r][c+1];
  }

  function checkGameOver() {
    const total = SIZE * SIZE;
    if (scores.p1 + scores.p2 >= total) {
      gameOver = true;
      let coinsAwarded = null;
      let winner, title, subtitle;

      if (scores.p1 > scores.p2) {
        winner = 'p1'; title = `${p1name} WINS!`;
        subtitle = `${scores.p1} vs ${scores.p2} — What a game!`;
        const player = PlayerDB.getCurrentPlayer();
        if (player && player.id !== 'GUEST') {
          PlayerDB.awardCoins(15, 'dots');
          coinsAwarded = 15;
          UI.updateHUD();
        }
        PlayerDB.recordGame('dots', true);
      } else if (scores.p2 > scores.p1) {
        winner = 'p2'; title = vsAI ? 'COMPUTER WINS!' : `${p2name} WINS!`;
        subtitle = `${scores.p2} vs ${scores.p1} — Better luck next time!`;
        PlayerDB.recordGame('dots', false);
      } else {
        title = "IT'S A DRAW!";
        subtitle = `${scores.p1} - ${scores.p2} — All squares taken!`;
        Sound.play('draw');
        PlayerDB.recordGame('dots', false);
      }

      setTimeout(() => {
        UI.showWinModal({
          title, subtitle,
          coins: coinsAwarded,
          onPlayAgain: restart,
          onHome: () => UI.showScreen('home'),
        });
      }, 600);
    }
  }

  function updateStatus() {
    const el = document.getElementById('dotsStatus');
    if (!el || gameOver) return;
    const name = currentPlayer === 1 ? p1name : p2name;
    el.textContent = `${name}'s turn`;
    el.style.color = currentPlayer === 1 ? 'var(--p1)' : 'var(--p2)';
  }

  // ===== AI =====
  function aiMove() {
    if (gameOver) return;
    // Strategy: 1) complete a box, 2) safe move, 3) random
    const move = findCapturingMove() || findSafeMove() || randomMove();
    if (move) handleMove(move.type, move.r, move.c);
  }

  function getAllMoves() {
    const moves = [];
    for (let r = 0; r <= SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (!hLines[r][c]) moves.push({ type: 'h', r, c });
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c <= SIZE; c++)
        if (!vLines[r][c]) moves.push({ type: 'v', r, c });
    return moves;
  }

  function wouldCapture(type, r, c) {
    const sim_h = JSON.parse(JSON.stringify(hLines));
    const sim_v = JSON.parse(JSON.stringify(vLines));
    if (type === 'h') sim_h[r][c] = 2; else sim_v[r][c] = 2;
    let cap = 0;
    for (let br = 0; br < SIZE; br++)
      for (let bc = 0; bc < SIZE; bc++)
        if (!boxes[br][bc] && sim_h[br][bc] && sim_h[br+1][bc] && sim_v[br][bc] && sim_v[br][bc+1])
          cap++;
    return cap;
  }

  function countSidesAfter(type, r, c, br, bc) {
    let sides = 0;
    if (type === 'h' ? (r === br) : false) {}
    // simplified: count current sides of box
    if (hLines[br][bc]) sides++;
    if (hLines[br+1] && hLines[br+1][bc]) sides++;
    if (vLines[br][bc]) sides++;
    if (vLines[br][bc+1]) sides++;
    return sides;
  }

  function findCapturingMove() {
    for (const m of getAllMoves())
      if (wouldCapture(m.type, m.r, m.c) > 0) return m;
    return null;
  }

  function findSafeMove() {
    // find a move that doesn't give opponent a 3-sided box
    for (const m of getAllMoves()) {
      const sim_h = JSON.parse(JSON.stringify(hLines));
      const sim_v = JSON.parse(JSON.stringify(vLines));
      if (m.type === 'h') sim_h[m.r][m.c] = 2; else sim_v[m.r][m.c] = 2;
      let unsafe = false;
      for (let br = 0; br < SIZE; br++) {
        for (let bc = 0; bc < SIZE; bc++) {
          if (boxes[br][bc]) continue;
          let s = (sim_h[br][bc] ? 1 : 0) + ((sim_h[br+1] && sim_h[br+1][bc]) ? 1 : 0)
                + (sim_v[br][bc] ? 1 : 0) + ((sim_v[br][bc+1]) ? 1 : 0);
          if (s === 3) { unsafe = true; break; }
        }
        if (unsafe) break;
      }
      if (!unsafe) return m;
    }
    return null;
  }

  function randomMove() {
    const moves = getAllMoves();
    if (!moves.length) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  function restart() {
    initState(SIZE);
    render();
  }

  function init(p1, p2, ai, isOnline = false, playerIdx = 1) {
    online = isOnline;
    playerId = playerIdx;
    vsAI = isOnline ? false : ai;
    p1name = isOnline ? (playerIdx === 1 ? (p1 || 'PLAYER 1') : 'REMOTE') : (p1 || 'PLAYER 1');
    p2name = isOnline ? (playerIdx === 2 ? (p1 || 'PLAYER 1') : 'REMOTE') : (ai ? 'COMPUTER' : (p2 || 'PLAYER 2'));
    initState(4);
    render();
    UI.setGameTitle('DOTS & BOXES');
    if (!isOnline) {
      document.getElementById('btnGameMode').textContent = vsAI ? '👥 VS HUMAN' : '🤖 VS AI';
      document.getElementById('btnGameMode').style.display = '';
    } else {
      document.getElementById('btnGameMode').style.display = 'none';
    }
  }

  return { init, restart, receiveRemoteMove };
})();

window.DotsGame = DotsGame;
