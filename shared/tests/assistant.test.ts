import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEventStream, takeSentences } from "../src/assistant.ts";

test("parses server-sent events across chunk boundaries", () => {
  const first = parseEventStream('data: {"type":"token","text":"Hel"}\n\ndata: {"type":"tok');
  assert.deepEqual(first.events, [{ type: "token", text: "Hel" }]);
  const second = parseEventStream(`${first.rest}en","text":"lo"}\n\n`);
  assert.deepEqual(second.events, [{ type: "token", text: "lo" }]);
  assert.equal(second.rest, "");
});

test("splits streamed text into speakable sentences", () => {
  const { sentences, rest } = takeSentences("Great job today! You focused 2.5 hours. Next");
  assert.deepEqual(sentences, ["Great job today!", "You focused 2.5 hours."]);
  assert.equal(rest, "Next");
});
