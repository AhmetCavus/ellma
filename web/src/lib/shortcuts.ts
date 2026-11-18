/** Lets Ellma open the shortcut overview that the shell owns ("help"). */
export const SHORTCUTS_EVENT = "ellma:shortcuts";

export function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element &&
    (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)),
  );
}

/** Plain single-key shortcuts must never fire while typing, with modifiers, or under a dialog. */
export function isPlainShortcut(event: KeyboardEvent): boolean {
  return !(
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    isTyping(event.target) ||
    document.querySelector("dialog[open]")
  );
}

/** Moves keyboard focus between visible task rows (J/K). */
export function moveTaskSelection(step: 1 | -1): void {
  const rows = [...document.querySelectorAll<HTMLElement>(".task .task-main")];
  if (rows.length === 0) {
    return;
  }
  const current = rows.findIndex((row) => row === document.activeElement);
  const next =
    current === -1
      ? step === 1
        ? 0
        : rows.length - 1
      : Math.min(rows.length - 1, Math.max(0, current + step));
  rows[next]?.focus();
  rows[next]?.scrollIntoView({ block: "nearest" });
}

/** Triggers an action on the focused task row (X, E, P). */
export function actOnSelectedTask(selector: ".task-check" | ".task-main" | ".task-focus"): boolean {
  const row = document.activeElement?.closest(".task");
  const target = row?.querySelector<HTMLElement>(selector);
  if (!target) {
    return false;
  }
  target.click();
  return true;
}
