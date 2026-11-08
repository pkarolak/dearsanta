"use client";

import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { JoinCodeForm } from "../JoinCodeForm";
import { SiteHeader } from "../SiteHeader";
import { SpeakerIcon } from "../icons";
import { readingMs, santaOnScreen, shots, type LineKey, type Transition } from "./script";
import { Shot } from "./shots";
import { Link } from "@/i18n/navigation";
import { workshopAudio, type VoiceLine } from "@/lib/audio/engine";

type Props = { lines: Record<LineKey, VoiceLine>; lang: string };
type Pos = { shot: number; beat: number };

const last: Pos = { shot: shots.length - 1, beat: shots[shots.length - 1].beats.length - 1 };

const enter = {
  fade: { opacity: 0 },
  zoom: { opacity: 0, scale: 1.08 },
  whip: { x: "100%", filter: "blur(18px)" },
  iris: { clipPath: "circle(0% at 50% 45%)" },
} satisfies Record<Transition, object>;
const leave = {
  fade: { opacity: 0 },
  zoom: { opacity: 0, scale: 1.5, filter: "blur(10px)" },
  whip: { x: "-100%", filter: "blur(18px)" },
  iris: { opacity: 1 },
} satisfies Record<Transition, object>;
const speed: Record<Transition, number> = { fade: 0.9, zoom: 0.9, whip: 0.55, iris: 1 };

/**
 * The landing page's opening: a little puppet film that plays by itself, silent with subtitles,
 * until the viewer turns the sound on. It ends on the call to action and stays there.
 */
export function StoryFilm({ lines, lang }: Props) {
  const t = useTranslations("film");
  const th = useTranslations("home");
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<Pos>({ shot: 0, beat: 0 });
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [sound, setSound] = useState(false);
  const [run, setRun] = useState(0);
  const progress = useMotionValue(0);

  const shot = shots[pos.shot];
  const beat = shot.beats[pos.beat];
  const line = beat.line ? lines[beat.line] : null;
  const ended = !Number.isFinite(beat.ms);
  const active = !paused && visible;
  const beatMs = line ? Math.max(beat.ms, readingMs(line.text)) : beat.ms;

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

  useEffect(() => {
    if (!active || ended) return;
    const audio = workshopAudio();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    progress.set(0);
    const bar = animate(progress, 1, { duration: beatMs / 1000, ease: "linear" });
    if (sound && beat.sfx) audio.effect(beat.sfx);
    const minimum = new Promise<void>((r) => (timer = setTimeout(r, beatMs)));
    const voice = sound && line ? audio.speak(line, lang) : Promise.resolve();
    Promise.all([minimum, voice]).then(() => {
      if (cancelled) return;
      setPos((p) => (p.beat + 1 < shots[p.shot].beats.length ? { shot: p.shot, beat: p.beat + 1 } : { shot: p.shot + 1, beat: 0 }));
    });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      bar.stop();
      audio.stopVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, active, sound, run]);

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

  const seek = (p: Pos) => {
    setPaused(false);
    setPos(p);
    setRun((r) => r + 1);
  };

  const transition = reduced ? "fade" : shot.enter;

  return (
    <section ref={ref} aria-label={t("label")} className="relative h-svh min-h-[36rem] overflow-hidden bg-ink">
      <AnimatePresence initial={false} custom={transition}>
        <motion.div
          key={pos.shot}
          className="absolute inset-0"
          custom={transition}
          variants={{
            initial: (tr: Transition) => ({ ...enter[tr], zIndex: 1 }),
            shown: { opacity: 1, scale: 1, x: "0%", filter: "blur(0px)", clipPath: "circle(150% at 50% 45%)", zIndex: 1 },
            gone: (tr: Transition) => ({ ...leave[tr], zIndex: 0 }),
          }}
          initial="initial"
          animate="shown"
          exit="gone"
          transition={{ duration: speed[transition], ease: [0.6, 0, 0.2, 1] }}
        >
          <Shot
            id={shot.id}
            beat={pos.beat}
            beatMs={beatMs}
            talking={!!line && santaOnScreen.includes(shot.id) && active}
            sound={sound}
            ended={ended}
            eve={t("eve")}
            lang={lang}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-x-0 top-0 z-30">
        <SiteHeader tone="dark" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[6.5rem] z-20 flex justify-center px-5 md:bottom-28" aria-live="polite">
        <AnimatePresence mode="wait">
          {line && (
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

      <CallToAction shown={ended} title={th("title")} lead={th("heroLead")} create={th("create")} haveCode={th("haveCode")} />

      <div
        className={`absolute z-40 flex items-center gap-2 px-4 md:px-6 ${ended ? "right-0 top-[4.25rem] md:top-auto md:bottom-6" : "inset-x-0 bottom-5 md:bottom-7"}`}
      >
        {!ended && (
          <>
            <button
              onClick={() => (paused ? seek(pos) : setPaused(true))}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-snow text-ink hover:bg-cream"
              aria-label={paused ? t("play") : t("pause")}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
            <div className="flex h-11 min-w-0 flex-1 items-center gap-1.5">
              {shots.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => seek({ shot: i, beat: 0 })}
                  className="group flex h-full flex-1 items-center"
                  aria-label={t("scene", { n: i + 1 })}
                  aria-current={i === pos.shot ? "step" : undefined}
                >
                  <Segment index={i} pos={pos} progress={progress} />
                </button>
              ))}
            </div>
            <button onClick={() => seek(last)} className="h-11 shrink-0 rounded-full px-3 font-semibold text-snow hover:bg-snow/15">
              {t("skip")}
            </button>
          </>
        )}
        {ended && (
          <button onClick={() => seek({ shot: 0, beat: 0 })} className="h-11 rounded-full bg-snow px-4 font-semibold text-ink hover:bg-cream">
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
    </section>
  );
}

function Segment({ index, pos, progress }: { index: number; pos: Pos; progress: MotionValue<number> }) {
  const beats = shots[index].beats.filter((b) => Number.isFinite(b.ms)).length;
  const width = useTransform(progress, (p) => {
    if (index < pos.shot) return "100%";
    if (index > pos.shot) return "0%";
    return `${Math.min(1, (pos.beat + p) / Math.max(1, beats)) * 100}%`;
  });
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
          <Link href="/new" className="btn-primary mt-5 w-full text-lg sm:w-auto md:mt-6">
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
