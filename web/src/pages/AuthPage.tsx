import { SiteFooter } from "../components/SiteFooter";
import { useState } from "react";
import { AppleMark } from "../components/AppleMark";
import { usePreferences } from "../lib/preferences";
import { linkHandler, navigate } from "../lib/router";
import type { Session } from "../lib/session";

export function AuthPage({ mode, session }: { mode: "login" | "signup"; session: Session }) {
  const { copy } = usePreferences();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  /** The password was accepted and the account asks for its second factor. */
  const [needsCode, setNeedsCode] = useState(false);
  const signup = mode === "signup";
  const codeStep = needsCode && !signup;

  async function submit() {
    if (signup) {
      if (await session.signUp(name, email, password)) {
        navigate("/goals", { replace: true });
      }
      return;
    }
    const result = await session.signIn(email, password, codeStep ? code : undefined);
    if (result === "ok") {
      navigate("/goals", { replace: true });
    } else if (result === "code") {
      setNeedsCode(true);
    } else {
      setCode("");
    }
  }

  function startOver() {
    setNeedsCode(false);
    setCode("");
    setPassword("");
    session.setError("");
  }

  return (
    <main className="auth">
      <a className="brand" href="/" onClick={linkHandler("/")}>
        <AppleMark size={34} />
        <span>Ellma</span>
      </a>
      <section className="auth-card">
        <h1>
          {signup ? copy.auth.signupTitle : codeStep ? copy.auth.codeTitle : copy.auth.loginTitle}
        </h1>
        {signup && <p className="muted">{copy.auth.signupLead}</p>}
        {codeStep && <p className="muted">{copy.auth.codeLead}</p>}
        {session.notice && !signup && !codeStep && <p className="alert">{session.notice}</p>}
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {signup && (
            <label>
              {copy.auth.username}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="given-name"
                required
                maxLength={60}
                autoFocus
              />
            </label>
          )}
          {codeStep ? (
            <label>
              {copy.auth.code}
              <input
                key="code"
                className="code-input"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="text"
                autoComplete="one-time-code"
                autoCapitalize="characters"
                spellCheck={false}
                required
                maxLength={20}
                autoFocus
              />
            </label>
          ) : (
            <>
              <label>
                {copy.auth.email}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  autoFocus={!signup}
                />
              </label>
              <label>
                {copy.auth.password}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={signup ? "new-password" : "current-password"}
                  required
                  maxLength={72}
                />
                {signup && <small className="muted">{copy.auth.passwordHint}</small>}
              </label>
            </>
          )}
          {session.error && (
            <p className="alert error" role="alert">
              {session.error}
            </p>
          )}
          <button className="button large" disabled={session.busy}>
            {session.busy ? copy.common.working : signup ? copy.auth.signup : copy.auth.login}
          </button>
        </form>
        {codeStep ? (
          <button type="button" className="link-button" onClick={startOver}>
            {copy.auth.backToLogin}
          </button>
        ) : (
          <>
            {!signup && (
              <a
                className="link-button"
                href="/forgot-password"
                onClick={(event) => {
                  session.setError("");
                  linkHandler("/forgot-password")(event);
                }}
              >
                {copy.auth.forgot}
              </a>
            )}
            <a
              className="link-button"
              href={signup ? "/login" : "/signup"}
              onClick={(event) => {
                session.setError("");
                linkHandler(signup ? "/login" : "/signup")(event);
              }}
            >
              {signup ? copy.auth.toLogin : copy.auth.toSignup}
            </a>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
