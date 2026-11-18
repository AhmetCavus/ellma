import { LOCALES, type Locale } from "@ellma/shared";
import { usePreferences } from "../lib/preferences";
import { Icon } from "./Icon";

export function SettingsInline() {
  const { copy, locale, setLocale, toggleTheme } = usePreferences();
  return (
    <div className="settings-inline">
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={copy.common.language}
        className="compact-select"
      >
        {(Object.keys(LOCALES) as Locale[]).map((option) => (
          <option key={option} value={option}>
            {option.toUpperCase()}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="icon-button"
        onClick={toggleTheme}
        aria-label={copy.common.theme}
        title={copy.common.theme}
      >
        <Icon name="moon" />
      </button>
    </div>
  );
}
