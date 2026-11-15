"use client";

import { chordVoicings, jingleBellsChords, melodies, noteFrequency } from "./melodies";

export type VoiceLine = {
  id: string;
  text: string;
  audioUrl: string | null;
  parts?: string[];
  seconds?: number;
  cue?: "bells" | "drumroll" | "chime" | "laugh";
};

export type FilmSfx =
  | "bells" | "whoosh" | "steps" | "giggle" | "sneeze" | "creak" | "clank" | "sputter" | "pop" | "sparkle" | "tick" | "splat" | "fanfare";

const MUSIC_LEVEL = 0.22;

/**
 * Everything Santa's workshop sounds like, synthesised live with the Web Audio API:
 * a music box playing public-domain carols, sleigh bells, workshop hammers and a crackling fire.
 * Santa's voice plays from generated audio, or falls back to the browser's speech synthesis.
 */
/** 50 ms of silent 8-bit WAV, played in the unlocking tap. */
function silentWav() {
  const samples = 400;
  const bytes = new Uint8Array(44 + samples).fill(128);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  return bytes;
}
const silence = () => `data:audio/wav;base64,${btoa(String.fromCharCode(...silentWav()))}`;
const readingMs = (text: string) => Math.max(1800, text.length * 55);

/** The server may still be recording a line (a few seconds) or briefly unreachable, so try again a few times. */
async function fetchRecording(url: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 800 * attempt));
    try {
      const res = await fetch(url);
      if (res.status === 200) return URL.createObjectURL(await res.blob());
      if (res.status !== 204 && res.status < 500) return null;
    } catch {
      // Network hiccup: retry.
    }
  }
  return null;
}

