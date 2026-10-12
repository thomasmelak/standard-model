import type { CompositeParticle, Force } from './types';

type Seed = Pick<
	CompositeParticle,
	'id' | 'name' | 'symbol' | 'category' | 'massMeV' | 'spin' | 'constituents' | 'description'
> & { boundBy?: Force };

/**
 * Bound states the lab knows how to build. Quantum numbers are not listed
 * here: they are summed from the constituents in `particles.ts`, which is
 * exactly the point the lab is meant to teach.
 */
export const compositeSeeds: Seed[] = [
	{
		id: 'p',
		name: 'proton',
		symbol: 'p',
		category: 'hadron',
		massMeV: 938.272,
		spin: 0.5,
		constituents: ['u', 'u', 'd'],
		description:
			'Two up quarks and a down quark held together by gluons. The quarks are only ~1% of its mass; the rest is the energy of the strong field.'
	},
	{
		id: 'n',
		name: 'neutron',
		symbol: 'n',
		category: 'hadron',
		massMeV: 939.565,
		spin: 0.5,
		constituents: ['u', 'd', 'd'],
		description:
			'One up and two down quarks. On its own it beta-decays into a proton in about 15 minutes.'
	},
	{
		id: 'pi+',
		name: 'positive pion',
		symbol: 'π⁺',
		category: 'hadron',
		massMeV: 139.57,
		spin: 0,
		constituents: ['u', 'anti-d'],
		description:
			'A meson: a quark bound to an antiquark. Pions carry the residual strong force between nucleons.'
	},
	{
		id: 'pi-',
		name: 'negative pion',
		symbol: 'π⁻',
		category: 'hadron',
		massMeV: 139.57,
		spin: 0,
		constituents: ['d', 'anti-u'],
		description: 'The antiparticle of the π⁺.'
	},
	{
		id: 'pi0',
		name: 'neutral pion',
		symbol: 'π⁰',
		category: 'hadron',
		massMeV: 134.98,
		spin: 0,
		constituents: ['u', 'anti-u'],
		description:
			'Really a quantum mixture of uū and dd̄. It decays electromagnetically into two photons.'
	},
	{
		id: 'K+',
		name: 'positive kaon',
		symbol: 'K⁺',
		category: 'hadron',
		massMeV: 493.677,
		spin: 0,
		constituents: ['u', 'anti-s'],
		description:
			'A meson containing a strange antiquark. Kaons were the first sign of "strangeness".'
	},
	{
		id: 'Lambda',
		name: 'lambda baryon',
		symbol: 'Λ⁰',
		category: 'hadron',
		massMeV: 1115.68,
		spin: 0.5,
		constituents: ['u', 'd', 's'],
		description: 'A baryon with a strange quark. It can only decay through the weak force.'
	},
	{
		id: 'D',
		name: 'deuteron',
		symbol: '²H⁺',
		category: 'nucleus',
		massMeV: 1875.613,
		spin: 1,
		constituents: ['p', 'n'],
		boundBy: 'strong',
		description: 'A proton and neutron held by the residual strong force. The nucleus of deuterium.'
	},
	{
		id: 'He3',
		name: 'helium-3 nucleus',
		symbol: '³He²⁺',
		category: 'nucleus',
		massMeV: 2808.391,
		spin: 0.5,
		constituents: ['p', 'p', 'n'],
		boundBy: 'strong',
		description: 'Two protons and a neutron. A rare, stable isotope of helium.'
	},
	{
		id: 'alpha',
		name: 'alpha particle',
		symbol: '⁴He²⁺',
		category: 'nucleus',
		massMeV: 3727.379,
		spin: 0,
		constituents: ['p', 'p', 'n', 'n'],
		boundBy: 'strong',
		description:
			'The helium-4 nucleus: an exceptionally tightly bound group of two protons and two neutrons.'
	},
	{
		id: 'H-atom',
		name: 'hydrogen atom',
		symbol: '¹H',
		category: 'atom',
		massMeV: 938.783,
		spin: 0,
		constituents: ['p', 'e-'],
		boundBy: 'electromagnetic',
		description:
			'One electron bound to a proton by the electromagnetic force, with 13.6 eV of binding energy.'
	},
	{
		id: 'D-atom',
		name: 'deuterium atom',
		symbol: '²H',
		category: 'atom',
		massMeV: 1876.124,
		spin: 1,
		constituents: ['D', 'e-'],
		boundBy: 'electromagnetic',
		description: '"Heavy hydrogen": an electron orbiting a deuteron.'
	},
	{
		id: 'He-atom',
		name: 'helium-4 atom',
		symbol: '⁴He',
		category: 'atom',
		massMeV: 3728.401,
		spin: 0,
		constituents: ['alpha', 'e-', 'e-'],
		boundBy: 'electromagnetic',
		description: 'Two electrons bound to an alpha particle. Chemically inert noble gas.'
	}
];
