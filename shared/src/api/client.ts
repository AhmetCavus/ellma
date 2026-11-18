import { z } from "zod";
import type { YappioClient } from "yappio-client";
import {
  focusSessionSchema,
  focusStateSchema,
  goalSchema,
  removedSchema,
  taskSchema,
  type FocusStart,
  type ManualSession,
  type GoalInput,
  type TaskCreate,
  type TaskPatch,
} from "../contracts.js";
import {
  accountOptionsSchema,
  accountSchema,
  acknowledgedSchema,
  adminOverviewSchema,
  adminUserSchema,
  loginResultSchema,
  sessionTokenSchema,
  twoFactorEnabledSchema,
  twoFactorSetupSchema,
  type AdminRoleChange,
  type LoginRequest,
  type PasswordChange,
  type RecoveryRequest,
  type RecoveryReset,
  type TwoFactorDisable,
} from "../account.js";
import {
  assistantMessageSchema,
  dailyNoteSchema,
  parseEventStream,
  type AssistantStreamEvent,
  type ChatRequest,
  type ClientClock,
} from "../assistant.js";

// yappio-client persists the session token under this key (YappioClient ACT_STORAGE_KEY).
const YAPPIO_TOKEN_STORAGE_KEY = "act";

export const API_PREFIX = "/api/ellma";

export class EllmaApiError extends Error {
  constructor(
    public readonly status: number | null,
    public readonly code: string,
  ) {
    super(code);
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNetwork(): boolean {
    return this.status === null;
  }
}

type Schema<T> = z.ZodType<T, z.ZodTypeDef, unknown>;

/** Thin typed boundary over Yappio's REST engine; it keeps auth headers and base URL. */
export class EllmaApi {
  constructor(
    private readonly client: YappioClient,
    private readonly baseUrl: string,
  ) {}

  assistantMessages() {
    return this.call("get", "/assistant/messages", z.array(assistantMessageSchema));
  }

  clearAssistantMessages() {
    return this.call("delete", "/assistant/messages", z.object({ cleared: z.number() }));
  }

  dailyNote(clock: ClientClock) {
    return this.call("post", "/assistant/daily", dailyNoteSchema, clock);
  }

