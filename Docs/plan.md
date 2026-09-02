# plan.md — Portfolio site, revision B

Handover brief for the implementing agent. Supersedes revision A
(`plan-revA.md`, kept for reference only — do not work from it).

Nothing here is a file-level prescription. It's intent, constraints, and what
to verify. Where a selector or pixel value is named it's because it was read
out of the prototype and is a fact worth carrying, not an instruction about
where your code should live.

**What changed from rev A:** the three blocking decisions in its section 5 are
answered and folded in. The stack, repo and deployment are specified. The
interior rule position is resolved. The Work filters are cut. The scope is
narrowed to the home page. A set of gaps rev A didn't cover — mobile, SEO,
performance, accessibility beyond modals — are now specified, and one of its
acceptance criteria was aimed at the wrong colour and is corrected.

Work in small commits, in the order in section 8. Verify each in a browser
before moving to the next.

---

## 1. What this is

A personal portfolio site for Luke Roxburgh — IT support and internal-tooling
developer in Brisbane, Australia. Builds internal apps for a ~300-user org,
plus open-source side projects, and paints and draws digitally.

The site is a resume, a project showcase, an art gallery, and a way for someone
to start a paid project conversation.

Audience, in priority order:

1. Hiring managers and technical leads scanning fast for evidence he can build.
2. People who might pay him to build something, arriving from a referral.
3. Other developers and artists who followed a link out of curiosity.

It has to survive a 20-second skim from group 1 and reward a slow scroll from
group 3.

## 2. Decisions locked

Do not reopen these without asking.

| | |
|---|---|
| **Stack** | Astro, with React islands via `@astrojs/react` |
| **Host** | Cloudflare Workers with static assets, `@astrojs/cloudflare` |
| **Domain** | `.dev` primary. `.com` registered defensively and 301'd to it |
| **GitHub** | `LASR-0` — this is the handle, everywhere |
| **Case studies** | Real routes at `/work/[slug]`, opening as a drawer on in-page nav |
| **Launch projects** | AssetCheckout, Pallet 2.0, Canopy, Hercules App — four, no placeholders |
| **Work grid** | 4 columns |
| **Interior rules** | 25% / 75% |
| **Work filters** | Cut for this revision |

`lukeroxburgh.com` was confirmed available against VeriSign whois.
`lukeroxburgh.dev` could **not** be verified from the dev environment — check it
at the registrar before assuming it.

## 3. Visual direction

**The page presents itself as a technical drawing.** Not "tech-themed" — an
actual drafting sheet: exposed construction lines, registration marks, cell
dividers, part numbers on the components. Content sits inside a visible
measured system rather than floating on a background. Warmth comes from the
paper stock and one accent ink, not from illustration or softness.

Boldness is spent in exactly two places: the ASCII hero, and the exposed grid
apparatus. Everything else stays flat, quiet, and disciplined so those land.

This direction is pinned. Don't substitute a safer one.

### Where the look came from

- **ChainGPT Labs portfolio page.** The exposed grid, the ✕ registration marks
  in margins and gutters, hairline dividers splitting cards into data cells,
  stats as tables rather than prose, huge squarish techno display type set edge
  to edge, boxed arrow affordances. Not its greyscale coldness.
- **Fumayo bookshop page.** The paper-toned base, a coral accent doing real work
  rather than decorating, visible guide lines running the full page height,
  confidence to leave areas empty, asymmetric block placement. Not its
  illustration style or soft rounded sans.
- **motion.dev.** Dense small-type meta rows, numbered chapter markers down the
  page, section headings as short declarative sentences ending in a full stop.
  Numbering is only applied where content is genuinely sequential — Work,
  Experience, Activity are numbered 01/02/03; Gallery, Hobbies and Start a
  project are not.

## 4. Design tokens

Lift these into real tokens (CSS custom properties) in the first commit. Every
change below references them by name.

