import type { AvatarConfig } from "@/lib/avatar";
import { parkedHost, type Viewer } from "@/lib/auth";
import { buildStepScript, type ScriptLine } from "@/lib/ceremony/script";
import { isRevealOpen, nextStep, type CeremonyStep } from "@/lib/ceremony/steps";
import {
  countRevealed,
  getAssignmentForGiver,
  listExclusions,
  listParticipants,
  playsInDraw,
  type ParticipantStatus,
  type Session,
} from "@/lib/db/repo";
import { warmLines } from "@/lib/tts";
import { checkFeasibility } from "@/lib/draw";

export type PublicParticipant = {
  id: string;
  displayName: string;
  avatar: AvatarConfig;
  role: "host" | "elf";
  status: ParticipantStatus;
  isRemote: boolean;
  /** Gives and gets a gift; only an Elf Chief who just runs the show doesn't. */
  plays: boolean;
  profileComplete: boolean;
  online: boolean;
  email?: string | null;
};

export type SessionState = {
  serverNow: number;
  version: number;
  session: {
    code: string;
    title: string;
    mode: Session["mode"];
    status: Session["status"];
    locale: string;
    timezone: string;
    scheduledAt: string | null;
    location: string | null;
    onlineUrl: string | null;
    budgetAmount: number | null;
    currency: string;
    autoAdmit: boolean;
    hostPlays: boolean;
    step: CeremonyStep;
    stepStartedAt: number;
    drawn: boolean;
    commitment: string | null;
    screenKey?: string;
    screenCode?: string;
    screenConnected?: boolean;
    remotePaired?: boolean;
  };
  participants: PublicParticipant[];
  exclusions?: { id: string; giverId: string; receiverId: string; bidirectional: boolean }[];
  feasibility?: { ok: boolean; blockedNames: string[]; tooFew: boolean };
  revealProgress?: { total: number; revealed: number };
  /** `inDraw`: whether the draw that already happened gave this person someone to surprise. */
  viewer: (PublicParticipant & { emailVerified: boolean; email: string | null; inDraw: boolean }) | null;
  isHost: boolean;
  /** This browser still has the host seat parked beside the person it is showing. */
  canResumeHost: boolean;
  isScreen: boolean;
  assignment: { receiver: { displayName: string; avatar: AvatarConfig }; revealed: boolean } | null;
  script: ScriptLine[] | null;
};

const ONLINE_WINDOW_MS = 45_000;

export async function buildState(session: Session, viewer: Viewer, locale: string, { warmVoice = false } = {}): Promise<SessionState> {
  const participants = await listParticipants(session.id);
  const exclusions = await listExclusions(session.id);
  const approved = participants.filter((p) => p.status === "approved");
  const players = approved.filter((p) => playsInDraw(p, session));
  const now = Date.now();

  const toPublic = (p: (typeof participants)[number], withEmail: boolean): PublicParticipant => ({
    id: p.id,
    displayName: p.displayName,
    avatar: p.avatar,
    role: p.role,
    status: p.status,
    isRemote: p.isRemote,
    plays: playsInDraw(p, session),
    profileComplete: !!p.profileCompletedAt,
    online: !!p.lastSeenAt && now - p.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
    ...(withEmail ? { email: p.email } : {}),
  });

  const visible = viewer.isHost ? participants : approved;

  let assignment: SessionState["assignment"] = null;
  const me = viewer.participant;
  const parked = await parkedHost(session);
  const canResumeHost = !!parked && parked.id !== me?.id;
  const mayReveal = session.mode === "async" ? !!session.drawnAt : !!session.drawnAt && isRevealOpen(session.ceremonyStep);
  let inDraw = false;
  if (me && me.status === "approved" && session.drawnAt) {
    const a = await getAssignmentForGiver(session.id, me.id);
    inDraw = !!a;
    if (a && mayReveal) assignment = { receiver: { displayName: a.receiver.displayName, avatar: a.receiver.avatar }, revealed: !!a.revealedAt };
  }

  let feasibility: SessionState["feasibility"];
  if (viewer.isHost) {
    const result = checkFeasibility(
      players.map((p) => p.id),
      exclusions,
    );
    const names = new Map(participants.map((p) => [p.id, p.displayName]));
    feasibility = result.ok
      ? { ok: true, blockedNames: [], tooFew: false }
      : { ok: false, tooFew: result.reason === "too_few", blockedNames: result.blockedGiverIds.map((id) => names.get(id) ?? "?") };
  }

  // The voice script is only needed by devices that play the ceremony: the big screen and remote elves.
  const plays = viewer.isScreen || (me?.isRemote && session.mode === "sync") || (viewer.isHost && session.mode === "sync");
  const scriptContext = {
    locale,
    title: session.title,
    names: players.map((p) => p.displayName),
    remoteNames: players.filter((p) => p.isRemote).map((p) => p.displayName),
    hasExclusions: exclusions.length > 0,
    budget: session.budgetAmount ? { amount: session.budgetAmount, currency: session.currency } : null,
  };
  const script = plays && session.mode === "sync" ? await buildStepScript(session.ceremonyStep, scriptContext) : null;
  if (script && warmVoice) {
    warmLines(script.map((l) => l.audioUrl));
    // Santa's next chapter is synthesized ahead, so his first line there isn't late.
    const upcoming = nextStep(session.ceremonyStep);
    if (upcoming) void buildStepScript(upcoming, scriptContext).then((lines) => warmLines(lines.map((l) => l.audioUrl)));
  }

  return {
    serverNow: now,
    version: session.version,
    session: {
      code: session.code,
      title: session.title,
      mode: session.mode,
      status: session.status,
      locale: session.locale,
      timezone: session.timezone,
      scheduledAt: session.scheduledAt?.toISOString() ?? null,
      location: session.location,
      onlineUrl: session.onlineUrl,
      budgetAmount: session.budgetAmount,
      currency: session.currency,
      autoAdmit: session.autoAdmit,
      hostPlays: session.hostPlays,
      step: session.ceremonyStep,
      stepStartedAt: session.stepStartedAt.getTime(),
      drawn: !!session.drawnAt,
      commitment: session.drawCommitment,
      ...(viewer.isHost ? {
            screenKey: session.screenKey,
            screenCode: session.screenCode,
            screenConnected: !!session.screenSeenAt,
            remotePaired: !!session.remotePairedAt,
          } : {}),
    },
    participants: visible.map((p) => toPublic(p, viewer.isHost)),
    exclusions: viewer.isHost ? exclusions : undefined,
    feasibility,
    revealProgress: viewer.isHost || viewer.isScreen ? await countRevealed(session.id) : undefined,
    viewer: me ? { ...toPublic(me, true), email: me.email, emailVerified: me.emailVerified, inDraw } : null,
    isHost: viewer.isHost,
    canResumeHost,
    isScreen: viewer.isScreen,
    assignment,
    script,
  };
}
