import type { AdminOverview, Copy } from "@ellma/shared";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Overview({ overview, copy }: { overview: AdminOverview; copy: Copy }) {
  const text = copy.admin.overview;
  const system = copy.admin.system;
  const count = (value: number) => value.toLocaleString(copy.dateLocale);
  const hours = (seconds: number) =>
    (seconds / 3600).toLocaleString(copy.dateLocale, { maximumFractionDigits: 1 });

  return (
    <>
      <section aria-labelledby="people-title">
        <h2 id="people-title">{text.peopleTitle}</h2>
        <div className="tiles">
          <Tile label={text.users} value={count(overview.users)} />
          <Tile label={text.activeUsersThisWeek} value={count(overview.activeUsersThisWeek)} />
          <Tile label={text.newUsersThisWeek} value={count(overview.newUsersThisWeek)} />
          <Tile label={text.twoFactorUsers} value={count(overview.twoFactorUsers)} />
          <Tile label={text.admins} value={count(overview.admins)} />
        </div>
      </section>
      <section aria-labelledby="usage-title">
        <h2 id="usage-title">{text.usageTitle}</h2>
        <div className="tiles">
          <Tile label={text.goals} value={count(overview.goals)} />
          <Tile label={text.tasks} value={count(overview.tasks)} />
          <Tile label={text.tasksDone} value={count(overview.tasksDone)} />
          <Tile label={text.focusHours} value={hours(overview.focusSeconds)} />
          <Tile label={text.focusHoursThisWeek} value={hours(overview.focusSecondsThisWeek)} />
          <Tile label={text.assistantMessages} value={count(overview.assistantMessages)} />
        </div>
      </section>
      <section aria-labelledby="system-title">
        <h2 id="system-title">{system.title}</h2>
        <dl className="panel facts">
          <div>
            <dt>{system.version}</dt>
            <dd>{overview.system.version}</dd>
          </div>
          <div>
            <dt>{system.model}</dt>
            <dd>
              {overview.system.model}{" "}
              <span className={`badge ${overview.system.modelReachable ? "good" : "bad"}`}>
                {overview.system.modelReachable ? system.modelUp : system.modelDown}
              </span>
            </dd>
          </div>
          <div>
            <dt>{system.mail}</dt>
            <dd>
              <span className={`badge ${overview.system.mailConfigured ? "good" : "warn"}`}>
                {overview.system.mailConfigured ? system.mailOn : system.mailOff}
              </span>
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}