| Token | Hex | Use |
|---|---|---|
| `paper` | `#EAE7DE` | Page base |
| `paper-2` | `#F2F0EA` | Card and cell fills |
| `ink` | `#171614` | All text, warm near-black, never `#000` |
| `rule` | `#C4BFB2` | Every hairline, grid line, registration mark |
| `vermilion` | `#E8452B` | The single accent |
| `graphite` | `#5C5850` | Secondary and meta text only |

Two more tokens, because two things now reference them and they must never be
hard-coded twice:

| Token | Value | Use |
|---|---|---|
| `rule-left` | `25%` | Left interior rule, and any layout aligning to it |
| `rule-right` | `75%` | Right interior rule, same |

Heatmap intensity ramp: `#F2F0EA` → `#F6C9C0` → `#F09480` → `#EC6A4F` → `#E8452B`.

Hard rules: `vermilion` appears at most three times in any single viewport; no
gradients, no drop shadows, no border radius anywhere.

> Rev A carved out an exception for "the pill filter tabs". The tabs are cut in
> section 10.2, so radius is now zero with no exceptions.

**`rule` is a line colour, not a text colour.** See section 12.

### Type

Two families. **Chakra Petch** (display — headings and hero only, 600/700,
`-0.03em` tracking, `0.9` line-height). **JetBrains Mono** (everything else —
body, labels, nav, data cells, ASCII field, 400 only).

That is **three font files**: Chakra 600, Chakra 700, JBM 400. The prototype
requests eight (Chakra 400/500/600/700 + JBM 300/400/500/600) and uses three.

Self-host via `@fontsource` rather than the Google Fonts CDN. It removes an
origin and the `preconnect` chain, improves LCP, and sidesteps the GDPR
question about Google Fonts serving from a US endpoint. Give both faces a real
fallback stack, and consider `size-adjust` on the fallback — a 224px hero name
reflowing on font swap is very visible.

Mono body is deliberate and it constrains the writing: prose caps at 55ch with
`1.7` line-height. If a paragraph runs longer than four lines the copy is
wrong, not the typeface.

No tracked-out all-caps eyebrows above headings — the numbered markers do that
job. No `→` appended to link text; arrows live in their own bordered box.

### Motion

One orchestrated page-load sequence, then nothing automatic. Everything else
answers a click, hover, or scroll input. No fade-and-slide-up on section entry.

## 5. Stack and architecture

**Astro shell, React islands.** The page is ~95% static text and hairlines,
which ships as zero JS. The five interactive pieces are cleanly separable, and
the two expensive ones (the ASCII field, the form) port near-verbatim from the
prototype's React.

```
src/
  content/           projects, art, experience — typed collections, one source of truth
  components/        .astro for static, .tsx for islands
  layouts/
  pages/
    index.astro
    work/[slug].astro      real, crawlable case-study pages
    404.astro
    api/activity.ts        GitHub GraphQL, edge-cached
    api/enquiry.ts         server revalidation + Turnstile + mail
  styles/tokens.css
public/
  resume.pdf
wrangler.toml
```

Islands, in ascending cost:

| Island | Directive | Notes |
|---|---|---|
| `EnquiryForm` | `client:visible` | Form state ports from `renderVals()` |
| `Lightbox` | `client:visible` | Gallery modal |
| `CaseDrawer` | `client:visible` | See below |
| `HeroField` | `client:load` | The rAF ASCII loop. See 11.2 |

Everything else — header, section headings, Work cards, Experience timeline,
heatmap markup, Hobbies, footer — is `.astro` and ships no JavaScript.

### Case studies: routes and drawer

`/work/[slug]` is a real server-rendered page reading from the same content
collection the drawer reads. In-page clicks open the drawer and call
`history.pushState('/work/pallet')`; Escape and the back button pop it. Direct
hits, crawlers and pasted links get the page.

Do **not** build this on Astro's `<ClientRouter>` / view transitions. The
pushState approach has no dependency on transition behaviour and degrades
correctly with JS off.

At this revision the page renders the drawer's content in the existing design
language and nothing more. Its richer template is deferred — see section 14.
**Build the plumbing now regardless.** The data model and pushState wiring are
the parts that are expensive to retrofit; the visual richness is not.

