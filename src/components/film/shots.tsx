"use client";

import { animate, AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../Avatar";
import { useMouth } from "../useVoice";
import { SantaPuppet } from "../show/SantaPuppet";
import { Confetti } from "../show/ShowStage";
import { Cutout, FilmSet, type Cam } from "./FilmSet";
import type { ShotId } from "./script";
import { workshopAudio, type FilmSfx } from "@/lib/audio/engine";
import { seededAvatar, type AvatarConfig } from "@/lib/avatar";

export type ShotProps = { beat: number; beatMs: number; talking: boolean; sound: boolean };

const play = (s: FilmSfx) => workshopAudio().effect(s);

/** Runs `fn` once, `ms` after `key` takes a value other than false. */
function useAt(key: unknown, ms: number, fn: () => void) {
  const f = useRef(fn);
  useEffect(() => {
    f.current = fn;
  });
  useEffect(() => {
    if (key === false) return;
    const t = setTimeout(() => f.current(), ms);
    return () => clearTimeout(t);
  }, [key, ms]);
}

/** Santa's mouth: the real voice when it is heard, otherwise a silent-film flap while his subtitle shows. */
function useSantaLevel(talking: boolean, sound: boolean) {
  const heard = useMouth(talking && sound);
  const [flap, setFlap] = useState(0);
  useEffect(() => {
    if (!talking || sound) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setFlap(i % 9 === 8 ? 0 : 0.15 + Math.abs(Math.sin(i * 1.9)) * 0.75);
    }, 115);
    return () => {
      clearInterval(timer);
      setFlap(0);
    };
  }, [talking, sound]);
  return sound ? heard : talking ? flap : 0;
}

