---
name: Pallet 2.0
order: 2
kind: Open source
status: Active
dot: active
note: LINUX RELEASE
stack: Rust / Vite
role: Maintainer
year: "2026"
metricLabel: LICENSE
metric: MIT
repo: https://github.com/LASR-0/pallet
blurb: Desktop colour picker and palette manager. Capture, pick, export.
---

<!-- TODO content. Frontmatter is derived from Pallet/Cargo.toml — a Rust
     workspace of eight crates (color, store, export, capture, overlay, hotkey,
     ipc, core) plus three binaries (cli, picker, app) and a Vite/TS UI.
     CONFIRM: what makes this 2.0 — is it a rewrite of the earlier prototype?
     That's the spine of the case study.
     CONFIRM: Cargo.toml still declares repository = lukeroxburgh/pallet, which
     404s. Should be LASR-0. -->

Placeholder. The crate split is the interesting part — capture, overlay and
hotkey are isolated from core so the picker can run without a UI toolkit loaded.
