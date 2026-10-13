import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "fs";

const databaseDir = "./data/pg";
const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "hsbc_demo_local",
  port: 5433,
  persistent: true,
});

if (!existsSync(`${databaseDir}/PG_VERSION`)) {
  await pg.initialise();
}

await pg.start();

try {
  await pg.createDatabase("hsbc_demo");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!/already exists/i.test(message)) throw error;
}

console.log("LOCAL_DB_READY");
await new Promise(() => undefined);
