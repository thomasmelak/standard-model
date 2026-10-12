import type { ElementaryParticle, Force } from './types';

type Seed = Omit<
	ElementaryParticle,
	'elementary' | 'antiparticleId' | 'baryon3' | 'leptonE' | 'leptonMu' | 'leptonTau'
> &
	Partial<Pick<ElementaryParticle, 'baryon3' | 'leptonE' | 'leptonMu' | 'leptonTau'>> & {
		/** Id of the antiparticle; omitted means the particle is its own antiparticle. */
		anti?: { id: string; name: string; symbol: string };
	};

const QUARK_FORCES: Force[] = ['strong', 'electromagnetic', 'weak', 'higgs'];
const CHARGED_LEPTON_FORCES: Force[] = ['electromagnetic', 'weak', 'higgs'];
const NEUTRINO_FORCES: Force[] = ['weak'];

// Avoids -0, which would otherwise leak into equality checks.
const negate = (n: number) => 0 - n;

const bar = (s: string) => `${s}̄`;

const quark = (
	id: string,
	name: string,
	charge3: number,
	generation: 1 | 2 | 3,
	massMeV: number,
	description: string
): Seed => ({
	id,
	name,
	symbol: id,
	category: 'quark',
	charge3,
	baryon3: 1,
	massMeV,
	spin: 0.5,
	generation,
	forces: QUARK_FORCES,
	description,
	anti: { id: `anti-${id}`, name: `anti-${name}`, symbol: bar(id) }
});