## 6. Repo

Currently there is a git repo at `/home/luke/Projects` — the projects *root* —
with zero commits, no remote, tracking every sibling project plus `backup/` and
`Icon-package.zip`. This is almost certainly accidental.

1. `git init` inside `Portfolio/`, default branch `main`.
2. Confirm with Luke before touching the root `.git`; recommend removing it.
3. Keep `Prototype/` in the repo, excluded from the build. It's the visual
   reference and rev A is the record of why things are the way they are.
4. Node version pinned. `pnpm`.

## 7. Deployment — Cloudflare

**Workers with static assets**, not Pages. It's Cloudflare's current
recommended path for new projects, and it puts the static site and both server
routes in one deployment unit. Pages Functions does the same job on the older
path; if you hit a blocker, say so rather than silently switching.

### `GET /api/activity`

GitHub GraphQL `contributionsCollection`, token as a Worker secret, response
cached at the edge ~6h. Client fetches it; `NO SIGNAL` renders on failure.

This is deliberately not a build-time fetch. It decouples data freshness from
deploys, keeps the token out of the bundle, and makes the designed failure
state genuinely reachable rather than decorative.

**Before wiring this, check one thing:** Hercules App is a private repo. If a
meaningful share of Luke's commits are private, the graph will read as sparse
unless *Settings → Profile → Include private contributions on my profile* is
enabled and the token carries the scope to see them. The entire point of that
section is density.

### `POST /api/enquiry`

- **Revalidate server-side.** The prototype's checks are client-only and must
  not be trusted.
- **Turnstile.** Cloudflare's own, free, renders invisibly — which matters,
  because a visible captcha widget would wreck this design.
- **Honeypot field**, hidden from assistive tech as well as sighted users.
- **Mail: Resend or Postmark**, API key as a Worker secret. **Not
  MailChannels** — they ended free Workers sending in 2024 and a great many
  stale tutorials still recommend it.
- Optionally mirror submissions to D1 so a mail outage never silently loses a
  paying client.

### Also free, also worth taking

- **Cloudflare Web Analytics** — cookieless, so no consent banner. A consent
  banner would be aesthetically fatal here, which makes this a design decision
  as much as an analytics one.
- **Email Routing** — `hello@<domain>` forwarding to the personal address. The
  prototype footer exposes `<personal address>`; publishing a Bigpond address
  to hiring managers is a small credibility cost and, once indexed, a permanent
  spam magnet on a personal mailbox.
- Branch preview deployments.

## 8. Commit sequence

Small commits, tested in a browser before each push.

1. Scaffold: Astro + Cloudflare adapter + React integration, repo, tokens
   (including `rule-left` / `rule-right`), self-hosted fonts.
2. Static port of the page at current rule positions, hover states rebuilt as
   real CSS and verified firing. **Screenshot against the prototype and diff.**
3. Rule-band mechanism (10.0) applied with rules still at 33.3/66.6 — pure
   refactor, page should look identical. **Screenshot before and after.**
4. Move rules to 25%/75% and Work grid to 4 columns (10.1).
5. Per-band rule removals (10.3–10.7).
6. Per-component z-index raises (10.8).
7. Resume meta-line fix (10.9). Rename Off the clock → Hobbies (10.10).
8. Sticky nav and nav sizing (10.11, 10.12).
9. Islands: hero field with the lifecycle fixes (11.2), lightbox, form.
10. `work/[slug]` routes and drawer pushState plumbing.
11. Mobile (11.1).
12. `/api/activity` and `/api/enquiry`.
13. SEO, OG image, analytics, 404 (11.4).

## 9. What survives the port

`Portfolio.dc.html` + `support(2).js` is a Claude Design prototype, not
production code.

- Markup uses `sc-for`, `sc-if`, `{{ }}` interpolation and a `DCLogic` base
  class from the bundled runtime. All prototype scaffolding.
