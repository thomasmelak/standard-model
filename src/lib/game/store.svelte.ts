import {
	EMPTY,
	discover,
	isDiscovered,
	parseCollection,
	progress,
	type Badge,
	type Collection
} from './collection';

// The player's collection, saved in this browser. Server rendering and the
// first paint see an empty collection; the save loads on the client.

const KEY = 'standard-model:collection';

export interface Unlock {
	key: number;
	/** A newly discovered particle, or a newly earned badge. */
	particle?: string;
	badge?: Badge;
}

let collection = $state<Collection>(EMPTY);
let unlocks = $state<Unlock[]>([]);
let nextKey = 0;

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
		if (d.collection === collection) return;
		collection = d.collection;
		save();
		unlocks = [
			...unlocks,
			...d.newParticles.map((particle) => ({ key: nextKey++, particle })),
			...d.newBadges.map((badge) => ({ key: nextKey++, badge }))
		];
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
