# Ellma — personal goals assistant

## Structure

- `shared/`: canonical contracts (zod), date and progress logic, assistant stream protocol, EN/DE copy, and the `EllmaApi` client over `yappio-client`.
- `server/`: Yappio bootstrap, private models, and feature folders `goals/`, `tasks/`, `focus/`, `assistant/`, `account/`, `admin/` (router → service → repository). `platform/` holds the CORS boundary, account access, the endpoint wrapper, attempt limits and `yappio.ts`, the only file that reaches into Yappio's unexported services.
- `web/`: React SPA (landing, auth, Goals as home, Today, Progress, Focus). No router or UI framework; `lib/` holds session, store, voice, shortcuts and `ellma.tsx`, the provider that keeps Ellma present on every signed-in page.
- `admin/`: separate React SPA for administrators (sign-in, overview, accounts) on its own host. It uses `EllmaApi` and `copy.admin` from `shared` and has its own small stylesheet.
- `docker/`: three services (`ellma-web`, `ellma-admin`, `ellma-api`) on `dev-proxy`. Reuse `shared-mongo` and the shared `ollama` container.

## Guidelines

Use strict TypeScript, descriptive names and small feature components. Reuse Yappio collections, authentication and clients; the chat stream is the only direct `fetch` because Yappio's REST engine cannot stream. Keep contracts, rules and all UI copy in `shared` and keep `en` and `de` in sync (a test enforces equal keys). Never commit `.env`, credentials or user data.

Every record carries `ownerId`; every query and write filters by it. Users must never reach Yappio's generic `/collection` API (the boundary limits it to admins). Accept only full login tokens (`apiMode`, `_id`, no `otp`/`uid` claims).

The assistant runs on an open-weight model through Ollama (`OLLAMA_URL`, `OLLAMA_MODEL`). Keep its system prompt stable and short so Ollama reuses the cached prefix; dynamic facts go into the snapshot message. Tools change data only through the same services the UI uses. Resolve goal/task names and relative days on the server (`assistant/matching.ts`) instead of trusting model output. The model gets the user's calendar day from the client (`today`, `utcOffsetMinutes`).

## Accounts and security

Sign-in, password change, two-factor sign-in and password recovery live in `server/src/account` and are reached under `/api/ellma/account`; the contracts are in `shared/src/account.ts`. Keep these rules:

- Browsers sign in through `POST /api/ellma/account/login`, never through Yappio's `/authenticate`. Tokens it issues carry `mfa: true` once the second factor was checked.
- `requireAccount` (`platform/access.ts`) is the single gate. It refuses tokens without `mfa` for accounts with two-factor sign-in, and tokens issued before `sessionsValidFrom` (set by a password change, reset or role change). Do not add a route that authenticates another way.
- The boundary closes Yappio's `/password`, `/otp`, `/totp`, `/email` and `/authenticate/totp` routes and the `EllmaAccountSecurity` collection. Do not reopen them.
- Store no readable secret: seal what must be read back (`seal`), fingerprint what is only compared (`fingerprint`), both in `account/secrets.ts`.
- Answers must not reveal whether an address has an account (login, recovery). Guessable inputs (password, code, reset token) go through a `RateLimiter`.
- Mail is sent only for password recovery, through Yappio's mailer (`MAIL_*`). Mail texts are in `copy.mail`.

The admin API (`server/src/admin`, `/api/ellma/admin`, admins and root only) returns account data and totals, never content. `canManageAccount` in `shared` decides who may change whom; use it on the server and for the UI. Deleting an account must remove every record with its `ownerId`: add new models to `deleteUser`.

## Ellma is a guide, not a chat page

There is no assistant page. `EllmaProvider` (`web/src/lib/ellma.tsx`) wraps every signed-in page and `EllmaDock` renders her at the bottom of each one (a quiet `solo` variant in focus mode). Keep it that way: new features should reach Ellma through `useEllma()` (`send`, `setComposeFor`, `startGoalGuide`) instead of adding chat surfaces.

