# plan.md — Portfolio site, revision A

Handover brief for the implementing agent. You have full codebase context; I
don't. Nothing here is a file-level prescription — it's intent, constraints,
and what to verify. Where I name a selector or a pixel value it's because I
read it out of the prototype and it's a fact worth carrying, not an
instruction about where your code should live.

Work in small commits, in the order in section 6. Verify each one in a browser
before moving to the next.

---

## 1. What this is

A personal portfolio site for Luke Roxburgh — IT support and internal-tooling
developer in Brisbane, Australia. Builds internal apps for a ~300-user org,
plus open-source side projects, and paints and draws digitally.

The site is a resume, a project showcase, an art gallery, and a way for
someone to start a paid project conversation.

Audience, in priority order:

1. Hiring managers and technical leads scanning fast for evidence he can build.
2. People who might pay him to build something, arriving from a referral.
3. Other developers and artists who followed a link out of curiosity.

It has to survive a 20-second skim from group 1 and reward a slow scroll from
group 3.

## 2. Visual direction

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
  stats as tables rather than prose, huge squarish techno display type set
  edge to edge, boxed arrow affordances, filter tabs. Not its greyscale
  coldness.
- **Fumayo bookshop page.** The paper-toned base, a coral accent doing real
  work rather than decorating, visible guide lines running the full page
  height, confidence to leave areas empty, asymmetric block placement. Not its
  illustration style or soft rounded sans.
- **motion.dev.** Dense small-type meta rows, numbered chapter markers down the
  page, section headings as short declarative sentences ending in a full stop.
  Numbering is only applied where content is genuinely sequential — Work,
  Experience, Activity are numbered 01/02/03; Gallery, Hobbies and Start a
  project are not.

## 3. Design tokens

