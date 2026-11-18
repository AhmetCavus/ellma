/**
 * Short commands Ellma can carry out instantly in the browser, without asking the model.
 * Only very short utterances match, so a real sentence always reaches the model.
 */
export type LocalIntent =
  | { kind: "navigate"; page: "goals" | "today" | "progress" | "focus" }
  | { kind: "new_goal" }
  | { kind: "stop_focus" }
  | { kind: "complete_focus" }
  | { kind: "theme" }
  | { kind: "help" };

const FILLER = new Set(
  "please bitte ellma hey hi now jetzt mal me mir my mein meine meinen the den die das to zu zur zum go geh gehe show zeig zeige open öffne".split(
    " ",
  ),
);

const RULES: [RegExp, LocalIntent][] = [
  [/^(goals?|ziele?|übersicht|overview|home)$/, { kind: "navigate", page: "goals" }],
  [/^(today|heute|day|tag|plan|tagesplan)$/, { kind: "navigate", page: "today" }],
  [
    /^(progress|fortschritt|week|woche|stats|statistik|review|rückblick)$/,
    { kind: "navigate", page: "progress" },
  ],
  [
    /^(focus|fokus|focus mode|fokusmodus|timer|start focus|fokus starten)$/,
    { kind: "navigate", page: "focus" },
  ],
  [/^(new goal|neues ziel|add goal|add a goal|ziel anlegen)$/, { kind: "new_goal" }],
  [
    /^(stop|stopp|stop focus|stop timer|pause|fokus stoppen|fokus beenden|timer stoppen)$/,
    { kind: "stop_focus" },
  ],
  [
    /^(done|finished|i am done|i'm done|im done|complete|fertig|erledigt|geschafft|ich bin fertig)$/,
    { kind: "complete_focus" },
  ],
  [
    /^(dark|light|dark mode|light mode|dunkel|hell|dunkelmodus|theme|design wechseln)$/,
    { kind: "theme" },
  ],
  [
    /^(help|hilfe|what can you do|was kannst du|shortcuts|tastenkürzel|tastenkuerzel)$/,
    { kind: "help" },
  ],
];

export function localIntent(utterance: string): LocalIntent | null {
  const text = utterance
    .toLowerCase()
    .replace(/[.!?,;:"„“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text.split(" ").length > 6) {
    return null;
  }
  const stripped = text
    .split(" ")
    .filter((word) => !FILLER.has(word))
    .join(" ");
  for (const candidate of [text, stripped]) {
    const rule = RULES.find(([pattern]) => pattern.test(candidate));
    if (rule) {
      return rule[1];
    }
  }
  return null;
}
