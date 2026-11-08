import type { CeremonyStep } from "./steps";
import { formatMoney, toLocale, translatorFor } from "@/lib/i18n-server";
import { prepareLine } from "@/lib/tts";

export type ScriptLine = { id: string; text: string; audioUrl: string | null; cue?: "bells" | "drumroll" | "chime" | "laugh" };

type Context = {
  locale: string;
  title: string;
  names: string[];
  remoteNames: string[];
  hasExclusions: boolean;
  budget: { amount: number; currency: string } | null;
};

type Draft = { key: string; vars?: Record<string, string | number>; cue?: ScriptLine["cue"] };

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
        { key: "elvesNames", vars: { names: listFormat(ctx.locale, ctx.names) } },
        { key: "elves2" },
        ...(ctx.remoteNames.length
          ? [{ key: "elvesRemote", vars: { names: listFormat(ctx.locale, ctx.remoteNames) } }]
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
