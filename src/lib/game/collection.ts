import { allParticles, getParticle, reactions, type Particle } from '#lib/physics/index.ts';

// The particle collection: what the player has discovered, and the badges that
// follow from it. Pure functions over a plain, serialisable save object.

export interface Collection {
	/** Save format version, for future migrations. */
	version: 1;
	/** Ids of discovered composite particles, in discovery order. */
	particles: string[];
	/** Ids of reactions the player has run, in discovery order. */
	reactions: string[];
}

export const EMPTY: Collection = { version: 1, particles: [], reactions: [] };

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
	const before = new Set(earnedBadges(c).map((b) => b.id));
	return {
		collection: next,
		newParticles,
		newBadges: earnedBadges(next).filter((b) => !before.has(b.id))
	};
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
	/** Everything that must be discovered: particle ids, or reaction ids prefixed "reaction:". */
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
		id: 'complete',
		name: 'Theory of Almost Everything',
		description: 'Discover every particle and reaction.',
		requires: [...allParticles.map((p) => p.id), ...reactions.map((r) => `reaction:${r.id}`)]
	}
];

function has(c: Collection, item: string): boolean {
	return item.startsWith('reaction:')
		? c.reactions.includes(item.slice('reaction:'.length))
		: isDiscovered(c, item);
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
		return {
			version: 1,
			particles: data.particles.filter((id: unknown) => typeof id === 'string' && known.has(id)),
			reactions: data.reactions.filter(
				(id: unknown) => typeof id === 'string' && knownReactions.has(id)
			)
		};
	} catch {
		return EMPTY;
	}
}
