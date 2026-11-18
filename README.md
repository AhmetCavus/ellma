# Ellma 🍎

**Ellma** is a personal guide to your goals. She keeps your goals, is present and listening on every page, always shows the next best step, and cheers you on. It runs on an **open-weight model** (Qwen via Ollama) on our own server, so goals never go to a third-party AI provider.

The name and the flat red apple come from _kızıl elma_, the "red apple" on the horizon: the goal you keep walking towards.

## What it does

| Area                  | Features                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ellma, everywhere** | No chat page: a guide bar on every page (also in focus mode). Hold `Space` and talk, or press `/` to write. She always shows the next best step with one button to do it, knows which goal is on screen, answers by voice, and acts through tools (goals, steps, time, focus, milestones). Short commands such as "show my progress" or "done" run instantly without the model. |
| **Guidance**          | Decided instantly from your data: first goal, carried-over steps, today's step for the goal that needs it most, goals without a next step, weekly gaps, and a calm "enough for today". First-run intro and a guided, voice-capable goal setup (what, why, hours, date, first step).                                                                                             |
| **Goals (home)**      | Every goal is an apple that fills as you invest time this week and turns ripe at the weekly target; each card shows the next step with a Start button. Goal page with journey (milestones), steps, hours.                                                                                                                                                                       |
| **Today**             | The day sorted by goal, with one-tap suggestions when a goal has no step today.                                                                                                                                                                                                                                                                                                 |
| **Focus**             | Full-screen timer on one step; Ellma still listens ("done", "stop").                                                                                                                                                                                                                                                                                                            |
| **Progress**          | Hours per day (stacked by goal), per goal vs. target, sessions, manual time logging, reflect with Ellma.                                                                                                                                                                                                                                                                        |
| **Everywhere**        | Animated page changes, celebrations for finished steps, milestones and ripe weeks, EN/DE, light/dark, mobile layout, keyboard shortcuts (`?`), local cache for instant start.                                                                                                                                                                                                   |

### Keyboard shortcuts

hold `Space` talk (anywhere) · `⌘/Ctrl J` listen on/off · `/` write to Ellma · `1–3` pages · `N` task · `G` guided new goal · `L` log time · `J/K` select task · `X` done · `E` edit · `P` focus on task · `F` focus mode · `⌘/Ctrl ↵` complete in focus · `S` stop focus · `V` read aloud · `D` theme · `Esc` stop Ellma / close · `?` overview

## Stack

- **Yappio** (`yappio@1.3.1`, `yappio-client@1.0.1` from Verdaccio): auth (register/login), collections, platform/health and admin.
- **Server**: Express via Yappio, Mongoose collections `EllmaGoal`, `EllmaTask`, `EllmaFocusSession`, `EllmaAssistantMessage`, `EllmaDailyNote` on `shared-mongo` / database `ellma`.
- **Model**: Ollama `qwen3.5:4b` (configurable `OLLAMA_MODEL`) with tool calling, streamed to the browser as server-sent events.
- **Voice**: the browser's Web Speech API (recognition and synthesis). In Chrome, recognition audio goes to the browser vendor's speech service; see _Notes_.
- **Web**: React 18 + Vite, no UI framework (`yappio-ui` only offers MUI media/PIN inputs, which Ellma doesn't need).

## Develop

```bash
npm install --registry http://192.168.178.131:4873/
cp .env.example .env            # or: npm run setup:environment
npm run dev                      # API :4000 + web :5180
```

## Verify

```bash
npm run check && npm test && npm run build
npm run test:database                    # isolated throwaway DB on shared-mongo
ASSISTANT_TEST=1 npm run test:database   # + live model round trip (slow on CPU)
npm run verify:infrastructure            # compose, routes, Yoster manifest discovery
```

## Host with Yoster

1. `npm run setup:environment`: creates the `ellma` DB user on shared-mongo, writes `.env` (0600) with generated secrets, and installs `infra/traefik/dynamic/ellma.yml`.
2. Point DNS / the Cloudflare tunnel at `ellma.yappai.de` and `ellma-api.yappai.de` (change the domains in `docker/traefik.yml`, `yappai.host.yaml` and `.env` if needed).
3. `npm run verify:infrastructure`, then start **Ellma** from Yoster (or `docker compose --env-file .env -f docker/docker-compose.yml up -d --build`).

## Notes

- **Speed**: on this CPU-only host, `qwen3.5:4b` answers in roughly 10–60 s depending on tool rounds; replies stream so text and voice start early. A GPU or a smaller model (`qwen3:1.7b`) makes it much faster.
- **One reply at a time per user**; a second simultaneous request gets `assistant_busy`.
- **Fully local voice** would need a self-hosted speech-to-text (e.g. Whisper) container; the API is ready to accept text from any source.
- Open registration is enabled (`/authenticate/register` creates `user` profiles). Consider rate limiting at Traefik before going public.
