# Portfolio

Personal site for Luke Roxburgh — IT support and internal-tooling developer,
Brisbane. Resume, project showcase, art gallery, and a way to start a paid
project conversation.

The page presents itself as a technical drawing: exposed construction lines,
registration marks, cell dividers, part numbers on the components. Content sits
inside a visible measured system rather than floating on a background.

## Stack

| | |
|---|---|
| Framework | Astro 7, React 19 islands |
| Host | Cloudflare Workers with static assets |
| Package manager | pnpm 11 (settings live in `pnpm-workspace.yaml`, **not** `package.json`) |
| Fonts | Chakra Petch 600/700, JetBrains Mono 400 — self-hosted, three files |

Roughly 95% of the page ships zero JavaScript. Only five things hydrate: the
ASCII hero field, the case-study drawer, the gallery lightbox, the enquiry
form, and (later) the contribution heatmap.

## Commands

```bash
pnpm install
pnpm dev        # astro dev server
pnpm build      # → dist/
pnpm preview    # wrangler dev, against the real Workers runtime
pnpm deploy     # build + wrangler deploy
```

## Metadata and the social card

`site` in `astro.config.mjs` drives every absolute URL — canonical links, the
sitemap, and `og:image`. **It is currently a placeholder** (`lukeroxburgh.dev`,
not yet registered); confirm it before launch. Without it Astro resolves
`Astro.url` against localhost and the production build ships
`<link rel="canonical" href="http://localhost:4321/">`.

`public/og.png` is generated from the `/og` route so it uses the real tokens
and faces rather than being drawn by hand. To regenerate after a change:

```bash
pnpm build
cd dist/client && python3 -m http.server 8099 &
chromium --headless --window-size=1200,630 \
  --screenshot=public/og.png http://localhost:8099/og/
```

That route is `noindex` and excluded from the sitemap.

## Secrets

Never committed — this repo is public.

Local development uses `.dev.vars` (gitignored). Production uses
`wrangler secret put`. Required once the API routes land:

| Secret | Used by |
|---|---|
| `GITHUB_TOKEN` | `/api/activity` — contribution graph |
| `RESEND_API_KEY` | `/api/enquiry` — mail delivery |
| `TURNSTILE_SECRET` | `/api/enquiry` — spam |

## Layout

```
src/
  content/     projects, art, experience — typed collections
  components/  .astro static, .tsx islands
  layouts/
  pages/       index, work/[slug], api/
  styles/      tokens.css is the single source of truth
```

## Read this before changing anything

**[`Docs/plan.md`](Docs/plan.md)** — design direction, locked decisions, the
rule-band mechanism, and acceptance criteria. `plan-revA.md` is the superseded
first pass, kept for the reasoning only.

## Conventions

Two rules that are easy to break by accident:

- **`src/styles/tokens.css` owns every hex, rule offset and z-index.** Nothing
  else hard-codes them. The interior rule offsets in particular are referenced
  by both the rule system and the layouts that align to it — never write them
  twice.
- **`--rule` draws lines. `--graphite` writes words.** `--rule` as a text
  colour measures ~1.5:1 and fails WCAG at every size.

Roughly 95% of the page is static. Reach for a React island only when something
genuinely needs state, and prefer `client:visible` over `client:load`.

## Licence

Code is MIT. **Artwork, copy and the resume are not** — see [LICENSE](LICENSE).
