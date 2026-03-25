const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname)));

// ── ROOM MANAGEMENT ───────────────────────────────────────────────────────────
const rooms = {}; // roomCode -> { players: [], game: null, state: {}, chat: [] }

function genCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function createRoom(game) {
  let code;
  do { code = genCode(); } while (rooms[code]);
  rooms[code] = { players: [], game, state: {}, chat: [], started: false };
  return code;
}

function getRoom(code) { return rooms[code]; }

function roomInfo(room) {
  return {
    players: room.players.map(p => ({ id: p.id, name: p.name, ready: p.ready })),
    game: room.game,
    started: room.started
  };
}

// ── GAME STATE HELPERS ───────────────────────────────────────────────────────

// PONG: server-authoritative
function initPongState() {
  return {
    ball: { x: 310, y: 200, dx: 5, dy: 3 },
    p1y: 160, p2y: 160,
    score: [0, 0],
    W: 620, H: 400, PH: 80, PW: 12, BR: 9
  };
}

function tickPong(s) {
  s.ball.x += s.ball.dx;
  s.ball.y += s.ball.dy;
  const { W, H, PH, PW, BR } = s;
  if (s.ball.y < BR) { s.ball.y = BR; s.ball.dy *= -1; }
  if (s.ball.y > H - BR) { s.ball.y = H - BR; s.ball.dy *= -1; }
  // player1 pad (left)
  if (s.ball.x - BR < 10 + PW && s.ball.y > s.p1y && s.ball.y < s.p1y + PH && s.ball.dx < 0) {
    s.ball.dx = Math.min(10, -s.ball.dx * 1.05);
    s.ball.dy += ((s.ball.y - (s.p1y + PH / 2)) / (PH / 2)) * 2.5;
  }
  // player2 pad (right)
  if (s.ball.x + BR > W - 10 - PW && s.ball.y > s.p2y && s.ball.y < s.p2y + PH && s.ball.dx > 0) {
    s.ball.dx = Math.max(-10, -s.ball.dx * 1.05);
    s.ball.dy += ((s.ball.y - (s.p2y + PH / 2)) / (PH / 2)) * 2.5;
  }
  let scored = null;
  if (s.ball.x < 0) { s.score[1]++; scored = 1; resetBall(s, 1); }
  if (s.ball.x > W) { s.score[0]++; scored = 0; resetBall(s, -1); }
  return scored;
}

