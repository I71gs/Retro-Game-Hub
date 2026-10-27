// Retro Simon Says Game Module
const SimonSays = (() => {
  const PADS = [
    { id: 0, color: 'green',  freq: 415.3, label: 'GREEN',  key: '1' },
    { id: 1, color: 'red',    freq: 310.0, label: 'RED',    key: '2' },
    { id: 2, color: 'yellow', freq: 252.0, label: 'YELLOW', key: '3' },
    { id: 3, color: 'blue',   freq: 209.3, label: 'BLUE',   key: '4' },
  ];

  let sequence = [];
  let playerStep = 0;
  let isPlayingSequence = false;
  let round = 1;
  let bestRound = 1;
  let p1 = 'PLAYER 1';
  let gameOver = false;
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, durMs = 300) {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durMs / 1000);
    } catch (_) {}
  }

  function playBuzzer() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }

  function init(player1) {
    p1 = player1 || 'PLAYER 1';
    try {
      bestRound = parseInt(localStorage.getItem('retrohub_simon_best') || '1', 10);
    } catch (_) {
      bestRound = 1;
    }
    setupDOM();
    startGame();
  }

  function setupDOM() {
    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    gameArea.innerHTML = `
      <div class="retro-game-wrapper simon-wrapper">
        <div class="retro-hud-header">
          <div class="hud-item"><span class="hud-label">ROUND</span><span id="simonRound" class="hud-val neon-green">1</span></div>
          <div class="hud-item"><span class="hud-label">STATUS</span><span id="simonStatus" class="hud-val neon-cyan">WATCH!</span></div>
          <div class="hud-item"><span class="hud-label">RECORD</span><span id="simonBest" class="hud-val neon-gold">${bestRound}</span></div>
        </div>
        <div class="simon-console">
          <div class="simon-circle">
            ${PADS.map(p => `
              <button class="simon-pad pad-${p.color}" id="pad-${p.id}" data-pad="${p.id}">
                <span class="pad-num">${p.key}</span>
              </button>
            `).join('')}
            <div class="simon-center">
              <div class="simon-brand">SIMON</div>
              <div class="simon-count-display" id="simonCountDisplay">--</div>
              <button class="simon-start-btn" id="simonRestartBtn">REPLAY</button>
            </div>
          </div>
        </div>
        <div class="retro-ctrl-hint">TAP THE COLOR PADS OR USE KEYS 1, 2, 3, 4</div>
      </div>
    `;

    PADS.forEach(p => {
      const el = document.getElementById(`pad-${p.id}`);
      if (el) {
        el.onclick = () => handlePadClick(p.id);
      }
    });

    document.getElementById('simonRestartBtn').onclick = () => restart();

    window.removeEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleKeyDown);
  }

  function handleKeyDown(e) {
    if (isPlayingSequence || gameOver) return;
    const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (e.key in keyMap) {
      handlePadClick(keyMap[e.key]);
      e.preventDefault();
    }
  }

  function startGame() {
    sequence = [];
    round = 1;
    gameOver = false;
    updateHUD('WATCH!');
    addNewStep();
    playSequence();
  }

  function addNewStep() {
    const nextPad = Math.floor(Math.random() * 4);
    sequence.push(nextPad);
  }

  function flashPad(padId, durMs = 300) {
    const pad = PADS[padId];
    const el = document.getElementById(`pad-${padId}`);
    if (el) el.classList.add('active');
    playTone(pad.freq, durMs);
    setTimeout(() => {
      if (el) el.classList.remove('active');
    }, durMs);
  }

  function playSequence() {
    isPlayingSequence = true;
    playerStep = 0;
    updateHUD('WATCH!');

    const baseSpeed = Math.max(220, 500 - round * 25);
    const stepGap = baseSpeed + 120;

    sequence.forEach((padId, index) => {
      setTimeout(() => {
        if (!gameOver) {
          flashPad(padId, baseSpeed);
          if (index === sequence.length - 1) {
            setTimeout(() => {
              isPlayingSequence = false;
              updateHUD('YOUR TURN!');
            }, baseSpeed + 100);
          }
        }
      }, index * stepGap + 400);
    });
  }

  function handlePadClick(padId) {
    if (isPlayingSequence || gameOver) return;

    flashPad(padId, 250);

    if (padId === sequence[playerStep]) {
      playerStep++;
      if (playerStep === sequence.length) {
        // Round cleared!
        round++;
        if (round > bestRound) {
          bestRound = round;
          try { localStorage.setItem('retrohub_simon_best', String(bestRound)); } catch (_) {}
        }
        updateHUD('PERFECT!');
        addNewStep();
        setTimeout(() => {
          if (!gameOver) playSequence();
        }, 800);
      }
    } else {
      triggerGameOver();
    }
  }

  function updateHUD(statusText) {
    const rEl = document.getElementById('simonRound');
    const sEl = document.getElementById('simonStatus');
    const bEl = document.getElementById('simonBest');
    const cEl = document.getElementById('simonCountDisplay');
    if (rEl) rEl.textContent = round;
    if (sEl) sEl.textContent = statusText || 'PLAYING';
    if (bEl) bEl.textContent = bestRound;
    if (cEl) cEl.textContent = String(round).padStart(2, '0');
  }

  function triggerGameOver() {
    gameOver = true;
    playBuzzer();
    updateHUD('WRONG!');

    const won = round >= 6;
    const coins = Math.min(30, round * 2 + (won ? 8 : 1));

    if (typeof PlayerDB !== 'undefined') {
      if (won) PlayerDB.awardCoins(coins, 'simon');
      PlayerDB.recordGame('simon', won);
      if (typeof UI !== 'undefined') UI.updateHUD();
    }

    const pName = typeof p1 === 'string' ? p1 : p1?.id || 'PLAYER 1';
    setTimeout(() => {
      if (typeof UI !== 'undefined') {
        UI.showWinModal({
          title: won ? 'MEMORY MASTER!' : 'SEQUENCE FAILED',
          subtitle: `${pName} reached Round ${round} (Best: ${bestRound})`,
          coins: coins,
          onPlayAgain: () => restart(),
          onHome: () => UI.showScreen('home'),
        });
      }
    }, 550);
  }

  function restart() {
    startGame();
  }

  return { init, restart };
})();

window.SimonSays = SimonSays;
