import { describe, expect, it } from 'vitest';
import { standardModelTable } from './elementary';
import {
	allParticles,
	bindingEnergyMeV,
	compositeParticles,
	formatFraction,
	getParticle
} from './particles';

const composite = (id: string) => compositeParticles.find((c) => c.id === id)!;

describe('particle data', () => {
	it('has unique ids', () => {
		const ids = allParticles.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('pairs every elementary particle with an antiparticle of opposite charge', () => {
		for (const p of allParticles) {
			if (!p.elementary) continue;
			const anti = getParticle(p.antiparticleId);
			expect(anti.charge3 + p.charge3).toBe(0);
			expect(anti.massMeV).toBe(p.massMeV);
		}
	});

	it('lays out all 17 Standard Model particles in the table', () => {
		const ids = standardModelTable.flat();
		expect(ids).toHaveLength(17);
		for (const id of ids) expect(getParticle(id).elementary).toBe(true);
	});

	it('derives composite quantum numbers from constituents', () => {
		expect(getParticle('p')).toMatchObject({ charge3: 3, baryon3: 3 });
		expect(getParticle('n')).toMatchObject({ charge3: 0, baryon3: 3 });
		expect(getParticle('pi+')).toMatchObject({ charge3: 3, baryon3: 0 });
		expect(getParticle('alpha')).toMatchObject({ charge3: 6, baryon3: 12 });
		expect(getParticle('H-atom')).toMatchObject({ charge3: 0, leptonE: 1 });
		expect(getParticle('He-atom')).toMatchObject({ charge3: 0, leptonE: 2 });
	});

	it('gives every composite whole-number charge (no free fractional charge)', () => {
		for (const c of compositeParticles) expect(Math.abs(c.charge3 % 3)).toBe(0);
	});

	it('finds nuclear binding energy but negative "binding" for hadrons', () => {
		expect(bindingEnergyMeV(composite('alpha'))).toBeCloseTo(28.3, 0);
		expect(bindingEnergyMeV(composite('p'))).toBeLessThan(-900);
	});
});

describe('formatFraction', () => {
	it('formats charges', () => {
		expect(formatFraction(2, 3)).toBe('+2/3');
		expect(formatFraction(-1, 3)).toBe('−1/3');
		expect(formatFraction(-3, 3)).toBe('−1');
		expect(formatFraction(0, 3)).toBe('0');
	});
});
