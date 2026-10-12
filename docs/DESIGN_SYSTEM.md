# Design system

Everything in the app is built from glass: frosted, translucent panes lit along their top edge,
tinted by the colour of what they hold. Tokens live in `src/app.css`; components live in
`src/lib/ui/` and are exported from `#lib/ui/index.ts`. The `/design` page renders every token and
component live, in whichever theme is active.

## Tokens (`src/app.css`)

| Group      | Tokens                                                                                                                   | Notes                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Base       | `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`, `--accent`, `--accent-strong`                       | Light and dark values                               |
| Categories | `--quark`, `--lepton`, `--gauge-boson`, `--scalar-boson`, `--hadron`, `--nucleus`, `--atom`                              | A particle's colour                                 |
| Forces     | `--strong`, `--electromagnetic`, `--weak`, `--higgs`                                                                     | Type badges, force cards                            |
| Glass      | `--glass-tint`, `--glass-tint-2`, `--glass-edge`, `--glass-line`, `--glass-shadow`, `--glass-reflection`, `--blur-glass` | Milky white in light, smoky in dark                 |
| Shape      | `--radius-sm` 8px, `--radius-md` 12px, `--radius-lg` 16px, `--radius-pill`                                               |                                                     |
| Spacing    | `--space-1` … `--space-5` (0.25, 0.5, 0.75, 1, 1.5rem)                                                                   |                                                     |
| Motion     | `--ease-out`                                                                                                             | All animation is off under `prefers-reduced-motion` |

`.on-dark` re-scopes the text and glass tokens to their dark values for surfaces that stay dark in
both themes: the full-screen viewer and a card's art window.

## Components (`src/lib/ui`)

| Component          | Use it for                              | Props                                                                                        |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `GlassCard`        | Every panel, card and list item surface | `as` (element), `glow` (colour), `shine` (animated rim + sheen), `ghost` (locked), `padding` |
| `Button`           | Every button                            | `variant` primary / secondary / ghost, `size` sm / md / lg, `icon` (round, one glyph)        |
| `Chip`             | Small pills, usually orb + symbol       | `onclick` (makes it a button), `locked`, `title`                                             |
| `Badge`            | Solid uppercase labels                  | `color`                                                                                      |
| `SectionLabel`     | Small uppercase headings inside a card  | `as` (h2–h4)                                                                                 |
| `SegmentedControl` | Mutually exclusive options in one pill  | `options`, `bind:value`, `label`                                                             |
| `ProgressBar`      | Stat bars, dex progress                 | `value`, `max`, `fill` (colour or gradient), `height`, `label`                               |

Domain components build on these: `TypeBadge` is a `Badge` per force, `StatBars` is a list of
`ProgressBar`s, `ViewModeToggle` is a `SegmentedControl`, `ParticleCard` is a shining `GlassCard`,
and particle tiles use the same glass recipe tinted with the particle's colour.

## Rules

- No one-off panels or buttons: use `GlassCard` and `Button`. Styling a component's root from a
  parent needs `:global(.your-class)`, since Svelte scopes styles per component.
- `shine` is for one featured thing per view (the particle card, the full-screen stats, an
  unlock pop-up, an earned badge); everywhere else, plain or `glow`.
- When writing CSS with `-webkit-` prefixes, put the prefixed line **first**: the minifier keeps only
  the last of a pair, and Chrome needs the standard one (`backdrop-filter`, `mask-composite`).
