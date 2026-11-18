import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { after, before, test } from "node:test";
import { createConnection, type Connection } from "mongoose";

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
      JWT_SECRET: "integration-test-only-secret-5a1f0c2e9d7b",
      INITIAL_ADMIN_USER: "admin@example.test",
      INITIAL_ADMIN_PASS: "Admin-Test!#Only9",
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
  });
  assert.equal(goal.status, 200, JSON.stringify(goal.json));
  const goalId = goal.json.data.id;

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
