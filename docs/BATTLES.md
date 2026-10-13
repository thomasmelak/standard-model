# Battle design (phase 4)

Status: **design, not built yet**. This document is for review before any code. The open questions
at the end need answers first.

## Goals

- **Every rule is real physics.** A player who wins battles should have learned which forces act on
  what, why some particles are immune, why heavy particles decay, and what antimatter does. Every
  number comes from the data the cards already show (`particleStats`, `particleTypes`,
  `lifetimeSeconds`, `reactions`).
- **Short.** A battle takes 2–5 minutes: three particles a side, a handful of turns each.
- **Readable.** Every hit says why it did what it did ("No effect: a neutrino has no electric
  charge"). The battle log is the lesson.
- **Testable.** The engine is plain TypeScript in `src/lib/game/battle/`, deterministic for a given
  seed, with no Svelte in it. The same rules power the rival AI, the UI and the tests.

## Overview

The player picks a **team of three** discovered particles (antiparticles included) and challenges a
**rival**: a fixed, themed team. One particle from each side is active at a time. Each turn both
sides choose an action, and the faster particle acts first. A side loses when all three of its
particles have fainted or decayed away.

## Battle stats

Each battle stat comes from a card stat, so the card is the battle manual.

| Battle stat     | From the card  | Rule                                                                                                     |
| --------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| **HP**          | HP (stability) | `60 + 0.4 × HP`, so 60–100. A stable electron has 100; a top quark has 63.                               |
| **Power**       | Power (mass)   | Multiplies damage: `0.6 + Power / 100`. Massless particles hit at 0.6×, a top quark at about 1.6×.       |
| **Speed**       | Speed          | The faster side acts first. Massless particles (Speed 100) always go first. Ties are broken by the seed. |
| **Decay clock** | Lifetime       | See below. Stable particles have none.                                                                   |
| **Moves**       | Types          | One move per force the particle takes part in, as below.                                                 |

### The decay clock: HP is stability

An unstable particle starts with a clock of `round((log₁₀ τ + 26) / 3)` turns, between 1 and 8,
where τ is its mean lifetime in seconds. The clock ticks down once at the end of each turn the
particle is active. At zero the particle **decays**: its slot is taken by its main decay product,
which keeps the same fraction of its HP. The log explains the decay.

| Particle  | Lifetime      | Clock | Decays into                           |
| --------- | ------------- | ----- | ------------------------------------- |
| t         | 5 × 10⁻²⁵ s   | 1     | b (t → b W⁺)                          |
| Z, W±     | ~3 × 10⁻²⁵ s  | 1     | e⁻ (Z → e⁻ e⁺), e∓ (W∓ → e∓ ν)        |
| H         | 1.6 × 10⁻²² s | 1     | γ (H → γγ)                            |
| π⁰        | 8 × 10⁻¹⁷ s   | 3     | γ (π⁰ → γγ)                           |
| τ         | 2.9 × 10⁻¹³ s | 4     | μ                                     |
| c, b      | ~10⁻¹² s      | 5     | s, c (the CKM cascade: b → c → s → u) |
| Λ         | 2.6 × 10⁻¹⁰ s | 5     | p (Λ → p π⁻)                          |
| s, K⁺, π± | ~10⁻⁸ s       | 6     | u; μ⁺; μ±                             |
| μ         | 2.2 × 10⁻⁶ s  | 7     | e (μ⁻ → e⁻ ν̄ₑ ν_μ)                    |
| n         | 880 s         | 8     | p (beta decay)                        |

A top quark is therefore a glass cannon: the hardest hitter in the game for one turn, and then it
is a bottom quark. Decay products that already exist in `reactions.ts` come from there. The rest
(the quark cascade, τ → μ, K⁺ → μ⁺, Λ → p) come from a small decay table in the battle rules, and
each entry cites the real dominant channel.

## Moves

A particle's moves are the forces it **feels or carries**. That is exactly the type badge row on its
card, so the card shows which moves a particle has.

| Move             | Force           | Base | Hits                                                                                                                 | Teaching point                                                                                                                                      |
| ---------------- | --------------- | ---- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gluon Strike** | strong          | 28   | Quarks and gluons ×1; hadrons and nuclei ×0.5 (the residual nuclear force)                                           | Only colour feels the strong force. Leptons and photons are immune. Gluons can hit gluons, because gluons carry colour too.                         |
| **Photon Blast** | electromagnetic | 22   | Anything with charge, × the attacker's \|charge\| × the target's \|charge\| (in units of e; a photon attacks with 1) | Neutral targets are immune: neutrinos, photons, the neutron, whole atoms. An α particle (+2) takes 2× damage.                                       |
| **W Exchange**   | weak            | 10   | Everything that feels the weak force                                                                                 | The weakest hit, but the only move that touches a neutrino. It also ticks the target's decay clock down by 1, because the weak force drives decays. |
| **Mass Surge**   | Higgs           | —    | Self: +20 Power for 3 turns                                                                                          | The Higgs coupling grows with mass, so massless particles can't use it.                                                                             |
| **Annihilate**   | —               | —    | Only when the active particle faces its own antiparticle                                                             | Both particles vanish into energy. A tactical sacrifice, and the matter/antimatter lesson.                                                          |

**Damage** = `round(Base × (0.6 + Power / 100) × factor × spread)`, where `factor` is the multiplier
from the table and `spread` is a seeded roll between 0.9 and 1.1. **Immunity** (factor 0) is the
heart of the game. The UI greys out any move that can't affect the current target, and says why.

The base values keep nature's order (strong > electromagnetic > weak) but flatten the real ratios
(1 : 1/137 : 10⁻⁶) so every force is playable. The design page and the battle intro both say so.

### Other actions

- **Switch:** bring in another team member. This uses the turn.
- **Forfeit:** leave the battle. It is not recorded as a loss.

## Worked example

You send in **u** (HP 100, Power 21, Speed 79; moves: Gluon Strike, Photon Blast, W Exchange, Mass
Surge). The rival has **e⁻** (HP 100, Power 11, Speed 89).

1. The electron is faster, so it goes first. Its Photon Blast: 22 × 0.71 × (1 × ⅔) ≈ **10**. Your
   Gluon Strike is greyed out: "An electron has no colour; the strong force can't touch it."
2. You use Photon Blast: 22 × 0.81 × (⅔ × 1) ≈ **12**.
3. The rival switches to **ν_e**. Now your Photon Blast is greyed out too ("No electric charge"), and
   only W Exchange works. The lesson is that neutrinos only feel the weak force.

## Rivals

Rivals are fixed teams with a theme, unlocked by rank (phase 3). Facing a particle in battle does
**not** discover it: the player still has to build it in the lab.

| Rival                | Team        | Needs          | Lesson                                  |
| -------------------- | ----------- | -------------- | --------------------------------------- |
| Lepton Lab Assistant | e⁻, μ⁻, ν_e | Student        | Charge and neutrinos                    |
| The Photon Club      | γ, e⁺, π⁰   | Student        | Massless speed; annihilation            |
| Quark Gang           | u, d, s     | Lab Technician | Colour; the strong force                |
| Nuclear Pair         | p, n, D     | Lab Technician | Residual strong force; neutral neutrons |
| Heavyweights         | W⁺, Z, H    | Researcher     | One-turn clocks                         |
| The Top              | t, b, α     | Professor      | The decay cascade; charge 2             |

**AI:** greedy and deterministic. It picks the move with the most expected damage, and switches when
its active particle is immune to everything it can do. It uses Mass Surge when it can't do damage,
and Annihilate only when its own particle has less HP left (as a fraction) than the target.

**Rewards:**

- **XP:** 60 for the first win against each rival.
- **Badge:** "Champion" for beating every rival.
- **Save:** the collection gains `battles: string[]`, the ids of rivals beaten.
- **XP stays derived:** as in phase 3, XP is computed from the save, so it is never stored.

## Architecture

```
src/lib/game/battle/
├── rules.ts     Battle stats, moves, immunity, damage, decay table: pure functions
├── engine.ts    createBattle(seed, teamA, teamB) and step(state, action): returns a new state and an event list
├── ai.ts        The rival's choice of action for a state
├── rivals.ts    The rival teams and their rank gates
└── random.ts    A small seeded PRNG (mulberry32), so a seed replays a battle exactly
```

- **State is a plain object; `step` never mutates it.** The UI keeps the current state in `$state`
  and plays `events` (`attack`, `immune`, `damage`, `decay`, `faint`, `switch`, `annihilate`, `win`)
  as animations and log lines.
- **Route:** a fourth **Battle** tab on `/challenges`. That keeps the nav at five tabs (open
  question 1).
- **Layout:** the rival is at the top and you are at the bottom, each with a live `OrbCanvas`, an HP
  `ProgressBar` and decay-clock pips. Move buttons sit in a 2×2 grid, each with its `TypeBadge`, and
  the log runs in a `GlassCard`. In portrait the layout stacks; in landscape the sides sit next to
  each other.
- **Motion:** hits flash the target's orb and decays morph the orb. All of it is off under
  `prefers-reduced-motion`, and the log carries the same information.
- **Accessibility:** the log is `aria-live`, keys 1–4 pick moves and S switches, and every greyed-out
  move has its reason in its label.

## Testing

- **Rules:** the full immunity table, i.e. every move against every particle compared to the
  physics. Damage, the clock formula, and every decay product.
- **Engine:** the same seed gives the same battle. Speed sets turn order. Decay keeps the HP fraction.
  Annihilate needs the exact antiparticle. A win ends the battle.
- **Balance:** simulate greedy play to check that every rival can be beaten with particles available
  at its rank, and that no single team beats every rival.

## Milestones (one PR each)

1. **Engine:** `rules.ts`, `engine.ts`, `random.ts`, `ai.ts` and their tests. No UI.
2. **Battle tab:** team picker, battle screen and log, with the first two rivals.
3. **Content and rewards:** the remaining rivals, battle XP, the Champion badge and docs.

## Open questions

1. **Where battles live:** a Battle tab on `/challenges` (recommended, keeps five nav tabs) or their
   own `/arena` page in the nav?
2. **Randomness:** keep the ±10% damage spread for excitement, or make battles fully deterministic?
3. **Team size:** three particles, or a choice of 1–3?
4. **Ranks:** battles add up to 460 XP (6 × 60 + the Champion badge). Raise Nobel Laureate from 1900
   to keep it as hard as now, or leave it?
5. **Spoilers:** rivals field composites the player may not have built yet. Show them anyway (as
   planned, without discovering them) or as silhouettes until built?
