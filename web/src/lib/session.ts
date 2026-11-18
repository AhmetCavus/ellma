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

export function useSession(copy: Copy) {
  const client = useMemo(() => new YappioClient({ baseUrl: apiBase }), []);
  const api = useMemo(() => new EllmaApi(client, apiBase), [client]);
  const [profile, setProfile] = useState<Profile | null>(() => restoreProfile(client));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function signIn(email: string, password: string): Promise<boolean> {
    setBusy(true);
    setError("");
    try {
      await client.authenticate(email.trim(), password);
      const next = client.isInitialized() ? client.statusInfo().profile : null;
      if (!next) {
        client.reset();
        setError(copy.auth.loginFailed);
        return false;
      }
      setNotice("");
      setProfile(next);
      return true;
    } catch {
      client.reset();
      setError(copy.auth.loginFailed);
      return false;
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
    return signIn(email, password);
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
    signIn,
    signUp,
    signOut,
  };
}
