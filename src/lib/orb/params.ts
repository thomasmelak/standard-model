import { particleStats, type Particle } from '#lib/physics/index.ts';

/** Inputs to the orb shader, derived from a particle's physics. */
export interface OrbParams {
	/** Sphere radius in canvas units (the canvas spans −1..1): heavier particles are bigger. */
	radius: number;
	/** 0 for stable particles up to ~0.95 for the shortest-lived: drives swirl speed and chaos. */
	turbulence: number;
	/** 1 for antimatter, which the shader draws as the inverse of the matter orb. */
	anti: number;
	/** 0..1, stable per particle, so same-coloured orbs don't look identical. */
	seed: number;
}

/** FNV-1a hash of the id, mapped to 0..1. */
function seedOf(id: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < id.length; i++) {
		h ^= id.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return (h >>> 0) / 0x100000000;
}

export function orbParams(particle: Particle): OrbParams {
	const stats = particleStats(particle);
	const hp = stats.find((s) => s.key === 'hp')!.value;
	const power = stats.find((s) => s.key === 'power')!.value;
	return {
		radius: 0.42 + (power / 100) * 0.2,
		turbulence: 1 - hp / 100,
		anti:
			particle.baryon3 < 0 || particle.leptonE + particle.leptonMu + particle.leptonTau < 0 ? 1 : 0,
		seed: seedOf(particle.id)
	};
}

/** Parses a computed CSS colour ("rgb(63, 185, 80)") into 0..1 channels. */
export function parseRgb(css: string): [number, number, number] {
	const m = css.match(/\d+(\.\d+)?/g)?.map(Number) ?? [255, 255, 255];
	return [m[0] / 255, m[1] / 255, m[2] / 255];
}
