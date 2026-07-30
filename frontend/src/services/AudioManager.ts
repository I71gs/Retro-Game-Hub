/**
 * AudioManager — TypeScript port of the procedural Web Audio chiptune engine.
 * Zero audio files. All sounds generated via Web Audio API oscillators.
 */

type OscType = OscillatorType;

// Musical notes (Hz)
const NOTE: Record<string, number> = {
  C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
  C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00, B5:987.77,
  C6:1046.5, D6:1174.7, E6:1318.5,
  REST: 0,
};

class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private sfxEnabled = true;
  private musicEnabled = false;
  private musicNodes: AudioNode[] = [];
  private musicGainNode: GainNode | null = null;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTrack: string | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private getMasterGain(): GainNode {
    const c = this.getCtx();
    if (!this.musicGainNode) {
      this.musicGainNode = c.createGain();
      this.musicGainNode.gain.setValueAtTime(0.18, c.currentTime);
      this.musicGainNode.connect(c.destination);
    }
    return this.musicGainNode;
  }

  private beep(freq: number, type: OscType, dur: number, vol = 0.3, t0?: number) {
    if (!this.sfxEnabled) return;
    try {
      const c = this.getCtx();
      const t = t0 ?? c.currentTime;
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t);
      o.stop(t + dur + 0.01);
    } catch {}
  }

  play(sfx: string) {
    if (!this.sfxEnabled) return;
    const c = this.getCtx();
    const t = c.currentTime;
    switch (sfx) {
      case 'click':  this.beep(800, 'square', 0.05, 0.15, t); break;
      case 'select': this.beep(600, 'square', 0.08, 0.2, t); this.beep(900, 'square', 0.08, 0.2, t + 0.08); break;
      case 'move':   this.beep(440, 'square', 0.06, 0.18, t); break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 'square', 0.15, 0.25, t + i * 0.12));
        break;
      case 'draw':
        [523, 494, 440].forEach((f, i) => this.beep(f, 'triangle', 0.18, 0.2, t + i * 0.14));
        break;
      case 'error':
        [220, 196].forEach((f, i) => this.beep(f, 'sawtooth', 0.12, 0.3, t + i * 0.1));
        break;
      case 'boot':
        [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5].forEach((f, i) => this.beep(f, 'square', 0.1, 0.2, t + i * 0.15));
        break;
      case 'coin':
        this.beep(660, 'square', 0.08, 0.3, t);
        this.beep(880, 'square', 0.1, 0.3, t + 0.1);
        break;
      case 'achieve':
        [NOTE.C4,NOTE.E4,NOTE.G4,NOTE.C5,NOTE.E5].forEach((f,i) =>
          this.beep(f, 'square', 0.12, 0.25, t + i*0.1));
        break;
      case 'flip':   this.beep(550, 'triangle', 0.07, 0.15, t); break;
      case 'match':
        this.beep(660, 'square', 0.1, 0.2, t);
        this.beep(880, 'square', 0.12, 0.2, t + 0.1);
        break;
      case 'drop':   this.beep(300, 'square', 0.08, 0.2, t); break;
      case 'lineclr':
        [NOTE.C5,NOTE.E5,NOTE.G5,NOTE.C6].forEach((f,i) => this.beep(f, 'square', 0.1, 0.3, t + i*0.07));
        break;
      case 'hit':    this.beep(200, 'sawtooth', 0.15, 0.4, t); break;
      case 'miss':   this.beep(180, 'triangle', 0.1, 0.15, t); break;
      case 'guess-correct': this.beep(740, 'square', 0.1, 0.2, t); break;
      case 'guess-wrong':   this.beep(150, 'sawtooth', 0.15, 0.25, t); break;
      case 'dice':
        for (let i = 0; i < 5; i++) this.beep(200 + Math.random()*400, 'square', 0.04, 0.1, t + i*0.06);
        break;
    }
  }

  // ── Music Tracks ──────────────────────────────────────────────

  private scheduleNote(
    freq: number, type: OscType, dur: number, vol: number,
    t: number, detune = 0
  ) {
    try {
      const c = this.getCtx();
      const mg = this.getMasterGain();
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(mg);
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (detune) o.detune.setValueAtTime(detune, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.9);
      o.start(t);
      o.stop(t + dur);
      this.musicNodes.push(o);
    } catch {}
  }

  private TRACKS: Record<string, () => void> = {
    home: () => this.playHomeTrack(),
    login: () => this.playLoginTrack(),
    ttt: () => this.playTttTrack(),
    dots: () => this.playDotsTrack(),
    snl: () => this.playSnlTrack(),
    hangman: () => this.playTttTrack(),
    memory: () => this.playMemoryTrack(),
    tetris: () => this.playTetrisTrack(),
    pong: () => this.playPongTrack(),
  };

  private playHomeTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 160; const BEAT = 60 / BPM;
    const melody = [NOTE.C5,NOTE.E5,NOTE.G5,NOTE.C5,NOTE.A4,NOTE.G4,NOTE.E4,NOTE.C4,
                    NOTE.D4,NOTE.F4,NOTE.A4,NOTE.D5,NOTE.B4,NOTE.G4,NOTE.E4,NOTE.C4];
    const bass   = [NOTE.C3,NOTE.C3,NOTE.G3,NOTE.G3,NOTE.A3,NOTE.A3,NOTE.E3,NOTE.E3,
                    NOTE.D3,NOTE.D3,NOTE.A3,NOTE.A3,NOTE.G3,NOTE.G3,NOTE.E3,NOTE.E3];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'square', BEAT*0.8, 0.6, t + i*BEAT); });
    bass.forEach((f, i)   => { if (f !== NOTE.REST) this.scheduleNote(f, 'triangle', BEAT*1.8, 0.4, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'home') this.TRACKS.home(); }, loopDur * 1000);
  }

  private playLoginTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 80; const BEAT = 60 / BPM;
    const melody = [NOTE.C4,NOTE.E4,NOTE.G4,NOTE.B4,NOTE.A4,NOTE.G4,NOTE.F4,NOTE.E4,
                    NOTE.D4,NOTE.F4,NOTE.A4,NOTE.C5,NOTE.B4,NOTE.G4,NOTE.E4,NOTE.C4];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'sine', BEAT*1.5, 0.4, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'login') this.TRACKS.login(); }, loopDur * 1000);
  }

  private playTttTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 140; const BEAT = 60 / BPM;
    const melody = [NOTE.A4,NOTE.REST,NOTE.A4,NOTE.C5,NOTE.E5,NOTE.REST,NOTE.D5,NOTE.B4,
                    NOTE.G4,NOTE.REST,NOTE.G4,NOTE.B4,NOTE.D5,NOTE.REST,NOTE.C5,NOTE.A4];
    const bass   = [NOTE.A3,NOTE.A3,NOTE.E3,NOTE.E3,NOTE.A3,NOTE.A3,NOTE.G3,NOTE.G3,
                    NOTE.A3,NOTE.A3,NOTE.E3,NOTE.E3,NOTE.D3,NOTE.D3,NOTE.A3,NOTE.A3];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'sawtooth', BEAT*0.6, 0.5, t + i*BEAT); });
    bass.forEach((f, i)   => { if (f !== NOTE.REST) this.scheduleNote(f, 'square', BEAT*0.9, 0.35, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'ttt') this.TRACKS.ttt(); }, loopDur * 1000);
  }

  private playDotsTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 130; const BEAT = 60 / BPM;
    const melody = [NOTE.F4,NOTE.A4,NOTE.C5,NOTE.F5,NOTE.E5,NOTE.C5,NOTE.A4,NOTE.F4,
                    NOTE.G4,NOTE.B4,NOTE.D5,NOTE.G5,NOTE.F5,NOTE.D5,NOTE.B4,NOTE.G4];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'square', BEAT*0.75, 0.55, t + i*BEAT, i%2 ? 5 : -5); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'dots') this.TRACKS.dots(); }, loopDur * 1000);
  }

  private playSnlTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 120; const BEAT = 60 / BPM;
    const melody = [NOTE.G4,NOTE.A4,NOTE.B4,NOTE.C5,NOTE.D5,NOTE.C5,NOTE.B4,NOTE.A4,
                    NOTE.G4,NOTE.B4,NOTE.D5,NOTE.G5,NOTE.F5,NOTE.D5,NOTE.B4,NOTE.G4];
    const bass   = [NOTE.G3,NOTE.G3,NOTE.D3,NOTE.D3,NOTE.G3,NOTE.G3,NOTE.D3,NOTE.D3,
                    NOTE.G3,NOTE.G3,NOTE.B3,NOTE.B3,NOTE.C4,NOTE.C4,NOTE.G3,NOTE.G3];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'square', BEAT*0.7, 0.5, t + i*BEAT); });
    bass.forEach((f, i)   => { if (f !== NOTE.REST) this.scheduleNote(f, 'triangle', BEAT*1.5, 0.3, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'snl') this.TRACKS.snl(); }, loopDur * 1000);
  }

  private playMemoryTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 90; const BEAT = 60 / BPM;
    const melody = [NOTE.C5,NOTE.E5,NOTE.G5,NOTE.E5,NOTE.C5,NOTE.E5,NOTE.D5,NOTE.B4,
                    NOTE.A4,NOTE.C5,NOTE.E5,NOTE.C5,NOTE.A4,NOTE.C5,NOTE.B4,NOTE.G4];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'sine', BEAT*1.2, 0.45, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'memory') this.TRACKS.memory(); }, loopDur * 1000);
  }

  private playTetrisTrack() {
    // Korobeiniki-inspired melody
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 160; const BEAT = 60 / BPM;
    const melody = [
      NOTE.E5, NOTE.B4, NOTE.C5, NOTE.D5, NOTE.C5, NOTE.B4, NOTE.A4, NOTE.A4,
      NOTE.C5, NOTE.E5, NOTE.D5, NOTE.C5, NOTE.B4, NOTE.C5, NOTE.D5, NOTE.E5,
      NOTE.C5, NOTE.A4, NOTE.A4, NOTE.REST, NOTE.D5, NOTE.F5, NOTE.A5, NOTE.G5,
      NOTE.F5, NOTE.E5, NOTE.C5, NOTE.E5, NOTE.D5, NOTE.C5, NOTE.B4, NOTE.B4,
    ];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'square', BEAT*0.7, 0.5, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'tetris') this.TRACKS.tetris(); }, loopDur * 1000);
  }

  private playPongTrack() {
    const c = this.getCtx(); const t = c.currentTime;
    const BPM = 150; const BEAT = 60 / BPM;
    const melody = [NOTE.C4,NOTE.G4,NOTE.C5,NOTE.G4,NOTE.E5,NOTE.G4,NOTE.D5,NOTE.G4,
                    NOTE.C5,NOTE.G4,NOTE.B4,NOTE.G4,NOTE.A4,NOTE.G4,NOTE.G4,NOTE.REST];
    melody.forEach((f, i) => { if (f !== NOTE.REST) this.scheduleNote(f, 'square', BEAT*0.6, 0.45, t + i*BEAT); });
    const loopDur = melody.length * BEAT;
    this.musicTimer = setTimeout(() => { if (this.currentTrack === 'pong') this.TRACKS.pong(); }, loopDur * 1000);
  }

  // ── Public music controls ─────────────────────────────────────

  playMusic(track: string) {
    if (!this.musicEnabled) return;
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    const fn = this.TRACKS[track];
    if (fn) fn();
  }

  stopMusic() {
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
    this.musicNodes.forEach(n => {
      try { (n as OscillatorNode).stop(); } catch {}
    });
    this.musicNodes = [];
    this.currentTrack = null;
  }

  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (!v) this.stopMusic();
  }

  getCurrentTrack() {
    return this.currentTrack;
  }
}

export const AudioManager = new AudioManagerClass();
