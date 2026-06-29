/**
 * RETRO GAME HUB — sound.js
 * Web Audio API — Sound Effects + Background Music Engine
 *
 * 5 unique procedural chiptune tracks (zero audio files):
 *   'home'  — upbeat bouncy C-major lobby theme
 *   'login' — gentle slow ambient welcome theme
 *   'ttt'   — tense A-minor battle theme
 *   'dots'  — funky F-major strategy theme
 *   'snl'   — playful G-major adventure theme
 */

const Sound = (() => {
  let ctx = null;
  let sfxEnabled = true;
  let musicEnabled = false;

  let currentTrack  = null;
  let musicNodes    = [];
  let musicGainNode = null;
  let musicTimer    = null;
  let musicStep     = 0;

  // ── Audio context (lazy init, Safari safe) ──────────────────
  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function getMasterGain() {
    const c = getCtx();
    if (!musicGainNode) {
      musicGainNode = c.createGain();
      musicGainNode.gain.setValueAtTime(0.18, c.currentTime);
      musicGainNode.connect(c.destination);
    }
    return musicGainNode;
  }

  // ── Low-level tone builders ──────────────────────────────────
  function beep(freq, type, dur, vol = 0.3, t0) {
    if (!sfxEnabled) return;
    try {
      const c = getCtx();
      const t = t0 || c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch(_) {}
  }

  function sweep(f1, f2, type, dur, vol = 0.3) {
    if (!sfxEnabled) return;
    try {
      const c = getCtx(), t = c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(f1, t);
      o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch(_) {}
  }

  function musicNote(freq, waveType, t0, dur, vol) {
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(getMasterGain());
      o.type = waveType;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      g.gain.setValueAtTime(vol, t0 + dur * 0.72);
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      o.start(t0); o.stop(t0 + dur + 0.05);
      musicNodes.push(o);
    } catch(_) {}
  }

  function killMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    musicNodes.forEach(n => { try { n.stop(); } catch(_) {} });
    musicNodes = [];
    musicStep  = 0;
    currentTrack = null;
  }

  // ── Note frequency table (A4 = 440 Hz) ──────────────────────
  const N = {
    C3:130.8, D3:146.8, E3:164.8, F3:174.6, G3:196.0, A3:220.0, B3:246.9,
    C4:261.6, D4:293.7, E4:329.6, F4:349.2, G4:392.0, A4:440.0, B4:493.9,
    C5:523.3, D5:587.3, E5:659.3, F5:698.5, G5:784.0, A5:880.0, B5:987.8,
    C6:1046,  D6:1175,  E6:1319,  _: 0,
  };

  // ── Track definitions ────────────────────────────────────────
  // Each array is a looping sequence of 8th notes.
  // melody   → square wave  (chiptune lead)
  // bass     → triangle wave (warm low end)
  // harmony  → sine wave    (smooth chords, optional)

  const TRACKS = {

    // ────────────────────────────────────────────────────────────
    // HOME SCREEN  —  Upbeat bouncy C-major lobby jingle
    // Feel: welcoming, energetic, nostalgic arcade lobby
    // ────────────────────────────────────────────────────────────
    home: {
      bpm: 152,
      melody: [
        N.E5, N.G5, N.A5, N.G5,  N.E5, N.C5, N.D5, N.E5,
        N.F5, N.A5, N.G5, N.F5,  N.E5, N.G5, N.C6, N._,
        N.D5, N.F5, N.A5, N.G5,  N.F5, N.E5, N.D5, N.C5,
        N.E5, N.G5, N.A5, N.B5,  N.C6, N.B5, N.A5, N._,
      ],
      bass: [
        N.C3, N._, N.G3, N._,    N.A3, N._, N.F3, N._,
        N.F3, N._, N.C3, N._,    N.G3, N._, N.C3, N._,
        N.D3, N._, N.A3, N._,    N.F3, N._, N.C3, N._,
        N.C3, N._, N.G3, N._,    N.C3, N._, N.G3, N._,
      ],
      harmony: [
        N.C4, N._, N.E4, N._,    N.A4, N._, N.F4, N._,
        N.F4, N._, N.C4, N._,    N.E4, N._, N.C4, N._,
        N.D4, N._, N.F4, N._,    N.A4, N._, N.F4, N._,
        N.C4, N._, N.E4, N._,    N.C4, N._, N.E4, N._,
      ],
    },

    // ────────────────────────────────────────────────────────────
    // LOGIN / REGISTER SCREEN  —  Gentle ambient C-major welcome
    // Feel: calm, peaceful, "you're home"
    // ────────────────────────────────────────────────────────────
    login: {
      bpm: 88,
      melody: [
        N.E4, N._, N.G4, N._,    N.A4, N._, N._, N._,
        N.F4, N._, N.E4, N._,    N.D4, N._, N._, N._,
        N.C4, N._, N.E4, N._,    N.G4, N._, N._, N._,
        N.A4, N._, N.G4, N._,    N.E4, N._, N._, N._,
      ],
      bass: [
        N.C3, N._, N._, N._,     N.A3, N._, N._, N._,
        N.F3, N._, N._, N._,     N.G3, N._, N._, N._,
        N.C3, N._, N._, N._,     N.E3, N._, N._, N._,
        N.A3, N._, N._, N._,     N.G3, N._, N._, N._,
      ],
      harmony: null,
    },

    // ────────────────────────────────────────────────────────────
    // TIC-TAC-TOE  —  Tense A-minor battle theme
    // Feel: focused, competitive, "every move matters"
    // ────────────────────────────────────────────────────────────
    ttt: {
      bpm: 130,
      melody: [
        N.A4, N._, N.C5, N.B4,   N.A4, N._, N._, N._,
        N.E5, N._, N.D5, N._,    N.C5, N.B4, N.A4, N._,
        N.F4, N._, N.A4, N.G4,   N.F4, N._, N.E4, N._,
        N.A4, N.C5, N.E5, N._,   N.A5, N._, N._, N._,
      ],
      bass: [
        N.A3, N._, N.A3, N._,    N.A3, N._, N.E3, N._,
        N.F3, N._, N.F3, N._,    N.E3, N._, N.E3, N._,
        N.D3, N._, N.D3, N._,    N.A3, N._, N.E3, N._,
        N.A3, N._, N.E3, N._,    N.A3, N._, N._, N._,
      ],
      harmony: [
        N.C4, N._, N.E4, N._,    N.A4, N._, N._, N._,
        N.F4, N._, N.A4, N._,    N.E4, N._, N.A4, N._,
        N.D4, N._, N.F4, N._,    N.C4, N._, N.E4, N._,
        N.A4, N._, N.E4, N._,    N.A4, N._, N._, N._,
      ],
    },

    // ────────────────────────────────────────────────────────────
    // DOTS & BOXES  —  Funky bouncy F-major strategy theme
    // Feel: playful but smart, "thinking on your feet"
    // ────────────────────────────────────────────────────────────
    dots: {
      bpm: 140,
      melody: [
        N.F5, N._, N.A5, N.G5,   N.F5, N.E5, N.F5, N._,
        N.C5, N._, N.D5, N._,    N.F5, N._, N.A5, N._,
        N.G5, N._, N.F5, N.E5,   N.F5, N._, N.C5, N._,
        N.A5, N.G5, N.F5, N._,   N.F5, N._, N._, N._,
      ],
      bass: [
        N.F3, N._, N.C3, N._,    N.F3, N._, N.A3, N._,
        N.D3, N._, N.A3, N._,    N.F3, N._, N.C3, N._,
        N.G3, N._, N.D3, N._,    N.F3, N._, N.C3, N._,
        N.F3, N.C3, N.F3, N._,   N.F3, N._, N.C3, N._,
      ],
      harmony: [
        N.A4, N._, N.C4, N._,    N.F4, N._, N.A4, N._,
        N.D4, N._, N.F4, N._,    N.A4, N._, N.C4, N._,
        N.G4, N._, N.B4, N._,    N.F4, N._, N.A4, N._,
        N.A4, N._, N.C4, N._,    N.F4, N._, N._, N._,
      ],
    },

    // ────────────────────────────────────────────────────────────
    // SNAKES & LADDERS  —  Playful rolling G-major adventure
    // Feel: luck, excitement, unpredictability, childhood fun
    // ────────────────────────────────────────────────────────────
    snl: {
      bpm: 122,
      melody: [
        N.G4, N.B4, N.D5, N._,   N.G5, N._, N.F5, N.E5,
        N.D5, N._, N.B4, N._,    N.G4, N._, N.A4, N.B4,
        N.C5, N.E5, N.G5, N._,   N.A5, N._, N.G5, N._,
        N.D5, N.B4, N.G4, N._,   N.G4, N._, N._, N._,
      ],
      bass: [
        N.G3, N._, N.D3, N._,    N.G3, N._, N.B3, N._,
        N.C3, N._, N.G3, N._,    N.D3, N._, N.G3, N._,
        N.C3, N._, N.E3, N._,    N.A3, N._, N.D3, N._,
        N.G3, N._, N.D3, N._,    N.G3, N._, N.B3, N._,
      ],
      harmony: [
        N.B4, N._, N.G4, N._,    N.D4, N._, N.B4, N._,
        N.E4, N._, N.C4, N._,    N.G4, N._, N.D4, N._,
        N.C4, N._, N.E4, N._,    N.A4, N._, N.F4, N._,
        N.B4, N._, N.G4, N._,    N.D4, N._, N.B4, N._,
      ],
    },
    hangman: {
      bpm: 98,
      melody: [
        N.E4, N._, N.G4, N._, N.A4, N._, N.G4, N._,
        N.F4, N._, N.E4, N._, N.D4, N._, N.C4, N._,
        N.C4, N._, N.D4, N._, N.E4, N._, N.F4, N._,
        N.G4, N._, N._, N._, N._, N._, N._, N._,
      ],
      bass: [
        N.C3, N._, N.C3, N._, N.A2, N._, N.A2, N._,
        N.F2, N._, N.F2, N._, N.C3, N._, N._, N._,
        N.C3, N._, N.C3, N._, N.A2, N._, N.A2, N._,
        N.F2, N._, N._, N._, N._, N._, N._, N._,
      ],
      harmony: [
        N.G3, N._, N.E3, N._, N.D3, N._, N.C3, N._,
        N.G3, N._, N.E3, N._, N.D3, N._, N.C3, N._,
        N.G3, N._, N.E3, N._, N.D3, N._, N.C3, N._,
        N.G3, N._, N._, N._, N._, N._, N._, N._,
      ],
    },
    memory: {
      bpm: 136,
      melody: [
        N.C5, N._, N.E5, N._, N.F5, N._, N.E5, N._,
        N.D5, N._, N.C5, N._, N.B4, N._, N.C5, N._,
        N.D5, N._, N.E5, N._, N.F5, N._, N.G5, N._,
        N._, N._, N._, N._, N._, N._, N._, N._,
      ],
      bass: [
        N.C3, N._, N._, N._, N.F3, N._, N._, N._,
        N.D3, N._, N._, N._, N.C3, N._, N._, N._,
        N.G3, N._, N._, N._, N.C3, N._, N._, N._,
        N._, N._, N._, N._, N._, N._, N._, N._,
      ],
      harmony: [
        N.A4, N._, N._, N._, N.C5, N._, N._, N._,
        N.B4, N._, N._, N._, N.D5, N._, N._, N._,
        N.C5, N._, N._, N._, N.G4, N._, N._, N._,
        N._, N._, N._, N._, N._, N._, N._, N._,
      ],
    },
    tetris: {
      bpm: 140,
      melody: [
        N.E5, N._, N.B4, N._, N.C5, N._, N.D5, N._,
        N.C5, N._, N.B4, N._, N.A4, N._, N.A4, N._,
        N.B4, N._, N._, N.B4, N._, N.D5, N._, N.E5, N._,
        N.C5, N._, N.A4, N._, N.B4, N._, N._, N._,
      ],
      bass: [
        N.A3, N._, N._, N._, N.E3, N._, N._, N._,
        N.F3, N._, N._, N._, N.G3, N._, N._, N._,
        N.A3, N._, N._, N._, N.E3, N._, N._, N._,
        N.F3, N._, N._, N._, N.G3, N._, N._, N._,
      ],
      harmony: [
        N.A4, N._, N._, N._, N.E4, N._, N._, N._,
        N.F4, N._, N._, N._, N.G4, N._, N._, N._,
        N.A4, N._, N._, N._, N.E4, N._, N._, N._,
        N.F4, N._, N._, N._, N.G4, N._, N._, N._,
      ],
    },
    pong: {
      bpm: 120,
      melody: [
        N.G4, N._, N._, N._, N.G4, N._, N._, N._,
        N.C5, N._, N._, N._, N.G4, N._, N._, N._,
        N.E4, N._, N._, N._, N.E4, N._, N._, N._,
        N.D4, N._, N.C4, N._, N.G4, N._, N._, N._,
      ],
      bass: [
        N.G2, N._, N._, N._, N.C3, N._, N._, N._,
        N.E3, N._, N._, N._, N.G2, N._, N._, N._,
        N.C3, N._, N._, N._, N.G2, N._, N._, N._,
        N.D3, N._, N._, N._, N.G2, N._, N._, N._,
      ],
      harmony: [
        N.D4, N._, N._, N._, N.E4, N._, N._, N._,
        N.D4, N._, N._, N._, N.B3, N._, N._, N._,
        N.C4, N._, N._, N._, N.D4, N._, N._, N._,
        N.B3, N._, N._, N._, N.G3, N._, N._, N._,
      ],
    },
  };

  // ── Step sequencer ───────────────────────────────────────────
  function startSequencer(trackName) {
    const track = TRACKS[trackName];
    if (!track) return;
    currentTrack = trackName;

    const c       = getCtx();
    const stepSec = (60 / track.bpm / 2);       // 8th-note length in seconds
    const stepMs  = stepSec * 1000;
    const len     = track.melody.length;

    musicTimer = setInterval(() => {
      if (!musicEnabled) { killMusic(); return; }
      const now = c.currentTime;
      const i   = musicStep % len;

      if (track.melody[i]  > 0) musicNote(track.melody[i],  'square',   now, stepSec * 0.82, 0.12);
      if (track.bass[i]    > 0) musicNote(track.bass[i],    'triangle', now, stepSec * 0.90, 0.10);
      if (track.harmony && track.harmony[i] > 0)
                                musicNote(track.harmony[i], 'sine',     now, stepSec * 0.78, 0.07);
      musicStep++;
    }, stepMs);
  }

  function fadeInMusic(name, fadeSec = 1.5) {
    if (!musicEnabled) return;
    if (currentTrack === name) return;       // already playing this track
    killMusic();
    try {
      const c = getCtx();
      const g = getMasterGain();
      g.gain.cancelScheduledValues(c.currentTime);
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.18, c.currentTime + fadeSec);
    } catch(_) {}
    startSequencer(name);
  }

  function fadeOutMusic(fadeSec = 1.0) {
    try {
      if (!musicGainNode) return;
      const c = getCtx();
      const g = musicGainNode.gain;
      g.cancelScheduledValues(c.currentTime);
      g.setValueAtTime(g.value, c.currentTime);
      g.linearRampToValueAtTime(0, c.currentTime + fadeSec);
    } catch(_) {}
    setTimeout(() => killMusic(), (fadeSec + 0.15) * 1000);
  }

  // ── Sound effects ────────────────────────────────────────────
  const SFX = {
    click()   { beep(800,  'square',   0.06, 0.15); },
    move()    { beep(440,  'square',   0.08, 0.12); },
    place()   { sweep(300, 600, 'square',   0.10, 0.20); },
    error()   { beep(150,  'sawtooth', 0.20, 0.20); },
    draw()    { sweep(440, 220, 'square',   0.30, 0.15); },
    select()  { beep(660,  'square',   0.05, 0.20); },
    capture() {
      beep(600, 'square', 0.05, 0.3);
      setTimeout(() => beep(900, 'square', 0.05, 0.3), 60);
    },
    roll() {
      for (let i = 0; i < 6; i++)
        setTimeout(() => beep(200 + Math.random() * 400, 'square', 0.04, 0.15), i * 40);
    },
    ladder() {
      const c = getCtx(), t = c.currentTime;
      [300,400,500,700,900].forEach((f,i) => beep(f,'square',0.10,0.20, t + i*0.08));
    },
    snake()  { sweep(600, 150, 'sawtooth', 0.4, 0.2); },
    boot() {
      const c = getCtx(), t = c.currentTime;
      beep(130,'square',0.10,0.20, t);
      beep(196,'square',0.10,0.20, t+0.15);
      beep(262,'square',0.20,0.25, t+0.30);
    },
    coin() {
      beep(988,  'square', 0.06, 0.3);
      setTimeout(() => beep(1319,'square',0.10,0.3), 80);
    },
    win() {
      const c = getCtx(), t = c.currentTime;
      [523,659,784,1047].forEach((f,i) => beep(f,'square',0.18,0.25, t + i*0.14));
    },
  };

  // ── Public API ───────────────────────────────────────────────
  return {
    play(name)         { if (SFX[name]) SFX[name](); },

    playMusic(track)   { fadeInMusic(track, 1.5); },
    stopMusic()        { fadeOutMusic(1.0); },

    setEnabled(v)      { sfxEnabled = v; },
    setMusicEnabled(v) {
      musicEnabled = v;
      if (!v) fadeOutMusic(0.5);
    },

    isEnabled()        { return sfxEnabled; },
    isMusicEnabled()   { return musicEnabled; },
    getCurrentTrack()  { return currentTrack; },
  };
})();

window.Sound = Sound;
