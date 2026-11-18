import { useEffect, useRef, useState } from "react";
import type { AdminUser, Copy, EllmaApi, Locale } from "@ellma/shared";

function DeleteDialog({
  user,
  copy,
  busy,
  onConfirm,
  onClose,
}: {
  user: AdminUser;
  copy: Copy;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const text = copy.admin.users;
  const dialog = useRef<HTMLDialogElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) {
      element.showModal();
    }
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-label={text.deleteTitle}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2>{text.deleteTitle}</h2>
        <p>
          <strong>{user.name}</strong> · {user.email}
        </p>
        <p className="muted">{text.deleteLead}</p>
        <label>
          {text.deleteConfirm(user.email)}
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
        </label>
        <div className="actions">
          <button type="button" className="button ghost" onClick={onClose} disabled={busy}>
            {copy.common.cancel}
          </button>
          <button className="button danger" disabled={busy || typed.trim() !== user.email}>
            {busy ? copy.common.working : text.delete}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export function Users({
  users,
  copy,
  locale,
  api,
  selfId,
  mailConfigured,
  failureText,
  onChanged,
}: {
  users: AdminUser[];
  /** The signed-in administrator, who cannot change their own account here. */
  selfId: string;
  copy: Copy;
  locale: Locale;
  api: EllmaApi;
  mailConfigured: boolean;
  failureText: (failure: unknown) => string;
  onChanged: () => Promise<void>;
}) {
  const text = copy.admin.users;
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(needle))
    : users;
  const day = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(copy.dateLocale, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : text.never;
  const hours = (seconds: number) =>
    (seconds / 3600).toLocaleString(copy.dateLocale, { maximumFractionDigits: 1 });

  /** Runs one change on one account, then reloads so totals and rights stay true. */
  async function act(user: AdminUser, done: string, action: () => Promise<unknown>) {
    setBusyId(user.id);
    setNotice("");
    setError("");
    try {
      await action();
      setNotice(done);
      await onChanged();
    } catch (failure) {
      setError(failureText(failure));
    } finally {
      setBusyId("");
    }
  }

  return (
    <section aria-label={copy.admin.tabs.users}>
      <div className="toolbar">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.search}
          aria-label={text.search}
        />
        <span className="muted">{text.count(shown.length, users.length)}</span>
      </div>
      {notice && (
        <p className="alert" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      <div className="panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>{text.name}</th>
              <th>{text.role}</th>
              <th>{text.twoFactor}</th>
              <th>{text.joined}</th>
              <th>{text.lastActive}</th>
              <th className="number">{text.goals}</th>
              <th className="number">{text.tasks}</th>
              <th className="number">{text.hours}</th>
              <th>{text.actions}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((user) => {
              const busy = busyId === user.id;
              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                    <span className="muted cell-sub">{user.email}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.role === "user" ? "" : "accent"}`}>
                      {copy.account.roles[user.role]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.twoFactor ? "good" : ""}`}>
                      {user.twoFactor ? copy.account.statusOn : copy.account.statusOff}
                    </span>
                  </td>
                  <td>{day(user.createdAt)}</td>
                  <td>{day(user.lastActiveAt)}</td>
                  <td className="number">{user.goals}</td>
                  <td className="number">{user.tasks}</td>
                  <td className="number">{hours(user.focusSeconds)}</td>
                  <td>
                    {user.manageable ? (
                      <div className="row-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            const promote = user.role === "user";
                            const question = promote
                              ? text.confirmMakeAdmin(user.name)
                              : text.confirmMakeUser(user.name);
                            if (window.confirm(question)) {
                              void act(user, text.roleChanged, () =>
                                api.adminSetRole(user.id, { role: promote ? "admin" : "user" }),
                              );
                            }
                          }}
                        >
                          {user.role === "user" ? text.makeAdmin : text.makeUser}
                        </button>
                        {user.twoFactor && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(text.confirmResetTwoFactor(user.name))) {
                                void act(user, text.twoFactorReset, () =>
                                  api.adminResetTwoFactor(user.id),
                                );
                              }
                            }}
                          >
                            {text.resetTwoFactor}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy || !mailConfigured}
                          title={mailConfigured ? undefined : text.mailUnavailable}
                          onClick={() => {
                            if (window.confirm(text.confirmSendRecovery(user.email))) {
                              void act(user, text.recoverySent, () =>
                                api.adminSendRecovery(user.id, locale),
                              );
                            }
                          }}
                        >
                          {text.sendRecovery}
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => setDeleting(user)}
                        >
                          {text.delete}
                        </button>
                      </div>
                    ) : (
                      <span className="muted">{user.id === selfId ? text.you : "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="muted empty">{text.empty}</p>}
      </div>
      {deleting && (
        <DeleteDialog
          user={deleting}
          copy={copy}
          busy={busyId === deleting.id}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            void act(deleting, text.deleted, () => api.adminDeleteUser(deleting.id)).then(() =>
              setDeleting(null),
            )
          }
        />
      )}
    </section>
  );
}
