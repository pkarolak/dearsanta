import { customAlphabet } from "nanoid";
import { getDb, type Queryable } from "./client";
import { parseAvatar, seededAvatar, type AvatarConfig } from "@/lib/avatar";
import { commitDraw, drawAssignments, type Exclusion } from "@/lib/draw";
import type { CeremonyStep } from "@/lib/ceremony/steps";

export type SessionMode = "sync" | "async";
export type SessionStatus = "open" | "ceremony" | "drawn" | "done";
export type ParticipantStatus = "invited" | "pending" | "approved" | "rejected";

export type Session = {
  id: string;
  code: string;
  screenKey: string;
  screenCode: string;
  title: string;
  mode: SessionMode;
  status: SessionStatus;
  locale: string;
  timezone: string;
  scheduledAt: Date | null;
  location: string | null;
  onlineUrl: string | null;
  budgetAmount: number | null;
  currency: string;
  ceremonyStep: CeremonyStep;
  stepStartedAt: Date;
  drawCommitment: string | null;
  drawnAt: Date | null;
  /** Spontaneous sessions let people in as soon as they knock. */
  autoAdmit: boolean;
  /** Off when the Elf Chief only runs the show and stays out of the draw. */
  hostPlays: boolean;
  screenSeenAt: Date | null;
  remotePairedAt: Date | null;
  version: number;
};

export type Participant = {
  id: string;
  sessionId: string;
  profileId: string | null;
  /** Optional: a spontaneous elf can join with just a name. */
  email: string | null;
  displayName: string;
  avatar: AvatarConfig;
  role: "host" | "elf";
  status: ParticipantStatus;
  isRemote: boolean;
  emailVerified: boolean;
  profileCompletedAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
};

export type ExclusionRow = Exclusion & { id: string };

