// Ranks: the player's career, earned with XP. Kept free of imports so puzzles
// and other game data can name the rank that unlocks them.

export type RankId = 'student' | 'technician' | 'researcher' | 'professor' | 'laureate';

export interface Rank {
	id: RankId;
	name: string;
	/** XP needed to reach this rank. */
	xp: number;
	icon: string;
	/** What reaching it opens up, shown on promotion. */
	perk: string;
}

export const RANKS: Rank[] = [
	{ id: 'student', name: 'Student', xp: 0, icon: '🎒', perk: 'The lab and the first puzzles.' },
	{
		id: 'technician',
		name: 'Lab Technician',
		xp: 150,
		icon: '🧪',
		perk: 'Nuclear puzzles: forge a deuteron and heavy hydrogen.'
	},
	{
		id: 'researcher',
		name: 'Researcher',
		xp: 500,
		icon: '🔬',
		perk: 'The Stellar Forge puzzle: helium, quark by quark.'
	},
	{ id: 'professor', name: 'Professor', xp: 1100, icon: '🎓', perk: 'Bragging rights.' },
	{
		id: 'laureate',
		name: 'Nobel Laureate',
		xp: 1900,
		icon: '🏆',
		perk: 'The top of the field.'
	}
];

/** The highest rank this much XP has reached. */
export function rankFor(xp: number): Rank {
	return RANKS.findLast((r) => xp >= r.xp) ?? RANKS[0];
}

/** The rank after this one, if any. */
export function nextRank(rank: Rank): Rank | undefined {
	return RANKS[RANKS.indexOf(rank) + 1];
}

/** Whether `have` is at least `need`. */
export function hasRank(have: Rank, need: RankId | undefined): boolean {
	return !need || RANKS.indexOf(have) >= RANKS.findIndex((r) => r.id === need);
}

export function getRank(id: RankId): Rank {
	return RANKS.find((r) => r.id === id)!;
}
