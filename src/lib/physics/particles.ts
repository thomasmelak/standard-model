import { compositeSeeds } from './composites';
import { elementaryParticles } from './elementary';
import type { CompositeParticle, Particle, QuantumNumbers } from './types';

const registry = new Map<string, Particle>();
for (const p of elementaryParticles) registry.set(p.id, p);

export function getParticle(id: string): Particle {
	const particle = registry.get(id);
	if (!particle) throw new Error(`Unknown particle: ${id}`);
	return particle;
}

const ZERO: QuantumNumbers = { charge3: 0, baryon3: 0, leptonE: 0, leptonMu: 0, leptonTau: 0 };

/** Sum the additive quantum numbers of a collection of particles. */
export function sumQuantumNumbers(ids: string[]): QuantumNumbers {
	return ids.map(getParticle).reduce(
		(acc, p) => ({
			charge3: acc.charge3 + p.charge3,
			baryon3: acc.baryon3 + p.baryon3,
			leptonE: acc.leptonE + p.leptonE,
			leptonMu: acc.leptonMu + p.leptonMu,
			leptonTau: acc.leptonTau + p.leptonTau
		}),
		ZERO
	);
}

// Composites are registered in order so each one can sum its constituents' numbers.
export const compositeParticles: CompositeParticle[] = compositeSeeds.map((seed) => {
	const composite: CompositeParticle = {
		boundBy: 'strong',
		...seed,
		...sumQuantumNumbers(seed.constituents),
		elementary: false
	};
	registry.set(composite.id, composite);
	return composite;
});

export const allParticles: Particle[] = [...registry.values()];

/**
 * Energy released when the constituents bind, in MeV (positive means the
 * composite is lighter than its parts). For hadrons this is negative: almost
 * all of a proton's mass is field energy, not quark rest mass.
 */
export function bindingEnergyMeV(composite: CompositeParticle): number {
	const parts = composite.constituents.reduce((sum, id) => sum + getParticle(id).massMeV, 0);
	return parts - composite.massMeV;
}

/** Format a value stored in units of 1/scale as a signed fraction, e.g. "+2/3". */
export function formatFraction(value: number, scale = 1): string {
	if (value === 0) return '0';
	const sign = value > 0 ? '+' : '−';
	const abs = Math.abs(value);
	if (abs % scale === 0) return `${sign}${abs / scale}`;
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const g = gcd(abs, scale);
	return `${sign}${abs / g}/${scale / g}`;
}

export function formatMass(massMeV: number): string {
	if (massMeV === 0) return '0';
	if (massMeV >= 1000)
		return `${(massMeV / 1000).toLocaleString('en', { maximumFractionDigits: 2 })} GeV/c²`;
	if (massMeV < 1)
		return `${(massMeV * 1000).toLocaleString('en', { maximumFractionDigits: 0 })} keV/c²`;
	return `${massMeV.toLocaleString('en', { maximumFractionDigits: 2 })} MeV/c²`;
}

export function formatSpin(spin: number): string {
	return Number.isInteger(spin) ? String(spin) : `${spin * 2}/2`;
}
