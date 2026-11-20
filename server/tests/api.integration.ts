import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { after, before, test } from "node:test";
import { createConnection, type Connection } from "mongoose";

const JWT_SECRET = "integration-test-only-secret-5a1f0c2e9d7b";
const ADMIN_PASSWORD = "Admin-Test!#Only9";
// The account helpers derive keys from the same secret the server under test uses.
process.env.JWT_SECRET = JWT_SECRET;
const { codeAt, currentCounter } = await import("../src/account/totp.ts");
const { fingerprint, newToken } = await import("../src/account/secrets.ts");

const uri = process.env.TEST_DB_URI ?? "";
if (!/^ellma_test_[A-Za-z0-9_]+$/.test(new URL(uri).pathname.slice(1))) {
  throw new Error("TEST_DB_URI must identify a separate ellma_test_* database.");
}
const port = 4600 + Math.floor(Math.random() * 300);
const base = `http://127.0.0.1:${port}`;
const origin = "http://localhost:5180";
let server: ChildProcess;
let database: Connection;
let serverLog = "";

async function call(method: string, path: string, token?: string, body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, json: (await response.json().catch(() => null)) as any };
}

async function account(name: string): Promise<string> {
  const email = `${name}-${Date.now()}@example.test`;
  const password = "Test-Only!#Pass1";
  const registered = await call("POST", "/authenticate/register", undefined, {
    username: name,
    email,
    password,
  });
  assert.equal(registered.status, 200, JSON.stringify(registered.json));
  const login = await call("POST", "/authenticate", undefined, { email, password });
  assert.equal(login.status, 200);
  const token = login.json.data?.token ?? login.json.token;
  assert.ok(token, JSON.stringify(login.json));
  const initialized = await call("POST", "/profile/initialize", token, {});
  assert.equal(initialized.status, 200, "users must be able to initialize the Yappio client");
  return token;
}