function resetBall(s, dir) {
  s.ball.x = s.W / 2; s.ball.y = s.H / 2;
  const spd = Math.min(8, 4.5 + (s.score[0] + s.score[1]) * 0.15);
  s.ball.dx = spd * dir;
  s.ball.dy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

// TIC-TAC-TOE
function initTTTState() {
  return { board: new Array(9).fill(''), turn: 'X', over: false };
}
const TTT_WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function checkTTT(board, p) {
  return TTT_WINS.find(w => w.every(i => board[i] === p)) || null;
}

// SNAKE MULTIPLAYER - both snakes on same board
function initSnakeState() {
  return {
    snakes: [
      { body: [{x:5,y:10},{x:4,y:10},{x:3,y:10}], dx:1, dy:0, alive:true, score:0 },
      { body: [{x:17,y:10},{x:18,y:10},{x:19,y:10}], dx:-1, dy:0, alive:true, score:0 }
    ],
    food: { x: 11, y: 10 },
    N: 22
  };
}

function tickSnake(s) {
  const N = s.N;
  s.snakes.forEach((sn, idx) => {
    if (!sn.alive) return;
    const h = { x: sn.body[0].x + sn.dx, y: sn.body[0].y + sn.dy };
    // wall collision
    if (h.x < 0 || h.x >= N || h.y < 0 || h.y >= N) { sn.alive = false; return; }
    // self collision
    if (sn.body.some(seg => seg.x === h.x && seg.y === h.y)) { sn.alive = false; return; }
    // other snake collision
    const other = s.snakes[1 - idx];
    if (other.body.some(seg => seg.x === h.x && seg.y === h.y)) { sn.alive = false; return; }
    sn.body.unshift(h);
    if (h.x === s.food.x && h.y === s.food.y) {
      sn.score++;
      s.food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    } else {
      sn.body.pop();
    }
  });
}

// ── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connect', socket.id);

  // ── CREATE ROOM ──
  socket.on('create-room', ({ game, name }) => {
    const code = createRoom(game);
    const room = getRoom(code);
    room.players.push({ id: socket.id, name: name || 'Spieler 1', ready: false, index: 0 });
    socket.join(code);
    socket.data.room = code;
    socket.data.name = name;
    socket.emit('room-created', { code, index: 0 });
    io.to(code).emit('room-update', roomInfo(room));
  });

  // ── JOIN ROOM ──
  socket.on('join-room', ({ code, name }) => {
    const room = getRoom(code);
    if (!room) { socket.emit('error', 'Raum nicht gefunden!'); return; }
    if (room.players.length >= 2) { socket.emit('error', 'Raum ist voll!'); return; }
    if (room.started) { socket.emit('error', 'Spiel läuft bereits!'); return; }
    const idx = room.players.length;
    room.players.push({ id: socket.id, name: name || 'Spieler ' + (idx + 1), ready: false, index: idx });
    socket.join(code);
    socket.data.room = code;
    socket.data.name = name;
    socket.emit('room-joined', { code, index: idx, game: room.game });
    io.to(code).emit('room-update', roomInfo(room));
  });

  // ── READY / START ──
  socket.on('player-ready', () => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.ready = true;
    io.to(code).emit('room-update', roomInfo(room));
    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      startGame(code, room);
    }
  });

  // ── CHAT ──
  socket.on('chat-msg', ({ msg }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room || !msg || msg.trim().length === 0) return;
    const name = room.players.find(p => p.id === socket.id)?.name || 'Anonym';
    const entry = { name, msg: msg.trim().substring(0, 120), time: Date.now() };
    room.chat.push(entry);
    io.to(code).emit('chat-msg', entry);
  });

  // ── PONG INPUT ──
  socket.on('pong-input', ({ y }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room || room.game !== 'pong') return;
    const idx = room.players.findIndex(p => p.id === socket.id);
    if (idx === 0) room.state.p1y = Math.max(0, Math.min(320, y));
    if (idx === 1) room.state.p2y = Math.max(0, Math.min(320, y));
  });

  // ── SNAKE INPUT ──
  socket.on('snake-input', ({ dx, dy }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room || room.game !== 'snake') return;
    const idx = room.players.findIndex(p => p.id === socket.id);
    const sn = room.state.snakes?.[idx];
    if (!sn) return;
    if (dx !== 0 && sn.dx === 0) { sn.dx = dx; sn.dy = 0; }
    if (dy !== 0 && sn.dy === 0) { sn.dy = dy; sn.dx = 0; }
  });

  // ── TTT MOVE ──
  socket.on('ttt-move', ({ index }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room || room.game !== 'tictactoe') return;
    const st = room.state;
    const pIdx = room.players.findIndex(p => p.id === socket.id);
    const symbol = pIdx === 0 ? 'X' : 'O';
    if (st.over || st.turn !== symbol || st.board[index]) return;
    st.board[index] = symbol;
    const win = checkTTT(st.board, symbol);
    if (win) { st.over = true; io.to(code).emit('ttt-state', { ...st, winLine: win }); return; }
    if (!st.board.includes('')) { st.over = true; io.to(code).emit('ttt-state', { ...st, winLine: null }); return; }
    st.turn = st.turn === 'X' ? 'O' : 'X';
    io.to(code).emit('ttt-state', st);
  });

  // ── MEMORY FLIP ──
  socket.on('memory-flip', ({ index }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room || room.game !== 'memory') return;
    const st = room.state;
    if (st.locked || st.flipped.includes(index) || st.matched.includes(index)) return;
    st.flipped.push(index);
    io.to(code).emit('memory-state', st);
    if (st.flipped.length === 2) {
      st.locked = true;
      const [a, b] = st.flipped;
      const pIdx = room.players.findIndex(p => p.id === socket.id);
      if (st.cards[a] === st.cards[b]) {
        st.matched.push(a, b);
        st.scores[pIdx]++;
        st.flipped = [];
        st.locked = false;
        io.to(code).emit('memory-state', st);
        if (st.matched.length === st.cards.length) {
          io.to(code).emit('game-over', { scores: st.scores, players: room.players.map(p=>p.name) });
        }
      } else {
        setTimeout(() => {
          st.flipped = [];
          st.locked = false;
          st.tries++;
          io.to(code).emit('memory-state', st);
        }, 900);
      }
    }
  });

  // ── SCORE SYNC (for tetris, breakout, 2048, mole) ──
  socket.on('score-update', ({ score }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room) return;
    const idx = room.players.findIndex(p => p.id === socket.id);
    if (!room.state.scores) room.state.scores = [0, 0];
    room.state.scores[idx] = score;
    io.to(code).emit('score-sync', { scores: room.state.scores, players: room.players.map(p => p.name) });
  });

  socket.on('game-finished', ({ score }) => {
    const code = socket.data.room;
    const room = getRoom(code);
    if (!room) return;
    const idx = room.players.findIndex(p => p.id === socket.id);
    if (!room.state.finished) room.state.finished = [false, false];
    if (!room.state.finalScores) room.state.finalScores = [0, 0];
    room.state.finished[idx] = true;
    room.state.finalScores[idx] = score;
    io.to(code).emit('score-sync', { scores: room.state.finalScores, players: room.players.map(p => p.name) });
    if (room.state.finished.every(Boolean)) {
      io.to(code).emit('game-over', { scores: room.state.finalScores, players: room.players.map(p => p.name) });
    }
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    const code = socket.data.room;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      if (room._interval) clearInterval(room._interval);
      delete rooms[code];
    } else {
      io.to(code).emit('player-left', { name: socket.data.name });
      io.to(code).emit('room-update', roomInfo(room));
    }
  });
});

