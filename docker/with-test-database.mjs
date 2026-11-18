import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { parse } from "dotenv";

const command = process.argv.slice(2);
if (command.length === 0) {
  throw new Error(
    "Pass a test command, for example: node docker/with-test-database.mjs npm run test:database",
  );
}
let uri = process.env.TEST_DB_URI;
if (!uri) {
  const source = process.env.TEST_MONGO_ENV_FILE || "../infra/mongo/.env.mongo";
  const mongo = parse(await readFile(source));
  const host = process.env.TEST_MONGO_HOST || mongo.MONGO_BIND_ADDRESS || "192.168.178.131";
  const database = `ellma_test_${Date.now()}_${process.pid}`;
  const username = encodeURIComponent(mongo.MONGO_INITDB_ROOT_USERNAME || "");
  const password = encodeURIComponent(mongo.MONGO_INITDB_ROOT_PASSWORD || "");
  uri = `mongodb://${username}:${password}@${host}:${mongo.MONGO_PORT || 27017}/${database}?authSource=admin`;
}
const database = new URL(uri).pathname.slice(1);
if (!/^ellma_test_[A-Za-z0-9_]+$/.test(database)) {
  throw new Error("Refusing tests: database must start with ellma_test_.");
}
console.log(`Using isolated shared-mongo database: ${database}`);
const child = spawn(command[0], command.slice(1), {
  stdio: "inherit",
  env: { ...process.env, TEST_DB_URI: uri },
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
