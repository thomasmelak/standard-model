import { earnedBadges, type Collection } from './collection';
import { PUZZLES, stars } from './puzzles';
import { QUESTS, questDone } from './quests';
import { RANKS, nextRank, rankFor, type Rank } from './ranks';

// XP is worked out from the collection every time, never stored, so it can't
// drift from what the player has actually done, and old saves score at once.

export const XP_VALUES = {
	particle: 20,
	reaction: 15,
	quest: 50,
	puzzle: 30,
	star: 10,
	balance: 10,
	badge: 100
} as const;

export interface XpLine {
	label: string;
	count: number;
	/** How each one scores, for display, e.g. "20 each". */
	rate: string;
	xp: number;
}

export function xpBreakdown(c: Collection): XpLine[] {
	const solved = PUZZLES.filter((p) => Object.hasOwn(c.puzzles, p.id));
	const starCount = solved.reduce((sum, p) => sum + stars(c.puzzles[p.id], p.par), 0);
	const quests = QUESTS.filter((q) => questDone(c, q)).length;
	const badges = earnedBadges(c).length;
	const line = (label: string, count: number, each: number): XpLine => ({
		label,
		count,
		rate: `${each} each`,
		xp: count * each
	});
	return [
		line('Particles discovered', c.particles.length, XP_VALUES.particle),
		line('Moves discovered', c.reactions.length, XP_VALUES.reaction),
		line('Quests complete', quests, XP_VALUES.quest),
		{
			label: 'Puzzles solved',
			count: solved.length,
			rate: `${XP_VALUES.puzzle} + ${XP_VALUES.star} per star`,
			xp: solved.length * XP_VALUES.puzzle + starCount * XP_VALUES.star
		},
		line('Reactions balanced', c.balanced.length, XP_VALUES.balance),
		line('Badges earned', badges, XP_VALUES.badge)
	];
}

export function totalXp(c: Collection): number {
	return xpBreakdown(c).reduce((sum, l) => sum + l.xp, 0);
}

export interface Standing {
	xp: number;
	rank: Rank;
	next?: Rank;
	/** XP earned since reaching this rank, and needed to reach the next. */
	intoRank: number;
	toNext: number;
}

export function standing(c: Collection): Standing {
	const xp = totalXp(c);
	const rank = rankFor(xp);
	const next = nextRank(rank);
	return {
		xp,
		rank,
		next,
		intoRank: xp - rank.xp,
		toNext: next ? next.xp - rank.xp : 0
	};
}

/** Ranks reached between two versions of the collection, lowest first. */
export function promotions(before: Collection, after: Collection): Rank[] {
	const from = rankFor(totalXp(before));
	const to = rankFor(totalXp(after));
	return RANKS.slice(RANKS.indexOf(from) + 1, RANKS.indexOf(to) + 1);
}
