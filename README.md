# The Standard Model Explorer

An interactive guide to the Standard Model of particle physics, built with SvelteKit and deployed
to GitHub Pages.

- **Particles** — the 17 elementary particles as collectible cards: a glowing 3D orb, stats drawn
  from real physics (stability, mass, charge…), types, interaction partners, moves and evolutions.
- **Particle Lab** — combine quarks into hadrons, hadrons into nuclei and nuclei with electrons into
  atoms; split them apart; run decays and see which quantities are conserved.
- **Particle Dex** — collect every particle: build hadrons, nuclei and atoms in the lab to unlock
  them, run reactions to record moves, and earn badges for completing sets.
- **Interactions** — the strong, electromagnetic and weak forces and the Higgs field, which
  particles feel each one, and example processes.
- Light and dark themes (follows your OS; toggle in the header).

See [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) for the glass design system (live at `/design`), [docs/GAMIFICATION.md](docs/GAMIFICATION.md) for the game roadmap and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code is organised, the physics model
and the deployment pipeline.

## Development

Requires Node 24 (npm 11).

```sh
npm install
npm run dev      # start the dev server
npm test         # unit tests for the physics library
npm run check    # type-check
npm run lint     # prettier + eslint
npm run build    # static site in build/
```

Set `BASE_PATH` (e.g. `/standard-model`) when building for a sub-path such as GitHub Pages.
