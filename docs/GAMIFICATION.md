# Gamification plan

The player is a particle physicist who collects particles by making them in the lab. The game's
rules are the real physics already in `src/lib/physics` (bound states, reactions, conservation laws,
the forces each particle feels), so playing the game is also learning the Standard Model.

Every phase is a separate PR. Game logic lives in `src/lib/game/` as plain, unit-tested TypeScript;
Svelte components only display it. Progress is saved in the browser (`localStorage`), so the site
stays static on GitHub Pages with no accounts or backend.

## Phase 1 — Collection (done)

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

## Phase 2 — Challenges (in progress)

- **Quests:** a checklist of goals such as "Make a proton", "Make a hydrogen atom", "Turn a neutron
  into a proton" (beta decay) and "Annihilate matter with antimatter".
- **Puzzles:** a fixed set of starting particles and a target, e.g. "You have u u d e⁻ — make a
  hydrogen atom". Scored by fewest actions.
- **Balance the reaction:** a reaction with one particle missing; pick the one that conserves
  charge, baryon number and lepton numbers. The existing conservation checker is the referee.
- **Hints** on failed attempts reuse the lab notebook's explanations (colour confinement and so on).

How it is built (`/challenges`, logic in `src/lib/game/`):

- **11 quests** (`quests.ts`) are read straight off the collection: "make X" is done once X is
  discovered, "run R" once the reaction is recorded. Quests reached before phase 2 count at once.
  Completing one pops up a "Quest complete!" toast wherever it happens.
- **8 puzzles** (`puzzles.ts`), from "First proton" (par 1) to "Stellar forge" (helium from 12
  quarks and 2 electrons, par 6). Pick particles in the tray, then Combine, Split or React. Only
  successful actions count; a failed one explains why and costs nothing. Stars: 3 at par, 2 within
  two moves of it, 1 otherwise. Things made in a puzzle join the dex like lab discoveries. A unit
  test plays every puzzle at par.
- **19 balance questions** (`balance.ts`), one per distinct product of every reaction. The three
  wrong choices each break a conservation law (the answer's antiparticle first when it has one),
  and a test checks that exactly one choice conserves everything. A wrong pick lists each broken
  law with its before and after totals.
- **Save:** the collection gains `puzzles` (best moves per puzzle) and `balanced` (question ids).
  Phase 1 saves load with both empty.
- **Badges:** "Puzzle Master" (solve every puzzle) and "Perfect Balance" (balance every reaction).

## Phase 3 — XP and ranks

- **XP** for first discoveries, quests, puzzles, balanced reactions and badges.
- **Ranks:** Student → Lab Technician → Researcher → Professor → Nobel Laureate.
- **Gated unlocks** by rank: the harder puzzles, giving a natural learning order.

How it is built (`src/lib/game/xp.ts`, `ranks.ts`):

- **XP is derived, never stored.** `totalXp(collection)` adds it up from the save every time, so it
  can't drift, and players with phase 1 or 2 saves get their XP at once.

  | Source              | XP                   |
  | ------------------- | -------------------- |
  | Particle discovered | 20                   |
  | Move discovered     | 15                   |
  | Quest complete      | 50                   |
  | Puzzle solved       | 30, plus 10 per star |
  | Reaction balanced   | 10                   |
  | Badge earned        | 100                  |

  Everything done at par is 2330 XP.

- **Ranks:** Student (0), Lab Technician (150), Researcher (500), Professor (1100), Nobel Laureate
  (1900). Nobel needs most of the game but not every last point.
- **Gates:** the nuclear puzzles (deuteron, heavy hydrogen) need Lab Technician; Stellar Forge needs
  Researcher. A locked puzzle shows what it needs and how much XP you have. A test checks that the
  open puzzles and the lab alone earn enough XP to open every gate.
- **Where it shows:** a rank chip in the header (icon and level, plus the name on wider screens)
  links to the rank card at the top of the dex: XP, a bar to the next rank, where the XP came from,
  and the whole ladder. A promotion pops up with the rank's perk.
- **Decided against:** gating heavy quarks (every elementary particle stays unlocked, and quests need
  the strange quark) and reaction streaks (the lab only runs real, conserving reactions, so a
  streak could never break).

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