function Santa({ level, className }: { level: number; className: string }) {
  return (
    <div className={`absolute ${className}`}>
      <motion.div
        animate={{ rotate: level > 0 ? 0 : [-1.2, 1.2, -1.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "50% 100%" }}
      >
        <SantaPuppet level={level} priority />
      </motion.div>
    </div>
  );
}

function Snow({ count = 46 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const size = 0.25 + ((i * 7) % 5) * 0.12;
        return (
          <span
            key={i}
            className="animate-snow absolute -top-4 block rounded-full bg-snow"
            style={{
              left: `${(i * 23) % 100}%`,
              width: `${size}rem`,
              height: `${size}rem`,
              opacity: 0.55 + ((i * 3) % 4) * 0.1,
              animationDuration: `${7 + ((i * 5) % 7)}s`,
              animationDelay: `${-((i * 11) % 13)}s`,
              ["--drift" as string]: `${((i % 5) - 2) * 3}vw`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- the village: the camera walks between buildings ---------- */

const villageCams: Record<"village" | "walkWorkshop" | "walkStable", Cam[]> = {
  village: [
    { x: 0.5, y: 0.08, z: 1.45 },
    { x: 0.45, y: 0.58, z: 2.3 },
  ],
  walkWorkshop: [
    { x: 0.44, y: 0.6, z: 1.6 },
    { x: 0.13, y: 0.64, z: 2.15 },
  ],
  walkStable: [
    { x: 0.14, y: 0.62, z: 1.55 },
    { x: 0.72, y: 0.62, z: 2.1 },
  ],
};

function Village({ id, beat, beatMs }: ShotProps & { id: keyof typeof villageCams }) {
  return (
    <>
      <FilmSet set="village" cams={villageCams[id]} beat={beat} beatMs={beatMs} priority={id === "village"}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute left-[36.5%] top-[14%] block aspect-square w-[2.6%] rounded-full bg-snow/80"
            animate={{ y: ["0%", "-320%"], x: ["0%", "90%"], scale: [0.6, 1.8], opacity: [0, 0.9, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, delay: i * 1.1, ease: "easeOut" }}
          />
        ))}
      </FilmSet>
      <Snow />
      {id === "village" && (
        <motion.p
          className="pointer-events-none absolute inset-x-0 top-[30%] text-center font-display text-[clamp(3rem,10vw,9rem)] font-black leading-none tracking-[-0.04em] text-snow"
          initial={{ opacity: 0, y: "20%" }}
          animate={{ opacity: [0, 1, 1, 0], y: ["20%", "0%", "0%", "-30%"] }}
          transition={{ duration: 3.6, times: [0, 0.25, 0.7, 1], delay: 0.3 }}
          aria-hidden
        >
          Santa Helper
        </motion.p>
      )}
    </>
  );
}

/* ---------- Santa's living room: everything lands on his head ---------- */

function Home({ beat, beatMs, talking, sound }: ShotProps) {
  const level = useSantaLevel(talking, sound);
  const [landed, setLanded] = useState(false);
  useAt(true, 1300, () => {
    setLanded(true);
    play("splat");
  });
  return (
    <FilmSet
      set="home"
      cams={[{ x: 0.48, y: 0.5, z: 1.2 }, { x: 0.5, y: 0.42, z: 1.5 }]}
      tallCams={[{ x: 0.5, y: 0.5, z: 1 }, { x: 0.57, y: 0.45, z: 1.12 }]}
      beat={beat}
      beatMs={beatMs}
    >
      <motion.div
        className="absolute left-[31%] top-[23%] w-[34%]"
        animate={landed ? { scaleY: [1, 0.93, 1.02, 1], scaleX: [1, 1.04, 0.99, 1] } : {}}
        transition={{ duration: 0.6 }}
        style={{ transformOrigin: "50% 100%" }}
      >
        <Santa level={level} className="inset-0 relative!" />
      </motion.div>
      <motion.div
        className="absolute left-[60.5%] top-[19%] w-[11%]"
        initial={{ y: "-260%", rotate: -14 }}
        animate={{ y: "0%", rotate: landed ? 4 : -14 }}
        transition={{ y: { delay: 0.8, duration: 0.5, ease: [0.55, 0, 1, 0.45] }, rotate: { type: "spring", stiffness: 120, damping: 7 } }}
        style={{ transformOrigin: "20% 0%" }}
      >
        <motion.div
          initial={{ clipPath: "inset(0 0 88% 0)" }}
          animate={{ clipPath: landed ? "inset(0 0 0% 0)" : "inset(0 0 88% 0)" }}
          transition={{ duration: 1.4, ease: [0.3, 0.8, 0.4, 1], delay: 0.25 }}
        >
          <Cutout src="/show/film/list.webp" w={420} h={780} />
        </motion.div>
      </motion.div>
    </FilmSet>
  );
}

/* ---------- the workshop: elves fooling around ---------- */

function Splat({ shown }: { shown: boolean }) {
  return (
    <AnimatePresence>
      {shown && (
        <motion.svg
          key="splat"
          viewBox="0 0 200 200"
          className="pointer-events-none absolute left-1/2 top-[44%] w-[min(90vw,70svh)] -translate-x-1/2 -translate-y-1/2 text-snow"
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 1, y: ["0%", "0%", "18%"], opacity: [1, 1, 0] }}
          transition={{ scale: { type: "spring", stiffness: 500, damping: 18 }, y: { duration: 2.2, times: [0, 0.45, 1] }, opacity: { duration: 2.2, times: [0, 0.7, 1] } }}
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M100 28c14 0 18 14 30 12s22-16 30-6-6 22 2 32 26 4 26 18-20 14-20 26 18 20 8 30-24-2-32 6-2 30-16 32-14-22-28-22-20 22-34 16 2-28-8-36-30 4-32-10 18-18 16-30-22-16-14-28 24-2 32-12-2-28 10-32 18 4 30 4z"
          />
          <path fill="currentColor" d="M66 150c4 0 6 6 6 16s-2 18-6 18-6-8-6-18 2-16 6-16zM122 158c3 0 5 4 5 12s-2 12-5 12-5-4-5-12 2-12 5-12z" />
        </motion.svg>
      )}
    </AnimatePresence>
  );
}

function Calendar({ eve, lang }: { eve: string; lang: string }) {
  const [day, setDay] = useState(19);
  useEffect(() => {
    if (day >= 24) return;
    const t = setTimeout(() => {
      setDay((d) => d + 1);
      play("tick");
    }, day === 19 ? 700 : 520);
    return () => clearTimeout(t);
  }, [day]);
  const month = new Intl.DateTimeFormat(lang, { month: "short" }).format(new Date(2026, 11, 1));
  return (
    <motion.div
      className="absolute left-1/2 top-[16%] w-[min(42vw,13rem)] -translate-x-1/2"
      initial={{ y: "-180%", rotate: -8 }}
      animate={{ y: "0%", rotate: [-8, 5, -2, 0] }}
      transition={{ y: { type: "spring", stiffness: 160, damping: 14 }, rotate: { duration: 1.2 } }}
      style={{ transformOrigin: "50% -40%" }}
    >
      <div className="relative rounded-felt bg-berry p-2">
        <div className="stitched pointer-events-none absolute inset-0 rounded-felt text-snow/45" />
        <p className="py-1 text-center font-display text-xl font-bold uppercase tracking-wide text-snow">{month}</p>
        <div className="relative overflow-hidden rounded-[1.1rem] bg-paper">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={day}
              className={`text-center font-display text-[5.5rem] font-black leading-[1.1] tabular-nums ${day === 24 ? "text-berry" : "text-ink"}`}
              initial={{ rotateX: -90, y: "-40%" }}
              animate={{ rotateX: 0, y: "0%" }}
              exit={{ rotateX: 90, y: "40%", opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {day}
            </motion.p>
          </AnimatePresence>
          <p className={`pb-3 text-center font-display text-lg font-bold text-berry transition-opacity ${day === 24 ? "opacity-100" : "opacity-0"}`}>{eve}</p>
        </div>
      </div>
    </motion.div>
  );
}

function Workshop({ beat, beatMs, eve, lang }: ShotProps & { eve: string; lang: string }) {
  const [throwing, setThrowing] = useState(false);
  const [splat, setSplat] = useState(false);
  useAt(true, 2500, () => setThrowing(true));
  useAt(throwing || false, 420, () => {
    setSplat(true);
    play("splat");
  });
  useAt(true, 3100, () => play("giggle"));
  return (
    <>
      <FilmSet
        set="workshop"
        cams={[{ x: 0.5, y: 0.58, z: 1.12 }, { x: 0.44, y: 0.62, z: 1.28 }, { x: 0.52, y: 0.55, z: 1.15 }]}
        tallCams={[{ x: 0.3, y: 0.6, z: 1 }, { x: 0.64, y: 0.62, z: 1.05 }, { x: 0.5, y: 0.55, z: 1 }]}
        beat={beat}
        beatMs={beatMs}
      >
        <motion.div
          className="absolute bottom-[3%] left-[22%] w-[13%]"
          animate={{ y: ["0%", "-16%", "0%"], rotate: [-3, 4, -3] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Cutout src="/show/film/elf-snowball.webp" w={600} h={834} />
        </motion.div>
        <motion.div
          className="absolute bottom-[1%] left-[58%] w-[17%]"
          animate={{ rotate: [-5, 5, -5], y: ["0%", "-5%", "0%", "-5%", "0%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "50% 100%" }}
        >
          <Cutout src="/show/elves.webp" w={807} h={944} />
        </motion.div>
        <motion.div
          className="absolute top-[70%] w-[19%]"
          initial={{ left: "-24%" }}
          animate={{ left: ["-24%", "106%"], y: ["0%", "-6%", "0%"] }}
          transition={{ left: { duration: 3.6, repeat: Infinity, ease: "linear", repeatDelay: 0.6 }, y: { duration: 0.5, repeat: Infinity } }}
        >
          <Cutout src="/show/film/elf-sled.webp" w={760} h={556} />
        </motion.div>
      </FilmSet>
      {throwing && (
        <motion.span
          className="pointer-events-none absolute left-[42%] top-[48%] block aspect-square w-10 rounded-full"
          initial={{ scale: 0.4, x: "-60%", y: "60%" }}
          animate={{ scale: 4.5, x: "0%", y: "-10%" }}
          transition={{ duration: 0.38, ease: "easeIn" }}
          style={{ opacity: splat ? 0 : 1, background: "radial-gradient(circle at 35% 30%, #fff 0%, #f4efe6 55%, #d9d3c8 100%)" }}
          aria-hidden
        />
      )}
      <Splat shown={splat && beat === 0} />
      {beat >= 1 && <Calendar eve={eve} lang={lang} />}
    </>
  );
}

/* ---------- the stable: a reindeer with a cold and a creaky sleigh ---------- */

function Stable({ beat, beatMs }: ShotProps) {
  const [sneezed, setSneezed] = useState(0);
  useAt(true, 400, () => play("sneeze"));
  useAt(true, 1950, () => setSneezed(1));
  useAt(beat === 1 || false, 250, () => play("creak"));
  useAt(beat === 1 || false, 1700, () => play("creak"));
  return (
    <FilmSet
      set="stable"
      cams={[{ x: 0.3, y: 0.58, z: 1.25 }, { x: 0.3, y: 0.6, z: 1.45 }, { x: 0.69, y: 0.62, z: 1.35 }]}
      beat={beat}
      beatMs={beatMs}
      shake={sneezed}
    >
      <motion.div
        className="absolute bottom-[2%] left-[22%] w-[15%]"
        animate={{ rotate: sneezed ? [-10, 12, -3, 0] : [0, -3, -2, -6, -5, -10], x: sneezed ? ["0%", "12%", "0%"] : "0%" }}
        transition={sneezed ? { duration: 0.7 } : { duration: 1.6, delay: 0.35, times: [0, 0.2, 0.33, 0.55, 0.66, 1] }}
        style={{ transformOrigin: "50% 100%" }}
      >
        <Cutout src="/show/film/reindeer-sick.webp" w={557} h={1080} />
      </motion.div>
      {sneezed > 0 &&
        Array.from({ length: 7 }, (_, i) => (
          <motion.span
            key={i}
            className={`absolute left-[35%] top-[34%] block aspect-square w-[1.6%] ${i % 2 ? "rounded-[0.2cqw] bg-snow" : "rounded-full bg-gold/80"}`}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: `${300 + i * 160}%`, y: [`0%`, `${-200 + i * 40}%`, `${900 + i * 60}%`], opacity: [1, 1, 0], rotate: 240 + i * 40 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        ))}
      <motion.div
        className="absolute bottom-[3%] left-[52%] w-[36%]"
        animate={beat === 1 ? { rotate: [0, -2.6, 1.4, -1.8, 0.8, 0, -2.2, 1, 0] } : {}}
        transition={{ duration: 2.6, delay: 0.2 }}
        style={{ transformOrigin: "15% 100%" }}
      >
        <Cutout src="/show/film/sleigh.webp" w={1000} h={761} />
      </motion.div>
      {beat === 1 && (
        <motion.span
          className="absolute left-[74%] top-[70%] block aspect-square w-[1.1%] rounded-full bg-ink/80"
          initial={{ x: "0%", y: "0%" }}
          animate={{ x: ["0%", "180%", "420%"], y: ["0%", "-900%", "1500%"], rotate: 720 }}
          transition={{ duration: 1.3, delay: 1.7, ease: "easeIn" }}
        />
      )}
    </FilmSet>
  );
}

/* ---------- the gift factory: the conveyor belt breaks down ---------- */

const beltPoint = (u: number) => ({ x: 6 + u * 90, y: 83 - u * 20.5, w: 7.4 - u * 2.6 });
const gifts = ["red", "green", "gold"] as const;

function BeltGift({ belt, index, kind }: { belt: MotionValue<number>; index: number; kind: (typeof gifts)[number] }) {
  const u = useTransform(belt, (b) => (b + index / 5) % 1);
  const left = useTransform(u, (v) => `${beltPoint(v).x}%`);
  const top = useTransform(u, (v) => `${beltPoint(v).y}%`);
  const width = useTransform(u, (v) => `${beltPoint(v).w}%`);
  return (
    <motion.div className="absolute -translate-x-1/2 -translate-y-full" style={{ left, top, width }}>
      <Cutout src={`/show/film/gift-${kind}.webp`} w={300} h={350} />
    </motion.div>
  );
}

function Factory({ beat, beatMs }: ShotProps) {
  const belt = useMotionValue(0);
  const [jam, setJam] = useState(0);
  useEffect(() => {
    const run = animate(belt, 100, { duration: 700, ease: "linear" });
    return () => run.stop();
  }, [belt]);
  useAt(true, 2400, () => {
    belt.stop();
    setJam(1);
    play("clank");
    setTimeout(() => play("sputter"), 120);
  });
  const pile = beltPoint(0.24);
  return (
    <FilmSet
      set="factory"
      cams={[{ x: 0.5, y: 0.55, z: 1.08 }, { x: 0.42, y: 0.58, z: 1.3 }]}
      tallCams={[{ x: 0.42, y: 0.6, z: 1 }, { x: 0.26, y: 0.6, z: 1.08 }]}
      beat={beat}
      beatMs={beatMs}
      shake={jam}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <BeltGift key={i} belt={belt} index={i} kind={gifts[i % 3]} />
      ))}
      {jam > 0 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${pile.x + (i === 2 ? 1.5 : 0)}%`, top: `${pile.y - i * 12.4}%`, width: `${pile.w * 0.9}%` }}
              initial={{ y: "-500%" }}
              animate={i === 2 ? { y: ["-500%", "0%", "0%", "260%"], x: ["0%", "0%", "40%", "120%"], rotate: [0, 0, 25, 95] } : { y: ["-500%", "0%"] }}
              transition={{ duration: i === 2 ? 2.1 : 0.45, delay: 0.5 + i * 0.45, times: i === 2 ? [0, 0.22, 0.5, 1] : undefined, ease: "easeIn" }}
              onAnimationComplete={() => play(i === 2 ? "clank" : "pop")}
            >
              <Cutout src={`/show/film/gift-${gifts[(i + 1) % 3]}.webp`} w={300} h={350} />
            </motion.div>
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <motion.span
              key={`smoke-${i}`}
              className="absolute left-[26%] top-[30%] block aspect-square w-[9%] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(244,239,230,0.85) 0%, rgba(244,239,230,0.4) 45%, rgba(244,239,230,0) 70%)" }}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.6 + i * 0.2], opacity: [0, 0.9, 0], x: `${(i - 2.5) * 40}%`, y: `${-120 - i * 30}%` }}
              transition={{ duration: 2.2, delay: 0.1 + i * 0.28, ease: "easeOut" }}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <motion.span
              key={`spark-${i}`}
              className="absolute left-[40%] top-[60%] block aspect-square w-[0.7%] rounded-full bg-gold"
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: `${Math.cos(i * 0.63) * 900}%`, y: `${Math.sin(i * 0.63) * 700 - 300}%`, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
        </>
      )}
    </FilmSet>
  );
}

/* ---------- Santa asks for help, and the viewers become his elves ---------- */

function SantaCloseUp({ beat, beatMs, talking, sound }: ShotProps) {
  const level = useSantaLevel(talking, sound);
  return (
    <FilmSet set="home" cams={[{ x: 0.48, y: 0.42, z: 1.85 }, { x: 0.48, y: 0.4, z: 2.15 }]} beat={beat} beatMs={beatMs}>
      <Santa level={level} className="left-[31%] top-[23%] w-[34%]" />
    </FilmSet>
  );
}

const viewers: AvatarConfig[] = ["anna", "tom", "ola", "kasia", "ben"].map((n) => ({ ...seededAvatar(n), hat: "none" }));

function Viewer({ config, index, elf }: { config: AvatarConfig; index: number; elf: boolean }) {
  return (
    <motion.div
      className="absolute -bottom-[1%] w-[7.5%]"
      style={{ left: `${23 + index * 11.5}%` }}
      initial={{ y: "120%" }}
      animate={{ y: elf ? ["0%", "-12%", "0%"] : "0%" }}
      transition={elf ? { duration: 0.7, repeat: Infinity, delay: index * 0.12 } : { type: "spring", stiffness: 140, damping: 12, delay: 0.25 + index * 0.18 }}
    >
      <Avatar config={elf ? { ...config, hat: "elf" } : config} className="block h-auto w-full" />
      <AnimatePresence>
        {elf && (
          <motion.span
            className="absolute -top-[20%] left-1/2 block aspect-square w-[60%] -translate-x-1/2 rounded-full border-[0.3cqw] border-gold"
            initial={{ scale: 0.2, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Finale({ beat, beatMs, talking, sound, ended }: ShotProps & { ended: boolean }) {
  const level = useSantaLevel(talking, sound);
  const [elves, setElves] = useState(0);
  useEffect(() => {
    if (elves >= viewers.length) return;
    const t = setTimeout(() => {
      setElves((n) => n + 1);
      play("pop");
    }, elves === 0 ? 2300 : 260);
    return () => clearTimeout(t);
  }, [elves]);
  return (
    <>
      <FilmSet
        set="stage"
        cams={[{ x: 0.5, y: 0.55, z: 1.3 }, { x: 0.5, y: 0.6, z: 1.18 }, { x: 0.5, y: 0.52, z: 1.04 }, { x: 0.52, y: 0.5, z: 1 }]}
        beat={beat}
        beatMs={beatMs}
      >
        <div className="absolute left-[21%] top-[6.5%] h-[13%] w-[58%] animate-bulbs rounded-full bg-gold/10 mix-blend-screen" />
        <Santa level={level} className="left-[37%] top-[22%] w-[26%]" />
        <Cutout src="/show/presents.webp" w={1280} h={470} className="absolute! bottom-[3%] left-[30%] w-[40%]!" />
        <motion.div
          className="absolute left-[66%] top-[40%] w-[17%]"
          initial={{ y: "70%", opacity: 0 }}
          animate={beat >= 1 ? { y: ["0%", "-4%", "0%"], opacity: 1 } : { y: "70%", opacity: 0 }}
          transition={beat >= 1 ? { y: { duration: 0.9, repeat: Infinity }, opacity: { duration: 0.3 } } : {}}
        >
          <Cutout src="/show/elves.webp" w={807} h={944} />
        </motion.div>
        <motion.div
          className="absolute left-[17%] top-[46%] w-[11%]"
          initial={{ y: "80%", opacity: 0 }}
          animate={beat >= 1 ? { y: ["0%", "-14%", "0%"], opacity: 1, rotate: [-4, 4, -4] } : { y: "80%", opacity: 0 }}
          transition={beat >= 1 ? { duration: 0.8, repeat: Infinity, opacity: { duration: 0.3 } } : {}}
        >
          <Cutout src="/show/film/elf-snowball.webp" w={600} h={834} />
        </motion.div>
        {viewers.map((v, i) => (
          <Viewer key={i} config={v} index={i} elf={i < elves} />
        ))}
        {(beat >= 1 || ended) && <Confetti count={36} />}
      </FilmSet>
      <Curtains />
    </>
  );
}

function Curtains() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[0, 1].map((side) => (
        <motion.div
          key={side}
          className={`absolute top-0 h-full w-[52%] bg-pine-dark ${side ? "right-0" : "left-0"}`}
          initial={{ x: "0%" }}
          animate={{ x: side ? "102%" : "-102%" }}
          transition={{ duration: 1.5, ease: [0.7, 0, 0.3, 1], delay: 0.2 }}
        >
          <Cutout src="/show/curtain.webp" w={960} h={1440} className="h-full! w-full object-cover" style={{ transform: side ? "scaleX(-1)" : undefined }} />
        </motion.div>
      ))}
    </div>
  );
}

export function Shot({ id, ended, eve, lang, ...props }: ShotProps & { id: ShotId; ended: boolean; eve: string; lang: string }) {
  switch (id) {
    case "village":
    case "walkWorkshop":
    case "walkStable":
      return <Village id={id} {...props} />;
    case "home":
      return <Home {...props} />;
    case "workshop":
      return <Workshop {...props} eve={eve} lang={lang} />;
    case "stable":
      return <Stable {...props} />;
    case "factory":
      return <Factory {...props} />;
    case "santa":
      return <SantaCloseUp {...props} />;
    case "finale":
      return <Finale {...props} ended={ended} />;
  }
}