- Every style is an inline `style` attribute string.
- `style-hover="..."` attributes appear throughout. **The runtime does not
  implement them** — there is no handler anywhere in the bundle. Every hover
  state in the prototype is dead. They need rebuilding as real CSS, and they
  need testing, because none of them have ever run.
- The runtime loads React 18, ReactDOM and **@babel/standalone** from unpkg at
  page load. Nothing resembling this ships.
- The `DEMO: TOGGLE FAILURE STATE` button must not ship. Keep the `NO SIGNAL`
  state it toggles — that state is real and needed. Make it reachable in dev
  via `?nosignal=1` so it stays regression-testable once the button is gone.

**Worth carrying almost as-is:** the `draw()` function and its `measure()`
sizing, the seeded LCG only as a dev fixture, the form validation *messages*
(the logic moves server-side, the copy is good), and the scope-slider markup.

## 10. Layout and the rule system

### 10.0 The mechanism — read this before anything else

**Current implementation.** One page-level overlay, `position:absolute;
inset:0; pointer-events:none; z-index:3`, inside the `max-width:1440px`
container. It holds four full-height 1px divs at `left:0`, `left:33.333%`,
`left:66.666%`, `right:0`. Sections are `position:relative` with no z-index, so
they stack below the overlay and the rules paint over all content.

**Why it can't stay.** Continuous full-height rules can't be interrupted for
one band and resumed in the next. That's the core of this revision.

**The mechanism.** Move the two interior rules off the page level and render
them per horizontal band:

- The two **outer** rules (`left:0`, `right:0`) stay page-level and continuous.
  They keep the staggered `ruleDown` load animation.
- Introduce a **rule band** primitive — a wrapper any horizontal band of content
  sits inside. It is `position:relative` and draws the interior rules as its own
  children, absolutely positioned at `rule-left` / `rule-right`, spanning only
  that band's height, `pointer-events:none`, at `z-index:1` within the band's
  local stacking context.
- A band opts out by rendering no rules. That produces the gap.
- Content inside a band defaults to `z-index:auto` and therefore paints *below*
  the band's rules — preserving the current look.
- Any component that needs to sit *above* the rules gets `position:relative;
  z-index:2` within its band.

This gives all three behaviours — remove, keep, raise-above — from one
primitive, with no magic offsets and no page-height arithmetic.

Bands are finer-grained than sections. Several sections need rules removed from
only their *title* band while keeping them in the content band below, so band
boundaries follow the existing horizontal hairlines, not the `<section>` tags.

Band rules do **not** animate in. Only the two outer page-level rules keep
`ruleDown`. Scroll-triggered rule animation is explicitly not wanted.

**Alternative if you find a blocker:** CSS `mask-image` on continuous rules with
per-section gradient stops. It works but it's brittle — the stops depend on
document offsets that change with content. Don't reach for it unless the band
approach fails, and say so if you do.

*Verify:* after commit 3 the rendered page is pixel-identical to the prototype.
If it isn't, the refactor is wrong, not the design.

### 10.1 Rules to 25% / 75%, Work grid to 4 columns — resolved

Rev A left this open across three options. Four launch projects resolve it.

A four-column Work grid puts column borders at 25/50/75. The interior rules sit
at 25 and 75, so **two of the three card borders carry a rule exactly and
nothing jogs** — the outcome rev A's option (b) promised but couldn't have,
because it assumed a card count that didn't exist yet.

Two things this also fixes for free:

- The footer is `repeat(4,1fr)`. Its cell borders land at 25/50/75 and now align
  to the rules. At 33.3/66.6 they never did.
- The rules stop cutting through Work card interiors, which is what forced the
  compromise in the first place.

Cards land at 360px at 1440. **Verify before locking:** the 34px card titles,
and specifically the `STACK` / `ROLE` cells, which are an internal `1fr 1fr`
inside 360px minus padding — about 148px per cell. `React · .NET · SQL` at 14px
mono is roughly 151px and will overflow. Either shorten the stack strings, allow
a two-line wrap with tightened line-height, or drop the cell font a step.

This breaks at 5 and 6 projects. That's accepted: the 5th is uncommitted and
`grid-template-columns` is not a one-way door.

