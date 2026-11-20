import type { CeremonyStep } from "./steps";
import { formatMoney, toLocale, translatorFor } from "@/lib/i18n-server";
import { prepareLines, recordedLine, recordedSeconds } from "@/lib/tts";

export type ScriptLine = {
  id: string;
  text: string;
  audioUrl: string | null;
  /** Recordings played back to back instead of `audioUrl`, for lines built from pre-recorded names. */
  parts?: string[];
  /** Length of the recording(s), once recorded, so devices can keep in step with each other. */
  seconds?: number;
  cue?: "bells" | "drumroll" | "chime" | "laugh";
};

type Context = {
  locale: string;
  title: string;
  names: string[];
  remoteNames: string[];
  hasExclusions: boolean;
  budget: { amount: number; currency: string } | null;
};

type Draft = { key: string; vars?: Record<string, string | number>; names?: string[]; cue?: ScriptLine["cue"] };

const NAMES = "\u0000";

/** "babcia  kasia" → "Babcia Kasia": one spelling per name, so it matches the recording. */
export function spokenName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase() + w.slice(1))
    .join(" ");
}

/** Every way a name is said in a list: mid-list, last (with the locale's "and") and on its own. */
export function nameTakes(locale: string, name: string) {
  const spoken = spokenName(name);
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const and = (count: number) => {
    const marks = Array.from({ length: count - 1 }, (_, i) => `\u0001${i}\u0001`);
    const text = list.format([...marks, spoken]);
    return text.slice(text.lastIndexOf("\u0001") + 1).replace(/^[\s,]+/, "");
  };
  return { mid: `${spoken},`, last2: `${and(2)}.`, last: `${and(3)}.`, solo: `${spoken}.` };
}

/** The fixed words around the names in a list line, e.g. the greeting before the remote elves. */
export function listFrame(locale: string, key: "elvesNames" | "elvesRemote") {
  const t = translatorFor(locale, "ceremony");
  const [before, after] = t(key, { names: NAMES }).split(NAMES);
  return { before: before.trim(), after: after.replace(/^[\s.,!]+/, "").trim() };
}

