/**
 * RETRO GAME HUB — snl.js
 * Snakes & Ladders — classic 10×10 board, 2-4 players
 */

const SnakesLadders = (() => {
  const SNAKES = { 99:17, 95:52, 87:24, 64:60, 54:34, 17:7 };
  const LADDERS = { 4:14, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91 };
  const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const TOKENS = ['🔴','🔵','🟢','🟡'];
  const COLORS = ['var(--p1)','var(--p2)','var(--p3)','var(--p4)'];

  let players = [];
  let numPlayers = 2;
  let currentPlayer = 0;
  let playerId = 0;
  let online = false;
  let lastRoll = 0;
  let rolling = false;
  let gameOver = false;
  let log = [];
  let vsAI = false;

  function buildBoard() {
    // 10x10 board, snaking right-to-left on even rows (from top)
    const cells = Array(101).fill(null); // 1-indexed
    for (let num = 1; num <= 100; num++) cells[num] = num;
    return cells;
  }

  function cellToGrid(n) {
    // n: 1-100, returns {row, col} for table (row 0 = top = squares 91-100)
    const row9 = Math.floor((n - 1) / 10); // 0 = squares 1-10, 9 = 91-100
    const posInRow = (n - 1) % 10;
    const tableRow = 9 - row9; // flip so 1 is at bottom
    const col = (row9 % 2 === 0) ? posInRow : (9 - posInRow); // snake pattern
    return { row: tableRow, col };
  }

  function renderBoard() {
    // Build 10x10 table
    const rows = Array.from({length:10}, () => Array(10).fill(0));
    for (let n = 1; n <= 100; n++) {
      const {row, col} = cellToGrid(n);
      rows[row][col] = n;
    }

    // Build player position map
    const posMap = {};
    players.forEach((p, i) => {
      if (p.pos > 0) {
        if (!posMap[p.pos]) posMap[p.pos] = [];
        posMap[p.pos].push(i);
      }
    });

    let html = '<table class="snl-table">';
    for (let r = 0; r < 10; r++) {
      html += '<tr>';
      for (let c = 0; c < 10; c++) {
        const n = rows[r][c];
        let cls = '';
        if (SNAKES[n]) cls = 'snake-head';
        else if (Object.values(SNAKES).includes(n)) cls = 'snake-tail';
        else if (LADDERS[n]) cls = 'ladder-bottom';
        else if (Object.values(LADDERS).includes(n)) cls = 'ladder-top';

        let content = `<span class="snl-cell-num">${n}</span>`;
        if (SNAKES[n]) content += `<span class="snl-special">🐍</span>`;
        else if (LADDERS[n]) content += `<span class="snl-special">🪜</span>`;

        if (posMap[n]) {
          content += posMap[n].map(pi => `<span class="snl-token">${TOKENS[pi]}</span>`).join('');
        }

        html += `<td class="snl-td ${cls}">${content}</td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }

  function addLog(msg) {
    log.unshift(msg);
    if (log.length > 10) log.pop();
  }

  function render() {
    const area = document.getElementById('gameArea');
    const p = players[currentPlayer];
    const playerChips = players.map((pl, i) => `
      <div class="snl-player-chip${i === currentPlayer && !gameOver ? ' active' : ''}" style="border-color:${COLORS[i]}">
        <span class="chip-avatar">${TOKENS[i]}</span>
        <div class="chip-info">
          <span class="chip-name" style="color:${COLORS[i]}">${pl.name}</span>
          <span class="chip-pos" style="color:${COLORS[i]}">POS: ${pl.pos}</span>
        </div>
      </div>
    `).join('');

    area.innerHTML = `
      <div class="snl-wrap">
        <div class="snl-players">${playerChips}</div>
        <div class="snl-board-wrap">${renderBoard()}</div>
        <div class="snl-dice-area">
          <div class="snl-dice" id="snlDice" title="Click to roll">${lastRoll ? DICE_FACES[lastRoll-1] : '🎲'}</div>
          <div class="snl-status" id="snlStatus"></div>
          <div class="snl-log" id="snlLog">${log.map(l=>`<p>${l}</p>`).join('')}</div>
        </div>
      </div>
    `;
    updateStatus();
    document.getElementById('snlDice').addEventListener('click', rollDice);
    UI.setGameScores(players[0].name, players[0].pos, players[1]?.name || '', players[1]?.pos || 0);
  }

  function updateStatus() {
    const el = document.getElementById('snlStatus');
    if (!el) return;
    if (gameOver) return;
    const p = players[currentPlayer];
    if (online) {
      if (currentPlayer === playerId) {
        el.textContent = `${p.name}'s turn — click dice!`;
      } else {
        el.textContent = `Opponent's turn — waiting for roll...`;
      }
    } else {
      el.textContent = `${p.name}'s turn — click dice!`;
    }
    el.style.color = COLORS[currentPlayer];
  }

  function rollDice() {
    if (rolling || gameOver) return;
    if (online && currentPlayer !== playerId) return;
    const p = players[currentPlayer];
    if (vsAI && currentPlayer > 0) return; // AI handles own rolls

    rolling = true;
    Sound.play('roll');
    const dice = document.getElementById('snlDice');
    if (dice) dice.classList.add('rolling');

    // animate dice faces
    let ticks = 0;
    const ticker = setInterval(() => {
      const face = Math.floor(Math.random() * 6);
      if (dice) dice.textContent = DICE_FACES[face];
      ticks++;
      if (ticks >= 8) {
        clearInterval(ticker);
        const result = Math.floor(Math.random() * 6) + 1;
        lastRoll = result;
        if (dice) { dice.textContent = DICE_FACES[result-1]; dice.classList.remove('rolling'); }
        setTimeout(() => processMove(result), 200);
      }
    }, 60);
  }

  function processMove(roll) {
    const p = players[currentPlayer];
    const oldPos = p.pos;
    let newPos = p.pos + roll;

    addLog(`${p.name} rolled ${roll} — moved to ${Math.min(newPos, 100)}`);

    if (newPos > 100) {
      addLog(`${p.name} needs exact roll to win!`);
      newPos = oldPos; // bounce back rule
    }
    p.pos = newPos;

    let extra = '';
    if (SNAKES[newPos]) {
      setTimeout(() => {
        Sound.play('snake');
        p.pos = SNAKES[newPos];
        addLog(`🐍 ${p.name} hit a snake! Slid down to ${SNAKES[newPos]}`);
        rolling = false;
        endTurn();
      }, 400);
      render();
      return;
    }
    if (LADDERS[newPos]) {
      setTimeout(() => {
        Sound.play('ladder');
        p.pos = LADDERS[newPos];
        addLog(`🪜 ${p.name} climbed a ladder to ${LADDERS[newPos]}!`);
        rolling = false;
        endTurn();
      }, 400);
      render();
      return;
    }

    if (online && currentPlayer === playerId) {
      Network.broadcast('snl-roll', { roll });
    }

    rolling = false;

    if (p.pos === 100) {
      setTimeout(() => winGame(currentPlayer), 300);
    } else {
      endTurn();
    }
    render();
  }

  function receiveRemoteMove(roll) {
    if (gameOver) return;
    if (!online) return;
    if (currentPlayer === playerId) return;
    lastRoll = roll;
    processMove(roll);
  }

  function endTurn() {
    currentPlayer = (currentPlayer + 1) % numPlayers;
    render();
    if (vsAI && currentPlayer > 0 && !gameOver) {
      setTimeout(aiTurn, 900);
    }
  }

  function aiTurn() {
    if (gameOver) return;
    rolling = true;
    Sound.play('roll');
    const roll = Math.floor(Math.random() * 6) + 1;
    lastRoll = roll;
    setTimeout(() => processMove(roll), 400);
  }

  function winGame(playerIdx) {
    gameOver = true;
    const winner = players[playerIdx];
    addLog(`🏆 ${winner.name} WINS THE GAME!`);
    render();

    let coinsAwarded = null;
    const dbPlayer = PlayerDB.getCurrentPlayer();
    if (dbPlayer && dbPlayer.id !== 'GUEST' && playerIdx === 0) {
      PlayerDB.awardCoins(20, 'snl');
      coinsAwarded = 20;
      UI.updateHUD();
    }
    PlayerDB.recordGame('snl', playerIdx === 0);

    setTimeout(() => {
      UI.showWinModal({
        title: `${winner.name} WINS!`,
        subtitle: `Reached square 100 — incredible journey!`,
        coins: coinsAwarded,
        onPlayAgain: restart,
        onHome: () => UI.showScreen('home'),
      });
    }, 600);
  }

  function restart() {
    players.forEach(p => p.pos = 0);
    currentPlayer = 0;
    lastRoll = 0;
    rolling = false;
    gameOver = false;
    log = [];
    render();
  }

  function init(p1, p2, ai, count, isOnline = false, playerIdx = 1) {
    online = isOnline;
    playerId = playerIdx === 1 ? 0 : 1;
    vsAI = isOnline ? false : ai;
    numPlayers = count || 2;
    const player = PlayerDB.getCurrentPlayer();
    players = [];
    const names = [
      p1 || (player?.id !== 'GUEST' ? player?.id : 'PLAYER 1') || 'PLAYER 1',
      ai ? 'COMPUTER' : (p2 || 'PLAYER 2'),
      'PLAYER 3',
      'PLAYER 4',
    ];
    for (let i = 0; i < numPlayers; i++) {
      players.push({ name: names[i], pos: 0 });
    }
    currentPlayer = 0;
    lastRoll = 0;
    rolling = false;
    gameOver = false;
    log = ['🎮 Game started! Click the dice to play.'];
    render();
    UI.setGameTitle('SNAKES & LADDERS');
    if (!isOnline) {
      document.getElementById('btnGameMode').textContent = vsAI ? '👥 VS HUMAN' : '🤖 VS AI';
      document.getElementById('btnGameMode').style.display = '';
    } else {
      document.getElementById('btnGameMode').style.display = 'none';
    }
  }

  return { init, restart, receiveRemoteMove };
})();

window.SnakesLadders = SnakesLadders;