`rule-left` and `rule-right` are the tokens. Never hard-code them twice.

*Verify:* rules align to card borders wherever both are visible; no rule lands
within 24px of a text edge in any section.

### 10.2 Work — cut the filter tabs

Remove the `role="tablist"` group, the four filter buttons, and the
`SHOWING n / 6` counter. Reinstate at six projects.

Three reasons. With four cards most filters return a single result, so the
control invites a click that appears to do nothing. It reclaims one of the three
permitted `vermilion` slots (the active tab was one). And the markup is
incorrect ARIA — `role="tab"` with no `tabpanel` and no `aria-selected` is worse
than no ARIA at all; if it ever comes back it should be toggle buttons with
`aria-pressed`, not tabs.

The `SHOWING n / 6` cell may stay as a static count if the row looks empty
without it — that's a judgment call once it's on screen.

### 10.3 Hero — remove both interior rules

The hero band renders outer rules only. ✕ registration marks at all four corners
stay. The ASCII field and the name lockup are unaffected.

*Verify:* nothing crosses the ASCII field or the `Luke Roxburgh` headline.

### 10.4 Experience — remove the left interior rule from the timeline band

**This is a change from rev A**, which kept Experience's rules and constrained
the prose instead. Run the numbers at the new rule position and that no longer
works.

Experience is `1fr 1fr`, so the timeline occupies 0–720px. Its text starts at
128px (32px section padding + 96px date gutter). A rule at 25% is at 360px.
Requiring 24px of clearance leaves 208px of usable width — about **26
characters** of 13px JetBrains Mono. Reducing the date gutter to 72px as rev A
suggested buys it back to roughly 30ch. Neither is usable for prose, and the
26px display job titles are worse: `Senior Nightfill Team Member` needs roughly
350px and has 208.

The timeline already draws its own vertical dimension line. A second competing
vertical rule 360px in was visually noisy even when it fit.

So: the timeline band renders the **right** interior rule only. The right rule
at 75% (1080px) falls inside the resume column and passes behind the resume
frame, which is raised in 10.8.

Prose keeps its `55ch` cap for reading comfort, not for clearance.

### 10.5 Activity — remove the left interior rule from the heatmap band

The heatmap is 52 columns of 13px cells with 3px gaps — roughly 829px of grid,
starting after the day-label column at about x=72px, so it occupies x≈72 to
x≈901 inside the container. The left interior rule at 360px falls inside that
span. The right at 1080px is clear of it.

Drop the left interior rule for the heatmap band, keep the right, resume both in
the next band. Confirm visually rather than trusting the arithmetic — cell count
and gaps may shift once real API data replaces the seeded array.

*Verify:* no rule crosses a contribution cell at 1440, 1280 or 1024.

### 10.6 Hobbies — remove interior rules from both content bands and the title band

The two-column hobby prose blocks and the `Hobbies.` heading band all render
outer rules only. Rules resume in the next section.

### 10.7 Start a project — remove interior rules from the title band

The `Start a project.` heading band renders outer rules only. The form band
below **keeps** its rules; the form is raised above them instead (10.8).

Work, Gallery and the footer keep interior rules throughout.

### 10.8 Raise these components above the rules

Each gets `position:relative; z-index:2` inside its band. All have opaque
`paper-2` fills, so rules disappear behind them and reappear in the surrounding
gutters — which is the intended reading.

- The resume preview frame in Experience.
- The gallery cards.
- The Start a project form container (the whole bordered block, not the
  individual field cells).

*Verify:* rules are continuous in the gutters above and below each raised
component, and cleanly interrupted behind it. No rule visible *through* a card.
Check the gallery in particular — it's a CSS `columns` layout, so stacking
behaviour there is worth an extra look.

### 10.9 Resume — move the meta line under the button

`PDF · pending file` currently sits inline beside `DOWNLOAD RESUME` in a flex
row, and a rule cuts through it. Stack it underneath the button instead.