// ── GAME START ────────────────────────────────────────────────────────────────
function startGame(code, room) {
  room.started = true;
  io.to(code).emit('game-start', { game: room.game, players: room.players.map(p => ({ name: p.name, index: p.index })) });

  if (room.game === 'pong') {
    room.state = initPongState();
    room._interval = setInterval(() => {
      const scored = tickPong(room.state);
      io.to(code).emit('pong-state', room.state);
      if (room.state.score[0] >= 7 || room.state.score[1] >= 7) {
        clearInterval(room._interval);
        io.to(code).emit('game-over', {
          scores: room.state.score,
          players: room.players.map(p => p.name)
        });
        room.started = false;
      }
    }, 16);
  } else if (room.game === 'snake') {
    room.state = initSnakeState();
    room._interval = setInterval(() => {
      tickSnake(room.state);
      io.to(code).emit('snake-state', room.state);
      const alive = room.state.snakes.filter(s => s.alive);
      if (alive.length === 0 || (room.state.snakes.some(s=>!s.alive))) {
        // give 1s grace
        if (!room._endTimer) {
          room._endTimer = setTimeout(() => {
            clearInterval(room._interval);
            io.to(code).emit('game-over', {
              scores: room.state.snakes.map(s => s.score),
              players: room.players.map(p => p.name)
            });
            room.started = false;
          }, 1000);
        }
      }
    }, 130);
  } else if (room.game === 'tictactoe') {
    room.state = initTTTState();
    io.to(code).emit('ttt-state', room.state);
  } else if (room.game === 'memory') {
    const emojis = ['🎮','🎯','🎲','🏆','⭐','💎','🔥','🚀','🎪','🎨','🎭','🦊'];
    const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    room.state = { cards, flipped: [], matched: [], scores: [0, 0], tries: 0, locked: false };
    io.to(code).emit('memory-state', room.state);
  }
  // tetris, breakout, 2048, mole: score-sync only
}

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
