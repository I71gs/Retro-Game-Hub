/**
 * RETRO GAME HUB — battleship.js
 * Classic Battleship — place ships, sink the enemy fleet!
 * Player vs AI with smart hunt/target AI logic
 */

const Battleship = (() => {
  const GRID  = 10;
  const SHIPS = [
    { name: 'Carrier',    size: 5, symbol: '🚢' },
    { name: 'Battleship', size: 4, symbol: '⚓' },
    { name: 'Cruiser',    size: 3, symbol: '🛥️' },
    { name: 'Submarine',  size: 3, symbol: '🤿' },
    { name: 'Destroyer',  size: 2, symbol: '⛵' },
  ];

  let playerBoard = [];
  let aiBoard     = [];
  let playerShips = [];
  let aiShips     = [];
  let playerHits  = [];   // cells player has fired at
  let aiHits      = [];   // cells AI has fired at
  let gameOver    = false;
  let placing     = true; // placement phase
  let currentShipIdx = 0;
  let horizontal  = true;
  let p1name      = 'PLAYER';

  // AI hunt/target state
  let aiMode      = 'hunt';   // 'hunt' | 'target'
  let aiLastHit   = null;
  let aiTargetQueue = [];

  // ── Board helpers ─────────────────────────────────────────────
  function emptyBoard() {
    return Array.from({ length: GRID }, () => Array(GRID).fill(0));
  }

  function inBounds(r, c) {
    return r >= 0 && r < GRID && c >= 0 && c < GRID;
  }

  function canPlace(board, r, c, size, horiz) {
    for (let i = 0; i < size; i++) {
      const rr = horiz ? r : r + i;
      const cc = horiz ? c + i : c;
      if (!inBounds(rr, cc) || board[rr][cc] !== 0) return false;
    }
    return true;
  }

  function placeShip(board, ships, r, c, size, horiz, shipIdx) {
    const cells = [];
    for (let i = 0; i < size; i++) {
      const rr = horiz ? r : r + i;
      const cc = horiz ? c + i : c;
      board[rr][cc] = shipIdx + 1;
      cells.push([rr, cc]);
    }
    ships.push({ cells, hits: 0, sunk: false, size, name: SHIPS[shipIdx].name });
  }

  function placeAIShips() {
    aiBoard = emptyBoard();
    aiShips = [];
    SHIPS.forEach((s, idx) => {
      let placed = false;
      while (!placed) {
        const horiz = Math.random() > 0.5;
        const r = Math.floor(Math.random() * GRID);
        const c = Math.floor(Math.random() * GRID);
        if (canPlace(aiBoard, r, c, s.size, horiz)) {
          placeShip(aiBoard, aiShips, r, c, s.size, horiz, idx);
          placed = true;
        }
      }
    });
  }

  function checkSunk(ships, r, c) {
    for (const ship of ships) {
      if (ship.sunk) continue;
      const hit = ship.cells.find(([sr, sc]) => sr === r && sc === c);
      if (hit) {
        ship.hits++;
        if (ship.hits >= ship.size) { ship.sunk = true; return ship; }
        return null;
      }
    }
    return null;
  }

  function allSunk(ships) {
    return ships.every(s => s.sunk);
  }

  // ── Rendering ─────────────────────────────────────────────────
  function cellKey(r, c) { return r * GRID + c; }

  function renderCell(r, c, board, fired, showShips, interactive, onClick) {
    const key     = cellKey(r, c);
    const hasFire = fired.includes(key);
    const shipId  = board[r][c];
    let cls = 'bs-cell';
    let content = '';

    if (hasFire) {
      if (shipId > 0) {
        // check if sunk
        const ships = showShips ? playerShips : aiShips;
        const ship  = ships[shipId - 1];
        if (ship && ship.sunk) {
          cls += ' sunk';
          content = '💥';
        } else {
          cls += ' hit';
          content = '🔥';
        }
      } else {
        cls += ' miss';
        content = '🌊';
      }
    } else if (showShips && shipId > 0) {
      cls += ' ship';
      content = SHIPS[shipId - 1].symbol;
    }

    if (interactive && !hasFire && !gameOver) cls += ' targetable';

    return `<div class="${cls}" data-r="${r}" data-c="${c}" ${interactive ? 'data-target="1"' : ''}>${content}</div>`;
  }

  function renderPlacementGrid() {
    const ship = SHIPS[currentShipIdx];
    let html = `
      <div class="bs-wrap">
        <div class="bs-phase-title">PLACE YOUR SHIPS</div>
        <div class="bs-ship-info">
          Placing: ${ship.symbol} <strong>${ship.name}</strong> (${ship.size} cells)
          &nbsp;|&nbsp; 
          <button class="bs-rotate-btn" id="bsRotate">${horizontal ? '↔ HORIZONTAL' : '↕ VERTICAL'}</button>
        </div>
        <div class="bs-ships-remaining">
          ${SHIPS.map((s, i) => `<span class="bs-ship-pip ${i < currentShipIdx ? 'placed' : i === currentShipIdx ? 'active' : ''}">${s.symbol}</span>`).join('')}
        </div>
        <div class="bs-grid placement-grid" id="placementGrid">
    `;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const shipId = playerBoard[r][c];
        let cls = 'bs-cell';
        if (shipId > 0) { cls += ' ship placed'; }
        html += `<div class="${cls}" data-r="${r}" data-c="${c}" data-place="1">${shipId > 0 ? SHIPS[shipId-1].symbol : ''}</div>`;
      }
    }
    html += `</div>
        <button class="retro-btn small secondary" id="bsAutoPlace">⚡ AUTO PLACE</button>
      </div>`;
    return html;
  }

  function renderBattleGrids() {
    let playerGrid = '<div class="bs-grid">';
    let aiGrid     = '<div class="bs-grid" id="aiGrid">';

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        playerGrid += renderCell(r, c, playerBoard, aiHits,     true,  false, null);
        aiGrid     += renderCell(r, c, aiBoard,     playerHits, false, true,  true);
      }
    }
    playerGrid += '</div>';
    aiGrid     += '</div>';

    const pSunk = playerShips.filter(s => s.sunk).length;
    const aSunk = aiShips.filter(s => s.sunk).length;

    return `
      <div class="bs-wrap">
        <div class="bs-boards">
          <div class="bs-board-section">
            <div class="bs-board-label">YOUR FLEET</div>
            <div class="bs-fleet-status">
              ${playerShips.map(s => `<span class="bs-ship-status ${s.sunk ? 'sunk' : 'alive'}" title="${s.name}">${SHIPS[SHIPS.findIndex(sh=>sh.name===s.name)].symbol}</span>`).join('')}
            </div>
            ${playerGrid}
          </div>
          <div class="bs-board-section">
            <div class="bs-board-label">ENEMY WATERS</div>
            <div class="bs-fleet-status">
              ${aiShips.map(s => `<span class="bs-ship-status ${s.sunk ? 'sunk' : 'alive'}" title="${s.name}">${s.sunk ? '💀' : '❓'}</span>`).join('')}
            </div>
            ${aiGrid}
          </div>
        </div>
        <div class="bs-status" id="bsStatus">🎯 YOUR TURN — Click enemy waters to fire!</div>
        <div class="bs-score">
          <span class="bs-score-item p1">Your sinks: ${pSunk > 0 ? '💥'.repeat(pSunk) : '—'}</span>
          <span class="bs-score-item p2">Enemy sinks: ${aSunk > 0 ? '💥'.repeat(aSunk) : '—'}</span>
        </div>
      </div>
    `;
  }

  // ── Render main ───────────────────────────────────────────────
  function render() {
    const area = document.getElementById('gameArea');
    area.innerHTML = placing ? renderPlacementGrid() : renderBattleGrids();
    attachEvents();
    UI.setGameTitle('BATTLESHIP');
  }

  // ── Placement preview on hover ────────────────────────────────
  function attachPlacementHover() {
    const grid = document.getElementById('placementGrid');
    if (!grid) return;
    grid.addEventListener('mouseover', e => {
      const cell = e.target.closest('[data-place]');
      if (!cell) return;
      const r = parseInt(cell.dataset.r);
      const c = parseInt(cell.dataset.c);
      const ship = SHIPS[currentShipIdx];
      // clear previews
      grid.querySelectorAll('.bs-cell.preview, .bs-cell.preview-bad').forEach(el => {
        el.classList.remove('preview', 'preview-bad');
      });
      const ok = canPlace(playerBoard, r, c, ship.size, horizontal);
      for (let i = 0; i < ship.size; i++) {
        const rr = horizontal ? r : r + i;
        const cc = horizontal ? c + i : c;
        if (!inBounds(rr, cc)) continue;
        const idx = rr * GRID + cc;
        const el = grid.children[idx];
        if (el) el.classList.add(ok ? 'preview' : 'preview-bad');
      }
    });
    grid.addEventListener('mouseleave', () => {
      grid.querySelectorAll('.bs-cell.preview, .bs-cell.preview-bad').forEach(el => {
        el.classList.remove('preview', 'preview-bad');
      });
    });
  }

  // ── Events ────────────────────────────────────────────────────
  function attachEvents() {
    if (placing) {
      attachPlacementHover();

      const grid = document.getElementById('placementGrid');
      if (grid) {
        grid.addEventListener('click', e => {
          const cell = e.target.closest('[data-place]');
          if (!cell) return;
          const r = parseInt(cell.dataset.r);
          const c = parseInt(cell.dataset.c);
          const ship = SHIPS[currentShipIdx];
          if (!canPlace(playerBoard, r, c, ship.size, horizontal)) {
            Sound.play('error');
            return;
          }
          placeShip(playerBoard, playerShips, r, c, ship.size, horizontal, currentShipIdx);
          Sound.play('place');
          currentShipIdx++;
          if (currentShipIdx >= SHIPS.length) {
            // all ships placed — start battle
            placing = false;
            placeAIShips();
            render();
            return;
          }
          render();
        });
      }

      const rotBtn = document.getElementById('bsRotate');
      if (rotBtn) {
        rotBtn.addEventListener('click', () => {
          horizontal = !horizontal;
          Sound.play('click');
          render();
        });
      }

      const autoBtn = document.getElementById('bsAutoPlace');
      if (autoBtn) {
        autoBtn.addEventListener('click', () => {
          autoPlacePlayerShips();
          placing = false;
          placeAIShips();
          Sound.play('select');
          render();
        });
      }

    } else {
      const aiGrid = document.getElementById('aiGrid');
      if (aiGrid) {
        aiGrid.addEventListener('click', e => {
          const cell = e.target.closest('[data-target]');
          if (!cell || gameOver) return;
          const r = parseInt(cell.dataset.r);
          const c = parseInt(cell.dataset.c);
          const key = cellKey(r, c);
          if (playerHits.includes(key)) return;
          playerFire(r, c);
        });
      }
    }
  }

  // ── Player fires ──────────────────────────────────────────────
  function playerFire(r, c) {
    const key = cellKey(r, c);
    playerHits.push(key);
    const status = document.getElementById('bsStatus');

    if (aiBoard[r][c] > 0) {
      Sound.play('capture');
      const sunk = checkSunk(aiShips, r, c);
      if (sunk) {
        if (status) status.textContent = `💥 You sunk the ${sunk.name}!`;
        Sound.play('win');
        if (allSunk(aiShips)) { endGame(true); return; }
      } else {
        if (status) status.textContent = '🔥 HIT! Fire again!';
      }
      render();
      return; // player gets another turn on hit
    } else {
      Sound.play('move');
      if (status) status.textContent = '🌊 Miss! AI is firing...';
      render();
      setTimeout(aiFire, 900);
    }
  }

  // ── AI fires ──────────────────────────────────────────────────
  function aiFire() {
    if (gameOver) return;
    let r, c, key;

    if (aiMode === 'target' && aiTargetQueue.length > 0) {
      [r, c] = aiTargetQueue.shift();
      key = cellKey(r, c);
      if (aiHits.includes(key) || !inBounds(r, c)) {
        aiFire(); return;
      }
    } else {
      aiMode = 'hunt';
      // checkerboard hunt pattern
      let attempts = 0;
      do {
        r = Math.floor(Math.random() * GRID);
        c = Math.floor(Math.random() * GRID);
        key = cellKey(r, c);
        attempts++;
      } while (aiHits.includes(key) && attempts < 200);
    }

    aiHits.push(key);
    const status = document.getElementById('bsStatus');

    if (playerBoard[r][c] > 0) {
      Sound.play('snake');
      const sunk = checkSunk(playerShips, r, c);
      if (sunk) {
        aiMode = 'hunt';
        aiTargetQueue = [];
        if (status) status.textContent = `💀 AI sunk your ${sunk.name}!`;
        if (allSunk(playerShips)) { endGame(false); return; }
      } else {
        // add neighbours to target queue
        aiMode = 'target';
        aiLastHit = [r, c];
        [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([nr,nc]) => {
          if (inBounds(nr,nc) && !aiHits.includes(cellKey(nr,nc))) {
            aiTargetQueue.push([nr, nc]);
          }
        });
        if (status) status.textContent = '🔥 AI scored a hit on your fleet!';
      }
    } else {
      if (status) status.textContent = '🎯 YOUR TURN — AI missed!';
    }
    render();
  }

  // ── Auto place player ships ───────────────────────────────────
  function autoPlacePlayerShips() {
    playerBoard = emptyBoard();
    playerShips = [];
    SHIPS.forEach((s, idx) => {
      let placed = false;
      while (!placed) {
        const horiz = Math.random() > 0.5;
        const r = Math.floor(Math.random() * GRID);
        const c = Math.floor(Math.random() * GRID);
        if (canPlace(playerBoard, r, c, s.size, horiz)) {
          placeShip(playerBoard, playerShips, r, c, s.size, horiz, idx);
          placed = true;
        }
      }
    });
  }

  // ── End game ──────────────────────────────────────────────────
  function endGame(playerWon) {
    gameOver = true;
    let coinsAwarded = null;
    const player = PlayerDB.getCurrentPlayer();
    if (playerWon && player && player.id !== 'GUEST') {
      PlayerDB.awardCoins(25, 'bs');
      coinsAwarded = 25;
      UI.updateHUD();
    }
    PlayerDB.recordGame('bs', playerWon);

    setTimeout(() => {
      UI.showWinModal({
        title:    playerWon ? '🚢 FLEET DESTROYED!' : '💀 FLEET SUNK!',
        subtitle: playerWon ? 'You sunk the entire enemy fleet!' : 'The AI sunk your entire fleet!',
        coins:    coinsAwarded,
        onPlayAgain: restart,
        onHome: () => UI.showScreen('home'),
      });
    }, 600);
  }

  // ── Restart ───────────────────────────────────────────────────
  function restart() {
    playerBoard   = emptyBoard();
    aiBoard       = emptyBoard();
    playerShips   = [];
    aiShips       = [];
    playerHits    = [];
    aiHits        = [];
    gameOver      = false;
    placing       = true;
    currentShipIdx = 0;
    horizontal    = true;
    aiMode        = 'hunt';
    aiLastHit     = null;
    aiTargetQueue = [];
    render();
  }

  // ── Init ──────────────────────────────────────────────────────
  function init(p1) {
    p1name = p1 || 'PLAYER';
    restart();
    UI.setGameTitle('BATTLESHIP');
    document.getElementById('btnGameMode').style.display = 'none'; // no VS AI toggle needed
  }

  return { init, restart };
})();

window.Battleship = Battleship;
