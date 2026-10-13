import { allParticles, getParticle, reactions, type Particle } from '#lib/physics/index.ts';
import { BALANCE_QUESTIONS } from './balance';
import { PUZZLES } from './puzzles';

// The particle collection: what the player has discovered, and the badges that
// follow from it. Pure functions over a plain, serialisable save object.

export interface Collection {
	/** Save format version, for future migrations. */
	version: 1;
	/** Ids of discovered composite particles, in discovery order. */
	particles: string[];
	/** Ids of reactions the player has run, in discovery order. */
	reactions: string[];
	/** Best (fewest) moves for each solved puzzle. Added in phase 2; older saves lack it. */
	puzzles: Record<string, number>;
	/** Ids of balance questions answered correctly. Added in phase 2. */
	balanced: string[];
}

export const EMPTY: Collection = {
	version: 1,
	particles: [],
	reactions: [],
	puzzles: {},
	balanced: []
};

/** Elementary particles are known from the start; composites must be built. */
export function startsUnlocked(particle: Particle): boolean {
	return particle.elementary;
}

export function isDiscovered(c: Collection, id: string): boolean {
	return startsUnlocked(getParticle(id)) || c.particles.includes(id);
}

export interface Discovery {
	collection: Collection;
	/** Composites seen for the first time. */
	newParticles: string[];
	/** Badges earned by this discovery. */
	newBadges: Badge[];
}

/** Records particles that appeared on the workbench and, optionally, the reaction that made them. */
export function discover(c: Collection, ids: string[], reactionId?: string): Discovery {
	const newParticles = [...new Set(ids)].filter((id) => !isDiscovered(c, id));
	const newReaction = reactionId && !c.reactions.includes(reactionId) ? [reactionId] : [];
	if (!newParticles.length && !newReaction.length) {
		return { collection: c, newParticles: [], newBadges: [] };
	}
	const next: Collection = {
		...c,
		particles: [...c.particles, ...newParticles],
		reactions: [...c.reactions, ...newReaction]
	};
	return { collection: next, newParticles, newBadges: newBadges(c, next) };
}

/** Badges earned between two versions of the collection. */
export function newBadges(before: Collection, after: Collection): Badge[] {
	const had = new Set(earnedBadges(before).map((b) => b.id));
	return earnedBadges(after).filter((b) => !had.has(b.id));
}

/** Records a solved puzzle, keeping the best (fewest) moves. */
export function solvePuzzle(c: Collection, id: string, moves: number): Collection {
	const best = c.puzzles[id];
	if (best !== undefined && best <= moves) return c;
	return { ...c, puzzles: { ...c.puzzles, [id]: moves } };
}

/** Records a correctly balanced reaction. */
export function balance(c: Collection, id: string): Collection {
	return c.balanced.includes(id) ? c : { ...c, balanced: [...c.balanced, id] };
}

export interface Progress {
	found: number;
	total: number;
}

/** Discovered vs total, counting particles and reactions alike. */
export function progress(c: Collection): Progress {
	const found = allParticles.filter((p) => isDiscovered(c, p.id)).length + c.reactions.length;
	return { found, total: allParticles.length + reactions.length };
}

export interface Badge {
	id: string;
	name: string;
	description: string;
}

interface BadgeRule extends Badge {
	/**
	 * Everything that must be done: particle ids, or ids prefixed "reaction:", "puzzle:" or
	 * "balance:" for a reaction run, a puzzle solved or a reaction balanced.
	 */
	requires: string[];
}

const composites = (category: Particle['category']) =>
	allParticles.filter((p) => p.category === category).map((p) => p.id);

export const BADGES: BadgeRule[] = [
	{
		id: 'hadrons',
		name: 'Hadron Hunter',
		description: 'Build every hadron.',
		requires: composites('hadron')
	},
	{
		id: 'nuclei',
		name: 'Nucleosynthesis',
		description: 'Forge every nucleus.',
		requires: composites('nucleus')
	},
	{
		id: 'atoms',
		name: 'Chemist',
		description: 'Assemble every atom.',
		requires: composites('atom')
	},
	{
		id: 'reactions',
		name: 'Reactor',
		description: 'Run every reaction.',
		requires: reactions.map((r) => `reaction:${r.id}`)
	},
	{
		id: 'puzzles',
		name: 'Puzzle Master',
		description: 'Solve every puzzle.',
		requires: PUZZLES.map((p) => `puzzle:${p.id}`)
	},
	{
		id: 'balance',
		name: 'Perfect Balance',
		description: 'Balance every reaction.',
		requires: BALANCE_QUESTIONS.map((q) => `balance:${q.id}`)
	},
	{
		id: 'complete',
		name: 'Theory of Almost Everything',
		description: 'Discover every particle and reaction.',
		requires: [...allParticles.map((p) => p.id), ...reactions.map((r) => `reaction:${r.id}`)]
	}
];

function has(c: Collection, item: string): boolean {
	const [kind, id] = item.split(/:(.*)/);
	if (id === undefined) return isDiscovered(c, item);
	if (kind === 'reaction') return c.reactions.includes(id);
	if (kind === 'puzzle') return Object.hasOwn(c.puzzles, id);
	return c.balanced.includes(id);
}

/** How many of a badge's requirements are met. */
export function badgeProgress(c: Collection, badge: BadgeRule): Progress {
	return { found: badge.requires.filter((r) => has(c, r)).length, total: badge.requires.length };
}

export function earnedBadges(c: Collection): Badge[] {
	return BADGES.filter((b) => b.requires.every((r) => has(c, r))).map(
		({ id, name, description }) => ({ id, name, description })
	);
}

/** A clue for a locked composite that doesn't give the recipe away. */
export function hint(particle: Particle): string {
	if (particle.elementary) return '';
	const n = particle.constituents.length;
	const kind = { hadron: 'A hadron', nucleus: 'A nucleus', atom: 'An atom' }[particle.category];
	return `${kind} made of ${n} particles, held by the ${particle.boundBy} force.`;
}

/** Parses saved data, falling back to an empty collection for anything unexpected. */
export function parseCollection(raw: string | null): Collection {
	if (!raw) return EMPTY;
	try {
		const data = JSON.parse(raw);
		if (data?.version !== 1 || !Array.isArray(data.particles) || !Array.isArray(data.reactions)) {
			return EMPTY;
		}
		const known = new Set(allParticles.map((p) => p.id));
		const knownReactions = new Set(reactions.map((r) => r.id));
		const knownQuestions = new Set(BALANCE_QUESTIONS.map((q) => q.id));
		const puzzles: Record<string, number> = {};
		if (data.puzzles && typeof data.puzzles === 'object') {
			for (const p of PUZZLES) {
				const moves = data.puzzles[p.id];
				if (Number.isInteger(moves) && moves > 0) puzzles[p.id] = moves;
			}
		}
		return {
			version: 1,
			particles: data.particles.filter((id: unknown) => typeof id === 'string' && known.has(id)),
			reactions: data.reactions.filter(
				(id: unknown) => typeof id === 'string' && knownReactions.has(id)
			),
			puzzles,
			balanced: Array.isArray(data.balanced)
				? data.balanced.filter((id: unknown) => typeof id === 'string' && knownQuestions.has(id))
				: []
		};
	} catch {
		return EMPTY;
	}
}