const seeds: Seed[] = [
	quark(
		'u',
		'up quark',
		2,
		1,
		2.16,
		'The lightest quark. Two up quarks and a down quark make a proton.'
	),
	quark('d', 'down quark', -1, 1, 4.7, 'One up and two down quarks make a neutron.'),
	quark('c', 'charm quark', 2, 2, 1273, 'A heavier, unstable copy of the up quark.'),
	quark(
		's',
		'strange quark',
		-1,
		2,
		93.5,
		'A heavier copy of the down quark, found in kaons and hyperons.'
	),
	quark(
		't',
		'top quark',
		2,
		3,
		172570,
		'The heaviest known elementary particle. It decays before it can form hadrons.'
	),
	quark('b', 'bottom quark', -1, 3, 4183, 'A heavy copy of the down quark, found in B mesons.'),
	{
		id: 'e-',
		name: 'electron',
		symbol: 'e⁻',
		category: 'lepton',
		charge3: -3,
		leptonE: 1,
		massMeV: 0.511,
		spin: 0.5,
		generation: 1,
		forces: CHARGED_LEPTON_FORCES,
		description: 'The light, stable charged lepton that fills the orbitals of every atom.',
		anti: { id: 'e+', name: 'positron', symbol: 'e⁺' }
	},
	{
		id: 'mu-',
		name: 'muon',
		symbol: 'μ⁻',
		category: 'lepton',
		charge3: -3,
		leptonMu: 1,
		massMeV: 105.66,
		spin: 0.5,
		generation: 2,
		forces: CHARGED_LEPTON_FORCES,
		description: 'A heavy electron that lives about 2.2 μs before decaying.',
		anti: { id: 'mu+', name: 'antimuon', symbol: 'μ⁺' }
	},
	{
		id: 'tau-',
		name: 'tau',
		symbol: 'τ⁻',
		category: 'lepton',
		charge3: -3,
		leptonTau: 1,
		massMeV: 1776.9,
		spin: 0.5,
		generation: 3,
		forces: CHARGED_LEPTON_FORCES,
		description: 'The heaviest charged lepton; heavy enough to decay into hadrons.',
		anti: { id: 'tau+', name: 'antitau', symbol: 'τ⁺' }
	},
	{
		id: 'nu_e',
		name: 'electron neutrino',
		symbol: 'ν_e',
		category: 'lepton',
		charge3: 0,
		leptonE: 1,
		massMeV: 0,
		spin: 0.5,
		generation: 1,
		forces: NEUTRINO_FORCES,
		description: 'A nearly massless, neutral lepton that only feels the weak force.',
		anti: { id: 'anti-nu_e', name: 'electron antineutrino', symbol: bar('ν') + '_e' }
	},
	{
		id: 'nu_mu',
		name: 'muon neutrino',
		symbol: 'ν_μ',
		category: 'lepton',
		charge3: 0,
		leptonMu: 1,
		massMeV: 0,
		spin: 0.5,
		generation: 2,
		forces: NEUTRINO_FORCES,
		description: 'The neutrino partner of the muon.',
		anti: { id: 'anti-nu_mu', name: 'muon antineutrino', symbol: bar('ν') + '_μ' }
	},
	{
		id: 'nu_tau',
		name: 'tau neutrino',
		symbol: 'ν_τ',
		category: 'lepton',
		charge3: 0,
		leptonTau: 1,
		massMeV: 0,
		spin: 0.5,
		generation: 3,
		forces: NEUTRINO_FORCES,
		description: 'The neutrino partner of the tau.',
		anti: { id: 'anti-nu_tau', name: 'tau antineutrino', symbol: bar('ν') + '_τ' }
	},
	{
		id: 'g',
		name: 'gluon',
		symbol: 'g',
		category: 'gauge-boson',
		charge3: 0,
		massMeV: 0,
		spin: 1,
		forces: ['strong'],
		mediates: 'strong',
		description: 'Carries the strong force between quarks. Gluons carry colour charge themselves.'
	},
	{
		id: 'gamma',
		name: 'photon',
		symbol: 'γ',
		category: 'gauge-boson',
		charge3: 0,
		massMeV: 0,
		spin: 1,
		forces: [],
		mediates: 'electromagnetic',
		description: 'The massless carrier of the electromagnetic force: light.'
	},
	{
		id: 'Z',
		name: 'Z boson',
		symbol: 'Z⁰',
		category: 'gauge-boson',
		charge3: 0,
		massMeV: 91187.6,
		spin: 1,
		forces: ['weak', 'higgs'],
		mediates: 'weak',
		description: 'The neutral carrier of the weak force.'
	},
	{
		id: 'W+',
		name: 'W⁺ boson',
		symbol: 'W⁺',
		category: 'gauge-boson',
		charge3: 3,
		massMeV: 80369,
		spin: 1,
		forces: ['electromagnetic', 'weak', 'higgs'],
		mediates: 'weak',
		description:
			'A charged carrier of the weak force. W bosons change one quark flavour into another.',
		anti: { id: 'W-', name: 'W⁻ boson', symbol: 'W⁻' }
	},
	{
		id: 'H',
		name: 'Higgs boson',
		symbol: 'H',
		category: 'scalar-boson',
		charge3: 0,
		massMeV: 125200,
		spin: 0,
		forces: ['weak', 'higgs'],
		description: 'An excitation of the Higgs field, which gives the W, Z and fermions their mass.'
	}
];

function build(): ElementaryParticle[] {
	const out: ElementaryParticle[] = [];
	for (const { anti, ...seed } of seeds) {
		const particle: ElementaryParticle = {
			baryon3: 0,
			leptonE: 0,
			leptonMu: 0,
			leptonTau: 0,
			...seed,
			elementary: true,
			antiparticleId: anti?.id ?? seed.id
		};
		out.push(particle);
		if (anti) {
			out.push({
				...particle,
				...anti,
				charge3: negate(particle.charge3),
				baryon3: negate(particle.baryon3),
				leptonE: negate(particle.leptonE),
				leptonMu: negate(particle.leptonMu),
				leptonTau: negate(particle.leptonTau),
				antiparticleId: particle.id,
				description: `The antiparticle of the ${particle.name}: same mass, opposite charges.`
			});
		}
	}
	return out;
}

export const elementaryParticles: ElementaryParticle[] = build();

/** The classic 4×4 + Higgs table, laid out by column (generation) and row. */
export const standardModelTable: string[][] = [
	['u', 'c', 't', 'g', 'H'],
	['d', 's', 'b', 'gamma'],
	['e-', 'mu-', 'tau-', 'Z'],
	['nu_e', 'nu_mu', 'nu_tau', 'W+']
];
