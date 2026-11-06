/**
 * AudioManager — procedural audio via Web Audio API.
 * No external libraries; every sound is synthesized on-the-fly with
 * oscillators, gain envelopes, and filtered noise.
 */
export class AudioManager {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.muted = false;
  }

  /**
   * Lazily create the AudioContext (must be called from a user gesture).
   */
  initContext() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // ── sound effects ──────────────────────────────────────────────

  /** Short percussive click for hopping. */
  playHop() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.08);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Rising two-tone chime for coin pickup. */
  playCoin() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;

    // Note 1 — C5 (523 Hz)
    this._tone(523, t, 0.1, 'sine', 0.15);
    // Note 2 — E5 (659 Hz)
    this._tone(659, t + 0.1, 0.1, 'sine', 0.15);
  }

  /** Low thud on death. */
  playDeath() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** White noise burst through bandpass filter — water splash. */
  playSplash() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const dur = 0.2;

    // Create white noise buffer
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.Q.setValueAtTime(1, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0, t + dur);

    noise.connect(filter).connect(gain).connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + dur);
  }

  /** Repeating bell tone for incoming train. */
  playTrainWarning() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      this._tone(800, t + i * 0.15, 0.08, 'sine', 0.12);
    }
  }

  /** Low horn blast for train. */
  playTrainHorn() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0.2, t + 0.4);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  /** Descending screech for the eagle / idle-too-long punisher. */
  playEagle() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  /** Ascending arpeggio C-E-G-C for new high score celebration. */
  playNewHighScore() {
    if (!this._ready()) return;
    const t = this.ctx.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    for (let i = 0; i < notes.length; i++) {
      this._tone(notes[i], t + i * 0.1, 0.1, 'sine', 0.15);
    }
  }

  // ── private helpers ────────────────────────────────────────────

  /**
   * Returns true if context is ready and not muted.
   */
  _ready() {
    if (this.muted) return false;
    if (!this.ctx) this.initContext();
    if (!this.ctx) return false;
    // Resume suspended context (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  /**
   * Play a simple tone with an auto-decaying gain envelope.
   * @param {number} freq      — frequency in Hz
   * @param {number} startTime — AudioContext time to start
   * @param {number} dur       — duration in seconds
   * @param {OscillatorType} type
   * @param {number} volume    — peak gain (0–1)
   */
  _tone(freq, startTime, dur, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.linearRampToValueAtTime(0, startTime + dur);

    osc.connect(gain).connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + dur);
  }
}
