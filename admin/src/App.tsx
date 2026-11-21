import { useCallback, useEffect, useState } from "react";
import {
  LOCALES,
  preferredLocale,
  toApiError,
  type AdminOverview,
  type AdminUser,
  type Locale,
} from "@ellma/shared";
import { Login } from "./Login";
import { Overview } from "./Overview";
import { useAdminSession, type AdminSession } from "./session";
import { Users } from "./Users";

type Tab = "overview" | "users";
const TABS: Tab[] = ["overview", "users"];

function Dashboard({
  session,
  locale,
  onLocale,
}: {
  session: AdminSession;
  locale: Locale;
  onLocale: (locale: Locale) => void;
}) {
  const copy = LOCALES[locale];
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { api, signOut } = session;

  /** One sentence per failure; an expired or demoted session returns to the login. */
  const failureText = useCallback(
    (failure: unknown): string => {
      const apiError = toApiError(failure);
      if (apiError.isUnauthorized) {
        signOut(copy.common.sessionExpired);
        return "";
      }
      const known: Record<string, string> = {
        not_allowed: copy.admin.users.notAllowed,
        mail_unavailable: copy.admin.users.mailUnavailable,
        mail_failed: copy.admin.users.mailFailed,
      };
      return known[apiError.code] ?? copy.common.error;
    },
    [copy, signOut],
  );

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [nextOverview, nextUsers] = await Promise.all([api.adminOverview(), api.adminUsers()]);
      setOverview(nextOverview);
      setUsers(nextUsers);
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusy(false);
    }
  }, [api, failureText]);

  useEffect(() => {
    void load();
    // Once per sign-in: switching the language changes `load` but must not refetch.
  }, [api]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img src="/icon.svg" width={30} height={30} alt="" />
          <div>
            ellma
            <small>{copy.admin.subtitle}</small>
          </div>
        </div>
        <div className="header-actions">
          <span className="muted signed-in-as">{session.profile?.username}</span>
          <select
            value={locale}
            onChange={(event) => onLocale(event.target.value as Locale)}
            aria-label={copy.common.language}
          >
            {(Object.keys(LOCALES) as Locale[]).map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
          <button type="button" className="button ghost small" onClick={() => signOut()}>
            {copy.auth.logout}
          </button>
        </div>
      </header>
      <main className="main">
        <div className="page-heading">
          <nav className="tabs" aria-label={copy.nav.label}>
            {TABS.map((entry) => (
              <button
                key={entry}
                type="button"
                className={tab === entry ? "active" : ""}
                aria-current={tab === entry ? "page" : undefined}
                onClick={() => setTab(entry)}
              >
                {copy.admin.tabs[entry]}
              </button>
            ))}
          </nav>
          <button
            type="button"
            className="button ghost small"
            disabled={busy}
            onClick={() => void load()}
          >
            {busy ? copy.common.loading : `${copy.admin.refresh} ↻`}
          </button>
        </div>
        <p className="muted privacy-note">{copy.admin.privacyNote}</p>
        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        {tab === "overview" && overview && <Overview overview={overview} copy={copy} />}
        {tab === "users" && users && (
          <Users
            users={users}
            copy={copy}
            locale={locale}
            api={api}
            selfId={session.profile?._id ?? ""}
            mailConfigured={overview?.system.mailConfigured ?? false}
            failureText={failureText}
            onChanged={load}
          />
        )}
        {!overview && !users && !error && <p className="muted">{copy.common.loading}</p>}
      </main>
    </div>
  );
}

export default function App() {
  // Kept in memory only: the admin panel stores nothing but the sign-in.
  const [locale, setLocale] = useState<Locale>(() =>
    preferredLocale(navigator.languages ?? [navigator.language]),
  );
  const session = useAdminSession(LOCALES[locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return session.profile ? (
    <Dashboard session={session} locale={locale} onLocale={setLocale} />
  ) : (
    <Login session={session} copy={LOCALES[locale]} />
  );
}
