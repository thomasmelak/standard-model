import { describe, expect, it } from 'vitest';
import { getParticle } from './particles';
import {
	dexNumber,
	particleEvolution,
	particleInteractions,
	particleMoves,
	particleStats,
	particleTypes
} from './stats';

const stat = (id: string, key: string) =>
	particleStats(getParticle(id)).find((s) => s.key === key)!.value;

describe('stats', () => {
	it('gives stable particles full HP and short-lived ones little', () => {
		expect(stat('e-', 'hp')).toBe(100);
		expect(stat('p', 'hp')).toBe(100);
		expect(stat('n', 'hp')).toBeGreaterThan(stat('mu-', 'hp'));
		expect(stat('mu-', 'hp')).toBeGreaterThan(stat('t', 'hp'));
	});

	it('ranks power by mass and speed inversely', () => {
		expect(stat('t', 'power')).toBeGreaterThan(stat('p', 'power'));
		expect(stat('p', 'power')).toBeGreaterThan(stat('e-', 'power'));
		expect(stat('gamma', 'speed')).toBe(100);
		expect(stat('e-', 'speed')).toBeGreaterThan(stat('t', 'speed'));
	});

	it('keeps every stat within 0–100', () => {
		for (const id of ['u', 't', 'nu_e', 'gamma', 'H', 'alpha', 'He-atom']) {
			for (const s of particleStats(getParticle(id))) {
				expect(s.value).toBeGreaterThanOrEqual(0);
				expect(s.value).toBeLessThanOrEqual(100);
			}
		}
	});

	it('describes fractional charge as a fraction', () => {
		const charge = particleStats(getParticle('u')).find((s) => s.key === 'charge')!;
		expect(charge.meaning).toBe('Electric charge: 2/3 e (absolute)');
	});

	it('shares stats between a particle and its antiparticle', () => {
		expect(particleStats(getParticle('mu+'))).toEqual(particleStats(getParticle('mu-')));
	});
});

describe('types', () => {
	it('lists the forces a particle feels or carries', () => {
		expect(particleTypes(getParticle('nu_e'))).toEqual(['weak']);
		expect(particleTypes(getParticle('gamma'))).toEqual(['electromagnetic']);
		expect(particleTypes(getParticle('u'))).toEqual(['strong', 'electromagnetic', 'weak', 'higgs']);
	});

	it('gives composites the types of their quarks and leptons', () => {
		expect(particleTypes(getParticle('H-atom'))).toContain('strong');
	});
});

describe('interactions', () => {
	const partners = (id: string, force: string) =>
		particleInteractions(getParticle(id)).find((i) => i.force === force)?.partners ?? [];

	it('lets the photon act on charged particles only', () => {
		const p = partners('gamma', 'electromagnetic');
		expect(p).toContain('e-');
		expect(p).toContain('u');
		expect(p).not.toContain('nu_e');
	});

	it('limits neutrinos to the weak force', () => {
		const forces = particleInteractions(getParticle('nu_mu')).map((i) => i.force);
		expect(forces).toEqual(['weak']);
	});

	it('lets gluons act on quarks and other gluons, not leptons', () => {
		const p = partners('g', 'strong');
		expect(p).toContain('t');
		expect(p).not.toContain('e-');
	});
});

describe('moves and evolution', () => {
	it('lists reactions the particle starts', () => {
		expect(particleMoves(getParticle('n')).map((r) => r.id)).toContain('neutron-beta-decay');
	});

	it('links constituents and composites', () => {
		expect(particleEvolution(getParticle('u')).into.map((c) => c.id)).toContain('p');
		expect(particleEvolution(getParticle('p')).from).toEqual(['u', 'u', 'd']);
	});

	it('numbers cards from #001', () => {
		expect(dexNumber(getParticle('u'))).toBe('#001');
	});
});
