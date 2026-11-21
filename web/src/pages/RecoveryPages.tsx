import { useEffect, useState, type ReactNode } from "react";
import { passwordProblems, toApiError, type Copy } from "@ellma/shared";
import { AppleMark } from "../components/AppleMark";
import { SiteFooter } from "../components/SiteFooter";
import { usePreferences } from "../lib/preferences";
import { linkHandler, navigate } from "../lib/router";
import type { Session } from "../lib/session";

function RecoveryFrame({ title, children }: { title: string; children: ReactNode }) {
  const { copy } = usePreferences();
  return (
    <main className="auth">
      <a className="brand" href="/" onClick={linkHandler("/")}>
        <AppleMark size={34} />
        <span>ellma</span>
      </a>
      <section className="auth-card">
        <h1>{title}</h1>
        {children}
        <a className="link-button" href="/login" onClick={linkHandler("/login")}>
          {copy.auth.backToLogin}
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}

function failureText(copy: Copy, failure: unknown, fallback: string): string {
  const error = toApiError(failure);
  if (error.isNetwork) {
    return copy.common.error;
  }
  return error.code === "too_many_attempts" ? copy.auth.tooMany : fallback;
}

/** Asks for the address and always answers the same, whether or not an account exists. */
export function ForgotPasswordPage({ session }: { session: Session }) {
  const { copy, locale } = usePreferences();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [available, setAvailable] = useState(true);
  const { api } = session;

  useEffect(() => {
    let current = true;
    void api
      .accountOptions()
      .then((options) => current && setAvailable(options.recoveryByEmail))
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [api]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api.requestRecovery({ email: email.trim(), locale });
      setSent(true);
    } catch (failure) {
      setError(failureText(copy, failure, copy.common.error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <RecoveryFrame title={copy.auth.forgotTitle}>
      {!available ? (
        <p className="alert" role="note">
          {copy.auth.forgotUnavailable}
        </p>
      ) : sent ? (
        <p className="alert" role="status">
          {copy.auth.forgotSent}
        </p>
      ) : (
        <>
          <p className="muted">{copy.auth.forgotLead}</p>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label>
              {copy.auth.email}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </label>
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            <button className="button large" disabled={busy}>
              {busy ? copy.common.working : copy.auth.forgotSend}
            </button>
          </form>
        </>
      )}
    </RecoveryFrame>
  );
}

/** Opened from the emailed link; the one-time token arrives in the URL fragment. */
export function ResetPasswordPage({ session }: { session: Session }) {
  const { copy } = usePreferences();
  const [token] = useState(() => location.hash.slice(1));
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { api, signOut } = session;

  useEffect(() => {
    // Keep the token out of the address bar and the browser history.
    history.replaceState(null, "", location.pathname);
  }, []);

  async function submit() {
    const problem = passwordProblems(password)[0];
    if (problem) {
      setError(problem === "length" ? copy.auth.passwordLength : copy.auth.passwordSpecial);
      return;
    }
    if (password !== repeat) {
      setError(copy.auth.passwordMismatch);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.resetPassword({ token, password });
      signOut(copy.auth.resetDone);
      navigate("/login", { replace: true });
    } catch (failure) {
      setError(failureText(copy, failure, copy.auth.resetInvalid));
    } finally {
      setBusy(false);
    }
  }

  const usable = /^[A-Za-z0-9_-]{43}$/.test(token);

  return (
    <RecoveryFrame title={copy.auth.resetTitle}>
      {!usable ? (
        <>
          <p className="alert error" role="alert">
            {copy.auth.resetInvalid}
          </p>
          <a
            className="button ghost"
            href="/forgot-password"
            onClick={linkHandler("/forgot-password")}
          >
            {copy.auth.forgotTitle}
          </a>
        </>
      ) : (
        <>
          <p className="muted">{copy.auth.resetLead}</p>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label>
              {copy.auth.newPassword}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                maxLength={72}
                autoFocus
              />
              <small className="muted">{copy.auth.passwordHint}</small>
            </label>
            <label>
              {copy.auth.repeatPassword}
              <input
                type="password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                autoComplete="new-password"
                required
                maxLength={72}
              />
            </label>
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            <button className="button large" disabled={busy}>
              {busy ? copy.common.working : copy.auth.resetSave}
            </button>
          </form>
        </>
      )}
    </RecoveryFrame>
  );
}
