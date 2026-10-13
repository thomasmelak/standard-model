import {
	combine,
	explainNoBoundState,
	findReaction,
	getParticle,
	split
} from '#lib/physics/index.ts';
import type { RankId } from './ranks';

// Puzzles: a fixed set of starting particles and a target to make from them,
// using the lab's own rules. Scored by the number of successful actions.

export interface Puzzle {
	id: string;
	title: string;
	brief: string;
	start: string[];
	/** The particle that must end up in the tray. */
	target: string;
	/** The fewest actions that solve it. */
	par: number;
	hint: string;
	/** The rank needed to play it; open to everyone when absent. */
	rank?: RankId;
}

export const PUZZLES: Puzzle[] = [
	{
		id: 'first-proton',
		title: 'First proton',
		brief: 'Three quarks, one proton.',
		start: ['u', 'u', 'd'],
		target: 'p',
		par: 1,
		hint: 'Select all three quarks and combine them.'
	},
	{
		id: 'hydrogen',
		title: 'Hydrogen from scratch',
		brief: 'Build the simplest atom from quarks and an electron.',
		start: ['u', 'u', 'd', 'e-'],
		target: 'H-atom',
		par: 2,
		hint: 'An atom is a nucleus plus electrons. A lone proton is a hydrogen nucleus.'
	},
	{
		id: 'light-from-pion',
		title: 'Light from a pion',
		brief: 'Turn a quark and its antiquark into light.',
		start: ['u', 'anti-u'],
		target: 'gamma',
		par: 2,
		hint: 'A quark and an antiquark bind into a meson. The neutral pion decays electromagnetically.'
	},
	{
		id: 'flavour-change',
		title: 'Flavour change',
		brief: 'There are too many down quarks for a proton. Fix that.',
		start: ['u', 'd', 'd', 'd'],
		target: 'p',
		par: 2,
		hint: 'Only the weak force changes a quark’s flavour: a d can become a u by emitting a W⁻.'
	},
	{
		id: 'beta-hydrogen',
		title: 'Decay to hydrogen',
		brief: 'Start from a lone neutron and end with a hydrogen atom.',
		start: ['n'],
		target: 'H-atom',
		par: 2,
		hint: 'A free neutron beta-decays. Look at what comes out.'
	},
	{
		id: 'deuteron',
		title: 'Heavy nucleus',
		brief: 'Forge a deuteron from six quarks.',
		start: ['u', 'u', 'd', 'u', 'd', 'd'],
		target: 'D',
		par: 3,
		hint: 'A deuteron is one proton and one neutron, held by the strong force.',
		rank: 'technician'
	},
	{
		id: 'heavy-hydrogen',
		title: 'Heavy hydrogen',
		brief: 'Go all the way from quarks to a deuterium atom.',
		start: ['u', 'u', 'd', 'u', 'd', 'd', 'e-'],
		target: 'D-atom',
		par: 4,
		hint: 'Proton, neutron, deuteron, then add the electron.',
		rank: 'technician'
	},
	{
		id: 'helium',
		title: 'Stellar forge',
		brief: 'Build a helium atom the long way, quark by quark.',
		start: ['u', 'u', 'd', 'u', 'u', 'd', 'u', 'd', 'd', 'u', 'd', 'd', 'e-', 'e-'],
		target: 'He-atom',
		par: 6,
		hint: 'Two protons and two neutrons make an alpha particle; it holds two electrons.',
		rank: 'researcher'
	}
];

export function getPuzzle(id: string): Puzzle | undefined {
	return PUZZLES.find((p) => p.id === id);
}

export interface Token {
	key: number;
	id: string;
}

export interface PuzzleState {
	tokens: Token[];
	/** Successful actions so far. */
	moves: number;
	nextKey: number;
}

export type PuzzleAction =
	| { type: 'combine'; keys: number[] }
	| { type: 'split'; key: number }
	| { type: 'react'; keys: number[] };

export interface PuzzleOutcome {
	state: PuzzleState;
	ok: boolean;
	message: string;
	/** Particles the action made, for the collection. */
	made: string[];
	reactionId?: string;
}

export function startPuzzle(puzzle: Puzzle): PuzzleState {
	return {
		tokens: puzzle.start.map((id, key) => ({ key, id })),
		moves: 0,
		nextKey: puzzle.start.length
	};
}

/** Replaces the chosen tokens with new ones, where the first chosen token was. */
function replace(state: PuzzleState, keys: number[], ids: string[]): PuzzleState {
	const chosen = new Set(keys);
	// Every token before the first chosen one is kept, so it is also the insert index.
	const at = state.tokens.findIndex((t) => chosen.has(t.key));
	const kept = state.tokens.filter((t) => !chosen.has(t.key));
	const added = ids.map((id, i) => ({ key: state.nextKey + i, id }));
	return {
		tokens: [...kept.slice(0, at), ...added, ...kept.slice(at)],
		moves: state.moves + 1,
		nextKey: state.nextKey + ids.length
	};
}

const fail = (state: PuzzleState, message: string): PuzzleOutcome => ({
	state,
	ok: false,
	message,
	made: []
});

/** Applies one action. Failed actions leave the state (and the move count) unchanged. */
export function act(state: PuzzleState, action: PuzzleAction): PuzzleOutcome {
	const keys = action.type === 'split' ? [action.key] : action.keys;
	const ids = keys.map((k) => state.tokens.find((t) => t.key === k)?.id);
	if (!ids.length || ids.some((id) => id === undefined))
		return fail(state, 'Pick particles first.');
	const picked = ids as string[];

	if (action.type === 'combine') {
		if (picked.length < 2) return fail(state, 'Combining needs at least two particles.');
		const formed = combine(picked);
		if (!formed) return fail(state, explainNoBoundState(picked));
		return {
			state: replace(state, keys, [formed.id]),
			ok: true,
			message: `Formed a ${formed.name}, bound by the ${formed.boundBy} force.`,
			made: [formed.id]
		};
	}

	if (action.type === 'split') {
		const parts = split(picked[0]);
		if (!parts)
			return fail(state, `The ${getParticle(picked[0]).name} is elementary: it has no parts.`);
		return {
			state: replace(state, keys, parts),
			ok: true,
			message: `Split the ${getParticle(picked[0]).name}.`,
			made: parts
		};
	}

	const reaction = findReaction(picked);
	if (!reaction) {
		return fail(
			state,
			'No known process starts from exactly these particles. Decays start from one particle; annihilation needs a particle and its antiparticle.'
		);
	}
	return {
		state: replace(state, keys, reaction.outputs),
		ok: true,
		message: `${reaction.name}: ${reaction.description}`,
		made: reaction.outputs,
		reactionId: reaction.id
	};
}

export function isSolved(state: PuzzleState, puzzle: Puzzle): boolean {
	return state.tokens.some((t) => t.id === puzzle.target);
}

/** Three stars at par, two within two moves of it, one otherwise. */
export function stars(moves: number, par: number): 1 | 2 | 3 {
	return moves <= par ? 3 : moves <= par + 2 ? 2 : 1;
}