export type Profile = { id: string; email: string; displayName: string; avatar: AvatarConfig; locale: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
const toDate = (v: any) => (v ? new Date(v) : null);

function mapSession(r: any): Session {
  return {
    id: r.id,
    code: r.code,
    screenKey: r.screen_key,
    screenCode: r.screen_code,
    title: r.title,
    mode: r.mode,
    status: r.status,
    locale: r.locale,
    timezone: r.timezone,
    scheduledAt: toDate(r.scheduled_at),
    location: r.location,
    onlineUrl: r.online_url,
    budgetAmount: r.budget_amount === null ? null : Number(r.budget_amount),
    currency: r.currency,
    ceremonyStep: r.ceremony_step,
    stepStartedAt: new Date(r.step_started_at),
    drawCommitment: r.draw_commitment,
    drawnAt: toDate(r.drawn_at),
    autoAdmit: !!r.auto_admit,
    hostPlays: r.host_plays !== false,
    screenSeenAt: toDate(r.screen_seen_at),
    remotePairedAt: toDate(r.remote_paired_at),
    version: Number(r.version),
  };
}

function mapParticipant(r: any): Participant {
  return {
    id: r.id,
    sessionId: r.session_id,
    profileId: r.profile_id,
    email: r.email,
    displayName: r.display_name,
    avatar: parseAvatar(r.avatar, r.email ?? r.id),
    role: r.role,
    status: r.status,
    isRemote: r.is_remote,
    emailVerified: r.email_verified,
    profileCompletedAt: toDate(r.profile_completed_at),
    lastSeenAt: toDate(r.last_seen_at),
    createdAt: new Date(r.created_at),
  };
}

function mapProfile(r: any): Profile {
  return { id: r.id, email: r.email, displayName: r.display_name, avatar: parseAvatar(r.avatar, r.email), locale: r.locale };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sessionCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
const screenKey = customAlphabet("abcdefghijkmnpqrstuvwxyz23456789", 20);
const screenCode = customAlphabet("0123456789", 6);

async function db() {
  return getDb();
}

/* ---------- sessions ---------- */

export type NewSession = {
  title: string;
  mode: SessionMode;
  locale: string;
  timezone: string;
  scheduledAt: Date | null;
  location: string | null;
  onlineUrl: string | null;
  budgetAmount: number | null;
  currency: string;
  autoAdmit?: boolean;
  hostPlays?: boolean;
  host: { name: string; email: string | null; locale: string };
};

export async function createSession(input: NewSession) {
  const d = await db();
  return d.transaction(async (tx) => {
    let row;
    for (let attempt = 0; attempt < 5 && !row; attempt++) {
      const rows = await tx.query(
        `insert into sessions (code, screen_key, screen_code, title, mode, locale, timezone, scheduled_at, location, online_url, budget_amount, currency, auto_admit, host_plays)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict do nothing returning *`,
        [
          sessionCode(),
          screenKey(),
          screenCode(),
          input.title,
          input.mode,
          input.locale,
          input.timezone,
          input.scheduledAt,
          input.location,
          input.onlineUrl,
          input.budgetAmount,
          input.currency,
          input.autoAdmit ?? false,
          input.hostPlays ?? true,
        ],
      );
      row = rows[0];
    }
    if (!row) throw new Error("Could not allocate a session code");
    const session = mapSession(row);
    const host = await insertParticipant(tx, session.id, {
      email: input.host.email,
      displayName: input.host.name,
      role: "host",
      status: "approved",
      emailVerified: false,
      locale: input.host.locale,
    });
    return { session, host };
  });
}

export async function getSessionByCode(code: string) {
  const rows = await (await db()).query("select * from sessions where code = $1", [code.toUpperCase()]);
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function getSessionByScreenCode(screenCode: string) {
  const rows = await (await db()).query("select * from sessions where screen_code = $1", [screenCode.replace(/\D/g, "")]);
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function getSessionById(id: string) {
  const rows = await (await db()).query("select * from sessions where id = $1", [id]);
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function getSessionVersion(code: string) {
  const rows = await (await db()).query<{ version: string }>("select version from sessions where code = $1", [code]);
  return rows[0] ? Number(rows[0].version) : null;
}

export type SessionPatch = Partial<
  Pick<Session, "title" | "scheduledAt" | "location" | "onlineUrl" | "budgetAmount" | "currency" | "locale" | "mode" | "hostPlays">
>;

const sessionColumns: Record<keyof SessionPatch, string> = {
  title: "title",
  scheduledAt: "scheduled_at",
  location: "location",
  onlineUrl: "online_url",
  budgetAmount: "budget_amount",
  currency: "currency",
  locale: "locale",
  mode: "mode",
  hostPlays: "host_plays",
};

export async function updateSession(id: string, patch: SessionPatch) {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined) as [keyof SessionPatch, unknown][];
  if (!entries.length) return;
  const sets = entries.map(([k], i) => `${sessionColumns[k]} = $${i + 2}`);
  await (await db()).query(`update sessions set ${sets.join(", ")}, version = version + 1 where id = $1`, [
    id,
    ...entries.map(([, v]) => v),
  ]);
}

export async function bumpVersion(sessionId: string, tx?: Queryable) {
  await (tx ?? (await db())).query("update sessions set version = version + 1 where id = $1", [sessionId]);
}

/** Records that one of the Elf Chief's devices joined, so the other one can move on by itself. */
export async function markDevice(sessionId: string, device: "screen" | "remote") {
  const column = device === "screen" ? "screen_seen_at" : "remote_paired_at";
  await (await db()).query(`update sessions set ${column} = now(), version = version + 1 where id = $1 and ${column} is null`, [sessionId]);
}

export async function setCeremonyStep(sessionId: string, step: CeremonyStep, status?: SessionStatus) {
  await (await db()).query(
    `update sessions set ceremony_step = $2, step_started_at = now(), status = coalesce($3, status), version = version + 1 where id = $1`,
    [sessionId, step, status ?? null],
  );
}

export async function listSessionsForEmail(email: string) {
  const rows = await (await db()).query(
    `select s.*, p.role as viewer_role from sessions s
     join session_participants p on p.session_id = s.id
     where p.email = $1 and p.status <> 'rejected'
     order by s.created_at desc limit 50`,
    [normalizeEmail(email)],
  );
  return rows.map((r) => ({ session: mapSession(r), role: r.viewer_role as "host" | "elf" }));
}

/* ---------- participants & profiles ---------- */

type NewParticipant = {
  email: string | null;
  displayName?: string;
  role?: "host" | "elf";
  status: ParticipantStatus;
  emailVerified: boolean;
  locale?: string;
};

async function insertParticipant(tx: Queryable, sessionId: string, input: NewParticipant) {
  if (!input.email) {
    const rows = await tx.query(
      `insert into session_participants (session_id, email, display_name, avatar, role, status, email_verified)
       values ($1,null,$2,$3::jsonb,$4,$5,false) returning *`,
      [sessionId, input.displayName?.trim() || "Elf", JSON.stringify(seededAvatar(crypto.randomUUID())), input.role ?? "elf", input.status],
    );
    await bumpVersion(sessionId, tx);
    return mapParticipant(rows[0]);
  }
  const email = normalizeEmail(input.email);
  const [profileRow] = await tx.query("select * from profiles where email = $1", [email]);
  const profile = profileRow ? mapProfile(profileRow) : null;
  const displayName = input.displayName?.trim() || profile?.displayName || email.split("@")[0];
  const avatar = profile?.avatar ?? seededAvatar(email);
  const rows = await tx.query(
    `insert into session_participants (session_id, profile_id, email, display_name, avatar, role, status, email_verified)
     values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)
     on conflict (session_id, email) do update set
       status = case when session_participants.status = 'rejected' then excluded.status else session_participants.status end,
       display_name = case when session_participants.profile_completed_at is null then excluded.display_name else session_participants.display_name end
     returning *`,
    [sessionId, profile?.id ?? null, email, displayName, JSON.stringify(avatar), input.role ?? "elf", input.status, input.emailVerified],
  );
  await bumpVersion(sessionId, tx);
  return mapParticipant(rows[0]);
}

export async function addParticipant(sessionId: string, input: NewParticipant) {
  const d = await db();
  return d.transaction((tx) => insertParticipant(tx, sessionId, input));
}

export async function listParticipants(sessionId: string) {
  const rows = await (await db()).query(
    "select * from session_participants where session_id = $1 order by role = 'host' desc, created_at asc",
    [sessionId],
  );
  return rows.map(mapParticipant);
}

export async function getParticipant(id: string) {
  const rows = await (await db()).query("select * from session_participants where id = $1", [id]);
  return rows[0] ? mapParticipant(rows[0]) : null;
}

export async function findParticipantByEmail(sessionId: string, email: string) {
  const rows = await (await db()).query("select * from session_participants where session_id = $1 and email = $2", [
    sessionId,
    normalizeEmail(email),
  ]);
  return rows[0] ? mapParticipant(rows[0]) : null;
}

export type ParticipantPatch = Partial<
  Pick<Participant, "email" | "displayName" | "avatar" | "status" | "isRemote" | "emailVerified" | "profileCompletedAt" | "lastSeenAt">
>;

const participantColumns: Record<keyof ParticipantPatch, string> = {
  email: "email",
  displayName: "display_name",
  avatar: "avatar",
  status: "status",
  isRemote: "is_remote",
  emailVerified: "email_verified",
  profileCompletedAt: "profile_completed_at",
  lastSeenAt: "last_seen_at",
};

export async function updateParticipant(participant: Pick<Participant, "id" | "sessionId">, patch: ParticipantPatch, bump = true) {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined) as [keyof ParticipantPatch, unknown][];
  if (!entries.length) return;
  const sets = entries.map(([k], i) => `${participantColumns[k]} = $${i + 2}${k === "avatar" ? "::jsonb" : ""}`);
  const d = await db();
  await d.query(`update session_participants set ${sets.join(", ")} where id = $1`, [
    participant.id,
    ...entries.map(([k, v]) => (k === "avatar" ? JSON.stringify(v) : v)),
  ]);
  if (bump) await bumpVersion(participant.sessionId);
}

export async function deleteParticipant(participant: Pick<Participant, "id" | "sessionId">) {
  await (await db()).query("delete from session_participants where id = $1 and role <> 'host'", [participant.id]);
  await bumpVersion(participant.sessionId);
}

export async function findProfileByEmail(email: string) {
  const rows = await (await db()).query("select * from profiles where email = $1", [normalizeEmail(email)]);
  return rows[0] ? mapProfile(rows[0]) : null;
}

/** Saves a verified participant's elf as their reusable profile for future sessions. */
export async function saveProfileFromParticipant(participant: Participant, locale: string) {
  if (!participant.email) return;
  const d = await db();
  const rows = await d.query(
    `insert into profiles (email, display_name, avatar, locale) values ($1,$2,$3::jsonb,$4)
     on conflict (email) do update set display_name = excluded.display_name, avatar = excluded.avatar, locale = excluded.locale, updated_at = now()
     returning id`,
    [participant.email, participant.displayName, JSON.stringify(participant.avatar), locale],
  );
  await d.query("update session_participants set profile_id = $2 where id = $1", [participant.id, rows[0].id]);
}

/* ---------- exclusions ---------- */

export async function listExclusions(sessionId: string): Promise<ExclusionRow[]> {
  const rows = await (await db()).query(
    "select id, giver_id, receiver_id, bidirectional from exclusions where session_id = $1 order by created_at",
    [sessionId],
  );
  return rows.map((r) => ({
    id: r.id as string,
    giverId: r.giver_id as string,
    receiverId: r.receiver_id as string,
    bidirectional: r.bidirectional as boolean,
  }));
}

export async function addExclusion(sessionId: string, giverId: string, receiverId: string, bidirectional: boolean) {
  const d = await db();
  await d.query(
    `insert into exclusions (session_id, giver_id, receiver_id, bidirectional)
     select $1, $2, $3, $4 where exists (select 1 from session_participants where id = $2 and session_id = $1)
       and exists (select 1 from session_participants where id = $3 and session_id = $1)
     on conflict (session_id, giver_id, receiver_id) do update set bidirectional = excluded.bidirectional`,
    [sessionId, giverId, receiverId, bidirectional],
  );
  await bumpVersion(sessionId);
}

export async function deleteExclusion(sessionId: string, exclusionId: string) {
  await (await db()).query("delete from exclusions where id = $1 and session_id = $2", [exclusionId, sessionId]);
  await bumpVersion(sessionId);
}

/* ---------- draw ---------- */

/** Whether a participant gives and gets a gift: everyone but an Elf Chief who only runs the show. */
export function playsInDraw(p: Pick<Participant, "role">, session: Pick<Session, "hostPlays">) {
  return p.role !== "host" || session.hostPlays;
}

export async function drawIds(sessionId: string) {
  const [session, participants] = await Promise.all([getSessionById(sessionId), listParticipants(sessionId)]);
  return participants.filter((p) => p.status === "approved" && (!session || playsInDraw(p, session))).map((p) => p.id);
}

/** Runs the draw exactly once per session; later calls return the existing result. */
export async function runDraw(sessionId: string) {
  const d = await db();
  return d.transaction(async (tx) => {
    const [locked] = await tx.query("select drawn_at from sessions where id = $1 for update", [sessionId]);
    if (!locked) throw new Error("Session not found");
    if (locked.drawn_at) return { alreadyDrawn: true };
    const ids = (
      await tx.query<{ id: string }>(
        `select id from session_participants where session_id = $1 and status = 'approved'
           and (role <> 'host' or (select host_plays from sessions where id = $1)) order by created_at`,
        [sessionId],
      )
    ).map((r) => r.id);
    const exclusions = (
      await tx.query("select giver_id, receiver_id, bidirectional from exclusions where session_id = $1", [sessionId])
    ).map((r) => ({ giverId: r.giver_id as string, receiverId: r.receiver_id as string, bidirectional: r.bidirectional as boolean }));
    const pairs = drawAssignments(ids, exclusions);
    const { salt, commitment } = commitDraw(pairs);
    for (const p of pairs) {
      await tx.query("insert into assignments (session_id, giver_id, receiver_id) values ($1,$2,$3)", [
        sessionId,
        p.giverId,
        p.receiverId,
      ]);
    }
    await tx.query(
      "update sessions set drawn_at = now(), draw_commitment = $2, draw_salt = $3, version = version + 1 where id = $1",
      [sessionId, commitment, salt],
    );
    return { alreadyDrawn: false };
  });
}

export async function getAssignmentForGiver(sessionId: string, giverId: string) {
  const rows = await (await db()).query(
    "select receiver_id, revealed_at from assignments where session_id = $1 and giver_id = $2",
    [sessionId, giverId],
  );
  if (!rows[0]) return null;
  const receiver = await getParticipant(rows[0].receiver_id as string);
  return receiver ? { receiver, revealedAt: toDate(rows[0].revealed_at) } : null;
}

export async function markRevealed(sessionId: string, giverId: string) {
  await (await db()).query(
    "update assignments set revealed_at = coalesce(revealed_at, now()) where session_id = $1 and giver_id = $2",
    [sessionId, giverId],
  );
}

export async function countRevealed(sessionId: string) {
  const rows = await (await db()).query<{ total: string; revealed: string }>(
    "select count(*) as total, count(revealed_at) as revealed from assignments where session_id = $1",
    [sessionId],
  );
  return { total: Number(rows[0].total), revealed: Number(rows[0].revealed) };
}

/* ---------- auth tokens ---------- */

export async function insertToken(input: {
  hash: string;
  purpose: "login" | "participant";
  email: string;
  participantId: string | null;
  expiresAt: Date;
}) {
  await (await db()).query(
    "insert into auth_tokens (token_hash, purpose, email, participant_id, expires_at) values ($1,$2,$3,$4,$5)",
    [input.hash, input.purpose, normalizeEmail(input.email), input.participantId, input.expiresAt],
  );
}

export async function consumeToken(hash: string) {
  const rows = await (await db()).query(
    `update auth_tokens set used_at = coalesce(used_at, now()) where token_hash = $1 and expires_at > now()
     returning purpose, email, participant_id`,
    [hash],
  );
  const r = rows[0];
  return r
    ? { purpose: r.purpose as "login" | "participant", email: r.email as string, participantId: r.participant_id as string | null }
    : null;
}

/* ---------- tts cache ---------- */

export async function registerTtsLine(hash: string, text: string, lang: string, voice: string) {
  await registerTtsLines([{ hash, text, lang, voice }]);
}

/** One insert for many lines. Parallel inserts through the Supabase pooler stall until the statement times out. */
export async function registerTtsLines(lines: { hash: string; text: string; lang: string; voice: string }[]) {
  if (!lines.length) return;
  const params: unknown[] = [];
  const tuples = lines.map((line) => {
    const n = params.length;
    params.push(line.hash, line.text, line.lang, line.voice);
    return `($${n + 1},$${n + 2},$${n + 3},$${n + 4})`;
  });
  await (await db()).query(
    `insert into tts_cache (hash, text, lang, voice) values ${tuples.join(",")} on conflict (hash) do nothing`,
    params,
  );
}

export async function getTtsLine(hash: string) {
  const rows = await (await db()).query("select * from tts_cache where hash = $1", [hash]);
  const r = rows[0];
  if (!r) return null;
  return {
    text: r.text as string,
    lang: r.lang as string,
    voice: r.voice as string,
    audio: r.audio ? Buffer.from(r.audio as Uint8Array) : null,
    mime: r.mime as string | null,
    failedAt: toDate(r.failed_at),
  };
}

export async function hasTtsAudio(hash: string) {
  const rows = await (await db()).query("select 1 from tts_cache where hash = $1 and audio is not null", [hash]);
  return rows.length > 0;
}

/** Sizes of the recorded audio, by hash; lines without audio are left out. */
export async function ttsAudioSizes(hashes: string[]) {
  if (!hashes.length) return new Map<string, number>();
  const rows = await (await db()).query(
    "select hash, octet_length(audio) as size from tts_cache where hash = any($1) and audio is not null",
    [hashes],
  );
  return new Map(rows.map((r) => [r.hash as string, Number(r.size)]));
}

export async function storeTtsAudio(hash: string, audio: Buffer | null, mime: string | null) {
  await (await db()).query(
    "update tts_cache set audio = $2, mime = $3, failed_at = case when $2::bytea is null then now() else null end where hash = $1",
    [hash, audio, mime],
  );
}

/* ---------- dev mail inbox ---------- */

export async function logMail(recipient: string, subject: string, html: string) {
  await (await db()).query("insert into mail_log (recipient, subject, html) values ($1,$2,$3)", [recipient, subject, html]);
}

export async function listMail(limit = 100) {
  const rows = await (await db()).query("select * from mail_log order by created_at desc limit $1", [limit]);
  return rows.map((r) => ({
    id: r.id as string,
    recipient: r.recipient as string,
    subject: r.subject as string,
    html: r.html as string,
    createdAt: new Date(r.created_at as string),
  }));
}
