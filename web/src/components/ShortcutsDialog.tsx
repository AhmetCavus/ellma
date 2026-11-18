import { usePreferences } from "../lib/preferences";
import { Dialog } from "./Dialog";

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const { copy } = usePreferences();
  return (
    <Dialog title={copy.shortcuts.title} onClose={onClose} wide>
      <div className="shortcut-groups">
        {copy.shortcuts.groups.map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            <dl className="shortcut-list">
              {group.list.map((entry) => (
                <div key={entry.combo}>
                  <dt>
                    <kbd>{entry.combo}</kbd>
                  </dt>
                  <dd>{entry.label}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <p className="hint">{copy.shortcuts.hint}</p>
    </Dialog>
  );
}
