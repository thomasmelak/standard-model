import { describe, expect, it } from 'vitest';
import { checkConservation, combine, findReaction, split } from './lab';
import { compositeParticles } from './particles';
import { reactions } from './reactions';

describe('combine and split', () => {
	it('builds a proton regardless of order', () => {
		expect(combine(['d', 'u', 'u'])?.id).toBe('p');
		expect(combine(['u', 'd', 'u'])?.id).toBe('p');
	});

	it('rejects combinations with no bound state', () => {
		expect(combine(['u', 'u'])).toBeUndefined();
		expect(combine([])).toBeUndefined();
	});

	it('round-trips every composite', () => {
		for (const c of compositeParticles) {
			const parts = split(c.id);
			expect(parts).toEqual(c.constituents);
			expect(combine(parts!)?.id).toBe(c.id);
		}
	});

	it('cannot split elementary particles', () => {
		expect(split('e-')).toBeUndefined();
	});
});

describe('reactions', () => {
	it.each(reactions.map((r) => [r.id, r] as const))('%s conserves all quantum numbers', (_, r) => {
		for (const check of checkConservation(r.inputs, r.outputs)) {
			expect(check.conserved, check.label).toBe(true);
		}
	});

	it('flags a process that violates conservation', () => {
		const checks = checkConservation(['n'], ['p', 'e-']);
		expect(checks.find((c) => c.label === 'Electron number')?.conserved).toBe(false);
		expect(checks.find((c) => c.label === 'Electric charge')?.conserved).toBe(true);
	});

	it('looks up reactions by unordered inputs', () => {
		expect(findReaction(['e+', 'e-'])?.id).toBe('electron-positron-annihilation');
		expect(findReaction(['p'])).toBeUndefined();
	});
});