Two notes while you're in there. The meta string uses a middle-dot separator,
which is on the do-not list — replace it with a plain space or a hairline
divider. And it reads as placeholder; once a real PDF exists it should state
something useful (file size, last updated) or be removed.

**Middle dots are also used throughout the `STACK` data cells** (`React · .NET ·
SQL`, `Electron · MQTT`). Rev A's do-not list and its own prototype data
disagree. Resolve it in the data, not just the resume line.

*Verify:* no rule passes through the meta line at any breakpoint.

### 10.10 Rename "Off the clock" to "Hobbies"

Heading, nav link, section `id` (`#offtheclock` → `#hobbies`) and the anchor
href. The shorter nav label also helps 10.12.

### 10.11 Sticky nav

Header sticks to the top on scroll.

Three traps, all real:

- **`overflow-x:hidden` on the page wrapper will break `position:sticky`.** It
  computes `overflow-y` to `auto`, creating a scroll container the sticky
  element resolves against instead of the viewport. Replace with
  `overflow-x:clip`, which doesn't create a scroll container, or move the hidden
  overflow to `html`. Test in Safari specifically.
- **Z-index.** The header is currently `z-index:4`. It must clear the rule
  overlay but stay *under* the modals: the case drawer is at 20/21, the lightbox
  at 30. Put the sticky header around 10.
- **The header will eat the outer rules.** It needs an opaque `paper` background
  once sticky, or content scrolls through it — but that background then covers
  the two page-level outer rules wherever the header sits, and the drafting grid
  appears severed at the top of the viewport. **Have the header draw its own
  rule segments** at all four offsets so the grid runs unbroken through it. This
  looks wrong immediately if skipped.

Keep the bottom hairline; that's what separates the header from content sliding
under it.

The hero uses `height:calc(100vh - 51px)` to account for the header. Sticky
elements stay in normal flow, so that stays valid — but re-measure if the header
height changes in 10.12, and switch `100vh` to `100dvh` (see 11.1).

*Verify:* header stays put through a full scroll; opening the lightbox covers it
completely; hero fills exactly one viewport with no scrollbar at load.

### 10.12 Fix the overflowing nav

The header is a three-part flex row (name + timezone, five nav links at 28px
gaps, CTA button) with 32px horizontal padding and no wrap or shrink handling,
so it overflows below ~1100px.

Make it hold. Some combination of: reduce the nav gap, let the nav group shrink,
drop the `BNE / UTC+10` meta below a threshold, shorten the CTA label. Renaming
to "Hobbies" already reclaims some width.

Below tablet it collapses to a bordered menu toggle — a bordered box in the
drafting language, not a hamburger. See 11.1.

*Verify:* no horizontal overflow at 1440, 1280, 1024, 768 and 375, with the
sticky header active.

## 11. Requirements rev A didn't cover

### 11.1 Mobile

Rev A specified this in one sentence and then tested it in an acceptance
criterion. It's roughly a third of the remaining work. Specify it before
building it.

Every one of these is a multi-column desktop layout with no mobile behaviour
defined:

| Element | Desktop | Needs |
|---|---|---|
| Section headings | 112px | ~40–48px at 375. Fit per string, don't clamp blindly |
| Work grid | 4 cols | 1 col. Card data cells stay 2-up |
| Experience | `1fr 1fr` | Stack. Timeline above resume |
| Timeline | 96px date gutter | Dates move above the title, gutter collapses |
| Gallery | `columns:4` | 2 at tablet, 1 at 375 |
| Footer | `repeat(4,1fr)` | 2×2 |
| Form | `1fr 1fr` top row | Stack |
| Heatmap | ~829px minimum | Horizontal scroll inside its own container, with the scroll affordance made visible. Never let it widen the page |
| Nav | 5 links inline | Bordered menu toggle |
| Hero | `calc(100vh - 51px)` | `100dvh` — `100vh` on mobile is measured against the collapsed address bar and the hero will be clipped |

**Interior rules are dropped below the tablet breakpoint.** Outer rules and
registration marks stay. At 375 there is no room for a three-column measured
system and forcing one produces exactly the glyph collisions criterion 1
forbids.

