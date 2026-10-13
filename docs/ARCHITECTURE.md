# Architecture

The Standard Model Explorer is a static SvelteKit site. Every route is prerendered at build time
and served as plain files from GitHub Pages; there is no server.

```
src/
├── app.css, app.html        Global styles, theme tokens, no-flash theme script
├── routes/                  Pages (all prerendered via +layout.ts)
│   ├── +page.svelte         /              The Standard Model table
│   ├── lab/                 /lab           The Particle Lab
│   ├── interactions/        /interactions  The four interactions and who feels them
│   ├── challenges/          /challenges    Quests, puzzles and "balance the reaction"
│   ├── dex/                 /dex           The particle dex and badges
│   └── design/              /design        Live design-system reference
└── lib/
    ├── ui/                  Design system components (GlassCard, Button, …) — docs/DESIGN_SYSTEM.md
    ├── components/          Svelte UI: ParticleCard, ParticleTile, Orb, OrbCanvas, ThemeToggle, …
    ├── game/                Game rules over the physics, plain tested TypeScript — docs/GAMIFICATION.md
    │   ├── collection.ts    The save: discoveries, puzzle bests, balanced reactions; badges
    │   ├── quests.ts        Quest checklist, read off the collection
    │   ├── puzzles.ts       Puzzle levels and their combine / split / react rules
    │   ├── balance.ts       "Balance the reaction" questions and their wrong choices
    │   └── store.svelte.ts  The reactive store: loads and saves, queues unlock pop-ups
    └── physics/             Framework-free TypeScript, unit-tested with Vitest
        ├── types.ts         Particle, Reaction, Force, quantum numbers
        ├── elementary.ts    The 17 elementary particles + generated antiparticles
        ├── composites.ts    Hadrons, nuclei and atoms, defined by their constituents
        ├── reactions.ts     Decays and annihilations
        ├── particles.ts     Registry, quantum-number sums, binding energy, formatting
        ├── lab.ts           Lab operations: combine, split, findReaction, checkConservation
        ├── lifetimes.ts     Mean lifetimes, for the HP stat
        └── stats.ts         Card stats, types, interactions, moves and evolutions
```

Dependencies point one way: **routes → components → game → physics**. The physics library knows nothing
about Svelte, so every physics rule can be tested without a browser, and new particles or
reactions are added as data.

## Physics model

- **Quantum numbers in thirds.** Electric charge and baryon number are stored ×3 (`charge3`,
  `baryon3`) so an up quark is `charge3: 2, baryon3: 1` and all arithmetic stays in integers.
- **Antiparticles are generated.** Each fermion (and the W⁺) is declared once; its antiparticle is
  derived with every additive quantum number negated.
- **Composites derive their quantum numbers.** `composites.ts` lists only constituents, mass and
  spin. `particles.ts` sums the constituents' charge, baryon and lepton numbers, so a proton's
  +1 charge is computed from u + u + d rather than written down.
- **Binding energy** is constituents' mass minus the composite's mass: +28.3 MeV for helium-4,
  about −929 MeV for a proton, whose mass is mostly gluon field energy rather than quark mass.

Known simplifications: the π⁰ is modelled as uū (really a uū/dd̄ mixture), colour charge is not
tracked per quark, and masses are rounded for display.

## Particle Lab

The lab keeps a workbench of particle ids and calls into `lab.ts`:

| Action  | Function                     | Behaviour                                                         |
| ------- | ---------------------------- | ----------------------------------------------------------------- |
| Combine | `combine(ids)`               | Bound state made of exactly these parts, in any order (u+u+d → p) |
| Split   | `split(id)` / `constituents` | Replaces a composite with its parts                               |
| React   | `findReaction(ids)`          | Runs a known process whose inputs match the workbench             |
| —       | `checkConservation(in, out)` | Charge, baryon number and each lepton family number, before/after |

Particles move by drag and drop (`src/lib/dnd.ts`, a pointer-events `draggable` action, so mouse,
pen and touch all work): drag from the palette onto the workbench to add, drag a bench particle off
to remove it. Clicking still works. Drop zones are elements with a `data-drop` attribute.

When nothing forms, the notebook explains why: a fractional baryon number means colour confinement
forbids it; a force carrier on the bench is exchanged between particles, not built with. Every
reaction in `reactions.ts` is unit-tested to conserve all quantum numbers.

## Particle cards

Every particle has a collectible-style card (`ParticleCard.svelte`). Each number on it comes from
real physics in `stats.ts`, scaled to 0–100:

