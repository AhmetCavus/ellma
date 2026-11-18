import { z } from "zod";

export type OllamaToolCall = { function: { name: string; arguments: Record<string, unknown> } };

export type OllamaMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: OllamaToolCall[] }
  | { role: "tool"; content: string; tool_name: string };

export type OllamaTool = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

const chunkSchema = z.object({
  message: z
    .object({
      content: z.string().optional(),
      tool_calls: z
        .array(
          z.object({
            function: z.object({
              name: z.string(),
              arguments: z.union([z.record(z.unknown()), z.string()]),
            }),
          }),
        )
        .optional(),
    })
    .optional(),
  done: z.boolean().optional(),
  error: z.string().optional(),
});

export class AssistantUnavailable extends Error {
  constructor(reason: string) {
    super(`assistant_unavailable: ${reason}`);
  }
}

export function ollamaSettings() {
  return {
    url: (process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, ""),
    model: process.env.OLLAMA_MODEL ?? "qwen3.5:4b",
  };
}

function parseArguments(value: Record<string, unknown> | string): Record<string, unknown> {
  if (typeof value !== "string") {
    return value;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Streams one chat turn from a local open-weight model served by Ollama.
 * Yields text deltas as they arrive and returns any tool calls the model requested.
 */
export async function* streamChat(
  messages: OllamaMessage[],
  tools: OllamaTool[],
  signal: AbortSignal,
): AsyncGenerator<string, OllamaToolCall[]> {
  const { url, model } = ollamaSettings();
  let response: Response;
  try {
    response = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        stream: true,
        think: false,
        keep_alive: process.env.OLLAMA_KEEP_ALIVE ?? "30m",
        options: { temperature: 0.6, num_ctx: 6144 },
      }),
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    throw new AssistantUnavailable("unreachable");
  }
  if (!response.ok || !response.body) {
    throw new AssistantUnavailable(`status_${response.status}`);
  }
  const toolCalls: OllamaToolCall[] = [];
  const decoder = new TextDecoder();
  let buffer = "";
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const chunk = chunkSchema.safeParse(JSON.parse(line));
      if (!chunk.success) {
        continue;
      }
      if (chunk.data.error) {
        throw new AssistantUnavailable("model_error");
      }
      const content = chunk.data.message?.content;
      if (content) {
        yield content;
      }
      for (const call of chunk.data.message?.tool_calls ?? []) {
        toolCalls.push({
          function: {
            name: call.function.name,
            arguments: parseArguments(call.function.arguments),
          },
        });
      }
    }
  }
  return toolCalls;
}

/** Non-streaming convenience for short generations such as the daily note. */
export async function completeChat(
  messages: OllamaMessage[],
  signal: AbortSignal,
): Promise<string> {
  const stream = streamChat(messages, [], signal);
  let text = "";
  for (;;) {
    const next = await stream.next();
    if (next.done) {
      return text;
    }
    text += next.value;
  }
}
