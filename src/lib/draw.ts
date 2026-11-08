import { createHash, randomBytes, randomInt } from "node:crypto";

export type Exclusion = { giverId: string; receiverId: string; bidirectional: boolean };
export type Pair = { giverId: string; receiverId: string };

export type Feasibility =
  | { ok: true }
  | {
      ok: false;
      reason: "too_few" | "blocked";
      /** Givers that together have too few possible receivers (a Hall's theorem violation). */
      blockedGiverIds: string[];
    };

type Graph = { ids: string[]; allowed: boolean[][] };

function buildGraph(ids: string[], exclusions: Exclusion[]): Graph {
  const index = new Map(ids.map((id, i) => [id, i]));
  const allowed = ids.map((_, g) => ids.map((__, r) => g !== r));
  for (const ex of exclusions) {
    const g = index.get(ex.giverId);
    const r = index.get(ex.receiverId);
    if (g === undefined || r === undefined) continue;
    allowed[g][r] = false;
    if (ex.bidirectional) allowed[r][g] = false;
  }
  return { ids, allowed };
}

/** Hopcroft–Karp maximum bipartite matching between givers (left) and receivers (right). */
function maxMatching({ ids, allowed }: Graph) {
  const n = ids.length;
  const adj = allowed.map((row) => row.flatMap((ok, r) => (ok ? [r] : [])));
  const matchL = new Array<number>(n).fill(-1);
  const matchR = new Array<number>(n).fill(-1);
  const dist = new Array<number>(n).fill(0);

  const bfs = () => {
    const queue: number[] = [];
    let found = false;
    for (let u = 0; u < n; u++) {
      if (matchL[u] === -1) {
        dist[u] = 0;
        queue.push(u);
      } else dist[u] = Infinity;
    }
    for (let i = 0; i < queue.length; i++) {
      const u = queue[i];
      for (const v of adj[u]) {
        const w = matchR[v];
        if (w === -1) found = true;
        else if (dist[w] === Infinity) {
          dist[w] = dist[u] + 1;
          queue.push(w);
        }
      }
    }
    return found;
  };

  const dfs = (u: number): boolean => {
    for (const v of adj[u]) {
      const w = matchR[v];
      if (w === -1 || (dist[w] === dist[u] + 1 && dfs(w))) {
        matchL[u] = v;
        matchR[v] = u;
        return true;
      }
    }
    dist[u] = Infinity;
    return false;
  };

  let size = 0;
  while (bfs()) for (let u = 0; u < n; u++) if (matchL[u] === -1 && dfs(u)) size++;
  return { size, matchL, matchR, adj };
}

export function checkFeasibility(ids: string[], exclusions: Exclusion[]): Feasibility {
  if (ids.length < 2) return { ok: false, reason: "too_few", blockedGiverIds: [] };
  const graph = buildGraph(ids, exclusions);
  const { size, matchL, matchR, adj } = maxMatching(graph);
  if (size === ids.length) return { ok: true };

  // König: givers reachable by alternating paths from an unmatched giver form a set S with |N(S)| < |S|.
  const start = matchL.findIndex((m) => m === -1);
  const seenL = new Set<number>([start]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const v of adj[queue[i]]) {
      const w = matchR[v];
      if (w !== -1 && !seenL.has(w)) {
        seenL.add(w);
        queue.push(w);
      }
    }
  }
  return { ok: false, reason: "blocked", blockedGiverIds: [...seenL].map((i) => ids[i]) };
}

function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const MAX_REJECTION_ATTEMPTS = 50_000;

/**
 * Draws a Secret Santa assignment. Rejection sampling over uniformly random permutations
 * yields every valid assignment with equal probability; heavily constrained groups fall
 * back to randomized backtracking.
 */
export function drawAssignments(ids: string[], exclusions: Exclusion[]): Pair[] {
  const feasibility = checkFeasibility(ids, exclusions);
  if (!feasibility.ok) throw new DrawError(feasibility);
  const { allowed } = buildGraph(ids, exclusions);
  const n = ids.length;

  for (let attempt = 0; attempt < MAX_REJECTION_ATTEMPTS; attempt++) {
    const perm = shuffle([...Array(n).keys()]);
    if (perm.every((r, g) => allowed[g][r])) {
      return perm.map((r, g) => ({ giverId: ids[g], receiverId: ids[r] }));
    }
  }

  const assignment = new Array<number>(n).fill(-1);
  const taken = new Array<boolean>(n).fill(false);
  const order = shuffle([...Array(n).keys()]);
  const solve = (k: number): boolean => {
    if (k === n) return true;
    const g = order[k];
    for (const r of shuffle([...Array(n).keys()])) {
      if (taken[r] || !allowed[g][r]) continue;
      taken[r] = true;
      assignment[g] = r;
      if (solve(k + 1)) return true;
      taken[r] = false;
    }
    return false;
  };
  if (!solve(0)) throw new DrawError({ ok: false, reason: "blocked", blockedGiverIds: ids });
  return assignment.map((r, g) => ({ giverId: ids[g], receiverId: ids[r] }));
}

/** A hash of the result that can be published before revealing anything, proving it never changed. */
export function commitDraw(pairs: Pair[]) {
  const salt = randomBytes(16).toString("hex");
  const canonical = [...pairs]
    .sort((a, b) => a.giverId.localeCompare(b.giverId))
    .map((p) => `${p.giverId}>${p.receiverId}`)
    .join(",");
  const commitment = createHash("sha256").update(`${salt}:${canonical}`).digest("hex");
  return { salt, commitment };
}

export class DrawError extends Error {
  constructor(public readonly feasibility: Exclude<Feasibility, { ok: true }>) {
    super(`Draw impossible: ${feasibility.reason}`);
  }
}
