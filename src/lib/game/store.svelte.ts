import {
	EMPTY,
	balance,
	discover,
	isDiscovered,
	newBadges,
	parseCollection,
	progress,
	solvePuzzle,
	type Badge,
	type Collection
} from './collection';
import { newQuests, type Quest } from './quests';
import type { Rank } from './ranks';
import { promotions, standing } from './xp';

// The player's collection, saved in this browser. Server rendering and the
// first paint see an empty collection; the save loads on the client.

const KEY = 'standard-model:collection';

export interface Unlock {
	key: number;
	/** A newly discovered particle, a completed quest, a new badge or a promotion. */
	particle?: string;
	badge?: Badge;
	quest?: Quest;
	rank?: Rank;
}

let collection = $state<Collection>(EMPTY);
let unlocks = $state<Unlock[]>([]);
let nextKey = 0;

/** Saves a new collection and queues a pop-up for everything it unlocked. */
function commit(next: Collection, newParticles: string[] = []) {
	if (next === collection) return;
	const before = collection;
	collection = next;
	save();
	unlocks = [
		...unlocks,
		...newParticles.map((particle) => ({ key: nextKey++, particle })),
		...newQuests(before, next).map((quest) => ({ key: nextKey++, quest })),
		...newBadges(before, next).map((badge) => ({ key: nextKey++, badge })),
		...promotions(before, next).map((rank) => ({ key: nextKey++, rank }))
	];
}

function save() {
	try {
		localStorage.setItem(KEY, JSON.stringify(collection));
	} catch {
		// Not saved; progress lasts for this visit.
	}
}

export const game = {
	/** Reads the save. Call once on the client (the root layout does, on mount). */
	load() {
		try {
			collection = parseCollection(localStorage.getItem(KEY));
		} catch {
			// Storage can be blocked (private mode, settings); play on without saving.
		}
	},
	get collection() {
		return collection;
	},
	get progress() {
		return progress(game.collection);
	},
	/** XP, rank and progress to the next rank. */
	get standing() {
		return standing(game.collection);
	},
	isDiscovered(id: string) {
		return isDiscovered(game.collection, id);
	},
	/** Pop-ups waiting to be shown, oldest first. */
	get unlocks() {
		return unlocks;
	},
	/** Records what appeared on the workbench (and the reaction, if one made it). */
	discover(ids: string[], reactionId?: string) {
		const d = discover(game.collection, ids, reactionId);
		commit(d.collection, d.newParticles);
	},
	/** Records a solved puzzle; only a new best replaces the old one. */
	solvePuzzle(id: string, moves: number) {
		commit(solvePuzzle(game.collection, id, moves));
	},
	/** Records a correctly balanced reaction. */
	balance(id: string) {
		commit(balance(game.collection, id));
	},
	dismiss(key: number) {
		unlocks = unlocks.filter((u) => u.key !== key);
	},
	reset() {
		collection = EMPTY;
		unlocks = [];
		save();
	}
};
