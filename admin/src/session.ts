import { useCallback, useMemo, useState } from "react";
import { YappioClient, type Profile } from "yappio-client";
import { EllmaApi, toApiError, type Copy } from "@ellma/shared";

export const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";

function isAdmin(profile: Profile | null): profile is Profile {
  return profile?.role === "admin" || profile?.role === "root";
}

function restoreProfile(client: YappioClient): Profile | null {
  try {
    client.initializeFromStorage();
    const profile = client.isInitialized() ? client.statusInfo().profile : null;
    if (!isAdmin(profile) || client.isTokenExpired()) {
      client.reset();
      return null;
    }
    return profile;
  } catch {
    client.reset();
    return null;
  }
}

export type AdminSession = ReturnType<typeof useAdminSession>;

/** Signs in through Ellma's own login, so the second factor applies to admins as well. */
export function useAdminSession(copy: Copy) {
  const client = useMemo(() => new YappioClient({ baseUrl: apiBase }), []);
  const api = useMemo(() => new EllmaApi(client, apiBase), [client]);
  const [profile, setProfile] = useState<Profile | null>(() => restoreProfile(client));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const signOut = useCallback(
    (message = "") => {
      client.reset();
      setProfile(null);
      setError(message);
    },
    [client],
  );

  /** "code" means the password was right and the account asks for its second factor. */
  async function signIn(email: string, password: string, code?: string) {
    setBusy(true);
    setError("");
    try {
      const result = await api.login({ email: email.trim(), password, code: code || undefined });
      if (result.status === "code_required") {
        return "code" as const;
      }
      const initialized = await client.initialize(result.token);
      const next = initialized.success ? client.statusInfo().profile : null;
      if (!isAdmin(next)) {
        client.reset();
        setError(next ? copy.admin.noPermission : copy.auth.loginFailed);
        return "failed" as const;
      }
      setProfile(next);
      return "ok" as const;
    } catch (failure) {
      const apiError = toApiError(failure);
      setError(
        apiError.isNetwork
          ? copy.common.error
          : apiError.code === "too_many_attempts"
            ? copy.auth.tooMany
            : apiError.code === "invalid_code"
              ? copy.auth.codeFailed
              : copy.auth.loginFailed,
      );
      return "failed" as const;
    } finally {
      setBusy(false);
    }
  }

  return { api, profile, busy, error, setError, signIn, signOut };
}
