import { describe, expect, it } from 'vitest';
import { BALANCE_QUESTIONS, checkPick } from './balance';
import {
	BADGES,
	EMPTY,
	balance,
	discover,
	earnedBadges,
	parseCollection,
	solvePuzzle
} from './collection';
import {
	PUZZLES,
	act,
	isSolved,
	startPuzzle,
	stars,
	type Puzzle,
	type PuzzleAction,
	type PuzzleState
} from './puzzles';
import { QUESTS, newQuests, questDone } from './quests';
import { getParticle } from '#lib/physics/index.ts';

/** Picks tokens by particle id, first unused match each, so solutions read like recipes. */
function keysFor(state: PuzzleState, ids: string[]): number[] {
	const used = new Set<number>();
	return ids.map((id) => {
		const t = state.tokens.find((t) => t.id === id && !used.has(t.key));
		if (!t) throw new Error(`no ${id} in tray`);
		used.add(t.key);
		return t.key;
	});
}

type Step = ['combine' | 'react', string[]] | ['split', string];

function play(puzzle: Puzzle, steps: Step[]): PuzzleState {
	let state = startPuzzle(puzzle);
	for (const [type, ids] of steps) {
		const action: PuzzleAction =
			type === 'split'
				? { type, key: keysFor(state, [ids as string])[0] }
				: { type, keys: keysFor(state, ids as string[]) };
		const outcome = act(state, action);
		expect(outcome.ok, outcome.message).toBe(true);
		state = outcome.state;
	}
	return state;
}

const solutions: Record<string, Step[]> = {
	'first-proton': [['combine', ['u', 'u', 'd']]],
	hydrogen: [
		['combine', ['u', 'u', 'd']],
		['combine', ['p', 'e-']]
	],
	'light-from-pion': [
		['combine', ['u', 'anti-u']],
		['react', ['pi0']]
	],
	'flavour-change': [
		['react', ['d']],
		['combine', ['u', 'u', 'd']]
	],
	'beta-hydrogen': [
		['react', ['n']],
		['combine', ['p', 'e-']]
	],
	deuteron: [
		['combine', ['u', 'u', 'd']],
		['combine', ['u', 'd', 'd']],
		['combine', ['p', 'n']]
	],
	'heavy-hydrogen': [
		['combine', ['u', 'u', 'd']],
		['combine', ['u', 'd', 'd']],
		['combine', ['p', 'n']],
		['combine', ['D', 'e-']]
	],
	helium: [
		['combine', ['u', 'u', 'd']],
		['combine', ['u', 'u', 'd']],
		['combine', ['u', 'd', 'd']],
		['combine', ['u', 'd', 'd']],
		['combine', ['p', 'p', 'n', 'n']],
		['combine', ['alpha', 'e-', 'e-']]
	]
};

describe('puzzles', () => {
	it.each(PUZZLES)('$id can be solved in par', (puzzle) => {
		const steps = solutions[puzzle.id];
		expect(steps, 'add a solution to this test').toBeDefined();
		expect(isSolved(startPuzzle(puzzle), puzzle)).toBe(false);
		const end = play(puzzle, steps);
		expect(isSolved(end, puzzle)).toBe(true);
		expect(end.moves).toBe(puzzle.par);
	});

	it('explains a failed combine and does not count it', () => {
		const puzzle = PUZZLES[0];
		const start = startPuzzle(puzzle);
		const outcome = act(start, { type: 'combine', keys: keysFor(start, ['u', 'u']) });
		expect(outcome.ok).toBe(false);
		expect(outcome.message).toMatch(/Colour confinement/);
		expect(outcome.state).toBe(start);
	});

	it('refuses to split an elementary particle', () => {
		const start = startPuzzle(PUZZLES[0]);
		const outcome = act(start, { type: 'split', key: start.tokens[0].key });
		expect(outcome.ok).toBe(false);
	});

	it('puts products where the first chosen particle was', () => {
		const start = startPuzzle(PUZZLES[1]); // u u d e-
		const outcome = act(start, { type: 'combine', keys: keysFor(start, ['u', 'u', 'd']) });
		expect(outcome.state.tokens.map((t) => t.id)).toEqual(['p', 'e-']);
		expect(outcome.made).toEqual(['p']);
	});

	it('reports the reaction a puzzle ran, for the collection', () => {
		const start = startPuzzle(PUZZLES.find((p) => p.id === 'beta-hydrogen')!);
		const outcome = act(start, { type: 'react', keys: keysFor(start, ['n']) });
		expect(outcome.reactionId).toBe('neutron-beta-decay');
	});

	it('scores stars against par', () => {
		expect(stars(2, 2)).toBe(3);
		expect(stars(4, 2)).toBe(2);
		expect(stars(5, 2)).toBe(1);
	});
});

