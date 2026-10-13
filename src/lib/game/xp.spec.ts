import { describe, expect, it } from 'vitest';
import { BALANCE_QUESTIONS } from './balance';
import { EMPTY, balance, discover, solvePuzzle, type Collection } from './collection';
import { PUZZLES } from './puzzles';
import { RANKS, hasRank, nextRank, rankFor } from './ranks';
import { XP_VALUES, promotions, standing, totalXp, xpBreakdown } from './xp';
import { compositeParticles, reactions } from '#lib/physics/index.ts';

/** A save with everything done, puzzles at par. */
function everything(): Collection {
	let c = EMPTY;
	for (const r of reactions) c = discover(c, r.outputs, r.id).collection;
	c = discover(
		c,
		compositeParticles.map((p) => p.id)
	).collection;
	for (const p of PUZZLES) c = solvePuzzle(c, p.id, p.par);
	for (const q of BALANCE_QUESTIONS) c = balance(c, q.id);
	return c;
}

describe('XP', () => {
	it('starts at zero, as a Student', () => {
		expect(totalXp(EMPTY)).toBe(0);
		expect(standing(EMPTY).rank.id).toBe('student');
	});

	it('scores a discovery, its move and the quests it completes', () => {
		const c = discover(EMPTY, ['p', 'e-', 'anti-nu_e'], 'neutron-beta-decay').collection;
		// The proton, the move, and two quests: "Make a proton" and "Turn a neutron into a proton".
		expect(totalXp(c)).toBe(XP_VALUES.particle + XP_VALUES.reaction + 2 * XP_VALUES.quest);
	});

	it('pays more for puzzle stars', () => {
		const par = totalXp(solvePuzzle(EMPTY, 'hydrogen', 2));
		const slow = totalXp(solvePuzzle(EMPTY, 'hydrogen', 9));
		expect(par - slow).toBe(2 * XP_VALUES.star);
	});

	it('adds up its breakdown', () => {
		const c = everything();
		expect(xpBreakdown(c).reduce((s, l) => s + l.xp, 0)).toBe(totalXp(c));
	});

	it('reaches Nobel Laureate when everything is done', () => {
		expect(standing(everything()).rank.id).toBe('laureate');
		expect(standing(everything()).next).toBeUndefined();
	});
});

describe('ranks', () => {
	it('climb with XP', () => {
		expect(rankFor(0).id).toBe('student');
		expect(rankFor(149).id).toBe('student');
		expect(rankFor(150).id).toBe('technician');
		expect(rankFor(99999).id).toBe('laureate');
		expect(nextRank(RANKS[0])?.id).toBe('technician');
	});

	it('gate puzzles', () => {
		const helium = PUZZLES.find((p) => p.id === 'helium')!;
		expect(hasRank(rankFor(0), helium.rank)).toBe(false);
		expect(hasRank(rankFor(500), helium.rank)).toBe(true);
		expect(hasRank(rankFor(0), PUZZLES[0].rank)).toBe(true);
	});

	it('every gated puzzle can be reached from the open ones and the lab', () => {
		// Everything except the gated puzzles must earn enough XP for the highest gate.
		let c = everything();
		c = {
			...c,
			puzzles: Object.fromEntries(PUZZLES.filter((p) => !p.rank).map((p) => [p.id, p.par]))
		};
		for (const p of PUZZLES) expect(hasRank(standing(c).rank, p.rank), p.id).toBe(true);
	});

	it('report each promotion passed, lowest first', () => {
		expect(promotions(EMPTY, everything()).map((r) => r.id)).toEqual([
			'technician',
			'researcher',
			'professor',
			'laureate'
		]);
		expect(promotions(EMPTY, EMPTY)).toEqual([]);
	});
});
