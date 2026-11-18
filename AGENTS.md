# Ellma — personal goals assistant

## Structure

- `shared/`: canonical contracts (zod), date and progress logic, assistant stream protocol, EN/DE copy, and the `EllmaApi` client over `yappio-client`.
- `server/`: Yappio bootstrap, private models, and feature folders `goals/`, `tasks/`, `focus/`, `assistant/` (router → service → repository). `platform/` holds the CORS boundary, account access and the endpoint wrapper.
- `web/`: React SPA (landing, auth, Goals as home, Today, Progress, Focus). No router or UI framework; `lib/` holds session, store, voice, shortcuts and `ellma.tsx`, the provider that keeps Ellma present on every signed-in page.
- `docker/`: two services (`ellma-web`, `ellma-api`) on `dev-proxy`. Reuse `shared-mongo` and the shared `ollama` container.

## Guidelines

Use strict TypeScript, descriptive names and small feature components. Reuse Yappio collections, authentication and clients; the chat stream is the only direct `fetch` because Yappio's REST engine cannot stream. Keep contracts, rules and all UI copy in `shared` and keep `en` and `de` in sync (a test enforces equal keys). Never commit `.env`, credentials or user data.

Every record carries `ownerId`; every query and write filters by it. Users must never reach Yappio's generic `/collection` API (the boundary limits it to admins). Accept only full login tokens (`apiMode`, `_id`, no `otp`/`uid` claims).

The assistant runs on an open-weight model through Ollama (`OLLAMA_URL`, `OLLAMA_MODEL`). Keep its system prompt stable and short so Ollama reuses the cached prefix; dynamic facts go into the snapshot message. Tools change data only through the same services the UI uses. Resolve goal/task names and relative days on the server (`assistant/matching.ts`) instead of trusting model output. The model gets the user's calendar day from the client (`today`, `utcOffsetMinutes`).

## Ellma is a guide, not a chat page

There is no assistant page. `EllmaProvider` (`web/src/lib/ellma.tsx`) wraps every signed-in page and `EllmaDock` renders her at the bottom of each one (a quiet `solo` variant in focus mode). Keep it that way: new features should reach Ellma through `useEllma()` (`send`, `setComposeFor`, `startGoalGuide`) instead of adding chat surfaces.

- **Next best step**: `shared/src/guide.ts` (`buildGuide`) decides it deterministically from goals, tasks and this week's sessions, so guidance is instant and never waits for the model. It also returns one `GoalPulse` per active goal (week ratio, state, next task) that pages and the sidebar render. Change priorities there and cover them in `shared/tests/guide.test.ts`; the sentences and buttons live in `copy.guide` and `useNudge` in `EllmaDock.tsx`.
- **Instant commands**: `shared/src/intents.ts` handles very short utterances ("show my progress", "done", "stop") in the browser. Anything longer goes to the model.
- **On-screen context**: every chat request carries `view` (`page`, `goalId`). The server tells the model what is on screen and tools fall back to that goal when the user names none.
- **Goals stay in focus**: Goals is home; Today groups steps by goal; each goal is a `GoalApple` that fills with the week's target ratio. New goals are created through the guided `GoalGuide`, not a form (the form `GoalDialog` is for editing).
- **Motion**: page changes use the View Transitions API (`lib/router.ts`; redirects from effects must use `replace`), `celebrate()` and `useCountUp()` are in `lib/motion.ts`. Everything respects `prefers-reduced-motion`.

Keyboard shortcuts live in `web/src/lib/ellma.tsx` (Space hold-to-talk, ⌘/Ctrl J, /, V, Esc; these work on every page), `web/src/components/Shell.tsx` (navigation, create, tasks) and `FocusPage` (⌘↵, S, Esc). Single-key shortcuts must use `isPlainShortcut`. Update the shortcut copy in both locales when adding one.

## Verification

Build shared first. Run `npm run check`, `npm test`, `npm run build`. `npm run test:database` boots the built server against a throwaway `ellma_test_*` / `elma_test_*` database on shared-mongo and drops it afterwards; add `ASSISTANT_TEST=1` to include a live model round trip. `npm run verify:infrastructure` validates Compose, routing and the manifest with Yoster's discovery code. Never run tests against the production database and do not start production services as part of tests.
