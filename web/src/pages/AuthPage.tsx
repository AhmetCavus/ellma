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
  const signup = mode === "signup";

  return (
    <main className="auth">
      <a className="brand" href="/" onClick={linkHandler("/")}>
        <AppleMark size={34} />
        <span>Ellma</span>
      </a>
      <section className="auth-card">
        <h1>{signup ? copy.auth.signupTitle : copy.auth.loginTitle}</h1>
        {signup && <p className="muted">{copy.auth.signupLead}</p>}
        {session.notice && !signup && <p className="alert">{session.notice}</p>}
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            const request = signup
              ? session.signUp(name, email, password)
              : session.signIn(email, password);
            void request.then((ok) => ok && navigate("/goals", { replace: true }));
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
          {session.error && (
            <p className="alert error" role="alert">
              {session.error}
            </p>
          )}
          <button className="button large" disabled={session.busy}>
            {session.busy ? copy.common.working : signup ? copy.auth.signup : copy.auth.login}
          </button>
        </form>
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
      </section>
      <SiteFooter />
    </main>
  );
}