These are already in the prototype as literals. Lift them into real tokens
(CSS custom properties or your framework's equivalent) as part of the first
commit — every change below references them by name.

| Token | Hex | Use |
|---|---|---|
| `paper` | `#EAE7DE` | Page base |
| `paper-2` | `#F2F0EA` | Card and cell fills |
| `ink` | `#171614` | All text, warm near-black, never `#000` |
| `rule` | `#C4BFB2` | Every hairline, grid line, registration mark |
| `vermilion` | `#E8452B` | The single accent |
| `graphite` | `#5C5850` | Secondary and meta text only |

Heatmap intensity ramp: `#F2F0EA` → `#F6C9C0` → `#F09480` → `#EC6A4F` → `#E8452B`.

Hard rules: `vermilion` appears at most three times in any single viewport;
no gradients, no drop shadows, no border radius anywhere except the pill
filter tabs.

**Type.** Two families. Chakra Petch (display — headings and hero only, 600/700,
`-0.03em` tracking, `0.9` line-height). JetBrains Mono (everything else —
body, labels, nav, data cells, ASCII field). Mono body is deliberate and it
constrains the writing: prose caps at 55ch with `1.7` line-height. If a
paragraph runs longer than four lines the copy is wrong, not the typeface.

No tracked-out all-caps eyebrows above headings — the numbered markers do that
job. No `→` appended to link text; arrows live in their own bordered box.

**Motion.** One orchestrated page-load sequence, then nothing automatic.
Everything else answers a click, hover, or scroll input. No fade-and-slide-up
on section entry. `prefers-reduced-motion` renders the hero as a single static
ASCII frame — the prototype already handles this in `componentDidMount`; keep
that behaviour.

## 4. Current state of the prototype

`Portfolio_dc.html` + `support.js` is a Claude Design prototype, not production
code. Before anything else, understand what does and doesn't survive the port:

- Markup uses `sc-for`, `sc-if`, `{{ }}` interpolation and a `DCLogic` base
  class from the bundled runtime. All of that is prototype scaffolding.
- Every style is a giant inline `style` attribute string.
- `style-hover="..."` attributes appear throughout. **The runtime does not
  implement them** — grep the bundle and you'll find no handler. Every hover
  state in the prototype is currently dead. They need rebuilding as real CSS,
  and they need testing, because none of them have ever run.
- All content is placeholder or seeded: the resume is a hatched empty frame,
  gallery tiles are hatch fills, heatmap data is generated from a seeded LCG in
  the constructor, three of six project cards are literal "Card slot" entries,
  the LinkedIn footer cell says "placeholder".
- The "DEMO: TOGGLE FAILURE STATE" button under the heatmap is a prototype
  affordance. It must not ship, but keep the `NO SIGNAL` empty state it
  toggles — that state is real and needed.

**Decision needed before you start (see section 5):** whether we're porting to
a real stack or continuing to patch the prototype. Everything below is written
so it applies either way, but the shape of the commits changes.

## 5. Decisions to confirm with Luke first

Do not start until these are answered. Ask them together in one message.

1. **Port or patch.** Rebuild in a real stack (React/Vite or Next, real CSS or
   Tailwind, Motion for animation) with this prototype as the visual reference,
   or keep iterating the DC prototype for now? Recommendation: port. Dead hover
   states and 500 lines of inline styles will make every subsequent change
   slower, and the rule-band work below is much cleaner with real components.
2. **Interior rule position.** See section 7.1 — moving the rules out breaks
   their alignment with the Work card grid, and there are three ways to
   resolve it. Needs his call.
3. **Real content.** The resume PDF, gallery images, LinkedIn URL, three more
   projects, and the two hobby paragraphs are all still placeholder. Confirm
   whether this revision ships with placeholders intact or waits on assets.

## 6. Commit sequence

Small commits, tested in a browser before each push.

1. Tokens extracted; hover states rebuilt as real CSS and verified working.
2. Rule-band mechanism built and applied with rules in their current positions
   — pure refactor, page should look identical. **Screenshot before and after
   and diff them.**
3. Per-band rule removals (7.2–7.6).
4. Per-component z-index raises (7.7).
5. Resume meta-line and Experience text-width fixes (7.8, 7.9).
6. Rename Off the clock → Hobbies (7.10).
7. Sticky nav + nav sizing (7.11, 7.12).
8. Interior rule reposition (7.1) — last, because it's the one that can
   cascade, and by then everything else is stable.

## 7. The changes

### 7.0 The mechanism — read this before anything else

**Current implementation.** One page-level overlay, `position:absolute;
inset:0; pointer-events:none; z-index:3`, inside the `max-width:1440px`
container. It holds four full-height 1px divs at `left:0`, `left:33.333%`,
`left:66.666%`, `right:0`. Sections are `position:relative` with no z-index,
so they stack below the overlay and the rules paint over all content.

**Why it can't stay.** Continuous full-height rules can't be interrupted for
one band and resumed in the next. That's the core of this revision.

**Recommended mechanism.** Move the two interior rules off the page level and
render them per horizontal band instead:

- The two **outer** rules (`left:0`, `right:0`) stay page-level and continuous.
  They keep the staggered `ruleDown` load animation.
- Introduce a **rule band** primitive — a wrapper that any horizontal band of
  content sits inside. It's `position:relative` and draws the interior rules as
  its own children, absolutely positioned at the shared offset tokens, spanning
  only that band's height, `pointer-events:none`, at `z-index:1` within the
  band's local stacking context.
- A band opts out by rendering no rules. That produces the gap.
- Content inside a band defaults to `z-index:auto` and therefore paints *below*
  the band's rules — preserving the current look.
- Any component that needs to sit *above* the rules gets `position:relative;
  z-index:2` within its band.

This gives all three behaviours Luke asked for — remove, keep, raise-above —
from one primitive, with no magic offsets and no page-height arithmetic.

Bands are finer-grained than sections. Several sections need rules removed from
only their *title* band while keeping them in the content band below, so band
boundaries follow the existing horizontal hairlines, not the `<section>` tags.

Band rules do **not** animate in. Only the two outer page-level rules keep
`ruleDown`. Scroll-triggered rule animation is explicitly not wanted.

**Alternative if you find a blocker:** CSS `mask-image` on the continuous
rules with per-section gradient stops. It works but it's brittle — the stops
depend on document offsets that change with content. Don't reach for it unless
the band approach fails, and say so if you do.

*Verify:* after commit 2 the rendered page is pixel-identical to the current
prototype. If it isn't, the refactor is wrong, not the design.

### 7.1 Move the interior rules outward — ⚠ needs Luke's decision

Currently `33.333%` / `66.666%`. Luke wants them further out.

**The conflict:** the Work section's card grid is `repeat(3,1fr)` across the
full container, so its column borders land at exactly 33.333% and 66.666%. The
interior rules currently sit *on top of* those borders, which is why the Work
grid reads cleanly. Move the rules and they'll start cutting through card
interiors.

Three ways out — put these to Luke:

- **(a) 28% / 72%, Work keeps 33.333% / 66.666%.** Everything else gains
  breathing room; the rules jog at the Work section's top hairline. On a
  drafting sheet a change of ruling at a sheet division is defensible, but it
  is visible.
- **(b) 25% / 75%, Work grid becomes four columns.** Column borders land at
  25/50/75, so two of three align to the rules exactly and nothing jogs. Cards
  drop to ~360px wide at 1440 — verify the 34px card titles and the data cells
  still breathe at that width before recommending it.
- **(c) Leave them at 33.333% / 66.666%.** The band removals in 7.2–7.6 solve
  most of what Luke is actually reacting to. Cheapest option; worth saying so.

Whichever wins, the offsets become two shared tokens referenced by both the
rule bands and any layout that needs to align to them. Never hard-code them
twice.

*Verify:* rules align to card borders wherever both are visible; no rule lands
within 24px of a text edge in any section.

### 7.2 Hero — remove both interior rules

The hero band renders outer rules only. ✕ registration marks at all four
corners stay. The ASCII field and the name lockup are unaffected.

*Verify:* nothing crosses the ASCII field or the `Luke Roxburgh` headline.

### 7.3 Activity — remove the interior rule that crosses the heatmap

The heatmap grid is 52 columns of 13px cells with 3px gaps, starting after the
day-label column, so it occupies roughly x=76px to x=910px inside the
container. The left interior rule falls inside that span at any of the
positions in 7.1; the right one (66.666% = 960px, or 72% = 1037px) falls in
clear space beyond the grid's right edge.

So: drop the left interior rule for the heatmap band, keep the right one, and
resume both in the next band. Confirm visually rather than trusting my
arithmetic — cell count and gaps may shift once real API data replaces the
seeded array.

*Verify:* no rule crosses a contribution cell at 1440, 1280 or 1024.

### 7.4 Hobbies — remove interior rules from both content bands and the title band

The two-column hobby prose blocks and the `Hobbies.` heading band all render
outer rules only. Rules resume in the next section.

### 7.5 Start a project — remove interior rules from the title band

The `Start a project.` heading band renders outer rules only. The form band
below **keeps** its rules; the form is raised above them instead (7.7).

### 7.6 Bands that keep their rules

Work, Experience, Gallery and the footer keep interior rules throughout.
Changes there are z-index and text-width only.

### 7.7 Raise these components above the rules

Each gets `position:relative; z-index:2` inside its band. All four have opaque
`paper-2` fills, so the rules will simply disappear behind them and reappear
in the surrounding gutters — which is the intended reading.

- The resume preview frame in Experience.
- The gallery cards.
- The Start a project form container (the whole bordered block, not the
  individual field cells).

*Verify:* rules are continuous in the gutters above and below each raised
component, and cleanly interrupted behind it. No rule visible *through* a
card. Check the gallery in particular — it's a CSS `columns` layout, so
stacking behaviour there is worth an extra look.

### 7.8 Resume — move the meta line under the button

`PDF · pending file` currently sits inline beside `DOWNLOAD RESUME` in a flex
row, and a rule cuts through it. Stack it underneath the button instead. The
rule stays in this band.

Two notes while you're in there: the meta string uses a middle-dot separator,
which is on the do-not list in section 8 — replace it with a plain space or a
hairline divider. And it currently reads as placeholder text; once a real PDF
exists it should state something useful (file size, last updated) or be
removed.

*Verify:* no rule passes through the meta line at any breakpoint.

### 7.9 Experience — tighten the timeline prose

Don't remove the rule here; constrain the text so it clears it.

Express the constraint relative to the rule position, not as a magic number:
**timeline prose must end at least 24px clear of the left interior rule.** The
timeline block starts at 128px (32px section padding + 96px date gutter), so
at a 28% rule that's ~250px of usable width, around 32ch of JetBrains Mono at
13px. At 33.333% it's closer to 40ch.

If 32ch feels too cramped, buy characters back by reducing the date gutter from
96px to ~72px rather than by letting the text run under the rule.

Applies to the paragraphs and the job titles. The 26px display-face titles are
the ones most likely to collide.

*Verify:* at the final rule position, no line of Experience text touches or
crosses a rule.

### 7.10 Rename "Off the clock" to "Hobbies"

Heading, nav link, section `id` (`#offtheclock` → `#hobbies`) and the anchor
href. The shorter nav label also helps 7.12.

### 7.11 Sticky nav

Header sticks to the top on scroll.

Two traps, both real:

- **`overflow-x:hidden` on the page wrapper will break `position:sticky`.** It
  computes `overflow-y` to `auto`, creating a scroll container that the sticky
  element resolves against instead of the viewport. Replace it with
  `overflow-x:clip` (which doesn't create a scroll container) or move the
  hidden overflow to `html`. Test in Safari specifically — `clip` support is
  more recent there.
- **Z-index.** The header is currently `z-index:4`. It needs to clear the rule
  overlay but stay *under* the modals: the case-study drawer is at 20/21 and
  the gallery lightbox at 30. Put the sticky header around 10. If it lands
  above 20 it'll float over the lightbox.

The header also needs an opaque `paper` background once it's sticky — it's
currently transparent and content will scroll through it. Keep the bottom
hairline; that's what separates it from the content sliding under.

The hero uses `height:calc(100vh - 51px)` to account for the header. Sticky
elements stay in normal flow, so that stays valid — but re-measure if the
header height changes in 7.12.

*Verify:* header stays put through a full scroll; opening the gallery lightbox
covers it completely; hero fills exactly one viewport with no scrollbar at load.

### 7.12 Fix the overflowing nav

The header is a three-part flex row (name + timezone, five nav links at 28px
gaps, CTA button) with 32px horizontal padding and no wrap or shrink handling,
so it overflows below ~1100px.

Make it hold. Some combination of: reduce the nav gap, let the nav group
shrink, drop the `BNE / UTC+10` meta below a threshold, and shorten the CTA
label. Renaming to "Hobbies" already reclaims some width.

Below tablet it should collapse to something deliberate rather than squeezing —
the design language suggests a bordered menu toggle over a hamburger, but
that's your call to propose.

*Verify:* no horizontal overflow at 1440, 1280, 1024, 768 and 375. Check with
the sticky header active, since that's when overflow becomes most visible.

## 8. Do not

- Round card corners or add soft grey shadows.
- Turn sections into identical rounded cards regardless of content.
- Add tracked-out all-caps eyebrow labels above headings.
- Join meta strings with middle dots (`A · B · C`) — there's one in the resume
  meta line to remove.
- Animate sections into view on scroll.
- Use `#0B0B0B` or `#111` in place of the warm near-black.
- Ship the `DEMO: TOGGLE FAILURE STATE` button.
- Let `vermilion` creep into the Gallery section. The art brings its own
  colour; that section stays neutral by design.

## 9. Acceptance criteria

1. No hairline rule passes through any glyph, anywhere, at 1440 / 1280 / 1024 /
   768 / 375.
2. Rules are interrupted only where 7.2–7.5 specify, and resume in the
   following band at the same horizontal offset.
3. Rules pass behind the four raised components in 7.7 and are visible in the
   gutters either side of them.
4. Sticky header holds through scroll, sits above page content and rules, and
   below both modals.
5. No horizontal overflow at any tested width.
6. Every hover state that exists in the markup actually fires.
7. `prefers-reduced-motion` still renders a single static ASCII frame and no
   rule animation.
8. Keyboard navigable end to end with visible focus rings; the case-study
   drawer and lightbox trap focus and close on Escape.
9. Contrast passes on `graphite` over `paper` and `paper-2` at every size it's
   used — 10px `graphite` on `paper-2` is the case most likely to fail, and
   there's a lot of it.

## 10. Still open, not in this revision

Flagged so they don't get quietly forgotten:

- The GitHub heatmap is seeded random data. Real contribution data only comes
  from GitHub's GraphQL API and needs a token, so it has to be fetched at build
  time or through a small proxy. The `NO SIGNAL` state is the fallback.
- The Start a project form validates but doesn't submit anywhere.
- Resume PDF, gallery images, LinkedIn URL, three project cards and the two
  hobby paragraphs are placeholder.
- Hero subheading is literally `Placeholder mono line for now.`
