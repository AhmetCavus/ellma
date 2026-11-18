import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  passwordProblems,
  toApiError,
  type AccountInfo,
  type Copy,
  type TwoFactorSetup,
} from "@ellma/shared";
import { Icon } from "../components/Icon";
import { usePreferences } from "../lib/preferences";
import type { Session } from "../lib/session";
import { useStore } from "../lib/store";

/** Turns an API failure into one sentence; an expired session signs out instead. */
function useFailure(session: Session) {
  const { copy } = usePreferences();
  const { signOut } = session;
  return useCallback(
    (failure: unknown): string => {
      const error = toApiError(failure);
      if (error.isUnauthorized) {
        signOut(copy.common.sessionExpired);
        return "";
      }
      const known: Record<string, string> = {
        invalid_password: copy.account.wrongPassword,
        invalid_code: copy.auth.codeFailed,
        too_many_attempts: copy.auth.tooMany,
        weak_password: copy.auth.passwordSpecial,
      };
      return known[error.code] ?? copy.common.error;
    },
    [copy, signOut],
  );
}

function passwordProblem(copy: Copy, password: string, repeat: string): string {
  const problem = passwordProblems(password)[0];
  if (problem) {
    return problem === "length" ? copy.auth.passwordLength : copy.auth.passwordSpecial;
  }
  return password === repeat ? "" : copy.auth.passwordMismatch;
}

function SecretForm({
  onSubmit,
  error,
  busy,
  submitLabel,
  onCancel,
  children,
}: {
  onSubmit: () => Promise<void>;
  error: string;
  busy: boolean;
  submitLabel: string;
  onCancel?: () => void;
  children: ReactNode;
}) {
  const { copy } = usePreferences();
  return (
    <form
      className="form"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void onSubmit();
      }}
    >
      {children}
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="button ghost" onClick={onCancel} disabled={busy}>
            {copy.common.cancel}
          </button>
        )}
        <button className="button" disabled={busy}>
          {busy ? copy.common.working : submitLabel}
        </button>
      </div>
    </form>
  );
}

function PasswordCard({ session }: { session: Session }) {
  const { copy } = usePreferences();
  const { notify } = useStore();
  const failureText = useFailure(session);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    const problem = passwordProblem(copy, next, repeat);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { token } = await session.api.changePassword({
        currentPassword: current,
        newPassword: next,
      });
      await session.adoptToken(token);
      setCurrent("");
      setNext("");
      setRepeat("");
      notify(copy.account.passwordChanged);
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>{copy.account.passwordTitle}</h2>
      <p className="muted card-lead">{copy.account.passwordLead}</p>
      <SecretForm
        onSubmit={submit}
        error={error}
        busy={busy}
        submitLabel={copy.account.changePassword}
      >
        <label>
          {copy.account.currentPassword}
          <input
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            required
            maxLength={72}
          />
        </label>
        <div className="form-row">
          <label>
            {copy.auth.newPassword}
            <input
              type="password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              autoComplete="new-password"
              required
              maxLength={72}
            />
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
        </div>
        <small className="muted">{copy.auth.passwordHint}</small>
      </SecretForm>
    </section>
  );
}

type TwoFactorStep =
  | { name: "idle" }
  | { name: "password" }
  | { name: "scan"; setup: TwoFactorSetup }
  | { name: "backup"; codes: string[] }
  | { name: "disable" };

function CodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      className="code-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      autoComplete="one-time-code"
      autoCapitalize="characters"
      spellCheck={false}
      required
      maxLength={20}
    />
  );
}

