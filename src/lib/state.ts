import type { AvatarConfig } from "@/lib/avatar";
import type { Viewer } from "@/lib/auth";
import { buildStepScript, type ScriptLine } from "@/lib/ceremony/script";
import { isRevealOpen, type CeremonyStep } from "@/lib/ceremony/steps";
import {
  countRevealed,
  getAssignmentForGiver,
  listExclusions,
  listParticipants,
  type ParticipantStatus,
  type Session,
} from "@/lib/db/repo";
import { checkFeasibility } from "@/lib/draw";

export type PublicParticipant = {
  id: string;
  displayName: string;
  avatar: AvatarConfig;
  role: "host" | "elf";
  status: ParticipantStatus;
  isRemote: boolean;
  profileComplete: boolean;
  online: boolean;
  email?: string;
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
    step: CeremonyStep;
    stepStartedAt: number;
    drawn: boolean;
    commitment: string | null;
    screenKey?: string;
  };
  participants: PublicParticipant[];
  exclusions?: { id: string; giverId: string; receiverId: string; bidirectional: boolean }[];
  feasibility?: { ok: boolean; blockedNames: string[]; tooFew: boolean };
  revealProgress?: { total: number; revealed: number };
  viewer: (PublicParticipant & { emailVerified: boolean; email: string }) | null;
  isHost: boolean;
  isScreen: boolean;
  assignment: { receiver: { displayName: string; avatar: AvatarConfig }; revealed: boolean } | null;
  script: ScriptLine[] | null;
};

const ONLINE_WINDOW_MS = 45_000;

export async function buildState(session: Session, viewer: Viewer, locale: string): Promise<SessionState> {
  const participants = await listParticipants(session.id);
  const exclusions = await listExclusions(session.id);
  const approved = participants.filter((p) => p.status === "approved");
  const now = Date.now();

  const toPublic = (p: (typeof participants)[number], withEmail: boolean): PublicParticipant => ({
    id: p.id,
    displayName: p.displayName,
    avatar: p.avatar,
    role: p.role,
    status: p.status,
    isRemote: p.isRemote,
    profileComplete: !!p.profileCompletedAt,
    online: !!p.lastSeenAt && now - p.lastSeenAt.getTime() < ONLINE_WINDOW_MS,
    ...(withEmail ? { email: p.email } : {}),
  });

  const visible = viewer.isHost ? participants : approved;

  let assignment: SessionState["assignment"] = null;
  const me = viewer.participant;
  const mayReveal = session.mode === "async" ? !!session.drawnAt : !!session.drawnAt && isRevealOpen(session.ceremonyStep);
  if (me && me.status === "approved" && mayReveal) {
    const a = await getAssignmentForGiver(session.id, me.id);
    if (a) assignment = { receiver: { displayName: a.receiver.displayName, avatar: a.receiver.avatar }, revealed: !!a.revealedAt };
  }

  let feasibility: SessionState["feasibility"];
  if (viewer.isHost) {
    const result = checkFeasibility(
      approved.map((p) => p.id),
      exclusions,
    );
    const names = new Map(participants.map((p) => [p.id, p.displayName]));
    feasibility = result.ok
      ? { ok: true, blockedNames: [], tooFew: false }
      : { ok: false, tooFew: result.reason === "too_few", blockedNames: result.blockedGiverIds.map((id) => names.get(id) ?? "?") };
  }

  // The voice script is only needed by devices that play the ceremony: the big screen and remote elves.
  const plays = viewer.isScreen || (me?.isRemote && session.mode === "sync") || (viewer.isHost && session.mode === "sync");
  const script =
    plays && session.mode === "sync"
      ? await buildStepScript(session.ceremonyStep, {
          locale,
          title: session.title,
          names: approved.map((p) => p.displayName),
          remoteNames: approved.filter((p) => p.isRemote).map((p) => p.displayName),
          hasExclusions: exclusions.length > 0,
          budget: session.budgetAmount ? { amount: session.budgetAmount, currency: session.currency } : null,
        })
      : null;

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
      step: session.ceremonyStep,
      stepStartedAt: session.stepStartedAt.getTime(),
      drawn: !!session.drawnAt,
      commitment: session.drawCommitment,
      ...(viewer.isHost ? { screenKey: session.screenKey } : {}),
    },
    participants: visible.map((p) => toPublic(p, viewer.isHost)),
    exclusions: viewer.isHost ? exclusions : undefined,
    feasibility,
    revealProgress: viewer.isHost || viewer.isScreen ? await countRevealed(session.id) : undefined,
    viewer: me ? { ...toPublic(me, true), email: me.email, emailVerified: me.emailVerified } : null,
    isHost: viewer.isHost,
    isScreen: viewer.isScreen,
    assignment,
    script,
  };
}
