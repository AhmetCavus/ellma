import { useState } from "react";
import { comfortStorageAllowed, setComfortStorage } from "../lib/consent";
import { usePreferences } from "../lib/preferences";
import { Dialog } from "./Dialog";

/** "Cookie settings": what Ellma keeps in the browser, and the one part that is optional. */
export function StorageDialog({ onClose }: { onClose: () => void }) {
  const { copy } = usePreferences();
  const text = copy.legal.storage;
  const [comfort, setComfort] = useState(comfortStorageAllowed);

  return (
    <Dialog title={text.title} onClose={onClose}>
      <form
        className="form storage-settings"
        onSubmit={(event) => {
          event.preventDefault();
          setComfortStorage(comfort);
          onClose();
        }}
      >
        <p className="muted">{text.lead}</p>
        <div className="storage-row">
          <div>
            <strong>{text.necessaryTitle}</strong>
            <p>{text.necessaryText}</p>
          </div>
          <span className="storage-state">{text.alwaysOn}</span>
        </div>
        <div className="storage-row">
          <div>
            <strong>{text.comfortTitle}</strong>
            <p>{text.comfortText}</p>
          </div>
          <label className="storage-state storage-toggle">
            <input
              type="checkbox"
              aria-label={text.comfortTitle}
              checked={comfort}
              onChange={(event) => setComfort(event.target.checked)}
            />
            {comfort ? text.on : text.off}
          </label>
        </div>
        <div className="storage-row">
          <div>
            <strong>{text.trackingTitle}</strong>
            <p>{text.trackingText}</p>
          </div>
          <span className="storage-state">{text.never}</span>
        </div>
        <footer className="form-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            {copy.common.cancel}
          </button>
          <button className="button">{text.save}</button>
        </footer>
      </form>
    </Dialog>
  );
}