- **Next best step**: `shared/src/guide.ts` (`buildGuide`) decides it deterministically from goals, tasks and this week's sessions, so guidance is instant and never waits for the model. It also returns one `GoalPulse` per active goal (week ratio, state, next task) that pages and the sidebar render. Change priorities there and cover them in `shared/tests/guide.test.ts`; the sentences and buttons live in `copy.guide` and `useNudge` in `EllmaDock.tsx`.
- **Instant commands**: `shared/src/intents.ts` handles very short utterances ("show my progress", "done", "stop") in the browser. Anything longer goes to the model.
- **On-screen context**: every chat request carries `view` (`page`, `goalId`). The server tells the model what is on screen and tools fall back to that goal when the user names none.
- **Goals stay in focus**: Goals is home and shows each goal once, grouped by the day of its earliest open step; Today groups steps by their own day (overdue, today, tomorrow, later, no date) with today most prominent, and shows today's steps either as one card per goal (the default) or as one list (`useViewLayout` in `lib/viewFilter.ts`, toggled in `ViewControls`); each goal is a `GoalApple` that fills with the week's target ratio. New goals are created through the guided `GoalGuide`, not a form (the form `GoalDialog` is for editing).
- **Filters, tags and groups**: tags are the user's own words on goals (`tags` in the goal contract, deduplicated by `uniqueTags`); steps use their goal's tags. Grouping, filtering, sorting and the specific attention labels (`goalAttention`) live in `shared/src/views.ts` and are covered by `shared/tests/views.test.ts`; `ViewControls` renders the bar on both pages and `lib/viewFilter.ts` remembers each view's filter separately (only with "Instant start" allowed, otherwise for the tab).
- **Feedback**: a finished assistant interaction or in-app news goes through `acknowledge` in `lib/ellma.tsx`: one notification sound, a short toast (announced to screen readers) and the orb's hop. `playSound` lets a notification through only if no other sound played in the last 2.5 s, so one interaction never makes two sounds. Focus stop returns the saved session (`stopped`); Focus Mode shows success only after the save and fills the apple from that saved time. Pausing ends the running session on the server (so the time is saved) and the store keeps `paused` and `carriedSeconds` (also in the local copy); resuming starts a new session for the same step, and the clocks and the final confirmation add the parts together.
- **Motion**: page changes use the View Transitions API (`lib/router.ts`; redirects from effects must use `replace`), `celebrate()` and `useCountUp()` are in `lib/motion.ts`. Everything respects `prefers-reduced-motion`.
- **Sound and reminders**: action sounds are synthesised in `web/src/lib/sound.ts` (`playSound`, `playChime`). The focus sound plays the pendulum pieces in `web/public/sounds` in a shuffled order chosen by time of day (`tracksForHour`), with a short pause between pieces. Only add recordings whose licence allows it and serve them from the app itself. `lib/presence.ts` runs the focus sound while a session is active and the away reminder (sound plus tab title); when and how often Ellma reminds is decided in `shared/src/reminder.ts`. All of it obeys the per-device switches in `lib/settings.ts` (Account → "Sounds and reminders": action sounds, focus sound, notification sounds, reminders), which are listed as necessary browser storage in the legal texts.

Keyboard shortcuts live in `web/src/lib/ellma.tsx` (Space hold-to-talk, ⌘/Ctrl J, /, V, Esc; these work on every page), `web/src/components/Shell.tsx` (navigation, create, tasks) and `FocusPage` (⌘↵, P, S, M, Esc). Single-key shortcuts must use `isPlainShortcut`. Update the shortcut copy in both locales when adding one.

## Legal pages

`/privacy`, `/terms` and `/imprint` (`web/src/pages/LegalPage.tsx`) are open signed in or out, as is `/reset-password`; `SiteFooter` links them from every public page and the sidebar. Texts are in `copy.legal` and must stay true to what the code does: update them when Ellma starts storing something new, adds a third-party service, sets a cookie, or shows administrators more than they see today. Operator details come only from `VITE_LEGAL_*`; never hard-code them. Optional browser storage must check `comfortStorageAllowed()` (`web/src/lib/consent.ts`).

## Verification

Build shared first. Run `npm run check`, `npm test`, `npm run build`. `npm run test:database` boots the built server against a throwaway `ellma_test_*` / `elma_test_*` database on shared-mongo and drops it afterwards; add `ASSISTANT_TEST=1` to include a live model round trip. `npm run verify:infrastructure` validates Compose, routing and the manifest with Yoster's discovery code. Never run tests against the production database and do not start production services as part of tests.