  /**
   * Streams the assistant's reply. Yappio's REST engine buffers whole responses, so this one
   * call uses fetch with the session token Yappio already stores.
   */
  async chat(
    request: ChatRequest,
    onEvent: (event: AssistantStreamEvent) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${API_PREFIX}/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: `Bearer ${localStorage.getItem(YAPPIO_TOKEN_STORAGE_KEY) ?? ""}`,
        },
        body: JSON.stringify(request),
        signal,
      });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      throw new EllmaApiError(null, "network");
    }
    if (!response.ok || !response.body) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new EllmaApiError(response.status, body?.error ?? "request_failed");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseEventStream(buffer);
      buffer = parsed.rest;
      parsed.events.forEach(onEvent);
    }
    parseEventStream(`${buffer}\n\n`).events.forEach(onEvent);
  }

  listGoals() {
    return this.call("get", "/goals", z.array(goalSchema));
  }

  createGoal(input: GoalInput) {
    return this.call("post", "/goals", goalSchema, input);
  }

  updateGoal(id: string, input: GoalInput) {
    return this.call("put", `/goals/${id}`, goalSchema, input);
  }

  reorderGoals(ids: string[]) {
    return this.call("post", "/goals/order", z.array(goalSchema), { ids });
  }

  deleteGoal(id: string) {
    return this.call("delete", `/goals/${id}`, removedSchema);
  }

  goalTotals() {
    return this.call(
      "get",
      "/goals/totals",
      z.array(z.object({ goalId: z.string(), seconds: z.number() })),
    );
  }

  listTasks(from: string, to: string) {
    return this.call("get", `/tasks?${new URLSearchParams({ from, to })}`, z.array(taskSchema));
  }

  createTask(input: TaskCreate) {
    return this.call("post", "/tasks", taskSchema, input);
  }

  updateTask(id: string, patch: TaskPatch) {
    return this.call("patch", `/tasks/${id}`, taskSchema, patch);
  }

  deleteTask(id: string) {
    return this.call("delete", `/tasks/${id}`, removedSchema);
  }

  focusState() {
    return this.call("get", "/focus", focusStateSchema);
  }

  startFocus(input: FocusStart) {
    return this.call("post", "/focus/start", focusStateSchema, input);
  }

  stopFocus(completeTask: boolean) {
    return this.call("post", "/focus/stop", focusStateSchema, { completeTask });
  }

  listSessions(from: string, to: string) {
    return this.call(
      "get",
      `/focus/sessions?${new URLSearchParams({ from, to })}`,
      z.array(focusSessionSchema),
    );
  }

  logSession(input: ManualSession) {
    return this.call("post", "/focus/sessions", focusSessionSchema, input);
  }

  deleteSession(id: string) {
    return this.call("delete", `/focus/sessions/${id}`, removedSchema);
  }

  /** Signs in with password and, when the account uses it, the second factor. */
  login(input: LoginRequest) {
    return this.call("post", "/account/login", loginResultSchema, input);
  }

  accountOptions() {
    return this.call("get", "/account/options", accountOptionsSchema);
  }

  requestRecovery(input: RecoveryRequest) {
    return this.call("post", "/account/recovery", acknowledgedSchema, input);
  }

  resetPassword(input: RecoveryReset) {
    return this.call("post", "/account/recovery/reset", acknowledgedSchema, input);
  }

  account() {
    return this.call("get", "/account", accountSchema);
  }

  changePassword(input: PasswordChange) {
    return this.call("post", "/account/password", sessionTokenSchema, input);
  }

  setupTwoFactor(password: string) {
    return this.call("post", "/account/two-factor/setup", twoFactorSetupSchema, { password });
  }

  enableTwoFactor(code: string) {
    return this.call("post", "/account/two-factor/enable", twoFactorEnabledSchema, { code });
  }

  disableTwoFactor(input: TwoFactorDisable) {
    return this.call("post", "/account/two-factor/disable", sessionTokenSchema, input);
  }

  adminOverview() {
    return this.call("get", "/admin/overview", adminOverviewSchema);
  }

  adminUsers() {
    return this.call("get", "/admin/users", z.array(adminUserSchema));
  }

  adminSetRole(id: string, input: AdminRoleChange) {
    return this.call("patch", `/admin/users/${id}`, adminUserSchema, input);
  }

  adminResetTwoFactor(id: string) {
    return this.call("post", `/admin/users/${id}/reset-two-factor`, adminUserSchema);
  }

  adminSendRecovery(id: string, locale: "en" | "de") {
    return this.call("post", `/admin/users/${id}/recovery`, acknowledgedSchema, { locale });
  }

  adminDeleteUser(id: string) {
    return this.call("delete", `/admin/users/${id}`, removedSchema);
  }

  private async call<T>(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    schema: Schema<T>,
    body?: object,
  ): Promise<T> {
    const rest = this.client.rest();
    const url = `${API_PREFIX}${path}`;
    let response: unknown;
    try {
      response =
        method === "get" || method === "delete"
          ? await rest[method](url)
          : await rest[method](url, (body ?? {}) as Record<string, unknown>);
    } catch (error) {
      throw toApiError(error);
    }
    const envelope = z.object({ success: z.literal(true), data: z.unknown() }).safeParse(response);
    if (!envelope.success) {
      throw new EllmaApiError(500, "invalid_response");
    }
    return schema.parse(envelope.data.data);
  }
}

export function toApiError(error: unknown): EllmaApiError {
  if (error instanceof EllmaApiError) {
    return error;
  }
  const parsed = z
    .object({
      response: z.object({
        status: z.number(),
        data: z.object({ error: z.string().optional() }).passthrough().optional(),
      }),
    })
    .safeParse(error);
  if (parsed.success) {
    return new EllmaApiError(
      parsed.data.response.status,
      parsed.data.response.data?.error ?? "request_failed",
    );
  }
  return new EllmaApiError(null, "network");
}