before(async () => {
  database = await createConnection(uri, { serverSelectionTimeoutMS: 8000 }).asPromise();
  server = spawn("node", ["dist/index.js"], {
    cwd: new URL("../", import.meta.url),
    env: {
      ...process.env,
      DB_URI: uri,
      NODE_ENV: "test",
      PORT: String(port),
      JWT_SECRET,
      INITIAL_ADMIN_USER: "admin@example.test",
      INITIAL_ADMIN_PASS: ADMIN_PASSWORD,
      MAIL_HOST: "",
      ALLOWED_ORIGINS: origin,
      OLLAMA_URL: process.env.OLLAMA_URL ?? "http://127.0.0.1:11434",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout?.on("data", (chunk) => ((serverLog += chunk), (output += chunk)));
  server.stderr?.on("data", (chunk) => ((serverLog += chunk), (output += chunk)));
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      if ((await fetch(`${base}/yappio/health`)).ok) {
        return;
      }
    } catch {
      /* not yet listening */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not start:\n${output.replaceAll(uri, "[redacted]")}`);
});

after(async () => {
  if (process.env.SHOW_SERVER_LOG) console.log(serverLog);
  server?.kill("SIGTERM");
  await database?.dropDatabase();
  await database?.close();
});

test("rejects foreign origins and anonymous access", async () => {
  const foreign = await fetch(`${base}/api/ellma/goals`, {
    headers: { Origin: "https://evil.test" },
  });
  assert.equal(foreign.status, 403);
  assert.equal((await call("GET", "/api/ellma/goals")).status, 401);
});

test("full goal → task → focus → review flow, isolated per user", async () => {
  const alice = await account("alice");
  const bob = await account("bob");

  const goal = await call("POST", "/api/ellma/goals", alice, {
    title: "Half marathon",
    weeklyTargetMinutes: 240,
    milestones: [{ id: "m1", title: "First 10k", doneAt: null }],
    tags: ["Health", " health ", "Running"],
  });
  assert.equal(goal.status, 200, JSON.stringify(goal.json));
  const goalId = goal.json.data.id;
  // Tags are the user's own words, kept once regardless of case and stored with the goal.
  assert.deepEqual(goal.json.data.tags, ["Health", "Running"]);
  const retagged = await call("PUT", `/api/ellma/goals/${goalId}`, alice, {
    ...goal.json.data,
    tags: ["Running"],
  });
  assert.equal(retagged.status, 200, JSON.stringify(retagged.json));
  assert.deepEqual((await call("GET", "/api/ellma/goals", alice)).json.data[0].tags, ["Running"]);
  assert.equal(
    (
      await call("PUT", `/api/ellma/goals/${goalId}`, alice, {
        ...goal.json.data,
        tags: ["x".repeat(31)],
      })
    ).status,
    400,
  );

  const task = await call("POST", "/api/ellma/tasks", alice, {
    title: "Run 5k",
    goalId,
    plannedOn: "2026-11-17",
  });
  assert.equal(task.status, 200, JSON.stringify(task.json));
  const taskId = task.json.data.id;

  // Bob can neither see nor touch Alice's data, nor link to her goal.
  assert.deepEqual((await call("GET", "/api/ellma/goals", bob)).json.data, []);
  assert.equal(
    (await call("PATCH", `/api/ellma/tasks/${taskId}`, bob, { done: true })).status,
    404,
  );
  assert.equal(
    (await call("POST", "/api/ellma/tasks", bob, { title: "Sneaky", goalId })).status,
    404,
  );
  assert.equal((await call("DELETE", `/api/ellma/goals/${goalId}`, bob)).status, 404);
  // Normal users must not reach Yappio's generic collection API.
  assert.equal((await call("GET", "/collection/EllmaTask", bob)).status, 401);

  const listed = await call("GET", "/api/ellma/tasks?from=2026-11-16&to=2026-11-22", alice);
  assert.equal(listed.json.data.length, 1);

  const started = await call("POST", "/api/ellma/focus/start", alice, { taskId });
  assert.equal(started.json.data.active.goalId, goalId);
  const restarted = await call("POST", "/api/ellma/focus/start", alice, { taskId: null });
  assert.equal(restarted.json.data.active.taskId, null);
  const state = await call("GET", "/api/ellma/focus", alice);
  assert.equal(state.json.data.active.id, restarted.json.data.active.id);

  await call("POST", "/api/ellma/focus/start", alice, { taskId });
  const stopped = await call("POST", "/api/ellma/focus/stop", alice, { completeTask: true });
  assert.equal(stopped.json.data.active, null);
  assert.ok(stopped.json.data.completedTask.doneAt);
  // The stop returns the session as saved, so the app can show the real time.
  assert.equal(stopped.json.data.stopped.taskId, taskId);
  assert.ok(stopped.json.data.stopped.endedAt);
  const nothingRunning = await call("POST", "/api/ellma/focus/stop", alice, {});
  assert.equal(nothingRunning.json.data.stopped, null);

  const logged = await call("POST", "/api/ellma/focus/sessions", alice, {
    goalId,
    startedAt: "2026-11-17T08:00:00.000Z",
    endedAt: "2026-11-17T09:30:00.000Z",
  });
  assert.equal(logged.status, 200, JSON.stringify(logged.json));
  const sessions = await call(
    "GET",
    "/api/ellma/focus/sessions?from=2026-11-16T00:00:00.000Z&to=2026-11-23T00:00:00.000Z",
    alice,
  );
  assert.ok(sessions.json.data.length >= 1);
  assert.equal(
    (
      await call(
        "GET",
        `/api/ellma/focus/sessions?from=2026-11-16T00:00:00.000Z&to=2026-11-23T00:00:00.000Z`,
        bob,
      )
    ).json.data.length,
    0,
  );
  const totals = await call("GET", "/api/ellma/goals/totals", alice);
  assert.ok(totals.json.data.find((row: any) => row.goalId === goalId).seconds >= 5400);

  // Deleting a goal keeps the task and the time but unlinks them.
  assert.equal((await call("DELETE", `/api/ellma/goals/${goalId}`, alice)).status, 200);
  const afterDelete = await call("GET", "/api/ellma/tasks?from=2026-11-16&to=2026-11-22", alice);
  assert.equal(afterDelete.json.data[0].goalId, null);
});

test("validates input", async () => {
  const token = await account("carol");
  assert.equal((await call("POST", "/api/ellma/goals", token, { title: "" })).status, 400);
  assert.equal(
    (await call("GET", "/api/ellma/tasks?from=2026-01-01&to=2026-12-31", token)).status,
    400,
  );
  assert.equal((await call("PATCH", "/api/ellma/tasks/not-an-id", token, {})).status, 400);
});

const PASSWORD = "Test-Only!#Pass1";

async function register(name: string): Promise<string> {
  const email = `${name}-${Date.now()}@example.test`;
  const registered = await call("POST", "/authenticate/register", undefined, {
    username: name,
    email,
    password: PASSWORD,
  });
  assert.equal(registered.status, 200, JSON.stringify(registered.json));
  return email;
}

function login(email: string, password: string, code?: string) {
  return call("POST", "/api/ellma/account/login", undefined, { email, password, code });
}

async function securityRecords() {
  const collections = await database.db!.listCollections().toArray();
  const name = collections.find((entry) => /accountsecurit/i.test(entry.name))?.name;
  assert.ok(name, "the account security collection must exist");
  return database.db!.collection(name);
}

const nextSecond = () => new Promise((resolve) => setTimeout(resolve, 1100));

test("signs in through Ellma and closes Yappio's own recovery and code routes", async () => {
  const email = await register("erin");
  const wrong = await login(email, "Wrong-Pass!#1");
  assert.equal(wrong.status, 401);
  assert.equal(wrong.json.error, "invalid_credentials");
  assert.equal((await login("nobody@example.test", PASSWORD)).status, 401);

  const signedIn = await login(email, PASSWORD);
  assert.equal(signedIn.json.data.status, "ok", JSON.stringify(signedIn.json));
  const token = signedIn.json.data.token;
  assert.equal((await call("POST", "/profile/initialize", token, {})).status, 200);
  const account = await call("GET", "/api/ellma/account", token);
  assert.deepEqual(
    [account.json.data.email, account.json.data.role, account.json.data.twoFactor],
    [email, "user", false],
  );
  assert.equal((await call("GET", "/api/ellma/account")).status, 401);

  for (const [method, path] of [
    ["POST", "/password/requestReset"],
    ["POST", "/password/reset"],
    ["POST", "/otp/verify"],
    ["POST", "/otp/setup-totp"],
    ["POST", "/totp/setup-with-identifier"],
    ["POST", "/authenticate/totp"],
    ["GET", "/email/verify?token=x"],
  ] as const) {
    const body = method === "GET" ? undefined : { email };
    assert.equal((await call(method, path, token, body)).status, 404, path);
  }
});

test("changing the password signs other sessions out", async () => {
  const email = await register("frank");
  const first = (await login(email, PASSWORD)).json.data.token;
  const second = (await login(email, PASSWORD)).json.data.token;
  const next = "Brand-New!#Pass2";

  const refused = await call("POST", "/api/ellma/account/password", first, {
    currentPassword: "Wrong-Pass!#1",
    newPassword: next,
  });
  assert.equal(refused.status, 403);
  assert.equal(refused.json.error, "invalid_password");
  const weak = await call("POST", "/api/ellma/account/password", first, {
    currentPassword: PASSWORD,
    newPassword: "tooweak1",
  });
  assert.equal(weak.json.error, "weak_password");

  await nextSecond();
  const changed = await call("POST", "/api/ellma/account/password", first, {
    currentPassword: PASSWORD,
    newPassword: next,
  });
  assert.equal(changed.status, 200, JSON.stringify(changed.json));
  assert.equal((await call("GET", "/api/ellma/goals", changed.json.data.token)).status, 200);
  assert.equal((await call("GET", "/api/ellma/goals", first)).status, 401);
  assert.equal((await call("GET", "/api/ellma/goals", second)).status, 401);
  assert.equal((await login(email, PASSWORD)).status, 401);
  assert.equal((await login(email, next)).json.data.status, "ok");
});

test("two-factor sign-in: setup, codes, backup codes and switching off", async () => {
  const email = await register("gina");
  const plain = (await login(email, PASSWORD)).json.data.token;

  assert.equal(
    (await call("POST", "/api/ellma/account/two-factor/setup", plain, { password: "Wrong!#12" }))
      .status,
    403,
  );
  const setup = await call("POST", "/api/ellma/account/two-factor/setup", plain, {
    password: PASSWORD,
  });
  assert.equal(setup.status, 200, JSON.stringify(setup.json));
  const { secret } = setup.json.data;
  assert.match(setup.json.data.qrCode, /^data:image\/png;base64,/);
  assert.ok(setup.json.data.otpauthUrl.includes(secret));

  // Not active until the authenticator proves itself.
  assert.equal((await login(email, PASSWORD)).json.data.status, "ok");
  const badCode = await call("POST", "/api/ellma/account/two-factor/enable", plain, {
    code: "000000",
  });
  assert.equal(badCode.json.error, "invalid_code");

  const counter = currentCounter();
  const enabled = await call("POST", "/api/ellma/account/two-factor/enable", plain, {
    code: codeAt(secret, counter),
  });
  assert.equal(enabled.status, 200, JSON.stringify(enabled.json));
  const { token, backupCodes } = enabled.json.data;
  assert.equal(backupCodes.length, 8);
  const info = await call("GET", "/api/ellma/account", token);
  assert.deepEqual([info.json.data.twoFactor, info.json.data.backupCodesLeft], [true, 8]);

  // The token from before the switch no longer opens the account; neither does a password
  // login through Yappio's own endpoint.
  assert.equal((await call("GET", "/api/ellma/goals", plain)).status, 401);
  const raw = await call("POST", "/authenticate", undefined, { email, password: PASSWORD });
  const rawToken = raw.json?.data?.token ?? raw.json?.token;
  if (rawToken) {
    assert.equal((await call("GET", "/api/ellma/goals", rawToken)).status, 401);
    assert.equal((await call("POST", "/otp/verify", rawToken, { otp: "123456" })).status, 404);
  }

  assert.equal((await login(email, PASSWORD)).json.data.status, "code_required");
  assert.equal((await login(email, PASSWORD, "000000")).json.error, "invalid_code");
  // The step used to switch on cannot be replayed.
  assert.equal((await login(email, PASSWORD, codeAt(secret, counter))).status, 401);
  const withCode = await login(email, PASSWORD, codeAt(secret, counter + 1));
  assert.equal(withCode.json.data?.status, "ok", JSON.stringify(withCode.json));
  assert.equal((await call("GET", "/api/ellma/goals", withCode.json.data.token)).status, 200);

  // A backup code works exactly once, in the format it was shown.
  const withBackup = await login(email, PASSWORD, backupCodes[0].toLowerCase());
  assert.equal(withBackup.json.data?.status, "ok", JSON.stringify(withBackup.json));
  assert.equal((await login(email, PASSWORD, backupCodes[0])).status, 401);

  const stored = await (
    await securityRecords()
  ).findOne({
    ownerId: info.json.data.id,
  });
  assert.ok(stored?.totpSecret && !JSON.stringify(stored).includes(secret));
  assert.ok(!JSON.stringify(stored).includes(backupCodes[1].replace("-", "")));

  const off = await call("POST", "/api/ellma/account/two-factor/disable", token, {
    password: PASSWORD,
    code: backupCodes[1],
  });
  assert.equal(off.status, 200, JSON.stringify(off.json));
  assert.equal((await login(email, PASSWORD)).json.data.status, "ok");
});

test("password recovery: silent requests and one-time reset links", async () => {
  const email = await register("hana");
  const options = await call("GET", "/api/ellma/account/options");
  assert.deepEqual(options.json.data, { recoveryByEmail: false });
  // Known and unknown addresses get the same answer.
  for (const address of [email, "nobody@example.test"]) {
    const requested = await call("POST", "/api/ellma/account/recovery", undefined, {
      email: address,
      locale: "de",
    });
    assert.deepEqual(requested.json, { success: true, data: { ok: true } });
  }

  const session = (await login(email, PASSWORD)).json.data.token;
  const ownerId = (await call("GET", "/api/ellma/account", session)).json.data.id;
  const records = await securityRecords();
  const issue = async (expiresAt: Date) => {
    const token = newToken();
    await records.updateOne(
      { ownerId },
      {
        $set: {
          recoveryTokenHash: fingerprint(token),
          recoveryExpiresAt: expiresAt,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return token;
  };
  const reset = (token: string, password: string) =>
    call("POST", "/api/ellma/account/recovery/reset", undefined, { token, password });
  const next = "Recovered!#Pass3";

  assert.equal((await reset(newToken(), next)).json.error, "invalid_token");
  const expired = await issue(new Date(Date.now() - 1000));
  assert.equal((await reset(expired, next)).json.error, "invalid_token");
  const valid = await issue(new Date(Date.now() + 60_000));
  assert.equal((await reset(valid, "tooweak1")).json.error, "weak_password");
  await nextSecond();
  assert.equal((await reset(valid, next)).status, 200);
  assert.equal((await reset(valid, "Another!#Pass4")).json.error, "invalid_token");
  assert.equal((await call("GET", "/api/ellma/goals", session)).status, 401);
  assert.equal((await login(email, PASSWORD)).status, 401);
  assert.equal((await login(email, next)).json.data.status, "ok");
});

test("admin panel: totals, account management and deletion", async () => {
  const email = await register("ivan");
  const user = (await login(email, PASSWORD)).json.data.token;
  const userId = (await call("GET", "/api/ellma/account", user)).json.data.id;
  await call("POST", "/api/ellma/goals", user, { title: "Private goal title" });
  await call("POST", "/api/ellma/tasks", user, { title: "Private step" });

  // Yappio creates the first administrator with the sign-in name "admin".
  const adminLogin = await login("admin", ADMIN_PASSWORD);
  assert.equal(adminLogin.json.data?.status, "ok", JSON.stringify(adminLogin.json));
  const admin = adminLogin.json.data.token;
  const adminId = (await call("GET", "/api/ellma/account", admin)).json.data.id;

  assert.equal((await call("GET", "/api/ellma/admin/overview", user)).status, 401);
  assert.equal((await call("GET", "/api/ellma/admin/users", user)).status, 401);
  assert.equal((await call("DELETE", `/api/ellma/admin/users/${adminId}`, user)).status, 401);

  const overview = await call("GET", "/api/ellma/admin/overview", admin);
  assert.equal(overview.status, 200, JSON.stringify(overview.json));
  assert.ok(overview.json.data.users >= 2 && overview.json.data.goals >= 1);
  assert.equal(overview.json.data.system.mailConfigured, false);

  const users = await call("GET", "/api/ellma/admin/users", admin);
  const row = users.json.data.find((entry: any) => entry.id === userId);
  assert.deepEqual(
    [row.email, row.role, row.goals, row.tasks, row.manageable],
    [email, "user", 1, 1, true],
  );
  assert.ok(row.lastActiveAt);
  // Totals only: nothing a person wrote reaches the panel.
  assert.ok(!JSON.stringify(users.json).includes("Private"));
  assert.ok(!JSON.stringify(users.json).toLowerCase().includes("password"));
  assert.equal(users.json.data.find((entry: any) => entry.id === adminId).manageable, false);

  // Secrets stay out of Yappio's generic API, even for admins.
  assert.equal((await call("GET", "/collection/EllmaAccountSecurity", admin)).status, 404);
  assert.equal((await call("DELETE", `/api/ellma/admin/users/${adminId}`, admin)).status, 403);
  assert.equal(
    (await call("POST", `/api/ellma/admin/users/${userId}/recovery`, admin, {})).json.error,
    "mail_unavailable",
  );

  const promoted = await call("PATCH", `/api/ellma/admin/users/${userId}`, admin, {
    role: "admin",
  });
  assert.equal(promoted.json.data?.role, "admin", JSON.stringify(promoted.json));
  // One admin cannot change another; only root can.
  assert.equal(promoted.json.data.manageable, false);
  assert.equal(
    (await call("PATCH", `/api/ellma/admin/users/${userId}`, admin, { role: "user" })).status,
    403,
  );
  assert.equal(
    (await call("PATCH", `/api/ellma/admin/users/${userId}`, admin, { role: "root" })).status,
    400,
  );

  const second = await register("jo");
  const victim = (await login(second, PASSWORD)).json.data.token;
  const victimId = (await call("GET", "/api/ellma/account", victim)).json.data.id;
  await call("POST", "/api/ellma/goals", victim, { title: "Soon gone" });
  const setup = await call("POST", "/api/ellma/account/two-factor/setup", victim, {
    password: PASSWORD,
  });
  const secured = await call("POST", "/api/ellma/account/two-factor/enable", victim, {
    code: codeAt(setup.json.data.secret, currentCounter()),
  });
  assert.equal((await login(second, PASSWORD)).json.data.status, "code_required");
  const cleared = await call(
    "POST",
    `/api/ellma/admin/users/${victimId}/reset-two-factor`,
    admin,
    {},
  );
  assert.equal(cleared.json.data?.twoFactor, false, JSON.stringify(cleared.json));
  assert.equal((await login(second, PASSWORD)).json.data.status, "ok");

  const removed = await call("DELETE", `/api/ellma/admin/users/${victimId}`, admin);
  assert.equal(removed.status, 200, JSON.stringify(removed.json));
  assert.equal((await call("GET", "/api/ellma/goals", secured.json.data.token)).status, 401);
  assert.equal((await login(second, PASSWORD)).status, 401);
  const leftovers = await Promise.all(
    (await database.db!.listCollections().toArray())
      .filter((entry) => /^ellma/i.test(entry.name))
      .map((entry) => database.db!.collection(entry.name).countDocuments({ ownerId: victimId })),
  );
  assert.deepEqual(
    leftovers.filter((count) => count > 0),
    [],
  );
});

test(
  "assistant streams a reply and acts through tools",
  { skip: !process.env.ASSISTANT_TEST, timeout: 240_000 },
  async () => {
    const token = await account("dora");
    await call("POST", "/api/ellma/goals", token, {
      title: "Run a half marathon",
      weeklyTargetMinutes: 180,
    });
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    const started = Date.now();
    const response = await fetch(`${base}/api/ellma/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: "Please add the task 'Run 5k' to my half marathon goal for tomorrow.",
        locale: "en",
        today,
        utcOffsetMinutes: now.getTimezoneOffset(),
      }),
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
    const raw = await response.text();
    const events = raw
      .split("\n\n")
      .filter((block) => block.startsWith("data:"))
      .map((block) => JSON.parse(block.slice(5)));
    const actions = events.filter((event) => event.type === "action");
    const done = events.find((event) => event.type === "done");
    console.log(
      `assistant: ${((Date.now() - started) / 1000).toFixed(1)}s, ${events.length} events`,
    );
    console.log(`assistant reply: ${done?.message.content}`);
    console.log(`assistant actions: ${JSON.stringify(actions.map((event) => event.action))}`);
    assert.ok(done, raw.slice(0, 500));
    assert.ok(actions.some((event) => event.action.kind === "task_added"));
    const tasks = await call("GET", `/api/ellma/tasks?from=${today}&to=${tomorrowKey}`, token);
    const created = tasks.json.data.find((task: any) => /5k/i.test(task.title));
    assert.ok(created, JSON.stringify(tasks.json.data));
    assert.equal(created.plannedOn, tomorrowKey);
    assert.ok(created.goalId);
    const history = await call("GET", "/api/ellma/assistant/messages", token);
    assert.equal(history.json.data.length, 2);

    const daily = await call("POST", "/api/ellma/assistant/daily", token, {
      locale: "de",
      today,
      utcOffsetMinutes: now.getTimezoneOffset(),
    });
    console.log(`daily note (de): ${daily.json.data?.text}`);
    assert.equal(daily.status, 200);
    assert.ok(daily.json.data.text.length > 10);
  },
);
