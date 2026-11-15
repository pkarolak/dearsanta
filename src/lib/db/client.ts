import fs from "node:fs/promises";
import path from "node:path";

export type Row = Record<string, unknown>;

export interface Queryable {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Database extends Queryable {
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
}

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

async function createPglite(): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = path.resolve(process.env.PGLITE_DIR ?? path.join(".data", "pglite"));
  await fs.mkdir(dataDir, { recursive: true });
  const pg = await PGlite.create(dataDir);
  const db: Database = {
    async query<T>(text: string, params: unknown[] = []) {
      const result = await pg.query<T>(text, params);
      return result.rows;
    },
    async transaction<T>(fn: (tx: Queryable) => Promise<T>) {
      return pg.transaction(async (tx) =>
        fn({
          async query<R>(text: string, params: unknown[] = []) {
            const result = await tx.query<R>(text, params);
            return result.rows;
          },
        }),
      );
    },
  };
  await migrate(db);
  return db;
}

async function createPostgres(url: string): Promise<Database> {
  const { default: postgres } = await import("postgres");
  // prepare: false keeps it compatible with the Supabase transaction pooler (pgbouncer).
  const sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20 });
  const run = (client: typeof sql) =>
    async function query<T>(text: string, params: unknown[] = []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await client.unsafe(text, params as any[]);
      return rows as unknown as T[];
    };
  return {
    query: run(sql),
    async transaction<T>(fn: (tx: Queryable) => Promise<T>) {
      return sql.begin(async (tx) => fn({ query: run(tx as unknown as typeof sql) })) as Promise<T>;
    },
  };
}

export async function migrate(db: Database) {
  await db.query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const applied = new Set(
    (await db.query<{ name: string }>("select name from schema_migrations")).map((r) => r.name),
  );
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sqlText = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    await db.transaction(async (tx) => {
      for (const statement of splitStatements(sqlText)) await tx.query(statement);
      await tx.query("insert into schema_migrations (name) values ($1)", [file]);
    });
    console.log(`[db] applied migration ${file}`);
  }
}

function splitStatements(sqlText: string) {
  return sqlText
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const globalForDb = globalThis as unknown as { __santaDb?: Promise<Database> };

export function getDb(): Promise<Database> {
  if (!globalForDb.__santaDb) {
    const url = process.env.DATABASE_URL;
    if (!url && process.env.VERCEL) throw new Error("DATABASE_URL must be set on Vercel (the embedded database needs a writable disk)");
    globalForDb.__santaDb = url ? createPostgres(url) : createPglite();
    globalForDb.__santaDb.catch(() => {
      globalForDb.__santaDb = undefined;
    });
  }
  return globalForDb.__santaDb;
}

export function connectPostgres(url: string) {
  return createPostgres(url);
}
