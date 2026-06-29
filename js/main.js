/**
 * RETRO GAME HUB — main.js
 * App bootstrap, routing, event handling + music integration
 */

(function () {
  'use strict';

  let currentGame      = null;
  let currentGameVsAI  = false;
  let currentGameOnline = false;
  let currentOnlineRoom = null;
  let currentPlayerIndex = 1;
  const ONLINE_GAMES = new Set(['ttt', 'c4', 'dots', 'snl', 'memory']);

  // ── Helpers ──────────────────────────────────────────────────
  function isOnlineGame(gameId) {
    return ONLINE_GAMES.has(gameId);
  }

  function playMusic(track) {
    Sound.playMusic(track);
    UI.updateMusicIndicator(track);
  }
  function stopMusic() {
    Sound.stopMusic();
    UI.updateMusicIndicator(null);
  }

  // ── Boot sequence ─────────────────────────────────────────────
  const BOOT_MSGS = [
    'LOADING SYSTEM...',
    'INITIALIZING PLAYER DB...',
    'LOADING GAME ASSETS...',
    'CALIBRATING RETRO VIBES...',
    'READY TO PLAY!',
  ];

  function boot() {
    UI.applySettings();
    const bar    = document.getElementById('bootBar');
    const status = document.getElementById('bootStatus');
    let step = 0;
    const BOOT_STEP_MS = 920;

    Sound.play('boot');

    const ticker = setInterval(() => {
      step++;
      bar.style.width   = (step / BOOT_MSGS.length * 100) + '%';
      status.textContent = BOOT_MSGS[step - 1] || '';
      if (step >= BOOT_MSGS.length) {
        clearInterval(ticker);
        setTimeout(proceedFromBoot, 500);
      }
    }, BOOT_STEP_MS);

    const skip = (e) => {
      e.stopPropagation();
      clearInterval(ticker);
      bar.style.width = '100%';
      proceedFromBoot();
    };
    document.addEventListener('keydown', skip, { once: true });
    document.getElementById('screen-boot').addEventListener('click', skip, { once: true });
  }

  function setOnlineStatus(message) {
    const status = document.getElementById('onlineStatus');
    if (status) status.textContent = message || '';
  }

  function openOnlineModal() {
    const modal = document.getElementById('onlineModal');
    const joinPanel = document.getElementById('onlineJoinPanel');
    const hint = document.getElementById('onlineHint');
    if (!modal) return;
    if (joinPanel) joinPanel.style.display = 'none';
    setOnlineStatus('Choose host or join. Your room code will appear once the session is ready.');
    if (hint) {
      const host = window.location.host;
      hint.textContent = `If your friend is on another computer, ask them to open ${host} first. Replace localhost with your PC's LAN IP if needed.`;
    }
    modal.classList.add('active');
  }

  function closeOnlineModal() {
    const modal = document.getElementById('onlineModal');
    if (!modal) return;
    modal.classList.remove('active');
    setOnlineStatus('');
    document.getElementById('joinRoomCode').value = '';
  }

  function initOnlineModal() {
    const hostBtn = document.getElementById('btnHostMatch');
    const joinBtn = document.getElementById('btnJoinMatch');
    const submitBtn = document.getElementById('btnSubmitJoin');
    const cancelBtn = document.getElementById('btnCancelOnline');
    const joinPanel = document.getElementById('onlineJoinPanel');

    if (hostBtn) {
      hostBtn.addEventListener('click', () => {
        if (!currentGame || !isOnlineGame(currentGame)) {
          setOnlineStatus('Online mode is not available for this game yet.');
          return;
        }
        setOnlineStatus('Creating room...');
        Network.createRoom(currentGame)
          .then(data => {
            currentOnlineRoom = data.code;
            currentPlayerIndex = data.playerIndex;
            setOnlineStatus(`Room ${data.code} created. Waiting for your friend to join...`);
          })
          .catch(err => {
            setOnlineStatus(err.message || 'Unable to create room.');
          });
      });
    }

    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        if (joinPanel) joinPanel.style.display = 'flex';
        setOnlineStatus('Enter the room code from your friend.');
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const code = document.getElementById('joinRoomCode').value.trim().toUpperCase();
        if (!code) {
          setOnlineStatus('Please enter a valid room code.');
          return;
        }
        if (!currentGame || !isOnlineGame(currentGame)) {
          setOnlineStatus('Online mode is not available for this game yet.');
          return;
        }
        setOnlineStatus('Joining room...');
        Network.joinRoom(code, currentGame)
          .then(data => {
            currentOnlineRoom = data.code;
            currentPlayerIndex = data.playerIndex;
            setOnlineStatus('Joined room. Waiting for the host to start the match...');
          })
          .catch(err => {
            setOnlineStatus(err.message || 'Unable to join room.');
          });
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        closeOnlineModal();
      });
    }

    Network.on('room-ready', data => {
      if (!data || data.game !== currentGame) return;
      currentPlayerIndex = data.playerIndex;
      currentOnlineRoom = data.code;
      setOnlineStatus(`Match ready! You are player ${data.playerIndex}. Starting...`);
      closeOnlineModal();
      launchGame(currentGame, false, true);
    });

    Network.on('room-error', msg => {
      if (msg && msg.message) setOnlineStatus(msg.message);
    });

    Network.on('player-left', () => {
      UI.showConfirm('OPPONENT LEFT', 'Your friend has disconnected from the match.', () => {
        Network.leaveRoom();
        UI.showScreen('home');
        playMusic('home');
      });
    });

    Network.on('game-event', msg => {
      if (!msg || msg.game !== currentGame) return;
      if (msg.game === 'ttt' && msg.action === 'ttt-move') {
        TicTacToe.receiveRemoteMove(msg.payload.index);
      }
      if (msg.game === 'c4' && msg.action === 'c4-move') {
        ConnectFour.receiveRemoteMove(msg.payload.col);
      }
      if (msg.game === 'dots' && msg.action === 'dots-move') {
        DotsGame.receiveRemoteMove(msg.payload.type, msg.payload.r, msg.payload.c);
      }
      if (msg.game === 'snl' && msg.action === 'snl-roll') {
        SnakesLadders.receiveRemoteMove(msg.payload.roll);
      }
      if (msg.game === 'memory' && msg.action === 'memory-deck') {
        MemoryMatch.receiveDeck(msg.payload.deck);
      }
      if (msg.game === 'memory' && msg.action === 'memory-flip') {
        MemoryMatch.receiveRemoteMove(msg.payload.index);
      }
    });
  }

  function proceedFromBoot() {
    const player = PlayerDB.getCurrentPlayer();
    if (player) {
      UI.updateHUD();
      UI.showScreen('home');
      playMusic('home');
    } else {
      UI.showScreen('player');
      UI.buildAvatarGrid();
      playMusic('login');
    }
  }

  // ── Player screen (login / register) ─────────────────────────
  function initPlayerScreen() {
    // Tab switch
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        Sound.play('click');
      });
    });

    // Register
    document.getElementById('btnRegister').addEventListener('click', () => {
      const id     = document.getElementById('regId').value;
      const pin    = document.getElementById('regPin').value;
      const avatar = document.getElementById('avatarGrid').getSelected();
      const result = PlayerDB.createPlayer(id, pin, avatar);
      const msg    = document.getElementById('registerMsg');
      if (result.ok) {
        msg.className   = 'msg-box success';
        msg.textContent = '✓ Account created! Welcome, ' + result.player.id;
        Sound.play('win');
        setTimeout(() => {
          UI.updateHUD();
          UI.showScreen('home');
          playMusic('home');
        }, 1000);
      } else {
        msg.className   = 'msg-box error';
        msg.textContent = '✗ ' + result.msg;
        Sound.play('error');
      }
    });

    // Login
    document.getElementById('btnLogin').addEventListener('click', () => {
      const id     = document.getElementById('loginId').value;
      const pin    = document.getElementById('loginPin').value;
      const result = PlayerDB.loginPlayer(id, pin);
      const msg    = document.getElementById('loginMsg');
      if (result.ok) {
        msg.className   = 'msg-box success';
        msg.textContent = '✓ Welcome back, ' + result.player.id + '!';
        Sound.play('select');
        setTimeout(() => {
          UI.updateHUD();
          UI.showScreen('home');
          playMusic('home');
        }, 800);
      } else {
        msg.className   = 'msg-box error';
        msg.textContent = '✗ ' + result.msg;
        Sound.play('error');
      }
    });

    // Enter key shortcuts
    ['loginId', 'loginPin'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btnLogin').click();
      });
    });
    ['regId', 'regPin'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('btnRegister').click();
      });
    });

    // Guest
    document.getElementById('btnGuest').addEventListener('click', () => {
      PlayerDB.guestPlayer();
      UI.updateHUD();
      UI.showScreen('home');
      playMusic('home');
      Sound.play('click');
    });
  }

  // ── Home screen ───────────────────────────────────────────────
  function initHome() {
    document.getElementById('btnLeaderboard').addEventListener('click', () => {
      UI.renderLeaderboard('all');
      UI.showScreen('leaderboard');
      Sound.play('click');
      // leaderboard keeps home music — no track change needed
    });

    document.getElementById('btnSettings').addEventListener('click', () => {
      UI.showScreen('settings');
      Sound.play('click');
      // settings keeps current music — no track change needed
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
      UI.showConfirm('LOGOUT', 'Exit to player screen?', () => {
        PlayerDB.logout();
        UI.showScreen('player');
        UI.buildAvatarGrid();
        playMusic('login');
      });
    });

    // Game card click
    document.querySelectorAll('.game-card:not(.coming-soon) .play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const game = btn.closest('.game-card').dataset.game;
        Sound.play('select');
        launchGame(game, false);
      });
    });

    document.querySelectorAll('.game-card:not(.coming-soon)').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.play-btn')) return;
        Sound.play('select');
        launchGame(card.dataset.game, false);
      });
    });
  }

  // ── Game launch ───────────────────────────────────────────────
  const GAME_TRACKS = { ttt: 'ttt', dots: 'dots', snl: 'snl', bs: 'ttt', c4: 'dots', hangman: 'hangman', memory: 'memory', tetris: 'tetris', pong: 'pong' };

  function launchGame(gameId, vsAI, online = false) {
    const isAIGame = gameId === 'pong';
    currentGame = gameId;
    currentGameVsAI = isAIGame ? true : vsAI;
    currentGameOnline = online && isOnlineGame(gameId);
    const player = PlayerDB.getCurrentPlayer();
    const p1 = (player && player.id !== 'GUEST') ? player.id : 'PLAYER 1';

    UI.showScreen('game');
    // Clear previous game content to prevent overlapping/ghost UI
    const gameArea = document.getElementById('gameArea');
    if (gameArea) gameArea.innerHTML = '';

    playMusic(GAME_TRACKS[gameId] || 'home');

    switch (gameId) {
      case 'ttt':
        TicTacToe.init(p1, 'PLAYER 2', currentGameVsAI, currentGameOnline, currentPlayerIndex);
        break;
      case 'dots':
        DotsGame.init(p1, 'PLAYER 2', currentGameVsAI, currentGameOnline, currentPlayerIndex);
        break;
      case 'snl':
        SnakesLadders.init(p1, 'PLAYER 2', currentGameVsAI, 2, currentGameOnline, currentPlayerIndex);
        break;
      case 'bs':
        Battleship.init(p1);
        break;
      case 'c4':
        ConnectFour.init(p1, 'PLAYER 2', currentGameVsAI, currentGameOnline, currentPlayerIndex);
        break;
      case 'hangman':
        Hangman.init(p1, 'PLAYER 2', currentGameVsAI);
        break;
      case 'memory':
        MemoryMatch.init(p1, 'PLAYER 2', currentGameVsAI, currentGameOnline, currentPlayerIndex);
        break;
      case 'tetris':
        Tetris.init(p1, 'PLAYER 2', currentGameVsAI);
        break;
      case 'pong':
        Pong.init(p1, 'PLAYER 2', true);
        break;
    }

    const modeBtn = document.getElementById('btnGameMode');
    if (modeBtn) {
      if (currentGameOnline || isAIGame) {
        modeBtn.style.display = 'none';
      } else {
        modeBtn.style.display = '';
        modeBtn.textContent = currentGameVsAI ? '👥 VS HUMAN' : '🤖 VS AI';
      }
    }

    const onlineBtn = document.getElementById('btnOnlineGame');
    if (onlineBtn) {
      onlineBtn.style.display = isOnlineGame(gameId) ? '' : 'none';
    }
  }

  // ── Game controls ─────────────────────────────────────────────
  function initGameControls() {
    document.getElementById('gameBackBtn').addEventListener('click', () => {
      UI.showConfirm('EXIT GAME', 'Leave this game?', () => {
        UI.showScreen('home');
        playMusic('home');
        Sound.play('click');
      });
    });

    document.getElementById('btnRestartGame').addEventListener('click', () => {
      Sound.play('click');
      switch (currentGame) {
        case 'ttt':         TicTacToe.restart();     break;
        case 'dots':        DotsGame.restart();      break;
        case 'snl':         SnakesLadders.restart(); break;
        case 'bs':          Battleship.restart();    break;
        case 'c4':          ConnectFour.restart();   break;
        case 'hangman':     Hangman.restart();       break;
        case 'memory':      MemoryMatch.restart();   break;
        case 'tetris':      Tetris.restart();        break;
        case 'pong':        Pong.restart();          break;
      }
    });

    document.getElementById('btnGameMode').addEventListener('click', () => {
      currentGameVsAI = !currentGameVsAI;
      Sound.play('click');
      launchGame(currentGame, currentGameVsAI);
    });

    document.getElementById('btnOnlineGame').addEventListener('click', () => {
      Sound.play('click');
      if (!currentGame || !isOnlineGame(currentGame)) {
        UI.showConfirm('UNSUPPORTED', 'Online mode is not available for this game yet.', () => {});
        return;
      }
      openOnlineModal();
    });
  }

  // ── Win modal ─────────────────────────────────────────────────
  function initWinModal() {
    document.getElementById('modalPlayAgain').addEventListener('click', () => {
      UI.hideModal('winModal');
      const cb = UI.getOnWinConfirm();
      if (cb && cb.onPlayAgain) cb.onPlayAgain();
      Sound.play('click');
    });

    document.getElementById('modalHome').addEventListener('click', () => {
      UI.hideModal('winModal');
      const cb = UI.getOnWinConfirm();
      if (cb && cb.onHome) cb.onHome();
      UI.updateHUD();
      UI.showScreen('home');
      playMusic('home');
      Sound.play('click');
    });
  }

  // ── Leaderboard ───────────────────────────────────────────────
  function initLeaderboard() {
    document.querySelectorAll('.lb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        UI.renderLeaderboard(tab.dataset.lb);
        Sound.play('click');
      });
    });
  }

  // ── Back buttons ──────────────────────────────────────────────
  const SCREEN_MUSIC = {
    home: 'home',
    player: 'login',
    leaderboard: 'home',
    settings: 'home',
  };

  function initBackButtons() {
    document.querySelectorAll('[data-back]').forEach(btn => {
      btn.addEventListener('click', () => {
        Sound.play('click');
        const dest = btn.dataset.back;
        UI.showScreen(dest);
        const track = SCREEN_MUSIC[dest];
        if (track) playMusic(track);
      });
    });
  }

  // ── Settings page ─────────────────────────────────────────────
  function initSettingsPage() {
    UI.initSettings();
    document.getElementById('btnDeleteAccount').addEventListener('click', () => {
      const player = PlayerDB.getCurrentPlayer();
      if (!player || player.id === 'GUEST') return;
      UI.showConfirm('DELETE ACCOUNT', `Delete ${player.id}? This cannot be undone!`, () => {
        PlayerDB.deletePlayer(player.id);
        UI.showScreen('player');
        UI.buildAvatarGrid();
        playMusic('login');
      });
    });
  }

  // ── Global click sounds ───────────────────────────────────────
  function initGlobalSounds() {
    document.querySelectorAll('.retro-btn, .hud-btn, .tab-btn, .play-btn, .back-btn').forEach(btn => {
      btn.addEventListener('click', () => Sound.play('click'), { passive: true });
    });
  }

  // ── Demo seed data ────────────────────────────────────────────
  function seedDemoData() {
    const db = JSON.parse(localStorage.getItem('retrohub_players') || '{}');
    if (Object.keys(db).length > 0) return;

    const demos = [
      { id: 'PIXELKING',  avatar: '👾', coins: 420, wins: { total:28, dots:12, ttt:10, snl:6 } },
      { id: 'RETROQUEEN', avatar: '👻', coins: 380, wins: { total:22, dots:8,  ttt:9,  snl:5 } },
      { id: 'GAMER99',    avatar: '🎮', coins: 290, wins: { total:18, dots:5,  ttt:7,  snl:6 } },
      { id: 'DOTMASTER',  avatar: '🔥', coins: 210, wins: { total:14, dots:10, ttt:2,  snl:2 } },
      { id: 'SNAKEKING',  avatar: '🐲', coins: 175, wins: { total:11, dots:1,  ttt:3,  snl:7 } },
    ];

    demos.forEach(d => {
      db[d.id] = {
        ...d,
        pin: '0000',
        games: { total: d.wins.total + 5, dots: d.wins.dots + 2, ttt: d.wins.ttt + 2, snl: d.wins.snl + 1 },
        streak: 0,
        created:  Date.now() - Math.random() * 1e10,
        lastSeen: Date.now() - Math.random() * 1e8,
      };
    });
    localStorage.setItem('retrohub_players', JSON.stringify(db));
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    seedDemoData();
    initPlayerScreen();
    initHome();
    initGameControls();
    initOnlineModal();
    initWinModal();
    initLeaderboard();
    initBackButtons();
    initSettingsPage();
    boot();
  }

  document.addEventListener('DOMContentLoaded', init);

})();
