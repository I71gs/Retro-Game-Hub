/**
 * RETRO GAME HUB — hangman.js
 * Hangman word guessing with retro pixel art and win/loss flow.
 */

const Hangman = (() => {
  const WORDS_WITH_CATEGORY = [
    { word: 'PIXEL', category: 'GRAPHICS' },
    { word: 'ARCADE', category: 'GAMING' },
    { word: 'ROBOT', category: 'TECH' },
    { word: 'SPACE', category: 'ASTRONOMY' },
    { word: 'NINJA', category: 'MARTIAL ARTS' },
    { word: 'GALAXY', category: 'ASTRONOMY' },
    { word: 'MONSTER', category: 'CREATURE' },
    { word: 'LASER', category: 'TECH' },
    { word: 'DRAGON', category: 'CREATURE' },
    { word: 'PUZZLE', category: 'GAME' },
    { word: 'COMET', category: 'ASTRONOMY' },
    { word: 'VORTEX', category: 'NATURE' },
    { word: 'SHADOW', category: 'NATURE' },
    { word: 'HERO', category: 'CHARACTER' },
    { word: 'MISSION', category: 'GAME' },
    { word: 'LEGEND', category: 'STORY' },
    { word: 'WIZARD', category: 'CHARACTER' },
    { word: 'ASTEROID', category: 'ASTRONOMY' }
  ];

  const MAX_WRONG = 6;
  const MAX_HINTS = 2;
  let word = '';
  let category = '';
  let guessed = new Set();
  let wrongCount = 0;
  let hintsUsed = 0;
  let gameOver = false;
  let p1name = 'PLAYER 1';
  let p2name = 'PLAYER 2';
  let vsAI = false;

  function pickWord() {
    const item = WORDS_WITH_CATEGORY[Math.floor(Math.random() * WORDS_WITH_CATEGORY.length)];
    return item;
  }

  function getDisplayWord() {
    return word.split('').map(ch => guessed.has(ch) ? ch : '_').join(' ');
  }

  function renderGallow() {
    const parts = ['head', 'body', 'arm-l', 'arm-r', 'leg-l', 'leg-r'];
    return parts.map((part, index) => `
      <div class="cs-stick ${part}${wrongCount > index ? ' visible' : ''}"></div>
    `).join('');
  }

  function revealRandomLetter() {
    const unguessed = word.split('').filter(ch => !guessed.has(ch));
    if (unguessed.length > 0) {
      const randomLetter = unguessed[Math.floor(Math.random() * unguessed.length)];
      guessed.add(randomLetter);
      Sound.play('select');
    }
  }

  function revealVowels() {
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    let revealed = 0;
    vowels.forEach(v => {
      if (word.includes(v) && !guessed.has(v)) {
        guessed.add(v);
        revealed++;
      }
    });
    if (revealed > 0) Sound.play('select');
  }

  function render() {
    const area = document.getElementById('gameArea');
    const hintsRemaining = MAX_HINTS - hintsUsed;
    area.innerHTML = `
      <div class="hangman-wrap">
        <div class="hangman-board">
          <div class="cs-gallow">
            <div class="cs-pole v"></div>
            <div class="cs-pole h"></div>
            <div class="cs-pole rope"></div>
            ${renderGallow()}
          </div>
          <div class="hangman-word">${getDisplayWord()}</div>
          <div class="hangman-info">Wrong: ${wrongCount} / ${MAX_WRONG}</div>
          <div class="hangman-category">Category: <strong>${category}</strong></div>
        </div>
        <div class="hangman-hints">
          <button class="hint-btn${hintsRemaining > 0 ? '' : ' disabled'}" id="hintLetter" ${hintsRemaining > 0 ? '' : 'disabled'}>💡 LETTER (${hintsRemaining})</button>
          <button class="hint-btn${hintsRemaining > 0 ? '' : ' disabled'}" id="hintVowel" ${hintsRemaining > 0 ? '' : 'disabled'}>🔤 VOWELS (${hintsRemaining})</button>
        </div>
        <div class="hangman-letters">
          ${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => `
            <button class="letter-btn${guessed.has(letter) ? ' disabled' : ''}" data-letter="${letter}" ${guessed.has(letter) ? 'disabled' : ''}>
              ${letter}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.querySelectorAll('.letter-btn').forEach(btn => {
      btn.addEventListener('click', () => handleGuess(btn.dataset.letter));
    });

    document.getElementById('hintLetter').addEventListener('click', () => useHint('letter'));
    document.getElementById('hintVowel').addEventListener('click', () => useHint('vowel'));

    UI.setGameScores(p1name, 0, p2name, wrongCount);
  }

  function useHint(type) {
    if (hintsUsed >= MAX_HINTS || gameOver) return;
    hintsUsed++;
    if (type === 'letter') {
      revealRandomLetter();
    } else if (type === 'vowel') {
      revealVowels();
    }
    render();
    checkGameState();
  }

  function handleGuess(letter) {
    if (gameOver || guessed.has(letter)) return;
    guessed.add(letter);
    if (!word.includes(letter)) {
      wrongCount++;
      Sound.play('error');
    } else {
      Sound.play('select');
    }
    render();
    checkGameState();
  }

  function checkGameState() {
    if (word.split('').every(ch => guessed.has(ch))) {
      endGame(true);
    } else if (wrongCount >= MAX_WRONG) {
      endGame(false);
    }
  }

  function endGame(won) {
    gameOver = true;
    const player = PlayerDB.getCurrentPlayer();
    let coinsAwarded = null;
    if (won && player && player.id !== 'GUEST') {
      coinsAwarded = 14;
      PlayerDB.awardCoins(coinsAwarded, 'hangman');
    }
    PlayerDB.recordGame('hangman', won);
    const subtitle = won ? 'You saved the pixel hero!' : `The word was ${word}.`;
    setTimeout(() => {
      UI.showWinModal({
        title: won ? 'VICTORY!' : 'GAME OVER',
        subtitle,
        coins: coinsAwarded,
        onPlayAgain: restart,
        onHome: () => UI.showScreen('home'),
      });
    }, 500);
  }

  function restart() {
    const item = pickWord();
    word = item.word;
    category = item.category;
    guessed = new Set();
    wrongCount = 0;
    hintsUsed = 0;
    gameOver = false;
    render();
  }

  function init(p1, p2, ai) {
    vsAI = ai;
    p1name = p1 || 'PLAYER 1';
    p2name = ai ? 'COMPUTER' : (p2 || 'PLAYER 2');
    UI.setGameTitle('HANGMAN');

    restart();
  }

  return { init, restart };
})();

window.Hangman = Hangman;
