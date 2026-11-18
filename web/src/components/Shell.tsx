import { SiteFooter } from "./SiteFooter";
import { useEffect, useState, type ReactNode } from "react";
import { goalHours, todayKey } from "@ellma/shared";
import { useEllma } from "../lib/ellma";
import { usePreferences } from "../lib/preferences";
import { linkHandler, navigate } from "../lib/router";
import type { Session } from "../lib/session";
import {
  actOnSelectedTask,
  isPlainShortcut,
  moveTaskSelection,
  SHORTCUTS_EVENT,
} from "../lib/shortcuts";
import { AppleMark } from "./AppleMark";
import { EllmaDock } from "./EllmaDock";
import { FocusBar } from "./FocusBar";
import { GoalApple } from "./GoalApple";
import { Icon, type IconName } from "./Icon";
import { LogTimeDialog } from "./LogTimeDialog";
import { SettingsInline } from "./Settings";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { TaskDialog } from "./TaskDialog";
import { Toast } from "./Toast";

const NAVIGATION: { path: string; icon: IconName; key: "goals" | "today" | "progress" }[] = [
  { path: "/goals", icon: "target", key: "goals" },
  { path: "/today", icon: "calendar", key: "today" },
  { path: "/progress", icon: "chart", key: "progress" },
];

export function Shell({
  session,
  path,
  children,
}: {
  session: Session;
  path: string;
  children: ReactNode;
}) {
  const { copy, toggleTheme } = usePreferences();
  const ellma = useEllma();
  const [newTask, setNewTask] = useState(false);
  const [logTime, setLogTime] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const { startGoalGuide } = ellma;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!isPlainShortcut(event)) {
        return;
      }
      const index = ["1", "2", "3"].indexOf(event.key);
      if (index >= 0) {
        navigate(NAVIGATION[index]?.path ?? "/goals");
        return;
      }
      const handlers: Record<string, () => void> = {
        "?": () => setShortcuts(true),
        n: () => setNewTask(true),
        g: startGoalGuide,
        l: () => setLogTime(true),
        f: () => navigate("/focus"),
        d: toggleTheme,
        j: () => moveTaskSelection(1),
        k: () => moveTaskSelection(-1),
        x: () => void actOnSelectedTask(".task-check"),
        e: () => void actOnSelectedTask(".task-main"),
        p: () => void actOnSelectedTask(".task-focus"),
      };
      const handler = handlers[event.key.toLowerCase()];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
    const showShortcuts = () => setShortcuts(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(SHORTCUTS_EVENT, showShortcuts);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SHORTCUTS_EVENT, showShortcuts);
    };
  }, [startGoalGuide, toggleTheme]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/goals" onClick={linkHandler("/goals")}>
          <AppleMark size={30} />
          <span>Ellma</span>
        </a>
        <nav aria-label={copy.nav.label}>
          {NAVIGATION.map((item, index) => {
            const current = path === item.path || path.startsWith(`${item.path}/`);
            return (
              <a
                key={item.path}
                href={item.path}
                onClick={linkHandler(item.path)}
                className={current ? "active" : ""}
                aria-current={current ? "page" : undefined}
                title={`${copy.nav[item.key]} (${index + 1})`}
              >
                <Icon name={item.icon} />
                <span>{copy.nav[item.key]}</span>
              </a>
            );
          })}
          {/* On phones the sidebar footer is hidden, so the account gets a place in the bar. */}
          <a
            href="/account"
            onClick={linkHandler("/account")}
            className={`only-compact ${path === "/account" ? "active" : ""}`}
            aria-current={path === "/account" ? "page" : undefined}
          >
            <Icon name="user" />
            <span>{copy.nav.account}</span>
          </a>
        </nav>
        <section className="sidebar-goals" aria-label={copy.nav.yourGoals}>
          <h2>{copy.nav.yourGoals}</h2>
          <ul>
            {ellma.guide.pulses.map((pulse) => (
              <li key={pulse.goal.id}>
                <a
                  href={`/goals/${pulse.goal.id}`}
                  onClick={linkHandler(`/goals/${pulse.goal.id}`)}
                  className={path === `/goals/${pulse.goal.id}` ? "active" : ""}
                  title={
                    pulse.targetSeconds > 0
                      ? copy.goals.weekOf(
                          goalHours(pulse.weekSeconds),
                          goalHours(pulse.targetSeconds),
                        )
                      : copy.goals.weekFree(goalHours(pulse.weekSeconds))
                  }
                >
                  <GoalApple color={pulse.goal.color} ratio={pulse.ratio} size={24} />
                  <span>{pulse.goal.title}</span>
                </a>
              </li>
            ))}
          </ul>
          <button type="button" className="sidebar-add" onClick={startGoalGuide}>
            <Icon name="plus" size={16} /> {copy.goals.newGoal}
          </button>
        </section>
        <FocusBar />
        <div className="sidebar-footer">
          <SettingsInline />
          <button
            type="button"
            className="icon-button"
            onClick={() => setShortcuts(true)}
            aria-label={copy.common.shortcuts}
            title={`${copy.common.shortcuts} (?)`}
          >
            <Icon name="keyboard" />
          </button>
          <a
            className={`icon-button ${path === "/account" ? "is-on" : ""}`}
            href="/account"
            onClick={linkHandler("/account")}
            aria-label={copy.nav.account}
            aria-current={path === "/account" ? "page" : undefined}
            title={copy.nav.account}
          >
            <Icon name="user" />
          </a>
          <button
            type="button"
            className="icon-button"
            onClick={() => session.signOut()}
            aria-label={copy.auth.logout}
            title={copy.auth.logout}
          >
            <Icon name="logout" />
          </button>
        </div>
        <SiteFooter compact />
      </aside>
      <main className="content">
        <div className="page-stage" key={path}>
          {children}
        </div>
      </main>
      <EllmaDock name={session.name} />
      <Toast />
      {newTask && (
        <TaskDialog defaults={{ plannedOn: todayKey() }} onClose={() => setNewTask(false)} />
      )}
      {logTime && <LogTimeDialog onClose={() => setLogTime(false)} />}
      {shortcuts && <ShortcutsDialog onClose={() => setShortcuts(false)} />}
    </div>
  );
}
