import type { CeremonyStep } from "./steps";
import { formatMoney, toLocale, translatorFor } from "@/lib/i18n-server";
import { prepareLine, recordedLine } from "@/lib/tts";

export type ScriptLine = {
  id: string;
  text: string;
  audioUrl: string | null;
  /** Recordings played back to back instead of `audioUrl`, for lines built from pre-recorded names. */
  parts?: string[];
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

/** Texts of the list line spoken piece by piece, in order. */
function listTakes(locale: string, key: "elvesNames" | "elvesRemote", names: string[]) {
  const { before, after } = listFrame(locale, key);
  const takes = names.map((n, i) => {
    const t = nameTakes(locale, n);
    if (names.length === 1) return t.solo;
    if (i < names.length - 1) return t.mid;
    return names.length === 2 ? t.last2 : t.last;
  });
  return [before, ...takes, after].filter(Boolean);
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
      return [{ key: "lobby1" }];
    case "welcome":
      return [
        { key: "welcome1", cue: "laugh" },
        { key: "welcome2" },
        { key: "welcome3", vars: { title: ctx.title, count: ctx.names.length } },
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
      ];
    case "draw":
      return [{ key: "draw1", cue: "bells" }, { key: "draw2", cue: "drumroll" }, { key: "draw3", cue: "chime" }];
    case "reveal":
      return [{ key: "reveal1" }, { key: "reveal2" }];
    case "farewell":
      return [{ key: "farewell1" }, { key: "farewell2", cue: "laugh" }];
  }
}

async function materialize(locale: string, drafts: Draft[], prefix: string): Promise<ScriptLine[]> {
  const t = translatorFor(locale, "ceremony");
  return Promise.all(
    drafts.map(async (d, i) => {
      const text = t(d.key as Parameters<typeof t>[0], d.vars as never);
      const parts = await recordedParts(locale, d);
      if (parts) return { id: `${prefix}-${i}`, text, audioUrl: null, parts, cue: d.cue };
      return { id: `${prefix}-${i}`, text, audioUrl: await prepareLine(text, toLocale(locale)), cue: d.cue };
    }),
  );
}

export function buildStepScript(step: CeremonyStep, ctx: Context) {
  return materialize(ctx.locale, draftsFor(step, ctx), step);
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
