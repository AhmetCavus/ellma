import { addDays, dateKeySchema, weekdayIndex } from "@ellma/shared";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function weekdayName(key: string): string {
  return WEEKDAYS[weekdayIndex(key)] ?? "";
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ß ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type MatchResult<T> = { match: T } | { match: null; candidates: T[] };

/** Finds the record a person most likely means by a spoken or typed name. */
export function bestMatch<T>(
  query: string,
  items: T[],
  label: (item: T) => string,
): MatchResult<T> {
  const wanted = normalize(query);
  if (!wanted) {
    return { match: null, candidates: items.slice(0, 5) };
  }
  const wantedTokens = new Set(wanted.split(" "));
  const scored = items
    .map((item) => {
      const name = normalize(label(item));
      let score = 0;
      if (name === wanted) {
        score = 100;
      } else if (name.includes(wanted) || wanted.includes(name)) {
        score = 60;
      } else {
        const tokens = name.split(" ");
        const shared = tokens.filter((token) => wantedTokens.has(token) && token.length > 2).length;
        score = (shared / Math.max(tokens.length, wantedTokens.size)) * 50;
      }
      return { item, score };
    })
    .filter((entry) => entry.score >= 20)
    .sort((left, right) => right.score - left.score);
  const [first, second] = scored;
  if (first && (!second || first.score - second.score >= 15 || first.score === 100)) {
    return { match: first.item };
  }
  return { match: null, candidates: scored.slice(0, 5).map((entry) => entry.item) };
}

const RELATIVE_DAYS: Record<string, number> = {
  today: 0,
  heute: 0,
  tonight: 0,
  tomorrow: 1,
  morgen: 1,
  "day after tomorrow": 2,
  ubermorgen: 2,
  übermorgen: 2,
};

const GERMAN_WEEKDAYS: Record<string, string> = {
  montag: "monday",
  dienstag: "tuesday",
  mittwoch: "wednesday",
  donnerstag: "thursday",
  freitag: "friday",
  samstag: "saturday",
  sonntag: "sunday",
};

/** Resolves "tomorrow", "Freitag" or "2026-11-20" against the user's own today. Null = unplanned. */
export function resolveDate(input: unknown, today: string): string | null | undefined {
  if (input === undefined || input === null || input === "") {
    return undefined;
  }
  const raw = String(input).trim();
  if (dateKeySchema.safeParse(raw).success) {
    return raw;
  }
  const value = normalize(raw).replace(/^(on|next|am|nachsten|naechsten) /, "");
  if (["someday", "later", "irgendwann", "unplanned", "none"].includes(value)) {
    return null;
  }
  const relative = RELATIVE_DAYS[value];
  if (relative !== undefined) {
    return addDays(today, relative);
  }
  const weekday = GERMAN_WEEKDAYS[value] ?? value;
  for (let offset = 0; offset < 7; offset++) {
    const candidate = addDays(today, offset);
    if (weekdayName(candidate).toLowerCase() === weekday) {
      return candidate;
    }
  }
  return undefined;
}

const MONTHS: Record<string, number> = {
  january: 1,
  januar: 1,
  jan: 1,
  jänner: 1,
  february: 2,
  februar: 2,
  feb: 2,
  march: 3,
  marz: 3,
  maerz: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  mai: 5,
  june: 6,
  juni: 6,
  jun: 6,
  july: 7,
  juli: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oktober: 10,
  oct: 10,
  okt: 10,
  november: 11,
  nov: 11,
  december: 12,
  dezember: 12,
  dec: 12,
  dez: 12,
};

function lastDayOfMonth(year: number, month: number): string {
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 2026-04-30 → 2027-04-30; Feb 29 falls back to the last day of February. */
function sameDayNextYear(key: string): string {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number);
  const candidate = `${year + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const monthEnd = lastDayOfMonth(year + 1, month);
  return candidate > monthEnd ? monthEnd : candidate;
}

/**
 * Goal deadlines are always in the future. Small models often guess the wrong year
 * ("April" → last April), so past dates roll forward to their next occurrence.
 */
export function resolveDeadline(input: unknown, today: string): string | null {
  if (typeof input !== "string" || !input.trim()) {
    return null;
  }
  let resolved = resolveDate(input, today) ?? null;
  if (!resolved) {
    const words = normalize(input).split(" ");
    const month = words.map((word) => MONTHS[word]).find((value) => value !== undefined);
    if (month === undefined) {
      return null;
    }
    const year = Number(words.find((word) => /^20\d\d$/.test(word)) ?? today.slice(0, 4));
    resolved = lastDayOfMonth(year, month);
  }
  while (resolved < today) {
    resolved = sameDayNextYear(resolved);
  }
  return resolved;
}
