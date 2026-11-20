import { useId } from "react";
import { isFiltering } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import type { ViewLayout } from "../lib/viewFilter";
import { Icon } from "./Icon";

type Option<Value extends string> = { value: Value; label: string };

/**
 * The filter bar that Goals and Today share: tags (from the goals), statuses and a sort.
 * Chips are toggle buttons, so the bar works with the keyboard and screen readers.
 */
export function ViewControls<Status extends string, Sort extends string>({
  tags,
  statuses,
  sorts,
  filter,
  onChange,
  onReset,
  layout,
  onLayout,
}: {
  tags: string[];
  statuses: Option<Status>[];
  sorts: Option<Sort>[];
  filter: { tags: string[]; statuses: Status[]; sort: Sort };
  onChange: (next: { tags: string[]; statuses: Status[]; sort: Sort }) => void;
  onReset: () => void;
  /** Offers the card / list switch when given. */
  layout?: ViewLayout;
  onLayout?: (next: ViewLayout) => void;
}) {
  const { copy } = usePreferences();
  const text = copy.views;
  const sortId = useId();
  const has = (list: string[], value: string) =>
    list.some((entry) => entry.toLocaleLowerCase() === value.toLocaleLowerCase());
  const toggle = <T extends string>(list: T[], value: T): T[] =>
    has(list, value)
      ? list.filter((entry) => entry.toLocaleLowerCase() !== value.toLocaleLowerCase())
      : [...list, value];
  const statusLabel = (value: Status) =>
    statuses.find((option) => option.value === value)?.label ?? value;
  const active = [...filter.tags.map((tag) => `#${tag}`), ...filter.statuses.map(statusLabel)];

  return (
    <section className="view-controls" aria-label={text.label}>
      <div className="view-controls-row">
        <div className="view-chips" role="group" aria-label={text.tags}>
          <span className="view-controls-label">{text.tags}</span>
          {tags.length === 0 ? (
            <span className="muted view-controls-hint">{text.noTags}</span>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`chip small ${has(filter.tags, tag) ? "is-on" : ""}`}
                aria-pressed={has(filter.tags, tag)}
                onClick={() => onChange({ ...filter, tags: toggle(filter.tags, tag) })}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
        <div className="view-chips" role="group" aria-label={text.status}>
          <span className="view-controls-label">{text.status}</span>
          {statuses.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`chip small ${filter.statuses.includes(option.value) ? "is-on" : ""}`}
              aria-pressed={filter.statuses.includes(option.value)}
              onClick={() =>
                onChange({ ...filter, statuses: toggle(filter.statuses, option.value) })
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="view-sort" htmlFor={sortId}>
          <span className="view-controls-label">{text.sort}</span>
          <select
            id={sortId}
            className="compact-select"
            value={filter.sort}
            onChange={(event) => onChange({ ...filter, sort: event.target.value as Sort })}
          >
            {sorts.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {layout && onLayout && (
          <div className="view-layout" role="group" aria-label={text.layout}>
            {(
              [
                ["cards", "cards", text.cards],
                ["list", "list", text.list],
              ] as const
            ).map(([value, icon, label]) => (
              <button
                key={value}
                type="button"
                className={`icon-button ${layout === value ? "is-on" : ""}`}
                aria-pressed={layout === value}
                aria-label={label}
                title={label}
                onClick={() => onLayout(value)}
              >
                <Icon name={icon} size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
      {isFiltering(filter) && (
        <p className="view-active" role="status">
          <span>{text.active(active.join(", "))}</span>
          <button type="button" className="button ghost small" onClick={onReset}>
            <Icon name="close" size={14} /> {text.reset}
          </button>
        </p>
      )}
    </section>
  );
}
