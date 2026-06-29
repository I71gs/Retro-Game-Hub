const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;
const app = express();

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/games', express.static(path.join(__dirname, 'games')));
app.use('/manifest.json', express.static(path.join(__dirname, 'manifest.json')));
app.use('/sw.js', express.static(path.join(__dirname, 'sw.js')));
app.use('/icon.svg', express.static(path.join(__dirname, 'icon.svg')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();

function makeRoomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createRoom(ws, game) {
  let code = makeRoomCode();
  while (rooms.has(code)) code = makeRoomCode();

  const room = {
    code,
    game,
    clients: [ws],
  };

  rooms.set(code, room);
  ws.room = code;
  ws.isHost = true;
  ws.send(JSON.stringify({ type: 'room-created', code, playerIndex: 1, game }));
}

function joinRoom(ws, code, game) {
  const room = rooms.get(code);
  if (!room) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'Room not found' }));
    return;
  }

  if (room.game !== game) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'Room does not support this game' }));
    return;
  }

  if (room.clients.length >= 2) {
    ws.send(JSON.stringify({ type: 'room-error', message: 'Room is full' }));
    return;
  }

  room.clients.push(ws);
  ws.room = code;
  ws.isHost = false;
  ws.send(JSON.stringify({ type: 'room-joined', code, playerIndex: 2, game }));

  const payload = { type: 'room-ready', code, game, players: room.clients.length };
  room.clients.forEach((client, index) => {
    client.send(JSON.stringify({ ...payload, playerIndex: index + 1 }));
  });
}

function removeFromRoom(ws) {
  if (!ws.room) return;
  const room = rooms.get(ws.room);
  if (!room) return;

  room.clients = room.clients.filter(client => client !== ws);
  room.clients.forEach(client => {
    client.send(JSON.stringify({ type: 'player-left', code: room.code }));
  });

  if (room.clients.length === 0) {
    rooms.delete(room.code);
  }

  ws.room = null;
}

function broadcastRoom(ws, payload) {
  const room = rooms.get(ws.room);
  if (!room) return;
  room.clients.forEach(client => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

wss.on('connection', ws => {
  ws.on('message', message => {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (error) {
      return;
    }

    if (msg.type === 'create-room') {
      createRoom(ws, msg.game);
      return;
    }

    if (msg.type === 'join-room') {
      joinRoom(ws, msg.code, msg.game);
      return;
    }

    if (msg.type === 'leave-room') {
      removeFromRoom(ws);
      return;
    }

    if (msg.type === 'game-event') {
      broadcastRoom(ws, msg);
      return;
    }
  });

  ws.on('close', () => {
    removeFromRoom(ws);
  });
});

server.listen(PORT, () => {
  console.log(`Retro Game Hub running on http://localhost:${PORT}`);
});
