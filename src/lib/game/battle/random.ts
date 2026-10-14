// A small seeded PRNG (mulberry32). The state is a plain number kept in the
// battle state, so a battle replays exactly from its seed.

/** The next random number in [0, 1), and the state to use after it. */
export function next(state: number): [value: number, state: number] {
	const s = (state + 0x6d2b79f5) >>> 0;
	let t = s;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}
