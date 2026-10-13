import { compositeParticles, getParticle, sumQuantumNumbers } from './particles';
import { reactions } from './reactions';
import type { CompositeParticle, QuantumNumbers, Reaction } from './types';

// Operations behind the Particle Lab: building, breaking and transforming particles.

const multisetKey = (ids: string[]) => [...ids].sort().join('|');

const compositeByConstituents = new Map(
	compositeParticles.map((c) => [multisetKey(c.constituents), c])
);

/** The bound state formed by exactly these particles (in any order), if there is one. */
export function combine(ids: string[]): CompositeParticle | undefined {
	return compositeByConstituents.get(multisetKey(ids));
}

/** The constituents of a composite particle, or undefined for an elementary one. */
export function split(id: string): string[] | undefined {
	const particle = getParticle(id);
	return particle.elementary ? undefined : [...particle.constituents];
}

/** A known reaction whose inputs are exactly these particles (in any order). */
export function findReaction(ids: string[]): Reaction | undefined {
	const key = multisetKey(ids);
	return reactions.find((r) => multisetKey(r.inputs) === key);
}

export interface ConservationCheck {
	label: string;
	before: number;
	after: number;
	/** Divisor for display, e.g. 3 for quantities stored in thirds. */
	scale: number;
	conserved: boolean;
}

/** Compare every conserved quantum number between two sides of a process. */
export function checkConservation(inputs: string[], outputs: string[]): ConservationCheck[] {
	const before = sumQuantumNumbers(inputs);
	const after = sumQuantumNumbers(outputs);
	const row = (label: string, key: keyof QuantumNumbers, scale = 1): ConservationCheck => ({
		label,
		before: before[key],
		after: after[key],
		scale,
		conserved: before[key] === after[key]
	});
	return [
		row('Electric charge', 'charge3', 3),
		row('Baryon number', 'baryon3', 3),
		row('Electron number', 'leptonE'),
		row('Muon number', 'leptonMu'),
		row('Tau number', 'leptonTau')
	];
}

/** Why these particles don't form a bound state, in words a player can act on. */
export function explainNoBoundState(ids: string[]): string {
	const q = sumQuantumNumbers(ids);
	if (q.baryon3 % 3 !== 0) {
		return 'Colour confinement: quarks only exist in colour-neutral groups — three quarks (a baryon) or a quark and an antiquark (a meson).';
	}
	if (ids.some((id) => getParticle(id).category === 'gauge-boson')) {
		return 'Force carriers are exchanged between particles; they are not building blocks of matter.';
	}
	return 'This combination is not one of the bound states in the lab yet. Try u+u+d, p+n or p+e⁻.';
}
