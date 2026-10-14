import { describe, expect, it } from 'vitest';
import { chooseAction } from './ai';
import {
	MAX_TURNS,
	activeOf,
	createBattle,
	legalActions,
	step,
	type Action,
	type BattleEvent,
	type BattleState,
	type Outcome
} from './engine';
import { next } from './random';
import { RIVALS } from './rivals';
import { DECAYS, battleHp, decayClock, effect, movesFor } from './rules';
import { allParticles, elementaryParticles, getParticle } from '#lib/physics/index.ts';
import { lifetimeSeconds } from '#lib/physics/lifetimes.ts';

const move = (m: string): Action => ({ type: 'move', move: m }) as Action;

/** Plays a battle with the AI choosing for both sides. */
function simulate(
	seed: number,
	a: string[],
	b: string[]
): { winner: Outcome; events: BattleEvent[] } {
	let s: BattleState = createBattle(seed, a, b);
	const events: BattleEvent[] = [];
	while (s.winner === undefined) {
		const r = step(s, chooseAction(s, 0), chooseAction(s, 1));
		s = r.state;
		events.push(...r.events);
	}
	return { winner: s.winner, events };
}

describe('battle rules', () => {
	it('derive battle HP from stability', () => {
		expect(battleHp('e-')).toBe(100);
		expect(battleHp('t')).toBe(63);
	});

	it('give the decay clocks in the design table', () => {
		const expected: Record<string, number | null> = {
			t: 1,
			Z: 1,
			'W+': 1,
			H: 1,
			pi0: 3,
			'tau-': 4,
			c: 5,
			b: 5,
			Lambda: 5,
			s: 6,
			'K+': 6,
			'pi+': 6,
			'mu-': 7,
			n: 8,
			'e-': null,
			p: null,
			gamma: null
		};
		for (const [id, clock] of Object.entries(expected)) expect(decayClock(id), id).toBe(clock);
	});

	it('know what every unstable particle decays into', () => {
		for (const p of allParticles) {
			if (lifetimeSeconds(p.id) === Infinity) continue;
			expect(DECAYS[p.id], p.id).toBeDefined();
			expect(getParticle(DECAYS[p.id])).toBeDefined();
		}
	});

	it('give one move per force a particle can use', () => {
		expect(movesFor('gamma')).toEqual(['electromagnetic']);
		expect(movesFor('g')).toEqual(['strong']);
		expect(movesFor('nu_e')).toEqual(['weak']);
		expect(movesFor('e-')).toEqual(['electromagnetic', 'weak', 'higgs']);
		expect(movesFor('n')).toEqual(['strong', 'weak', 'higgs']);
		expect(movesFor('u')).toEqual(['strong', 'electromagnetic', 'weak', 'higgs']);
	});

	it('only offer Annihilate against the exact antiparticle', () => {
		expect(movesFor('e-', 'e+')).toContain('annihilate');
		expect(movesFor('e-', 'mu+')).not.toContain('annihilate');
		expect(movesFor('gamma', 'gamma')).not.toContain('annihilate');
	});

	it('make particles immune to forces they do not feel, with a reason', () => {
		const immune: [string, string, string][] = [
			['strong', 'u', 'e-'],
			['strong', 'u', 'He-atom'],
			['electromagnetic', 'e-', 'nu_e'],
			['electromagnetic', 'e-', 'n'],
			['electromagnetic', 'e-', 'He-atom'],
			['electromagnetic', 'gamma', 'gamma'],
			['weak', 'e-', 'gamma'],
			['weak', 'e-', 'g']
		];
		for (const [m, a, t] of immune) {
			const e = effect(m as never, a, t);
			expect(e.factor, `${m} ${a}→${t}`).toBe(0);
			expect(e.reason).toBeTruthy();
		}
		expect(effect('strong', 'g', 'g').factor).toBe(1);
		expect(effect('strong', 'u', 'p').factor).toBe(0.5);
		expect(effect('electromagnetic', 'e-', 'alpha').factor).toBe(2);
		expect(effect('electromagnetic', 'gamma', 'e-').factor).toBe(1);
		// Compton scattering works both ways.
		expect(effect('electromagnetic', 'e-', 'gamma').factor).toBe(1);
		expect(effect('weak', 'e-', 'nu_e').factor).toBe(1);
	});
});

