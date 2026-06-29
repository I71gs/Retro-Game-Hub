/**
 * RETRO GAME HUB — ui.js
 * Screen navigation, modals, settings, leaderboard
 */

const UI = (() => {
  let currentScreen = 'boot';
  let currentGame = null;
  let onWinConfirm = null;

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
    currentScreen = id;

    // Ensure the game canvas is cleared when leaving the game screen
    if (id !== 'game') {
      const area = document.getElementById('gameArea');
      if (area) area.innerHTML = '';
    }
  }

  function showModal(id) {
    document.getElementById(id).classList.add('active');
  }

  function hideModal(id) {
    document.getElementById(id).classList.remove('active');
  }

  function showWinModal({ title, subtitle, coins, onPlayAgain, onHome }) {
    const player = PlayerDB.getCurrentPlayer();
    const isGuest = !player || player.id === 'GUEST';
    const coinMessage = isGuest
      ? '🎮 GUEST MODE — no coins awarded'
      : coins > 0
        ? `🪙 +${coins} coins awarded!`
        : 'NO COINS AWARDED';

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalSub').textContent = subtitle;
    document.getElementById('modalCoins').textContent = coinMessage;
    onWinConfirm = { onPlayAgain, onHome };
    showModal('winModal');
    Sound.play('win');
    if (coins > 0) Sound.play('coin');
  }

  function updateHUD() {
    const p = PlayerDB.getCurrentPlayer();
    if (!p) return;
    document.getElementById('hudAvatar').textContent = p.avatar || '🎮';
    document.getElementById('hudName').textContent = p.id;
    document.getElementById('hudCoins').textContent = p.coins || 0;
  }

  function renderLeaderboard(game = 'all') {
    const list = PlayerDB.getLeaderboard(game);
    const el = document.getElementById('lbList');
    if (!list.length) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-dim);font-family:var(--font-vt);font-size:20px;padding:40px;">NO PLAYERS YET<br>BE THE FIRST!</div>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    const rankClasses = ['gold', 'silver', 'bronze'];
    el.innerHTML = list.map((p, i) => {
      const val = game === 'all' ? (p.coins || 0) + ' 🪙' : (p.wins[game] || 0) + ' wins';
      const rank = i < 3
        ? `<span class="lb-rank ${rankClasses[i]}">${medals[i]}</span>`
        : `<span class="lb-rank">#${i + 1}</span>`;
      return `<div class="lb-row">
        ${rank}
        <span class="lb-avatar">${p.avatar || '🎮'}</span>
        <span class="lb-name">${p.id}</span>
        <span class="lb-coins">${val}</span>
      </div>`;
    }).join('');
  }

  function buildAvatarGrid() {
    const grid = document.getElementById('avatarGrid');
    const avatars = PlayerDB.getAvatars();
    let selected = avatars[0];
    const newGrid = grid.cloneNode(false);
    newGrid.innerHTML = avatars.map((a, i) =>
      `<div class="avatar-opt${i === 0 ? ' selected' : ''}" data-avatar="${a}">${a}</div>`
    ).join('');

    const handleClick = e => {
      const opt = e.target.closest('.avatar-opt');
      if (!opt) return;
      newGrid.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selected = opt.dataset.avatar;
      Sound.play('select');
    };

    newGrid.addEventListener('click', handleClick);
    newGrid.getSelected = () => selected;
    grid.parentElement.replaceChild(newGrid, grid);
  }

  function applySettings() {
    const s = PlayerDB.getSettings();
    const body = document.body;

    // theme
    body.className = '';
    body.classList.add('theme-' + (s.theme || 'default'));

    // scanlines
    document.getElementById('scanlines').style.display = s.scanlines === false ? 'none' : '';
    document.getElementById('crtVignette').style.display = s.vignette === false ? 'none' : '';

    // pixel font
    if (s.pixelFont === false) body.classList.add('no-pixel-font');

    // sound
    Sound.setEnabled(s.sound !== false);
    Sound.setMusicEnabled(s.music === true);

    // checkboxes
    if (document.getElementById('toggleScanlines'))
      document.getElementById('toggleScanlines').checked = s.scanlines !== false;
    if (document.getElementById('toggleVignette'))
      document.getElementById('toggleVignette').checked = s.vignette !== false;
    if (document.getElementById('togglePixelFont'))
      document.getElementById('togglePixelFont').checked = s.pixelFont !== false;
    if (document.getElementById('toggleSound'))
      document.getElementById('toggleSound').checked = s.sound !== false;
    if (document.getElementById('toggleMusic'))
      document.getElementById('toggleMusic').checked = s.music === true;

    // active theme btn
    document.querySelectorAll('.theme-opt').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === (s.theme || 'default'));
    });
  }

  function initSettings() {
    // Theme buttons
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        PlayerDB.saveSetting('theme', btn.dataset.theme);
        applySettings();
        Sound.play('click');
      });
    });
    // Toggles
    const toggleMap = {
      toggleScanlines: 'scanlines',
      toggleVignette: 'vignette',
      togglePixelFont: 'pixelFont',
      toggleSound: 'sound',
      toggleMusic: 'music',
    };
    Object.entries(toggleMap).forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.addEventListener('change', () => {
        PlayerDB.saveSetting(key, el.checked);
        applySettings();
        // Live music toggle
        if (key === 'music') {
          Sound.setMusicEnabled(el.checked);
          if (el.checked) {
            // Re-start whatever track belongs to the current screen
            const screen = document.querySelector('.screen.active');
            const screenId = screen ? screen.id.replace('screen-', '') : 'home';
            const screenTrack = { home:'home', player:'login', leaderboard:'home', settings:'home', game: null };
            const track = screenTrack[screenId] || 'home';
            if (track) { Sound.playMusic(track); UI.updateMusicIndicator(track); }
          } else {
            UI.updateMusicIndicator(null);
          }
        }
      });
    });
  }

  function showConfirm(title, msg, onYes) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    document.getElementById('confirmYes').onclick = () => {
      hideModal('confirmModal');
      onYes();
    };
    document.getElementById('confirmNo').onclick = () => hideModal('confirmModal');
    showModal('confirmModal');
  }

  function setGameTitle(title) {
    document.getElementById('gameTitle').textContent = title;
  }

  function updateMusicIndicator(trackName) {
    const labelMap = {
      home: 'HOME', login: 'MENU', ttt: 'X vs O', dots: 'DOTS', snl: 'ROLL!',
      hangman: 'HANGMAN', memory: 'MEMORY', tetris: 'TETRIS', pong: 'PONG',
    };
    const indicators = ['hudMusic', 'hudMusicGame'];
    indicators.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (trackName) {
        el.style.display = 'flex';
        const lbl = el.querySelector('.music-label');
        if (lbl) lbl.textContent = labelMap[trackName] || trackName.toUpperCase();
      } else {
        el.style.display = 'none';
      }
    });
  }

  function setGameScores(p1name, p1score, p2name, p2score) {
    document.getElementById('gameHudScores').innerHTML = `
      <div class="score-chip p1"><span>${p1name}</span><strong>${p1score}</strong></div>
      <div class="score-chip p2"><span>${p2name}</span><strong>${p2score}</strong></div>
    `;
  }

  return {
    showScreen, showModal, hideModal, showWinModal,
    updateHUD, renderLeaderboard, buildAvatarGrid,
    applySettings, initSettings, showConfirm,
    setGameTitle, setGameScores, updateMusicIndicator,
    getOnWinConfirm: () => onWinConfirm,
    getCurrent: () => currentScreen,
  };
})();

window.UI = UI;
