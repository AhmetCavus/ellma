import { randomBytes, randomInt } from "node:crypto";
import { chmod, copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";
import { createConnection } from "mongoose";

const projectRoot = new URL("../", import.meta.url);
const environmentPath = new URL(".env", projectRoot);
let source = "# Local runtime configuration. Never commit this file.\n";
let exists = false;
try {
  source = await readFile(environmentPath, "utf8");
  exists = true;
} catch (error) {
  if (error.code !== "ENOENT") {
    throw error;
  }
}
const current = parse(source);
const isPlaceholder = (value) => !value || /replace[-_ ]|change[-_ ]?me/i.test(value);
const isValidAdminPassword = (value) =>
  typeof value === "string" &&
  value.length >= 8 &&
  value.length <= 72 &&
  (value.match(/[^a-zA-Z0-9]/g) || []).length >= 2;
const infrastructurePath =
  process.env.MONGO_ENV_FILE || fileURLToPath(new URL("../infra/mongo/.env.mongo", projectRoot));
const mongo = parse(await readFile(infrastructurePath));
if (!mongo.MONGO_INITDB_ROOT_USERNAME || !mongo.MONGO_INITDB_ROOT_PASSWORD) {
  throw new Error("The existing shared-mongo administrator configuration is incomplete.");
}
const configuredHost = process.env.MONGO_HOST || mongo.MONGO_BIND_ADDRESS || "192.168.178.131";
const host = configuredHost === "0.0.0.0" ? "127.0.0.1" : configuredHost;
const port = mongo.MONGO_PORT || "27017";
const databaseName = "ellma";
const configuredUri = isPlaceholder(current.DB_URI_DOCKER) ? null : new URL(current.DB_URI_DOCKER);
const authenticationDatabase = configuredUri?.searchParams.get("authSource") || databaseName;
if (
  configuredUri &&
  (configuredUri.pathname !== `/${databaseName}` ||
    ![databaseName, "admin"].includes(authenticationDatabase))
) {
  throw new Error(
    "DB_URI_DOCKER must use ellma with an existing admin or application authentication database.",
  );
}
const username = configuredUri
  ? decodeURIComponent(configuredUri.username)
  : `ellma_${randomBytes(6).toString("hex")}`;
const databasePassword = configuredUri
  ? decodeURIComponent(configuredUri.password)
  : randomBytes(32).toString("base64url");
if (!username || !databasePassword) {
  throw new Error("The application MongoDB credentials are incomplete.");
}
const credentials = `${encodeURIComponent(username)}:${encodeURIComponent(databasePassword)}`;
const adminCredentials = `${encodeURIComponent(mongo.MONGO_INITDB_ROOT_USERNAME)}:${encodeURIComponent(mongo.MONGO_INITDB_ROOT_PASSWORD)}`;
const adminUri = `mongodb://${adminCredentials}@${host}:${port}/admin?authSource=admin`;
const hostUri = `mongodb://${credentials}@${host}:${port}/${databaseName}?authSource=${authenticationDatabase}`;
const dockerUri = `mongodb://${credentials}@shared-mongo:27017/${databaseName}?authSource=${authenticationDatabase}`;
const connection = await createConnection(adminUri, { serverSelectionTimeoutMS: 8000 }).asPromise();
let createdUser = false;
let saved = false;
try {
  const database = connection.useDb(databaseName).db;
  const users = await connection
    .useDb(authenticationDatabase)
    .db.command({ usersInfo: { user: username, db: authenticationDatabase } });
  if (users.users.length === 0) {
    if (authenticationDatabase === "admin") {
      throw new Error(
        "The configured administrator does not exist; existing administrator accounts were preserved.",
      );
    }
    await database.command({
      createUser: username,
      pwd: databasePassword,
      roles: [{ role: "readWrite", db: databaseName }],
    });
    createdUser = true;
  }
  const appConnection = await createConnection(hostUri, {
    serverSelectionTimeoutMS: 8000,
  }).asPromise();
  try {
    await appConnection.db.command({ ping: 1 });
  } finally {
    await appConnection.close();
  }
  const values = {
    DB_URI: hostUri,
    DB_URI_DOCKER: dockerUri,
    DB_ENGINE: "mongodb",
    DBNAME: databaseName,
    JWT_SECRET:
      !isPlaceholder(current.JWT_SECRET) && current.JWT_SECRET.length >= 32
        ? current.JWT_SECRET
        : randomBytes(48).toString("hex"),
    INITIAL_ADMIN_USER: current.INITIAL_ADMIN_USER || "admin@yappai.de",
    INITIAL_ADMIN_PASS:
      !isPlaceholder(current.INITIAL_ADMIN_PASS) && isValidAdminPassword(current.INITIAL_ADMIN_PASS)
        ? current.INITIAL_ADMIN_PASS
        : `${randomBytes(24).toString("base64url")}!#aA1`,
    PORT: current.PORT || "4000",
    ALLOWED_ORIGINS:
      current.ALLOWED_ORIGINS || "https://ellma.yappai.de,https://ellma-admin.yappai.de",
    OLLAMA_URL: current.OLLAMA_URL || "http://127.0.0.1:11434",
    OLLAMA_URL_DOCKER: current.OLLAMA_URL_DOCKER || "http://ollama:11434",
    OLLAMA_MODEL: current.OLLAMA_MODEL || "qwen3.5:4b",
    ELLMA_WEB_URL: current.ELLMA_WEB_URL || "https://ellma.yappai.de",
    ELLMA_ADMIN_URL: current.ELLMA_ADMIN_URL || "https://ellma-admin.yappai.de",
    ELLMA_API_URL: current.ELLMA_API_URL || "https://ellma-api.yappai.de",
    NPM_REGISTRY: current.NPM_REGISTRY || "http://192.168.178.131:4873/",
  };
  for (const [key, value] of Object.entries(values)) {
    if (current[key] === value) {
      continue;
    }
    const line = `${key}=${JSON.stringify(value)}\n`;
    const pattern = new RegExp(`^(?:export\\s+)?${key}\\s*=.*(?:\\r?\\n|$)`, "m");
    source = pattern.test(source)
      ? source.replace(pattern, () => line)
      : `${source.trimEnd()}\n${line}`;
  }
  const temporaryPath = new URL(`.env.setup-${randomBytes(6).toString("hex")}`, projectRoot);
  await writeFile(temporaryPath, source, { flag: "wx", mode: 0o600 });
  await rename(temporaryPath, environmentPath);
  await chmod(environmentPath, 0o600);
  saved = true;
  await copyFile(
    new URL("docker/traefik.yml", projectRoot),
    new URL("../infra/traefik/dynamic/ellma.yml", projectRoot),
  );
  console.log(
    `${exists ? "Updated" : "Created"} ellma (elma/.env) with mode 0600. Valid existing secrets were preserved.`,
  );
  console.log(
    `${createdUser ? "Created" : "Verified"} the application user on shared-mongo / ellma.`,
  );
  console.log(
    "The initial admin password is in the local .env. Installed the Traefik route ellma.yml.",
  );
} catch (error) {
  if (createdUser && !saved) {
    await connection.useDb(databaseName).db.command({ dropUser: username });
  }
  throw new Error("Environment setup failed; existing database users were not changed.", {
    cause: error,
  });
} finally {
  await connection.close();
}
