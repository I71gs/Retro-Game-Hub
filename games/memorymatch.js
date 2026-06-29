/**
 * RETRO GAME HUB — memorymatch.js
 * Memory Match with card flipping, pair tracking, and retro scoring.
 */

const MemoryMatch = (() => {
  const CARDS = ['🎮','👾','💎','🪐','⚡','🎯','🦊','🚀'];
  let deck = [];
  let flipped = [];
  let matched = new Set();
  let attempts = 0;
  let busy = false;
  let gameOver = false;
  let online = false;
  let playerId = 1;
  let syncing = false;
  let p1name = 'PLAYER 1';
  let p2name = 'PLAYER 2';
  let vsAI = false;

  function shuffle(array) {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  function buildDeck() {
    const cards = [...CARDS, ...CARDS];
    deck = shuffle(cards);
  }

  function placeholderDeck() {
    return Array(CARDS.length * 2).fill(null);
  }

  function render() {
    const area = document.getElementById('gameArea');
    const waiting = online && playerId === 2 && deck.length === 0;
    area.innerHTML = `
      <div class="memory-wrap">
        <div class="memory-header">
          <div class="memory-score">Pairs: ${matched.size / 2} / ${CARDS.length}</div>
          <div class="memory-score">Attempts: ${attempts}</div>
        </div>
        <div class="memory-grid">
          ${(deck.length ? deck : placeholderDeck()).map((emoji, index) => {
            const isFlipped = flipped.includes(index) || matched.has(index);
            return `
              <button class="memory-card${isFlipped ? ' flipped' : ''}${matched.has(index) ? ' matched' : ''}" data-index="${index}" ${waiting ? 'disabled' : ''}>
                <span class="card-face front">${emoji || ''}</span>
                <span class="card-face back">?</span>
              </button>
            `;
          }).join('')}
        </div>
        ${waiting ? '<div class="memory-waiting">Waiting for host to share the deck...</div>' : ''}
      </div>
    `;
    document.querySelectorAll('.memory-card').forEach(card => {
      card.addEventListener('click', () => revealCard(parseInt(card.dataset.index, 10)));
    });
    UI.setGameScores(p1name, matched.size / 2, p2name, attempts);
  }

  function revealCard(index) {
    if (busy || gameOver || flipped.includes(index) || matched.has(index) || deck.length === 0) return;
    flipped.push(index);
    Sound.play('select');
    if (!syncing && online && deck.length) {
      Network.broadcast('memory-flip', { index });
    }
    if (flipped.length === 2) {
      attempts++;
      busy = true;
      const [first, second] = flipped;
      if (deck[first] === deck[second]) {
        matched.add(first);
        matched.add(second);
        Sound.play('win');
        flipped = [];
        busy = false;
        render();
        checkFinish();
      } else {
        render();
        setTimeout(() => {
          flipped = [];
          busy = false;
          render();
        }, 900);
      }
    } else {
      render();
    }
  }

  function receiveDeck(deckData) {
    if (!Array.isArray(deckData) || deckData.length !== CARDS.length * 2) return;
    deck = deckData.slice();
    matched = new Set();
    flipped = [];
    attempts = 0;
    busy = false;
    gameOver = false;
    render();
  }

  function receiveRemoteMove(index) {
    if (busy || gameOver || matched.has(index) || flipped.includes(index) || deck.length === 0) return;
    syncing = true;
    revealCard(index);
    syncing = false;
  }

  function checkFinish() {
    if (matched.size === deck.length) {
      gameOver = true;
      const player = PlayerDB.getCurrentPlayer();
      let coinsAwarded = null;
      if (player && player.id !== 'GUEST') {
        coinsAwarded = 16;
        PlayerDB.awardCoins(coinsAwarded, 'memory');
      }
      PlayerDB.recordGame('memory', true);
      setTimeout(() => {
        UI.showWinModal({
          title: 'MATCH COMPLETE!',
          subtitle: `You found all pairs in ${attempts} attempts!`,
          coins: coinsAwarded,
          onPlayAgain: restart,
          onHome: () => UI.showScreen('home'),
        });
      }, 500);
    }
  }

  function restart() {
    if (online && playerId === 2) {
      deck = placeholderDeck();
      matched = new Set();
      flipped = [];
      attempts = 0;
      busy = false;
      gameOver = false;
      render();
      return;
    }
    buildDeck();
    flipped = [];
    matched = new Set();
    attempts = 0;
    busy = false;
    gameOver = false;
    render();
    if (online && playerId === 1) {
      Network.broadcast('memory-deck', { deck });
    }
  }

  function init(p1, p2, ai, isOnline = false, playerIdx = 1) {
    online = isOnline;
    playerId = playerIdx;
    vsAI = isOnline ? false : ai;
    p1name = isOnline ? (playerIdx === 1 ? (p1 || 'PLAYER 1') : 'REMOTE') : (p1 || 'PLAYER 1');
    p2name = isOnline ? (playerIdx === 2 ? (p1 || 'PLAYER 1') : 'REMOTE') : (ai ? 'COMPUTER' : (p2 || 'PLAYER 2'));
    UI.setGameTitle('MEMORY MATCH');
    restart();
  }

  return { init, restart, receiveDeck, receiveRemoteMove };
})();

window.MemoryMatch = MemoryMatch;
