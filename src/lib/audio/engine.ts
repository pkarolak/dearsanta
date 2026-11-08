"use client";

import { melodies, noteFrequency } from "./melodies";

export type VoiceLine = { id: string; text: string; audioUrl: string | null; cue?: "bells" | "drumroll" | "chime" | "laugh" };

const SPEECH_LANG: Record<string, string> = { pl: "pl-PL", en: "en-GB", de: "de-DE", es: "es-ES", pt: "pt-PT" };
const MUSIC_LEVEL = 0.22;

/**
 * Everything Santa's workshop sounds like, synthesised live with the Web Audio API:
 * a music box playing public-domain carols, sleigh bells, workshop hammers and a crackling fire.
 * Santa's voice plays from generated audio, or falls back to the browser's speech synthesis.
 */
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
  private fakeLevel = 0;
  private audioCache = new Map<string, Promise<string | null>>();
  private currentAudio: HTMLAudioElement | null = null;
  private speakToken = 0;
  muted = false;

  get unlocked() {
    return !!this.ctx && this.ctx.state === "running";
  }

  async unlock() {
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
    }
    if (this.ctx.state !== "running") await this.ctx.resume();
    // iOS only allows speech synthesis after a gesture-initiated utterance.
    if ("speechSynthesis" in window) speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    if (this.currentAudio) this.currentAudio.muted = muted;
    if (muted && "speechSynthesis" in window) speechSynthesis.cancel();
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

  private musicBoxNote(freq: number, when: number, velocity = 1) {
    const ctx = this.ctx!;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(0.32 * velocity, when + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0008, when + 1.6);
    env.connect(this.music);
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

  private noiseBurst(when: number, opts: { freq: number; q?: number; level: number; decay: number; type?: BiquadFilterType }) {
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
    src.connect(filter).connect(env).connect(this.sfx);
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

  private duck(on: boolean) {
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(on ? MUSIC_LEVEL * 0.3 : MUSIC_LEVEL, this.ctx.currentTime, 0.25);
  }

  /* ---------- Santa's voice ---------- */

  /** Fetches generated audio ahead of time. Resolves to an object URL, or null to use speech synthesis. */
  prefetch(url: string | null) {
    if (!url) return Promise.resolve(null);
    let cached = this.audioCache.get(url);
    if (!cached) {
      cached = fetch(url)
        .then(async (res) => (res.status === 200 ? URL.createObjectURL(await res.blob()) : null))
        .catch(() => null);
      this.audioCache.set(url, cached);
    }
    return cached;
  }

  /** Current loudness of Santa's voice, 0..1, for lip sync. */
  level() {
    if (this.fakeLevel > 0) return this.fakeLevel;
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
    this.fakeLevel = 0;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    this.duck(false);
  }

  /** Speaks a line and resolves when it has finished (or was interrupted). */
  async speak(line: VoiceLine, lang: string, startAt = 0): Promise<void> {
    const token = ++this.speakToken;
    if (line.cue) this.cue(line.cue);
    const src = await this.prefetch(line.audioUrl);
    if (token !== this.speakToken) return;
    this.duck(true);
    try {
      if (src && this.ctx) await this.playAudio(src, token, startAt);
      else await this.speakSynth(line.text, lang, token);
    } finally {
      if (token === this.speakToken) this.duck(false);
    }
  }

  private playAudio(src: string, token: number, startAt: number) {
    return new Promise<void>((resolve) => {
      const audio = new Audio(src);
      audio.muted = this.muted;
      this.currentAudio = audio;
      const node = this.ctx!.createMediaElementSource(audio);
      node.connect(this.voice);
      const done = () => {
        node.disconnect();
        if (this.currentAudio === audio) this.currentAudio = null;
        resolve();
      };
      audio.addEventListener("ended", done);
      audio.addEventListener("error", done);
      audio.addEventListener("pause", () => token !== this.speakToken && done());
      audio.addEventListener("loadedmetadata", () => {
        if (startAt > 0 && startAt < audio.duration) audio.currentTime = startAt;
      });
      audio.play().catch(done);
    });
  }

  private speakSynth(text: string, lang: string, token: number) {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window) || this.muted) {
        // Still give the subtitles time to be read.
        setTimeout(resolve, Math.max(1800, text.length * 55));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      const bcp = SPEECH_LANG[lang] ?? lang;
      utterance.lang = bcp;
      const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith(bcp.slice(0, 2)));
      const preferred =
        voices.find((v) => /male|daniel|jorge|markus|google uk english male|krzysztof|reed|grandpa/i.test(v.name)) ??
        voices.find((v) => v.localService) ??
        voices[0];
      if (preferred) utterance.voice = preferred;
      utterance.pitch = 0.75;
      utterance.rate = 0.92;
      let wobble: ReturnType<typeof setInterval> | null = null;
      const finish = () => {
        if (wobble) clearInterval(wobble);
        this.fakeLevel = 0;
        resolve();
      };
      utterance.onstart = () => {
        wobble = setInterval(() => {
          if (token !== this.speakToken) return finish();
          this.fakeLevel = 0.25 + Math.abs(Math.sin(Date.now() / 90)) * 0.6 * Math.random();
        }, 70);
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      speechSynthesis.speak(utterance);
      // Some browsers never fire onend; never hang the ceremony.
      setTimeout(finish, Math.max(4000, text.length * 120));
    });
  }
}

let instance: WorkshopAudio | null = null;
export function workshopAudio() {
  instance ??= new WorkshopAudio();
  return instance;
}