function TwoFactorCard({
  session,
  account,
  onChanged,
}: {
  session: Session;
  account: AccountInfo;
  onChanged: () => void;
}) {
  const { copy } = usePreferences();
  const { notify } = useStore();
  const failureText = useFailure(session);
  const [step, setStep] = useState<TwoFactorStep>({ name: "idle" });
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function go(next: TwoFactorStep) {
    setStep(next);
    setPassword("");
    setCode("");
    setError("");
    setCopied(false);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusy(false);
    }
  }

  const startSetup = () =>
    run(async () => go({ name: "scan", setup: await session.api.setupTwoFactor(password) }));

  const confirmSetup = () =>
    run(async () => {
      const result = await session.api.enableTwoFactor(code);
      await session.adoptToken(result.token);
      go({ name: "backup", codes: result.backupCodes });
      onChanged();
    });

  const switchOff = () =>
    run(async () => {
      const { token } = await session.api.disableTwoFactor({ password, code });
      await session.adoptToken(token);
      go({ name: "idle" });
      notify(copy.account.disabled);
      onChanged();
    });

  const passwordField = (
    <label>
      {copy.auth.password}
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        autoComplete="current-password"
        required
        maxLength={72}
        autoFocus
      />
    </label>
  );

  return (
    <section className="card">
      <div className="section-header">
        <h2>{copy.account.twoFactorTitle}</h2>
        <span className={`state ${account.twoFactor ? "state-ripe" : ""}`}>
          {account.twoFactor ? copy.account.statusOn : copy.account.statusOff}
        </span>
      </div>
      <p className="muted card-lead">{copy.account.twoFactorLead}</p>

      {step.name === "idle" && !account.twoFactor && (
        <button type="button" className="button" onClick={() => go({ name: "password" })}>
          <Icon name="shield" size={18} /> {copy.account.enable}
        </button>
      )}

      {step.name === "idle" && account.twoFactor && (
        <div className="button-row">
          <span className="muted">{copy.account.backupLeft(account.backupCodesLeft)}</span>
          <button
            type="button"
            className="button ghost small"
            onClick={() => go({ name: "disable" })}
          >
            {copy.account.disable}
          </button>
        </div>
      )}

      {step.name === "password" && (
        <SecretForm
          onSubmit={startSetup}
          error={error}
          busy={busy}
          submitLabel={copy.account.next}
          onCancel={() => go({ name: "idle" })}
        >
          <p>{copy.account.confirmPassword}</p>
          {passwordField}
        </SecretForm>
      )}

      {step.name === "scan" && (
        <SecretForm
          onSubmit={confirmSetup}
          error={error}
          busy={busy}
          submitLabel={copy.account.activate}
          onCancel={() => go({ name: "idle" })}
        >
          <div className="two-factor-scan">
            <img src={step.setup.qrCode} width={200} height={200} alt={copy.account.qrLabel} />
            <div>
              <h3>{copy.account.scanTitle}</h3>
              <p className="muted">{copy.account.scanLead}</p>
              <p className="secret-key">
                <span className="muted">{copy.account.manualKey}</span>
                <code>{step.setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
              </p>
            </div>
          </div>
          <label>
            {copy.account.enterCode}
            <CodeInput value={code} onChange={setCode} />
          </label>
        </SecretForm>
      )}

      {step.name === "backup" && (
        <div className="backup-codes">
          <p className="alert" role="status">
            {copy.account.enabled}
          </p>
          <h3>{copy.account.backupTitle}</h3>
          <p className="muted">{copy.account.backupLead}</p>
          <ul>
            {step.codes.map((backupCode) => (
              <li key={backupCode}>
                <code>{backupCode}</code>
              </li>
            ))}
          </ul>
          <div className="button-row">
            <button
              type="button"
              className="button ghost"
              onClick={() =>
                void navigator.clipboard
                  ?.writeText(step.codes.join("\n"))
                  .then(() => setCopied(true))
                  .catch(() => undefined)
              }
            >
              {copied ? copy.account.backupCopied : copy.account.backupCopy}
            </button>
            <button type="button" className="button" onClick={() => go({ name: "idle" })}>
              {copy.account.backupDone}
            </button>
          </div>
        </div>
      )}

      {step.name === "disable" && (
        <SecretForm
          onSubmit={switchOff}
          error={error}
          busy={busy}
          submitLabel={copy.account.disable}
          onCancel={() => go({ name: "idle" })}
        >
          <p>{copy.account.disableLead}</p>
          {passwordField}
          <label>
            {copy.auth.code}
            <CodeInput value={code} onChange={setCode} />
          </label>
        </SecretForm>
      )}
    </section>
  );
}

/** Account management: who you are signed in as, your password and two-factor sign-in. */
export function AccountPage({ session }: { session: Session }) {
  const { copy } = usePreferences();
  const failureText = useFailure(session);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState("");
  const { api } = session;

  const load = useCallback(() => {
    void api
      .account()
      .then((next) => {
        setAccount(next);
        setError("");
      })
      .catch((failure: unknown) => setError(failureText(failure)));
  }, [api, failureText]);

  useEffect(load, [load]);

  return (
    <div className="page page-narrow">
      <header className="page-header">
        <div>
          <h1>{copy.account.title}</h1>
          <p className="page-lead">{copy.account.lead}</p>
        </div>
      </header>
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {!account && !error && <p className="muted">{copy.common.loading}</p>}
      {account && (
        <div className="account-sections">
          <section className="card">
            <h2>{copy.account.profileTitle}</h2>
            <dl className="account-facts">
              <div>
                <dt>{copy.account.name}</dt>
                <dd>{account.name}</dd>
              </div>
              <div>
                <dt>{copy.auth.email}</dt>
                <dd>{account.email}</dd>
              </div>
              {account.role !== "user" && (
                <div>
                  <dt>{copy.account.role}</dt>
                  <dd>{copy.account.roles[account.role]}</dd>
                </div>
              )}
            </dl>
            <div className="form-actions">
              <button
                type="button"
                className="button ghost small"
                onClick={() => session.signOut()}
              >
                <Icon name="logout" size={16} /> {copy.auth.logout}
              </button>
            </div>
          </section>
          <PasswordCard session={session} />
          <TwoFactorCard session={session} account={account} onChanged={load} />
        </div>
      )}
    </div>
  );
}