describe('balance the reaction', () => {
	it('asks one question per distinct product', () => {
		expect(BALANCE_QUESTIONS).toHaveLength(19);
		expect(new Set(BALANCE_QUESTIONS.map((q) => q.id)).size).toBe(19);
	});

	it.each(BALANCE_QUESTIONS)('$id has exactly one choice that conserves everything', (q) => {
		expect(q.options).toHaveLength(4);
		expect(new Set(q.options).size).toBe(4);
		expect(q.options).toContain(q.answer);
		for (const pick of q.options) {
			const balanced = checkPick(q, pick).every((c) => c.conserved);
			expect(balanced, `${pick} in ${q.id}`).toBe(pick === q.answer);
		}
	});

	it('offers the antiparticle as a near miss when there is one', () => {
		const q = BALANCE_QUESTIONS.find((q) => q.id === 'neutron-beta-decay:2')!;
		expect(q.answer).toBe('anti-nu_e');
		expect(q.options).toContain('nu_e');
	});

	it('does not always put the answer first', () => {
		expect(BALANCE_QUESTIONS.some((q) => q.options[0] !== q.answer)).toBe(true);
	});
});

describe('quests', () => {
	it('only name real particles', () => {
		for (const q of QUESTS) for (const id of q.make ?? []) expect(getParticle(id)).toBeDefined();
	});

	it('complete from what is in the collection', () => {
		expect(QUESTS.some((q) => questDone(EMPTY, q))).toBe(false);
		const after = discover(EMPTY, ['p', 'e-', 'anti-nu_e'], 'neutron-beta-decay').collection;
		expect(newQuests(EMPTY, after).map((q) => q.id)).toEqual(['make-proton', 'beta-decay']);
	});
});

describe('challenge progress in the save', () => {
	it('keeps the best puzzle score', () => {
		const a = solvePuzzle(EMPTY, 'hydrogen', 4);
		expect(a.puzzles.hydrogen).toBe(4);
		expect(solvePuzzle(a, 'hydrogen', 5)).toBe(a);
		expect(solvePuzzle(a, 'hydrogen', 2).puzzles.hydrogen).toBe(2);
	});

	it('records balanced reactions once', () => {
		const a = balance(EMPTY, 'pion-decay:0');
		expect(balance(a, 'pion-decay:0')).toBe(a);
	});

	it('earns the puzzle and balance badges', () => {
		let c = EMPTY;
		for (const p of PUZZLES) c = solvePuzzle(c, p.id, p.par);
		for (const q of BALANCE_QUESTIONS) c = balance(c, q.id);
		const ids = earnedBadges(c).map((b) => b.id);
		expect(ids).toContain('puzzles');
		expect(ids).toContain('balance');
		expect(BADGES.map((b) => b.id)).toContain('puzzles');
	});

	it('loads a phase 1 save without challenge fields', () => {
		const c = parseCollection(JSON.stringify({ version: 1, particles: ['p'], reactions: [] }));
		expect(c.particles).toEqual(['p']);
		expect(c.puzzles).toEqual({});
		expect(c.balanced).toEqual([]);
	});

	it('drops unknown or invalid challenge entries', () => {
		const c = parseCollection(
			JSON.stringify({
				version: 1,
				particles: [],
				reactions: [],
				puzzles: { hydrogen: 3, nope: 1, deuteron: -2, helium: 'x' },
				balanced: ['pion-decay:0', 'made-up:1', 7]
			})
		);
		expect(c.puzzles).toEqual({ hydrogen: 3 });
		expect(c.balanced).toEqual(['pion-decay:0']);
	});
});