### 11.2 The ASCII hero has no lifecycle

`draw()` rebuilds and reflows the full text content of the `<pre>` every frame —
at 1440 that's roughly 166 columns × 73 rows, about 12,000 characters, at 60fps,
**forever**, including while the reader is at the footer.

It needs:

- **IntersectionObserver** — stop the rAF loop when the hero leaves the
  viewport, restart when it returns.
- **`visibilitychange`** — stop when the tab is backgrounded.
- **Frame cap** at 30fps. The effect does not read as smoother at 60.
- **Lower cell resolution on small viewports**, and consider not running it at
  all below the tablet breakpoint — it's the most expensive thing on the page
  and phones pay the most for it.

### 11.3 Reduced motion — currently asserted, not implemented

Rev A's criterion 7 describes behaviour the prototype does not have.

- There is **no `@media (prefers-reduced-motion: reduce)` block** in the
  stylesheet. `ruleDown` and `riseIn` still run. They must not.
- `this.reduced` is read once in `componentDidMount` and never re-read. Listen to
  the media query's `change` event so toggling the OS setting takes effect.
- The single static ASCII frame and the disabled cursor sampling are correct in
  the prototype. Keep both.

### 11.4 SEO, social and metadata — entirely absent

There is no `<title>`, description, canonical, OG image, sitemap, `robots.txt`
or structured data anywhere in the prototype.

For audience 1 — someone opening a link from a job application — **the OG card
is the first impression**, before the site even loads. It renders in Slack,
LinkedIn, iMessage and Gmail previews.

- `<title>`, meta description, canonical.
- OG + Twitter card tags.
- **An OG image in the design language:** the ASCII field, the name, `SHEET 01 /
  REV A`. Generate it with Satori or export one PNG — either is fine, but it
  should not be a screenshot of the page.
- `sitemap.xml` and `robots.txt`, including the `/work/*` routes.
- JSON-LD `Person` / `ProfilePage`.
- A 404 page in the design language.

### 11.5 Accessibility beyond the modals

Rev A's criterion 8 covers focus trap and Escape. These are also required, and
none of them exist yet:

- **A skip link** to main content.
- **Escape closes both modals.** There is no keydown handler anywhere in the
  prototype — this is 0% built, not partially built.
- **Focus returns** to the triggering element on close. The case drawer needs
  `role="dialog"` and `aria-modal`.
- **The lightbox has no close button** and no keyboard path out. Closing on
  click-anywhere is not an accessible affordance on its own.
- **The heatmap is 364 `<div>`s carrying `title` attributes.** `title` is not an
  accessible name and this is invisible to screen readers. Give the grid
  `role="img"` with a summarising `aria-label`, or render a visually-hidden
  table.
- **The scope slider** has an `aria-label` but announces as "2". It needs
  `aria-valuetext` carrying the human string.
- **Form errors** aren't associated with fields or announced. Needs
  `aria-describedby`, `aria-invalid`, and a `role="alert"` live region. The
  current single message replaces rather than points at the offending field.
- **Registration marks (`✕`) are decorative** and should be `aria-hidden`.

### 11.6 Contrast — rev A's criterion 9 was aimed at the wrong colour

Rev A worried about `graphite` on `paper-2` at 10px. Measured, that's
**6.2:1** — and `graphite` on `paper` is **5.7:1**. Both pass WCAG AA
comfortably at every size they're used. **Don't spend time there.**

The actual failure is **`rule` (`#C4BFB2`) used as a text colour, at ~1.5:1**:

- `CLICK ANYWHERE TO CLOSE` in the lightbox — a real instruction, unreadable.
- `titleColor: "#C4BFB2"` on empty project cards at 34px, which fails even the
  3:1 large-text threshold. Those cards are cut anyway, but if any "coming soon"
  state survives it uses `graphite`.
- The `✕` registration marks are decorative and are fine as-is once
  `aria-hidden`.

Rule of thumb going in: **`rule` draws lines. `graphite` writes words.**

## 12. Do not

