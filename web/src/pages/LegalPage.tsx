import { AppleMark } from "../components/AppleMark";
import { Icon } from "../components/Icon";
import { SiteFooter } from "../components/SiteFooter";
import { operator, operatorConfigured, type LegalPageName } from "../lib/legal";
import { usePreferences } from "../lib/preferences";
import { linkHandler } from "../lib/router";

function Imprint() {
  const { copy } = usePreferences();
  const text = copy.legal.imprint;
  return (
    <>
      {operatorConfigured ? (
        <>
          <section>
            <h2>{text.operator}</h2>
            <address>
              <strong>{operator.name}</strong>
              {operator.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            {operator.representative && (
              <p>
                {text.representative}: {operator.representative}
              </p>
            )}
          </section>
          <section>
            <h2>{text.contact}</h2>
            <p>
              {text.email}: <a href={`mailto:${operator.email}`}>{operator.email}</a>
            </p>
            {operator.phone && (
              <p>
                {text.phone}: {operator.phone}
              </p>
            )}
          </section>
          {(operator.register || operator.vatId) && (
            <section>
              <h2>{text.register}</h2>
              {operator.register && <p>{operator.register}</p>}
              {operator.vatId && (
                <p>
                  {text.vat}: {operator.vatId}
                </p>
              )}
            </section>
          )}
        </>
      ) : (
        <p className="alert" role="note">
          {text.missing}
        </p>
      )}
      <section>
        <h2>{text.aboutTitle}</h2>
        <p>{text.about}</p>
      </section>
    </>
  );
}

/** Data privacy, terms and imprint. Reachable signed in or out, from every footer. */
export function LegalPage({ page }: { page: LegalPageName }) {
  const { copy } = usePreferences();
  const text = copy.legal[page];
  return (
    <div className="legal">
      <header className="legal-top">
        <a className="brand" href="/" onClick={linkHandler("/")}>
          <AppleMark size={32} />
          <span>ellma</span>
        </a>
        <a className="link-button" href="/" onClick={linkHandler("/")}>
          <Icon name="chevronLeft" size={16} /> {copy.legal.back}
        </a>
      </header>
      <main className="legal-body">
        <h1>{text.title}</h1>
        <p className="legal-lead">{text.lead}</p>
        {page === "imprint" ? (
          <Imprint />
        ) : (
          copy.legal[page].sections.map((section, index) => (
            <section key={section.title}>
              <h2>
                <span>{index + 1}</span>
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))
        )}
        <p className="legal-updated">{copy.legal.updated}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
