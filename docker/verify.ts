import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";

const root = process.cwd();
const compose = parse(await readFile("docker/docker-compose.yml", "utf8"));
const manifest = parse(await readFile("yappai.host.yaml", "utf8"));
const routing = parse(await readFile("docker/traefik.yml", "utf8"));

const domains: Record<string, string> = {
  web: "ellma.yappai.de",
  admin: "ellma-admin.yappai.de",
  api: "ellma-api.yappai.de",
};
assert.deepEqual(Object.keys(compose.services).sort(), ["admin", "api", "web"]);
assert.equal(compose.networks["dev-proxy"].external, true);
for (const [name, domain] of Object.entries(domains)) {
  const service = compose.services[name];
  const registration = manifest.services.find((entry: { name: string }) => entry.name === name);
  assert.equal(registration.containerName, service.container_name);
  const router = routing.http.routers[`ellma-${name}`];
  assert.equal(router.rule, `Host(\`${domain}\`)`);
  assert.deepEqual(router.entryPoints, ["web"]);
  assert.equal(
    routing.http.services[router.service].loadBalancer.servers[0].url,
    `http://${registration.containerName}:${name === "api" ? "4000" : "80"}`,
  );
  assert.equal(service.labels["traefik.enable"], "false");
  assert.ok(service.healthcheck);
  assert.ok(service.networks.includes("dev-proxy"));
}
assert.equal(manifest.database.name, "ellma");
assert.equal(manifest.database.connectionRef, "shared-mongo");
assert.ok(compose.services.api.environment.DB_URI.includes("DB_URI_DOCKER"));
assert.ok(compose.services.api.environment.OLLAMA_URL.includes("ollama:11434"));
// The API must accept both browser apps, and each image must build its own site.
assert.ok(compose.services.api.environment.ALLOWED_ORIGINS.includes("ellma-admin.yappai.de"));
assert.equal(compose.services.web.build.target, "runtime");
assert.equal(compose.services.admin.build.target, "admin");
console.log("Compose, routers, internal ports, shared Mongo and Ollama references: passed.");

let hasEnvironment = true;
try {
  await access(path.resolve(root, manifest.composeEnvFile));
} catch {
  hasEnvironment = false;
  console.log("No .env yet: run `npm run setup:environment` before starting Ellma in Yoster.");
}
if (hasEnvironment) {
  execFileSync(
    "docker",
    ["compose", "--env-file", ".env", "-f", "docker/docker-compose.yml", "config", "--quiet"],
    {
      stdio: "pipe",
    },
  );
  console.log("docker compose config with the real .env: passed.");
}

const discoveryPath =
  process.env.YOSTER_DISCOVERY_MODULE ||
  path.resolve(root, "../yappai-host/server/src/services/HostingManifestDiscoveryService.ts");
const { HostingManifestDiscoveryService } = await import(pathToFileURL(discoveryPath).href);
const fixtureRoot = await mkdtemp(path.join(tmpdir(), "ellma-yoster-"));
try {
  const fixtureProject = path.join(fixtureRoot, "ellma");
  await mkdir(path.join(fixtureProject, "docker"), { recursive: true });
  await cp("yappai.host.yaml", path.join(fixtureProject, "yappai.host.yaml"));
  await cp("docker/docker-compose.yml", path.join(fixtureProject, "docker/docker-compose.yml"));
  await cp(".env.example", path.join(fixtureProject, ".env"));
  execFileSync(
    "docker",
    ["compose", "--env-file", ".env", "-f", "docker/docker-compose.yml", "config", "--quiet"],
    { cwd: fixtureProject, stdio: "pipe" },
  );
  console.log("docker compose config with .env.example (isolated fixture): passed.");
  const projects = await new HostingManifestDiscoveryService(fixtureRoot).discover();
  assert.equal(projects.length, 1, "Yoster must accept the manifest");
  assert.equal(projects[0].id, "ellma");
  assert.equal(projects[0].database.connectionRef, "shared-mongo");
  console.log("Manifest accepted by Yoster's discovery implementation (isolated fixture).");
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}
if (!hasEnvironment) {
  console.log("Real Yoster registration: pending until `npm run setup:environment` creates .env.");
  process.exit(0);
}
const hosted = await new HostingManifestDiscoveryService(path.dirname(root)).discover();
assert.ok(
  hosted.some(
    (project: { id: string; rootPath: string }) =>
      project.id === "ellma" && project.rootPath === root,
  ),
  "Ellma must be discoverable from the real hosting root.",
);
console.log("Ellma is discoverable from the actual hosting root.");