| Stat   | Physics behind it                                       | Scale                                      |
| ------ | ------------------------------------------------------- | ------------------------------------------ |
| HP     | Mean lifetime (stability)                               | Stable = 100; log₁₀(τ/s) from −25 to +5    |
| Power  | Rest mass                                               | log₁₀(m/MeV) from −1 to 5.3                |
| Speed  | Inverse of mass; massless particles move at light speed | 100 for massless, else 100 − Power (min 5) |
| Charge | Absolute electric charge                                | 50 per unit of e                           |
| Reach  | Interactions it takes part in (felt or carried)         | 25 per interaction                         |

- **Types** are the interactions a particle takes part in. Composites take the types of their
  quarks and leptons.
- **Interacts with** lists, force by force, the Standard Model particles on the other side: a
  particle that feels a force couples to its carrier and to everything else that feels it; a
  carrier acts on everything that feels its force.
- **Moves** are the reactions the particle can start; **Evolution** shows what it is made from and
  which composites it fuses into.
- Quarks are never free, so heavy quarks use the lifetime of the lightest hadron carrying them.

### Full screen and constituents

- The ⤢ button on a card opens `ParticleViewer.svelte`: a modal `<dialog>` with a large live orb,
  which also requests browser full screen where allowed, with the stat bars (`StatBars.svelte`,
  shared with the card) beside it. ‹ › buttons, the ← → keys and horizontal swipes (on the orb's stage or the stats card) step through
  discovered particles in dex order, wrapping around. Antiparticles are always part of the
  sequence (each follows its particle), since they start unlocked and are worth comparing side by
  side. In landscape the stats sit beside the orb
  (30vw, at least 240px); in portrait they stack below it (90vw). At every size they sit on the
  same shining frosted-glass card, whose vertical icon tabs switch between Stats,
  Interacts with and Evolution. Dragging inside the orb orbits the
  camera around it (the shader's `view` uniform rotates the fog, while the light stays put), with
  momentum on release; double-click resets. Drags outside the sphere stay swipes. Esc or ✕ closes it.
- Composite particles get a view toggle (`ViewModeToggle.svelte`): **Orb**, **Parts** (direct
  constituents, e.g. ⁴He atom → ⁴He²⁺ + e⁻ + e⁻) and, when different, **Quarks & leptons** (every
  elementary constituent, e.g. 6 u + 6 d + 2 e⁻). `Constituents.svelte` lays the parts on a ring over
  the dimmed orb; each part is clickable and opens its own card.

### Orbs

Each particle is drawn as a translucent glass sphere filled with glowing fog and energy filaments
around a bright core, coloured by its category. Heavier particles are larger, unstable ones swirl
faster with more chaotic filaments and sparks, antiparticles have a dark hollow core inside a bright
membrane, and composites have their constituents orbiting them.

- `src/lib/orb/shader.ts` holds the one fragment shader (GLSL ES 1.00): it raymarches swirling fog
  and filaments inside the sphere, then adds a glass shell (fresnel rim, highlights behind the
  `highlight` uniform) and a halo that fades to transparent. `params.ts` maps a particle to its
  uniforms (radius, turbulence, anti, a per-particle seed); `renderer.ts` compiles and draws it.
- `OrbCanvas.svelte` animates it live on the card, falls back to the CSS orb without WebGL, and draws
  a still frame under `prefers-reduced-motion`.
- `Orb.svelte` (tiles and chips) shows still frames from one shared offscreen WebGL context
  (`snapshots.ts`, cached per particle and theme), turned slowly by CSS under a static glass glint, so
  dozens of orbs never need dozens of WebGL contexts. Orbs redraw when the theme changes.

## Themes

Colours are CSS custom properties in `src/app.css`. The light palette is the default; the dark
palette applies when the OS prefers dark, unless the visitor chose light with the header toggle.
The toggle stores the choice in `localStorage` and sets `data-theme` on `<html>`; a small inline
script in `app.html` applies a saved choice before first paint.

## Build and deploy

`.github/workflows/ci.yml` runs on every pull request and on pushes to `master`:

1. **check** — `npm ci`, lint (Prettier + ESLint), `svelte-check`, Vitest, and a build.
2. **build-pages** (master only) — builds with `BASE_PATH=/<repo name>` and uploads `build/`.
3. **deploy** (master only) — publishes the artifact with `actions/deploy-pages`.

`BASE_PATH` feeds `kit.paths.base` in `vite.config.ts`; locally it is unset and the site runs at `/`.

GitHub Pages must be enabled once under **Settings → Pages → Source: GitHub Actions**.

## Roadmap

- Feynman-diagram animations for each reaction.
- Drag-and-drop on the workbench; more nuclei and atoms.