- Round card corners or add soft grey shadows.
- Turn sections into identical rounded cards regardless of content.
- Add tracked-out all-caps eyebrow labels above headings.
- Join meta strings with middle dots (`A · B · C`) — including in `STACK` cells.
- Animate sections into view on scroll.
- Use `#0B0B0B` or `#111` in place of the warm near-black.
- Use `rule` as a text colour.
- Ship the `DEMO: TOGGLE FAILURE STATE` button.
- Ship placeholder or "awaiting content" project cards.
- Let `vermilion` creep into the Gallery section. The art brings its own colour;
  that section stays neutral by design.
- Reach for MailChannels, however many tutorials suggest it.

## 13. Acceptance criteria

1. No hairline rule passes through any glyph, anywhere, at 1440 / 1280 / 1024 /
   768 / 375.
2. Rules are interrupted only where 10.3–10.7 specify, and resume in the
   following band at the same offset.
3. Rules pass behind the components in 10.8 and are visible in the gutters
   either side of them.
4. Interior rules align to Work card and footer cell borders at 25% and 75%.
5. Sticky header holds through scroll, draws unbroken rule segments, sits above
   page content and below both modals.
6. No horizontal overflow at any tested width. The heatmap scrolls inside its
   own container.
7. Every hover state that exists in the markup actually fires.
8. `prefers-reduced-motion` renders one static ASCII frame, runs no rule or rise
   animation, and responds to the setting changing at runtime.
9. The hero rAF loop stops when the hero is offscreen and when the tab is
   hidden.
10. Keyboard navigable end to end with visible focus rings; both modals trap
    focus, close on Escape, and return focus to their trigger.
11. `rule` is used as a text colour nowhere.
12. `/work/<slug>` returns a real rendered page on direct navigation with JS
    disabled.
13. Three font files requested, not eight.
14. Lighthouse: performance ≥ 95 and accessibility 100 on the home page at
    desktop and mobile.

## 14. Deferred — not in this revision, not forgotten

**Explicitly deferred by Luke**, to be picked up in order:

1. **Case-study page template.** The richer design for `/work/[slug]`. The
   routes and data plumbing ship in this revision; the template does not.
2. **Real project content.** Blurbs, metrics, case-study bodies for
   AssetCheckout, Pallet 2.0, Canopy and Hercules App.
3. **Assets.** Resume PDF, gallery images, LinkedIn URL, the two hobby
   paragraphs, and the hero's one mono line — currently literally `Placeholder
   mono line for now.`, and the single most important line of copy on the site.

**Open items to resolve when the relevant work comes up:**

- **Hercules App is a private repo.** The other three link to source; Hercules
  can't. Its card needs a different secondary affordance — likely a `PRIVATE
  REPO` data cell rather than a dead link.
- **The resume viewer.** A native `<object>` embed is the zero-dependency route
  and renders fine on desktop, but **mobile browsers frequently refuse to render
  an inline PDF** — iOS Safari especially. Plan for the hairline frame plus
  download button as the mobile presentation. PDF.js at ~350KB is not worth it
  for a resume. **Also consider a real HTML resume page** in the same design
  language: better for SEO, accessibility and anything ATS-adjacent, and it
  costs one route.
- **`Woolsworth` → `Woolworths`** in the Experience data. Also confirm the
  timeline dates read as start dates — `SEP 2020` sits next to body copy reading
  "To December 2025", which is confusing as presented.
- **`Electron · MQTT` vs LAN discovery for Canopy.** The prototype card and
  `Canopy/HANDOFF.md` disagree about the transport. Confirm before it's printed
  in a data cell.
- **`Pallet/Cargo.toml` declares `repository = "github.com/lukeroxburgh/pallet"`.**
  The handle is `LASR-0`; that URL 404s. One-line fix in the Pallet repo.
- **Work filters** return at six projects, as toggle buttons with `aria-pressed`,
  not tabs — and with a taxonomy that has somewhere to put a private personal
  app.
- **The form's success state is client-only** and lost on refresh. No
  confirmation email is sent to the sender.
