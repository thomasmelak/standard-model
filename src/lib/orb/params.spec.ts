import { describe, expect, it } from 'vitest';
import { getParticle } from '#lib/physics/index.ts';
import { orbParams, parseRgb } from './params';

describe('orbParams', () => {
	it('makes heavier particles bigger and unstable ones more turbulent', () => {
		const e = orbParams(getParticle('e-'));
		const t = orbParams(getParticle('t'));
		expect(t.radius).toBeGreaterThan(e.radius);
		expect(t.turbulence).toBeGreaterThan(e.turbulence);
		expect(e.turbulence).toBe(0);
	});

	it('flags antimatter', () => {
		expect(orbParams(getParticle('e+')).anti).toBe(1);
		expect(orbParams(getParticle('anti-u')).anti).toBe(1);
		expect(orbParams(getParticle('e-')).anti).toBe(0);
	});

	it('gives each particle a stable, distinct seed in 0..1', () => {
		const a = orbParams(getParticle('u')).seed;
		expect(orbParams(getParticle('u')).seed).toBe(a);
		expect(orbParams(getParticle('c')).seed).not.toBe(a);
		expect(a).toBeGreaterThanOrEqual(0);
		expect(a).toBeLessThan(1);
	});
});

describe('parseRgb', () => {
	it('reads computed colours', () => {
		expect(parseRgb('rgb(255, 0, 51)')).toEqual([1, 0, 0.2]);
	});
});