describe('battle engine', () => {
	it('replays exactly from its seed', () => {
		const a = simulate(7, ['u', 'e-', 'gamma'], ['d', 'mu-', 'g']);
		const b = simulate(7, ['u', 'e-', 'gamma'], ['d', 'mu-', 'g']);
		expect(a).toEqual(b);
	});

	it('lets the faster particle act first', () => {
		const s = createBattle(1, ['gamma', 'u', 'd'], ['e-', 'u', 'd']);
		const { events } = step(s, move('electromagnetic'), move('electromagnetic'));
		const first = events.find((e) => e.type === 'move');
		expect(first).toMatchObject({ side: 0, fighter: 'gamma' });
	});

	it('reports immunity instead of damage', () => {
		const s = createBattle(1, ['e-', 'u', 'd'], ['nu_e', 'u', 'd']);
		const { events, state } = step(s, move('electromagnetic'), move('weak'));
		expect(events).toContainEqual(expect.objectContaining({ type: 'immune', target: 'nu_e' }));
		expect(activeOf(state, 1).hp).toBe(activeOf(state, 1).maxHp);
	});

	it('decays a top quark into a bottom quark after one turn, keeping its HP fraction', () => {
		const s = createBattle(1, ['t', 'u', 'd'], ['nu_e', 'u', 'd']);
		const { state, events } = step(s, move('higgs'), move('weak'));
		expect(events).toContainEqual({ type: 'decay', side: 0, from: 't', to: 'b' });
		const b = activeOf(state, 0);
		expect(b.id).toBe('b');
		const tHpAfterHit = (events.find((e) => e.type === 'damage') as { hp: number }).hp;
		expect(b.hp / b.maxHp).toBeCloseTo(tHpAfterHit / battleHp('t'), 1);
		expect(b.clock).toBe(decayClock('b'));
	});

	it('brings decay closer with the weak force', () => {
		const s = createBattle(1, ['nu_e', 'u', 'd'], ['mu-', 'u', 'd']);
		const { events } = step(s, move('weak'), move('higgs'));
		expect(events).toContainEqual(
			expect.objectContaining({ type: 'clock', target: 'mu-', clock: 6 })
		);
	});

	it('annihilates a particle with its antiparticle, and sends in the next', () => {
		const s = createBattle(1, ['e-', 'u', 'd'], ['e+', 'u', 'd']);
		const { state, events } = step(s, move('annihilate'), move('higgs'));
		expect(events.filter((e) => e.type === 'faint')).toHaveLength(2);
		expect(activeOf(state, 0).id).toBe('u');
		expect(activeOf(state, 1).id).toBe('u');
	});

	it('does not let a replacement act on the fainted particle’s move', () => {
		// The electron is faster and annihilates first; the gluon sent in for the positron
		// must not use the move the positron chose.
		const s = createBattle(1, ['e-', 'u', 'd'], ['e+', 'g', 'd']);
		const { events } = step(s, move('annihilate'), move('electromagnetic'));
		expect(events.filter((e) => e.type === 'move')).toHaveLength(1);
	});

	it('switches before moves', () => {
		const s = createBattle(1, ['e-', 'nu_e', 'd'], ['u', 'u', 'd']);
		const { events } = step(s, { type: 'switch', to: 1 }, move('electromagnetic'));
		expect(events[0]).toMatchObject({ type: 'switch', side: 0, to: 'nu_e' });
		expect(events).toContainEqual(expect.objectContaining({ type: 'immune', target: 'nu_e' }));
	});

	it('accepts an action however its fields are ordered', () => {
		const s = createBattle(1, ['e-', 'u', 'd'], ['u', 'u', 'd']);
		expect(() =>
			step(s, { move: 'weak', type: 'move' } as Action, { to: 1, type: 'switch' } as Action)
		).not.toThrow();
	});

	it('ends on a forfeit', () => {
		const s = createBattle(1, ['e-', 'u', 'd'], ['u', 'u', 'd']);
		const { state } = step(s, { type: 'forfeit' }, move('strong'));
		expect(state.winner).toBe(1);
	});

	it('refuses illegal actions and a finished battle', () => {
		const s = createBattle(1, ['nu_e', 'u', 'd'], ['u', 'u', 'd']);
		expect(() => step(s, move('strong'), move('strong'))).toThrow();
		expect(() => createBattle(1, ['u'], ['d', 'd', 'd'])).toThrow();
	});

	it('ends at once when the two sides cannot interact at all', () => {
		// Photons and neutrinos can't touch each other: no charge, no weak coupling.
		const r = simulate(1, ['gamma', 'gamma', 'gamma'], ['nu_e', 'nu_mu', 'nu_tau']);
		expect(r.winner).toBe('draw');
		expect(r.events.at(-1)).toMatchObject({ type: 'end', reason: 'stalemate' });
		expect(r.events.filter((e) => e.type === 'move').length).toBe(2);
	});

	it('never runs past the turn limit', () => {
		const r = simulate(5, ['g', 'nu_e', 'e-'], ['g', 'nu_mu', 'mu-']);
		expect(r.events.filter((e) => e.type === 'move').length).toBeLessThanOrEqual(MAX_TURNS * 2);
	});
});

