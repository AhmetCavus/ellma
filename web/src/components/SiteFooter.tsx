import { useState } from "react";
import { LEGAL_PAGES, legalPath, YAPPAI_URL } from "../lib/legal";
import { usePreferences } from "../lib/preferences";
import { linkHandler } from "../lib/router";
import { StorageDialog } from "./StorageDialog";

/**
 * Legal links, the storage ("cookie") settings and the yappai credit. Shown on every public
 * page and, in its compact form, in the sidebar of the app.
 */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  const { copy } = usePreferences();
  const text = copy.legal.footer;
  const [settings, setSettings] = useState(false);
  const [privacy, terms, imprint] = LEGAL_PAGES;

  const link = (page: (typeof LEGAL_PAGES)[number]) => (
    <a href={legalPath(page)} onClick={linkHandler(legalPath(page))}>
      {text[page]}
    </a>
  );

  return (
    <footer className={`site-footer ${compact ? "is-compact" : ""}`}>
      {/* Not a <nav> element: inside the sidebar that would inherit the main navigation styles. */}
      <div className="site-links" role="navigation" aria-label={text.label}>
        {link(privacy)}
        {link(terms)}
        <button type="button" onClick={() => setSettings(true)}>
          {text.cookies}
        </button>
        {link(imprint)}
      </div>
      <a className="powered-by" href={YAPPAI_URL} target="_blank" rel="noopener">
        {text.poweredBy} <strong>yappai</strong>
      </a>
      {settings && <StorageDialog onClose={() => setSettings(false)} />}
    </footer>
  );
}
