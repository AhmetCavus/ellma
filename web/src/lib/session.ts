import { useMemo, useState } from "react";
import { YappioClient, type Profile } from "yappio-client";
import { EllmaApi, passwordProblems, toApiError, type Copy } from "@ellma/shared";

export const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

function restoreProfile(client: YappioClient): Profile | null {
  try {
    client.initializeFromStorage();
    if (!client.isInitialized() || client.isTokenExpired()) {
      client.reset();
      return null;
    }
    return client.statusInfo().profile;
  } catch {
    client.reset();
    return null;
  }
}

export type Session = ReturnType<typeof useSession>;
export type SignInResult = "ok" | "code" | "failed";

export function useSession(copy: Copy) {
  const client = useMemo(() => new YappioClient({ baseUrl: apiBase }), []);
  const api = useMemo(() => new EllmaApi(client, apiBase), [client]);
  const [profile, setProfile] = useState<Profile | null>(() => restoreProfile(client));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function failureMessage(failure: unknown): string {
    const apiError = toApiError(failure);
    if (apiError.isNetwork) {
      return copy.common.error;
    }
    if (apiError.code === "too_many_attempts") {
      return copy.auth.tooMany;
    }
    return apiError.code === "invalid_code" ? copy.auth.codeFailed : copy.auth.loginFailed;
  }

  /** Replaces the stored login token, for example after a password change. */
  async function adoptToken(token: string): Promise<boolean> {
    const result = await client.initialize(token);
    const next = result.success && client.isInitialized() ? client.statusInfo().profile : null;
    if (!next) {
      client.reset();
      setProfile(null);
      return false;
    }
    setProfile(next);
    return true;
  }

  /** "code" means the password was right and the account asks for its second factor. */
  async function signIn(email: string, password: string, code?: string): Promise<SignInResult> {
    setBusy(true);
    setError("");
    try {
      const result = await api.login({ email: email.trim(), password, code: code || undefined });
      if (result.status === "code_required") {
        return "code";
      }
      if (!(await adoptToken(result.token))) {
        setError(copy.auth.loginFailed);
        return "failed";
      }
      setNotice("");
      return "ok";
    } catch (failure) {
      setError(failureMessage(failure));
      return "failed";
    } finally {
      setBusy(false);
    }
  }

  async function signUp(name: string, email: string, password: string): Promise<boolean> {
    const problems = passwordProblems(password);
    if (problems.length > 0) {
      setError(problems[0] === "length" ? copy.auth.passwordLength : copy.auth.passwordSpecial);
      return false;
    }
    setBusy(true);
    setError("");
    try {
      await client.rest().post("/authenticate/register", {
        username: name.trim(),
        email: email.trim(),
        password,
        is2FA: false,
      });
    } catch (failure) {
      const apiError = toApiError(failure);
      setError(/exist/i.test(apiError.code) ? copy.auth.emailTaken : copy.auth.signupFailed);
      setBusy(false);
      return false;
    }
    setBusy(false);
    return (await signIn(email, password)) === "ok";
  }

  function signOut(message = "") {
    client.reset();
    setProfile(null);
    setNotice(message);
  }

  return {
    client,
    api,
    profile,
    name: profile?.username ?? "",
    busy,
    error,
    notice,
    setError,
    setNotice,
    signIn,
    signUp,
    adoptToken,
    signOut,
  };
}
