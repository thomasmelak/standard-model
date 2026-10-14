import {
	getParticle,
	particleStats,
	particleTypes,
	type Force,
	type Particle
} from '#lib/physics/index.ts';
import { lifetimeSeconds } from '#lib/physics/lifetimes.ts';

// Battle rules: stats, moves, immunity, damage and decay, all derived from the
// physics behind the cards. See docs/BATTLES.md.

export type MoveId = Force | 'annihilate';

export interface Move {
	id: MoveId;
	name: string;
	/** Base damage; 0 for moves that don't hit. */
	base: number;
	summary: string;
}

export const MOVES: Record<MoveId, Move> = {
	strong: {
		id: 'strong',
		name: 'Gluon Strike',
		base: 28,
		summary: 'Colour against colour: full strength between quarks and gluons, half for each hadron or nucleus involved.'
	},
	electromagnetic: {
		id: 'electromagnetic',
		name: 'Photon Blast',
		base: 22,
		summary: "Hits electric charge, scaled by both particles' charges."
	},
	weak: {
		id: 'weak',
		name: 'W Exchange',
		base: 10,
		summary: "The only move that reaches neutrinos. Brings the target's decay one turn closer."
	},
	higgs: {
		id: 'higgs',
		name: 'Mass Surge',
		base: 0,
		summary: '+20 Power for 3 turns. Only particles with mass couple to the Higgs field.'
	},
	annihilate: {
		id: 'annihilate',
		name: 'Annihilate',
		base: 0,
		summary: 'Meet your own antiparticle: both vanish into pure energy.'
	}
};

export const SURGE_POWER = 20;
export const SURGE_TURNS = 3;

const stat = (p: Particle, key: string) => particleStats(p).find((s) => s.key === key)!.value;

/** Battle HP: 60–100, from the card's HP (stability). */
export function battleHp(id: string): number {
	return Math.round(60 + 0.4 * stat(getParticle(id), 'hp'));
}

export function power(id: string): number {
	return stat(getParticle(id), 'power');
}

export function speed(id: string): number {
	return stat(getParticle(id), 'speed');
}

/** Turns an unstable particle lasts while active, from its lifetime; null when stable. */
export function decayClock(id: string): number | null {
	const tau = lifetimeSeconds(id);
	if (tau === Infinity) return null;
	return Math.min(8, Math.max(1, Math.round((Math.log10(tau) + 26) / 3)));
}

/**
 * What an unstable particle becomes when its clock runs out: the main product
 * of its dominant decay. Charge is conserved by the products left out (the W,
 * neutrinos, a π⁻ …), which fly off.
 */
export const DECAYS: Record<string, string> = {
	// The CKM cascade: each heavy quark decays to the next lighter one.
	t: 'b', // t → b W⁺
	b: 'c', // b → c W⁻
	c: 's', // c → s W⁺
	s: 'u', // s → u W⁻
	'anti-t': 'anti-b',
	'anti-b': 'anti-c',
	'anti-c': 'anti-s',
	'anti-s': 'anti-u',
	'tau-': 'mu-', // τ⁻ → μ⁻ ν̄_μ ν_τ
	'tau+': 'mu+',
	'mu-': 'e-', // μ⁻ → e⁻ ν̄_e ν_μ
	'mu+': 'e+',
	Z: 'e-', // Z → e⁻ e⁺
	'W+': 'e+', // W⁺ → e⁺ ν_e
	'W-': 'e-', // W⁻ → e⁻ ν̄_e
	H: 'gamma', // H → γγ
	pi0: 'gamma', // π⁰ → γγ
	'pi+': 'mu+', // π⁺ → μ⁺ ν_μ
	'pi-': 'mu-', // π⁻ → μ⁻ ν̄_μ
	'K+': 'mu+', // K⁺ → μ⁺ ν_μ
	Lambda: 'p', // Λ → p π⁻
	n: 'p' // n → p e⁻ ν̄_e
};

/** How strongly a particle takes part in the strong force: colour 1, residual 0.5, none 0. */
export function colour(p: Particle): number {
	if (p.elementary) return p.category === 'quark' || p.id === 'g' ? 1 : 0;
	return p.category === 'atom' ? 0 : 0.5;
}

/** |charge| in units of e. */
const charge = (p: Particle) => Math.abs(p.charge3) / 3;

/** The moves a particle can use: one per force it takes part in, plus Annihilate when it applies. */
export function movesFor(id: string, opponentId?: string): MoveId[] {
	const p = getParticle(id);
	const moves = particleTypes(p).filter((force) => {
		if (force === 'strong') return colour(p) > 0;
		if (force === 'electromagnetic') return charge(p) > 0 || p.id === 'gamma';
		if (force === 'higgs') return p.massMeV > 0;
		return true;
	}) as MoveId[];
	if (opponentId && canAnnihilate(id, opponentId)) moves.push('annihilate');
	return moves;
}

/** True when the two are each other's antiparticle (and not the same self-conjugate particle). */
export function canAnnihilate(a: string, b: string): boolean {
	const p = getParticle(a);
	return a !== b && p.elementary && p.antiparticleId === b;
}

export interface Effect {
	/** Damage multiplier against this target; 0 means immune. */
	factor: number;
	/** Why the target is immune, when it is. */
	reason?: string;
}

/** How a damaging move affects a target, with the physics reason for any immunity. */
export function effect(move: MoveId, attackerId: string, targetId: string): Effect {
	const a = getParticle(attackerId);
	const t = getParticle(targetId);
	const name = t.name.charAt(0).toUpperCase() + t.name.slice(1);
	switch (move) {
		case 'strong': {
			// Colour against colour is the full strong force; a hadron or nucleus on either side
			// only takes part through the weaker residual (nuclear) force.
			const factor = colour(a) * colour(t);
			return factor
				? { factor }
				: {
						factor: 0,
						reason:
							t.category === 'atom'
								? `${name} is colour-neutral, and its nucleus is too deep inside for the strong force to reach.`
								: `${name} has no colour charge: the strong force can't touch it.`
					};
		}
		case 'electromagnetic': {
			// The photon couples to charge, so it hits charged particles and charged particles hit
			// it back (Compton scattering). Two photons pass through each other.
			const factor =
				t.id === 'gamma'
					? charge(a)
					: (a.id === 'gamma' ? 1 : charge(a)) * charge(t);
			if (factor) return { factor };
			return {
				factor: 0,
				reason:
					t.id === 'gamma'
						? 'Photons pass straight through each other: light carries no charge.'
						: `${name} has no electric charge.`
			};
		}
		case 'weak':
			return particleTypes(t).includes('weak')
				? { factor: 1 }
				: { factor: 0, reason: `${name} doesn't feel the weak force.` };
		default:
			return { factor: 0 };
	}
}

/** How much a particle's Power (mass) multiplies its damage. */
export const powerFactor = (p: number) => POWER_MIN + p * POWER_SLOPE;
export let POWER_MIN = 0.6;
export let POWER_SLOPE = 0.01;
export function tune(min: number, slope: number) {
	POWER_MIN = min;
	POWER_SLOPE = slope;
}

/** Damage before the random spread. */
export function baseDamage(move: MoveId, attackerId: string, targetId: string, surge = 0): number {
	const { factor } = effect(move, attackerId, targetId);
	if (!factor) return 0;
	return MOVES[move].base * powerFactor(power(attackerId) + surge) * factor;
}
