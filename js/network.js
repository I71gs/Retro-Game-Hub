/**
 * RETRO GAME HUB — network.js
 * Lightweight WebSocket multiplayer manager for online matches.
 */

const Network = (() => {
  let socket = null;
  let connected = false;
  let serverUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
  let roomCode = null;
  let gameId = null;
  let playerIndex = 1;
  const listeners = {};

  function emit(event, payload) {
    (listeners[event] || []).forEach(cb => cb(payload));
  }

  function on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  }

  function off(event, cb) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(fn => fn !== cb);
  }

  function createSocket() {
    return new Promise((resolve, reject) => {
      if (socket && connected && socket.readyState === WebSocket.OPEN) {
        return resolve(socket);
      }

      socket = new WebSocket(serverUrl);
      socket.addEventListener('open', () => {
        connected = true;
        emit('connected');
        resolve(socket);
      });

      socket.addEventListener('message', event => {
        handleMessage(event.data);
      });

      socket.addEventListener('close', () => {
        connected = false;
        emit('disconnected');
      });

      socket.addEventListener('error', () => {
        emit('error');
        reject(new Error('Unable to connect to multiplayer server'));
      });
    });
  }

  function send(type, payload = {}) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type, ...payload }));
  }

  function connect(url) {
    if (url) serverUrl = url;
    return createSocket();
  }

  function createRoom(requestedGame) {
    gameId = requestedGame;
    return connect().then(() => {
      return new Promise((resolve, reject) => {
        const onCreated = data => {
          if (data.type === 'room-created') {
            roomCode = data.code;
            playerIndex = data.playerIndex;
            off('room-created', onCreated);
            resolve(data);
          }
        };
        on('room-created', onCreated);
        send('create-room', { game: requestedGame });
        setTimeout(() => reject(new Error('Room creation timed out')), 6000);
      });
    });
  }

  function joinRoom(code, requestedGame) {
    gameId = requestedGame;
    return connect().then(() => {
      return new Promise((resolve, reject) => {
        const onJoined = data => {
          if (data.type === 'room-joined') {
            roomCode = data.code;
            playerIndex = data.playerIndex;
            off('room-joined', onJoined);
            resolve(data);
          }
        };
        on('room-joined', onJoined);
        send('join-room', { code, game: requestedGame });
        setTimeout(() => reject(new Error('Join timed out')), 6000);
      });
    });
  }

  function leaveRoom() {
    if (roomCode) {
      send('leave-room', { code: roomCode });
    }
    roomCode = null;
    playerIndex = 1;
    gameId = null;
  }

  function broadcast(action, payload = {}) {
    if (!roomCode || !gameId) return;
    send('game-event', { game: gameId, action, payload });
  }

  function handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (e) {
      return;
    }

    if (!msg || !msg.type) return;
    if (msg.type === 'game-event') {
      emit('game-event', msg);
      return;
    }

    if (msg.type === 'room-created' || msg.type === 'room-joined' || msg.type === 'room-ready' || msg.type === 'room-error' || msg.type === 'player-left') {
      emit(msg.type, msg);
      return;
    }

    if (msg.type === 'disconnect') {
      emit('disconnected', msg);
    }
  }

  function isOnline() {
    return connected && !!roomCode;
  }

  function getRoomCode() {
    return roomCode;
  }

  function getPlayerIndex() {
    return playerIndex;
  }

  return {
    connect,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcast,
    on,
    off,
    isOnline,
    getRoomCode,
    getPlayerIndex,
  };
})();

window.Network = Network;
