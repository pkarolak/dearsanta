import { connectPostgres, migrate } from "../src/lib/db/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. The local PGlite database migrates itself on startup.");
    process.exit(1);
  }
  const db = await connectPostgres(url);
  await migrate(db);
  console.log("Migrations up to date.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
