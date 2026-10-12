# Gamification plan

The player is a particle physicist who collects particles by making them in the lab. The game's
rules are the real physics already in `src/lib/physics` (bound states, reactions, conservation laws,
the forces each particle feels), so playing the game is also learning the Standard Model.

Every phase is a separate PR. Game logic lives in `src/lib/game/` as plain, unit-tested TypeScript;
Svelte components only display it. Progress is saved in the browser (`localStorage`), so the site
stays static on GitHub Pages with no accounts or backend.

## Phase 1 — Collection (in progress)

- **Particle dex** (`/dex`): every particle in the game, in card order. Undiscovered particles show as
  dark silhouettes with a hint, not their name.
- **Discover by doing:** all elementary particles (and their antiparticles) start unlocked.
  Composites (hadrons, nuclei, atoms) unlock the first time they appear on the workbench, by combining
  or as the product of a reaction. Reactions are recorded as discovered "moves" the first time they
  run.
- **Locked composites** appear in the lab palette as silhouettes that can't be picked, so the only
  way to get one is to build it.
- **Progress:** a "discovered / total" count in the nav and on the dex, and badges for completing a
  set: all hadrons, all nuclei, all atoms, all reactions, the whole dex.
- **Unlock moment:** a new discovery pops up with its orb and name; a completed set announces its
  badge.
- **Save data:** one versioned object in `localStorage`, read and written inside try/catch. A
  missing, corrupt or unavailable save means a fresh start, never a crash. The dex has a "Reset
  progress" button.

## Phase 2 — Challenges

- **Quests:** a checklist of goals such as "Make a proton", "Make a hydrogen atom", "Turn a neutron
  into a proton" (beta decay) and "Annihilate matter with antimatter".
- **Puzzles:** a fixed set of starting particles and a target, e.g. "You have u u d d d e⁻ — make a
  neutral atom". Scored by fewest actions.
- **Balance the reaction:** a reaction with one particle missing; pick the one that conserves
  charge, baryon number and lepton numbers. The existing conservation checker is the referee.
- **Hints** on failed attempts reuse the lab notebook's explanations (colour confinement and so on).

## Phase 3 — XP and ranks

- **XP** for first discoveries, quests, puzzles and streaks of reactions without a conservation
  violation.
- **Ranks:** Student → Lab Technician → Researcher → Nobel Laureate.
- **Gated unlocks** by rank (antiparticles in the palette, heavy quarks, harder puzzles), giving a
  natural learning order.

## Phase 4 — Battles

- **Card duels:** your particle against a rival, with real interactions as moves.
  - A force only affects particles that feel it: a neutrino is immune to Electric moves.
  - HP is stability: unstable particles can decay mid-battle.
  - Matter against antimatter can end in annihilation.
- This is the largest phase and gets its own design document before any code.

## Phase 5 — Daily play

- **Daily challenge:** one puzzle per day, the same for everyone (seeded by the date), with a streak
  counter.
- **Achievements**, e.g. "Made antimatter", "Built every meson", "Survived a top-quark decay".

## Open questions

- Are battles in scope, or does the project stay a learning game?
- A shared leaderboard needs a backend, which GitHub Pages can't host. Skip unless wanted.