describe('rival AI', () => {
	it('always picks a legal action', () => {
		for (const rival of RIVALS) {
			let s = createBattle(3, ['u', 'e-', 'g'], rival.team);
			while (s.winner === undefined) {
				const a1 = chooseAction(s, 1);
				expect(legalActions(s, 1)).toContainEqual(a1);
				s = step(s, chooseAction(s, 0), a1).state;
			}
		}
	});

	it('switches away from a particle that can do nothing', () => {
		const s = createBattle(1, ['nu_e', 'u', 'd'], ['gamma', 'g', 'e-']);
		expect(chooseAction(s, 1)).toEqual({ type: 'switch', to: 2 });
	});
});

describe('balance', () => {
	// Elementary particles (antiparticles included) are open to every player from the start.
	const pool = elementaryParticles.map((p) => p.id);
	const teams: string[][] = [];
	for (let i = 0; i < pool.length; i++)
		for (let j = i + 1; j < pool.length; j++)
			for (let k = j + 1; k < pool.length; k++) teams.push([pool[i], pool[j], pool[k]]);
	const beats = (team: string[], rival: string[]) =>
		[1, 2].every((seed) => simulate(seed, team, rival).winner === 0);

	it('lets an elementary-only team beat every rival', () => {
		for (const rival of RIVALS) {
			expect(
				teams.some((t) => beats(t, rival.team)),
				rival.name
			).toBe(true);
		}
	});

	it('has no single team that beats every rival', () => {
		// Hardest rivals first, so most teams are ruled out after one battle.
		const hardestFirst = [...RIVALS].reverse();
		const champions = teams.filter((t) => hardestFirst.every((r) => beats(t, r.team)));
		expect(champions).toEqual([]);
	});

	it('gets harder with rank', () => {
		// A fixed sample of one team in seven keeps this quick and repeatable.
		const sample = teams.filter((_, i) => i % 7 === 0);
		const share = (rival: string[]) =>
			sample.filter((t) => simulate(1, t, rival).winner === 0).length / sample.length;
		const shares = RIVALS.map((r) => share(r.team));
		for (let i = 1; i < shares.length; i++) {
			expect(shares[i], RIVALS[i].name).toBeLessThanOrEqual(shares[i - 1]);
		}
	});
});

describe('random', () => {
	it('is deterministic and in [0, 1)', () => {
		let s = 42;
		const values: number[] = [];
		for (let i = 0; i < 100; i++) {
			const [v, n] = next(s);
			values.push(v);
			s = n;
		}
		expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
		expect(next(42)).toEqual(next(42));
	});
});
