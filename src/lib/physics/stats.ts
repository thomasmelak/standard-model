import { standardModelTable } from './elementary';
import { lifetimeSeconds } from './lifetimes';
import { allParticles, compositeParticles, formatFraction, getParticle } from './particles';
import { reactions } from './reactions';
import type { CompositeParticle, ElementaryParticle, Force, Particle, Reaction } from './types';

// Collectible-card view of a particle: game-style stats, types and moves, all
// derived from the real physics so that every number on a card means something.

export interface Stat {
	key: 'hp' | 'power' | 'speed' | 'charge' | 'reach';
	label: string;
	/** 0–100, for the bar. */
	value: number;
	/** The physical quantity behind the number. */
	meaning: string;
}

const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

/** Every force a particle takes part in: the ones it feels plus the one it carries. */
export function particleTypes(particle: Particle): Force[] {
	const forces = new Set<Force>();
	const add = (p: ElementaryParticle) => {
		p.forces.forEach((f) => forces.add(f));
		if (p.mediates) forces.add(p.mediates);
	};
	if (particle.elementary) add(particle);
	else
		for (const id of elementaryConstituents(particle)) add(getParticle(id) as ElementaryParticle);
	const order: Force[] = ['strong', 'electromagnetic', 'weak', 'higgs'];
	return order.filter((f) => forces.has(f));
}

/** Constituents all the way down to elementary particles (a deuteron → u u d u d d). */
export function elementaryConstituents(particle: CompositeParticle): string[] {
	return particle.constituents.flatMap((id) => {
		const p = getParticle(id);
		return p.elementary ? [id] : elementaryConstituents(p);
	});
}

function formatLifetime(seconds: number): string {
	if (seconds === Infinity) return 'stable';
	return `lives ${seconds.toExponential(1).replace('e', ' × 10^')} s`;
}

export function particleStats(particle: Particle): Stat[] {
	const lifetime = lifetimeSeconds(particle.id);
	// log10 lifetime runs from about −25 (top, W, Z) to +3 (free neutron).
	const hp = lifetime === Infinity ? 100 : clamp(5 + (Math.log10(lifetime) + 25) * 3);
	// log10 mass in MeV runs from about −0.3 (electron) to 5.2 (top quark).
	const power =
		particle.massMeV === 0 ? 0 : clamp(((Math.log10(particle.massMeV) + 1) / 6.3) * 100);
	// Massless particles always move at the speed of light; heavy ones are slow.
	const speed = particle.massMeV === 0 ? 100 : clamp(Math.max(5, 100 - power));
	const charge = clamp((Math.abs(particle.charge3) / 3) * 50);
	const reach = particleTypes(particle).length * 25;

	return [
		{ key: 'hp', label: 'HP', value: hp, meaning: `Stability: ${formatLifetime(lifetime)}` },
		{
			key: 'power',
			label: 'Power',
			value: power,
			meaning: particle.massMeV === 0 ? 'Mass: none' : `Mass: ${particle.massMeV} MeV/c²`
		},
		{
			key: 'speed',
			label: 'Speed',
			value: speed,
			meaning:
				particle.massMeV === 0 ? 'Always moves at light speed' : 'Lighter particles move faster'
		},
		{
			key: 'charge',
			label: 'Charge',
			value: charge,
			meaning: `Electric charge: ${formatFraction(Math.abs(particle.charge3), 3).replace('+', '')} e (absolute)`
		},
		{
			key: 'reach',
			label: 'Reach',
			value: reach,
			meaning: `Takes part in ${reach / 25} of the 4 interactions`
		}
	];
}

/** One way two particles can interact, through one force. */
export interface Interaction {
	force: Force;
	/** The bosons exchanged or absorbed. */
	carriers: string[];
	/** Particles on the other side of the interaction. */
	partners: string[];
}

const CARRIERS: Record<Force, string[]> = {
	strong: ['g'],
	electromagnetic: ['gamma'],
	weak: ['W+', 'Z'],
	higgs: ['H']
};

/** Interaction partners are listed from the 17 Standard Model particles; antiparticles behave alike. */
const cast = standardModelTable.flat().map((id) => getParticle(id) as ElementaryParticle);

/**
 * Who a particle can interact with, force by force. A particle interacts
 * through a force if it feels it (it couples to the force's boson) or carries
 * it (it acts on everything that feels it).
 */
export function particleInteractions(particle: Particle): Interaction[] {
	const types = particle.elementary
		? particle.forces
		: particleTypes(particle).filter((f) => f !== 'higgs' || particle.massMeV > 0);
	const carried = particle.elementary ? particle.mediates : undefined;
	const result: Interaction[] = [];
	for (const force of ['strong', 'electromagnetic', 'weak', 'higgs'] as Force[]) {
		const feels = types.includes(force);
		const carries = carried === force || CARRIERS[force].includes(particle.id);
		if (!feels && !carries) continue;
		const partners = cast
			.filter((p) => p.id !== particle.id && (p.forces.includes(force) || p.mediates === force))
			.filter((p) => feels || p.forces.includes(force))
			.map((p) => p.id);
		result.push({ force, carriers: CARRIERS[force], partners });
	}
	return result;
}

/** Decays and annihilations the particle can start. */
export function particleMoves(particle: Particle): Reaction[] {
	return reactions.filter((r) => r.inputs.includes(particle.id));
}

export interface Evolution {
	/** What this particle is made of, if composite. */
	from?: string[];
	/** Composites that contain this particle directly. */
	into: CompositeParticle[];
}

export function particleEvolution(particle: Particle): Evolution {
	return {
		from: particle.elementary ? undefined : particle.constituents,
		into: compositeParticles.filter((c) => c.constituents.includes(particle.id))
	};
}

/** Card number: position in the full particle list, like a collector's index. */
export function dexNumber(particle: Particle): string {
	return `#${String(allParticles.indexOf(particle) + 1).padStart(3, '0')}`;
}