class WorkshopAudio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private voice!: GainNode;
  private analyser!: AnalyserNode;
  private levelData = new Uint8Array(256);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ambienceOn = false;
  private noise: AudioBuffer | null = null;
  private audioCache = new Map<string, Promise<string | null>>();
  private currentAudio: HTMLAudioElement | null = null;
  /** One element for every line: iOS lets an element play later only if a tap started it once. */
  private voiceEl: HTMLAudioElement | null = null;
  private speakToken = 0;
  private draining: Promise<void> = Promise.resolve();
  muted = false;

  get unlocked() {
    return !!this.ctx && this.ctx.state === "running";
  }

  async unlock() {
    this.unlockVoice();
    // Safari: play through the ring/silent switch like a video would.
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.music = this.gain(MUSIC_LEVEL);
      this.sfx = this.gain(0.5);
      this.voice = this.gain(1);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.voice.connect(this.analyser);
      this.noise = this.makeNoise();
      if (this.voiceEl) this.ctx.createMediaElementSource(this.voiceEl).connect(this.voice);
      // A locked screen, a call or a trip to another app suspends the sound; coming back brings it back.
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && this.ctx && this.ctx.state !== "running") void this.ctx.resume().catch(() => {});
      });
    }
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  /** Must run synchronously inside the tap that turns the sound on. */
  private unlockVoice() {
    if (this.voiceEl) return;
    const el = new Audio(silence());
    el.preload = "auto";
    el.play().catch(() => {});
    this.voiceEl = el;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    if (this.currentAudio) this.currentAudio.muted = muted;
  }

  private gain(value: number) {
    const g = this.ctx!.createGain();
    g.gain.value = value;
    g.connect(this.master);
    return g;
  }

  private makeNoise() {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private later(fn: () => void, ms: number) {
    this.timers.push(setTimeout(fn, ms));
  }

  /* ---------- instruments ---------- */

  private musicBoxNote(freq: number, when: number, velocity = 1, out = this.music) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(0.32 * velocity, when + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0008, when + 1.6);
    env.connect(out);
    [
      [1, 1],
      [2, 0.28],
      [3.01, 0.12],
      [5.4, 0.05],
    ].forEach(([mult, amp]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * 2 * mult;
      g.gain.value = amp;
      osc.connect(g).connect(env);
      osc.start(when);
      osc.stop(when + 1.7);
    });
  }

  private bellTone(freq: number, when: number, level = 0.2, decay = 1.2, out = this.sfx) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(level, when + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0005, when + decay);
    env.connect(out);
    [1, 2.76, 5.4].forEach((m, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq * m;
      g.gain.value = [1, 0.4, 0.15][i];
      osc.connect(g).connect(env);
      osc.start(when);
      osc.stop(when + decay + 0.05);
    });
  }

  private noiseBurst(when: number, opts: { freq: number; q?: number; level: number; decay: number; type?: BiquadFilterType; out?: GainNode }) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.type ?? "bandpass";
    filter.frequency.value = opts.freq;
    filter.Q.value = opts.q ?? 1;
    const env = ctx.createGain();
    env.gain.setValueAtTime(opts.level, when);
    env.gain.exponentialRampToValueAtTime(0.0005, when + opts.decay);
    src.connect(filter).connect(env).connect(opts.out ?? this.sfx);
    src.start(when, Math.random() * 1.5, opts.decay + 0.05);
  }

  sleighBells(intensity = 1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const hits = Math.round(10 + intensity * 14);
    for (let i = 0; i < hits; i++) {
      const t = now + i * 0.045 + Math.random() * 0.03;
      this.noiseBurst(t, { freq: 6500 + Math.random() * 3000, q: 8, level: 0.12 * intensity, decay: 0.12 });
      this.bellTone(2400 + Math.random() * 1800, t, 0.03 * intensity, 0.25);
    }
  }

  private hammer() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const taps = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < taps; i++) {
      const t = ctx.currentTime + i * (0.28 + Math.random() * 0.1);
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
      env.gain.setValueAtTime(0.18, t);
      env.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      osc.connect(env).connect(this.sfx);
      osc.start(t);
      osc.stop(t + 0.15);
      this.noiseBurst(t, { freq: 2200, q: 3, level: 0.08, decay: 0.04 });
    }
  }

  private crackle() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(t, { freq: 1800 + Math.random() * 2500, q: 2, level: 0.03 + Math.random() * 0.05, decay: 0.03 + Math.random() * 0.05 });
  }

  drumroll(seconds = 2.6) {
    if (!this.ctx) return;
    const start = this.ctx.currentTime;
    const hits = Math.round(seconds * 26);
    for (let i = 0; i < hits; i++) {
      const p = i / hits;
      this.noiseBurst(start + i / 26, { freq: 300 + p * 200, q: 1.4, level: 0.06 + p * 0.22, decay: 0.07 });
    }
    this.noiseBurst(start + seconds, { freq: 7000, type: "highpass", level: 0.25, decay: 1.6 });
    this.noiseBurst(start + seconds, { freq: 120, type: "lowpass", level: 0.5, decay: 0.4 });
  }

  chime() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    ["C6", "E6", "G6", "C7"].forEach((n, i) => this.bellTone(noteFrequency(n), t + i * 0.12, 0.12, 1.8));
  }

  cue(cue: VoiceLine["cue"]) {
    if (cue === "bells" || cue === "laugh") this.sleighBells(cue === "bells" ? 1 : 0.5);
    if (cue === "drumroll") this.drumroll();
    if (cue === "chime") this.chime();
  }

  /* ---------- ambience ---------- */

  startAmbience() {
    if (!this.ctx || this.ambienceOn) return;
    this.ambienceOn = true;
    this.playMelody(Math.floor(Math.random() * melodies.length));

    const fireLoop = () => {
      if (!this.ambienceOn) return;
      this.crackle();
      this.later(fireLoop, 60 + Math.random() * 380);
    };
    const hammerLoop = () => {
      if (!this.ambienceOn) return;
      this.hammer();
      this.later(hammerLoop, 4500 + Math.random() * 7000);
    };
    const bellLoop = () => {
      if (!this.ambienceOn) return;
      this.sleighBells(0.35);
      this.later(bellLoop, 14000 + Math.random() * 12000);
    };
    fireLoop();
    this.later(hammerLoop, 2500);
    this.later(bellLoop, 6000);
  }

  private playMelody(index: number) {
    if (!this.ctx || !this.ambienceOn) return;
    const melody = melodies[index % melodies.length];
    const beat = 60 / melody.bpm;
    let t = this.ctx.currentTime + 0.2;
    for (const [note, beats] of melody.notes) {
      if (note !== "R") this.musicBoxNote(noteFrequency(note), t, 0.8 + Math.random() * 0.2);
      t += beats * beat;
    }
    const total = (t - this.ctx.currentTime) * 1000;
    this.later(() => this.playMelody(index + 1), total + 2500);
  }

  stopAmbience() {
    this.ambienceOn = false;
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  /* ---------- the landing film's score: a full little Jingle Bells band ---------- */

  private scoreBus: GainNode | null = null;
  private scoreTimer: ReturnType<typeof setTimeout> | null = null;

  startScore() {
    if (!this.ctx || this.scoreBus) return;
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0, this.ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 1.2);
    bus.connect(this.music);
    this.scoreBus = bus;
    this.playChorus(0, this.ctx.currentTime + 0.15);
  }

  /** Every note of the chorus is scheduled ahead of time, so stopping cuts the whole bus they play through. */
  stopScore() {
    if (this.scoreTimer) clearTimeout(this.scoreTimer);
    this.scoreTimer = null;
    const bus = this.scoreBus;
    this.scoreBus = null;
    if (!bus || !this.ctx) return;
    bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
    setTimeout(() => bus.disconnect(), 800);
  }

  private playChorus(round: number, start: number) {
    const bus = this.scoreBus;
    if (!this.ctx || !bus) return;
    const beat = 60 / 132;
    const melody = melodies[0].notes.filter(([n]) => n !== "R");
    let t = start;
    for (const [note, beats] of melody) {
      this.musicBoxNote(noteFrequency(note) * (round % 2 ? 2 : 1), t, 0.75, bus);
      t += beats * beat;
    }
    jingleBellsChords.forEach((chord, bar) => {
      const v = chordVoicings[chord];
      const b0 = start + bar * 4 * beat;
      this.pluck(noteFrequency(v.bass[0]), b0, 0.3, bus);
      this.pluck(noteFrequency(v.bass[1]), b0 + 2 * beat, 0.24, bus);
      for (const off of [1, 3]) v.stab.forEach((n) => this.stab(noteFrequency(n), b0 + off * beat, bus));
      for (let e = 0; e < 8; e++) {
        this.noiseBurst(b0 + e * beat * 0.5, { freq: 8500, type: "highpass", level: e % 2 ? 0.018 : 0.04, decay: 0.07, out: bus });
      }
      if (bar % 4 === 3) this.bellTone(noteFrequency("G6"), b0 + 3.5 * beat, 0.05, 0.6, bus);
    });
    const end = start + 64 * beat;
    this.scoreTimer = setTimeout(() => this.playChorus(round + 1, end), (end - this.ctx.currentTime - 1) * 1000);
  }

  private pluck(freq: number, when: number, level: number, out: GainNode) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(level, when + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0008, when + 0.45);
    osc.connect(env).connect(out);
    osc.start(when);
    osc.stop(when + 0.5);
  }

  private stab(freq: number, when: number, out: GainNode) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(0.055, when + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, when + 0.28);
    env.connect(out);
    for (const [type, mult] of [["triangle", 1], ["sine", 2]] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mult;
      osc.connect(env);
      osc.start(when);
      osc.stop(when + 0.3);
    }
  }

  /* ---------- the film's sound effects ---------- */

  effect(name: FilmSfx) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    switch (name) {
      case "bells":
        return this.sleighBells(1);
      case "whoosh": {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 1.2;
        filter.frequency.setValueAtTime(350, now);
        filter.frequency.exponentialRampToValueAtTime(2600, now + 0.35);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.75);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.001, now);
        env.gain.exponentialRampToValueAtTime(0.5, now + 0.3);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        src.connect(filter).connect(env).connect(this.sfx);
        src.start(now, 0, 0.85);
        return;
      }
      case "steps":
        for (let i = 0; i < 6; i++) {
          const t = now + i * 0.42 + Math.random() * 0.04;
          this.noiseBurst(t, { freq: 700 + Math.random() * 300, q: 0.7, type: "lowpass", level: 0.35, decay: 0.14 });
          this.noiseBurst(t + 0.03, { freq: 2500, q: 2, level: 0.08, decay: 0.08 });
        }
        return;
      case "giggle":
        [1320, 1240, 1150, 1060, 980].forEach((f, i) => this.blip(f, now + i * 0.12, 0.09));
        return;
      case "sneeze":
        [0, 0.5, 1.0].forEach((d, i) => this.vowel(200 + i * 60, now + d, 0.38));
        this.noiseBurst(now + 1.55, { freq: 2400, q: 0.8, level: 0.9, decay: 0.4 });
        this.noiseBurst(now + 1.55, { freq: 180, type: "lowpass", level: 0.7, decay: 0.2 });
        return;
      case "creak": {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(70, now);
        for (let i = 1; i <= 12; i++) osc.frequency.linearRampToValueAtTime(70 + Math.random() * 90 + i * 4, now + i * 0.075);
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 900;
        filter.Q.value = 5;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.5, now + 0.1);
        env.gain.linearRampToValueAtTime(0.35, now + 0.7);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        osc.connect(filter).connect(env).connect(this.sfx);
        osc.start(now);
        osc.stop(now + 1);
        return;
      }
      case "clank":
        [180, 431, 697, 1130].forEach((f) => this.bellTone(f, now, 0.12, 0.7));
        this.noiseBurst(now, { freq: 3200, q: 1.5, level: 0.4, decay: 0.15 });
        this.noiseBurst(now + 0.18, { freq: 2200, q: 2, level: 0.2, decay: 0.1 });
        return;
      case "sputter": {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 1.4);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(16, now);
        lfo.frequency.linearRampToValueAtTime(3, now + 1.4);
        const am = ctx.createGain();
        am.gain.value = 0;
        const depth = ctx.createGain();
        depth.gain.value = 0.08;
        lfo.connect(depth).connect(am.gain);
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 900;
        osc.connect(filter).connect(am).connect(this.sfx);
        [osc, lfo].forEach((o) => {
          o.start(now);
          o.stop(now + 1.5);
        });
        return;
      }
      case "pop":
        return this.blip(420, now, 0.12, 1100);
      case "sparkle":
        ["C7", "E7", "G7", "C8"].forEach((n, i) => this.bellTone(noteFrequency(n), now + i * 0.07, 0.06, 0.9));
        return;
      case "tick":
        this.noiseBurst(now, { freq: 4200, q: 6, level: 0.35, decay: 0.03 });
        return;
      case "splat":
        this.noiseBurst(now, { freq: 380, type: "lowpass", level: 0.9, decay: 0.3 });
        this.noiseBurst(now + 0.02, { freq: 1300, q: 0.9, level: 0.35, decay: 0.22 });
        return;
      case "fanfare":
        [["G4", 0, 0.14], ["G4", 0.16, 0.14], ["G4", 0.32, 0.14], ["C5", 0.48, 0.9]].forEach(([n, d, len]) =>
          [1, 1.26, 1.5].forEach((ratio) => this.brass(noteFrequency(n as string) * ratio, now + (d as number), len as number)),
        );
        this.sleighBells(0.7);
        return;
    }
  }

  private blip(freq: number, when: number, len: number, to = freq * 0.8) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(to, when + len);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(0.22, when + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, when + len);
    osc.connect(env).connect(this.sfx);
    osc.start(when);
    osc.stop(when + len + 0.02);
  }

  /** A sung "ah", for the build-up to a sneeze. */
  private vowel(pitch: number, when: number, len: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(pitch, when);
    osc.frequency.linearRampToValueAtTime(pitch * 1.25, when + len);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(0.16, when + 0.06);
    env.gain.exponentialRampToValueAtTime(0.001, when + len);
    for (const [f, q] of [[800, 6], [1250, 8]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = q;
      osc.connect(bp).connect(env);
    }
    env.connect(this.sfx);
    osc.start(when);
    osc.stop(when + len + 0.02);
  }

  private brass(freq: number, when: number, len: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, when);
    filter.frequency.linearRampToValueAtTime(2600, when + 0.06);
    filter.frequency.linearRampToValueAtTime(1400, when + len);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(0.07, when + 0.04);
    env.gain.setValueAtTime(0.07, when + len * 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, when + len + 0.15);
    filter.connect(env).connect(this.sfx);
    for (const detune of [-8, 8]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(when);
      osc.stop(when + len + 0.2);
    }
  }

  private duck(on: boolean) {
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(on ? MUSIC_LEVEL * 0.3 : MUSIC_LEVEL, this.ctx.currentTime, 0.25);
  }

  /* ---------- Santa's voice ---------- */

  /** Fetches Santa's recording ahead of time. Resolves to an object URL, or null if there is none. */
  prefetch(url: string | null) {
    if (!url) return Promise.resolve(null);
    let cached = this.audioCache.get(url);
    if (!cached) {
      cached = fetchRecording(url);
      this.audioCache.set(url, cached);
      // A dropped connection or a server restart shouldn't silence this line for the rest of the visit.
      void cached.then((src) => src ?? this.audioCache.delete(url));
    }
    return cached;
  }

  /** Fetches every recording a line needs. */
  prefetchLine(line: VoiceLine) {
    return Promise.all(line.parts?.length ? line.parts.map((url) => this.prefetch(url)) : [this.prefetch(line.audioUrl)]);
  }

  /** Current loudness of Santa's voice, 0..1, for lip sync. */
  level() {
    if (!this.ctx || !this.currentAudio) return 0;
    this.analyser.getByteTimeDomainData(this.levelData);
    let sum = 0;
    for (const v of this.levelData) sum += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / this.levelData.length) * 4.5);
  }

  stopVoice() {
    this.speakToken++;
    this.currentAudio?.pause();
    this.currentAudio = null;
    this.duck(false);
  }

  /**
   * Lets the sentence Santa is saying end on its own when little of it is left, rather than cutting
   * him off mid-word; a longer one stops now.
   */
  finishVoice(maxMs: number) {
    const audio = this.currentAudio;
    const left = audio && !audio.paused && audio.duration ? (audio.duration - audio.currentTime) * 1000 : 0;
    if (!audio || left <= 0 || left > maxMs) return this.stopVoice();
    const token = this.speakToken;
    this.draining = new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        audio.removeEventListener("ended", done);
        resolve();
      };
      const timer = setTimeout(() => {
        if (token === this.speakToken) this.stopVoice();
        done();
      }, left + 300);
      audio.addEventListener("ended", done);
    });
  }

  /** Resolves once a sentence that was allowed to finish is over. */
  voiceSettled() {
    return this.draining;
  }

  /** Speaks a line and resolves when it has finished (or was interrupted). */
  async speak(line: VoiceLine, startAt = 0): Promise<void> {
    const token = ++this.speakToken;
    const started = Date.now();
    if (line.cue) this.cue(line.cue);
    const srcs = await this.prefetchLine(line);
    if (token !== this.speakToken) return;
    this.duck(true);
    try {
      // Without Santa's recording the line stays silent: a robotic stand-in voice would break the show.
      if (this.ctx && this.voiceEl && srcs.every(Boolean)) {
        if (srcs.length === 1) await this.playAudio(srcs[0]!, token, startAt);
        // Pieces can't be sought into, so someone arriving mid-line just reads the subtitle.
        else if (startAt === 0) for (const src of srcs) if (token === this.speakToken) await this.playAudio(src!, token, 0);
      }
      // A refused or missing recording must not flash the subtitle by.
      const left = startAt > 0 ? 0 : readingMs(line.text) * 0.8 - (Date.now() - started);
      if (left > 0 && token === this.speakToken) await new Promise((r) => setTimeout(r, left));
    } finally {
      if (token === this.speakToken) this.duck(false);
    }
  }

  private playAudio(src: string, token: number, startAt: number) {
    return new Promise<void>((resolve) => {
      const audio = this.voiceEl!;
      let settled = false;
      const cleanup = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        audio.removeEventListener("pause", paused);
        audio.removeEventListener("loadedmetadata", seek);
      };
      const done = () => {
        if (settled) return;
        settled = true;
        cleanup();
        if (this.currentAudio === audio) this.currentAudio = null;
        resolve();
      };
      const paused = () => token !== this.speakToken && done();
      const seek = () => {
        if (startAt > 0 && startAt < audio.duration) audio.currentTime = startAt;
      };
      audio.addEventListener("ended", done);
      audio.addEventListener("error", done);
      audio.addEventListener("pause", paused);
      audio.addEventListener("loadedmetadata", seek);
      audio.muted = this.muted;
      audio.src = src;
      this.currentAudio = audio;
      audio.play().catch(done);
    });
  }
}

let instance: WorkshopAudio | null = null;
export function workshopAudio() {
  instance ??= new WorkshopAudio();
  return instance;
}