/** One caption per sentence: long subtitles are hard to read from across the room. */
export function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?…])\s+(?=[\p{Lu}¡¿„"«])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Texts of the list line spoken piece by piece, in order, without the words after the names. */
function listTakes(locale: string, key: "elvesNames" | "elvesRemote", names: string[]) {
  const { before } = listFrame(locale, key);
  const takes = names.map((n, i) => {
    const t = nameTakes(locale, n);
    if (names.length === 1) return t.solo;
    if (i < names.length - 1) return t.mid;
    return names.length === 2 ? t.last2 : t.last;
  });
  return [before, ...takes].filter(Boolean);
}

/** Recordings for a list line, but only if every piece is already recorded: then it plays offline. */
async function recordedParts(locale: string, d: Draft) {
  if (!d.names?.length || (d.key !== "elvesNames" && d.key !== "elvesRemote")) return null;
  const lang = toLocale(locale);
  const urls = await Promise.all(listTakes(locale, d.key, d.names).map((text) => recordedLine(text, lang)));
  return urls.every(Boolean) ? (urls as string[]) : null;
}

function listFormat(locale: string, items: string[]) {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
}

function budgetText(ctx: Context) {
  return ctx.budget ? formatMoney(ctx.budget.amount, ctx.budget.currency, ctx.locale) : "";
}

function draftsFor(step: CeremonyStep, ctx: Context): Draft[] {
  switch (step) {
    case "lobby":
      return [];
    case "welcome":
      return [
        { key: "lobby1", cue: "laugh" },
        { key: "welcome1" },
        { key: "welcome2" },
        { key: "welcome3", vars: { title: ctx.title, count: ctx.names.length } },
        { key: "welcomeAsk" },
      ];
    case "elves":
      return [
        { key: "elves1" },
        { key: "elvesNames", vars: { names: listFormat(ctx.locale, ctx.names) }, names: ctx.names },
        { key: "elves2" },
        ...(ctx.remoteNames.length
          ? [{ key: "elvesRemote", vars: { names: listFormat(ctx.locale, ctx.remoteNames) }, names: ctx.remoteNames }]
          : []),
      ];
    case "rules":
      return [
        { key: "rules1" },
        { key: ctx.hasExclusions ? "rulesExclusions" : "rulesNoSelf" },
        ctx.budget ? { key: "rulesBudget", vars: { budget: budgetText(ctx) } } : { key: "rulesNoBudget" },
        { key: "rules2" },
        { key: "rulesAsk" },
      ];
    case "draw":
      return [{ key: "draw1", cue: "bells" }, { key: "draw2", cue: "drumroll" }, { key: "draw3", cue: "chime" }];
    case "reveal":
      return [{ key: "reveal1" }, { key: "reveal2" }];
    case "farewell":
      return [{ key: "farewell1" }, { key: "farewell2", cue: "laugh" }];
  }
}

type Piece = { text: string; parts?: string[] | null; cue?: ScriptLine["cue"] };

/** A draft as captions: a list line keeps the names together and says the words after them on their own. */
async function piecesOf(locale: string, d: Draft, split: boolean): Promise<Piece[]> {
  const t = translatorFor(locale, "ceremony");
  const text = t(d.key as Parameters<typeof t>[0], d.vars as never);
  if (d.key === "elvesNames" || d.key === "elvesRemote") {
    const { after } = listFrame(locale, d.key);
    const head = after && text.endsWith(after) ? text.slice(0, -after.length).trim() : text;
    return [{ text: head, parts: await recordedParts(locale, d), cue: d.cue }, ...(head !== text ? [{ text: after }] : [])];
  }
  return (split ? splitSentences(text) : [text]).map((piece, i) => ({ text: piece, cue: i === 0 ? d.cue : undefined }));
}

async function materialize(locale: string, drafts: Draft[], prefix: string, split = false): Promise<ScriptLine[]> {
  const pieces = (await Promise.all(drafts.map((d) => piecesOf(locale, d, split)))).flat();
  const lang = toLocale(locale);
  // One insert for the whole chapter. A handful of parallel inserts through the pooler stall until they are cancelled.
  const spoken = pieces.flatMap((piece, i) => (piece.parts ? [] : [{ key: String(i), text: piece.text, lang }]));
  const urls = await prepareLines(spoken);
  const lines: ScriptLine[] = pieces.map(({ text, parts, cue }, i) => ({
    id: `${prefix}-${i}`,
    text,
    audioUrl: parts ? null : (urls[String(i)] ?? null),
    parts: parts ?? undefined,
    cue,
  }));
  const seconds = await recordedSeconds(lines.flatMap((l) => l.parts ?? (l.audioUrl ? [l.audioUrl] : [])));
  return lines.map((l) => {
    const urls = l.parts ?? (l.audioUrl ? [l.audioUrl] : []);
    const known = urls.length > 0 && urls.every((u) => seconds.has(u));
    return known ? { ...l, seconds: urls.reduce((sum, u) => sum + seconds.get(u)!, 0) } : l;
  });
}

export function buildStepScript(step: CeremonyStep, ctx: Context) {
  // The draw keeps its three lines whole: the wheel stops on the third.
  return materialize(ctx.locale, draftsFor(step, ctx), step, step !== "draw");
}

/** The short personal ceremony for async sessions, split around the moment of the reveal. */
export async function buildPersonalScript(ctx: {
  locale: string;
  title: string;
  name: string;
  receiver: string;
  budget: { amount: number; currency: string } | null;
}) {
  const budget = ctx.budget ? formatMoney(ctx.budget.amount, ctx.budget.currency, ctx.locale) : "";
  const before = await materialize(
    ctx.locale,
    [
      { key: "personal1", vars: { name: ctx.name }, cue: "laugh" },
      { key: "personal2", vars: { title: ctx.title } },
      { key: "personal3", cue: "drumroll" },
    ],
    "before",
  );
  const after = await materialize(
    ctx.locale,
    [
      { key: "personalReveal", vars: { receiver: ctx.receiver }, cue: "chime" },
      ctx.budget ? { key: "rulesBudget", vars: { budget } } : { key: "rulesNoBudget" },
      { key: "personalBye", cue: "laugh" },
    ],
    "after",
  );
  return { before, after };
}
