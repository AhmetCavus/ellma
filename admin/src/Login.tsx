import { useState } from "react";
import type { Copy } from "@ellma/shared";
import type { AdminSession } from "./session";

export function Login({ session, copy }: { session: AdminSession; copy: Copy }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);

  async function submit() {
    const result = await session.signIn(email, password, needsCode ? code : undefined);
    if (result === "code") {
      setNeedsCode(true);
    } else if (result === "failed") {
      setCode("");
    }
  }

  return (
    <main className="access">
      <div className="brand">
        <img src="/icon.svg" width={34} height={34} alt="" />
        <div>
          Ellma
          <small>{copy.admin.subtitle}</small>
        </div>
      </div>
      <section className="access-card">
        <h1>{needsCode ? copy.auth.codeTitle : copy.admin.loginTitle}</h1>
        {needsCode && <p className="muted">{copy.auth.codeLead}</p>}
        <form
          className="form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {needsCode ? (
            <label>
              {copy.auth.code}
              <input
                key="code"
                className="code-input"
                value={code}
                onChange={(event) => setCode(event.target.value)}
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
                {/* The first administrator signs in as "admin", which is not an address. */}
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  autoFocus
                />
              </label>
              <label>
                {copy.auth.password}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  maxLength={72}
                />
              </label>
            </>
          )}
          {session.error && (
            <p className="alert error" role="alert">
              {session.error}
            </p>
          )}
          <button className="button" disabled={session.busy}>
            {session.busy ? copy.common.working : copy.auth.login}
          </button>
        </form>
        {needsCode && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setNeedsCode(false);
              setCode("");
              setPassword("");
              session.setError("");
            }}
          >
            {copy.auth.backToLogin}
          </button>
        )}
      </section>
    </main>
  );
}
