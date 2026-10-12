# Architecture

The Standard Model Explorer is a static SvelteKit site. Every route is prerendered at build time
and served as plain files from GitHub Pages; there is no server.

```
src/
├── app.css, app.html        Global styles, theme tokens, no-flash theme script
├── routes/                  Pages (all prerendered via +layout.ts)
│   ├── +page.svelte         /              The Standard Model table
│   └── interactions/        /interactions  The four interactions and who feels them
└── lib/
    ├── components/          Svelte UI: ParticleTile, ParticleDetails, ThemeToggle
    └── physics/             Framework-free TypeScript, unit-tested with Vitest
        ├── types.ts         Particle, Reaction, Force, quantum numbers
        ├── elementary.ts    The 17 elementary particles + generated antiparticles
        ├── composites.ts    Hadrons, nuclei and atoms, defined by their constituents
        ├── reactions.ts     Decays and annihilations
        └── particles.ts     Registry, quantum-number sums, binding energy, formatting
```

Dependencies point one way: **routes → components → physics**. The physics library knows nothing
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

- **Particle Lab** (next PR): combine quarks into hadrons, hadrons into nuclei and nuclei with
  electrons into atoms; split them; run reactions and check conservation of charge, baryon number
  and lepton family numbers.
- Later: Feynman-diagram animations for each reaction, more nuclei and atoms.
