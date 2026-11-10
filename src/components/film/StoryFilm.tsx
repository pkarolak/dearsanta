"use client";

import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { JoinCodeForm } from "../JoinCodeForm";
import { SiteHeader } from "../SiteHeader";
import { GiftIcon, SpeakerIcon } from "../icons";
import { clipSrc, clips, readingMs, type LineKey } from "./script";
import { Link } from "@/i18n/navigation";
import { workshopAudio, type VoiceLine } from "@/lib/audio/engine";

type Props = { lines: Record<LineKey, VoiceLine>; lang: string };

const lastClip = clips.length - 1;
const portrait = "(max-aspect-ratio: 4/5)";

function useTall() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = matchMedia(portrait);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => matchMedia(portrait).matches,
    () => false,
  );
}

/**
 * The landing page's opening: a puppet film that plays by itself, silent with subtitles,
 * until the viewer turns the sound on. It ends on the call to action, with the last clip looping behind it.
 */
export function StoryFilm({ lines, lang }: Props) {
  const t = useTranslations("film");
  const th = useTranslations("home");
  const reduced = useReducedMotion();
  const tall = useTall();
  const ref = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [clip, setClip] = useState(0);
  const [behind, setBehind] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [sound, setSound] = useState(false);
  const [ended, setEnded] = useState(false);
  const [line, setLine] = useState<VoiceLine | null>(null);
  const progress = useMotionValue(0);
  // Scrolling on, the film sinks back and dims while the next scene slides up over it.
  const { scrollYProgress: leaving } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sink = useTransform(leaving, [0, 1], ["0%", reduced ? "0%" : "55%"]);
  const dim = useTransform(leaving, [0, 0.9], [0, 0.85]);
  // Sinking keeps the film in the viewport, so it counts as gone once the next scene covers most of it.
  const [covered, setCovered] = useState(false);
  useMotionValueEvent(leaving, "change", (v) => setCovered(v > 0.6));
  const active = !paused && visible && !covered;
  const soundRef = useRef(sound);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);
  // With reduced motion the film doesn't start by itself: it rests on the finale until asked to play.
  const resting = !!reduced && !run;
  const at = resting ? lastClip : clip;
  const done = ended || resting;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.intersectionRatio >= 0.4 && !document.hidden), { threshold: [0, 0.4, 1] });
    io.observe(el);
    const onHide = () => setVisible(!document.hidden && el.getBoundingClientRect().bottom > innerHeight * 0.4);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    Object.values(lines).forEach((l) => workshopAudio().prefetch(l.audioUrl));
  }, [lines]);

  // Plays the current clip, firing its cues on time, and moves on once it and its narration are done.
  useEffect(() => {
    const v = video.current;
    if (!v || resting) return;
    const audio = workshopAudio();
    const cues = clips[clip].cues;
    let next = cues.findIndex((q) => q.at >= v.currentTime - 0.05);
    if (next < 0) next = cues.length;
    let voice: Promise<unknown> = Promise.resolve();
    let talking = false;
    let frame = 0;
    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const say = (l: VoiceLine) => {
      talking = true;
      setLine(l);
      const spoken = soundRef.current ? audio.speak(l, lang) : Promise.resolve();
      const read = new Promise<void>((r) => timers.push(setTimeout(r, readingMs(l.text))));
      voice = Promise.all([spoken, read]).then(() => {
        talking = false;
        if (stopped) return;
        setLine((cur) => (cur?.id === l.id ? null : cur));
        if (clip === lastClip) setEnded(true);
      });
    };
    const fire = () => {
      const q = cues[next++];
      if (q.sfx && soundRef.current) audio.effect(q.sfx);
      if (q.line) say(lines[q.line]);
    };
    // A line waits for the one before it to finish, so Santa never talks over himself.
    const tick = () => {
      while (next < cues.length && v.currentTime >= cues[next].at && !(cues[next].line && talking)) fire();
      if (v.duration) progress.set(v.currentTime / v.duration);
      frame = requestAnimationFrame(tick);
    };
    const onEnd = async () => {
      await voice;
      while (next < cues.length && !stopped) {
        fire();
        await voice;
      }
      if (stopped) return;
      setBehind(clip);
      setClip(clip + 1);
    };

    if (active) {
      v.play().catch((e: DOMException) => e.name === "NotAllowedError" && setPaused(true));
      frame = requestAnimationFrame(tick);
    } else {
      v.pause();
    }
    v.addEventListener("ended", onEnd);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      v.removeEventListener("ended", onEnd);
      audio.stopVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip, active, run, tall, resting]);

  useEffect(() => {
    const audio = workshopAudio();
    if (sound && active) audio.startScore();
    else audio.stopScore();
  }, [sound, active]);
  useEffect(() => () => workshopAudio().stopScore(), []);

  const toggleSound = async () => {
    const audio = workshopAudio();
    if (sound) {
      audio.stopVoice();
      audio.setMuted(true);
      setSound(false);
      return;
    }
    try {
      await audio.unlock();
    } catch {
      return;
    }
    audio.setMuted(false);
    audio.effect("bells");
    setSound(true);
  };

  const seek = (to: number, end = false) => {
    setPaused(false);
    setBehind(null);
    setLine(null);
    setEnded(end);
    setClip(to);
    setRun((r) => r + 1);
  };

  const current = clips[at];
  const entry = reduced ? "fade" : current.entry;
  const upcoming = resting ? undefined : clips[at + 1];

  return (
    <motion.section ref={ref} aria-label={t("label")} className="relative h-svh min-h-[36rem] overflow-hidden bg-ink" style={{ y: sink }}>
      {behind !== null && (
        <video
          key={`behind-${behind}-${tall}`}
          src={clipSrc(clips[behind].id, tall, "mp4")}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => (e.currentTarget.currentTime = e.currentTarget.duration - 0.05)}
          aria-hidden
        />
      )}
      <motion.video
        key={`${at}-${run}-${tall}`}
        ref={video}
        src={clipSrc(current.id, tall, "mp4")}
        poster={clipSrc(current.id, tall, "jpg")}
        className="absolute inset-0 h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
        loop={at === lastClip}
        initial={{ opacity: entry === "fade" && behind !== null ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        onPlaying={() => setTimeout(() => setBehind(null), 800)}
        aria-hidden
      />
      {upcoming && <video key={`next-${clip}-${tall}`} src={clipSrc(upcoming.id, tall, "mp4")} className="hidden" muted preload="auto" aria-hidden />}
      <AnimatePresence>
        {entry === "white" && behind !== null && (
          <motion.div
            key={`white-${clip}`}
            className="absolute inset-0 bg-snow"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
          />
        )}
      </AnimatePresence>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/55 via-transparent via-45% to-ink/75" />

      <div className="absolute inset-x-0 top-0 z-30">
        <SiteHeader tone="dark" cta={!done} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[5.5rem] z-20 flex justify-center px-5 md:bottom-28" aria-live="polite">
        <AnimatePresence mode="wait">
          {line && !done && (
            <motion.p
              key={line.id}
              className="max-w-[46rem] text-balance text-center font-display text-[clamp(1.3rem,2.5vw,2.2rem)] font-bold leading-snug text-snow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <span className="box-decoration-clone rounded-xl bg-ink/80 px-3 py-1">{line.text}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <CallToAction shown={done} title={th("title")} lead={th("heroLead")} create={th("create")} haveCode={th("haveCode")} />

      <div
        className={`pointer-events-none absolute z-40 flex items-end gap-3 px-3 md:px-6 ${done ? "right-0 top-[4.25rem] md:top-auto md:bottom-6" : "inset-x-0 bottom-4 md:bottom-6"}`}
      >
        <AnimatePresence>
          {!done && (
            <motion.div
              className="pointer-events-auto hidden md:block"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
            >
              <Link
                href="/new"
                className="btn-primary whitespace-nowrap px-7 py-3.5 text-lg shadow-[0_12px_30px_-10px_rgb(0_0_0/0.7),inset_0_-3px_0_rgb(0_0_0/0.18)] ring-2 ring-gold/70"
              >
                <GiftIcon className="h-5 w-5" />
                {th("create")}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full bg-ink/60 p-1.5 shadow-[0_12px_30px_-12px_rgb(0_0_0/0.8)] ring-1 ring-snow/15 backdrop-blur-md ${done ? "" : "min-w-0 flex-1 md:ml-auto md:max-w-xl"}`}
        >
          {!done && (
            <>
              <button
                onClick={() => setPaused(!paused)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-snow text-ink hover:bg-cream"
                aria-label={paused ? t("play") : t("pause")}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <div className="flex h-11 min-w-0 flex-1 items-center gap-1 px-1.5">
                {clips.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => seek(i)}
                    className="group flex h-full flex-1 items-center"
                    aria-label={t("scene", { n: i + 1 })}
                    aria-current={i === clip ? "step" : undefined}
                  >
                    <Segment index={i} clip={at} progress={progress} />
                  </button>
                ))}
              </div>
              <button onClick={() => seek(lastClip, true)} className="h-11 shrink-0 rounded-full px-3.5 font-semibold text-snow hover:bg-snow/15">
                {t("skip")}
              </button>
            </>
          )}
          {done && (
            <button onClick={() => seek(0)} className="h-11 rounded-full bg-snow px-4 font-semibold text-ink hover:bg-cream">
              {t("replay")}
            </button>
          )}
          <button
            onClick={toggleSound}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-full font-semibold ${sound ? "w-11 justify-center bg-snow/15 text-snow hover:bg-snow/25" : "animate-nudge bg-berry px-4 text-snow hover:bg-berry-dark"}`}
            aria-label={sound ? t("soundOff") : t("soundOn")}
            aria-pressed={sound}
          >
            <SpeakerIcon muted={!sound} className="h-5 w-5" />
            {!sound && <span className="hidden sm:inline">{t("soundOn")}</span>}
          </button>
        </div>
      </div>
      <motion.div className="pointer-events-none absolute inset-0 z-50 bg-ink" style={{ opacity: dim }} />
    </motion.section>
  );
}

function Segment({ index, clip, progress }: { index: number; clip: number; progress: MotionValue<number> }) {
  const width = useTransform(progress, (p) => (index < clip ? "100%" : index > clip ? "0%" : `${Math.min(1, p) * 100}%`));
  return (
    <span className="relative block h-1 w-full overflow-hidden rounded-full bg-snow/30 transition-[height] group-hover:h-2">
      <motion.span className="absolute inset-y-0 left-0 block bg-snow" style={{ width }} />
    </span>
  );
}

function CallToAction({ shown, title, lead, create, haveCode }: { shown: boolean; title: string; lead: string; create: string; haveCode: string }) {
  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-30 px-4 pb-20 md:inset-x-auto md:bottom-auto md:left-[max(1.25rem,4vw)] md:top-[15%] md:w-[clamp(23rem,36vw,36rem)] md:p-0"
      initial={false}
      animate={shown ? { y: "0%", opacity: 1, rotate: 0 } : { y: "-130%", opacity: 0, rotate: -6 }}
      transition={shown ? { y: { type: "spring", stiffness: 120, damping: 13, delay: 0.4 }, opacity: { duration: 0.2, delay: 0.4 }, rotate: { type: "spring", stiffness: 60, damping: 5, delay: 0.4 } } : { duration: 0.4 }}
      style={{ transformOrigin: "50% -40%" }}
      inert={!shown}
    >
      <div className="absolute bottom-full left-[16%] hidden h-[100svh] w-1.5 rounded-full bg-gold-dark md:block" />
      <div className="absolute bottom-full right-[16%] hidden h-[100svh] w-1.5 rounded-full bg-gold-dark md:block" />
      <div className="relative rounded-felt bg-berry p-2.5">
        <div className="stitched pointer-events-none absolute inset-0 rounded-felt text-snow/45" />
        <div className="relative rounded-[1.3rem] bg-paper p-5 md:p-8">
          <h1 className="font-display text-[2rem] font-black leading-[0.95] tracking-[-0.025em] text-berry md:text-[clamp(2.4rem,3.3vw,3.7rem)]">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-ink md:mt-4 md:text-lg">{lead}</p>
          <Link href="/new" className="btn-primary mt-5 w-full text-lg sm:w-auto md:mt-6" data-cta>
            {create}
          </Link>
          <div className="mt-5 rounded-[1rem] bg-cream p-4 md:mt-6">
            <p className="label">{haveCode}</p>
            <JoinCodeForm />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
    </svg>
  );
}
