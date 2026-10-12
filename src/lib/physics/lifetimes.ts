/**
 * Mean lifetimes in seconds. Anything not listed is stable (Infinity).
 * Antiparticles share their partner's lifetime.
 *
 * Quarks never exist freely, so each heavy quark uses the lifetime of the
 * lightest hadron carrying it (s: K⁺, c: D⁺, b: B⁺). The top quark decays
 * before it can form a hadron at all.
 */
const lifetimes: Record<string, number> = {
	s: 1.238e-8,
	c: 1.04e-12,
	b: 1.638e-12,
	t: 5e-25,
	'mu-': 2.197e-6,
	'tau-': 2.903e-13,
	Z: 2.64e-25,
	'W+': 3.16e-25,
	H: 1.56e-22,
	n: 878.4,
	'pi+': 2.603e-8,
	'pi-': 2.603e-8,
	pi0: 8.43e-17,
	'K+': 1.238e-8,
	Lambda: 2.632e-10
};

const partner: Record<string, string> = {
	'anti-s': 's',
	'anti-c': 'c',
	'anti-b': 'b',
	'anti-t': 't',
	'mu+': 'mu-',
	'tau+': 'tau-',
	'W-': 'W+'
};

export function lifetimeSeconds(id: string): number {
	return lifetimes[partner[id] ?? id] ?? Infinity;
}
